-- SQUASH Phase 12 Tester Growth, Notifications, Referrals and Leaderboard
-- Run this after supabase/schema.sql and phases 2-11.
-- This phase supports the tester notification center, referral tracking,
-- safe payout preference metadata, and a quality-first leaderboard.
-- It exposes only role-safe operational data.

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Safer payout method metadata
-- ------------------------------------------------------------
-- Store only masked/non-sensitive payout details in SQUASH tables.
-- Full bank/card/payment verification should live with a secure payment/payout provider.

alter table public.payout_methods
add column if not exists verification_status text not null default 'unverified'
  check (verification_status in ('unverified', 'pending', 'verified', 'rejected')),
add column if not exists provider_reference text,
add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists payout_methods_tester_default_idx
on public.payout_methods(tester_id, is_default);

create unique index if not exists payout_methods_one_default_per_tester_idx
on public.payout_methods(tester_id)
where is_default = true;

-- ------------------------------------------------------------
-- Rich notifications
-- ------------------------------------------------------------
-- Existing notifications table is extended instead of replaced.

alter table public.notifications
add column if not exists notification_type text not null default 'general'
  check (notification_type in ('general', 'job_match', 'application', 'report', 'payout', 'security', 'admin_request')),
add column if not exists priority text not null default 'normal'
  check (priority in ('low', 'normal', 'high', 'urgent')),
add column if not exists action_label text,
add column if not exists metadata jsonb not null default '{}'::jsonb,
add column if not exists read_at timestamptz,
add column if not exists expires_at timestamptz;

create index if not exists notifications_type_created_idx
on public.notifications(user_id, notification_type, created_at desc);

create index if not exists notifications_unread_idx
on public.notifications(user_id, created_at desc)
where status = 'unread';

-- Tighten update permissions so users can mark notifications read without editing message content.
revoke update on public.notifications from authenticated;
grant select on public.notifications to authenticated;
grant update (status, read_at) on public.notifications to authenticated;
grant insert on public.notifications to authenticated;

-- Existing RLS policies still restrict insert to admins and select/update to owner/admin.
-- Replace update policy so read_at and status are the intended owner/admin update path.
drop policy if exists "notifications_owner_mark_read" on public.notifications;
create policy "notifications_owner_mark_read" on public.notifications
for update using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

-- Helper for creating notifications from trusted database functions/admin tools.
create or replace function public.create_notification(
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
  if not public.is_admin() then
    raise exception 'Only admins can create notifications directly';
  end if;

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

-- ------------------------------------------------------------
-- Tester referral system
-- ------------------------------------------------------------
-- Referral rewards should be approved only after real work is approved.
-- This table tracks invites and lifecycle, not automatic money movement.

do $$ begin
  create type public.referral_status as enum ('invited', 'signed_up', 'approved_work', 'reward_ready', 'rewarded', 'cancelled');
exception when duplicate_object then null;
end $$;

alter table public.tester_profiles
add column if not exists referral_code text;

create unique index if not exists tester_profiles_referral_code_unique_idx
on public.tester_profiles(lower(referral_code))
where referral_code is not null;

create table if not exists public.tester_referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.tester_profiles(user_id) on delete cascade,
  referred_user_id uuid references public.tester_profiles(user_id) on delete set null,
  referred_email text not null,
  referral_code text not null,
  status public.referral_status not null default 'invited',
  reward_amount_zar integer check (reward_amount_zar is null or reward_amount_zar >= 0),
  reward_payout_id uuid references public.payouts(id) on delete set null,
  admin_note text,
  metadata jsonb not null default '{}'::jsonb,
  signed_up_at timestamptz,
  approved_work_at timestamptz,
  reward_ready_at timestamptz,
  rewarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tester_referrals_email_lowercase check (referred_email = lower(referred_email)),
  constraint tester_referrals_no_self_referral check (referred_user_id is null or referred_user_id <> referrer_id)
);

create unique index if not exists tester_referrals_referrer_email_unique_idx
on public.tester_referrals(referrer_id, referred_email);

create index if not exists tester_referrals_referrer_idx
on public.tester_referrals(referrer_id, status, created_at desc);

create index if not exists tester_referrals_referred_user_idx
on public.tester_referrals(referred_user_id, status);

create index if not exists tester_referrals_code_idx
on public.tester_referrals(lower(referral_code));

drop trigger if exists tester_referrals_set_updated_at on public.tester_referrals;
create trigger tester_referrals_set_updated_at
before update on public.tester_referrals
for each row execute function public.set_updated_at();

alter table public.tester_referrals enable row level security;

drop policy if exists "tester_referrals_select_related_or_admin" on public.tester_referrals;
create policy "tester_referrals_select_related_or_admin" on public.tester_referrals
for select using (
  public.is_admin()
  or referrer_id = auth.uid()
  or referred_user_id = auth.uid()
);

drop policy if exists "tester_referrals_insert_own" on public.tester_referrals;
create policy "tester_referrals_insert_own" on public.tester_referrals
for insert with check (
  referrer_id = auth.uid()
  and public.is_tester()
  and status = 'invited'::public.referral_status
  and referred_user_id is null
  and reward_amount_zar is null
  and reward_payout_id is null
);

drop policy if exists "tester_referrals_update_admin_only" on public.tester_referrals;
create policy "tester_referrals_update_admin_only" on public.tester_referrals
for update using (public.is_admin()) with check (public.is_admin());

-- Authenticated users can prepare invites; only admins can update lifecycle/rewards.
grant select, insert on public.tester_referrals to authenticated;
grant update on public.tester_referrals to authenticated;

-- Generate stable referral codes for tester profiles missing one.
create or replace function public.ensure_tester_referral_code(target_tester_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_code text;
  candidate text;
begin
  select referral_code into existing_code
  from public.tester_profiles
  where user_id = target_tester_id;

  if existing_code is not null and length(existing_code) > 0 then
    return existing_code;
  end if;

  loop
    candidate := upper(substr(encode(extensions.gen_random_bytes(6), 'hex'), 1, 8));
    exit when not exists (
      select 1 from public.tester_profiles
      where lower(referral_code) = lower(candidate)
    );
  end loop;

  update public.tester_profiles
  set referral_code = candidate
  where user_id = target_tester_id;

  return candidate;
end;
$$;

select public.ensure_tester_referral_code(user_id)
from public.tester_profiles
where referral_code is null;

-- ------------------------------------------------------------
-- Quality-first leaderboard
-- ------------------------------------------------------------
-- This view intentionally exposes no payment, payout, or developer spend details.
-- It uses public tester profiles only and approved/paid submissions as the primary signal.

create or replace view public.tester_leaderboard
with (security_invoker = true)
as
with approved_submissions as (
  select
    ts.tester_id,
    count(*)::integer as approved_tests,
    coalesce(avg(
      (
        coalesce(ts.usability_score, 0)
        + coalesce(ts.performance_score, 0)
        + coalesce(ts.onboarding_score, 0)
        + coalesce(ts.bug_severity_score, 0)
        + coalesce(ts.device_compatibility_score, 0)
      ) / 5.0
    ), 0) as average_squash_score
  from public.test_submissions ts
  where ts.status = 'approved'::public.submission_status
  group by ts.tester_id
), bug_quality as (
  select
    br.tester_id,
    count(*)::integer as bug_reports_count,
    count(*) filter (where br.video_path is not null)::integer as video_reports_count
  from public.bug_reports br
  group by br.tester_id
)
select
  tp.user_id as tester_id,
  p.full_name,
  p.city,
  tp.rating,
  tp.tests_completed,
  tp.approval_rate,
  coalesce(a.approved_tests, 0)::integer as approved_tests,
  round(coalesce(a.average_squash_score, 0))::integer as average_squash_score,
  coalesce(b.bug_reports_count, 0)::integer as bug_reports_count,
  coalesce(b.video_reports_count, 0)::integer as video_reports_count,
  case
    when coalesce(a.approved_tests, tp.tests_completed) >= 50 and tp.rating >= 4.8 then 'elite'
    when coalesce(a.approved_tests, tp.tests_completed) >= 21 and tp.rating >= 4.5 then 'pro'
    when coalesce(a.approved_tests, tp.tests_completed) >= 6 and tp.rating >= 4.0 then 'verified'
    else 'new'
  end as tier,
  (
    (coalesce(a.approved_tests, 0) * 12)
    + round(tp.rating * 80)::integer
    + round(tp.approval_rate * 2)::integer
    + least(coalesce(b.bug_reports_count, 0), 50)
    + least(coalesce(b.video_reports_count, 0) * 2, 40)
  )::integer as quality_score,
  row_number() over (
    order by
      (
        (coalesce(a.approved_tests, 0) * 12)
        + round(tp.rating * 80)::integer
        + round(tp.approval_rate * 2)::integer
        + least(coalesce(b.bug_reports_count, 0), 50)
        + least(coalesce(b.video_reports_count, 0) * 2, 40)
      ) desc,
      tp.rating desc,
      tp.tests_completed desc,
      p.created_at asc
  )::integer as rank
from public.tester_profiles tp
join public.profiles p on p.id = tp.user_id
left join approved_submissions a on a.tester_id = tp.user_id
left join bug_quality b on b.tester_id = tp.user_id
where tp.is_public = true;

grant select on public.tester_leaderboard to authenticated;

-- Admin audit helper entries can use existing admin_activity_logs when available.
-- No seed data is inserted here: production leaderboard/referral data must come from real user activity.

notify pgrst, 'reload schema';


