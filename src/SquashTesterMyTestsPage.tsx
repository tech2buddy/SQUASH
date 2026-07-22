import {
  CircleDollarSign,
  ClipboardCheck,
  ClipboardList,
  Home,
  Menu,
  PlayCircle,
  Search,
  Settings,
  ShieldCheck,
  UserCircle2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TesterHeaderNav from './components/TesterHeaderNav';
import { useAuth } from './auth';
import { getCategoryById, type TestCategoryId } from './components/testCategories';
import { getTesterAssignments, type TesterAssignment } from './lib/jobApi';

type LabTab = 'all' | 'accepted' | 'in_progress' | 'submitted' | 'approved';

type AssignmentWithLab = TesterAssignment & {
  labStarted: boolean;
  progressPercent: number;
  completedTasks: number;
  totalTasks: number;
  lastSavedAt: string | null;
};

const navItems = [
  { label: 'Dashboard', icon: Home, href: '/tester/dashboard' },
  { label: 'Available Jobs', icon: ClipboardList, href: '/tester-jobs' },
  { label: 'My Tests', icon: PlayCircle, href: '/active-test', active: true },
  { label: 'Reports', icon: ClipboardCheck, href: '/tester/reports' },
  { label: 'Earnings', icon: CircleDollarSign, href: '/tester/earnings' },
  { label: 'Profile', icon: UserCircle2, href: '/tester/profile' },
  { label: 'Settings', icon: Settings, href: '/tester/settings' },
];

function parseTasks(raw: string | null | undefined) {
  return (raw || '')
    .split(/[\r\n,]+/)
    .map((task) => task.trim())
    .filter(Boolean);
}

function readLabState(assignment: TesterAssignment): AssignmentWithLab {
  const tasks = parseTasks(assignment.jobTasks);
  const totalTasks = Math.max(1, tasks.length || 1);
  const started = window.localStorage.getItem(`squash_test_lab_started_${assignment.id}`);
  const saved = window.localStorage.getItem(`squash_active_test_progress_${assignment.id}`);
  let completedTasks = 0;
  let lastSavedAt: string | null = null;

  if (saved) {
    try {
      const parsed = JSON.parse(saved) as { taskState?: boolean[]; updatedAt?: string };
      completedTasks = Array.isArray(parsed.taskState) ? parsed.taskState.filter(Boolean).length : 0;
      lastSavedAt = parsed.updatedAt || null;
    } catch {
      completedTasks = 0;
    }
  }

  return {
    ...assignment,
    labStarted: Boolean(started),
    progressPercent: Math.round((completedTasks / totalTasks) * 100),
    completedTasks,
    totalTasks,
    lastSavedAt,
  };
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'No deadline set';
  return new Intl.DateTimeFormat('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

function statusLabel(assignment: AssignmentWithLab) {
  if (assignment.status === 'submitted') return 'Submitted';
  if (assignment.status === 'approved') return 'Approved';
  if (assignment.status === 'cancelled') return 'Cancelled';
  return assignment.labStarted ? 'In Progress' : 'Accepted';
}

function statusClass(assignment: AssignmentWithLab) {
  const label = statusLabel(assignment);
  if (label === 'Approved') return 'bg-green-50 text-green-700 ring-green-100';
  if (label === 'Submitted') return 'bg-sky-50 text-sky-700 ring-sky-100';
  if (label === 'In Progress') return 'bg-amber-50 text-amber-700 ring-amber-100';
  if (label === 'Cancelled') return 'bg-red-50 text-red-600 ring-red-100';
  return 'bg-slate-50 text-slate-700 ring-slate-100';
}

export default function SquashTesterMyTestsPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<AssignmentWithLab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<LabTab>('all');

  useEffect(() => {
    if (!session?.userId || session.source !== 'supabase') {
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError('');

    getTesterAssignments(session.userId)
      .then((items) => {
        if (!mounted) return;
        setAssignments(items.map(readLabState));
      })
      .catch((err: Error) => {
        if (mounted) setError(err.message || 'Could not load your tests right now.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [session?.source, session?.userId]);

  const counts = useMemo(() => {
    return {
      all: assignments.length,
      accepted: assignments.filter((item) => item.status === 'active' && !item.labStarted).length,
      in_progress: assignments.filter((item) => item.status === 'active' && item.labStarted).length,
      submitted: assignments.filter((item) => item.status === 'submitted').length,
      approved: assignments.filter((item) => item.status === 'approved').length,
    };
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    if (activeTab === 'all') return assignments;
    if (activeTab === 'accepted') return assignments.filter((item) => item.status === 'active' && !item.labStarted);
    if (activeTab === 'in_progress') return assignments.filter((item) => item.status === 'active' && item.labStarted);
    return assignments.filter((item) => item.status === activeTab);
  }, [activeTab, assignments]);

  const startLab = (assignment: AssignmentWithLab) => {
    window.localStorage.setItem(
      `squash_test_lab_started_${assignment.id}`,
      JSON.stringify({ startedAt: new Date().toISOString(), jobId: assignment.jobId }),
    );
    navigate(`/test-lab?assignment=${assignment.id}`);
  };

  const tabs: Array<{ id: LabTab; label: string; count: number }> = [
    { id: 'all', label: 'All Tests', count: counts.all },
    { id: 'accepted', label: 'Accepted', count: counts.accepted },
    { id: 'in_progress', label: 'In Progress', count: counts.in_progress },
    { id: 'submitted', label: 'Submitted', count: counts.submitted },
    { id: 'approved', label: 'Approved', count: counts.approved },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto">
          <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-6">
            <img src="/squash-logo.png" alt="SQUASH logo" className="h-11 w-11 rounded-2xl border border-slate-200 object-cover shadow-sm" />
            <a href="/" className="text-2xl font-black tracking-tight text-slate-900 hover:text-green-700">SQUASH</a>
          </div>

          <nav className="flex-1 space-y-2 px-4 py-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.href}
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
            <div className="rounded-3xl border border-green-100 bg-green-50 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-green-700 shadow-sm">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Lab Mode</div>
                  <div className="text-sm text-slate-600">Focused testing, clean evidence, better approvals.</div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <a href="/tester/menu" className="rounded-xl border border-slate-300 p-2.5 text-slate-600 lg:hidden">
                  <Menu className="h-5 w-5" />
                </a>
                <div className="hidden max-w-xl flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:flex md:min-w-[320px] lg:min-w-[420px]">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Search tests, reports, deadlines..." />
                </div>
              </div>

              <TesterHeaderNav />
            </div>
          </header>

          <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <section className="overflow-hidden rounded-[32px] border border-green-100 bg-gradient-to-br from-green-50 via-white to-slate-50 p-6 shadow-sm lg:p-8">
              <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
                <div>
                  <div className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-green-700 ring-1 ring-green-100">
                    Testing Lab
                  </div>
                  <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900 lg:text-5xl">My Tests</h1>
                  <p className="mt-3 max-w-3xl text-slate-600">
                    Accepted jobs live here first. Start a lab session when you are ready, capture evidence, save drafts, and submit clean reports developers can actually use.
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-2xl bg-green-50 p-4">
                      <div className="text-2xl font-black text-green-700">{counts.in_progress}</div>
                      <div className="mt-1 text-xs font-semibold text-slate-600">In lab</div>
                    </div>
                    <div className="rounded-2xl bg-sky-50 p-4">
                      <div className="text-2xl font-black text-sky-700">{counts.submitted}</div>
                      <div className="mt-1 text-xs font-semibold text-slate-600">Submitted</div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="text-2xl font-black text-slate-900">{counts.approved}</div>
                      <div className="mt-1 text-xs font-semibold text-slate-600">Approved</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap gap-3 border-b border-slate-100 px-5 py-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                      activeTab === tab.id ? 'bg-green-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {tab.label} <span className="ml-1 opacity-80">{tab.count}</span>
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="px-6 py-10 text-sm font-semibold text-slate-600">Loading your testing lab...</div>
              ) : null}

              {error ? (
                <div className="mx-6 mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>
              ) : null}

              {!loading && filteredAssignments.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-green-50 text-green-700 ring-1 ring-green-100">
                    <ClipboardList className="h-7 w-7" />
                  </div>
                  <h2 className="mt-5 text-2xl font-black text-slate-900">No tests here yet</h2>
                  <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
                    Apply for available jobs. Once a developer accepts you, the test appears here with a Start Test button.
                  </p>
                  <a href="/tester-jobs" className="mt-5 inline-flex rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700">
                    Browse Available Jobs
                  </a>
                </div>
              ) : null}

              <div className="divide-y divide-slate-100">
                {filteredAssignments.map((assignment) => {
                  const category = getCategoryById(assignment.jobCategory as TestCategoryId);
                  const CategoryIcon = category.icon;
                  const label = statusLabel(assignment);
                  const canOpenLab = assignment.status === 'active';

                  return (
                    <article key={assignment.id} className="grid gap-5 px-5 py-5 lg:grid-cols-[1fr_auto] lg:items-center lg:px-6">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl font-black text-lg ${assignment.jobLogoUrl ? 'border border-slate-200 bg-white text-slate-900 shadow-sm' : 'bg-slate-900 text-white'}`}>
                            {assignment.jobLogoUrl ? (
                              <img src={assignment.jobLogoUrl} alt={`${assignment.jobTitle} logo`} className="h-full w-full object-cover" />
                            ) : (
                              assignment.jobTitle.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <h2 className="truncate text-xl font-black text-slate-900">{assignment.jobTitle}</h2>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                              <span className="inline-flex items-center gap-1.5">
                                <CategoryIcon className="h-4 w-4" style={{ color: category.color }} />
                                {category.name}
                              </span>
                              <span>{assignment.jobPlatform}</span>
                              <span>Due {formatDate(assignment.dueAt)}</span>
                            </div>
                          </div>
                        </div>

                        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
                          {assignment.jobDescription || 'Follow the developer tasks, capture issues clearly, and submit a complete report for review.'}
                        </p>

                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                            <div className="text-xs font-semibold text-slate-500">Tasks</div>
                            <div className="mt-1 font-black text-slate-900">{assignment.completedTasks}/{assignment.totalTasks}</div>
                          </div>
                          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                            <div className="text-xs font-semibold text-slate-500">Lab Status</div>
                            <div className="mt-1 font-black text-slate-900">{label}</div>
                          </div>
                          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                            <div className="text-xs font-semibold text-slate-500">Last Save</div>
                            <div className="mt-1 truncate font-black text-slate-900">{assignment.lastSavedAt ? formatDate(assignment.lastSavedAt) : 'Not started'}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4 lg:w-56">
                        <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ring-1 ${statusClass(assignment)}`}>
                          {label}
                        </span>
                        <div>
                          <div className="mb-2 flex justify-between text-xs font-semibold text-slate-500">
                            <span>Progress</span>
                            <span>{assignment.progressPercent}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100">
                            <div className="h-2 rounded-full bg-green-600 transition-all" style={{ width: `${assignment.progressPercent}%` }} />
                          </div>
                        </div>
                        {canOpenLab ? (
                          <button
                            type="button"
                            onClick={() => startLab(assignment)}
                            className="rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
                          >
                            {assignment.labStarted ? 'Continue Lab' : 'Start Test'}
                          </button>
                        ) : (
                          <a href="/tester/reports" className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">
                            View Report
                          </a>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="mt-6 grid gap-5 lg:grid-cols-3">
              {[
                ['1', 'Start inside the lab', 'The timer and progress tracking begin only when you enter the lab.'],
                ['2', 'Capture clean evidence', 'Use screenshots, video, notes and task-linked bug reports.'],
                ['3', 'Submit once complete', 'SQUASH checks that your tasks and summary are ready before submission.'],
              ].map(([number, title, text]) => (
                <div key={number} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-sm font-black text-green-700 ring-1 ring-green-100">{number}</div>
                  <h3 className="mt-4 text-lg font-black text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
                </div>
              ))}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}


