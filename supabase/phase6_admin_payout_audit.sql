-- SQUASH Phase 6 Admin payout audit trail
-- Run this after the core schema and earlier phases.
-- Adds payout references and an admin activity log for money-related actions.

alter table public.payouts
add column if not exists payout_reference text;

create table if not exists public.admin_activity_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_activity_logs_created_idx
on public.admin_activity_logs(created_at desc);

create index if not exists admin_activity_logs_admin_idx
on public.admin_activity_logs(admin_id, created_at desc);

alter table public.admin_activity_logs enable row level security;

drop policy if exists "admin_activity_logs_admin_only_select" on public.admin_activity_logs;
create policy "admin_activity_logs_admin_only_select" on public.admin_activity_logs
for select using (public.is_admin());

drop policy if exists "admin_activity_logs_admin_only_insert" on public.admin_activity_logs;
create policy "admin_activity_logs_admin_only_insert" on public.admin_activity_logs
for insert with check (public.is_admin());
