import { ArrowRight, BriefcaseBusiness, CheckCircle2, Globe, MapPin, ShieldCheck, Smartphone, UserRound, Wallet } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router';
import { useAuth, type UserRole } from './auth';
import TesterApplicationProgress from './components/TesterApplicationProgress';
import { supabase } from './lib/supabase';
import SpecializationChecklist from './components/SpecializationChecklist';
import {
  getDeveloperProfile,
  getTesterProfile,
  getTesterSpecializations,
  replaceTesterSpecializations,
  updateDeveloperProfile,
  updateTesterProfile,
} from './lib/profileApi';

function isOnboardingRole(role: string | undefined): role is UserRole {
  return role === 'developer' || role === 'tester';
}

export default function SquashOnboardingPage() {
  const { role } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { session, loading, refreshSessionProfile } = useAuth();
  const nextPath = searchParams.get('next');
  const targetRole = isOnboardingRole(role) ? role : null;

  const [companyName, setCompanyName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'eft' | 'snapscan' | 'airtime'>('eft');
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  const fallbackPath = useMemo(() => (targetRole === 'developer' ? '/post-job' : targetRole === 'tester' ? '/tester-qualification' : '/'), [targetRole]);
  const finishPath = nextPath && nextPath.startsWith('/') && !nextPath.startsWith('//') ? nextPath : fallbackPath;

  useEffect(() => {
    if (!session?.userId || !targetRole) {
      setLoaded(true);
      return;
    }

    let mounted = true;
    setLoaded(false);
    setError('');

    const load = async () => {
      try {
        if (targetRole === 'developer') {
          const profile = await getDeveloperProfile(session.userId!);
          if (!mounted) return;
          setCompanyName(profile?.companyName || session.name || '');
          setWebsiteUrl(profile?.websiteUrl || '');
          setBillingEmail(profile?.billingEmail || session.email || '');
        } else {
          const [profile, specializations] = await Promise.all([
            getTesterProfile(session.userId!),
            getTesterSpecializations(session.userId!),
          ]);
          if (!mounted) return;
          setCity(profile?.city || '');
          setPhone(profile?.phone || '');
          setPayoutMethod(profile?.preferredPayout || 'eft');
          setSelectedSpecializations(specializations);
        }
      } catch (loadError) {
        if (mounted) setError(loadError instanceof Error ? loadError.message : 'Could not load onboarding details.');
      } finally {
        if (mounted) setLoaded(true);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [session?.email, session?.name, ("supabase"), session?.userId, targetRole]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 text-center text-sm font-semibold text-slate-600">
        Preparing your SQUASH setup...
      </div>
    );
  }

  if (!targetRole) return <Navigate to="/choose-workspace" replace />;
  if (!session) return <Navigate to={`/login?role=${targetRole}`} replace />;
  if (!session.roles.includes(targetRole)) return <Navigate to="/choose-workspace" replace />;

  const toggleSpecialization = (id: string, checked: boolean) => {
    setSelectedSpecializations((current) => (checked ? [...current, id] : current.filter((item) => item !== id)));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!session.userId) {
      navigate(finishPath, { replace: true });
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (targetRole === 'developer') {
        if (!companyName.trim()) throw new Error('Please add your company or project name.');
        await updateDeveloperProfile(session.userId, {
          developerType: 'company',
          fullName: session.name || '',
          nickname: session.name || '',
          companyName,
          websiteUrl,
          billingEmail: billingEmail || session.email,
        });
      } else {
        if (!city.trim()) throw new Error('Please add your city so we can match local tests better.');
        await updateTesterProfile(session.userId, {
          fullName: session.name,
          email: session.email,
          phone,
          city,
          preferredPayout: payoutMethod,
          isPublic: true,
        });
        await replaceTesterSpecializations(session.userId, selectedSpecializations);
      }

      const { error: onboardingError } = await supabase.auth.updateUser({ data: { onboarding_completed: true } });
      if (onboardingError) throw onboardingError;
      await refreshSessionProfile();
      navigate(finishPath, { replace: true });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save onboarding details right now.');
    } finally {
      setSaving(false);
    }
  };

  const isDeveloper = targetRole === 'developer';

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fff1f2_0%,#f8fafc_48%,#f8fafc_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/squash-logo.png"
              alt="SQUASH logo"
              className="h-11 w-11 rounded-2xl border border-slate-200 object-cover shadow-sm"
            />
            <span className="text-3xl font-black tracking-tight text-slate-900">SQUASH</span>
          </Link>
        </div>

        {!isDeveloper ? <div className="mt-7"><TesterApplicationProgress current={1} /></div> : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <aside className="rounded-[30px] border border-rose-100 bg-rose-50 p-6 shadow-sm">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#e63946] ring-1 ring-rose-100">
              <ShieldCheck className="h-4 w-4" /> Quick setup
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-900">
              {isDeveloper ? 'Set up your developer workspace' : 'Set up your tester profile'}
            </h1>
            <p className="mt-4 leading-7 text-slate-700">
              {isDeveloper
                ? 'Add the basics we need to make your first job faster to post. You can edit this later.'
                : 'Tell SQUASH what devices, networks, and skills you bring so we can match better jobs.'}
            </p>
            <div className="mt-6 space-y-3">
              {(isDeveloper
                ? ['Company or project profile', 'First test easier to post', 'Better reports and billing context']
                : ['Better job matching', 'SA-specific tester strengths', 'Payout preference ready']
              ).map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-3 text-sm font-semibold text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-[#e63946]" />
                  {item}
                </div>
              ))}
            </div>
          </aside>

          <main className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#1d1d1f] text-white ring-1 ring-black/10">
                {isDeveloper ? <BriefcaseBusiness className="h-7 w-7" /> : <UserRound className="h-7 w-7" />}
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  {isDeveloper ? 'Developer basics' : 'Tester basics'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Signed in as {session.email}. This setup is saved to your real SQUASH account.
                </p>
              </div>
            </div>

            {!loaded ? (
              <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
                Loading setup fields...
              </div>
            ) : (
              <form className="mt-8" onSubmit={submit}>
                {isDeveloper ? (
                  <div className="grid gap-5">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">Company or project name</span>
                      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3">
                        <BriefcaseBusiness className="h-4 w-4 text-slate-400" />
                        <input
                          value={companyName}
                          onChange={(event) => setCompanyName(event.target.value)}
                          placeholder="Example: KasiPay, FitTrack, Studio Alpha"
                          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">Website or app URL</span>
                      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3">
                        <Globe className="h-4 w-4 text-slate-400" />
                        <input
                          value={websiteUrl}
                          onChange={(event) => setWebsiteUrl(event.target.value)}
                          placeholder="https://your-staging-site.com"
                          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">Billing email</span>
                      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3">
                        <Wallet className="h-4 w-4 text-slate-400" />
                        <input
                          type="email"
                          value={billingEmail}
                          onChange={(event) => setBillingEmail(event.target.value)}
                          placeholder="billing@company.co.za"
                          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                        />
                      </div>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-7">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-700">City</span>
                        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          <input
                            value={city}
                            onChange={(event) => setCity(event.target.value)}
                            placeholder="Johannesburg, Cape Town, Durban..."
                            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                          />
                        </div>
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-700">Phone number</span>
                        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3">
                          <Smartphone className="h-4 w-4 text-slate-400" />
                          <input
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
                            placeholder="Optional for now"
                            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                          />
                        </div>
                      </label>
                    </div>

                    <div>
                      <div className="mb-3 text-sm font-semibold text-slate-700">Preferred payout method</div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {[
                          { id: 'eft', label: 'Bank Transfer (EFT)' },
                          { id: 'snapscan', label: 'SnapScan' },
                          { id: 'airtime', label: 'Airtime top-up' },
                        ].map((method) => (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => setPayoutMethod(method.id as typeof payoutMethod)}
                            className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                              payoutMethod === method.id
                                ? 'border-[#e63946] bg-rose-50 text-[#e63946]'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {method.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-3 text-sm font-semibold text-slate-700">My specializations</div>
                      <SpecializationChecklist selected={selectedSpecializations} onToggle={toggleSpecialization} compact />
                    </div>
                  </div>
                )}

                {error ? (
                  <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {error}
                  </div>
                ) : null}

                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#e63946] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#d62828] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? 'Saving setup...' : isDeveloper ? 'Save and post first job' : 'Save and continue application'}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </form>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
