import {
  CheckCircle2,
  FileText,
  MapPin,
  UserCircle2,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import TesterBadge from './components/TesterBadge';
import { getCategoryById, type TestCategoryId } from './components/testCategories';
import { useAuth } from './auth';
import {
  getDeveloperJobs,
  type DeveloperJob,
  getDeveloperApplications,
  getDeveloperSubmittedReports,
  reviewDeveloperApplication,
  type DeveloperApplication,
  type DeveloperSubmissionReview,
} from './lib/jobApi';
import { getSpecializationLabel } from './components/testerSpecializations';

function DeveloperShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  active?: 'dashboard' | 'jobs' | 'applications' | 'reports' | 'billing';
  children: ReactNode;
}) {
  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
        </div>
        <a
          href="/post-job"
          className="inline-flex w-fit items-center justify-center rounded-2xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-green-700"
        >
          + Post a New Job
        </a>
      </div>
      {children}
    </>
  );
}

// ----------------------------------------------------------------------
// 1. JOBS PAGE
// ----------------------------------------------------------------------
export function SquashDeveloperJobsPage() {
  const { session } = useAuth();
  const [databaseJobs, setDatabaseJobs] = useState<DeveloperJob[]>([]);
  const [applications, setApplications] = useState<DeveloperApplication[]>([]);
  const [reports, setReports] = useState<DeveloperSubmissionReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session?.userId || !session.roles.includes('developer')) return;

    let mounted = true;
    setLoading(true);

    Promise.all([
      getDeveloperJobs(session.userId),
      getDeveloperApplications(session.userId),
      getDeveloperSubmittedReports(session.userId),
    ])
      .then(([jobItems, appItems, reportItems]) => {
        if (!mounted) return;
        setDatabaseJobs(jobItems);
        setApplications(appItems);
        setReports(reportItems);
      })
      .catch((err: Error) => {
        if (mounted) setError(err.message || 'Could not load your jobs.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [session?.userId, session?.roles]);

  const jobs = useMemo(
    () =>
      databaseJobs.map((job) => {
        const acceptedTesters = applications.filter((a) => a.jobId === job.id && a.status === 'accepted').length;
        const submittedReports = reports.filter((r) => r.jobId === job.id).length;
        return {
          id: job.id,
          name: job.title,
          type: job.platform,
          testers: `${acceptedTesters} / ${job.testersNeeded}`,
          status: job.status === 'active' ? 'Open' : job.status === 'completed' ? 'Completed' : 'Reviewing',
          deadline: new Date(job.createdAt).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }),
          submissions: `${submittedReports} / ${job.testersNeeded}`,
          logoUrl: job.logoUrl,
          categoryId: job.category as TestCategoryId,
        };
      }),
    [databaseJobs, applications, reports],
  );

  return (
    <DeveloperShell
      title="Active Jobs"
      subtitle="Manage your posted testing jobs and track active testing progress."
      active="jobs"
    >
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-sm font-semibold text-slate-500">Loading jobs...</div>
        ) : error ? (
          <div className="p-6 text-center text-sm font-semibold text-red-600">{error}</div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-lg font-bold text-slate-900">No active jobs found</div>
            <p className="mt-2 text-sm text-slate-500">Post a new job to start receiving applications from qualified testers.</p>
            <a href="/post-job" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700">
              Post a Job Now
            </a>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {/* Desktop Table Header */}
            <div className="hidden grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto] gap-4 bg-slate-50 px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 md:grid">
              <div>Job Title</div>
              <div>Category</div>
              <div>Testers</div>
              <div>Status</div>
              <div>Submissions</div>
              <div className="text-right">Actions</div>
            </div>

            {/* Job Rows */}
            {jobs.map((job) => {
              const category = getCategoryById(job.categoryId);
              const CategoryIcon = category.icon;
              return (
                <div key={job.id} className="grid grid-cols-1 gap-4 p-5 md:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto] md:items-center md:px-6">
                  <div className="flex items-center gap-3">
                    {job.logoUrl ? (
                      <img src={job.logoUrl} alt={job.name} className="h-10 w-10 rounded-xl object-cover border border-slate-100" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-700 font-bold">
                        {job.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-slate-900">{job.name}</div>
                      <div className="text-xs text-slate-500">{job.type}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <CategoryIcon className="h-4 w-4" style={{ color: category.color }} />
                    {category.name}
                  </div>

                  <div className="text-sm font-medium text-slate-700">
                    <span className="font-bold text-slate-900">{job.testers}</span>
                  </div>

                  <div>
                    <span className="inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">
                      {job.status}
                    </span>
                  </div>

                  <div className="text-sm font-medium text-slate-700">
                    {job.submissions}
                  </div>

                  <div className="flex items-center gap-2 text-right">
                    <Link
                      to={`/developer/applications?job=${job.id}`}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Applications
                    </Link>
                    <Link
                      to={`/developer/reports?job=${job.id}`}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Reports
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DeveloperShell>
  );
}

// ----------------------------------------------------------------------
// 2. APPLICATIONS PAGE
// ----------------------------------------------------------------------
export function SquashDeveloperApplicationsPage() {
  const { session } = useAuth();
  const jobId = new URLSearchParams(window.location.search).get('job');
  const [applications, setApplications] = useState<DeveloperApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.userId || !session.roles.includes('developer')) return;

    let mounted = true;
    setLoading(true);
    setError('');

    getDeveloperApplications(session.userId)
      .then((appItems) => {
        if (!mounted) return;
        setApplications(appItems);
      })
      .catch((err: Error) => {
        if (mounted) setError(err.message || 'Could not load applications.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [session?.userId, session?.roles]);

  const pendingCount = applications.filter((item) => item.status === 'pending').length;
  const acceptedCount = applications.filter((item) => item.status === 'accepted').length;
  const rejectedCount = applications.filter((item) => item.status === 'rejected').length;

  const filteredApplications = useMemo(() => {
    const sorted = applications.slice().sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    return jobId ? sorted.filter((a) => a.jobId === jobId) : sorted;
  }, [applications, jobId]);

  const handleReview = async (application: DeveloperApplication, status: 'accepted' | 'rejected') => {
    setUpdatingId(application.id);
    setError('');
    setActionMessage('');

    try {
      const updated = await reviewDeveloperApplication(application, status);
      setApplications((current) =>
        current.map((item) => (item.id === updated.id ? { ...item, status: updated.status, updatedAt: updated.updatedAt } : item)),
      );
      setActionMessage(
        status === 'accepted'
          ? `${application.testerName} has been accepted for ${application.jobTitle}.`
          : `${application.testerName} was rejected for ${application.jobTitle}.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update application.');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: DeveloperApplication['status']) => {
    if (status === 'accepted') return 'bg-green-50 text-green-700 border-green-200';
    if (status === 'rejected') return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  return (
    <DeveloperShell
      title="Tester Applications"
      subtitle="Review testers who applied to test your apps and accept or reject applications."
      active="applications"
    >
      <div className="space-y-6">
        {/* Stat Cards */}
        <section className="grid gap-4 md:grid-cols-3">
          {[
            { label: 'Pending Review', value: pendingCount, color: 'bg-amber-50 text-amber-700', icon: UserCircle2 },
            { label: 'Accepted Testers', value: acceptedCount, color: 'bg-green-50 text-green-700', icon: CheckCircle2 },
            { label: 'Rejected Applications', value: rejectedCount, color: 'bg-red-50 text-red-700', icon: XCircle },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-500">{card.label}</div>
                    <div className="mt-2 text-3xl font-black text-slate-900">{card.value}</div>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {actionMessage ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
            {actionMessage}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        {/* Applications List */}
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-bold text-slate-900">
              {jobId ? 'Applications for Selected Job' : 'All Tester Applications'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Click accept to move an applicant into an active test assignment.</p>
          </div>

          {loading ? (
            <div className="p-6 text-sm font-semibold text-slate-500">Loading applications...</div>
          ) : filteredApplications.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredApplications.map((application) => {
                const category = getCategoryById(application.jobCategory as TestCategoryId);
                const CategoryIcon = category.icon;
                const specializationLabels = application.testerSpecializations.slice(0, 3).map(getSpecializationLabel);
                const isUpdating = updatingId === application.id;

                return (
                  <div key={application.id} className="p-5">
                    <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr_auto] xl:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-sm font-black text-white">
                            {application.testerName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{application.testerName}</div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              <span>{application.testerEmail || 'Email hidden'}</span>
                              <span className="hidden sm:inline">-</span>
                              <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {application.testerCity}</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <TesterBadge testsCompleted={application.testerTestsCompleted} rating={application.testerRating} />
                          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                            {application.testerRating.toFixed(1)} ★
                          </span>
                          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                            {application.testerTestsCompleted} tests completed
                          </span>
                        </div>
                        {specializationLabels.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {specializationLabels.map((label) => (
                              <span key={label} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                {label}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <div className="text-xs font-semibold text-slate-500">Applied for</div>
                        <div className="mt-1 font-bold text-slate-900">{application.jobTitle}</div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                            <CategoryIcon className="h-3.5 w-3.5" style={{ color: category.color }} />
                            {category.name}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row xl:flex-col xl:items-stretch">
                        <span className={`inline-flex justify-center rounded-full border px-3 py-1.5 text-xs font-bold capitalize ${getStatusBadge(application.status)}`}>
                          {application.status}
                        </span>
                        {application.status === 'pending' ? (
                          <>
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleReview(application, 'accepted')}
                              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              {isUpdating ? 'Saving...' : 'Accept'}
                            </button>
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleReview(application, 'rejected')}
                              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                            >
                              <XCircle className="h-4 w-4" />
                              {isUpdating ? 'Saving...' : 'Reject'}
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">No applications found.</div>
          )}
        </section>
      </div>
    </DeveloperShell>
  );
}

// ----------------------------------------------------------------------
// 3. REPORTS PAGE
// ----------------------------------------------------------------------
export function SquashDeveloperReportsPage() {
  const { session } = useAuth();
  const jobId = new URLSearchParams(window.location.search).get('job');
  const [submittedReports, setSubmittedReports] = useState<DeveloperSubmissionReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session?.userId || !session.roles.includes('developer')) return;

    let mounted = true;
    setLoading(true);

    getDeveloperSubmittedReports(session.userId)
      .then((reportItems) => {
        if (!mounted) return;
        setSubmittedReports(reportItems);
      })
      .catch((err: Error) => {
        if (mounted) setError(err.message || 'Could not load submitted reports.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [session?.userId, session?.roles]);

  const reviewCount = submittedReports.filter((item) => item.status === 'submitted').length;
  const approvedCount = submittedReports.filter((item) => item.status === 'approved').length;

  const filteredReports = useMemo(() => {
    const sorted = submittedReports.slice().sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    return jobId ? sorted.filter((r) => r.jobId === jobId) : sorted;
  }, [submittedReports, jobId]);

  return (
    <DeveloperShell
      title="Submitted Reports"
      subtitle="Review bug reports and testing feedback submitted by accepted testers."
      active="reports"
    >
      <div className="space-y-6">
        {/* Stat Cards */}
        <section className="grid gap-4 md:grid-cols-2">
          {[
            { label: 'Reports Needing Review', value: reviewCount, color: 'bg-sky-50 text-sky-700', icon: FileText },
            { label: 'Approved Reports', value: approvedCount, color: 'bg-green-50 text-green-700', icon: CheckCircle2 },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-500">{card.label}</div>
                    <div className="mt-2 text-3xl font-black text-slate-900">{card.value}</div>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        {/* Reports List */}
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-bold text-slate-900">
              {jobId ? 'Reports for Selected Job' : 'All Submitted Test Reports'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Click any report row to view complete bug details and proof attachments.</p>
          </div>

          {loading ? (
            <div className="p-6 text-sm font-semibold text-slate-500">Loading reports...</div>
          ) : filteredReports.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredReports.map((report) => {
                const category = getCategoryById(report.jobCategory as TestCategoryId);
                const CategoryIcon = category.icon;
                const statusClass =
                  report.status === 'approved'
                    ? 'bg-green-50 text-green-700 ring-green-100'
                    : report.status === 'rejected'
                      ? 'bg-red-50 text-red-600 ring-red-100'
                      : 'bg-sky-50 text-sky-700 ring-sky-100';

                return (
                  <Link
                    key={report.id}
                    to={`/report-details?submission=${report.id}`}
                    className="block p-5 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-600 text-sm font-black text-white">
                        {report.testerName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="font-bold text-slate-900">{report.jobTitle}</div>
                            <div className="text-sm text-slate-500">Submitted by {report.testerName}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                              <CategoryIcon className="h-3.5 w-3.5" style={{ color: category.color }} />
                              {category.name}
                            </span>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ring-1 ${statusClass}`}>
                              {report.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                          {report.summary || 'No written summary provided.'}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">No submitted reports found.</div>
          )}
        </section>
      </div>
    </DeveloperShell>
  );
}

// ----------------------------------------------------------------------
// 4. OTHER VIEWS (Activity & Attachments)
// ----------------------------------------------------------------------
export function SquashDeveloperActivityPage() {
  return (
    <DeveloperShell title="All Activity" subtitle="Timeline of workspace updates." active="dashboard">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-slate-600 font-semibold">Activity log loaded.</div>
      </div>
    </DeveloperShell>
  );
}

export function SquashReportAttachmentsPage() {
  return (
    <DeveloperShell title="Report Attachments" subtitle="Uploaded files and proof." active="reports">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-slate-600 font-semibold">No attachments found.</div>
      </div>
    </DeveloperShell>
  );
}

// ----------------------------------------------------------------------
// 5. RECENT SUBMISSIONS PAGE
// ----------------------------------------------------------------------
export function SquashDeveloperSubmissionsPage() {
  const { session } = useAuth();
  const [applications, setApplications] = useState<DeveloperApplication[]>([]);
  const [reports, setReports] = useState<DeveloperSubmissionReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'applications' | 'reports'>('all');

  useEffect(() => {
    if (!session?.userId || !session.roles.includes('developer')) return;

    let mounted = true;
    setLoading(true);
    setError('');

    Promise.all([
      getDeveloperApplications(session.userId),
      getDeveloperSubmittedReports(session.userId),
    ])
      .then(([appItems, reportItems]) => {
        if (!mounted) return;
        setApplications(appItems);
        setReports(reportItems);
      })
      .catch((err: Error) => {
        if (mounted) setError(err.message || 'Could not load submissions.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [session?.userId, session?.roles]);

  const combinedSubmissions = useMemo(() => {
    const getAppLogo = (title: string, logoUrl?: string | null) => {
      if (logoUrl) return logoUrl;
      const lower = title.toLowerCase();
      if (lower.includes('squash')) return '/squash-logo.png';
      if (lower.includes('bolt')) return 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=100&auto=format&fit=crop&q=80';
      if (lower.includes('instagram')) return 'https://images.unsplash.com/photo-1611262588024-d12430b98920?w=100&auto=format&fit=crop&q=80';
      return null;
    };

    const appList = applications.map((a) => ({
      id: a.id,
      type: 'application' as const,
      title: a.jobTitle,
      logoUrl: getAppLogo(a.jobTitle, a.jobLogoUrl),
      testerName: a.testerName,
      time: a.createdAt,
      status: a.status,
      category: a.jobCategory,
      link: '/developer/applications',
    }));

    const reportList = reports.map((r) => ({
      id: r.id,
      type: 'report' as const,
      title: r.jobTitle,
      logoUrl: getAppLogo(r.jobTitle, r.jobLogoUrl),
      testerName: r.testerName,
      time: r.createdAt,
      status: r.status,
      category: r.jobCategory,
      link: `/report-details?id=${r.id}`,
    }));

    const merged = [...appList, ...reportList].sort(
      (a, b) => Date.parse(b.time) - Date.parse(a.time)
    );

    if (filter === 'applications') return merged.filter((item) => item.type === 'application');
    if (filter === 'reports') return merged.filter((item) => item.type === 'report');
    return merged;
  }, [applications, reports, filter]);

  return (
    <DeveloperShell
      title="Recent Submissions"
      subtitle="View all incoming tester applications and bug test reports submitted across your posted jobs."
      active="applications"
    >
      <div className="space-y-6">
        {/* Stat Overview Cards */}
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Submissions</div>
                <div className="mt-2 text-3xl font-black text-slate-900">{applications.length + reports.length}</div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-700">
                <FileText className="h-6 w-6" />
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Applications</div>
                <div className="mt-2 text-3xl font-black text-slate-900">{applications.length}</div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                <UserCircle2 className="h-6 w-6" />
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Submitted Reports</div>
                <div className="mt-2 text-3xl font-black text-slate-900">{reports.length}</div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        {/* Submissions Feed */}
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">All Submissions Stream</h2>
              <p className="text-xs text-slate-500 mt-0.5">Real-time log of test applications and report submissions.</p>
            </div>
            <div className="flex items-center gap-2">
              {(['all', 'applications', 'reports'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold capitalize transition ${
                    filter === tab
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm font-semibold text-slate-500">Loading submissions...</div>
          ) : combinedSubmissions.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {combinedSubmissions.map((item) => {
                const category = getCategoryById(item.category as TestCategoryId);
                const CategoryIcon = category.icon;
                return (
                  <Link
                    key={`${item.type}-${item.id}`}
                    to={item.link}
                    className="flex flex-col gap-3 p-5 transition hover:bg-slate-50/80 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {item.logoUrl ? (
                        <img
                          src={item.logoUrl}
                          alt={`${item.title} logo`}
                          className="h-11 w-11 shrink-0 rounded-2xl border border-slate-200/80 object-cover shadow-sm bg-white"
                        />
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-600 font-bold text-white shadow-sm">
                          {item.title.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 truncate">{item.title}</span>
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            item.type === 'application' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {item.type}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Submitted by <span className="font-semibold text-slate-700">{item.testerName}</span> • {new Date(item.time).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                        <CategoryIcon className="h-3.5 w-3.5" style={{ color: category.color }} />
                        {category.name}
                      </span>
                      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700 border border-green-200 capitalize">
                        {item.status}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 text-sm font-semibold">
              No submissions found for the selected filter.
            </div>
          )}
        </section>
      </div>
    </DeveloperShell>
  );
}
