-- Phase 35c: Diagnostic only -- does not modify anything.
-- Run this if Phase 35 / 35b still fails with a package_key check violation.
-- It shows the exact package_key value (with visible quoting/length) for any
-- row that does not match one of the six valid test types, so we can see
-- whether it's a legacy value, an empty string, stray whitespace, or
-- something else entirely.

select
  id,
  title,
  quote_literal(package_key) as package_key_literal,
  length(package_key) as package_key_length,
  test_workflow,
  created_at,
  updated_at
from public.jobs
where package_key is null
   or package_key not in ('bug-hunting', 'onboarding', 'usability', 'low-data', 'localization', 'accessibility');
