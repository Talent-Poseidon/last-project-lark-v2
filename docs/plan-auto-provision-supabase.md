# Plan: Auto-Provision Supabase Database per Project

## Problem

Semua project yang dibuat dari base-template-monster menggunakan **GitHub Organization Secrets** yang sama (`DATABASE_URL`, `DIRECT_URL`). Akibatnya semua project share 1 database yang sama, padahal setiap project punya konteks berbeda dan seharusnya punya database terpisah.

Setting repo-level secrets secara manual tidak memungkinkan karena proses pembuatan project baru **fully automated** (clone template, push, dll dilakukan oleh sistem tanpa intervensi human).

## Solution: Auto-Provision di CI Pipeline

CI pipeline otomatis membuat Supabase project baru untuk setiap repository yang belum punya database sendiri, lalu menyimpan connection string sebagai **repo-level GitHub Secrets**.

### Alur

```
Project baru di-push ke GitHub
  → CI job "provision-db" jalan
  → Cek: apakah repo sudah punya secret DATABASE_URL di level repo?
    → Sudah ada → skip, lanjut ke deploy
    → Belum ada →
        1. Buat Supabase project baru via Management API
        2. Tunggu project ACTIVE
        3. Ambil connection strings (pooler + direct)
        4. Simpan sebagai repo-level secrets via GitHub API
        5. Lanjut ke deploy (pakai DB baru)
```

### Arsitektur Secrets

#### Organization-level secrets (shared, set 1x):

| Secret | Fungsi | Cara mendapatkan |
|--------|--------|------------------|
| `VERCEL_TOKEN` | Vercel API token | Sudah ada |
| `VERCEL_ORG_ID` | Vercel team ID | Sudah ada |
| `SUPABASE_ACCESS_TOKEN` | **Baru** — Supabase Management API | Supabase Dashboard → Account → Access Tokens |
| `SUPABASE_ORG_ID` | **Baru** — Supabase organization ID | Supabase Dashboard → Org Settings → General |
| `SUPABASE_DB_PASS` | **Baru** — Default password untuk DB baru | Buat password kuat, simpan di org secrets |
| `GH_PAT` | **Baru** — GitHub PAT dengan scope `repo` | GitHub → Settings → Developer settings → PAT → scope: `repo` |

#### Repo-level secrets (auto-generated per project):

| Secret | Fungsi | Format |
|--------|--------|--------|
| `DATABASE_URL` | Pooler URL (untuk runtime) | `postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | Direct URL (untuk migrations) | `postgresql://postgres.[ref]:[pass]@db.[ref].supabase.co:5432/postgres` |

### Prerequisite: Supabase Pro Plan

> **PENTING:** Supabase free tier hanya mengizinkan **2 active projects**.
> Plan ini membutuhkan **Supabase Pro plan** atau **Team plan** agar bisa membuat project unlimited.
> Implementasi ini ditunda sampai upgrade ke paid plan.

---

## Implementasi CI

### Job baru: `provision-db` (ditambahkan di `ci.yml`)

Letakkan **sebelum** job `deploy`, dan jadikan dependency deploy.

```yaml
# ── Job: Auto-Provision Supabase Database ────────────────────────────────────
# Membuat Supabase project + set repo secrets otomatis untuk project baru.
# Hanya jalan di push ke main/staging, dan hanya jika belum ada DB.
provision-db:
  name: Provision Database
  runs-on: ubuntu-latest
  needs: e2e-test
  if: github.event_name == 'push' && (github.ref == 'refs/heads/main' || github.ref == 'refs/heads/staging')
  outputs:
    database_url: ${{ steps.provision.outputs.database_url }}
    direct_url: ${{ steps.provision.outputs.direct_url }}
    skipped: ${{ steps.check.outputs.skipped }}

  steps:
    - name: Check if DATABASE_URL repo secret exists
      id: check
      env:
        GH_TOKEN: ${{ secrets.GH_PAT }}
      run: |
        # Cek apakah secret DATABASE_URL sudah ada di level repo
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
          -H "Authorization: Bearer ${GH_TOKEN}" \
          "https://api.github.com/repos/${{ github.repository }}/actions/secrets/DATABASE_URL")

        if [[ "$HTTP_STATUS" == "200" ]]; then
          echo "✅ DATABASE_URL sudah ada di repo secrets. Skip provisioning."
          echo "skipped=true" >> $GITHUB_OUTPUT
        else
          echo "🆕 DATABASE_URL belum ada. Akan provision Supabase project baru."
          echo "skipped=false" >> $GITHUB_OUTPUT
        fi

    - name: Create Supabase project
      if: steps.check.outputs.skipped == 'false'
      id: provision
      env:
        SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
        SUPABASE_ORG_ID: ${{ secrets.SUPABASE_ORG_ID }}
        SUPABASE_DB_PASS: ${{ secrets.SUPABASE_DB_PASS }}
        GH_TOKEN: ${{ secrets.GH_PAT }}
        REPO: ${{ github.repository }}
      run: |
        REPO_NAME="${REPO##*/}"
        PROJECT_NAME="db-${REPO_NAME}"
        REGION="ap-southeast-1"  # Sesuaikan dengan region terdekat

        echo "Creating Supabase project: ${PROJECT_NAME}"

        # 1. Buat project via Supabase Management API
        CREATE_RESPONSE=$(curl -s -X POST \
          "https://api.supabase.com/v1/projects" \
          -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
          -H "Content-Type: application/json" \
          -d "$(jq -n \
            --arg name "$PROJECT_NAME" \
            --arg org_id "$SUPABASE_ORG_ID" \
            --arg db_pass "$SUPABASE_DB_PASS" \
            --arg region "$REGION" \
            '{
              name: $name,
              organization_id: $org_id,
              db_pass: $db_pass,
              region: $region,
              plan: "free"
            }')")

        PROJECT_REF=$(echo "$CREATE_RESPONSE" | jq -r '.id // empty')
        if [[ -z "$PROJECT_REF" ]]; then
          echo "❌ Gagal membuat Supabase project:"
          echo "$CREATE_RESPONSE" | jq .
          exit 1
        fi
        echo "✅ Project created: ${PROJECT_REF}"

        # 2. Tunggu project ACTIVE (max 2 menit)
        echo "Waiting for project to be active..."
        for i in $(seq 1 24); do
          STATUS=$(curl -s \
            "https://api.supabase.com/v1/projects/${PROJECT_REF}" \
            -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
            | jq -r '.status')
          echo "  Status: ${STATUS} (attempt ${i}/24)"
          if [[ "$STATUS" == "ACTIVE_HEALTHY" ]]; then
            break
          fi
          sleep 5
        done

        if [[ "$STATUS" != "ACTIVE_HEALTHY" ]]; then
          echo "⚠️ Project belum ACTIVE setelah 2 menit. Status: ${STATUS}"
          echo "Lanjutkan, mungkin masih provisioning..."
        fi

        # 3. Construct connection strings
        DB_HOST="db.${PROJECT_REF}.supabase.co"
        POOLER_HOST="aws-0-${REGION}.pooler.supabase.com"
        DB_USER="postgres.${PROJECT_REF}"

        DATABASE_URL="postgresql://${DB_USER}:${SUPABASE_DB_PASS}@${POOLER_HOST}:6543/postgres?pgbouncer=true"
        DIRECT_URL="postgresql://postgres:${SUPABASE_DB_PASS}@${DB_HOST}:5432/postgres"

        echo "database_url=${DATABASE_URL}" >> $GITHUB_OUTPUT
        echo "direct_url=${DIRECT_URL}" >> $GITHUB_OUTPUT

        # 4. Simpan sebagai repo-level GitHub Secrets
        # GitHub API membutuhkan encryption menggunakan repo public key

        # Get repo public key
        PUB_KEY_RESPONSE=$(curl -s \
          -H "Authorization: Bearer ${GH_TOKEN}" \
          "https://api.github.com/repos/${REPO}/actions/secrets/public-key")

        KEY_ID=$(echo "$PUB_KEY_RESPONSE" | jq -r '.key_id')
        PUB_KEY=$(echo "$PUB_KEY_RESPONSE" | jq -r '.key')

        # Encrypt and set secrets using Python (libsodium)
        pip install pynacl -q

        python3 << PYEOF
        import json, base64
        from nacl import encoding, public

        def encrypt_secret(public_key: str, secret_value: str) -> str:
            pk = public.PublicKey(public_key.encode("utf-8"), encoding.Base64Encoder())
            sealed_box = public.SealedBox(pk)
            encrypted = sealed_box.encrypt(secret_value.encode("utf-8"))
            return base64.b64encode(encrypted).decode("utf-8")

        pub_key = "${PUB_KEY}"
        key_id = "${KEY_ID}"
        repo = "${REPO}"
        token = "${GH_TOKEN}"

        secrets_to_set = {
            "DATABASE_URL": "${DATABASE_URL}",
            "DIRECT_URL": "${DIRECT_URL}",
        }

        import urllib.request
        for name, value in secrets_to_set.items():
            encrypted = encrypt_secret(pub_key, value)
            data = json.dumps({"encrypted_value": encrypted, "key_id": key_id}).encode()
            req = urllib.request.Request(
                f"https://api.github.com/repos/{repo}/actions/secrets/{name}",
                data=data,
                method="PUT",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
            )
            resp = urllib.request.urlopen(req)
            print(f"  ✅ Secret '{name}' set (HTTP {resp.status})")
        PYEOF

        echo "✅ Repo secrets DATABASE_URL dan DIRECT_URL berhasil di-set."
```

### Update job `deploy`

Ubah dependency dan tambahkan fallback:

```yaml
deploy:
  name: Deploy to Vercel
  runs-on: ubuntu-latest
  needs: [e2e-test, provision-db]
  if: github.event_name == 'push' && (github.ref == 'refs/heads/main' || github.ref == 'refs/heads/staging')
```

Untuk env vars di step "Upsert environment variables" dan "Run Prisma Migrations", tidak perlu diubah karena `secrets.DATABASE_URL` dan `secrets.DIRECT_URL` akan otomatis membaca repo-level secret (yang di-prioritaskan di atas org-level secret oleh GitHub).

---

## Yang Perlu Disiapkan

### 1. Upgrade Supabase ke Pro Plan
- Buka https://supabase.com/dashboard → Organization → Billing
- Upgrade ke Pro plan ($25/bulan per org) untuk menghilangkan limit 2 project

### 2. Buat Supabase Access Token
- Buka https://supabase.com/dashboard → Account (klik avatar) → Access Tokens
- Generate token baru, simpan sebagai org secret `SUPABASE_ACCESS_TOKEN`

### 3. Dapatkan Supabase Organization ID
- Buka https://supabase.com/dashboard → Organization Settings → General
- Copy Organization ID, simpan sebagai org secret `SUPABASE_ORG_ID`

### 4. Buat Default Database Password
- Generate password kuat (min 16 chars, huruf+angka+simbol)
- Simpan sebagai org secret `SUPABASE_DB_PASS`
- Password ini akan dipakai untuk SEMUA database baru yang dibuat otomatis

### 5. Buat GitHub Personal Access Token
- Buka https://github.com/settings/tokens → Generate new token (classic)
- Scope: centang `repo` (full control of private repositories)
- Simpan sebagai org secret `GH_PAT`

### 6. Update `ci.yml`
- Tambahkan job `provision-db` seperti di atas
- Update dependency job `deploy` menjadi `needs: [e2e-test, provision-db]`

---

## Catatan Penting

- **GitHub Secret priority:** Repo-level secrets otomatis override org-level secrets dengan nama yang sama. Jadi setelah `provision-db` set `DATABASE_URL` di level repo, job `deploy` akan pakai URL yang spesifik untuk repo itu.
- **Idempotent:** Job `provision-db` cek dulu apakah secret sudah ada. Kalau sudah, skip. Jadi aman dijalankan berulang kali.
- **Region:** Default `ap-southeast-1` (Singapore). Sesuaikan jika user base di region lain.
- **`plan: "free"` di API call:** Ubah ke `"pro"` jika ingin setiap project langsung Pro. Atau biarkan `"free"` jika org sudah Pro (project inherit org plan).
- **Cleanup:** Jika project/repo dihapus, Supabase project-nya TIDAK otomatis terhapus. Perlu script terpisah atau manual cleanup.
