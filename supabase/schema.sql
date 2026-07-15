-- SQUASH Supabase foundation schema
-- Phase 1: secure core marketplace tables with Row Level Security.
-- Run this in Supabase SQL Editor after creating the project.

create extension if not exists "pgcrypto";

-- Roles and workflow states
do $$ begin
  create type public.user_role as enum ('developer', 'tester', 'admin');
exception when duplicate_object then null;
end $$;
do $$ begin
  create type public.job_status as enum ('draft', 'active', 'in_review', 'completed', 'cancelled');
exception when duplicate_object then null;
end $$;
do $$ begin
  create type public.application_status as enum ('pending', 'accepted', 'rejected', 'withdrawn');
exception when duplicate_object then null;
end $$;
do $$ begin
  create type public.assignment_status as enum ('active', 'submitted', 'approved', 'cancelled');
exception when duplicate_object then null;
end $$;
do $$ begin
  create type public.submission_status as enum ('draft', 'submitted', 'changes_requested', 'approved', 'rejected');
exception when duplicate_object then null;
end $$;
do $$ begin
  create type public.payout_status as enum ('pending', 'processing', 'paid', 'failed', 'cancelled');
exception when duplicate_object then null;
end $$;
do $$ begin
  create type public.notification_status as enum ('unread', 'read');
exception when duplicate_object then null;
end $$;

-- Shared helpers
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;



-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null,
  full_name text not null,
  email text not null,
  avatar_url text,
  phone text,
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_email_lowercase check (email = lower(email))
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Role helpers are created after profiles so Postgres can validate the table reference.
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() = 'admin'::public.user_role;
$$;

create or replace function public.is_developer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() = 'developer'::public.user_role;
$$;

create or replace function public.is_tester()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() = 'tester'::public.user_role;
$$;

create table public.developer_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  company_name text,
  website_url text,
  billing_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger developer_profiles_set_updated_at
before update on public.developer_profiles
for each row execute function public.set_updated_at();

create table public.tester_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  bio text,
  rating numeric(3,2) not null default 0 check (rating >= 0 and rating <= 5),
  tests_completed integer not null default 0 check (tests_completed >= 0),
  approval_rate integer not null default 0 check (approval_rate >= 0 and approval_rate <= 100),
  available_balance_zar integer not null default 0 check (available_balance_zar >= 0),
  preferred_payout_method text not null default 'eft' check (preferred_payout_method in ('eft', 'snapscan', 'airtime')),
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tester_profiles_set_updated_at
before update on public.tester_profiles
for each row execute function public.set_updated_at();

create table public.tester_specializations (
  id uuid primary key default gen_random_uuid(),
  tester_id uuid not null references public.tester_profiles(user_id) on delete cascade,
  specialization_key text not null,
  created_at timestamptz not null default now(),
  unique (tester_id, specialization_key)
);

-- Jobs and marketplace flow
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid not null references public.developer_profiles(user_id) on delete cascade,
  title text not null,
  app_url text,
  platform text not null,
  category text not null,
  package_key text not null check (package_key in ('starter', 'growth', 'pro', 'enterprise')),
  total_amount_zar integer not null check (total_amount_zar >= 0),
  testers_needed integer not null check (testers_needed > 0),
  description text,
  tasks text,
  focus_areas text,
  preferred_specializations text[] not null default '{}',
  live_session_enabled boolean not null default false,
  live_session_at timestamptz,
  status public.job_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index jobs_status_created_idx on public.jobs(status, created_at desc);
create index jobs_developer_idx on public.jobs(developer_id, created_at desc);

create trigger jobs_set_updated_at
before update on public.jobs
for each row execute function public.set_updated_at();

create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  tester_id uuid not null references public.tester_profiles(user_id) on delete cascade,
  status public.application_status not null default 'pending',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, tester_id)
);

create index job_applications_tester_idx on public.job_applications(tester_id, created_at desc);
create index job_applications_job_idx on public.job_applications(job_id, status);

create trigger job_applications_set_updated_at
before update on public.job_applications
for each row execute function public.set_updated_at();

create table public.test_assignments (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  tester_id uuid not null references public.tester_profiles(user_id) on delete cascade,
  application_id uuid references public.job_applications(id) on delete set null,
  status public.assignment_status not null default 'active',
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, tester_id)
);

create index test_assignments_tester_idx on public.test_assignments(tester_id, status);
create index test_assignments_job_idx on public.test_assignments(job_id, status);

create trigger test_assignments_set_updated_at
before update on public.test_assignments
for each row execute function public.set_updated_at();

create table public.test_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.test_assignments(id) on delete cascade,
  tester_id uuid not null references public.tester_profiles(user_id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  status public.submission_status not null default 'draft',
  summary text,
  usability_score integer check (usability_score between 0 and 100),
  performance_score integer check (performance_score between 0 and 100),
  onboarding_score integer check (onboarding_score between 0 and 100),
  bug_severity_score integer check (bug_severity_score between 0 and 100),
  device_compatibility_score integer check (device_compatibility_score between 0 and 100),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id)
);

create index test_submissions_job_idx on public.test_submissions(job_id, status);
create index test_submissions_tester_idx on public.test_submissions(tester_id, status);

create trigger test_submissions_set_updated_at
before update on public.test_submissions
for each row execute function public.set_updated_at();

create table public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references public.test_submissions(id) on delete cascade,
  assignment_id uuid not null references public.test_assignments(id) on delete cascade,
  tester_id uuid not null references public.tester_profiles(user_id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  title text not null,
  description text not null,
  severity text not null check (severity in ('Low', 'Medium', 'High', 'Critical')),
  steps_to_reproduce text,
  expected_result text,
  actual_result text,
  screenshot_path text,
  video_path text,
  video_duration_seconds integer check (video_duration_seconds is null or video_duration_seconds between 0 and 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bug_reports_job_idx on public.bug_reports(job_id, severity);
create index bug_reports_tester_idx on public.bug_reports(tester_id, created_at desc);

create trigger bug_reports_set_updated_at
before update on public.bug_reports
for each row execute function public.set_updated_at();

-- Money-related tables. Keep amounts as integer cents/rands, never floating point.
create table public.payout_methods (
  id uuid primary key default gen_random_uuid(),
  tester_id uuid not null references public.tester_profiles(user_id) on delete cascade,
  method_type text not null check (method_type in ('eft', 'snapscan', 'airtime')),
  label text not null,
  masked_details text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger payout_methods_set_updated_at
before update on public.payout_methods
for each row execute function public.set_updated_at();

create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  tester_id uuid not null references public.tester_profiles(user_id) on delete cascade,
  payout_method_id uuid references public.payout_methods(id) on delete set null,
  amount_zar integer not null check (amount_zar > 0),
  status public.payout_status not null default 'pending',
  admin_note text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payouts_tester_idx on public.payouts(tester_id, status, created_at desc);

create trigger payouts_set_updated_at
before update on public.payouts
for each row execute function public.set_updated_at();

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  status public.notification_status not null default 'unread',
  link_path text,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications(user_id, status, created_at desc);

-- RLS
alter table public.profiles enable row level security;
alter table public.developer_profiles enable row level security;
alter table public.tester_profiles enable row level security;
alter table public.tester_specializations enable row level security;
alter table public.jobs enable row level security;
alter table public.job_applications enable row level security;
alter table public.test_assignments enable row level security;
alter table public.test_submissions enable row level security;
alter table public.bug_reports enable row level security;
alter table public.payout_methods enable row level security;
alter table public.payouts enable row level security;
alter table public.notifications enable row level security;

-- Profiles policies
create policy "profiles_select_own_or_admin" on public.profiles
for select using (id = auth.uid() or public.is_admin());

create policy "profiles_insert_own" on public.profiles
for insert with check (id = auth.uid());

create policy "profiles_update_own_or_admin" on public.profiles
for update using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

create policy "developer_profiles_own_or_admin" on public.developer_profiles
for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

create policy "tester_profiles_public_or_own_or_admin" on public.tester_profiles
for select using (is_public = true or user_id = auth.uid() or public.is_admin());

create policy "tester_profiles_insert_own" on public.tester_profiles
for insert with check (user_id = auth.uid());

create policy "tester_profiles_update_own_or_admin" on public.tester_profiles
for update using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

create policy "tester_specializations_read_public_or_own_or_admin" on public.tester_specializations
for select using (
  tester_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1 from public.tester_profiles tp where tp.user_id = tester_id and tp.is_public = true
  )
);

create policy "tester_specializations_manage_own" on public.tester_specializations
for all using (tester_id = auth.uid() or public.is_admin()) with check (tester_id = auth.uid() or public.is_admin());

-- Jobs policies
create policy "jobs_select_visible" on public.jobs
for select using (
  public.is_admin()
  or developer_id = auth.uid()
  or status in ('active', 'in_review', 'completed')
);

create policy "jobs_insert_developer_own" on public.jobs
for insert with check (developer_id = auth.uid() and public.is_developer());

create policy "jobs_update_developer_own_or_admin" on public.jobs
for update using (developer_id = auth.uid() or public.is_admin()) with check (developer_id = auth.uid() or public.is_admin());

-- Applications policies
create policy "applications_select_related" on public.job_applications
for select using (
  public.is_admin()
  or tester_id = auth.uid()
  or exists (select 1 from public.jobs j where j.id = job_id and j.developer_id = auth.uid())
);

create policy "applications_insert_tester_own" on public.job_applications
for insert with check (tester_id = auth.uid() and public.is_tester());

create policy "applications_update_related" on public.job_applications
for update using (
  public.is_admin()
  or tester_id = auth.uid()
  or exists (select 1 from public.jobs j where j.id = job_id and j.developer_id = auth.uid())
) with check (
  public.is_admin()
  or tester_id = auth.uid()
  or exists (select 1 from public.jobs j where j.id = job_id and j.developer_id = auth.uid())
);

-- Assignments, submissions, reports policies
create policy "assignments_select_related" on public.test_assignments
for select using (
  public.is_admin()
  or tester_id = auth.uid()
  or exists (select 1 from public.jobs j where j.id = job_id and j.developer_id = auth.uid())
);

create policy "assignments_admin_or_developer_insert" on public.test_assignments
for insert with check (
  public.is_admin()
  or exists (select 1 from public.jobs j where j.id = job_id and j.developer_id = auth.uid())
);

create policy "assignments_update_related" on public.test_assignments
for update using (
  public.is_admin()
  or tester_id = auth.uid()
  or exists (select 1 from public.jobs j where j.id = job_id and j.developer_id = auth.uid())
) with check (
  public.is_admin()
  or tester_id = auth.uid()
  or exists (select 1 from public.jobs j where j.id = job_id and j.developer_id = auth.uid())
);

create policy "submissions_select_related" on public.test_submissions
for select using (
  public.is_admin()
  or tester_id = auth.uid()
  or exists (select 1 from public.jobs j where j.id = job_id and j.developer_id = auth.uid())
);

create policy "submissions_insert_tester_assigned" on public.test_submissions
for insert with check (
  tester_id = auth.uid()
  and exists (select 1 from public.test_assignments a where a.id = assignment_id and a.tester_id = auth.uid())
);

create policy "submissions_update_related" on public.test_submissions
for update using (
  public.is_admin()
  or tester_id = auth.uid()
  or exists (select 1 from public.jobs j where j.id = job_id and j.developer_id = auth.uid())
) with check (
  public.is_admin()
  or tester_id = auth.uid()
  or exists (select 1 from public.jobs j where j.id = job_id and j.developer_id = auth.uid())
);

create policy "bug_reports_select_related" on public.bug_reports
for select using (
  public.is_admin()
  or tester_id = auth.uid()
  or exists (select 1 from public.jobs j where j.id = job_id and j.developer_id = auth.uid())
);

create policy "bug_reports_insert_tester_assigned" on public.bug_reports
for insert with check (
  tester_id = auth.uid()
  and exists (select 1 from public.test_assignments a where a.id = assignment_id and a.tester_id = auth.uid())
);

create policy "bug_reports_update_tester_or_admin" on public.bug_reports
for update using (tester_id = auth.uid() or public.is_admin()) with check (tester_id = auth.uid() or public.is_admin());

-- Payout policies
create policy "payout_methods_owner_or_admin" on public.payout_methods
for all using (tester_id = auth.uid() or public.is_admin()) with check (tester_id = auth.uid() or public.is_admin());

create policy "payouts_select_owner_or_admin" on public.payouts
for select using (tester_id = auth.uid() or public.is_admin());

create policy "payouts_insert_admin_only" on public.payouts
for insert with check (public.is_admin());

create policy "payouts_update_admin_only" on public.payouts
for update using (public.is_admin()) with check (public.is_admin());

-- Notifications policies
create policy "notifications_owner_or_admin_select" on public.notifications
for select using (user_id = auth.uid() or public.is_admin());

create policy "notifications_owner_mark_read" on public.notifications
for update using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

create policy "notifications_admin_insert" on public.notifications
for insert with check (public.is_admin());


