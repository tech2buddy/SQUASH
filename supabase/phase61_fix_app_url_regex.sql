-- Phase 61: fix an invalid regex shipped in phase59.
--
-- phase59 validated the sample-test app link with '^https://[^\s]{3,500}$'.
-- Postgres caps bounded repetition {m,n} at n = 255, so that pattern is not a
-- valid regex at all. It stayed hidden because every existing row had
-- app_url = '' and the `or app_url = ''` branch short-circuited before the
-- pattern was ever evaluated -- the first real https link raised
-- "invalid regular expression: invalid repetition count(s)", which would have
-- hit an admin the moment they saved a sample test with a link.
--
-- Length is now enforced with char_length, outside the pattern. phase59 has
-- been corrected in place as well, so a database rebuilt from this folder
-- never creates the broken constraint; this migration is for the database
-- where phase59 already ran.
--
-- Run after phase60.

begin;

alter table public.tester_qualification_scenario_templates
  drop constraint if exists tester_qualification_scenario_templates_app_url_check;
alter table public.tester_qualification_scenario_templates
  add constraint tester_qualification_scenario_templates_app_url_check
  check (
    app_url is null
    or app_url = ''
    or (app_url ~ '^https://\S+$' and char_length(app_url) between 11 and 500)
  );

-- admin_save_qualification_scenario carried the same pattern in its own
-- validation; it is recreated from the phase59 body with only that line
-- changed. See phase59 for the full rationale of the function.

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

revoke all on function public.admin_save_qualification_scenario(text, text, text, text, text, text, jsonb, text, text, boolean) from public;
grant execute on function public.admin_save_qualification_scenario(text, text, text, text, text, text, jsonb, text, text, boolean) to authenticated;

commit;
