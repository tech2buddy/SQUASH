-- Keep bug reports linked to the one submission for their assignment.
-- This repairs existing Test Lab reports and preserves the link regardless
-- of whether the bug or the final submission is saved first.

update public.bug_reports as bug
set submission_id = submission.id
from public.test_submissions as submission
where submission.assignment_id = bug.assignment_id
  and bug.submission_id is distinct from submission.id;

create or replace function public.link_bug_report_to_submission()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
begin
  if new.submission_id is null and new.assignment_id is not null then
    select submission.id
      into new.submission_id
    from public.test_submissions as submission
    where submission.assignment_id = new.assignment_id
    limit 1;
  end if;

  return new;
end;
$function$;

drop trigger if exists bug_reports_link_submission on public.bug_reports;
create trigger bug_reports_link_submission
before insert or update of assignment_id, submission_id
on public.bug_reports
for each row
execute function public.link_bug_report_to_submission();

create or replace function public.link_submission_bug_reports()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
begin
  update public.bug_reports
  set submission_id = new.id
  where assignment_id = new.assignment_id
    and submission_id is distinct from new.id;

  return new;
end;
$function$;

drop trigger if exists submissions_link_bug_reports on public.test_submissions;
create trigger submissions_link_bug_reports
after insert or update of assignment_id
on public.test_submissions
for each row
execute function public.link_submission_bug_reports();

revoke all on function public.link_bug_report_to_submission() from public, anon, authenticated;
revoke all on function public.link_submission_bug_reports() from public, anon, authenticated;