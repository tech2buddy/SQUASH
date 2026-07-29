-- Read-only. Shows who each notification actually belongs to, so we can tell
-- whether notifications are being written to the wrong user (a real leak) or
-- being read by an account that legitimately owns them.
--
-- Context that matters here: khozamzwakhe25@ holds BOTH a developer and a
-- tester profile, and squashqa@ is an admin. If you view the app as a tester
-- on an account that is also the developer who owns that job, you will
-- correctly see the developer's notifications -- that is ownership, not a
-- leak. Admins also legitimately see everything via is_admin().

select
  n.created_at,
  n.notification_type,
  n.title,
  owner.email        as notification_belongs_to,
  owner_p.role       as owner_default_role,
  n.body
from public.notifications n
join public.profiles owner on owner.id = n.user_id
join public.profiles owner_p on owner_p.id = n.user_id
order by n.created_at desc
limit 40;

-- Any notification whose recipient is a tester but whose text describes
-- another tester applying would be a genuine mis-targeting. Everything else
-- is expected ownership.
