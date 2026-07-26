import { ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './auth';
import { supabase } from './lib/supabase';

type Setup = { factorId: string; qrCode?: string; secret?: string };

export default function SquashAdminMfaPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [setup, setSetup] = useState<Setup | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (loading || !session?.roles.includes('admin')) return;
    let active = true;
    (async () => {
      try {
        const { data: aal, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aalError) throw aalError;
        if (aal.currentLevel === 'aal2') return navigate('/A31/dashboard', { replace: true });
        const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
        if (factorsError) throw factorsError;
        const verified = factors.totp.find((factor) => factor.status === 'verified');
        if (verified) return active && setSetup({ factorId: verified.id });
        const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'SQUASH Admin' });
        if (enrollError) throw enrollError;
        if (active) setSetup({ factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret });
      } catch {
        if (active) setError('Unable to prepare MFA. Confirm TOTP is enabled in Supabase Auth settings.');
      } finally { if (active) setBusy(false); }
    })();
    return () => { active = false; };
  }, [loading, navigate, session?.userId, session?.roles]);

  if (!loading && (!session || !session.roles.includes('admin'))) return <Navigate to="/A31" replace />;

  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!setup || !/^\d{6}$/.test(code)) return;
    setBusy(true); setError('');
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: setup.factorId });
      if (challengeError) throw challengeError;
      const { error: verifyError } = await supabase.auth.mfa.verify({ factorId: setup.factorId, challengeId: challenge.id, code });
      if (verifyError) throw verifyError;
      navigate('/A31/dashboard', { replace: true });
    } catch { setError('That authenticator code was invalid or expired.'); }
    finally { setBusy(false); }
  };

  return <main className="grid min-h-screen place-items-center bg-[#f6f8f7] px-4 py-10">
    <section className="w-full max-w-lg rounded-[30px] border border-slate-200 bg-white p-8 shadow-xl">
      <div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-green-400"><ShieldCheck /></div><div><div className="text-xs font-black uppercase tracking-widest text-green-700">Admin security</div><h1 className="text-2xl font-black">Authenticator verification</h1></div></div>
      {busy && !setup ? <p className="mt-8 text-sm font-semibold text-slate-500">Preparing secure access…</p> : null}
      {setup?.qrCode ? <div className="mt-7 rounded-2xl border bg-slate-50 p-5 text-center"><p className="text-sm font-bold">Scan with an authenticator app.</p><img src={setup.qrCode} alt="Authenticator QR code" className="mx-auto mt-4 h-48 w-48 rounded-xl bg-white p-2" /><p className="mt-3 break-all font-mono text-xs text-slate-500">Manual key: {setup.secret}</p></div> : setup ? <p className="mt-7 text-sm text-slate-600">Enter the current code from your authenticator app.</p> : null}
      {setup ? <form onSubmit={verify} className="mt-6 space-y-4"><input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" className="w-full rounded-2xl border px-4 py-4 text-center font-mono text-2xl font-black tracking-[0.3em]" placeholder="000000" /><button disabled={busy || code.length !== 6} className="w-full rounded-2xl bg-green-600 px-5 py-3.5 font-bold text-white disabled:opacity-50">{busy ? 'Verifying…' : 'Verify and enter operations'}</button></form> : null}
      {error ? <p className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
    </section>
  </main>;
}