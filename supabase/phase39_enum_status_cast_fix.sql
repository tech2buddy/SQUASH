-- Phase 39: fix text -> enum assignment in the core workflow RPCs.
--
-- These functions take p_status as `text` and assign it straight to a
-- column whose type is a Postgres enum. Postgres has no implicit or
-- assignment cast from text to an enum in an UPDATE, so every call failed:
--
--   42804: column "status" is of type application_status
--          but expression is of type text
--
-- This broke the entire core workflow -- a developer could not accept a
-- tester, could not approve a submitted report, and an admin could not
-- mark a payout as paid. Rows created before phase 19 rewrote these
-- functions still show accepted/approved states, which is why the bug was
-- not obvious from the data.
--
-- Only enum-typed columns are affected. Tables using `text` + a check
-- constraint (tester_banking_details.verification_status,
-- payout_batches.status, support_tickets.status) were never broken and are
-- left untouched.
--
-- The fix is an explicit cast. Behaviour is otherwise unchanged; each
-- function still validates p_status against an allow-list first, so the
-- cast cannot receive an unexpected value.

-- 1. Accepting / rejecting a tester application -----------------------------

create or replace function public.review_job_application(p_application_id uuid, p_status text)
returns public.job_applications language plpgsql security definer set search_path = public as $$
declare v_application public.job_applications; v_job public.jobs;
begin
  if p_status not in ('accepted', 'rejected') then raise exception 'Invalid application status'; end if;
  select * into v_application from public.job_applications where id = p_application_id for update;
  if not found then raise exception 'Application not found'; end if;
  select * into v_job from public.jobs where id = v_application.job_id;
  if not found or (v_job.developer_id <> auth.uid() and not public.is_admin()) then raise exception 'Not authorized'; end if;
  update public.job_applications
    set status = p_status::public.application_status, updated_at = now()
    where id = p_application_id returning * into v_application;
  if p_status = 'accepted' then
    insert into public.test_assignments (job_id, tester_id, application_id, status)
    values (v_application.job_id, v_application.tester_id, v_application.id, 'active')
    on conflict (job_id, tester_id) do update
      set application_id = excluded.application_id,
          status = case when public.test_assignments.status = 'approved' then 'approved' else 'active' end,
          updated_at = now();
  end if;
  return v_application;
end;
$$;

revoke all on function public.review_job_application(uuid, text) from public;
grant execute on function public.review_job_application(uuid, text) to authenticated;

-- 2. Approving / rejecting a submitted report ------------------------------

create or replace function public.review_test_submission(p_submission_id uuid, p_status text)
returns public.test_submissions language plpgsql security definer set search_path = public as $$
declare v_submission public.test_submissions; v_job public.jobs; v_assignment_status public.assignment_status;
begin
  if p_status not in ('approved', 'changes_requested', 'rejected') then raise exception 'Invalid review status'; end if;
  select * into v_submission from public.test_submissions where id = p_submission_id for update;
  if not found then raise exception 'Submission not found'; end if;
  select * into v_job from public.jobs where id = v_submission.job_id;
  if not found or (v_job.developer_id <> auth.uid() and not public.is_admin()) then raise exception 'Not authorized'; end if;
  update public.test_submissions
    set status = p_status::public.submission_status, reviewed_at = now()
    where id = p_submission_id returning * into v_submission;
  v_assignment_status := case
    when p_status = 'approved' then 'approved'
    when p_status = 'changes_requested' then 'active'
    else 'submitted' end;
  update public.test_assignments set status = v_assignment_status, updated_at = now()
    where id = v_submission.assignment_id;
  return v_submission;
end;
$$;

revoke all on function public.review_test_submission(uuid, text) from public;
grant execute on function public.review_test_submission(uuid, text) to authenticated;

-- 3. Admin marking a payout paid/failed/cancelled --------------------------
-- Same body as phase 36 (which added the payout notification), with the cast.

create or replace function public.admin_update_weekly_payout(
  p_payout_id uuid,
  p_status text,
  p_note text default null,
  p_reference text default null,
  p_proof_path text default null,
  p_proof_name text default null
)
returns public.payouts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payout public.payouts;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if p_status not in ('processing', 'paid', 'failed', 'cancelled') then
    raise exception 'Invalid payout status';
  end if;
  if p_status = 'paid' and nullif(trim(p_reference), '') is null then
    raise exception 'An EFT reference is required';
  end if;
  if p_status = 'paid' and (
    nullif(trim(p_proof_path), '') is null
    or split_part(p_proof_path, '/', 1) <> p_payout_id::text
  ) then
    raise exception 'Valid proof of payment is required';
  end if;

  update public.payouts set
    status = p_status::public.payout_status,
    admin_note = nullif(trim(p_note), ''),
    payout_reference = nullif(trim(p_reference), ''),
    proof_document_path = case when p_status = 'paid' then p_proof_path else proof_document_path end,
    proof_document_name = case when p_status = 'paid' then p_proof_name else proof_document_name end,
    processed_at = case when p_status in ('paid', 'failed', 'cancelled') then now() else null end
  where id = p_payout_id
  returning * into v_payout;

  if v_payout.id is null then raise exception 'Payout not found'; end if;

  insert into public.admin_activity_logs (admin_id, action, entity_type, entity_id, note, metadata)
  values (
    auth.uid(),
    'payout_' || p_status,
    'payout',
    p_payout_id,
    nullif(trim(p_note), ''),
    jsonb_build_object(
      'payout_reference', p_reference,
      'proof_document_path', p_proof_path,
      'amount_zar', v_payout.amount_zar,
      'tester_id', v_payout.tester_id,
      'scheduled_for', v_payout.scheduled_for
    )
  );

  if p_status = 'paid' and public.user_wants_notification(v_payout.tester_id, 'payoutAlerts') then
    perform public.create_notification(
      target_user_id    => v_payout.tester_id,
      notification_title => 'Payout Sent',
      notification_body  => format('R%s has been paid out to your bank account. Reference: %s.', v_payout.amount_zar, p_reference),
      notification_type => 'payout',
      link_path         => '/tester/earnings',
      priority          => 'high'
    );
  end if;

  return v_payout;
end;
$$;

revoke all on function public.admin_update_weekly_payout(uuid, text, text, text, text, text) from public;
grant execute on function public.admin_update_weekly_payout(uuid, text, text, text, text, text) to authenticated;

-- 4. Legacy payout function -------------------------------------------------
-- Already revoked from authenticated in phase 21, but fixed so it is not a
-- landmine if anyone re-grants it later.

create or replace function public.admin_update_payout(p_payout_id uuid, p_status text, p_note text default null, p_reference text default null)
returns public.payouts language plpgsql security definer set search_path = public as $$
declare v_payout public.payouts;
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  if p_status not in ('processing', 'paid', 'failed', 'cancelled') then raise exception 'Invalid payout status'; end if;
  if p_status = 'paid' and nullif(trim(p_reference), '') is null then raise exception 'A payment reference is required'; end if;
  update public.payouts
    set status = p_status::public.payout_status,
        admin_note = nullif(trim(p_note), ''),
        payout_reference = nullif(trim(p_reference), ''),
        processed_at = case when p_status in ('paid','failed','cancelled') then now() else null end
    where id = p_payout_id returning * into v_payout;
  if not found then raise exception 'Payout not found'; end if;
  insert into public.admin_activity_logs (admin_id, action, entity_type, entity_id, note, metadata)
  values (auth.uid(), 'payout_' || p_status, 'payout', p_payout_id, nullif(trim(p_note), ''),
          jsonb_build_object('payout_reference', p_reference, 'amount_zar', v_payout.amount_zar, 'tester_id', v_payout.tester_id));
  return v_payout;
end;
$$;

revoke all on function public.admin_update_payout(uuid, text, text, text) from public, authenticated;
