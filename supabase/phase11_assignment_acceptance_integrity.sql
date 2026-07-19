-- SQUASH Phase 11 - Tester assignment acceptance integrity
-- Run this after the main schema and Phase 10 RLS fixes.
-- It makes accepted tester applications appear as active tester assignments.

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'test_assignments_job_tester_unique'
      and conrelid = 'public.test_assignments'::regclass
  ) then
    alter table public.test_assignments
    add constraint test_assignments_job_tester_unique unique (job_id, tester_id);
  end if;
end $$;

insert into public.test_assignments (job_id, tester_id, application_id, status)
select
  ja.job_id,
  ja.tester_id,
  ja.id,
  'active'::public.assignment_status
from public.job_applications ja
where ja.status = 'accepted'
on conflict (job_id, tester_id) do update
set
  application_id = excluded.application_id,
  status = case
    when public.test_assignments.status = 'approved'::public.assignment_status then public.test_assignments.status
    else 'active'::public.assignment_status
  end,
  updated_at = now();
