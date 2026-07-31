import {
  BadgeCheck,
  ChevronDown,
  ClipboardList,
  Clock3,
  ContactRound,
  LineChart,
  ShieldCheck,
  Star,
  } from 'lucide-react';
import { useEffect, useState, useMemo, useCallback, useRef, type ChangeEvent } from 'react';
import SpecializationChecklist from './components/SpecializationChecklist';
import { getTesterTier } from './components/TesterBadge';
import { getCategoryById, type TestCategoryId } from './components/testCategories';
import { getSpecializationLabel } from './components/testerSpecializations';

import { useAuth } from './auth';
import { getTesterSpecializations, replaceTesterSpecializations, getTesterProfile, type TesterPublicProfile } from './lib/profileApi';
import {
  getTesterSpecializationDetails,
  submitSpecializationEvidence,
  type SpecializationVerificationStatus,
} from './lib/specializationApi';
import {
  getTesterAssignments,
  getTesterEarningsSummary,
  type TesterAssignment,
  type TesterEarningsSummary,
} from './lib/jobApi';

type Difficulty = 'Easy' | 'Medium' | 'Hard';
type TransactionStatus = 'Pending' | 'Approved' | 'Paid' | 'Changes Requested' | 'Rejected';

type StatCard = {
  title: string;
  value: string;
  note: string;
  change: string;
  badgeText: string;
  badgeBg: string;
  badgeTextColor: string;
  pulseDotColor: string;
};



function getDifficultyClasses(difficulty: Difficulty) {
  if (difficulty === 'Easy') return 'bg-green-50 text-green-700';
  if (difficulty === 'Medium') return 'bg-amber-50 text-amber-700';
  return 'bg-red-50 text-red-600';
}

function getStatusClasses(status: TransactionStatus) {
  if (status === 'Pending') return 'bg-amber-50 text-amber-700';
  if (status === 'Approved') return 'bg-sky-50 text-sky-700';
  if (status === 'Changes Requested') return 'bg-sky-50 text-sky-700';
  if (status === 'Rejected') return 'bg-red-50 text-red-600';
  return 'bg-green-50 text-green-700';
}

function formatRands(value: number) {
  return `R${Math.round(value).toLocaleString('en-ZA')}`;
}

function formatDate(value: string | null) {
  if (!value) return 'Not submitted yet';
  return new Intl.DateTimeFormat('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

const emptyEarningsSummary: TesterEarningsSummary = {
  availableBalanceZar: 0,
  pendingApprovalZar: 0,
  pendingPayoutZar: 0,
  lifetimeApprovedZar: 0,
  earnings: [],
  payouts: [],
};

export default function SquashTesterDashboardPage() {
  const { session } = useAuth();
  const testerName = session?.name || 'Alex Tester';
  const testerFirstName = testerName.split(' ')[0] || testerName;
  

  const [assignments, setAssignments] = useState<TesterAssignment[]>([]);
  const [assignmentsError, setAssignmentsError] = useState('');
  const [earningsSummary, setEarningsSummary] = useState<TesterEarningsSummary>(emptyEarningsSummary);
  const [testerProfile, setTesterProfile] = useState<TesterPublicProfile | null>(null);
  const [earningsError, setEarningsError] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [verification, setVerification] = useState<Record<string, SpecializationVerificationStatus>>({});
  const [verifyingKey, setVerifyingKey] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [verificationNotice, setVerificationNotice] = useState('');
  const evidenceInputRef = useRef<HTMLInputElement | null>(null);
  const pendingVerificationKey = useRef('');

  const refreshVerification = useCallback(async (userId: string) => {
    const details = await getTesterSpecializationDetails(userId);
    setVerification(
      Object.fromEntries(details.map((item) => [item.key, item.status])) as Record<
        string,
        SpecializationVerificationStatus
      >,
    );
    return details;
  }, []);

  useEffect(() => {
    if (!session?.userId) return;

    let mounted = true;
    getTesterSpecializations(session.userId)
      .then((savedSpecializations) => {
        if (mounted && savedSpecializations.length > 0) setSpecializations(savedSpecializations);
      })
      .catch(() => {
        // The dashboard remains empty until Supabase can return verified specializations.
      });

    refreshVerification(session.userId).catch(() => {
      // Verification badges are additive -- the checklist still works without them.
    });

    return () => {
      mounted = false;
    };
  }, [("supabase"), session?.userId]);


  useEffect(() => {
    if (!session?.userId) return;

    let mounted = true;
    setAssignmentsError('');
    setEarningsError('');

    Promise.all([getTesterAssignments(session.userId), getTesterEarningsSummary(session.userId), getTesterProfile(session.userId)])
      .then(([assignmentItems, summary, profile]) => {
        if (!mounted) return;
        setAssignments(assignmentItems);
        setEarningsSummary(summary);
        setTesterProfile(profile);
        setIsLoadingData(false);
      })
      .catch((error: Error) => {
        if (!mounted) return;
        setAssignmentsError(error.message || 'Could not load your accepted tests right now.');
        setEarningsError(error.message || 'Could not load your earnings right now.');
      })
      .finally(() => {
        if (mounted) setIsLoadingData(false);
      });

    return () => {
      mounted = false;
    };
  }, [session?.userId]);

  const earningsGraphData = useMemo(() => {
    if (!earningsSummary?.earnings || earningsSummary.earnings.length === 0) {
      return {
        monthlyEarnings: [0, 0, 0, 0, 0, 0, 0],
        monthlyLabels: ['-', '-', '-', '-', '-', '-', '-'],
        earningsMax: 100,
        earningsPoints: '0,100 16.6,100 33.3,100 50,100 66.6,100 83.3,100 100,100',
        earningsArea: '0,100 0,100 16.6,100 33.3,100 50,100 66.6,100 83.3,100 100,100 100,100'
      };
    }

    const sorted = [...earningsSummary.earnings].filter(e => e.submittedAt).sort((a, b) => new Date(a.submittedAt!).getTime() - new Date(b.submittedAt!).getTime());
    
    let chartData = sorted.slice(-7);
    while (chartData.length < 7) {
      chartData.unshift({ amountZar: 0, submittedAt: chartData[0]?.submittedAt || new Date().toISOString() } as any);
    }
    
    const monthlyEarnings = chartData.map(e => e.amountZar);
    const monthlyLabels = chartData.map(e => new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'short' }).format(new Date(e.submittedAt!)));
    
    const earningsMax = Math.max(...monthlyEarnings, 100);
    const earningsPoints = monthlyEarnings
      .map((value, index) => {
        const x = (index / (monthlyEarnings.length - 1)) * 100;
        const y = 100 - (value / earningsMax) * 100;
        return `${x},${y}`;
      })
      .join(' ');
    const earningsArea = `0,100 ${earningsPoints} 100,100`;

    return { monthlyEarnings, monthlyLabels, earningsMax, earningsPoints, earningsArea };
  }, [earningsSummary]);

  const toggleSpecialization = (id: string, checked: boolean) => {
    setSpecializations((prev) => {
      const next = checked ? Array.from(new Set([...prev, id])) : prev.filter((item) => item !== id);
      if (session?.userId) {
        replaceTesterSpecializations(session.userId, next).catch(() => {
          // Keep the UI responsive; the /Profile page can retry later.
        });
      }
      return next;
    });
  };

  const handleRequestVerification = (id: string) => {
    pendingVerificationKey.current = id;
    setVerificationError('');
    setVerificationNotice('');
    evidenceInputRef.current?.click();
  };

  const handleEvidenceSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const key = pendingVerificationKey.current;
    // Reset immediately so picking the same file twice still fires a change.
    event.target.value = '';
    if (!file || !key || !session?.userId) return;

    setVerifyingKey(key);
    setVerificationError('');
    setVerificationNotice('');
    try {
      await submitSpecializationEvidence(session.userId, key, file);
      await refreshVerification(session.userId);
      setVerificationNotice(
        `Evidence for ${getSpecializationLabel(key)} is with our reviewers. You'll be notified once it's checked.`,
      );
    } catch (error) {
      setVerificationError(
        error instanceof Error ? error.message : 'Unable to submit your evidence right now.',
      );
    } finally {
      setVerifyingKey('');
      pendingVerificationKey.current = '';
    }
  };



  const activeAssignments = assignments.filter((assignment) => assignment.status === 'active');
  const submittedAssignmentCount = assignments.filter((assignment) => assignment.status === 'submitted').length;
  const approvedAssignmentCount = assignments.filter((assignment) => assignment.status === 'approved').length;
  const approvedCount = earningsSummary.earnings.filter((item) => item.status === 'approved' || item.status === 'paid').length;
  const pendingItems = earningsSummary.earnings.filter((item) => item.status === 'pending');
  const changesRequestedItems = earningsSummary.earnings.filter((item) => item.status === 'changes_requested');
  const realStats: StatCard[] = [
    {
      title: 'Balance',
      value: formatRands(earningsSummary.availableBalanceZar),
      note: 'Scheduled for Friday EFT',
      change: `${approvedCount} approved`,
      badgeText: 'LIVE',
      badgeBg: 'bg-emerald-50 border border-emerald-200/60',
      badgeTextColor: 'text-emerald-700',
      pulseDotColor: 'bg-emerald-500',
    },
    {
      title: 'Pending',
      value: formatRands(earningsSummary.pendingApprovalZar),
      note: 'Awaiting dev review',
      change: `${pendingItems.length} pending`,
      badgeText: 'REVIEW',
      badgeBg: 'bg-amber-50 border border-amber-200/60',
      badgeTextColor: 'text-amber-700',
      pulseDotColor: 'bg-amber-500',
    },
    {
      title: 'Completed',
      value: String(approvedCount),
      note: 'Approved tests done',
      change: `${activeAssignments.length} active`,
      badgeText: 'ACTIVE',
      badgeBg: 'bg-sky-50 border border-sky-200/60',
      badgeTextColor: 'text-sky-700',
      pulseDotColor: 'bg-sky-500',
    },
    {
      title: 'Approval',
      value: earningsSummary.earnings.length ? `${Math.round((approvedCount / earningsSummary.earnings.length) * 100)}%` : '0%',
      note: earningsSummary.earnings.length ? 'Based on submitted reports' : 'Complete tests to build score',
      change: approvedCount > 0 ? 'High rate' : 'No approvals',
      badgeText: 'SCORE',
      badgeBg: 'bg-indigo-50 border border-indigo-200/60',
      badgeTextColor: 'text-indigo-700',
      pulseDotColor: 'bg-indigo-500',
    },
    {
      title: 'Member Status',
      value: 'Active',
      note: 'Verified SQUASH tester',
      change: activeAssignments.length > 0 ? 'Testing in progress' : 'Ready for jobs',
      badgeText: 'VERIFIED',
      badgeBg: 'bg-purple-50 border border-purple-200/60',
      badgeTextColor: 'text-purple-700',
      pulseDotColor: 'bg-purple-500',
    },
  ];
  const dashboardStats = realStats;
  const dashboardAvailableTests: any[] = [];
  const dashboardApprovals = [...changesRequestedItems, ...pendingItems].slice(0, 3).map((item) => ({
    name: item.jobTitle,
    date: `Submitted on ${formatDate(item.submittedAt)}`,
    amount: formatRands(item.amountZar),
    status: item.status === 'changes_requested' ? 'Changes Requested' : 'Pending',
  }));
  const dashboardTransactions = [
    ...earningsSummary.earnings.map((item) => ({
      date: formatDate(item.submittedAt),
      type: 'Earning',
      description: item.jobTitle,
      amount: formatRands(item.amountZar),
      status:
        item.status === 'approved'
          ? 'Approved'
          : item.status === 'paid'
            ? 'Paid'
            : item.status === 'changes_requested'
              ? 'Changes Requested'
              : item.status === 'rejected'
                ? 'Rejected'
                : 'Pending',
    })),
    ...earningsSummary.payouts.map((payout) => ({
      date: formatDate(payout.createdAt),
      type: 'Payout',
      description: payout.status === 'paid' ? 'Paid to payout method' : 'Payout request',
      amount: `-${formatRands(payout.amountZar)}`,
      status: payout.status === 'paid' ? 'Paid' : 'Pending',
    })),
  ].slice(0, 6) as Array<{ date: string; type: string; description: string; amount: string; status: TransactionStatus }>;

  const dashboardCompletedTests = earningsSummary.earnings
    .filter((item) => item.status === 'approved' || item.status === 'paid')
    .slice(0, 3)
    .map((item) => ({
      name: item.jobTitle,
      type: 'Approved Report',
    }));

  if (isLoadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f7] px-4 text-center text-sm font-semibold text-slate-600">
        <div className="apple-bento-card flex items-center gap-3 px-6 py-4">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }
  const rating = testerProfile?.rating || 0;
  const currentTier = getTesterTier(approvedCount, rating);

  let tierProgress: number;
  let progressText: string;

  if (currentTier.tier === 'new') {
    const nextTierGoal = 6;
    tierProgress = Math.min(100, Math.round((approvedCount / nextTierGoal) * 100));
    progressText = `${approvedCount} / ${nextTierGoal} tests to Verified`;
  } else if (currentTier.tier === 'verified') {
    const nextTierGoal = 21;
    tierProgress = Math.min(100, Math.round((approvedCount / nextTierGoal) * 100));
    progressText = `${approvedCount} / ${nextTierGoal} tests to Pro`;
  } else if (currentTier.tier === 'pro') {
    const nextTierGoal = 51;
    tierProgress = Math.min(100, Math.round((approvedCount / nextTierGoal) * 100));
    progressText = `${approvedCount} / ${nextTierGoal} tests to Elite`;
  } else {
    tierProgress = 100;
    progressText = 'Max tier achieved';
  }

  const TierIcon = 
    currentTier.tier === 'elite' ? ShieldCheck : 
    currentTier.tier === 'pro' ? Star :
    currentTier.tier === 'verified' ? BadgeCheck : Star;

  return (
    <div className="space-y-6">
      {/* Hero Welcome Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-up">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                  Welcome back, {testerFirstName}!
                </h1>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm font-medium">
                  Here is what is happening with your testing journey.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/tester-jobs"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-slate-900/10 hover:bg-slate-800 transition apple-press-effect"
                >
                  <ClipboardList className="h-4 w-4" />
                  Browse Jobs
                </a>
              </div>
            </div>

            {/* Apple Bento Box Stat Grid */}
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5 animate-fade-up-delayed">
              {dashboardStats.map((card, index) => {
                const isLastOnMobileLine = index === dashboardStats.length - 1; // 5th card
                return (
                  <div
                    key={card.title}
                    className={`apple-bento-card p-3.5 sm:p-4 flex flex-col justify-between overflow-hidden ${
                      isLastOnMobileLine ? 'col-span-2 sm:col-span-1 xl:col-span-1' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[11px] sm:text-xs font-bold tracking-tight text-slate-500 truncate min-w-0 flex-1">{card.title}</span>
                      <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-black tracking-wider uppercase ${card.badgeBg} ${card.badgeTextColor}`}>
                        <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${card.pulseDotColor}`} />
                        {card.badgeText}
                      </span>
                    </div>

                    <div className="mt-3 min-w-0">
                      <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 truncate">{card.value}</div>
                      <div className="mt-1 flex flex-col items-start gap-1 text-[10px] sm:text-[11px] min-w-0">
                        {card.note ? <span className="text-slate-400 font-medium truncate w-full">{card.note}</span> : null}
                        <span className="inline-block max-w-full truncate rounded-full bg-slate-100 px-2 py-0.5 font-bold text-slate-700">
                          {card.change}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>

            {/* Main Content Layout */}
            <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
              <div className="space-y-6">
                {/* Available Tests Bento Card */}
                <div className="apple-bento-card overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Available Tests</h2>
                      <p className="text-xs font-medium text-slate-500">New opportunities matching your skills.</p>
                    </div>
                    <a href="/tester-jobs" className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition apple-press-effect">
                      View All
                    </a>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {dashboardAvailableTests.map((test) => (
                      <div key={test.name} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50/80 transition-colors">
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-900 truncate">{test.name}</div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                            <span className="truncate">{test.meta}</span>
                            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${getDifficultyClasses(test.difficulty)}`}>
                              {test.difficulty}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-1.5">
                      <Star className="h-5 w-5 fill-indigo-500 text-indigo-500" />
                      <span className="text-xl font-bold text-slate-900">{rating.toFixed(1)}</span>
                    </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <div className="text-right">
                            <div className="text-sm font-extrabold text-slate-900">{test.amount}</div>
                          </div>
                          <a href="/tester-jobs" className="rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition apple-press-effect">
                            View
                          </a>
                        </div>
                      </div>
                    ))}
                    {dashboardAvailableTests.length === 0 ? (
                      <div className="px-5 py-6 text-xs text-slate-500">
                        Open the Available Jobs page to browse real jobs. Personalised matches will appear here soon.
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* My Test Progress Bento Card */}
                <div className="apple-bento-card overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">My Test Progress</h2>
                      <p className="text-xs font-medium text-slate-500">Track your active tests and deadlines.</p>
                    </div>
                  </div>

                  <div className="flex gap-4 border-b border-slate-100 px-5 py-2.5 text-xs font-bold text-slate-500 bg-slate-50/50">
                    <span className="text-green-600 font-extrabold">In Progress ({activeAssignments.length})</span>
                    <span>Submitted ({submittedAssignmentCount})</span>
                    <span>Approved ({approvedAssignmentCount})</span>
                  </div>

                  <div className="divide-y divide-slate-100 px-5">
                    {assignmentsError ? (
                      <div className="py-3 text-xs font-semibold text-red-600">{assignmentsError}</div>
                    ) : null}
                    {activeAssignments.map((assignment) => {
                      const category = getCategoryById(assignment.jobCategory as TestCategoryId);
                      const CategoryIcon = category.icon;
                      return (
                        <div key={assignment.id} className="flex items-center justify-between gap-3 py-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-bold text-slate-900 truncate">{assignment.jobTitle}</div>
                              <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-0.5 text-[10px] font-bold text-green-700 ring-1 ring-green-200">Accepted</span>
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                              <CategoryIcon className="h-3.5 w-3.5" style={{ color: category.color }} />
                              {category.name} · {assignment.jobPlatform}
                            </div>
                          </div>
                          <a href={`/active-test?assignment=${assignment.id}`} className="shrink-0 rounded-full bg-green-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-green-600/20 hover:bg-green-700 transition apple-press-effect">
                            Start Test
                          </a>
                        </div>
                      );
                    })}
                    {activeAssignments.length === 0 && !assignmentsError && !isLoadingData ? (
                      <div className="py-8 text-center">
                        <ClipboardList className="mx-auto h-9 w-9 text-slate-300" />
                        <div className="mt-2 text-sm font-bold text-slate-700">No active tests</div>
                        <div className="mt-1 text-xs text-slate-500">Check Available Jobs to find new opportunities.</div>
                      </div>
                    ) : null}
                  </div>

                  <div className="border-t border-slate-100 px-5 py-3 text-center bg-slate-50/30">
                    <a href="/active-test" className="text-xs font-bold text-green-700 hover:underline">View All My Tests →</a>
                  </div>
                </div>

                {/* Completed Tests Bento Card */}
                <div className="apple-bento-card overflow-hidden">
                  <div className="border-b border-slate-100 px-5 py-4">
                    <h2 className="text-base font-bold text-slate-900">Completed Tests</h2>
                    <p className="text-xs font-medium text-slate-500">Your latest developer-approved test submissions.</p>
                  </div>
                  <div className="divide-y divide-slate-100 px-5">
                    {dashboardCompletedTests.map((test) => (
                      <div key={test.name} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-sm font-bold text-slate-900">{test.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{test.type}</div>
                        </div>
                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">Approved</span>
                      </div>
                    ))}
                    {dashboardCompletedTests.length === 0 ? (
                      <div className="py-6 text-xs text-slate-500">
                        No approved reports yet. Once a developer approves your test, it will appear here.
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Sidebar Column Widgets */}
              <div className="space-y-6">
                {/* Earnings Overview Bento Widget */}
                <div className="apple-bento-card p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-900">Earnings Overview</h2>
                    <div className="text-xs font-bold text-slate-400">This Month</div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                    <div className="h-36">
                      <svg viewBox="0 0 100 100" className="h-full w-full">
                        <defs>
                          <linearGradient id="testerEarningsArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#34c759" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#34c759" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <polyline points={earningsGraphData.earningsArea} fill="url(#testerEarningsArea)" stroke="none" />
                        <polyline
                          points={earningsGraphData.earningsPoints}
                          fill="none"
                          stroke="#16a34a"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {earningsGraphData.monthlyEarnings.map((value: number, index: number) => {
                          const x = (index / (earningsGraphData.monthlyEarnings.length - 1)) * 100;
                          const y = 100 - (value / earningsGraphData.earningsMax) * 100;
                          return <circle key={index} cx={`${x}%`} cy={`${y}%`} r="3" fill="#16a34a" className="transition-all duration-300 hover:r-4" />;
                        })}
                      </svg>
                    </div>
                    <div className="mt-3 flex justify-between text-[10px] font-bold text-slate-400">
                      {earningsGraphData.monthlyLabels.map((label: string, i: number) => (
                        <span key={i}>{label}</span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-900 p-4 text-white">
                    <div className="flex items-center gap-2.5 text-xs font-bold">
                      <LineChart className="h-5 w-5 text-green-400" />
                      Total Earnings
                    </div>
                    <span className="text-lg font-extrabold text-green-400">{formatRands(earningsSummary.lifetimeApprovedZar)}</span>
                  </div>
                </div>

                {/* Payout Method Bento Widget */}
                <div className="apple-bento-card p-5">
                  <h2 className="text-base font-bold text-slate-900">Payout Method</h2>

                  <div className="mt-3.5 space-y-2">
                    <label className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50/60 p-3 text-xs font-bold text-slate-900 cursor-pointer">
                      <input type="radio" name="payout-method" defaultChecked className="h-4 w-4 accent-green-600" />
                      Bank Transfer (EFT)
                    </label>
                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100/50">
                      <input type="radio" name="payout-method" className="h-4 w-4 accent-green-600" />
                      SnapScan
                    </label>
                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100/50">
                      <input type="radio" name="payout-method" className="h-4 w-4 accent-green-600" />
                      Airtime top-up
                    </label>
                  </div>

                  <div className="mt-3 text-xs text-slate-400 font-medium">
                    {earningsSummary.payouts.length > 0
                      ? `Last payout: ${formatDate(earningsSummary.payouts[0].createdAt)} · ${formatRands(earningsSummary.payouts[0].amountZar)}`
                      : 'No payouts yet'}
                  </div>
                  <a href="/tester/payout-method" className="mt-3 block text-xs font-bold text-slate-900 hover:underline">
                    Change Payout Method →
                  </a>
                </div>

                {/* Pending Approvals Widget */}
                <div className="apple-bento-card p-5">
                  <h2 className="text-base font-bold text-slate-900">Pending Approvals</h2>
                  <p className="mt-1 text-xs text-slate-500 font-medium">Submissions waiting for developer review.</p>
                  <div className="mt-4 space-y-3">
                    {earningsError ? (
                      <div className="rounded-2xl border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-600">{earningsError}</div>
                    ) : null}
                    {dashboardApprovals.map((item) => (
                      <div key={item.name} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">{item.name}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{item.date}</div>
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="text-xs font-extrabold text-slate-900">{item.amount}</div>
                            <div className="mt-1 inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200">
                              {item.status}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {dashboardApprovals.length === 0 ? (
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-xs text-slate-500 font-medium">
                        No reports are waiting for approval right now.
                      </div>
                    ) : null}
                  </div>
                  <a href="/tester/submissions" className="mt-4 block text-xs font-bold text-slate-900 hover:underline">
                    View All Submissions →
                  </a>
                </div>
              </div>
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
              <div className="apple-bento-card overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <h2 className="text-base font-bold text-slate-900">Transaction History</h2>
                  <button className="rounded-full border border-slate-200/80 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition apple-press-effect">
                    This Month <ChevronDown className="inline h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Mobile Cards List */}
                <div className="divide-y divide-slate-100 md:hidden">
                  {dashboardTransactions.map((item) => (
                    <div key={`${item.date}-${item.description}`} className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-900">{item.description}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{item.date} • {item.type}</div>
                        </div>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${getStatusClasses(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="flex justify-end pt-1">
                        <span className={`font-extrabold text-sm ${item.amount.startsWith('-') ? 'text-red-600' : 'text-slate-900'}`}>
                          {item.amount}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <th className="px-5 py-3.5">Date</th>
                        <th className="px-5 py-3.5">Type</th>
                        <th className="px-5 py-3.5">Description</th>
                        <th className="px-5 py-3.5">Amount</th>
                        <th className="px-5 py-3.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dashboardTransactions.map((item) => (
                        <tr key={`${item.date}-${item.description}`} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-5 py-4 text-xs font-semibold text-slate-500">{item.date}</td>
                          <td className="px-5 py-4 text-xs font-medium text-slate-600">{item.type}</td>
                          <td className="px-5 py-4 text-sm font-bold text-slate-900">{item.description}</td>
                          <td className={`px-5 py-4 text-sm font-extrabold ${item.amount.startsWith('-') ? 'text-red-600' : 'text-slate-900'}`}>
                            {item.amount}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${getStatusClasses(item.status)}`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-slate-100 px-5 py-3.5 text-center bg-slate-50/30">
                  <a href="/tester/earnings" className="text-xs font-bold text-slate-900 hover:underline">View All Transactions →</a>
                </div>
              </div>

              <div className="apple-bento-card p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-900">Tester Level</h2>
                    <ContactRound className="h-5 w-5 text-slate-400" />
                  </div>

                  <div className="mt-4 flex items-center gap-4">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm border ${currentTier.bg} ${currentTier.border}`}>
                      <TierIcon className={`h-7 w-7 ${currentTier.color}`} />
                    </div>
                    <div>
                      <div className="text-xl font-extrabold text-slate-900">{currentTier.label.replace(' 💎', '')}</div>
                      <div className="text-xs font-semibold text-slate-500">Tier Status</div>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                      <span>Progress</span>
                      <span>{progressText}</span>
                    </div>
                    <div className="mt-2 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-slate-900 transition-all duration-500" style={{ width: `${tierProgress}%` }} />
                    </div>
                  </div>

                  <div className="mt-5 space-y-2.5 text-slate-700">
                    <div className="flex items-center gap-2.5 text-xs font-semibold">
                      <ShieldCheck className="h-4 w-4 shrink-0 text-green-600" />
                      <span>Complete tests consistently</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs font-semibold">
                      <BadgeCheck className="h-4 w-4 shrink-0 text-green-600" />
                      <span>Keep approval rate above 90%</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs font-semibold">
                      <Clock3 className="h-4 w-4 shrink-0 text-green-600" />
                      <span>Stay active every month</span>
                    </div>
                  </div>
                </div>

                <a href="/tester/level-benefits" className="mt-5 block text-xs font-bold text-slate-900 hover:underline">
                  View Level Benefits →
                </a>
              </div>
            </section>

            <section className="mt-6 apple-bento-card p-6">
              <h2 className="text-lg font-bold text-slate-900">My Specializations</h2>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Choose your strengths so we can match you with the right tests. Language, network and
                assistive-technology specializations pay more, and need to be verified once before you
                can apply to those jobs.
              </p>

              {verificationNotice ? (
                <p className="mt-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
                  {verificationNotice}
                </p>
              ) : null}
              {verificationError ? (
                <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                  {verificationError}
                </p>
              ) : null}
              {verifyingKey ? (
                <p className="mt-3 text-xs font-semibold text-slate-500">
                  Uploading and scanning your evidence…
                </p>
              ) : null}

              <input
                ref={evidenceInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
                onChange={handleEvidenceSelected}
                className="hidden"
              />

              <div className="mt-4">
                <SpecializationChecklist
                  selected={specializations}
                  onToggle={toggleSpecialization}
                  verification={verification}
                  onRequestVerification={handleRequestVerification}
                />
              </div>
            </section>

            <section className="relative mt-6 overflow-hidden rounded-[24px] border border-white/60 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-lg shadow-slate-900/10">
              <div className="pointer-events-none absolute -left-12 -top-12 h-36 w-36 rounded-full bg-green-500/20 blur-3xl" />
              <div className="pointer-events-none absolute -right-10 bottom-0 h-28 w-28 rounded-full bg-emerald-500/20 blur-2xl" />
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between relative z-10">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight">Need Help?</h2>
                  <p className="mt-1 text-xs text-slate-300 font-medium">Our support team is here to help with any payout or test questions.</p>
                </div>
                <a href="/help-center" className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-xs font-bold text-slate-900 hover:bg-slate-100 transition apple-press-effect shadow-sm">
                  Contact Support
                </a>
              </div>
            </section>
    </div>
  );
}


