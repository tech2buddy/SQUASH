-- Phase 32: durable tester notifications for banking submission and review status.
-- Run after phase20_payments_operations.sql and phase12_tester_growth_notifications_referrals.sql.

begin;

create or replace function public.notify_tester_banking_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
  v_body text;
  v_priority text := 'normal';
begin
  if tg_op = 'UPDATE'
     and new.verification_status is not distinct from old.verification_status
     and new.submitted_at is not distinct from old.submitted_at then
    return new;
  end if;

  case new.verification_status
    when 'pending' then
      v_title := 'Banking verification pending';
      v_body := 'Your EFT details and proof of banking were submitted securely for administrator review.';
    when 'approved' then
      v_title := 'Banking details verified';
      v_body := 'Your EFT account is verified and eligible for scheduled Friday payouts.';
      v_priority := 'high';
    when 'changes_required' then
      v_title := 'Banking details need changes';
      v_body := coalesce(nullif(new.verification_note, ''), 'Update your banking details and submit a new supporting document.');
      v_priority := 'high';
    when 'rejected' then
      v_title := 'Banking verification unsuccessful';
      v_body := coalesce(nullif(new.verification_note, ''), 'Review your banking information and contact SQUASH support if you need help.');
      v_priority := 'high';
    else
      return new;
  end case;

  insert into public.notifications (
    user_id,
    title,
    body,
    status,
    link_path,
    notification_type,
    action_label,
    priority,
    metadata
  ) values (
    new.tester_id,
    v_title,
    v_body,
    'unread',
    '/tester/payout-method',
    'payout',
    'View banking status',
    v_priority,
    jsonb_build_object('banking_status', new.verification_status)
  );

  return new;
end;
$$;

revoke all on function public.notify_tester_banking_status() from public, anon, authenticated;

drop trigger if exists tester_banking_status_notification on public.tester_banking_details;
create trigger tester_banking_status_notification
after insert or update of verification_status, verification_note, submitted_at
on public.tester_banking_details
for each row execute function public.notify_tester_banking_status();

commit;