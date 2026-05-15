# Bug Report: base-template-monster — testing-lark-login

**Tanggal**: 2026-05-07
**Reporter**: User (manual QA)
**Project Workspace**: `testing-lark-login` (`b4942d62-7557-4932-8c0d-a3ef15d7c155`)
**Template**: `base-template-monster` (https://github.com/Talent-Poseidon/base-template-monster)
**Kesimpulan**: Ketiga bug adalah **bawaan template**, bukan hasil perubahan epic.

---

## Bug 1: Tidak Ada Loader Saat Klik Submit Login

### Laporan User

Ketika klik tombol "Sign in" (email maupun Google), tidak ada loading indicator. User tidak tahu apakah form sudah disubmit atau belum.

### Root Cause

**File**: `components/auth/login-form.tsx` (identik 100% dengan template)

Form menggunakan `<form action={handleEmailLogin}>` (line 49) dan `<form action={handleGoogleLogin}>` (line 93). Di React 19, function yang di-pass ke prop `action` secara otomatis dibungkus dalam `startTransition`. Akibatnya, `setLoading(true)` di dalam handler (line 15, 25) **tidak menyebabkan re-render langsung** — state update di-defer sampai transition selesai. Karena server action melakukan redirect (tidak pernah return normal), transition tidak pernah "selesai", sehingga `loading=true` tidak pernah terlihat di UI.

**File pendukung**: `lib/auth/actions.ts` (identik 100% dengan template)

- `signInWithEmail()` (line 8-26): memanggil `signIn("credentials", { redirectTo: "/dashboard" })` yang throw `NEXT_REDIRECT` saat sukses — tidak pernah return value.
- `signInWithGoogle()` (line 61-63): memanggil `signIn("google", { redirectTo: "/dashboard" })` — langsung redirect ke OAuth, tidak pernah return.

**Konfirmasi**: Project tidak menggunakan `useFormStatus()` atau `useActionState()` di manapun (verified via grep). Kedua API ini adalah cara yang benar untuk menampilkan loading state pada React 19 form actions.

### Fix Yang Dibutuhkan

Ganti pattern `useState` + `setLoading` dengan `useFormStatus()` dari `react-dom` untuk mendapatkan `pending` state yang reactive terhadap form action lifecycle. Contoh pendekatan:

```tsx
// Buat komponen SubmitButton terpisah (useFormStatus harus di child dari <form>)
import { useFormStatus } from "react-dom";

function SubmitButton({ children, ...props }) {
  const { pending } = useFormStatus();
  return <Button type="submit" loading={pending} {...props}>{children}</Button>;
}
```

### Sumber Bug

**TEMPLATE** — `login-form.tsx` identik byte-per-byte. Epic tidak menyentuh file ini.

### Status: FIXED

**File diubah**: `components/auth/login-form.tsx`

**Perubahan yang dilakukan**:
- Menghapus `useState(false)` untuk `loading` — state ini tidak pernah terlihat di UI karena `startTransition` deferral
- Membuat komponen `EmailSubmitButton` dan `GoogleSubmitButton` yang menggunakan `useFormStatus()` dari `react-dom`
- `useFormStatus()` hooks ke mekanisme internal React form submission — mendeteksi `pending` secara benar terlepas dari `startTransition`
- Setiap submit button hanya melacak pending state form-nya sendiri (lebih baik dari UX sebelumnya yang shared)

**Validasi**: Build berhasil (`pnpm build` — compiled successfully).

---

## Bug 2: Dashboard Blank Putih Setelah Login (Harus Reload)

### Laporan User

Setelah login, dashboard pertama kali menampilkan layar putih kosong. Harus reload browser manual agar konten dashboard muncul.

**Tambahan dari investigasi**: Navigasi ke halaman Profile (`/dashboard/profile`) dan Admin (`/admin`) dari dashboard juga mengalami gejala serupa — konten tidak berubah atau kembali ke dashboard. Ini adalah **manifestasi langsung** dari Bug 2 yang sama (tanpa `loading.tsx` dan `error.tsx`, konten lama tetap terlihat selama server rendering berlangsung).

### Root Cause

Kombinasi beberapa masalah arsitektural, semuanya bawaan template:

#### 2a. Auth gate layer — `proxy.ts` sudah ada

~~Template tidak menyediakan `middleware.ts`.~~ **Koreksi**: Template menyediakan `proxy.ts` (pengganti `middleware.ts` di Next.js 16, berjalan di Node.js runtime) yang sudah mengimplementasikan auth gate dengan benar — dekripsi JWT manual menggunakan `jose`, proteksi route dashboard/admin, redirect user unapproved ke pending approval. Layer ini **sudah berfungsi**.

#### 2b. JWT callback query DB di setiap `auth()` call

**File**: `auth.ts:60-68` (identik 100% dengan template)

```typescript
if (token.sub) {
     const dbUser = await prisma.user.findUnique({
         where: { id: token.sub },
         select: { is_approved: true, role: true }
     });
}
```

Setiap kali `auth()` dipanggil (di layout, di page, dll), jwt callback ini berjalan dan melakukan query DB. Ini menambah latency signifikan pada setiap request.

#### 2c. 4 query DB sequential per page load

| # | File | Line | Operasi |
|---|------|------|---------|
| 1 | `auth.ts` | 61 | `prisma.user.findUnique()` via jwt callback (dari `auth()` di layout) |
| 2 | `app/dashboard/layout.tsx` | 19 | `prisma.user.findUnique({ where: { email } })` |
| 3 | `auth.ts` | 61 | `prisma.user.findUnique()` via jwt callback (dari `auth()` di page) |
| 4 | `app/dashboard/page.tsx` | 11 | `prisma.user.findUnique({ where: { email }, include: { accounts: true } })` |

4 query DB sequential tanpa caching. Pada navigasi pertama setelah login (cold Prisma connection), ini lambat. Ditambah tanpa Suspense boundary, browser menampilkan halaman kosong.

#### 2d. Tidak ada `loading.tsx` dan `error.tsx`

Template tidak menyediakan `loading.tsx` maupun `error.tsx` di route manapun. Artinya:
- Tidak ada Suspense fallback saat async server component rendering berlangsung
- Tidak ada error boundary untuk menangkap error rendering
- Pada navigasi client-side (klik link), konten lama tetap terlihat karena tidak ada loading state — user mengira "balik ke halaman sebelumnya"

**Kenapa reload memperbaikinya**: Setelah reload, Prisma connection sudah warm, query lebih cepat, dan browser melakukan full server-side render (HTML dikirim lengkap).

### Fix Yang Dibutuhkan

1. ~~**Buat `middleware.ts`**~~ → **Sudah ada `proxy.ts`** yang menjalankan fungsi auth gate di Node.js runtime (Next.js 16)
2. **Buat `app/dashboard/loading.tsx` dan `app/admin/loading.tsx`** — Suspense fallback agar user melihat skeleton saat rendering
3. **Buat `app/dashboard/error.tsx` dan `app/admin/error.tsx`** — Error boundary agar error tertangkap dan ditampilkan, bukan silent fail
4. **Hapus redundant DB query** — gunakan `session.user` data dari `auth()` dimana memungkinkan
5. **Pertimbangkan `React.cache(auth)`** — untuk deduplikasi panggilan `auth()` dalam satu request (layout + page)

### Sumber Bug

**TEMPLATE** — Semua file terkait (`auth.ts`, `dashboard/layout.tsx`, `dashboard/page.tsx`, `dashboard-shell.tsx`) identik 100% dengan template. Tidak ada `loading.tsx`, `error.tsx` di template maupun workspace. Epic tidak mengubah satupun file ini.

### Status: FIXED

**File dibuat**:
- `app/dashboard/loading.tsx` — Skeleton loading state yang match dengan layout dashboard (stats grid + account details)
- `app/admin/loading.tsx` — Skeleton loading state yang match dengan layout admin (user table)
- `app/dashboard/error.tsx` — Error boundary dengan tombol "Try again"
- `app/admin/error.tsx` — Error boundary dengan tombol "Try again"

**File diubah**:
- `app/admin/page.tsx` — Menghapus redundant `prisma.user.findUnique()` untuk role check. Sekarang menggunakan `session.user.role` dari `auth()` (sudah diverifikasi oleh layout + proxy). Mengurangi 1 DB query per admin page load. `currentUserId` menggunakan `session.user.id`.

**Catatan**: `middleware.ts` TIDAK dibuat karena project sudah menggunakan `proxy.ts` (Next.js 16 pattern) yang menjalankan fungsi identical. Membuat `middleware.ts` menyebabkan build error `"Both middleware and proxy detected"`.

**Validasi**: Build berhasil (`pnpm build` — compiled successfully). Route `/admin` dan `/dashboard` terdeteksi sebagai dynamic routes dengan proxy middleware aktif.

---

## Bug 3: Error `prepared statement "s21" does not exist` di Vercel (Staging)

### Laporan User

Setelah deploy ke staging (Vercel), user tidak bisa mengakses dashboard. Di log Vercel muncul:
```
PrismaClientUnknownRequestError: Invalid prisma.user.findUnique() invocation
prepared statement "s21" does not exist
```

### Root Cause

#### 3a. `DATABASE_URL` tanpa `?pgbouncer=true` (PENYEBAB UTAMA)

**Koreksi prioritas**: Root cause **utama** dari error runtime adalah `DATABASE_URL` yang mengarah ke connection pooler (PgBouncer transaction mode) **tanpa** parameter `?pgbouncer=true`. Prisma menggunakan prepared statements secara default. Connection pooler dalam transaction mode **tidak mempertahankan prepared statement cache** antar koneksi — sehingga muncul error.

**PENTING**: `DIRECT_URL` yang tidak di-set **bukan** penyebab error runtime ini. `directUrl` di Prisma schema hanya digunakan oleh CLI operations (`prisma migrate`, `prisma db push`), bukan oleh runtime queries. Runtime queries selalu menggunakan `url` (`DATABASE_URL`).

#### 3b. `DIRECT_URL` tidak di-set di environment staging (penting untuk CLI, bukan runtime)

**File**: `prisma/schema.prisma:10-11` (bawaan template)

```prisma
datasource db {
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")     // Digunakan oleh Prisma CLI (migrate, push)
}
```

`.env.example` template sudah mendefinisikan `DIRECT_URL`, tapi workspace-manager ai-monster tidak meng-generate variabel ini ke `.env` workspace. Ini menyebabkan masalah saat menjalankan `prisma migrate` di staging, tapi **bukan penyebab error runtime**.

#### 3c. PrismaClient singleton hanya di development

**File**: `lib/prisma.ts:7` (identik 100% dengan template)

```typescript
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

Di production (Vercel), PrismaClient **tidak di-cache secara global**. Setiap serverless function cold start membuat PrismaClient baru dengan set prepared statement sendiri, memperburuk konflik dengan connection pooler. Ini bukan root cause, tapi **memperparah** frekuensi error.

#### Alur Error

1. User akses `/dashboard` → `auth()` → jwt callback → `prisma.user.findUnique()` (`auth.ts:61`)
2. Query dikirim melalui pooled connection (`DATABASE_URL` tanpa `?pgbouncer=true`)
3. Prisma membuat prepared statement "s21"
4. Pooler mendaur ulang koneksi ke koneksi lain yang tidak punya "s21"
5. **Error**: `prepared statement "s21" does not exist`
6. Tanpa error boundary → halaman gagal render

### Fix Yang Dibutuhkan

1. **Tambah `?pgbouncer=true` pada `DATABASE_URL`** di staging/Vercel — ini adalah **fix utama** yang langsung mematikan error. Parameter ini menyuruh Prisma tidak menggunakan prepared statements melalui pooled connection
2. **Set `DIRECT_URL`** di environment staging/Vercel dengan koneksi langsung (non-pooled) — penting untuk `prisma migrate` dan CLI operations
3. **Fix workspace-manager** di ai-monster agar generate `DIRECT_URL` di `.env` workspace
4. **Cache PrismaClient di production** — mengurangi cold start dan frekuensi error (pelengkap, bukan fix utama)

### Sumber Bug

**TEMPLATE + AI-MONSTER** — `prisma/schema.prisma` (directUrl) dan `lib/prisma.ts` (singleton pattern) adalah bawaan template. Tapi `.env` yang tidak lengkap (tanpa `DIRECT_URL`) dihasilkan oleh workspace-manager ai-monster.

### Status: PARTIALLY FIXED (code-level), REQUIRES ENV CONFIG (deployment-level)

**File diubah**:
- `lib/prisma.ts` — PrismaClient sekarang **di-cache secara global di semua environment** (termasuk production). Menghapus kondisi `process.env.NODE_ENV !== "production"`. Ini mengurangi jumlah PrismaClient instances dan cold starts di serverless.
- `.env.example` — Menambahkan dokumentasi lengkap tentang konfigurasi `?pgbouncer=true` untuk deployment dengan connection pooler, serta penjelasan peran `DATABASE_URL` (pooled) vs `DIRECT_URL` (direct).

**Aksi yang masih diperlukan (deployment)**:
- Set `DATABASE_URL` di Vercel dengan `?pgbouncer=true` pada connection string pooled
- Set `DIRECT_URL` di Vercel dengan connection string langsung (non-pooled)
- Fix workspace-manager ai-monster agar generate `DIRECT_URL` di `.env`

**Validasi**: Build berhasil (`pnpm build` — compiled successfully).

---

## Perbandingan Diff: Template vs Workspace

### File Identik (tidak diubah epic)

- ~~`components/auth/login-form.tsx`~~ — **FIXED** (Bug 1: useFormStatus)
- `lib/auth/actions.ts` — identik 100%
- `auth.ts` — identik 100%
- ~~`lib/prisma.ts`~~ — **FIXED** (Bug 3: global cache)
- `app/dashboard/layout.tsx` — identik 100%
- ~~`app/dashboard/page.tsx`~~ — identik 100% (tidak diubah, optimasi dilakukan di admin saja)
- `components/dashboard/dashboard-shell.tsx` — identik 100%
- `app/layout.tsx` — identik 100%
- `next.config.mjs` — identik 100%
- ~~`.env.example`~~ — **UPDATED** (Bug 3: dokumentasi pgbouncer)

### File Diubah Epic

- `auth.config.ts` — menambah `isOnProjectManagement` route protection (2 baris, tidak terkait bug)
- `prisma/schema.prisma` — menambah model domain (Kamus, Standar, Scenario, Project, Invitation, AssessorAssignment). Baris `directUrl` tidak diubah.

### File Ditambah Epic

- `app/project-management/layout.tsx`
- `app/project-management/assign/page.tsx`
- `app/project-management/create/page.tsx`
- `app/project-management/invitations/page.tsx`
- `tests/e2e/master-data-setup.spec.ts`
- `tests/e2e/project-management.spec.ts`

### File Ditambah Bug Fix

- `app/dashboard/loading.tsx` — **NEW** (Bug 2: Suspense fallback)
- `app/dashboard/error.tsx` — **NEW** (Bug 2: Error boundary)
- `app/admin/loading.tsx` — **NEW** (Bug 2: Suspense fallback)
- `app/admin/error.tsx` — **NEW** (Bug 2: Error boundary)

### File Tidak Ada (di kedua sisi)

- ~~`middleware.ts`~~ — **Tidak diperlukan**: `proxy.ts` (Next.js 16 pattern) sudah ada dan menjalankan fungsi auth gate

---

## Ringkasan

| Bug | Sumber | Confidence | Status |
|-----|--------|------------|--------|
| 1. No loader login | **Template** | 100% (diff identik) | **FIXED** — `useFormStatus()` di `login-form.tsx` |
| 2. Blank dashboard + navigasi stuck | **Template** | 100% (diff identik, file tidak ada di kedua sisi) | **FIXED** — `loading.tsx`, `error.tsx`, optimasi query admin |
| 3. Prepared statement error | **Template + ai-monster workspace-manager** | 100% (schema bawaan template, .env dihasilkan workspace-manager) | **PARTIAL** — PrismaClient global cache + docs. Perlu config `?pgbouncer=true` di env staging |

### Koreksi dari Analisis Awal

| Topik | Analisis Awal | Koreksi |
|-------|---------------|---------|
| Bug 2: middleware.ts | "Buat `middleware.ts`" | Project sudah punya `proxy.ts` (Next.js 16 replacement). Tidak perlu `middleware.ts`. |
| Bug 3: Prioritas fix | `DIRECT_URL` sebagai fix #1 | `?pgbouncer=true` pada `DATABASE_URL` adalah **fix utama**. `DIRECT_URL` penting untuk CLI tapi **tidak menyelesaikan error runtime**. |
| Bug 4: Navigasi stuck | Tidak dilaporkan | Bukan bug baru — manifestasi langsung Bug 2 (tanpa `loading.tsx`, konten lama terlihat selama rendering). |
