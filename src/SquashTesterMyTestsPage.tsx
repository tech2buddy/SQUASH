import {
  ClipboardList,
  } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';



import { useAuth } from './auth';
import { getCategoryById, type TestCategoryId } from './components/testCategories';
import { getTesterAssignments, type TesterAssignment } from './lib/jobApi';
import { getTesterTestLabSessions, type TestLabSession } from './lib/testLabApi';

type LabTab = 'all' | 'accepted' | 'in_progress' | 'submitted' | 'approved';

type AssignmentWithLab = TesterAssignment & {
  labStarted: boolean;
  progressPercent: number;
  completedTasks: number;
  totalTasks: number;
  lastSavedAt: string | null;
};



function parseTasks(raw: string | null | undefined) {
  return (raw || '')
    .split(/[\r\n,]+/)
    .map((task) => task.trim())
    .filter(Boolean);
}

function readLabState(assignment: TesterAssignment, labSession?: TestLabSession): AssignmentWithLab {
  const tasks = parseTasks(assignment.jobTasks);
  const totalTasks = Math.max(1, tasks.length || 1);

  if (labSession) {
    const completedTasks = Math.min(totalTasks, Math.round((labSession.progressPercent / 100) * totalTasks));
    return {
      ...assignment,
      labStarted: labSession.status !== 'not_started',
      progressPercent: labSession.progressPercent,
      completedTasks,
      totalTasks,
      lastSavedAt: labSession.lastSavedAt,
    };
  }
  return {
    ...assignment,
    labStarted: false,
    progressPercent: 0,
    completedTasks: 0,
    totalTasks,
    lastSavedAt: null,
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
    if (!session?.userId) {
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError('');

    Promise.all([getTesterAssignments(session.userId), getTesterTestLabSessions(session.userId)])
      .then(([items, labSessions]) => {
        if (!mounted) return;
        const sessionsByAssignment = new Map(labSessions.map((labSession) => [labSession.assignmentId, labSession]));
        setAssignments(items.map((item) => readLabState(item, sessionsByAssignment.get(item.id))));
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
  }, [session?.userId]);

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
    <div className="space-y-6">
      {/* Hero Header */}
            <section className="apple-bento-card p-6 animate-fade-up">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <span className="inline-flex rounded-full bg-green-100/80 px-3.5 py-1 text-xs font-extrabold text-green-800">
                    Testing Lab
                  </span>
                  <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">My Tests</h1>
                  <p className="mt-1 text-xs text-slate-500 sm:text-sm font-medium hidden sm:block">
                    Accepted jobs live here. Start a lab session, capture evidence, and submit clean reports.
                  </p>
                </div>
                {/* Inline stat pills */}
                <div className="flex shrink-0 flex-col gap-1.5">
                  <div className="flex items-center gap-2 rounded-full bg-green-50 px-3.5 py-1.5 border border-green-200/60">
                    <span className="text-sm font-extrabold text-green-800">{counts.in_progress}</span>
                    <span className="text-[11px] font-bold text-slate-600">In Lab</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-sky-50 px-3.5 py-1.5 border border-sky-200/60">
                    <span className="text-sm font-extrabold text-sky-800">{counts.submitted}</span>
                    <span className="text-[11px] font-bold text-slate-600">Submitted</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3.5 py-1.5 border border-slate-200/60">
                    <span className="text-sm font-extrabold text-slate-900">{counts.approved}</span>
                    <span className="text-[11px] font-bold text-slate-600">Approved</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Filtered Assignments List */}
            <section className="apple-bento-card overflow-hidden animate-fade-up-delayed">
              {/* Scrollable filter tabs */}
              <div className="-mx-0 flex overflow-x-auto gap-2 border-b border-slate-100 px-5 py-3.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 apple-press-effect ${
                      activeTab === tab.id
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100/60 text-slate-600 hover:bg-slate-200/60'
                    }`}
                  >
                    {tab.label} <span className="ml-1 opacity-80">{tab.count}</span>
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="px-6 py-10 text-xs font-semibold text-slate-500">Loading your testing lab...</div>
              ) : null}

              {error ? (
                <div className="mx-6 mt-6 rounded-2xl border border-red-200 bg-red-50/60 px-4 py-3 text-xs font-bold text-red-700">{error}</div>
              ) : null}

              {!loading && filteredAssignments.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-700 border border-green-200/60">
                    <ClipboardList className="h-6 w-6" />
                  </div>
                  <h2 className="mt-4 text-base font-bold text-slate-900">No tests here yet</h2>
                  <p className="mx-auto mt-1 max-w-xl text-xs text-slate-500 font-medium">
                    Apply for available jobs. Once a developer accepts you, the test appears here with a Start Test button.
                  </p>
                  <a href="/tester-jobs" className="mt-4 inline-flex rounded-full bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-slate-900/10 hover:bg-slate-800 transition apple-press-effect">
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
                    <article key={assignment.id} className="flex items-center gap-4 px-5 py-4.5 hover:bg-slate-50/60 transition-colors">
                      {/* Logo */}
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl font-extrabold text-sm ${assignment.jobLogoUrl ? 'border border-slate-200 bg-white shadow-2xs' : 'bg-slate-900 text-white'}`}>
                        {assignment.jobLogoUrl ? (
                          <img src={assignment.jobLogoUrl} alt={`${assignment.jobTitle} logo`} className="h-full w-full object-cover" />
                        ) : (
                          assignment.jobTitle.charAt(0).toUpperCase()
                        )}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h2 className="truncate text-xs font-bold text-slate-900">{assignment.jobTitle}</h2>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                              <span className="inline-flex items-center gap-1">
                                <CategoryIcon className="h-3 w-3" style={{ color: category.color }} />
                                {category.name}
                              </span>
                              <span>·</span>
                              <span>{assignment.jobPlatform}</span>
                              <span>·</span>
                              <span>Due {formatDate(assignment.dueAt)}</span>
                            </div>
                          </div>
                          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${statusClass(assignment)}`}>
                            {label}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-2.5">
                          <div className="mb-1 flex justify-between text-[10px] font-bold text-slate-400">
                            <span>{assignment.completedTasks}/{assignment.totalTasks} tasks</span>
                            <span>{assignment.progressPercent}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full rounded-full bg-green-500 transition-all duration-500" style={{ width: `${assignment.progressPercent}%` }} />
                          </div>
                        </div>

                        {/* CTA */}
                        <div className="mt-2.5">
                          {canOpenLab ? (
                            <button
                              type="button"
                              onClick={() => startLab(assignment)}
                              className="rounded-xl bg-green-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-green-700"
                            >
                              {assignment.labStarted ? 'Continue Lab' : 'Start Test'}
                            </button>
                          ) : (
                            <a href="/tester/reports" className="inline-block rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                              View Report
                            </a>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="mt-4 hidden sm:grid gap-4 lg:grid-cols-3">
              {[
                ['1', 'Start inside the lab', 'The timer and progress tracking begin only when you enter the lab.'],
                ['2', 'Capture clean evidence', 'Use screenshots, video, notes and task-linked bug reports.'],
                ['3', 'Submit once complete', 'SQUASH checks that your tasks and summary are ready before submission.'],
              ].map(([number, title, text]) => (
                <div key={number} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-50 text-xs font-black text-green-700 ring-1 ring-green-100">{number}</div>
                  <h3 className="mt-3 text-sm font-black text-slate-900">{title}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{text}</p>
                </div>
              ))}
            </section>
    </div>
  );
}


