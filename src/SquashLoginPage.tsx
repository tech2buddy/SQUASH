import { Code2, Eye, Lock, Mail, UserRound } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resolvePostLoginPath, routeRole, useAuth, type WorkspaceRole } from './auth';
import { GitHubIcon, GoogleIcon } from './BrandIcons';


export default function SquashLoginPage() {
  const [searchParams] = useSearchParams();
  const requestedRole = searchParams.get('role');
  const initialRole: WorkspaceRole = requestedRole === 'tester' ? 'tester' : 'developer';
  const [role, setRole] = useState<WorkspaceRole>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signInWithOAuth, activateRole, logout } = useAuth();
  const navigate = useNavigate();

  const nextPath = useMemo(() => searchParams.get('next'), [searchParams]);

  useEffect(() => {
    const handleRestoreState = () => {
      setSubmitting(false);
      setNotice((prev) => (prev.includes('Redirecting') ? '' : prev));
    };

    window.addEventListener('focus', handleRestoreState);
    window.addEventListener('pageshow', handleRestoreState);

    return () => {
      window.removeEventListener('focus', handleRestoreState);
      window.removeEventListener('pageshow', handleRestoreState);
    };
  }, []);


  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }


    setSubmitting(true);
    setError('');
    setNotice('');
    try {
      const result = await signIn({ email, password });
      const activeSession = result.session;
      if (!activeSession) {
        setError('We could not load your SQUASH profile. Please contact support.');
        return;
      }
      if (activeSession.roles.includes('admin') && routeRole(nextPath || '') === 'admin') {
        await activateRole('admin');
        navigate('/A31/dashboard', { replace: true });
        return;
      }
      if (!activeSession.roles.includes(role)) {
        await logout();
        const availableRoles = activeSession.roles.map((item) => (item === 'developer' ? 'Developer' : 'Tester')).join(' or ');
        const selectedRole = role === 'developer' ? 'Developer' : 'Tester';
        setError(
          `This account does not have a ${selectedRole} workspace yet. Please choose ${availableRoles}, or add the ${selectedRole} workspace after logging in.`,
        );
        return;
      }
      const selectedSession = await activateRole(role);
      navigate(resolvePostLoginPath(selectedSession || { ...activeSession, role }, nextPath), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to login right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const socialLogin = async (provider: 'google' | 'github') => {
    setSubmitting(true);
    setError('');
    setNotice('Redirecting to your social login provider...');
    try {
      await signInWithOAuth({ provider, role });
      setTimeout(() => {
        setSubmitting(false);
        setNotice('');
      }, 4000);
    } catch (err) {
      setNotice('');
      const rawMsg = err instanceof Error ? err.message : String(err || '');
      if (rawMsg.includes('provider is not enabled') || rawMsg.includes('Unsupported provider')) {
        const providerName = provider === 'google' ? 'Google' : 'GitHub';
        console.error(`OAuth provider not enabled: ${providerName}`, err);
        setError(`${providerName} sign-in is not available right now. You can sign in with email/password below.`);
      } else {
        console.error(err);
        setError('Social login is not available right now. You can sign in with email/password below.');
      }
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#ecfdf3_0%,#f8fafc_45%,#f8fafc_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/squash-logo.png"
              alt="SQUASH logo"
              className="h-11 w-11 rounded-2xl border border-slate-200 object-cover shadow-sm"
            />
            <span className="text-3xl font-black tracking-tight text-slate-900">SQUASH</span>
          </Link>
          <Link
            to={`/signup?role=${role}`}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
          >
            Create account
          </Link>
        </div>

        <div className="mx-auto max-w-xl rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="text-center">
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Welcome back!</h1>
            <p className="mt-2 text-slate-600">Login to your account to continue</p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
            <button
              onClick={() => setRole('developer')}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                role === 'developer'
                  ? 'bg-green-100 text-green-700 ring-1 ring-green-200'
                  : 'text-slate-600 hover:bg-white'
              }`}
            >
              <Code2 className="h-4 w-4" /> Developer
            </button>
            <button
              onClick={() => setRole('tester')}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                role === 'tester'
                  ? 'bg-green-100 text-green-700 ring-1 ring-green-200'
                  : 'text-slate-600 hover:bg-white'
              }`}
            >
              <UserRound className="h-4 w-4" /> Tester
            </button>
          </div>

          <form className="mt-6 space-y-4" onSubmit={submitLogin} autoComplete="off">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3">
                <Mail className="h-4 w-4 text-slate-400" />
                <input
                  type="email" name="squash_login_identifier"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  autoComplete="new-password"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Password</span>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3">
                <Lock className="h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'} name="squash_login_secret"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  autoComplete="new-password"
                />
                <button
                  className="text-slate-400 hover:text-slate-600"
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </label>

            <div className="mt-4 flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-600">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                Remember me
              </label>
              <Link to="/forgot-password" className="font-semibold text-green-700 hover:text-green-800">
                Forgot password?
              </Link>
            </div>

            {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
            {notice ? <p className="text-sm font-medium text-green-700">{notice}</p> : null}

            <button type="submit" className="mt-5 w-full rounded-2xl bg-green-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-green-700">
              {submitting ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-sm text-slate-400">or</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => socialLogin('google')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <GoogleIcon className="h-5 w-5" />
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => socialLogin('github')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <GitHubIcon className="h-5 w-5 text-slate-800" />
              Continue with GitHub
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-slate-600">
            Don&apos;t have an account?{' '}
            <Link to={`/signup?role=${role}`} className="font-semibold text-green-700 hover:text-green-800">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}




