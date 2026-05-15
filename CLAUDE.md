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


--- AI MONSTER CONTEXT ---

# Project Context (Auto-generated)

## Architecture

Project: last-project-lark-v2

!!! HIGH PRIORITY CONTEXT !!!
The following architecture documentation was found in the project root. Follow these guidelines strictly.

--- BEGIN ARCHITECTURE.md ---
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

--- END ARCHITECTURE.md ---


--- SUPPLEMENTARY AUTO-SCAN INFO ---

## [AUTO-DETECTED] Tech Stack (Dependencies)
- Next.js: 16.1.6
- React: 19.2.3
- Tailwind CSS: ^3.4.17
- Prisma: 5.22.0
- Lucide Icons: ^0.544.0
- shadcn/ui: Detected
- Database: Prisma ORM used. Schema at prisma/schema.prisma


## Coding Patterns

# Coding Patterns Reference (for AI Coder Agent)

> **Tanggal Dibuat:** 4 Maret 2026

> This document contains EXACT code patterns the coder agent MUST follow.
> These are copy-paste-ready — do NOT deviate from these patterns.

## 1. Form Pattern (react-hook-form + Shadcn/UI)

```tsx
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
})

export function MyForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "" },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const res = await fetch("/api/endpoint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    if (!res.ok) throw new Error("Failed")
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input data-testid="name-input" placeholder="Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" data-testid="submit-btn">Submit</Button>
      </form>
    </Form>
  )
}
```

### CRITICAL Form Rules:
- `<Form {...form}>` is a **FormProvider wrapper**, NOT a `<form>` element
- The actual `<form>` element goes INSIDE `<Form>` with `onSubmit={form.handleSubmit(onSubmit)}`
- NEVER write `<Form onSubmit={...}>` — this causes TS2322 type error
- `render` callback type is auto-inferred — do NOT manually type `({ field }: { field: ControllerRenderProps })` unless TypeScript complains
- `<FormMessage />` renders validation errors as `<p>` — do NOT add `data-testid` to FormMessage unless the UI Spec explicitly defines an error element

## 2. State Initialization (TypeScript Strict)

```tsx
// CORRECT — explicit type parameter
const [items, setItems] = useState<ProjectType[]>([])
const [profile, setProfile] = useState<Profile | null>(null)
const [loading, setLoading] = useState<boolean>(true)

// WRONG — TypeScript infers wrong types
const [items, setItems] = useState([])     // infers never[] → can't push items
const [profile, setProfile] = useState({}) // infers {} → missing all properties
```

### Type Definition Pattern:
```tsx
// Define interface matching your API response
interface Project {
  id: string
  name: string
  status: string
  createdAt: string
}

// Then use it
const [projects, setProjects] = useState<Project[]>([])
```

## 3. Data Fetching Pattern (Page Component)

```tsx
"use client"

import { useEffect, useState } from "react"

interface Item {
  id: string
  name: string
}

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/items")
      .then((res) => res.json())
      .then((data: Item[]) => setItems(data))
      .catch((err: Error) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div data-testid="items-container">
      {loading ? (
        <p data-testid="items-loading">Loading...</p>
      ) : items.length > 0 ? (
        <ul data-testid="items-list">
          {items.map((item: Item) => (
            <li key={item.id} data-testid={`item-${item.id}`}>{item.name}</li>
          ))}
        </ul>
      ) : (
        <p data-testid="items-empty">No items found</p>
      )}
    </div>
  )
}
```

## 4. API Route Pattern (Next.js App Router)

```tsx
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET handler
export async function GET() {
  const items = await prisma.modelName.findMany()
  return NextResponse.json(items)
}

// POST handler
export async function POST(request: NextRequest) {
  const body = await request.json()
  const item = await prisma.modelName.create({ data: body })
  return NextResponse.json(item, { status: 201 })
}
```

### Prisma Rule:
- ONLY use models listed in the PRISMA MODELS section of your prompt
- If a model does NOT exist (e.g., `prisma.project` when there is no `Project` model), do NOT use it
- Instead, return mock data with a TODO comment:
```tsx
export async function GET() {
  // TODO: Replace with actual Prisma query when Project model is added to schema
  const mockProjects = [
    { id: "1", name: "Project Alpha", status: "active" },
  ]
  return NextResponse.json(mockProjects)
}
```

## 5. Playwright E2E Test Pattern

```tsx
import { test, expect } from "@playwright/test"

test.describe("Feature Name", () => {
  test("should display items", async ({ page }) => {
    await page.goto("/items")

    // Wait for content
    await expect(page.getByTestId("items-container")).toBeVisible()

    // Check list
    const list = page.getByTestId("items-list")
    await expect(list).toBeVisible()
  })

  test("should submit form", async ({ page }) => {
    await page.goto("/items")

    // Fill form using getByTestId
    await page.getByTestId("name-input").fill("Test Item")

    // Get input value — CORRECT way
    const value = await page.getByTestId("name-input").inputValue()
    expect(value).toBe("Test Item")

    // Submit
    await page.getByTestId("submit-btn").click()

    // Assert result
    await expect(page.getByTestId("success-alert")).toBeVisible()
  })
})
```

### Playwright Rules:
- Get input value: `await locator.inputValue()` — NEVER use `.value` property (Element has no .value)
- Selectors priority: `getByTestId()` > `getByRole()` > `getByText()` — NEVER use CSS class selectors
- ONLY use `data-testid` values that exist in the UI Spec
- Do NOT invent testIds for error messages unless the UI Spec explicitly lists them

## 6. Error TestId Convention

- ONLY add `data-testid` to elements that are **explicitly listed in the UI Spec**
- `<FormMessage />` from Shadcn does NOT need `data-testid` unless the UI Spec has an error element entry
- If the UI Spec has NO error-related elements, do NOT create error testIds like `error-name` or `error-email`
- If you need to test error states, use `getByText("error message text")` instead of testId

## 7. Map/Filter Callback Types

```tsx
// CORRECT
items.map((item: Project) => <div key={item.id}>{item.name}</div>)
items.filter((item: Project) => item.status === "active")

// WRONG — implicit any in strict mode
items.map((item) => <div key={item.id}>{item.name}</div>)
```


## Style Guide

# Style Guide & Component Reference

> **Tanggal Dibuat:** 4 Maret 2026

This document serves as the **Single Source of Truth** for UI implementation. The Coder Agent MUST follow these patterns to ensure consistency across the application.

## 1. Core Principles
- **Framework:** Next.js App Router (React Server Components by default).
- **Styling:** Tailwind CSS.
- **Icons:** Lucide React (`import { IconName } from 'lucide-react'`).
- **Components:** Shadcn UI (located in `@/components/ui/`).

## 2. Component Usage Rules
**NEVER** use raw HTML elements when a Shadcn component exists.

| Element | DO NOT USE | USE THIS INSTEAD | Import Path |
| :--- | :--- | :--- | :--- |
| Button | `<button>` | `<Button>` | `@/components/ui/button` |
| Input | `<input>` | `<Input>` | `@/components/ui/input` |
| Card | `<div>` (for containers) | `<Card>`, `<CardHeader>`, `<CardContent>` | `@/components/ui/card` |
| Select | `<select>` | `<Select>`, `<SelectContent>`, `<SelectItem>` | `@/components/ui/select` |
| Badge | `<span>` (for status) | `<Badge>` | `@/components/ui/badge` |
| Dialog/Modal | Custom Modal | `<Dialog>`, `<DialogContent>` | `@/components/ui/dialog` |
| Toast | `alert()` | `toast()` | `sonner` (or `@/components/ui/use-toast`) |

## 3. Layout Patterns

### Page Layout (Admin)
Pages should generally follow this structure:
```tsx
import { PageContainer } from "@/components/layout/page-container"; // Hypothetical or use standard div
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function Page() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <Heading title="Dashboard" description="Overview of your store" />
        <Button>Download</Button>
      </div>
      <Separator />
      {/* Content */}
    </div>
  );
}
```

### Form Pattern (React Hook Form + Zod)
Always use `react-hook-form` with `zod` for validation.
```tsx
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const formSchema = z.object({
  username: z.string().min(2),
})

export function ProfileForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="shadcn" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

## 4. Data Fetching & Server Actions
- Use **Server Actions** for mutations (POST/PUT/DELETE).
- Use **Server Components** for initial data fetching where possible.
- Use `useEffect` only when client-side interactivity requires dynamic fetching that cannot be done on server.

## 5. File Structure
- `src/app/`: Routes
- `src/components/ui/`: Primitive components (Shadcn)
- `src/components/[feature]/`: Feature-specific components
- `src/lib/`: Utilities, database, schema


## E2E Testing Playbook

# E2E Testing Playbook

> **Tanggal Dibuat:** 4 Maret 2026

This document is the single source of truth for creating Playwright E2E tests in this project.
When creating or modifying any test, follow every applicable rule in order.

Stack: Next.js 16, NextAuth v5 (beta.30), Prisma, Playwright, pnpm

---

## SECTION 1: EXECUTION ORDER

When creating a new test case, execute these steps in this exact order.
Do NOT skip steps. Each step has a verification check.

```
STEP 1 → Determine auth context        (Section 3)
STEP 2 → Prepare seed data             (Section 4)
STEP 3 → Prepare Prisma model          (Section 5)  — only if new table needed
STEP 4 → Prepare API route             (Section 6)  — only if page fetches new endpoint
STEP 5 → Prepare page with data-testid (Section 7)
STEP 6 → Write test spec file          (Section 8)
STEP 7 → Register in playwright config (Section 9)
STEP 8 → Verify                        (Section 10)
```

---

## SECTION 2: PROJECT STRUCTURE

These paths are fixed. Do not change them.

```
playwright.config.ts                          # Playwright config
tests/e2e/auth.setup.ts                       # Global auth setup — DO NOT MODIFY
tests/e2e/<domain>.spec.ts                    # Test spec (flat)
tests/e2e/<domain>/<feature>.spec.ts          # Test spec (nested)
scripts/seed.ts                               # Seed data
prisma/schema.prisma                          # Database schema
app/api/<domain>/route.ts                     # API routes
app/<section>/<domain>/page.tsx               # Pages
proxy.ts                                      # Auth proxy (DO NOT MODIFY)
playwright/.auth/admin.json                   # Auto-generated auth state
```

### Existing test credentials (from seed)

```
ADMIN_EMAIL    = "admin@example.com"
ADMIN_PASSWORD = "password123"
USER_EMAIL     = "user@example.com"
USER_PASSWORD  = "password123"
```

### Existing seed IDs

```
SEED_PROJECT_ID = "seed-project-1"
```

---

## SECTION 3: DETERMINE AUTH CONTEXT

Every test file MUST run in exactly one Playwright project.
Use these rules to determine which project.

### Rules

```
RULE 3.1: IF the test needs a pre-authenticated admin session
          THEN → project = "chromium"
          ACTION: No config change needed (this is the default)

RULE 3.2: IF the test needs a guest (unauthenticated) browser
          THEN → project = "chromium-no-auth"
          ACTION: MUST add file to BOTH:
            - testIgnore in "chromium" project
            - testMatch in "chromium-no-auth" project

RULE 3.3: IF a single test file has BOTH guest and authenticated tests
          THEN → project = "chromium-no-auth"
          AND the authenticated test MUST perform manual login inside the test body
          ACTION: Same as RULE 3.2

RULE 3.4: IF the test needs a non-admin authenticated user (role = "user")
          THEN → project = "chromium-no-auth"
          AND the test MUST perform manual login with user@example.com inside the test body
          ACTION: Same as RULE 3.2
```

### Classification table

```
Test scenario                              → Project
─────────────────────────────────────────────────────────
Guest visits public page                   → chromium-no-auth
Guest is redirected from protected route   → chromium-no-auth
Guest logs in manually                     → chromium-no-auth
Guest registers new account                → chromium-no-auth
Smoke test (page loads)                    → chromium-no-auth
Admin accesses admin panel                 → chromium
Admin performs CRUD on admin page          → chromium
Authenticated user views dashboard         → chromium
```

---

## SECTION 4: PREPARE SEED DATA

### Rules

```
RULE 4.1: Every piece of data that a test READS from the database MUST exist in scripts/seed.ts.
          Do NOT rely on data created by other tests.

RULE 4.2: Use prisma.model.upsert() — NEVER prisma.model.create().
          This ensures seed can run multiple times without error.

RULE 4.3: Seed IDs MUST be prefixed with "seed-".
          Example: "seed-task-1", "seed-invoice-1"

RULE 4.4: Every new seed entry MUST have a console.log at the end.

RULE 4.5: Do NOT delete or modify existing seed entries.
          Append new entries below existing ones.

RULE 4.6: When a test CREATES new data (e.g., form submission), use a unique identifier.
          Pattern: `${entityName}-${Date.now()}`
          This prevents conflicts during retries.
```

### Template: Adding seed data

File: `scripts/seed.ts`
Insert BEFORE the `console.log({ ... })` line at the bottom of the `main()` function.

```typescript
// Seed <entity> for E2E tests
const seed<Entity> = await prisma.<model>.upsert({
  where: { id: 'seed-<entity>-1' },
  update: {},
  create: {
    id: 'seed-<entity>-1',
    <field1>: '<value1>',
    <field2>: '<value2>',
    // If referencing another seed entity:
    <foreignKey>: 'seed-<parent>-1',
  },
});
```

Then add `seed<Entity>` to the final console.log.

### Verification

After modifying seed.ts, run:
```bash
pnpm prisma db push --accept-data-loss && pnpm prisma db seed
```
MUST complete without error.

---

## SECTION 5: PREPARE PRISMA MODEL

Skip this section if the test does not require a new database table.

### Rules

```
RULE 5.1: id field MUST be: String @id @default(cuid())

RULE 5.2: If the model can be modified, add:
          createdAt DateTime @default(now())
          updatedAt DateTime @updatedAt

RULE 5.3: Relations MUST be defined on BOTH sides.

RULE 5.4: Add @default() for fields with logical initial values.
```

### Template: New model

File: `prisma/schema.prisma`

```prisma
model <ModelName> {
  id        String   @id @default(cuid())
  <field1>  <Type>
  <field2>  <Type>   @default(<value>)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations (if any)
  <parentField> String
  <parent>      <ParentModel> @relation(fields: [<parentField>], references: [id])
}
```

Also add the reverse relation in the parent model:
```prisma
model <ParentModel> {
  // ... existing fields
  <children> <ModelName>[]
}
```

### Verification

```bash
pnpm prisma db push --accept-data-loss && pnpm prisma generate
```
MUST complete without error.

---

## SECTION 6: PREPARE API ROUTE

Skip this section if the page does not fetch from a new API endpoint.

### Rules

```
RULE 6.1: File location: app/api/<domain>/route.ts

RULE 6.2: MUST export: export const dynamic = "force-dynamic"

RULE 6.3: GET handler:
          - Fetch with prisma.model.findMany()
          - Return NextResponse.json(data)
          - Catch errors → return { error: "message" } with status 500

RULE 6.4: POST handler:
          - Parse body with await request.json()
          - Validate required fields → return 400 if missing
          - Validate business logic → return 400 if invalid
          - Create with prisma.model.create()
          - Return NextResponse.json(created, { status: 201 })
          - Catch errors → return { error: "message" } with status 500

RULE 6.5: MUST console.error() on every caught error with format:
          "[API] <METHOD> /api/<domain> failed:"
```

### Template: API route

File: `app/api/<domain>/route.ts`

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await prisma.<model>.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("[API] GET /api/<domain> failed:", error);
    return NextResponse.json({ error: "Failed to fetch <domain>" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { <field1>, <field2> } = body;

    if (!<field1> || !<field2>) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Business logic validation (if any):
    // if (<invalid condition>) {
    //   return NextResponse.json({ error: "<validation message>" }, { status: 400 });
    // }

    const item = await prisma.<model>.create({
      data: { <field1>, <field2> },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("[API] POST /api/<domain> failed:", error);
    return NextResponse.json({ error: "Failed to create <domain>" }, { status: 500 });
  }
}
```

---

## SECTION 7: PREPARE PAGE WITH DATA-TESTID

### Rules

```
RULE 7.1: Every element that a test interacts with MUST have a data-testid attribute.

RULE 7.2: data-testid format: <domain>-<element>-<qualifier>
          Use kebab-case. Examples:
            task-page-nav
            task-list-container
            task-title-input
            submit-task-btn
            task-created-alert
            task-error-alert

RULE 7.3: Suffix conventions (MUST follow):
          Buttons       → -btn
          Inputs        → -input
          Forms         → -form
          Alerts        → -alert  (prefix with domain: task-created-alert, task-error-alert)
          Containers    → -container
          Lists         → -list
          List items    → -item  or -item-{id}
          Navigation    → -nav
          Modals        → -modal
          Loading state → -loading
          Empty state   → -empty

RULE 7.4: Form inputs MUST have both name="" (for form submission) and data-testid="" (for test).

RULE 7.5: Success and error feedback MUST have separate data-testid values.
          Pattern: <domain>-created-alert (success), <domain>-error-alert (error)
          OR: <domain>-<specific>-alert (e.g., date-error-alert)

RULE 7.6: List containers MUST have a data-testid even when empty.
          Show a loading indicator with data-testid="<domain>-list-loading" during fetch.
```

### Template: Page with all required data-testid

File: `app/<section>/<domain>/page.tsx`

```tsx
"use client";

import React, { useState, useEffect } from 'react';

export default function <Domain>Page() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [<field1>, set<Field1>] = useState('');
  const [alert, setAlert] = useState({ type: '', message: '' });

  useEffect(() => {
    fetch('/api/<domain>')
      .then(r => r.json())
      .then(data => { setItems(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!<field1>) {
      setAlert({ type: 'error', message: '<Field1> is required' });
      return;
    }
    try {
      const res = await fetch('/api/<domain>', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ <field1> }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed');
      }
      const created = await res.json();
      setItems(prev => [...prev, created]);
      setAlert({ type: 'success', message: '<Domain> created successfully' });
      set<Field1>('');
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  return (
    <div>
      <nav data-testid="<domain>-page-nav"><Domain></nav>

      <div data-testid="<domain>-list-container">
        {loading ? (
          <p data-testid="<domain>-list-loading">Loading...</p>
        ) : items.length > 0 ? (
          <ul data-testid="<domain>-list">
            {items.map(item => (
              <li key={item.id} data-testid={`<domain>-item-${item.id}`}>
                {item.<displayField>}
              </li>
            ))}
          </ul>
        ) : (
          <p data-testid="<domain>-list-empty">No items</p>
        )}
      </div>

      <form data-testid="<domain>-form" onSubmit={handleSubmit}>
        <input
          data-testid="<domain>-<field1>-input"
          name="<field1>"
          value={<field1>}
          onChange={e => set<Field1>(e.target.value)}
        />
        <button data-testid="submit-<domain>-btn" type="submit">Create</button>
      </form>

      {alert.message && (
        <div data-testid={alert.type === 'success' ? '<domain>-created-alert' : '<domain>-error-alert'}>
          {alert.message}
        </div>
      )}
    </div>
  );
}
```

---

## SECTION 8: WRITE TEST SPEC FILE

### Rules

```
RULE 8.1: File location:
          IF single feature → tests/e2e/<domain>-<feature>.spec.ts
          IF multiple features in same domain → tests/e2e/<domain>/<feature>.spec.ts

RULE 8.2: Import MUST be:
          import { test, expect } from '@playwright/test';

RULE 8.3: Tests MUST be wrapped in test.describe() with format:
          "<Subject> can <action>" or "<Domain> <Description>"

RULE 8.4: Test names MUST be descriptive sentences.
          Good: "Admin views the task list"
          Bad:  "test1", "should work"

RULE 8.5: Every test MUST have console.log() for:
          - Navigation start
          - Response status + URL after navigation
          - Key action results

RULE 8.6: Log format: console.log(`[Test: ${title}] <message>`)
          Get title with: const title = test.info().title;

RULE 8.7: For async data (API fetch), NEVER use page.$$(selector).
          ALWAYS use: page.locator(selector).first() + await expect().toBeVisible({ timeout: 10000 })

RULE 8.8: For data created during test, use unique identifiers:
          const uniqueName = `Test Item ${Date.now()}`;

RULE 8.9: Selector priority (use the first one available):
          1. page.getByTestId('id')           — best
          2. page.getByRole('role', { name })  — for semantic elements
          3. page.locator('input[name="x"]')   — for form fields without testid
          4. page.locator('text=...')           — only for assertion, not for click/fill
          5. page.locator('css > selector')     — last resort

RULE 8.10: NEVER use:
           - page.waitForTimeout() — use auto-waiting instead
           - page.click('.css-class') — use data-testid
           - XPath selectors
           - page.$$() for counting async-loaded elements
```

### Template: Test spec for authenticated CRUD

File: `tests/e2e/<domain>-<feature>.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('<Subject> can manage <domain>', () => {
  test.beforeEach(async ({ page }) => {
    const title = test.info().title;
    console.log(`[Test: ${title}] Navigating to /<section>/<domain>...`);

    const response = await page.goto('/<section>/<domain>');
    console.log(`[Test: ${title}] Status: ${response?.status()} | URL: ${page.url()}`);

    await expect(page).toHaveURL(/\/<section>\/<domain>/);
    await expect(page.getByTestId('<domain>-page-nav')).toBeVisible();
  });

  test('<Subject> views the <domain> list', async ({ page }) => {
    await expect(page.getByTestId('<domain>-list-container')).toBeVisible();

    // Wait for async data to load
    const firstItem = page.locator('[data-testid^="<domain>-item-"]').first();
    await expect(firstItem).toBeVisible({ timeout: 10000 });

    const count = await page.locator('[data-testid^="<domain>-item-"]').count();
    console.log(`[<Domain> List] Found ${count} items`);
    expect(count).toBeGreaterThan(0);
  });

  test('<Subject> creates a new <domain>', async ({ page }) => {
    const uniqueName = `E2E <Domain> ${Date.now()}`;

    await page.fill('[data-testid="<domain>-<field>-input"]', uniqueName);
    await page.click('[data-testid="submit-<domain>-btn"]');

    await expect(page.getByTestId('<domain>-created-alert'))
      .toContainText('created successfully');
    console.log(`[<Domain>] Created: ${uniqueName}`);
  });

  test('<Subject> sees validation error for invalid input', async ({ page }) => {
    // Submit form with invalid data
    await page.click('[data-testid="submit-<domain>-btn"]');

    await expect(page.getByTestId('<domain>-error-alert'))
      .toContainText('<expected error message>');
  });
});
```

### Template: Test spec for guest/unauthenticated

File: `tests/e2e/<domain>/<feature>.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

// This file runs in chromium-no-auth (no storageState)

test.describe('<Domain> Access Control', () => {
  test('should redirect guest to login page', async ({ page }) => {
    console.log('[Access] Navigating to /<protected-route> as guest...');
    await page.goto('/<protected-route>');

    await expect(page).toHaveURL(/.*\/auth\/login/);
    console.log('[Access] Guest correctly redirected to login.');
  });

  test('should allow authenticated user after login', async ({ page }) => {
    console.log('[Access] Performing manual login...');
    await page.goto('/auth/login');
    await expect(page).toHaveURL(/.*\/auth\/login/);

    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.locator('form').first().locator('button[type="submit"]').click();

    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/dashboard/);
    console.log('[Access] Login successful, on dashboard.');
  });
});
```

---

## SECTION 9: REGISTER IN PLAYWRIGHT CONFIG

### Rules

```
RULE 9.1: IF the test file runs in project "chromium" (authenticated)
          THEN → no config change needed. This is the default.

RULE 9.2: IF the test file runs in project "chromium-no-auth" (guest)
          THEN → MUST do BOTH of the following in playwright.config.ts:

          A. Add to testIgnore in the "chromium" project:
             testIgnore: [
               // ... existing entries
               '**/<new-file>.spec.ts',
             ]

          B. Add to testMatch in the "chromium-no-auth" project:
             testMatch: [
               // ... existing entries
               '**/<new-file>.spec.ts',
             ]
```

### Current config state (for reference)

```
chromium.testIgnore:
  - **/auth/login.spec.ts
  - **/auth/register.spec.ts
  - **/smoke.spec.ts
  - **/dashboard/access.spec.ts

chromium-no-auth.testMatch:
  - **/auth/login.spec.ts
  - **/auth/register.spec.ts
  - **/smoke.spec.ts
  - **/dashboard/access.spec.ts
```

---

## SECTION 10: VERIFICATION

After completing all steps, verify with these commands:

```bash
# 1. Schema + seed
pnpm prisma db push --accept-data-loss && pnpm prisma db seed

# 2. Run only the new test file
pnpm test:e2e tests/e2e/<your-new-file>.spec.ts

# 3. Run all tests to check nothing is broken
pnpm test:e2e
```

### Expected results

```
- Step 1: No errors
- Step 2: All tests in the new file PASS
- Step 3: All existing tests still PASS, no regressions
```

### If a test fails, check these in order

```
SYMPTOM: "Redirected to /auth/login" on a page that requires auth
  → CHECK: Is the test in the "chromium" project? (needs storageState)
  → CHECK: Is auth.setup.ts working? (look for "GLOBAL AUTH SETUP COMPLETED" in logs)

SYMPTOM: "Redirected to /dashboard" when expecting /auth/login
  → CHECK: Is the test in "chromium-no-auth"? (must NOT have storageState)
  → CHECK: Did you add to BOTH testIgnore AND testMatch in config?

SYMPTOM: Element not found / timeout
  → CHECK: Does the element have data-testid?
  → CHECK: Is the data-testid spelled exactly the same in page and test?
  → CHECK: For async data, are you using locator + expect instead of page.$$?

SYMPTOM: Count is 0 for a list
  → CHECK: Does seed data exist for this entity?
  → CHECK: Are you using page.locator().first() + await expect().toBeVisible() before counting?
  → CHECK: Is the API route returning data? (check server logs for errors)

SYMPTOM: Test passes locally but fails in CI
  → CHECK: Are all required env vars set in .github/workflows/ci.yml?
  → CHECK: Is the seed data being created? (prisma db seed must run before tests)
  → CHECK: Are timeouts generous enough? (CI is slower, use { timeout: 10000 } minimum for data)
```

---

## SECTION 11: REFERENCE

### Existing data-testid values in the project

```
Page: app/admin/projects/page.tsx
  project-page-nav
  project-list-container
  new-project-btn
  project-name-input
  start-date-input
  end-date-input
  submit-project-btn
  project-created-alert
  date-error-alert
```

### Existing form selectors (no data-testid, use name attribute)

```
Component: components/auth/login-form.tsx
  input[name="email"]
  input[name="password"]
  button[type="submit"] (inside form)

Component: components/auth/sign-up-form.tsx
  input[name="full_name"]
  input[name="email"]
  input[name="password"]
  button[type="submit"] (inside form)
```

### Existing API endpoints

```
POST /api/auth/[...nextauth]  → NextAuth handlers (login, register, session)
GET  /api/projects             → List all projects
POST /api/projects             → Create project (fields: name, startDate, endDate)
```

### Auth behavior (proxy.ts routing rules)

```
Unauthenticated + /dashboard or /admin/*  → redirect to /auth/login
Unauthenticated + /auth/*                 → allow (render page)
Authenticated   + /auth/*                 → redirect to /dashboard
Authenticated   + /dashboard or /admin/*  → allow (render page)
Authenticated   + not approved            → redirect to /auth/pending-approval
```

### CI environment variables

```yaml
DATABASE_URL: "postgresql://postgres:password@localhost:5432/mydb"
AUTH_SECRET: "dummy_secret_for_e2e_test"
NEXTAUTH_SECRET: "dummy_secret_for_e2e_test"
AUTH_URL: "http://localhost:3000"
NEXTAUTH_URL: "http://localhost:3000"
AUTH_TRUST_HOST: "true"
NODE_ENV: "test"
CI: true
```


