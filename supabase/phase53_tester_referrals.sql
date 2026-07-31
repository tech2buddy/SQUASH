-- SQUASH Phase 53: real tester referrals
--
-- The referrals page has been shipping mock data with the literal text
-- "TODO: Replace with Supabase referral records" rendered as its subtitle, and
-- an invite button that pushed a row into React state and forgot it on refresh.
-- Testers have been looking at a feature that does nothing.
--
-- This is the backing store. Deliberately narrow: it tracks the funnel
-- truthfully and nothing more.
--
-- What it does NOT decide is the reward. `reward_zar` exists and stays null
-- until an administrator sets it, because how much a referral is worth is a
-- commercial decision with margin implications, not something to invent in a
-- migration. `reward_ready` means "this referral has earned whatever you decide
-- to pay" -- it does not create a payable balance, and nothing here touches
-- payouts. Wire it to money deliberately, once the number is chosen.

begin;

-- ------------------------------------------------------------
-- 1. A stable referral code per tester
-- ------------------------------------------------------------
--
-- The page previously derived a "code" by slicing the tester's user id, which
-- leaks part of a primary key into a URL people paste into WhatsApp groups.
-- This is a separate random value with no relationship to the account.

alter table public.tester_profiles
  add column if not exists referral_code text unique;

create or replace function public.get_or_create_referral_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_attempt integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select referral_code into v_code from public.tester_profiles where user_id = auth.uid();
  if v_code is not null then
    return v_code;
  end if;

  -- Ambiguous characters (0/O, 1/I) left out: these get read aloud and
  -- retyped from a phone screen.
  loop
    v_attempt := v_attempt + 1;
    v_code := upper(
      substr(translate(encode(gen_random_bytes(8), 'base64'), '+/=OI01lo', ''), 1, 7)
    );
    exit when length(v_code) = 7 and not exists (
      select 1 from public.tester_profiles where referral_code = v_code
    );
    if v_attempt > 20 then
      raise exception 'Could not allocate a referral code, please try again';
    end if;
  end loop;

  update public.tester_profiles set referral_code = v_code where user_id = auth.uid();
  return v_code;
end;
$$;

revoke all on function public.get_or_create_referral_code() from public;
grant execute on function public.get_or_create_referral_code() to authenticated;

-- ------------------------------------------------------------
-- 2. Referrals
-- ------------------------------------------------------------

create table if not exists public.tester_referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.tester_profiles(user_id) on delete cascade,
  -- Stored lowercased so an invite and a signup match regardless of typing.
  invited_email text not null check (position('@' in invited_email) > 1),
  -- invited      -- invite recorded, nobody has signed up
  -- signed_up    -- an account was created against this referral
  -- approved_work-- the referred tester has had a submission approved
  -- reward_ready -- eligible for whatever reward SQUASH decides to pay
  -- expired      -- invite went stale without a signup
  status text not null default 'invited'
    check (status in ('invited', 'signed_up', 'approved_work', 'reward_ready', 'expired')),
  referred_user_id uuid references public.profiles(id) on delete set null,
  invited_at timestamptz not null default now(),
  signed_up_at timestamptz,
  qualified_at timestamptz,
  reward_zar integer check (reward_zar >= 0),
  reward_paid_at timestamptz,
  unique (referrer_id, invited_email)
);

create index if not exists tester_referrals_referrer_idx
  on public.tester_referrals(referrer_id, invited_at desc);
create index if not exists tester_referrals_referred_idx
  on public.tester_referrals(referred_user_id)
  where referred_user_id is not null;

alter table public.tester_referrals enable row level security;

-- A tester sees their own referrals. The referred person's email is visible to
-- the referrer because they typed it in; nothing else about that account is.
drop policy if exists "tester_referrals_select_own" on public.tester_referrals;
create policy "tester_referrals_select_own" on public.tester_referrals
for select using (referrer_id = auth.uid() or public.is_admin());

-- Writes go through the functions below. A tester cannot self-award a status.
drop policy if exists "tester_referrals_admin_write" on public.tester_referrals;
create policy "tester_referrals_admin_write" on public.tester_referrals
for all using (public.is_admin()) with check (public.is_admin());

grant select on public.tester_referrals to authenticated;

-- ------------------------------------------------------------
-- 3. Record an invite
-- ------------------------------------------------------------

create or replace function public.create_tester_referral(p_email text)
returns public.tester_referrals
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.tester_referrals;
  v_email text := lower(nullif(trim(coalesce(p_email, '')), ''));
  v_recent integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if v_email is null or position('@' in v_email) < 2 or length(v_email) > 320 then
    raise exception 'Enter a valid email address';
  end if;
  if exists (select 1 from public.profiles where lower(email) = v_email) then
    raise exception 'That person already has a SQUASH account';
  end if;

  -- A referral form that emails arbitrary strangers on demand is a spam
  -- cannon. Twenty a day is generous for genuine word of mouth.
  select count(*) into v_recent
  from public.tester_referrals
  where referrer_id = auth.uid() and invited_at > now() - interval '24 hours';

  if v_recent >= 20 then
    raise exception 'You have reached the daily invite limit. Try again tomorrow.';
  end if;

  insert into public.tester_referrals (referrer_id, invited_email)
  values (auth.uid(), v_email)
  on conflict (referrer_id, invited_email) do update set invited_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.create_tester_referral(text) from public;
grant execute on function public.create_tester_referral(text) to authenticated;

-- ------------------------------------------------------------
-- 4. Claim a referral at signup
-- ------------------------------------------------------------
--
-- Called by the newly created account, so it links itself rather than letting a
-- referrer claim credit for someone who never used their link.

create or replace function public.claim_tester_referral(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referrer uuid;
  v_email text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select user_id into v_referrer
  from public.tester_profiles
  where referral_code = upper(trim(coalesce(p_code, '')));

  if v_referrer is null or v_referrer = auth.uid() then
    return false;
  end if;

  -- Already credited to someone: first link wins, no reassigning later.
  if exists (select 1 from public.tester_referrals where referred_user_id = auth.uid()) then
    return false;
  end if;

  select lower(email) into v_email from public.profiles where id = auth.uid();

  -- An existing invite for this address is upgraded; a signup from a shared
  -- link with no prior invite creates the row.
  update public.tester_referrals
  set status = 'signed_up',
      referred_user_id = auth.uid(),
      signed_up_at = now()
  where referrer_id = v_referrer
    and invited_email = v_email
    and referred_user_id is null;

  if not found then
    insert into public.tester_referrals (
      referrer_id, invited_email, status, referred_user_id, signed_up_at
    ) values (
      v_referrer, coalesce(v_email, 'unknown@unknown.invalid'), 'signed_up', auth.uid(), now()
    )
    on conflict (referrer_id, invited_email) do nothing;
  end if;

  return true;
end;
$$;

revoke all on function public.claim_tester_referral(text) from public;
grant execute on function public.claim_tester_referral(text) to authenticated;

-- ------------------------------------------------------------
-- 5. Advance a referral when the referred tester delivers
-- ------------------------------------------------------------
--
-- A referral is worth something once the person actually works, not when they
-- sign up -- otherwise the incentive is to harvest signups. Fires off submission
-- approval rather than being computed on read, so the moment is recorded.

create or replace function public.advance_referral_on_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'approved' and coalesce(old.status, '') <> 'approved' then
    update public.tester_referrals
    set status = 'reward_ready',
        qualified_at = coalesce(qualified_at, now())
    where referred_user_id = new.tester_id
      and status in ('signed_up', 'approved_work');
  end if;
  return new;
end;
$$;

drop trigger if exists test_submissions_advance_referral on public.test_submissions;
create trigger test_submissions_advance_referral
after update of status on public.test_submissions
for each row execute function public.advance_referral_on_approval();

-- ------------------------------------------------------------
-- 6. Read side
-- ------------------------------------------------------------
--
-- The referrer sees the name only once the person has actually signed up. An
-- invite that was never accepted stays just an email address.

create or replace function public.get_tester_referrals()
returns table (
  id uuid,
  invited_email text,
  referred_name text,
  status text,
  invited_at timestamptz,
  signed_up_at timestamptz,
  qualified_at timestamptz,
  reward_zar integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.id,
    r.invited_email,
    p.full_name,
    r.status,
    r.invited_at,
    r.signed_up_at,
    r.qualified_at,
    r.reward_zar
  from public.tester_referrals r
  left join public.profiles p on p.id = r.referred_user_id
  where r.referrer_id = auth.uid()
  order by r.invited_at desc;
$$;

revoke all on function public.get_tester_referrals() from public;
grant execute on function public.get_tester_referrals() to authenticated;

commit;
