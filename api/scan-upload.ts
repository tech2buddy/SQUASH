import { createClient } from '@supabase/supabase-js';

// Buckets this endpoint is allowed to touch. Anything not listed is
// rejected so a caller cannot point the scanner (and its delete-on-infected
// behaviour) at arbitrary storage objects.
const SCANNABLE_BUCKETS = new Set([
  'bug-screenshots',
  'bug-videos',
  'tester-banking-documents',
  'qualification-evidence',
  'specialization-evidence',
  'job-attachments',
]);

const SCAN_TIMEOUT_MS = 25_000;

function bearerToken(header: unknown) {
  return typeof header === 'string' ? header.replace(/^Bearer\s+/i, '') : '';
}

/**
 * Records a scan verdict. Failures here are logged rather than thrown --
 * losing the audit row must not break an upload whose file was already
 * scanned -- but they must never be silent, or a missing table/grant looks
 * identical to "no scan ever happened".
 */
async function recordScan(
  supabase: any,
  input: { bucket: string; path: string; userId: string; status: string; threats: string[] },
) {
  const { error } = await supabase.from('file_scans').upsert({
    bucket_id: input.bucket,
    object_path: input.path,
    uploaded_by: input.userId,
    status: input.status,
    threat_names: input.threats,
  }, { onConflict: 'bucket_id,object_path' });

  if (error) {
    console.error('scan-upload: could not record scan verdict', {
      bucket: input.bucket,
      path: input.path,
      status: input.status,
      error,
    });
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const scanApiKey = process.env.CLOUDMERSIVE_API_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(503).json({ error: 'Upload scanning is not configured' });
  }

  const token = bearerToken(req.headers.authorization);
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const bucket = typeof req.body?.bucket === 'string' ? req.body.bucket : '';
  const path: string = typeof req.body?.path === 'string' ? req.body.path : '';
  if (!SCANNABLE_BUCKETS.has(bucket) || !path || path.includes('..')) {
    return res.status(400).json({ error: 'Invalid file reference' });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });
  // Every scanned upload is stored under the uploader's auth UID. Check this
  // before using the service role to download or remove a storage object.
  if (!path.startsWith(`${user.id}/`) || path.split('/').some((segment) => !segment || segment === '.')) {
    return res.status(403).json({ error: 'File is not owned by this account' });
  }

  if (!scanApiKey) {
    await recordScan(supabase, {
      bucket, path, userId: user.id, status: 'error', threats: ['scanner_not_configured'],
    });
    await supabase.storage.from(bucket).remove([path]);
    return res.status(503).json({ error: 'File scanning is unavailable. Please try again later.' });
  }

  const { data: file, error: downloadError } = await supabase.storage.from(bucket).download(path);
  if (downloadError || !file) {
    return res.status(404).json({ error: 'File not found' });
  }

  let cleanResult: boolean;
  let threats: string[];
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SCAN_TIMEOUT_MS);

    const form = new FormData();
    form.append('inputFile', file, path.split('/').pop() || 'upload');

    const response = await fetch('https://api.cloudmersive.com/virus/scan/file', {
      method: 'POST',
      signal: controller.signal,
      headers: { Apikey: scanApiKey },
      body: form,
    });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`Scanner returned ${response.status}`);
    const result = await response.json();
    cleanResult = result?.CleanResult === true;
    threats = Array.isArray(result?.FoundViruses)
      ? result.FoundViruses.map((virus: any) => String(virus?.VirusName || 'unknown')).slice(0, 20)
      : [];
  } catch (error) {
    console.error('scan-upload: scanner call failed', { bucket, path, error });
    await recordScan(supabase, {
      bucket, path, userId: user.id, status: 'error', threats: ['scan_failed'],
    });

    await supabase.storage.from(bucket).remove([path]);
    return res.status(503).json({ error: 'File scanning is unavailable. Please try again later.' });
  }

  await recordScan(supabase, {
    bucket, path, userId: user.id, status: cleanResult ? 'clean' : 'infected', threats,
  });

  if (!cleanResult) {
    await supabase.storage.from(bucket).remove([path]);
    console.warn('scan-upload: infected file removed', { bucket, path, threats });
    return res.status(422).json({
      scanned: true,
      clean: false,
      error: 'This file failed a malware check and was not accepted.',
    });
  }

  return res.status(200).json({ scanned: true, clean: true });
}
