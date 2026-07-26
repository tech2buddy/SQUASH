import {
  BriefcaseBusiness,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Gem,
  Home,
  Medal,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Star,
  Trophy,
  UserCircle2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import TesterBadge, { getTesterTier, type TesterTier } from './components/TesterBadge';
import { useAuth } from './auth';
import MobileTabBar from './components/MobileTabBar';
import TesterMobileDrawer from './components/TesterMobileDrawer';
import { getTesterEarningsSummary, type TesterEarningsSummary } from './lib/jobApi';
import { getTesterProfile, type TesterPublicProfile } from './lib/profileApi';

type TierCard = {
  tier: TesterTier;
  name: string;
  range: string;
  rating: string;
  benefits: string[];
  icon: typeof Medal;
  tone: string;
  ring: string;
};

const tierCards: TierCard[] = [
  {
    tier: 'new',
    name: 'New Tester',
    range: '0 to 5 approved tests',
    rating: 'Build your first rating',
    benefits: ['Access beginner-friendly tests', 'Learn report quality standards', 'Build trust with developers'],
    icon: Medal,
    tone: 'bg-slate-50 text-slate-600',
    ring: 'border-slate-200',
  },
  {
    tier: 'verified',
    name: 'Verified',
    range: '6 to 20 approved tests',
    rating: 'Minimum 4.0 rating',
    benefits: ['Better matching visibility', 'More developer confidence', 'Eligible for direct invites'],
    icon: ShieldCheck,
    tone: 'bg-blue-50 text-blue-600',
    ring: 'border-blue-200',
  },
  {
    tier: 'pro',
    name: 'Pro Tester',
    range: '21 to 50 approved tests',
    rating: 'Minimum 4.5 rating',
    benefits: ['Priority for detailed tests', 'Stronger public profile badge', 'More trust on developer shortlists'],
    icon: Trophy,
    tone: 'bg-amber-50 text-amber-600',
    ring: 'border-amber-200',
  },
  {
    tier: 'elite',
    name: 'Elite Tester',
    range: '50+ approved tests',
    rating: 'Minimum 4.8 rating',
    benefits: ['Top-tier reputation signal', 'Priority matching for premium jobs', 'Featured leaderboard placement'],
    icon: Gem,
    tone: 'bg-violet-50 text-violet-600',
    ring: 'border-violet-200',
  },
];

function nextTierCopy(tier: TesterTier, approvedTests: number) {
  if (tier === 'elite') return 'You are at the highest tier. Keep your rating high and stay active.';
  if (tier === 'pro') return `${Math.max(0, 50 - approvedTests)} more approved tests and a 4.8 rating gets you to Elite.`;
  if (tier === 'verified') return `${Math.max(0, 21 - approvedTests)} approved tests and a 4.5 rating gets you to Pro.`;
  return `${Math.max(0, 6 - approvedTests)} approved tests and a 4.0 rating gets you Verified.`;
}

export default function SquashTesterLevelBenefitsPage() {
  const { session } = useAuth();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const testerName = session?.name || 'Tester';
  const [earningsSummary, setEarningsSummary] = useState<TesterEarningsSummary | null>(null);
  const [testerProfile, setTesterProfile] = useState<TesterPublicProfile | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!session?.userId) return;

    let mounted = true;
    setLoadError('');
    Promise.all([
      getTesterEarningsSummary(session.userId),
      getTesterProfile(session.userId)
    ])
      .then(([summary, profile]) => {
        if (mounted) {
          setEarningsSummary(summary);
          setTesterProfile(profile);
        }
      })
      .catch((error: Error) => {
        if (mounted) setLoadError(error.message || 'Could not load level data right now.');
      });

    return () => {
      mounted = false;
    };
  }, [("supabase"), session?.userId]);

  const approvedTests = earningsSummary?.earnings.filter((item) => item.status === 'approved' || item.status === 'paid').length || 0;
  const rating = testerProfile?.rating || (approvedTests > 0 ? 4.2 : 0);
  const currentTier = getTesterTier(approvedTests, rating);
  const currentTierIndex = tierCards.findIndex((tier) => tier.tier === currentTier.tier);
  const progressToVerified = Math.min(100, Math.round((approvedTests / 6) * 100));
  const progressToPro = Math.min(100, Math.round((approvedTests / 21) * 100));
  const progressToElite = Math.min(100, Math.round((approvedTests / 50) * 100));

  const navItems = [
    { label: 'Dashboard', icon: Home, href: '/tester/dashboard' },
    { label: 'Available Jobs', icon: BriefcaseBusiness, href: '/tester-jobs' },
    { label: 'My Tests', icon: ClipboardList, href: '/active-test' },
    { label: 'Reports', icon: ClipboardList, href: '/tester/reports' },
    { label: 'Earnings', icon: CircleDollarSign, href: '/tester/earnings' },
    { label: 'Profile', icon: UserCircle2, href: '/tester/profile' },
    { label: 'Settings', icon: Settings, href: '/tester/settings' },
  ];

  const improvementTips = useMemo(
    () => [
      'Complete test tasks exactly as requested before submitting.',
      'Use clear reproduction steps so developers can verify issues quickly.',
      'Add screenshots or short recordings when they make the bug easier to understand.',
      'Keep your device, network and language specializations updated.',
    ],
    [],
  );

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
                  <input className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Search levels, badges, benefits..." />
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
                  <Trophy className="h-4 w-4" /> Tester growth
                </div>
                <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">Level benefits</h1>
                <p className="mt-2 max-w-2xl text-slate-600">Your tester level helps developers understand your experience, reliability and report quality.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a href="/tester/profile" className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50">Improve Profile</a>
                <a href="/tester-jobs" className="rounded-2xl bg-green-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-green-700">Browse Jobs</a>
              </div>
            </div>

            {loadError ? <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{loadError}</div> : null}

            <section className="mt-8 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Your current tier</h2>
                    <p className="mt-1 text-sm text-slate-600">Based on approved reports and rating.</p>
                  </div>
                  <TesterBadge testsCompleted={approvedTests} rating={rating} />
                </div>

                <div className="mt-7 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-sm font-semibold text-slate-500">Approved tests</div><div className="mt-2 text-3xl font-black text-slate-900">{approvedTests}</div></div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-sm font-semibold text-slate-500">Rating</div><div className="mt-2 text-3xl font-black text-slate-900">{rating ? rating.toFixed(1) : '-'}</div></div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-sm font-semibold text-slate-500">Current level</div><div className="mt-2 text-xl font-black text-slate-900">{currentTier.label}</div></div>
                </div>

                <div className="mt-6 rounded-3xl border border-green-100 bg-green-50 p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-700" />
                    <div>
                      <div className="font-bold text-slate-900">Next milestone</div>
                      <p className="mt-1 text-sm leading-6 text-slate-700">{nextTierCopy(currentTier.tier, approvedTests)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900">Progress tracks</h2>
                <div className="mt-6 space-y-5">
                  {[
                    { label: 'Verified track', value: progressToVerified, target: '6 approved tests' },
                    { label: 'Pro track', value: progressToPro, target: '21 approved tests' },
                    { label: 'Elite track', value: progressToElite, target: '50 approved tests' },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="mb-2 flex items-center justify-between text-sm"><span className="font-semibold text-slate-700">{item.label}</span><span className="text-slate-500">{item.target}</span></div>
                      <div className="h-3 rounded-full bg-slate-100"><div className="h-3 rounded-full bg-green-600" style={{ width: `${item.value}%` }} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {tierCards.map((tier, index) => {
                const Icon = tier.icon;
                const reached = index <= currentTierIndex;
                return (
                  <div key={tier.tier} className={`rounded-3xl border bg-white p-5 shadow-sm ${tier.ring}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className={`grid h-12 w-12 place-items-center rounded-2xl ${tier.tone}`}><Icon className="h-6 w-6" /></div>
                      {reached ? <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700 ring-1 ring-green-100">Reached</span> : null}
                    </div>
                    <h3 className="mt-5 text-xl font-black text-slate-900">{tier.name}</h3>
                    <div className="mt-2 text-sm font-semibold text-slate-500">{tier.range}</div>
                    <div className="mt-1 text-sm text-slate-500">{tier.rating}</div>
                    <div className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
                      {tier.benefits.map((benefit) => <div key={benefit} className="flex gap-2"><span className="text-green-600">?</span><span>{benefit}</span></div>)}
                    </div>
                  </div>
                );
              })}
            </section>

            <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">How to level up faster</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Quality matters more than rushing. Developers reward useful, honest and easy-to-follow reports.</p>
                </div>
                <a href="/tester/reports" className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">View Reports</a>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {improvementTips.map((tip) => (
                  <div key={tip} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                    <Star className="mb-3 h-5 w-5 text-amber-500" />
                    {tip}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
      <MobileTabBar role="tester" />
      <TesterMobileDrawer isOpen={isMobileDrawerOpen} onClose={() => setIsMobileDrawerOpen(false)} activePath="/tester/level-benefits" />
    </div>
  );
}
