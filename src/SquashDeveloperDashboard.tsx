import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  CircleDollarSign,
  Flame,
  Hexagon,
  MessageSquareText,
  Rocket,
  Search,
  Smartphone,
  Users,
  Bug,
  FileText,
  PlayCircle,
  Star,
  Wallet,
  Wifi,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { getCategoryById, type TestCategoryId } from './components/testCategories';
import { getTestTypeByKey } from './lib/testTypes';
import { useAuth } from './auth';
import { getDeveloperApplications, getDeveloperDashboardSummary, getDeveloperJobs, getDeveloperSubmittedReports, type DeveloperApplication, type DeveloperDashboardSummary, type DeveloperJob, type DeveloperSubmissionReview } from './lib/jobApi';
import { useSupabaseRealtime } from './hooks/useSupabaseRealtime';
import TesterAvatar from './components/TesterAvatar';

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
          accent: 'bg-[#1d1d1f] text-white',
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
        avatarUrl: application.testerAvatarUrl,
        time: new Date(application.createdAt).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' }),
        status: application.status,
      })),
    [databaseApplications],
  );


  const totalLiveBugs = dashboardSummary
    ? Object.values(dashboardSummary.bugCounts).reduce((sum, count) => sum + count, 0)
    : 0;

  const stats = [
    {
      title: 'Active Jobs',
      value: String(dashboardSummary?.activeJobs ?? 0),
      note: 'Open test runs',
      icon: PlayCircle,
      iconBg: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'Assigned Testers',
      value: String(dashboardSummary?.uniqueTesters ?? 0),
      note: 'Across all jobs',
      icon: Users,
      iconBg: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Reports Submitted',
      value: String(dashboardSummary?.submittedReports ?? 0),
      note: 'Awaiting review',
      icon: FileText,
      iconBg: 'bg-amber-50 text-amber-600',
    },
    {
      title: 'Bugs Found',
      value: String(totalLiveBugs),
      note: 'Across all jobs',
      icon: Bug,
      iconBg: 'bg-red-50 text-red-500',
    },
    {
      title: 'Quality Score',
      value: String(dashboardSummary?.averageScore ?? 0),
      note: 'Average score',
      icon: Star,
      iconBg: 'bg-purple-50 text-purple-600',
    },
    {
      title: 'Budget',
      value: formatRand(dashboardSummary?.totalCommittedZar ?? 0),
      note: 'Committed budget',
      icon: Wallet,
      iconBg: 'bg-slate-100 text-slate-700',
    },
  ];

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
      color: 'bg-rose-50 text-[#e63946]',
    })),
    ...databaseJobs.slice(0, 2).map((job) => ({
      text: `${job.title} was posted`,
      time: new Date(job.createdAt).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' }),
      color: 'bg-[#f5f5f7] text-[#1d1d1f]',
    })),
  ];


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

  const useRevampedDashboard = true;
  if (useRevampedDashboard) {
    return (
      <div className="mx-auto max-w-[1500px] space-y-5 pb-8">
        <section className="developer-dashboard-landing-hero relative overflow-hidden rounded-[28px] border border-white/10 p-6 shadow-[0_24px_54px_rgba(20,18,21,0.24)] sm:p-8">
          <div className="pointer-events-none absolute inset-0">
            <img
              src="/hero-bg.jpg"
              alt=""
              className="h-full w-full object-cover object-[center_68%] opacity-95"
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_105%,rgba(230,73,82,0.35),transparent_38%),linear-gradient(100deg,rgba(14,15,18,0.18),rgba(14,15,18,0.04)_52%,rgba(14,15,18,0.24))]" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.025] to-black/10" />
          </div>

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="developer-dashboard-landing-status mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.1)]" />
                Developer workspace active
              </div>
              <h1 className="text-3xl font-bold tracking-[-0.05em] text-white sm:text-4xl">
                <span className="developer-dashboard-landing-title text-white">Good to see you, </span>
                <span className="developer-dashboard-landing-title-accent text-white">{developerFirstName}.</span>
              </h1>
              <p className="developer-dashboard-landing-subtitle mt-2 text-sm text-white/90">Manage test runs, review applicants and move product quality forward.</p>
            </div>

            <div className="flex items-center gap-6 rounded-[24px] bg-[#141519] p-2 pl-6 shadow-xl border border-white/5">
              <div className="hidden text-left sm:block">
                <div className="developer-dashboard-landing-budget-label text-[9px] font-bold uppercase tracking-[0.16em] text-white/60">Committed budget</div>
                <div className="developer-dashboard-landing-budget-value mt-0.5 text-base font-bold tabular-nums text-white">{formatRand(dashboardSummary?.totalCommittedZar ?? 0)}</div>
              </div>
              <Link
                to="/post-job"
                className="inline-flex h-12 items-center gap-2 rounded-[18px] bg-[#f43f5e] px-6 text-sm font-bold text-white shadow-[0_8px_20px_rgba(244,63,94,0.30)] transition hover:-translate-y-0.5 hover:bg-[#e11d48]"
              >
                <Rocket className="h-4 w-4" />
                Launch QA Job
              </Link>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <article key={stat.title} className="flex items-center gap-4 rounded-[20px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-black/[0.03] transition hover:-translate-y-0.5 hover:shadow-md">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] ${stat.iconBg}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-gray-500">{stat.title}</div>
                  <div className="text-xl font-bold text-gray-900 leading-tight">{stat.value}</div>
                  <div className="text-[9px] text-gray-400 mt-0.5">{stat.note}</div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_380px]">
          <div className="space-y-5">
            <section className="overflow-hidden rounded-[22px] border border-white/85 bg-white/70 shadow-[0_14px_34px_rgba(60,55,54,0.07)] backdrop-blur-xl">
              <header className="flex items-center justify-between border-b border-black/[0.05] px-5 py-4">
                <div>
                  <h2 className="font-bold text-[#181817]">QA test runs</h2>
                  <p className="text-[10px] text-[#737a75]">Open and in-progress test runs</p>
                </div>
                <Link to="/developer/jobs" className="rounded-xl border border-black/[0.07] bg-white px-4 py-2.5 text-xs font-semibold shadow-sm transition hover:bg-gray-50">
                  View all runs
                </Link>
              </header>
              <div className="flex flex-col gap-2 p-4">
                {jobs.length ? jobs.map((job) => {
                  const category = getCategoryById(job.categoryId);
                  const CategoryIcon = category.icon;
                  const getCategoryStyles = (name: string) => {
                    if (name.includes('Mobile')) return 'bg-red-50 text-red-500';
                    if (name.includes('Web')) return 'bg-blue-50 text-blue-500';
                    return 'bg-indigo-50 text-indigo-500';
                  };
                  return (
                    <article key={job.id} className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-[20px] border border-black/[0.04] bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-md">
                      {/* Left: Icon & Title */}
                      <div className="flex items-center gap-4 min-w-0 sm:flex-[1.2]">
                        <span className={`grid h-[52px] w-[52px] shrink-0 place-items-center overflow-hidden rounded-[16px] ${getCategoryStyles(category.name)}`}>
                          {job.logoUrl ? (
                            <img src={job.logoUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <CategoryIcon className="h-6 w-6" />
                          )}
                        </span>
                        <div className="min-w-0 pr-4">
                          <h3 className="truncate text-[13px] font-bold text-gray-900">{job.name}</h3>
                          <p className="truncate text-[11px] text-gray-500">{job.type}</p>
                        </div>
                      </div>
                      
                      {/* Center: Stats */}
                      <div className="hidden sm:flex flex-1 items-center justify-center gap-3 xl:gap-8">
                        <div className="flex items-center gap-3 rounded-xl bg-gray-50/80 px-4 py-2 border border-black/[0.03]">
                          <span className="text-gray-400"><Users className="h-4 w-4" /></span>
                          <div>
                            <div className="text-[11px] font-bold text-gray-900 leading-tight">{job.testers.replace(' / ', '/')}</div>
                            <div className="text-[9px] text-gray-400">Testers</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 rounded-xl bg-gray-50/80 px-4 py-2 border border-black/[0.03]">
                          <span className="text-gray-400"><FileText className="h-4 w-4" /></span>
                          <div>
                            <div className="text-[11px] font-bold text-gray-900 leading-tight">{job.submissions.replace(' / ', '/')}</div>
                            <div className="text-[9px] text-gray-400">Submissions</div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center justify-end gap-3 sm:flex-1">
                        <span className="rounded-full bg-emerald-50 px-4 py-1.5 text-[10px] font-bold text-emerald-600">{job.status}</span>
                        <Link to={`/developer/jobs/${job.id}`} className="rounded-xl border border-red-100 bg-red-50 px-5 py-2 text-[11px] font-bold text-red-600 transition hover:bg-red-100 whitespace-nowrap">
                          Open run
                        </Link>
                      </div>
                    </article>
                  );
                }) : (
                  <div className="p-10 text-center text-sm text-[#737a75]">No QA jobs yet.</div>
                )}
              </div>
            </section>
            <section className="grid gap-4 md:grid-cols-2">
              <article className="rounded-[22px] border border-white/85 bg-white/70 p-5 shadow-sm">
                <h2 className="font-bold text-[#181817]">Report snapshot (Demo)</h2>
                
                <div className="mt-4 flex items-start gap-4">
                  {/* Phone mockup */}
                  <div className="relative mt-1 h-[72px] w-[36px] shrink-0 overflow-hidden rounded-[6px] border-[2px] border-gray-800 shadow-sm">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-indigo-600 to-orange-400" />
                    <div className="absolute top-0 left-1/2 h-[4px] w-3 -translate-x-1/2 rounded-b-sm bg-gray-800" />
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[12px] font-bold text-gray-900 leading-tight">Payment button unresponsive on Samsung A13</h3>
                    
                    {/* Specs Grid */}
                    <div className="mt-3 grid grid-cols-4 gap-2">
                      <div>
                        <div className="flex items-center gap-1 text-gray-400">
                          <Smartphone className="h-[10px] w-[10px]" />
                          <span className="text-[9px]">Device</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-gray-700">
                          <Smartphone className="h-3 w-3 text-gray-400" />
                          Samsung A13
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-1 text-gray-400">
                          <Hexagon className="h-[10px] w-[10px]" />
                          <span className="text-[9px]">OS</span>
                        </div>
                        <div className="mt-1 text-[10px] font-semibold text-gray-700">Android 13</div>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-1 text-gray-400">
                          <Wifi className="h-[10px] w-[10px]" />
                          <span className="text-[9px]">Network</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-gray-700">
                          <Wifi className="h-3 w-3 text-gray-400" />
                          MTN 3G
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-1 text-gray-400">
                          <Flame className="h-[10px] w-[10px]" />
                          <span className="text-[9px]">Severity</span>
                        </div>
                        <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-600">
                          <AlertCircle className="h-2.5 w-2.5" />
                          High
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="mt-4 text-[10px] text-gray-500 leading-relaxed">
                  The payment button does not respond after multiple taps.<br/>
                  Steps to reproduce and expected result included in full report.
                </p>
              </article>
              <article className="rounded-[22px] border border-white/85 bg-white/70 p-5 shadow-sm"><h2 className="font-bold">Review health</h2><div className="mt-5 relative z-0 flex items-center justify-between px-2 text-center"><div className="absolute left-[15%] right-[15%] top-6 h-[1px] -translate-y-1/2 border-t border-dashed border-gray-200 -z-10" /><div className="flex flex-col items-center px-2"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><Users className="h-5 w-5" /></span><strong className="mt-2 text-lg text-gray-900">{dashboardSummary?.totalApplications ?? 0}</strong><span className="text-[10px] text-gray-500">Applied</span></div><div className="flex flex-col items-center px-2"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-500"><Search className="h-5 w-5" /></span><strong className="mt-2 text-lg text-gray-900">{dashboardSummary?.submittedReports ?? 0}</strong><span className="text-[10px] text-gray-500">Reviewing</span></div><div className="flex flex-col items-center px-2"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-500"><CheckCircle2 className="h-5 w-5" /></span><strong className="mt-2 text-lg text-gray-900">{dashboardSummary?.approvedReports ?? 0}</strong><span className="text-[10px] text-gray-500">Approved</span></div></div><p className="mt-4 text-center text-[9px] text-gray-400">Keep reviews moving to maintain quality momentum.</p></article>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-[24px] border border-white/85 bg-white/70 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-[17px] font-bold text-[#181817]">Applicant inbox</h2>
                <Users className="h-5 w-5 text-[#238554]" />
              </div>
              <div className="mb-4 mt-1 flex items-center justify-between">
                <p className="text-[11px] text-gray-500">Newest tester activity</p>
                <Link to="/developer/applications" className="flex items-center gap-0.5 text-[11px] font-semibold text-[#238554] hover:underline">
                  View all <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="flex flex-col gap-2">
                {liveApplications.map((application) => {
                  const getInitials = (name: string) => {
                    const parts = name.trim().split(' ');
                    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
                    return name.substring(0, 2).toUpperCase();
                  };
                  const getAvatarColor = (name: string) => {
                    const colors = [
                      'bg-red-50 text-red-600',
                      'bg-emerald-50 text-emerald-600',
                      'bg-purple-50 text-purple-600',
                      'bg-orange-50 text-orange-600',
                      'bg-blue-50 text-blue-600',
                    ];
                    let hash = 0;
                    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
                    return colors[hash % colors.length];
                  };
                  const getStatusBadge = (status: string) => {
                    const s = status.toLowerCase();
                    const capitalized = status.charAt(0).toUpperCase() + status.slice(1);
                    
                    if (s === 'new' || s === 'pending') {
                      return <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700"><div className="h-[5px] w-[5px] rounded-full bg-emerald-500" />{capitalized}</span>;
                    }
                    if (s === 'reviewing') {
                      return <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-600"><Clock3 className="h-3.5 w-3.5" />Reviewing</span>;
                    }
                    if (s === 'shortlisted' || s === 'accepted') {
                      return <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" />{capitalized}</span>;
                    }
                    if (s === 'rejected') {
                      return <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-[11px] font-bold text-red-600"><div className="h-[5px] w-[5px] rounded-full bg-red-500" />{capitalized}</span>;
                    }
                    return <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-[11px] font-bold text-gray-600">{status}</span>;
                  };

                  const isNew = application.status.toLowerCase() === 'new' || application.status.toLowerCase() === 'pending';

                  return (
                    <Link 
                      key={`${application.app}-${application.tester}-${application.time}`} 
                      to="/developer/applications" 
                      className={`flex items-center gap-4 rounded-[16px] bg-white p-3 border transition hover:-translate-y-0.5 hover:shadow-sm ${isNew ? 'border-y-black/[0.04] border-r-black/[0.04] border-l-[3px] border-l-[#238554]' : 'border-black/[0.04]'}`}
                    >
                      <div className="relative shrink-0">
                        {application.avatarUrl ? (
                          <img src={application.avatarUrl} alt={application.tester} className="h-[42px] w-[42px] rounded-full object-cover shadow-sm" />
                        ) : (
                          <div className={`flex h-[42px] w-[42px] items-center justify-center rounded-full text-[13px] font-bold ${getAvatarColor(application.tester)}`}>
                            {getInitials(application.tester)}
                          </div>
                        )}
                        {isNew && (
                          <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[#238554]" />
                        )}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <strong className="block truncate text-[13px] text-gray-900">{application.tester}</strong>
                        <span className="block truncate text-[11px] text-gray-500 mt-0.5">{application.app}</span>
                      </div>

                      <div className="hidden sm:block">
                        {getStatusBadge(application.status)}
                      </div>

                      <div className="text-[12px] font-medium text-gray-500 sm:ml-2">
                        {application.time}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

          </aside>
        </section>
      </div>
    );
  }

  return (
    <div className="developer-dashboard tester-dashboard space-y-6">
      {/* Linear/Vercel Dark Studio Command & Telemetry Header */}
      <div className="developer-dashboard-hero relative overflow-hidden rounded-[28px] p-6 sm:p-8 animate-fade-up">
        {/* Soft Ambient Radial Background Glows */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-[#e63946]/15 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-[-0.045em] text-[#17201b]">
                Good to see you, {developerFirstName}.
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                Developer workspace active
              </span>
            </div>
            <p className="mt-1.5 text-xs sm:text-sm text-zinc-400 font-normal leading-relaxed max-w-2xl">
              Crowdsourced testing workspace • South Africa real-device QA telemetry & tester management.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-2xl bg-white/55 px-3.5 py-2 text-xs font-semibold text-[#5f6c63] border border-white/75 backdrop-blur-md">
              <span className="text-zinc-500">⌘K</span>
              <span>Command Menu</span>
            </div>
            <a
              href="/post-job"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#173b2a] px-5 py-3 text-xs font-extrabold text-white shadow-[0_10px_22px_rgba(23,59,42,0.22)] hover:bg-[#0f2d1e] transition active:scale-98"
            >
              + Launch QA Job
            </a>
          </div>
        </div>

        {/* Live Telemetry Chips Bar */}
        <div className="mt-6 flex flex-wrap items-center gap-2.5 pt-5 border-t border-white/70 text-[11px] font-semibold text-[#5f6c63]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/55 px-3 py-1.5 border border-white/75">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> 12 Active QA Testers Online
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/55 px-3 py-1.5 border border-white/75">
            ⚡ 24ms Vodacom LTE / MTN 5G
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/55 px-3 py-1.5 border border-white/75">
            🇿🇦 Real-Device Mobile & Web QA
          </span>
        </div>
      </div>

      {/* Modern Asymmetric Bento KPI Grid with Sparklines */}
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4 animate-fade-up-delayed">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="developer-dashboard-metric tester-dashboard-stat squash-panel min-h-[132px] p-4 sm:p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#86868b]">
                    {stat.title}
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#09090b] text-white shadow-md">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                </div>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tracking-apple-tight text-[#09090b]">
                    {stat.value}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#86868b] font-medium leading-tight">{stat.note}</p>
              </div>

              {/* No per-card trend is available: dashboardSummary.trend is one
                  7-day submissions series (rendered as the sparkline above),
                  not a per-stat comparison. This row used to render stat.trend,
                  which was never defined on these objects -- so every card
                  showed a green upward arrow with no figure beside it,
                  regardless of whether the number had moved at all. */}
              <div className="mt-4 flex items-center justify-end pt-3 border-t border-black/[0.04]">
                <span className="text-[10px] font-extrabold text-[#86868b] uppercase tracking-wider">
                  Live KPI
                </span>
              </div>
            </div>
          );
        })}
      </section>

      {/* High-Density Data Grid & Recent Submissions Bento Section */}
      <section className="grid gap-4 xl:grid-cols-[1.8fr_0.9fr]">
        {/* Main Active Jobs Data Grid (Vercel / Linear style) */}
        <div className="rounded-3xl bg-white/80 backdrop-blur-2xl border border-black/[0.06] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/[0.06] px-6 py-4.5 bg-[#f5f5f7]/40">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-extrabold tracking-apple-tight text-[#09090b]">
                Active Jobs & QA Testing Runs
              </h2>
              <span className="rounded-full bg-[#09090b] text-white px-3 py-0.5 text-xs font-extrabold shadow-2xs">
                {databaseJobs.length} Live Runs
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={tierFilter}
                  onChange={(e) =>
                    setTierFilter(e.target.value as 'All' | 'Verified+' | 'Pro+' | 'Elite Only')
                  }
                  className="appearance-none rounded-full border border-black/10 bg-white px-3.5 py-1.5 pr-8 text-xs font-semibold text-[#09090b] outline-none hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                >
                  <option>All Tiers</option>
                  <option>Verified+</option>
                  <option>Pro+</option>
                  <option>Elite Only</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#86868b]" />
              </div>
              <a
                href="/developer/jobs"
                className="rounded-full border border-black/10 bg-white px-4 py-1.5 text-xs font-semibold text-[#09090b] hover:bg-slate-50 transition active:scale-98 shadow-2xs"
              >
                Manage All →
              </a>
            </div>
          </div>

          {jobsError ? (
            <div className="border-b border-red-100 bg-red-50 px-6 py-2.5 text-xs font-semibold text-red-600">
              {jobsError}
            </div>
          ) : null}

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-black/[0.06] text-left text-[10px] font-extrabold text-[#86868b] uppercase tracking-wider bg-[#f5f5f7]/60">
                  <th className="px-6 py-3.5 font-extrabold">App / QA Job</th>
                  <th className="px-6 py-3.5 font-extrabold">Category</th>
                  <th className="px-6 py-3.5 font-extrabold">Testers</th>
                  <th className="px-6 py-3.5 font-extrabold">Status</th>
                  <th className="px-6 py-3.5 font-extrabold">Submissions</th>
                  <th className="px-6 py-3.5 font-extrabold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06]">
                {jobs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-xs font-semibold text-[#86868b]">
                      No active jobs posted. Create your first testing run to receive real-device telemetry.
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => {
                    const category = getCategoryById(job.categoryId);
                    const CategoryIcon = category.icon;
                    return (
                      <tr key={job.name} className="hover:bg-[#f5f5f7]/60 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3.5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#09090b] text-white font-extrabold text-xs shadow-md">
                              {job.logoUrl ? (
                                <img src={job.logoUrl} alt={`${job.name} logo`} className="h-full w-full object-cover" />
                              ) : (
                                job.name.charAt(0)
                              )}
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm font-extrabold text-[#09090b]">{job.name}</div>
                              <div className="text-[11px] text-[#86868b] font-medium">{job.type}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.06] bg-[#f5f5f7] px-3 py-1 text-xs font-semibold text-[#09090b]">
                            <CategoryIcon className="h-3.5 w-3.5" style={{ color: category.color }} />
                            {category.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-extrabold text-[#09090b]">
                          {job.testers}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {job.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-extrabold text-[#09090b]">
                          <div className="flex items-center gap-2">
                            <span>{job.submissions}</span>
                            <div className="h-1.5 w-20 rounded-full bg-[#f5f5f7] overflow-hidden">
                              <div
                                className="h-1.5 rounded-full bg-[#09090b]"
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
                        <td className="px-6 py-4 text-right">
                          <Link
                            to={job.id ? `/developer/jobs/${job.id}` : '/developer/jobs'}
                            className="rounded-full bg-[#09090b] hover:bg-black text-white px-4 py-1.5 text-xs font-bold shadow-md transition active:scale-98 inline-flex items-center gap-1"
                          >
                            Manage Run →
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Submissions Crowdsourced Feed Panel */}
        <div className="rounded-3xl bg-white/80 backdrop-blur-2xl border border-black/[0.06] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4.5 bg-[#f5f5f7]/40">
              <h2 className="text-base font-extrabold tracking-apple-tight text-[#09090b]">
                Live Tester Telemetry
              </h2>
              <Link
                to="/developer/submissions"
                className="rounded-full border border-black/10 bg-white px-3.5 py-1 text-xs font-semibold text-[#09090b] hover:bg-slate-50 transition active:scale-98 shadow-2xs"
              >
                View Feed →
              </Link>
            </div>

            <div className="space-y-3 p-4">
              {liveApplications.length > 0 ? (
                liveApplications.map((application) => (
                  <Link
                    key={`${application.app}-${application.tester}-${application.time}`}
                    to="/developer/submissions"
                    className="flex items-center justify-between gap-3 rounded-2xl border border-black/[0.06] bg-[#f5f5f7]/60 p-3.5 transition hover:bg-white hover:shadow-md"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <TesterAvatar name={application.tester} avatarUrl={application.avatarUrl} className="h-9 w-9 rounded-2xl shadow-sm" />
                      <div className="min-w-0">
                        <div className="truncate text-xs font-extrabold text-[#09090b]">
                          {application.app}
                        </div>
                        <div className="text-[11px] text-[#86868b] font-medium truncate">
                          Tester: {application.tester}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className="rounded-full bg-rose-50 border border-rose-100 px-2.5 py-0.5 text-[9px] font-extrabold uppercase text-[#e63946]">
                        {application.status}
                      </span>
                      <span className="text-[10px] text-[#86868b] font-medium">{application.time}</span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-black/10 bg-[#f5f5f7]/50 px-4 py-8 text-center text-xs font-semibold text-[#86868b]">
                  No live tester submissions yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Telemetry & Analytics Grid */}
      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.2fr_0.9fr]">
        {/* Bug Severity Telemetry Card */}
        <div className="rounded-3xl bg-white/80 backdrop-blur-2xl border border-black/[0.06] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="text-base font-extrabold tracking-apple-tight text-[#09090b]">
            Bug Severity Breakdown
          </div>
          <div className="mt-5 flex items-center justify-center">
            <div className="relative flex h-36 w-36 items-center justify-center rounded-full bg-[#09090b] shadow-xl p-3">
              <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white text-center shadow-inner">
                <div className="text-2xl font-extrabold text-[#09090b]">{totalLiveBugs}</div>
                <div className="text-[9px] font-extrabold text-[#86868b] uppercase tracking-wider">
                  Total Bugs
                </div>
              </div>
            </div>
          </div>
          <div className="mt-5 space-y-2.5">
            {bugSummary.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                  <span className="text-[#86868b]">{item.label}</span>
                </div>
                <span className="font-extrabold text-[#09090b]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Submissions Trend Area Chart */}
        <div className="rounded-3xl bg-white/80 backdrop-blur-2xl border border-black/[0.06] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center justify-between">
            <div className="text-base font-extrabold tracking-apple-tight text-[#09090b]">
              Submissions Telemetry
            </div>
            <span className="rounded-full bg-[#f5f5f7] border border-black/[0.06] px-3 py-1 text-xs font-semibold text-[#09090b]">
              7-Day Trend
            </span>
          </div>

          <div className="mt-4 rounded-2xl border border-black/[0.06] bg-[#f5f5f7]/60 p-4">
            <div className="h-32">
              <svg viewBox="0 0 100 100" className="h-full w-full">
                <defs>
                  <linearGradient id="submissionTrendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#09090b" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#09090b" stopOpacity="0.01" />
                  </linearGradient>
                </defs>
                <polyline points={trendAreaPoints} fill="url(#submissionTrendFill)" stroke="none" />
                <polyline
                  points={trendPoints}
                  fill="none"
                  stroke="#09090b"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {submissionTrendValues.map((value, index) => {
                  const x = (index / (submissionTrendValues.length - 1)) * 100;
                  const y = 100 - (value / trendMax) * 100;
                  return (
                    <circle key={`${value}-${index}`} cx={x} cy={y} r="2.5" fill="#09090b" />
                  );
                })}
              </svg>
            </div>
            <div className="mt-2 grid grid-cols-7 text-center text-[10px] font-extrabold text-[#86868b]">
              {submissionTrendLabels.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              [String(dashboardSummary?.totalApplications ?? 0), 'Applications', 'text-[#09090b]'],
              [String(dashboardSummary?.submittedReports ?? 0), 'In Review', 'text-amber-600'],
              [String(dashboardSummary?.approvedReports ?? 0), 'Approved', 'text-emerald-600'],
              [`${dashboardSummary?.averageScore ?? 0}/100`, 'Avg Score', 'text-[#09090b]'],
            ].map(([value, label, color]) => (
              <div key={label} className="rounded-2xl bg-[#f5f5f7] p-3 text-center border border-black/[0.04]">
                <div className={`text-lg font-extrabold ${color}`}>{value}</div>
                <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-[#86868b]">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Log */}
        <div className="rounded-3xl bg-white/80 backdrop-blur-2xl border border-black/[0.06] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center justify-between">
            <div className="text-base font-extrabold tracking-apple-tight text-[#09090b]">
              Activity Feed
            </div>
            <a href="/developer/activity" className="text-xs font-semibold text-[#86868b] hover:text-[#09090b]">
              View All →
            </a>
          </div>

          <div className="mt-4 space-y-3">
            {dashboardActivity.length > 0 ? (
              dashboardActivity.map((item) => {
                const ActivityIcon = getActivityIcon(item.text);
                return (
                  <div key={item.text} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-[#09090b] text-white shadow-2xs">
                      <ActivityIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-extrabold text-[#09090b] leading-snug">{item.text}</div>
                      <div className="mt-0.5 text-[10px] text-[#86868b] font-medium">{item.time}</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-black/10 bg-[#f5f5f7]/50 px-4 py-8 text-center text-xs font-semibold text-[#86868b]">
                No live activity recorded yet.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
