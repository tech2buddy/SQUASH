import { isSupabaseConfigured, supabase } from './supabase';
import { hasExpectedFileSignature, type SafeFileKind } from './fileValidation';

export type UploadFileType = 'screenshot' | 'video';

export interface UploadResult {
  path: string;
  url: string;
  error?: string;
}

/**
 * Upload a file to Supabase Storage for bug reports
 * @param file - The file to upload
 * @param type - Either 'screenshot' or 'video'
 * @param testerId - The tester's user ID
 * @param jobId - The job ID
 * @returns Upload result with path and URL
 */
export async function uploadBugReportFile(
  file: File,
  type: UploadFileType,
  testerId: string,
  jobId: string
): Promise<UploadResult> {
  if (!isSupabaseConfigured) {
    return {
      path: '',
      url: '',
      error: 'Supabase is not configured',
    };
  }

  // Validate file type
  const bucketName = type === 'screenshot' ? 'bug-screenshots' : 'bug-videos';
  const allowedTypes: Record<string, SafeFileKind> = type === 'screenshot'
    ? { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }
    : { 'video/mp4': 'mp4', 'video/webm': 'webm' };
  const safeKind = allowedTypes[file.type];

  if (!safeKind) {
    return {
      path: '',
      url: '',
      error: `Invalid file type. Expected ${Object.keys(allowedTypes).join(', ')}`,
    };
  }

  if (!(await hasExpectedFileSignature(file, safeKind))) {
    return { path: '', url: '', error: 'File contents do not match the declared file type.' };
  }

  // Validate file size
  const maxSize = type === 'screenshot' ? 5 * 1024 * 1024 : 10 * 1024 * 1024; // 5MB for screenshots, 10MB for videos
  if (file.size > maxSize) {
    return {
      path: '',
      url: '',
      error: `File too large. Maximum size is ${type === 'screenshot' ? '5MB' : '10MB'}`,
    };
  }

  try {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const extension = safeKind;
    const filename = `${timestamp}_${Math.random().toString(36).substring(7)}.${extension}`;
    const filePath = `${testerId}/${jobId}/${filename}`;

    // Upload file
    const { data, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      return {
        path: '',
        url: '',
        error: uploadError.message,
      };
    }

    return { path: data.path, url: '' };
  } catch (error) {
    return {
      path: '',
      url: '',
      error: error instanceof Error ? error.message : 'Unknown upload error',
    };
  }
}

export type TesterJobEvidence = {
  path: string;
  name: string;
  type: UploadFileType;
  url: string;
};

export async function listTesterJobEvidence(
  testerId: string,
  jobId: string,
): Promise<TesterJobEvidence[]> {
  if (!isSupabaseConfigured) return [];

  const folder = `${testerId}/${jobId}`;
  const buckets: Array<{ name: string; type: UploadFileType }> = [
    { name: 'bug-screenshots', type: 'screenshot' },
    { name: 'bug-videos', type: 'video' },
  ];

  const results = await Promise.all(buckets.map(async (bucket) => {
    const { data: files, error } = await supabase.storage
      .from(bucket.name)
      .list(folder, { limit: 100, sortBy: { column: 'created_at', order: 'asc' } });

    if (error) return [];

    return Promise.all((files || [])
      .filter((file) => file.name && file.name !== '.emptyFolderPlaceholder')
      .map(async (file) => {
        const path = `${folder}/${file.name}`;
        const { data, error: signedUrlError } = await supabase.storage
          .from(bucket.name)
          .createSignedUrl(path, 3600);
        if (signedUrlError || !data?.signedUrl) return null;
        return { path, name: file.name, type: bucket.type, url: data.signedUrl } satisfies TesterJobEvidence;
      }));
  }));

  return results.flat().filter((item): item is TesterJobEvidence => item !== null);
}

/**
 * Delete a file from Supabase Storage
 * @param path - The file path
 * @param type - Either 'screenshot' or 'video'
 * @returns Success or error
 */export async function deleteBugReportFile(
  path: string,
  type: UploadFileType
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      error: 'Supabase is not configured',
    };
  }

  try {
    const bucketName = type === 'screenshot' ? 'bug-screenshots' : 'bug-videos';
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([path]);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown delete error',
    };
  }
}

/**
 * Get a signed URL for a private file (valid for 60 seconds)
 * @param path - The file path
 * @param type - Either 'screenshot' or 'video'
 * @returns Signed URL or error
 */
export async function getSignedUrl(
  path: string,
  type: UploadFileType
): Promise<{ url: string; error?: string }> {
  if (!isSupabaseConfigured) {
    return {
      url: '',
      error: 'Supabase is not configured',
    };
  }

  try {
    const bucketName = type === 'screenshot' ? 'bug-screenshots' : 'bug-videos';
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(path, 3600);

    if (error) {
      return {
        url: '',
        error: error.message,
      };
    }

    return { url: data.signedUrl };
  } catch (error) {
    return {
      url: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
