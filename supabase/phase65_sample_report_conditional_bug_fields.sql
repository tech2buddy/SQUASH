-- Phase 65: the structured bug report should only be required when a tester
-- actually recorded a failure.
--
-- Every field in tester_qualification_sample_reports (bug_title,
-- steps_to_reproduce, expected_result, actual_result) has always been a hard
-- NOT NULL + minimum-length check, regardless of what the tester actually
-- found. That means a tester who genuinely completed every task with no
-- defects -- a legitimate, correct outcome, especially for a task with no
-- known bug at all -- was forced to invent something to type into "Steps to
-- reproduce" just to get past validation. That directly contradicts the
-- page's own footer text: "A reviewer will assess clarity, reproducibility,
-- evidence and honesty -- not whether you guessed a hidden answer." The
-- validation was punishing the honest answer.
--
-- The fix: the minimum-length requirement on these four fields is now
-- conditional on whether task_outcomes actually contains a 'fail' or
-- 'blocked' entry. The maximum length stays enforced unconditionally either
-- way, so an all-pass submission can't smuggle in an unbounded blob just
-- because the minimum was waived.
--
-- Run after phase64.

begin;

create or replace function public.qualification_report_has_failure(p_task_outcomes jsonb)
returns boolean
language sql
immutable
as $$
  select exists (
    select 1
    from jsonb_array_elements(p_task_outcomes) elem
    where elem->>'outcome' in ('fail', 'blocked')
  );
$$;

alter table public.tester_qualification_sample_reports
  drop constraint if exists tester_qualification_sample_reports_bug_title_check;
alter table public.tester_qualification_sample_reports
  add constraint tester_qualification_sample_reports_bug_title_check
  check (
    char_length(trim(bug_title)) <= 180
    and (
      not public.qualification_report_has_failure(task_outcomes)
      or char_length(trim(bug_title)) >= 8
    )
  );

alter table public.tester_qualification_sample_reports
  drop constraint if exists tester_qualification_sample_reports_steps_to_reproduce_check;
alter table public.tester_qualification_sample_reports
  add constraint tester_qualification_sample_reports_steps_to_reproduce_check
  check (
    char_length(trim(steps_to_reproduce)) <= 4000
    and (
      not public.qualification_report_has_failure(task_outcomes)
      or char_length(trim(steps_to_reproduce)) >= 20
    )
  );

alter table public.tester_qualification_sample_reports
  drop constraint if exists tester_qualification_sample_reports_expected_result_check;
alter table public.tester_qualification_sample_reports
  add constraint tester_qualification_sample_reports_expected_result_check
  check (
    char_length(trim(expected_result)) <= 2000
    and (
      not public.qualification_report_has_failure(task_outcomes)
      or char_length(trim(expected_result)) >= 10
    )
  );

alter table public.tester_qualification_sample_reports
  drop constraint if exists tester_qualification_sample_reports_actual_result_check;
alter table public.tester_qualification_sample_reports
  add constraint tester_qualification_sample_reports_actual_result_check
  check (
    char_length(trim(actual_result)) <= 2000
    and (
      not public.qualification_report_has_failure(task_outcomes)
      or char_length(trim(actual_result)) >= 10
    )
  );

commit;
