-- SQUASH Phase 4 Developer applicant review policies
-- Run this after supabase/schema.sql and phase2/phase3 scripts.
-- Developers can read applicant profile details only for testers who applied to their own jobs.

drop policy if exists "profiles_select_developer_applicants" on public.profiles;
create policy "profiles_select_developer_applicants" on public.profiles
for select using (
  public.is_developer()
  and exists (
    select 1
    from public.job_applications ja
    join public.jobs j on j.id = ja.job_id
    where ja.tester_id = profiles.id
      and j.developer_id = auth.uid()
  )
);

drop policy if exists "tester_profiles_select_developer_applicants" on public.tester_profiles;
create policy "tester_profiles_select_developer_applicants" on public.tester_profiles
for select using (
  public.is_developer()
  and exists (
    select 1
    from public.job_applications ja
    join public.jobs j on j.id = ja.job_id
    where ja.tester_id = tester_profiles.user_id
      and j.developer_id = auth.uid()
  )
);

drop policy if exists "tester_specializations_select_developer_applicants" on public.tester_specializations;
create policy "tester_specializations_select_developer_applicants" on public.tester_specializations
for select using (
  public.is_developer()
  and exists (
    select 1
    from public.job_applications ja
    join public.jobs j on j.id = ja.job_id
    where ja.tester_id = tester_specializations.tester_id
      and j.developer_id = auth.uid()
  )
);
