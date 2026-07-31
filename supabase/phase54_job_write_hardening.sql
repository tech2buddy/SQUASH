-- SQUASH Phase 54: stop developers writing their own job status and price
--
-- CRITICAL. `phase2_grants.sql` grants blanket UPDATE on public.jobs to
-- authenticated, and `jobs_update_developer_own_or_admin` restricts which rows
-- a developer may touch but not which columns. Nothing guarded `status`.
--
-- So the entire payment flow was optional:
--
--   supabase.from('jobs').update({ status: 'active' }).eq('id', myJobId)
--
-- The job goes live, testers apply, work gets done, and no payment ever
-- existed. Yoco checkout, the webhook, the double-payment guards -- all of it
-- bypassed by one client-side write to the field the webhook was meant to own.
--
-- The same hole let a developer set `total_amount_zar` to R1 before checkout.
-- That is worse than lost revenue: `request_tester_payout()` computes payouts
-- as total_amount_zar * 0.62, so it silently underpays every tester on the job.
--
-- Two layers here, because either alone is one careless migration from being
-- undone: column-level grants, and a trigger that refuses the write outright.

begin;

-- ------------------------------------------------------------
-- 1. Column-level UPDATE grant
-- ------------------------------------------------------------
--
-- Revoke the blanket grant and re-issue it only over the fields a developer is
-- genuinely editing: the brief. Money, status, size and test type are ours.
--
-- `status` and `developer_id` are withheld outright -- there is no legitimate
-- client-side reason to write either. The commercial fields (price, tester
-- count, test type) stay grantable because a developer genuinely edits them
-- while building a draft; the trigger below is what stops them moving once the
-- job is quoted or paid.

revoke update on public.jobs from authenticated;

grant update (
  title,
  app_url,
  logo_url,
  platform,
  category,
  description,
  additional_info,
  tasks,
  focus_areas,
  target_scenario,
  test_objective,
  test_restrictions,
  test_workflow,
  lab_config,
  preferred_specializations,
  live_session_enabled,
  live_session_at,
  package_key,
  total_amount_zar,
  testers_needed,
  updated_at
) on public.jobs to authenticated;

-- ------------------------------------------------------------
-- 2. Trigger backstop
-- ------------------------------------------------------------
--
-- Column grants are invisible in the policy list and easy to widen by accident
-- in a later migration (`grant update on public.jobs to authenticated` is a
-- natural thing to type). This makes the rule explicit and loud.
--
-- Admins and the service role are trusted: the webhook activates jobs through
-- the service role, and admin tooling legitimately corrects job records.

create or replace function public.guard_job_commercial_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() or auth.uid() is null then
    return new;
  end if;

  if new.status is distinct from old.status then
    raise exception 'A job goes live when its payment succeeds, not on request'
      using errcode = 'check_violation';
  end if;

  if new.developer_id is distinct from old.developer_id then
    raise exception 'A job cannot be transferred to another account'
      using errcode = 'check_violation';
  end if;

  -- Price, tester count and test type stay editable while the job is an unpaid
  -- draft -- that is just someone still filling in the form, and blocking it
  -- would break the post-job flow for no security benefit.
  --
  -- They lock the moment the job leaves draft OR a payment has been started
  -- against it. The payment check is the important half: without it a developer
  -- could open checkout at R2 200, drop the total to R100 while the Yoco page
  -- sits open, and rely on the amount having already been captured.
  if new.total_amount_zar is distinct from old.total_amount_zar
     or new.testers_needed is distinct from old.testers_needed
     or new.package_key is distinct from old.package_key then

    if old.status is distinct from 'draft'::public.job_status then
      raise exception 'The price, tester count and test type cannot change once a job has been submitted'
        using errcode = 'check_violation';
    end if;

    if exists (
      select 1 from public.job_payments
      where job_id = old.id and status in ('creating', 'pending', 'succeeded')
    ) then
      raise exception 'This job already has a payment in progress, so its price cannot change'
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists jobs_guard_commercial_fields on public.jobs;
create trigger jobs_guard_commercial_fields
before update on public.jobs
for each row execute function public.guard_job_commercial_fields();

-- ------------------------------------------------------------
-- 3. A job cannot be created already active
-- ------------------------------------------------------------
--
-- The update path is now closed, so the obvious next move is to insert a job
-- that starts life active. `jobs.status` defaults to 'draft'; this makes the
-- default mandatory for non-admin inserts.

create or replace function public.guard_job_insert_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() or auth.uid() is null then
    return new;
  end if;

  if new.status is distinct from 'draft'::public.job_status then
    raise exception 'A new job starts as a draft and goes live once payment succeeds'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists jobs_guard_insert_status on public.jobs;
create trigger jobs_guard_insert_status
before insert on public.jobs
for each row execute function public.guard_job_insert_status();

commit;
