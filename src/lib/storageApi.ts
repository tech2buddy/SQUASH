import { isSupabaseConfigured, supabase } from './supabase';

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
  const validMimeTypes = type === 'screenshot'
    ? ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
    : ['video/mp4', 'video/webm', 'video/quicktime'];

  if (!validMimeTypes.includes(file.type)) {
    return {
      path: '',
      url: '',
      error: `Invalid file type. Expected ${validMimeTypes.join(', ')}`,
    };
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
    const extension = file.name.split('.').pop();
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

    // Get public URL (even though bucket is private, we need the path for database storage)
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    return {
      path: data.path,
      url: urlData.publicUrl,
    };
  } catch (error) {
    return {
      path: '',
      url: '',
      error: error instanceof Error ? error.message : 'Unknown upload error',
    };
  }
}

/**
 * Delete a file from Supabase Storage
 * @param path - The file path to delete
 * @param type - Either 'screenshot' or 'video'
 * @returns Success or error
 */
export async function deleteBugReportFile(
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
      .createSignedUrl(path, 60);

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
