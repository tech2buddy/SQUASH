import {
  BadgeCheck,
  BriefcaseBusiness,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  Home,
  Languages,
  Mail,
  MapPin,
  Menu,
  Phone,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  Star,
  UserCircle2,
  Wifi,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import MobileTabBar from './components/MobileTabBar';
import TesterMobileDrawer from './components/TesterMobileDrawer';
import SpecializationChecklist from './components/SpecializationChecklist';
import TesterHeaderNav from './components/TesterHeaderNav';
import TesterBadge from './components/TesterBadge';
import { getSpecializationLabel, hasSaLanguageTag } from './components/testerSpecializations';
import { useAuth } from './auth';
import { getTesterProfile, getTesterSpecializations, replaceTesterSpecializations, type TesterPublicProfile } from './lib/profileApi';

export default function SquashTesterProfilePage() {
  const { session } = useAuth();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [profileDetails, setProfileDetails] = useState<TesterPublicProfile | null>(null);
  const [profileError, setProfileError] = useState('');
  const [specializations, setSpecializations] = useState<string[]>(() => {
    const raw = window.localStorage.getItem('squash_tester_specializations');
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as string[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    window.localStorage.setItem('squash_tester_specializations', JSON.stringify(specializations));
  }, [specializations]);

  useEffect(() => {
    if (!session?.userId || false) return;

    let mounted = true;
    setProfileError('');

    Promise.all([getTesterProfile(session.userId), getTesterSpecializations(session.userId)])
      .then(([profile, savedSpecializations]) => {
        if (!mounted) return;
        if (profile) setProfileDetails(profile);
        if (savedSpecializations.length > 0) setSpecializations(savedSpecializations);
      })
      .catch((error: Error) => {
        if (mounted) setProfileError(error.message || 'Could not load profile data right now.');
      });

    return () => {
      mounted = false;
    };
  }, [("supabase"), session?.userId]);

  const toggleSpecialization = (id: string, checked: boolean) => {
    setSpecializations((prev) => {
      const next = checked ? Array.from(new Set([...prev, id])) : prev.filter((item) => item !== id);
      if (session?.userId && true) {
        replaceTesterSpecializations(session.userId, next).catch((error: Error) => {
          setProfileError(error.message || 'Could not save specialization changes right now.');
        });
      }
      return next;
    });
  };

  const topTags = useMemo(
    () => specializations.slice(0, 5).map((id) => getSpecializationLabel(id)),
    [specializations],
  );

  const navItems = [
    { label: 'Dashboard', icon: Home, href: '/tester/dashboard' },
    { label: 'Available Jobs', icon: BriefcaseBusiness, href: '/tester-jobs' },
    { label: 'My Tests', icon: ClipboardList, href: '/active-test' },
    { label: 'Reports', icon: ClipboardList, href: '/tester/reports' },
    { label: 'Earnings', icon: CircleDollarSign, href: '/tester/earnings' },
    { label: 'Profile', icon: UserCircle2, href: '/tester/profile', active: true },
    { label: 'Settings', icon: Settings, href: '/tester/settings' },
  ];

  const isRealAccount = true;
  const testerName = profileDetails?.fullName || session?.name || 'Tester';
  const testerEmail = profileDetails?.email || session?.email || 'Add email';
  const testerCity = profileDetails?.city || (isRealAccount ? 'Add city' : 'Johannesburg');
  const testerPhone = profileDetails?.phone || (isRealAccount ? 'Add phone number' : '+27 72 000 1234');
  const testsCompleted = profileDetails?.testsCompleted || (isRealAccount ? 0 : 24);
  const rating = profileDetails?.rating || (isRealAccount ? 0 : 4.7);
  const approvalRate = profileDetails?.approvalRate || (isRealAccount ? 0 : 98);

  const recentWork = isRealAccount
    ? []
    : [
        { app: 'FitTrack Mobile', type: 'Mobile App Testing', status: 'Approved', earned: 'R250' },
        { app: 'HealthHub Web', type: 'Website Testing', status: 'Pending', earned: 'R370' },
        { app: 'ShopEase iOS', type: 'E-commerce Testing', status: 'Approved', earned: 'R350' },
      ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
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
                  href={item.href}
                  key={item.label}
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

          <div className="p-4 pt-0">
            <div className="apple-bento-card p-5">
              <div className="text-base font-bold text-slate-900">Profile Strength</div>
              <div className="mt-3 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full w-[82%] rounded-full bg-green-500 transition-all duration-500" />
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-600 font-medium">
                Add more device and language details to unlock better matched tests.
              </p>
            </div>
          </div>
        </aside>

        {/* Main Profile Content */}
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
                  <input
                    className="w-full bg-transparent text-xs font-medium outline-none placeholder:text-slate-400 text-slate-900"
                    placeholder="Search jobs, reports, earnings..."
                  />
                </div>
              </div>

              <TesterHeaderNav />
            </div>
          </header>

          <div className="px-4 py-5 sm:px-6 lg:px-8 lg:py-8 space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between animate-fade-up">
              <div>
                <span className="inline-flex rounded-full bg-green-100/80 px-3.5 py-1 text-xs font-extrabold text-green-800">
                  Tester Profile
                </span>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">Your SQUASH Profile</h1>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm font-medium">
                  Keep this sharp so developers can match you with the right tests.
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <a
                  href="/tester-jobs"
                  className="rounded-full bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-slate-900/10 hover:bg-slate-800 transition apple-press-effect"
                >
                  Find Tests
                </a>
                <a
                  href="/tester/settings"
                  className="rounded-full border border-slate-200/80 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition apple-press-effect"
                >
                  Account Settings
                </a>
              </div>
            </div>

            {profileError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50/60 px-4 py-3 text-xs font-bold text-red-700">
                {profileError}
              </div>
            ) : null}

            <section className="grid gap-6 xl:grid-cols-[1fr_1fr] animate-fade-up-delayed">
              <div className="apple-bento-card p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-3xl font-extrabold text-white shadow-sm">
                    {testerName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-bold text-slate-900">{testerName}</h2>
                      <TesterBadge testsCompleted={testsCompleted} rating={rating} />
                    </div>
                    <div className="mt-3 grid gap-2 text-xs font-medium text-slate-500 sm:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-slate-400" />
                        {testerEmail}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        {testerCity}, South Africa
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-slate-400" />
                        {testerPhone}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-slate-400" />
                        Weekdays after 16:00
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {topTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    { label: 'Rating', value: rating.toFixed(1), icon: Star },
                    { label: 'Completed', value: String(testsCompleted), icon: ClipboardList },
                    { label: 'Approval', value: `${approvalRate}%`, icon: BadgeCheck },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                        <Icon className="h-4.5 w-4.5 text-green-600" />
                        <div className="mt-2 text-2xl font-extrabold text-slate-900">{item.value}</div>
                        <div className="text-xs font-semibold text-slate-500 mt-0.5">{item.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Public tester card</h2>
                    <p className="mt-1 text-sm text-slate-600">This is what developers see when matching testers.</p>
                  </div>
                  <ShieldCheck className="h-8 w-8 text-green-700" />
                </div>

                <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-xl font-black text-slate-900 shadow-sm">
                        {testerName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{testerName}</div>
                        <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          {rating.toFixed(1)} rating - {testsCompleted} tests
                        </div>
                      </div>
                    </div>
                    <TesterBadge testsCompleted={testsCompleted} rating={rating} />
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {topTags.slice(0, 3).map((tag) => (
                      <span key={tag} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                        {tag}
                      </span>
                    ))}
                    {specializations.includes('township-network') ? (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                        Township Network Tester
                      </span>
                    ) : null}
                    {hasSaLanguageTag(specializations) ? (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                        SA Language Tester
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <Wifi className="h-5 w-5 text-green-700" />
                      Network ready
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Can test low-data and township network conditions.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <Languages className="h-5 w-5 text-slate-700" />
                      Language coverage
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Supports SA language and localization feedback.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Specializations</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      These help SQUASH match you with tests that fit your devices, network and skills.
                    </p>
                  </div>
                  <Smartphone className="h-7 w-7 text-green-700" />
                </div>

                <div className="mt-6">
                  <SpecializationChecklist selected={specializations} onToggle={toggleSpecialization} compact />
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-2xl font-bold text-slate-900">Payout readiness</h2>
                  <div className="mt-5 space-y-4">
                    {[
                      'Bank Transfer (EFT) connected',
                      'SnapScan available',
                      'Airtime top-up available',
                      'Identity verification complete',
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                        <BadgeCheck className="h-5 w-5 text-green-700" />
                        <span className="text-sm font-semibold text-slate-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-2xl font-bold text-slate-900">Recent work</h2>
                  <div className="mt-5 space-y-4">
                    {recentWork.map((item) => (
                      <div key={item.app} className="rounded-2xl border border-slate-100 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-bold text-slate-900">{item.app}</div>
                            <div className="mt-1 text-sm text-slate-500">{item.type}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-700">{item.earned}</div>
                            <div
                              className={`mt-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                item.status === 'Approved'
                                  ? 'bg-green-50 text-green-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {item.status}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
      <MobileTabBar role="tester" />
      <TesterMobileDrawer isOpen={isMobileDrawerOpen} onClose={() => setIsMobileDrawerOpen(false)} activePath="/tester/profile" />
    </div>
  );
}


