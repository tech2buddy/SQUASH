-- SQUASH Phase 40: accountable task outcomes
-- Additive migration. Existing completed task rows stay valid.

alter table public.test_task_results
  add column if not exists outcome text,
  add column if not exists outcome_note text;

alter table public.test_task_results
  drop constraint if exists test_task_results_outcome_check;

alter table public.test_task_results
  add constraint test_task_results_outcome_check
  check (outcome is null or outcome in ('pass', 'fail', 'blocked', 'not_applicable'));

comment on column public.test_task_results.outcome is
  'Tester result for an examined task: pass, fail, blocked, or not applicable.';
comment on column public.test_task_results.outcome_note is
  'Required by the application for blocked and not-applicable outcomes; used to explain the result.';
