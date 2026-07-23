import {
  BriefcaseBusiness,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
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
import { useAuth } from './auth';
import TesterMobileDrawer from './components/TesterMobileDrawer';
import MobileTabBar from './components/MobileTabBar';

type PayoutMethod = 'eft' | 'snapscan' | 'airtime';

type SafePayoutState = {
  method: PayoutMethod;
  accountHolder: string;
  bankName: string;
  accountLastFour: string;
  mobileNumber: string;
  airtimeNetwork: string;
};

const STORAGE_KEY = 'squash_safe_payout_preferences_v1';

const defaultPayoutState: SafePayoutState = {
  method: 'eft',
  accountHolder: '',
  bankName: '',
  accountLastFour: '',
  mobileNumber: '',
  airtimeNetwork: '',
};

function readPayoutState(): SafePayoutState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPayoutState;
    return { ...defaultPayoutState, ...(JSON.parse(raw) as Partial<SafePayoutState>) };
  } catch {
    return defaultPayoutState;
  }
}

export default function SquashTesterPayoutMethodPage() {
  const { session } = useAuth();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const testerName = session?.name || 'Tester';
  const [form, setForm] = useState<SafePayoutState>(() => readPayoutState());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const timer = saved ? window.setTimeout(() => setSaved(false), 2500) : undefined;
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [saved]);

  const navItems = [
    { label: 'Dashboard', icon: Home, href: '/tester/dashboard' },
    { label: 'Available Jobs', icon: BriefcaseBusiness, href: '/tester-jobs' },
    { label: 'My Tests', icon: ClipboardList, href: '/active-test' },
    { label: 'Reports', icon: ClipboardList, href: '/tester/reports' },
    { label: 'Earnings', icon: CircleDollarSign, href: '/tester/earnings' },
    { label: 'Profile', icon: UserCircle2, href: '/tester/profile' },
    { label: 'Settings', icon: Settings, href: '/tester/settings' },
  ];

  const methods = [
    {
      id: 'eft' as const,
      title: 'Bank Transfer (EFT)',
      detail: 'Best for approved earnings paid directly to your bank.',
      icon: CreditCard,
    },
    {
      id: 'snapscan' as const,
      title: 'SnapScan',
      detail: 'Useful for mobile-first payouts when this option goes live.',
      icon: Smartphone,
    },
    {
      id: 'airtime' as const,
      title: 'Airtime top-up',
      detail: 'Good for smaller payouts converted to prepaid airtime.',
      icon: Phone,
    },
  ];

  const activeMethod = methods.find((method) => method.id === form.method) || methods[0];
  const ActiveIcon = activeMethod.icon;

  const readiness = useMemo(() => {
    if (form.method === 'eft') return Boolean(form.accountHolder && form.bankName && form.accountLastFour.length === 4);
    if (form.method === 'snapscan') return Boolean(form.mobileNumber);
    return Boolean(form.mobileNumber && form.airtimeNetwork);
  }, [form]);

  const updateField = (key: keyof SafePayoutState, value: string) => {
    const sanitizedValue = key === 'accountLastFour' ? value.replace(/\D/g, '').slice(0, 4) : value;
    setForm((prev) => ({ ...prev, [key]: sanitizedValue }));
  };

  const save = () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    setSaved(true);
  };

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
                <a key={item.href} href={item.href} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </a>
              );
            })}
          </nav>
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
                  <input className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Search payouts, earnings, settings..." />
                </div>
              </div>
              <a href="/tester/profile" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700">{testerName.charAt(0)}</div>
                <div className="hidden sm:block"><div className="text-sm font-bold text-slate-900">{testerName}</div><div className="text-xs text-slate-500">Tester</div></div>
              </a>
            </div>
          </header>

          <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 ring-1 ring-green-100">
                  <Wallet className="h-4 w-4" /> Payout setup
                </div>
                <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">Payout method</h1>
                <p className="mt-2 max-w-2xl text-slate-600">Choose how approved tester earnings should reach you. Sensitive payout verification will move through a secure provider before real money moves.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {saved ? <div className="inline-flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700"><CheckCircle2 className="h-4 w-4" /> Saved</div> : null}
                <button type="button" onClick={save} className="rounded-2xl bg-green-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-green-700">Save preference</button>
              </div>
            </div>

            <section className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900">Choose payout option</h2>
                <div className="mt-5 space-y-4">
                  {methods.map((method) => {
                    const Icon = method.icon;
                    const active = form.method === method.id;
                    return (
                      <button
                        type="button"
                        key={method.id}
                        onClick={() => setForm((prev) => ({ ...prev, method: method.id }))}
                        className={`flex w-full items-start gap-4 rounded-3xl border p-5 text-left transition ${active ? 'border-green-200 bg-green-50 ring-1 ring-green-100' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                      >
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-green-700 shadow-sm"><Icon className="h-5 w-5" /></span>
                        <span>
                          <span className="block font-bold text-slate-900">{method.title}</span>
                          <span className="mt-1 block text-sm leading-6 text-slate-600">{method.detail}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Safe payout details</h2>
                    <p className="mt-1 text-sm text-slate-600">For now we only save non-sensitive setup details locally.</p>
                  </div>
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-green-50 text-green-700"><ActiveIcon className="h-6 w-6" /></div>
                </div>

                {form.method === 'eft' ? (
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <label className="block md:col-span-2"><span className="mb-2 block text-sm font-semibold text-slate-700">Account holder name</span><input value={form.accountHolder} onChange={(event) => updateField('accountHolder', event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green-500" placeholder="Your legal name" /></label>
                    <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Bank name</span><input value={form.bankName} onChange={(event) => updateField('bankName', event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green-500" placeholder="e.g. Capitec, FNB" /></label>
                    <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Account last 4 digits only</span><input value={form.accountLastFour} onChange={(event) => updateField('accountLastFour', event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green-500" placeholder="1234" inputMode="numeric" /></label>
                  </div>
                ) : null}

                {form.method === 'snapscan' ? (
                  <div className="mt-6"><label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">SnapScan mobile number</span><input value={form.mobileNumber} onChange={(event) => updateField('mobileNumber', event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green-500" placeholder="+27 ..." /></label></div>
                ) : null}

                {form.method === 'airtime' ? (
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Prepaid mobile number</span><input value={form.mobileNumber} onChange={(event) => updateField('mobileNumber', event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green-500" placeholder="+27 ..." /></label>
                    <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Network</span><input value={form.airtimeNetwork} onChange={(event) => updateField('airtimeNetwork', event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green-500" placeholder="Vodacom, MTN, Cell C..." /></label>
                  </div>
                ) : null}

                <div className={`mt-6 rounded-3xl border p-5 ${readiness ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
                  <div className="flex items-start gap-3">
                    <ShieldCheck className={`mt-0.5 h-5 w-5 ${readiness ? 'text-green-700' : 'text-amber-700'}`} />
                    <div>
                      <div className="font-bold text-slate-900">{readiness ? 'Preference ready for verification' : 'More details needed'}</div>
                      <p className="mt-1 text-sm leading-6 text-slate-700">Full banking verification must happen through a secure payout provider before production payouts. We are not saving full bank account numbers in the browser.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
      <MobileTabBar role="tester" />
      <TesterMobileDrawer isOpen={isMobileDrawerOpen} onClose={() => setIsMobileDrawerOpen(false)} activePath="/tester/payout" />
    </div>
  );
}
