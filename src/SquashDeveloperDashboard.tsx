import {
  AlertTriangle,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  FileText,
  Home,
  Info,
  LifeBuoy,
  Menu,
  MessageSquareText,
  MoreHorizontal,
  Search,
  Settings,
  Sparkles,
  Star,
  TrendingUp,
  UserCircle2,
  Users,
} from 'lucide-react';

export default function SquashDeveloperDashboard() {
  const stats = [
    {
      title: 'Active Jobs',
      value: '12',
      note: '2 in progress',
      trend: '+8%',
      icon: BriefcaseBusiness,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      title: 'Total Testers',
      value: '245',
      note: '18 this week',
      trend: '+12%',
      icon: Users,
      iconBg: 'bg-sky-50',
      iconColor: 'text-sky-600',
    },
    {
      title: 'Avg Rating',
      value: '4.6',
      note: 'From 124 reports',
      trend: '+0.4',
      icon: Star,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-500',
    },
    {
      title: 'Total Spent',
      value: 'R78,450',
      note: 'This month',
      trend: '+15%',
      icon: CircleDollarSign,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
  ];

  const jobs = [
    {
      name: 'PayFlow Web App',
      type: 'Web Application',
      testers: '24 / 30',
      status: 'In Progress',
      deadline: '28 May 2024',
      deadlineNote: '3 days left',
      submissions: '12 / 24',
      accent: 'bg-slate-900 text-white',
    },
    {
      name: 'FitTrack Mobile',
      type: 'Mobile App',
      testers: '18 / 20',
      status: 'In Progress',
      deadline: '25 May 2024',
      deadlineNote: 'Today',
      submissions: '8 / 18',
      accent: 'bg-slate-800 text-white',
    },
    {
      name: 'HealthApp iOS',
      type: 'iOS Application',
      testers: '30 / 30',
      status: 'Reviewing',
      deadline: '23 May 2024',
      deadlineNote: 'Overdue',
      submissions: '30 / 30',
      accent: 'bg-emerald-600 text-white',
    },
    {
      name: 'EduLearn Platform',
      type: 'Web Application',
      testers: '10 / 15',
      status: 'Open',
      deadline: '05 Jun 2024',
      deadlineNote: '9 days left',
      submissions: '0 / 10',
      accent: 'bg-violet-500 text-white',
    },
    {
      name: 'ShopEasy Android',
      type: 'Android App',
      testers: '5 / 20',
      status: 'Open',
      deadline: '10 Jun 2024',
      deadlineNote: '14 days left',
      submissions: '0 / 5',
      accent: 'bg-red-500 text-white',
    },
  ];

  const recentSubmissions = [
    { app: 'PayFlow Web App', tester: 'Thando M.', time: '2h ago', severity: 'Critical' },
    { app: 'FitTrack Mobile', tester: 'Sipho N.', time: '5h ago', severity: 'Medium' },
    { app: 'HealthApp iOS', tester: 'Lerato D.', time: '6h ago', severity: 'Low' },
    { app: 'PayFlow Web App', tester: 'John K.', time: '1d ago', severity: 'Critical' },
    { app: 'FitTrack Mobile', tester: 'Sarah W.', time: '1d ago', severity: 'Medium' },
  ];

  const activity = [
    { text: 'New job "EduLearn Platform" created', time: '2 hours ago', color: 'bg-green-100 text-green-600' },
    { text: 'Critical bug reported in PayFlow Web App', time: '3 hours ago', color: 'bg-red-100 text-red-500' },
    { text: 'Sipho N. submitted a report for FitTrack Mobile', time: '5 hours ago', color: 'bg-amber-100 text-amber-500' },
    { text: '30 reports completed for HealthApp iOS', time: 'Yesterday', color: 'bg-green-100 text-green-600' },
    { text: 'Payment of R12,450 processed', time: '2 days ago', color: 'bg-sky-100 text-sky-600' },
  ];

  const bugSummary = [
    { label: 'Critical', value: '45 (18%)', color: 'bg-red-500' },
    { label: 'Medium', value: '97 (40%)', color: 'bg-amber-400' },
    { label: 'Low', value: '68 (28%)', color: 'bg-green-500' },
    { label: 'Info', value: '35 (14%)', color: 'bg-slate-300' },
  ];

  const testerDemographics = [
    { label: '18-24 (Students)', value: 52, color: 'bg-green-500' },
    { label: '25-34 (Early Career)', value: 29, color: 'bg-emerald-400' },
    { label: '35+ (Senior Users)', value: 19, color: 'bg-sky-400' },
  ];
  const submissionTrendValues = [10, 16, 19, 23, 32, 38, 30];
  const submissionTrendLabels = ['20 May', '21 May', '22 May', '23 May', '24 May', '25 May', '26 May'];
  const trendMax = Math.max(...submissionTrendValues);
  const trendPoints = submissionTrendValues
    .map((value, index) => {
      const x = (index / (submissionTrendValues.length - 1)) * 100;
      const y = 100 - (value / trendMax) * 100;
      return `${x},${y}`;
    })
    .join(' ');
  const trendAreaPoints = `0,100 ${trendPoints} 100,100`;

  const navItems = [
    { label: 'Dashboard', icon: Home, href: '/dashboard', active: true },
    { label: 'My Jobs', icon: BriefcaseBusiness, href: '/dashboard' },
    { label: 'Post a Job', icon: ClipboardList, href: '/post-job' },
    { label: 'Reports', icon: FileText, href: '/report-details' },
    { label: 'Testers', icon: Users, href: '/tester-jobs' },
    { label: 'Billing', icon: CreditCard, href: '/pricing' },
    { label: 'Messages', icon: ClipboardList, href: '/report-details', badge: '2' },
    { label: 'Settings', icon: Settings, href: '/dashboard' },
  ];

  const getStatusClasses = (status: string) => {
    if (status === 'In Progress') return 'bg-green-100 text-green-700';
    if (status === 'Reviewing') return 'bg-amber-100 text-amber-700';
    return 'bg-slate-100 text-slate-700';
  };

  const getSeverityClasses = (severity: string) => {
    if (severity === 'Critical') return 'bg-red-50 text-red-600';
    if (severity === 'Medium') return 'bg-amber-50 text-amber-600';
    return 'bg-green-50 text-green-600';
  };

  const getActivityIcon = (text: string) => {
    if (text.includes('Critical')) return AlertTriangle;
    if (text.includes('Payment')) return CircleDollarSign;
    if (text.includes('submitted')) return MessageSquareText;
    if (text.includes('completed')) return CheckCircle2;
    return Clock3;
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
                  className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    item.active
                      ? 'bg-green-50 text-green-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  {item.badge ? (
                    <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-2 text-xs text-white">
                      {item.badge}
                    </span>
                  ) : null}
                </a>
              );
            })}
          </nav>

          <div className="border-t border-slate-200 p-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-lg font-bold text-slate-900">Quick Actions</div>
              <div className="mt-4 space-y-3">
                <a href="/post-job" className="block w-full rounded-2xl bg-green-600 px-4 py-3 text-center font-semibold text-white hover:bg-green-700">
                  Post a New Job
                </a>
                <a href="/tester-jobs" className="block w-full rounded-2xl border border-green-600 px-4 py-3 text-center font-semibold text-green-700 hover:bg-green-50">
                  Invite Testers
                </a>
              </div>
            </div>
          </div>

          <div className="p-4 pt-0">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <LifeBuoy className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Need Help?</div>
                  <div className="text-sm text-slate-500">Visit our Help Center for support.</div>
                </div>
              </div>
              <a href="/help-center" className="mt-4 inline-block text-sm font-semibold text-green-700">Go to Help Center -&gt;</a>
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button className="rounded-xl border border-slate-300 p-2.5 text-slate-600 lg:hidden">
                    <Menu className="h-5 w-5" />
                  </button>
                  <div className="hidden max-w-xl flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:flex md:min-w-[320px] lg:min-w-[420px]">
                    <Search className="h-4 w-4 text-slate-400" />
                    <input
                      className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                      placeholder="Search jobs, testers, reports..."
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4">
                  <button className="relative rounded-full border border-slate-200 p-2.5 text-slate-600">
                    <Bell className="h-5 w-5" />
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      3
                    </span>
                  </button>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <UserCircle2 className="h-7 w-7" />
                    </div>
                    <div className="hidden sm:block">
                      <div className="text-sm font-bold text-slate-900">Alex Developer</div>
                      <div className="text-xs text-slate-500">Developer</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 md:hidden">
                <div className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    placeholder="Search jobs, testers, reports..."
                  />
                </div>
              </div>
            </div>
          </header>

          <div className="px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Welcome back, Alex!</h1>
                <p className="mt-2 text-slate-600">Here&apos;s what&apos;s happening with your testing activity.</p>
              </div>
              <button className="w-fit rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                May 20 - May 28, 2024
              </button>
            </div>

            <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-2xl font-black text-slate-900 sm:text-3xl">{stat.value}</div>
                        <div className="mt-1 text-base font-semibold text-slate-800">{stat.title}</div>
                        <div className="mt-2 text-sm text-slate-500">{stat.note}</div>
                        <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                          <TrendingUp className="h-3.5 w-3.5" />
                          {stat.trend}
                        </div>
                      </div>
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ring-white ${stat.iconBg}`}>
                        <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>

            <section className="mt-6 grid gap-4 xl:grid-cols-[1.8fr_0.9fr]">
              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Active Jobs</h2>
                  </div>
                  <a href="/post-job" className="text-sm font-semibold text-green-700">View all jobs -&gt;</a>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-sm text-slate-500">
                        <th className="px-5 py-3 font-medium">App / Job</th>
                        <th className="px-5 py-3 font-medium">Testers</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                        <th className="px-5 py-3 font-medium">Deadline</th>
                        <th className="px-5 py-3 font-medium">Submissions</th>
                        <th className="px-5 py-3 font-medium">Actions</th>
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
                          <td className="px-5 py-3 text-sm font-medium text-slate-700">{job.testers}</td>
                          <td className="px-5 py-3">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(job.status)}`}>
                              {job.status}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <div className="text-sm font-medium text-slate-700">{job.deadline}</div>
                            <div className={`mt-1 text-xs ${job.deadlineNote === 'Overdue' || job.deadlineNote === 'Today' ? 'text-red-500' : 'text-slate-500'}`}>
                              {job.deadlineNote}
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
                            <a href="/report-details" className="block rounded-xl p-2 text-slate-500 hover:bg-slate-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <h2 className="text-xl font-bold text-slate-900">Recent Submissions</h2>
                  <a href="/report-details" className="text-sm font-semibold text-green-700">View all -&gt;</a>
                </div>
                <div className="space-y-1 p-3">
                  {recentSubmissions.map((submission) => (
                    <div key={`${submission.app}-${submission.tester}-${submission.time}`} className="flex items-center justify-between gap-3 rounded-2xl border border-transparent px-3 py-3 transition hover:border-slate-200 hover:bg-slate-50">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                            <UserCircle2 className="h-5 w-5" />
                          </div>
                          <div className="font-semibold text-slate-900">{submission.app}</div>
                        </div>
                        <div className="mt-1 text-sm text-slate-500">by {submission.tester}</div>
                        <div className="mt-1 text-xs text-slate-400">{submission.time}</div>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getSeverityClasses(submission.severity)}`}>
                        {submission.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="mt-6 grid gap-4 xl:grid-cols-[0.9fr_1.2fr_0.9fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-lg font-bold text-slate-900">Bug Summary (All Jobs)</div>
                <div className="mt-6 flex items-center justify-center">
                  <div className="relative flex h-40 w-40 items-center justify-center rounded-full bg-[conic-gradient(#ef4444_0_18%,#fbbf24_18%_58%,#22c55e_58%_86%,#cbd5e1_86%_100%)]">
                    <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white text-center shadow-inner">
                      <div className="text-2xl font-black text-slate-900">245</div>
                      <div className="text-xs text-slate-500">Total Bugs</div>
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
                    {testerDemographics.map((segment) => (
                      <div key={segment.label}>
                        <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                          <span>{segment.label}</span>
                          <span className="font-semibold text-slate-800">{segment.value}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-200">
                          <div className={`h-1.5 rounded-full ${segment.color}`} style={{ width: `${segment.value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold text-slate-900">Submissions Overview</div>
                  <button className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600">This Week</button>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-4">
                  <div className="h-40">
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

                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  {[
                    ['124', 'Received'],
                    ['18', 'In Review'],
                    ['96', 'Completed'],
                    ['4.6*', 'Avg Rating'],
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-2xl bg-slate-50 p-3 text-center">
                      <div className="text-xl font-black text-slate-900">{value}</div>
                      <div className="mt-1 text-sm text-slate-500">{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold text-slate-900">Activity Feed</div>
                  <a href="/report-details" className="text-sm font-semibold text-green-700">View all -&gt;</a>
                </div>

                <div className="mt-6 space-y-5">
                  {activity.map((item) => {
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
                  })}
                </div>
              </div>
            </section>

            <section className="mt-8 rounded-3xl border border-green-100 bg-green-50 p-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-3xl text-green-700 shadow-sm">
                    <Sparkles className="h-8 w-8" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">Need more testers for your project?</div>
                    <div className="mt-1 text-slate-600">Invite more skilled testers and get better coverage.</div>
                  </div>
                </div>
                <a href="/tester-jobs" className="w-fit rounded-2xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700">
                  Invite Testers
                </a>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

