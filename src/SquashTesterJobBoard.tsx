import {
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  Gift,
  Home,
  Menu,
  Search,
  Settings,
  SlidersHorizontal,
  Star,
  UserCircle2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TesterBadge from './components/TesterBadge';
import MobileTabBar from './components/MobileTabBar';
import TesterMobileDrawer from './components/TesterMobileDrawer';
import {
  TEST_CATEGORIES,
  getCategoryById,
  type TestCategoryId,
} from './components/testCategories';
import { useAuth } from './auth';
import { getTesterSpecializations } from './lib/profileApi';
import { applyToJob, getActiveJobs, getTesterApplications, getTesterAssignments, type DeveloperJob } from './lib/jobApi';
import { getSpecializationLabel } from './components/testerSpecializations';

type Severity = 'Critical' | 'High' | 'Medium' | 'Low';

type TesterJobCard = {
  name: string;
  description: string;
  tags: string[];
  type: string;
  time: string;
  deadline: string;
  severity: Severity;
  pay: string;
  testers: string;
  posted: string;
  badge: string;
  accent: string;
  logoUrl?: string | null;
  categoryId: TestCategoryId;
  requiredSpecializations: string[];
  source?: 'supabase' | 'demo';
  jobId?: string;
  developerId?: string;
};

export default function SquashTesterJobBoard() {
  const { session } = useAuth();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const testerName = session?.name || 'Thando M.';
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('All Jobs');
  const [sortBy, setSortBy] = useState<'Newest' | 'Highest Pay'>('Newest');
  const [severityFilter, setSeverityFilter] = useState<Record<Severity, boolean>>({
    Critical: true,
    High: true,
    Medium: true,
    Low: true,
  });
  const [jobTypeFilter, setJobTypeFilter] = useState('Any');
  const [platformFilter, setPlatformFilter] = useState('Any');
  const [testTypeFilter, setTestTypeFilter] = useState('Any');
  const [timeFilter, setTimeFilter] = useState('Any');
  const [filterNotice, setFilterNotice] = useState('');
  const [databaseJobs, setDatabaseJobs] = useState<DeveloperJob[]>([]);
  const [jobsError, setJobsError] = useState('');
  const [applicationByJobId, setApplicationByJobId] = useState<Record<string, string>>({});
  const [assignmentByJobId, setAssignmentByJobId] = useState<Record<string, string>>({});
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [applicationNotice, setApplicationNotice] = useState('');
  const [applicationError, setApplicationError] = useState('');

  const navItems = [
    { label: 'Dashboard', icon: Home, href: '/tester/dashboard' },
    { label: 'Available Jobs', icon: BriefcaseBusiness, href: '/tester-jobs', active: true },
    { label: 'My Tests', icon: ClipboardList, href: '/active-test' },
    { label: 'Reports', icon: ClipboardList, href: '/tester/reports' },
    { label: 'Earnings', icon: CircleDollarSign, href: '/tester/earnings' },
    { label: 'Profile', icon: UserCircle2, href: '/tester/profile' },
    { label: 'Settings', icon: Settings, href: '/tester/settings' },
  ];

  const tabs = [
    { label: 'All Jobs', count: databaseJobs.length, active: true },
    ...TEST_CATEGORIES.map((item) => ({
      label: item.name,
      count: databaseJobs.filter((job) => job.category === item.id).length,
    })),
  ];


  const databaseJobCards = useMemo<TesterJobCard[]>(
    () =>
      databaseJobs.map((job, index) => ({
        name: job.title,
        description: job.description || 'Developer is looking for real tester feedback on this app.',
        tags: [job.platform, getCategoryById(job.category as TestCategoryId).name],
        type: getCategoryById(job.category as TestCategoryId).name,
        time: job.packageKey === 'starter' ? 'About 20 min' : job.packageKey === 'growth' ? 'About 30 min' : 'About 45 min',
        deadline: 'Open now',
        severity: index === 0 ? 'High' : 'Medium',
        pay: job.packageKey === 'starter' ? 'R50 - R80' : job.packageKey === 'growth' ? 'R80 - R120' : 'R150 - R200',
        testers: `${job.testersNeeded} testers needed`,
        posted: new Date(job.createdAt).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }),
        badge: 'New',
        accent: 'bg-green-600 text-white',
        logoUrl: job.logoUrl,
        categoryId: job.category as TestCategoryId,
        requiredSpecializations: job.preferredSpecializations,
        source: 'supabase',
        jobId: job.id,
        developerId: job.developerId,
      })),
    [databaseJobs],
  );

  const jobs = useMemo<TesterJobCard[]>(() => databaseJobCards, [databaseJobCards]);

  useEffect(() => {
    let mounted = true;
    setJobsError('');

    getActiveJobs()
      .then((items) => {
        if (mounted) setDatabaseJobs(items);
      })
      .catch((error: Error) => {
        if (mounted) setJobsError(error.message || 'Could not load live jobs right now.');
      });

    return () => {
      mounted = false;
    };
  }, []);

  const topTesters = [
    { name: 'Lerato D.', level: 'Level 5', total: 'R15,430', testsCompleted: 64, rating: 4.9 },
    { name: 'Sipho N.', level: 'Level 4', total: 'R12,210', testsCompleted: 32, rating: 4.7 },
    { name: 'Thando M.', level: 'Level 3', total: 'R9,870', testsCompleted: 14, rating: 4.3 },
  ];

  const [testerSpecializations, setTesterSpecializations] = useState<string[]>(() => {
    const raw = window.localStorage.getItem('squash_tester_specializations');
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as string[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!session?.userId || session.source !== 'supabase') return;

    getTesterSpecializations(session.userId)
      .then((savedSpecializations) => {
        if (savedSpecializations.length > 0) setTesterSpecializations(savedSpecializations);
      })
      .catch(() => {
        // Keep local fallback if Supabase is temporarily unavailable.
      });
  }, [session?.source, session?.userId]);

  useEffect(() => {
    if (!session?.userId || session.source !== 'supabase') return;

    Promise.allSettled([getTesterApplications(session.userId), getTesterAssignments(session.userId)]).then(
      ([applicationsResult, assignmentsResult]) => {
        const applications = applicationsResult.status === 'fulfilled' ? applicationsResult.value : [];
        const assignments = assignmentsResult.status === 'fulfilled' ? assignmentsResult.value : [];

        const statusByJobId = applications.reduce<Record<string, string>>((acc, application) => {
          acc[application.jobId] = application.status;
          return acc;
        }, {});

        const assignmentIdsByJobId = assignments.reduce<Record<string, string>>((acc, assignment) => {
          acc[assignment.jobId] = assignment.id;
          statusByJobId[assignment.jobId] = 'accepted';
          return acc;
        }, {});

        setAssignmentByJobId(assignmentIdsByJobId);
        setApplicationByJobId(statusByJobId);

        if (applicationsResult.status === 'rejected' && assignmentsResult.status === 'rejected') {
          const reason = applicationsResult.reason instanceof Error ? applicationsResult.reason.message : '';
          setApplicationError(reason || 'Could not load your applications right now.');
        }
      },
    );
  }, [session?.source, session?.userId]);

  const handleApply = async (job: TesterJobCard) => {
    setApplicationNotice('');
    setApplicationError('');

    if (job.source !== 'supabase' || !job.jobId) {
      navigate('/active-test');
      return;
    }

    if (!session?.userId || session.source !== 'supabase' || !session.roles.includes('tester')) {
      setApplicationError('Please log in with a real tester account before applying.');
      return;
    }

    if (job.developerId === session.userId) {
      setApplicationError('You cannot apply to a job you posted yourself. Switch to another tester account to test this flow.');
      return;
    }

    const currentStatus = applicationByJobId[job.jobId];
    if (currentStatus === 'accepted') {
      const assignmentId = assignmentByJobId[job.jobId];
      navigate(assignmentId ? `/active-test?assignment=${assignmentId}` : '/active-test');
      return;
    }

    if (currentStatus === 'pending') {
      setApplicationNotice(`You already applied to ${job.name}. The developer is reviewing your profile.`);
      return;
    }

    if (currentStatus === 'rejected') {
      setApplicationNotice(`Your application for ${job.name} was not accepted this time.`);
      return;
    }

    setApplyingJobId(job.jobId);
    try {
      const application = await applyToJob(job.jobId, session.userId);
      setApplicationByJobId((prev) => ({ ...prev, [application.jobId]: application.status }));
      setApplicationNotice(`Application sent for ${job.name}. The developer can now review your tester profile.`);
    } catch (error) {
      setApplicationError(error instanceof Error ? error.message : 'Unable to apply right now.');
    } finally {
      setApplyingJobId(null);
    }
  };

  const severityClasses: Record<Severity, string> = {
    Critical: 'text-red-500',
    High: 'text-red-500',
    Medium: 'text-amber-500',
    Low: 'text-green-600',
  };

  const severityDotClasses: Record<Severity, string> = {
    Critical: 'bg-red-500',
    High: 'bg-red-500',
    Medium: 'bg-amber-400',
    Low: 'bg-green-500',
  };

  const filteredJobs = useMemo(() => {
    let result = jobs.filter((job) => severityFilter[job.severity]);

    if (activeTab !== 'All Jobs') {
      const tabCategory = TEST_CATEGORIES.find((category) => category.name === activeTab);
      if (tabCategory) {
        result = result.filter((job) => job.categoryId === tabCategory.id);
      }
    }

    if (jobTypeFilter !== 'Any') {
      result = result.filter((job) => job.tags.includes(jobTypeFilter));
    }
    if (platformFilter !== 'Any') {
      result = result.filter((job) => job.tags.includes(platformFilter));
    }
    if (testTypeFilter !== 'Any') {
      result = result.filter((job) => job.type === testTypeFilter);
    }
    if (timeFilter !== 'Any') {
      if (timeFilter === 'Under 10 min') {
        result = result.filter((job) => job.time.includes('5 - 10'));
      }
      if (timeFilter === '10 - 15 min') {
        result = result.filter((job) => job.time.includes('10 - 15'));
      }
      if (timeFilter === '15+ min') {
        result = result.filter((job) => job.time.includes('15 - 20'));
      }
    }

    const query = searchText.trim().toLowerCase();
    if (query) {
      result = result.filter(
        (job) =>
          job.name.toLowerCase().includes(query) ||
          job.description.toLowerCase().includes(query) ||
          job.tags.some((tag) => tag.toLowerCase().includes(query)),
      );
    }

    if (sortBy === 'Highest Pay') {
      result = [...result].sort(
        (a, b) => Number(b.pay.replace(/\D/g, '')) - Number(a.pay.replace(/\D/g, '')),
      );
    }

    return result;
  }, [
    activeTab,
    jobTypeFilter,
    jobs,
    platformFilter,
    searchText,
    severityFilter,
    sortBy,
    testTypeFilter,
    timeFilter,
  ]);

  const resetFilters = () => {
    setSearchText('');
    setActiveTab('All Jobs');
    setSortBy('Newest');
    setSeverityFilter({
      Critical: true,
      High: true,
      Medium: true,
      Low: true,
    });
    setJobTypeFilter('Any');
    setPlatformFilter('Any');
    setTestTypeFilter('Any');
    setTimeFilter('Any');
    setFilterNotice('Filters reset.');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <TesterMobileDrawer isOpen={isMobileDrawerOpen} onClose={() => setIsMobileDrawerOpen(false)} />
      
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr_280px]">
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
                    item.active
                      ? 'bg-green-50 text-green-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </a>
              );
            })}
          </nav>

          <div className="space-y-4 p-4 pt-0">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-lg font-bold text-slate-900">Your Progress</div>
              <div className="mt-5 flex justify-center">
                <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-[10px] border-green-600/15">
                  <div className="absolute inset-0 rotate-[20deg] rounded-full border-[10px] border-transparent border-r-green-600 border-t-green-600" />
                  <div className="text-center">
                    <div className="text-2xl font-black text-slate-900">78%</div>
                  </div>
                </div>
              </div>
              <div className="mt-4 text-center font-semibold text-slate-800">Level 3</div>
              <div className="text-center text-sm text-slate-500">Quality Tester</div>
              <a href="/tester/profile" className="mt-4 inline-block text-sm font-semibold text-green-700">View Profile -&gt;</a>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-lg font-bold text-slate-900">Love testing?</div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Refer a friend and earn R100 when they complete a test.
              </p>
              <a href="/tester/referrals" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-green-700">
                <Gift className="h-4 w-4" /> Refer Now -&gt;
              </a>
            </div>
          </div>
        </aside>

        <main className="min-w-0 pb-24 lg:pb-0">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button onClick={() => setIsMobileDrawerOpen(true)} className="rounded-xl border border-slate-300 p-2.5 text-slate-600 lg:hidden hover:bg-slate-50 transition">
                    <Menu className="h-5 w-5" />
                  </button>
                  <div className="hidden max-w-xl flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:flex md:min-w-[340px] lg:min-w-[460px]">
                    <Search className="h-4 w-4 text-slate-400" />
                    <input
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                      placeholder="Search jobs, apps, or developers..."
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
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <UserCircle2 className="h-7 w-7" />
                    </div>
                    <div className="hidden sm:block">
                      <div className="text-sm font-bold text-slate-900">{testerName}</div>
                      <div className="text-xs text-slate-500">Tester</div>
                    </div>
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3 md:hidden">
                <div className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    placeholder="Search jobs, apps, or developers..."
                  />
                </div>
              </div>
            </div>
          </header>

          <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900">Available Test Jobs</h1>
                <p className="mt-2 text-slate-600">
                  Browse and apply for test jobs. Earn money while helping improve amazing apps.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSortBy((prev) => (prev === 'Newest' ? 'Highest Pay' : 'Newest'))}
                className="flex w-fit items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm"
              >
                Sort by: {sortBy} <ChevronDown className="h-4 w-4" />
              </button>
            </div>

              <div className="-mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 mt-8 flex overflow-x-auto gap-3 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {tabs.map((tab) => (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => setActiveTab(tab.label)}
                  className={`shrink-0 flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                    activeTab === tab.label
                      ? 'border-green-200 bg-green-50 text-green-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      activeTab === tab.label
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {databaseJobs.length > 0 ? (
              <div className="mt-6 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                Showing {databaseJobs.length} live Supabase job{databaseJobs.length === 1 ? '' : 's'}.
              </div>
            ) : null}
            {jobsError ? (
              <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {jobsError}
              </div>
            ) : null}
            {applicationNotice ? (
              <div className="mt-6 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                {applicationNotice}
              </div>
            ) : null}
            {applicationError ? (
              <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {applicationError}
              </div>
            ) : null}

            <div className="mt-8 space-y-5">
              {filteredJobs.map((job) => (
                <div key={job.name} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  {/* Top row: logo + title + category + action */}
                  <div className="flex items-start gap-3">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl text-lg font-bold ${job.logoUrl ? 'border border-slate-200 bg-white text-slate-900' : job.accent}`}>
                      {job.logoUrl ? <img src={job.logoUrl} alt={`${job.name} logo`} className="h-full w-full object-cover" /> : job.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h2 className="text-base font-bold text-slate-900">{job.name}</h2>
                        {(() => {
                          const category = getCategoryById(job.categoryId);
                          const CategoryIcon = category.icon;
                          return (
                            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                              <CategoryIcon className="h-3 w-3" style={{ color: category.color }} />
                              {category.name}
                            </span>
                          );
                        })()}
                        {job.badge ? (
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${job.badge === 'New' ? 'bg-green-100 text-green-700' : 'bg-sky-100 text-sky-700'}`}>
                            {job.badge}
                          </span>
                        ) : null}
                        {job.source === 'supabase' ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Live</span>
                        ) : null}
                        {job.requiredSpecializations.some((id) => testerSpecializations.includes(id)) ? (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700">✓ Matches You</span>
                        ) : null}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">{job.description}</p>
                    </div>
                  </div>

                  {/* Tags row */}
                  {job.tags.length > 0 && (
                    <div className="mt-2.5 flex gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {job.tags.map((tag) => (
                        <span key={tag} className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">{tag}</span>
                      ))}
                      {job.requiredSpecializations.slice(0, 2).map((id) => (
                        <span key={`${job.name}-${id}`} className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">{getSpecializationLabel(id)}</span>
                      ))}
                    </div>
                  )}

                  {/* Pay + CTA row */}
                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                    <div>
                      <div className="text-xl font-black text-green-700">{job.pay}</div>
                      <div className="text-[11px] text-slate-500">{job.testers} · {job.time}</div>
                    </div>
                    {(() => {
                      const applicationStatus = job.jobId ? applicationByJobId[job.jobId] : undefined;
                      const isAccepted = applicationStatus === 'accepted';
                      const isPending = applicationStatus === 'pending';
                      const isRejected = applicationStatus === 'rejected';
                      const isApplying = job.jobId && applyingJobId === job.jobId;
                      return (
                        <button
                          type="button"
                          onClick={() => handleApply(job)}
                          disabled={Boolean(isApplying || isPending || isRejected)}
                          className={`rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition ${
                            isAccepted
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : isPending
                                ? 'cursor-not-allowed bg-amber-50 text-amber-700 ring-1 ring-amber-100'
                                : isRejected
                                  ? 'cursor-not-allowed bg-slate-100 text-slate-500'
                                  : 'bg-green-600 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-300'
                          }`}
                        >
                          {isApplying ? 'Applying…' : isAccepted ? 'Start Test' : isPending ? 'Applied' : isRejected ? 'Not selected' : 'Apply Now'}
                        </button>
                      );
                    })()}
                  </div>

                  {/* Metadata strip */}
                  <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                    <span><span className="font-semibold text-slate-700">{job.type}</span> · Test Type</span>
                    <span><span className="font-semibold text-slate-700">{job.deadline}</span> · Deadline</span>
                    <span className="flex items-center gap-1">
                      <span className={`h-2 w-2 rounded-full ${severityDotClasses[job.severity]}`} />
                      <span className={`font-semibold ${severityClasses[job.severity]}`}>{job.severity}</span>
                    </span>
                    <span><span className="font-semibold text-slate-700">{job.posted}</span> · Posted</span>
                  </div>
                </div>

              ))}
              {filteredJobs.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm">
                  No jobs matched your filters.
                </div>
              ) : null}
            </div>

            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
              <div className="flex items-center gap-2">
                {['<-', '1', '2', '3', '4', '5', '...', '12', '->'].map((item, index) => (
                  <a
                    key={`${item}-${index}`}
                    href={item === '<-' ? '/tester-jobs?page=1' : item === '->' ? '/tester-jobs?page=12' : item === '...' ? '/tester-jobs?page=6' : `/tester-jobs?page=${item}`}
                    className={`flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold ${
                      item === '1'
                        ? 'border-green-600 bg-green-600 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {item}
                  </a>
                ))}
              </div>
              <div className="text-sm text-slate-500">
                Showing 1 to {Math.min(filteredJobs.length, 10)} of {filteredJobs.length} jobs
              </div>
            </div>
          </div>
        </main>

        <aside className="hidden border-l border-slate-200 bg-white p-5 xl:sticky xl:top-0 xl:block xl:h-screen xl:overflow-y-auto">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-xl font-bold text-slate-900">Filters</div>
              <button type="button" onClick={resetFilters} className="text-sm font-semibold text-green-700">Reset</button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Job Type</label>
                <div className="relative">
                  <select
                    value={jobTypeFilter}
                    onChange={(e) => setJobTypeFilter(e.target.value)}
                    className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-600 outline-none transition focus:border-green-500"
                  >
                    <option>Any</option>
                    <option>Mobile App</option>
                    <option>Web App</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Platform</label>
                <div className="relative">
                  <select
                    value={platformFilter}
                    onChange={(e) => setPlatformFilter(e.target.value)}
                    className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-600 outline-none transition focus:border-green-500"
                  >
                    <option>Any</option>
                    <option>Android</option>
                    <option>iOS</option>
                    <option>Web App</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Test Type</label>
                <div className="relative">
                  <select
                    value={testTypeFilter}
                    onChange={(e) => setTestTypeFilter(e.target.value)}
                    className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-600 outline-none transition focus:border-green-500"
                  >
                    <option>Any</option>
                    <option>Usability Test</option>
                    <option>Bug Hunt</option>
                    <option>Exploratory Test</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Estimated Time</label>
                <div className="relative">
                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                    className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-600 outline-none transition focus:border-green-500"
                  >
                    <option>Any</option>
                    <option>Under 10 min</option>
                    <option>10 - 15 min</option>
                    <option>15+ min</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-3 block text-sm font-semibold text-slate-700">Pay Range (ZAR)</label>
              <div className="px-1">
                <div className="relative h-2 rounded-full bg-slate-200">
                  <div className="absolute left-[8%] right-[5%] h-2 rounded-full bg-green-600" />
                  <span className="absolute left-[8%] top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white bg-green-600 shadow" />
                  <span className="absolute right-[5%] top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white bg-green-600 shadow" />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>R0</span>
                  <span>R500+</span>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-3 text-sm font-semibold text-slate-700">Severity</div>
              <div className="space-y-3 text-sm">
                {(['Critical', 'High', 'Medium', 'Low'] as Severity[]).map((level) => (
                  <label key={level} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={severityFilter[level]}
                      onChange={(e) =>
                        setSeverityFilter((prev) => ({ ...prev, [level]: e.target.checked }))
                      }
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    <span className={severityClasses[level]}>{level}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setFilterNotice(`Showing ${filteredJobs.length} matching jobs.`)}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700"
            >
              <SlidersHorizontal className="h-4 w-4" /> Apply Filters
            </button>
            {filterNotice ? <p className="mt-3 text-sm font-semibold text-green-700">{filterNotice}</p> : null}
          </div>

          <div className="mt-5 rounded-3xl border border-green-100 bg-green-50 p-5 shadow-sm">
            <div className="text-xl font-bold text-slate-900">Tips for Testers</div>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
              <li>- Read requirements carefully before applying.</li>
              <li>- Submit detailed and honest feedback.</li>
              <li>- High quality reports = more invites.</li>
            </ul>
            <a href="/guides" className="mt-4 inline-block text-sm font-semibold text-green-700">View Testing Guide -&gt;</a>
          </div>

            <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-xl font-bold text-slate-900">
                <Star className="h-5 w-5 text-amber-500" /> Top Testers
              </div>
              <div className="mt-4 space-y-4">
                {topTesters.map((tester, index) => (
                  <div key={tester.name} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                      {index + 1}
                    </div>
                      <div>
                        <div className="font-semibold text-slate-900">{tester.name}</div>
                        <div className="mt-1 text-xs text-slate-500">{tester.level}</div>
                        <div className="mt-1">
                          <TesterBadge testsCompleted={tester.testsCompleted} rating={tester.rating} />
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-slate-700">{tester.total}</div>
                </div>
              ))}
            </div>
            <a href="/tester/leaderboard" className="mt-4 inline-block text-sm font-semibold text-green-700">View Leaderboard -&gt;</a>
          </div>
        </aside>
      </div>
      <MobileTabBar role="tester" />
      <TesterMobileDrawer isOpen={isMobileDrawerOpen} onClose={() => setIsMobileDrawerOpen(false)} activePath="/tester-jobs" />
    </div>
  );
}






