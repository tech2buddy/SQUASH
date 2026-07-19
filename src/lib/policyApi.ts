import { isSupabaseConfigured, supabase } from './supabase';
import type { PolicyStatus } from './supabase.types';

export type PublicPolicy = {
  slug: string;
  title: string;
  content: string;
  status: PolicyStatus;
  version: string;
  effectiveDate: string | null;
  publishedAt: string | null;
  updatedAt: string;
};

export async function getPublishedPolicyBySlug(slug: string): Promise<PublicPolicy | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('policies')
    .select('slug, title, content, status, version, effective_date, published_at, updated_at')
    .eq('slug', slug)
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    const message = error.message.toLowerCase();
    const missingPoliciesTable =
      error.code === '42P01' ||
      error.code === 'PGRST205' ||
      message.includes('policies') ||
      message.includes('could not find the table') ||
      message.includes('schema cache');
    if (missingPoliciesTable) return null;
    throw error;
  }

  if (!data) return null;

  return {
    slug: data.slug,
    title: data.title,
    content: data.content,
    status: data.status,
    version: data.version,
    effectiveDate: data.effective_date,
    publishedAt: data.published_at,
    updatedAt: data.updated_at,
  };
}
