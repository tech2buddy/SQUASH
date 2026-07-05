import {
  AlertCircle,
  BadgeCheck,
  Bell,
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
import { useAuth } from './auth';

type ReportStatus = 'Pending Review' | 'Approved' | 'Changes Requested' | 'Under Review';

export default function SquashTesterReportsPage() {
  const { session } = useAuth();
  const testerName = session?.name || 'Thando M.';

  const navItems = [
    { label: 'Dashboard', icon: Home, href: '/tester/dashboard' },
    { label: 'Available Jobs', icon: BriefcaseBusiness, href: '/tester-jobs' },
    { label: 'My Tests', icon: ClipboardList, href: '/active-test' },
    { label: 'Reports', icon: ClipboardList, href: '/tester/reports', active: true },
    { label: 'Earnings', icon: CircleDollarSign, href: '/tester/earnings' },
    { label: 'Profile', icon: UserCircle2, href: '/tester/profile' },
    { label: 'Settings', icon: Settings, href: '/tester/settings' },
  ];

  const summaryCards = [
    { title: 'Submitted', value: '36', note: 'Total reports', icon: FileText, color: 'text-green-700', bg: 'bg-green-50' },
    { title: 'Approved', value: '22', note: 'Payment released', icon: BadgeCheck, color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { title: 'Pending', value: '8', note: 'Awaiting review', icon: Clock3, color: 'text-amber-700', bg: 'bg-amber-50' },
    { title: 'Changes', value: '3', note: 'Need attention', icon: AlertCircle, color: 'text-sky-700', bg: 'bg-sky-50' },
  ];

  const reports: Array<{
    title: string;
    id: string;
    app: string;
    platform: string;
    submitted: string;
    status: ReportStatus;
    earnings: string;
    hasVideo: boolean;
  }> = [
    {
      title: 'Login & Authentication',
      id: 'Report #1248',
      app: 'FitTrack Mobile App',
      platform: 'Android',
      submitted: '20 May 2025',
      status: 'Pending Review',
      earnings: 'R250',
      hasVideo: true,
    },
    {
      title: 'Workout Tracking',
      id: 'Report #1245',
      app: 'FitTrack Mobile App',
      platform: 'Android',
      submitted: '18 May 2025',
      status: 'Approved',
      earnings: 'R250 Paid',
      hasVideo: false,
    },
    {
      title: 'Profile & Settings',
      id: 'Report #1240',
      app: 'FitTrack Mobile App',
      platform: 'iOS',
      submitted: '16 May 2025',
      status: 'Changes Requested',
      earnings: 'R250',
      hasVideo: true,
    },
    {
      title: 'Onboarding Flow',
      id: 'Report #1235',
      app: 'HealthHub Web',
      platform: 'Website',
      submitted: '14 May 2025',
      status: 'Approved',
      earnings: 'R200 Paid',
      hasVideo: false,
    },
  ];

  const requestedChanges = [
    {
      title: 'Profile & Settings',
      app: 'FitTrack Mobile App',
      comment: 'Please add the exact steps before the crash and attach the settings screenshot.',
      due: 'Due today',
    },
    {
      title: 'Checkout Validation',
      app: 'ShopEase iOS',
      comment: 'Developer asked for a shorter screen recording showing only the payment step.',
      due: 'Due tomorrow',
    },
  ];

  const statusClass = (status: ReportStatus) => {
    if (status === 'Approved') return 'bg-green-50 text-green-700 border-green-200';
    if (status === 'Pending Review') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (status === 'Changes Requested') return 'bg-sky-50 text-sky-700 border-sky-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

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
                  href={item.href}
                  key={item.label}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    item.active ? 'bg-green-50 text-green-700' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </a>
              );
            })}
          </nav>

          <div className="p-4 pt-0">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <Star className="h-5 w-5 text-amber-500" />
                Quality Score
              </div>
              <div className="mt-3 text-3xl font-black text-slate-900">96%</div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Clear reports and fast revisions improve your tester ranking.
              </p>
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4">
                <a href="/tester/menu" className="rounded-xl border border-slate-300 p-2.5 text-slate-600 lg:hidden">
                  <Menu className="h-5 w-5" />
                </a>
                <div className="hidden max-w-xl flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:flex md:min-w-[340px] lg:min-w-[460px]">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    placeholder="Search reports, apps, status..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-4">
                <a href="/tester/notifications" className="relative rounded-full border border-slate-200 p-2.5 text-slate-600">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    2
                  </span>
                </a>
                <a href="/tester/profile" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700">
                    {testerName.charAt(0)}
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-sm font-bold text-slate-900">{testerName}</div>
                    <div className="text-xs text-slate-500">Tester</div>
                  </div>
                </a>
              </div>
            </div>
          </header>

          <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 ring-1 ring-green-100">
                  Tester reports
                </div>
                <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">Reports & submissions</h1>
                <p className="mt-2 text-slate-600">
                  Track bug reports, requested changes, approvals, and evidence files.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href="/active-test"
                  className="rounded-2xl bg-green-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-green-700"
                >
                  Continue Test
                </a>
                <a
                  href="/tester-jobs"
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Find Tests
                </a>
              </div>
            </div>

            <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-slate-600">{card.title}</div>
                        <div className="mt-2 text-3xl font-black text-slate-900">{card.value}</div>
                        <div className="mt-2 text-sm text-slate-500">{card.note}</div>
                      </div>
                      <div className={`grid h-11 w-11 place-items-center rounded-2xl ${card.bg}`}>
                        <Icon className={`h-5 w-5 ${card.color}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">My reports</h2>
                    <p className="mt-1 text-sm text-slate-600">Latest submissions and approval status.</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                      All Status <ChevronDown className="inline h-4 w-4" />
                    </button>
                    <button className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                      Latest First
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-sm text-slate-500">
                        <th className="px-6 py-4 font-medium">Report</th>
                        <th className="px-6 py-4 font-medium">App</th>
                        <th className="px-6 py-4 font-medium">Evidence</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                        <th className="px-6 py-4 font-medium">Earnings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((report) => (
                        <tr key={report.id} className="border-b border-slate-100 last:border-b-0">
                          <td className="px-6 py-5">
                            <div className="font-semibold text-slate-900">{report.title}</div>
                            <div className="text-sm text-slate-500">{report.id}</div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="font-semibold text-slate-900">{report.app}</div>
                            <div className="text-sm text-slate-500">{report.platform}</div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-wrap gap-2">
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                                <Camera className="h-3.5 w-3.5" />
                                Screenshot
                              </span>
                              {report.hasVideo ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 ring-1 ring-red-100">
                                  <Video className="h-3.5 w-3.5" />
                                  Video
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(report.status)}`}>
                              {report.status}
                            </span>
                          </td>
                          <td className="px-6 py-5 font-semibold text-slate-900">{report.earnings}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-3xl border border-sky-200 bg-sky-50 p-6 shadow-sm">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-6 w-6 text-sky-700" />
                    <h2 className="text-2xl font-bold text-slate-900">Changes requested</h2>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    Update these reports quickly to keep your approval rate high.
                  </p>
                  <div className="mt-5 space-y-4">
                    {requestedChanges.map((item) => (
                      <div key={`${item.app}-${item.title}`} className="rounded-2xl border border-sky-100 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-bold text-slate-900">{item.title}</div>
                            <div className="mt-1 text-sm text-slate-500">{item.app}</div>
                          </div>
                          <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                            {item.due}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-700">{item.comment}</p>
                        <a href="/active-test" className="mt-4 inline-flex text-sm font-semibold text-sky-700">
                          Update report
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-2xl font-bold text-slate-900">Report quality</h2>
                  <div className="mt-5 space-y-4">
                    {[
                      { label: 'Clear reproduction steps', value: '96%' },
                      { label: 'Helpful evidence attached', value: '88%' },
                      { label: 'Revision speed', value: '92%' },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="font-semibold text-slate-700">{item.label}</span>
                          <span className="text-slate-500">{item.value}</span>
                        </div>
                        <div className="h-3 rounded-full bg-slate-100">
                          <div className="h-3 rounded-full bg-green-600" style={{ width: item.value }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-3xl border border-green-100 bg-green-50 p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xl font-bold text-slate-900">
                    <CheckCircle2 className="h-6 w-6 text-green-700" />
                    Better reports earn faster approvals
                  </div>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
                    Include steps, expected result, actual result, screenshots, and video evidence where useful.
                  </p>
                </div>
                <a
                  href="/guides"
                  className="inline-flex justify-center rounded-2xl border border-green-200 bg-white px-5 py-3 font-semibold text-green-700 hover:bg-green-50"
                >
                  View reporting guide
                </a>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

