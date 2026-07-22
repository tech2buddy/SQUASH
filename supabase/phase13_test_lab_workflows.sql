-- SQUASH Phase 13 Test Lab Workflows
-- Run this after supabase/schema.sql and phases 2-12.
-- This phase makes the active testing lab real backend data instead of local-only autosave.
-- It is additive: no table drops and no data deletes.

-- ------------------------------------------------------------
-- Test workflow configuration on jobs
-- ------------------------------------------------------------

do $$ begin
  create type public.test_workflow_type as enum (
    'bug_hunt',
    'usability',
    'first_impression',
    'exploratory',
    'regression',
    'feature_feedback',
    'accessibility',
    'custom'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.lab_session_status as enum ('not_started', 'in_progress', 'submitted', 'approved', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.lab_task_status as enum ('not_started', 'active', 'completed', 'skipped');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.tester_note_type as enum ('observation', 'confusion', 'suggestion', 'positive');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.issue_type as enum (
    'functional_bug',
    'ui_issue',
    'ux_issue',
    'performance_issue',
    'crash',
    'accessibility_issue',
    'content_issue',
    'other'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.issue_frequency as enum ('once', 'sometimes', 'every_time');
exception when duplicate_object then null;
end $$;

alter table public.jobs
add column if not exists test_workflow public.test_workflow_type not null default 'usability',
add column if not exists test_objective text,
add column if not exists target_scenario text,
add column if not exists test_restrictions text[] not null default '{}',
add column if not exists custom_questions text[] not null default '{}',
add column if not exists lab_config jsonb not null default '{}'::jsonb;

create index if not exists jobs_test_workflow_idx on public.jobs(test_workflow, status, created_at desc);

-- ------------------------------------------------------------
-- Lab sessions
-- One accepted assignment can have one active testing session.
-- ------------------------------------------------------------

create table if not exists public.test_lab_sessions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.test_assignments(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  tester_id uuid not null references public.tester_profiles(user_id) on delete cascade,
  status public.lab_session_status not null default 'not_started',
  started_at timestamptz,
  submitted_at timestamptz,
  last_saved_at timestamptz not null default now(),
  device_metadata jsonb not null default '{}'::jsonb,
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  issue_count integer not null default 0 check (issue_count >= 0),
  note_count integer not null default 0 check (note_count >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id),
  constraint test_lab_sessions_assignment_match check (assignment_id is not null and job_id is not null and tester_id is not null)
);

create index if not exists test_lab_sessions_tester_idx on public.test_lab_sessions(tester_id, status, created_at desc);
create index if not exists test_lab_sessions_job_idx on public.test_lab_sessions(job_id, status);

drop trigger if exists test_lab_sessions_set_updated_at on public.test_lab_sessions;
create trigger test_lab_sessions_set_updated_at
before update on public.test_lab_sessions
for each row execute function public.set_updated_at();

alter table public.test_lab_sessions enable row level security;

drop policy if exists "test_lab_sessions_select_related" on public.test_lab_sessions;
create policy "test_lab_sessions_select_related" on public.test_lab_sessions
for select using (
  public.is_admin()
  or tester_id = auth.uid()
  or exists (
    select 1 from public.jobs j
    where j.id = test_lab_sessions.job_id
      and j.developer_id = auth.uid()
  )
);

drop policy if exists "test_lab_sessions_insert_tester" on public.test_lab_sessions;
create policy "test_lab_sessions_insert_tester" on public.test_lab_sessions
for insert with check (
  tester_id = auth.uid()
  and exists (
    select 1 from public.test_assignments ta
    where ta.id = assignment_id
      and ta.tester_id = auth.uid()
      and ta.job_id = job_id
      and ta.status = 'active'::public.assignment_status
  )
);

drop policy if exists "test_lab_sessions_update_tester_or_admin" on public.test_lab_sessions;
create policy "test_lab_sessions_update_tester_or_admin" on public.test_lab_sessions
for update using (tester_id = auth.uid() or public.is_admin())
with check (tester_id = auth.uid() or public.is_admin());

grant select, insert, update on public.test_lab_sessions to authenticated;

-- ------------------------------------------------------------
-- Structured task results
-- ------------------------------------------------------------

create table if not exists public.test_task_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.test_lab_sessions(id) on delete cascade,
  assignment_id uuid not null references public.test_assignments(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  tester_id uuid not null references public.tester_profiles(user_id) on delete cascade,
  task_key text not null,
  task_order integer not null check (task_order > 0),
  title text not null,
  scenario text,
  instructions text not null,
  expected_outcome text,
  estimated_minutes integer check (estimated_minutes is null or estimated_minutes > 0),
  required boolean not null default true,
  status public.lab_task_status not null default 'not_started',
  started_at timestamptz,
  completed_at timestamptz,
  skip_reason text,
  tester_notes text,
  difficulty_rating text check (difficulty_rating is null or difficulty_rating in ('Very easy', 'Easy', 'Neutral', 'Difficult', 'Very difficult')),
  emotion_rating text check (emotion_rating is null or emotion_rating in ('Smooth', 'Clear', 'Neutral', 'Confusing', 'Frustrating')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, task_key)
);

create index if not exists test_task_results_session_idx on public.test_task_results(session_id, task_order);
create index if not exists test_task_results_job_idx on public.test_task_results(job_id, status);

drop trigger if exists test_task_results_set_updated_at on public.test_task_results;
create trigger test_task_results_set_updated_at
before update on public.test_task_results
for each row execute function public.set_updated_at();

alter table public.test_task_results enable row level security;

drop policy if exists "test_task_results_select_related" on public.test_task_results;
create policy "test_task_results_select_related" on public.test_task_results
for select using (
  public.is_admin()
  or tester_id = auth.uid()
  or exists (select 1 from public.jobs j where j.id = test_task_results.job_id and j.developer_id = auth.uid())
);

drop policy if exists "test_task_results_insert_tester" on public.test_task_results;
create policy "test_task_results_insert_tester" on public.test_task_results
for insert with check (
  tester_id = auth.uid()
  and exists (select 1 from public.test_lab_sessions s where s.id = session_id and s.tester_id = auth.uid())
);

drop policy if exists "test_task_results_update_tester" on public.test_task_results;
create policy "test_task_results_update_tester" on public.test_task_results
for update using (tester_id = auth.uid() or public.is_admin())
with check (tester_id = auth.uid() or public.is_admin());

grant select, insert, update on public.test_task_results to authenticated;

-- ------------------------------------------------------------
-- Tester notes and timeline
-- ------------------------------------------------------------

create table if not exists public.tester_session_notes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.test_lab_sessions(id) on delete cascade,
  assignment_id uuid not null references public.test_assignments(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  tester_id uuid not null references public.tester_profiles(user_id) on delete cascade,
  task_result_id uuid references public.test_task_results(id) on delete set null,
  note_type public.tester_note_type not null default 'observation',
  content text not null check (length(trim(content)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tester_session_notes_session_idx on public.tester_session_notes(session_id, created_at desc);
create index if not exists tester_session_notes_job_idx on public.tester_session_notes(job_id, note_type);

drop trigger if exists tester_session_notes_set_updated_at on public.tester_session_notes;
create trigger tester_session_notes_set_updated_at
before update on public.tester_session_notes
for each row execute function public.set_updated_at();

alter table public.tester_session_notes enable row level security;

drop policy if exists "tester_session_notes_select_related" on public.tester_session_notes;
create policy "tester_session_notes_select_related" on public.tester_session_notes
for select using (
  public.is_admin()
  or tester_id = auth.uid()
  or exists (select 1 from public.jobs j where j.id = tester_session_notes.job_id and j.developer_id = auth.uid())
);

drop policy if exists "tester_session_notes_insert_tester" on public.tester_session_notes;
create policy "tester_session_notes_insert_tester" on public.tester_session_notes
for insert with check (
  tester_id = auth.uid()
  and exists (select 1 from public.test_lab_sessions s where s.id = session_id and s.tester_id = auth.uid())
);

drop policy if exists "tester_session_notes_update_tester" on public.tester_session_notes;
create policy "tester_session_notes_update_tester" on public.tester_session_notes
for update using (tester_id = auth.uid() or public.is_admin())
with check (tester_id = auth.uid() or public.is_admin());

drop policy if exists "tester_session_notes_delete_tester" on public.tester_session_notes;
create policy "tester_session_notes_delete_tester" on public.tester_session_notes
for delete using (tester_id = auth.uid() or public.is_admin());

grant select, insert, update, delete on public.tester_session_notes to authenticated;

create table if not exists public.test_session_timeline (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.test_lab_sessions(id) on delete cascade,
  assignment_id uuid not null references public.test_assignments(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  tester_id uuid not null references public.tester_profiles(user_id) on delete cascade,
  event_type text not null,
  label text not null,
  tone text not null default 'green' check (tone in ('green', 'red', 'amber', 'slate')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists test_session_timeline_session_idx on public.test_session_timeline(session_id, created_at desc);

alter table public.test_session_timeline enable row level security;

drop policy if exists "test_session_timeline_select_related" on public.test_session_timeline;
create policy "test_session_timeline_select_related" on public.test_session_timeline
for select using (
  public.is_admin()
  or tester_id = auth.uid()
  or exists (select 1 from public.jobs j where j.id = test_session_timeline.job_id and j.developer_id = auth.uid())
);

drop policy if exists "test_session_timeline_insert_tester" on public.test_session_timeline;
create policy "test_session_timeline_insert_tester" on public.test_session_timeline
for insert with check (
  tester_id = auth.uid()
  and exists (select 1 from public.test_lab_sessions s where s.id = session_id and s.tester_id = auth.uid())
);

grant select, insert on public.test_session_timeline to authenticated;

-- ------------------------------------------------------------
-- Rich issue reports
-- Extends existing bug_reports table instead of replacing it.
-- ------------------------------------------------------------

alter table public.bug_reports
add column if not exists session_id uuid references public.test_lab_sessions(id) on delete set null,
add column if not exists task_result_id uuid references public.test_task_results(id) on delete set null,
add column if not exists issue_type public.issue_type not null default 'functional_bug',
add column if not exists frequency public.issue_frequency not null default 'sometimes',
add column if not exists steps_to_reproduce text,
add column if not exists expected_result text,
add column if not exists actual_result text,
add column if not exists evidence_paths text[] not null default '{}',
add column if not exists device_metadata jsonb not null default '{}'::jsonb,
add column if not exists route_or_url text,
add column if not exists reported_at timestamptz not null default now();

create index if not exists bug_reports_session_idx on public.bug_reports(session_id, created_at desc);
create index if not exists bug_reports_issue_type_idx on public.bug_reports(job_id, issue_type, severity);

-- ------------------------------------------------------------
-- Final session feedback
-- ------------------------------------------------------------

create table if not exists public.test_session_feedback (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.test_lab_sessions(id) on delete cascade,
  assignment_id uuid not null references public.test_assignments(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  tester_id uuid not null references public.tester_profiles(user_id) on delete cascade,
  overall_experience_rating integer check (overall_experience_rating is null or overall_experience_rating between 1 and 5),
  ease_of_use_rating integer check (ease_of_use_rating is null or ease_of_use_rating between 1 and 5),
  worked_well text,
  confusing text,
  frustrating_moment text,
  best_part text,
  improve_first text,
  recommend_or_use text,
  additional_comments text,
  workflow_answers jsonb not null default '{}'::jsonb,
  readiness_checklist jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id)
);

create index if not exists test_session_feedback_job_idx on public.test_session_feedback(job_id, created_at desc);

drop trigger if exists test_session_feedback_set_updated_at on public.test_session_feedback;
create trigger test_session_feedback_set_updated_at
before update on public.test_session_feedback
for each row execute function public.set_updated_at();

alter table public.test_session_feedback enable row level security;

drop policy if exists "test_session_feedback_select_related" on public.test_session_feedback;
create policy "test_session_feedback_select_related" on public.test_session_feedback
for select using (
  public.is_admin()
  or tester_id = auth.uid()
  or exists (select 1 from public.jobs j where j.id = test_session_feedback.job_id and j.developer_id = auth.uid())
);

drop policy if exists "test_session_feedback_insert_tester" on public.test_session_feedback;
create policy "test_session_feedback_insert_tester" on public.test_session_feedback
for insert with check (
  tester_id = auth.uid()
  and exists (select 1 from public.test_lab_sessions s where s.id = session_id and s.tester_id = auth.uid())
);

drop policy if exists "test_session_feedback_update_tester" on public.test_session_feedback;
create policy "test_session_feedback_update_tester" on public.test_session_feedback
for update using (tester_id = auth.uid() or public.is_admin())
with check (tester_id = auth.uid() or public.is_admin());

grant select, insert, update on public.test_session_feedback to authenticated;

-- ------------------------------------------------------------
-- Developer-readable report view
-- This view avoids showing any tester payout or developer payment internals.
-- ------------------------------------------------------------

create or replace view public.test_lab_report_summary
with (security_invoker = true)
as
select
  s.id as session_id,
  s.assignment_id,
  s.job_id,
  s.tester_id,
  j.developer_id,
  j.title as job_title,
  j.test_workflow,
  p.full_name as tester_name,
  tp.rating as tester_rating,
  s.status as session_status,
  s.started_at,
  s.submitted_at,
  s.progress_percent,
  count(distinct tr.id) filter (where tr.status = 'completed'::public.lab_task_status) as completed_tasks,
  count(distinct tr.id) as total_tasks,
  count(distinct br.id) as issue_count,
  count(distinct n.id) as note_count,
  f.overall_experience_rating,
  f.ease_of_use_rating,
  f.worked_well,
  f.confusing,
  f.improve_first
from public.test_lab_sessions s
join public.jobs j on j.id = s.job_id
join public.profiles p on p.id = s.tester_id
join public.tester_profiles tp on tp.user_id = s.tester_id
left join public.test_task_results tr on tr.session_id = s.id
left join public.bug_reports br on br.session_id = s.id
left join public.tester_session_notes n on n.session_id = s.id
left join public.test_session_feedback f on f.session_id = s.id
group by s.id, j.id, p.full_name, tp.rating, f.id;

grant select on public.test_lab_report_summary to authenticated;

notify pgrst, 'reload schema';

