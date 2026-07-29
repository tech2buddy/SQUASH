import { ArrowLeft, CheckCircle2, Eye, KeyRound, Lock, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import PublicFooter from './PublicFooter';
import PublicHeader from './PublicHeader';
import { useAuth } from './auth';
import { supabase } from './lib/supabase';

type RecoveryState = 'checking' | 'ready' | 'invalid';

export default function SquashResetPasswordPage({ mode }: { mode: 'request' | 'update' }) {
  const { resetPasswordForEmail, updatePassword } = useAuth();
  const navigate = useNavigate();

  // Clicking the emailed link lands here with a recovery token in the URL.
  // The Supabase client parses it asynchronously (detectSessionInUrl), so the
  // page previously showed the form immediately and updateUser() could fire
  // before a session existed, failing with "Auth session missing". This waits
  // for the recovery session and gives a clear message if the link is bad.
  const [recovery, setRecovery] = useState<RecoveryState>(mode === 'update' ? 'checking' : 'ready');

  useEffect(() => {
    if (mode !== 'update') return;
    let active = true;

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY' || session) setRecovery('ready');
    });

    // Covers the case where the session was already restored before this
    // listener attached.
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) setRecovery('ready');
      else {
        // Give the client a moment to finish parsing the URL fragment before
        // declaring the link invalid.
        window.setTimeout(() => {
          if (!active) return;
          supabase.auth.getSession().then(({ data: retry }) => {
            if (active) setRecovery(retry.session ? 'ready' : 'invalid');
          });
        }, 1500);
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [mode]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessNotice('');

    try {
      await resetPasswordForEmail(email.trim());
      setSuccessNotice(`Password reset link sent! Check ${email} for instructions to reset your password.`);
    } catch (err) {
      // Guard against an error whose message is empty or a stringified empty
      // object -- that surfaced in the UI as literally "{}", which told the
      // user nothing.
      const raw = err instanceof Error ? err.message?.trim() : '';
      const usable = raw && raw !== '{}' && raw !== '[object Object]' ? raw : '';
      setError(usable || 'Failed to send password reset email. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessNotice('');

    try {
      await updatePassword(password);
      // The recovery link leaves an active session behind. Sign out so the
      // user actually signs in with the new password, rather than landing on
      // /login already authenticated and being bounced straight through.
      await supabase.auth.signOut();
      setSuccessNotice('Your password has been successfully updated! Redirecting to login...');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password. Link may have expired.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc]">
      <PublicHeader />

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600 ring-1 ring-green-100">
                <KeyRound className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900">
                  {mode === 'request' ? 'Reset Password' : 'Set New Password'}
                </h1>
                <p className="text-xs text-slate-500">
                  {mode === 'request'
                    ? 'Enter your account email to receive a password reset link.'
                    : 'Create a secure new password for your SQUASH account.'}
                </p>
              </div>
            </div>
          </div>

          {successNotice ? (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
              <p className="mt-3 text-sm font-semibold text-slate-900">{successNotice}</p>
              <div className="mt-5">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-2xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
                >
                  Return to Login
                </Link>
              </div>
            </div>
          ) : mode === 'update' && recovery === 'checking' ? (
            <div className="py-6 text-center">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-3 border-green-600 border-t-transparent" />
              <p className="text-sm font-semibold text-slate-700">Verifying your reset link...</p>
            </div>
          ) : mode === 'update' && recovery === 'invalid' ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                This password reset link is invalid or has expired. Reset links can only be used once,
                and expire after a short time.
              </div>
              <Link
                to="/forgot-password"
                className="block w-full rounded-2xl bg-green-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-green-700"
              >
                Request a new reset link
              </Link>
            </div>
          ) : mode === 'request' ? (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Email Address
                <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-slate-800 transition focus-within:border-green-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-green-100">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="dev@company.com or tester@email.com"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    required
                  />
                </div>
              </label>

              {error ? <p className="text-xs font-semibold text-red-600">{error}</p> : null}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? 'Sending link...' : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                New Password
                <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-slate-800 transition focus-within:border-green-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-green-100">
                  <Lock className="h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    minLength={6}
                    required
                  />
                  <button
                    className="text-slate-400 hover:text-slate-600"
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </label>

              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Confirm New Password
                <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-slate-800 transition focus-within:border-green-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-green-100">
                  <Lock className="h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    minLength={6}
                    required
                  />
                </div>
              </label>

              {error ? <p className="text-xs font-semibold text-red-600">{error}</p> : null}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
