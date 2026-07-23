import {
  BadgeCheck,
  Banknote,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  CreditCard,
  Home,
  Menu,
  Phone,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  UserCircle2,
  Wallet,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import TesterHeaderNav from './components/TesterHeaderNav';
import MobileTabBar from './components/MobileTabBar';
import TesterMobileDrawer from './components/TesterMobileDrawer';
import { useAuth } from './auth';
import { getTesterEarningsSummary, requestTesterPayout, type TesterEarningsSummary } from './lib/jobApi';

export default function SquashTesterEarningsPage() {
  const { session } = useAuth();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const isRealAccount = session?.source === 'supabase';
  const [earningsSummary, setEarningsSummary] = useState<TesterEarningsSummary | null>(null);
  const [earningsError, setEarningsError] = useState('');
  const [payoutNotice, setPayoutNotice] = useState('');
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(session?.source === 'supabase');

  useEffect(() => {
    if (!session?.userId || session.source !== 'supabase') return;

    let mounted = true;
    setEarningsError('');
    getTesterEarningsSummary(session.userId)
      .then((summary) => {
        if (mounted) setEarningsSummary(summary);
      })
      .catch((error: Error) => {
        if (mounted) setEarningsError(error.message || 'Could not load earnings right now.');
      })
      .finally(() => {
        if (mounted) setIsLoadingData(false);
      });

    return () => {
      mounted = false;
    };
  }, [session?.source, session?.userId]);

  const formatRand = (amount: number) => `R${amount.toLocaleString('en-ZA')}`;
  const liveTransactions = useMemo(() => {
    if (!earningsSummary) return null;
    return [
      ...earningsSummary.earnings.map((item) => ({
        date: item.submittedAt ? new Date(item.submittedAt).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Pending date',
        type: 'Test earning',
        description: item.jobTitle,
        amount: formatRand(item.amountZar),
        status:
          item.status === 'pending'
            ? 'Pending'
            : item.status === 'approved'
              ? 'Approved'
              : item.status === 'paid'
                ? 'Paid'
                : item.status === 'changes_requested'
                  ? 'Action Needed'
                  : 'Rejected',
      })),
      ...earningsSummary.payouts.map((item) => ({
        date: new Date(item.createdAt).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }),
        type: 'Payout request',
        description: 'Manual payout request',
        amount: `-${formatRand(item.amountZar)}`,
        status: item.status === 'paid' ? 'Paid' : item.status === 'processing' ? 'Approved' : 'Pending',
      })),
    ].slice(0, 8);
  }, [earningsSummary]);

  const handleRequestPayout = async () => {
    if (!session?.userId || session.source !== 'supabase') {
      setPayoutNotice('Please log in with a real tester account to request payout.');
      return;
    }
    const amount = earningsSummary?.availableBalanceZar || 0;
    if (amount <= 0) {
      setPayoutNotice('No approved balance available for payout yet.');
      return;
    }

    setRequestingPayout(true);
    setPayoutNotice('');
    try {
      await requestTesterPayout(session.userId, amount);
      const refreshed = await getTesterEarningsSummary(session.userId);
      setEarningsSummary(refreshed);
      setPayoutNotice(`Payout request created for ${formatRand(amount)}. Admin processing comes next.`);
    } catch (error) {
      setPayoutNotice(error instanceof Error ? error.message : 'Could not request payout right now.');
    } finally {
      setRequestingPayout(false);
    }
  };


  const navItems = [
    { label: 'Dashboard', icon: Home, href: '/tester/dashboard' },
    { label: 'Available Jobs', icon: BriefcaseBusiness, href: '/tester-jobs' },
    { label: 'My Tests', icon: ClipboardList, href: '/active-test' },
    { label: 'Reports', icon: ClipboardList, href: '/tester/reports' },
    { label: 'Earnings', icon: CircleDollarSign, href: '/tester/earnings', active: true },
    { label: 'Profile', icon: UserCircle2, href: '/tester/profile' },
    { label: 'Settings', icon: Settings, href: '/tester/settings' },
  ];

  if (session?.source === 'supabase' && isLoadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 text-center text-sm font-semibold text-slate-600">
        Loading earnings data...
      </div>
    );
  }

  const summaryCards = [
    {
      title: 'Available Balance',
      value: earningsSummary ? formatRand(earningsSummary.availableBalanceZar) : isRealAccount ? 'R0' : 'R3,250',
      note: 'Paid to bank within 24hrs of approval',
      icon: Wallet,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-700',
    },
    {
      title: 'Pending Payout',
      value: earningsSummary ? formatRand(earningsSummary.pendingPayoutZar) : isRealAccount ? 'R0' : 'R620',
      note: 'Requested and awaiting admin processing',
      icon: Clock3,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-700',
    },
    {
      title: 'This Month',
      value: earningsSummary ? formatRand(earningsSummary.pendingApprovalZar) : isRealAccount ? 'R0' : 'R1,120',
      note: 'Waiting for developer approval',
      icon: Banknote,
      iconBg: 'bg-sky-50',
      iconColor: 'text-sky-700',
    },
    {
      title: 'Lifetime Earned',
      value: earningsSummary ? formatRand(earningsSummary.lifetimeApprovedZar) : isRealAccount ? 'R0' : 'R8,740',
      note: isRealAccount ? 'Approved work over time' : 'Since May 2025',
      icon: BadgeCheck,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-700',
    },
  ];

  const payoutMethods = [
    {
      title: 'Bank Transfer (EFT)',
      detail: isRealAccount ? 'Add your bank details in profile settings' : 'FNB account ending 1234',
      status: isRealAccount ? 'Setup needed' : 'Primary',
      icon: CreditCard,
      active: !isRealAccount,
    },
    {
      title: 'SnapScan',
      detail: isRealAccount ? 'Connect SnapScan when payouts go live' : 'Connected to +27 72 000 1234',
      status: isRealAccount ? 'Available soon' : 'Ready',
      icon: Smartphone,
      active: false,
    },
    {
      title: 'Airtime top-up',
      detail: isRealAccount ? 'Add a prepaid number in profile settings' : 'Vodacom prepaid number saved',
      status: isRealAccount ? 'Setup needed' : 'Ready',
      icon: Phone,
      active: false,
    },
  ];

  const pendingApprovals = earningsSummary
    ? earningsSummary.earnings
        .filter((item) => item.status === 'pending')
        .map((item) => ({
          app: item.jobTitle,
          submitted: item.submittedAt ? new Date(item.submittedAt).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recently',
          amount: formatRand(item.amountZar),
          status: 'Pending',
        }))
    : isRealAccount
      ? []
      : [
          { app: 'FitTrack Mobile App', submitted: '20 May 2025', amount: 'R250', status: 'Pending' },
          { app: 'HealthHub Web', submitted: '18 May 2025', amount: 'R370', status: 'Pending' },
        ];

  const actionNeededReports = earningsSummary?.earnings
    .filter((item) => item.status === 'changes_requested')
    .map((item) => ({
      app: item.jobTitle,
      submitted: item.submittedAt ? new Date(item.submittedAt).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recently',
      amount: formatRand(item.amountZar),
      status: 'Action needed',
    })) || [];

  const transactions = [
    { date: '22 May 2025', type: 'Test earning', description: 'FoodOrder Web Platform', amount: 'R400', status: 'Approved' },
    { date: '20 May 2025', type: 'Test earning', description: 'FitTrack Mobile App', amount: 'R250', status: 'Pending' },
    { date: '18 May 2025', type: 'Test earning', description: 'HealthHub Web', amount: 'R370', status: 'Pending' },
    { date: '10 May 2025', type: 'Payout', description: 'Bank Transfer (EFT)', amount: '-R450', status: 'Paid' },
    { date: '05 May 2025', type: 'Test earning', description: 'ShopEase iOS App', amount: 'R350', status: 'Paid' },
  ];

  const monthlyPoints = isRealAccount && !earningsSummary ? '0,92 16,92 33,92 50,92 66,92 83,92 100,92' : '0,92 16,70 33,78 50,48 66,56 83,34 100,18';
  const monthlyDots = monthlyPoints.split(' ').map((point) => point.split(',').map(Number));

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

          <div className="p-4 pt-0">
            <div className="rounded-3xl border border-green-100 bg-green-50 p-5 shadow-sm">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <ShieldCheck className="h-5 w-5 text-green-700" />
                Secure payouts
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Approved tester earnings are paid directly to your selected method.
              </p>
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
                    placeholder="Search earnings, payouts, reports..."
                  />
                </div>
              </div>

              <TesterHeaderNav />
            </div>
          </header>

          <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 ring-1 ring-green-100">
                  Tester earnings
                </div>
                <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">Earnings & payouts</h1>
                <p className="mt-2 text-slate-600">
                  Track approved test earnings, pending approvals, and payout methods.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href="/tester-jobs"
                  className="rounded-2xl bg-green-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-green-700"
                >
                  Find More Tests
                </a>
                <button
                  type="button"
                  onClick={handleRequestPayout}
                  disabled={requestingPayout}
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {requestingPayout ? 'Requesting...' : 'Request Payout'}
                </button>
              </div>
            </div>

            {earningsError ? (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {earningsError}
              </div>
            ) : null}
            {payoutNotice ? (
              <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
                {payoutNotice}
              </div>
            ) : null}

            <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-slate-600">{card.title}</div>
                        <div className="mt-2 text-3xl font-black text-slate-900">{card.value}</div>
                        <div className="mt-2 text-sm leading-6 text-slate-500">{card.note}</div>
                      </div>
                      <div className={`grid h-11 w-11 place-items-center rounded-2xl ${card.iconBg}`}>
                        <Icon className={`h-5 w-5 ${card.iconColor}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Earnings trend</h2>
                    <p className="mt-1 text-sm text-slate-600">Approved and pending tester earnings this month.</p>
                  </div>
                  <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                    This Month <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-6 rounded-3xl border border-slate-100 bg-slate-50 p-5">
                  <svg viewBox="0 0 100 100" className="h-56 w-full overflow-visible">
                    <defs>
                      <linearGradient id="earningsFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#16a34a" stopOpacity="0.22" />
                        <stop offset="100%" stopColor="#16a34a" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <polygon points={`0,100 ${monthlyPoints} 100,100`} fill="url(#earningsFill)" />
                    <polyline points={monthlyPoints} fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    {monthlyDots.map(([x, y]) => (
                      <circle key={`${x}-${y}`} cx={x} cy={y} r="2.2" fill="#16a34a" />
                    ))}
                  </svg>
                  <div className="mt-3 grid grid-cols-4 gap-2 text-xs text-slate-500 sm:grid-cols-7">
                    {['1 May', '6 May', '12 May', '18 May', '22 May', '27 May', '31 May'].map((label) => (
                      <span key={label}>{label}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900">Payout methods</h2>
                <p className="mt-1 text-sm text-slate-600">Choose how approved earnings reach you.</p>
                <div className="mt-5 space-y-4">
                  {payoutMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <div
                        key={method.title}
                        className={`rounded-2xl border p-4 ${
                          method.active ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white shadow-sm">
                              <Icon className="h-5 w-5 text-green-700" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{method.title}</div>
                              <div className="mt-1 text-sm text-slate-600">{method.detail}</div>
                            </div>
                          </div>
                          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-green-700 ring-1 ring-green-100">
                            {method.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <a href="/tester/profile" className="mt-5 inline-flex text-sm font-semibold text-green-700">
                  Update payout details
                </a>
              </div>
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
              <div className="rounded-3xl border border-amber-100 bg-amber-50 p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <Clock3 className="mt-1 h-6 w-6 text-amber-700" />
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Approval status</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      See what is waiting for developer approval and what needs your update before payout.
                    </p>
                  </div>
                </div>
                <div className="mt-5 space-y-4">
                  {actionNeededReports.map((item) => (
                    <div key={`action-${item.app}`} className="rounded-2xl border border-sky-100 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-900">{item.app}</div>
                          <div className="mt-1 text-sm text-slate-500">Submitted {item.submitted}</div>
                          <a href="/tester/reports" className="mt-2 inline-flex text-sm font-semibold text-sky-700">Update report</a>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-slate-900">{item.amount}</div>
                          <div className="mt-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                            {item.status}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {pendingApprovals.map((item) => (
                    <div key={item.app} className="rounded-2xl border border-amber-100 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-900">{item.app}</div>
                          <div className="mt-1 text-sm text-slate-500">Submitted {item.submitted}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-slate-900">{item.amount}</div>
                          <div className="mt-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            {item.status}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {actionNeededReports.length === 0 && pendingApprovals.length === 0 ? (
                    <div className="rounded-2xl border border-amber-100 bg-white p-4 text-sm leading-6 text-slate-600">
                      Nothing is waiting for approval right now.
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Transaction history</h2>
                    <p className="mt-1 text-sm text-slate-600">Recent earnings and payouts.</p>
                  </div>
                  <button className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                    Export
                  </button>
                </div>

                {/* Mobile Cards List */}
                <div className="divide-y divide-slate-100 md:hidden">
                  {(liveTransactions || (isRealAccount ? [] : transactions)).length === 0 ? (
                    <div className="px-5 py-8 text-center text-sm text-slate-500">
                      No earnings or payout transactions yet.
                    </div>
                  ) : null}
                  {(liveTransactions || (isRealAccount ? [] : transactions)).map((item) => (
                    <div key={`${item.date}-${item.description}`} className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-900">{item.description}</div>
                          <div className="text-xs text-slate-500">{item.date} • {item.type}</div>
                        </div>
                        <span
                          className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            item.status === 'Paid'
                              ? 'bg-green-50 text-green-700'
                              : item.status === 'Approved'
                                ? 'bg-sky-50 text-sky-700'
                                : item.status === 'Action Needed'
                                  ? 'bg-sky-50 text-sky-700'
                                  : item.status === 'Rejected'
                                    ? 'bg-red-50 text-red-600'
                                    : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {item.status === 'Paid' ? <CheckCircle2 className="h-3 w-3" /> : null}
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
                      {(liveTransactions || (isRealAccount ? [] : transactions)).map((item) => (
                        <tr key={`${item.date}-${item.description}`} className="border-b border-slate-100 last:border-b-0">
                          <td className="px-6 py-4 text-slate-700">{item.date}</td>
                          <td className="px-6 py-4 text-slate-700">{item.type}</td>
                          <td className="px-6 py-4 font-semibold text-slate-900">{item.description}</td>
                          <td className={`px-6 py-4 font-semibold ${item.amount.startsWith('-') ? 'text-red-600' : 'text-slate-900'}`}>
                            {item.amount}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                                item.status === 'Paid'
                                  ? 'bg-green-50 text-green-700'
                                  : item.status === 'Approved'
                                    ? 'bg-sky-50 text-sky-700'
                                    : item.status === 'Action Needed'
                                      ? 'bg-sky-50 text-sky-700'
                                      : item.status === 'Rejected'
                                        ? 'bg-red-50 text-red-600'
                                        : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {item.status === 'Paid' ? <CheckCircle2 className="h-3 w-3" /> : null}
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {(liveTransactions || (isRealAccount ? [] : transactions)).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                            No earnings or payout transactions yet.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-3xl border border-green-100 bg-green-50 p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xl font-bold text-slate-900">
                    <ShieldCheck className="h-6 w-6 text-green-700" />
                    Your money is handled securely
                  </div>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
                    Approved earnings are sent to your selected payout method within 24 hours. You only see what you earn as a tester.
                  </p>
                </div>
                <a
                  href="/help-center"
                  className="inline-flex justify-center rounded-2xl border border-green-200 bg-white px-5 py-3 font-semibold text-green-700 hover:bg-green-50"
                >
                  Payout Help
                </a>
              </div>
            </section>
          </div>
        </main>
      </div>
      <MobileTabBar role="tester" />
      <TesterMobileDrawer isOpen={isMobileDrawerOpen} onClose={() => setIsMobileDrawerOpen(false)} activePath="/tester/earnings" />
    </div>
  );
}
