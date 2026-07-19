-- SQUASH Phase 5 Tester payout requests
-- Allows testers to create their own payout requests while admins still process them.

drop policy if exists "payouts_insert_tester_own_pending" on public.payouts;
create policy "payouts_insert_tester_own_pending" on public.payouts
for insert with check (
  tester_id = auth.uid()
  and status = 'pending'
);
