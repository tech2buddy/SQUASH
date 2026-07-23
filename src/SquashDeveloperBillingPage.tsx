import {
  ArrowRight,
  BadgeCheck,
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  Clock3,
  CreditCard,
  Download,
  FileText,
  Home,
  Landmark,
  Menu,
  Receipt,
  Search,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import MobileTabBar from './components/MobileTabBar';
import { useAuth } from './auth';
import { getDeveloperJobs, type DeveloperJob } from './lib/jobApi';
import type { LucideIcon } from 'lucide-react';

type SummaryCard = {
  title: string;
  subtitle?: string;
  value: string;
  note: string;
  delta: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
};

type ActivePayment = {
  job: string;
  type: string;
  amount: string;
  status: 'In Progress' | 'Awaiting Approval' | 'Completed';
  detail: string;
  progress: number;
  action: string;
  tone: string;
};

type HistoryItem = {
  date: string;
  job: string;
  amount: string;
  status: 'Completed' | 'Paid Out' | 'Cancelled';
};

type EscrowStep = {
  title: string;
  text: string;
  icon: LucideIcon;
  iconTone: string;
};

const summaryCards: SummaryCard[] = [
  {
    title: 'Escrow Balance',
    subtitle: '(Held)',
    value: 'R2,500',
    note: 'Money held securely by SQUASH',
    delta: '+2 jobs funded',
    icon: ShieldCheck,
    iconBg: 'bg-green-50',
    iconColor: 'text-green-700',
  },
  {
    title: 'Total Spent',
    value: 'R10,200',
    note: 'Total amount spent this cycle',
    delta: '+14% this month',
    icon: Wallet,
    iconBg: 'bg-slate-50',
    iconColor: 'text-slate-700',
  },
  {
    title: 'Active Jobs',
    subtitle: 'Paid For',
    value: '3 Jobs',
    note: 'Payments currently in escrow',
    delta: '1 closing today',
    icon: BriefcaseBusiness,
    iconBg: 'bg-green-50',
    iconColor: 'text-green-700',
  },
  {
    title: 'Pending',
    subtitle: 'Approvals',
    value: '2 Jobs',
    note: 'Waiting for your final approval',
    delta: 'Action recommended',
    icon: CircleHelp,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
];

const activePayments: ActivePayment[] = [
  {
    job: 'FitTrack App',
    type: 'Mobile App',
    amount: 'R900',
    status: 'In Progress',
    detail: 'Testing in progress',
    progress: 60,
    action: 'View',
    tone: 'bg-amber-100 text-amber-700',
  },
  {
    job: 'FoodApp Test',
    type: 'Mobile App',
    amount: 'R1,200',
    status: 'Awaiting Approval',
    detail: 'Review submissions',
    progress: 100,
    action: 'Review',
    tone: 'bg-sky-100 text-sky-700',
  },
  {
    job: 'ShopEase Web',
    type: 'Website',
    amount: 'R700',
    status: 'Completed',
    detail: 'Paid out to testers',
    progress: 100,
    action: 'View',
    tone: 'bg-green-100 text-green-700',
  },
];

const history: HistoryItem[] = [
  { date: '12 May 2025', job: 'FitTrack App', amount: 'R900', status: 'Completed' },
  { date: '10 May 2025', job: 'ShopEase Web', amount: 'R700', status: 'Paid Out' },
  { date: '02 May 2025', job: 'HealthHub App', amount: 'R1,500', status: 'Paid Out' },
  { date: '25 Apr 2025', job: 'StudyBuddy', amount: 'R600', status: 'Cancelled' },
];

const escrowSteps: EscrowStep[] = [
  {
    title: '1. Fund Escrow',
    text: 'You pay when posting a job, and SQUASH holds the amount safely.',
    icon: CreditCard,
    iconTone: 'bg-sky-50 text-sky-700',
  },
  {
    title: '2. Testers Work',
    text: 'Selected testers complete tasks and submit detailed findings.',
    icon: BriefcaseBusiness,
    iconTone: 'bg-amber-50 text-amber-700',
  },
  {
    title: '3. Review & Approve',
    text: 'You verify submissions and approve quality before payout.',
    icon: ClipboardList,
    iconTone: 'bg-violet-50 text-violet-700',
  },
  {
    title: '4. Auto Payout',
    text: 'Approved work triggers secure and automatic tester payouts.',
    icon: BadgeCheck,
    iconTone: 'bg-green-50 text-green-700',
  },
];

function statusClasses(status: HistoryItem['status']) {
  if (status === 'Cancelled') return 'bg-red-50 text-red-600';
  return 'bg-green-50 text-green-700';
}

function formatRands(value: number) {
  return `R${Math.round(value).toLocaleString('en-ZA')}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function jobPaymentStatus(status: DeveloperJob['status']): ActivePayment['status'] {
  if (status === 'completed') return 'Completed';
  if (status === 'in_review') return 'Awaiting Approval';
  return 'In Progress';
}

function paymentTone(status: ActivePayment['status']) {
  if (status === 'Completed') return 'bg-green-100 text-green-700';
  if (status === 'Awaiting Approval') return 'bg-sky-100 text-sky-700';
  return 'bg-amber-100 text-amber-700';
}

export default function SquashDeveloperBillingPage() {
  const { session } = useAuth();
  const developerName = session?.name || 'Dev Studio';
  const isRealAccount = true;
  const [liveJobs, setLiveJobs] = useState<DeveloperJob[]>([]);
  const [billingError, setBillingError] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    let isMounted = true;

    if (!isRealAccount || !session?.userId) {
      setLiveJobs([]);
      setBillingError('');
      return () => {
        isMounted = false;
      };
    }

    getDeveloperJobs(session.userId)
      .then((jobs) => {
        if (!isMounted) return;
        setLiveJobs(jobs);
        setBillingError('');
      })
      .catch(() => {
        if (!isMounted) return;
        setBillingError('Could not load billing data right now.');
      })
      .finally(() => {
        if (isMounted) setIsLoadingData(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isRealAccount, session?.userId]);

  const liveBilling = useMemo(() => {
    const total = liveJobs.reduce((sum, job) => sum + Number(job.totalAmountZar || 0), 0);
    const fundedJobs = liveJobs.filter((job) => job.status !== 'draft' && job.status !== 'cancelled');
    const pendingApproval = liveJobs.filter((job) => job.status === 'in_review').length;
    const activeJobs = liveJobs.filter((job) => job.status === 'active' || job.status === 'in_review').length;

    return { total, fundedJobs, pendingApproval, activeJobs };
  }, [liveJobs]);

  const visibleSummaryCards: SummaryCard[] = isRealAccount
    ? [
        {
          title: 'Escrow Balance',
          subtitle: '(Held)',
          value: formatRands(
            liveBilling.fundedJobs
              .filter((job) => job.status === 'active' || job.status === 'in_review')
              .reduce((sum, job) => sum + Number(job.totalAmountZar || 0), 0),
          ),
          note: 'Money held securely by SQUASH',
          delta: `${liveBilling.activeJobs} active job${liveBilling.activeJobs === 1 ? '' : 's'}`,
          icon: ShieldCheck,
          iconBg: 'bg-green-50',
          iconColor: 'text-green-700',
        },
        {
          title: 'Total Spent',
          value: formatRands(liveBilling.total),
          note: 'Total value of posted jobs',
          delta: `${liveJobs.length} job${liveJobs.length === 1 ? '' : 's'} created`,
          icon: Wallet,
          iconBg: 'bg-slate-50',
          iconColor: 'text-slate-700',
        },
        {
          title: 'Active Jobs',
          subtitle: 'Funded',
          value: `${liveBilling.activeJobs} Jobs`,
          note: 'Payments currently protected',
          delta: liveBilling.activeJobs ? 'Testing in motion' : 'No active jobs yet',
          icon: BriefcaseBusiness,
          iconBg: 'bg-green-50',
          iconColor: 'text-green-700',
        },
        {
          title: 'Pending',
          subtitle: 'Approvals',
          value: `${liveBilling.pendingApproval} Jobs`,
          note: 'Waiting for your final approval',
          delta: liveBilling.pendingApproval ? 'Action recommended' : 'Nothing pending',
          icon: CircleHelp,
          iconBg: 'bg-amber-50',
          iconColor: 'text-amber-600',
        },
      ]
    : summaryCards;

  const visibleActivePayments: ActivePayment[] = isRealAccount
    ? liveJobs
        .filter((job) => job.status !== 'draft')
        .slice(0, 6)
        .map((job) => {
          const status = jobPaymentStatus(job.status);
          const progress = status === 'Completed' ? 100 : status === 'Awaiting Approval' ? 90 : 45;
          return {
            job: job.title,
            type: job.category,
            amount: formatRands(job.totalAmountZar),
            status,
            detail:
              status === 'Completed'
                ? 'Payment released after approval'
                : status === 'Awaiting Approval'
                  ? 'Review submissions'
                  : 'Testing in progress',
            progress,
            action: status === 'Awaiting Approval' ? 'Review' : 'View',
            tone: paymentTone(status),
          };
        })
    : activePayments;

  const visibleHistory: HistoryItem[] = isRealAccount
    ? liveJobs
        .filter((job) => job.status !== 'draft')
        .slice(0, 8)
        .map((job) => ({
          date: formatDate(job.createdAt),
          job: job.title,
          amount: formatRands(job.totalAmountZar),
          status: job.status === 'cancelled' ? 'Cancelled' : job.status === 'completed' ? 'Paid Out' : 'Completed',
        }))
    : history;

  const navItems = [
    { label: 'Dashboard', icon: Home, href: '/dashboard' },
    { label: 'Post a Job', icon: ClipboardList, href: '/post-job' },
    { label: 'Reports', icon: FileText, href: '/report-details' },
    { label: 'Billing', icon: CreditCard, active: true, href: '/billing' },
  ];

  if (true && isLoadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 text-center text-sm font-semibold text-slate-600">
        Loading billing data...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[240px_1fr]">
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
                  className={`flex w-full items-center rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    item.active ? 'bg-green-50 text-green-700' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="ml-3">{item.label}</span>
                </a>
              );
            })}
          </nav>

          <div className="border-t border-slate-200 p-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-lg font-bold text-slate-900">Quick Actions</div>
              <div className="mt-4 space-y-3">
                <a
                  href="/post-job"
                  className="block w-full rounded-2xl bg-green-600 px-4 py-3 text-center font-semibold text-white hover:bg-green-700"
                >
                  Post a New Job
                </a>
                <a
                  href="/developer/submissions"
                  className="block w-full rounded-2xl border border-green-600 px-4 py-3 text-center font-semibold text-green-700 hover:bg-green-50"
                >
                  Review Submissions
                </a>
              </div>
            </div>
          </div>

          <div className="p-4 pt-0">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                  <CircleHelp className="h-5 w-5 text-slate-500" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Need Help?</div>
                  <div className="text-sm text-slate-500">Visit our Help Center for support.</div>
                </div>
              </div>
              <a href="/help-center" className="mt-4 inline-block text-sm font-semibold text-green-700">
                Go to Help Center -&gt;
              </a>
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <a href="/dashboard" className="rounded-xl border border-slate-300 p-2.5 text-slate-600 lg:hidden">
                  <Menu className="h-5 w-5" />
                </a>
                <div className="hidden max-w-xl flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:flex md:min-w-[320px] lg:min-w-[420px]">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    placeholder="Search transactions, jobs, invoices..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-4">
                <a href="/report-details" className="relative rounded-full border border-slate-200 p-2.5 text-slate-600">
                  <Bell className="h-5 w-5" />
                </a>
                <a href="/dashboard" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700">
                    D
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-sm font-bold text-slate-900">{developerName}</div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </a>
              </div>
            </div>
          </header>

          <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold tracking-wide text-green-700">
                  <Landmark className="h-3.5 w-3.5" />
                  PAYMENT CONTROL CENTER
                </div>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Billing</h1>
                <p className="mt-2 text-slate-600">Manage escrow, payout approvals, invoices, and spend visibility.</p>
              </div>
              <div className="text-sm font-semibold text-slate-500">Dashboard &gt; Billing</div>
            </div>

            {billingError ? (
              <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {billingError}
              </div>
            ) : null}

            <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {visibleSummaryCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-base font-bold text-slate-900">
                          {card.title}
                          {card.subtitle ? <span className="ml-1 text-slate-500">{card.subtitle}</span> : null}
                        </div>
                        <div className="mt-3 text-3xl font-black text-slate-900">{card.value}</div>
                        <div className="mt-3 text-sm text-slate-600">{card.note}</div>
                        <div className="mt-3 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {card.delta}
                        </div>
                      </div>
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.iconBg}`}>
                        <Icon className={`h-5 w-5 ${card.iconColor}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>

            <section className="mt-8 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Active Job Payments (Escrow)</h2>
                      <p className="mt-2 text-sm text-slate-600">
                        Your funds stay protected in escrow until you approve completed work.
                      </p>
                    </div>
                    <button className="flex w-fit items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                      All Status <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Mobile Card List */}
                  <div className="divide-y divide-slate-100 md:hidden">
                    {visibleActivePayments.length > 0 ? (
                      visibleActivePayments.map((payment) => (
                        <div key={payment.job} className="p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-bold text-slate-900">{payment.job}</div>
                              <div className="text-xs text-slate-500">{payment.type}</div>
                            </div>
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${payment.tone}`}>
                              {payment.status}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">Amount:</span>
                            <span className="font-bold text-slate-900">{payment.amount}</span>
                          </div>
                          <div>
                            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                              <span>Progress</span>
                              <span>{payment.progress}%</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-100">
                              <div className="h-2 rounded-full bg-green-600" style={{ width: `${payment.progress}%` }} />
                            </div>
                          </div>
                          <div className="pt-1 flex justify-end">
                            <Link
                              to="/report-details"
                              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm"
                            >
                              {payment.action}
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-sm text-slate-500">
                        No funded job payments yet. Posted jobs will appear here once payment is connected.
                      </div>
                    )}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-slate-100 text-left text-sm text-slate-500">
                          <th className="px-6 py-4 font-medium">Job Name</th>
                          <th className="px-6 py-4 font-medium">Amount</th>
                          <th className="px-6 py-4 font-medium">Status</th>
                          <th className="px-6 py-4 font-medium">Progress</th>
                          <th className="px-6 py-4 font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleActivePayments.length > 0 ? visibleActivePayments.map((payment) => (
                          <tr key={payment.job} className="border-b border-slate-100 last:border-b-0">
                            <td className="px-6 py-5">
                              <div className="font-semibold text-slate-900">{payment.job}</div>
                              <div className="text-sm text-slate-500">{payment.type}</div>
                            </td>
                            <td className="px-6 py-5 font-semibold text-slate-900">{payment.amount}</td>
                            <td className="px-6 py-5">
                              <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${payment.tone}`}>
                                {payment.status}
                              </div>
                              <div className="mt-2 text-xs text-slate-500">{payment.detail}</div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="text-sm font-semibold text-slate-700">{payment.progress}%</div>
                              <div className="mt-2 h-2 w-24 rounded-full bg-slate-100">
                                <div className="h-2 rounded-full bg-green-600" style={{ width: `${payment.progress}%` }} />
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <Link
                                to="/report-details"
                                className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                {payment.action}
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Link>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                              No funded job payments yet. Posted jobs will appear here once payment is connected.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="border-t border-slate-100 px-6 py-4 text-sm text-slate-600">
                    <div className="flex flex-wrap gap-5">
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        In Progress - Testing running
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-sky-500" />
                        Awaiting Approval - Needs your review
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        Completed - Paid to testers
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                    <h2 className="text-2xl font-bold text-slate-900">Transaction History</h2>
                    <button className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                      This Year <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Mobile Card List */}
                  <div className="divide-y divide-slate-100 md:hidden">
                    {visibleHistory.length > 0 ? (
                      visibleHistory.map((item) => (
                        <div key={`${item.date}-${item.job}`} className="p-4 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-bold text-slate-900">{item.job}</div>
                              <div className="text-xs text-slate-500">{item.date}</div>
                            </div>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses(item.status)}`}>
                              {item.status}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <span className="font-black text-slate-900 text-sm">{item.amount}</span>
                            <a
                              href={`data:text/plain;charset=utf-8,${encodeURIComponent(`Invoice for ${item.job}`)}`}
                              download={`invoice-${item.job.replaceAll(' ', '-').toLowerCase()}.txt`}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700"
                            >
                              <Download className="h-3.5 w-3.5" />
                              PDF
                            </a>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-sm text-slate-500">
                        No transaction history yet.
                      </div>
                    )}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-slate-100 text-left text-sm text-slate-500">
                          <th className="px-6 py-4 font-medium">Date</th>
                          <th className="px-6 py-4 font-medium">Job</th>
                          <th className="px-6 py-4 font-medium">Amount</th>
                          <th className="px-6 py-4 font-medium">Status</th>
                          <th className="px-6 py-4 font-medium">Invoice</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleHistory.length > 0 ? visibleHistory.map((item) => (
                          <tr key={`${item.date}-${item.job}`} className="border-b border-slate-100 last:border-b-0">
                            <td className="px-6 py-4 text-slate-700">{item.date}</td>
                            <td className="px-6 py-4 font-semibold text-slate-900">{item.job}</td>
                            <td className="px-6 py-4 font-semibold text-slate-900">{item.amount}</td>
                            <td className="px-6 py-4">
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(item.status)}`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <a
                                href={`data:text/plain;charset=utf-8,${encodeURIComponent(`Invoice for ${item.job}`)}`}
                                download={`invoice-${item.job.replaceAll(' ', '-').toLowerCase()}.txt`}
                                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                              >
                                <Download className="h-4 w-4" />
                                PDF
                              </a>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                              No transaction history yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="px-6 py-4 text-center text-sm font-semibold text-slate-600">Show more</div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-2xl font-bold text-slate-900">Payment Method</h2>
                    <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                      Default
                    </span>
                  </div>

                  <div className="relative mt-5 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-5 text-white shadow-[0_14px_30px_rgba(2,6,23,0.35)]">
                    <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-emerald-300/20 blur-2xl" />
                    <div className="pointer-events-none absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-white/10 blur-xl" />

                    <div className="mb-5 flex items-center justify-between">
                      <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-wide">
                        SQUASH BUSINESS
                      </span>
                      <span className="text-xs font-medium text-white/80">Platinum</span>
                    </div>

                    <div className="mb-5 flex items-center justify-between">
                      <div className="grid h-10 w-14 grid-cols-4 grid-rows-3 gap-1 rounded-md border border-yellow-200/40 bg-gradient-to-br from-yellow-100 to-yellow-300 p-1.5">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <span key={i} className="rounded-[2px] bg-yellow-700/30" />
                        ))}
                      </div>
                      <svg viewBox="0 0 24 24" className="h-7 w-7 text-white/70" aria-hidden="true">
                        <path d="M4 8a8 8 0 0 1 8 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        <path d="M4 12a4 4 0 0 1 4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        <circle cx="4" cy="16" r="1.2" fill="currentColor" />
                      </svg>
                    </div>

                    <div className="font-mono text-xl tracking-[0.18em] text-white">4023  5567  8890  1234</div>

                    <div className="mt-5 flex items-end justify-between">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.2em] text-white/70">Card Holder</div>
                        <div className="mt-1 text-sm font-semibold">DEV STUDIO</div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.2em] text-white/70">Expires</div>
                        <div className="mt-1 text-sm font-semibold">12/27</div>
                      </div>
                      <div className="flex items-center">
                        <span className="-mr-2 h-7 w-7 rounded-full bg-orange-400/90" />
                        <span className="h-7 w-7 rounded-full bg-red-500/90" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                    {isRealAccount ? 'Payment method connection will be linked when checkout goes live.' : 'Last charged: 12 May 2025 at 14:22'}
                  </div>

                  <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50">
                    + Add New Card
                  </button>
                  <a href="/billing/payment-methods" className="mt-3 inline-block text-sm font-semibold text-sky-700">
                    Change or remove card
                  </a>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-2xl font-bold text-slate-900">Billing Breakdown</h2>
                  <div className="mt-5 space-y-4 text-sm">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="inline-flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-slate-400" />
                        Job package total
                      </span>
                      <span className="font-semibold text-slate-900">{isRealAccount ? formatRands(liveBilling.total) : 'R900'}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="inline-flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-slate-400" />
                        Payment protection
                      </span>
                      <span className="font-semibold text-green-700">Included</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="inline-flex items-center gap-2">
                        <Landmark className="h-4 w-4 text-slate-400" />
                        Tax handling
                      </span>
                      <span className="font-semibold text-slate-900">Included where applicable</span>
                    </div>
                  </div>
                  <div className="my-5 border-t border-slate-200" />
                  <div className="flex items-center justify-between rounded-2xl bg-green-50 px-4 py-4">
                    <span className="text-lg font-bold text-slate-900">Total Paid</span>
                    <span className="text-2xl font-black text-green-700">{isRealAccount ? formatRands(liveBilling.total) : 'R900'}</span>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-2xl font-bold text-slate-900">Plan &amp; Usage</h2>
                  <div className="mt-5">
                    <div className="text-sm text-slate-500">Current Plan</div>
                    <div className="mt-2 text-3xl font-black text-green-700">Starter</div>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                        <span>Active jobs used</span>
                        <span>3 / 5</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div className="h-2 w-3/5 rounded-full bg-green-600" />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                        <span>Monthly budget used</span>
                        <span>61%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div className="h-2 w-[61%] rounded-full bg-emerald-500" />
                      </div>
                    </div>
                  </div>
                  <a
                    href="/pricing"
                    className="mt-6 block w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-center font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    Upgrade Plan
                  </a>
                </div>

                <div className="rounded-3xl border border-sky-200 bg-sky-50 p-6 shadow-sm">
                  <h2 className="text-2xl font-bold text-slate-900">Awaiting Your Approval</h2>
                  <p className="mt-3 text-slate-700">
                    You have 2 jobs waiting for approval. Review submissions to release tester payouts.
                  </p>
                  <a
                    href="/developer/submissions"
                    className="mt-5 block w-full rounded-2xl bg-white px-5 py-3 text-center font-semibold text-slate-800 shadow-sm ring-1 ring-sky-200 hover:bg-slate-50"
                  >
                    Review &amp; Approve
                  </a>
                </div>
              </div>
            </section>

            <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900">How Escrow Works</h2>
              <div className="mt-8 grid gap-6 md:grid-cols-4">
                {escrowSteps.map((step, index) => {
                  const StepIcon = step.icon;
                  return (
                    <div key={step.title} className="relative rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${step.iconTone}`}>
                        <StepIcon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-4 text-lg font-bold text-slate-900">{step.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{step.text}</p>
                      {index !== escrowSteps.length - 1 ? (
                        <div className="absolute -right-3 top-8 hidden h-px w-6 bg-slate-300 md:block" />
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-green-50 p-5 text-sm leading-7 text-slate-700">
                <div className="font-bold text-slate-900">Why this works:</div>
                <div className="mt-3 grid gap-3 md:grid-cols-4">
                  <div className="inline-flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-green-700" />
                    Secure
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-green-700" />
                    Fair
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-green-700" />
                    Transparent
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-green-700" />
                    Automatic payouts
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Billing Help</h2>
                  <p className="mt-2 text-slate-600">
                    Need support with payments, invoices, or refunds? Our billing team is available.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <a
                    href="/contact"
                    className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-center font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    Contact Billing Support
                  </a>
                  <div className="rounded-2xl bg-slate-50 px-5 py-3 font-semibold text-slate-700">billing@squash.app</div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
      <MobileTabBar role="developer" />
    </div>
  );
}

