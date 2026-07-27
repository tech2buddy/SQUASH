import { Code2, Eye, Lock, Mail, UserRound } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, type WorkspaceRole } from './auth';
import { GitHubIcon, GoogleIcon } from './BrandIcons';

export default function SquashSignupPage() {
  const [searchParams] = useSearchParams();
  const requestedRole = searchParams.get('role');
  const initialRole: WorkspaceRole = requestedRole === 'tester' ? 'tester' : 'developer';
  const [role, setRole] = useState<WorkspaceRole>(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signUp, signInWithOAuth } = useAuth();
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

  const submitSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Use a password with at least 8 characters.');
      return;
    }
    if (!acceptedTerms) {
      setError('Please accept Terms of Service and Privacy Policy.');
      return;
    }

    setSubmitting(true);
    setError('');
    setNotice('');
    try {
      const result = await signUp({
        role,
        email,
        password,
        name,
      });

      if (result.requiresEmailConfirmation) {
        setNotice('Account created. Please check your email to confirm your account before logging in.');
        return;
      }

      const activeSession = result.session;
      if (!activeSession) {
        setNotice('Account created. You can now login.');
        navigate('/login?role=' + role, { replace: true });
        return;
      }

      const onboardingPath = `/onboarding/${role}${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ''}`;
      navigate(onboardingPath, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create your account right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const socialSignup = async (provider: 'google' | 'github') => {
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
        setError(`${providerName} sign-up is not available right now. You can sign up with email/password above.`);
      } else {
        console.error(err);
        setError('Social signup is not available right now. You can sign up with email/password above.');
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
            to={`/login?role=${role}`}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
          >
            Login
          </Link>
        </div>

        <div className="mx-auto max-w-2xl rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="text-center">
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Create your account</h1>
            <p className="mt-2 text-slate-600">Join Squash and start testing or posting jobs</p>
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

          <form className="mt-6" onSubmit={submitSignup} autoComplete="off">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Full Name</span>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3">
                  <UserRound className="h-4 w-4 text-slate-400" />
                  <input
                    type="text" name="squash_signup_name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    autoComplete="new-password"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <input
                    type="email" name="squash_signup_identifier"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    autoComplete="new-password"
                  />
                </div>
              </label>
            </div>

            <div className="mt-4 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Password</span>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3">
                  <Lock className="h-4 w-4 text-slate-400" />
                  <input
                  type={showPassword ? 'text' : 'password'} name="squash_signup_secret"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
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

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Confirm Password</span>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3">
                  <Lock className="h-4 w-4 text-slate-400" />
                  <input
                  type={showConfirmPassword ? 'text' : 'password'} name="squash_signup_secret_confirm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    autoComplete="new-password"
                  />
                  <button
                    className="text-slate-400 hover:text-slate-600"
                    type="button"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </label>
            </div>

            <div className="mt-5">
              <div className="mb-2 text-sm font-semibold text-slate-700">I am a...</div>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setRole('developer')}
                  className={`rounded-2xl border p-4 text-left transition ${
                    role === 'developer'
                      ? 'border-green-300 bg-green-50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 text-base font-bold text-slate-900">
                    <Code2 className="h-4 w-4 text-green-700" /> Developer
                  </div>
                  <div className="mt-1 text-sm text-slate-600">Post jobs, manage tests and view reports.</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('tester')}
                  className={`rounded-2xl border p-4 text-left transition ${
                    role === 'tester'
                      ? 'border-green-300 bg-green-50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 text-base font-bold text-slate-900">
                    <UserRound className="h-4 w-4 text-green-700" /> Tester
                  </div>
                  <div className="mt-1 text-sm text-slate-600">Find jobs, test apps and earn money.</div>
                </button>
              </div>
            </div>

            <label className="mt-5 flex items-start gap-2 text-sm text-slate-600">
              <input
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-slate-300"
              />
              <span>
                I agree to the{' '}
                <a href="/terms" className="font-semibold text-green-700">Terms of Service</a>{' '}
                and <a href="/privacy" className="font-semibold text-green-700">Privacy Policy</a>
              </span>
            </label>

            {error ? <p className="mt-3 text-sm font-medium text-red-600">{error}</p> : null}
            {notice ? <p className="mt-3 text-sm font-medium text-green-700">{notice}</p> : null}

            <button type="submit" className="mt-5 w-full rounded-2xl bg-green-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-green-700">
              {submitting ? 'Creating account...' : 'Create Account'}
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
              onClick={() => socialSignup('google')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <GoogleIcon className="h-5 w-5" />
              Sign up with Google
            </button>
            <button
              type="button"
              onClick={() => socialSignup('github')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <GitHubIcon className="h-5 w-5 text-slate-800" />
              Sign up with GitHub
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to={`/login?role=${role}`} className="font-semibold text-green-700 hover:text-green-800">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}





