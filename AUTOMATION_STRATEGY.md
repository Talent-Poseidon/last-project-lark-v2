# Automation Strategy: Multi-Project Provisioning

Dokumen ini menjelaskan konsep dan mekanisme bagaimana "Project Utama" (Orchestrator) dapat membuat dan mengonfigurasi instance baru dari template ini secara otomatis menggunakan Supabase Access Token.

## Konsep Dasar

Tujuan: Membuat banyak aplikasi (instance) yang terisolasi database-nya, tanpa konfigurasi manual yang berulang.

- **Orchestrator:** Script/Aplikasi pusat yang memegang kendali.
- **Template:** Repository ini (Next.js App).
- **Supabase Management API:** API khusus dari Supabase untuk membuat/mengelola project (bukan data).

## Alur Kerja (Workflow)

Berikut adalah diagram alur bagaimana provisioning otomatis bekerja:

```mermaid
sequenceDiagram
    participant Admin as Orchestrator (Anda)
    participant SB as Supabase API
    participant NewApp as New App Instance

    Note over Admin, SB: 1. Project Creation
    Admin->>SB: POST /v1/projects (Create Project "Toko A")
    Note right of Admin: Menggunakan Personal Access Token
    SB-->>Admin: Return Project ID, DB Password (generated)

    Note over Admin, SB: 2. Waiting & Configuration
    loop Check Status
        Admin->>SB: GET /v1/projects/{ref}/api
        SB-->>Admin: Status: "COMING_UP" -> "ACTIVE_HEALTHY"
    end
    SB-->>Admin: Return API URL, Anon Key, Service Role Key

    Note over Admin, NewApp: 3. Deployment
    Admin->>NewApp: Clone Template
    Admin->>NewApp: Inject .env (URL, Keys from Step 2)

    Note over Admin, SB: 4. Database Schema Init
    Admin->>SB: POST /v1/query (Run database/schema.sql)
    Note right of Admin: Menggunakan SQL Query endpoint / Postgres Connection
    SB-->>Admin: Tables & Triggers Created

    Note over Admin, NewApp: 5. Admin Setup
    Admin->>NewApp: Run `npm run setup:admin`
    NewApp->>SB: Create User & Promote to Admin
    NewApp-->>Admin: Admin Account Ready
```

## Detail Teknis

### 1. Supabase Access Token
Ini adalah "Master Key". Token ini tidak boleh ada di dalam template ini, tapi disimpan aman di environment Orchestrator.
- **Scope:** Bisa membuat, menghapus, dan memodifikasi semua project di organisasi Anda.
- **Cara Dapat:** Supabase Dashboard > Account > Access Tokens.

### 2. Management API
Orchestrator akan menggunakan endpoint Supabase Management API (`https://api.supabase.com/v1`) untuk:
- `POST /v1/projects`: Membuat project baru.
- `GET /v1/projects/{ref}/api`: Mengambil API Key (Anon & Service Role) setelah project aktif.

### 3. Schema Injection
Ada dua cara Orchestrator menerapkan `schema.sql` ke project baru:
1.  **Via SQL API:** Menggunakan endpoint `/v1/query` (jika tersedia/beta) untuk menjalankan raw SQL.
2.  **Via Direct Postgres:** Menggunakan connection string postgres (`postgres://postgres:password@db...`) yang didapat saat kreasi project untuk menjalankan file SQL menggunakan library seperti `pg` atau tool CLI.

### 4. Handover ke Template
Setelah DB siap, Orchestrator cukup:
1.  Generate file `.env.local` di folder project baru berisi credential yang baru didapat.
2.  Menjalankan script `setup-admin.ts` (yang sudah ada di template ini) untuk membuat user admin pertama.

## Kesimpulan
Dengan strategi ini, proses setup untuk klien baru bisa dipangkas dari 15-30 menit (manual) menjadi < 2 menit (script), dengan jaminan konfigurasi yang konsisten dan bebas human-error.
