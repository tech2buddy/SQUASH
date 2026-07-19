-- SQUASH Phase 7 Admin user controls
-- Adds account status for admin moderation.

alter table public.profiles
add column if not exists account_status text not null default 'active'
check (account_status in ('active', 'suspended', 'under_review'));

create index if not exists profiles_account_status_idx
on public.profiles(account_status);