-- Phase 59: real, admin-authored sample tests.
--
-- Phase 58 made the practical-sample *content* editable, but the set of
-- scenarios was still fixed: two demo rows ("checkout-flow-v1",
-- "booking-flow-v1") seeded from hardcoded training copy about a simulated
-- store and a simulated booking. Admin could reword them; admin could not
-- create a real one, retire a demo one, or point a tester at an actual product
-- to test. This phase makes the scenario list itself admin-owned.
--
-- Three things change:
--   1. A scenario can carry an app URL and access notes, so a sample test can
--      be a real job against a real build instead of a written exercise.
--   2. Admin can create, edit, activate/deactivate and remove scenarios
--      through two security-definer functions, so a scenario and its content
--      are always written together (a variant with no template row makes the
--      tester's sample stage fail with a 503).
--   3. A retry may reuse the only active scenario. Previously attempt 2 had to
--      use a *different* sample variant, which meant the flow silently
--      required two scenarios to exist forever -- with one real test set up, a
--      retrying tester hit "A distinct qualification variant is not available
--      yet" and could not continue.
--
-- Run after phase58.

begin;

-- 1. Real-product fields ------------------------------------------------------

-- `app_url` and `access_instructions` already exist on this table in the
-- SQUASH project database: they were added out-of-band on 2026-08-10, not by
-- any phase*.sql in this folder. These add-if-not-exists lines are here so the
-- migration also works on a database rebuilt from this folder alone. Do not
-- rename them to anything else -- both names are already being read and
-- written by live code.
alter table public.tester_qualification_scenario_templates
  add column if not exists app_url text,
  add column if not exists access_instructions text,
  add column if not exists test_title text;

-- Match the shape those columns already have in the SQUASH project database:
-- not null, defaulting to the empty string rather than null. Everything that
-- reads them treats '' as "not set".
update public.tester_qualification_scenario_templates
set app_url = coalesce(app_url, ''),
    access_instructions = coalesce(access_instructions, ''),
    test_title = coalesce(nullif(test_title, ''), (
      select v.title from public.tester_qualification_variants v
      where v.variant_key = tester_qualification_scenario_templates.variant_key
    ), '')
where app_url is null or access_instructions is null or coalesce(test_title, '') = '';

alter table public.tester_qualification_scenario_templates
  alter column app_url set default '',
  alter column access_instructions set default '',
  alter column test_title set default '';
alter table public.tester_qualification_scenario_templates
  alter column app_url set not null,
  alter column access_instructions set not null,
  alter column test_title set not null;

alter table public.tester_qualification_scenario_templates
  drop constraint if exists tester_qualification_scenario_templates_app_url_check;
alter table public.tester_qualification_scenario_templates
  add constraint tester_qualification_scenario_templates_app_url_check
  check (
    app_url is null
    or app_url = ''
    or (app_url ~ '^https://\S+$' and char_length(app_url) between 11 and 500)
  );
-- Length is checked with char_length, not inside the pattern: Postgres caps
-- bounded repetition {m,n} at n = 255, so '{3,500}' is an invalid regex and
-- raises on the first real URL.

alter table public.tester_qualification_scenario_templates
  drop constraint if exists tester_qualification_scenario_templates_access_instructions_check;
alter table public.tester_qualification_scenario_templates
  add constraint tester_qualification_scenario_templates_access_instructions_check
  check (access_instructions is null or char_length(access_instructions) <= 2000);

-- https only: the tester opens this link from their own browser and may enter
-- the sample credentials from access_instructions into it. A plain-http
-- staging link would put those on the wire in clear text.
--
-- The empty string is allowed alongside null purely because the existing rows
-- hold '' rather than null, and the out-of-band writer above sets ''. Treat ''
-- as "no link" everywhere that reads this column.

-- 2. A retry may reuse the only active scenario -------------------------------

alter table public.tester_qualification_attempts
  drop constraint if exists tester_qualification_sample_variant_unique;

-- The equivalent quiz constraint stays: two quiz variants ship with the
-- platform (qa-basics-v1/v2), so a retry can always get an unseen quiz, and
-- re-serving the same graded questions would make attempt 2 meaningless.

-- 3. Assignment: random active scenario, preferring one the tester has not
--    already been given. Also replaces the old "no variant available" error,
--    which was unactionable for a tester and did not tell an admin that the
--    real cause is an empty scenario list.

create or replace function public.begin_tester_qualification_attempt()
returns public.tester_qualification_attempts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt_count integer;
  v_quiz_variant text;
  v_sample_variant text;
  v_attempt public.tester_qualification_attempts;
begin
  if not public.is_tester() then
    raise exception 'Tester profile required';
  end if;

  if public.is_tester_qualified(auth.uid()) then
    raise exception 'Your tester account is already approved';
  end if;

  if exists (
    select 1 from public.tester_qualification_attempts
    where tester_id = auth.uid()
      and status in ('quiz_in_progress', 'quiz_passed', 'sample_in_progress', 'sample_submitted')
  ) then
    raise exception 'Complete or wait for review of your current qualification attempt';
  end if;

  select count(*) into v_attempt_count
  from public.tester_qualification_attempts
  where tester_id = auth.uid();

  if v_attempt_count >= 2 then
    raise exception 'No qualification attempts remain. Please contact SQUASH support.';
  end if;

  select variant_key into v_quiz_variant
  from public.tester_qualification_variants v
  where v.kind = 'quiz'
    and v.is_active = true
    and not exists (
      select 1 from public.tester_qualification_attempts a
      where a.tester_id = auth.uid() and a.quiz_variant_key = v.variant_key
    )
  order by v.variant_key
  limit 1;

  if v_quiz_variant is null then
    raise exception 'No QA foundations quiz is available for this attempt. Please contact SQUASH support.';
  end if;

  -- A scenario with no content row would fail the tester at the sample stage
  -- with "This practical sample is not available right now", so only complete
  -- scenarios are assignable.
  select v.variant_key into v_sample_variant
  from public.tester_qualification_variants v
  join public.tester_qualification_scenario_templates t on t.variant_key = v.variant_key
  where v.kind = 'sample'
    and v.is_active = true
    and not exists (
      select 1 from public.tester_qualification_attempts a
      where a.tester_id = auth.uid() and a.sample_variant_key = v.variant_key
    )
  order by random()
  limit 1;

  -- Nothing unseen left (typically: one active sample test, and this is the
  -- retry). Reuse an active one rather than dead-ending the tester.
  if v_sample_variant is null then
    select v.variant_key into v_sample_variant
    from public.tester_qualification_variants v
    join public.tester_qualification_scenario_templates t on t.variant_key = v.variant_key
    where v.kind = 'sample'
      and v.is_active = true
    order by random()
    limit 1;
  end if;

  if v_sample_variant is null then
    raise exception 'No sample test has been set up yet. Please contact SQUASH support.';
  end if;

  -- Set before the insert, not after. A trigger on
  -- tester_qualification_attempts (sync_tester_qualification_profile_status)
  -- updates tester_profiles.qualification_status as a side effect of this
  -- insert, and guard_tester_qualification_fields rejects any such write that
  -- is not flagged as coming from the review workflow. The guard exempts
  -- admins and service-role callers, so only a tester starting their own
  -- attempt hits it. set_config with is_local = true holds for the rest of the
  -- transaction, so one call before the insert covers the trigger's write and
  -- the explicit update below.
  perform set_config('squash.qualification_write', 'on', true);

  insert into public.tester_qualification_attempts (
    tester_id, attempt_number, quiz_variant_key, sample_variant_key
  ) values (
    auth.uid(), v_attempt_count + 1, v_quiz_variant, v_sample_variant
  ) returning * into v_attempt;

  update public.tester_profiles
  set qualification_status = 'quiz_in_progress',
      qualification_approved_at = null,
      qualification_updated_at = now()
  where user_id = auth.uid();

  return v_attempt;
end;
$$;

-- 4. Admin scenario management ------------------------------------------------

-- Creates or updates a scenario. The variant row (what the flow assigns) and
-- the template row (what the tester reads) are written in one transaction so
-- the pair can never be half-created. Pass p_variant_key null to create.
create or replace function public.admin_save_qualification_scenario(
  p_variant_key text,
  p_title text,
  p_product_name text,
  p_objective text,
  p_environment text,
  p_out_of_scope text,
  p_tasks jsonb,
  p_app_url text default null,
  p_access_instructions text default null,
  p_is_active boolean default true
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text := nullif(trim(coalesce(p_variant_key, '')), '');
  v_title text := nullif(trim(coalesce(p_title, '')), '');
  v_app_url text := nullif(trim(coalesce(p_app_url, '')), '');
  v_access_instructions text := nullif(trim(coalesce(p_access_instructions, '')), '');
  v_slug text;
  v_task jsonb;
  v_task_ids text[] := '{}';
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;

  if v_title is null or char_length(v_title) > 120 then
    raise exception 'Give this sample test a name of 1 to 120 characters';
  end if;
  if coalesce(char_length(trim(p_product_name)), 0) not between 1 and 120 then
    raise exception 'Add a product name of 1 to 120 characters';
  end if;
  if coalesce(char_length(trim(p_objective)), 0) not between 10 and 2000 then
    raise exception 'Add an objective of at least 10 characters';
  end if;
  if coalesce(char_length(trim(p_environment)), 0) not between 3 and 2000 then
    raise exception 'Describe the environment testers should use';
  end if;
  if coalesce(char_length(trim(p_out_of_scope)), 0) not between 3 and 2000 then
    raise exception 'Describe what is out of scope for this sample test';
  end if;
  if v_app_url is not null and (v_app_url !~ '^https://\S+$' or char_length(v_app_url) not between 11 and 500) then
    raise exception 'The app link must be a full https:// address';
  end if;
  if v_access_instructions is not null and char_length(v_access_instructions) > 2000 then
    raise exception 'Access instructions are too long';
  end if;

  if p_tasks is null or jsonb_typeof(p_tasks) <> 'array' or jsonb_array_length(p_tasks) = 0 then
    raise exception 'Add at least one task to this sample test';
  end if;
  if jsonb_array_length(p_tasks) > 20 then
    raise exception 'A sample test can have at most 20 tasks';
  end if;

  for v_task in select * from jsonb_array_elements(p_tasks) loop
    if jsonb_typeof(v_task) <> 'object'
      or coalesce(char_length(trim(v_task->>'id')), 0) not between 1 and 60
      or coalesce(char_length(trim(v_task->>'title')), 0) not between 1 and 200
      or coalesce(char_length(trim(v_task->>'instruction')), 0) not between 1 and 1000
      or coalesce(char_length(trim(v_task->>'expectedResult')), 0) not between 1 and 1000
    then
      raise exception 'Every task needs a title, an instruction and an expected result';
    end if;
    -- Task ids key the tester's per-task outcomes, so a duplicate would make
    -- two tasks share one answer.
    if (v_task->>'id') = any (v_task_ids) then
      raise exception 'Two tasks share the same id';
    end if;
    v_task_ids := v_task_ids || (v_task->>'id');
  end loop;

  if v_key is null then
    v_slug := trim(both '-' from regexp_replace(lower(v_title), '[^a-z0-9]+', '-', 'g'));
    if coalesce(char_length(v_slug), 0) = 0 then v_slug := 'sample-test'; end if;
    v_key := left(v_slug, 40) || '-' || substr(md5(gen_random_uuid()::text), 1, 6);

    insert into public.tester_qualification_variants (variant_key, kind, title, description, version, is_active)
    values (v_key, 'sample', v_title, '', 'v1', coalesce(p_is_active, true));
  else
    if not exists (
      select 1 from public.tester_qualification_variants
      where variant_key = v_key and kind = 'sample'
    ) then
      raise exception 'Sample test not found';
    end if;

    update public.tester_qualification_variants
    set title = v_title,
        is_active = coalesce(p_is_active, is_active)
    where variant_key = v_key;
  end if;

  -- test_title duplicates tester_qualification_variants.title. The variant row
  -- is the one the qualification flow reads, but the column exists and is not
  -- null, so it is kept in step here rather than left to drift.
  insert into public.tester_qualification_scenario_templates as t (
    variant_key, product_name, objective, environment, out_of_scope,
    tasks, app_url, access_instructions, test_title, updated_by
  ) values (
    v_key, trim(p_product_name), trim(p_objective), trim(p_environment), trim(p_out_of_scope),
    p_tasks, coalesce(v_app_url, ''), coalesce(v_access_instructions, ''), v_title, auth.uid()
  )
  on conflict (variant_key) do update set
    product_name = excluded.product_name,
    objective = excluded.objective,
    environment = excluded.environment,
    out_of_scope = excluded.out_of_scope,
    tasks = excluded.tasks,
    app_url = excluded.app_url,
    access_instructions = excluded.access_instructions,
    test_title = excluded.test_title,
    updated_by = excluded.updated_by,
    updated_at = now();

  return v_key;
end;
$$;

-- Removing a scenario a tester is part-way through would break their attempt
-- (the sample stage reads the template every time the page loads, and the
-- attempt row's foreign key points at the variant). So: delete when nothing
-- references it, otherwise retire it. Returns which one happened.
create or replace function public.admin_delete_qualification_scenario(p_variant_key text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text := nullif(trim(coalesce(p_variant_key, '')), '');
  v_in_use boolean;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;
  if v_key is null or not exists (
    select 1 from public.tester_qualification_variants where variant_key = v_key and kind = 'sample'
  ) then
    raise exception 'Sample test not found';
  end if;

  select exists (
    select 1 from public.tester_qualification_attempts where sample_variant_key = v_key
  ) into v_in_use;

  if v_in_use then
    update public.tester_qualification_variants set is_active = false where variant_key = v_key;
    return 'retired';
  end if;

  -- The template row is removed by the variant's on delete cascade.
  delete from public.tester_qualification_variants where variant_key = v_key;
  return 'deleted';
end;
$$;

-- 5. Retire the seeded demo scenarios ----------------------------------------
--
-- These were training copy ("no real payment is taken", "no real booking is
-- created"), not a real test. Same rule as the delete function: anything a
-- tester has already been assigned is deactivated rather than deleted, so an
-- in-flight attempt keeps working.

update public.tester_qualification_variants v
set is_active = false
where v.variant_key in ('checkout-flow-v1', 'booking-flow-v1')
  and exists (
    select 1 from public.tester_qualification_attempts a where a.sample_variant_key = v.variant_key
  );

delete from public.tester_qualification_variants v
where v.variant_key in ('checkout-flow-v1', 'booking-flow-v1')
  and not exists (
    select 1 from public.tester_qualification_attempts a where a.sample_variant_key = v.variant_key
  );

-- 6. Grants -------------------------------------------------------------------

-- api/tester-qualification-sample.ts reads the variant title with the service
-- role key to label the tester's brief. It had no select privilege here, so
-- that read has always come back empty and the page silently fell back to the
-- product name. RLS bypass is not table privilege -- see HANDOFF.md phase37.
grant select on public.tester_qualification_variants to service_role;

revoke all on function public.admin_save_qualification_scenario(text, text, text, text, text, text, jsonb, text, text, boolean) from public;
revoke all on function public.admin_delete_qualification_scenario(text) from public;
grant execute on function public.admin_save_qualification_scenario(text, text, text, text, text, text, jsonb, text, text, boolean) to authenticated;
grant execute on function public.admin_delete_qualification_scenario(text) to authenticated;

commit;
