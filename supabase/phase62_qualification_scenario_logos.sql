-- Phase 62: a logo for each sample test.
--
-- `logo_url` already exists on tester_qualification_scenario_templates (added
-- out-of-band on 2026-08-10, like app_url and access_instructions), but there
-- was nowhere to upload one and nothing read it. The tester's brief fell back
-- to the first letter of the product name in a circle.
--
-- This adds the storage bucket and lets admin_save_qualification_scenario
-- carry the value. Mirrors phase9's job-logos setup, with two differences:
-- only an administrator may write here, and SVG is not accepted -- these
-- images are chosen by staff, not customers, so the narrower MIME list costs
-- nothing and keeps an script-bearing SVG out of a bucket served publicly.
--
-- Run after phase61.

begin;

alter table public.tester_qualification_scenario_templates
  add column if not exists logo_url text;

update public.tester_qualification_scenario_templates
set logo_url = coalesce(logo_url, '')
where logo_url is null;

alter table public.tester_qualification_scenario_templates
  alter column logo_url set default '';
alter table public.tester_qualification_scenario_templates
  alter column logo_url set not null;

alter table public.tester_qualification_scenario_templates
  drop constraint if exists tester_qualification_scenario_templates_logo_url_check;
alter table public.tester_qualification_scenario_templates
  add constraint tester_qualification_scenario_templates_logo_url_check
  check (
    logo_url = ''
    or (logo_url ~ '^https://\S+$' and char_length(logo_url) between 11 and 500)
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'qualification-logos',
  'qualification-logos',
  true,
  1048576,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read: the tester's brief renders this straight from an <img>, and the
-- tester is not an administrator. Nothing sensitive lives in this bucket.
drop policy if exists "Anyone can read qualification logos" on storage.objects;
create policy "Anyone can read qualification logos"
on storage.objects for select
using (bucket_id = 'qualification-logos');

drop policy if exists "Admins can upload qualification logos" on storage.objects;
create policy "Admins can upload qualification logos"
on storage.objects for insert to authenticated
with check (bucket_id = 'qualification-logos' and public.is_admin());

drop policy if exists "Admins can update qualification logos" on storage.objects;
create policy "Admins can update qualification logos"
on storage.objects for update to authenticated
using (bucket_id = 'qualification-logos' and public.is_admin())
with check (bucket_id = 'qualification-logos' and public.is_admin());

drop policy if exists "Admins can delete qualification logos" on storage.objects;
create policy "Admins can delete qualification logos"
on storage.objects for delete to authenticated
using (bucket_id = 'qualification-logos' and public.is_admin());

-- The signature gains p_logo_url, so the old one has to be dropped rather than
-- replaced -- leaving both would make the named-argument call from the client
-- ambiguous.
drop function if exists public.admin_save_qualification_scenario(text, text, text, text, text, text, jsonb, text, text, boolean);

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
  p_logo_url text default null,
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
  v_logo_url text := nullif(trim(coalesce(p_logo_url, '')), '');
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
  if v_logo_url is not null and (v_logo_url !~ '^https://\S+$' or char_length(v_logo_url) not between 11 and 500) then
    raise exception 'The logo link must be a full https:// address';
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

  insert into public.tester_qualification_scenario_templates as t (
    variant_key, product_name, objective, environment, out_of_scope,
    tasks, app_url, access_instructions, logo_url, test_title, updated_by
  ) values (
    v_key, trim(p_product_name), trim(p_objective), trim(p_environment), trim(p_out_of_scope),
    p_tasks, coalesce(v_app_url, ''), coalesce(v_access_instructions, ''),
    coalesce(v_logo_url, ''), v_title, auth.uid()
  )
  on conflict (variant_key) do update set
    product_name = excluded.product_name,
    objective = excluded.objective,
    environment = excluded.environment,
    out_of_scope = excluded.out_of_scope,
    tasks = excluded.tasks,
    app_url = excluded.app_url,
    access_instructions = excluded.access_instructions,
    logo_url = excluded.logo_url,
    test_title = excluded.test_title,
    updated_by = excluded.updated_by,
    updated_at = now();

  return v_key;
end;
$$;

revoke all on function public.admin_save_qualification_scenario(text, text, text, text, text, text, jsonb, text, text, text, boolean) from public;
grant execute on function public.admin_save_qualification_scenario(text, text, text, text, text, text, jsonb, text, text, text, boolean) to authenticated;

commit;
