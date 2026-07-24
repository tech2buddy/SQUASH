import { isSupabaseConfigured, supabase } from './supabase';
import type { ApplicationStatus, AssignmentStatus, Database, JobStatus } from './supabase.types';
import { createNotification } from './notificationApi';
import { sendApplicationApprovedEmail, sendApplicationRejectedEmail, sendSubmissionReviewedEmail } from './emailApi';

export type JobPackageKey = 'starter' | 'growth' | 'pro' | 'enterprise';
type JobInsert = Database['public']['Tables']['jobs']['Insert'];
type JobUpdate = Database['public']['Tables']['jobs']['Update'];
function formatSupabaseError(error: unknown, fallback: string) {
  if (!error) return fallback;
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && 'message' in error) {
    const message = String((error as { message?: unknown }).message || fallback);
    if (message.includes('logo_url')) {
      return `${message}. Run supabase/phase9_job_logos.sql in Supabase SQL Editor, then try again.`;
    }
    return message;
  }
  return fallback;
}

export type DeveloperJobInput = {
  developerId: string;
  title: string;
  appUrl: string;
  logoUrl?: string | null;
  platform: string;
  category: string;
  packageKey: JobPackageKey;
  totalAmountZar: number;
  testersNeeded: number;
  description: string;
  tasks: string;
  focusAreas: string;
  preferredSpecializations: string[];
  liveSessionEnabled: boolean;
  liveSessionAt: string | null;
  status?: JobStatus;
};

export type DeveloperJob = {
  id: string;
  developerId: string;
  title: string;
  appUrl: string | null;
  logoUrl: string | null;
  platform: string;
  category: string;
  packageKey: JobPackageKey;
  totalAmountZar: number;
  testersNeeded: number;
  description: string | null;
  tasks: string | null;
  focusAreas: string | null;
  preferredSpecializations: string[];
  liveSessionEnabled: boolean;
  liveSessionAt: string | null;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
};

function mapJob(row: {
  id: string;
  developer_id: string;
  title: string;
  app_url: string | null;
  logo_url?: string | null;
  platform: string;
  category: string;
  package_key: JobPackageKey;
  total_amount_zar: number;
  testers_needed: number;
  description: string | null;
  tasks: string | null;
  focus_areas: string | null;
  preferred_specializations: string[];
  live_session_enabled: boolean;
  live_session_at: string | null;
  status: JobStatus;
  created_at: string;
  updated_at: string;
}): DeveloperJob {
  return {
    id: row.id,
    developerId: row.developer_id,
    title: row.title,
    appUrl: row.app_url,
    logoUrl: row.logo_url || null,
    platform: row.platform,
    category: row.category,
    packageKey: row.package_key,
    totalAmountZar: row.total_amount_zar,
    testersNeeded: row.testers_needed,
    description: row.description,
    tasks: row.tasks,
    focusAreas: row.focus_areas,
    preferredSpecializations: row.preferred_specializations || [],
    liveSessionEnabled: row.live_session_enabled,
    liveSessionAt: row.live_session_at,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function updateDeveloperJob(jobId: string, input: DeveloperJobInput): Promise<DeveloperJob> {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet.');

  const payload: JobUpdate = {
    title: input.title.trim(),
    app_url: input.appUrl.trim() || null,
    platform: input.platform,
    category: input.category,
    package_key: input.packageKey,
    total_amount_zar: input.totalAmountZar,
    testers_needed: input.testersNeeded,
    description: input.description.trim() || null,
    tasks: input.tasks.trim() || null,
    focus_areas: input.focusAreas.trim() || null,
    preferred_specializations: input.preferredSpecializations,
    live_session_enabled: input.liveSessionEnabled,
    live_session_at: input.liveSessionAt,
    status: input.status || 'active',
  };
  if (input.logoUrl) payload.logo_url = input.logoUrl;

  const { data, error } = await supabase
    .from('jobs')
    .update(payload)
    .eq('id', jobId)
    .eq('developer_id', input.developerId)
    .select('*')
    .single();

  if (error) throw new Error(formatSupabaseError(error, 'Unable to update this job right now.'));
  return mapJob(data);
}
export async function createDeveloperJob(input: DeveloperJobInput): Promise<DeveloperJob> {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet.');

  const payload: JobInsert = {
    developer_id: input.developerId,
    title: input.title.trim(),
    app_url: input.appUrl.trim() || null,
    platform: input.platform,
    category: input.category,
    package_key: input.packageKey,
    total_amount_zar: input.totalAmountZar,
    testers_needed: input.testersNeeded,
    description: input.description.trim() || null,
    tasks: input.tasks.trim() || null,
    focus_areas: input.focusAreas.trim() || null,
    preferred_specializations: input.preferredSpecializations,
    live_session_enabled: input.liveSessionEnabled,
    live_session_at: input.liveSessionAt,
    status: input.status || 'active',
  };
  if (input.logoUrl) payload.logo_url = input.logoUrl;

  const { data, error } = await supabase
    .from('jobs')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw new Error(formatSupabaseError(error, 'Unable to update this job right now.'));

  if (data?.id) {
    createNotification({
      userId: input.developerId,
      title: 'Job Posted Successfully 🚀',
      body: `Your testing job "${input.title}" is now live on the Job Board.`,
      type: 'job',
      linkPath: '/dashboard',
    }).catch(() => {});
  }

  return mapJob(data);
}

export async function getDeveloperJobs(developerId: string): Promise<DeveloperJob[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('developer_id', developerId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(formatSupabaseError(error, 'Unable to update this job right now.'));
  return (data || []).map(mapJob);
}


export async function getActiveJobs(): Promise<DeveloperJob[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) throw new Error(formatSupabaseError(error, 'Unable to update this job right now.'));
  return (data || []).map(mapJob);
}


export type JobApplication = {
  id: string;
  jobId: string;
  testerId: string;
  status: ApplicationStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

function mapApplication(row: {
  id: string;
  job_id: string;
  tester_id: string;
  status: ApplicationStatus;
  note: string | null;
  created_at: string;
  updated_at: string;
}): JobApplication {
  return {
    id: row.id,
    jobId: row.job_id,
    testerId: row.tester_id,
    status: row.status,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getTesterApplications(testerId: string): Promise<JobApplication[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('job_applications')
    .select('*')
    .eq('tester_id', testerId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(formatSupabaseError(error, 'Unable to update this job right now.'));
  return (data || []).map(mapApplication);
}

export async function applyToJob(jobId: string, testerId: string, note = ''): Promise<JobApplication> {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet.');

  const { data, error } = await supabase
    .from('job_applications')
    .insert({
      job_id: jobId,
      tester_id: testerId,
      status: 'pending',
      note: note.trim() || null,
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      const { data: existing, error: existingError } = await supabase
        .from('job_applications')
        .select('*')
        .eq('job_id', jobId)
        .eq('tester_id', testerId)
        .single();

      if (existingError) throw existingError;
      return mapApplication(existing);
    }
    throw error;
  }

  if (data?.id) {
    (async () => {
      try {
        const [
          { data: job },
          { data: tester }
        ] = await Promise.all([
          supabase.from('jobs').select('developer_id, title').eq('id', jobId).maybeSingle(),
          supabase.from('profiles').select('full_name').eq('id', testerId).maybeSingle(),
        ]);
        
        if (job?.developer_id) {
          await createNotification({
            userId: job.developer_id,
            title: 'New Applicant 🚀',
            body: `${tester?.full_name || 'A tester'} applied to test ${job.title || 'your app'}.`,
            type: 'application',
            linkPath: `/developer/reports`,
          });
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }

  return mapApplication(data);
}

export type DeveloperApplication = JobApplication & {
  jobTitle: string;
  jobLogoUrl?: string | null;
  jobPlatform: string;
  jobCategory: string;
  jobPackageKey: JobPackageKey;
  testerName: string;
  testerEmail: string;
  testerCity: string;
  testerRating: number;
  testerTestsCompleted: number;
  testerApprovalRate: number;
  testerSpecializations: string[];
};

export async function getDeveloperApplications(developerId: string): Promise<DeveloperApplication[]> {
  if (!isSupabaseConfigured) return [];

  const jobs = await getDeveloperJobs(developerId);
  const jobIds = jobs.map((job) => job.id);
  if (jobIds.length === 0) return [];

  const { data: applications, error: applicationsError } = await supabase
    .from('job_applications')
    .select('*')
    .in('job_id', jobIds)
    .order('created_at', { ascending: false });

  if (applicationsError) throw applicationsError;
  if (!applications || applications.length === 0) return [];

  const testerIds = Array.from(new Set(applications.map((application) => application.tester_id)));
  const jobById = new Map(jobs.map((job) => [job.id, job]));

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, email, city')
    .in('id', testerIds);

  if (profilesError) throw profilesError;

  const { data: testerProfiles, error: testerProfilesError } = await supabase
    .from('tester_profiles')
    .select('user_id, rating, tests_completed, approval_rate')
    .in('user_id', testerIds);

  if (testerProfilesError) throw testerProfilesError;

  const { data: specializationRows, error: specializationError } = await supabase
    .from('tester_specializations')
    .select('tester_id, specialization_key')
    .in('tester_id', testerIds);

  if (specializationError) throw specializationError;

  const profileById = new Map((profiles || []).map((profile) => [profile.id, profile]));
  const testerProfileById = new Map((testerProfiles || []).map((profile) => [profile.user_id, profile]));
  const specializationsByTesterId = new Map<string, string[]>();

  for (const row of specializationRows || []) {
    const current = specializationsByTesterId.get(row.tester_id) || [];
    current.push(row.specialization_key);
    specializationsByTesterId.set(row.tester_id, current);
  }

  return applications.map((application) => {
    const job = jobById.get(application.job_id);
    const profile = profileById.get(application.tester_id);
    const testerProfile = testerProfileById.get(application.tester_id);

    return {
      ...mapApplication(application),
      jobTitle: job?.title || 'Unknown job',
      jobLogoUrl: job?.logoUrl || null,
      jobPlatform: job?.platform || 'App',
      jobCategory: job?.category || 'mobile-app-testing',
      jobPackageKey: job?.packageKey || 'starter',
      testerName: profile?.full_name || 'Tester applicant',
      testerEmail: profile?.email || '',
      testerCity: profile?.city || 'South Africa',
      testerRating: Number(testerProfile?.rating || 0),
      testerTestsCompleted: testerProfile?.tests_completed || 0,
      testerApprovalRate: testerProfile?.approval_rate || 0,
      testerSpecializations: specializationsByTesterId.get(application.tester_id) || [],
    };
  });
}

export async function reviewDeveloperApplication(
  application: Pick<JobApplication, 'id' | 'jobId' | 'testerId'>,
  status: Extract<ApplicationStatus, 'accepted' | 'rejected'>,
): Promise<JobApplication> {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet.');

  const { data, error } = await supabase
    .from('job_applications')
    .update({ status })
    .eq('id', application.id)
    .select('*')
    .single();

  if (error) throw new Error(formatSupabaseError(error, 'Unable to update this job right now.'));

  if (status === 'accepted') {
    const { data: existingAssignment, error: existingAssignmentError } = await supabase
      .from('test_assignments')
      .select('id,status')
      .eq('job_id', application.jobId)
      .eq('tester_id', application.testerId)
      .maybeSingle();

    if (existingAssignmentError) {
      throw new Error(formatSupabaseError(existingAssignmentError, 'Unable to check this tester assignment right now.'));
    }

    const assignmentPayload = {
      application_id: application.id,
      status: existingAssignment?.status === 'approved' ? 'approved' : ('active' as AssignmentStatus),
    };

    const { error: assignmentError } = existingAssignment
      ? await supabase.from('test_assignments').update(assignmentPayload).eq('id', existingAssignment.id)
      : await supabase.from('test_assignments').insert({
          job_id: application.jobId,
          tester_id: application.testerId,
          ...assignmentPayload,
        });

    if (assignmentError) {
      throw new Error(formatSupabaseError(assignmentError, 'Application accepted, but the active test assignment could not be created.'));
    }
  }

  if (data?.id) {
    (async () => {
      try {
        const { data: job } = await supabase.from('jobs').select('title').eq('id', application.jobId).maybeSingle();
        if (status === 'accepted') {
          await createNotification({
            userId: application.testerId,
            title: 'Application Accepted 🎉',
            body: `You've been approved to test ${job?.title || 'an app'}. Start testing now!`,
            type: 'application',
            linkPath: '/active-test',
          });
        } else if (status === 'rejected') {
          await createNotification({
            userId: application.testerId,
            title: 'Application Update 🔄',
            body: `Your application for ${job?.title || 'an app'} was not selected this time.`,
            type: 'application',
            linkPath: '/tester-jobs',
          });
        }
        
        const { data: profile } = await supabase.from('profiles').select('email, full_name').eq('id', application.testerId).maybeSingle();
        if (profile?.email) {
          if (status === 'accepted') {
            await sendApplicationApprovedEmail(profile.email, profile.full_name || 'Tester', job?.title || 'a SQUASH testing job');
          } else if (status === 'rejected') {
            await sendApplicationRejectedEmail(profile.email, profile.full_name || 'Tester', job?.title || 'a SQUASH testing job');
          }
        }

      } catch (err) {
        console.error(err);
      }
    })();
  }

  return mapApplication(data);
}

export type TesterAssignment = {
  id: string;
  jobId: string;
  testerId: string;
  applicationId: string | null;
  status: AssignmentStatus;
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
  jobTitle: string;
  jobLogoUrl: string | null;
  jobPlatform: string;
  jobCategory: string;
  jobPackageKey: JobPackageKey;
  jobDescription: string | null;
  jobTasks: string | null;
  jobAppUrl: string | null;
  jobFocusAreas: string | null;
};

function mapAssignment(row: {
  id: string;
  job_id: string;
  tester_id: string;
  application_id: string | null;
  status: AssignmentStatus;
  due_at: string | null;
  created_at: string;
  updated_at: string;
}): Omit<TesterAssignment, 'jobTitle' | 'jobLogoUrl' | 'jobPlatform' | 'jobCategory' | 'jobPackageKey' | 'jobDescription' | 'jobTasks' | 'jobAppUrl' | 'jobFocusAreas'> {
  return {
    id: row.id,
    jobId: row.job_id,
    testerId: row.tester_id,
    applicationId: row.application_id,
    status: row.status,
    dueAt: row.due_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getTesterAssignments(testerId: string): Promise<TesterAssignment[]> {
  if (!isSupabaseConfigured) return [];

  const { data: assignments, error: assignmentsError } = await supabase
    .from('test_assignments')
    .select('*')
    .eq('tester_id', testerId)
    .order('created_at', { ascending: false });

  if (assignmentsError) throw assignmentsError;
  if (!assignments || assignments.length === 0) return [];

  const jobIds = Array.from(new Set(assignments.map((assignment) => assignment.job_id)));
  const { data: jobs, error: jobsError } = await supabase.from('jobs').select('*').in('id', jobIds);
  if (jobsError) throw jobsError;

  const jobById = new Map((jobs || []).map((job) => [job.id, mapJob(job)]));

  return assignments.map((assignment) => {
    const base = mapAssignment(assignment);
    const job = jobById.get(assignment.job_id);
    return {
      ...base,
      jobTitle: job?.title || 'Accepted test',
      jobLogoUrl: job?.logoUrl || null,
      jobPlatform: job?.platform || 'App',
      jobCategory: job?.category || 'mobile-app-testing',
      jobPackageKey: job?.packageKey || 'starter',
      jobDescription: job?.description || null,
      jobTasks: job?.tasks || null,
      jobAppUrl: job?.appUrl || null,
      jobFocusAreas: job?.focusAreas || null,
    };
  });
}

export type SubmitAssignmentReportInput = {
  assignmentId: string;
  testerId: string;
  jobId: string;
  summary: string;
  scores?: {
    usability: number;
    performance: number;
    onboarding: number;
    bugSeverity: number;
    deviceCompatibility: number;
  };
};

export async function getTesterAssignmentById(assignmentId: string, testerId: string): Promise<TesterAssignment | null> {
  if (!isSupabaseConfigured) return null;

  const { data: assignment, error: assignmentError } = await supabase
    .from('test_assignments')
    .select('*')
    .eq('id', assignmentId)
    .eq('tester_id', testerId)
    .maybeSingle();

  if (assignmentError) throw assignmentError;
  if (!assignment) return null;

  const { data: job, error: jobError } = await supabase.from('jobs').select('*').eq('id', assignment.job_id).maybeSingle();
  if (jobError) throw jobError;

  const mappedJob = job ? mapJob(job) : null;
  return {
    ...mapAssignment(assignment),
    jobTitle: mappedJob?.title || 'Accepted test',
    jobLogoUrl: mappedJob?.logoUrl || null,
    jobPlatform: mappedJob?.platform || 'App',
    jobCategory: mappedJob?.category || 'mobile-app-testing',
    jobPackageKey: mappedJob?.packageKey || 'starter',
    jobDescription: mappedJob?.description || null,
    jobTasks: mappedJob?.tasks || null,
    jobAppUrl: mappedJob?.appUrl || null,
    jobFocusAreas: mappedJob?.focusAreas || null,
  };
}

export async function getTesterPrimaryAssignment(testerId: string): Promise<TesterAssignment | null> {
  const assignments = await getTesterAssignments(testerId);
  return assignments.find((assignment) => assignment.status === 'active') || assignments[0] || null;
}

export async function saveAssignmentBugReport(input: {
  assignmentId: string;
  testerId: string;
  jobId: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  videoDurationSeconds?: number | null;
}) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet.');

  const { error } = await supabase.from('bug_reports').insert({
    assignment_id: input.assignmentId,
    tester_id: input.testerId,
    job_id: input.jobId,
    title: input.description.trim().slice(0, 80) || 'Bug report',
    description: input.description.trim(),
    severity: input.severity,
    video_duration_seconds: input.videoDurationSeconds ?? null,
  });

  if (error) throw new Error(formatSupabaseError(error, 'Unable to update this job right now.'));
}

export async function submitAssignmentReport(input: SubmitAssignmentReportInput) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet.');

  const scores = input.scores || {
    usability: 78,
    performance: 74,
    onboarding: 80,
    bugSeverity: 82,
    deviceCompatibility: 76,
  };

  const { data, error } = await supabase
    .from('test_submissions')
    .upsert(
      {
        assignment_id: input.assignmentId,
        tester_id: input.testerId,
        job_id: input.jobId,
        status: 'submitted',
        summary: input.summary.trim() || 'Tester completed all assigned tasks and submitted feedback.',
        usability_score: scores.usability,
        performance_score: scores.performance,
        onboarding_score: scores.onboarding,
        bug_severity_score: scores.bugSeverity,
        device_compatibility_score: scores.deviceCompatibility,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: 'assignment_id' },
    )
    .select('*')
    .single();

  if (error) throw new Error(formatSupabaseError(error, 'Unable to update this job right now.'));

  const { error: assignmentError } = await supabase
    .from('test_assignments')
    .update({ status: 'submitted' })
    .eq('id', input.assignmentId)
    .eq('tester_id', input.testerId);

  if (assignmentError) throw assignmentError;

  if (data?.id) {
    Promise.all([
      supabase.from('jobs').select('developer_id, title').eq('id', input.jobId).maybeSingle(),
      supabase.from('profiles').select('full_name').eq('id', input.testerId).maybeSingle(),
    ]).then(([{ data: job }, { data: tester }]) => {
      console.log('[SQUASH] Notification trigger — job:', job, 'tester:', tester);
      if (job?.developer_id) {
        const testerName = tester?.full_name || 'A tester';
        const jobTitle = job.title || 'your app';
        createNotification({
          userId: job.developer_id,
          title: 'New Test Report Submitted 🚀',
          body: `${testerName} submitted a test report for ${jobTitle}.`,
          type: 'report',
          linkPath: `/report-details?submission=${data.id}`,
        }).then((n) => {
          console.log('[SQUASH] Developer notification created:', n);
        }).catch((err) => {
          console.error('[SQUASH] Failed to create developer notification:', err);
        });
      } else {
        console.warn('[SQUASH] Could not find developer_id on job:', input.jobId);
      }
    }).catch((err) => {
      console.error('[SQUASH] Failed to fetch job/tester info for notification:', err);
    });
  }

  return data;
}

export type DeveloperSubmissionReview = {
  id: string;
  assignmentId: string;
  testerId: string;
  jobId: string;
  status: 'draft' | 'submitted' | 'changes_requested' | 'approved' | 'rejected';
  summary: string | null;
  submittedAt: string | null;
  createdAt: string;
  jobTitle: string;
  jobLogoUrl?: string | null;
  jobPlatform: string;
  jobCategory: string;
  testerName: string;
  testerEmail: string;
  testerRating: number;
  testerTestsCompleted: number;
  bugCount: number;
  criticalBugCount: number;
  videoBugCount: number;
  scores: {
    usability: number;
    performance: number;
    onboarding: number;
    bugSeverity: number;
    deviceCompatibility: number;
  };
};

export async function getDeveloperSubmittedReports(developerId: string): Promise<DeveloperSubmissionReview[]> {
  if (!isSupabaseConfigured) return [];

  const jobs = await getDeveloperJobs(developerId);
  const jobIds = jobs.map((job) => job.id);
  if (jobIds.length === 0) return [];

  const { data: submissions, error: submissionsError } = await supabase
    .from('test_submissions')
    .select('*')
    .in('job_id', jobIds)
    .order('created_at', { ascending: false });

  if (submissionsError) throw submissionsError;
  if (!submissions || submissions.length === 0) return [];

  const testerIds = Array.from(new Set(submissions.map((submission) => submission.tester_id)));
  const jobById = new Map(jobs.map((job) => [job.id, job]));

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', testerIds);
  if (profilesError) throw profilesError;

  const { data: testerProfiles, error: testerProfilesError } = await supabase
    .from('tester_profiles')
    .select('user_id, rating, tests_completed')
    .in('user_id', testerIds);
  if (testerProfilesError) throw testerProfilesError;

  const { data: bugReports, error: bugReportsError } = await supabase
    .from('bug_reports')
    .select('submission_id, assignment_id, severity, video_duration_seconds')
    .in('assignment_id', submissions.map((submission) => submission.assignment_id));
  if (bugReportsError) throw bugReportsError;

  const profileById = new Map((profiles || []).map((profile) => [profile.id, profile]));
  const testerProfileById = new Map((testerProfiles || []).map((profile) => [profile.user_id, profile]));
  const bugsByAssignmentId = new Map<string, typeof bugReports>();

  for (const bug of bugReports || []) {
    const list = bugsByAssignmentId.get(bug.assignment_id) || [];
    list.push(bug);
    bugsByAssignmentId.set(bug.assignment_id, list);
  }

  return submissions.map((submission) => {
    const job = jobById.get(submission.job_id);
    const profile = profileById.get(submission.tester_id);
    const testerProfile = testerProfileById.get(submission.tester_id);
    const bugs = bugsByAssignmentId.get(submission.assignment_id) || [];

    return {
      id: submission.id,
      assignmentId: submission.assignment_id,
      testerId: submission.tester_id,
      jobId: submission.job_id,
      status: submission.status,
      summary: submission.summary,
      submittedAt: submission.submitted_at,
      createdAt: submission.created_at,
      jobTitle: job?.title || 'Submitted test report',
      jobLogoUrl: job?.logoUrl || null,
      jobPlatform: job?.platform || 'App',
      jobCategory: job?.category || 'mobile-app-testing',
      testerName: profile?.full_name || 'Tester',
      testerEmail: profile?.email || '',
      testerRating: Number(testerProfile?.rating || 0),
      testerTestsCompleted: testerProfile?.tests_completed || 0,
      bugCount: bugs.length,
      criticalBugCount: bugs.filter((bug) => bug.severity === 'Critical').length,
      videoBugCount: bugs.filter((bug) => Number(bug.video_duration_seconds || 0) > 0).length,
      scores: {
        usability: submission.usability_score || 0,
        performance: submission.performance_score || 0,
        onboarding: submission.onboarding_score || 0,
        bugSeverity: submission.bug_severity_score || 0,
        deviceCompatibility: submission.device_compatibility_score || 0,
      },
    };
  });
}

export async function reviewSubmittedReport(input: {
  submissionId: string;
  assignmentId: string;
  status: 'approved' | 'changes_requested' | 'rejected';
}) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet.');

  const { data, error } = await supabase
    .from('test_submissions')
    .update({ status: input.status, reviewed_at: new Date().toISOString() })
    .eq('id', input.submissionId)
    .select('*')
    .single();

  if (error) throw new Error(formatSupabaseError(error, 'Unable to update this job right now.'));

  if (input.status === 'approved' || input.status === 'changes_requested' || input.status === 'rejected') {
    const nextAssignmentStatus: AssignmentStatus =
      input.status === 'approved' ? 'approved' : input.status === 'changes_requested' ? 'active' : 'submitted';

    const { error: assignmentError } = await supabase
      .from('test_assignments')
      .update({ status: nextAssignmentStatus })
      .eq('id', input.assignmentId);
    if (assignmentError) throw assignmentError;
  }

  if (data?.id) {
    (async () => {
      try {
        const { data: assignment } = await supabase.from('test_assignments').select('tester_id, job_id').eq('id', input.assignmentId).maybeSingle();
        if (assignment?.job_id && assignment.tester_id) {
          const { data: job } = await supabase.from('jobs').select('title').eq('id', assignment.job_id).maybeSingle();
          if (input.status === 'approved') {
            await createNotification({
              userId: assignment.tester_id,
              title: 'Report Approved 💰',
              body: `Your report for ${job?.title || 'an app'} was approved! Earnings have been credited to your wallet.`,
              type: 'payout',
              linkPath: '/tester/earnings',
            });
          } else if (input.status === 'changes_requested') {
            await createNotification({
              userId: assignment.tester_id,
              title: 'Action Required ⚠️',
              body: `The developer requested changes on your report for ${job?.title || 'an app'}.`,
              type: 'report',
              linkPath: '/active-test',
            });
          } else if (input.status === 'rejected') {
            await createNotification({
              userId: assignment.tester_id,
              title: 'Report Rejected ❌',
              body: `Unfortunately, your report for ${job?.title || 'an app'} did not meet the requirements.`,
              type: 'report',
              linkPath: '/active-test',
            });
          }
          
          const { data: profile } = await supabase.from('profiles').select('email, full_name').eq('id', assignment.tester_id).maybeSingle();
          if (profile?.email) {
            await sendSubmissionReviewedEmail(
              profile.email,
              profile.full_name || 'Tester',
              job?.title || 'a SQUASH testing job',
              input.status
            );
          }
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }

  return data;
}

function testerEarningForPackage(packageKey: JobPackageKey): number {
  if (packageKey === 'growth') return 120;
  if (packageKey === 'pro') return 200;
  if (packageKey === 'enterprise') return 220;
  return 80;
}

export type TesterEarningItem = {
  id: string;
  jobTitle: string;
  status: 'pending' | 'approved' | 'paid' | 'changes_requested' | 'rejected';
  amountZar: number;
  submittedAt: string | null;
};

export type TesterPayoutRequest = {
  id: string;
  amountZar: number;
  status: string;
  createdAt: string;
  processedAt: string | null;
};

export type TesterEarningsSummary = {
  availableBalanceZar: number;
  pendingApprovalZar: number;
  pendingPayoutZar: number;
  lifetimeApprovedZar: number;
  earnings: TesterEarningItem[];
  payouts: TesterPayoutRequest[];
};

export async function getTesterEarningsSummary(testerId: string): Promise<TesterEarningsSummary> {
  if (!isSupabaseConfigured) {
    return {
      availableBalanceZar: 0,
      pendingApprovalZar: 0,
      pendingPayoutZar: 0,
      lifetimeApprovedZar: 0,
      earnings: [],
      payouts: [],
    };
  }

  const { data: submissions, error: submissionsError } = await supabase
    .from('test_submissions')
    .select('*')
    .eq('tester_id', testerId)
    .order('created_at', { ascending: false });
  if (submissionsError) throw submissionsError;

  const jobIds = Array.from(new Set((submissions || []).map((submission) => submission.job_id)));
  const { data: jobs, error: jobsError } = jobIds.length
    ? await supabase.from('jobs').select('*').in('id', jobIds)
    : { data: [], error: null };
  if (jobsError) throw jobsError;

  const jobById = new Map((jobs || []).map((job) => [job.id, mapJob(job)]));
  const earnings: TesterEarningItem[] = (submissions || []).map((submission) => {
    const job = jobById.get(submission.job_id);
    return {
      id: submission.id,
      jobTitle: job?.title || 'Submitted test',
      status: submission.status === 'submitted' || submission.status === 'draft' ? 'pending' : submission.status,
      amountZar: testerEarningForPackage(job?.packageKey || 'starter'),
      submittedAt: submission.submitted_at,
    };
  });

  const { data: payouts, error: payoutsError } = await supabase
    .from('payouts')
    .select('*')
    .eq('tester_id', testerId)
    .order('created_at', { ascending: false });
  if (payoutsError) throw payoutsError;

  const payoutItems: TesterPayoutRequest[] = (payouts || []).map((payout) => ({
    id: payout.id,
    amountZar: payout.amount_zar,
    status: payout.status,
    createdAt: payout.created_at,
    processedAt: payout.processed_at,
  }));

  const lifetimeApprovedZar = earnings
    .filter((earning) => earning.status === 'approved' || earning.status === 'paid')
    .reduce((total, earning) => total + earning.amountZar, 0);
  const pendingApprovalZar = earnings
    .filter((earning) => earning.status === 'pending')
    .reduce((total, earning) => total + earning.amountZar, 0);
  const pendingPayoutZar = payoutItems
    .filter((payout) => payout.status === 'pending' || payout.status === 'processing')
    .reduce((total, payout) => total + payout.amountZar, 0);
  const paidOutZar = payoutItems
    .filter((payout) => payout.status === 'paid')
    .reduce((total, payout) => total + payout.amountZar, 0);

  return {
    availableBalanceZar: Math.max(0, lifetimeApprovedZar - pendingPayoutZar - paidOutZar),
    pendingApprovalZar,
    pendingPayoutZar,
    lifetimeApprovedZar,
    earnings,
    payouts: payoutItems,
  };
}

export async function requestTesterPayout(testerId: string, amountZar: number) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet.');
  if (amountZar <= 0) throw new Error('No approved balance available for payout yet.');

  const { data, error } = await supabase
    .from('payouts')
    .insert({
      tester_id: testerId,
      amount_zar: amountZar,
      status: 'pending',
    })
    .select('*')
    .single();

  if (error) throw new Error(formatSupabaseError(error, 'Unable to update this job right now.'));
  return data;
}


export type TesterReportSubmission = {
  id: string;
  assignmentId: string;
  jobId: string;
  jobTitle: string;
  jobPlatform: string;
  jobCategory: string;
  status: 'draft' | 'submitted' | 'changes_requested' | 'approved' | 'rejected';
  summary: string | null;
  submittedAt: string | null;
  createdAt: string;
  amountZar: number;
  bugCount: number;
  videoBugCount: number;
  criticalBugCount: number;
  scores: {
    usability: number;
    performance: number;
    onboarding: number;
    bugSeverity: number;
    deviceCompatibility: number;
  };
};

export async function getTesterReportSubmissions(testerId: string): Promise<TesterReportSubmission[]> {
  if (!isSupabaseConfigured) return [];

  const { data: submissions, error: submissionsError } = await supabase
    .from('test_submissions')
    .select('*')
    .eq('tester_id', testerId)
    .order('created_at', { ascending: false });

  if (submissionsError) throw submissionsError;
  if (!submissions || submissions.length === 0) return [];

  const jobIds = Array.from(new Set(submissions.map((submission) => submission.job_id)));
  const assignmentIds = Array.from(new Set(submissions.map((submission) => submission.assignment_id)));

  const [{ data: jobs, error: jobsError }, { data: bugReports, error: bugReportsError }] = await Promise.all([
    supabase.from('jobs').select('*').in('id', jobIds),
    supabase.from('bug_reports').select('assignment_id, severity, video_duration_seconds').in('assignment_id', assignmentIds),
  ]);

  if (jobsError) throw jobsError;
  if (bugReportsError) throw bugReportsError;

  const jobById = new Map((jobs || []).map((job) => [job.id, mapJob(job)]));
  const bugsByAssignmentId = new Map<string, typeof bugReports>();

  for (const bug of bugReports || []) {
    const current = bugsByAssignmentId.get(bug.assignment_id) || [];
    current.push(bug);
    bugsByAssignmentId.set(bug.assignment_id, current);
  }

  return submissions.map((submission) => {
    const job = jobById.get(submission.job_id);
    const bugs = bugsByAssignmentId.get(submission.assignment_id) || [];

    return {
      id: submission.id,
      assignmentId: submission.assignment_id,
      jobId: submission.job_id,
      jobTitle: job?.title || 'Submitted test',
      jobPlatform: job?.platform || 'App',
      jobCategory: job?.category || 'mobile-app-testing',
      status: submission.status,
      summary: submission.summary,
      submittedAt: submission.submitted_at,
      createdAt: submission.created_at,
      amountZar: testerEarningForPackage(job?.packageKey || 'starter'),
      bugCount: bugs.length,
      videoBugCount: bugs.filter((bug) => Number(bug.video_duration_seconds || 0) > 0).length,
      criticalBugCount: bugs.filter((bug) => bug.severity === 'Critical').length,
      scores: {
        usability: submission.usability_score || 0,
        performance: submission.performance_score || 0,
        onboarding: submission.onboarding_score || 0,
        bugSeverity: submission.bug_severity_score || 0,
        deviceCompatibility: submission.device_compatibility_score || 0,
      },
    };
  });
}

export type DeveloperDashboardSummary = {
  activeJobs: number;
  totalApplications: number;
  uniqueTesters: number;
  pendingApplications: number;
  submittedReports: number;
  approvedReports: number;
  totalCommittedZar: number;
  averageScore: number;
  bugCounts: {
    Critical: number;
    High: number;
    Medium: number;
    Low: number;
  };
  trend: number[];
};

export async function getDeveloperDashboardSummary(developerId: string): Promise<DeveloperDashboardSummary> {
  if (!isSupabaseConfigured) {
    return {
      activeJobs: 0,
      totalApplications: 0,
      uniqueTesters: 0,
      pendingApplications: 0,
      submittedReports: 0,
      approvedReports: 0,
      totalCommittedZar: 0,
      averageScore: 0,
      bugCounts: { Critical: 0, High: 0, Medium: 0, Low: 0 },
      trend: [0, 0, 0, 0, 0, 0, 0],
    };
  }

  const jobs = await getDeveloperJobs(developerId);
  const jobIds = jobs.map((job) => job.id);
  if (jobIds.length === 0) {
    return {
      activeJobs: 0,
      totalApplications: 0,
      uniqueTesters: 0,
      pendingApplications: 0,
      submittedReports: 0,
      approvedReports: 0,
      totalCommittedZar: 0,
      averageScore: 0,
      bugCounts: { Critical: 0, High: 0, Medium: 0, Low: 0 },
      trend: [0, 0, 0, 0, 0, 0, 0],
    };
  }

  const [{ data: applications, error: applicationsError }, { data: submissions, error: submissionsError }, { data: bugReports, error: bugReportsError }] = await Promise.all([
    supabase.from('job_applications').select('*').in('job_id', jobIds),
    supabase.from('test_submissions').select('*').in('job_id', jobIds),
    supabase.from('bug_reports').select('severity, created_at').in('job_id', jobIds),
  ]);

  if (applicationsError) throw applicationsError;
  if (submissionsError) throw submissionsError;
  if (bugReportsError) throw bugReportsError;

  const submitted = submissions || [];
  const scoreValues = submitted
    .map((submission) => {
      const scores = [
        submission.usability_score,
        submission.performance_score,
        submission.onboarding_score,
        submission.bug_severity_score,
        submission.device_compatibility_score,
      ].filter((score): score is number => typeof score === 'number');
      if (scores.length === 0) return 0;
      return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    })
    .filter((score) => score > 0);

  const bugCounts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  for (const bug of bugReports || []) {
    if (bug.severity === 'Critical' || bug.severity === 'High' || bug.severity === 'Medium' || bug.severity === 'Low') {
      bugCounts[bug.severity] += 1;
    }
  }

  const trend = Array.from({ length: 7 }, (_, daysAgo) => {
    const target = new Date();
    target.setHours(0, 0, 0, 0);
    target.setDate(target.getDate() - (6 - daysAgo));
    return submitted.filter((submission) => {
      const submittedDate = new Date(submission.submitted_at || submission.created_at);
      submittedDate.setHours(0, 0, 0, 0);
      return submittedDate.getTime() === target.getTime();
    }).length;
  });

  return {
    activeJobs: jobs.filter((job) => job.status === 'active' || job.status === 'in_review').length,
    totalApplications: applications?.length || 0,
    uniqueTesters: new Set((applications || []).map((application) => application.tester_id)).size,
    pendingApplications: (applications || []).filter((application) => application.status === 'pending').length,
    submittedReports: submitted.filter((submission) => submission.status === 'submitted').length,
    approvedReports: submitted.filter((submission) => submission.status === 'approved').length,
    totalCommittedZar: jobs.reduce((total, job) => total + job.totalAmountZar, 0),
    averageScore: scoreValues.length ? Math.round(scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length) : 0,
    bugCounts,
    trend,
  };
}

export type BugReportDetail = {
  id: string;
  title: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  screenshotPath: string | null;
  videoPath: string | null;
  reproductionSteps: string[];
};

export type DeveloperSubmissionDetails = {
  id: string;
  assignmentId: string;
  jobId: string;
  jobTitle: string;
  jobPlatform: string;
  jobCategory: string;
  testerId: string;
  testerName: string;
  testerEmail: string;
  testerTestsCompleted?: number;
  status: 'draft' | 'submitted' | 'changes_requested' | 'approved' | 'rejected';
  summary: string | null;
  submittedAt: string | null;
  createdAt: string;
  criticalBugCount: number;
  scores: {
    usability: number;
    performance: number;
    onboarding: number;
    bugSeverity: number;
    deviceCompatibility: number;
  };
  bugs: BugReportDetail[];
};

export async function getSubmissionDetails(submissionId: string): Promise<DeveloperSubmissionDetails | null> {
  if (!isSupabaseConfigured) return null;

  const { data: submission, error: submissionError } = await supabase
    .from('test_submissions')
    .select('*')
    .eq('id', submissionId)
    .maybeSingle();

  if (submissionError) throw submissionError;
  if (!submission) return null;

  const [{ data: job }, { data: profile }, { data: bugs }, { data: testerProfile }] = await Promise.all([
    supabase.from('jobs').select('*').eq('id', submission.job_id).maybeSingle(),
    supabase.from('profiles').select('full_name, email').eq('id', submission.tester_id).maybeSingle(),
    supabase.from('bug_reports').select('*').eq('assignment_id', submission.assignment_id),
    supabase.from('tester_profiles').select('tests_completed').eq('user_id', submission.tester_id).maybeSingle(),
  ]);

  const bugList = (bugs || []).map((b: any) => ({
    id: b.id,
    title: b.title || 'Bug Report',
    description: b.description || '',
    severity: b.severity || 'Medium',
    screenshotPath: b.screenshot_path || null,
    videoPath: b.video_path || null,
    reproductionSteps: (b.reproduction_steps || '').split('\n').filter(Boolean),
  }));

  return {
    id: submission.id,
    assignmentId: submission.assignment_id,
    jobId: submission.job_id,
    jobTitle: job?.title || 'Bug Report Submission',
    jobPlatform: job?.platform || 'App',
    jobCategory: job?.category || 'mobile-app-testing',
    testerId: submission.tester_id,
    testerName: profile?.full_name || 'Tester',
    testerEmail: profile?.email || '',
    testerTestsCompleted: testerProfile?.tests_completed || 0,
    status: submission.status,
    summary: submission.summary,
    submittedAt: submission.submitted_at,
    createdAt: submission.created_at,
    criticalBugCount: bugList.filter((b) => b.severity === 'Critical').length,
    scores: {
      usability: submission.usability_score || 0,
      performance: submission.performance_score || 0,
      onboarding: submission.onboarding_score || 0,
      bugSeverity: submission.bug_severity_score || 0,
      deviceCompatibility: submission.device_compatibility_score || 0,
    },
    bugs: bugList,
  };
}

export interface DeveloperAttachment {
  id: string;
  type: 'screenshot' | 'video';
  url: string;
  bugTitle: string;
  jobName: string;
  testerName: string;
  createdAt: string;
  severity: string;
}

export async function getDeveloperAttachments(developerId: string): Promise<DeveloperAttachment[]> {
  if (!isSupabaseConfigured) return [];

  try {
    // 1. Get all jobs for developer
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, title')
      .eq('developer_id', developerId);

    if (jobsError) throw jobsError;
    if (!jobs || jobs.length === 0) return [];

    const jobIds = jobs.map((j) => j.id);

    // 2. Get all bugs with attachments
    const { data: bugReports, error: bugReportsError } = await supabase
      .from('bug_reports')
      .select('id, title, screenshot_path, video_path, created_at, job_id, tester_id, severity')
      .in('job_id', jobIds)
      .or('screenshot_path.not.is.null,video_path.not.is.null')
      .order('created_at', { ascending: false });

    if (bugReportsError) throw bugReportsError;
    if (!bugReports || bugReports.length === 0) return [];

    // 3. Get tester profiles
    const testerIds = [...new Set(bugReports.map((b) => b.tester_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', testerIds);

    const profileMap = new Map(profiles?.map((p) => [p.id, p.full_name]) || []);
    const jobMap = new Map(jobs.map((j) => [j.id, j.title]));

    // 4. Map to attachments with public URLs
    const attachments: DeveloperAttachment[] = [];

    for (const bug of bugReports) {
      const testerName = profileMap.get(bug.tester_id) || 'Unknown Tester';
      const jobName = jobMap.get(bug.job_id) || 'Unknown Job';

      if (bug.screenshot_path) {
        const { data: urlData } = supabase.storage.from('bug-screenshots').getPublicUrl(bug.screenshot_path);
        attachments.push({
          id: `${bug.id}-img`,
          type: 'screenshot',
          url: urlData.publicUrl,
          bugTitle: bug.title,
          jobName,
          testerName,
          createdAt: bug.created_at,
          severity: bug.severity,
        });
      }

      if (bug.video_path) {
        const { data: urlData } = supabase.storage.from('bug-videos').getPublicUrl(bug.video_path);
        attachments.push({
          id: `${bug.id}-vid`,
          type: 'video',
          url: urlData.publicUrl,
          bugTitle: bug.title,
          jobName,
          testerName,
          createdAt: bug.created_at,
          severity: bug.severity,
        });
      }
    }

    return attachments;
  } catch (error) {
    console.error('Failed to get developer attachments:', error);
    return [];
  }
}
