-- Phase 20: payment operations and verified weekly EFT payouts.
-- Apply after phase19_security_hardening.sql.

create table if not exists public.tester_banking_details (
  tester_id uuid primary key references public.tester_profiles(user_id) on delete cascade,
  account_holder_name text not null check (length(trim(account_holder_name)) between 2 and 120),
  bank_name text not null check (length(trim(bank_name)) between 2 and 80),
  account_number text not null check (account_number ~ '^[0-9]{5,20}$'),
  account_type text not null check (account_type in ('cheque', 'savings', 'transmission')),
  branch_code text not null check (branch_code ~ '^[0-9]{6}$'),
  proof_document_path text not null,
  proof_document_name text not null,
  proof_document_type text not null check (proof_document_type in ('application/pdf', 'image/png', 'image/jpeg')),
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'approved', 'rejected', 'changes_required')),
  verification_note text,
  submitted_at timestamptz not null default now(),
  verified_at timestamptz,
  verified_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists tester_banking_details_set_updated_at on public.tester_banking_details;
create trigger tester_banking_details_set_updated_at
before update on public.tester_banking_details
for each row execute function public.set_updated_at();

alter table public.tester_banking_details enable row level security;
drop policy if exists "banking_details_owner_or_admin_select" on public.tester_banking_details;
create policy "banking_details_owner_or_admin_select"
on public.tester_banking_details for select
using (tester_id = auth.uid() or public.is_admin());

revoke all on public.tester_banking_details from anon, authenticated;
grant select on public.tester_banking_details to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tester-banking-documents',
  'tester-banking-documents',
  false,
  5242880,
  array['application/pdf', 'image/png', 'image/jpeg']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "banking_documents_upload_own" on storage.objects;
create policy "banking_documents_upload_own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'tester-banking-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "banking_documents_view_owner_or_admin" on storage.objects;
create policy "banking_documents_view_owner_or_admin"
on storage.objects for select to authenticated
using (
  bucket_id = 'tester-banking-documents'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);

create or replace function public.save_tester_banking_details(
  p_account_holder_name text,
  p_bank_name text,
  p_account_number text,
  p_account_type text,
  p_branch_code text,
  p_proof_document_path text,
  p_proof_document_name text,
  p_proof_document_type text
)
returns public.tester_banking_details
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.tester_banking_details;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.tester_profiles where user_id = auth.uid()) then
    raise exception 'Tester profile required';
  end if;
  if trim(p_account_number) !~ '^[0-9]{5,20}$' then raise exception 'Invalid account number'; end if;
  if trim(p_branch_code) !~ '^[0-9]{6}$' then raise exception 'Branch code must contain 6 digits'; end if;
  if p_account_type not in ('cheque', 'savings', 'transmission') then raise exception 'Invalid account type'; end if;
  if p_proof_document_type not in ('application/pdf', 'image/png', 'image/jpeg') then
    raise exception 'Proof must be a PDF, PNG or JPEG';
  end if;
  if split_part(p_proof_document_path, '/', 1) <> auth.uid()::text then
    raise exception 'Invalid proof document path';
  end if;

  insert into public.tester_banking_details (
    tester_id, account_holder_name, bank_name, account_number, account_type,
    branch_code, proof_document_path, proof_document_name, proof_document_type,
    verification_status, verification_note, submitted_at, verified_at, verified_by
  ) values (
    auth.uid(), trim(p_account_holder_name), trim(p_bank_name), trim(p_account_number), p_account_type,
    trim(p_branch_code), p_proof_document_path, p_proof_document_name, p_proof_document_type,
    'pending', null, now(), null, null
  )
  on conflict (tester_id) do update set
    account_holder_name = excluded.account_holder_name,
    bank_name = excluded.bank_name,
    account_number = excluded.account_number,
    account_type = excluded.account_type,
    branch_code = excluded.branch_code,
    proof_document_path = excluded.proof_document_path,
    proof_document_name = excluded.proof_document_name,
    proof_document_type = excluded.proof_document_type,
    verification_status = 'pending',
    verification_note = null,
    submitted_at = now(),
    verified_at = null,
    verified_by = null
  returning * into v_row;

  insert into public.payout_methods (tester_id, method_type, label, masked_details, is_default)
  values (
    auth.uid(), 'eft', 'Bank Transfer (EFT)',
    trim(p_bank_name) || ' account ending ' || right(trim(p_account_number), 4), true
  )
  on conflict (tester_id) where is_default do update set
    method_type = 'eft',
    label = 'Bank Transfer (EFT)',
    masked_details = excluded.masked_details;

  return v_row;
end;
$$;

create or replace function public.admin_review_tester_banking(
  p_tester_id uuid,
  p_status text,
  p_note text default null
)
returns public.tester_banking_details
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.tester_banking_details;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if p_status not in ('approved', 'rejected', 'changes_required') then
    raise exception 'Invalid verification status';
  end if;
  if p_status <> 'approved' and nullif(trim(p_note), '') is null then
    raise exception 'A reason is required';
  end if;

  update public.tester_banking_details set
    verification_status = p_status,
    verification_note = nullif(trim(p_note), ''),
    verified_at = case when p_status = 'approved' then now() else null end,
    verified_by = auth.uid()
  where tester_id = p_tester_id
  returning * into v_row;
  if v_row.tester_id is null then raise exception 'Banking submission not found'; end if;

  insert into public.admin_activity_logs (admin_id, action, entity_type, entity_id, note, metadata)
  values (
    auth.uid(), 'banking_' || p_status, 'tester_banking', p_tester_id,
    nullif(trim(p_note), ''), jsonb_build_object('tester_id', p_tester_id)
  );
  return v_row;
end;
$$;

alter table public.payouts
  add column if not exists scheduled_for date,
  add column if not exists banking_snapshot jsonb;

revoke all on function public.save_tester_banking_details(text, text, text, text, text, text, text, text) from public;
revoke all on function public.admin_review_tester_banking(uuid, text, text) from public;
grant execute on function public.save_tester_banking_details(text, text, text, text, text, text, text, text) to authenticated;
grant execute on function public.admin_review_tester_banking(uuid, text, text) to authenticated;

create or replace function public.request_tester_payout(p_amount_zar integer)
returns public.payouts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_available integer;
  v_payout public.payouts;
  v_banking public.tester_banking_details;
  v_method_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_amount_zar < 100 then raise exception 'The minimum payout is R100'; end if;

  select * into v_banking from public.tester_banking_details
  where tester_id = auth.uid() and verification_status = 'approved';
  if v_banking.tester_id is null then raise exception 'Verified EFT banking details are required'; end if;

  select id into v_method_id from public.payout_methods
  where tester_id = auth.uid() and method_type = 'eft' and is_default
  order by updated_at desc limit 1;

  select
    coalesce(sum(floor(j.total_amount_zar::numeric / nullif(j.testers_needed, 0)))
      filter (where s.status = 'approved'), 0)
    - coalesce((
      select sum(amount_zar) from public.payouts
      where tester_id = auth.uid() and status in ('pending','processing','paid')
    ), 0)
  into v_available
  from public.test_submissions s
  join public.jobs j on j.id = s.job_id
  where s.tester_id = auth.uid();

  if p_amount_zar > v_available then raise exception 'Requested payout exceeds available balance'; end if;

  insert into public.payouts (
    tester_id, payout_method_id, amount_zar, status, scheduled_for, banking_snapshot
  ) values (
    auth.uid(), v_method_id, p_amount_zar, 'pending',
    current_date + (case when extract(dow from current_date)::int < 5
      then 5 - extract(dow from current_date)::int
      else 12 - extract(dow from current_date)::int end),
    jsonb_build_object(
      'account_holder_name', v_banking.account_holder_name,
      'bank_name', v_banking.bank_name,
      'account_number', v_banking.account_number,
      'account_type', v_banking.account_type,
      'branch_code', v_banking.branch_code
    )
  ) returning * into v_payout;
  return v_payout;
end;
$$;

revoke all on function public.request_tester_payout(integer) from public;
grant execute on function public.request_tester_payout(integer) to authenticated;
