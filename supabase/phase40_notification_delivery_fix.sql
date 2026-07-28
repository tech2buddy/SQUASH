-- Phase 40: make in-app notifications actually deliver.
--
-- Symptom: no notification was ever received when a tester applied to a job,
-- when a developer accepted an applicant, or when a tester submitted a
-- report. Two independent causes, both silent:
--
-- 1. The only INSERT policy on public.notifications is
--    "notifications_admin_insert" (with check public.is_admin()). Every one
--    of those events writes a notification for the OTHER party, from a
--    developer or tester session, so RLS rejected all of them. The client
--    swallowed the error, so nothing surfaced.
--
-- 2. The client generated its own id ("notif_<timestamp>_<rand>") and passed
--    it to an id column of type uuid, producing
--    "invalid input syntax for type uuid". The id is now left to the column
--    default (gen_random_uuid()).
--
-- Rather than loosening the insert policy -- which would let any
-- authenticated user push arbitrary notifications to any other user -- this
-- adds a security definer RPC that verifies the caller and recipient are
-- genuinely connected through a job before writing.

create or replace function public.notify_user(
  p_user_id uuid,
  p_title text,
  p_body text,
  p_type text default 'general',
  p_link_path text default null,
  p_priority text default 'normal'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if coalesce(trim(p_title), '') = '' then raise exception 'A notification title is required'; end if;

  -- Only allow notifying yourself, or someone you share a job with as the
  -- opposite party (developer <-> tester), or anyone if you are an admin.
  if not (
    public.is_admin()
    or p_user_id = auth.uid()
    or exists (
      select 1
      from public.job_applications ja
      join public.jobs j on j.id = ja.job_id
      where (ja.tester_id = auth.uid() and j.developer_id = p_user_id)
         or (j.developer_id = auth.uid() and ja.tester_id = p_user_id)
    )
    or exists (
      select 1
      from public.test_assignments ta
      join public.jobs j on j.id = ta.job_id
      where (ta.tester_id = auth.uid() and j.developer_id = p_user_id)
         or (j.developer_id = auth.uid() and ta.tester_id = p_user_id)
    )
  ) then
    raise exception 'Not authorized to notify this user';
  end if;

  insert into public.notifications (
    user_id, title, body, notification_type, link_path, priority, status
  ) values (
    p_user_id,
    trim(p_title),
    coalesce(p_body, ''),
    case
      when p_type in ('general','job_match','application','report','payout','security','admin_request')
        then p_type
      -- The client uses 'job' for job events; the column check constraint
      -- does not include it, so map rather than reject the notification.
      when p_type = 'job' then 'job_match'
      else 'general'
    end,
    p_link_path,
    case when p_priority in ('low','normal','high','urgent') then p_priority else 'normal' end,
    'unread'
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.notify_user(uuid, text, text, text, text, text) from public;
grant execute on function public.notify_user(uuid, text, text, text, text, text) to authenticated;
