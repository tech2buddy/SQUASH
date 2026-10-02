import {
  ClipboardList,
  } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';



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
    <div className="space-y-4">
      {/* Compact Quiet Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1 border-b border-[#E7E7E5]">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[#181817]">Active Tests</h1>
          <p className="mt-0.5 text-xs text-[#666663]">
            Track accepted test assignments, complete lab tasks, and submit QA reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="squash-status-pill squash-status-info">
            {counts.in_progress} In Lab
          </span>
          <span className="squash-status-pill squash-status-success">
            {counts.approved} Approved
          </span>
        </div>
      </div>

      {/* Main Operational Container */}
      <div className="squash-panel overflow-hidden">
        {/* Filter Tabs */}
        <div className="flex overflow-x-auto gap-1.5 border-b border-[#E7E7E5] px-4 py-2.5 bg-[#FAFAF9] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 flex items-center gap-1.5 rounded-md px-3 h-[30px] text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#EEEEEC] text-[#181817] border border-[#DADAD7]'
                  : 'bg-[#FFFFFF] text-[#666663] border border-[#E7E7E5] hover:bg-[#F7F7F6] hover:text-[#181817]'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] ${activeTab === tab.id ? 'text-[#181817]' : 'text-[#92928E]'}`}>
                ({tab.count})
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs font-normal text-[#92928E]">Loading your active tests...</div>
        ) : null}

        {error ? (
          <div className="p-3 text-xs text-[#C95050] bg-[#FDECEC] border-b border-[#E7E7E5] font-medium">{error}</div>
        ) : null}

        {!loading && filteredAssignments.length === 0 ? (
          <div className="p-10 text-center bg-[#FFFFFF]">
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-md bg-[#F7F7F6] border border-[#E7E7E5] text-[#92928E]">
              <ClipboardList className="h-4 w-4" />
            </div>
            <div className="mt-2 text-xs font-semibold text-[#181817]">No tests in this view</div>
            <div className="mt-0.5 text-xs text-[#666663]">Apply for available jobs on the job board to start testing.</div>
          </div>
        ) : null}

        <div className="divide-y divide-[#EEEEEC]">
          {filteredAssignments.map((assignment) => {
            const category = getCategoryById(assignment.jobCategory as TestCategoryId);
            const CategoryIcon = category.icon;
            const label = statusLabel(assignment);
            const canOpenLab = assignment.status === 'active';

            return (
              <div key={assignment.id} className="p-4 hover:bg-[#F7F7F6] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#F7F7F6] border border-[#E7E7E5] text-xs font-semibold text-[#181817] mt-0.5">
                    {assignment.jobLogoUrl ? (
                      <img src={assignment.jobLogoUrl} alt="" className="h-full w-full object-cover rounded-md" />
                    ) : (
                      assignment.jobTitle.charAt(0).toUpperCase()
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#181817] truncate">{assignment.jobTitle}</span>
                      <span className={`squash-status-pill ${
                        label === 'Approved'
                          ? 'squash-status-success'
                          : label === 'In Progress'
                          ? 'squash-status-info'
                          : label === 'Submitted'
                          ? 'squash-status-warning'
                          : 'squash-status-neutral'
                      }`}>
                        {label}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[#666663]">
                      <span className="inline-flex items-center gap-1">
                        <CategoryIcon className="h-3 w-3 text-[#666663]" />
                        {category.name}
                      </span>
                      <span>•</span>
                      <span>{assignment.jobPlatform}</span>
                      <span>•</span>
                      <span>Due {formatDate(assignment.dueAt)}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-2 max-w-xs">
                      <div className="flex justify-between text-[10px] font-medium text-[#92928E] mb-1">
                        <span>{assignment.completedTasks}/{assignment.totalTasks} tasks</span>
                        <span>{assignment.progressPercent}%</span>
                      </div>
                      <div className="h-1 w-full bg-[#EEEEEC] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#181817] rounded-full transition-all duration-300"
                          style={{ width: `${assignment.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end shrink-0 sm:pt-0 border-t sm:border-0 border-[#EEEEEC] pt-2">
                  {canOpenLab ? (
                    <button
                      type="button"
                      onClick={() => startLab(assignment)}
                      className="squash-btn-primary !h-8 !px-3"
                    >
                      {assignment.labStarted ? 'Continue Lab' : 'Start Test'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate('/tester/reports')}
                      className="squash-btn-secondary !h-8 !px-3"
                    >
                      View Report
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


