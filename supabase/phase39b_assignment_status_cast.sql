-- Phase 39b: completes the phase 39 enum cast fix.
--
-- Phase 39 fixed `set status = p_status` in review_job_application but
-- missed a second text -> enum assignment further down the same function,
-- in the ON CONFLICT clause:
--
--   status = case when public.test_assignments.status = 'approved'
--                 then 'approved' else 'active' end
--
-- so accepting a tester still failed, just one line later:
--
--   42804: column "status" is of type assignment_status
--          but expression is of type text
--
-- Why a bare literal works but this does not: in `SET col = 'active'` the
-- untyped literal is coerced straight to the column's type. A CASE has to
-- resolve its own result type first, before the assignment target is
-- considered -- and with every branch an untyped literal it resolves to
-- `text`, which then cannot be assigned to the enum column.
--
-- Audited the rest of these functions for the same pattern; every other
-- status assignment is either a bare literal (fine) or an already
-- enum-typed plpgsql variable (fine). This is the last one.

create or replace function public.review_job_application(p_application_id uuid, p_status text)
returns public.job_applications language plpgsql security definer set search_path = public as $$
declare v_application public.job_applications; v_job public.jobs;
begin
  if p_status not in ('accepted', 'rejected') then raise exception 'Invalid application status'; end if;
  select * into v_application from public.job_applications where id = p_application_id for update;
  if not found then raise exception 'Application not found'; end if;
  select * into v_job from public.jobs where id = v_application.job_id;
  if not found or (v_job.developer_id <> auth.uid() and not public.is_admin()) then raise exception 'Not authorized'; end if;

  update public.job_applications
    set status = p_status::public.application_status, updated_at = now()
    where id = p_application_id returning * into v_application;

  if p_status = 'accepted' then
    insert into public.test_assignments (job_id, tester_id, application_id, status)
    values (v_application.job_id, v_application.tester_id, v_application.id, 'active')
    on conflict (job_id, tester_id) do update
      set application_id = excluded.application_id,
          -- Preserve an already-approved assignment; otherwise (re)activate.
          status = (case
            when public.test_assignments.status = 'approved' then 'approved'
            else 'active'
          end)::public.assignment_status,
          updated_at = now();
  end if;

  return v_application;
end;
$$;

revoke all on function public.review_job_application(uuid, text) from public;
grant execute on function public.review_job_application(uuid, text) to authenticated;
