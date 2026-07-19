-- SQUASH Phase 10 role helper fix
-- Run this after phase3_multi_role.sql.
-- This keeps RLS secure while allowing multi-role users to act as developers/testers
-- when they have the matching role profile row.

create or replace function public.is_developer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'developer'::public.user_role
  )
  or exists (
    select 1
    from public.developer_profiles dp
    where dp.user_id = auth.uid()
  );
$$;

create or replace function public.is_tester()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'tester'::public.user_role
  )
  or exists (
    select 1
    from public.tester_profiles tp
    where tp.user_id = auth.uid()
  );
$$;

-- Backfill missing role profile rows for existing accounts.
insert into public.developer_profiles (user_id, company_name, billing_email)
select id, full_name, email
from public.profiles
where role = 'developer'
on conflict (user_id) do nothing;

insert into public.tester_profiles (user_id)
select id
from public.profiles
where role = 'tester'
on conflict (user_id) do nothing;
