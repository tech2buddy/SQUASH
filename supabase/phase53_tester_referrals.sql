-- SQUASH Phase 53: complete the referral loop
--
-- Correction to an earlier draft of this file: it created its own
-- `tester_referrals` table and referral-code generator, unaware that phase 12
-- already built both. On a real database the `create table if not exists` was a
-- no-op and the migration then aborted on an index over a column that did not
-- exist. This version adds only what phase 12 left out and uses its schema.
--
-- What phase 12 has: the table, the `referral_status` enum, RLS, per-tester
-- codes via `ensure_tester_referral_code()`, and a policy letting a tester
-- record their own invites.
--
-- What was missing, and is why the page had nothing real to show:
--
--   1. Nothing ever linked a signup back to a referrer, so every row sat at
--      'invited' forever.
--   2. Nothing advanced a referral when the referred tester actually worked.
--   3. There was no read path for the page (it rendered mock rows under a
--      literal "TODO" subtitle).
--   4. Invites were unlimited -- a tester could insert rows as fast as they
--      could POST.
--
-- The reward amount stays out of scope. `reward_amount_zar` is admin-set and
-- nothing here touches payouts: what a referral is worth is a commercial
-- decision with margin implications, not something to invent in a migration.

begin;

-- ------------------------------------------------------------
-- 1. Rate limit invites
-- ------------------------------------------------------------
--
-- `tester_referrals_insert_own` lets a tester insert their own rows directly,
-- which is fine except that a referral form with no ceiling is a spam cannon
-- pointed at arbitrary email addresses. Enforced as a trigger so it applies to
-- the existing direct-insert path rather than requiring a new RPC.

create or replace function public.limit_referral_invites()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recent integer;
begin
  if public.is_admin() then
    return new;
  end if;

  if exists (select 1 from public.profiles where lower(email) = lower(new.referred_email)) then
    raise exception 'That person already has a SQUASH account';
  end if;

  select count(*) into v_recent
  from public.tester_referrals
  where referrer_id = new.referrer_id
    and created_at > now() - interval '24 hours';

  if v_recent >= 20 then
    raise exception 'You have reached the daily invite limit. Try again tomorrow.';
  end if;

  return new;
end;
$$;

drop trigger if exists tester_referrals_limit_invites on public.tester_referrals;
create trigger tester_referrals_limit_invites
before insert on public.tester_referrals
for each row execute function public.limit_referral_invites();

-- ------------------------------------------------------------
-- 2. Claim a referral at signup
-- ------------------------------------------------------------
--
-- Called by the newly created account, so the new user links itself. A referrer
-- cannot name someone who never used their link, which is what would turn
-- referral credit into a form submission.

create or replace function public.claim_tester_referral(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referrer uuid;
  v_email text;
  v_code text := lower(nullif(trim(coalesce(p_code, '')), ''));
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if v_code is null then
    return false;
  end if;

  select user_id into v_referrer
  from public.tester_profiles
  where lower(referral_code) = v_code;

  -- Unknown code, or self-referral.
  if v_referrer is null or v_referrer = auth.uid() then
    return false;
  end if;

  -- First link wins; a second referrer cannot re-claim an existing account.
  if exists (select 1 from public.tester_referrals where referred_user_id = auth.uid()) then
    return false;
  end if;

  select lower(email) into v_email from public.profiles where id = auth.uid();
  if v_email is null then
    return false;
  end if;

  -- An invite already sent to this address is upgraded in place; a signup from
  -- a shared link with no prior invite creates the row.
  update public.tester_referrals
  set status = 'signed_up'::public.referral_status,
      referred_user_id = auth.uid(),
      signed_up_at = now()
  where referrer_id = v_referrer
    and lower(referred_email) = v_email
    and referred_user_id is null;

  if not found then
    insert into public.tester_referrals (
      referrer_id, referred_email, referral_code, status, referred_user_id, signed_up_at
    )
    select
      v_referrer, v_email, tp.referral_code,
      'signed_up'::public.referral_status, auth.uid(), now()
    from public.tester_profiles tp
    where tp.user_id = v_referrer
    on conflict do nothing;
  end if;

  return true;
end;
$$;

revoke all on function public.claim_tester_referral(text) from public;
grant execute on function public.claim_tester_referral(text) to authenticated;

-- ------------------------------------------------------------
-- 3. Advance when the referred tester delivers
-- ------------------------------------------------------------
--
-- A referral is worth something once the person actually works, not when they
-- sign up -- otherwise the incentive is to harvest accounts. Recorded at the
-- moment of approval rather than computed on read.

create or replace function public.advance_referral_on_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'approved'::public.submission_status
     and coalesce(old.status, 'draft'::public.submission_status) <> 'approved'::public.submission_status then
    update public.tester_referrals
    set status = 'reward_ready'::public.referral_status,
        approved_work_at = coalesce(approved_work_at, now()),
        reward_ready_at = coalesce(reward_ready_at, now())
    where referred_user_id = new.tester_id
      and status in ('signed_up'::public.referral_status, 'approved_work'::public.referral_status);
  end if;
  return new;
end;
$$;

drop trigger if exists test_submissions_advance_referral on public.test_submissions;
create trigger test_submissions_advance_referral
after update of status on public.test_submissions
for each row execute function public.advance_referral_on_approval();

-- ------------------------------------------------------------
-- 4. Read path for the referrals page
-- ------------------------------------------------------------
--
-- The referrer sees a name only once the person has signed up. An invite that
-- was never accepted stays just the address they typed in.

create or replace function public.get_tester_referrals()
returns table (
  id uuid,
  referred_email text,
  referred_name text,
  status text,
  invited_at timestamptz,
  signed_up_at timestamptz,
  reward_ready_at timestamptz,
  reward_amount_zar integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.id,
    r.referred_email,
    p.full_name,
    r.status::text,
    r.created_at,
    r.signed_up_at,
    r.reward_ready_at,
    r.reward_amount_zar
  from public.tester_referrals r
  left join public.profiles p on p.id = r.referred_user_id
  where r.referrer_id = auth.uid()
  order by r.created_at desc;
$$;

revoke all on function public.get_tester_referrals() from public;
grant execute on function public.get_tester_referrals() to authenticated;

-- A tester needs their own code to build a share link. Phase 12's generator
-- takes a target id, so this wrapper pins it to the caller.
create or replace function public.get_or_create_referral_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  return public.ensure_tester_referral_code(auth.uid());
end;
$$;

revoke all on function public.get_or_create_referral_code() from public;
grant execute on function public.get_or_create_referral_code() to authenticated;

commit;
