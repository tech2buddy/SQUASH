-- SQUASH Phase 8 Policy Center
-- Run this after the core schema and admin phases.
-- Adds admin-managed policies that can be published to public user-facing pages.

create table if not exists public.policies (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title text not null,
  content text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  version text not null default 'v1.0',
  effective_date date,
  published_at timestamptz,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint policies_slug_version_unique unique (slug, version)
);

create index if not exists policies_slug_status_idx
on public.policies(slug, status);

create index if not exists policies_status_updated_idx
on public.policies(status, updated_at desc);

drop trigger if exists policies_set_updated_at on public.policies;
create trigger policies_set_updated_at
before update on public.policies
for each row execute function public.set_updated_at();

alter table public.policies enable row level security;

drop policy if exists "policies_public_read_published" on public.policies;
create policy "policies_public_read_published" on public.policies
for select using (status = 'published');

drop policy if exists "policies_admin_read_all" on public.policies;
create policy "policies_admin_read_all" on public.policies
for select using (public.is_admin());

drop policy if exists "policies_admin_insert" on public.policies;
create policy "policies_admin_insert" on public.policies
for insert with check (public.is_admin());

drop policy if exists "policies_admin_update" on public.policies;
create policy "policies_admin_update" on public.policies
for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "policies_admin_delete" on public.policies;
create policy "policies_admin_delete" on public.policies
for delete using (public.is_admin());

insert into public.policies (slug, title, content, status, version, effective_date, published_at)
values
  ('terms', 'Terms of Service', 'Source Quality User Assurance Solutions Here. These terms explain the responsibilities for developers, testers and SQUASH when using the platform.', 'published', 'v1.0', current_date, now()),
  ('privacy', 'Privacy Policy', 'SQUASH protects user data and only uses information needed to run testing jobs, payments, support and platform safety.', 'published', 'v1.0', current_date, now()),
  ('tester-code-of-conduct', 'Tester Code of Conduct', 'Testers must submit honest reports, respect confidential apps, avoid sharing private test material and communicate professionally.', 'draft', 'v0.1', null, null),
  ('developer-terms', 'Developer Terms', 'Developers must provide lawful test access, clear instructions, safe URLs and timely review of tester submissions.', 'draft', 'v0.1', null, null),
  ('payout-policy', 'Payout Policy', 'Tester payouts are reviewed and processed after approved work according to the selected payout method and platform controls.', 'draft', 'v0.1', null, null),
  ('refund-policy', 'Refund Policy', 'Refund requests are reviewed against job progress, tester work completed and the quality evidence submitted.', 'draft', 'v0.1', null, null),
  ('dispute-resolution', 'Dispute Resolution Policy', 'SQUASH reviews disputes using job instructions, submitted evidence, tester communication and developer feedback.', 'draft', 'v0.1', null, null),
  ('popia-data-protection', 'POPIA Data Protection Policy', 'SQUASH handles personal information with South African data protection expectations, access controls and minimum necessary use.', 'draft', 'v0.1', null, null)
on conflict (slug, version) do nothing;

grant select on public.policies to anon, authenticated;
grant insert, update, delete on public.policies to authenticated;

notify pgrst, 'reload schema';
