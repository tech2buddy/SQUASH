import { supabase } from './supabase';

export class InfectedFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InfectedFileError';
  }
}

/**
 * Scans a file that has already been uploaded to Storage.
 *
 * Throws InfectedFileError if the scanner rejected the file (the server has
 * already deleted it from the bucket at that point), so callers can surface
 * the message and clean up their own database rows.
 *
 * Scanner failures throw for every bucket; the server removes unscanned files.
 */
export async function scanUploadedFile(bucket: string, path: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Please sign in again before uploading a file.');

  const response = await fetch('/api/scan-upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ bucket, path }),
  });

  if (response.ok) return;

  const result = await response.json().catch(() => null);
  throw new InfectedFileError(result?.error || 'This file could not be accepted.');
}
