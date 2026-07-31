-- SQUASH Phase 57: what one logged-in tester can read about another
--
-- Correction to phase 56. That phase column-limited `anon` and stopped there,
-- which closed the unauthenticated scrape but left the authenticated one wide
-- open -- and a free tester account is trivially obtained, so the two are worth
-- roughly the same to an attacker.
--
-- Both of these policies have an `is_public = true` branch, and is_public
-- defaults to true:
--
--   tester_profiles_public_or_own_or_admin
--   tester_specializations_read_public_or_own_or_admin
--
-- So any signed-in user could read, for essentially every tester on the
-- platform:
--
--   available_balance_zar        -- what they are owed
--   preferred_payout_method      -- how they get paid
--   verification_strikes         -- disciplinary record
--   premium_types_blocked_until  -- whether they are currently banned
--   probation_status / probation_note / probation_reviewer_id
--   qualification_status
--   verification_note            -- reviewer's private assessment
--   revoked_reason               -- a mandatory 20+ character written
--                                   accusation of fraud, about a named person
--   evidence_path                -- their user UUID
--
-- A tester could enumerate their competition's earnings and disciplinary
-- history. Under POPIA that is a notifiable problem, and revoked_reason is a
-- defamation exposure on top.
--
-- The fix is to stop treating "public profile" as "public row". A listed
-- profile should expose reputation, not the record SQUASH keeps about someone.

begin;

-- ------------------------------------------------------------
-- 1. The base tables become need-to-know
-- ------------------------------------------------------------
--
-- Remaining readers, all of which already have their own policy:
--   * the tester themselves
--   * administrators
--   * a developer with an application from that tester
--     (tester_profiles_select_developer_applicants /
--      tester_specializations_select_developer_applicants, both unchanged --
--      and both already limited to safe columns by the client queries)
--
-- Everyone else reads the curated view in section 2 instead.

drop policy if exists "tester_profiles_public_or_own_or_admin" on public.tester_profiles;
create policy "tester_profiles_own_or_admin" on public.tester_profiles
for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "tester_specializations_read_public_or_own_or_admin" on public.tester_specializations;
create policy "tester_specializations_own_or_admin" on public.tester_specializations
for select using (tester_id = auth.uid() or public.is_admin());

-- ------------------------------------------------------------
-- 2. A curated public face
-- ------------------------------------------------------------
--
-- `tester_leaderboard` already exists (phase 12) and already exposes exactly
-- the right shape: name, city, rating, counts, tier, rank. Nothing sensitive.
--
-- It was declared `security_invoker = true`, which means it ran under the
-- caller's RLS -- and since `profiles` has never had a public-read branch, it
-- was already returning almost nothing to an ordinary tester. Flipping it to a
-- definer view makes the public leaderboard actually work *and* lets section 1
-- lock the base tables, because this becomes the single sanctioned path for
-- reading another tester's reputation.
--
-- Safe to run as definer precisely because the column list is fixed and
-- curated. Do not add columns to this view without re-reading the list above.

drop view if exists public.tester_leaderboard;

create view public.tester_leaderboard
with (security_invoker = false)
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

-- ------------------------------------------------------------
-- 3. Public specializations, without the case file
-- ------------------------------------------------------------
--
-- A listed tester advertising "isiZulu, verified" is the point of phases 47-52.
-- How that verification was decided, and any accusation attached to it, is
-- between the tester and SQUASH.

create or replace view public.tester_public_specializations
with (security_invoker = false)
as
select
  ts.tester_id,
  ts.specialization_key,
  ts.verification_status,
  ts.verified_at,
  ts.expires_at
from public.tester_specializations ts
join public.tester_profiles tp on tp.user_id = ts.tester_id
where tp.is_public = true
  -- Only states a tester would want advertised. 'rejected' and 'revoked' are
  -- outcomes of a review and stay private; an unverified claim is not a
  -- credential and is not worth publishing either.
  and ts.verification_status = 'approved';

grant select on public.tester_public_specializations to authenticated;

-- Anon deliberately gets neither view. Phase 56 established that no public page
-- queries tester data; if one is ever added, grant it this view explicitly
-- rather than reopening the base tables.

commit;
