import {
  ChevronDown,
  Search,
  SlidersHorizontal,
  Star,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import TesterBadge from './components/TesterBadge';



import {
  TEST_CATEGORIES,
  getCategoryById,
  type TestCategoryId,
} from './components/testCategories';
import { useAuth } from './auth';
import { getTesterSpecializations, getTopTesters } from './lib/profileApi';
import { getActiveJobs, getTesterApplications, getTesterAssignments, type DeveloperJob } from './lib/jobApi';
import { testerPayoutForJob } from './lib/pricing';
import { getTestTypeByKey } from './lib/testTypes';

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
  const [applicationError, setApplicationError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const JOBS_PER_PAGE = 6;

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchText) count++;
    if (jobTypeFilter !== 'Any') count++;
    if (platformFilter !== 'Any') count++;
    if (testTypeFilter !== 'Any') count++;
    if (timeFilter !== 'Any') count++;
    if (minPay > 0) count++;
    return count;
  }, [searchText, jobTypeFilter, platformFilter, testTypeFilter, timeFilter, minPay]);

  

  const tabs = [
    { label: 'All Jobs', count: databaseJobs.length, active: true },
    ...TEST_CATEGORIES.map((item) => ({
      label: item.name,
      count: databaseJobs.filter((job) => job.category === item.id).length,
    })),
  ];


  const databaseJobCards = useMemo<TesterJobCard[]>(
    () =>
      databaseJobs.map((job, index) => {
        const testTypeConfig = getTestTypeByKey(job.packageKey);
        const payoutZar = testerPayoutForJob(job.totalAmountZar, job.testersNeeded);
        return {
        name: job.title,
        description: job.description || 'Developer is looking for real tester feedback on this app.',
        tags: [job.platform, getCategoryById(job.category as TestCategoryId).name],
        type: getCategoryById(job.category as TestCategoryId).name,
        time: `About ${testTypeConfig.estimatedMinutes} min`,
        deadline: 'Open now',
        severity: index === 0 ? 'High' : 'Medium',
        pay: `R${payoutZar}`,
        amount: String(payoutZar),
        testers: `${job.testersNeeded} testers needed`,
        posted: new Date(job.createdAt).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }),
        badge: 'New',
        accent: 'bg-[#1d1d1f] text-white',
        logoUrl: job.logoUrl,
        categoryId: job.category as TestCategoryId,
        requiredSpecializations: job.preferredSpecializations,
        source: 'supabase',
        jobId: job.id,
        developerId: job.developerId,
        };
      }),
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
        if (applicationsResult.status === 'rejected' && assignmentsResult.status === 'rejected') {
          const reason = applicationsResult.reason instanceof Error ? applicationsResult.reason.message : '';
          setApplicationError(reason || 'Could not load your applications right now.');
        }
      },
    );
  }, [session?.userId]);

  const severityClasses: Record<Severity, string> = {
    Critical: 'text-red-500',
    High: 'text-red-500',
    Medium: 'text-amber-500',
    Low: 'text-slate-600',
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
      <div className="space-y-4 min-w-0">
        {/* Quiet Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-1 border-b border-[#E7E7E5]">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-[#181817]">Available Test Jobs</h1>
            <p className="mt-0.5 text-xs text-[#666663]">
              Browse and apply for active QA assignments across South Africa.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              className="squash-btn-secondary xl:hidden !h-8 !px-2.5"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-[#666663]" />
              <span>Filters</span>
              {activeFilterCount > 0 ? (
                <span className="grid h-4 min-w-4 place-items-center rounded-full bg-[#181817] px-1 text-[9px] font-medium text-white">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>

            <div className="relative inline-flex items-center">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'Newest' | 'Highest Pay')}
                className="squash-input !h-8 !py-0 !pl-3 !pr-7 !text-xs appearance-none font-medium cursor-pointer"
              >
                <option value="Newest">Sort: Newest</option>
                <option value="Highest Pay">Sort: Highest Pay</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-[#92928E]" />
            </div>
          </div>
        </div>

        {/* Quiet Search Bar */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#92928E]" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search test jobs by keyword, platform, or skills..."
            className="squash-input w-full !pl-9 !pr-8 !text-xs"
          />
          {searchText ? (
            <button
              type="button"
              onClick={() => setSearchText('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#92928E] hover:text-[#181817]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        {/* Category Tabs */}
        <div className="flex overflow-x-auto gap-1.5 pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {tabs.map((tab) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => setActiveTab(tab.label)}
              className={`shrink-0 flex items-center gap-1.5 rounded-md px-3 h-[30px] text-xs font-medium transition-colors ${
                activeTab === tab.label
                  ? 'bg-[#EEEEEC] text-[#181817] border border-[#DADAD7]'
                  : 'bg-[#FFFFFF] text-[#666663] border border-[#E7E7E5] hover:bg-[#F7F7F6] hover:text-[#181817]'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] ${activeTab === tab.label ? 'text-[#181817]' : 'text-[#92928E]'}`}>
                ({tab.count})
              </span>
            </button>
          ))}
        </div>

        {jobsError ? (
          <div className="p-3 rounded-md bg-[#FDECEC] border border-[#C95050]/20 text-xs text-[#C95050] font-medium">
            {jobsError}
          </div>
        ) : null}
        {applicationError ? (
          <div className="p-3 rounded-md bg-[#FDECEC] border border-[#C95050]/20 text-xs text-[#C95050] font-medium">
            {applicationError}
          </div>
        ) : null}

        {/* Job Cards */}
        <div className="space-y-3">
          {paginatedJobs.map((job) => (
            <div
              key={job.name}
              role={job.jobId ? 'link' : undefined}
              tabIndex={job.jobId ? 0 : undefined}
              onClick={job.jobId ? () => navigate(`/tester-jobs/${job.jobId}`) : undefined}
              className={`squash-panel p-4 transition-colors ${job.jobId ? 'cursor-pointer hover:border-[#DADAD7]' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#F7F7F6] border border-[#E7E7E5] text-xs font-semibold text-[#181817]">
                  {job.logoUrl ? <img src={job.logoUrl} alt="" className="h-full w-full object-cover rounded-md" /> : job.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold text-[#181817] tracking-tight">{job.name}</h2>
                    {(() => {
                      const category = getCategoryById(job.categoryId);
                      return (
                        <span className="squash-status-pill squash-status-neutral">
                          {category.name}
                        </span>
                      );
                    })()}
                    {job.source === 'supabase' ? (
                      <span className="squash-status-pill squash-status-success">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
                        Live QA
                      </span>
                    ) : null}
                    {job.requiredSpecializations.some((id) => testerSpecializations.includes(id)) ? (
                      <span className="squash-status-pill squash-status-info">
                        Matched
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-1 text-xs text-[#666663] line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>

                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#EEEEEC]">
                    <div className="flex items-center gap-3 text-[11px] text-[#92928E]">
                      <span>Payout: <strong className="text-[#181817] font-semibold">{job.pay}</strong></span>
                      <span>•</span>
                      <span>{job.time}</span>
                      <span>•</span>
                      <span>{job.testers}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={job.jobId ? `/tester-jobs/${job.jobId}` : '/tester-jobs'}
                        className="squash-btn-primary !h-8 !px-3 !text-[11px]"
                      >
                        View Assignment
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredJobs.length === 0 ? (
          <div className="squash-panel p-8 text-center text-xs font-normal text-[#92928E]">
            No jobs matched your filters.
          </div>
        ) : null}

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
                      className={`flex h-9 min-w-9 items-center justify-center rounded-full border px-3 text-xs font-semibold transition active:scale-98 ${
                        isCurrent
                          ? 'border-[#e63946] bg-[#e63946] text-white shadow-2xs'
                          : 'border-black/[0.06] bg-[#f5f5f7] text-[#1d1d1f] hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
              <div className="text-xs font-semibold text-[#86868b]">
                {filteredJobs.length === 0
                  ? '0 jobs found'
                  : totalPages === 1
                    ? `Showing all ${filteredJobs.length} ${filteredJobs.length === 1 ? 'job' : 'jobs'}`
                    : `Showing ${startItem}–${endItem} of ${filteredJobs.length} jobs`}
              </div>
            </div>
          </div>

        <div className="hidden xl:block space-y-5">
          <div className="apple-interactive-card p-5">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#1d1d1f]">Filters</div>
              <button type="button" onClick={resetFilters} className="text-xs font-semibold text-[#e63946] hover:underline">Reset</button>
            </div>

            <div className="mt-4 space-y-3.5">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#1d1d1f]">Job Type</label>
                <div className="relative">
                  <select
                    value={jobTypeFilter}
                    onChange={(e) => setJobTypeFilter(e.target.value)}
                    className="w-full appearance-none rounded-full border border-black/10 bg-[#f5f5f7] px-3.5 py-2 pr-8 text-xs font-semibold text-[#1d1d1f] outline-none hover:bg-slate-200/50 transition cursor-pointer"
                  >
                    <option>Any</option>
                    <option>Mobile App</option>
                    <option>Web App</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#86868b]" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#1d1d1f]">Platform</label>
                <div className="relative">
                  <select
                    value={platformFilter}
                    onChange={(e) => setPlatformFilter(e.target.value)}
                    className="w-full appearance-none rounded-full border border-black/10 bg-[#f5f5f7] px-3.5 py-2 pr-8 text-xs font-semibold text-[#1d1d1f] outline-none hover:bg-slate-200/50 transition cursor-pointer"
                  >
                    <option>Any</option>
                    <option>Android</option>
                    <option>iOS</option>
                    <option>Web App</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#86868b]" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#1d1d1f]">Test Type</label>
                <div className="relative">
                  <select
                    value={testTypeFilter}
                    onChange={(e) => setTestTypeFilter(e.target.value)}
                    className="w-full appearance-none rounded-full border border-black/10 bg-[#f5f5f7] px-3.5 py-2 pr-8 text-xs font-semibold text-[#1d1d1f] outline-none hover:bg-slate-200/50 transition cursor-pointer"
                  >
                    <option>Any</option>
                    <option>Usability Test</option>
                    <option>Bug Hunt</option>
                    <option>Exploratory Test</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#86868b]" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#1d1d1f]">Estimated Time</label>
                <div className="relative">
                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                    className="w-full appearance-none rounded-full border border-black/10 bg-[#f5f5f7] px-3.5 py-2 pr-8 text-xs font-semibold text-[#1d1d1f] outline-none hover:bg-slate-200/50 transition cursor-pointer"
                  >
                    <option>Any</option>
                    <option>Under 10 min</option>
                    <option>10 - 15 min</option>
                    <option>15+ min</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#86868b]" />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-black/[0.06]">
              <label className="mb-2 block text-xs font-bold text-[#1d1d1f]">Minimum Pay (ZAR): <span className="text-[#e63946]">R{minPay}</span></label>
              <div className="px-1">
                <input 
                  type="range" 
                  min="0" 
                  max="500" 
                  step="50" 
                  value={minPay} 
                  onChange={(e) => setMinPay(parseInt(e.target.value, 10))}
                  className="w-full accent-[#e63946] cursor-pointer h-1.5 bg-[#f5f5f7] rounded-lg"
                />
                <div className="mt-2 flex items-center justify-between text-[10px] font-semibold text-[#86868b]">
                  <span>R0</span>
                  <span>R500+</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-black/[0.06]">
              <div className="mb-2.5 text-xs font-bold text-[#1d1d1f]">Severity</div>
              <div className="space-y-2 text-xs font-semibold">
                {(['Critical', 'High', 'Medium', 'Low'] as Severity[]).map((level) => (
                  <label key={level} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={severityFilter[level]}
                      onChange={(e) =>
                        setSeverityFilter((prev) => ({ ...prev, [level]: e.target.checked }))
                      }
                      className="h-3.5 w-3.5 rounded border-black/20 accent-[#e63946] cursor-pointer"
                    />
                    <span className={severityClasses[level]}>{level}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setFilterNotice(`Showing ${filteredJobs.length} matching jobs.`)}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#1d1d1f] px-4 py-2.5 text-xs font-semibold text-white shadow-2xs hover:bg-black active:scale-98 transition"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" /> Apply Filters
            </button>
            {filterNotice ? <p className="mt-2 text-center text-[11px] font-bold text-[#e63946]">{filterNotice}</p> : null}
          </div>

          <div className="apple-interactive-card p-5 border-l-4 border-l-[#e63946]">
            <div className="text-xs font-extrabold text-[#1d1d1f] uppercase tracking-wider">Tips for Testers</div>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-[#86868b] font-normal">
              <li className="flex items-start gap-1.5"><span className="text-[#e63946] font-bold">•</span> Read requirements carefully before applying.</li>
              <li className="flex items-start gap-1.5"><span className="text-[#e63946] font-bold">•</span> Submit detailed and honest feedback.</li>
              <li className="flex items-start gap-1.5"><span className="text-[#e63946] font-bold">•</span> High quality reports = more invites.</li>
            </ul>
            <a href="/guides" className="mt-3 inline-block text-xs font-semibold text-[#e63946] hover:underline">View Testing Guide →</a>
          </div>

          <div className="apple-interactive-card p-5">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
              <div className="flex items-center gap-2 text-xs font-extrabold text-[#1d1d1f] uppercase tracking-wider">
                <Star className="h-4 w-4 text-amber-500 fill-amber-400" />
                <span>Top Testers</span>
              </div>
              <a href="/tester/leaderboard" className="text-[11px] font-bold text-[#e63946] hover:underline">View All →</a>
            </div>
            <div className="mt-3.5 space-y-3">
              {topTesters.map((tester, index) => (
                <div key={tester.name} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1d1d1f] text-[11px] font-extrabold text-white shadow-2xs">
                      #{index + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#1d1d1f] truncate">{tester.name}</div>
                      <div className="mt-0.5">
                        <TesterBadge testsCompleted={tester.testsCompleted} rating={tester.rating} />
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] font-bold text-[#86868b] shrink-0">{tester.testsCompleted} tests</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Filter Slide-Over Drawer Modal */}
        {isMobileFilterOpen ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs xl:hidden animate-fade-in">
            <div
              className="fixed inset-0"
              onClick={() => setIsMobileFilterOpen(false)}
            />
            <div className="relative w-full max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-black/10 bg-white p-5 shadow-2xl animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
                <div className="flex items-center gap-2 text-sm font-extrabold text-[#1d1d1f]">
                  <SlidersHorizontal className="h-4 w-4 text-[#e63946]" />
                  <span>Filter Jobs</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="rounded-full p-1 text-[#86868b] hover:bg-[#f5f5f7] transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="mb-1.5 block font-bold text-[#1d1d1f]">Job Type</label>
                  <select
                    value={jobTypeFilter}
                    onChange={(e) => setJobTypeFilter(e.target.value)}
                    className="w-full rounded-full border border-black/10 bg-[#f5f5f7] p-3 text-[#1d1d1f] outline-none"
                  >
                    <option>Any</option>
                    <option>Mobile App</option>
                    <option>Web App</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block font-bold text-[#1d1d1f]">Platform</label>
                  <select
                    value={platformFilter}
                    onChange={(e) => setPlatformFilter(e.target.value)}
                    className="w-full rounded-full border border-black/10 bg-[#f5f5f7] p-3 text-[#1d1d1f] outline-none"
                  >
                    <option>Any</option>
                    <option>Android</option>
                    <option>iOS</option>
                    <option>Web App</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block font-bold text-[#1d1d1f]">Minimum Pay: R{minPay}</label>
                  <input
                    type="range"
                    min="0"
                    max="500"
                    step="50"
                    value={minPay}
                    onChange={(e) => setMinPay(parseInt(e.target.value, 10))}
                    className="w-full accent-[#e63946]"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      resetFilters();
                      setIsMobileFilterOpen(false);
                    }}
                    className="flex-1 rounded-full border border-black/10 bg-[#f5f5f7] py-2.5 font-semibold text-[#1d1d1f] hover:bg-slate-200 transition"
                  >
                    Reset All
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="flex-1 rounded-full bg-[#e63946] py-2.5 font-semibold text-white shadow-2xs hover:bg-[#d62828] transition"
                  >
                    Show Results
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
  );
}




