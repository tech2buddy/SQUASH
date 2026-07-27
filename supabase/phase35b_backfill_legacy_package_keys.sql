-- Phase 35b: Backfill legacy package_key values before applying the Phase 35
-- constraint. Run this if Phase 35 failed with:
--   ERROR: 23514: check constraint "jobs_package_key_check" ... is violated
--
-- This means some existing jobs rows still use the old starter/growth/pro/
-- enterprise values. Those rows keep their existing total_amount_zar and
-- testers_needed untouched -- only the package_key label changes, so nothing
-- already charged or paid is affected. Legacy rows are mapped to
-- 'bug-hunting' as the closest general-purpose test type.
--
-- Order matters here: the old constraint must be dropped BEFORE the backfill
-- update runs, otherwise the update itself gets rejected by the old
-- constraint (it only allows starter/growth/pro/enterprise, not the new test
-- type values). If a prior run of this file's statements failed partway
-- through in one transaction, the DROP may have been rolled back along with
-- everything else -- this file is safe to re-run from the top either way.

alter table public.jobs drop constraint if exists jobs_package_key_check;

update public.jobs
set package_key = 'bug-hunting'
where package_key not in ('bug-hunting', 'onboarding', 'usability', 'low-data', 'localization', 'accessibility');

alter table public.jobs add constraint jobs_package_key_check
  check (package_key in ('bug-hunting', 'onboarding', 'usability', 'low-data', 'localization', 'accessibility'));
