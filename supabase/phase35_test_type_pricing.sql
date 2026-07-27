-- Phase 35: Replace tester-count packages with per-test-type pricing.
-- jobs.package_key previously held 'starter' | 'growth' | 'pro' | 'enterprise'
-- (flat tester-count tiers). It now holds which kind of test was ordered:
-- 'bug-hunting' | 'onboarding' | 'usability' | 'low-data' | 'localization' | 'accessibility'.
-- See supabase/README.md "Phase 35" section for rates and rationale.
--
-- This assumes no production jobs rows exist yet with the old package_key
-- values (pre-launch beta). If real job rows already use starter/growth/pro/
-- enterprise, back-fill/remap them to a test type before running this, or
-- the constraint below will fail to validate existing rows.

alter table public.jobs drop constraint if exists jobs_package_key_check;

alter table public.jobs add constraint jobs_package_key_check
  check (package_key in ('bug-hunting', 'onboarding', 'usability', 'low-data', 'localization', 'accessibility'));
