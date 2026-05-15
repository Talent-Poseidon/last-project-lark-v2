-- ==============================================================================
-- 1. Create Profiles Table
-- ==============================================================================
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

-- ==============================================================================
-- 2. Automatic Profile Creation Trigger
-- ==============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, provider)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.app_metadata->>'provider'
  );
  return new;
end;
$$;

-- Trigger the function every time a user is created
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==============================================================================
-- 3. Row Level Security (RLS) Setup
-- ==============================================================================
alter table public.profiles enable row level security;

-- Helper function to check if user is admin (Prevents Infinite Recursion)
-- We use SECURITY DEFINER to bypass RLS for this specific check.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from profiles
    where id = auth.uid()
    and role = 'admin'
  );
$$;

-- Policy: Users can read their own profile
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

-- Policy: Users can update their own profile (restricted columns usually handled by API, 
-- but RLS here allows general update, specific field protection can be added if needed)
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Policy: Admins can read all profiles
create policy "profiles_admin_select_all" on public.profiles
  for select using (public.is_admin());

-- Policy: Admins can update all profiles (for approval/role change)
create policy "profiles_admin_update_all" on public.profiles
  for update using (public.is_admin());
