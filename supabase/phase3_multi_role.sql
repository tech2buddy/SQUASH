-- SQUASH Phase 3 multi-role helpers
-- Run this after phase2_grants.sql.
-- It keeps profiles.role as the default/active workspace while allowing one account to have both role profiles.

-- Existing one-role users should always have the matching role profile row.
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

-- Optional helper: use this to add developer workspace to an existing tester account.
create or replace function public.add_developer_workspace(target_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_profile public.profiles%rowtype;
begin
  select * into target_profile
  from public.profiles
  where email = lower(target_email);

  if target_profile.id is null then
    raise exception 'No SQUASH profile found for %', target_email;
  end if;

  insert into public.developer_profiles (user_id, company_name, billing_email)
  values (target_profile.id, target_profile.full_name, target_profile.email)
  on conflict (user_id) do nothing;

  update public.profiles
  set role = 'developer'
  where id = target_profile.id;
end;
$$;

-- Optional helper: use this to add tester workspace to an existing developer account.
create or replace function public.add_tester_workspace(target_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_profile public.profiles%rowtype;
begin
  select * into target_profile
  from public.profiles
  where email = lower(target_email);

  if target_profile.id is null then
    raise exception 'No SQUASH profile found for %', target_email;
  end if;

  insert into public.tester_profiles (user_id)
  values (target_profile.id)
  on conflict (user_id) do nothing;

  update public.profiles
  set role = 'tester'
  where id = target_profile.id;
end;
$$;
