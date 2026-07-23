import {
  Award,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Crown,
  Home,
  Medal,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Trophy,
  UserCircle2,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import TesterBadge, { getTesterTier } from './components/TesterBadge';
import MobileTabBar from './components/MobileTabBar';
import TesterMobileDrawer from './components/TesterMobileDrawer';
import { useAuth } from './auth';
import { getTesterEarningsSummary, type TesterEarningsSummary } from './lib/jobApi';

type LeaderboardRow = {
  rank: number;
  name: string;
  city: string;
  approvedTests: number;
  rating: number;
  score: number;
  specialty: string;
};

const demoLeaderboard: LeaderboardRow[] = [
  { rank: 1, name: 'Lerato D.', city: 'Johannesburg', approvedTests: 64, rating: 4.9, score: 982, specialty: 'Low data testing' },
  { rank: 2, name: 'Sipho N.', city: 'Durban', approvedTests: 42, rating: 4.8, score: 901, specialty: 'Mobile app testing' },
  { rank: 3, name: 'Amina K.', city: 'Cape Town', approvedTests: 31, rating: 4.7, score: 842, specialty: 'E-commerce testing' },
  { rank: 4, name: 'Neo M.', city: 'Pretoria', approvedTests: 18, rating: 4.4, score: 711, specialty: 'Website testing' },
];

function rankIcon(rank: number) {
  if (rank === 1) return Crown;
  if (rank === 2 || rank === 3) return Medal;
  return Award;
}

function rankTone(rank: number) {
  if (rank === 1) return 'bg-amber-50 text-amber-600 ring-amber-100';
  if (rank === 2) return 'bg-slate-100 text-slate-600 ring-slate-200';
  if (rank === 3) return 'bg-orange-50 text-orange-600 ring-orange-100';
  return 'bg-green-50 text-green-700 ring-green-100';
}

export default function SquashTesterLeaderboardPage() {
  const { session } = useAuth();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const testerName = session?.name || 'Tester';
  const isRealAccount = session?.source === 'supabase';
  const [earningsSummary, setEarningsSummary] = useState<TesterEarningsSummary | null>(null);
  const [loadError, setLoadError] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(session?.source === 'supabase');

  useEffect(() => {
    if (!session?.userId || session.source !== 'supabase') return;

    let mounted = true;
    setLoadError('');
    getTesterEarningsSummary(session.userId)
      .then((summary) => {
        if (mounted) setEarningsSummary(summary);
      })
      .catch((error: Error) => {
        if (mounted) setLoadError(error.message || 'Could not load leaderboard data right now.');
      })
      .finally(() => {
        if (mounted) setIsLoadingData(false);
      });

    return () => {
      mounted = false;
    };
  }, [session?.source, session?.userId]);

  const approvedTests = earningsSummary?.earnings.filter((item) => item.status === 'approved' || item.status === 'paid').length || 0;
  const rating = approvedTests > 0 ? 4.2 : 0;
  const currentTier = getTesterTier(approvedTests, rating);
  const qualityScore = approvedTests > 0 ? Math.round(approvedTests * 12 + rating * 80) : 0;
  const leaderboardRows = isRealAccount ? [] : demoLeaderboard;

  const navItems = [
    { label: 'Dashboard', icon: Home, href: '/tester/dashboard' },
    { label: 'Available Jobs', icon: BriefcaseBusiness, href: '/tester-jobs' },
    { label: 'My Tests', icon: ClipboardList, href: '/active-test' },
    { label: 'Reports', icon: ClipboardList, href: '/tester/reports' },
    { label: 'Earnings', icon: CircleDollarSign, href: '/tester/earnings' },
    { label: 'Profile', icon: UserCircle2, href: '/tester/profile' },
    { label: 'Settings', icon: Settings, href: '/tester/settings' },
  ];

  const rankingRules = useMemo(
    () => [
      'Approved reports increase your score after developer review.',
      'High ratings and clear evidence matter more than rushing many reports.',
      'Rejected or low-quality reports should not improve leaderboard position.',
      'Admin abuse checks should run before rewards or public rankings are finalized.',
    ],
    [],
  );

  if (session?.source === 'supabase' && isLoadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 text-center text-sm font-semibold text-slate-600">
        Loading leaderboard data...
      </div>
    );
  }

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
                  <input className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Search rankings, testers, specialties..." />
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
                  <Trophy className="h-4 w-4" /> Community leaderboard
                </div>
                <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">Tester leaderboard</h1>
                <p className="mt-2 max-w-2xl text-slate-600">A quality-first ranking system for testers who submit useful, approved reports and help developers ship better products.</p>
              </div>
              <div className="flex flex-wrap gap-3"><a href="/tester-jobs" className="rounded-2xl bg-green-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-green-700">Find Tests</a><a href="/tester/level-benefits" className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50">Level Benefits</a></div>
            </div>

            {loadError ? <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{loadError}</div> : null}

            <section className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Your ranking profile</h2>
                    <p className="mt-1 text-sm text-slate-600">This uses your approved work once real leaderboard data is available.</p>
                  </div>
                  <TesterBadge testsCompleted={approvedTests} rating={rating} />
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-sm font-semibold text-slate-500">Approved tests</div><div className="mt-2 text-3xl font-black text-slate-900">{approvedTests}</div></div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-sm font-semibold text-slate-500">Quality score</div><div className="mt-2 text-3xl font-black text-slate-900">{qualityScore}</div></div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-sm font-semibold text-slate-500">Tier</div><div className="mt-2 text-xl font-black text-slate-900">{currentTier.label}</div></div>
                </div>
              </div>

              <div className="rounded-3xl border border-green-100 bg-green-50 p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <ShieldCheck className="mt-1 h-7 w-7 text-green-700" />
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Quality-first rankings</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-700">The leaderboard should reward reliable testers, not spam. Rankings should use approved reports, developer ratings, evidence quality and admin trust checks.</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div><h2 className="text-2xl font-bold text-slate-900">Top testers</h2><p className="mt-1 text-sm text-slate-600">TODO: Replace with Supabase leaderboard query.</p></div>
                <div className="rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200">Monthly ranking</div>
              </div>

              <div className="divide-y divide-slate-100">
                {leaderboardRows.map((row) => {
                  const Icon = rankIcon(row.rank);
                  return (
                    <div key={row.rank} className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ring-1 ${rankTone(row.rank)}`}><Icon className="h-5 w-5" /></div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-black text-slate-400">#{row.rank}</span><h3 className="font-bold text-slate-900">{row.name}</h3><TesterBadge testsCompleted={row.approvedTests} rating={row.rating} /></div>
                          <div className="mt-1 flex flex-wrap gap-2 text-sm text-slate-500"><span>{row.city}</span><span>•</span><span>{row.specialty}</span></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center w-full sm:w-auto sm:min-w-[280px]">
                        <div className="rounded-2xl bg-slate-50 px-2 py-2"><div className="text-xs text-slate-500">Tests</div><div className="font-black text-slate-900">{row.approvedTests}</div></div>
                        <div className="rounded-2xl bg-slate-50 px-2 py-2"><div className="text-xs text-slate-500">Rating</div><div className="font-black text-slate-900">{row.rating.toFixed(1)}</div></div>
                        <div className="rounded-2xl bg-green-50 px-2 py-2"><div className="text-xs text-green-700">Score</div><div className="font-black text-green-700">{row.score}</div></div>
                      </div>
                    </div>
                  );
                })}
                {leaderboardRows.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <Users className="mx-auto h-10 w-10 text-slate-300" />
                    <div className="mt-4 text-lg font-bold text-slate-900">Leaderboard data is not live yet</div>
                    <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">Once enough real reports are approved, this page will rank testers using verified activity. For now, your own tier and quality score are shown above.</p>
                    <a href="/tester-jobs" className="mt-5 inline-flex rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700">Complete more tests</a>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {rankingRules.map((rule) => (
                <div key={rule} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600 shadow-sm">
                  <CheckCircle2 className="mb-3 h-5 w-5 text-green-700" />
                  {rule}
                </div>
              ))}
            </section>
          </div>
        </main>
      </div>
      <MobileTabBar role="tester" />
      <TesterMobileDrawer isOpen={isMobileDrawerOpen} onClose={() => setIsMobileDrawerOpen(false)} activePath="/tester/leaderboard" />
    </div>
  );
}

