-- Auto-create profile on user signup
-- Google sign-in users default to is_approved = false (need admin approval)
-- Email/password users default to is_approved = true
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _provider text;
  _approved boolean;
begin
  -- Determine provider
  _provider := coalesce(new.raw_app_meta_data ->> 'provider', 'email');

  -- Email/password users are auto-approved, Google users need approval
  if _provider = 'google' then
    _approved := false;
  else
    _approved := true;
  end if;

  insert into public.profiles (id, email, full_name, avatar_url, role, is_approved, provider)
  values (
    new.id,
    coalesce(new.email, new.raw_user_meta_data ->> 'email'),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', null),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', null),
    'user',
    _approved,
    _provider
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url,
    provider = excluded.provider,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
