# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Prisma Migration Workflow

- Agent HANYA mengedit `prisma/schema.prisma` — JANGAN generate migration file manual
- CI (`generate-migration` job) otomatis detect drift dan generate migration file
- CI commit migration file dengan `[skip ci]` untuk mencegah infinite loop
- Production deploy menggunakan `prisma migrate deploy` (bukan `db push`)
- Jika CI mendeteksi operasi destructive (DROP/RENAME), pipeline akan fail dan butuh manual review

### FORBIDDEN — JANGAN jalankan:
- `prisma migrate dev` — bisa corrupt database
- `prisma migrate reset` — menghapus semua data
- `prisma db push` — hanya untuk hotfix darurat, bukan workflow normal

### Safe commands:
- `prisma generate` — regenerate Prisma Client setelah schema berubah
- `prisma migrate deploy` — apply pending migrations (idempotent, aman)
- `npx tsc --noEmit` — type check tanpa build

## Database Configuration

- **DATABASE_URL**: Pooled connection (Supabase pooler) — WAJIB include `?pgbouncer=true`
- **DIRECT_URL**: Direct connection (non-pooled) — dipakai Prisma CLI untuk migration
- Tanpa `?pgbouncer=true`, Prisma prepared statements conflict dengan PgBouncer transaction mode

## Authentication

- NextAuth v5 with PrismaAdapter
- Supports Google OAuth + Credentials (email/password)
- JWT strategy with role-based access (admin/user)
- Approval system: `is_approved` field on User model
- Login page MUST be `export const dynamic = "force-dynamic"` to prevent CDN caching issues

## Key Files

- `lib/prisma.ts` — PrismaClient singleton with pgbouncer auto-detection
- `auth.ts` — NextAuth configuration with PrismaAdapter
- `proxy.ts` — Middleware for auth gate and approval redirect
- `.github/workflows/ci.yml` — CI/CD pipeline (build, migration, E2E, deploy)
- `app/api/health/route.ts` — Health check endpoint (validates all tables exist)
