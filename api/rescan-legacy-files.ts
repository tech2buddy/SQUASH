import { timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const ATTACHMENT_ID = '952728bd-552c-4434-88d4-9d5d84f60eeb';
const BANKING_TESTER_ID = '28556ce9-4374-41eb-9ca8-8e490cc42857';

function validToken(header: unknown, secret: string) {
  const token = typeof header === 'string' ? header.replace(/^Bearer\s+/i, '') : '';
  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const scanKey = process.env.CLOUDMERSIVE_API_KEY;
  if (!url || !serviceKey || !scanKey) return res.status(503).json({ error: 'Rescan is not configured' });
  if (!validToken(req.headers.authorization, serviceKey)) return res.status(401).json({ error: 'Unauthorized' });

  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const [{ data: attachment, error: attachmentError }, { data: banking, error: bankingError }] = await Promise.all([
    db.from('job_attachments').select('file_path,developer_id').eq('id', ATTACHMENT_ID).single(),
    db.from('tester_banking_details').select('proof_document_path,tester_id').eq('tester_id', BANKING_TESTER_ID).single(),
  ]);
  if (attachmentError || bankingError || !attachment || !banking) {
    console.error('Legacy rescan reference lookup failed', attachmentError, bankingError);
    return res.status(503).json({ error: 'Referenced files are not accessible' });
  }
  const files = [
    { bucket: 'job-attachments', path: attachment.file_path, owner: attachment.developer_id },
    { bucket: 'tester-banking-documents', path: banking.proof_document_path, owner: banking.tester_id },
  ];
  const outcomes: string[] = [];
  for (const file of files) {
    const { data: blob, error: downloadError } = await db.storage.from(file.bucket).download(file.path);
    if (downloadError || !blob) {
      outcomes.push(`${file.bucket}:unavailable`);
      continue;
    }
    try {
      const form = new FormData();
      form.append('inputFile', blob, file.path.split('/').at(-1) || 'file');
      const response = await fetch('https://api.cloudmersive.com/virus/scan/file', {
        method: 'POST', headers: { Apikey: scanKey }, body: form,
        signal: AbortSignal.timeout(25_000),
      });
      if (!response.ok) throw new Error(`Scanner returned ${response.status}`);
      const result = await response.json();
      const clean = result?.CleanResult === true;
      const threats = Array.isArray(result?.FoundViruses)
        ? result.FoundViruses.map((item: any) => String(item?.VirusName || 'unknown')).slice(0, 20) : [];
      const { error: saveError } = await db.from('file_scans').upsert({
        bucket_id: file.bucket, object_path: file.path, uploaded_by: file.owner,
        status: clean ? 'clean' : 'infected', threat_names: threats,
        scanned_at: new Date().toISOString(),
      }, { onConflict: 'bucket_id,object_path' });
      if (saveError) throw saveError;
      outcomes.push(`${file.bucket}:${clean ? 'clean' : 'infected'}`);
    } catch (error) {
      console.error('Legacy rescan failed', file.bucket, error);
      outcomes.push(`${file.bucket}:error`);
    }
  }
  return res.status(outcomes.every((value) => value.endsWith(':clean')) ? 200 : 503).json({ outcomes });
}
