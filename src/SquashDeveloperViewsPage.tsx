import {
  ArrowUpRight,
  Briefcase,
  Bug,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  Inbox,
  LayoutGrid,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Star,
  UserCircle2,
  Users,
  Video,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import TesterBadge from './components/TesterBadge';
import TesterAvatar from './components/TesterAvatar';
import { getCategoryById, type TestCategoryId } from './components/testCategories';
import { useAuth } from './auth';
import {
  getDeveloperJobs,
  type DeveloperJob,
  getDeveloperApplications,
  getDeveloperSubmittedReports,
  reviewDeveloperApplication,
  type DeveloperApplication,
  type DeveloperSubmissionReview,
  getDeveloperAttachments,
  type DeveloperAttachment,
} from './lib/jobApi';
import { getSpecializationLabel } from './components/testerSpecializations';

function DeveloperShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  active?: 'dashboard' | 'jobs' | 'applications' | 'reports' | 'billing';
  children: ReactNode;
}) {
  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white/70 backdrop-blur-xl p-5 rounded-2xl border border-black/[0.06] shadow-2xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-apple-tight text-[#1d1d1f]">{title}</h1>
          <p className="mt-1 text-xs sm:text-sm text-[#86868b] font-normal leading-relaxed">{subtitle}</p>
        </div>
        <a
          href="/post-job"
          className="squash-btn-primary w-fit"
        >
          + Post a New Job
        </a>
      </div>
      {children}
    </>
  );
}

// ----------------------------------------------------------------------
// 1. JOBS PAGE
// ----------------------------------------------------------------------
export function SquashDeveloperJobsPage() {
  const { session } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [databaseJobs, setDatabaseJobs] = useState<DeveloperJob[]>([]);
  const [applications, setApplications] = useState<DeveloperApplication[]>([]);
  const [reports, setReports] = useState<DeveloperSubmissionReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [jobFilter, setJobFilter] = useState<'all' | 'active' | 'draft' | 'completed'>('all');
  const [jobQuery, setJobQuery] = useState('');

  useEffect(() => {
    if (!session?.userId || !session.roles.includes('developer')) return;

    let mounted = true;
    setLoading(true);

    Promise.all([
      getDeveloperJobs(session.userId),
      getDeveloperApplications(session.userId),
      getDeveloperSubmittedReports(session.userId),
    ])
      .then(([jobItems, appItems, reportItems]) => {
        if (!mounted) return;
        setDatabaseJobs(jobItems);
        setApplications(appItems);
        setReports(reportItems);
      })
      .catch((err: Error) => {
        if (mounted) setError(err.message || 'Could not load your jobs.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [session?.userId, session?.roles]);

  const jobs = useMemo(
    () =>
      databaseJobs.map((job) => {
        const acceptedTesters = applications.filter((a) => a.jobId === job.id && a.status === 'accepted').length;
        const submittedReports = reports.filter((r) => r.jobId === job.id).length;
        return {
          id: job.id,
          name: job.title,
          type: job.platform,
          testers: `${acceptedTesters} / ${job.testersNeeded}`,
          status: job.status === 'draft' ? 'Draft' : job.status === 'active' ? 'Open' : job.status === 'completed' ? 'Completed' : 'Reviewing',
          isDraft: job.status === 'draft',
          deadline: new Date(job.createdAt).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }),
          submissions: `${submittedReports} / ${job.testersNeeded}`,
          logoUrl: job.logoUrl,
          categoryId: job.category as TestCategoryId,
        };
      }),
    [databaseJobs, applications, reports],
  );

  const filteredJobs = useMemo(() => {
    const normalizedQuery = jobQuery.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        job.name.toLowerCase().includes(normalizedQuery) ||
        job.type.toLowerCase().includes(normalizedQuery) ||
        getCategoryById(job.categoryId).name.toLowerCase().includes(normalizedQuery);
      const matchesFilter =
        jobFilter === 'all' ||
        (jobFilter === 'active' && (job.status === 'Open' || job.status === 'Reviewing')) ||
        (jobFilter === 'draft' && job.status === 'Draft') ||
        (jobFilter === 'completed' && job.status === 'Completed');

      return matchesQuery && matchesFilter;
    });
  }, [jobFilter, jobQuery, jobs]);

  const activeJobCount = jobs.filter((job) => job.status === 'Open' || job.status === 'Reviewing').length;
  const draftJobCount = jobs.filter((job) => job.status === 'Draft').length;
  const acceptedTesterCount = applications.filter((application) => application.status === 'accepted').length;
  const pendingApplicationCount = applications.filter((application) => application.status === 'pending').length;

  const useRevampedJobsPage = true;
  if (useRevampedJobsPage) {
    const filters = [
      { id: 'all', label: 'All jobs', count: jobs.length },
      { id: 'active', label: 'Active', count: activeJobCount },
      { id: 'draft', label: 'Drafts', count: draftJobCount },
      { id: 'completed', label: 'Completed', count: jobs.filter((job) => job.status === 'Completed').length },
    ] as const;

    return (
      <div className="mx-auto max-w-[1500px] space-y-5 pb-10">
        <section className="developer-ambient-hero relative overflow-hidden rounded-[28px] border border-white/80 bg-[linear-gradient(112deg,#fee7e1_0%,#fffaf6_43%,#e0efe7_72%,#b9d8c5_100%)] px-6 py-7 shadow-[0_24px_70px_rgba(31,47,38,0.12)] sm:px-8 sm:py-9">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#1c5b42]/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-[#ef8e82]/20 blur-3xl" />
          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="developer-ambient-glass developer-ambient-eyebrow mb-4 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-[#315946] shadow-sm backdrop-blur-xl">
                <span className="developer-ambient-eyebrow-icon flex h-6 w-6 items-center justify-center rounded-full bg-[#174b37] text-white">
                  <Briefcase className="h-3.5 w-3.5" />
                </span>
                QA job portfolio
              </div>
              <h1 className="max-w-xl text-3xl font-black tracking-[-0.045em] text-[#182019] sm:text-4xl">
                Your testing work,
                <span className="block text-[#235d45]">organised in one place.</span>
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#526159]">
                Track hiring, tester capacity and submitted reports without losing sight of the next action.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="developer-ambient-glass developer-ambient-status-card rounded-2xl border border-white/80 bg-white/65 px-5 py-3.5 text-right shadow-sm backdrop-blur-xl">
                <div className="developer-ambient-status-label text-[10px] font-bold uppercase tracking-[0.18em] text-[#6f7b74]">Workspace status</div>
                <div className="developer-ambient-status-value mt-1 flex items-center justify-end gap-2 text-sm font-extrabold text-[#173f2f]">
                  <span className="h-2 w-2 rounded-full bg-[#20bf7a] shadow-[0_0_0_4px_rgba(32,191,122,0.12)]" />
                  {activeJobCount} live {activeJobCount === 1 ? 'run' : 'runs'}
                </div>
              </div>
              <Link
                to="/post-job"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#173f2f] px-5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(23,63,47,0.22)] transition hover:-translate-y-0.5 hover:bg-[#0f3224] focus:outline-none focus:ring-2 focus:ring-[#173f2f]/30"
              >
                <Plus className="h-4 w-4" />
                Create a test job
              </Link>
            </div>
          </div>
        </section>

        {searchParams.get('saved') === 'draft' ? (
          <div className="flex items-center gap-3 rounded-2xl border border-[#e6c991] bg-[#fff7e8] px-4 py-3 text-xs font-semibold text-[#78521c] shadow-sm">
            <Clock3 className="h-4 w-4 shrink-0" />
            Job draft saved securely. It remains private until funding is enabled.
          </div>
        ) : null}

        <section aria-label="Job portfolio summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Live test runs', value: activeJobCount, note: `${jobs.length} total jobs`, icon: Briefcase, tint: 'bg-[#e6f3ec] text-[#18543d]' },
            { label: 'Accepted testers', value: acceptedTesterCount, note: `${pendingApplicationCount} awaiting review`, icon: Users, tint: 'bg-[#ece9f8] text-[#594693]' },
            { label: 'Reports received', value: reports.length, note: 'Ready for QA review', icon: ClipboardCheck, tint: 'bg-[#fff0de] text-[#a65a18]' },
            { label: 'Saved drafts', value: draftJobCount, note: draftJobCount === 0 ? 'Nothing left unfinished' : 'Continue when ready', icon: FileText, tint: 'bg-[#fde8e7] text-[#a9443d]' },
          ].map((metric) => {
            const MetricIcon = metric.icon;
            return (
              <article key={metric.label} className="rounded-[22px] border border-white/90 bg-white/75 p-4 shadow-[0_14px_36px_rgba(39,52,44,0.07)] backdrop-blur-xl">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7d8680]">{metric.label}</p>
                    <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#1c221e]">{metric.value}</p>
                  </div>
                  <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${metric.tint}`}>
                    <MetricIcon className="h-4.5 w-4.5" />
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#7a837e]">{metric.note}</p>
              </article>
            );
          })}
        </section>

        <section className="overflow-hidden rounded-[26px] border border-white/90 bg-white/70 shadow-[0_22px_60px_rgba(41,53,46,0.09)] backdrop-blur-xl">
          <div className="border-b border-[#dde5df] px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#173f2f] text-white">
                    <LayoutGrid className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-lg font-black tracking-[-0.025em] text-[#1d241f]">Job workspace</h2>
                    <p className="text-xs text-[#7a837e]">Open a job to manage its full testing lifecycle.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <label className="relative block min-w-0 md:w-72">
                  <span className="sr-only">Search jobs</span>
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b948f]" />
                  <input
                    value={jobQuery}
                    onChange={(event) => setJobQuery(event.target.value)}
                    placeholder="Search job or category"
                    className="h-11 w-full rounded-2xl border border-[#dfe6e1] bg-white/90 pl-10 pr-4 text-xs font-medium text-[#1d241f] outline-none transition placeholder:text-[#9ca39f] focus:border-[#4c8068] focus:ring-4 focus:ring-[#4c8068]/10"
                  />
                </label>
                <div className="flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-[#dfe6e1] bg-[#f5f7f5] p-1">
                  {filters.map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setJobFilter(filter.id)}
                      aria-pressed={jobFilter === filter.id}
                      className={`whitespace-nowrap rounded-xl px-3 py-2 text-[11px] font-bold transition ${
                        jobFilter === filter.id
                          ? 'bg-[#173f2f] text-white shadow-sm'
                          : 'text-[#66716b] hover:bg-white hover:text-[#1d241f]'
                      }`}
                    >
                      {filter.label} <span className="ml-1 opacity-70">{filter.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {[0, 1].map((item) => (
                  <div key={item} className="h-72 animate-pulse rounded-[22px] bg-[#edf1ee]" />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-[22px] border border-[#f1c7c4] bg-[#fff0ef] p-8 text-center text-sm font-semibold text-[#9d3935]">{error}</div>
            ) : filteredJobs.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center rounded-[22px] border border-dashed border-[#cfd9d2] bg-[#f7f9f7] px-6 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e4eee8] text-[#245943]">
                  <Briefcase className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg font-black text-[#1d241f]">{jobs.length === 0 ? 'Create your first test job' : 'No jobs match this view'}</h3>
                <p className="mt-1 max-w-sm text-sm text-[#7a837e]">
                  {jobs.length === 0 ? 'Launch a structured QA run and start matching with qualified testers.' : 'Try another filter or clear your search to see more jobs.'}
                </p>
                {jobs.length === 0 ? (
                  <Link to="/post-job" className="squash-hover-action mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#173f2f] px-5 py-3 text-xs font-bold text-white">
                    <Plus className="h-4 w-4" /> Create a test job
                  </Link>
                ) : null}
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {filteredJobs.map((job) => {
                  const category = getCategoryById(job.categoryId);
                  const CategoryIcon = category.icon;
                  const [testerCount, testerTarget] = job.testers.split(' / ').map(Number);
                  const [reportCount, reportTarget] = job.submissions.split(' / ').map(Number);
                  const testerProgress = testerTarget > 0 ? Math.min((testerCount / testerTarget) * 100, 100) : 0;
                  const reportProgress = reportTarget > 0 ? Math.min((reportCount / reportTarget) * 100, 100) : 0;
                  const statusClass =
                    job.status === 'Open'
                      ? 'border-[#b9e6d0] bg-[#e8f8ef] text-[#167049]'
                      : job.status === 'Draft'
                        ? 'border-[#e8d5ad] bg-[#fff7e6] text-[#8a5a16]'
                        : job.status === 'Completed'
                          ? 'border-[#d8d2ef] bg-[#f0edfa] text-[#66549b]'
                          : 'border-[#cbdde9] bg-[#edf6fb] text-[#356a87]';

                  return (
                    <article key={job.id} className="group flex min-h-72 flex-col rounded-[24px] border border-[#dfe6e1] bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(247,250,248,0.92))] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#b9cabf] hover:shadow-[0_20px_45px_rgba(33,55,43,0.11)] sm:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3.5">
                          {job.logoUrl ? (
                            <img src={job.logoUrl} alt="" className="h-12 w-12 shrink-0 rounded-2xl border border-[#dfe6e1] object-cover shadow-sm" />
                          ) : (
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#173f2f] text-sm font-black text-white shadow-[0_8px_18px_rgba(23,63,47,0.2)]">
                              {job.name.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h3 className="truncate text-base font-black tracking-[-0.02em] text-[#1b221d]">{job.name}</h3>
                            <p className="mt-0.5 truncate text-xs text-[#7b847f]">{job.type}</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${statusClass}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {job.status}
                        </span>
                      </div>

                      <div className="mt-5 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dde5df] bg-white px-3 py-1.5 text-[10px] font-bold text-[#4c5851]">
                          <CategoryIcon className="h-3.5 w-3.5" style={{ color: category.color }} />
                          {category.name}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f0f3f1] px-3 py-1.5 text-[10px] font-semibold text-[#6d7771]">
                          <Clock3 className="h-3.5 w-3.5" /> Posted {job.deadline}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-4 rounded-[18px] border border-[#e3e9e5] bg-white/80 p-4 sm:grid-cols-2">
                        <div>
                          <div className="flex items-center justify-between gap-3 text-[10px]">
                            <span className="font-bold uppercase tracking-[0.1em] text-[#7b847f]">Tester seats</span>
                            <span className="font-black text-[#1f4f3b]">{job.testers}</span>
                          </div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e6ece8]">
                            <div className="h-full rounded-full bg-[#2b7a58]" style={{ width: `${testerProgress}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between gap-3 text-[10px]">
                            <span className="font-bold uppercase tracking-[0.1em] text-[#7b847f]">Reports</span>
                            <span className="font-black text-[#8d5a24]">{job.submissions}</span>
                          </div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eeeae3]">
                            <div className="h-full rounded-full bg-[#d08a42]" style={{ width: `${reportProgress}%` }} />
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto flex flex-col gap-2 border-t border-[#e3e9e5] pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex gap-2">
                          {job.isDraft ? (
                            <Link to={`/post-job?job=${job.id}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d8e0da] bg-white px-3.5 py-2.5 text-[11px] font-bold text-[#284f3d] transition hover:bg-[#edf4ef]">
                              <FileText className="h-3.5 w-3.5" /> Continue setup
                            </Link>
                          ) : (
                            <>
                              <Link to={`/developer/applications?job=${job.id}`} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#d8e0da] bg-white px-3 py-2.5 text-[11px] font-bold text-[#47524c] transition hover:bg-[#edf4ef] hover:text-[#173f2f]">
                                <Users className="h-3.5 w-3.5" /> Applicants
                              </Link>
                              <Link to={`/developer/reports?job=${job.id}`} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#d8e0da] bg-white px-3 py-2.5 text-[11px] font-bold text-[#47524c] transition hover:bg-[#edf4ef] hover:text-[#173f2f]">
                                <ClipboardCheck className="h-3.5 w-3.5" /> Reports
                              </Link>
                            </>
                          )}
                        </div>
                        <Link to={`/developer/jobs/${job.id}`} className="squash-hover-action inline-flex items-center justify-center gap-2 rounded-xl border border-[#d8e0da] bg-white px-4 py-2.5 text-[11px] font-bold text-[#47524c] transition">
                          Open job <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  return (
    <DeveloperShell
      title="Jobs Overview"
      subtitle="Manage drafts, posted testing jobs and active testing progress."
      active="jobs"
    >
      {searchParams.get('saved') === 'draft' ? (
        <div className="mb-5 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-semibold text-[#e63946]">
          Job draft saved securely. It remains private until funding is enabled.
        </div>
      ) : null}
      <div className="apple-interactive-card overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-xs font-semibold text-[#86868b]">Loading jobs...</div>
        ) : error ? (
          <div className="p-6 text-center text-xs font-semibold text-red-600">{error}</div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-base font-extrabold text-[#1d1d1f]">No active jobs found</div>
            <p className="mt-1 text-xs text-[#86868b]">Post a new job to start receiving applications from qualified testers.</p>
            <a href="/post-job" className="squash-btn-primary mt-4">
              Post a Job Now
            </a>
          </div>
        ) : (
          <div className="divide-y divide-black/[0.06]">
            {/* Desktop Table Header */}
            <div className="hidden grid-cols-[minmax(220px,1.5fr)_minmax(160px,1fr)_90px_90px_100px_240px] gap-4 bg-[#f5f5f7]/60 px-6 py-3.5 text-[10px] font-extrabold uppercase tracking-wider text-[#86868b] md:grid">
              <div>Job Title</div>
              <div>Category</div>
              <div className="text-center">Testers</div>
              <div className="text-center">Status</div>
              <div className="text-center">Submissions</div>
              <div className="text-right">Actions</div>
            </div>

            {/* Job Rows */}
            {jobs.map((job) => {
              const category = getCategoryById(job.categoryId);
              const CategoryIcon = category.icon;
              return (
                <div
                  key={job.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => navigate(`/developer/jobs/${job.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') navigate(`/developer/jobs/${job.id}`);
                  }}
                  className="flex cursor-pointer flex-col gap-4 p-5 transition hover:bg-[#f5f5f7]/60 focus:outline-none md:grid md:grid-cols-[minmax(220px,1.5fr)_minmax(160px,1fr)_90px_90px_100px_240px] md:items-center md:px-6"
                >
                  {/* Job Title & Status - Mobile Only */}
                  <div className="flex items-start justify-between gap-3 md:hidden">
                    <div className="flex items-center gap-3 min-w-0">
                      {job.logoUrl ? (
                        <img src={job.logoUrl} alt={job.name} className="h-10 w-10 shrink-0 rounded-xl object-cover border border-black/[0.06] shadow-2xs" />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1d1d1f] text-white font-extrabold shadow-2xs">
                          {job.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-extrabold text-[#1d1d1f] text-xs sm:text-sm truncate">{job.name}</div>
                        <div className="text-[11px] text-[#86868b] truncate">{job.type}</div>
                      </div>
                    </div>
                    <span className="shrink-0 inline-flex rounded-full bg-rose-50 px-2.5 py-0.5 text-[9px] font-extrabold uppercase text-[#e63946] border border-rose-100">
                      {job.status}
                    </span>
                  </div>

                  {/* Desktop Only - Title */}
                  <div className="hidden min-w-0 items-center gap-3 md:flex">
                    {job.logoUrl ? (
                      <img src={job.logoUrl} alt={job.name} className="h-10 w-10 shrink-0 rounded-xl object-cover border border-black/[0.06] shadow-2xs" />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1d1d1f] text-white font-extrabold shadow-2xs text-xs">
                        {job.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-extrabold text-[#1d1d1f] text-xs sm:text-sm truncate">{job.name}</div>
                      <div className="text-[11px] text-[#86868b] truncate">{job.type}</div>
                    </div>
                  </div>

                  {/* Mobile Only - Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 rounded-xl bg-[#f5f5f7] p-3 md:hidden border border-black/[0.04]">
                    <div>
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#86868b]">Category</div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#1d1d1f]">
                        <CategoryIcon className="h-3.5 w-3.5 shrink-0" style={{ color: category.color }} />
                        <span className="truncate">{category.name}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#86868b]">Testers</div>
                      <div className="mt-1 text-xs font-extrabold text-[#1d1d1f]">{job.testers}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#86868b]">Submissions</div>
                      <div className="mt-1 text-xs font-extrabold text-[#1d1d1f]">{job.submissions}</div>
                    </div>
                  </div>

                  {/* Desktop Only - Category */}
                  <div className="hidden items-center gap-1.5 text-xs font-semibold text-[#1d1d1f] md:flex">
                    <CategoryIcon className="h-4 w-4 shrink-0" style={{ color: category.color }} />
                    <span className="truncate">{category.name}</span>
                  </div>

                  {/* Desktop Only - Testers */}
                  <div className="hidden text-center text-xs font-semibold text-[#86868b] md:block">
                    <span className="font-extrabold text-[#1d1d1f]">{job.testers}</span>
                  </div>

                  {/* Desktop Only - Status */}
                  <div className="hidden text-center md:block">
                    <span className="inline-flex shrink-0 rounded-full bg-rose-50 px-2.5 py-0.5 text-[9px] font-extrabold uppercase text-[#e63946] border border-rose-100">
                      {job.status}
                    </span>
                  </div>

                  {/* Desktop Only - Submissions */}
                  <div className="hidden text-center text-xs font-extrabold text-[#1d1d1f] md:block">
                    {job.submissions}
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 md:flex md:w-auto md:justify-end" onClick={(event) => event.stopPropagation()}>
                    {job.isDraft ? (
                      <Link
                        to={`/post-job?job=${job.id}`}
                        className="squash-btn-primary !h-8 !px-3 !text-[11px]"
                      >
                        Continue setup
                      </Link>
                    ) : (
                      <>
                        <Link
                          to={`/developer/applications?job=${job.id}`}
                          className="squash-btn-secondary !h-8 !px-3 !text-[11px]"
                        >
                          Applicants
                        </Link>
                        <Link
                          to={`/developer/reports?job=${job.id}`}
                          className="squash-btn-secondary !h-8 !px-3 !text-[11px]"
                        >
                          Reports
                        </Link>
                      </>
                    )}
                    <Link
                      to={`/developer/jobs/${job.id}`}
                      className="squash-btn-primary !h-8 !px-3 !text-[11px]"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DeveloperShell>
  );
}

// ----------------------------------------------------------------------
// 2. APPLICATIONS PAGE
// ----------------------------------------------------------------------
export function SquashDeveloperApplicationsPage() {
  const { session } = useAuth();
  const jobId = new URLSearchParams(window.location.search).get('job');
  const [applications, setApplications] = useState<DeveloperApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [applicationFilter, setApplicationFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [applicationQuery, setApplicationQuery] = useState('');

  useEffect(() => {
    if (!session?.userId || !session.roles.includes('developer')) return;

    let mounted = true;
    setLoading(true);
    setError('');

    getDeveloperApplications(session.userId)
      .then((appItems) => {
        if (!mounted) return;
        setApplications(appItems);
      })
      .catch((err: Error) => {
        if (mounted) setError(err.message || 'Could not load applications.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [session?.userId, session?.roles]);

  const pendingCount = applications.filter((item) => item.status === 'pending').length;
  const acceptedCount = applications.filter((item) => item.status === 'accepted').length;
  const rejectedCount = applications.filter((item) => item.status === 'rejected').length;

  const filteredApplications = useMemo(() => {
    const sorted = applications.slice().sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    return jobId ? sorted.filter((a) => a.jobId === jobId) : sorted;
  }, [applications, jobId]);

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
          ? `${application.testerName} has been accepted for ${application.jobTitle}.`
          : `${application.testerName} was rejected for ${application.jobTitle}.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update application.');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: DeveloperApplication['status']) => {
    if (status === 'accepted') return 'bg-rose-50 text-[#e63946] border-rose-100';
    if (status === 'rejected') return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  const visibleApplications = useMemo(() => {
    const normalizedQuery = applicationQuery.trim().toLowerCase();

    return filteredApplications.filter((application) => {
      const matchesStatus = applicationFilter === 'all' || application.status === applicationFilter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        application.testerName.toLowerCase().includes(normalizedQuery) ||
        application.testerEmail.toLowerCase().includes(normalizedQuery) ||
        application.testerCity.toLowerCase().includes(normalizedQuery) ||
        application.jobTitle.toLowerCase().includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [applicationFilter, applicationQuery, filteredApplications]);

  const useRevampedApplicationsPage = true;
  if (useRevampedApplicationsPage) {
    const applicationFilters = [
      { id: 'all', label: 'All', count: filteredApplications.length },
      { id: 'pending', label: 'To review', count: filteredApplications.filter((item) => item.status === 'pending').length },
      { id: 'accepted', label: 'Accepted', count: filteredApplications.filter((item) => item.status === 'accepted').length },
      { id: 'rejected', label: 'Declined', count: filteredApplications.filter((item) => item.status === 'rejected').length },
    ] as const;

    return (
      <div className="mx-auto max-w-[1500px] space-y-5 pb-10">
        <section className="developer-ambient-hero relative overflow-hidden rounded-[28px] border border-white/80 bg-[linear-gradient(112deg,#e7efe9_0%,#fffaf6_45%,#f4e8eb_72%,#d9c8df_100%)] px-6 py-7 shadow-[0_24px_70px_rgba(45,39,52,0.11)] sm:px-8 sm:py-9">
          <div className="pointer-events-none absolute -right-16 -top-28 h-72 w-72 rounded-full bg-[#695275]/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-1/4 h-64 w-64 rounded-full bg-[#2d7254]/15 blur-3xl" />
          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="developer-ambient-glass developer-ambient-eyebrow mb-4 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-[#584761] shadow-sm backdrop-blur-xl">
                <span className="developer-ambient-eyebrow-icon flex h-6 w-6 items-center justify-center rounded-full bg-[#594763] text-white">
                  <Inbox className="h-3.5 w-3.5" />
                </span>
                Tester selection desk
              </div>
              <h1 className="max-w-2xl text-3xl font-black tracking-[-0.045em] text-[#1d211e] sm:text-4xl">
                Build the right testing team,
                <span className="block text-[#2b654d]">one confident decision at a time.</span>
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5d6660]">
                Compare experience, verified specializations and approval history before assigning access to a live QA run.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="developer-ambient-glass developer-ambient-status-card rounded-2xl border border-white/80 bg-white/65 px-5 py-3.5 shadow-sm backdrop-blur-xl">
                <div className="developer-ambient-status-label text-[10px] font-bold uppercase tracking-[0.18em] text-[#777079]">Waiting for you</div>
                <div className="developer-ambient-status-value mt-1 flex items-center gap-2 text-sm font-extrabold text-[#4b3853]">
                  <span className="h-2 w-2 rounded-full bg-[#d79b35] shadow-[0_0_0_4px_rgba(215,155,53,0.13)]" />
                  {pendingCount} {pendingCount === 1 ? 'application' : 'applications'}
                </div>
              </div>
              <Link
                to="/developer/jobs"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#173f2f] px-5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(23,63,47,0.2)] transition hover:-translate-y-0.5 hover:bg-[#0f3224] focus:outline-none focus:ring-2 focus:ring-[#173f2f]/30"
              >
                View test jobs
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section aria-label="Application summary" className="grid gap-3 md:grid-cols-3">
          {[
            { label: 'Awaiting review', value: pendingCount, note: pendingCount === 0 ? 'Your queue is clear' : 'Needs a hiring decision', icon: Clock3, tint: 'bg-[#fff3dc] text-[#9b621d]' },
            { label: 'Accepted testers', value: acceptedCount, note: 'Added to active test runs', icon: ShieldCheck, tint: 'bg-[#e4f3ea] text-[#1c6749]' },
            { label: 'Declined applications', value: rejectedCount, note: 'Closed after evaluation', icon: XCircle, tint: 'bg-[#f8e8e8] text-[#a84c49]' },
          ].map((metric) => {
            const MetricIcon = metric.icon;
            return (
              <article key={metric.label} className="rounded-[22px] border border-white/90 bg-white/75 p-5 shadow-[0_14px_36px_rgba(39,52,44,0.07)] backdrop-blur-xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7d8680]">{metric.label}</p>
                    <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#1c221e]">{metric.value}</p>
                    <p className="mt-1 text-xs text-[#7a837e]">{metric.note}</p>
                  </div>
                  <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${metric.tint}`}>
                    <MetricIcon className="h-5 w-5" />
                  </span>
                </div>
              </article>
            );
          })}
        </section>

        {actionMessage ? (
          <div className="flex items-center gap-3 rounded-2xl border border-[#b9dfca] bg-[#edf8f1] px-4 py-3 text-xs font-semibold text-[#276348] shadow-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {actionMessage}
          </div>
        ) : null}

        {error ? (
          <div className="flex items-center gap-3 rounded-2xl border border-[#f0c5c2] bg-[#fff0ef] px-4 py-3 text-xs font-semibold text-[#9d3935] shadow-sm">
            <XCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : null}

        <section className="overflow-hidden rounded-[26px] border border-white/90 bg-white/70 shadow-[0_22px_60px_rgba(41,53,46,0.09)] backdrop-blur-xl">
          <div className="border-b border-[#dde5df] px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#594763] text-white">
                  <Users className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-lg font-black tracking-[-0.025em] text-[#1d241f]">
                    {jobId ? 'Selected job applicants' : 'Application review queue'}
                  </h2>
                  <p className="text-xs text-[#7a837e]">Review the strongest evidence before making a decision.</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <label className="relative block min-w-0 md:w-72">
                  <span className="sr-only">Search applications</span>
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b948f]" />
                  <input
                    value={applicationQuery}
                    onChange={(event) => setApplicationQuery(event.target.value)}
                    placeholder="Search tester, city or job"
                    className="h-11 w-full rounded-2xl border border-[#dfe6e1] bg-white/90 pl-10 pr-4 text-xs font-medium text-[#1d241f] outline-none transition placeholder:text-[#9ca39f] focus:border-[#6b5577] focus:ring-4 focus:ring-[#6b5577]/10"
                  />
                </label>
                <div className="flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-[#dfe6e1] bg-[#f5f7f5] p-1">
                  {applicationFilters.map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setApplicationFilter(filter.id)}
                      aria-pressed={applicationFilter === filter.id}
                      className={`whitespace-nowrap rounded-xl px-3 py-2 text-[11px] font-bold transition ${
                        applicationFilter === filter.id
                          ? 'bg-[#594763] text-white shadow-sm'
                          : 'text-[#66716b] hover:bg-white hover:text-[#1d241f]'
                      }`}
                    >
                      {filter.label} <span className="ml-1 opacity-70">{filter.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {[0, 1, 2, 3].map((item) => (
                  <div key={item} className="h-80 animate-pulse rounded-[22px] bg-[#edf1ee]" />
                ))}
              </div>
            ) : visibleApplications.length > 0 ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {visibleApplications.map((application) => {
                  const category = getCategoryById(application.jobCategory as TestCategoryId);
                  const CategoryIcon = category.icon;
                  const specializationLabels = application.testerSpecializations.slice(0, 3).map(getSpecializationLabel);
                  const isUpdating = updatingId === application.id;
                  const isPending = application.status === 'pending';
                  const statusClass =
                    application.status === 'accepted'
                      ? 'border-[#b9e6d0] bg-[#e8f8ef] text-[#167049]'
                      : application.status === 'rejected'
                        ? 'border-[#ecc9c7] bg-[#fff0ef] text-[#a4423d]'
                        : 'border-[#ecd6a6] bg-[#fff7e5] text-[#956018]';

                  return (
                    <article key={application.id} className="group flex h-full flex-col rounded-[24px] border border-[#dfe6e1] bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(248,250,248,0.92))] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#c5d1c9] hover:shadow-[0_20px_45px_rgba(33,55,43,0.1)] sm:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3.5">
                          <TesterAvatar
                            name={application.testerName}
                            avatarUrl={application.testerAvatarUrl}
                            className="h-13 w-13 rounded-2xl shadow-[0_8px_18px_rgba(23,63,47,0.12)]"
                          />
                          <div className="min-w-0">
                            <h3 className="truncate text-base font-black tracking-[-0.02em] text-[#1b221d]">{application.testerName}</h3>
                            <p className="mt-0.5 truncate text-xs text-[#7b847f]">{application.testerEmail || 'Email hidden'}</p>
                            <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#5f7167]">
                              <MapPin className="h-3.5 w-3.5 text-[#3c8b66]" />
                              {application.testerCity || 'Location unavailable'}
                            </p>
                          </div>
                        </div>
                        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${statusClass}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {application.status === 'rejected' ? 'Declined' : application.status}
                        </span>
                      </div>

                      <div className="mt-5 grid grid-cols-3 overflow-hidden rounded-[18px] border border-[#e1e7e3] bg-white/85">
                        <div className="border-r border-[#e1e7e3] px-3 py-3 text-center">
                          <div className="inline-flex items-center gap-1 text-sm font-black text-[#202722]">
                            {application.testerRating.toFixed(1)}
                            <Star className="h-3.5 w-3.5 fill-[#d79935] text-[#d79935]" />
                          </div>
                          <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#8a928d]">Rating</div>
                        </div>
                        <div className="border-r border-[#e1e7e3] px-3 py-3 text-center">
                          <div className="text-sm font-black text-[#202722]">{application.testerTestsCompleted}</div>
                          <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#8a928d]">Tests</div>
                        </div>
                        <div className="px-3 py-3 text-center">
                          <div className="text-sm font-black text-[#202722]">{application.testerApprovalRate}%</div>
                          <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#8a928d]">Approval</div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <TesterBadge testsCompleted={application.testerTestsCompleted} rating={application.testerRating} />
                        {specializationLabels.map((label) => (
                          <span key={label} className="rounded-full border border-[#dfe5e1] bg-[#f5f7f5] px-2.5 py-1 text-[10px] font-semibold text-[#4f5b54]">{label}</span>
                        ))}
                      </div>

                      <Link to={`/developer/jobs/${application.jobId}`} className="mt-4 flex items-center justify-between gap-4 rounded-[18px] border border-[#dfe6e1] bg-[#f2f6f3] px-4 py-3.5 transition hover:border-[#b9cabf] hover:bg-[#edf4ef]">
                        <div className="min-w-0">
                          <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#7f8883]">Applied for</div>
                          <div className="mt-1 truncate text-sm font-black text-[#213128]">{application.jobTitle}</div>
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white bg-white px-2.5 py-1.5 text-[10px] font-bold text-[#435148] shadow-sm">
                          <CategoryIcon className="h-3.5 w-3.5" style={{ color: category.color }} />
                          {category.name}
                        </span>
                      </Link>

                      <div className="mt-auto pt-4">
                        {isPending ? (
                          <div className="grid grid-cols-2 gap-2 border-t border-[#e2e8e4] pt-4">
                            <button
                              type="button"
                              onClick={() => handleReview(application, 'rejected')}
                              disabled={isUpdating}
                              className="squash-decline-action inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#e1c9c7] bg-white text-xs font-bold text-[#9a4541] transition disabled:cursor-wait disabled:opacity-60"
                            >
                              <XCircle className="h-4 w-4" />
                              {isUpdating ? 'Updating…' : 'Decline'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReview(application, 'accepted')}
                              disabled={isUpdating}
                              className="squash-hover-action inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#173f2f] text-xs font-bold text-white transition disabled:cursor-wait disabled:opacity-60"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              {isUpdating ? 'Accepting…' : 'Accept tester'}
                            </button>
                          </div>
                        ) : (
                          <div className={`flex items-center gap-2 rounded-xl px-3.5 py-3 text-xs font-semibold ${application.status === 'accepted' ? 'bg-[#edf8f1] text-[#276348]' : 'bg-[#faf0ef] text-[#94504b]'}`}>
                            {application.status === 'accepted' ? <ShieldCheck className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                            {application.status === 'accepted' ? 'Tester accepted into this QA run.' : 'Application closed after review.'}
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="flex min-h-72 flex-col items-center justify-center rounded-[22px] border border-dashed border-[#cfd9d2] bg-[#f7f9f7] px-6 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ede7f0] text-[#594763]">
                  <Inbox className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg font-black text-[#1d241f]">No applications in this view</h3>
                <p className="mt-1 max-w-sm text-sm text-[#7a837e]">Try another status or clear your search to return to the full review queue.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  return (
    <DeveloperShell
      title="Tester Applications"
      subtitle="Review testers who applied to test your apps and accept or reject applications."
      active="applications"
    >
      <div className="space-y-6">
        {/* Stat Cards */}
        <section className="grid gap-4 md:grid-cols-3">
          {[
            { label: 'Pending Review', value: pendingCount, color: 'bg-[#1d1d1f] text-white', icon: UserCircle2 },
            { label: 'Accepted Testers', value: acceptedCount, color: 'bg-[#1d1d1f] text-white', icon: CheckCircle2 },
            { label: 'Rejected Applications', value: rejectedCount, color: 'bg-[#1d1d1f] text-white', icon: XCircle },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="apple-interactive-card p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-[#86868b] uppercase tracking-wider">{card.label}</div>
                    <div className="mt-2 text-3xl font-extrabold text-[#1d1d1f] tracking-tight">{card.value}</div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1d1d1f] text-white shadow-2xs">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {actionMessage ? (
          <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-semibold text-[#e63946]">
            {actionMessage}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
            {error}
          </div>
        ) : null}

        {/* Applications List */}
        <section className="apple-interactive-card overflow-hidden">
          <div className="border-b border-black/[0.06] px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-[#1d1d1f] tracking-tight">
                {jobId ? 'Applications for Selected Job' : 'All Tester Applications'}
              </h2>
              <p className="text-xs text-[#86868b] mt-0.5">Accept matching testers into active testing runs.</p>
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-xs font-semibold text-[#86868b]">Loading applications...</div>
          ) : filteredApplications.length > 0 ? (
            <div className="grid gap-4 bg-[#f5f5f7]/40 p-4 xl:grid-cols-2">
              {filteredApplications.map((application) => {
                const category = getCategoryById(application.jobCategory as TestCategoryId);
                const CategoryIcon = category.icon;
                const specializationLabels = application.testerSpecializations.slice(0, 3).map(getSpecializationLabel);
                const isUpdating = updatingId === application.id;

                return (
                  <article key={application.id} className="flex h-full flex-col apple-interactive-card p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <TesterAvatar
                          name={application.testerName}
                          avatarUrl={application.testerAvatarUrl}
                          className="h-12 w-12 rounded-full shadow-2xs"
                          alt={`${application.testerName} profile`}
                        />
                        <div className="min-w-0">
                          <h3 className="truncate text-sm sm:text-base font-extrabold text-[#1d1d1f]">{application.testerName}</h3>
                          <p className="mt-0.5 truncate text-xs text-[#86868b]">{application.testerEmail || 'Email hidden'}</p>
                          <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[#86868b]"><MapPin className="h-3.5 w-3.5 text-[#e63946]" /> {application.testerCity}</p>
                        </div>
                      </div>
                      <span className={`inline-flex shrink-0 rounded-full border px-3 py-1 text-xs font-extrabold uppercase ${getStatusBadge(application.status)}`}>
                        {application.status}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <div className="rounded-xl bg-[#f5f5f7] p-2.5 text-center border border-black/[0.04]">
                        <div className="inline-flex items-center justify-center gap-1 text-xs sm:text-sm font-extrabold text-[#1d1d1f]">
                          {application.testerRating.toFixed(1)}
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        </div>
                        <div className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-[#86868b]">Rating</div>
                      </div>
                      <div className="rounded-xl bg-[#f5f5f7] p-2.5 text-center border border-black/[0.04]">
                        <div className="text-xs sm:text-sm font-extrabold text-[#1d1d1f]">{application.testerTestsCompleted}</div>
                        <div className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-[#86868b]">Tests</div>
                      </div>
                      <div className="rounded-xl bg-[#f5f5f7] p-2.5 text-center border border-black/[0.04]">
                        <div className="text-xs sm:text-sm font-extrabold text-[#1d1d1f]">{application.testerApprovalRate}%</div>
                        <div className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-[#86868b]">Approval</div>
                      </div>
                    </div>

                    <div className="mt-3.5 flex flex-wrap items-center gap-2">
                      <TesterBadge testsCompleted={application.testerTestsCompleted} rating={application.testerRating} />
                      {specializationLabels.map((label) => (
                        <span key={label} className="rounded-full bg-[#f5f5f7] border border-black/[0.04] px-2.5 py-0.5 text-[10px] font-semibold text-[#1d1d1f]">{label}</span>
                      ))}
                    </div>

                    <Link to={`/developer/jobs/${application.jobId}`} className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-black/[0.06] bg-[#f5f5f7]/60 px-4 py-3 transition hover:bg-[#f5f5f7]">
                      <div className="min-w-0">
                        <div className="text-[9px] font-extrabold uppercase tracking-wider text-[#86868b]">Applied for</div>
                        <div className="mt-0.5 truncate font-extrabold text-xs sm:text-sm text-[#1d1d1f]">{application.jobTitle}</div>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-black/[0.06] bg-white px-2.5 py-1 text-xs font-semibold text-[#1d1d1f]">
                        <CategoryIcon className="h-3.5 w-3.5" style={{ color: category.color }} /> {category.name}
                      </span>
                    </Link>

                    {application.status === 'pending' ? (
                      <div className="mt-4 grid grid-cols-2 gap-2 pt-3 border-t border-black/[0.06]">
                        <button
                          type="button"
                          onClick={() => handleReview(application, 'rejected')}
                          disabled={isUpdating}
                          className="squash-decline-action inline-flex min-h-9 items-center justify-center rounded-[10px] px-3 text-xs font-semibold"
                        >
                          {isUpdating ? 'Updating…' : 'Reject'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReview(application, 'accepted')}
                          disabled={isUpdating}
                          className="squash-btn-primary w-full"
                        >
                          {isUpdating ? 'Accepting…' : 'Accept Tester'}
                        </button>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center text-xs font-semibold text-[#86868b]">
              No applications match your filter.
            </div>
          )}
        </section>
      </div>
    </DeveloperShell>
  );
}

// ----------------------------------------------------------------------
// 3. REPORTS PAGE
// ----------------------------------------------------------------------
export function SquashDeveloperReportsPage() {
  const { session } = useAuth();
  const jobId = new URLSearchParams(window.location.search).get('job');
  const [submittedReports, setSubmittedReports] = useState<DeveloperSubmissionReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportFilter, setReportFilter] = useState<'all' | 'submitted' | 'approved' | 'changes_requested' | 'rejected'>('all');
  const [reportQuery, setReportQuery] = useState('');

  useEffect(() => {
    if (!session?.userId || !session.roles.includes('developer')) return;

    let mounted = true;
    setLoading(true);

    getDeveloperSubmittedReports(session.userId)
      .then((reportItems) => {
        if (!mounted) return;
        setSubmittedReports(reportItems);
      })
      .catch((err: Error) => {
        if (mounted) setError(err.message || 'Could not load submitted reports.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [session?.userId, session?.roles]);

  const reviewCount = submittedReports.filter((item) => item.status === 'submitted').length;
  const approvedCount = submittedReports.filter((item) => item.status === 'approved').length;

  const filteredReports = useMemo(() => {
    const sorted = submittedReports.slice().sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    // Deliberately no placeholder report. This previously fabricated a full
    // submission -- attributed to a real tester's name and email, with an
    // invented bug and an R80 payout -- whenever a developer had none, which
    // is indistinguishable from a genuine report.
    return jobId ? sorted.filter((r) => r.jobId === jobId) : sorted;
  }, [submittedReports, jobId]);

  const visibleReports = useMemo(() => {
    const normalizedQuery = reportQuery.trim().toLowerCase();

    return filteredReports.filter((report) => {
      const categoryName = getCategoryById(report.jobCategory as TestCategoryId).name;
      const matchesStatus = reportFilter === 'all' || report.status === reportFilter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        report.jobTitle.toLowerCase().includes(normalizedQuery) ||
        report.testerName.toLowerCase().includes(normalizedQuery) ||
        report.testerEmail.toLowerCase().includes(normalizedQuery) ||
        categoryName.toLowerCase().includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [filteredReports, reportFilter, reportQuery]);

  const totalBugCount = filteredReports.reduce((total, report) => total + report.bugCount, 0);
  const criticalBugCount = filteredReports.reduce((total, report) => total + report.criticalBugCount, 0);
  const videoEvidenceCount = filteredReports.reduce((total, report) => total + report.videoBugCount, 0);

  const useRevampedReportsPage = true;
  if (useRevampedReportsPage) {
    const reportFilters = [
      { id: 'all', label: 'All reports', count: filteredReports.length },
      { id: 'submitted', label: 'To review', count: filteredReports.filter((report) => report.status === 'submitted').length },
      { id: 'approved', label: 'Approved', count: filteredReports.filter((report) => report.status === 'approved').length },
      { id: 'changes_requested', label: 'Changes', count: filteredReports.filter((report) => report.status === 'changes_requested').length },
      { id: 'rejected', label: 'Rejected', count: filteredReports.filter((report) => report.status === 'rejected').length },
    ] as const;

    return (
      <div className="mx-auto max-w-[1500px] space-y-5 pb-10">
        <section className="developer-ambient-hero relative overflow-hidden rounded-[28px] border border-white/80 bg-[linear-gradient(112deg,#e3f0ed_0%,#fffaf6_44%,#f6ece5_70%,#e9c9bc_100%)] px-6 py-7 shadow-[0_24px_70px_rgba(48,43,37,0.11)] sm:px-8 sm:py-9">
          <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-[#b26f55]/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-1/4 h-64 w-64 rounded-full bg-[#246b58]/15 blur-3xl" />
          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="developer-ambient-glass developer-ambient-eyebrow mb-4 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-[#4d625b] shadow-sm backdrop-blur-xl">
                <span className="developer-ambient-eyebrow-icon flex h-6 w-6 items-center justify-center rounded-full bg-[#1c5946] text-white">
                  <FileText className="h-3.5 w-3.5" />
                </span>
                QA evidence centre
              </div>
              <h1 className="max-w-2xl text-3xl font-black tracking-[-0.045em] text-[#1d211e] sm:text-4xl">
                Turn tester evidence
                <span className="block text-[#2a654f]">into confident product decisions.</span>
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5d6660]">
                Review findings, severity signals and proof attachments before approving the work and closing the feedback loop.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="developer-ambient-glass developer-ambient-status-card rounded-2xl border border-white/80 bg-white/65 px-5 py-3.5 shadow-sm backdrop-blur-xl">
                <div className="developer-ambient-status-label text-[10px] font-bold uppercase tracking-[0.18em] text-[#77736f]">Review queue</div>
                <div className="developer-ambient-status-value mt-1 flex items-center gap-2 text-sm font-extrabold text-[#654538]">
                  <span className="h-2 w-2 rounded-full bg-[#d58a43] shadow-[0_0_0_4px_rgba(213,138,67,0.13)]" />
                  {reviewCount} {reviewCount === 1 ? 'report waiting' : 'reports waiting'}
                </div>
              </div>
              <Link
                to="/developer/jobs"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#173f2f] px-5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(23,63,47,0.2)] transition hover:-translate-y-0.5 hover:bg-[#0f3224] focus:outline-none focus:ring-2 focus:ring-[#173f2f]/30"
              >
                Manage test jobs
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section aria-label="Report summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Awaiting review', value: reviewCount, note: 'Requires a QA decision', icon: Clock3, tint: 'bg-[#fff1dc] text-[#9e621d]' },
            { label: 'Approved reports', value: approvedCount, note: 'Quality confirmed', icon: CheckCircle2, tint: 'bg-[#e3f3e9] text-[#1b6849]' },
            { label: 'Bugs documented', value: totalBugCount, note: `${criticalBugCount} marked critical`, icon: Bug, tint: 'bg-[#f9e8e5] text-[#a24c43]' },
            { label: 'Video evidence', value: videoEvidenceCount, note: 'Recorded proof attached', icon: Video, tint: 'bg-[#ece9f7] text-[#645292]' },
          ].map((metric) => {
            const MetricIcon = metric.icon;
            return (
              <article key={metric.label} className="rounded-[22px] border border-white/90 bg-white/75 p-4 shadow-[0_14px_36px_rgba(39,52,44,0.07)] backdrop-blur-xl">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7d8680]">{metric.label}</p>
                    <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#1c221e]">{metric.value}</p>
                  </div>
                  <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${metric.tint}`}>
                    <MetricIcon className="h-4.5 w-4.5" />
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#7a837e]">{metric.note}</p>
              </article>
            );
          })}
        </section>

        {error ? (
          <div className="flex items-center gap-3 rounded-2xl border border-[#f0c5c2] bg-[#fff0ef] px-4 py-3 text-xs font-semibold text-[#9d3935] shadow-sm">
            <XCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : null}

        <section className="overflow-hidden rounded-[26px] border border-white/90 bg-white/70 shadow-[0_22px_60px_rgba(41,53,46,0.09)] backdrop-blur-xl">
          <div className="border-b border-[#dde5df] px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1c5946] text-white">
                  <ClipboardCheck className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-lg font-black tracking-[-0.025em] text-[#1d241f]">
                    {jobId ? 'Selected job reports' : 'Submission review workspace'}
                  </h2>
                  <p className="text-xs text-[#7a837e]">Open a report to inspect complete findings and evidence.</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <label className="relative block min-w-0 md:w-72">
                  <span className="sr-only">Search reports</span>
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b948f]" />
                  <input
                    value={reportQuery}
                    onChange={(event) => setReportQuery(event.target.value)}
                    placeholder="Search tester, job or category"
                    className="h-11 w-full rounded-2xl border border-[#dfe6e1] bg-white/90 pl-10 pr-4 text-xs font-medium text-[#1d241f] outline-none transition placeholder:text-[#9ca39f] focus:border-[#4c8068] focus:ring-4 focus:ring-[#4c8068]/10"
                  />
                </label>
                <div className="flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-[#dfe6e1] bg-[#f5f7f5] p-1">
                  {reportFilters.map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setReportFilter(filter.id)}
                      aria-pressed={reportFilter === filter.id}
                      className={`whitespace-nowrap rounded-xl px-3 py-2 text-[11px] font-bold transition ${
                        reportFilter === filter.id
                          ? 'bg-[#1c5946] text-white shadow-sm'
                          : 'text-[#66716b] hover:bg-white hover:text-[#1d241f]'
                      }`}
                    >
                      {filter.label} <span className="ml-1 opacity-70">{filter.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {[0, 1].map((item) => (
                  <div key={item} className="h-72 animate-pulse rounded-[22px] bg-[#edf1ee]" />
                ))}
              </div>
            ) : visibleReports.length > 0 ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {visibleReports.map((report) => {
                  const category = getCategoryById(report.jobCategory as TestCategoryId);
                  const CategoryIcon = category.icon;
                  const submittedDate = new Date(report.submittedAt || report.createdAt).toLocaleDateString('en-ZA', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });
                  const scoreValues = Object.values(report.scores);
                  const averageScore = scoreValues.length > 0
                    ? Math.round(scoreValues.reduce((total, score) => total + score, 0) / scoreValues.length)
                    : 0;
                  const statusClass =
                    report.status === 'approved'
                      ? 'border-[#b9e6d0] bg-[#e8f8ef] text-[#167049]'
                      : report.status === 'rejected'
                        ? 'border-[#ecc9c7] bg-[#fff0ef] text-[#a4423d]'
                        : report.status === 'changes_requested'
                          ? 'border-[#d8d2ef] bg-[#f0edfa] text-[#66549b]'
                          : 'border-[#ecd6a6] bg-[#fff7e5] text-[#956018]';

                  return (
                    <article key={report.id} className="group flex h-full flex-col rounded-[24px] border border-[#dfe6e1] bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(248,250,248,0.92))] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#c5d1c9] hover:shadow-[0_20px_45px_rgba(33,55,43,0.1)] sm:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3.5">
                          {report.jobLogoUrl ? (
                            <img src={report.jobLogoUrl} alt="" className="h-12 w-12 shrink-0 rounded-2xl border border-[#dfe6e1] object-cover shadow-sm" />
                          ) : (
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#173f2f] text-sm font-black text-white shadow-[0_8px_18px_rgba(23,63,47,0.18)]">
                              {report.jobTitle.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h3 className="truncate text-base font-black tracking-[-0.02em] text-[#1b221d]">{report.jobTitle}</h3>
                            <p className="mt-0.5 truncate text-xs text-[#7b847f]">Report by {report.testerName}</p>
                          </div>
                        </div>
                        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${statusClass}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {report.status === 'changes_requested' ? 'Changes requested' : report.status}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dde5df] bg-white px-3 py-1.5 text-[10px] font-bold text-[#4c5851]">
                          <CategoryIcon className="h-3.5 w-3.5" style={{ color: category.color }} />
                          {category.name}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f0f3f1] px-3 py-1.5 text-[10px] font-semibold text-[#6d7771]">
                          <Clock3 className="h-3.5 w-3.5" /> {submittedDate}
                        </span>
                        {report.criticalBugCount > 0 ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff0ef] px-3 py-1.5 text-[10px] font-bold text-[#a4423d]">
                            <Bug className="h-3.5 w-3.5" /> {report.criticalBugCount} critical
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-4 rounded-[18px] border border-[#e1e7e3] bg-white/85 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#818a85]">Tester summary</p>
                        <p className="mt-2 line-clamp-3 min-h-12 text-xs leading-5 text-[#536057]">
                          {report.summary || 'The tester submitted the report without a written executive summary.'}
                        </p>
                      </div>

                      <div className="mt-4 grid grid-cols-4 overflow-hidden rounded-[18px] border border-[#e1e7e3] bg-[#f5f7f5]">
                        {[
                          { label: 'Bugs', value: report.bugCount, accent: 'text-[#9b493f]' },
                          { label: 'Critical', value: report.criticalBugCount, accent: 'text-[#b53a34]' },
                          { label: 'Videos', value: report.videoBugCount, accent: 'text-[#62508c]' },
                          { label: 'QA score', value: `${averageScore}%`, accent: 'text-[#1f6548]' },
                        ].map((item, index) => (
                          <div key={item.label} className={`px-2 py-3 text-center ${index < 3 ? 'border-r border-[#e1e7e3]' : ''}`}>
                            <div className={`text-sm font-black ${item.accent}`}>{item.value}</div>
                            <div className="mt-1 text-[8px] font-bold uppercase tracking-[0.1em] text-[#8a928d]">{item.label}</div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-auto flex flex-col gap-3 border-t border-[#e2e8e4] pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-[#2d3831]">{report.testerName}</p>
                          <p className="truncate text-[10px] text-[#8a928d]">{report.testerEmail}</p>
                        </div>
                        <Link
                          to={`/report-details?submission=${report.id}`}
                          className="squash-hover-action inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#d8e0da] bg-white px-4 text-[11px] font-bold text-[#47524c] transition"
                        >
                          Review full report
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="flex min-h-72 flex-col items-center justify-center rounded-[22px] border border-dashed border-[#cfd9d2] bg-[#f7f9f7] px-6 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e3f0eb] text-[#1c5946]">
                  <ClipboardCheck className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg font-black text-[#1d241f]">No reports in this view</h3>
                <p className="mt-1 max-w-sm text-sm text-[#7a837e]">Try another status or clear your search to return to all submitted evidence.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  return (
    <DeveloperShell
      title="Submitted Reports"
      subtitle="Review bug reports and testing feedback submitted by accepted testers."
      active="reports"
    >
      <div className="space-y-6">
        {/* Stat Cards */}
        <section className="grid gap-4 md:grid-cols-2">
          {[
            { label: 'Reports Needing Review', value: reviewCount, color: 'bg-[#1d1d1f] text-white', icon: FileText },
            { label: 'Approved Reports', value: approvedCount, color: 'bg-[#1d1d1f] text-white', icon: CheckCircle2 },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="apple-interactive-card p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-[#86868b] uppercase tracking-wider">{card.label}</div>
                    <div className="mt-2 text-3xl font-extrabold text-[#1d1d1f] tracking-tight">{card.value}</div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1d1d1f] text-white shadow-2xs">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {error ? (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
            {error}
          </div>
        ) : null}

        {/* Reports List */}
        <section className="apple-interactive-card overflow-hidden">
          <div className="border-b border-black/[0.06] px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-[#1d1d1f] tracking-tight">
                {jobId ? 'Reports for Selected Job' : 'All Submitted Test Reports'}
              </h2>
              <p className="text-xs text-[#86868b] mt-0.5">Click any report row to view complete bug details and proof attachments.</p>
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-xs font-semibold text-[#86868b]">Loading reports...</div>
          ) : filteredReports.length > 0 ? (
            <div className="divide-y divide-black/[0.06]">
              {filteredReports.map((report) => {
                const category = getCategoryById(report.jobCategory as TestCategoryId);
                const CategoryIcon = category.icon;
                const statusClass =
                  report.status === 'approved'
                    ? 'bg-rose-50 text-[#e63946] border-rose-100'
                    : report.status === 'rejected'
                      ? 'bg-red-50 text-red-600 border-red-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200';

                return (
                  <Link
                    key={report.id}
                    to={`/report-details?submission=${report.id}`}
                    className="block p-5 hover:bg-[#f5f5f7]/60 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#1d1d1f] text-sm font-extrabold text-white shadow-2xs">
                        {report.testerName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="font-extrabold text-xs sm:text-sm text-[#1d1d1f]">{report.jobTitle}</div>
                            <div className="text-xs text-[#86868b]">Submitted by {report.testerName}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.06] bg-[#f5f5f7] px-2.5 py-1 text-xs font-semibold text-[#1d1d1f]">
                              <CategoryIcon className="h-3.5 w-3.5" style={{ color: category.color }} />
                              {category.name}
                            </span>
                            <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-extrabold uppercase ${statusClass}`}>
                              {report.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#86868b]">
                          {report.summary || 'No written summary provided.'}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center text-xs font-semibold text-[#86868b]">
              No submitted reports match your selection.
            </div>
          )}
        </section>
      </div>
    </DeveloperShell>
  );
}

// ----------------------------------------------------------------------
// 4. OTHER VIEWS (Activity & Attachments)
// ----------------------------------------------------------------------
export function SquashDeveloperActivityPage() {
  return (
    <DeveloperShell title="All Activity" subtitle="Timeline of workspace updates." active="dashboard">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-slate-600 font-semibold">Activity log loaded.</div>
      </div>
    </DeveloperShell>
  );
}

export function SquashReportAttachmentsPage() {
  const { session } = useAuth();
  const [attachments, setAttachments] = useState<DeveloperAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lightboxAttachment, setLightboxAttachment] = useState<DeveloperAttachment | null>(null);

  useEffect(() => {
    async function loadAttachments() {
      if (!session?.userId) return;
      try {
        setLoading(true);
        const data = await getDeveloperAttachments(session.userId);
        setAttachments(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load attachments');
      } finally {
        setLoading(false);
      }
    }
    loadAttachments();
  }, [session?.userId]);

  return (
    <DeveloperShell title="Report Attachments" subtitle="Uploaded files and proof from testers." active="reports">
      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"></div>
        </div>
      ) : attachments.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="text-lg font-bold text-slate-900">No attachments found</div>
          <div className="mt-2 text-sm text-slate-500">Testers have not uploaded any screenshots or videos to your active jobs yet.</div>
        </div>
      ) : (
        <div className="columns-1 gap-6 sm:columns-2 lg:columns-3 xl:columns-4">
          {attachments.map((att) => (
            <div key={att.id} className="mb-6 break-inside-avoid rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md overflow-hidden flex flex-col">
              <div 
                className="relative bg-slate-100 cursor-pointer group"
                onClick={() => setLightboxAttachment(att)}
              >
                {att.type === 'video' ? (
                  <div className="relative">
                    <video src={att.url} className="w-full h-auto object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition">
                      <div className="rounded-full bg-white/90 p-3 shadow-lg">
                        <div className="ml-1 h-0 w-0 border-y-[6px] border-l-[10px] border-y-transparent border-l-slate-900"></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <img src={att.url} alt={att.bugTitle} className="w-full h-auto object-cover" loading="lazy" />
                )}
                
                <div className="absolute top-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-700 shadow-sm backdrop-blur-md">
                  {att.type}
                </div>
              </div>

              <div className="p-4 flex flex-col gap-2">
                <div className="font-bold text-slate-900 text-sm leading-tight line-clamp-2">{att.bugTitle}</div>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className={`rounded-full px-2 py-0.5 ${
                    att.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                    att.severity === 'High' ? 'bg-orange-100 text-orange-800' :
                    att.severity === 'Medium' ? 'bg-amber-100 text-amber-800' :
                    'bg-slate-100 text-slate-800'
                  }`}>
                    {att.severity}
                  </span>
                  <span className="text-slate-500">{new Date(att.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="mt-2 text-xs text-slate-600 font-medium">
                  <div><span className="text-slate-400">Tester:</span> {att.testerName}</div>
                  <div className="truncate"><span className="text-slate-400">Job:</span> {att.jobName}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 p-4 sm:p-8 backdrop-blur-sm" onClick={() => setLightboxAttachment(null)}>
          <div className="relative max-h-full w-full max-w-5xl rounded-2xl bg-black shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setLightboxAttachment(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition"
            >
              <XCircle className="h-6 w-6" />
            </button>
            <div className="flex h-full max-h-[85vh] w-full items-center justify-center">
              {lightboxAttachment.type === 'video' ? (
                <video src={lightboxAttachment.url} controls autoPlay className="max-h-full max-w-full object-contain" />
              ) : (
                <img src={lightboxAttachment.url} alt={lightboxAttachment.bugTitle} className="max-h-full max-w-full object-contain" />
              )}
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
              <div className="text-lg font-bold">{lightboxAttachment.bugTitle}</div>
              <div className="text-sm text-white/80 mt-1">Uploaded by {lightboxAttachment.testerName} for {lightboxAttachment.jobName}</div>
            </div>
          </div>
        </div>
      )}
    </DeveloperShell>
  );
}

// ----------------------------------------------------------------------
// 5. RECENT SUBMISSIONS PAGE
// ----------------------------------------------------------------------
export function SquashDeveloperSubmissionsPage() {
  const { session } = useAuth();
  const [applications, setApplications] = useState<DeveloperApplication[]>([]);
  const [reports, setReports] = useState<DeveloperSubmissionReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'applications' | 'reports'>('all');

  useEffect(() => {
    if (!session?.userId || !session.roles.includes('developer')) return;

    let mounted = true;
    setLoading(true);
    setError('');

    Promise.all([
      getDeveloperApplications(session.userId),
      getDeveloperSubmittedReports(session.userId),
    ])
      .then(([appItems, reportItems]) => {
        if (!mounted) return;
        setApplications(appItems);
        setReports(reportItems);
      })
      .catch((err: Error) => {
        if (mounted) setError(err.message || 'Could not load submissions.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [session?.userId, session?.roles]);

  const combinedSubmissions = useMemo(() => {
    const getAppLogo = (title: string, logoUrl?: string | null) => {
      if (logoUrl) return logoUrl;
      const lower = title.toLowerCase();
      if (lower.includes('squash')) return '/squash-logo.png';
      if (lower.includes('bolt')) return 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=100&auto=format&fit=crop&q=80';
      if (lower.includes('instagram')) return 'https://images.unsplash.com/photo-1611262588024-d12430b98920?w=100&auto=format&fit=crop&q=80';
      return null;
    };

    const appList = applications.map((a) => ({
      id: a.id,
      type: 'application' as const,
      title: a.jobTitle,
      logoUrl: getAppLogo(a.jobTitle, a.jobLogoUrl),
      testerName: a.testerName,
      time: a.createdAt,
      status: a.status,
      category: a.jobCategory,
      link: '/developer/applications',
    }));

    const reportList = reports.map((r) => ({
      id: r.id,
      type: 'report' as const,
      title: r.jobTitle,
      logoUrl: getAppLogo(r.jobTitle, r.jobLogoUrl),
      testerName: r.testerName,
      time: r.createdAt,
      status: r.status,
      category: r.jobCategory,
      link: `/report-details?id=${r.id}`,
    }));

    const merged = [...appList, ...reportList].sort(
      (a, b) => Date.parse(b.time) - Date.parse(a.time)
    );

    if (filter === 'applications') return merged.filter((item) => item.type === 'application');
    if (filter === 'reports') return merged.filter((item) => item.type === 'report');
    return merged;
  }, [applications, reports, filter]);

  return (
    <DeveloperShell
      title="Recent Submissions"
      subtitle="View all incoming tester applications and bug test reports submitted across your posted jobs."
      active="applications"
    >
      <div className="space-y-6">
        {/* Stat Overview Cards */}
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Submissions</div>
                <div className="mt-2 text-3xl font-black text-slate-900">{applications.length + reports.length}</div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1d1d1f] text-white">
                <FileText className="h-6 w-6" />
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Applications</div>
                <div className="mt-2 text-3xl font-black text-slate-900">{applications.length}</div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                <UserCircle2 className="h-6 w-6" />
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Submitted Reports</div>
                <div className="mt-2 text-3xl font-black text-slate-900">{reports.length}</div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        {/* Submissions Feed */}
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">All Submissions Stream</h2>
              <p className="text-xs text-slate-500 mt-0.5">Real-time log of test applications and report submissions.</p>
            </div>
            <div className="flex items-center gap-2">
              {(['all', 'applications', 'reports'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold capitalize transition ${
                    filter === tab
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm font-semibold text-slate-500">Loading submissions...</div>
          ) : combinedSubmissions.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {combinedSubmissions.map((item) => {
                const category = getCategoryById(item.category as TestCategoryId);
                const CategoryIcon = category.icon;
                return (
                  <Link
                    key={`${item.type}-${item.id}`}
                    to={item.link}
                    className="flex flex-col gap-3 p-5 transition hover:bg-slate-50/80 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {item.logoUrl ? (
                        <img
                          src={item.logoUrl}
                          alt={`${item.title} logo`}
                          className="h-11 w-11 shrink-0 rounded-2xl border border-slate-200/80 object-cover shadow-sm bg-white"
                        />
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#1d1d1f] font-bold text-white shadow-sm">
                          {item.title.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 truncate">{item.title}</span>
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            item.type === 'application' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {item.type}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Submitted by <span className="font-semibold text-slate-700">{item.testerName}</span> • {new Date(item.time).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                        <CategoryIcon className="h-3.5 w-3.5" style={{ color: category.color }} />
                        {category.name}
                      </span>
                      <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-[#e63946] border border-rose-100 capitalize">
                        {item.status}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 text-sm font-semibold">
              No submissions found for the selected filter.
            </div>
          )}
        </section>
      </div>
    </DeveloperShell>
  );
}
