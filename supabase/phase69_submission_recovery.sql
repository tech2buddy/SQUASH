-- Atomic qualification submission and Test Lab state sync.
-- Apply before deploying the matching API change.
begin;

create or replace function public.submit_qualification_sample(
  p_attempt_id uuid, p_tester_id uuid, p_report jsonb
)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  v_attempt public.tester_qualification_attempts%rowtype;
begin
  select * into v_attempt from public.tester_qualification_attempts
  where id = p_attempt_id and tester_id = p_tester_id for update;
  if not found then raise exception 'Qualification attempt not found'; end if;
  if v_attempt.status = 'sample_submitted' then return true; end if;
  if v_attempt.status <> 'sample_in_progress' then
    raise exception 'Qualification sample is not in progress';
  end if;

  insert into public.tester_qualification_sample_reports (
    attempt_id, tester_id, sample_variant_key, task_outcomes,
    issue_reports, tester_notes, environment, evidence_paths
  ) values (
    v_attempt.id, v_attempt.tester_id, v_attempt.sample_variant_key,
    p_report->'task_outcomes', p_report->'issue_reports',
    p_report->>'tester_notes', p_report->'environment',
    array(select jsonb_array_elements_text(p_report->'evidence_paths'))
  ) on conflict (attempt_id) do nothing;

  update public.tester_qualification_attempts
  set status = 'sample_submitted', sample_submitted_at = coalesce(sample_submitted_at, now())
  where id = v_attempt.id;
  return true;
end;
$$;
revoke all on function public.submit_qualification_sample(uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.submit_qualification_sample(uuid, uuid, jsonb) to service_role;

create or replace function public.sync_submitted_test_lab_session()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.status = 'submitted' then
    update public.test_lab_sessions
    set status = 'submitted', submitted_at = coalesce(submitted_at, now()),
        last_saved_at = now(), progress_percent = 100
    where assignment_id = new.assignment_id and status <> 'submitted';
  end if;
  return new;
end;
$$;
drop trigger if exists test_submissions_sync_lab_session on public.test_submissions;
create trigger test_submissions_sync_lab_session
after insert or update of status on public.test_submissions
for each row execute function public.sync_submitted_test_lab_session();

-- Repair sessions left open by a previous second-write failure.
update public.test_lab_sessions s
set status = 'submitted', submitted_at = coalesce(s.submitted_at, t.submitted_at, now()),
    last_saved_at = now(), progress_percent = 100
from public.test_submissions t
where t.assignment_id = s.assignment_id
  and t.status = 'submitted' and s.status <> 'submitted';

commit;
