-- SQUASH Phase 56: stop leaking to the open internet
--
-- `phase2_grants.sql` gave `anon` blanket SELECT on jobs, tester_profiles and
-- tester_specializations. That was defensible when those tables held only
-- marketing-shaped data. It is not defensible now, and the anon key is public by
-- design, so everything below is a bulk scrape rather than a targeted read.
--
-- Three leaks, worst first:
--
-- 1. Reviewer accusations. Phases 47 and 51 added verification_note,
--    revoked_reason and evidence_path to tester_specializations without
--    re-checking that anon could read the table. Phase 51 *requires* a written
--    reason of 20+ characters to revoke -- so "reused video, suspected
--    fraudulent isiZulu claim", attached to a named person, was world-readable.
--    That is a defamation exposure, not merely a privacy one. evidence_path
--    additionally leaked tester UUIDs.
--
-- 2. Wallet balances. tester_profiles.available_balance_zar and
--    preferred_payout_method were readable for every tester whose profile is
--    listed (is_public defaults to true).
--
-- 3. Customers' staging URLs. jobs.app_url for every active job -- unreleased
--    apps belonging to paying developers, enumerable by anyone.
--
-- The fix is the same shape in each case: anon keeps the columns the public
-- product genuinely needs and loses the rest. Column-level SELECT grants are
-- used rather than new policies, because a policy cannot filter columns.

begin;

-- ------------------------------------------------------------
-- 1. Specializations: keys yes, review notes no
-- ------------------------------------------------------------
--
-- A public tester profile advertising "isiZulu, verified" is the point of the
-- feature. How that verification was decided is between the tester and SQUASH.

revoke select on public.tester_specializations from anon;

grant select (
  id,
  tester_id,
  specialization_key,
  verification_status,
  verified_at,
  expires_at,
  created_at
) on public.tester_specializations to anon;

-- Authenticated non-owners reach this table through the same policy, so the
-- same reasoning applies: a developer reviewing an applicant needs to know a
-- specialization is verified, not to read the reviewer's private notes about
-- them. Owners and admins still see everything -- they go through
-- getTesterSpecializationDetails, whose policy branch is unchanged, and column
-- grants apply per-statement rather than per-row.
--
-- NOTE: this means a *tester's own* full row is still readable by them, which
-- is correct -- they are entitled to know why they were rejected or revoked.

-- ------------------------------------------------------------
-- 2. Tester profiles: reputation yes, money no
-- ------------------------------------------------------------

revoke select on public.tester_profiles from anon;

grant select (
  user_id,
  bio,
  rating,
  tests_completed,
  approval_rate,
  is_public,
  qualification_status,
  referral_code,
  created_at,
  updated_at
) on public.tester_profiles to anon;

-- available_balance_zar, preferred_payout_method, verification_strikes,
-- premium_types_blocked_until and every probation column are withheld. A
-- tester's balance, banking preference and disciplinary history are nobody
-- else's business, least of all an unauthenticated caller's.

-- ------------------------------------------------------------
-- 3. Jobs: the shop window, not the keys
-- ------------------------------------------------------------
--
-- The public job board needs enough to advertise work. It does not need the
-- developer's unreleased app URL, their private brief, or the internal test
-- configuration -- those belong to testers who have been accepted onto the job.

revoke select on public.jobs from anon;

grant select (
  id,
  title,
  platform,
  category,
  package_key,
  total_amount_zar,
  testers_needed,
  preferred_specializations,
  logo_url,
  status,
  created_at,
  updated_at
) on public.jobs to anon;

-- app_url, description, tasks, focus_areas, additional_info, target_scenario,
-- test_objective, test_restrictions and lab_config are now authenticated-only.
-- Signed-in testers still read them through jobs_select_visible; the anon key
-- alone no longer returns a directory of pre-release staging environments.

-- ------------------------------------------------------------
-- 4. The one table without RLS
-- ------------------------------------------------------------
--
-- tester_qualification_rollout has neither RLS nor explicit grants, and stock
-- Supabase projects apply ALTER DEFAULT PRIVILEGES granting public-schema tables
-- to anon and authenticated -- so it was probably both readable and writable.
--
-- Impact is low: grandfather_before is only read by a one-time backfill inside
-- phase 41 itself, so changing it now does nothing. Closed as hygiene, and so
-- the "every table has RLS" invariant is actually true.

alter table public.tester_qualification_rollout enable row level security;

drop policy if exists "qualification_rollout_admin_only" on public.tester_qualification_rollout;
create policy "qualification_rollout_admin_only" on public.tester_qualification_rollout
for all using (public.is_admin()) with check (public.is_admin());

revoke all on public.tester_qualification_rollout from anon, authenticated;
grant select on public.tester_qualification_rollout to authenticated;

commit;
