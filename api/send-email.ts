import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const MAX_EMAILS_PER_HOUR = 20;
type EmailRequest =
  | { type: 'application_reviewed'; applicationId: string }
  | { type: 'submission_reviewed'; submissionId: string }
  | { type: 'payout_requested'; payoutId: string };

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
function escapeHtml(value: unknown): string {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}
function parseRequest(body: unknown): EmailRequest | null {
  if (!body || typeof body !== 'object') return null;
  const value = body as Record<string, unknown>;
  if (value.type === 'application_reviewed' && isUuid(value.applicationId)) return { type: value.type, applicationId: value.applicationId };
  if (value.type === 'submission_reviewed' && isUuid(value.submissionId)) return { type: value.type, submissionId: value.submissionId };
  if (value.type === 'payout_requested' && isUuid(value.payoutId)) return { type: value.type, payoutId: value.payoutId };
  return null;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = typeof req.headers.authorization === 'string' ? req.headers.authorization.replace(/^Bearer\s+/i, '') : '';
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!token || !supabaseUrl || !serviceRoleKey) return res.status(401).json({ error: 'Unauthorized' });
  if (!resendApiKey || !fromEmail) return res.status(503).json({ error: 'Email delivery is not configured' });

  const request = parseRequest(req.body);
  if (!request) return res.status(400).json({ error: 'Invalid notification request' });

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

  const { data: quotaAllowed, error: quotaError } = await supabase.rpc('consume_email_rate_limit', {
    p_user_id: user.id,
    p_limit: MAX_EMAILS_PER_HOUR,
  });
  if (quotaError) {
    console.error('Email rate-limit check failed', quotaError);
    return res.status(503).json({ error: 'Email delivery is temporarily unavailable' });
  }
  if (!quotaAllowed) return res.status(429).json({ error: 'Too many email requests' });

  let recipientUserId: string;
  let subject: string;
  let html: string;
  let text: string;

  if (request.type === 'application_reviewed') {
    const { data: application } = await supabase.from('job_applications').select('tester_id, job_id, status').eq('id', request.applicationId).maybeSingle();
    if (!application) return res.status(404).json({ error: 'Notification source not found' });
    const { data: job } = await supabase.from('jobs').select('developer_id, title').eq('id', application.job_id).maybeSingle();
    if (!job || job.developer_id !== user.id) return res.status(403).json({ error: 'Forbidden' });
    const approved = application.status === 'accepted';
    if (!approved && application.status !== 'rejected') return res.status(409).json({ error: 'Application has not been reviewed' });
    recipientUserId = application.tester_id;
    const jobTitle = escapeHtml(job.title || 'a SQUASH testing job');
    subject = approved ? `Your application for "${job.title}" was approved` : `Update on your application for "${job.title}"`;
    html = approved
      ? `<h2>Application approved</h2><p>Your application to test <strong>${jobTitle}</strong> was approved. Sign in to SQUASH to begin.</p>`
      : `<h2>Application update</h2><p>Your application to test <strong>${jobTitle}</strong> was not selected for this cycle.</p>`;
    text = approved ? `Your application to test ${job.title} was approved. Sign in to SQUASH to begin.` : `Your application to test ${job.title} was not selected for this cycle.`;
  } else if (request.type === 'submission_reviewed') {
    const { data: submission } = await supabase.from('test_submissions').select('tester_id, job_id, status').eq('id', request.submissionId).maybeSingle();
    if (!submission) return res.status(404).json({ error: 'Notification source not found' });
    const { data: job } = await supabase.from('jobs').select('developer_id, title').eq('id', submission.job_id).maybeSingle();
    if (!job || job.developer_id !== user.id) return res.status(403).json({ error: 'Forbidden' });
    if (!['approved', 'changes_requested', 'rejected'].includes(submission.status)) return res.status(409).json({ error: 'Submission has not been reviewed' });
    recipientUserId = submission.tester_id;
    const status = String(submission.status).replaceAll('_', ' ');
    subject = `Your test submission for "${job.title}" was reviewed`;
    html = `<h2>Submission reviewed</h2><p>Your submission for <strong>${escapeHtml(job.title)}</strong> is now <strong>${escapeHtml(status)}</strong>. Sign in to SQUASH for details.</p>`;
    text = `Your submission for ${job.title} is now ${status}. Sign in to SQUASH for details.`;
  } else {
    const { data: payout } = await supabase.from('payouts').select('tester_id, amount_zar').eq('id', request.payoutId).maybeSingle();
    if (!payout) return res.status(404).json({ error: 'Notification source not found' });
    if (payout.tester_id !== user.id) return res.status(403).json({ error: 'Forbidden' });
    recipientUserId = payout.tester_id;
    const amount = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(payout.amount_zar);
    subject = 'Your SQUASH payout request was received';
    html = `<h2>Payout request received</h2><p>Your request for <strong>${escapeHtml(amount)}</strong> is pending review for the next eligible Friday EFT run.</p>`;
    text = `Your payout request for ${amount} is pending review for the next eligible Friday EFT run.`;
  }

  const { data: recipient, error: recipientError } = await supabase.auth.admin.getUserById(recipientUserId);
  const to = recipient.user?.email;
  if (recipientError || !to) return res.status(404).json({ error: 'Notification recipient not found' });

  try {
    const result = await new Resend(resendApiKey).emails.send({
      from: `SQUASH <${fromEmail}>`, to: [to], subject: subject.slice(0, 160),
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">${html}<p>— The SQUASH Team</p></div>`,
      text: `${text}\n\n— The SQUASH Team`,
    });
    if (result.error) {
      console.error('Email provider rejected delivery', result.error);
      return res.status(502).json({ error: 'Unable to send email' });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Email delivery failed', error);
    return res.status(500).json({ error: 'Unable to send email' });
  }
}