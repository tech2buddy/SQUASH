-- Phase 34: Platform commission pricing.
-- Splits each job's price 62% tester pool / 38% SQUASH commission instead of
-- paying out the full total_amount_zar to testers with zero platform margin.
-- See supabase/README.md "Phase 34" section for the full explanation.

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
    coalesce(sum(floor(j.total_amount_zar::numeric * 0.62 / nullif(j.testers_needed, 0)))
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
