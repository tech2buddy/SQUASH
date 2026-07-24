import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const requests = new Map<string, { count: number; resetAt: number }>();
const MAX_EMAILS_PER_HOUR = 20;

function allowRequest(userId: string) {
  const now = Date.now();
  const current = requests.get(userId);
  if (!current || current.resetAt <= now) {
    requests.set(userId, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (current.count >= MAX_EMAILS_PER_HOUR) return false;
  current.count += 1;
  return true;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = typeof req.headers.authorization === 'string' ? req.headers.authorization.replace(/^Bearer\s+/i, '') : '';
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!token || !supabaseUrl || !serviceRoleKey) return res.status(401).json({ error: 'Unauthorized' });

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user || !allowRequest(user.id)) return res.status(429).json({ error: 'Too many email requests' });

  const { to, subject, html, text } = req.body || {};
  if (typeof to !== 'string' || typeof subject !== 'string' || !/^\S+@\S+\.\S+$/.test(to) || subject.length > 160) {
    return res.status(400).json({ error: 'Invalid email request' });
  }
  if (typeof html !== 'string' && typeof text !== 'string') return res.status(400).json({ error: 'Email content is required' });
  if ((html?.length || 0) > 20_000 || (text?.length || 0) > 10_000) return res.status(400).json({ error: 'Email content is too large' });

  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    if (!fromEmail) return res.status(503).json({ error: 'Email delivery is not configured' });
    const data = await resend.emails.send({ from: `SQUASH <${fromEmail}>`, to: [to], subject, html, text });
    if (data.error) return res.status(400).json({ error: data.error.message });
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('Email delivery failed', error);
    return res.status(500).json({ error: 'Unable to send email' });
  }
}