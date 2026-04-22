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
import { useMemo, useState } from 'react';

type Severity = 'Critical' | 'High' | 'Medium' | 'Low';

export default function SquashTesterJobBoard() {
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

  const navItems = [
    { label: 'Dashboard', icon: Home, href: '/tester-jobs' },
    { label: 'Available Jobs', icon: BriefcaseBusiness, href: '/tester-jobs', active: true },
    { label: 'My Tests', icon: ClipboardList, href: '/active-test' },
    { label: 'Reports', icon: ClipboardList, href: '/active-test' },
    { label: 'Earnings', icon: CircleDollarSign, href: '/active-test' },
    { label: 'Profile', icon: UserCircle2, href: '/active-test' },
    { label: 'Settings', icon: Settings, href: '/active-test' },
  ];

  const tabs = [
    { label: 'All Jobs', count: 128, active: true },
    { label: 'Mobile Apps', count: 68 },
    { label: 'Web Apps', count: 34 },
    { label: 'Games', count: 12 },
    { label: 'APIs', count: 14 },
  ];

  const jobs: Array<{
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
  }> = [
    {
      name: 'FitTrack Mobile',
      description: 'Fitness tracking app for workouts and goals.',
      tags: ['Android', 'Mobile App', 'Health & Fitness'],
      type: 'Usability Test',
      time: '5 - 10 min',
      deadline: '25 May 2024',
      severity: 'Critical',
      pay: 'R90',
      testers: '25 testers',
      posted: '2 hours ago',
      badge: 'New',
      accent: 'bg-slate-900 text-white',
    },
    {
      name: 'PayFlow Web App',
      description: 'Payment management dashboard for businesses.',
      tags: ['Web App', 'Fintech', 'Dashboard'],
      type: 'Usability Test',
      time: '10 - 15 min',
      deadline: '26 May 2024',
      severity: 'High',
      pay: 'R120',
      testers: '15 testers',
      posted: '4 hours ago',
      badge: 'Featured',
      accent: 'bg-violet-500 text-white',
    },
    {
      name: 'HealthApp iOS',
      description: 'Health & wellness companion for iOS users.',
      tags: ['iOS', 'Mobile App', 'Health & Fitness'],
      type: 'Bug Hunt',
      time: '15 - 20 min',
      deadline: '27 May 2024',
      severity: 'Medium',
      pay: 'R80',
      testers: '30 testers',
      posted: '6 hours ago',
      badge: '',
      accent: 'bg-emerald-600 text-white',
    },
    {
      name: 'GameZone Web',
      description: 'Online gaming platform for casual gamers.',
      tags: ['Web App', 'Gaming', 'Entertainment'],
      type: 'Exploratory Test',
      time: '10 - 15 min',
      deadline: '28 May 2024',
      severity: 'Low',
      pay: 'R100',
      testers: '10 testers',
      posted: '8 hours ago',
      badge: '',
      accent: 'bg-slate-800 text-white',
    },
    {
      name: 'ShopEasy Android',
      description: 'E-commerce app for a seamless shopping experience.',
      tags: ['Android', 'Mobile App', 'E-commerce'],
      type: 'Usability Test',
      time: '10 - 15 min',
      deadline: '29 May 2024',
      severity: 'Medium',
      pay: 'R90',
      testers: '20 testers',
      posted: 'Yesterday',
      badge: '',
      accent: 'bg-red-500 text-white',
    },
  ];

  const topTesters = [
    { name: 'Lerato D.', level: 'Level 5', total: 'R15,430' },
    { name: 'Sipho N.', level: 'Level 4', total: 'R12,210' },
    { name: 'Thando M.', level: 'Level 3', total: 'R9,870' },
  ];

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
      if (activeTab === 'Mobile Apps') {
        result = result.filter((job) => job.tags.includes('Mobile App'));
      }
      if (activeTab === 'Web Apps') {
        result = result.filter((job) => job.tags.includes('Web App'));
      }
      if (activeTab === 'Games') {
        result = result.filter((job) => job.tags.includes('Gaming'));
      }
      if (activeTab === 'APIs') {
        result = result.filter((job) => job.type.toLowerCase().includes('api'));
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
              <a href="/active-test" className="mt-4 inline-block text-sm font-semibold text-green-700">View Profile -&gt;</a>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-lg font-bold text-slate-900">Love testing?</div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Refer a friend and earn R100 when they complete a test.
              </p>
              <a href="/active-test" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-green-700">
                <Gift className="h-4 w-4" /> Refer Now -&gt;
              </a>
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button className="rounded-xl border border-slate-300 p-2.5 text-slate-600 lg:hidden">
                    <Menu className="h-5 w-5" />
                  </button>
                  <div className="hidden max-w-xl flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:flex md:min-w-[320px] lg:min-w-[420px]">
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
                  <button className="relative rounded-full border border-slate-200 p-2.5 text-slate-600">
                    <Bell className="h-5 w-5" />
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      2
                    </span>
                  </button>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <UserCircle2 className="h-7 w-7" />
                    </div>
                    <div className="hidden sm:block">
                      <div className="text-sm font-bold text-slate-900">Thando M.</div>
                      <div className="text-xs text-slate-500">Tester</div>
                    </div>
                  </div>
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

            <div className="mt-8 flex flex-wrap gap-3">
              {tabs.map((tab) => (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => setActiveTab(tab.label)}
                  className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
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

            <div className="mt-8 space-y-5">
              {filteredJobs.map((job) => (
                <div key={job.name} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex gap-4">
                      <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold ${job.accent}`}>
                        {job.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-2xl font-bold text-slate-900">{job.name}</h2>
                          {job.badge ? (
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${job.badge === 'New' ? 'bg-green-100 text-green-700' : 'bg-sky-100 text-sky-700'}`}>
                              {job.badge}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-slate-600">{job.description}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {job.tags.map((tag) => (
                            <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row items-end justify-between gap-4 lg:min-w-[180px] lg:flex-col lg:items-end">
                      <div className="text-right">
                        <div className="text-3xl font-black text-green-700">{job.pay}</div>
                        <div className="text-sm text-slate-500">per tester</div>
                        <div className="mt-1 text-sm text-slate-500">{job.testers}</div>
                      </div>
                      <a href="/active-test" className="rounded-2xl bg-green-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-green-700">
                        Apply Now
                      </a>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 text-sm text-slate-600 md:grid-cols-5">
                    <div>
                      <div className="font-semibold text-slate-900">{job.type}</div>
                      <div className="mt-1">Test Type</div>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{job.time}</div>
                      <div className="mt-1">Est. Time</div>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{job.deadline}</div>
                      <div className="mt-1">Deadline</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${severityDotClasses[job.severity]}`} />
                      <div>
                        <div className={`font-semibold ${severityClasses[job.severity]}`}>{job.severity}</div>
                        <div className="mt-1 text-slate-500">Priority</div>
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{job.posted}</div>
                      <div className="mt-1">Posted</div>
                    </div>
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
                  <button
                    key={`${item}-${index}`}
                    className={`flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold ${
                      item === '1'
                        ? 'border-green-600 bg-green-600 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {item}
                  </button>
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
                      <div className="text-xs text-slate-500">{tester.level}</div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-slate-700">{tester.total}</div>
                </div>
              ))}
            </div>
            <a href="/active-test" className="mt-4 inline-block text-sm font-semibold text-green-700">View Leaderboard -&gt;</a>
          </div>
        </aside>
      </div>
    </div>
  );
}
