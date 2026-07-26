import { hasExpectedFileSignature, type SafeFileKind } from './fileValidation';
import { supabase } from './supabase';

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

const allowedAttachmentTypes: Record<string, { kind: SafeFileKind; extension: string }> = {
  'application/pdf': { kind: 'pdf', extension: 'pdf' },
  'image/png': { kind: 'png', extension: 'png' },
  'image/jpeg': { kind: 'jpg', extension: 'jpg' },
  'image/webp': { kind: 'webp', extension: 'webp' },
};

export async function validateJobAttachment(file: File): Promise<string | null> {
  const allowed = allowedAttachmentTypes[file.type];
  if (!allowed) return `${file.name}: upload a PDF, PNG, JPEG or WebP file.`;
  if (file.size > MAX_ATTACHMENT_BYTES) return `${file.name}: files must be 10 MB or smaller.`;
  if (!(await hasExpectedFileSignature(file, allowed.kind))) {
    return `${file.name}: the file contents do not match its declared type.`;
  }
  return null;
}

export async function uploadDeveloperJobAttachments(jobId: string, developerId: string, files: File[]) {
  for (const file of files) {
    const allowed = allowedAttachmentTypes[file.type];
    if (!allowed) throw new Error(`${file.name} is not an allowed attachment type.`);

    const filePath = `${developerId}/${jobId}/${crypto.randomUUID()}.${allowed.extension}`;
    const { error: uploadError } = await supabase.storage
      .from('job-attachments')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });
    if (uploadError) throw new Error(`Could not upload ${file.name}: ${uploadError.message}`);

    const { error: metadataError } = await supabase.from('job_attachments').insert({
      job_id: jobId,
      developer_id: developerId,
      file_name: file.name.slice(0, 255),
      file_path: filePath,
      mime_type: file.type,
      file_size: file.size,
    });

    if (metadataError) {
      await supabase.storage.from('job-attachments').remove([filePath]);
      throw new Error(`Could not save ${file.name}: ${metadataError.message}`);
    }
  }
}
export type DeveloperJobAttachment = {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  downloadUrl: string;
};

export async function getDeveloperJobAttachments(jobId: string): Promise<DeveloperJobAttachment[]> {
  const { data, error } = await supabase
    .from('job_attachments')
    .select('id, file_name, file_path, mime_type, file_size, created_at')
    .eq('job_id', jobId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(`Could not load job attachments: ${error.message}`);

  return Promise.all((data || []).map(async (item) => {
    const { data: signed, error: signedError } = await supabase.storage
      .from('job-attachments')
      .createSignedUrl(item.file_path, 300);
    if (signedError || !signed?.signedUrl) throw new Error(`Could not open ${item.file_name}.`);
    return {
      id: item.id,
      fileName: item.file_name,
      mimeType: item.mime_type,
      fileSize: item.file_size,
      createdAt: item.created_at,
      downloadUrl: signed.signedUrl,
    };
  }));
}