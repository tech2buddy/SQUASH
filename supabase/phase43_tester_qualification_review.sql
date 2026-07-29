-- SQUASH Phase 43: administrator review of qualification samples
--
-- The decision is intentionally made through one security-definer function.
-- It atomically updates the attempt audit record and the tester's gated
-- qualification status, which a tester cannot change directly.

begin;

create or replace function public.review_tester_qualification_attempt(
  p_attempt_id uuid,
  p_decision text,
  p_note text default null
)
returns public.tester_qualification_attempts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt public.tester_qualification_attempts;
  v_note text := nullif(trim(coalesce(p_note, '')), '');
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;
  if p_decision not in ('approved', 'retry_required', 'declined') then
    raise exception 'Unsupported qualification decision';
  end if;
  if v_note is not null and char_length(v_note) > 3000 then
    raise exception 'Review note is too long';
  end if;
  if p_decision in ('retry_required', 'declined') and coalesce(char_length(v_note), 0) < 10 then
    raise exception 'Add a clear review note for a retry or decline decision';
  end if;

  select * into v_attempt
  from public.tester_qualification_attempts
  where id = p_attempt_id
  for update;

  if v_attempt.id is null then
    raise exception 'Qualification attempt not found';
  end if;
  if v_attempt.status <> 'sample_submitted' then
    raise exception 'This qualification attempt has already been reviewed';
  end if;
  if not exists (
    select 1 from public.tester_qualification_sample_reports r
    where r.attempt_id = v_attempt.id and r.tester_id = v_attempt.tester_id
  ) then
    raise exception 'A practical sample report is required before review';
  end if;

  update public.tester_qualification_attempts
  set status = p_decision,
      reviewer_id = auth.uid(),
      reviewer_note = v_note,
      reviewed_at = now()
  where id = v_attempt.id
  returning * into v_attempt;

  perform set_config('squash.qualification_write', 'on', true);
  update public.tester_profiles
  set qualification_status = p_decision,
      qualification_approved_at = case when p_decision = 'approved' then now() else null end,
      qualification_updated_at = now()
  where user_id = v_attempt.tester_id;

  return v_attempt;
end;
$$;

revoke all on function public.review_tester_qualification_attempt(uuid, text, text) from public;
grant execute on function public.review_tester_qualification_attempt(uuid, text, text) to authenticated;

commit;
