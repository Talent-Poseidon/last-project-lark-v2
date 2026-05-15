# Next.js 16 + NextAuth + Prisma Boilerplate

A modern, production-ready full-stack boilerplate featuring Next.js 16 (App Router), NextAuth.js v5 (Auth), Prisma ORM (Database), and a hybrid UI system (Shadcn UI + Mantine).

## Features

- **Authentication:** NextAuth.js v5 (Email/Password & Google OAuth).
- **Database:** Prisma ORM with PostgreSQL.
- **Authorization:** Role-based access (User vs Admin) & Account Approval System.
- **Admin Dashboard:** Manage users and approvals.
- **Modern Stack:** Next.js 16, TypeScript, Shadcn UI, Mantine UI v7, Tailwind CSS.

## Getting Started

### 1. Prerequisites
- Node.js 20+ (Recommended)
- PNPM (Recommended) or NPM

### 2. Configure Environment Variables
Copy the example file and fill in your keys:

```bash
cp .env.example .env
```

Open `.env` and fill in the details:

```env
# Database Connection (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-at-least-32-chars" # Generate with: openssl rand -base64 32

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

### 3. Initialize Database
Install dependencies and run Prisma migrations to set up your database schema.

```bash
# Install dependencies
pnpm install

# Generate Prisma Client
pnpm prisma generate

# Push schema to database (for development)
pnpm prisma db push
# OR create a migration
# pnpm prisma migrate dev --name init
```

### 4. Create Admin Account
Since new sign-ups are unapproved by default, use the included script to create your first admin user. This script connects directly to your database via Prisma.

```bash
# Ensure your database is running and schema is pushed before running this
npm run setup:admin
# or
pnpm setup:admin
```

Follow the prompts to enter email and password. This will:
- Create the user in the database (or update existing one).
- Automatically promote them to `admin`.
- Approve their account.

### 5. Run the App

```bash
pnpm dev
```

Visit `http://localhost:3000`. You can login with the admin account you created.

## Documentation

For detailed architecture and folder structure, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## CI/CD

This project includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that:
- Lints the code.
- Checks types.
- Builds the application.
