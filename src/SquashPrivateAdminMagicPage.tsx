import {
  ArrowRight,
  CheckCircle2,
  Fingerprint,
  Mail,
  ShieldCheck,
  WalletCards,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './auth';
import { supabase } from './lib/supabase';

export default function SquashPrivateAdminMagicPage() {
  const { session, loading, activateRole, refreshSessionProfile } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (loading || !session) return;
    let alive = true;

    refreshSessionProfile()
      .then(async (freshSession) => {
        if (!alive || !freshSession) return;
        if (!freshSession.roles.includes('admin')) {
          setError('The current account is not authorised for administration.');
          return;
        }
        await activateRole('admin');
        if (alive) navigate('/A31/mfa', { replace: true });
      })
      .catch(() => {
        if (alive) setError('Unable to verify the current administrator session.');
      });

    return () => {
      alive = false;
    };
  }, [activateRole, loading, navigate, refreshSessionProfile, session?.userId]);

  const sendAccessCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) {
      setError('Enter the authorised administrator email.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/A31`,
        },
      });
      if (signInError) throw signInError;
      setSent(true);
    } catch {
      setError('Unable to send the private access code. Confirm that this email belongs to an existing SQUASH account.');
    } finally {
      setSubmitting(false);
    }
  };

  const verifyAccessCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from the email.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: code,
        type: 'email',
      });
      if (verifyError) throw verifyError;

      const freshSession = await refreshSessionProfile();
      if (!freshSession?.roles.includes('admin')) {
        await supabase.auth.signOut();
        setError('This account is not authorised for administration.');
        return;
      }
      navigate('/A31/mfa', { replace: true });
    } catch {
      setError('The access code is invalid or has expired. Request a new code and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f6f8f7] px-4 py-6 text-slate-900 sm:px-6 lg:grid lg:place-items-center lg:px-8">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-green-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-28 h-[30rem] w-[30rem] rounded-full bg-emerald-100/70 blur-3xl" />

      <main className="relative mx-auto grid w-full max-w-5xl overflow-hidden rounded-[34px] border border-slate-200/80 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.12)] lg:grid-cols-[0.92fr_1.08fr]">
        <section className="relative overflow-hidden bg-slate-950 p-7 text-white sm:p-10 lg:p-12">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-green-500/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-emerald-400/15 blur-3xl" />

          <div className="relative flex h-full flex-col">
            <div className="flex items-center gap-3">
              <img src="/squash-logo.png" alt="SQUASH" className="h-12 w-12 rounded-2xl border border-white/15 object-cover shadow-lg" />
              <div>
                <div className="text-2xl font-black tracking-tight">SQUASH</div>
                <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-green-400">Operations</div>
              </div>
            </div>

            <div className="mt-12">
              <div className="inline-flex items-center gap-2 rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1.5 text-xs font-bold text-green-300">
                <Fingerprint className="h-4 w-4" />
                Owner workspace
              </div>
              <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                Quiet control.
                <span className="block text-green-400">Clear decisions.</span>
              </h1>
              <p className="mt-5 max-w-md text-sm leading-7 text-slate-300">
                Review platform activity, verify payout information and handle sensitive operations from one restricted workspace.
              </p>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:mt-auto lg:grid-cols-1 xl:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
                <WalletCards className="h-5 w-5 text-green-400" />
                <div className="mt-3 text-sm font-bold">Money controls</div>
                <div className="mt-1 text-xs leading-5 text-slate-400">Banking verification and Friday EFT oversight.</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
                <ShieldCheck className="h-5 w-5 text-green-400" />
                <div className="mt-3 text-sm font-bold">Platform safety</div>
                <div className="mt-1 text-xs leading-5 text-slate-400">Support, moderation and incident operations.</div>
              </div>
            </div>
          </div>
        </section>

        <section className="p-7 sm:p-10 lg:p-12">
          <div className="mx-auto max-w-md">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-green-50 text-green-700 ring-1 ring-green-100">
              {sent ? <CheckCircle2 className="h-6 w-6" /> : <Mail className="h-6 w-6" />}
            </div>
            <div className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-green-700">Private access</div>
            <h2 className="mt-2 text-3xl font-black tracking-tight">{sent ? 'Enter access code' : 'Continue securely'}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {sent
                ? 'A 6-digit private access code was sent to the authorised email.'
                : 'No password is required. Enter the authorised owner email to receive a one-time code.'}
            </p>

            {!sent ? (
              <form onSubmit={sendAccessCode} className="mt-8 space-y-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">Administrator email</span>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3.5 transition focus-within:border-green-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-green-50">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                      placeholder="Owner email"
                      className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    />
                  </div>
                </label>

                {error ? <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}

                <button disabled={submitting} className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 py-3.5 font-bold text-white shadow-[0_12px_28px_rgba(22,163,74,0.22)] transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50">
                  {submitting ? 'Sending access code...' : 'Email private access code'}
                  {!submitting ? <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /> : null}
                </button>
              </form>
            ) : (
              <form onSubmit={verifyAccessCode} className="mt-8 space-y-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">6-digit access code</span>
                  <input
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-center font-mono text-2xl font-black tracking-[0.35em] outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-50"
                  />
                </label>
                {error ? <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
                <button disabled={submitting || code.length !== 6} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 py-3.5 font-bold text-white shadow-[0_12px_28px_rgba(22,163,74,0.22)] hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50">
                  {submitting ? 'Verifying code...' : 'Enter operations'}
                  {!submitting ? <ArrowRight className="h-4 w-4" /> : null}
                </button>
                <button type="button" onClick={() => { setSent(false); setCode(''); setError(''); }} className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 font-bold text-slate-700 hover:bg-slate-50">
                  Use a different email
                </button>
              </form>
            )}


            <div className="mt-7 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              Existing authorised accounts only
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
