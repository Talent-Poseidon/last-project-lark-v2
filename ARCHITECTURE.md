# Architecture Documentation

## Overview

This project is a modern full-stack web application built with **Next.js 16**, **NextAuth.js (v5)** for authentication, **Prisma ORM** for database management, and a hybrid UI system using **Shadcn UI** and **Mantine**.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Authentication:** NextAuth.js v5 (Beta)
- **Database:** PostgreSQL (via Prisma ORM)
- **Language:** TypeScript
- **Styling:** Tailwind CSS, Shadcn UI (Radix Primitives), Mantine Core v7
- **Package Manager:** PNPM (recommended)

## Folder Structure

```
├── .github/              # CI/CD workflows
├── app/                  # Next.js App Router directory
│   ├── (public)/         # Public routes
│   ├── admin/            # Admin dashboard (protected, role-based)
│   ├── api/              # API Routes
│   │   └── auth/         # NextAuth endpoints
│   ├── auth/             # Auth pages (login, signup, error)
│   ├── dashboard/        # User dashboard (protected)
│   ├── globals.css       # Global styles (Tailwind directives)
│   ├── layout.tsx        # Root layout (Providers: Theme, Auth, Toast)
│   └── page.tsx          # Landing page
├── components/           # React components
│   ├── admin/            # Admin-specific components
│   ├── auth/             # Auth forms
│   ├── dashboard/        # Dashboard components
│   ├── icons/            # Icon components
│   ├── providers/        # Context providers (Mantine, Theme)
│   └── ui/               # Shadcn UI reusable components (Button, Input, etc.)
├── database/             # Legacy SQL scripts (Supabase) - Reference only
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
│   ├── auth/             # Auth actions & configuration
│   ├── prisma.ts         # Prisma client singleton
│   └── utils.ts          # CN utility for Tailwind
├── prisma/               # Database schema & migrations
│   ├── migrations/       # SQL migration history
│   └── schema.prisma     # Data model definition
├── public/               # Static assets
└── scripts/              # Utility scripts (e.g., admin setup)
```

## Data Flow & Architecture

### 1. Authentication (NextAuth v5)
- **Configuration:** Defined in `auth.ts` and `auth.config.ts`.
- **Strategies:**
  - **Credentials:** Email/Password login (hashed with bcryptjs).
  - **OAuth:** Google (configured, extensible to others).
- **Session:** Stateless JWT sessions managed by NextAuth.
- **Middleware:** `middleware.ts` protects routes (`/dashboard`, `/admin`) and handles redirects based on auth status.

### 2. Database (Prisma + PostgreSQL)
- **ORM:** Prisma acts as the bridge between the application and the PostgreSQL database.
- **Schema:** Defined in `prisma/schema.prisma`.
  - **User:** Stores profile info, password hash, role (`user` | `admin`), and approval status.
  - **Account/Session:** Support tables for NextAuth.
- **Client:** A singleton instance is exported from `lib/prisma.ts` to prevent connection exhaustion in serverless environments.

### 3. Authorization & Security
- **Role-Based Access Control (RBAC):**
  - Users have a `role` field ("user" or "admin").
  - `admin` routes are protected in `middleware.ts` or via server-side checks.
- **Approval System:**
  - Users have an `is_approved` boolean field.
  - Unapproved users are redirected to a "Pending Approval" page even if authenticated.

### 4. Styling System
- **Tailwind CSS:** Primary utility-first CSS framework.
- **Shadcn UI:** Provides accessible, unstyled components (based on Radix UI) customized via Tailwind. Located in `components/ui`.
- **Mantine:** Used for specific complex components or legacy support.
- **Theming:** `components/providers/theme-provider.tsx` handles dark/light mode.

## Navigation Structure

### Main Navigation (Top Bar)
- **File**: `components/dashboard/dashboard-shell.tsx`
- **Komponen**: `DashboardShell` — shell layout untuk semua halaman post-login
- **navItems array** (line 32-35): Mendefinisikan link navigasi utama
  ```typescript
  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/profile", label: "Profile", icon: UserCircle },
  ];
  ```
- **Admin link** (line 72-84): Ditampilkan conditional hanya jika `profile.role === "admin"`, mengarah ke `/admin`
- **User menu dropdown** (line 88-142): Profile link + Admin Panel (conditional) + Sign out

### Cara Menambah Navigasi Baru

**Untuk fitur user biasa** (terlihat semua role):
- Tambah entry baru ke `navItems` array di `dashboard-shell.tsx`
- Format: `{ href: "/route-baru", label: "Label Menu", icon: NamaIcon }`
- Icon menggunakan `lucide-react`

**Untuk fitur admin-only**:
- Tambah conditional link setelah block `{profile.role === "admin" && (...)}` yang sudah ada (line 72-84)
- Atau tambah di dalam admin page sebagai sub-navigation

**Untuk sub-navigation di dalam fitur**:
- Buat layout file di route directory (misal `app/feature/layout.tsx`) dengan nav links internal

## Key Workflows

### Admin Setup
A script is provided to bootstrap the first admin user since registration defaults to `role: "user"` and `is_approved: false`.
- **Script:** `scripts/setup-admin.ts`
- **Execution:** `npm run setup:admin` (creates user via Prisma directly).
