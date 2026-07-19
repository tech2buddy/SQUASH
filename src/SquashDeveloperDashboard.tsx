import {
  AlertTriangle,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
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
  Star,
  TrendingUp,
  UserCircle2,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import RetestRequestModal, { type RetestSubmission } from './components/RetestRequestModal';
import SquashCertified from './components/SquashCertified';
import SquashScore from './components/SquashScore';
import { getCategoryById, type TestCategoryId } from './components/testCategories';
import { useAuth } from './auth';
import { getDeveloperApplications, getDeveloperDashboardSummary, getDeveloperJobs, type DeveloperApplication, type DeveloperDashboardSummary, type DeveloperJob } from './lib/jobApi';

type DashboardJob = {
  name: string;
  type: string;
  testers: string;
  status: 'In Progress' | 'Reviewing' | 'Open' | 'Completed';
  deadline: string;
  deadlineNote: string;
  submissions: string;
  accent: string;
  logoUrl?: string | null;
  categoryId: TestCategoryId;
  completed?: boolean;
  certifiedAt?: string;
  score?: {
    usability: number;
    performance: number;
    onboarding: number;
    bugSeverity: number;
    deviceCompatibility: number;
  };
  plan?: 'Starter' | 'Growth' | 'Pro';
};

export default function SquashDeveloperDashboard() {
  const { session } = useAuth();
  const developerName = session?.name || 'Alex Developer';
  const developerFirstName = developerName.split(' ')[0] || developerName;
  const [databaseJobs, setDatabaseJobs] = useState<DeveloperJob[]>([]);
  const [databaseApplications, setDatabaseApplications] = useState<DeveloperApplication[]>([]);
  const [dashboardSummary, setDashboardSummary] = useState<DeveloperDashboardSummary | null>(null);
  const [jobsError, setJobsError] = useState('');

  const hasLiveDashboard = session?.source === 'supabase' && dashboardSummary !== null;
  const formatRand = (amount: number) => `R${amount.toLocaleString('en-ZA')}`;

  const stats = [
    {
      title: 'Active Jobs',
      value: hasLiveDashboard ? String(dashboardSummary.activeJobs) : '12',
      note: hasLiveDashboard ? `${databaseJobs.length} total posted` : '2 in progress',
      trend: hasLiveDashboard ? `${dashboardSummary.pendingApplications} pending applicants` : '+8%',
      icon: BriefcaseBusiness,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      title: 'Total Testers',
      value: hasLiveDashboard ? String(dashboardSummary.uniqueTesters) : '245',
      note: hasLiveDashboard ? `${dashboardSummary.totalApplications} applications` : '18 this week',
      trend: hasLiveDashboard ? 'Real applicants' : '+12%',
      icon: Users,
      iconBg: 'bg-sky-50',
      iconColor: 'text-sky-600',
    },
    {
      title: 'Reports',
      value: hasLiveDashboard ? String(dashboardSummary.submittedReports) : '4.6',
      note: hasLiveDashboard ? `${dashboardSummary.approvedReports} approved` : 'From 124 reports',
      trend: hasLiveDashboard ? `${dashboardSummary.averageScore || 0}/100 avg score` : '+0.4',
      icon: Star,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-500',
    },
    {
      title: 'Committed Budget',
      value: hasLiveDashboard ? formatRand(dashboardSummary.totalCommittedZar) : 'R78,450',
      note: hasLiveDashboard ? 'Across posted jobs' : 'This month',
      trend: hasLiveDashboard ? 'Package totals only' : '+15%',
      icon: CircleDollarSign,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
  ];

  const mockJobs: DashboardJob[] = [
    {
      name: 'PayFlow Web App',
      type: 'Web Application',
      testers: '24 / 30',
      status: 'In Progress',
      deadline: '28 May 2024',
      deadlineNote: '3 days left',
      submissions: '12 / 24',
      accent: 'bg-slate-900 text-white',
      categoryId: 'website-testing',
      plan: 'Growth',
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
      categoryId: 'mobile-app-testing',
      plan: 'Pro',
    },
    {
      name: 'HealthApp iOS',
      type: 'iOS Application',
      testers: '30 / 30',
      status: 'Completed',
      deadline: '23 May 2024',
      deadlineNote: 'Overdue',
      submissions: '30 / 30',
      accent: 'bg-emerald-600 text-white',
      categoryId: 'localization-testing',
      completed: true,
      certifiedAt: '2026-03-20',
      plan: 'Growth',
      score: {
        usability: 84,
        performance: 80,
        onboarding: 79,
        bugSeverity: 87,
        deviceCompatibility: 83,
      },
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
      categoryId: 'onboarding-testing',
      plan: 'Starter',
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
      categoryId: 'ecommerce-testing',
      plan: 'Starter',
    },
  ];

  const databaseDashboardJobs = useMemo(
    () =>
      databaseJobs.map<DashboardJob>((job) => ({
        name: job.title,
        type: job.platform,
        testers: `0 / ${job.testersNeeded}`,
        status: job.status === 'active' ? ('Open' as const) : job.status === 'completed' ? ('Completed' as const) : ('Reviewing' as const),
        deadline: new Date(job.createdAt).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }),
        deadlineNote: 'Newly published',
        submissions: `0 / ${job.testersNeeded}`,
        accent: 'bg-green-600 text-white',
        logoUrl: job.logoUrl,
        categoryId: job.category as TestCategoryId,
        plan: job.packageKey === 'starter' ? ('Starter' as const) : job.packageKey === 'growth' ? ('Growth' as const) : ('Pro' as const),
      })),
    [databaseJobs],
  );

  const jobs = useMemo<DashboardJob[]>(() => (session?.source === 'supabase' ? databaseDashboardJobs : mockJobs), [databaseDashboardJobs, mockJobs, session?.source]);

  useEffect(() => {
    if (!session?.userId || session.source !== 'supabase' || !session.roles.includes('developer')) return;

    let mounted = true;
    setJobsError('');

    Promise.all([getDeveloperJobs(session.userId), getDeveloperApplications(session.userId), getDeveloperDashboardSummary(session.userId)])
      .then(([jobItems, applicationItems, summary]) => {
        if (!mounted) return;
        setDatabaseJobs(jobItems);
        setDatabaseApplications(applicationItems);
        setDashboardSummary(summary);
      })
      .catch((error: Error) => {
        if (mounted) setJobsError(error.message || 'Could not load your live dashboard data right now.');
      });

    return () => {
      mounted = false;
    };
  }, [session?.role, session?.source, session?.userId]);

  const [tierFilter, setTierFilter] = useState<'All' | 'Verified+' | 'Pro+' | 'Elite Only'>('All');
  const [retestTarget, setRetestTarget] = useState<(typeof jobs)[number] | null>(null);
  const [retestMessage, setRetestMessage] = useState('');

  const recentSubmissions = [
    { app: 'PayFlow Web App', tester: 'Thando M.', time: '2h ago', severity: 'Critical' },
    { app: 'FitTrack Mobile', tester: 'Sipho N.', time: '5h ago', severity: 'Medium' },
    { app: 'HealthApp iOS', tester: 'Lerato D.', time: '6h ago', severity: 'Low' },
    { app: 'PayFlow Web App', tester: 'John K.', time: '1d ago', severity: 'Critical' },
    { app: 'FitTrack Mobile', tester: 'Sarah W.', time: '1d ago', severity: 'Medium' },
  ];


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

  const activity = [
    { text: 'New job "EduLearn Platform" created', time: '2 hours ago', color: 'bg-green-100 text-green-600' },
    { text: 'Critical bug reported in PayFlow Web App', time: '3 hours ago', color: 'bg-red-100 text-red-500' },
    { text: 'Sipho N. submitted a report for FitTrack Mobile', time: '5 hours ago', color: 'bg-amber-100 text-amber-500' },
    { text: '30 reports completed for HealthApp iOS', time: 'Yesterday', color: 'bg-green-100 text-green-600' },
    { text: 'Payment of R12,450 processed', time: '2 days ago', color: 'bg-sky-100 text-sky-600' },
  ];

  const totalLiveBugs = dashboardSummary
    ? Object.values(dashboardSummary.bugCounts).reduce((sum, count) => sum + count, 0)
    : 0;
  const bugSummary = dashboardSummary
    ? [
        { label: 'Critical', value: `${dashboardSummary.bugCounts.Critical}`, color: 'bg-red-500' },
        { label: 'High', value: `${dashboardSummary.bugCounts.High}`, color: 'bg-orange-500' },
        { label: 'Medium', value: `${dashboardSummary.bugCounts.Medium}`, color: 'bg-amber-400' },
        { label: 'Low', value: `${dashboardSummary.bugCounts.Low}`, color: 'bg-green-500' },
      ]
    : [
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
  const submissionTrendValues = dashboardSummary && dashboardSummary.trend.some(Boolean) ? dashboardSummary.trend : [10, 16, 19, 23, 32, 38, 30];
  const submissionTrendLabels = ['20 May', '21 May', '22 May', '23 May', '24 May', '25 May', '26 May'];
  const trendMax = Math.max(1, ...submissionTrendValues);
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
    { label: 'Post a Job', icon: ClipboardList, href: '/post-job' },
    { label: 'Reports', icon: FileText, href: '/report-details' },
    { label: 'Billing', icon: CreditCard, href: '/billing' },
  ];

  const getStatusClasses = (status: string) => {
    if (status === 'In Progress') return 'bg-green-100 text-green-700';
    if (status === 'Reviewing') return 'bg-amber-100 text-amber-700';
    if (status === 'Completed') return 'bg-emerald-100 text-emerald-700';
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

  const handleRetestSubmit = (payload: RetestSubmission) => {
    if (!retestTarget) return;
    // TODO: Replace with Supabase query
    const previousOverall = retestTarget.score
      ? Math.round(
          (retestTarget.score.usability +
            retestTarget.score.performance +
            retestTarget.score.onboarding +
            retestTarget.score.bugSeverity +
            retestTarget.score.deviceCompatibility) /
            5,
        )
      : 68;
    const newOverall = 81;
    const delta = newOverall - previousOverall;

    const existing = JSON.parse(window.localStorage.getItem('squash_retests') ?? '[]') as Array<{
      jobName: string;
      submittedAt: string;
      plan: string;
      price: number;
      url: string;
      focusAreas: string;
    }>;
    existing.unshift({
      jobName: retestTarget.name,
      submittedAt: new Date().toISOString(),
      plan: payload.plan,
      price: payload.price,
      url: payload.url,
      focusAreas: payload.focusAreas,
    });
    window.localStorage.setItem('squash_retests', JSON.stringify(existing));

    const certifiedMessage =
      previousOverall < 80 && newOverall >= 80
        ? " Congratulations! You've earned your SQUASH CERTIFIED badge! 🏆"
        : '';

    setRetestMessage(
      `Previous Score: ${previousOverall}/100 → New Score: ${newOverall}/100 +${delta} points improvement 🎉${certifiedMessage}`,
    );
    setRetestTarget(null);
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
                <a href="/report-details" className="block w-full rounded-2xl border border-green-600 px-4 py-3 text-center font-semibold text-green-700 hover:bg-green-50">
                  View Reports
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

                <div className="flex items-center gap-3 sm:gap-4">
                  <a href="/report-details" className="relative rounded-full border border-slate-200 p-2.5 text-slate-600">
                    <Bell className="h-5 w-5" />
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      3
                    </span>
                  </a>
                  <a href="/dashboard" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <UserCircle2 className="h-7 w-7" />
                    </div>
                    <div className="hidden sm:block">
                      <div className="text-sm font-bold text-slate-900">{developerName}</div>
                      <div className="text-xs text-slate-500">Developer</div>
                    </div>
                  </a>
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
                <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Welcome back, {developerFirstName}!</h1>
                <p className="mt-2 text-slate-600">Here&apos;s what&apos;s happening with your testing activity.</p>
              </div>
              <a href="/dashboard" className="w-fit rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                May 20 - May 28, 2024
              </a>
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
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-slate-900">Active Jobs</h2>
                    <div className="relative">
                      <select
                        value={tierFilter}
                        onChange={(e) =>
                          setTierFilter(e.target.value as 'All' | 'Verified+' | 'Pro+' | 'Elite Only')
                        }
                        className="appearance-none rounded-xl border border-slate-200 bg-white px-3 py-1.5 pr-8 text-xs font-semibold text-slate-700 outline-none"
                      >
                        <option>All</option>
                        <option>Verified+</option>
                        <option>Pro+</option>
                        <option>Elite Only</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                  <a href="/developer/jobs" className="text-sm font-semibold text-green-700">View all jobs -&gt;</a>
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
                              {job.completed && job.score ? (
                                <div className="block">
                                  <SquashScore scores={job.score} compact />
                                </div>
                              ) : null}
                              {job.completed && job.score ? (
                                <SquashCertified
                                  score={Math.round(
                                    (job.score.usability +
                                      job.score.performance +
                                      job.score.onboarding +
                                      job.score.bugSeverity +
                                      job.score.deviceCompatibility) /
                                      5,
                                  )}
                                  testers={Number(job.testers.split('/')[0].trim())}
                                  certifiedAt={job.certifiedAt ?? '2026-04-01'}
                                  compact
                                />
                              ) : null}
                            </div>
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
                            <div className="flex items-center gap-2">
                              <a href="/report-details" className="block rounded-xl p-2 text-slate-500 hover:bg-slate-100">
                                <MoreHorizontal className="h-4 w-4" />
                              </a>
                              {job.completed ? (
                                <button
                                  type="button"
                                  onClick={() => setRetestTarget(job)}
                                  className="rounded-xl border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                  Request Retest
                                </button>
                              ) : null}
                            </div>
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
                  <a href="/developer/submissions" className="text-sm font-semibold text-green-700">View all -&gt;</a>
                </div>
                <div className="space-y-1 p-3">
                  {liveApplications.length > 0 ? (
                    liveApplications.map((application) => (
                      <a
                        key={`${application.app}-${application.tester}-${application.time}`}
                        href="/developer/submissions"
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
                      </a>
                    ))
                  ) : session?.source === 'supabase' ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">
                      No live applications yet.
                    </div>
                  ) : (
                    recentSubmissions.map((submission) => (
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
                    ))
                  )}
                </div>
              </div>
            </section>

            <section className="mt-6 grid gap-4 xl:grid-cols-[0.9fr_1.2fr_0.9fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-lg font-bold text-slate-900">Bug Summary (All Jobs)</div>
                <div className="mt-6 flex items-center justify-center">
                  <div className="relative flex h-40 w-40 items-center justify-center rounded-full bg-[conic-gradient(#ef4444_0_18%,#fbbf24_18%_58%,#22c55e_58%_86%,#cbd5e1_86%_100%)]">
                    <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white text-center shadow-inner">
                      <div className="text-2xl font-black text-slate-900">{dashboardSummary ? totalLiveBugs : 245}</div>
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
                  <a href="/dashboard" className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600">This Week</a>
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
                    [dashboardSummary ? String(dashboardSummary.totalApplications) : '124', 'Applications'],
                    [dashboardSummary ? String(dashboardSummary.submittedReports) : '18', 'In Review'],
                    [dashboardSummary ? String(dashboardSummary.approvedReports) : '96', 'Approved'],
                    [dashboardSummary ? `${dashboardSummary.averageScore || 0}/100` : '4.6*', 'Avg Score'],
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
                  <a href="/developer/activity" className="text-sm font-semibold text-green-700">View all -&gt;</a>
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
            {retestMessage ? (
              <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                {retestMessage}
              </div>
            ) : null}
          </div>
        </main>
      </div>
      <RetestRequestModal
        open={Boolean(retestTarget)}
        onClose={() => setRetestTarget(null)}
        plan={retestTarget?.plan ?? 'Starter'}
        originalScore={
          retestTarget?.score
            ? Math.round(
                (retestTarget.score.usability +
                  retestTarget.score.performance +
                  retestTarget.score.onboarding +
                  retestTarget.score.bugSeverity +
                  retestTarget.score.deviceCompatibility) /
                  5,
              )
            : 68
        }
        initialUrl="https://staging.example.app"
        onSubmit={handleRetestSubmit}
      />
    </div>
  );
}




