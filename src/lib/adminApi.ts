import { isSupabaseConfigured, supabase } from './supabase';
import type { JobStatus, PayoutStatus, PolicyStatus, SubmissionStatus, UserRole } from './supabase.types';

export type AdminOverview = {
  totalUsers: number;
  developers: number;
  testers: number;
  activeJobs: number;
  submittedReports: number;
  pendingPayouts: number;
  pendingPayoutTotalZar: number;
};

export type AdminPayoutRow = {
  id: string;
  testerId: string;
  testerName: string;
  testerEmail: string;
  amountZar: number;
  status: PayoutStatus;
  method: string;
  details: string;
  createdAt: string;
  processedAt: string | null;
  adminNote: string | null;
  payoutReference: string | null;
};

export type AdminActivityLog = {
  id: string;
  adminName: string;
  action: string;
  entityType: string;
  entityId: string | null;
  note: string | null;
  createdAt: string;
};
export type AdminPolicyRow = {
  id: string;
  slug: string;
  title: string;
  content: string;
  status: PolicyStatus;
  version: string;
  effectiveDate: string | null;
  publishedAt: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};
export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  city: string | null;
  phone: string | null;
  createdAt: string;
};

export type AdminJobRow = {
  id: string;
  title: string;
  developerId: string;
  developerName: string;
  developerEmail: string;
  platform: string;
  category: string;
  packageKey: 'starter' | 'growth' | 'pro' | 'enterprise';
  testersNeeded: number;
  totalAmountZar: number;
  status: JobStatus;
  createdAt: string;
};

export type AdminReportRow = {
  id: string;
  jobId: string;
  jobTitle: string;
  testerId: string;
  testerName: string;
  testerEmail: string;
  status: SubmissionStatus;
  score: number | null;
  bugCount: number;
  videoBugCount: number;
  submittedAt: string | null;
  createdAt: string;
};
export type AdminUserDetail = AdminUserRow & {
  avatarUrl: string | null;
  accountStatus: 'active' | 'suspended' | 'under_review';
  developerProfile: {
    companyName: string | null;
    websiteUrl: string | null;
    billingEmail: string | null;
  } | null;
  testerProfile: {
    bio: string | null;
    rating: number;
    testsCompleted: number;
    approvalRate: number;
    availableBalanceZar: number;
    preferredPayoutMethod: 'eft' | 'snapscan' | 'airtime';
    isPublic: boolean;
    specializations: string[];
  } | null;
  jobsPosted: number;
  reportsSubmitted: number;
  payoutRequests: number;
  notifications: Array<{
    id: string;
    title: string;
    body: string;
    status: 'unread' | 'read';
    linkPath: string | null;
    createdAt: string;
  }>;
};

async function countTable(table: 'profiles' | 'jobs' | 'test_submissions' | 'payouts', filter?: (query: any) => any) {
  let query = supabase.from(table).select('id', { count: 'exact', head: true });
  if (filter) query = filter(query);
  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

export async function getAdminOverview(): Promise<AdminOverview> {
  if (!isSupabaseConfigured) {
    return {
      totalUsers: 0,
      developers: 0,
      testers: 0,
      activeJobs: 0,
      submittedReports: 0,
      pendingPayouts: 0,
      pendingPayoutTotalZar: 0,
    };
  }

  const [totalUsers, developerRows, testerRows, activeJobs, submittedReports, pendingPayoutsResult] = await Promise.all([
    countTable('profiles'),
    supabase.from('developer_profiles').select('user_id'),
    supabase.from('tester_profiles').select('user_id'),
    countTable('jobs', (query) => query.eq('status', 'active')),
    countTable('test_submissions', (query) => query.eq('status', 'submitted')),
    supabase.from('payouts').select('id, amount_zar').in('status', ['pending', 'processing']),
  ]);

  if (developerRows.error) throw developerRows.error;
  if (testerRows.error) throw testerRows.error;
  if (pendingPayoutsResult.error) throw pendingPayoutsResult.error;

  return {
    totalUsers,
    developers: developerRows.data?.length || 0,
    testers: testerRows.data?.length || 0,
    activeJobs,
    submittedReports,
    pendingPayouts: pendingPayoutsResult.data?.length || 0,
    pendingPayoutTotalZar: (pendingPayoutsResult.data || []).reduce((sum, payout) => sum + Number(payout.amount_zar || 0), 0),
  };
}

export async function getAdminPayoutQueue(): Promise<AdminPayoutRow[]> {
  if (!isSupabaseConfigured) return [];

  const { data: payouts, error: payoutsError } = await supabase
    .from('payouts')
    .select('*')
    .order('created_at', { ascending: false });

  if (payoutsError) throw payoutsError;
  if (!payouts || payouts.length === 0) return [];

  const testerIds = Array.from(new Set(payouts.map((payout) => payout.tester_id)));
  const methodIds = Array.from(new Set(payouts.map((payout) => payout.payout_method_id).filter(Boolean))) as string[];

  const [{ data: profiles, error: profilesError }, { data: methods, error: methodsError }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email').in('id', testerIds),
    methodIds.length
      ? supabase.from('payout_methods').select('id, method_type, label, masked_details').in('id', methodIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (profilesError) throw profilesError;
  if (methodsError) throw methodsError;

  const profileById = new Map((profiles || []).map((profile) => [profile.id, profile]));
  const methodById = new Map((methods || []).map((method) => [method.id, method]));

  return payouts.map((payout) => {
    const profile = profileById.get(payout.tester_id);
    const method = payout.payout_method_id ? methodById.get(payout.payout_method_id) : null;
    return {
      id: payout.id,
      testerId: payout.tester_id,
      testerName: profile?.full_name || 'Tester',
      testerEmail: profile?.email || 'Email hidden',
      amountZar: payout.amount_zar,
      status: payout.status,
      method: method?.label || 'Default payout method',
      details: method?.masked_details || 'Tester selected payout preference',
      createdAt: payout.created_at,
      processedAt: payout.processed_at,
      adminNote: payout.admin_note,
      payoutReference: payout.payout_reference,
    };
  });
}

export async function updateAdminPayoutStatus(input: {
  payoutId: string;
  status: Extract<PayoutStatus, 'processing' | 'paid' | 'failed' | 'cancelled'>;
  _adminId: string;
  adminNote?: string;
  payoutReference?: string;
}) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet.');

  const { data, error } = await (supabase.rpc as any)('admin_update_payout', {
    p_payout_id: input.payoutId,
    p_status: input.status,
    p_note: input.adminNote?.trim() || null,
    p_reference: input.payoutReference?.trim() || null,
  });

  if (error) throw error;
  return data;
}

export async function getRecentAdminUsers(limit = 8) {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []).map((profile) => ({
    id: profile.id,
    name: profile.full_name,
    email: profile.email,
    role: profile.role as UserRole,
    createdAt: profile.created_at,
  }));
}


export async function getAdminUsers(limit = 12): Promise<AdminUserRow[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, city, phone, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []).map((profile) => ({
    id: profile.id,
    name: profile.full_name,
    email: profile.email,
    role: profile.role as UserRole,
    city: profile.city,
    phone: profile.phone,
    createdAt: profile.created_at,
  }));
}


export async function getAdminUserDetail(userId: string): Promise<AdminUserDetail | null> {
  if (!isSupabaseConfigured) return null;

  let profileResult = await supabase
    .from('profiles')
    .select('id, full_name, email, role, city, phone, avatar_url, account_status, created_at')
    .eq('id', userId)
    .maybeSingle();

  if (profileResult.error && profileResult.error.message.toLowerCase().includes('account_status')) {
    profileResult = await supabase
      .from('profiles')
      .select('id, full_name, email, role, city, phone, avatar_url, created_at')
      .eq('id', userId)
      .maybeSingle();
  }

  if (profileResult.error) throw profileResult.error;
  const profile = profileResult.data as any;
  if (!profile) return null;

  const [developerProfile, testerProfile, specializationsResult, jobsResult, reportsResult, payoutsResult, notificationsResult] = await Promise.all([
    supabase.from('developer_profiles').select('company_name, website_url, billing_email').eq('user_id', userId).maybeSingle(),
    supabase.from('tester_profiles').select('bio, rating, tests_completed, approval_rate, available_balance_zar, preferred_payout_method, is_public').eq('user_id', userId).maybeSingle(),
    supabase.from('tester_specializations').select('specialization_key').eq('tester_id', userId),
    supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('developer_id', userId),
    supabase.from('test_submissions').select('id', { count: 'exact', head: true }).eq('tester_id', userId),
    supabase.from('payouts').select('id', { count: 'exact', head: true }).eq('tester_id', userId),
    supabase.from('notifications' as any).select('id, title, body, status, link_path, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(8),
  ]);

  if (developerProfile.error && developerProfile.error.code !== 'PGRST116') throw developerProfile.error;
  if (testerProfile.error && testerProfile.error.code !== 'PGRST116') throw testerProfile.error;
  if (specializationsResult.error) throw specializationsResult.error;
  if (jobsResult.error) throw jobsResult.error;
  if (reportsResult.error) throw reportsResult.error;
  if (payoutsResult.error) throw payoutsResult.error;
  if ((notificationsResult as any).error) throw (notificationsResult as any).error;

  return {
    id: profile.id,
    name: profile.full_name,
    email: profile.email,
    role: profile.role as UserRole,
    city: profile.city,
    phone: profile.phone,
    avatarUrl: profile.avatar_url,
    accountStatus: (profile.account_status || 'active') as AdminUserDetail['accountStatus'],
    createdAt: profile.created_at,
    developerProfile: developerProfile.data
      ? {
          companyName: developerProfile.data.company_name,
          websiteUrl: developerProfile.data.website_url,
          billingEmail: developerProfile.data.billing_email,
        }
      : null,
    testerProfile: testerProfile.data
      ? {
          bio: testerProfile.data.bio,
          rating: testerProfile.data.rating,
          testsCompleted: testerProfile.data.tests_completed,
          approvalRate: testerProfile.data.approval_rate,
          availableBalanceZar: testerProfile.data.available_balance_zar,
          preferredPayoutMethod: testerProfile.data.preferred_payout_method,
          isPublic: testerProfile.data.is_public,
          specializations: (specializationsResult.data || []).map((item) => item.specialization_key),
        }
      : null,
    jobsPosted: jobsResult.count || 0,
    reportsSubmitted: reportsResult.count || 0,
    payoutRequests: payoutsResult.count || 0,
    notifications: (((notificationsResult as any).data || []) as any[]).map((notification) => ({
      id: notification.id,
      title: notification.title,
      body: notification.body,
      status: notification.status,
      linkPath: notification.link_path,
      createdAt: notification.created_at,
    })),
  };
}

export async function sendAdminUserNotification(input: {
  userId: string;
  _adminId: string;
  title: string;
  body: string;
  linkPath?: string;
}) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet.');

  const { data, error } = await supabase.from('notifications' as any).insert({
    user_id: input.userId,
    title: input.title.trim(),
    body: input.body.trim(),
    link_path: input.linkPath?.trim() || null,
  }).select('id').single();

  if (error) throw error;

  await supabase.from('admin_activity_logs').insert({
    admin_id: input.adminId,
    action: 'user_notification_sent',
    entity_type: 'profile',
    entity_id: input.userId,
    note: input.title.trim(),
    metadata: { notification_id: (data as any)?.id || null },
  });

  return data;
}

export async function updateAdminUserAccountStatus(input: {
  userId: string;
  _adminId: string;
  status: AdminUserDetail['accountStatus'];
  note?: string;
}) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet.');

  const { error } = await supabase
    .from('profiles')
    .update({ account_status: input.status } as any)
    .eq('id', input.userId);

  if (error) throw error;

  await supabase.from('admin_activity_logs').insert({
    admin_id: input.adminId,
    action: `user_${input.status}`,
    entity_type: 'profile',
    entity_id: input.userId,
    note: input.note?.trim() || null,
    metadata: { account_status: input.status },
  });
}

export async function getAdminJobs(limit = 12): Promise<AdminJobRow[]> {
  if (!isSupabaseConfigured) return [];

  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('id, developer_id, title, platform, category, package_key, total_amount_zar, testers_needed, status, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (jobsError) throw jobsError;
  if (!jobs || jobs.length === 0) return [];

  const developerIds = Array.from(new Set(jobs.map((job) => job.developer_id)));
  const { data: developers, error: developersError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', developerIds);

  if (developersError) throw developersError;

  const developerById = new Map((developers || []).map((developer) => [developer.id, developer]));
  return jobs.map((job) => {
    const developer = developerById.get(job.developer_id);
    return {
      id: job.id,
      title: job.title,
      developerId: job.developer_id,
      developerName: developer?.full_name || 'Developer',
      developerEmail: developer?.email || 'Email hidden',
      platform: job.platform,
      category: job.category,
      packageKey: job.package_key,
      testersNeeded: job.testers_needed,
      totalAmountZar: job.total_amount_zar,
      status: job.status,
      createdAt: job.created_at,
    };
  });
}


export async function getAdminJobDetail(jobId: string): Promise<AdminJobRow | null> {
  if (!isSupabaseConfigured) return null;

  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('id, developer_id, title, platform, category, package_key, total_amount_zar, testers_needed, status, created_at')
    .eq('id', jobId)
    .maybeSingle();

  if (jobError) throw jobError;
  if (!job) return null;

  const { data: developer, error: developerError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('id', job.developer_id)
    .maybeSingle();

  if (developerError) throw developerError;

  return {
    id: job.id,
    title: job.title,
    developerId: job.developer_id,
    developerName: developer?.full_name || 'Developer',
    developerEmail: developer?.email || 'Email hidden',
    platform: job.platform,
    category: job.category,
    packageKey: job.package_key,
    testersNeeded: job.testers_needed,
    totalAmountZar: job.total_amount_zar,
    status: job.status,
    createdAt: job.created_at,
  };
}

export async function getAdminReports(limit = 12): Promise<AdminReportRow[]> {
  if (!isSupabaseConfigured) return [];

  const { data: submissions, error: submissionsError } = await supabase
    .from('test_submissions')
    .select(
      'id, job_id, tester_id, status, usability_score, performance_score, onboarding_score, bug_severity_score, device_compatibility_score, submitted_at, created_at',
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (submissionsError) throw submissionsError;
  if (!submissions || submissions.length === 0) return [];

  const jobIds = Array.from(new Set(submissions.map((submission) => submission.job_id)));
  const testerIds = Array.from(new Set(submissions.map((submission) => submission.tester_id)));
  const submissionIds = submissions.map((submission) => submission.id);

  const [
    { data: jobs, error: jobsError },
    { data: testers, error: testersError },
    { data: bugReports, error: bugReportsError },
  ] = await Promise.all([
    supabase.from('jobs').select('id, title').in('id', jobIds),
    supabase.from('profiles').select('id, full_name, email').in('id', testerIds),
    supabase.from('bug_reports').select('id, submission_id, video_path').in('submission_id', submissionIds),
  ]);

  if (jobsError) throw jobsError;
  if (testersError) throw testersError;
  if (bugReportsError) throw bugReportsError;

  const jobById = new Map((jobs || []).map((job) => [job.id, job]));
  const testerById = new Map((testers || []).map((tester) => [tester.id, tester]));
  const bugsBySubmission = new Map<string, { total: number; videos: number }>();

  for (const bug of bugReports || []) {
    if (!bug.submission_id) continue;
    const current = bugsBySubmission.get(bug.submission_id) || { total: 0, videos: 0 };
    bugsBySubmission.set(bug.submission_id, {
      total: current.total + 1,
      videos: current.videos + (bug.video_path ? 1 : 0),
    });
  }

  return submissions.map((submission) => {
    const tester = testerById.get(submission.tester_id);
    const scores = [
      submission.usability_score,
      submission.performance_score,
      submission.onboarding_score,
      submission.bug_severity_score,
      submission.device_compatibility_score,
    ].filter((score): score is number => typeof score === 'number');
    const evidence = bugsBySubmission.get(submission.id) || { total: 0, videos: 0 };

    return {
      id: submission.id,
      jobId: submission.job_id,
      jobTitle: jobById.get(submission.job_id)?.title || 'Untitled job',
      testerId: submission.tester_id,
      testerName: tester?.full_name || 'Tester',
      testerEmail: tester?.email || 'Email hidden',
      status: submission.status,
      score: scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null,
      bugCount: evidence.total,
      videoBugCount: evidence.videos,
      submittedAt: submission.submitted_at,
      createdAt: submission.created_at,
    };
  });
}

export async function getAdminActivityLogs(limit = 10): Promise<AdminActivityLog[]> {
  if (!isSupabaseConfigured) return [];

  const { data: logs, error: logsError } = await supabase
    .from('admin_activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  // The audit log is added by supabase/phase6_admin_payout_audit.sql.
  // If that optional phase has not been run yet, keep the admin dashboard usable.
  if (logsError) {
    const missingAuditTable = logsError.code === '42P01' || logsError.message.toLowerCase().includes('admin_activity_logs');
    if (missingAuditTable) return [];
    throw logsError;
  }
  if (!logs || logs.length === 0) return [];

  const adminIds = Array.from(new Set(logs.map((log) => log.admin_id).filter(Boolean))) as string[];
  const { data: admins, error: adminsError } = adminIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', adminIds)
    : { data: [], error: null };

  if (adminsError) throw adminsError;

  const adminById = new Map((admins || []).map((admin) => [admin.id, admin.full_name]));
  return logs.map((log) => ({
    id: log.id,
    adminName: log.admin_id ? adminById.get(log.admin_id) || 'Admin' : 'System',
    action: log.action,
    entityType: log.entity_type,
    entityId: log.entity_id,
    note: log.note,
    createdAt: log.created_at,
  }));
}
function isMissingTableError(error: { code?: string; message?: string }) {
  const message = (error.message || '').toLowerCase();
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    message.includes('does not exist') ||
    message.includes('could not find the table') ||
    message.includes('schema cache') ||
    message.includes('relation')
  );
}

async function writeAdminActivity(input: {
  adminId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  note?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const { error } = await supabase.from('admin_activity_logs').insert({
    admin_id: input.adminId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId || null,
    note: input.note || null,
    metadata: (input.metadata || {}) as any,
  });

  if (error && !isMissingTableError(error)) throw error;
}

export async function getAdminPolicies(): Promise<AdminPolicyRow[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('policies')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }

  return (data || []).map((policy) => ({
    id: policy.id,
    slug: policy.slug,
    title: policy.title,
    content: policy.content,
    status: policy.status,
    version: policy.version,
    effectiveDate: policy.effective_date,
    publishedAt: policy.published_at,
    updatedBy: policy.updated_by,
    createdAt: policy.created_at,
    updatedAt: policy.updated_at,
  }));
}

export async function saveAdminPolicy(input: {
  id?: string;
  _adminId: string;
  slug: string;
  title: string;
  content: string;
  status: PolicyStatus;
  version: string;
  effectiveDate?: string | null;
}): Promise<AdminPolicyRow> {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet.');

  const payload = {
    slug: input.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, ''),
    title: input.title.trim(),
    content: input.content.trim(),
    status: input.status,
    version: input.version.trim() || 'v1.0',
    effective_date: input.effectiveDate || null,
    published_at: input.status === 'published' ? new Date().toISOString() : null,
    updated_by: input.adminId,
  };

  const query = input.id
    ? supabase.from('policies').update(payload).eq('id', input.id).select('*').single()
    : supabase.from('policies').insert(payload).select('*').single();

  const { data, error } = await query;
  if (error) throw error;

  await writeAdminActivity({
    adminId: input.adminId,
    action: input.id ? 'policy_updated' : 'policy_created',
    entityType: 'policy',
    entityId: data.id,
    note: data.title,
    metadata: { slug: data.slug, status: data.status, version: data.version },
  });

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    content: data.content,
    status: data.status,
    version: data.version,
    effectiveDate: data.effective_date,
    publishedAt: data.published_at,
    updatedBy: data.updated_by,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
