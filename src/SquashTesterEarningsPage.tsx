import {
  BadgeCheck,
  Banknote,
  Bell,
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
import { useAuth } from './auth';

export default function SquashTesterEarningsPage() {
  const { session } = useAuth();
  const testerName = session?.name || 'Thando M.';

  const navItems = [
    { label: 'Dashboard', icon: Home, href: '/tester/dashboard' },
    { label: 'Available Jobs', icon: BriefcaseBusiness, href: '/tester-jobs' },
    { label: 'My Tests', icon: ClipboardList, href: '/active-test' },
    { label: 'Reports', icon: ClipboardList, href: '/tester/reports' },
    { label: 'Earnings', icon: CircleDollarSign, href: '/tester/earnings', active: true },
    { label: 'Profile', icon: UserCircle2, href: '/tester/profile' },
    { label: 'Settings', icon: Settings, href: '/tester/settings' },
  ];

  const summaryCards = [
    {
      title: 'Available Balance',
      value: 'R3,250',
      note: 'Paid to bank within 24hrs of approval',
      icon: Wallet,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-700',
    },
    {
      title: 'Pending Payout',
      value: 'R620',
      note: 'Awaiting developer approval',
      icon: Clock3,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-700',
    },
    {
      title: 'This Month',
      value: 'R1,120',
      note: 'From 6 approved tests',
      icon: Banknote,
      iconBg: 'bg-sky-50',
      iconColor: 'text-sky-700',
    },
    {
      title: 'Lifetime Earned',
      value: 'R8,740',
      note: 'Since May 2025',
      icon: BadgeCheck,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-700',
    },
  ];

  const payoutMethods = [
    {
      title: 'Bank Transfer (EFT)',
      detail: 'FNB account ending 1234',
      status: 'Primary',
      icon: CreditCard,
      active: true,
    },
    {
      title: 'SnapScan',
      detail: 'Connected to +27 72 000 1234',
      status: 'Ready',
      icon: Smartphone,
      active: false,
    },
    {
      title: 'Airtime top-up',
      detail: 'Vodacom prepaid number saved',
      status: 'Ready',
      icon: Phone,
      active: false,
    },
  ];

  const pendingApprovals = [
    { app: 'FitTrack Mobile App', submitted: '20 May 2025', amount: 'R250', status: 'Pending' },
    { app: 'HealthHub Web', submitted: '18 May 2025', amount: 'R370', status: 'Pending' },
  ];

  const transactions = [
    { date: '22 May 2025', type: 'Test earning', description: 'FoodOrder Web Platform', amount: 'R400', status: 'Approved' },
    { date: '20 May 2025', type: 'Test earning', description: 'FitTrack Mobile App', amount: 'R250', status: 'Pending' },
    { date: '18 May 2025', type: 'Test earning', description: 'HealthHub Web', amount: 'R370', status: 'Pending' },
    { date: '10 May 2025', type: 'Payout', description: 'Bank Transfer (EFT)', amount: '-R450', status: 'Paid' },
    { date: '05 May 2025', type: 'Test earning', description: 'ShopEase iOS App', amount: 'R350', status: 'Paid' },
  ];

  const monthlyPoints = '0,92 16,70 33,78 50,48 66,56 83,34 100,18';

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
                <a href="/tester/menu" className="rounded-xl border border-slate-300 p-2.5 text-slate-600 lg:hidden">
                  <Menu className="h-5 w-5" />
                </a>
                <div className="hidden max-w-xl flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:flex md:min-w-[340px] lg:min-w-[460px]">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    placeholder="Search earnings, payouts, reports..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-4">
                <a href="/tester/notifications" className="relative rounded-full border border-slate-200 p-2.5 text-slate-600">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    2
                  </span>
                </a>
                <a href="/tester/profile" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700">
                    {testerName.charAt(0)}
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-sm font-bold text-slate-900">{testerName}</div>
                    <div className="text-xs text-slate-500">Tester</div>
                  </div>
                </a>
              </div>
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
                <a
                  href="/tester/profile"
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  View Profile
                </a>
              </div>
            </div>

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
                    {[0, 16, 33, 50, 66, 83, 100].map((x, index) => (
                      <circle key={x} cx={x} cy={[92, 70, 78, 48, 56, 34, 18][index]} r="2.2" fill="#16a34a" />
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
                    <h2 className="text-2xl font-bold text-slate-900">Pending approvals</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      These submissions are waiting for developer approval before payout.
                    </p>
                  </div>
                </div>
                <div className="mt-5 space-y-4">
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

                <div className="overflow-x-auto">
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
                      {transactions.map((item) => (
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
                                    : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {item.status === 'Paid' ? <CheckCircle2 className="h-3 w-3" /> : null}
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
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
    </div>
  );
}
