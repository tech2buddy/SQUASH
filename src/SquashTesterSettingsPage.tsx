import {
  BadgeCheck,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  Eye,
  Home,
  LockKeyhole,
  Mail,
  MapPin,
  Menu,
  Phone,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  UserCircle2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import TesterHeaderNav from './components/TesterHeaderNav';
import MobileTabBar from './components/MobileTabBar';
import TesterMobileDrawer from './components/TesterMobileDrawer';
import { useAuth } from './auth';
import { getTesterProfile, updateTesterProfile } from './lib/profileApi';

type ToggleKey =
  | 'newInvites'
  | 'approvalUpdates'
  | 'payoutAlerts'
  | 'changesRequested'
  | 'weeklySummary'
  | 'profileVisible'
  | 'showSpecializations'
  | 'directInvites'
  | 'twoFactor';

type SettingsState = {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  preferredPayout: 'eft' | 'snapscan' | 'airtime';
  preferredTime: string;
  availableDays: string[];
  toggles: Record<ToggleKey, boolean>;
};

const defaultSettings: SettingsState = {
  fullName: '',
  email: '',
  phone: '',
  city: '',
  preferredPayout: 'eft',
  preferredTime: 'Weekdays after 16:00',
  availableDays: ['Monday', 'Wednesday', 'Saturday'],
  toggles: {
    newInvites: true,
    approvalUpdates: true,
    payoutAlerts: true,
    changesRequested: true,
    weeklySummary: false,
    profileVisible: true,
    showSpecializations: true,
    directInvites: true,
    twoFactor: false,
  },
};

function readSettings(fallback: SettingsState): SettingsState {
  try {
    const raw = window.localStorage.getItem('squash_tester_settings');
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<SettingsState>;
    return {
      ...fallback,
      ...parsed,
      toggles: { ...fallback.toggles, ...(parsed.toggles || {}) },
      availableDays: Array.isArray(parsed.availableDays) ? parsed.availableDays : fallback.availableDays,
    };
  } catch {
    return fallback;
  }
}

function ToggleSwitch({ enabled, onChange, label }: { enabled: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-label={label}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition ${
        enabled ? 'bg-green-600' : 'bg-slate-200'
      }`}
    >
      <span
        className={`h-5 w-5 rounded-full bg-white shadow-sm transition ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  );
}

export default function SquashTesterSettingsPage() {
  const { session, refreshSessionProfile } = useAuth();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const starter = useMemo(
    () => ({
      ...defaultSettings,
      fullName: session?.name || defaultSettings.fullName,
      email: session?.email || defaultSettings.email,
    }),
    [session?.email, session?.name],
  );

  const [settings, setSettings] = useState<SettingsState>(() => readSettings(starter));
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    const timer = saved ? window.setTimeout(() => setSaved(false), 2500) : undefined;
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [saved]);

  useEffect(() => {
    if (!session?.userId || false) {
      setSettings((prev) => ({
        ...prev,
        fullName: session?.name || prev.fullName,
        email: session?.email || prev.email,
      }));
      return;
    }

    let mounted = true;
    setProfileError('');

    getTesterProfile(session.userId)
      .then((profile) => {
        if (!mounted || !profile) return;
        setSettings((prev) => ({
          ...prev,
          fullName: profile.fullName,
          email: profile.email,
          phone: profile.phone,
          city: profile.city || prev.city,
          preferredPayout: profile.preferredPayout,
          toggles: {
            ...prev.toggles,
            profileVisible: profile.isPublic,
          },
        }));
      })
      .catch((error: Error) => {
        if (mounted) setProfileError(error.message || 'Could not load your profile right now.');
      });

    return () => {
      mounted = false;
    };
  }, [session?.email, session?.name, ("supabase"), session?.userId]);


  const navItems = [
    { label: 'Dashboard', icon: Home, href: '/tester/dashboard' },
    { label: 'Available Jobs', icon: BriefcaseBusiness, href: '/tester-jobs' },
    { label: 'My Tests', icon: ClipboardList, href: '/active-test' },
    { label: 'Reports', icon: ClipboardList, href: '/tester/reports' },
    { label: 'Earnings', icon: CircleDollarSign, href: '/tester/earnings' },
    { label: 'Profile', icon: UserCircle2, href: '/tester/profile' },
    { label: 'Settings', icon: Settings, href: '/tester/settings', active: true },
  ];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const payoutOptions = [
    { id: 'eft', title: 'Bank Transfer (EFT)', detail: 'Best for regular payouts to your bank account.' },
    { id: 'snapscan', title: 'SnapScan', detail: 'Useful for quick mobile payouts when available.' },
    { id: 'airtime', title: 'Airtime top-up', detail: 'Turn smaller approved earnings into airtime.' },
  ] as const;

  const updateField = (key: keyof Omit<SettingsState, 'toggles' | 'availableDays'>, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSetting = (key: ToggleKey) => {
    setSettings((prev) => ({
      ...prev,
      toggles: { ...prev.toggles, [key]: !prev.toggles[key] },
    }));
  };

  const toggleDay = (day: string) => {
    setSettings((prev) => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter((item) => item !== day)
        : [...prev.availableDays, day],
    }));
  };

  const saveSettings = async () => {
    setSaving(true);
    setProfileError('');

    try {
      window.localStorage.setItem('squash_tester_settings', JSON.stringify(settings));

      if (session?.userId && true) {
        await updateTesterProfile(session.userId, {
          fullName: settings.fullName,
          email: settings.email,
          phone: settings.phone,
          city: settings.city,
          preferredPayout: settings.preferredPayout,
          isPublic: settings.toggles.profileVisible,
        });
        await refreshSessionProfile();
      }

      setSaved(true);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Unable to save your profile right now.');
    } finally {
      setSaving(false);
    }
  };

  const notificationRows: Array<{ key: ToggleKey; title: string; detail: string }> = [
    { key: 'newInvites', title: 'New test invites', detail: 'Tell me when a test matches my profile.' },
    { key: 'approvalUpdates', title: 'Approval updates', detail: 'Notify me when developers approve or review reports.' },
    { key: 'payoutAlerts', title: 'Payout alerts', detail: 'Send updates when money is released or paid out.' },
    { key: 'changesRequested', title: 'Changes requested', detail: 'Alert me when a report needs extra details.' },
    { key: 'weeklySummary', title: 'Weekly summary', detail: 'A simple weekly digest of jobs, earnings and profile tips.' },
  ];

  const privacyRows: Array<{ key: ToggleKey; title: string; detail: string }> = [
    { key: 'profileVisible', title: 'Show profile to developers', detail: 'Let developers see your public tester card.' },
    { key: 'showSpecializations', title: 'Show specialization tags', detail: 'Display your device, network and language strengths.' },
    { key: 'directInvites', title: 'Allow direct invites', detail: 'Developers can invite you to matching jobs.' },
  ];

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
                <Link
                  to={item.href}
                  key={item.label}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    item.active ? 'bg-green-50 text-green-700' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 pt-0">
            <div className="rounded-3xl border border-green-100 bg-green-50 p-5 shadow-sm">
              <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <ShieldCheck className="h-5 w-5 text-green-700" />
                Account protected
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Keep your payout, notification and security settings updated so testing stays smooth.
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
                    placeholder="Search jobs, reports, earnings..."
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
                  Tester settings
                </div>
                <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">Account Settings</h1>
                <p className="mt-2 max-w-2xl text-slate-600">
                  Manage your profile details, payout preferences, notifications and account security from one place.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {saved ? (
                  <div className="inline-flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
                    <CheckCircle2 className="h-4 w-4" /> Saved
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={saveSettings}
                  disabled={saving}
                  className="rounded-2xl bg-green-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

            {profileError ? (
              <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {profileError}
              </div>
            ) : null}

            <section className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Profile details</h2>
                    <p className="mt-1 text-sm text-slate-600">These details help SQUASH contact you and match local tests.</p>
                  </div>
                  <UserCircle2 className="h-8 w-8 text-green-700" />
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <UserCircle2 className="h-4 w-4 text-slate-400" /> Full name
                    </span>
                    <input
                      value={settings.fullName}
                      onChange={(event) => updateField('fullName', event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-green-500"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Mail className="h-4 w-4 text-slate-400" /> Email
                    </span>
                    <input
                      value={settings.email}
                      onChange={(event) => updateField('email', event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-green-500"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Phone className="h-4 w-4 text-slate-400" /> Phone
                    </span>
                    <input
                      value={settings.phone}
                      onChange={(event) => updateField('phone', event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-green-500"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <MapPin className="h-4 w-4 text-slate-400" /> City
                    </span>
                    <input
                      value={settings.city}
                      onChange={(event) => updateField('city', event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-green-500"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Security</h2>
                    <p className="mt-1 text-sm text-slate-600">Keep your account protected before payouts are released.</p>
                  </div>
                  <LockKeyhole className="h-8 w-8 text-green-700" />
                </div>

                <div className="mt-6 space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-900">Password</div>
                        <div className="mt-1 text-sm text-slate-500">Last updated 18 days ago</div>
                      </div>
                      <button className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                        Update
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-green-100 bg-green-50 p-4">
                    <div>
                      <div className="font-bold text-slate-900">Two-factor authentication</div>
                      <div className="mt-1 text-sm text-slate-600">Add an extra layer before account changes.</div>
                    </div>
                    <ToggleSwitch
                      enabled={settings.toggles.twoFactor}
                      onChange={() => toggleSetting('twoFactor')}
                      label="Toggle two-factor authentication"
                    />
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-4">
                    <BadgeCheck className="mt-0.5 h-5 w-5 text-green-700" />
                    <div>
                      <div className="font-bold text-slate-900">Trusted device</div>
                      <div className="mt-1 text-sm leading-6 text-slate-600">This browser is trusted for your SQUASH account.</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Payout preferences</h2>
                    <p className="mt-1 text-sm text-slate-600">Choose how you want approved earnings paid out.</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-green-700" />
                </div>

                <div className="mt-6 space-y-3">
                  {payoutOptions.map((option) => (
                    <label
                      key={option.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                        settings.preferredPayout === option.id
                          ? 'border-green-200 bg-green-50'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="preferredPayout"
                        checked={settings.preferredPayout === option.id}
                        onChange={() => setSettings((prev) => ({ ...prev, preferredPayout: option.id }))}
                        className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500"
                      />
                      <span>
                        <span className="block font-bold text-slate-900">{option.title}</span>
                        <span className="mt-1 block text-sm leading-6 text-slate-600">{option.detail}</span>
                      </span>
                    </label>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm leading-6 text-slate-700">
                  <div className="font-bold text-slate-900">Paid to bank within 24hrs of approval</div>
                  <p className="mt-1">SQUASH sends approved tester earnings quickly once the developer signs off.</p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Notifications</h2>
                    <p className="mt-1 text-sm text-slate-600">Choose what should reach you by email or in-app alerts.</p>
                  </div>
                  <Bell className="h-8 w-8 text-green-700" />
                </div>

                <div className="mt-6 divide-y divide-slate-100">
                  {notificationRows.map((row) => (
                    <div key={row.key} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                      <div>
                        <div className="font-bold text-slate-900">{row.title}</div>
                        <div className="mt-1 text-sm leading-6 text-slate-600">{row.detail}</div>
                      </div>
                      <ToggleSwitch
                        enabled={settings.toggles[row.key]}
                        onChange={() => toggleSetting(row.key)}
                        label={`Toggle ${row.title}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Availability</h2>
                    <p className="mt-1 text-sm text-slate-600">Help us recommend work that fits your week.</p>
                  </div>
                  <Smartphone className="h-8 w-8 text-green-700" />
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {days.map((day) => (
                    <label
                      key={day}
                      className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                        settings.availableDays.includes(day)
                          ? 'border-green-200 bg-green-50 text-green-700'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={settings.availableDays.includes(day)}
                        onChange={() => toggleDay(day)}
                        className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                      />
                      {day}
                    </label>
                  ))}
                </div>

                <label className="mt-5 block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Preferred testing time</span>
                  <select
                    value={settings.preferredTime}
                    onChange={(event) => updateField('preferredTime', event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-green-500"
                  >
                    <option>Weekdays after 16:00</option>
                    <option>Weekday mornings</option>
                    <option>Weekday afternoons</option>
                    <option>Weekend mornings</option>
                    <option>Weekend evenings</option>
                  </select>
                </label>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Privacy and visibility</h2>
                    <p className="mt-1 text-sm text-slate-600">Control how developers discover your tester profile.</p>
                  </div>
                  <Eye className="h-8 w-8 text-green-700" />
                </div>

                <div className="mt-6 divide-y divide-slate-100">
                  {privacyRows.map((row) => (
                    <div key={row.key} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                      <div>
                        <div className="font-bold text-slate-900">{row.title}</div>
                        <div className="mt-1 text-sm leading-6 text-slate-600">{row.detail}</div>
                      </div>
                      <ToggleSwitch
                        enabled={settings.toggles[row.key]}
                        onChange={() => toggleSetting(row.key)}
                        label={`Toggle ${row.title}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Session</h2>
                  <p className="mt-2 text-slate-600">
                    Sign out when using a shared computer or when your testing session is done.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <a
                    href="/tester/profile"
                    className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-center font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    View Public Profile
                  </a>
                  <a
                    href="/logout"
                    className="rounded-2xl bg-slate-900 px-5 py-3 text-center font-semibold text-white shadow-sm hover:bg-slate-800"
                  >
                    Sign Out
                  </a>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
      <MobileTabBar role="tester" />
      <TesterMobileDrawer isOpen={isMobileDrawerOpen} onClose={() => setIsMobileDrawerOpen(false)} activePath="/tester/settings" />
    </div>
  );
}
