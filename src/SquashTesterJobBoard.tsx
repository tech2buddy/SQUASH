import {
  ChevronDown,
  SlidersHorizontal,
  Star,
  } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TesterBadge from './components/TesterBadge';



import {
  TEST_CATEGORIES,
  getCategoryById,
  type TestCategoryId,
} from './components/testCategories';
import { useAuth } from './auth';
import { getTesterSpecializations, getTopTesters } from './lib/profileApi';
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
  amount: string;
  testers: string;
  posted: string;
  badge?: string;
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
  
  const navigate = useNavigate();
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
  const [minPay, setMinPay] = useState<number>(0);
  const [filterNotice, setFilterNotice] = useState('');
  const [databaseJobs, setDatabaseJobs] = useState<DeveloperJob[]>([]);
  const [jobsError, setJobsError] = useState('');
  const [applicationByJobId, setApplicationByJobId] = useState<Record<string, string>>({});
  const [assignmentByJobId, setAssignmentByJobId] = useState<Record<string, string>>({});
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [applicationNotice, setApplicationNotice] = useState('');
  const [applicationError, setApplicationError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedJobs, setExpandedJobs] = useState<Record<string, boolean>>({});
  const JOBS_PER_PAGE = 6;

  

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
        amount: job.packageKey === 'starter' ? '80' : job.packageKey === 'growth' ? '120' : '200',
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

  const [topTesters, setTopTesters] = useState<{name: string, testsCompleted: number, rating: number}[]>([]);

  useEffect(() => {
    let mounted = true;
    getTopTesters(3).then((data: any) => {
      if (mounted) {
        setTopTesters(data);
      }
    }).catch((err: any) => console.error('Failed to load top testers', err));
    return () => { mounted = false; };
  }, []);

  const [testerSpecializations, setTesterSpecializations] = useState<string[]>([]);

  useEffect(() => {
    if (!session?.userId) return;

    getTesterSpecializations(session.userId)
      .then((savedSpecializations) => {
        if (savedSpecializations.length > 0) setTesterSpecializations(savedSpecializations);
      })
      .catch(() => {
        // Matching remains empty until Supabase can return verified specializations.
      });
  }, [("supabase"), session?.userId]);

  useEffect(() => {
    if (!session?.userId) return;

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
  }, [("supabase"), session?.userId]);

  const handleApply = async (job: TesterJobCard) => {
    setApplicationNotice('');
    setApplicationError('');

    if (job.source !== 'supabase' || !job.jobId) {
      navigate('/active-test');
      return;
    }

    if (!session?.userId || !session.roles.includes('tester')) {
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

    if (minPay > 0) {
      result = result.filter((job) => {
        const payAmount = parseInt(job.amount.replace(/\D/g, ''), 10) || 0;
        return payAmount >= minPay;
      });
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
    minPay,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, jobTypeFilter, platformFilter, testTypeFilter, timeFilter, searchText, sortBy, severityFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / JOBS_PER_PAGE));
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * JOBS_PER_PAGE;
    return filteredJobs.slice(start, start + JOBS_PER_PAGE);
  }, [filteredJobs, currentPage]);

  const startItem = filteredJobs.length === 0 ? 0 : (currentPage - 1) * JOBS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * JOBS_PER_PAGE, filteredJobs.length);

  const paginationItems = useMemo(() => {
    const items: string[] = ['<-'];
    if (totalPages <= 6) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(String(i));
      }
    } else {
      items.push('1', '2', '3', '4', '5', '...', String(totalPages));
    }
    items.push('->');
    return items;
  }, [totalPages]);

  const handlePageClick = (item: string) => {
    if (item === '<-') {
      setCurrentPage((p) => Math.max(1, p - 1));
    } else if (item === '->') {
      setCurrentPage((p) => Math.min(totalPages, p + 1));
    } else if (item === '...') {
      setCurrentPage((p) => Math.min(totalPages, p + 3));
    } else {
      const pageNum = Number(item);
      if (!isNaN(pageNum)) {
        setCurrentPage(pageNum);
      }
    }
  };

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
    setCurrentPage(1);
    setFilterNotice('Filters reset.');
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <div className="space-y-6 min-w-0">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between animate-fade-up">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">Available Test Jobs</h1>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm font-medium">
                  Browse and apply for test jobs. Earn money while helping improve amazing apps.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSortBy((prev) => (prev === 'Newest' ? 'Highest Pay' : 'Newest'))}
                className="flex w-fit items-center gap-2 rounded-full border border-slate-200/80 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition apple-press-effect"
              >
                Sort by: {sortBy} <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Category Tabs */}
            <div className="-mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 flex overflow-x-auto gap-2.5 pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {tabs.map((tab) => (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => setActiveTab(tab.label)}
                  className={`shrink-0 flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition-all duration-200 apple-press-effect ${
                    activeTab === tab.label
                      ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                      : 'border-slate-200/80 bg-white text-slate-600 hover:bg-slate-100/60'
                  }`}
                >
                  {tab.label}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                      activeTab === tab.label
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {jobsError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50/60 px-4 py-3 text-xs font-bold text-red-700">
                {jobsError}
              </div>
            ) : null}
            {applicationNotice ? (
              <div className="rounded-2xl border border-green-200 bg-green-50/60 px-4 py-3 text-xs font-bold text-green-800">
                {applicationNotice}
              </div>
            ) : null}
            {applicationError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50/60 px-4 py-3 text-xs font-bold text-red-700">
                {applicationError}
              </div>
            ) : null}

            {/* Job Cards */}
            <div className="space-y-4">
              {paginatedJobs.map((job) => (
                <div key={job.name} className="apple-bento-card p-5 min-w-0">
                  {/* Top row: logo + title + category + action */}
                  <div className="flex items-start gap-3.5">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-base font-extrabold ${job.logoUrl ? 'border border-slate-200 bg-white text-slate-900' : job.accent}`}>
                      {job.logoUrl ? <img src={job.logoUrl} alt={`${job.name} logo`} className="h-full w-full object-cover" /> : job.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900">{job.name}</h2>
                        {(() => {
                          const category = getCategoryById(job.categoryId);
                          const CategoryIcon = category.icon;
                          return (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                              <CategoryIcon className="h-3 w-3" style={{ color: category.color }} />
                              {category.name}
                            </span>
                          );
                        })()}
                        {job.badge ? (
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${job.badge === 'New' ? 'bg-green-100 text-green-800' : 'bg-sky-100 text-sky-800'}`}>
                            {job.badge}
                          </span>
                        ) : null}
                        {job.source === 'supabase' ? (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-emerald-800">Live</span>
                        ) : null}
                        {job.requiredSpecializations.some((id) => testerSpecializations.includes(id)) ? (
                          <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-[10px] font-extrabold text-green-800">✓ Matches You</span>
                        ) : null}
                      </div>
                      {(() => {
                        const isExpanded = Boolean(expandedJobs[job.name]);
                        const isLong = job.description.length > 80;
                        return (
                          <div className="mt-1.5">
                            <p className={`text-xs text-slate-500 font-medium leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                              {job.description}
                            </p>
                            {isLong ? (
                              <button
                                type="button"
                                onClick={() => setExpandedJobs((prev) => ({ ...prev, [job.name]: !prev[job.name] }))}
                                className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-green-700 hover:text-green-800 hover:underline transition"
                              >
                                {isExpanded ? 'View Less ▲' : 'View More ▼'}
                              </button>
                            ) : null}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Tags row */}
                  {job.tags.length > 0 && (
                    <div className="mt-3 flex gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {job.tags.map((tag) => (
                        <span key={tag} className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{tag}</span>
                      ))}
                      {job.requiredSpecializations.slice(0, 2).map((id) => (
                        <span key={`${job.name}-${id}`} className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">{getSpecializationLabel(id)}</span>
                      ))}
                    </div>
                  )}

                  {/* Pay + CTA row */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <div>
                      <div className="text-xl font-extrabold text-slate-900">{job.pay}</div>
                      <div className="text-[11px] font-semibold text-slate-500 mt-0.5">{job.testers} · {job.time}</div>
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
                          className={`rounded-full px-5 py-2.5 text-xs font-bold transition apple-press-effect ${
                            isAccepted
                              ? 'bg-green-600 text-white shadow-sm hover:bg-green-700'
                              : isPending
                                ? 'cursor-not-allowed bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                                : isRejected
                                  ? 'cursor-not-allowed bg-slate-100 text-slate-500'
                                  : 'bg-slate-900 text-white shadow-md shadow-slate-900/10 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300'
                          }`}
                        >
                          {isApplying ? 'Applying…' : isAccepted ? 'Start Test' : isPending ? 'Applied' : isRejected ? 'Not selected' : 'Apply Now'}
                        </button>
                      );
                    })()}
                  </div>
                </div>
              ))}
              {filteredJobs.length === 0 ? (
                <div className="apple-bento-card p-8 text-center text-xs font-semibold text-slate-500">
                  No jobs matched your filters.
                </div>
              ) : null}
            </div>

            {/* Dynamic Page Buttons matching visual design */}
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
              <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 [&::-webkit-scrollbar]:hidden">
                {paginationItems.map((item, index) => {
                  const isCurrent = item === String(currentPage);
                  const isPrevDisabled = item === '<-' && currentPage === 1;
                  const isNextDisabled = item === '->' && currentPage === totalPages;
                  const isDisabled = isPrevDisabled || isNextDisabled;

                  return (
                    <button
                      key={`${item}-${index}`}
                      type="button"
                      onClick={() => handlePageClick(item)}
                      disabled={isDisabled}
                      className={`flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition apple-press-effect ${
                        isCurrent
                          ? 'border-green-600 bg-green-600 text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
              <div className="text-sm font-medium text-slate-500">
                {filteredJobs.length === 0
                  ? '0 jobs found'
                  : totalPages === 1
                    ? `Showing all ${filteredJobs.length} ${filteredJobs.length === 1 ? 'job' : 'jobs'}`
                    : `Showing ${startItem}–${endItem} of ${filteredJobs.length} jobs`}
              </div>
            </div>
          </div>

        <div className="space-y-6">
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
              <label className="mb-3 block text-sm font-semibold text-slate-700">Minimum Pay (ZAR): R{minPay}</label>
              <div className="px-1">
                <input 
                  type="range" 
                  min="0" 
                  max="500" 
                  step="50" 
                  value={minPay} 
                  onChange={(e) => setMinPay(parseInt(e.target.value, 10))}
                  className="w-full accent-green-600 cursor-pointer"
                />
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
                        <div className="mt-1">
                          <TesterBadge testsCompleted={tester.testsCompleted} rating={tester.rating} />
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-slate-700">{tester.testsCompleted} tests</div>
                </div>
              ))}
            </div>
            <a href="/tester/leaderboard" className="mt-4 inline-block text-sm font-semibold text-green-700">View Leaderboard -&gt;</a>
          </div>
        </div>
      </div>
  );
}






