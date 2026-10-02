import {
  BadgeCheck,
  Bell,
  CheckCircle2,
  CreditCard,
  Eye,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  Smartphone,
  UserCircle2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';




import { useAuth } from './auth';
import { getTesterProfile, updateTesterProfile, getUserSettings, updateUserSettings } from './lib/profileApi';
import { getTesterBankingDetails, type BankingVerificationStatus } from './lib/bankingApi';

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

// Removed readSettings as we fetch from Supabase now.

function ToggleSwitch({ enabled, onChange, label, disabled }: { enabled: boolean; onChange: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      aria-label={label}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition disabled:cursor-not-allowed ${
        enabled ? 'bg-[#e63946]' : 'bg-slate-200'
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
  
  const starter = useMemo(
    () => ({
      ...defaultSettings,
      fullName: session?.name || defaultSettings.fullName,
      email: session?.email || defaultSettings.email,
    }),
    [session?.email, session?.name],
  );

  const [settings, setSettings] = useState<SettingsState>(starter);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [bankingStatus, setBankingStatus] = useState<BankingVerificationStatus | 'none'>('none');

  useEffect(() => {
    const timer = saved ? window.setTimeout(() => setSaved(false), 2500) : undefined;
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [saved]);

  useEffect(() => {
    if (!session?.userId) {
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
          // SnapScan/airtime aren't wired up on the backend yet -- only EFT actually pays out.
          preferredPayout: 'eft',
          toggles: {
            ...prev.toggles,
            profileVisible: profile.isPublic,
          },
        }));
      })
      .catch((error: Error) => {
        if (mounted) setProfileError(error.message || 'Could not load your profile right now.');
      });

    getUserSettings(session.userId)
      .then((userSettings) => {
        if (!mounted || !userSettings) return;
        setSettings((prev) => ({
          ...prev,
          availableDays: userSettings.availableDays,
          preferredTime: userSettings.preferredTime || prev.preferredTime,
          toggles: {
            ...prev.toggles,
            ...userSettings.toggles,
          },
        }));
      })
      .catch((error: Error) => {
        console.error('Failed to load user settings', error);
      });

    getTesterBankingDetails(session.userId)
      .then((details) => {
        if (!mounted) return;
        setBankingStatus(details?.verificationStatus || 'none');
      })
      .catch((error: Error) => {
        console.error('Failed to load banking verification status', error);
      });

    return () => {
      mounted = false;
    };
  }, [session?.email, session?.name, session?.userId]);


  

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const payoutOptions = [
    { id: 'eft', title: 'Bank Transfer (EFT)', detail: 'Best for regular payouts to your bank account.', comingSoon: false },
    { id: 'snapscan', title: 'SnapScan', detail: 'Useful for quick mobile payouts when available.', comingSoon: true },
    { id: 'airtime', title: 'Airtime top-up', detail: 'Turn smaller approved earnings into airtime.', comingSoon: true },
  ] as const;

  const bankingStatusBadge = (() => {
    if (bankingStatus === 'approved') return { label: 'Verified', className: 'bg-rose-50 text-[#e63946]' };
    if (bankingStatus === 'pending') return { label: 'Pending review', className: 'bg-amber-100 text-amber-700' };
    if (bankingStatus === 'changes_required') return { label: 'Changes requested', className: 'bg-amber-100 text-amber-700' };
    if (bankingStatus === 'rejected') return { label: 'Rejected', className: 'bg-red-100 text-red-700' };
    return { label: 'Add banking details', className: 'bg-slate-100 text-slate-600' };
  })();

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
      if (session?.userId) {
        await updateTesterProfile(session.userId, {
          fullName: settings.fullName,
          email: settings.email,
          phone: settings.phone,
          city: settings.city,
          preferredPayout: settings.preferredPayout,
          isPublic: settings.toggles.profileVisible,
        });
        
        await updateUserSettings(session.userId, {
          toggles: settings.toggles,
          availableDays: settings.availableDays,
          preferredTime: settings.preferredTime,
        });

        await refreshSessionProfile();
      }

      setSaved(true);
    } catch (error: any) {
      setProfileError(error?.message || error?.details || JSON.stringify(error) || 'Unable to save your profile right now.');
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

  const privacyRows: Array<{ key: ToggleKey; title: string; detail: string; comingSoon?: boolean }> = [
    { key: 'profileVisible', title: 'Show profile to developers', detail: 'Let developers see your public tester card.' },
    { key: 'showSpecializations', title: 'Show specialization tags', detail: 'Display your device, network and language strengths.' },
    { key: 'directInvites', title: 'Allow direct invites', detail: 'Developers can invite you to matching jobs. Direct invites are not built yet, so this has no effect.', comingSoon: true },
  ];

  return (
    <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between animate-fade-up">
              <div>
                <span className="inline-flex rounded-full bg-rose-50 px-3.5 py-1 text-xs font-extrabold text-[#e63946] ring-1 ring-rose-100">
                  Tester </span>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">Account </h1>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm font-medium">
                  Manage your profile details, payout preferences, notifications and account security from one place.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                {saved ? (
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-100 bg-rose-50 px-4 py-2 text-xs font-bold text-[#e63946]">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Saved
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={saveSettings}
                  disabled={saving}
                  className="squash-btn-primary"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

            {profileError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50/60 px-4 py-3 text-xs font-bold text-red-700">
                {profileError}
              </div>
            ) : null}

            <section className="grid gap-6 xl:grid-cols-[1fr_1fr] animate-fade-up-delayed">
              <div className="apple-bento-card p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Profile Details</h2>
                    <p className="mt-0.5 text-xs font-medium text-slate-500">These details help SQUASH contact you and match local tests.</p>
                  </div>
                  <UserCircle2 className="h-6 w-6 text-[#1d1d1f]" />
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
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#e63946]"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Phone className="h-4 w-4 text-slate-400" /> Phone
                    </span>
                    <input
                      value={settings.phone}
                      onChange={(event) => updateField('phone', event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#e63946]"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <MapPin className="h-4 w-4 text-slate-400" /> City
                    </span>
                    <input
                      value={settings.city}
                      onChange={(event) => updateField('city', event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#e63946]"
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
                  <LockKeyhole className="h-8 w-8 text-[#1d1d1f]" />
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

                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-rose-100 bg-rose-50 p-4">
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
                    <BadgeCheck className="mt-0.5 h-5 w-5 text-[#e63946]" />
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
                  <CreditCard className="h-8 w-8 text-[#1d1d1f]" />
                </div>

                <div className="mt-6 space-y-3">
                  {payoutOptions.map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-start gap-3 rounded-2xl border p-4 transition ${
                        option.comingSoon
                          ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60'
                          : 'cursor-pointer ' + (settings.preferredPayout === option.id
                            ? 'border-rose-100 bg-rose-50'
                            : 'border-slate-200 bg-white hover:bg-slate-50')
                      }`}
                    >
                      <input
                        type="radio"
                        name="preferredPayout"
                        checked={settings.preferredPayout === option.id}
                        disabled={option.comingSoon}
                        onChange={() => setSettings((prev) => ({ ...prev, preferredPayout: option.id }))}
                        className="mt-1 h-4 w-4 text-[#e63946] focus:ring-[#e63946] disabled:cursor-not-allowed"
                      />
                      <span className="flex-1">
                        <span className="flex items-center gap-2">
                          <span className="block font-bold text-slate-900">{option.title}</span>
                          {option.comingSoon ? (
                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                              Coming soon
                            </span>
                          ) : (
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${bankingStatusBadge.className}`}>
                              {bankingStatusBadge.label}
                            </span>
                          )}
                        </span>
                        <span className="mt-1 block text-sm leading-6 text-slate-600">{option.detail}</span>
                        {!option.comingSoon && bankingStatus !== 'approved' ? (
                          <a href="/tester/payout-method" className="mt-1 inline-block text-sm font-semibold text-[#e63946] hover:text-[#d62828]">
                            {bankingStatus === 'none' ? 'Add your bank details ->' : 'Review your bank details ->'}
                          </a>
                        ) : null}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm leading-6 text-slate-700">
                  <div className="font-bold text-slate-900">Scheduled Friday EFT payouts</div>
                  <p className="mt-1">Approved earnings are scheduled for Friday EFT after banking verification and payout review.</p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Notifications</h2>
                    <p className="mt-1 text-sm text-slate-600">Choose what should reach you by email or in-app alerts.</p>
                  </div>
                  <Bell className="h-8 w-8 text-[#1d1d1f]" />
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
                  <Smartphone className="h-8 w-8 text-[#1d1d1f]" />
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {days.map((day) => (
                    <label
                      key={day}
                      className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                        settings.availableDays.includes(day)
                          ? 'border-rose-100 bg-rose-50 text-[#e63946]'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={settings.availableDays.includes(day)}
                        onChange={() => toggleDay(day)}
                        className="h-4 w-4 rounded border-slate-300 text-[#e63946] focus:ring-[#e63946]"
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
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#e63946]"
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
                  <Eye className="h-8 w-8 text-[#1d1d1f]" />
                </div>

                <div className="mt-6 divide-y divide-slate-100">
                  {privacyRows.map((row) => (
                    <div key={row.key} className={`flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0 ${row.comingSoon ? 'opacity-60' : ''}`}>
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-slate-900">{row.title}</div>
                          {row.comingSoon ? (
                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                              Coming soon
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1 text-sm leading-6 text-slate-600">{row.detail}</div>
                      </div>
                      <ToggleSwitch
                        enabled={!row.comingSoon && settings.toggles[row.key]}
                        onChange={() => toggleSetting(row.key)}
                        label={`Toggle ${row.title}`}
                        disabled={row.comingSoon}
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
                    href="/logout"
                    className="squash-btn-primary"
                  >
                    Sign Out
                  </a>
                </div>
              </div>
            </section>
    </div>
  );
}
