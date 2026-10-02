-- Phase 66: one structured bug report per failed task, not one for the whole
-- submission.
--
-- The tester-facing sample page had a single global "Structured Issue
-- Report" covering the entire attempt, disconnected from which of the three
-- tasks it was actually about. A tester who failed two different tasks had
-- nowhere to describe them separately, and a reviewer reading the report had
-- no way to tell which task it referred to.
--
-- `issue_reports` (jsonb) and `scenario_snapshot` (jsonb) already exist on
-- this table -- added out-of-band, in no earlier migration file, by
-- whoever started this exact feature and got as far as the schema before
-- stopping. The legacy single-report columns (bug_title, steps_to_reproduce,
-- expected_result, actual_result, severity, reproducibility) are already
-- nullable for the same reason. This migration is the part that was missing:
-- real validation on issue_reports, so a malformed or incomplete entry can't
-- reach the database even if a bug slips past the API layer.
--
-- Shape of each issue_reports element:
--   { taskId, bugTitle, stepsToReproduce, expectedResult, actualResult,
--     severity, reproducibility, evidencePaths }
--
-- The API is the primary place that checks every failed/blocked task has
-- exactly one matching issue and no task has more than one -- that
-- cross-referencing logic is easier to get right and test in JS than as a
-- nested jsonb constraint. This migration's job is narrower and safer: every
-- individual issue object is well-formed, regardless of what wrote it.
--
-- Run after phase65.

begin;

create or replace function public.qualification_issue_reports_valid(p_issue_reports jsonb)
returns boolean
language plpgsql
immutable
as $$
declare
  v_issue jsonb;
  v_evidence jsonb;
begin
  if jsonb_typeof(p_issue_reports) <> 'array' then
    return false;
  end if;

  for v_issue in select * from jsonb_array_elements(p_issue_reports) loop
    if jsonb_typeof(v_issue) <> 'object' then
      return false;
    end if;
    if coalesce(char_length(trim(v_issue->>'taskId')), 0) = 0 then
      return false;
    end if;
    if coalesce(char_length(trim(v_issue->>'bugTitle')), 0) not between 8 and 180 then
      return false;
    end if;
    if coalesce(char_length(trim(v_issue->>'stepsToReproduce')), 0) not between 20 and 4000 then
      return false;
    end if;
    if coalesce(char_length(trim(v_issue->>'expectedResult')), 0) not between 10 and 2000 then
      return false;
    end if;
    if coalesce(char_length(trim(v_issue->>'actualResult')), 0) not between 10 and 2000 then
      return false;
    end if;
    if not (v_issue->>'severity' in ('low', 'medium', 'high', 'critical')) then
      return false;
    end if;
    if not (v_issue->>'reproducibility' in ('always', 'often', 'sometimes', 'once')) then
      return false;
    end if;

    v_evidence := v_issue->'evidencePaths';
    if jsonb_typeof(v_evidence) <> 'array' or jsonb_array_length(v_evidence) < 1 or jsonb_array_length(v_evidence) > 3 then
      return false;
    end if;
  end loop;

  return true;
end;
$$;

alter table public.tester_qualification_sample_reports
  drop constraint if exists tester_qualification_sample_reports_issue_reports_valid;
alter table public.tester_qualification_sample_reports
  add constraint tester_qualification_sample_reports_issue_reports_valid
  check (public.qualification_issue_reports_valid(issue_reports));

commit;
