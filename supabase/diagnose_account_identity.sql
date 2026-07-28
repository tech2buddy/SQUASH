-- Read-only. Determines whether these three logins are actually three
-- separate accounts, and what each one resolves to.
--
-- Cross-device "wrong profile" cannot be session bleed: readProfileSession()
-- looks up profiles by the authenticated user's own id, and a session on one
-- PC has no way to reach another PC. So the realistic causes are:
--   a) two of these emails are the same auth user (OAuth linking, or a
--      case/alias variant), or
--   b) one account holds both developer and tester roles, so login lands in
--      whichever workspace profiles.role points at, or
--   c) the accounts are distinct but share a display name, so the header
--      looks identical and the wrong one is hard to notice.
--
-- This tells you which.

select
  u.id                                   as auth_user_id,
  u.email                                as auth_email,
  u.raw_app_meta_data ->> 'provider'     as primary_provider,
  u.raw_app_meta_data -> 'providers'     as all_providers,
  u.last_sign_in_at,
  p.role                                 as profile_default_role,
  p.full_name                            as profile_name,
  p.email                                as profile_email,
  (select count(*) from public.developer_profiles d where d.user_id = u.id) as has_developer_profile,
  (select count(*) from public.tester_profiles  t where t.user_id = u.id)   as has_tester_profile
from auth.users u
left join public.profiles p on p.id = u.id
where lower(u.email) in (
  'khozamzwakhe25@gmail.com',
  'mzwakhekhoza25@gmail.com',
  'squashqa@gmail.com'
)
order by u.created_at;

-- If the row count above is less than 3, two of your logins are the same
-- account. If any row shows both has_developer_profile = 1 and
-- has_tester_profile = 1, that account has two workspaces and login opens
-- whichever profile_default_role names.
