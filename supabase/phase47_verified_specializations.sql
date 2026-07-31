-- SQUASH Phase 47: verified tester specializations
--
-- Until now a specialization was a self-declared checkbox. A tester ticked
-- "Zulu / isiZulu" or "2G/3G only testing" and the platform took it on trust:
-- the keys drove notification matching (phase 14) and were shown to developers
-- as tags, but nothing verified them and nothing gated on them.
--
-- That is a problem for the three premium test types, because their price is
-- justified entirely by an unverified human attribute:
--
--   localization  R180  "native-speaker testing across South African languages"
--   low-data      R150  "real-world testing on 2G/3G network conditions"
--   accessibility R220  "testing with real assistive-technology users"
--
-- A tester who speaks no isiZulu could apply to, be accepted onto, and be paid
-- for an R180 localization job. This phase closes that: a specialization now
-- carries a verification status, only an administrator can approve one, and
-- applications to a restricted test type are refused in the database unless the
-- tester holds an approved match.
--
-- The verification model deliberately mirrors tester_banking_details (phase 20)
-- and review_tester_qualification_attempt (phase 43): the tester supplies
-- evidence, an admin decides through a security-definer function, and the gate
-- is enforced inside the database rather than in the UI.

begin;

-- ------------------------------------------------------------
-- 1. Verification state on tester_specializations
-- ------------------------------------------------------------

alter table public.tester_specializations
  add column if not exists verification_status text not null default 'declared'
    check (verification_status in ('declared', 'pending', 'approved', 'rejected')),
  add column if not exists verification_note text,
  add column if not exists evidence_path text,
  add column if not exists evidence_name text,
  add column if not exists submitted_at timestamptz,
  add column if not exists verified_at timestamptz,
  add column if not exists verified_by uuid references auth.users(id) on delete set null;

-- Existing rows stay 'declared'. They are NOT grandfathered into 'approved' --
-- every one of them is an unverified self-declaration, and treating them as
-- verified would defeat the point of this phase.
comment on column public.tester_specializations.verification_status is
  'declared = self-declared only (cannot satisfy a restricted test type); pending = evidence submitted, awaiting admin review; approved = admin-verified; rejected = admin declined.';

create index if not exists tester_specializations_verification_idx
  on public.tester_specializations(verification_status, specialization_key);

create index if not exists tester_specializations_pending_review_idx
  on public.tester_specializations(submitted_at desc)
  where verification_status = 'pending';

-- ------------------------------------------------------------
-- 2. Testers cannot write their own verification state
-- ------------------------------------------------------------
--
-- tester_specializations_manage_own is a permissive "for all" policy, so a
-- tester can insert and update their own rows directly -- which is correct for
-- declaring a specialization, but must not let them set verification_status to
-- 'approved'. Rather than tighten the policy (which would break the existing
-- replaceTesterSpecializations path), a trigger forces the verification columns
-- back to a safe state on any write that did not come from one of the
-- security-definer functions below. Same set_config guard used by phase 43.

create or replace function public.guard_specialization_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Writes from submit_specialization_evidence / review_tester_specialization
  -- set this flag for the duration of their transaction and are trusted.
  if coalesce(current_setting('squash.specialization_write', true), '') = 'on' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.verification_status := 'declared';
    new.verification_note := null;
    new.evidence_path := null;
    new.evidence_name := null;
    new.submitted_at := null;
    new.verified_at := null;
    new.verified_by := null;
    return new;
  end if;

  -- On a direct update, preserve whatever the reviewer decided. A tester
  -- editing their profile must never be able to escalate or clear it.
  new.verification_status := old.verification_status;
  new.verification_note := old.verification_note;
  new.evidence_path := old.evidence_path;
  new.evidence_name := old.evidence_name;
  new.submitted_at := old.submitted_at;
  new.verified_at := old.verified_at;
  new.verified_by := old.verified_by;
  return new;
end;
$$;

drop trigger if exists tester_specializations_guard_verification on public.tester_specializations;
create trigger tester_specializations_guard_verification
before insert or update on public.tester_specializations
for each row execute function public.guard_specialization_verification();

-- ------------------------------------------------------------
-- 3. Which test types require a verified specialization
-- ------------------------------------------------------------
--
-- Data-driven rather than hard-coded in the trigger, so the requirement set can
-- be adjusted without a code deploy. A test type with no rows here is
-- unrestricted -- bug-hunting, onboarding and usability deliberately have none,
-- because "an ordinary South African with a phone" is the whole point of them.
--
-- The specialization_key values must stay in step with SPECIALIZATION_GROUPS in
-- src/components/testerSpecializations.ts.

create table if not exists public.test_type_specialization_requirements (
  package_key text not null,
  specialization_key text not null,
  created_at timestamptz not null default now(),
  primary key (package_key, specialization_key)
);

alter table public.test_type_specialization_requirements enable row level security;

drop policy if exists "test_type_requirements_read_all" on public.test_type_specialization_requirements;
create policy "test_type_requirements_read_all" on public.test_type_specialization_requirements
for select using (true);

drop policy if exists "test_type_requirements_admin_write" on public.test_type_specialization_requirements;
create policy "test_type_requirements_admin_write" on public.test_type_specialization_requirements
for all using (public.is_admin()) with check (public.is_admin());

grant select on public.test_type_specialization_requirements to authenticated, anon;
grant insert, update, delete on public.test_type_specialization_requirements to authenticated;

insert into public.test_type_specialization_requirements (package_key, specialization_key)
values
  -- Localization: one of the South African language skills. English is
  -- excluded on purpose -- an English-only tester is not what R180 buys.
  ('localization', 'zulu'),
  ('localization', 'xhosa'),
  ('localization', 'sotho'),
  ('localization', 'afrikaans'),
  ('localization', 'venda'),
  ('localization', 'tsonga'),
  -- Low-data: genuinely constrained network conditions.
  ('low-data', '2g-3g-only'),
  ('low-data', 'township-network'),
  ('low-data', 'rural-network'),
  -- Accessibility: real assistive-technology use.
  ('accessibility', 'screen-reader'),
  ('accessibility', 'screen-magnification'),
  ('accessibility', 'switch-or-motor'),
  ('accessibility', 'deaf-hard-of-hearing'),
  ('accessibility', 'colour-vision'),
  ('accessibility', 'cognitive-support')
on conflict (package_key, specialization_key) do nothing;

-- ------------------------------------------------------------
-- 4. The gate: refuse applications without an approved match
-- ------------------------------------------------------------

create or replace function public.job_application_requirement_keys(p_job_id uuid)
returns text[]
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_package_key text;
  v_preferred text[];
  v_required text[];
  v_narrowed text[];
begin
  select package_key, coalesce(preferred_specializations, '{}')
  into v_package_key, v_preferred
  from public.jobs
  where id = p_job_id;

  if v_package_key is null then
    return '{}';
  end if;

  select array_agg(specialization_key)
  into v_required
  from public.test_type_specialization_requirements
  where package_key = v_package_key;

  if v_required is null then
    return '{}';
  end if;

  -- When the developer named specific keys on the job (say isiZulu only), and
  -- those overlap the requirement set, the narrower list wins. This is what
  -- lets a developer buy "isiXhosa specifically" rather than "any SA language".
  select array_agg(key)
  into v_narrowed
  from (
    select unnest(v_required)
    intersect
    select unnest(v_preferred)
  ) as narrowed(key);

  if v_narrowed is not null and array_length(v_narrowed, 1) > 0 then
    return v_narrowed;
  end if;

  return v_required;
end;
$$;

create or replace function public.enforce_job_application_specialization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_required text[];
  v_labels text;
begin
  -- An administrator placing a tester manually is trusted, the same way
  -- admin_update_weekly_payout is trusted over the payout rules.
  if public.is_admin() then
    return new;
  end if;

  v_required := public.job_application_requirement_keys(new.job_id);

  if v_required is null or array_length(v_required, 1) is null then
    return new;
  end if;

  if exists (
    select 1
    from public.tester_specializations ts
    where ts.tester_id = new.tester_id
      and ts.specialization_key = any(v_required)
      and ts.verification_status = 'approved'
  ) then
    return new;
  end if;

  select string_agg(key, ', ' order by key) into v_labels from unnest(v_required) as k(key);
  raise exception 'This test type needs a SQUASH-verified specialization first (one of: %). Submit evidence from your profile to get verified.', v_labels
    using errcode = 'check_violation';
end;
$$;

drop trigger if exists job_applications_enforce_specialization on public.job_applications;
create trigger job_applications_enforce_specialization
before insert on public.job_applications
for each row execute function public.enforce_job_application_specialization();

-- ------------------------------------------------------------
-- 5. Tester submits evidence for review
-- ------------------------------------------------------------

create or replace function public.submit_specialization_evidence(
  p_specialization_key text,
  p_evidence_path text,
  p_evidence_name text
)
returns public.tester_specializations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.tester_specializations;
  v_path text := nullif(trim(coalesce(p_evidence_path, '')), '');
  v_name text := nullif(trim(coalesce(p_evidence_name, '')), '');
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if v_path is null or v_name is null then
    raise exception 'Evidence is required to request verification';
  end if;
  -- The storage policy already pins uploads to <tester-id>/..., but the path is
  -- passed in by the client so it is re-checked here rather than trusted.
  if split_part(v_path, '/', 1) <> auth.uid()::text then
    raise exception 'Evidence must be uploaded to your own folder';
  end if;
  if not exists (
    select 1 from public.test_type_specialization_requirements
    where specialization_key = p_specialization_key
  ) then
    raise exception 'This specialization does not require verification';
  end if;

  perform set_config('squash.specialization_write', 'on', true);

  insert into public.tester_specializations (
    tester_id, specialization_key, verification_status,
    evidence_path, evidence_name, submitted_at
  ) values (
    auth.uid(), p_specialization_key, 'pending', v_path, v_name, now()
  )
  on conflict (tester_id, specialization_key) do update set
    verification_status = 'pending',
    verification_note = null,
    evidence_path = excluded.evidence_path,
    evidence_name = excluded.evidence_name,
    submitted_at = now(),
    verified_at = null,
    verified_by = null
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.submit_specialization_evidence(text, text, text) from public;
grant execute on function public.submit_specialization_evidence(text, text, text) to authenticated;

-- ------------------------------------------------------------
-- 6. Administrator decides
-- ------------------------------------------------------------

create or replace function public.review_tester_specialization(
  p_specialization_id uuid,
  p_decision text,
  p_note text default null
)
returns public.tester_specializations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.tester_specializations;
  v_note text := nullif(trim(coalesce(p_note, '')), '');
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;
  if p_decision not in ('approved', 'rejected') then
    raise exception 'Unsupported verification decision';
  end if;
  if v_note is not null and char_length(v_note) > 3000 then
    raise exception 'Review note is too long';
  end if;
  if p_decision = 'rejected' and coalesce(char_length(v_note), 0) < 10 then
    raise exception 'Add a clear review note when rejecting a specialization';
  end if;

  select * into v_row
  from public.tester_specializations
  where id = p_specialization_id
  for update;

  if v_row.id is null then
    raise exception 'Specialization not found';
  end if;
  if v_row.verification_status <> 'pending' then
    raise exception 'This specialization is not awaiting review';
  end if;

  perform set_config('squash.specialization_write', 'on', true);

  update public.tester_specializations
  set verification_status = p_decision,
      verification_note = v_note,
      verified_at = now(),
      verified_by = auth.uid()
  where id = v_row.id
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.review_tester_specialization(uuid, text, text) from public;
grant execute on function public.review_tester_specialization(uuid, text, text) to authenticated;

-- ------------------------------------------------------------
-- 7. Evidence storage
-- ------------------------------------------------------------
--
-- A separate bucket from qualification-evidence: that bucket's insert policy
-- pins the second path segment to an active qualification attempt, which does
-- not apply here. Paths are <tester-id>/<specialization-key>/<random-file>.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'specialization-evidence',
  'specialization-evidence',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'video/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "specialization_evidence_insert_own" on storage.objects;
create policy "specialization_evidence_insert_own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'specialization-evidence'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1 from public.test_type_specialization_requirements r
    where r.specialization_key = (storage.foldername(name))[2]
  )
);

drop policy if exists "specialization_evidence_select_owner_or_admin" on storage.objects;
create policy "specialization_evidence_select_owner_or_admin"
on storage.objects for select to authenticated
using (
  bucket_id = 'specialization-evidence'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);

drop policy if exists "specialization_evidence_delete_own_unapproved" on storage.objects;
create policy "specialization_evidence_delete_own_unapproved"
on storage.objects for delete to authenticated
using (
  bucket_id = 'specialization-evidence'
  and (storage.foldername(name))[1] = auth.uid()::text
  and not exists (
    select 1 from public.tester_specializations ts
    where ts.evidence_path = storage.objects.name
      and ts.verification_status = 'approved'
  )
);

commit;
