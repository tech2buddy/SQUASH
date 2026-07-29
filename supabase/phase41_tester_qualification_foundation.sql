-- SQUASH Phase 41: Tester qualification foundation
--
-- Creates the durable qualification records used by the Tester Academy,
-- sample-test review, and approval gate. Existing tester profiles are
-- grandfathered as approved so this migration does not interrupt current users.
--
-- The job-application RLS gate is deliberately enabled in Phase 5, after the
-- tester-facing Academy and the admin review queue are available.

begin;

alter table public.tester_profiles
  add column if not exists qualification_status text not null default 'not_started'
    check (qualification_status in ('not_started', 'quiz_in_progress', 'quiz_passed', 'sample_submitted', 'retry_required', 'approved', 'declined')),
  add column if not exists qualification_approved_at timestamptz,
  add column if not exists qualification_updated_at timestamptz not null default now();

-- Preserve the first rollout time so re-running this migration never approves
-- testers who registered after qualifications were introduced.
create table if not exists public.tester_qualification_rollout (
  singleton boolean primary key default true check (singleton),
  grandfather_before timestamptz not null
);
insert into public.tester_qualification_rollout (singleton, grandfather_before)
values (true, now())
on conflict (singleton) do nothing;

-- Everyone who already had a tester profile before this rollout keeps access.
update public.tester_profiles tp
set qualification_status = 'approved',
    qualification_approved_at = coalesce(tp.qualification_approved_at, now()),
    qualification_updated_at = now()
from public.tester_qualification_rollout rollout
where tp.qualification_status = 'not_started'
  and tp.created_at <= rollout.grandfather_before;

create index if not exists tester_profiles_qualification_status_idx
  on public.tester_profiles(qualification_status, qualification_updated_at desc);

create table if not exists public.tester_qualification_variants (
  variant_key text primary key,
  kind text not null check (kind in ('quiz', 'sample')),
  title text not null,
  description text not null default '',
  version text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists tester_qualification_variants_set_updated_at on public.tester_qualification_variants;
create trigger tester_qualification_variants_set_updated_at
before update on public.tester_qualification_variants
for each row execute function public.set_updated_at();

-- A retry can never reuse the same quiz or practical-test variant.
insert into public.tester_qualification_variants (variant_key, kind, title, description, version)
values
  ('qa-basics-v1', 'quiz', 'QA foundations', 'Structured reporting, evidence, severity and tester conduct.', 'v1'),
  ('qa-basics-v2', 'quiz', 'QA foundations: alternate', 'A distinct QA foundations assessment used for retry attempts.', 'v1'),
  ('checkout-flow-v1', 'sample', 'Sample test: checkout flow', 'A controlled SQUASH training scenario focused on checkout testing.', 'v1'),
  ('booking-flow-v1', 'sample', 'Sample test: booking flow', 'A different controlled SQUASH training scenario used for retry attempts.', 'v1')
on conflict (variant_key) do update set
  title = excluded.title,
  description = excluded.description,
  version = excluded.version,
  updated_at = now();

create table if not exists public.tester_qualification_attempts (
  id uuid primary key default gen_random_uuid(),
  tester_id uuid not null references public.tester_profiles(user_id) on delete cascade,
  attempt_number smallint not null check (attempt_number between 1 and 2),
  quiz_variant_key text not null references public.tester_qualification_variants(variant_key),
  sample_variant_key text not null references public.tester_qualification_variants(variant_key),
  status text not null default 'quiz_in_progress'
    check (status in ('quiz_in_progress', 'quiz_passed', 'sample_in_progress', 'sample_submitted', 'retry_required', 'approved', 'declined')),
  quiz_score smallint check (quiz_score >= 0),
  quiz_total smallint check (quiz_total > 0),
  quiz_passed_at timestamptz,
  sample_submitted_at timestamptz,
  reviewer_id uuid references public.profiles(id) on delete set null,
  reviewer_note text check (reviewer_note is null or char_length(reviewer_note) <= 3000),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tester_qualification_attempt_number_unique unique (tester_id, attempt_number),
  constraint tester_qualification_quiz_variant_unique unique (tester_id, quiz_variant_key),
  constraint tester_qualification_sample_variant_unique unique (tester_id, sample_variant_key),
  constraint tester_qualification_variants_must_differ check (quiz_variant_key <> sample_variant_key)
);

create index if not exists tester_qualification_attempts_tester_idx
  on public.tester_qualification_attempts(tester_id, created_at desc);
create index if not exists tester_qualification_attempts_review_idx
  on public.tester_qualification_attempts(status, sample_submitted_at asc)
  where status = 'sample_submitted';

drop trigger if exists tester_qualification_attempts_set_updated_at on public.tester_qualification_attempts;
create trigger tester_qualification_attempts_set_updated_at
before update on public.tester_qualification_attempts
for each row execute function public.set_updated_at();

create table if not exists public.tester_qualification_consents (
  id uuid primary key default gen_random_uuid(),
  tester_id uuid not null references public.tester_profiles(user_id) on delete cascade,
  policy_slug text not null check (policy_slug in ('tester-code-of-conduct', 'privacy')),
  policy_version text not null check (char_length(trim(policy_version)) between 1 and 50),
  accepted_at timestamptz not null default now(),
  constraint tester_qualification_consents_unique unique (tester_id, policy_slug, policy_version)
);

create index if not exists tester_qualification_consents_tester_idx
  on public.tester_qualification_consents(tester_id, accepted_at desc);

-- Qualification fields cannot be self-approved through the existing broad
-- tester_profiles update policy. Secure workflow functions set this local flag.
create or replace function public.guard_tester_qualification_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin()
     and current_setting('squash.qualification_write', true) is distinct from 'on'
     and (
       new.qualification_status is distinct from old.qualification_status
       or new.qualification_approved_at is distinct from old.qualification_approved_at
       or new.qualification_updated_at is distinct from old.qualification_updated_at
     ) then
    raise exception 'Qualification status is managed by the SQUASH review workflow';
  end if;
  return new;
end;
$$;

drop trigger if exists tester_profiles_guard_qualification_fields on public.tester_profiles;
create trigger tester_profiles_guard_qualification_fields
before update on public.tester_profiles
for each row execute function public.guard_tester_qualification_fields();

create or replace function public.is_tester_qualified(p_tester_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p_tester_id is null then false
    when p_tester_id <> auth.uid() and not public.is_admin() then false
    else exists (
      select 1
      from public.tester_profiles tp
      join public.profiles p on p.id = tp.user_id
      where tp.user_id = p_tester_id
        and tp.qualification_status = 'approved'
        and p.account_status = 'active'
    )
  end;
$$;

-- This assigns a different quiz and practical sample variant on a retry.
-- The function is intentionally the only tester-side way to create an attempt.
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

  select variant_key into v_sample_variant
  from public.tester_qualification_variants v
  where v.kind = 'sample'
    and v.is_active = true
    and not exists (
      select 1 from public.tester_qualification_attempts a
      where a.tester_id = auth.uid() and a.sample_variant_key = v.variant_key
    )
  order by v.variant_key
  limit 1;

  if v_quiz_variant is null or v_sample_variant is null then
    raise exception 'A distinct qualification variant is not available yet';
  end if;

  insert into public.tester_qualification_attempts (
    tester_id, attempt_number, quiz_variant_key, sample_variant_key
  ) values (
    auth.uid(), v_attempt_count + 1, v_quiz_variant, v_sample_variant
  ) returning * into v_attempt;

  perform set_config('squash.qualification_write', 'on', true);
  update public.tester_profiles
  set qualification_status = 'quiz_in_progress',
      qualification_approved_at = null,
      qualification_updated_at = now()
  where user_id = auth.uid();

  return v_attempt;
end;
$$;

create or replace function public.record_tester_qualification_consent(
  p_policy_slug text,
  p_policy_version text
)
returns public.tester_qualification_consents
language plpgsql
security definer
set search_path = public
as $$
declare
  v_consent public.tester_qualification_consents;
begin
  if not public.is_tester() then
    raise exception 'Tester profile required';
  end if;
  if p_policy_slug not in ('tester-code-of-conduct', 'privacy') then
    raise exception 'Unsupported qualification policy';
  end if;
  if coalesce(char_length(trim(p_policy_version)), 0) = 0 then
    raise exception 'Policy version is required';
  end if;

  insert into public.tester_qualification_consents (tester_id, policy_slug, policy_version)
  values (auth.uid(), p_policy_slug, trim(p_policy_version))
  on conflict (tester_id, policy_slug, policy_version) do update
    set accepted_at = public.tester_qualification_consents.accepted_at
  returning * into v_consent;

  return v_consent;
end;
$$;

alter table public.tester_qualification_variants enable row level security;
alter table public.tester_qualification_attempts enable row level security;
alter table public.tester_qualification_consents enable row level security;

drop policy if exists "qualification_variants_admin_only" on public.tester_qualification_variants;
drop policy if exists "qualification_attempts_select_own_or_admin" on public.tester_qualification_attempts;
drop policy if exists "qualification_attempts_admin_update" on public.tester_qualification_attempts;
drop policy if exists "qualification_attempts_admin_delete" on public.tester_qualification_attempts;
drop policy if exists "qualification_consents_select_own_or_admin" on public.tester_qualification_consents;

create policy "qualification_variants_admin_only" on public.tester_qualification_variants
for all using (public.is_admin()) with check (public.is_admin());

create policy "qualification_attempts_select_own_or_admin" on public.tester_qualification_attempts
for select using (tester_id = auth.uid() or public.is_admin());
create policy "qualification_attempts_admin_update" on public.tester_qualification_attempts
for update using (public.is_admin()) with check (public.is_admin());
create policy "qualification_attempts_admin_delete" on public.tester_qualification_attempts
for delete using (public.is_admin());

create policy "qualification_consents_select_own_or_admin" on public.tester_qualification_consents
for select using (tester_id = auth.uid() or public.is_admin());

revoke all on table public.tester_qualification_variants from anon, authenticated;
revoke all on table public.tester_qualification_attempts from anon, authenticated;
revoke all on table public.tester_qualification_consents from anon, authenticated;
grant select on public.tester_qualification_attempts, public.tester_qualification_consents to authenticated;

revoke all on function public.is_tester_qualified(uuid) from public;
revoke all on function public.begin_tester_qualification_attempt() from public;
revoke all on function public.record_tester_qualification_consent(text, text) from public;
grant execute on function public.is_tester_qualified(uuid) to authenticated;
grant execute on function public.begin_tester_qualification_attempt() to authenticated;
grant execute on function public.record_tester_qualification_consent(text, text) to authenticated;

notify pgrst, 'reload schema';

commit;
