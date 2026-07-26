-- Phase 23: auditable weekly Friday payout batches.
-- Apply after phase21_weekly_eft_controls.sql.

create table if not exists public.payout_batches (
  id uuid primary key default gen_random_uuid(),
  scheduled_for date not null unique,
  status text not null default 'open'
    check (status in ('open', 'locked', 'processing', 'completed', 'cancelled')),
  payout_count integer not null default 0,
  total_amount_zar integer not null default 0,
  created_by uuid not null references public.profiles(id) on delete restrict,
  locked_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (extract(dow from scheduled_for) = 5)
);

drop trigger if exists payout_batches_set_updated_at on public.payout_batches;
create trigger payout_batches_set_updated_at
before update on public.payout_batches
for each row execute function public.set_updated_at();

alter table public.payouts
add column if not exists batch_id uuid references public.payout_batches(id) on delete set null;

create index if not exists payouts_batch_idx on public.payouts(batch_id, status);

alter table public.payout_batches enable row level security;
drop policy if exists "payout_batches_admin_select" on public.payout_batches;
create policy "payout_batches_admin_select"
on public.payout_batches for select using (public.is_admin());

revoke all on public.payout_batches from anon, authenticated;
grant select on public.payout_batches to authenticated;

create or replace function public.admin_prepare_friday_batch(p_scheduled_for date)
returns public.payout_batches
language plpgsql
security definer
set search_path = public
as $$
declare
  v_batch public.payout_batches;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if extract(dow from p_scheduled_for) <> 5 then raise exception 'Payout batches must be scheduled for a Friday'; end if;

  insert into public.payout_batches (scheduled_for, created_by)
  values (p_scheduled_for, auth.uid())
  on conflict (scheduled_for) do update set updated_at = now()
  returning * into v_batch;

  if v_batch.status <> 'open' then raise exception 'This payout batch is already locked'; end if;

  update public.payouts set batch_id = v_batch.id
  where status = 'pending'
    and batch_id is null
    and scheduled_for <= p_scheduled_for;

  update public.payout_batches b set
    payout_count = totals.payout_count,
    total_amount_zar = totals.total_amount_zar
  from (
    select count(*)::integer payout_count, coalesce(sum(amount_zar), 0)::integer total_amount_zar
    from public.payouts where batch_id = v_batch.id
  ) totals
  where b.id = v_batch.id
  returning b.* into v_batch;

  insert into public.admin_activity_logs (admin_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(), 'payout_batch_prepared', 'payout_batch', v_batch.id,
    jsonb_build_object('scheduled_for', p_scheduled_for, 'payout_count', v_batch.payout_count, 'total_amount_zar', v_batch.total_amount_zar)
  );
  return v_batch;
end;
$$;

create or replace function public.admin_update_payout_batch(
  p_batch_id uuid,
  p_status text
)
returns public.payout_batches
language plpgsql
security definer
set search_path = public
as $$
declare
  v_batch public.payout_batches;
  v_unpaid integer;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if p_status not in ('locked', 'processing', 'completed', 'cancelled') then raise exception 'Invalid batch status'; end if;

  if p_status = 'completed' then
    select count(*) into v_unpaid from public.payouts
    where batch_id = p_batch_id and status <> 'paid';
    if v_unpaid > 0 then raise exception 'Every payout must be marked paid before completing the batch'; end if;
  end if;

  update public.payout_batches set
    status = p_status,
    locked_at = case when p_status in ('locked', 'processing', 'completed') then coalesce(locked_at, now()) else locked_at end,
    completed_at = case when p_status = 'completed' then now() else null end
  where id = p_batch_id
  returning * into v_batch;
  if v_batch.id is null then raise exception 'Payout batch not found'; end if;

  insert into public.admin_activity_logs (admin_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(), 'payout_batch_' || p_status, 'payout_batch', p_batch_id,
    jsonb_build_object('scheduled_for', v_batch.scheduled_for, 'payout_count', v_batch.payout_count, 'total_amount_zar', v_batch.total_amount_zar)
  );
  return v_batch;
end;
$$;

revoke all on function public.admin_prepare_friday_batch(date) from public;
revoke all on function public.admin_update_payout_batch(uuid, text) from public;
grant execute on function public.admin_prepare_friday_batch(date) to authenticated;
grant execute on function public.admin_update_payout_batch(uuid, text) to authenticated;
