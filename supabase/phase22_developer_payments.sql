-- Phase 22: auditable developer job payments.
-- Payment provider details remain internal. Jobs are activated only by a
-- verified server-side payment webhook.

create table if not exists public.job_payments (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  developer_id uuid not null references public.developer_profiles(user_id) on delete cascade,
  provider text not null default 'yoco' check (provider in ('yoco')),
  provider_checkout_id text unique,
  provider_payment_id text unique,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'ZAR' check (currency = 'ZAR'),
  status text not null default 'creating'
    check (status in ('creating', 'pending', 'succeeded', 'failed', 'cancelled', 'refunded')),
  redirect_url text,
  failure_reason text,
  provider_mode text,
  paid_at timestamptz,
  refunded_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists job_payments_job_idx
on public.job_payments(job_id, created_at desc);

create index if not exists job_payments_developer_idx
on public.job_payments(developer_id, status, created_at desc);

drop trigger if exists job_payments_set_updated_at on public.job_payments;
create trigger job_payments_set_updated_at
before update on public.job_payments
for each row execute function public.set_updated_at();

alter table public.job_payments enable row level security;
drop policy if exists "job_payments_owner_or_admin_select" on public.job_payments;
create policy "job_payments_owner_or_admin_select"
on public.job_payments for select
using (developer_id = auth.uid() or public.is_admin());

revoke all on public.job_payments from anon, authenticated;
grant select on public.job_payments to authenticated;

create table if not exists public.payment_webhook_events (
  webhook_id text primary key,
  event_type text not null,
  provider text not null default 'yoco',
  provider_checkout_id text,
  payment_id uuid references public.job_payments(id) on delete set null,
  payload jsonb not null,
  processed_at timestamptz not null default now()
);

alter table public.payment_webhook_events enable row level security;
drop policy if exists "payment_webhooks_admin_select" on public.payment_webhook_events;
create policy "payment_webhooks_admin_select"
on public.payment_webhook_events for select
using (public.is_admin());

revoke all on public.payment_webhook_events from anon, authenticated;
grant select on public.payment_webhook_events to authenticated;
