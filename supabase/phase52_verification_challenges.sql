-- SQUASH Phase 52: randomised just-in-time verification challenges
--
-- Phase 47 asks a tester to upload evidence that they speak isiZulu. A video
-- recorded at leisure is weak proof: it can be recorded by a cousin, reused
-- across accounts, or bought. Nothing about the upload flow prevents any of it.
--
-- The fix is timing, not technology. The tester asks to be verified, the server
-- issues *one randomly chosen prompt* from a pool, and the recording must arrive
-- inside a short window. They cannot prepare it in advance because they do not
-- know the prompt, and they cannot easily outsource it because whoever they
-- would ask has minutes, not days.
--
-- The reviewer then has something concrete to check: does the response actually
-- answer the prompt that was issued? That is a much easier judgement than "does
-- this person sound like a native speaker", and it is the judgement that catches
-- a reused or borrowed recording.

begin;

-- ------------------------------------------------------------
-- 1. Prompt pool
-- ------------------------------------------------------------

create table if not exists public.specialization_challenge_prompts (
  id uuid primary key default gen_random_uuid(),
  specialization_key text not null,
  prompt_text text not null check (length(trim(prompt_text)) between 10 and 600),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists challenge_prompts_key_idx
  on public.specialization_challenge_prompts(specialization_key)
  where is_active;

alter table public.specialization_challenge_prompts enable row level security;

-- Deliberately NOT readable by testers. If the pool were public a tester could
-- pre-record every prompt and the whole mechanism collapses. Prompts reach the
-- tester one at a time, through the RPC below.
drop policy if exists "challenge_prompts_admin_only" on public.specialization_challenge_prompts;
create policy "challenge_prompts_admin_only" on public.specialization_challenge_prompts
for all using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.specialization_challenge_prompts to authenticated;

-- Prompts are intentionally about *describing something in the moment* rather
-- than reciting. A reused recording answers the wrong question, visibly.
insert into public.specialization_challenge_prompts (specialization_key, prompt_text)
select key, prompt
from (values ('zulu'), ('xhosa'), ('sotho'), ('afrikaans'), ('venda'), ('tsonga')) as languages(key)
cross join (values
  ('In this language, describe out loud how you would explain to a friend what a "one-time PIN" is and why they should never share it.'),
  ('In this language, describe out loud the last app you used today and one thing that annoyed you about it.'),
  ('In this language, explain out loud how you would tell someone to reset a forgotten password, step by step.'),
  ('In this language, describe out loud what you can see out of the nearest window right now.'),
  ('In this language, explain out loud the difference between paying with cash and paying with a card, as if to a child.'),
  ('In this language, describe out loud what you would do if an app charged you twice for the same order.')
) as prompts(prompt)
on conflict do nothing;

-- ------------------------------------------------------------
-- 2. Challenge state on the specialization
-- ------------------------------------------------------------

alter table public.tester_specializations
  add column if not exists challenge_prompt_id uuid
    references public.specialization_challenge_prompts(id) on delete set null,
  add column if not exists challenge_issued_at timestamptz,
  add column if not exists challenge_expires_at timestamptz;

-- The guard trigger from phase 47 resets verification columns on direct writes.
-- Challenge columns must be added to that list, or a tester could extend their
-- own deadline with a plain update.
create or replace function public.guard_specialization_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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
    new.expires_at := null;
    new.revoked_at := null;
    new.revoked_by := null;
    new.revoked_reason := null;
    new.challenge_prompt_id := null;
    new.challenge_issued_at := null;
    new.challenge_expires_at := null;
    return new;
  end if;

  new.verification_status := old.verification_status;
  new.verification_note := old.verification_note;
  new.evidence_path := old.evidence_path;
  new.evidence_name := old.evidence_name;
  new.submitted_at := old.submitted_at;
  new.verified_at := old.verified_at;
  new.verified_by := old.verified_by;
  new.expires_at := old.expires_at;
  new.revoked_at := old.revoked_at;
  new.revoked_by := old.revoked_by;
  new.revoked_reason := old.revoked_reason;
  new.challenge_prompt_id := old.challenge_prompt_id;
  new.challenge_issued_at := old.challenge_issued_at;
  new.challenge_expires_at := old.challenge_expires_at;
  return new;
end;
$$;

-- ------------------------------------------------------------
-- 3. Issue a challenge
-- ------------------------------------------------------------

-- Long enough to find a quiet room and record; short enough that arranging a
-- stand-in is impractical.
create or replace function public.specialization_challenge_window()
returns interval
language sql
immutable
as $$ select interval '30 minutes'; $$;

create or replace function public.request_specialization_challenge(p_specialization_key text)
returns table (
  prompt_text text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prompt public.specialization_challenge_prompts;
  v_existing public.tester_specializations;
  v_expires timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into v_existing
  from public.tester_specializations
  where tester_id = auth.uid() and specialization_key = p_specialization_key
  for update;

  if v_existing.verification_status = 'approved'
     and (v_existing.expires_at is null or v_existing.expires_at > now()) then
    raise exception 'This specialization is already verified';
  end if;
  if v_existing.verification_status = 'pending' then
    raise exception 'Your evidence is already with a reviewer';
  end if;
  if v_existing.verification_status = 'revoked' then
    raise exception 'This verification was revoked. Contact support before trying again.';
  end if;

  -- A live challenge is returned as-is rather than re-rolled, so a tester
  -- cannot reshuffle until they get a prompt they already have recorded.
  if v_existing.challenge_expires_at is not null and v_existing.challenge_expires_at > now() then
    select * into v_prompt
    from public.specialization_challenge_prompts
    where id = v_existing.challenge_prompt_id;

    return query select v_prompt.prompt_text, v_existing.challenge_expires_at;
    return;
  end if;

  select * into v_prompt
  from public.specialization_challenge_prompts
  where specialization_key = p_specialization_key and is_active
  order by random()
  limit 1;

  if v_prompt.id is null then
    raise exception 'No verification challenge is configured for this specialization yet';
  end if;

  v_expires := now() + public.specialization_challenge_window();

  perform set_config('squash.specialization_write', 'on', true);

  insert into public.tester_specializations (
    tester_id, specialization_key, verification_status,
    challenge_prompt_id, challenge_issued_at, challenge_expires_at
  ) values (
    auth.uid(), p_specialization_key, 'declared',
    v_prompt.id, now(), v_expires
  )
  on conflict (tester_id, specialization_key) do update set
    challenge_prompt_id = v_prompt.id,
    challenge_issued_at = now(),
    challenge_expires_at = v_expires;

  return query select v_prompt.prompt_text, v_expires;
end;
$$;

revoke all on function public.request_specialization_challenge(text) from public;
grant execute on function public.request_specialization_challenge(text) to authenticated;

-- ------------------------------------------------------------
-- 4. Evidence must answer a live challenge
-- ------------------------------------------------------------
--
-- Replaces the phase 47 version. Specializations with a configured prompt pool
-- now require an unexpired challenge; the rest (network, assistive technology)
-- keep the plain upload path, because "record this on demand" does not make
-- sense for a speed test or a screen-reader setup.

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
  v_needs_challenge boolean;
  v_existing public.tester_specializations;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if v_path is null or v_name is null then
    raise exception 'Evidence is required to request verification';
  end if;
  if split_part(v_path, '/', 1) <> auth.uid()::text then
    raise exception 'Evidence must be uploaded to your own folder';
  end if;
  if not exists (
    select 1 from public.test_type_specialization_requirements
    where specialization_key = p_specialization_key
  ) then
    raise exception 'This specialization does not require verification';
  end if;

  select exists (
    select 1 from public.specialization_challenge_prompts
    where specialization_key = p_specialization_key and is_active
  ) into v_needs_challenge;

  select * into v_existing
  from public.tester_specializations
  where tester_id = auth.uid() and specialization_key = p_specialization_key;

  if v_needs_challenge then
    if v_existing.challenge_expires_at is null then
      raise exception 'Request a verification challenge before uploading evidence';
    end if;
    if v_existing.challenge_expires_at <= now() then
      raise exception 'That verification challenge has expired. Request a new one and record your answer within the time given.';
    end if;
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
-- 5. The reviewer sees the prompt that was issued
-- ------------------------------------------------------------
--
-- Without this the reviewer cannot do the one check that matters: whether the
-- recording answers the question that was actually asked.

create or replace function public.get_specialization_challenge_prompt(p_specialization_id uuid)
returns table (
  prompt_text text,
  issued_at timestamptz,
  answered_within_window boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.prompt_text,
    ts.challenge_issued_at,
    (ts.submitted_at is not null and ts.submitted_at <= ts.challenge_expires_at)
  from public.tester_specializations ts
  join public.specialization_challenge_prompts p on p.id = ts.challenge_prompt_id
  where ts.id = p_specialization_id
    and public.is_admin();
$$;

revoke all on function public.get_specialization_challenge_prompt(uuid) from public;
grant execute on function public.get_specialization_challenge_prompt(uuid) to authenticated;

commit;
