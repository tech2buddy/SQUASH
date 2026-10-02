-- Phase 64: service_role could not save a quiz result.
--
-- Same out-of-band trigger as phase63's "Complete or wait for review" bug --
-- sync_tester_qualification_profile_status, still in no migration file in
-- this folder -- but a different failure mode this time.
--
-- api/tester-qualification-quiz.ts submits a quiz result by updating
-- tester_qualification_attempts using the service_role key. That update
-- fires sync_tester_qualification_profile_status, which in turn updates
-- tester_profiles.qualification_status on the tester's behalf. Nobody ever
-- granted service_role a table-level privilege to write that column --
-- bypassing RLS (what the service_role key does) and holding a GRANT on a
-- table (a separate, table-level check Postgres always enforces, RLS bypass
-- or not) are two different things. So the trigger's own UPDATE inside the
-- service-role request failed with 42501 "permission denied for table
-- tester_profiles", and every tester who finished the QA foundations quiz
-- saw "Unable to save your quiz result" with no way to retry past it, even
-- with a completed, correctly-scored answer set already sitting on screen.
--
-- Scoped to exactly the columns the trigger touches
-- (qualification_status, qualification_updated_at, and user_id for its WHERE
-- clause) rather than a blanket grant, matching phase54/55's column-level
-- grant pattern for this table -- service_role should not gain write access
-- to rating, available_balance_zar, or anything else on tester_profiles as a
-- side effect of fixing this.
--
-- Run after phase63.

begin;

grant select (user_id, qualification_status) on public.tester_profiles to service_role;
grant update (qualification_status, qualification_updated_at) on public.tester_profiles to service_role;

commit;
