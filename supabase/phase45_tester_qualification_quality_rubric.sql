-- SQUASH Phase 45: objective qualification-review rubric
--
-- A tester cannot be approved on a vague impression. Every admission review
-- records four 1-5 scores; approval requires a 70% average and no category
-- below 3. Retry/decline decisions also retain the reviewer assessment.

begin;

alter table public.tester_qualification_attempts
  add column if not exists review_clarity_score smallint check (review_clarity_score between 1 and 5),
  add column if not exists review_reproducibility_score smallint check (review_reproducibility_score between 1 and 5),
  add column if not exists review_evidence_score smallint check (review_evidence_score between 1 and 5),
  add column if not exists review_task_coverage_score smallint check (review_task_coverage_score between 1 and 5),
  add column if not exists review_quality_score smallint check (review_quality_score between 20 and 100);

drop function if exists public.review_tester_qualification_attempt(uuid, text, text);

create function public.review_tester_qualification_attempt(
  p_attempt_id uuid,
  p_decision text,
  p_note text,
  p_clarity_score smallint,
  p_reproducibility_score smallint,
  p_evidence_score smallint,
  p_task_coverage_score smallint
)
returns public.tester_qualification_attempts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt public.tester_qualification_attempts;
  v_note text := nullif(trim(coalesce(p_note, '')), '');
  v_quality_score smallint;
  v_title text;
  v_body text;
  v_priority text := 'normal';
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;
  if p_decision not in ('approved', 'retry_required', 'declined') then raise exception 'Unsupported qualification decision'; end if;
  if v_note is not null and char_length(v_note) > 3000 then raise exception 'Review note is too long'; end if;
  if p_decision in ('retry_required', 'declined') and coalesce(char_length(v_note), 0) < 10 then raise exception 'Add a clear review note for a retry or decline decision'; end if;
  if p_clarity_score not between 1 and 5
     or p_reproducibility_score not between 1 and 5
     or p_evidence_score not between 1 and 5
     or p_task_coverage_score not between 1 and 5 then
    raise exception 'Score every quality category from 1 to 5';
  end if;

  v_quality_score := round(((p_clarity_score + p_reproducibility_score + p_evidence_score + p_task_coverage_score)::numeric / 20) * 100)::smallint;
  if p_decision = 'approved'
     and (v_quality_score < 70 or least(p_clarity_score, p_reproducibility_score, p_evidence_score, p_task_coverage_score) < 3) then
    raise exception 'Approval requires a 70%% quality score with no category below 3';
  end if;

  select * into v_attempt from public.tester_qualification_attempts where id = p_attempt_id for update;
  if v_attempt.id is null then raise exception 'Qualification attempt not found'; end if;
  if v_attempt.status <> 'sample_submitted' then raise exception 'This qualification attempt has already been reviewed'; end if;
  if not exists (select 1 from public.tester_qualification_sample_reports r where r.attempt_id = v_attempt.id and r.tester_id = v_attempt.tester_id) then
    raise exception 'A practical sample report is required before review';
  end if;

  update public.tester_qualification_attempts
  set status = p_decision,
      reviewer_id = auth.uid(),
      reviewer_note = v_note,
      reviewed_at = now(),
      review_clarity_score = p_clarity_score,
      review_reproducibility_score = p_reproducibility_score,
      review_evidence_score = p_evidence_score,
      review_task_coverage_score = p_task_coverage_score,
      review_quality_score = v_quality_score
  where id = v_attempt.id
  returning * into v_attempt;

  perform set_config('squash.qualification_write', 'on', true);
  update public.tester_profiles
  set qualification_status = p_decision,
      qualification_approved_at = case when p_decision = 'approved' then now() else null end,
      qualification_probation_started_at = case when p_decision = 'approved' then now() else null end,
      qualification_probation_ends_at = case when p_decision = 'approved' then now() + interval '30 days' else null end,
      qualification_updated_at = now()
  where user_id = v_attempt.tester_id;

  if p_decision = 'approved' then
    v_title := 'You are approved to test on SQUASH';
    v_body := format('Your tester application is approved with a %s%% quality review. You can now apply to paid jobs. Your first 30 days are monitored for report quality and platform safety.', v_quality_score);
    v_priority := 'high';
  elsif p_decision = 'retry_required' then
    v_title := 'A fresh SQUASH tester attempt is ready';
    v_body := 'Review the feedback and complete your alternate QA quiz and practical sample before applying to paid jobs.' || case when v_note is null then '' else ' Reviewer note: ' || v_note end;
    v_priority := 'high';
  else
    v_title := 'Your SQUASH tester application was not approved';
    v_body := coalesce(v_note, 'Your application has been reviewed. Contact SQUASH support if you need clarification.');
  end if;

  insert into public.notifications (user_id, title, body, notification_type, link_path, priority, status)
  values (v_attempt.tester_id, v_title, v_body, 'security', '/tester-qualification', v_priority, 'unread');

  return v_attempt;
end;
$$;

revoke all on function public.review_tester_qualification_attempt(uuid, text, text, smallint, smallint, smallint, smallint) from public;
grant execute on function public.review_tester_qualification_attempt(uuid, text, text, smallint, smallint, smallint, smallint) to authenticated;

commit;
