-- Apply before enabling new paid jobs. Server checkout also validates this.
-- Existing rows are left untouched; only new jobs and commercial edits are checked.
begin;

create or replace function public.guard_job_price()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_rate integer;
  v_minimum integer;
begin
  if tg_op = 'UPDATE' then
    if new.package_key is not distinct from old.package_key
      and new.testers_needed is not distinct from old.testers_needed
      and new.total_amount_zar is not distinct from old.total_amount_zar
      and new.live_session_enabled is not distinct from old.live_session_enabled then
      return new;
    end if;
  end if;

  -- The live-session add-on has no booking/fulfilment flow yet. Existing paid
  -- jobs remain readable, but a new or edited draft cannot sell the add-on.
  if new.live_session_enabled then
    raise exception 'Live sessions are not available for online checkout yet'
      using errcode = 'check_violation';
  end if;

  select rate, minimum into v_rate, v_minimum
  from (values
    ('bug-hunting', 100, 5), ('onboarding', 90, 3),
    ('usability', 140, 5), ('low-data', 150, 3),
    ('localization', 180, 3), ('accessibility', 220, 3)
  ) as pricing(key, rate, minimum)
  where pricing.key = new.package_key;

  if v_rate is null or new.testers_needed < v_minimum
    or new.testers_needed > 1000
    or new.total_amount_zar <> v_rate * new.testers_needed then
    raise exception 'Job price or tester count does not match the selected test type'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists jobs_guard_price on public.jobs;
create trigger jobs_guard_price
before insert or update on public.jobs
for each row execute function public.guard_job_price();

commit;
