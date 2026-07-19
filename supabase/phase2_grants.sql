-- SQUASH Phase 2 grants
-- Run this after schema.sql and phase2_auth.sql.
-- RLS still controls row-level access. These grants only allow Supabase auth roles to reach the tables.

grant usage on schema public to anon, authenticated;

-- Authenticated users need table privileges so RLS policies can evaluate and return only allowed rows.
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.developer_profiles to authenticated;
grant select, insert, update, delete on public.tester_profiles to authenticated;
grant select, insert, update, delete on public.tester_specializations to authenticated;
grant select, insert, update on public.jobs to authenticated;
grant select, insert, update on public.job_applications to authenticated;
grant select, insert, update on public.test_assignments to authenticated;
grant select, insert, update on public.test_submissions to authenticated;
grant select, insert, update on public.bug_reports to authenticated;
grant select, insert, update, delete on public.payout_methods to authenticated;
grant select on public.payouts to authenticated;
grant select, update on public.notifications to authenticated;

-- Public visitors may eventually read active jobs/certificates through RLS-safe public views.
-- Keep direct anon table access limited for now.
grant select on public.jobs to anon;
grant select on public.tester_profiles to anon;
grant select on public.tester_specializations to anon;
