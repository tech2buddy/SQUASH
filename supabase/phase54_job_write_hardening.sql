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
-- Note the omissions and why:
--   status              -- set by the payment webhook and admin workflow
--   total_amount_zar    -- derived from package_key x testers_needed
--   testers_needed      -- changes the price after it has been quoted
--   package_key         -- changes the rate, and gates verification (phase 47)
--   developer_id        -- reassigning a job to another account

revoke update on public.jobs from authenticated;

grant update (
  title,
  app_url,
  logo_url,
  platform,
  category,
  description,
  tasks,
  focus_areas,
  preferred_specializations,
  live_session_enabled,
  live_session_at,
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

  if new.total_amount_zar is distinct from old.total_amount_zar
     or new.testers_needed is distinct from old.testers_needed
     or new.package_key is distinct from old.package_key then
    raise exception 'The price, tester count and test type of a job cannot be changed after it is created'
      using errcode = 'check_violation';
  end if;

  if new.developer_id is distinct from old.developer_id then
    raise exception 'A job cannot be transferred to another account'
      using errcode = 'check_violation';
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
