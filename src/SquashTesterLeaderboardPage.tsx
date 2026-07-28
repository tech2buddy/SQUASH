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
import { getTesterLeaderboard, type TesterLeaderboardEntry } from './lib/profileApi';

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
  const [leaderboard, setLeaderboard] = useState<TesterLeaderboardEntry[]>([]);
  const [earningsSummary, setEarningsSummary] = useState<TesterEarningsSummary | null>(null);
  const [loadError, setLoadError] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoadError('');
    setIsLoadingData(true);

    Promise.all([
      getTesterLeaderboard(),
      session?.userId && session?.role === 'tester' ? getTesterEarningsSummary(session.userId) : Promise.resolve(null)
    ])
      .then(([leaderboardData, summaryData]) => {
        if (mounted) {
          setLeaderboard(leaderboardData);
          if (summaryData) setEarningsSummary(summaryData);
        }
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
  }, [session?.userId, session?.role]);

  const approvedTests = earningsSummary?.earnings.filter((item) => item.status === 'approved' || item.status === 'paid').length || 0;
  const rating = approvedTests > 0 ? 4.2 : 0;
  const currentTier = getTesterTier(approvedTests, rating);
  const qualityScore = approvedTests > 0 ? Math.round(approvedTests * 12 + rating * 80) : 0;
  const leaderboardRows = leaderboard;

  const navItems = [
    { label: 'Dashboard', icon: Home, href: '/tester/dashboard' },
    { label: 'Available Jobs', icon: BriefcaseBusiness, href: '/tester-jobs' },
    { label: 'My Tests', icon: ClipboardList, href: '/active-test' },
    { label: 'Reports', icon: ClipboardList, href: '/tester/reports' },
    { label: 'Leaderboard', icon: Trophy, href: '/tester/leaderboard', active: true },
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

  if (isLoadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 text-center text-sm font-semibold text-slate-600">
        Loading leaderboard data...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-slate-900 selection:bg-green-100">
      <TesterMobileDrawer isOpen={isMobileDrawerOpen} onClose={() => setIsMobileDrawerOpen(false)} />

      <div className="grid min-h-screen lg:grid-cols-[270px_1fr]">
        {/* Apple Translucent Left Sidebar */}
        <aside className="hidden border-r border-slate-200/60 bg-white/70 backdrop-blur-xl lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto">
          <div className="flex items-center gap-3 border-b border-slate-200/50 px-6 py-5">
            <img src="/squash-logo.png" alt="SQUASH logo" className="h-10 w-10 rounded-2xl border border-white/60 object-cover shadow-sm" />
            <a href="/" className="text-xl font-bold tracking-tight text-slate-900 hover:text-green-700">SQUASH</a>
          </div>
          <nav className="flex-1 space-y-1.5 px-4 py-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 apple-press-effect ${
                    item.active
                      ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                      : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 ${item.active ? 'text-white' : 'text-slate-500'}`} />
                  {item.label}
                </a>
              );
            })}
          </nav>
        </aside>

        {/* Main Leaderboard Content */}
        <main className="min-w-0 pb-24 lg:pb-12">
          {/* Apple Translucent Top Header */}
          <header className="sticky top-0 z-20 border-b border-slate-200/50 bg-white/75 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(true)}
                  className="rounded-2xl border border-slate-200 bg-white/80 p-2 text-slate-700 lg:hidden hover:bg-slate-100 transition apple-press-effect"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="hidden max-w-xl flex-1 items-center gap-2.5 rounded-full border border-slate-200/80 bg-slate-100/60 px-4 py-2 md:flex md:min-w-[320px] lg:min-w-[420px] focus-within:bg-white focus-within:ring-2 focus-within:ring-slate-900/10 transition-all">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input className="w-full bg-transparent text-xs font-medium outline-none placeholder:text-slate-400 text-slate-900" placeholder="Search rankings, testers, specialties..." />
                </div>
              </div>
              <a href="/tester/profile" className="flex items-center gap-2.5 rounded-full border border-slate-200/80 bg-white/80 p-1.5 pr-4 shadow-2xs hover:bg-white transition apple-press-effect">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 font-bold text-white text-xs">{testerName.charAt(0)}</div>
                <div className="hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 leading-tight">{testerName}</div>
                  <div className="text-[10px] font-semibold text-slate-500">Tester</div>
                </div>
              </a>
            </div>
          </header>

          <div className="px-4 py-5 sm:px-6 lg:px-8 lg:py-8 space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between animate-fade-up">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100/80 px-3.5 py-1 text-xs font-extrabold text-green-800">
                  <Trophy className="h-3.5 w-3.5" /> Community Leaderboard
                </span>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">Tester Leaderboard</h1>
                <p className="mt-1 max-w-2xl text-xs text-slate-500 sm:text-sm font-medium">A quality-first ranking system for testers who submit useful, approved reports and help developers ship better products.</p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <a href="/tester-jobs" className="rounded-full bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-slate-900/10 hover:bg-slate-800 transition apple-press-effect">Find Tests</a>
                <a href="/tester/level-benefits" className="rounded-full border border-slate-200/80 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition apple-press-effect">Level Benefits</a>
              </div>
            </div>

            {loadError ? <div className="rounded-2xl border border-red-200 bg-red-50/60 px-4 py-3 text-xs font-bold text-red-700">{loadError}</div> : null}

            <section className="grid gap-6 xl:grid-cols-[1fr_1fr] animate-fade-up-delayed">
              <div className="apple-bento-card p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Your Ranking Profile</h2>
                    <p className="mt-0.5 text-xs font-medium text-slate-500">Calculated from your approved testing activity.</p>
                  </div>
                  <TesterBadge testsCompleted={approvedTests} rating={rating} />
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4"><div className="text-xs font-bold text-slate-500">Approved Tests</div><div className="mt-1.5 text-2xl font-extrabold text-slate-900">{approvedTests}</div></div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4"><div className="text-xs font-bold text-slate-500">Quality Score</div><div className="mt-1.5 text-2xl font-extrabold text-slate-900">{qualityScore}</div></div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4"><div className="text-xs font-bold text-slate-500">Tier</div><div className="mt-1.5 text-lg font-extrabold text-slate-900">{currentTier.label}</div></div>
                </div>
              </div>

              <div className="apple-bento-card p-6 flex flex-col justify-between">
                <div className="flex items-start gap-3.5">
                  <ShieldCheck className="mt-0.5 h-6 w-6 text-green-600 shrink-0" />
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Quality-First Rankings</h2>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600 font-medium">The leaderboard rewards reliable testers. Rankings use approved reports, developer ratings, evidence quality, and admin trust checks.</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="apple-bento-card overflow-hidden">
              <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div><h2 className="text-base font-bold text-slate-900">Top Testers</h2><p className="mt-0.5 text-xs font-medium text-slate-500">Community rankings for this month.</p></div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-extrabold text-slate-600">Monthly Ranking</div>
              </div>

              <div className="divide-y divide-slate-100">
                {leaderboardRows.map((row) => {
                  const Icon = rankIcon(row.rank);
                  return (
                    <div key={row.rank} className="flex flex-col gap-4 px-6 py-4.5 lg:flex-row lg:items-center lg:justify-between hover:bg-slate-50/60 transition-colors">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ring-1 ${rankTone(row.rank)}`}><Icon className="h-4.5 w-4.5" /></div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2"><span className="text-xs font-extrabold text-slate-400">#{row.rank}</span><h3 className="text-xs font-bold text-slate-900">{row.name}</h3><TesterBadge testsCompleted={row.approvedTests} rating={row.rating} /></div>
                          <div className="mt-0.5 flex flex-wrap gap-2 text-[11px] text-slate-500 font-medium"><span>{row.city}</span><span>•</span><span>{row.specialty}</span></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center w-full sm:w-auto sm:min-w-[280px]">
                        <div className="rounded-2xl bg-slate-50 px-2 py-2"><div className="text-[10px] font-bold text-slate-400">Tests</div><div className="text-xs font-extrabold text-slate-900">{row.approvedTests}</div></div>
                        <div className="rounded-2xl bg-slate-50 px-2 py-2"><div className="text-[10px] font-bold text-slate-400">Rating</div><div className="text-xs font-extrabold text-slate-900">{row.rating.toFixed(1)}</div></div>
                        <div className="rounded-2xl bg-green-50 px-2 py-2"><div className="text-[10px] font-bold text-green-700">Score</div><div className="text-xs font-extrabold text-green-800">{row.score}</div></div>
                      </div>
                    </div>
                  );
                })}
                {leaderboardRows.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <Users className="mx-auto h-9 w-9 text-slate-300" />
                    <div className="mt-3 text-base font-bold text-slate-900">Leaderboard data is not live yet</div>
                    <p className="mx-auto mt-1.5 max-w-xl text-xs leading-relaxed text-slate-500 font-medium">Once enough real reports are approved, this page will rank testers using verified activity. For now, your own tier and quality score are shown above.</p>
                    <a href="/tester-jobs" className="mt-4 inline-flex rounded-full bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-slate-900/10 hover:bg-slate-800 transition apple-press-effect">Complete more tests</a>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {rankingRules.map((rule) => (
                <div key={rule} className="apple-bento-card p-4 text-xs font-medium leading-relaxed text-slate-600">
                  <CheckCircle2 className="mb-2.5 h-4.5 w-4.5 text-green-600" />
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

