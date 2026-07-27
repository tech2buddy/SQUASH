import { createClient } from '@supabase/supabase-js';

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
    .select('id, developer_id, title, total_amount_zar, status')
    .eq('id', jobId)
    .eq('developer_id', user.id)
    .maybeSingle();
  if (jobError) {
    console.error('create-checkout: job lookup failed', jobError);
    return res.status(500).json({ error: 'Unable to prepare payment right now' });
  }
  if (!job) return res.status(404).json({ error: 'Job not found' });
  if (!Number.isInteger(job.total_amount_zar) || job.total_amount_zar <= 0) {
    return res.status(400).json({ error: 'Invalid job total' });
  }

  const { data: existing } = await supabase
    .from('job_payments')
    .select('id, status, redirect_url')
    .eq('job_id', job.id)
    .in('status', ['creating', 'pending', 'succeeded'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing?.status === 'succeeded') {
    return res.status(409).json({ error: 'This job has already been paid' });
  }
  if (existing?.status === 'pending' && existing.redirect_url) {
    return res.status(200).json({ checkoutUrl: existing.redirect_url });
  }
  if (existing?.status === 'creating') {
    return res.status(409).json({ error: 'A checkout is already being prepared. Please try again shortly.' });
  }

  const amountCents = job.total_amount_zar * 100;
  const { data: payment, error: paymentError } = await supabase
    .from('job_payments')
    .insert({
      job_id: job.id,
      developer_id: user.id,
      amount_cents: amountCents,
      currency: 'ZAR',
      status: 'creating',
      metadata: { job_title: job.title },
    })
    .select('id')
    .single();
  if (paymentError || !payment) {
    console.error('Could not create internal payment record', paymentError);
    return res.status(500).json({ error: 'Unable to prepare payment' });
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
      await supabase
        .from('job_payments')
        .update({ status: 'failed', failure_reason: `Checkout creation failed (${response.status})` })
        .eq('id', payment.id);
      console.error('Payment checkout creation failed', response.status, checkout);
      return res.status(502).json({ error: 'Unable to start secure payment' });
    }

    const { error: updateError } = await supabase
      .from('job_payments')
      .update({
        provider_checkout_id: checkout.id,
        redirect_url: checkout.redirectUrl,
        status: 'pending',
        provider_mode: checkout.processingMode || null,
        metadata: { job_title: job.title, checkout_status: checkout.status },
      })
      .eq('id', payment.id);
    if (updateError) throw updateError;
    return res.status(200).json({ checkoutUrl: checkout.redirectUrl });
  } catch (error) {
    await supabase
      .from('job_payments')
      .update({ status: 'failed', failure_reason: 'Checkout request failed' })
      .eq('id', payment.id);
    console.error('Payment checkout request failed', error);
    return res.status(502).json({ error: 'Unable to start secure payment' });
  }
}
