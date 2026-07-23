-- ============================================================
-- SQUASH Phase 14: Automated Cron Jobs
-- ============================================================
-- Run this in your Supabase SQL editor ONCE.
-- It sets up 4 scheduled background jobs that run automatically.
--
-- Prerequisites:
--   - Phases 1-13 must already be applied.
--   - pg_cron must be enabled in your Supabase project settings:
--     Dashboard > Database > Extensions > pg_cron (toggle ON)
-- ============================================================

-- Enable the pg_cron extension (safe to run if already enabled)
create extension if not exists pg_cron with schema extensions;

-- Grant usage so our scheduled jobs can fire
grant usage on schema cron to postgres;

-- ============================================================
-- INTERNAL HELPER: create_notification_internal
-- ============================================================
-- The existing create_notification() function requires is_admin() check.
-- Cron jobs run as postgres superuser so they need a bypass version.
-- This function is SECURITY DEFINER and not exposed to authenticated users.
-- ============================================================

create or replace function public.create_notification_internal(
  target_user_id uuid,
  notification_title text,
  notification_body text,
  notification_type text default 'general',
  link_path text default null,
  action_label text default null,
  priority text default 'normal',
  metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  created_id uuid;
begin
  insert into public.notifications (
    user_id,
    title,
    body,
    notification_type,
    link_path,
    action_label,
    priority,
    metadata
  ) values (
    target_user_id,
    notification_title,
    notification_body,
    notification_type,
    link_path,
    action_label,
    priority,
    coalesce(metadata, '{}'::jsonb)
  )
  returning id into created_id;

  return created_id;
end;
$$;

-- Revoke public access — only postgres/cron can call this
revoke execute on function public.create_notification_internal from public, authenticated, anon;
grant execute on function public.create_notification_internal to postgres;


-- ============================================================
-- JOB 1: Deadline Reminder
-- Runs every hour at :00
-- Finds active test assignments due within the next 2 hours
-- and sends the tester a reminder notification.
-- ============================================================

create or replace function public.cron_deadline_reminders()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  for r in
    select
      ta.tester_id,
      j.title as job_title,
      ta.due_at,
      ta.id as assignment_id
    from public.test_assignments ta
    join public.jobs j on j.id = ta.job_id
    where
      ta.status = 'active'
      and ta.due_at is not null
      -- Due within the next 2 hours
      and ta.due_at > now()
      and ta.due_at <= now() + interval '2 hours'
      -- Don't spam: no reminder notification sent for this assignment in the last 2 hours
      and not exists (
        select 1 from public.notifications n
        where n.user_id = ta.tester_id
          and n.metadata->>'assignment_id' = ta.id::text
          and n.notification_type = 'job_match'
          and n.created_at > now() - interval '2 hours'
      )
  loop
    perform public.create_notification_internal(
      target_user_id    => r.tester_id,
      notification_title => 'Deadline Approaching ⏰',
      notification_body  => format(
        'Don''t forget! You have %s hours left to submit your report for "%s".',
        round(extract(epoch from (r.due_at - now())) / 3600)::text,
        r.job_title
      ),
      notification_type => 'job_match',
      link_path         => '/active-test',
      priority          => 'high',
      metadata          => jsonb_build_object('assignment_id', r.assignment_id)
    );
  end loop;
end;
$$;


-- ============================================================
-- JOB 2: Inactivity Timeout
-- Runs every day at midnight (00:00 UTC)
-- Finds active assignments that are past their due_at deadline
-- and marks them as 'expired', then notifies the tester.
-- ============================================================

create or replace function public.cron_expire_overdue_assignments()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  for r in
    select
      ta.id as assignment_id,
      ta.tester_id,
      j.title as job_title,
      j.developer_id
    from public.test_assignments ta
    join public.jobs j on j.id = ta.job_id
    where
      ta.status = 'active'
      and ta.due_at is not null
      and ta.due_at < now()
  loop
    -- Mark assignment as expired
    update public.test_assignments
    set status = 'expired'
    where id = r.assignment_id;

    -- Notify the tester
    perform public.create_notification_internal(
      target_user_id    => r.tester_id,
      notification_title => 'Assignment Expired ⏳',
      notification_body  => format(
        'Your test assignment for "%s" has expired due to inactivity. Apply to new jobs to keep earning.',
        r.job_title
      ),
      notification_type => 'report',
      link_path         => '/tester-jobs',
      priority          => 'normal'
    );

    -- Notify the developer too
    perform public.create_notification_internal(
      target_user_id    => r.developer_id,
      notification_title => 'Tester Assignment Expired 🔄',
      notification_body  => format(
        'A tester did not complete their assignment for "%s" in time. The slot is now available again.',
        r.job_title
      ),
      notification_type => 'report',
      link_path         => '/developer/reports',
      priority          => 'normal'
    );
  end loop;
end;
$$;


-- ============================================================
-- JOB 3: Level Up Checker
-- Runs every day at 01:00 UTC
-- Checks if any tester has crossed a new tests_completed threshold
-- and sends them a congratulations notification.
--
-- Level tiers:
--   Level 1:   1 test  (First test!)
--   Level 2:   5 tests
--   Level 3:  10 tests
--   Level 4:  25 tests
--   Level 5:  50 tests
--   Level 6: 100 tests (Elite)
-- ============================================================

create or replace function public.cron_level_up_checker()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  tester_level integer;
  level_label  text;
begin
  for r in
    select
      tp.user_id,
      tp.tests_completed
    from public.tester_profiles tp
    where tp.tests_completed in (1, 5, 10, 25, 50, 100)
    -- Only notify once per milestone: no existing level-up notification with this exact count
    and not exists (
      select 1 from public.notifications n
      where n.user_id = tp.user_id
        and n.notification_type = 'security'
        and n.metadata->>'milestone_tests' = tp.tests_completed::text
    )
  loop
    -- Determine level and label
    case r.tests_completed
      when 1   then tester_level := 1; level_label := 'Rookie';
      when 5   then tester_level := 2; level_label := 'Apprentice';
      when 10  then tester_level := 3; level_label := 'Intermediate';
      when 25  then tester_level := 4; level_label := 'Advanced';
      when 50  then tester_level := 5; level_label := 'Expert';
      when 100 then tester_level := 6; level_label := 'Elite';
      else tester_level := 0; level_label := 'Tester';
    end case;

    perform public.create_notification_internal(
      target_user_id    => r.user_id,
      notification_title => format('Level Up! You are now Level %s', tester_level),
      notification_body  => format(
        'Congratulations! You have completed %s tests and reached the "%s" tier. Keep it up!',
        r.tests_completed,
        level_label
      ),
      notification_type => 'security',
      link_path         => '/tester/profile',
      priority          => 'high',
      metadata          => jsonb_build_object('milestone_tests', r.tests_completed, 'level', tester_level)
    );
  end loop;
end;
$$;


-- ============================================================
-- JOB 4: New Job Match Alerts
-- Runs every day at 09:00 UTC
-- Finds testers whose specializations match newly posted jobs
-- and sends them a personalised "Perfect Match" notification.
-- Only alerts once per tester per job (uses metadata dedup).
-- ============================================================

create or replace function public.cron_job_match_alerts()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  for r in
    select distinct
      ts.tester_id,
      j.id as job_id,
      j.title as job_title,
      j.platform
    from public.tester_specializations ts
    -- Match testers who have a specialization listed in the job's preferred_specializations
    join public.jobs j
      on ts.specialization_key = any(j.preferred_specializations)
    where
      j.status = 'active'
      -- Only jobs posted in the last 24 hours
      and j.created_at > now() - interval '24 hours'
      -- Tester hasn't already applied
      and not exists (
        select 1 from public.job_applications ja
        where ja.job_id = j.id and ja.tester_id = ts.tester_id
      )
      -- Tester hasn't already been notified about this job
      and not exists (
        select 1 from public.notifications n
        where n.user_id = ts.tester_id
          and n.notification_type = 'job_match'
          and n.metadata->>'job_id' = j.id::text
      )
  loop
    perform public.create_notification_internal(
      target_user_id    => r.tester_id,
      notification_title => 'Perfect Match',
      notification_body  => format(
        'A new "%s" job matches your skills: "%s". Apply now before spots fill up!',
        r.platform,
        r.job_title
      ),
      notification_type => 'job_match',
      link_path         => '/tester-jobs',
      priority          => 'normal',
      metadata          => jsonb_build_object('job_id', r.job_id)
    );
  end loop;
end;
$$;


-- ============================================================
-- SCHEDULE THE CRON JOBS
-- ============================================================

-- Remove any existing schedules first (safe to rerun)
select cron.unschedule('squash-deadline-reminders') where exists (
  select 1 from cron.job where jobname = 'squash-deadline-reminders'
);
select cron.unschedule('squash-expire-overdue-assignments') where exists (
  select 1 from cron.job where jobname = 'squash-expire-overdue-assignments'
);
select cron.unschedule('squash-level-up-checker') where exists (
  select 1 from cron.job where jobname = 'squash-level-up-checker'
);
select cron.unschedule('squash-job-match-alerts') where exists (
  select 1 from cron.job where jobname = 'squash-job-match-alerts'
);

-- Job 1: Deadline Reminders — every hour
select cron.schedule(
  'squash-deadline-reminders',
  '0 * * * *',
  $$ select public.cron_deadline_reminders(); $$
);

-- Job 2: Expire Overdue Assignments — every day at midnight UTC
select cron.schedule(
  'squash-expire-overdue-assignments',
  '0 0 * * *',
  $$ select public.cron_expire_overdue_assignments(); $$
);

-- Job 3: Level Up Checker — every day at 1am UTC
select cron.schedule(
  'squash-level-up-checker',
  '0 1 * * *',
  $$ select public.cron_level_up_checker(); $$
);

-- Job 4: Job Match Alerts — every day at 9am UTC
select cron.schedule(
  'squash-job-match-alerts',
  '0 9 * * *',
  $$ select public.cron_job_match_alerts(); $$
);

-- ============================================================
-- VERIFICATION (run after applying this file)
--
--   select * from cron.job;
--   select * from cron.job_run_details order by start_time desc limit 10;
--
-- ============================================================
