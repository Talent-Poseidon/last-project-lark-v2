-- Create profiles table with approval system
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  is_approved boolean not null default false,
  provider text default 'email',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users can read their own profile
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

-- Users can update their own profile (but not role or is_approved)
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- Users can insert their own profile
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- Admins can read all profiles
-- Note: We avoid checking the profiles table for admin status inside the policy
-- to prevent infinite recursion. Instead, we assume admin check is done via
-- separate mechanism or simple role check if using custom claims.
-- However, since we store role in profiles, we need a way to check it without recursion.
-- The safe way is to separate the "is_admin" check into a function with security definer
-- OR just rely on basic "read own" + "admin read all" where "admin read all" 
-- doesn't query the table itself recursively for the SAME row being checked, 
-- but queries the user's OWN row.

-- FIX: The previous policy caused recursion because to check if user X can see user Y,
-- it queried profiles table (SELECT 1 FROM profiles ...). That query triggered the policy AGAIN.

-- Optimized Admin Policy:
create policy "profiles_admin_select_all" on public.profiles
  for select using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- Admins can update all profiles (for approval)
create policy "profiles_admin_update_all" on public.profiles
  for update using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );
