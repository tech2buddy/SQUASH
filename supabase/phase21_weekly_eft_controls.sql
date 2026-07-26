-- Phase 21: Friday EFT proof and reference controls.
-- Apply after phase20_payments_operations.sql.

alter table public.payouts
  add column if not exists proof_document_path text,
  add column if not exists proof_document_name text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payout-proofs',
  'payout-proofs',
  false,
  5242880,
  array['application/pdf', 'image/png', 'image/jpeg']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "payout_proofs_admin_upload" on storage.objects;
create policy "payout_proofs_admin_upload"
on storage.objects for insert to authenticated
with check (bucket_id = 'payout-proofs' and public.is_admin());

drop policy if exists "payout_proofs_admin_view" on storage.objects;
create policy "payout_proofs_admin_view"
on storage.objects for select to authenticated
using (bucket_id = 'payout-proofs' and public.is_admin());

drop policy if exists "payout_proofs_admin_delete" on storage.objects;
create policy "payout_proofs_admin_delete"
on storage.objects for delete to authenticated
using (bucket_id = 'payout-proofs' and public.is_admin());

-- The older function can change payout status without proof. Disable it once
-- this migration is active and route admin updates through the audited function.
revoke all on function public.admin_update_payout(uuid, text, text, text) from authenticated;

create or replace function public.admin_update_weekly_payout(
  p_payout_id uuid,
  p_status text,
  p_note text default null,
  p_reference text default null,
  p_proof_path text default null,
  p_proof_name text default null
)
returns public.payouts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payout public.payouts;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if p_status not in ('processing', 'paid', 'failed', 'cancelled') then
    raise exception 'Invalid payout status';
  end if;
  if p_status = 'paid' and nullif(trim(p_reference), '') is null then
    raise exception 'An EFT reference is required';
  end if;
  if p_status = 'paid' and (
    nullif(trim(p_proof_path), '') is null
    or split_part(p_proof_path, '/', 1) <> p_payout_id::text
  ) then
    raise exception 'Valid proof of payment is required';
  end if;

  update public.payouts set
    status = p_status,
    admin_note = nullif(trim(p_note), ''),
    payout_reference = nullif(trim(p_reference), ''),
    proof_document_path = case when p_status = 'paid' then p_proof_path else proof_document_path end,
    proof_document_name = case when p_status = 'paid' then p_proof_name else proof_document_name end,
    processed_at = case when p_status in ('paid', 'failed', 'cancelled') then now() else null end
  where id = p_payout_id
  returning * into v_payout;

  if v_payout.id is null then raise exception 'Payout not found'; end if;

  insert into public.admin_activity_logs (admin_id, action, entity_type, entity_id, note, metadata)
  values (
    auth.uid(),
    'payout_' || p_status,
    'payout',
    p_payout_id,
    nullif(trim(p_note), ''),
    jsonb_build_object(
      'payout_reference', p_reference,
      'proof_document_path', p_proof_path,
      'amount_zar', v_payout.amount_zar,
      'tester_id', v_payout.tester_id,
      'scheduled_for', v_payout.scheduled_for
    )
  );
  return v_payout;
end;
$$;

revoke all on function public.admin_update_weekly_payout(uuid, text, text, text, text, text) from public;
grant execute on function public.admin_update_weekly_payout(uuid, text, text, text, text, text) to authenticated;
