import {
  Bell,
  Building2,
  CheckCircle2,
  Globe2,
  LockKeyhole,
  Mail,
  Save,
  ShieldCheck,
  Sparkles,
  UserCircle2,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from './auth';
import { getDeveloperProfile, updateDeveloperProfile, getUserSettings, updateUserSettings } from './lib/profileApi';

type ToggleKey = 'newApplications' | 'reportSubmitted' | 'jobCompleted' | 'twoFactor';

type SettingsState = {
  developerType: 'company' | 'individual';
  fullName: string;
  nickname: string;
  companyName: string;
  websiteUrl: string;
  billingEmail: string;
  toggles: Record<ToggleKey, boolean>;
};

const defaultSettings: SettingsState = {
  developerType: 'company',
  fullName: '',
  nickname: '',
  companyName: '',
  websiteUrl: '',
  billingEmail: '',
  toggles: {
    newApplications: true,
    reportSubmitted: true,
    jobCompleted: true,
    twoFactor: false,
  },
};

function ToggleSwitch({ enabled, onChange, label }: { enabled: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={onChange}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition focus:outline-none focus:ring-4 focus:ring-[#2d6b50]/15 ${
        enabled ? 'bg-[#173f2f]' : 'bg-[#dce3de]'
      }`}
    >
      <span className={`h-5 w-5 rounded-full bg-white shadow-sm transition ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

const inputClasses = 'h-12 w-full rounded-2xl border border-[#dfe6e1] bg-white/90 px-4 text-sm font-medium text-[#1d241f] outline-none transition placeholder:text-[#a0a7a3] focus:border-[#4c8068] focus:ring-4 focus:ring-[#4c8068]/10';

export default function SquashDeveloperSettingsPage() {
  const { session, refreshSessionProfile } = useAuth();

  const starter = useMemo(
    () => ({
      ...defaultSettings,
      fullName: session?.name || defaultSettings.fullName,
      companyName: session?.name || defaultSettings.companyName,
      billingEmail: session?.email || defaultSettings.billingEmail,
    }),
    [session?.email, session?.name],
  );

  const [settings, setSettings] = useState<SettingsState>(starter);
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
    if (!session?.userId) return;

    let mounted = true;
    Promise.allSettled([getDeveloperProfile(session.userId), getUserSettings(session.userId)])
      .then(([profileResult, userSettingsResult]) => {
        if (!mounted) return;
        const profile = profileResult.status === 'fulfilled' ? profileResult.value : null;
        const userSettings = userSettingsResult.status === 'fulfilled' ? userSettingsResult.value : null;
        setSettings((previous) => ({
          ...previous,
          ...(profile
            ? {
                developerType: profile.developerType,
                fullName: profile.fullName,
                nickname: profile.nickname,
                companyName: profile.companyName,
                websiteUrl: profile.websiteUrl,
                billingEmail: profile.billingEmail,
              }
            : {}),
          toggles: userSettings ? { ...previous.toggles, ...userSettings.toggles } : previous.toggles,
        }));
        if (profileResult.status === 'rejected') {
          const reason = profileResult.reason;
          setProfileError(reason instanceof Error ? reason.message : 'Could not load your settings right now.');
        }
        if (userSettingsResult.status === 'rejected') {
          console.error('Failed to load user settings', userSettingsResult.reason);
        }
      });

    return () => {
      mounted = false;
    };
  }, [session?.userId]);

  const updateField = <Key extends keyof Omit<SettingsState, 'toggles'>>(key: Key, value: SettingsState[Key]) => {
    setSettings((previous) => ({ ...previous, [key]: value }));
  };

  const toggleSetting = (key: ToggleKey) => {
    setSettings((previous) => ({
      ...previous,
      toggles: { ...previous.toggles, [key]: !previous.toggles[key] },
    }));
  };

  const saveSettings = async () => {
    setSaving(true);
    setProfileError('');

    try {
      if (session?.userId) {
        await Promise.all([
          updateDeveloperProfile(session.userId, {
            developerType: settings.developerType,
            fullName: settings.fullName,
            nickname: settings.nickname,
            companyName: settings.companyName,
            websiteUrl: settings.websiteUrl,
            billingEmail: settings.billingEmail,
          }),
          updateUserSettings(session.userId, {
            toggles: settings.toggles,
            availableDays: [],
            preferredTime: '',
          }),
        ]);

        await refreshSessionProfile();
      }

      setSaved(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save your profile right now.';
      setProfileError(message);
    } finally {
      setSaving(false);
    }
  };

  const notificationRows: Array<{ key: ToggleKey; title: string; detail: string }> = [
    { key: 'newApplications', title: 'New tester applications', detail: 'Know when a tester applies to one of your jobs.' },
    { key: 'reportSubmitted', title: 'Report submissions', detail: 'Get notified when new QA evidence is ready.' },
    { key: 'jobCompleted', title: 'Completed test runs', detail: 'Receive a final alert when every tester has finished.' },
  ];

  const enabledNotificationCount = notificationRows.filter((row) => settings.toggles[row.key]).length;
  const profileComplete = Boolean(
    settings.billingEmail &&
      settings.websiteUrl &&
      (settings.developerType === 'company' ? settings.companyName : settings.fullName),
  );

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 pb-10">
      <section className="developer-ambient-hero relative overflow-hidden rounded-[28px] border border-white/80 bg-[linear-gradient(112deg,#e9e4f1_0%,#fffaf6_44%,#e6f0e9_72%,#bfd9c7_100%)] px-6 py-7 shadow-[0_24px_70px_rgba(44,42,52,0.11)] sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-[#356b50]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/4 h-64 w-64 rounded-full bg-[#755d85]/14 blur-3xl" />
        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="developer-ambient-glass developer-ambient-eyebrow mb-4 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-[#584b60] shadow-sm backdrop-blur-xl">
              <span className="developer-ambient-eyebrow-icon flex h-6 w-6 items-center justify-center rounded-full bg-[#5a4964] text-white"><Sparkles className="h-3.5 w-3.5" /></span>
              Workspace preferences
            </div>
            <h1 className="max-w-2xl text-3xl font-black tracking-[-0.045em] text-[#1d211e] sm:text-4xl">
              Make SQUASH work
              <span className="block text-[#2c654d]">the way your team does.</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5d6660]">Keep your developer identity accurate, choose the alerts that matter and strengthen access to your workspace.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {saved ? (
              <div className="developer-ambient-glass developer-ambient-confirmation inline-flex min-h-12 items-center gap-2 rounded-2xl border border-[#b9dfca] bg-white/70 px-4 text-xs font-bold text-[#276348] shadow-sm backdrop-blur-xl"><CheckCircle2 className="h-4 w-4" />Changes saved</div>
            ) : null}
            <button
              type="button"
              onClick={saveSettings}
              disabled={saving}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#173f2f] px-5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(23,63,47,0.2)] transition hover:-translate-y-0.5 hover:bg-[#0f3224] disabled:cursor-wait disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving changes…' : 'Save changes'}
            </button>
          </div>
        </div>
      </section>

      {profileError ? (
        <div className="flex items-center gap-3 rounded-2xl border border-[#f0c5c2] bg-[#fff0ef] px-4 py-3 text-xs font-semibold text-[#9d3935]"><XCircle className="h-4 w-4 shrink-0" />{profileError}</div>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-5">
          <article className="overflow-hidden rounded-[26px] border border-white/90 bg-white/72 shadow-[0_22px_60px_rgba(41,53,46,0.09)] backdrop-blur-xl">
            <div className="flex items-center gap-3 border-b border-[#dde5df] px-5 py-5 sm:px-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#173f2f] text-white"><UserCircle2 className="h-5 w-5" /></span>
              <div><h2 className="text-lg font-black tracking-[-0.025em] text-[#1d241f]">Developer identity</h2><p className="text-xs text-[#7a837e]">The profile details testers and SQUASH operations use.</p></div>
            </div>

            <div className="space-y-6 p-5 sm:p-6">
              <fieldset>
                <legend className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#737d77]">Account structure</legend>
                <div className="grid gap-2 rounded-2xl border border-[#dfe6e1] bg-[#f4f7f5] p-1 sm:grid-cols-2">
                  {[
                    { id: 'company', label: 'Company workspace', detail: 'Representing a business', icon: Building2 },
                    { id: 'individual', label: 'Individual developer', detail: 'Working independently', icon: UserCircle2 },
                  ].map((option) => {
                    const OptionIcon = option.icon;
                    const selected = settings.developerType === option.id;
                    return (
                      <button key={option.id} type="button" onClick={() => updateField('developerType', option.id as SettingsState['developerType'])} aria-pressed={selected} className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-left transition ${selected ? 'bg-white text-[#173f2f] shadow-sm ring-1 ring-[#cedbd3]' : 'text-[#6c7670] hover:bg-white/60'}`}>
                        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${selected ? 'bg-[#e5f1e9]' : 'bg-white'}`}><OptionIcon className="h-4 w-4" /></span>
                        <span><strong className="block text-xs">{option.label}</strong><span className="mt-0.5 block text-[10px] opacity-70">{option.detail}</span></span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {settings.developerType === 'company' ? (
                <label className="block"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#737d77]">Company name</span><div className="relative"><Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#89938d]" /><input type="text" value={settings.companyName} onChange={(event) => updateField('companyName', event.target.value)} className={`${inputClasses} pl-11`} placeholder="Your company name" /></div></label>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#737d77]">Full name</span><input type="text" value={settings.fullName} onChange={(event) => updateField('fullName', event.target.value)} className={inputClasses} placeholder="Jane Doe" /></label>
                  <label className="block"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#737d77]">Preferred name</span><input type="text" value={settings.nickname} onChange={(event) => updateField('nickname', event.target.value)} className={inputClasses} placeholder="Jane" /></label>
                </div>
              )}

              <label className="block"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#737d77]">Website</span><div className="relative"><Globe2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#89938d]" /><input type="url" value={settings.websiteUrl} onChange={(event) => updateField('websiteUrl', event.target.value)} className={`${inputClasses} pl-11`} placeholder="https://example.com" /></div></label>
            </div>
          </article>

          <article className="overflow-hidden rounded-[26px] border border-white/90 bg-white/72 shadow-[0_22px_60px_rgba(41,53,46,0.09)] backdrop-blur-xl">
            <div className="flex items-center gap-3 border-b border-[#dde5df] px-5 py-5 sm:px-6"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#5a4964] text-white"><Bell className="h-5 w-5" /></span><div><h2 className="text-lg font-black text-[#1d241f]">Communication</h2><p className="text-xs text-[#7a837e]">Billing contact and operational notifications.</p></div></div>
            <div className="p-5 sm:p-6">
              <label className="block"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#737d77]">Billing email</span><div className="relative"><Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#89938d]" /><input type="email" value={settings.billingEmail} onChange={(event) => updateField('billingEmail', event.target.value)} className={`${inputClasses} pl-11`} placeholder="billing@example.com" /></div></label>
              <div className="mt-5 divide-y divide-[#e3e9e5] rounded-[20px] border border-[#e0e6e2] bg-white/80 px-4">
                {notificationRows.map((row) => (
                  <div key={row.key} className="flex items-center justify-between gap-5 py-4"><div><h3 className="text-sm font-black text-[#242c26]">{row.title}</h3><p className="mt-1 text-xs leading-5 text-[#7a837e]">{row.detail}</p></div><ToggleSwitch enabled={settings.toggles[row.key]} onChange={() => toggleSetting(row.key)} label={`Toggle ${row.title}`} /></div>
                ))}
              </div>
            </div>
          </article>

          <article className="overflow-hidden rounded-[26px] border border-white/90 bg-white/72 shadow-[0_22px_60px_rgba(41,53,46,0.09)] backdrop-blur-xl">
            <div className="flex items-center gap-3 border-b border-[#dde5df] px-5 py-5 sm:px-6"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#9a6331] text-white"><LockKeyhole className="h-5 w-5" /></span><div><h2 className="text-lg font-black text-[#1d241f]">Security</h2><p className="text-xs text-[#7a837e]">Add another layer of protection to your workspace.</p></div></div>
            <div className="flex items-center justify-between gap-5 p-5 sm:p-6"><div><h3 className="text-sm font-black text-[#242c26]">Two-factor authentication</h3><p className="mt-1 text-xs leading-5 text-[#7a837e]">Require a second verification step when signing in.</p></div><ToggleSwitch enabled={settings.toggles.twoFactor} onChange={() => toggleSetting('twoFactor')} label="Toggle two-factor authentication" /></div>
          </article>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <article className="rounded-[26px] border border-white/90 bg-[linear-gradient(150deg,#173f2f,#245e46)] p-6 text-white shadow-[0_20px_48px_rgba(23,63,47,0.2)]">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12"><ShieldCheck className="h-5 w-5" /></span>
            <h2 className="mt-5 text-xl font-black">Workspace health</h2>
            <p className="mt-2 text-sm leading-6 text-white/70">A complete identity and intentional alerts help your testing operations run smoothly.</p>
            <div className="mt-6 space-y-2.5">
              <div className="flex items-center justify-between rounded-xl bg-white/10 px-3.5 py-3 text-xs"><span>Profile details</span><strong>{profileComplete ? 'Complete' : 'Needs attention'}</strong></div>
              <div className="flex items-center justify-between rounded-xl bg-white/10 px-3.5 py-3 text-xs"><span>Notifications</span><strong>{enabledNotificationCount} of 3 on</strong></div>
              <div className="flex items-center justify-between rounded-xl bg-white/10 px-3.5 py-3 text-xs"><span>Two-factor auth</span><strong>{settings.toggles.twoFactor ? 'Enabled' : 'Off'}</strong></div>
            </div>
          </article>

          <article className="rounded-[24px] border border-white/90 bg-white/75 p-5 shadow-[0_16px_40px_rgba(41,53,46,0.08)] backdrop-blur-xl">
            <h2 className="text-sm font-black text-[#202722]">Before you save</h2>
            <div className="mt-4 space-y-3 text-xs leading-5 text-[#6d7771]">
              <p className="rounded-xl bg-[#f4f7f5] px-3.5 py-3">Your company or full name appears across the developer workspace.</p>
              <p className="rounded-xl bg-[#f4f7f5] px-3.5 py-3">Billing notices are sent to the email address provided here.</p>
              <p className="rounded-xl bg-[#f4f7f5] px-3.5 py-3">Notification changes apply to future workspace activity.</p>
            </div>
            <button type="button" onClick={saveSettings} disabled={saving} className="squash-hover-action mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#173f2f] text-xs font-bold text-white transition disabled:opacity-60"><Save className="h-4 w-4" />{saving ? 'Saving…' : 'Save all changes'}</button>
          </article>
        </aside>
      </section>
    </div>
  );
}
