import { createClient } from '@supabase/supabase-js';

// Kept inside the Vercel function so its runtime does not depend on a
// cross-directory TypeScript import. phase67 enforces the same rates in SQL.
const rates: Record<string, { rate: number; minimum: number }> = {
  'bug-hunting': { rate: 100, minimum: 5 },
  onboarding: { rate: 90, minimum: 3 },
  usability: { rate: 140, minimum: 5 },
  'low-data': { rate: 150, minimum: 3 },
  localization: { rate: 180, minimum: 3 },
  accessibility: { rate: 220, minimum: 3 },
};

export function expectedJobTotal(type: unknown, count: unknown): number | null {
  if (typeof type !== 'string' || !Object.hasOwn(rates, type)) return null;
  const price = rates[type];
  if (!Number.isSafeInteger(count) || (count as number) < price.minimum || (count as number) > 1000) return null;
  return price.rate * (count as number);
}

const CHECKOUT_LIFETIME_MS = 45 * 60_000;
const PAYMENT_SETTLEMENT_GRACE_MS = 30 * 60_000;
const MIN_YOCO_EXPIRY_LEAD_MS = 30 * 60_000;

function bearerToken(header: unknown) {
  return typeof header === 'string' ? header.replace(/^Bearer\s+/i, '') : '';
}

function appUrl() {
  const configured = process.env.APP_URL?.replace(/\/+$/, '');
  if (configured) return configured;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return '';
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const paymentSecret = process.env.YOCO_SECRET_KEY;
  const baseUrl = appUrl();
  const token = bearerToken(req.headers.authorization);
  if (!supabaseUrl || !serviceRoleKey || !paymentSecret || !baseUrl) {
    return res.status(503).json({ error: 'Online payments are not configured yet' });
  }
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const jobId = typeof req.body?.jobId === 'string' ? req.body.jobId : '';
  if (!/^[0-9a-f-]{36}$/i.test(jobId)) return res.status(400).json({ error: 'Invalid job' });

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    if (authError) console.error('create-checkout: auth.getUser failed', authError);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('id, developer_id, title, package_key, testers_needed, total_amount_zar, live_session_enabled, status')
    .eq('id', jobId)
    .eq('developer_id', user.id)
    .maybeSingle();
  if (jobError) {
    console.error('create-checkout: job lookup failed', jobError);
    return res.status(500).json({ error: 'Unable to prepare payment right now' });
  }
  if (!job) return res.status(404).json({ error: 'Job not found' });
  const expectedTotal = expectedJobTotal(job.package_key, job.testers_needed);
  if (job.status !== 'draft' || job.live_session_enabled || expectedTotal === null || job.total_amount_zar !== expectedTotal) {
    return res.status(409).json({ error: 'This job needs a valid draft price before payment. Please review and save it again.' });
  }

  const { data: existing, error: existingError } = await supabase
    .from('job_payments')
    .select('id, status, redirect_url, created_at, metadata')
    .eq('job_id', job.id)
    .in('status', ['creating', 'pending', 'succeeded'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existingError) {
    console.error('Checkout payment lookup failed', existingError);
    return res.status(503).json({ error: 'Unable to verify payment status. Please try again shortly.' });
  }
  if (existing?.status === 'succeeded') {
    return res.status(409).json({ error: 'This job has already been paid' });
  }
  const now = Date.now();
  const priorExpiry = typeof existing?.metadata?.checkout_expires_at === 'string'
    ? Date.parse(existing.metadata.checkout_expires_at) : NaN;
  if (existing?.status === 'pending') {
    if (!Number.isFinite(priorExpiry)) {
      return res.status(409).json({ error: 'This earlier checkout needs payment review. Please contact SQUASH support.' });
    }
    if (now < priorExpiry && existing.redirect_url) {
      return res.status(200).json({ checkoutUrl: existing.redirect_url });
    }
    if (now < priorExpiry + PAYMENT_SETTLEMENT_GRACE_MS) {
      return res.status(409).json({ error: 'This checkout has expired. Please wait for payment confirmation before retrying.' });
    }
    const { data: expired, error: expireError } = await supabase.from('job_payments')
      .update({ status: 'cancelled', failure_reason: 'Checkout expired without payment confirmation' })
      .eq('id', existing.id).eq('status', 'pending').select('id').maybeSingle();
    if (expireError || !expired) return res.status(409).json({ error: 'Payment status changed. Please refresh and try again.' });
  }
  if (existing?.status === 'creating' && now - Date.parse(existing.created_at) < 30_000) {
    return res.status(409).json({ error: 'A checkout is already being prepared. Please try again shortly.' });
  }

  const amountCents = job.total_amount_zar * 100;
  const reusable = existing?.status === 'creating'
    && Number.isFinite(priorExpiry)
    && priorExpiry - now >= MIN_YOCO_EXPIRY_LEAD_MS;
  if (existing?.status === 'creating' && !reusable) {
    const { data: cleared, error: clearError } = await supabase.from('job_payments')
      .update({ status: 'failed', failure_reason: 'Interrupted checkout creation' })
      .eq('id', existing.id).eq('status', 'creating').select('id').maybeSingle();
    if (clearError || !cleared) return res.status(409).json({ error: 'Payment status changed. Please refresh and try again.' });
  }
  const checkoutExpiresAt = reusable
    ? new Date(priorExpiry).toISOString()
    : new Date(now + CHECKOUT_LIFETIME_MS).toISOString();
  const newPayment = reusable ? { data: { id: existing.id }, error: null } : await supabase
    .from('job_payments')
    .insert({
      job_id: job.id,
      developer_id: user.id,
      amount_cents: amountCents,
      currency: 'ZAR',
      status: 'creating',
      metadata: { job_title: job.title, checkout_expires_at: checkoutExpiresAt },
    })
    .select('id')
    .single();
  const { data: payment, error: paymentError } = newPayment;
  if (paymentError || !payment) {
    if (paymentError?.code === '23505') return res.status(409).json({ error: 'A checkout is already being prepared. Please refresh shortly.' });
    console.error('Could not create internal payment record', paymentError);
    return res.status(500).json({ error: 'Unable to prepare payment' });
  }

  // A draft can change between the first read and our payment insert. Once
  // the creating row exists phase54 blocks later commercial edits; confirm
  // the price again before asking Yoco to charge it.
  const { data: lockedJob, error: lockedJobError } = await supabase
    .from('jobs')
    .select('package_key, testers_needed, total_amount_zar, live_session_enabled, status')
    .eq('id', job.id)
    .maybeSingle();
  if (lockedJobError || !lockedJob || lockedJob.status !== 'draft' || lockedJob.live_session_enabled
    || expectedJobTotal(lockedJob.package_key, lockedJob.testers_needed) !== expectedTotal
    || lockedJob.total_amount_zar !== expectedTotal) {
    await supabase.from('job_payments').update({ status: 'failed', failure_reason: 'Job price changed during checkout setup' }).eq('id', payment.id);
    return res.status(409).json({ error: 'The job changed during checkout setup. Please review it and try again.' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    const response = await fetch('https://payments.yoco.com/api/checkouts', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${paymentSecret}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': payment.id,
      },
      body: JSON.stringify({
        amount: amountCents,
        currency: 'ZAR',
        expiresAt: checkoutExpiresAt,
        successUrl: `${baseUrl}/billing?payment=success&job=${job.id}`,
        cancelUrl: `${baseUrl}/billing?payment=cancelled&job=${job.id}`,
        failureUrl: `${baseUrl}/billing?payment=failed&job=${job.id}`,
        clientReferenceId: job.id,
        externalId: payment.id,
        metadata: {
          paymentId: payment.id,
          jobId: job.id,
          developerId: user.id,
        },
      }),
    });
    clearTimeout(timeout);
    const checkout = await response.json().catch(() => null);
    if (!response.ok || !checkout?.id || !checkout?.redirectUrl) {
      console.error('Payment checkout creation failed', response.status, checkout);
      return res.status(502).json({ error: 'Unable to start secure payment' });
    }

    const { data: updated, error: updateError } = await supabase
      .from('job_payments')
      .update({
        provider_checkout_id: checkout.id,
        redirect_url: checkout.redirectUrl,
        status: 'pending',
        provider_mode: checkout.processingMode || null,
        metadata: { job_title: job.title, checkout_status: checkout.status, checkout_expires_at: checkoutExpiresAt },
      })
      .eq('id', payment.id)
      .eq('status', 'creating')
      .select('id')
      .maybeSingle();
    if (updateError) throw updateError;
    if (!updated) return res.status(409).json({ error: 'Payment status changed. Please refresh.' });
    return res.status(200).json({ checkoutUrl: checkout.redirectUrl });
  } catch (error) {
    // Keep the same idempotency key available for the next attempt. The
    // provider may have created a checkout even if its response was lost.
    console.error('Payment checkout request failed', error);
    return res.status(502).json({ error: 'Unable to start secure payment' });
  }
}
