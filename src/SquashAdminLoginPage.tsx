import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { isSafeInternalPath, useAuth } from './auth';

export default function SquashAdminLoginPage() {
  const { signIn, activateRole, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter the administrator email and password.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const result = await signIn({ email, password });
      if (!result.session?.roles.includes('admin')) {
        await logout();
        setError('This account is not authorised for administration.');
        return;
      }

      await activateRole('admin');
      const requestedPath = searchParams.get('next');
      const destination = requestedPath && isSafeInternalPath(requestedPath) && (requestedPath === '/A31/dashboard' || requestedPath.startsWith('/A31/'))
        ? requestedPath
        : '/A31/dashboard';
      navigate(destination, { replace: true });
    } catch {
      setError('Unable to verify administrator access.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-slate-950 px-4 py-10 text-white">
      <main className="w-full max-w-md">
        <div className="mb-7 flex items-center justify-center gap-3">
          <img src="/squash-logo.png" alt="SQUASH" className="h-12 w-12 rounded-2xl border border-white/10 object-cover" />
          <span className="text-2xl font-black tracking-tight">SQUASH</span>
        </div>

        <section className="rounded-[30px] border border-white/10 bg-white/[0.06] p-7 shadow-2xl backdrop-blur sm:p-8">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-green-500/15 text-green-400 ring-1 ring-green-400/20">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-center text-3xl font-black">Administrator access</h1>
          <p className="mt-2 text-center text-sm leading-6 text-slate-400">
            Restricted SQUASH operations workspace.
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-300">Administrator email</span>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 focus-within:border-green-500">
                <Mail className="h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="username"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                  placeholder="Administrator email"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-300">Password</span>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 focus-within:border-green-500">
                <LockKeyhole className="h-4 w-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                  placeholder="Password"
                />
                <button type="button" onClick={() => setShowPassword((current) => !current)} className="text-slate-500 hover:text-white" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            {error ? <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300">{error}</p> : null}

            <button disabled={submitting} className="w-full rounded-2xl bg-green-500 px-5 py-3 font-bold text-slate-950 hover:bg-green-400 disabled:opacity-50">
              {submitting ? 'Verifying access...' : 'Enter administration'}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
