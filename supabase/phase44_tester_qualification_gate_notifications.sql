-- SQUASH Phase 44: qualification gate, decision notifications and probation

begin;

alter table public.tester_profiles
  add column if not exists qualification_probation_started_at timestamptz,
  add column if not exists qualification_probation_ends_at timestamptz;

-- Keep probation metadata in the same protected workflow as qualification
-- status. It is informational and operational; it never blocks an approved
-- tester from applying to paid jobs.
create or replace function public.guard_tester_qualification_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin()
     and current_setting('squash.qualification_write', true) is distinct from 'on'
     and (
       new.qualification_status is distinct from old.qualification_status
       or new.qualification_approved_at is distinct from old.qualification_approved_at
       or new.qualification_updated_at is distinct from old.qualification_updated_at
       or new.qualification_probation_started_at is distinct from old.qualification_probation_started_at
       or new.qualification_probation_ends_at is distinct from old.qualification_probation_ends_at
     ) then
    raise exception 'Qualification status is managed by the SQUASH review workflow';
  end if;
  return new;
end;
$$;

-- This is the actual launch gate. Existing tester profiles were safely
-- grandfathered as approved in Phase 41; new testers must complete review.
drop policy if exists "applications_insert_tester_own" on public.job_applications;
create policy "applications_insert_qualified_tester_own" on public.job_applications
for insert with check (
  tester_id = auth.uid()
  and public.is_tester()
  and public.is_tester_qualified(auth.uid())
);

create or replace function public.review_tester_qualification_attempt(
  p_attempt_id uuid,
  p_decision text,
  p_note text default null
)
returns public.tester_qualification_attempts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt public.tester_qualification_attempts;
  v_note text := nullif(trim(coalesce(p_note, '')), '');
  v_title text;
  v_body text;
  v_priority text := 'normal';
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;
  if p_decision not in ('approved', 'retry_required', 'declined') then
    raise exception 'Unsupported qualification decision';
  end if;
  if v_note is not null and char_length(v_note) > 3000 then
    raise exception 'Review note is too long';
  end if;
  if p_decision in ('retry_required', 'declined') and coalesce(char_length(v_note), 0) < 10 then
    raise exception 'Add a clear review note for a retry or decline decision';
  end if;

  select * into v_attempt
  from public.tester_qualification_attempts
  where id = p_attempt_id
  for update;

  if v_attempt.id is null then
    raise exception 'Qualification attempt not found';
  end if;
  if v_attempt.status <> 'sample_submitted' then
    raise exception 'This qualification attempt has already been reviewed';
  end if;
  if not exists (
    select 1 from public.tester_qualification_sample_reports r
    where r.attempt_id = v_attempt.id and r.tester_id = v_attempt.tester_id
  ) then
    raise exception 'A practical sample report is required before review';
  end if;

  update public.tester_qualification_attempts
  set status = p_decision,
      reviewer_id = auth.uid(),
      reviewer_note = v_note,
      reviewed_at = now()
  where id = v_attempt.id
  returning * into v_attempt;

  perform set_config('squash.qualification_write', 'on', true);
  update public.tester_profiles
  set qualification_status = p_decision,
      qualification_approved_at = case when p_decision = 'approved' then now() else null end,
      qualification_probation_started_at = case when p_decision = 'approved' then now() else null end,
      qualification_probation_ends_at = case when p_decision = 'approved' then now() + interval '30 days' else null end,
      qualification_updated_at = now()
  where user_id = v_attempt.tester_id;

  if p_decision = 'approved' then
    v_title := 'You are approved to test on SQUASH';
    v_body := 'Your tester application is approved. You can now apply to paid jobs. Your first 30 days are monitored for report quality and platform safety.';
    v_priority := 'high';
  elsif p_decision = 'retry_required' then
    v_title := 'A fresh SQUASH tester attempt is ready';
    v_body := 'Review the feedback and complete your alternate QA quiz and practical sample before applying to paid jobs.' || case when v_note is null then '' else ' Reviewer note: ' || v_note end;
    v_priority := 'high';
  else
    v_title := 'Your SQUASH tester application was not approved';
    v_body := coalesce(v_note, 'Your application has been reviewed. Contact SQUASH support if you need clarification.');
    v_priority := 'normal';
  end if;

  insert into public.notifications (user_id, title, body, notification_type, link_path, priority, status)
  values (v_attempt.tester_id, v_title, v_body, 'security', '/tester-qualification', v_priority, 'unread');

  return v_attempt;
end;
$$;

revoke all on function public.review_tester_qualification_attempt(uuid, text, text) from public;
grant execute on function public.review_tester_qualification_attempt(uuid, text, text) to authenticated;

commit;
