import {
  AlertCircle,
  BadgeCheck,
  BriefcaseBusiness,
  Camera,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  FileText,
  Home,
  Menu,
  MessageSquare,
  Search,
  Settings,
  Star,
  UserCircle2,
  Video,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import TesterHeaderNav from './components/TesterHeaderNav';
import MobileTabBar from './components/MobileTabBar';
import TesterMobileDrawer from './components/TesterMobileDrawer';
import { useAuth } from './auth';
import { getTesterReportSubmissions, type TesterReportSubmission } from './lib/jobApi';

type ReportStatus = 'Pending Review' | 'Approved' | 'Changes Requested' | 'Under Review' | 'Rejected';


function formatRands(value: number) {
  return `R${Math.round(value).toLocaleString('en-ZA')}`;
}

function formatDate(value: string | null) {
  if (!value) return 'Not submitted yet';
  return new Intl.DateTimeFormat('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

function toReportStatus(status: TesterReportSubmission['status']): ReportStatus {
  if (status === 'approved') return 'Approved';
  if (status === 'changes_requested') return 'Changes Requested';
  if (status === 'rejected') return 'Rejected';
  if (status === 'draft') return 'Under Review';
  return 'Pending Review';
}

const emptyReports: TesterReportSubmission[] = [];

export default function SquashTesterReportsPage() {
  const { session } = useAuth();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [realReports, setRealReports] = useState<TesterReportSubmission[]>(emptyReports);
  const [reportsError, setReportsError] = useState('');
  const [loadingReports, setLoadingReports] = useState(true);

  useEffect(() => {
    if (!session?.userId || false) return;

    let mounted = true;
    setReportsError('');

    getTesterReportSubmissions(session.userId)
      .then((items) => {
        if (mounted) setRealReports(items);
      })
      .catch((error: Error) => {
        if (mounted) setReportsError(error.message || 'Could not load your reports right now.');
      })
      .finally(() => {
        if (mounted) setLoadingReports(false);
      });

    return () => {
      mounted = false;
    };
  }, [("supabase"), session?.userId]);

  const navItems = [
    { label: 'Dashboard', icon: Home, href: '/tester/dashboard' },
    { label: 'Available Jobs', icon: BriefcaseBusiness, href: '/tester-jobs' },
    { label: 'My Tests', icon: ClipboardList, href: '/active-test' },
    { label: 'Reports', icon: ClipboardList, href: '/tester/reports', active: true },
    { label: 'Earnings', icon: CircleDollarSign, href: '/tester/earnings' },
    { label: 'Profile', icon: UserCircle2, href: '/tester/profile' },
    { label: 'Settings', icon: Settings, href: '/tester/settings' },
  ];

  const reports = useMemo(
    () =>
      realReports.map((report, index) => ({
        title: report.summary?.split('.')[0]?.slice(0, 42) || 'Submitted test report',
        id: `Report #${String(index + 1).padStart(4, '0')}`,
        app: report.jobTitle,
        platform: report.jobPlatform,
        submitted: formatDate(report.submittedAt || report.createdAt),
        status: toReportStatus(report.status),
        earnings: report.status === 'approved' ? `${formatRands(report.amountZar)} Approved` : formatRands(report.amountZar),
        hasVideo: report.videoBugCount > 0,
        bugCount: report.bugCount,
      })),
    [realReports],
  );

  const summaryCards = [
    { title: 'Submitted', value: String(realReports.length), note: 'Total reports', icon: FileText, color: 'text-green-700', bg: 'bg-green-50' },
    {
      title: 'Approved',
      value: String(realReports.filter((report) => report.status === 'approved').length),
      note: 'Payment released',
      icon: BadgeCheck,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Pending',
      value: String(realReports.filter((report) => report.status === 'submitted' || report.status === 'draft').length),
      note: 'Awaiting review',
      icon: Clock3,
      color: 'text-amber-700',
      bg: 'bg-amber-50',
    },
    {
      title: 'Changes',
      value: String(realReports.filter((report) => report.status === 'changes_requested').length),
      note: 'Need attention',
      icon: AlertCircle,
      color: 'text-sky-700',
      bg: 'bg-sky-50',
    },
  ];

  const requestedChanges = realReports
    .filter((report) => report.status === 'changes_requested')
    .map((report) => ({
      title: report.summary?.split('.')[0]?.slice(0, 36) || 'Report needs updates',
      app: report.jobTitle,
      comment: 'Developer requested more detail. Add clearer steps, evidence, or a short video before resubmitting.',
      due: 'Action needed',
    }));

  const statusClass = (status: ReportStatus) => {
    if (status === 'Approved') return 'bg-green-50 text-green-700 border-green-200';
    if (status === 'Pending Review') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (status === 'Changes Requested') return 'bg-sky-50 text-sky-700 border-sky-200';
    if (status === 'Rejected') return 'bg-red-50 text-red-600 border-red-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  if (true && loadingReports) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f7] px-4 text-center text-xs font-bold text-slate-500">
        Loading reports...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-slate-900 selection:bg-green-100">
      <TesterMobileDrawer isOpen={isMobileDrawerOpen} onClose={() => setIsMobileDrawerOpen(false)} />

      <div className="grid min-h-screen lg:grid-cols-[270px_1fr]">
        {/* Apple Translucent Left Sidebar */}
        <aside className="hidden border-r border-slate-200/60 bg-white/70 backdrop-blur-xl lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto">
          <div className="flex items-center gap-3 border-b border-slate-200/50 px-6 py-5">
            <img
              src="/squash-logo.png"
              alt="SQUASH logo"
              className="h-10 w-10 rounded-2xl border border-white/60 object-cover shadow-sm"
            />
            <a href="/" className="text-xl font-bold tracking-tight text-slate-900 hover:text-green-700">
              SQUASH
            </a>
          </div>

          <nav className="flex-1 space-y-1.5 px-4 py-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  to={item.href}
                  key={item.label}
                  className={`flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 apple-press-effect ${
                    item.active
                      ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                      : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 ${item.active ? 'text-white' : 'text-slate-500'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 pt-0">
            <div className="apple-bento-card p-5">
              <div className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Star className="h-4.5 w-4.5 text-amber-500" />
                Quality Score
              </div>
              <div className="mt-2 text-2xl font-extrabold text-slate-900">96%</div>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600 font-medium">
                Clear reports and fast revisions improve your tester ranking.
              </p>
            </div>
          </div>
        </aside>

        {/* Main Reports Content */}
        <main className="min-w-0 pb-24 lg:pb-12">
          {/* Apple Translucent Top Header */}
          <header className="sticky top-0 z-20 border-b border-slate-200/50 bg-white/75 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(true)}
                  className="rounded-2xl border border-slate-200 bg-white/80 p-2 text-slate-700 lg:hidden hover:bg-slate-100 transition apple-press-effect"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="hidden max-w-xl flex-1 items-center gap-2.5 rounded-full border border-slate-200/80 bg-slate-100/60 px-4 py-2 md:flex md:min-w-[320px] lg:min-w-[420px] focus-within:bg-white focus-within:ring-2 focus-within:ring-slate-900/10 transition-all">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    className="w-full bg-transparent text-xs font-medium outline-none placeholder:text-slate-400 text-slate-900"
                    placeholder="Search reports, apps, status..."
                  />
                </div>
              </div>

              <TesterHeaderNav />
            </div>
          </header>

          <div className="px-4 py-5 sm:px-6 lg:px-8 lg:py-8 space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between animate-fade-up">
              <div>
                <span className="inline-flex rounded-full bg-green-100/80 px-3.5 py-1 text-xs font-extrabold text-green-800">
                  Tester Reports
                </span>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">Reports & Submissions</h1>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm font-medium">
                  Track bug reports, requested changes, approvals, and evidence files.
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <a
                  href="/active-test"
                  className="rounded-full bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-slate-900/10 hover:bg-slate-800 transition apple-press-effect"
                >
                  Continue Test
                </a>
                <a
                  href="/tester-jobs"
                  className="rounded-full border border-slate-200/80 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition apple-press-effect"
                >
                  Find Tests
                </a>
              </div>
            </div>

            {/* Summary Cards */}
            <section className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4 animate-fade-up-delayed">
              {summaryCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.title} className="apple-bento-card p-5 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs font-bold text-slate-500">{card.title}</div>
                        <div className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">{card.value}</div>
                        <div className="mt-1.5 text-xs font-medium text-slate-400">{card.note}</div>
                      </div>
                      <div className={`grid h-10 w-10 place-items-center rounded-2xl ${card.bg}`}>
                        <Icon className={`h-4.5 w-4.5 ${card.color}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>

            {/* Reports List */}
            <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
              <div className="apple-bento-card overflow-hidden">
                <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">My Reports</h2>
                    <p className="mt-0.5 text-xs font-medium text-slate-500">Latest submissions and approval status.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button className="rounded-full border border-slate-200/80 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition apple-press-effect">
                      All Status <ChevronDown className="inline h-3.5 w-3.5" />
                    </button>
                    <button className="rounded-full border border-slate-200/80 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition apple-press-effect">
                      Latest First
                    </button>
                  </div>
                </div>

                {/* Mobile Cards List */}
                <div className="divide-y divide-slate-100 md:hidden">
                  {loadingReports ? (
                    <div className="px-5 py-8 text-center text-xs font-semibold text-slate-500">
                      Loading your real submissions...
                    </div>
                  ) : null}
                  {reportsError ? (
                    <div className="px-5 py-8 text-center text-xs font-semibold text-red-600">
                      {reportsError}
                    </div>
                  ) : null}
                  {!loadingReports && !reportsError && reports.length === 0 ? (
                    <div className="px-5 py-8 text-center text-xs leading-6 text-slate-500">
                      You have not submitted any reports yet.
                    </div>
                  ) : null}
                  {reports.map((report) => (
                    <div key={report.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{report.title}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{report.id} • {report.app} ({report.platform})</div>
                        </div>
                        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold ${statusClass(report.status)}`}>
                          {report.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1 text-xs">
                        <div className="flex flex-wrap gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
                            <Camera className="h-3 w-3" />
                            {report.bugCount > 0 ? `${report.bugCount} bugs` : 'Report'}
                          </span>
                          {report.hasVideo ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-bold text-red-600">
                              <Video className="h-3 w-3" />
                              Video
                            </span>
                          ) : null}
                        </div>
                        <span className="font-extrabold text-slate-900">{report.earnings}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <th className="px-5 py-3.5">Report</th>
                        <th className="px-5 py-3.5">App</th>
                        <th className="px-5 py-3.5">Evidence</th>
                        <th className="px-5 py-3.5">Status</th>
                        <th className="px-5 py-3.5">Earnings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loadingReports ? (
                        <tr>
                          <td colSpan={5} className="px-5 py-8 text-center text-xs font-semibold text-slate-500">
                            Loading your real submissions...
                          </td>
                        </tr>
                      ) : null}
                      {reportsError ? (
                        <tr>
                          <td colSpan={5} className="px-5 py-8 text-center text-xs font-semibold text-red-600">
                            {reportsError}
                          </td>
                        </tr>
                      ) : null}
                      {!loadingReports && !reportsError && reports.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-5 py-8 text-center text-xs text-slate-500">
                            You have not submitted any reports yet. Once you complete an accepted test, your submission history will appear here.
                          </td>
                        </tr>
                      ) : null}
                      {reports.map((report) => (
                        <tr key={report.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-5 py-4">
                            <div className="text-xs font-bold text-slate-900">{report.title}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{report.id}</div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="text-xs font-bold text-slate-900">{report.app}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{report.platform}</div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-1.5">
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
                                <Camera className="h-3 w-3" />
                                {report.bugCount > 0 ? `${report.bugCount} bugs` : 'Report'}
                              </span>
                              {report.hasVideo ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-bold text-red-600">
                                  <Video className="h-3 w-3" />
                                  Video
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold ${statusClass(report.status)}`}>
                              {report.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-xs font-extrabold text-slate-900">{report.earnings}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-6">
                <div className="apple-bento-card p-6">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-sky-600" />
                    <h2 className="text-base font-bold text-slate-900">Changes Requested</h2>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 font-medium">
                    Update these reports quickly to keep your approval rate high.
                  </p>
                  <div className="mt-4 space-y-3">
                    {requestedChanges.map((item) => (
                      <div key={`${item.app}-${item.title}`} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-xs font-bold text-slate-900">{item.title}</div>
                            <div className="mt-0.5 text-[11px] text-slate-400 font-medium">{item.app}</div>
                          </div>
                          <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-[10px] font-extrabold text-sky-700">
                            {item.due}
                          </span>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-slate-600 font-medium">{item.comment}</p>
                        <a href="/active-test" className="mt-3 block text-xs font-bold text-slate-900 hover:underline">
                          Update Report →
                        </a>
                      </div>
                    ))}
                    {requestedChanges.length === 0 ? (
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-xs text-slate-500 font-medium">
                        Nothing needs changes right now. Clean slate!
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="apple-bento-card p-6">
                  <h2 className="text-base font-bold text-slate-900">Report Quality</h2>
                  <div className="mt-4 space-y-3.5">
                    {[
                      { label: 'Clear reproduction steps', value: '96%' },
                      { label: 'Helpful evidence attached', value: '88%' },
                      { label: 'Revision speed', value: '92%' },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-700">{item.label}</span>
                          <span className="text-slate-500 font-bold">{item.value}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full bg-green-500 transition-all duration-500" style={{ width: item.value }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="apple-bento-card p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3.5">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Better reports earn faster approvals</h2>
                    <p className="mt-0.5 text-xs text-slate-500 font-medium">
                      Include steps, expected result, actual result, screenshots, and video evidence where useful.
                    </p>
                  </div>
                </div>
                <a
                  href="/guides"
                  className="rounded-full border border-slate-200/80 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition apple-press-effect shrink-0 text-center"
                >
                  View Reporting Guide →
                </a>
              </div>
            </section>
          </div>
        </main>
      </div>
      <MobileTabBar role="tester" />
      <TesterMobileDrawer isOpen={isMobileDrawerOpen} onClose={() => setIsMobileDrawerOpen(false)} activePath="/tester/reports" />
    </div>
  );
}

