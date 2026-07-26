import { supabase } from './supabase';

export type DeveloperJobPayment = {
  id: string;
  jobId: string;
  amountZar: number;
  status: 'creating' | 'pending' | 'succeeded' | 'failed' | 'cancelled' | 'refunded';
  paidAt: string | null;
  createdAt: string;
};
export async function startJobCheckout(jobId: string) {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.access_token) throw new Error('Please log in again before paying.');

  const response = await fetch('/api/create-checkout', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ jobId }),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.checkoutUrl) {
    throw new Error(result?.error || 'Unable to start secure payment.');
  }
  return result.checkoutUrl as string;
}
export async function getDeveloperJobPayments(developerId: string): Promise<DeveloperJobPayment[]> {
  const { data, error } = await (supabase.from('job_payments') as any)
    .select('id, job_id, amount_cents, status, paid_at, created_at')
    .eq('developer_id', developerId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  return (data || []).map((payment: any) => ({
    id: payment.id,
    jobId: payment.job_id,
    amountZar: Math.round(Number(payment.amount_cents || 0) / 100),
    status: payment.status,
    paidAt: payment.paid_at,
    createdAt: payment.created_at,
  }));
}
export async function getJobPaymentStatus(jobId: string) {
  const { data, error } = await (supabase.from('job_payments') as any)
    .select('status, paid_at, failure_reason')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as { status: 'creating' | 'pending' | 'succeeded' | 'failed' | 'cancelled' | 'refunded'; paid_at: string | null; failure_reason: string | null } | null;
}