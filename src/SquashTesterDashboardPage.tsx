import {
  Award,
  BadgeCheck,
  Building2,
  ClipboardList,
  FileCheck,
  FlaskConical,
  ShieldCheck,
  Star,
  Timer,
  Wallet,
} from 'lucide-react';
import { type ComponentType, useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router';
import SpecializationChecklist from './components/SpecializationChecklist';
import { getTesterTier } from './components/TesterBadge';
import { getCategoryById, type TestCategoryId } from './components/testCategories';

import { useAuth } from './auth';
import { getTesterSpecializations, replaceTesterSpecializations, getTesterProfile, type TesterPublicProfile } from './lib/profileApi';
import {
  getTesterSpecializationDetails,
  isSpecializationActive,
} from './lib/specializationApi';
import type { SpecializationDisplayStatus } from './components/SpecializationChecklist';
import {
  getActiveJobs,
  getTesterApplications,
  getTesterAssignments,
  getTesterEarningsSummary,
  type DeveloperJob,
  type JobApplication,
  type TesterAssignment,
  type TesterEarningsSummary,
} from './lib/jobApi';
import { testerPayoutForJob } from './lib/pricing';
import { getTestTypeByKey } from './lib/testTypes';

type TransactionStatus = 'Pending' | 'Approved' | 'Paid' | 'Changes Requested' | 'Rejected';

type StatCard = {
  title: string;
  value: string;
  note: string;
  change: string;
  icon: ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  badgeText: string;
  badgeBg: string;
  badgeTextColor: string;
};

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
  const testerName = session?.name || 'Mzwakhe Tester';
  const testerFirstName = testerName.split(' ')[0] || testerName;

  const [assignments, setAssignments] = useState<TesterAssignment[]>([]);
  const [assignmentsError, setAssignmentsError] = useState('');
  const [earningsSummary, setEarningsSummary] = useState<TesterEarningsSummary>(emptyEarningsSummary);
  const [testerProfile, setTesterProfile] = useState<TesterPublicProfile | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [activeJobs, setActiveJobs] = useState<DeveloperJob[]>([]);
  const [testerApplications, setTesterApplications] = useState<JobApplication[]>([]);
  const [isLoadingOpportunities, setIsLoadingOpportunities] = useState(true);
  const [opportunitiesError, setOpportunitiesError] = useState('');
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [verification, setVerification] = useState<Record<string, SpecializationDisplayStatus>>({});
  const [verificationNotice, setVerificationNotice] = useState('');
  const evidenceInputRef = useRef<HTMLInputElement | null>(null);
  const pendingVerificationKey = useRef('');

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

    getTesterSpecializationDetails(session.userId)
      .then((details) => {
        if (!mounted) return;
        // An approved-but-lapsed verification is shown as expired, not verified.
        setVerification(
          Object.fromEntries(
            details.map((item) => [
              item.key,
              item.status === 'approved' && !isSpecializationActive(item) ? 'expired' : item.status,
            ]),
          ) as Record<string, SpecializationDisplayStatus>,
        );
      })
      .catch(() => {
        // Verification badges are additive -- the checklist still works without them.
      });

    return () => {
      mounted = false;
    };
  }, [session?.userId]);


  useEffect(() => {
    if (!session?.userId) return;

    let mounted = true;
    Promise.all([getTesterAssignments(session.userId), getTesterEarningsSummary(session.userId), getTesterProfile(session.userId)])
      .then(([assignmentItems, summary, profile]) => {
        if (!mounted) return;
        setAssignmentsError('');
        setAssignments(assignmentItems);
        setEarningsSummary(summary);
        setTesterProfile(profile);
        setIsLoadingData(false);
      })
      .catch((error: Error) => {
        if (!mounted) return;
        setAssignmentsError(error.message || 'Could not load your dashboard data right now.');
      })
      .finally(() => {
        if (mounted) setIsLoadingData(false);
      });

    return () => {
      mounted = false;
    };
  }, [session?.userId]);

  useEffect(() => {
    if (!session?.userId) return;

    let mounted = true;
    Promise.all([getActiveJobs(), getTesterApplications(session.userId)])
      .then(([jobs, applications]) => {
        if (!mounted) return;
        setActiveJobs(jobs);
        setTesterApplications(applications);
      })
      .catch((error: Error) => {
        if (mounted) setOpportunitiesError(error.message || 'Could not load available jobs right now.');
      })
      .finally(() => {
        if (mounted) setIsLoadingOpportunities(false);
      });

    return () => {
      mounted = false;
    };
  }, [session?.userId]);

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

  const handleRequestVerification = async (id: string) => {
    setVerificationNotice('');
    pendingVerificationKey.current = id;
    evidenceInputRef.current?.click();
  };

  const activeAssignments = useMemo(
    () => assignments.filter((a) => a.status === 'active'),
    [assignments],
  );

  const approvedCount = earningsSummary.earnings.filter((item) => item.status === 'approved' || item.status === 'paid').length;
  const pendingItems = earningsSummary.earnings.filter((item) => item.status === 'pending');
  const changesRequestedItems = earningsSummary.earnings.filter((item) => item.status === 'changes_requested');

  const realStats: StatCard[] = [
    {
      title: 'Available Balance',
      value: formatRands(earningsSummary.availableBalanceZar),
      note: 'Scheduled for Friday EFT',
      change: `${approvedCount} approved tests`,
      icon: Wallet,
      iconBg: 'bg-[#1d1d1f] text-white shadow-2xs',
      iconColor: 'text-white',
      badgeText: 'EFT READY',
      badgeBg: 'bg-[#f5f5f7] text-[#1d1d1f] border border-black/10',
      badgeTextColor: 'text-[#1d1d1f]',
    },
    {
      title: 'Pending Review',
      value: formatRands(earningsSummary.pendingApprovalZar),
      note: 'Awaiting dev approval',
      change: `${pendingItems.length} reports in review`,
      icon: Timer,
      iconBg: 'bg-[#1d1d1f] text-white shadow-2xs',
      iconColor: 'text-white',
      badgeText: 'IN REVIEW',
      badgeBg: 'bg-amber-50 text-amber-700 border border-amber-200/60',
      badgeTextColor: 'text-amber-700',
    },
    {
      title: 'Completed Tests',
      value: String(approvedCount),
      note: 'Approved submissions',
      change: `${activeAssignments.length} active assignments`,
      icon: FileCheck,
      iconBg: 'bg-[#e63946] text-white shadow-2xs',
      iconColor: 'text-white',
      badgeText: 'VERIFIED',
      badgeBg: 'bg-rose-50 text-[#e63946] border border-rose-100',
      badgeTextColor: 'text-[#e63946]',
    },
    {
      title: 'Approval Score',
      value: earningsSummary.earnings.length ? `${Math.round((approvedCount / earningsSummary.earnings.length) * 100)}%` : '100%',
      note: earningsSummary.earnings.length ? 'Based on report history' : 'Top 10% quality score',
      change: approvedCount > 0 ? 'High Rating' : 'Level 1 Verified',
      icon: Award,
      iconBg: 'bg-[#1d1d1f] text-white shadow-2xs',
      iconColor: 'text-white',
      badgeText: 'SCORE',
      badgeBg: 'bg-[#f5f5f7] text-[#1d1d1f] border border-black/10',
      badgeTextColor: 'text-[#1d1d1f]',
    },
  ];
  const dashboardStats = realStats;

  const featuredOpportunities = useMemo(
    () =>
      activeJobs.slice(0, 3).map((job) => {
        const category = getCategoryById(job.category as TestCategoryId);
        const testType = getTestTypeByKey(job.packageKey);
        const application = testerApplications.find((item) => item.jobId === job.id);
        const isMatched = job.preferredSpecializations.some((id) => specializations.includes(id));
        return {
          id: job.id,
          title: job.title,
          payout: formatRands(testerPayoutForJob(job.totalAmountZar, job.testersNeeded)),
          category: category.name,
          platform: job.platform,
          testType: testType.shortLabel,
          duration: `${testType.estimatedMinutes} mins`,
          urgency: isMatched ? 'Matched' : 'Open',
          icon: category.icon,
          logoUrl: job.logoUrl,
          applicationStatus: application?.status,
        };
      }),
    [activeJobs, specializations, testerApplications],
  );

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

  if (isLoadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f7] px-4 text-center text-sm font-semibold text-[#86868b]">
        <div className="apple-interactive-card flex items-center gap-3 px-6 py-4">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#1d1d1f] border-t-transparent" />
          <span>Loading TestFlight workspace...</span>
        </div>
      </div>
    );
  }
  const rating = testerProfile?.rating || 5.0;
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
    <div className="tester-dashboard space-y-6">
      {/* Compact Quiet Page Header */}
      <section className="tester-dashboard-hero flex flex-col gap-6 overflow-hidden rounded-[26px] p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="tester-dashboard-hero-status mb-3 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/45 px-3 py-1 text-[11px] font-semibold text-emerald-950/75 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(34,197,94,0.16)]" />
            Your tester workspace is active
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="tester-dashboard-hero-title text-3xl font-bold tracking-[-0.045em] text-[#17201b] sm:text-4xl">
              Good to see you, {testerFirstName}.
            </h1>
            <span className="tester-dashboard-hero-verified rounded-full bg-[#173b2a] px-2.5 py-1 text-[10px] font-bold tracking-wide text-white">
              VERIFIED
            </span>
          </div>
          <p className="tester-dashboard-hero-subtitle mt-2 max-w-xl text-sm leading-6 text-[#536158]">
            Your assignments, earnings and next opportunities—organised in one calm place.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="tester-dashboard-hero-balance hidden rounded-2xl border border-white/70 bg-white/45 px-4 py-3 text-right backdrop-blur sm:block">
            <div className="tester-dashboard-hero-balance-label text-[10px] font-bold uppercase tracking-[0.12em] text-[#6c766f]">Available now</div>
            <div className="tester-dashboard-hero-balance-value mt-1 text-xl font-bold tracking-tight text-[#173b2a]">{formatRands(earningsSummary.availableBalanceZar)}</div>
          </div>
          <Link to="/tester-jobs" className="tester-dashboard-hero-cta inline-flex h-11 items-center gap-2 rounded-2xl bg-[#173b2a] px-5 text-sm font-semibold text-white transition">
            <ClipboardList className="h-4 w-4" />
            Explore tests
          </Link>
        </div>
      </section>

      {/* Metric Row (4 Compact Cards: 84-96px tall, 1px border #E7E7E5, 8-10px radius) */}
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {dashboardStats.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="tester-dashboard-stat squash-panel min-h-[132px] p-4 sm:p-5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${card.iconBg}`}>
                    <Icon className={`h-4 w-4 ${card.iconColor}`} />
                  </div>
                  <span className="text-[11px] font-medium text-[#666663] truncate">{card.title}</span>
                </div>
                <span className={`rounded-full px-2 py-1 text-[9px] font-bold tracking-wider shrink-0 ${card.badgeBg} ${card.badgeTextColor}`}>
                  {card.badgeText}
                </span>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-[#181817] leading-none tracking-[-0.05em]">
                  {card.value}
                </div>
                <div className="mt-2 text-[11px] text-[#6d746f] truncate">
                  {card.change} · {card.note}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Central Operational Layout */}
      <section className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        {/* Left Main Operational Column */}
        <div className="space-y-5">
          {/* Active Tests Section (Data Table) */}
          <div className="squash-panel overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E7E7E5] bg-[#FAFAF9]">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-[#181817]" />
                <h2 className="text-sm font-semibold text-[#181817]">Active Tests</h2>
                <span className="text-xs font-normal text-[#92928E]">({activeAssignments.length})</span>
              </div>
              <Link to="/active-test" className="text-xs font-medium text-[#666663] hover:text-[#181817]">
                View all →
              </Link>
            </div>

            {assignmentsError ? (
              <div className="p-3 text-xs text-[#C95050] bg-[#FDECEC] border-b border-[#E7E7E5] font-medium">
                {assignmentsError}
              </div>
            ) : null}

            {activeAssignments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="squash-table-header">
                      <th className="px-4 py-2 font-medium">Test / Job</th>
                      <th className="px-4 py-2 font-medium">Category</th>
                      <th className="px-4 py-2 font-medium">Platform</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeAssignments.map((assignment) => {
                      const category = getCategoryById(assignment.jobCategory as TestCategoryId);
                      const CategoryIcon = category.icon;
                      return (
                        <tr key={assignment.id} className="squash-table-row">
                          <td className="px-4 py-2.5 font-medium text-[#181817] max-w-[200px] truncate">
                            {assignment.jobTitle}
                          </td>
                          <td className="px-4 py-2.5 text-[#666663]">
                            <div className="inline-flex items-center gap-1.5 text-xs">
                              <CategoryIcon className="h-3.5 w-3.5 text-[#666663]" />
                              <span>{category.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-[#666663] text-xs">
                            {assignment.jobPlatform}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="squash-status-pill squash-status-info">
                              In Progress
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <Link
                              to={`/active-test?assignment=${assignment.id}`}
                              className="squash-btn-primary !h-8 !px-3 !text-[11px]"
                            >
                              Start Test
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center bg-[#FFFFFF]">
                <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-md bg-[#F7F7F6] border border-[#E7E7E5] text-[#92928E]">
                  <FlaskConical className="h-4 w-4" />
                </div>
                <div className="mt-2 text-xs font-semibold text-[#181817]">No active test assignments</div>
                <div className="mt-0.5 text-xs text-[#666663]">Apply for available tests below to begin testing.</div>
              </div>
            )}
          </div>

          {/* Recommended / Featured Tests Section */}
          <div className="squash-panel overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E7E7E5] bg-[#FAFAF9]">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#181817]" />
                <h2 className="text-sm font-semibold text-[#181817]">Available Opportunities</h2>
              </div>
              <Link to="/tester-jobs" className="text-xs font-medium text-[#666663] hover:text-[#181817]">
                View all jobs →
              </Link>
            </div>

            <div className="divide-y divide-[#EEEEEC]">
              {isLoadingOpportunities ? (
                <div className="space-y-3 p-4" aria-label="Loading available jobs">
                  {[0, 1].map((item) => (
                    <div key={item} className="flex animate-pulse items-center gap-3">
                      <div className="h-8 w-8 rounded-md bg-[#EEEEEC]" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-2/5 rounded bg-[#EEEEEC]" />
                        <div className="h-2.5 w-3/5 rounded bg-[#F2F2F0]" />
                      </div>
                      <div className="h-8 w-16 rounded-md bg-[#EEEEEC]" />
                    </div>
                  ))}
                </div>
              ) : null}

              {opportunitiesError ? (
                <div className="p-5 text-center">
                  <p className="text-xs font-semibold text-[#C95050]">Available jobs could not be loaded.</p>
                  <Link to="/tester-jobs" className="mt-2 inline-flex text-xs font-semibold text-[#181817] hover:underline">
                    Open the jobs board →
                  </Link>
                </div>
              ) : null}

              {!isLoadingOpportunities && !opportunitiesError && featuredOpportunities.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-xs font-semibold text-[#181817]">No open jobs right now</p>
                  <p className="mt-1 text-[11px] text-[#666663]">New testing opportunities will appear here as developers publish them.</p>
                </div>
              ) : null}

              {featuredOpportunities.map((test) => {
                const ItemIcon = test.icon;
                const actionLabel =
                  test.applicationStatus === 'accepted'
                    ? 'Accepted'
                    : test.applicationStatus === 'pending'
                      ? 'Applied'
                      : test.applicationStatus === 'rejected'
                        ? 'Not selected'
                        : test.applicationStatus === 'withdrawn'
                          ? 'Withdrawn'
                          : 'Apply';
                return (
                  <div key={test.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-[#F7F7F6] transition-colors">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#F7F7F6] border border-[#E7E7E5] text-[#181817] mt-0.5">
                        {test.logoUrl ? (
                          <img src={test.logoUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <ItemIcon className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#181817] truncate">{test.title}</span>
                          <span className={`squash-status-pill ${test.urgency === 'Matched' ? 'squash-status-success' : 'squash-status-neutral'}`}>
                            {test.urgency}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[#666663]">
                          <span>{test.category}</span>
                          <span>•</span>
                          <span>{test.platform}</span>
                          <span>•</span>
                          <span>{test.testType}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center justify-between sm:justify-end gap-4 mt-1 sm:mt-0 border-t sm:border-0 border-[#EEEEEC] pt-2 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <div className="text-xs font-semibold text-[#181817]">{test.payout}</div>
                        <div className="text-[11px] text-[#92928E]">{test.duration}</div>
                      </div>
                      <Link
                        to={`/tester-jobs/${test.id}`}
                        className={`${test.applicationStatus ? 'squash-btn-secondary' : 'squash-btn-primary'} !h-8 !px-3`}
                      >
                        {actionLabel}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activity Table */}
          <div className="squash-panel overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E7E7E5] bg-[#FAFAF9]">
              <h2 className="text-sm font-semibold text-[#181817]">Recent Activity</h2>
              <Link to="/tester/earnings" className="text-xs font-medium text-[#666663] hover:text-[#181817]">
                View earnings →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="squash-table-header">
                    <th className="px-4 py-2 font-medium">Date</th>
                    <th className="px-4 py-2 font-medium">Type</th>
                    <th className="px-4 py-2 font-medium">Description</th>
                    <th className="px-4 py-2 font-medium">Amount</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardTransactions.map((item, idx) => (
                    <tr key={`${item.date}-${idx}`} className="squash-table-row">
                      <td className="px-4 py-2.5 text-[#666663] text-xs">{item.date}</td>
                      <td className="px-4 py-2.5 text-[#181817] text-xs font-medium">{item.type}</td>
                      <td className="px-4 py-2.5 text-[#181817] text-xs font-medium max-w-[200px] truncate">{item.description}</td>
                      <td className={`px-4 py-2.5 text-xs font-semibold ${item.amount.startsWith('-') ? 'text-[#C95050]' : 'text-[#181817]'}`}>
                        {item.amount}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`squash-status-pill ${
                          item.status === 'Approved' || item.status === 'Paid'
                            ? 'squash-status-success'
                            : item.status === 'Pending' || item.status === 'Changes Requested'
                            ? 'squash-status-warning'
                            : 'squash-status-error'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Secondary Column Widgets */}
        <div className="space-y-5">
          {/* Earnings & Target Widget */}
          <div className="squash-panel p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-[#181817] uppercase tracking-wider">Earnings Overview</h2>
              <span className="text-[11px] text-[#666663]">Target: R500.00</span>
            </div>

            <div className="p-3 rounded-md bg-[#F7F7F6] border border-[#E7E7E5] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#666663]">Available Balance</span>
                <span className="font-semibold text-[#181817]">{formatRands(earningsSummary.availableBalanceZar)}</span>
              </div>
              <div className="h-1.5 w-full bg-[#EEEEEC] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#16A34A] rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.round((earningsSummary.availableBalanceZar / 500) * 100))}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-[#EEEEEC]">
              <span className="text-[#666663]">Lifetime Approved</span>
              <span className="font-semibold text-[#181817]">{formatRands(earningsSummary.lifetimeApprovedZar)}</span>
            </div>
          </div>

          {/* Tester Tier & Level Widget */}
          <div className="squash-panel p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-[#181817] uppercase tracking-wider">Tester Level</h2>
              <Award className="h-4 w-4 text-[#92928E]" />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#F7F7F6] border border-[#E7E7E5] text-[#181817]">
                <TierIcon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[#181817]">{currentTier.label.replace(' 💎', '')}</div>
                <div className="text-[11px] text-[#666663]">{progressText}</div>
              </div>
            </div>

            <div className="h-1.5 w-full bg-[#EEEEEC] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1D1D1B] rounded-full transition-all duration-300"
                style={{ width: `${tierProgress}%` }}
              />
            </div>

            <Link to="/tester/level-benefits" className="block text-xs font-medium text-[#666663] hover:text-[#181817] pt-1">
              View Level Benefits →
            </Link>
          </div>

          {/* Pending Reviews Widget */}
          <div className="squash-panel p-4 space-y-3">
            <h2 className="text-xs font-semibold text-[#181817] uppercase tracking-wider">Pending Reviews</h2>
            <div className="space-y-2">
              {dashboardApprovals.map((item, i) => (
                <div key={`${item.name}-${i}`} className="p-2.5 rounded-md bg-[#F7F7F6] border border-[#E7E7E5] flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-medium text-[#181817] truncate">{item.name}</div>
                    <div className="text-[10px] text-[#92928E]">{item.date}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-semibold text-[#181817]">{item.amount}</div>
                    <span className="squash-status-pill squash-status-warning !text-[9px] !h-4">
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
              {dashboardApprovals.length === 0 ? (
                <div className="text-xs text-[#92928E] py-2 text-center">No pending reviews.</div>
              ) : null}
            </div>
          </div>

          {/* Specializations Quick Widget */}
          <div className="squash-panel p-4 space-y-3">
            <h2 className="text-xs font-semibold text-[#181817] uppercase tracking-wider">Specializations</h2>
            <p className="text-xs text-[#666663] leading-normal">
              Select verified specializations to qualify for higher paying tests.
            </p>
            {verificationNotice ? (
              <p className="text-xs text-[#238554] bg-[#EAF7EF] p-2 rounded-md font-medium">
                {verificationNotice}
              </p>
            ) : null}
            <SpecializationChecklist
              selected={specializations}
              onToggle={toggleSpecialization}
              verification={verification}
              onRequestVerification={handleRequestVerification}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
