-- Phase 36: Wire the tester notification toggles up to real behavior.
-- Before this phase, every toggle in Settings > Notifications saved a value
-- to user_settings.toggles that nothing ever read back -- notifications were
-- sent unconditionally regardless of what a tester turned off.
-- See supabase/README.md "Phase 36" section for the full mapping.

-- ------------------------------------------------------------
-- Helper: read a tester's saved preference, defaulting to true
-- (send it) when they have no settings row yet or the key is unset.
-- ------------------------------------------------------------

create or replace function public.user_wants_notification(p_user_id uuid, p_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select (toggles ->> p_key)::boolean from public.user_settings where user_id = p_user_id),
    true
  );
$$;

revoke all on function public.user_wants_notification(uuid, text) from public;
grant execute on function public.user_wants_notification(uuid, text) to authenticated, postgres;

-- ------------------------------------------------------------
-- "Show specialization tags" -- lets a developer's session check which
-- of a batch of testers (e.g. applicants to their own jobs) have opted
-- out of showing specialization tags, without being able to read those
-- testers' user_settings rows directly (RLS only allows reading your
-- own row). Only returns which IDs are hidden, not any other setting.
-- ------------------------------------------------------------

create or replace function public.get_testers_hiding_specializations(p_tester_ids uuid[])
returns uuid[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(user_id), array[]::uuid[])
  from public.user_settings
  where user_id = any(p_tester_ids)
    and (toggles ->> 'showSpecializations')::boolean = false;
$$;

revoke all on function public.get_testers_hiding_specializations(uuid[]) from public;
grant execute on function public.get_testers_hiding_specializations(uuid[]) to authenticated;

-- ------------------------------------------------------------
-- "New test invites" -- gate the existing job-match cron alert.
-- ------------------------------------------------------------

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
    join public.jobs j
      on ts.specialization_key = any(j.preferred_specializations)
    where
      j.status = 'active'
      and j.created_at > now() - interval '24 hours'
      and not exists (
        select 1 from public.job_applications ja
        where ja.job_id = j.id and ja.tester_id = ts.tester_id
      )
      and not exists (
        select 1 from public.notifications n
        where n.user_id = ts.tester_id
          and n.notification_type = 'job_match'
          and n.metadata->>'job_id' = j.id::text
      )
      and public.user_wants_notification(ts.tester_id, 'newInvites')
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

-- ------------------------------------------------------------
-- "Payout alerts" -- notify the tester when a payout actually
-- clears (marked paid), gated by their preference.
-- ------------------------------------------------------------

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
    status = p_status,
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
      notification_title => 'Payout Sent 💸',
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

-- ------------------------------------------------------------
-- "Weekly summary" -- new cron job, runs every Monday 08:00 UTC.
-- Only sends to testers who completed a test or had earnings
-- approved in the past 7 days, and who have not disabled it.
-- ------------------------------------------------------------

create or replace function public.cron_weekly_summary()
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
      tp.user_id,
      count(distinct s.id) filter (where s.status = 'approved' and s.submitted_at > now() - interval '7 days') as approved_this_week,
      coalesce(sum(floor(j.total_amount_zar::numeric * 0.62 / nullif(j.testers_needed, 0)))
        filter (where s.status = 'approved' and s.submitted_at > now() - interval '7 days'), 0) as earned_this_week
    from public.tester_profiles tp
    join public.test_submissions s on s.tester_id = tp.user_id
    join public.jobs j on j.id = s.job_id
    where public.user_wants_notification(tp.user_id, 'weeklySummary')
    group by tp.user_id
    having count(distinct s.id) filter (where s.status = 'approved' and s.submitted_at > now() - interval '7 days') > 0
  loop
    perform public.create_notification_internal(
      target_user_id    => r.user_id,
      notification_title => 'Your Week on SQUASH',
      notification_body  => format(
        'You had %s approved test%s this week and earned R%s. Keep it up!',
        r.approved_this_week,
        case when r.approved_this_week = 1 then '' else 's' end,
        r.earned_this_week
      ),
      notification_type => 'security',
      link_path         => '/tester/earnings',
      priority          => 'normal'
    );
  end loop;
end;
$$;

select cron.unschedule('squash-weekly-summary') where exists (
  select 1 from cron.job where jobname = 'squash-weekly-summary'
);

select cron.schedule(
  'squash-weekly-summary',
  '0 8 * * 1',
  $$ select public.cron_weekly_summary(); $$
);
