import { supabase } from './supabase';

export type TransactionalEmailRequest =
  | { type: 'application_reviewed'; applicationId: string }
  | { type: 'submission_reviewed'; submissionId: string }
  | { type: 'payout_requested'; payoutId: string };

export async function sendTransactionalEmail(request: TransactionalEmailRequest) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('You must be signed in to send a notification email.');
  const response = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Unable to send notification email.');
  }
  return response.json();
}