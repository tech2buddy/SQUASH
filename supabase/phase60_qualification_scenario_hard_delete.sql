-- Phase 60: "Remove" really removes a sample test.
--
-- Phase 59 quietly downgraded a delete to a deactivate whenever any tester had
-- been assigned the scenario. That is safe but surprising: admin presses
-- Remove, the test stays in the list, and the reason is buried in a toast.
--
-- This replaces it with an explicit two-step. The first call reports what is in
-- the way and changes nothing. The caller confirms, calls again with p_force,
-- and the scenario goes away for real -- with the affected testers handled
-- rather than orphaned:
--
--   * An attempt still in flight (quiz in progress / quiz passed / sample in
--     progress) is MOVED to another active sample test where one exists, so the
--     tester keeps their quiz result and simply gets a different practical.
--     With no other active test to move them to, the attempt is deleted and the
--     tester is reset to 'not_started' -- they start clean, and because the
--     attempt row is gone it does not burn one of their two tries.
--
--   * An attempt that has been SUBMITTED or REVIEWED is never touched. Its
--     report and reviewer decision are the record of how someone was admitted
--     to paid work; deleting that to tidy up a scenario list would destroy an
--     audit trail. Those block the hard delete and the scenario is retired
--     instead, with the count reported back so admin knows why.
--
-- Run after phase59.

begin;

-- The return type changes from text to jsonb, so the old signature has to go.
drop function if exists public.admin_delete_qualification_scenario(text);

create or replace function public.admin_delete_qualification_scenario(
  p_variant_key text,
  p_force boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text := nullif(trim(coalesce(p_variant_key, '')), '');
  v_in_flight integer;
  v_locked integer;
  v_target text;
  v_reassigned integer := 0;
  v_reset integer := 0;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;
  if v_key is null or not exists (
    select 1 from public.tester_qualification_variants where variant_key = v_key and kind = 'sample'
  ) then
    raise exception 'Sample test not found';
  end if;

  select
    count(*) filter (where status in ('quiz_in_progress', 'quiz_passed', 'sample_in_progress')),
    count(*) filter (where status in ('sample_submitted', 'approved', 'declined', 'retry_required'))
  into v_in_flight, v_locked
  from public.tester_qualification_attempts
  where sample_variant_key = v_key;

  -- Nothing in the way: straight delete, no confirmation needed.
  if v_in_flight = 0 and v_locked = 0 then
    delete from public.tester_qualification_variants where variant_key = v_key;
    return jsonb_build_object('outcome', 'deleted', 'inFlight', 0, 'locked', 0,
                              'reassigned', 0, 'reset', 0);
  end if;

  -- First pass: report what would happen and change nothing.
  if not coalesce(p_force, false) then
    return jsonb_build_object('outcome', 'in_use', 'inFlight', v_in_flight, 'locked', v_locked,
                              'reassigned', 0, 'reset', 0);
  end if;

  -- Submitted or reviewed attempts are history. Retire instead of destroying it.
  if v_locked > 0 then
    update public.tester_qualification_variants set is_active = false where variant_key = v_key;
    return jsonb_build_object('outcome', 'retired', 'inFlight', v_in_flight, 'locked', v_locked,
                              'reassigned', 0, 'reset', 0);
  end if;

  select v.variant_key into v_target
  from public.tester_qualification_variants v
  join public.tester_qualification_scenario_templates t on t.variant_key = v.variant_key
  where v.kind = 'sample' and v.is_active = true and v.variant_key <> v_key
  order by random()
  limit 1;

  if v_target is not null then
    update public.tester_qualification_attempts
    set sample_variant_key = v_target
    where sample_variant_key = v_key
      and status in ('quiz_in_progress', 'quiz_passed', 'sample_in_progress');
    get diagnostics v_reassigned = row_count;
  else
    -- No test to move them to. Reset cleanly rather than leaving an attempt
    -- pointing at a scenario that no longer exists.
    perform set_config('squash.qualification_write', 'on', true);
    update public.tester_profiles tp
    set qualification_status = 'not_started',
        qualification_approved_at = null,
        qualification_updated_at = now()
    where tp.user_id in (
      select a.tester_id from public.tester_qualification_attempts a
      where a.sample_variant_key = v_key
        and a.status in ('quiz_in_progress', 'quiz_passed', 'sample_in_progress')
    );

    delete from public.tester_qualification_attempts
    where sample_variant_key = v_key
      and status in ('quiz_in_progress', 'quiz_passed', 'sample_in_progress');
    get diagnostics v_reset = row_count;
  end if;

  delete from public.tester_qualification_variants where variant_key = v_key;

  return jsonb_build_object('outcome', 'deleted', 'inFlight', v_in_flight, 'locked', 0,
                            'reassigned', v_reassigned, 'reset', v_reset);
end;
$$;

revoke all on function public.admin_delete_qualification_scenario(text, boolean) from public;
grant execute on function public.admin_delete_qualification_scenario(text, boolean) to authenticated;

commit;
