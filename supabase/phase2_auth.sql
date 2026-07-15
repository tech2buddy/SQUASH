-- SQUASH Phase 2 Auth trigger
-- Run this after supabase/schema.sql.
-- It creates profile rows automatically when a Supabase Auth user signs up.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role public.user_role;
  requested_name text;
begin
  requested_role := coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'tester'::public.user_role);
  requested_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')), '');

  insert into public.profiles (id, role, full_name, email, avatar_url)
  values (
    new.id,
    requested_role,
    coalesce(requested_name, split_part(new.email, '@', 1), 'SQUASH User'),
    lower(new.email),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  if requested_role = 'developer'::public.user_role then
    insert into public.developer_profiles (user_id, company_name, billing_email)
    values (new.id, requested_name, lower(new.email))
    on conflict (user_id) do nothing;
  elsif requested_role = 'tester'::public.user_role then
    insert into public.tester_profiles (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();
