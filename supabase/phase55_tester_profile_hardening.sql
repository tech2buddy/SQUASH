-- SQUASH Phase 55: testers stop scoring themselves
--
-- `tester_profiles` is granted select/insert/update/delete to authenticated and
-- `tester_profiles_update_own_or_admin` restricts which row a tester may write
-- but not which columns. `guard_tester_qualification_fields` (phase 46) covers
-- only the qualification and probation columns, so everything else was open:
--
--   supabase.from('tester_profiles')
--     .update({ rating: 5, tests_completed: 847, approval_rate: 100 })
--     .eq('user_id', myId)
--
-- Those three numbers are exactly what a developer reads off the job board when
-- choosing who to accept. A tester could manufacture a perfect record.
--
-- Worse, phase 51's strike columns landed on this table unguarded, so a tester
-- banned for faking verification evidence could clear their own ban:
--
--   .update({ verification_strikes: 0, premium_types_blocked_until: null })
--
-- That made the entire revocation system one UPDATE away from decorative.
--
-- `available_balance_zar` is included too. It is display-only today --
-- `request_tester_payout()` recomputes the real figure from approved
-- submissions and never trusts this column -- so tampering was not theft. It is
-- locked anyway, because the day something starts trusting it, it becomes cash.

begin;

-- ------------------------------------------------------------
-- 1. Column-level UPDATE grant
-- ------------------------------------------------------------
--
-- What is left writable is what a tester genuinely owns: their bio, whether
-- their profile is listed, their preferred payout method, and their referral
-- code (issued by ensure_tester_referral_code, but harmless for them to hold).
--
-- Everything else on this table is either earned, awarded or enforced.

revoke update on public.tester_profiles from authenticated;

grant update (
  user_id,
  bio,
  is_public,
  preferred_payout_method,
  updated_at
) on public.tester_profiles to authenticated;

-- `user_id` is granted only because `updateTesterProfile` upserts, and PostgREST
-- names every supplied column in the ON CONFLICT DO UPDATE SET clause. It is not
-- a hole: `tester_profiles_update_own_or_admin` has
-- `with check (user_id = auth.uid())`, so a tester can only ever set it to
-- themselves.

-- Deleting your own tester profile would orphan submissions, payouts and
-- specializations, and there is no product flow that does it.
revoke delete on public.tester_profiles from authenticated;

-- ------------------------------------------------------------
-- 2. Trigger backstop
-- ------------------------------------------------------------
--
-- Extends the phase 46 guard rather than adding a second trigger, so there
-- stays exactly one place that answers "may this tester write this field".
--
-- The reputation columns are maintained by SQUASH's own review flow; the strike
-- columns by phase 51's revocation RPC, which runs as a security-definer
-- function and so passes `is_admin()`.

create or replace function public.guard_tester_qualification_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Service-role and unauthenticated internal writes are trusted; admin tooling
  -- legitimately corrects these records.
  if public.is_admin() or auth.uid() is null then
    return new;
  end if;

  if current_setting('squash.qualification_write', true) is distinct from 'on'
     and (
       new.qualification_status is distinct from old.qualification_status
       or new.qualification_approved_at is distinct from old.qualification_approved_at
       or new.qualification_updated_at is distinct from old.qualification_updated_at
       or new.qualification_probation_started_at is distinct from old.qualification_probation_started_at
       or new.qualification_probation_ends_at is distinct from old.qualification_probation_ends_at
       or new.probation_status is distinct from old.probation_status
       or new.probation_note is distinct from old.probation_note
       or new.probation_last_reviewed_at is distinct from old.probation_last_reviewed_at
       or new.probation_reviewer_id is distinct from old.probation_reviewer_id
     ) then
    raise exception 'Qualification and probation status are managed by the SQUASH review workflow';
  end if;

  -- Reputation. Shown to developers when they pick testers, so forging it is a
  -- way to win paid work.
  if new.rating is distinct from old.rating
     or new.tests_completed is distinct from old.tests_completed
     or new.approval_rate is distinct from old.approval_rate then
    raise exception 'Your rating and test history are earned, not set'
      using errcode = 'check_violation';
  end if;

  -- Money.
  if new.available_balance_zar is distinct from old.available_balance_zar then
    raise exception 'Your balance is calculated from approved work'
      using errcode = 'check_violation';
  end if;

  -- Enforcement state (phase 51).
  if current_setting('squash.specialization_write', true) is distinct from 'on'
     and (
       new.verification_strikes is distinct from old.verification_strikes
       or new.premium_types_blocked_until is distinct from old.premium_types_blocked_until
     ) then
    raise exception 'Verification strikes are managed by the SQUASH review workflow'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

-- ------------------------------------------------------------
-- 3. Same treatment for profiles
-- ------------------------------------------------------------
--
-- `profiles` is granted blanket update as well. Nothing there is as dangerous,
-- but `id` and `role` are worth pinning: a role rewrite would be a privilege
-- escalation straight to admin if any policy ever keyed off the column rather
-- than current_user_role().

create or replace function public.guard_profile_identity_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() or auth.uid() is null then
    return new;
  end if;

  if new.id is distinct from old.id or new.role is distinct from old.role then
    raise exception 'Account identity and role are managed by SQUASH'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_identity on public.profiles;
create trigger profiles_guard_identity
before update on public.profiles
for each row execute function public.guard_profile_identity_fields();

commit;
