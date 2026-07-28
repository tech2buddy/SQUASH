import {
  AlertTriangle,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CircleDollarSign,
  Info,
  MessageSquareText,
  MoreHorizontal,
  TrendingUp,
  UserCircle2,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { getCategoryById, type TestCategoryId } from './components/testCategories';
import { getTestTypeByKey } from './lib/testTypes';
import { useAuth } from './auth';
import { getDeveloperApplications, getDeveloperDashboardSummary, getDeveloperJobs, getDeveloperSubmittedReports, type DeveloperApplication, type DeveloperDashboardSummary, type DeveloperJob, type DeveloperSubmissionReview } from './lib/jobApi';
import { useSupabaseRealtime } from './hooks/useSupabaseRealtime';

type DashboardJob = {
  id: string;
  name: string;
  type: string;
  testers: string;
  status: 'In Progress' | 'Reviewing' | 'Open' | 'Completed';
  postedDate: string;
  postedNote: string;
  submissions: string;
  accent: string;
  logoUrl?: string | null;
  categoryId: TestCategoryId;
  plan?: string;
};

export default function SquashDeveloperDashboard() {
  const { session } = useAuth();
  const developerName = session?.name || 'Developer';
  const developerFirstName = developerName.split(' ')[0] || developerName;
  const [databaseJobs, setDatabaseJobs] = useState<DeveloperJob[]>([]);
  const [databaseApplications, setDatabaseApplications] = useState<DeveloperApplication[]>([]);
  const [databaseReports, setDatabaseReports] = useState<DeveloperSubmissionReview[]>([]);
  const [dashboardSummary, setDashboardSummary] = useState<DeveloperDashboardSummary | null>(null);
  const [jobsError, setJobsError] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(true);

  const formatRand = (amount: number) => `R${amount.toLocaleString('en-ZA')}`;

  const stats = [
    {
      title: 'Active Jobs',
      value: String(dashboardSummary?.activeJobs ?? 0),
      note: `${databaseJobs.length} total posted`,
      trend: `${dashboardSummary?.pendingApplications ?? 0} pending applicants`,
      icon: BriefcaseBusiness,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      title: 'Total Testers',
      value: String(dashboardSummary?.uniqueTesters ?? 0),
      note: `${dashboardSummary?.totalApplications ?? 0} applications`,
      trend: 'Verified application data',
      icon: Users,
      iconBg: 'bg-sky-50',
      iconColor: 'text-sky-600',
    },
    {
      title: 'Reports',
      value: String(dashboardSummary?.submittedReports ?? 0),
      note: `${dashboardSummary?.approvedReports ?? 0} approved`,
      trend: `${dashboardSummary?.averageScore ?? 0}/100 average score`,
      icon: BarChart3,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
    },
    {
      title: 'Committed Budget',
      value: formatRand(dashboardSummary?.totalCommittedZar ?? 0),
      note: 'Across posted jobs',
      trend: 'Package totals only',
      icon: CircleDollarSign,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
  ];



  const databaseDashboardJobs = useMemo(
    () =>
      databaseJobs.map<DashboardJob>((job) => {
        const acceptedTesters = databaseApplications.filter((a) => a.jobId === job.id && a.status === 'accepted').length;
        const submittedReports = databaseReports.filter((r) => r.jobId === job.id).length;
        return {
          id: job.id,
          name: job.title,
          type: job.platform,
          testers: `${acceptedTesters} / ${job.testersNeeded}`,
          status: job.status === 'active' ? ('Open' as const) : job.status === 'completed' ? ('Completed' as const) : ('Reviewing' as const),
          postedDate: new Date(job.createdAt).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }),
          postedNote: 'Created',
          submissions: `${submittedReports} / ${job.testersNeeded}`,
          accent: 'bg-green-600 text-white',
          logoUrl: job.logoUrl,
          categoryId: job.category as TestCategoryId,
          plan: getTestTypeByKey(job.packageKey).shortLabel,
        };
      }),
    [databaseJobs, databaseApplications, databaseReports],
  );

  const jobs = databaseDashboardJobs;

  const fetchData = useCallback(() => {
    if (!session?.userId || !session.roles.includes('developer')) return;

    Promise.all([getDeveloperJobs(session.userId), getDeveloperApplications(session.userId), getDeveloperSubmittedReports(session.userId), getDeveloperDashboardSummary(session.userId)])
      .then(([jobItems, applicationItems, reportItems, summary]) => {
        setDatabaseJobs(jobItems);
        setDatabaseApplications(applicationItems);
        setDatabaseReports(reportItems);
        setDashboardSummary(summary);
      })
      .catch((error: Error) => {
        setJobsError(error.message || 'Could not load your live dashboard data right now.');
      })
      .finally(() => {
        setIsLoadingData(false);
      });
  }, [session]);

  useSupabaseRealtime(['jobs', 'job_applications', 'test_submissions', 'test_assignments'], fetchData, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const [tierFilter, setTierFilter] = useState<'All' | 'Verified+' | 'Pro+' | 'Elite Only'>('All');



  const liveApplications = useMemo(
    () =>
      databaseApplications.slice(0, 5).map((application) => ({
        app: application.jobTitle,
        tester: application.testerName,
        time: new Date(application.createdAt).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' }),
        status: application.status,
      })),
    [databaseApplications],
  );


  const totalLiveBugs = dashboardSummary
    ? Object.values(dashboardSummary.bugCounts).reduce((sum, count) => sum + count, 0)
    : 0;
  const bugSummary = [
    { label: 'Critical', value: `${dashboardSummary?.bugCounts.Critical ?? 0}`, color: 'bg-red-500' },
    { label: 'High', value: `${dashboardSummary?.bugCounts.High ?? 0}`, color: 'bg-orange-500' },
    { label: 'Medium', value: `${dashboardSummary?.bugCounts.Medium ?? 0}`, color: 'bg-amber-400' },
    { label: 'Low', value: `${dashboardSummary?.bugCounts.Low ?? 0}`, color: 'bg-green-500' },
  ];

  const submissionTrendValues = dashboardSummary?.trend.length ? dashboardSummary.trend : [0, 0, 0, 0, 0, 0, 0];
  const submissionTrendLabels = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return date.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' });
  });
  const trendMax = Math.max(1, ...submissionTrendValues);
  const trendPoints = submissionTrendValues
    .map((value, index) => {
      const x = (index / (submissionTrendValues.length - 1)) * 100;
      const y = 100 - (value / trendMax) * 100;
      return `${x},${y}`;
    })
    .join(' ');
  const trendAreaPoints = `0,100 ${trendPoints} 100,100`;
  const dashboardActivity = [
    ...databaseApplications.slice(0, 3).map((application) => ({
      text: `${application.testerName} applied for ${application.jobTitle}`,
      time: new Date(application.createdAt).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' }),
      color: 'bg-green-100 text-green-600',
    })),
    ...databaseJobs.slice(0, 2).map((job) => ({
      text: `${job.title} was posted`,
      time: new Date(job.createdAt).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' }),
      color: 'bg-sky-100 text-sky-600',
    })),
  ];

  const getStatusClasses = (status: string) => {
    if (status === 'In Progress') return 'bg-green-100 text-green-700';
    if (status === 'Reviewing') return 'bg-amber-100 text-amber-700';
    if (status === 'Completed') return 'bg-emerald-100 text-emerald-700';
    return 'bg-slate-100 text-slate-700';
  };


  const getActivityIcon = (text: string) => {
    if (text.includes('Critical')) return AlertTriangle;
    if (text.includes('Payment')) return CircleDollarSign;
    if (text.includes('submitted')) return MessageSquareText;
    if (text.includes('completed')) return CheckCircle2;
    return Clock3;
  };


  if (isLoadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 text-center text-sm font-semibold text-slate-600">
        Loading dashboard data...
      </div>
    );
  }

  return (
    <div>
      <div className="px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">Welcome back, {developerFirstName}!</h1>
                <p className="text-xs text-slate-500 mt-0.5 lg:text-base lg:mt-2">Here&apos;s what&apos;s happening with your testing activity.</p>
              </div>
              <a href="/dashboard" className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
                Live
              </a>
            </div>

            <section className="mt-4 grid grid-cols-2 gap-2.5 xl:grid-cols-4">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.title} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-xl font-black text-slate-900">{stat.value}</div>
                        <div className="text-[11px] font-semibold text-slate-600 truncate">{stat.title}</div>
                        <div className="mt-1 text-[10px] text-slate-400 truncate leading-tight">{stat.note}</div>
                        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                          <TrendingUp className="h-3 w-3" />
                          <span className="truncate max-w-[80px]">{stat.trend}</span>
                        </div>
                      </div>
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ring-1 ring-white ${stat.iconBg}`}>
                        <Icon className={`h-4 w-4 ${stat.iconColor}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>

            <section className="mt-4 grid gap-4 xl:grid-cols-[1.8fr_0.9fr]">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">Active Jobs</h2>
                    <div className="relative">
                      <select
                        value={tierFilter}
                        onChange={(e) =>
                          setTierFilter(e.target.value as 'All' | 'Verified+' | 'Pro+' | 'Elite Only')
                        }
                        className="appearance-none rounded-lg border border-slate-200 bg-white px-2.5 py-1 pr-6 text-[11px] font-semibold text-slate-700 outline-none"
                      >
                        <option>All</option>
                        <option>Verified+</option>
                        <option>Pro+</option>
                        <option>Elite Only</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                  <a href="/developer/jobs" className="text-xs font-semibold text-green-700">View all &rarr;</a>
                </div>
                {tierFilter === 'Elite Only' ? (
                  <div className="border-b border-slate-100 bg-amber-50 px-5 py-2 text-xs font-semibold text-amber-700">
                    Premium price indicator active for Elite tester jobs.
                  </div>
                ) : null}
                {databaseJobs.length > 0 ? (
                  <div className="border-b border-green-100 bg-green-50 px-5 py-2 text-xs font-semibold text-green-700">
                    Showing {databaseJobs.length} real Supabase job{databaseJobs.length === 1 ? '' : 's'}.
                  </div>
                ) : null}
                {jobsError ? (
                  <div className="border-b border-red-100 bg-red-50 px-5 py-2 text-xs font-semibold text-red-600">
                    {jobsError}
                  </div>
                ) : null}

                {/* Mobile Cards List */}
                <div className="divide-y divide-slate-100 md:hidden">
                  {jobs.length === 0 ? (
                    <div className="px-5 py-8 text-center text-sm font-semibold text-slate-500">
                      No jobs posted yet. Create your first job to see live dashboard data.
                    </div>
                  ) : jobs.map((job) => {
                    const category = getCategoryById(job.categoryId);
                    const CategoryIcon = category.icon;
                    return (
                      <div key={job.name} className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl text-base font-bold ${job.logoUrl ? 'border border-slate-200 bg-white text-slate-900' : job.accent}`}>
                              {job.logoUrl ? <img src={job.logoUrl} alt={`${job.name} logo`} className="h-full w-full object-cover" /> : job.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{job.name}</div>
                              <div className="text-xs text-slate-500">{job.type}</div>
                            </div>
                          </div>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(job.status)}`}>
                            {job.status}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 font-semibold text-slate-700">
                            <CategoryIcon className="h-3 w-3" style={{ color: category.color }} />
                            {category.name}
                          </span>
                          <span>Testers: <strong className="text-slate-900">{job.testers}</strong></span>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                            <span>Submissions: {job.submissions}</span>
                            <span>{job.postedDate}</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-100">
                            <div
                              className="h-1.5 rounded-full bg-green-500"
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.round(
                                    (Number(job.submissions.split('/')[0].trim()) /
                                      Number(job.submissions.split('/')[1].trim())) *
                                      100,
                                  ),
                                )}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="pt-1 flex items-center justify-between">
                          <div className="text-xs text-slate-500">{job.postedNote}</div>
                          <div className="flex items-center gap-2">
                            <Link to={`/developer/submissions?job=${job.id}`} className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                              View reports
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-sm text-slate-500">
                        <th className="px-5 py-3 font-medium">App / Job</th>
                        <th className="px-5 py-3 font-medium">Category</th>
                        <th className="px-5 py-3 font-medium">Testers</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                        <th className="px-5 py-3 font-medium">Created</th>
                        <th className="px-5 py-3 font-medium">Submissions</th>
                        <th className="px-5 py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-5 py-8 text-center text-sm font-semibold text-slate-500">
                            No jobs posted yet. Create your first job to see live dashboard data.
                          </td>
                        </tr>
                      ) : jobs.map((job) => (
                        <tr key={job.name} className="border-b border-slate-100 last:border-b-0">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl text-base font-bold ${job.logoUrl ? 'border border-slate-200 bg-white text-slate-900' : job.accent}`}>
                                {job.logoUrl ? <img src={job.logoUrl} alt={`${job.name} logo`} className="h-full w-full object-cover" /> : job.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900">{job.name}</div>
                                <div className="text-sm text-slate-500">{job.type}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            {(() => {
                              const category = getCategoryById(job.categoryId);
                              const CategoryIcon = category.icon;
                              return (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                                  <CategoryIcon className="h-3.5 w-3.5" style={{ color: category.color }} />
                                  {category.name}
                                  {category.saExclusive ? (
                                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">SA 🇿🇦</span>
                                  ) : null}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="px-5 py-3 text-sm font-medium text-slate-700">{job.testers}</td>
                          <td className="px-5 py-3">
                            <div className="space-y-2">
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(job.status)}`}>
                                {job.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <div className="text-sm font-medium text-slate-700">{job.postedDate}</div>
                            <div className="mt-1 text-xs text-slate-500">
                              {job.postedNote}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-sm font-medium text-slate-700">
                            <div>{job.submissions}</div>
                            <div className="mt-2 w-24">
                              <div className="h-1.5 rounded-full bg-slate-100">
                                <div
                                  className="h-1.5 rounded-full bg-green-500"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      Math.round(
                                        (Number(job.submissions.split('/')[0].trim()) /
                                          Number(job.submissions.split('/')[1].trim())) *
                                          100,
                                      ),
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <Link to="/report-details" className="block rounded-xl p-2 text-slate-500 hover:bg-slate-100">
                                <MoreHorizontal className="h-4 w-4" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                  <h2 className="text-base font-bold text-slate-900">Recent Submissions</h2>
                  <Link to="/developer/submissions" className="text-xs font-semibold text-green-700 hover:underline">View all &rarr;</Link>
                </div>
                <div className="space-y-1 p-3">
                  {liveApplications.length > 0 ? (
                    liveApplications.map((application) => (
                      <Link
                        key={`${application.app}-${application.tester}-${application.time}`}
                        to="/developer/submissions"
                        className="flex items-center justify-between gap-3 rounded-2xl border border-green-100 bg-green-50/50 px-3 py-3 transition hover:border-green-200 hover:bg-green-50"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-green-700 ring-1 ring-green-100">
                              <UserCircle2 className="h-5 w-5" />
                            </div>
                            <div className="truncate font-semibold text-slate-900">{application.app}</div>
                          </div>
                          <div className="mt-1 text-sm text-slate-600">Application by {application.tester}</div>
                          <div className="mt-1 text-xs text-slate-400">Applied {application.time}</div>
                        </div>
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold capitalize text-amber-700 ring-1 ring-amber-100">
                          {application.status}
                        </span>
                      </Link>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">
                      No live applications yet.
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.2fr_0.9fr]">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-base font-bold text-slate-900">Bug Summary</div>
                <div className="mt-6 flex items-center justify-center">
                  <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-slate-100 shadow-sm transition-transform hover:scale-105 duration-300">
                    <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-white text-center shadow-inner">
                      <div className="text-xl font-black text-slate-900">{totalLiveBugs}</div>
                      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total Bugs</div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  {bugSummary.map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <span className={`h-3.5 w-3.5 rounded-full ${item.color}`} />
                        <span className="text-slate-700">{item.label}</span>
                      </div>
                      <span className="font-semibold text-slate-900">{item.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Info className="h-4 w-4 text-slate-500" />
                    Tester Demographics
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-5 text-sm leading-6 text-slate-500">
                        Demographics will appear after testers submit profile-backed reports for your jobs.
                      </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-base font-bold text-slate-900">Submissions Overview</div>
                  <a href="/dashboard" className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600">This Week</a>
                </div>

                <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-2 py-3">
                  <div className="h-28">
                    <svg viewBox="0 0 100 100" className="h-full w-full">
                      <defs>
                        <linearGradient id="submissionTrendFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#22c55e" stopOpacity="0.02" />
                        </linearGradient>
                      </defs>
                      <polyline
                        points={trendAreaPoints}
                        fill="url(#submissionTrendFill)"
                        stroke="none"
                      />
                      <polyline
                        points={trendPoints}
                        fill="none"
                        stroke="#16a34a"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {submissionTrendValues.map((value, index) => {
                        const x = (index / (submissionTrendValues.length - 1)) * 100;
                        const y = 100 - (value / trendMax) * 100;
                        return (
                          <circle key={`${value}-${index}`} cx={x} cy={y} r="1.8" fill="#16a34a" />
                        );
                      })}
                    </svg>
                  </div>
                  <div className="mt-2 grid grid-cols-7 text-center text-[11px] text-slate-500">
                    {submissionTrendLabels.map((label) => (
                      <span key={label}>{label}</span>
                    ))}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    [String(dashboardSummary?.totalApplications ?? 0), 'Applications', 'text-slate-900'],
                    [String(dashboardSummary?.submittedReports ?? 0), 'In Review', 'text-amber-600'],
                    [String(dashboardSummary?.approvedReports ?? 0), 'Approved', 'text-green-600'],
                    [`${dashboardSummary?.averageScore ?? 0}/100`, 'Avg Score', 'text-sky-600'],
                  ].map(([value, label, color]) => (
                    <div key={label} className="rounded-xl bg-slate-50 px-3 py-2.5 text-center">
                      <div className={`text-lg font-black ${color}`}>{value}</div>
                      <div className="mt-0.5 text-[11px] font-medium text-slate-500">{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold text-slate-900">Activity Feed</div>
                  <a href="/developer/activity" className="text-sm font-semibold text-green-700">View all -&gt;</a>
                </div>

                <div className="mt-6 space-y-5">
                  {dashboardActivity.length > 0 ? (
                    dashboardActivity.map((item) => {
                      const ActivityIcon = getActivityIcon(item.text);
                      return (
                        <div key={item.text} className="flex gap-4">
                          <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${item.color}`}>
                            <ActivityIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-800">{item.text}</div>
                            <div className="mt-1 text-sm text-slate-500">{item.time}</div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">
                      No live activity yet. New jobs, applications and reports will appear here.
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="relative mt-8 overflow-hidden rounded-3xl border border-green-200 bg-gradient-to-r from-green-50 via-emerald-50 to-green-100/70 p-5 shadow-sm">
              <div className="pointer-events-none absolute -left-12 -top-12 h-36 w-36 rounded-full bg-green-300/20 blur-3xl" />
              <div className="pointer-events-none absolute -right-10 bottom-0 h-28 w-28 rounded-full bg-emerald-300/20 blur-2xl" />
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl border border-green-200/80 bg-white/90 shadow-[0_8px_24px_rgba(16,185,129,0.18)]">
                    <div className="absolute h-10 w-10 rounded-full bg-emerald-300/30 blur-xl" />
                    <svg
                      viewBox="0 0 64 64"
                      className="relative h-9 w-9"
                      aria-hidden="true"
                    >
                      <defs>
                        <radialGradient id="bulbGlow" cx="50%" cy="45%" r="60%">
                          <stop offset="0%" stopColor="#fef08a" stopOpacity="0.95" />
                          <stop offset="65%" stopColor="#fde047" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#fde047" stopOpacity="0" />
                        </radialGradient>
                        <linearGradient id="bulbBody" x1="0%" x2="0%" y1="0%" y2="100%">
                          <stop offset="0%" stopColor="#fef9c3" />
                          <stop offset="100%" stopColor="#fde047" />
                        </linearGradient>
                      </defs>
                      <circle cx="32" cy="26" r="19" fill="url(#bulbGlow)" />
                      <path
                        d="M32 11c-8.4 0-15 6.6-15 14.9 0 5.2 2.8 9.8 7 12.4 1.4.9 2.1 2.1 2.1 3.4V43h12v-1.3c0-1.3.8-2.5 2.1-3.4 4.2-2.6 7-7.2 7-12.4C47 17.6 40.4 11 32 11Z"
                        fill="url(#bulbBody)"
                        stroke="#15803d"
                        strokeWidth="2.2"
                        strokeLinejoin="round"
                      />
                      <rect x="25" y="44" width="14" height="5" rx="2.5" fill="#166534" />
                      <rect x="26.5" y="50" width="11" height="4" rx="2" fill="#14532d" />
                      <path d="M26 24h12" stroke="#15803d" strokeWidth="2" strokeLinecap="round" />
                      <path d="M24 30h16" stroke="#15803d" strokeWidth="2" strokeLinecap="round" />
                      <path d="M32 5v4" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" />
                      <path d="m46.5 11.5-2.8 2.8" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" />
                      <path d="m17.5 11.5 2.8 2.8" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">Need more testers for your project?</div>
                    <div className="mt-1 text-slate-600">Invite more skilled testers and get better coverage.</div>
                  </div>
                </div>
                <a href="/post-job" className="w-fit rounded-2xl bg-green-600 px-6 py-3 font-semibold text-white shadow-[0_10px_20px_rgba(22,163,74,0.28)] transition hover:-translate-y-0.5 hover:bg-green-700">
                  Post a New Job
                </a>
              </div>
            </section>
          </div>
    </div>
  );
}




