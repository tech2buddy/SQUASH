import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  ContactRound,
  Home,
  LineChart,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Star,
  UserCircle2,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import TesterHeaderNav from './components/TesterHeaderNav';
import MobileTabBar from './components/MobileTabBar';
import TesterMobileDrawer from './components/TesterMobileDrawer';
import SpecializationChecklist from './components/SpecializationChecklist';
import SquashScore from './components/SquashScore';
import TesterBadge from './components/TesterBadge';
import { getCategoryById, type TestCategoryId } from './components/testCategories';
import { getSpecializationLabel } from './components/testerSpecializations';
import { useAuth } from './auth';
import { getTesterSpecializations, replaceTesterSpecializations } from './lib/profileApi';
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
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
};



const monthlyEarnings = [120, 140, 210, 260, 240, 300, 450];
const monthlyLabels = ['1 May', '6 May', '12 May', '18 May', '22 May', '27 May', '31 May'];
const earningsMax = Math.max(...monthlyEarnings);
const earningsPoints = monthlyEarnings
  .map((value, index) => {
    const x = (index / (monthlyEarnings.length - 1)) * 100;
    const y = 100 - (value / earningsMax) * 100;
    return `${x},${y}`;
  })
  .join(' ');
const earningsArea = `0,100 ${earningsPoints} 100,100`;

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
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const [assignments, setAssignments] = useState<TesterAssignment[]>([]);
  const [assignmentsError, setAssignmentsError] = useState('');
  const [earningsSummary, setEarningsSummary] = useState<TesterEarningsSummary>(emptyEarningsSummary);
  const [earningsError, setEarningsError] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [specializations, setSpecializations] = useState<string[]>(() => {
    const raw = window.localStorage.getItem('squash_tester_specializations');
    if (!raw) return ['township-network', 'zulu', 'ecommerce'];
    try {
      const parsed = JSON.parse(raw) as string[];
      return Array.isArray(parsed) ? parsed : ['township-network', 'zulu', 'ecommerce'];
    } catch {
      return ['township-network', 'zulu', 'ecommerce'];
    }
  });

  useEffect(() => {
    window.localStorage.setItem('squash_tester_specializations', JSON.stringify(specializations));
  }, [specializations]);

  useEffect(() => {
    if (!session?.userId || false) return;

    let mounted = true;
    getTesterSpecializations(session.userId)
      .then((savedSpecializations) => {
        if (mounted && savedSpecializations.length > 0) setSpecializations(savedSpecializations);
      })
      .catch(() => {
        // Keep local fallback if profile sync is temporarily unavailable.
      });

    return () => {
      mounted = false;
    };
  }, [("supabase"), session?.userId]);


  useEffect(() => {
    if (!session?.userId || false) return;

    let mounted = true;
    setAssignmentsError('');
    setEarningsError('');

    Promise.all([getTesterAssignments(session.userId), getTesterEarningsSummary(session.userId)])
      .then(([assignmentItems, summary]) => {
        if (!mounted) return;
        setAssignments(assignmentItems);
        setEarningsSummary(summary);
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
  }, [("supabase"), session?.userId]);

  const toggleSpecialization = (id: string, checked: boolean) => {
    setSpecializations((prev) => {
      const next = checked ? Array.from(new Set([...prev, id])) : prev.filter((item) => item !== id);
      if (session?.userId && true) {
        replaceTesterSpecializations(session.userId, next).catch(() => {
          // Keep the UI responsive; the Settings/Profile page can retry later.
        });
      }
      return next;
    });
  };

  const topProfileTags = useMemo(
    () => specializations.slice(0, 3).map((id) => getSpecializationLabel(id)),
    [specializations],
  );

  const isRealAccount = true;
  const activeAssignments = assignments.filter((assignment) => assignment.status === 'active');
  const submittedAssignmentCount = assignments.filter((assignment) => assignment.status === 'submitted').length;
  const approvedAssignmentCount = assignments.filter((assignment) => assignment.status === 'approved').length;
  const approvedCount = earningsSummary.earnings.filter((item) => item.status === 'approved' || item.status === 'paid').length;
  const pendingItems = earningsSummary.earnings.filter((item) => item.status === 'pending');
  const changesRequestedItems = earningsSummary.earnings.filter((item) => item.status === 'changes_requested');
  const realStats: StatCard[] = [
    {
      title: 'Available Balance',
      value: formatRands(earningsSummary.availableBalanceZar),
      note: 'Paid to bank within 24hrs of approval',
      change: `${approvedCount} approved submission${approvedCount === 1 ? '' : 's'}`,
      icon: Wallet,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-700',
    },
    {
      title: 'Pending Approval',
      value: formatRands(earningsSummary.pendingApprovalZar),
      note: 'Awaiting developer approval',
      change: `${pendingItems.length} submission${pendingItems.length === 1 ? '' : 's'} pending`,
      icon: Clock3,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-700',
    },
    {
      title: 'Tests Completed',
      value: String(approvedCount),
      note: 'Approved tests completed',
      change: `${activeAssignments.length} active test${activeAssignments.length === 1 ? '' : 's'}`,
      icon: ClipboardList,
      iconBg: 'bg-sky-50',
      iconColor: 'text-sky-700',
    },
    {
      title: 'Approval Rate',
      value: earningsSummary.earnings.length ? `${Math.round((approvedCount / earningsSummary.earnings.length) * 100)}%` : '0%',
      note: earningsSummary.earnings.length ? 'Based on submitted reports' : 'Complete tests to build this',
      change: approvedCount > 0 ? 'Keep it up' : 'No approvals yet',
      icon: BadgeCheck,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-700',
    },
    {
      title: 'Member Since',
      value: 'Active',
      note: 'Real SQUASH account',
      change: activeAssignments.length > 0 ? 'Testing in progress' : 'Ready for jobs',
      icon: CalendarDays,
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-700',
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
      score: {
        usability: 78,
        performance: 74,
        onboarding: 80,
        bugSeverity: 82,
        deviceCompatibility: 76,
      },
    }));

  const navItems = [
    { label: 'Dashboard', icon: Home, href: '/tester/dashboard', active: true },
    { label: 'Available Jobs', icon: BriefcaseBusiness, href: '/tester-jobs' },
    { label: 'My Tests', icon: ClipboardList, href: '/active-test' },
    { label: 'Reports', icon: ClipboardList, href: '/tester/reports' },
    { label: 'Earnings', icon: CircleDollarSign, href: '/tester/earnings' },
    { label: 'Profile', icon: UserCircle2, href: '/tester/profile' },
    { label: 'Settings', icon: Settings, href: '/tester/settings' },
  ];

  if (true && isLoadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 text-center text-sm font-semibold text-slate-600">
        Loading dashboard data...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
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
                    item.active ? 'bg-green-50 text-green-700' : 'text-slate-700 hover:bg-slate-50'
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
              <div className="mt-4 flex justify-center">
                <TesterBadge testsCompleted={24} rating={4.7} />
              </div>
              <div className="mt-2 text-center text-sm text-slate-500">Skilled Tester</div>
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {topProfileTags.map((tag) => (
                  <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    {tag}
                  </span>
                ))}
              </div>
              <a href="/tester/profile" className="mt-4 inline-block text-sm font-semibold text-green-700">
                View Profile -&gt;
              </a>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-lg font-bold text-slate-900">Referral Bonus</div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Invite a friend and earn R100 after their first completed test.
              </p>
              <a href="/tester/referrals" className="mt-4 inline-block text-sm font-semibold text-green-700">
                Refer Now -&gt;
              </a>
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(true)}
                  className="rounded-xl border border-slate-300 p-2.5 text-slate-600 lg:hidden hover:bg-slate-50 transition"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="hidden max-w-xl flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:flex md:min-w-[340px] lg:min-w-[460px]">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    placeholder="Search jobs, apps, companies..."
                  />
                </div>
              </div>

              <TesterHeaderNav />
            </div>
          </header>

          <div className="px-4 py-4 sm:px-6 lg:px-8 lg:py-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 lg:text-4xl">Welcome back, {testerFirstName}!</h1>
                <p className="text-xs text-slate-500 mt-0.5 lg:text-base lg:mt-2">Here is what is happening with your testing journey.</p>
              </div>
            </div>

            <section className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
              {dashboardStats.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.title} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-semibold text-slate-500 truncate">{card.title}</div>
                        <div className="mt-1 text-xl font-black text-slate-900">{card.value}</div>
                        <div className="mt-1 text-[10px] text-slate-400 leading-tight truncate">{card.note}</div>
                        <div className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          {card.change}
                        </div>
                      </div>
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${card.iconBg}`}>
                        <Icon className={`h-5 w-5 ${card.iconColor}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>

            <section className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Available Tests</h2>
                      <p className="text-xs text-slate-500">New opportunities matching your skills.</p>
                    </div>
                    <a href="/tester-jobs" className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                      View All
                    </a>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {dashboardAvailableTests.map((test) => (
                      <div key={test.name} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900 truncate">{test.name}</div>
                          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                            <span className="truncate">{test.meta}</span>
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${getDifficultyClasses(test.difficulty)}`}>
                              {test.difficulty}
                            </span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <div className="text-right">
                            <div className="text-sm font-black text-slate-900">{test.amount}</div>
                          </div>
                          <a href="/tester-jobs" className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                            View
                          </a>
                        </div>
                      </div>
                    ))}
                    {dashboardAvailableTests.length === 0 ? (
                      <div className="px-4 py-5 text-xs leading-5 text-slate-500">
                        Open the Available Jobs page to browse real jobs. Personalised matches will appear here soon.
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">My Test Progress</h2>
                      <p className="text-xs text-slate-500">Track your active tests and deadlines.</p>
                    </div>
                  </div>

                  <div className="flex gap-4 border-b border-slate-100 px-4 py-2 text-xs font-semibold text-slate-500">
                    <span className="text-green-700">In Progress ({isRealAccount ? activeAssignments.length : Math.max(assignments.length, 2)})</span>
                    <span>Submitted ({isRealAccount ? submittedAssignmentCount : 3})</span>
                    <span>Approved ({isRealAccount ? approvedAssignmentCount : 19})</span>
                  </div>

                  <div className="divide-y divide-slate-100 px-4">
                    {assignmentsError ? (
                      <div className="py-3 text-xs font-semibold text-red-600">{assignmentsError}</div>
                    ) : null}
                    {activeAssignments.map((assignment) => {
                      const category = getCategoryById(assignment.jobCategory as TestCategoryId);
                      const CategoryIcon = category.icon;
                      return (
                        <div key={assignment.id} className="flex items-center justify-between gap-3 py-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-semibold text-slate-900 truncate">{assignment.jobTitle}</div>
                              <span className="shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700 ring-1 ring-green-100">Accepted</span>
                            </div>
                            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                              <CategoryIcon className="h-3 w-3" style={{ color: category.color }} />
                              {category.name} · {assignment.jobPlatform}
                            </div>
                          </div>
                          <a href={`/active-test?assignment=${assignment.id}`} className="shrink-0 rounded-xl bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700">
                            Start Test
                          </a>
                        </div>
                      );
                    })}                    {activeAssignments.length === 0 && !assignmentsError && !isLoadingData ? (
                      <div className="py-6 text-center">
                        <ClipboardList className="mx-auto h-8 w-8 text-slate-300" />
                        <div className="mt-2 text-sm font-semibold text-slate-700">No active tests</div>
                        <div className="mt-1 text-xs text-slate-500">Check Available Jobs to find new opportunities.</div>
                      </div>
                    ) : null}
                  </div>

                  <div className="px-4 py-3 text-center">
                    <a href="/active-test" className="text-xs font-semibold text-green-700 hover:underline">View All My Tests →</a>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-4 py-3">
                    <h2 className="text-base font-bold text-slate-900">Completed Tests</h2>
                    <p className="text-xs text-slate-500">Your latest completed tests and Squash Scores.</p>
                  </div>
                  <div className="divide-y divide-slate-100 px-4">
                    {dashboardCompletedTests.map((test) => (
                      <div key={test.name} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{test.name}</div>
                          <div className="text-[11px] text-slate-500">{test.type}</div>
                        </div>
                        <SquashScore scores={test.score} compact />
                      </div>
                    ))}
                    {dashboardCompletedTests.length === 0 ? (
                      <div className="py-4 text-xs leading-5 text-slate-500">
                        No approved reports yet. Once a developer approves your test, it will appear here with a Squash Score.
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-900">Earnings Overview</h2>
                    <div className="text-xs font-semibold text-slate-500">This Month</div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-4">
                    <div className="h-36">
                      <svg viewBox="0 0 100 100" className="h-full w-full">
                        <defs>
                          <linearGradient id="testerEarningsArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.03" />
                          </linearGradient>
                        </defs>
                        <polyline points={earningsArea} fill="url(#testerEarningsArea)" stroke="none" />
                        <polyline
                          points={earningsPoints}
                          fill="none"
                          stroke="#16a34a"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {monthlyEarnings.map((value, index) => {
                          const x = (index / (monthlyEarnings.length - 1)) * 100;
                          const y = 100 - (value / earningsMax) * 100;
                          return <circle key={`${value}-${index}`} cx={x} cy={y} r="1.7" fill="#16a34a" />;
                        })}
                      </svg>
                    </div>
                    <div className="mt-2 grid grid-cols-7 text-center text-[11px] text-slate-500">
                      {monthlyLabels.map((label) => (
                        <span key={label}>{label}</span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                    <LineChart className="h-5 w-5 text-green-700" />
                    Total Earnings:
                    <span className="text-green-700">R450</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h2 className="text-base font-bold text-slate-900">Payout Method</h2>

                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[11px] font-semibold text-slate-500 mb-2">Available payout methods</div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2.5 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
                        <input type="radio" name="payout-method" defaultChecked className="h-3.5 w-3.5 accent-green-600" />
                        Bank Transfer (EFT)
                      </label>
                      <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                        <input type="radio" name="payout-method" className="h-3.5 w-3.5 accent-green-600" />
                        SnapScan
                      </label>
                      <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                        <input type="radio" name="payout-method" className="h-3.5 w-3.5 accent-green-600" />
                        Airtime top-up
                      </label>
                    </div>
                  </div>

                  <div className="mt-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                    Last payout: 10 May 2025 · R450
                  </div>
                  <a href="/tester/payout-method" className="mt-2 inline-block text-xs font-semibold text-sky-700">
                    Change Payout Method
                  </a>
                </div>

                <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 shadow-sm">
                  <h2 className="text-base font-bold text-slate-900">Pending Approvals</h2>
                  <p className="mt-0.5 text-xs text-slate-500">Submissions waiting for approval or your updates.</p>
                  <div className="mt-3 space-y-2.5">
                    {earningsError ? (
                      <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-600">{earningsError}</div>
                    ) : null}
                    {dashboardApprovals.map((item) => (
                      <div key={item.name} className="rounded-xl border border-sky-100 bg-white p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 truncate">{item.name}</div>
                            <div className="text-[11px] text-slate-500">{item.date}</div>
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="text-sm font-bold text-slate-900">{item.amount}</div>
                            <div className="mt-0.5 inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                              {item.status}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {dashboardApprovals.length === 0 ? (
                      <div className="rounded-xl border border-sky-100 bg-white p-3 text-xs leading-5 text-slate-500">
                        No reports are waiting for approval or changes right now.
                      </div>
                    ) : null}
                  </div>
                  <a href="/tester/submissions" className="mt-3 inline-block text-xs font-semibold text-sky-700">
                    View All Submissions →
                  </a>
                </div>
              </div>
            </section>

            <section className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                  <h2 className="text-base font-bold text-slate-900">Transaction History</h2>
                  <button className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
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
                          <div className="text-xs text-slate-500">{item.date} • {item.type}</div>
                        </div>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="flex justify-end pt-1">
                        <span className={`font-black text-sm ${item.amount.startsWith('-') ? 'text-red-600' : 'text-slate-900'}`}>
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
                      <tr className="border-b border-slate-100 text-left text-sm text-slate-500">
                        <th className="px-6 py-4 font-medium">Date</th>
                        <th className="px-6 py-4 font-medium">Type</th>
                        <th className="px-6 py-4 font-medium">Description</th>
                        <th className="px-6 py-4 font-medium">Amount</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardTransactions.map((item) => (
                        <tr key={`${item.date}-${item.description}`} className="border-b border-slate-100 last:border-b-0">
                          <td className="px-6 py-4 text-slate-700">{item.date}</td>
                          <td className="px-6 py-4 text-slate-700">{item.type}</td>
                          <td className="px-6 py-4 font-semibold text-slate-900">{item.description}</td>
                          <td className={`px-6 py-4 font-semibold ${item.amount.startsWith('-') ? 'text-red-600' : 'text-slate-900'}`}>
                            {item.amount}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(item.status)}`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="px-6 py-4 text-center text-sm font-semibold text-slate-700">
                  <a href="/tester/earnings" className="hover:text-green-700">View All Transactions -&gt;</a>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900">Tester Level</h2>
                  <ContactRound className="h-5 w-5 text-slate-400" />
                </div>

                <div className="mt-5 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 shadow-sm">
                    <Star className="h-8 w-8 text-green-700" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-900">Level 2</div>
                    <div className="text-slate-600">Skilled Tester</div>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Progress</span>
                    <span>650 / 1000 XP</span>
                  </div>
                  <div className="mt-2 h-3 rounded-full bg-slate-100">
                    <div className="h-3 w-[65%] rounded-full bg-green-600" />
                  </div>
                </div>

                <div className="mt-6 space-y-3 text-slate-700">
                  <div className="flex items-center gap-2 text-sm">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-green-700" />
                    <span>Complete tests consistently</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <BadgeCheck className="h-4 w-4 shrink-0 text-green-700" />
                    <span>Keep approval rate above 90%</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock3 className="h-4 w-4 shrink-0 text-green-700" />
                    <span>Stay active every month</span>
                  </div>
                </div>

                <a href="/tester/level-benefits" className="mt-6 inline-block text-sm font-semibold text-sky-700">
                  View Level Benefits -&gt;
                </a>
              </div>
            </section>

            <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900">My Specializations</h2>
              <p className="mt-2 text-sm text-slate-600">
                Choose your strengths so we can match you with the right tests.
              </p>
              <div className="mt-5">
                <SpecializationChecklist selected={specializations} onToggle={toggleSpecialization} />
              </div>
            </section>

            <section className="relative mt-8 overflow-hidden rounded-3xl border border-green-200 bg-gradient-to-r from-green-50 via-emerald-50 to-green-100/70 p-6 shadow-sm">
              <div className="pointer-events-none absolute -left-12 -top-12 h-36 w-36 rounded-full bg-green-300/20 blur-3xl" />
              <div className="pointer-events-none absolute -right-10 bottom-0 h-28 w-28 rounded-full bg-emerald-300/20 blur-2xl" />
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Need Help?</h2>
                  <p className="mt-2 text-slate-600">Our support team is here to help with any payout or test questions.</p>
                </div>
                <a href="/help-center" className="rounded-2xl border border-green-300 bg-white px-5 py-3 font-semibold text-slate-800 hover:bg-slate-50">
                  Contact Support
                </a>
              </div>
            </section>
          </div>
        </main>
      </div>
      <MobileTabBar role="tester" />
      <TesterMobileDrawer isOpen={isMobileDrawerOpen} onClose={() => setIsMobileDrawerOpen(false)} activePath="/tester/dashboard" />
    </div>
  );
}


