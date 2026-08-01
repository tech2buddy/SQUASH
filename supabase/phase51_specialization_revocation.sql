-- SQUASH Phase 51: revocation, expiry and strikes
--
-- Phases 47-50 verify a specialization once, at the gate. Fraud is not a
-- one-time event, so a snapshot is the wrong shape: a tester who proved they
-- speak isiZulu in March is still "verified" in December whether or not the
-- account is still theirs, and a tester caught faking has nothing to lose
-- beyond the single job they were caught on.
--
-- This phase makes verification revocable, expiring, and cumulative.
--
-- What it deliberately does NOT do: seize money. "Forfeiture" as an automatic
-- side effect of revocation would let one admin click move a tester's earned
-- balance with no separate record of the decision, and would silently reverse
-- work a developer already approved. Instead, revocation blocks future work and
-- *surfaces* the affected in-flight submissions; acting on those stays an
-- explicit, separately audited decision. Money never moves as a side effect.

begin;

-- ------------------------------------------------------------
-- 1. Revoked as a first-class state
-- ------------------------------------------------------------

alter table public.tester_specializations
  drop constraint if exists tester_specializations_verification_status_check;

alter table public.tester_specializations
  add constraint tester_specializations_verification_status_check
  check (verification_status in ('declared', 'pending', 'approved', 'rejected', 'revoked'));

alter table public.tester_specializations
  -- Verification goes stale. A tester's circumstances change: they move off a
  -- township network, they stop using a screen reader daily. Null means "never
  -- expires", which is right for a language and wrong for a network.
  add column if not exists expires_at timestamptz,
  add column if not exists revoked_at timestamptz,
  add column if not exists revoked_by uuid references auth.users(id) on delete set null,
  add column if not exists revoked_reason text;

comment on column public.tester_specializations.expires_at is
  'When this verification stops satisfying the application gate. Null = no expiry.';

-- Network conditions are the volatile ones -- someone who was on a rural link in
-- March may be on fibre by December -- so they re-prove yearly. Language and
-- assistive technology do not expire on a timer; they are handled by revocation.
create or replace function public.default_specialization_validity(p_key text)
returns interval
language sql
immutable
set search_path = public
as $$
  select case
    when p_key in ('2g-3g-only', 'township-network', 'rural-network') then interval '365 days'
    else null
  end;
$$;

-- ------------------------------------------------------------
-- 2. Strikes
-- ------------------------------------------------------------

alter table public.tester_profiles
  add column if not exists verification_strikes integer not null default 0
    check (verification_strikes >= 0),
  add column if not exists premium_types_blocked_until timestamptz;

comment on column public.tester_profiles.premium_types_blocked_until is
  'Set when strikes accumulate. Blocks all specialization-gated test types regardless of any individual verification still being approved.';

-- ------------------------------------------------------------
-- 3. The gate honours expiry, revocation and blocks
-- ------------------------------------------------------------
--
-- Replaces the phase 47 trigger function. Same shape, three more reasons to
-- say no. Kept as one function so there is exactly one place that decides
-- whether a tester may take a premium job.

create or replace function public.enforce_job_application_specialization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_required text[];
  v_labels text;
  v_blocked_until timestamptz;
begin
  if public.is_admin() then
    return new;
  end if;

  v_required := public.job_application_requirement_keys(new.job_id);

  if v_required is null or array_length(v_required, 1) is null then
    return new;
  end if;

  select premium_types_blocked_until into v_blocked_until
  from public.tester_profiles
  where user_id = new.tester_id;

  if v_blocked_until is not null and v_blocked_until > now() then
    raise exception 'Your access to specialized test types is paused until %. Contact support if you believe this is wrong.',
      to_char(v_blocked_until, 'DD Mon YYYY')
      using errcode = 'check_violation';
  end if;

  if exists (
    select 1
    from public.tester_specializations ts
    where ts.tester_id = new.tester_id
      and ts.specialization_key = any(v_required)
      and ts.verification_status = 'approved'
      and (ts.expires_at is null or ts.expires_at > now())
  ) then
    return new;
  end if;

  -- Distinguish "never verified" from "expired", because the fix differs and a
  -- tester who did the work once deserves to be told which it is.
  if exists (
    select 1
    from public.tester_specializations ts
    where ts.tester_id = new.tester_id
      and ts.specialization_key = any(v_required)
      and ts.verification_status = 'approved'
      and ts.expires_at <= now()
  ) then
    raise exception 'Your verification for this test type has expired. Submit fresh evidence from your profile to renew it.'
      using errcode = 'check_violation';
  end if;

  select string_agg(key, ', ' order by key) into v_labels from unnest(v_required) as k(key);
  raise exception 'This test type needs a SQUASH-verified specialization first (one of: %). Submit evidence from your profile to get verified.', v_labels
    using errcode = 'check_violation';
end;
$$;

-- ------------------------------------------------------------
-- 4. Approval sets an expiry
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
  v_validity interval;
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

  v_validity := public.default_specialization_validity(v_row.specialization_key);

  perform set_config('squash.specialization_write', 'on', true);

  update public.tester_specializations
  set verification_status = p_decision,
      verification_note = v_note,
      verified_at = now(),
      verified_by = auth.uid(),
      expires_at = case
        when p_decision = 'approved' and v_validity is not null then now() + v_validity
        else null
      end,
      revoked_at = null,
      revoked_by = null,
      revoked_reason = null
  where id = v_row.id
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.review_tester_specialization(uuid, text, text) from public;
grant execute on function public.review_tester_specialization(uuid, text, text) to authenticated;

-- ------------------------------------------------------------
-- 5. Revocation
-- ------------------------------------------------------------
--
-- Takes effect immediately for future applications, because the gate above only
-- accepts 'approved'. Records a strike, and on the second strike pauses the
-- tester from every specialization-gated test type for 180 days.
--
-- Returns the count of in-flight submissions the revocation touches so the
-- caller can review them. It does not alter them.

create or replace function public.revoke_tester_specialization(
  p_specialization_id uuid,
  p_reason text
)
returns table (
  specialization_id uuid,
  tester_id uuid,
  strikes integer,
  blocked_until timestamptz,
  affected_submissions integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.tester_specializations;
  v_reason text := nullif(trim(coalesce(p_reason, '')), '');
  v_strikes integer;
  v_blocked timestamptz;
  v_affected integer;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;
  -- Revocation is an accusation with financial consequences for a real person.
  -- A written reason is mandatory and permanent.
  if coalesce(char_length(v_reason), 0) < 20 then
    raise exception 'Give a specific written reason (at least 20 characters) when revoking a verification';
  end if;

  select * into v_row
  from public.tester_specializations
  where id = p_specialization_id
  for update;

  if v_row.id is null then
    raise exception 'Specialization not found';
  end if;
  if v_row.verification_status <> 'approved' then
    raise exception 'Only an approved verification can be revoked';
  end if;

  perform set_config('squash.specialization_write', 'on', true);

  update public.tester_specializations
  set verification_status = 'revoked',
      revoked_at = now(),
      revoked_by = auth.uid(),
      revoked_reason = v_reason,
      expires_at = null
  where id = v_row.id;

  update public.tester_profiles
  set verification_strikes = verification_strikes + 1
  where user_id = v_row.tester_id
  returning verification_strikes into v_strikes;

  -- Second strike pauses every gated test type. A first strike is treated as
  -- correctable; a second is a pattern.
  if v_strikes >= 2 then
    update public.tester_profiles
    set premium_types_blocked_until = now() + interval '180 days'
    where user_id = v_row.tester_id
    returning premium_types_blocked_until into v_blocked;
  end if;

  -- Work already in flight that relied on this claim. Reported, not touched.
  select count(*)::integer into v_affected
  from public.test_submissions s
  join public.jobs j on j.id = s.job_id
  where s.tester_id = v_row.tester_id
    and s.status in ('draft', 'submitted', 'changes_requested')
    and exists (
      select 1 from public.test_type_specialization_requirements r
      where r.package_key = j.package_key
        and r.specialization_key = v_row.specialization_key
    );

  return query select v_row.id, v_row.tester_id, v_strikes, v_blocked, v_affected;
end;
$$;

revoke all on function public.revoke_tester_specialization(uuid, text) from public;
grant execute on function public.revoke_tester_specialization(uuid, text) to authenticated;

-- ------------------------------------------------------------
-- 6. Expiring-soon queue
-- ------------------------------------------------------------
--
-- So renewals can be chased before coverage silently drops below the minimum
-- tester count for a test type.

create or replace function public.get_expiring_specializations(p_within_days integer default 30)
returns table (
  specialization_id uuid,
  tester_id uuid,
  specialization_key text,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select ts.id, ts.tester_id, ts.specialization_key, ts.expires_at
  from public.tester_specializations ts
  where public.is_admin()
    and ts.verification_status = 'approved'
    and ts.expires_at is not null
    and ts.expires_at <= now() + make_interval(days => greatest(p_within_days, 0))
  order by ts.expires_at;
$$;

revoke all on function public.get_expiring_specializations(integer) from public;
grant execute on function public.get_expiring_specializations(integer) to authenticated;

-- ------------------------------------------------------------
-- 7. Coverage and capacity must not count what the gate rejects
-- ------------------------------------------------------------
--
-- Phase 49 counted any row with status 'approved'. Now that a verification can
-- expire, that overstates capacity: it would report enough verified isiZulu
-- testers to staff a job the gate would then refuse them all for. These two
-- replace the phase 49 versions with the same predicate the trigger uses.

-- create or replace cannot change a function's OUT-parameter row type; phase 49
-- returned 4 columns and this returns 7, so the old one has to go first.
drop function if exists public.get_specialization_coverage();

create function public.get_specialization_coverage()
returns table (
  specialization_key text,
  approved_count integer,
  pending_count integer,
  declared_count integer,
  expired_count integer,
  revoked_count integer,
  requires_verification boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ts.specialization_key,
    count(*) filter (
      where ts.verification_status = 'approved'
        and (ts.expires_at is null or ts.expires_at > now())
    )::integer,
    count(*) filter (where ts.verification_status = 'pending')::integer,
    count(*) filter (where ts.verification_status = 'declared')::integer,
    count(*) filter (
      where ts.verification_status = 'approved' and ts.expires_at <= now()
    )::integer,
    count(*) filter (where ts.verification_status = 'revoked')::integer,
    exists (
      select 1 from public.test_type_specialization_requirements r
      where r.specialization_key = ts.specialization_key
    )
  from public.tester_specializations ts
  group by ts.specialization_key
  order by ts.specialization_key;
$$;

revoke all on function public.get_specialization_coverage() from public;
grant execute on function public.get_specialization_coverage() to authenticated;

create or replace function public.get_test_type_capacity(p_package_key text, p_min_testers integer)
returns table (
  package_key text,
  verified_testers integer,
  min_testers integer,
  can_staff boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p_package_key,
    coalesce(count(distinct ts.tester_id), 0)::integer,
    p_min_testers,
    coalesce(count(distinct ts.tester_id), 0) >= p_min_testers
  from public.test_type_specialization_requirements r
  left join public.tester_specializations ts
    on ts.specialization_key = r.specialization_key
   and ts.verification_status = 'approved'
   and (ts.expires_at is null or ts.expires_at > now())
  left join public.tester_profiles tp
    on tp.user_id = ts.tester_id
   and (tp.premium_types_blocked_until is null or tp.premium_types_blocked_until <= now())
  where r.package_key = p_package_key
    and (ts.tester_id is null or tp.user_id is not null);
$$;

revoke all on function public.get_test_type_capacity(text, integer) from public;
grant execute on function public.get_test_type_capacity(text, integer) to authenticated;

commit;
