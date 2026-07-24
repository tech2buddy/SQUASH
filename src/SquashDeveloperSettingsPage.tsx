import {
  Bell,
  CheckCircle2,
  LockKeyhole,
  UserCircle2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from './auth';
import { getDeveloperProfile, updateDeveloperProfile, getUserSettings, updateUserSettings } from './lib/profileApi';

type ToggleKey =
  | 'newApplications'
  | 'reportSubmitted'
  | 'jobCompleted'
  | 'twoFactor';

type SettingsState = {
  companyName: string;
  websiteUrl: string;
  billingEmail: string;
  toggles: Record<ToggleKey, boolean>;
};

const defaultSettings: SettingsState = {
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
      onClick={onChange}
      aria-label={label}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition ${
        enabled ? 'bg-slate-900' : 'bg-slate-200'
      }`}
    >
      <span
        className={`h-5 w-5 rounded-full bg-white shadow-sm transition ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  );
}

export default function SquashDeveloperSettingsPage() {
  const { session, refreshSessionProfile } = useAuth();
  
  const starter = useMemo(
    () => ({
      ...defaultSettings,
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
    if (!session?.userId) {
      return;
    }

    let mounted = true;
    setProfileError('');

    getDeveloperProfile(session.userId)
      .then((profile) => {
        if (!mounted || !profile) return;
        setSettings((prev) => ({
          ...prev,
          companyName: profile.companyName,
          websiteUrl: profile.websiteUrl,
          billingEmail: profile.billingEmail,
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
          toggles: {
            ...prev.toggles,
            ...userSettings.toggles,
          },
        }));
      })
      .catch((error: Error) => {
        console.error('Failed to load user settings', error);
      });

    return () => {
      mounted = false;
    };
  }, [session?.userId]);

  const updateField = (key: keyof Omit<SettingsState, 'toggles'>, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSetting = (key: ToggleKey) => {
    setSettings((prev) => ({
      ...prev,
      toggles: { ...prev.toggles, [key]: !prev.toggles[key] },
    }));
  };

  const saveSettings = async () => {
    setSaving(true);
    setProfileError('');

    try {
      if (session?.userId) {
        await updateDeveloperProfile(session.userId, {
          companyName: settings.companyName,
          websiteUrl: settings.websiteUrl,
          billingEmail: settings.billingEmail,
        });
        
        await updateUserSettings(session.userId, {
          toggles: settings.toggles,
          availableDays: [],
          preferredTime: '',
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
    { key: 'newApplications', title: 'New applications', detail: 'Alert me when testers apply for jobs.' },
    { key: 'reportSubmitted', title: 'Report submitted', detail: 'Notify me when a tester submits a report.' },
    { key: 'jobCompleted', title: 'Job completed', detail: 'Send an alert when all testers have finished.' },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between animate-fade-up">
        <div>
          <span className="inline-flex rounded-full bg-slate-100 px-3.5 py-1 text-xs font-extrabold text-slate-800">
            Developer
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">Account Settings</h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm font-medium">
            Manage your company details, notifications and account security from one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {saved ? (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50/80 px-4 py-2 text-xs font-bold text-green-800">
              <CheckCircle2 className="h-3.5 w-3.5" /> Saved
            </div>
          ) : null}
          <button
            type="button"
            onClick={saveSettings}
            disabled={saving}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {profileError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {profileError}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Forms */}
        <div className="space-y-6 lg:col-span-8">
          {/* Profile Section */}
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <UserCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Company Profile</h2>
                <p className="text-xs font-medium text-slate-500">How you appear to testers</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">Company Name</label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => updateField('companyName', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                  placeholder="Your company name"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">Website URL</label>
                <input
                  type="url"
                  value={settings.websiteUrl}
                  onChange={(e) => updateField('websiteUrl', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>

          {/* Email Notifications */}
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Email Notifications</h2>
                <p className="text-xs font-medium text-slate-500">What we send to your inbox</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">Billing Email</label>
                <input
                  type="email"
                  value={settings.billingEmail}
                  onChange={(e) => updateField('billingEmail', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div className="mt-6 space-y-4">
                {notificationRows.map((row) => (
                  <div key={row.key} className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-bold text-slate-900">{row.title}</div>
                      <div className="text-sm font-medium text-slate-500">{row.detail}</div>
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
          </div>

          {/* Security */}
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Security</h2>
                <p className="text-xs font-medium text-slate-500">Protect your account</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-bold text-slate-900">Two-factor authentication</div>
                  <div className="text-sm font-medium text-slate-500">Require an extra step to log in.</div>
                </div>
                <ToggleSwitch
                  enabled={settings.toggles.twoFactor}
                  onChange={() => toggleSetting('twoFactor')}
                  label="Toggle two-factor authentication"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
