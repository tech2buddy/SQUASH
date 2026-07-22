import {
  Activity,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Download,
  FileText,
  Home,
  MapPin,
  Menu,
  Search,
  UserCircle2,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import DeveloperHeaderNav from './components/DeveloperHeaderNav';
import TesterBadge from './components/TesterBadge';
import { getCategoryById, type TestCategoryId } from './components/testCategories';
import { useAuth } from './auth';
import { getDeveloperApplications, getDeveloperSubmittedReports, reviewDeveloperApplication, reviewSubmittedReport, type DeveloperApplication, type DeveloperSubmissionReview } from './lib/jobApi';
import { getSpecializationLabel } from './components/testerSpecializations';

type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  active?: boolean;
};

type DashboardJob = {
  name: string;
  type: string;
  categoryId: TestCategoryId;
  testers: string;
  status: 'In Progress' | 'Reviewing' | 'Open';
  deadline: string;
  submissions: string;
  accent: string;
};

type SubmissionItem = {
  app: string;
  tester: string;
  testsCompleted: number;
  rating: number;
  time: string;
  severity: 'Critical' | 'Medium' | 'Low';
  videoDuration?: string;
};



type AttachmentItem = {
  name: string;
  meta: string;
  accent: string;
  icon: string;
};

const jobs: DashboardJob[] = [
  {
    name: 'PayFlow Web App',
    type: 'Web Application',
    categoryId: 'website-testing',
    testers: '24 / 30',
    status: 'In Progress',
    deadline: '28 May 2024',
    submissions: '12 / 24',
    accent: 'bg-slate-900 text-white',
  },
  {
    name: 'FitTrack Mobile',
    type: 'Mobile App',
    categoryId: 'mobile-app-testing',
    testers: '18 / 20',
    status: 'In Progress',
    deadline: '25 May 2024',
    submissions: '8 / 18',
    accent: 'bg-slate-800 text-white',
  },
  {
    name: 'HealthApp iOS',
    type: 'iOS Application',
    categoryId: 'localization-testing',
    testers: '30 / 30',
    status: 'Reviewing',
    deadline: '23 May 2024',
    submissions: '30 / 30',
    accent: 'bg-emerald-600 text-white',
  },
  {
    name: 'EduLearn Platform',
    type: 'Web Application',
    categoryId: 'onboarding-testing',
    testers: '10 / 15',
    status: 'Open',
    deadline: '05 Jun 2024',
    submissions: '0 / 10',
    accent: 'bg-violet-500 text-white',
  },
  {
    name: 'ShopEasy Android',
    type: 'Android App',
    categoryId: 'ecommerce-testing',
    testers: '5 / 20',
    status: 'Open',
    deadline: '10 Jun 2024',
    submissions: '0 / 5',
    accent: 'bg-red-500 text-white',
  },
  {
    name: 'MoneyMap Dashboard',
    type: 'Web Application',
    categoryId: 'performance-testing',
    testers: '12 / 16',
    status: 'In Progress',
    deadline: '14 Jun 2024',
    submissions: '6 / 12',
    accent: 'bg-indigo-500 text-white',
  },
  {
    name: 'Kasi Eats',
    type: 'Android App',
    categoryId: 'low-data-testing',
    testers: '8 / 12',
    status: 'Open',
    deadline: '16 Jun 2024',
    submissions: '2 / 8',
    accent: 'bg-orange-500 text-white',
  },
];

const submissions: SubmissionItem[] = [
  { app: 'PayFlow Web App', tester: 'Thando M.', testsCompleted: 14, rating: 4.3, time: '2h ago', severity: 'Critical', videoDuration: '00:41' },
  { app: 'FitTrack Mobile', tester: 'Sipho N.', testsCompleted: 32, rating: 4.7, time: '5h ago', severity: 'Medium', videoDuration: '00:28' },
  { app: 'HealthApp iOS', tester: 'Lerato D.', testsCompleted: 64, rating: 4.9, time: '6h ago', severity: 'Low', videoDuration: '00:55' },
  { app: 'PayFlow Web App', tester: 'John K.', testsCompleted: 5, rating: 3.9, time: '1d ago', severity: 'Critical' },
  { app: 'FitTrack Mobile', tester: 'Sarah W.', testsCompleted: 11, rating: 4.1, time: '1d ago', severity: 'Medium' },
  { app: 'Kasi Eats', tester: 'Anele P.', testsCompleted: 23, rating: 4.6, time: '2d ago', severity: 'Low' },
  { app: 'MoneyMap Dashboard', tester: 'Brendon R.', testsCompleted: 55, rating: 4.8, time: '2d ago', severity: 'Critical' },
  { app: 'EduLearn Platform', tester: 'Nomsa L.', testsCompleted: 8, rating: 4.2, time: '3d ago', severity: 'Medium' },
];




const attachments: AttachmentItem[] = [
  {
    name: 'Screenshot_2024-05-26_10-42.png',
    meta: 'PNG - 1.2 MB',
    accent: 'bg-red-50 text-red-500',
    icon: 'IMG',
  },
  {
    name: 'Screen_Recording_2024-05-26.mp4',
    meta: 'MP4 - 12.4 MB',
    accent: 'bg-violet-50 text-violet-500',
    icon: 'VID',
  },
  {
    name: 'Repro_Steps_FitTrack.pdf',
    meta: 'PDF - 690 KB',
    accent: 'bg-sky-50 text-sky-600',
    icon: 'PDF',
  },
];

function getStatusClasses(status: DashboardJob['status']) {
  if (status === 'In Progress') return 'bg-green-100 text-green-700';
  if (status === 'Reviewing') return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-700';
}

function getSeverityClasses(severity: SubmissionItem['severity']) {
  if (severity === 'Critical') return 'bg-red-50 text-red-600';
  if (severity === 'Medium') return 'bg-amber-50 text-amber-600';
  return 'bg-green-50 text-green-600';
}

function DeveloperShell({
  title,
  subtitle,
  active,
  children,
}: {
  title: string;
  subtitle: string;
  active: 'dashboard' | 'post-job' | 'reports' | 'billing';
  children: ReactNode;
}) {

  const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: Home, active: active === 'dashboard' },
    { label: 'Post a Job', href: '/post-job', icon: ClipboardList, active: active === 'post-job' },
    { label: 'Reports', href: '/report-details', icon: FileText, active: active === 'reports' },
    { label: 'Billing', href: '/billing', icon: CreditCard, active: active === 'billing' },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto">
          <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-6">
            <img
              src="/squash-logo.png"
              alt="SQUASH logo"
              className="h-11 w-11 rounded-2xl border border-slate-200 object-cover shadow-sm"
            />
            <a href="/" className="text-2xl font-black tracking-tight text-slate-900 hover:text-green-700">
              SQUASH
            </a>
          </div>
          <nav className="flex-1 space-y-2 px-4 py-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    item.active ? 'bg-green-50 text-green-700' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </a>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <a href="/dashboard" className="rounded-xl border border-slate-300 p-2.5 text-slate-600 lg:hidden">
                    <Menu className="h-5 w-5" />
                  </a>
                  <div className="hidden max-w-xl flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:flex md:min-w-[320px] lg:min-w-[420px]">
                    <Search className="h-4 w-4 text-slate-400" />
                    <input
                      className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                      placeholder="Search jobs, testers, reports..."
                    />
                  </div>
                </div>
                <DeveloperHeaderNav />
              </div>
            </div>
          </header>

          <div className="px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
            <p className="mt-2 text-slate-600">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}

export function SquashDeveloperJobsPage() {
  return (
    <DeveloperShell
      title="All Active Jobs"
      subtitle="Complete list of jobs posted by your team."
      active="dashboard"
    >
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
                      <tr className="border-b border-slate-100 text-left text-sm text-slate-500">
                        <th className="px-5 py-3 font-medium">App / Job</th>
                        <th className="px-5 py-3 font-medium">Category</th>
                        <th className="px-5 py-3 font-medium">Testers</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Deadline</th>
                <th className="px-5 py-3 font-medium">Submissions</th>
                <th className="px-5 py-3 font-medium">Open</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.name} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-base font-bold ${job.accent}`}>
                        {job.name.charAt(0)}
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
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(job.status)}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm font-medium text-slate-700">{job.deadline}</td>
                  <td className="px-5 py-3 text-sm font-medium text-slate-700">{job.submissions}</td>
                  <td className="px-5 py-3">
                    <a
                      href="/report-details"
                      className="inline-flex items-center rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Open
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DeveloperShell>
  );
}

export function SquashDeveloperSubmissionsPage() {
  const { session } = useAuth();
  const [applications, setApplications] = useState<DeveloperApplication[]>([]);
  const [submittedReports, setSubmittedReports] = useState<DeveloperSubmissionReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.userId || session.source !== 'supabase' || !session.roles.includes('developer')) return;

    let mounted = true;
    setLoading(true);
    setError('');

    Promise.all([getDeveloperApplications(session.userId), getDeveloperSubmittedReports(session.userId)])
      .then(([applicationItems, reportItems]) => {
        if (!mounted) return;
        setApplications(applicationItems);
        setSubmittedReports(reportItems);
      })
      .catch((loadError: Error) => {
        if (mounted) setError(loadError.message || 'Could not load tester applications right now.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [session?.source, session?.userId, session?.roles]);

  const pendingCount = applications.filter((item) => item.status === 'pending').length;
  const reviewCount = submittedReports.filter((item) => item.status === 'submitted').length;
  const approvedCount = submittedReports.filter((item) => item.status === 'approved').length;

  const latestApplications = useMemo(
    () => applications.slice().sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [applications],
  );


  const latestReports = useMemo(
    () => submittedReports.slice().sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [submittedReports],
  );

  const handleReportReview = async (report: DeveloperSubmissionReview, status: 'approved' | 'changes_requested' | 'rejected') => {
    setUpdatingId(report.id);
    setError('');
    setActionMessage('');

    try {
      const updated = await reviewSubmittedReport({
        submissionId: report.id,
        assignmentId: report.assignmentId,
        status,
      });
      setSubmittedReports((current) =>
        current.map((item) => (item.id === report.id ? { ...item, status: updated.status } : item)),
      );
      setActionMessage(
        status === 'approved'
          ? `${report.testerName}'s report for ${report.jobTitle} was approved.`
          : status === 'changes_requested'
            ? `Changes requested from ${report.testerName} for ${report.jobTitle}.`
            : `${report.testerName}'s report for ${report.jobTitle} was rejected.`,
      );
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Could not update this report right now.');
    } finally {
      setUpdatingId(null);
    }
  };

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
          ? `${application.testerName} has been accepted for ${application.jobTitle}. An active test assignment was created.`
          : `${application.testerName} was rejected for ${application.jobTitle}.`,
      );
    } catch (reviewError) {
      const message = reviewError instanceof Error ? reviewError.message : 'Could not update this application.';
      setError(message);
    } finally {
      setUpdatingId(null);
    }
  };

  const getApplicationStatusClasses = (status: DeveloperApplication['status']) => {
    if (status === 'accepted') return 'border-green-200 bg-green-50 text-green-700';
    if (status === 'rejected') return 'border-red-200 bg-red-50 text-red-600';
    if (status === 'withdrawn') return 'border-slate-200 bg-slate-50 text-slate-600';
    return 'border-amber-200 bg-amber-50 text-amber-700';
  };

  return (
    <DeveloperShell
      title="Tester Applications"
      subtitle="Review testers who applied to your jobs and move approved testers into active assignments."
      active="reports"
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-3">
          {[
            { label: 'Applications', value: pendingCount, color: 'bg-amber-50 text-amber-700', icon: UserCircle2 },
            { label: 'Reports to Review', value: reviewCount, color: 'bg-sky-50 text-sky-700', icon: FileText },
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

        {actionMessage ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
            {actionMessage}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
            {error.toLowerCase().includes('permission') ? (
              <span className="block pt-1 text-xs font-medium text-red-600">
                Run supabase/phase4_developer_applicant_review.sql in Supabase so developers can read applicants for their own jobs.
              </span>
            ) : null}
          </div>
        ) : null}

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Submitted Reports</h2>
              <p className="mt-1 text-sm text-slate-500">Review completed tester submissions and decide what happens next.</p>
            </div>
            <a href={latestReports[0] ? `/report-details?submission=${latestReports[0].id}` : "/report-details"} className="inline-flex w-fit rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Open report details
            </a>
          </div>

          {loading ? (
            <div className="p-6 text-sm font-semibold text-slate-500">Loading submitted reports...</div>
          ) : latestReports.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {latestReports.map((report) => {
                const category = getCategoryById(report.jobCategory as TestCategoryId);
                const CategoryIcon = category.icon;
                const isUpdating = updatingId === report.id;
                const statusClass =
                  report.status === 'approved'
                    ? 'bg-green-50 text-green-700 ring-green-100'
                    : report.status === 'rejected'
                      ? 'bg-red-50 text-red-600 ring-red-100'
                      : report.status === 'changes_requested'
                        ? 'bg-amber-50 text-amber-700 ring-amber-100'
                        : 'bg-sky-50 text-sky-700 ring-sky-100';

                return (
                  <div key={report.id} className="p-5">
                    <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr_auto] xl:items-start">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-600 text-sm font-black text-white">
                            {report.testerName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{report.jobTitle}</div>
                            <div className="mt-1 text-sm text-slate-500">Submitted by {report.testerName}</div>
                          </div>
                        </div>
                        <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
                          {report.summary || 'Tester submitted this report without a written summary.'}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <TesterBadge testsCompleted={report.testerTestsCompleted} rating={report.testerRating} />
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {report.bugCount} bug report{report.bugCount === 1 ? '' : 's'}
                          </span>
                          {report.videoBugCount > 0 ? (
                            <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                              {report.videoBugCount} video
                            </span>
                          ) : null}
                          {report.criticalBugCount > 0 ? (
                            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                              {report.criticalBugCount} critical
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                            <CategoryIcon className="h-3.5 w-3.5" style={{ color: category.color }} />
                            {category.name}
                          </span>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ring-1 ${statusClass}`}>
                            {report.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-600">
                          <div><span className="font-semibold text-slate-900">Usability</span><br />{report.scores.usability}/100</div>
                          <div><span className="font-semibold text-slate-900">Performance</span><br />{report.scores.performance}/100</div>
                          <div><span className="font-semibold text-slate-900">Onboarding</span><br />{report.scores.onboarding}/100</div>
                          <div><span className="font-semibold text-slate-900">Compatibility</span><br />{report.scores.deviceCompatibility}/100</div>
                        </div>
                        <div className="mt-3 text-xs text-slate-500">
                          Submitted {new Date(report.submittedAt || report.createdAt).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row xl:flex-col">
                        {report.status === 'submitted' ? (
                          <>
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleReportReview(report, 'approved')}
                              className="inline-flex justify-center rounded-2xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                            >
                              {isUpdating ? 'Saving...' : 'Approve'}
                            </button>
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleReportReview(report, 'changes_requested')}
                              className="inline-flex justify-center rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-60"
                            >
                              Request changes
                            </button>
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleReportReview(report, 'rejected')}
                              className="inline-flex justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                            >
                              Reject
                            </button>
                            <a href={`/report-details?submission=${report.id}`} className="inline-flex justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                              View details
                            </a>
                          </>
                        ) : (
                          <a href={`/report-details?submission=${report.id}`} className="inline-flex justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                            View details
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6">
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                <div className="text-lg font-bold text-slate-900">No submitted reports yet</div>
                <p className="mt-2 text-sm text-slate-600">When accepted testers submit their test, reports will appear here.</p>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Applicants Waiting For You</h2>
              <p className="mt-1 text-sm text-slate-500">Accepting an applicant creates their active test assignment.</p>
            </div>
            <a href="/post-job" className="inline-flex w-fit rounded-2xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
              Post another job
            </a>
          </div>

          {loading ? (
            <div className="p-6 text-sm font-semibold text-slate-500">Loading tester applications...</div>
          ) : latestApplications.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {latestApplications.map((application) => {
                const category = getCategoryById(application.jobCategory as TestCategoryId);
                const CategoryIcon = category.icon;
                const specializationLabels = application.testerSpecializations.slice(0, 3).map(getSpecializationLabel);
                const isUpdating = updatingId === application.id;

                return (
                  <div key={application.id} className="p-5">
                    <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr_auto] xl:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
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
                            {application.testerRating.toFixed(1)} stars
                          </span>
                          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                            {application.testerTestsCompleted} tests
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
                        <div className="text-sm font-semibold text-slate-500">Applied for</div>
                        <div className="mt-1 font-bold text-slate-900">{application.jobTitle}</div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                            <CategoryIcon className="h-3.5 w-3.5" style={{ color: category.color }} />
                            {category.name}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                            {application.jobPlatform}
                          </span>
                        </div>
                        <div className="mt-3 text-xs text-slate-500">
                          Applied {new Date(application.createdAt).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row xl:flex-col xl:items-stretch">
                        <span className={`inline-flex justify-center rounded-full border px-3 py-1.5 text-xs font-bold capitalize ${getApplicationStatusClasses(application.status)}`}>
                          {application.status.replace('_', ' ')}
                        </span>
                        {application.status === 'pending' ? (
                          <>
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleReview(application, 'accepted')}
                              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              {isUpdating ? 'Saving...' : 'Accept'}
                            </button>
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleReview(application, 'rejected')}
                              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <XCircle className="h-4 w-4" />
                              Reject
                            </button>
                          </>
                        ) : (
                          <a href="/report-details" className="inline-flex justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                            View details
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6">
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                <div className="text-lg font-bold text-slate-900">No real applications yet</div>
                <p className="mt-2 text-sm text-slate-600">
                  When testers click Apply Now on your live jobs, they will appear here for review.
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-xl font-bold text-slate-900">Report Submissions</h2>
            <p className="mt-1 text-sm text-slate-500">Submitted tester reports will appear here as your jobs progress.</p>
          </div>
          <div className="space-y-3 p-4">
            {submissions.map((item) => (
              <div
                key={`${item.app}-${item.tester}-${item.time}`}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900">{item.app}</div>
                  <div className="text-sm text-slate-500">Submitted by {item.tester}</div>
                  <div className="mt-1 text-xs text-slate-400">{item.time}</div>
                  <div className="mt-2">
                    <TesterBadge testsCompleted={item.testsCompleted} rating={item.rating} />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {item.videoDuration ? (
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                      Screen Recording - {item.videoDuration}
                    </span>
                  ) : null}
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getSeverityClasses(item.severity)}`}>
                    {item.severity}
                  </span>
                  <a
                    href="/report-details"
                    className="inline-flex items-center rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Open report
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DeveloperShell>
  );
}

export function SquashDeveloperActivityPage() {
  const { session } = useAuth();
  const userId = session?.userId || '';
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; body: string; type: string; linkPath: string; status: string; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    import('./lib/notificationApi').then(({ getUserNotifications, backfillDeveloperNotifications }) => {
      backfillDeveloperNotifications(userId)
        .then(() => getUserNotifications(userId))
        .then((list) => { setNotifications(list); setLoading(false); })
        .catch(() => setLoading(false));
    });
  }, [userId]);

  function colorForType(type: string) {
    if (type === 'report') return 'bg-amber-100 text-amber-600';
    if (type === 'application') return 'bg-green-100 text-green-600';
    if (type === 'payout') return 'bg-sky-100 text-sky-600';
    if (type === 'security') return 'bg-red-100 text-red-500';
    return 'bg-violet-100 text-violet-600';
  }

  function formatRelativeTime(dateStr: string) {
    try {
      const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
      if (diff < 60) return 'Just now';
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      if (diff < 172800) return 'Yesterday';
      return `${Math.floor(diff / 86400)} days ago`;
    } catch { return 'Recently'; }
  }

  return (
    <DeveloperShell
      title="All Activity"
      subtitle="Timeline of actions and updates from your workspace."
      active="reports"
    >
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        {loading ? (
          <div className="py-10 text-center text-sm font-semibold text-slate-500">Loading activity...</div>
        ) : notifications.length === 0 ? (
          <div className="py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-50 ring-1 ring-slate-100">
              <Activity className="h-6 w-6 text-slate-400" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-500">No activity yet.</p>
            <p className="mt-1 text-xs text-slate-400">Actions like applications and report submissions will show up here.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {notifications.map((item, index) => (
              <a key={item.id} href={item.linkPath} className="flex gap-4 group cursor-pointer">
                <div className="flex flex-col items-center">
                  <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${colorForType(item.type)}`}>
                    <Activity className="h-4 w-4" />
                  </div>
                  {index !== notifications.length - 1 ? <div className="mt-2 h-full w-px bg-slate-200" /> : null}
                </div>
                <div className="pb-2">
                  <div className="font-semibold text-slate-800 group-hover:text-green-700 transition">{item.title}</div>
                  <div className="text-sm text-slate-600 mt-0.5">{item.body}</div>
                  <div className="mt-1 text-xs text-slate-400">{formatRelativeTime(item.createdAt)}</div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </DeveloperShell>
  );
}


export function SquashReportAttachmentsPage() {
  return (
    <DeveloperShell
      title="All Attachments"
      subtitle="Files uploaded for this report and related updates."
      active="reports"
    >
      <div className="space-y-4">
        {attachments.map((file) => (
          <div key={file.name} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xs font-bold ${file.accent}`}>
                  {file.icon}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-semibold text-slate-900">{file.name}</div>
                  <div className="text-sm text-slate-500">{file.meta}</div>
                </div>
              </div>
              <a
                href={`data:text/plain;charset=utf-8,${encodeURIComponent(file.name)}`}
                download={file.name}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Download className="h-4 w-4" />
                Download
              </a>
            </div>
            {file.meta.includes('MP4') ? (
              <div className="mt-3">
                <div className="mb-2 text-xs font-semibold text-slate-600">
                  Screen Recording — 00:41
                </div>
                <video
                  controls
                  className="w-full rounded-xl border border-slate-200 bg-black"
                  src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
                />
              </div>
            ) : null}
          </div>
        ))}

        <a
          href="/report-details"
          className="mt-4 inline-flex items-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Back to report details
        </a>
      </div>
    </DeveloperShell>
  );
}



