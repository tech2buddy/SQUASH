-- Phase 19: Marketplace security hardening
-- Apply after phases 1-18. Sensitive state transitions are performed by RPC only.

begin;

drop policy if exists "applications_update_related" on public.job_applications;
drop policy if exists "assignments_update_related" on public.test_assignments;
drop policy if exists "submissions_update_related" on public.test_submissions;
drop policy if exists "payouts_insert_tester_own_pending" on public.payouts;
drop policy if exists "payouts_insert_admin_only" on public.payouts;
drop policy if exists "payouts_update_admin_only" on public.payouts;

create policy "applications_update_admin_only" on public.job_applications for update using (public.is_admin()) with check (public.is_admin());
create policy "assignments_update_admin_only" on public.test_assignments for update using (public.is_admin()) with check (public.is_admin());
create policy "submissions_update_admin_only" on public.test_submissions for update using (public.is_admin()) with check (public.is_admin());
create policy "payouts_admin_only" on public.payouts for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.review_job_application(p_application_id uuid, p_status text)
returns public.job_applications language plpgsql security definer set search_path = public as $$
declare v_application public.job_applications; v_job public.jobs;
begin
  if p_status not in ('accepted', 'rejected') then raise exception 'Invalid application status'; end if;
  select * into v_application from public.job_applications where id = p_application_id for update;
  if not found then raise exception 'Application not found'; end if;
  select * into v_job from public.jobs where id = v_application.job_id;
  if not found or (v_job.developer_id <> auth.uid() and not public.is_admin()) then raise exception 'Not authorized'; end if;
  update public.job_applications set status = p_status, updated_at = now() where id = p_application_id returning * into v_application;
  if p_status = 'accepted' then
    insert into public.test_assignments (job_id, tester_id, application_id, status) values (v_application.job_id, v_application.tester_id, v_application.id, 'active')
    on conflict (job_id, tester_id) do update set application_id = excluded.application_id, status = case when public.test_assignments.status = 'approved' then 'approved' else 'active' end, updated_at = now();
  end if;
  return v_application;
end;
$$;

create or replace function public.submit_test_assignment(p_assignment_id uuid, p_summary text, p_usability integer, p_performance integer, p_onboarding integer, p_bug_severity integer, p_device_compatibility integer)
returns public.test_submissions language plpgsql security definer set search_path = public as $$
declare v_assignment public.test_assignments; v_submission public.test_submissions;
begin
  select * into v_assignment from public.test_assignments where id = p_assignment_id for update;
  if not found or v_assignment.tester_id <> auth.uid() then raise exception 'Not authorized'; end if;
  if v_assignment.status not in ('active', 'submitted') then raise exception 'Assignment cannot be submitted'; end if;
  if coalesce(length(trim(p_summary)), 0) > 10000 then raise exception 'Summary is too long'; end if;
  insert into public.test_submissions (assignment_id, tester_id, job_id, status, summary, usability_score, performance_score, onboarding_score, bug_severity_score, device_compatibility_score, submitted_at)
  values (v_assignment.id, v_assignment.tester_id, v_assignment.job_id, 'submitted', nullif(trim(p_summary), ''), p_usability, p_performance, p_onboarding, p_bug_severity, p_device_compatibility, now())
  on conflict (assignment_id) do update set status = 'submitted', summary = excluded.summary, usability_score = excluded.usability_score, performance_score = excluded.performance_score, onboarding_score = excluded.onboarding_score, bug_severity_score = excluded.bug_severity_score, device_compatibility_score = excluded.device_compatibility_score, submitted_at = now(), reviewed_at = null
  returning * into v_submission;
  update public.test_assignments set status = 'submitted', updated_at = now() where id = v_assignment.id;
  return v_submission;
end;
$$;

create or replace function public.review_test_submission(p_submission_id uuid, p_status text)
returns public.test_submissions language plpgsql security definer set search_path = public as $$
declare v_submission public.test_submissions; v_job public.jobs; v_assignment_status public.assignment_status;
begin
  if p_status not in ('approved', 'changes_requested', 'rejected') then raise exception 'Invalid review status'; end if;
  select * into v_submission from public.test_submissions where id = p_submission_id for update;
  if not found then raise exception 'Submission not found'; end if;
  select * into v_job from public.jobs where id = v_submission.job_id;
  if not found or (v_job.developer_id <> auth.uid() and not public.is_admin()) then raise exception 'Not authorized'; end if;
  update public.test_submissions set status = p_status, reviewed_at = now() where id = p_submission_id returning * into v_submission;
  v_assignment_status := case when p_status = 'approved' then 'approved' when p_status = 'changes_requested' then 'active' else 'submitted' end;
  update public.test_assignments set status = v_assignment_status, updated_at = now() where id = v_submission.assignment_id;
  return v_submission;
end;
$$;

create or replace function public.request_tester_payout(p_amount_zar integer)
returns public.payouts language plpgsql security definer set search_path = public as $$
declare v_available integer; v_payout public.payouts;
begin
  if p_amount_zar <= 0 then raise exception 'Payout amount must be positive'; end if;
  select coalesce(sum(floor(j.total_amount_zar::numeric / nullif(j.testers_needed, 0))) filter (where s.status = 'approved'), 0) - coalesce((select sum(amount_zar) from public.payouts where tester_id = auth.uid() and status in ('pending','processing','paid')), 0)
  into v_available from public.test_submissions s join public.jobs j on j.id = s.job_id where s.tester_id = auth.uid();
  if p_amount_zar > v_available then raise exception 'Requested payout exceeds available balance'; end if;
  insert into public.payouts (tester_id, amount_zar, status) values (auth.uid(), p_amount_zar, 'pending') returning * into v_payout;
  return v_payout;
end;
$$;

create or replace function public.admin_update_payout(p_payout_id uuid, p_status text, p_note text default null, p_reference text default null)
returns public.payouts language plpgsql security definer set search_path = public as $$
declare v_payout public.payouts;
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  if p_status not in ('processing', 'paid', 'failed', 'cancelled') then raise exception 'Invalid payout status'; end if;
  if p_status = 'paid' and nullif(trim(p_reference), '') is null then raise exception 'A payment reference is required'; end if;
  update public.payouts set status = p_status, admin_note = nullif(trim(p_note), ''), payout_reference = nullif(trim(p_reference), ''), processed_at = case when p_status in ('paid','failed','cancelled') then now() else null end where id = p_payout_id returning * into v_payout;
  if not found then raise exception 'Payout not found'; end if;
  insert into public.admin_activity_logs (admin_id, action, entity_type, entity_id, note, metadata) values (auth.uid(), 'payout_' || p_status, 'payout', p_payout_id, nullif(trim(p_note), ''), jsonb_build_object('payout_reference', p_reference, 'amount_zar', v_payout.amount_zar, 'tester_id', v_payout.tester_id));
  return v_payout;
end;
$$;

revoke all on function public.review_job_application(uuid, text) from public;
revoke all on function public.submit_test_assignment(uuid, text, integer, integer, integer, integer, integer) from public;
revoke all on function public.review_test_submission(uuid, text) from public;
revoke all on function public.request_tester_payout(integer) from public;
revoke all on function public.admin_update_payout(uuid, text, text, text) from public;
grant execute on function public.review_job_application(uuid, text) to authenticated;
grant execute on function public.submit_test_assignment(uuid, text, integer, integer, integer, integer, integer) to authenticated;
grant execute on function public.review_test_submission(uuid, text) to authenticated;
grant execute on function public.request_tester_payout(integer) to authenticated;
grant execute on function public.admin_update_payout(uuid, text, text, text) to authenticated;

commit;
