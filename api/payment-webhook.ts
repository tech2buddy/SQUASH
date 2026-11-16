import { createHmac, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

export const config = {
  api: {
    bodyParser: false,
  },
};

function headerValue(value: unknown) {
  if (Array.isArray(value)) return String(value[0] || '');
  return typeof value === 'string' ? value : '';
}

async function rawRequestBody(req: any) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

function verifySignature(input: {
  rawBody: string;
  webhookId: string;
  timestamp: string;
  signatures: string;
  secret: string;
}) {
  const timestampSeconds = Number(input.timestamp);
  if (!Number.isFinite(timestampSeconds)) return false;
  if (Math.abs(Date.now() / 1000 - timestampSeconds) > 180) return false;

  const encodedSecret = input.secret.startsWith('whsec_')
    ? input.secret.slice('whsec_'.length)
    : input.secret;
  const secretBytes = Buffer.from(encodedSecret, 'base64');
  if (!secretBytes.length) return false;
  const expected = createHmac('sha256', secretBytes)
    .update(`${input.webhookId}.${input.timestamp}.${input.rawBody}`)
    .digest();

  return input.signatures.split(/\s+/).some((candidate) => {
    const [version, encodedSignature] = candidate.split(',', 2);
    if (version !== 'v1' || !encodedSignature) return false;
    const received = Buffer.from(encodedSignature, 'base64');
    return received.length === expected.length && timingSafeEqual(received, expected);
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const webhookSecret = process.env.YOCO_WEBHOOK_SECRET;
  if (!supabaseUrl || !serviceRoleKey || !webhookSecret) {
    return res.status(503).json({ error: 'Webhook is not configured' });
  }

  const rawBody = await rawRequestBody(req);
  const webhookId = headerValue(req.headers['webhook-id']);
  const timestamp = headerValue(req.headers['webhook-timestamp']);
  const signatures = headerValue(req.headers['webhook-signature']);
  if (!webhookId || !timestamp || !signatures || !verifySignature({
    rawBody,
    webhookId,
    timestamp,
    signatures,
    secret: webhookSecret,
  })) {
    return res.status(403).json({ error: 'Invalid webhook signature' });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ error: 'Invalid webhook body' });
  }
  // Note: event.id (e.g. "evt_...") is the event's own ID and is unrelated
  // to the "webhook-id" header (Svix's delivery message ID, used only for
  // signature verification above) -- they are never expected to match.

  const checkoutId = event?.payload?.metadata?.checkoutId;
  if (typeof checkoutId !== 'string') return res.status(200).json({ received: true });

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: payment, error: paymentError } = await supabase
    .from('job_payments')
    .select('id, job_id, amount_cents, currency, status, provider_payment_id')
    .eq('provider_checkout_id', checkoutId)
    .maybeSingle();
  if (paymentError) {
    console.error('Webhook payment lookup failed', paymentError);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
  if (!payment) return res.status(200).json({ received: true });

  const { error: eventError } = await supabase.from('payment_webhook_events').insert({
    webhook_id: webhookId,
    event_type: String(event.type || 'unknown'),
    provider_checkout_id: checkoutId,
    payment_id: payment.id,
    payload: event,
  });
  // An earlier delivery may have written the audit event and payment, then
  // failed to activate the job. A duplicate must resume that final step.
  if (eventError && eventError.code !== '23505') {
    console.error('Webhook event audit insert failed', eventError);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }

  if (event.type !== 'payment.succeeded' || event?.payload?.status !== 'succeeded') {
    return res.status(200).json({ received: true });
  }
  if (event.payload.amount !== payment.amount_cents || event.payload.currency !== payment.currency) {
    console.error('Webhook amount mismatch', { paymentId: payment.id, webhookId });
    return res.status(400).json({ error: 'Payment amount mismatch' });
  }
  if (typeof event.payload.id !== 'string' || !event.payload.id) {
    return res.status(400).json({ error: 'Invalid payment reference' });
  }
  if (payment.status === 'succeeded' && payment.provider_payment_id !== event.payload.id) {
    console.error('Webhook payment reference mismatch', { paymentId: payment.id, webhookId });
    return res.status(409).json({ error: 'Payment reference mismatch' });
  }

  if (payment.status !== 'succeeded') {
    const { error: updateError } = await supabase
      .from('job_payments')
      .update({
        status: 'succeeded',
        provider_payment_id: event.payload.id,
        provider_mode: event.payload.mode || null,
        paid_at: event.payload.createdDate || new Date().toISOString(),
      })
      .eq('id', payment.id);
    if (updateError) {
      console.error('Payment update failed', updateError);
      return res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  const { error: jobError } = await supabase
    .from('jobs')
    .update({ status: 'active' })
    .eq('id', payment.job_id)
    .eq('status', 'draft');
  if (jobError) {
    console.error('Paid job activation failed', jobError);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
  return res.status(200).json({ received: true });
}
