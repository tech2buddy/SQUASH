import { AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import PublicFooter from './PublicFooter';
import PublicHeader from './PublicHeader';
import { defaultSessionPath, useAuth, type WorkspaceRole } from './auth';
import { isSupabaseConfigured, supabase, SERVICE_UNAVAILABLE_MESSAGE } from './lib/supabase';

export default function SquashAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { session, refreshSessionProfile, activateRole } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('Completing social authentication...');

  const roleParam = searchParams.get('role');
  const targetRole: WorkspaceRole = roleParam === 'tester' ? 'tester' : 'developer';

  useEffect(() => {
    let alive = true;

    const processOAuthCallback = async () => {
      if (!isSupabaseConfigured) {
        if (alive) {
          setError(SERVICE_UNAVAILABLE_MESSAGE);
        }
        return;
      }

      try {
        setStatusText('Retrieving account credentials...');
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!data.session?.user) {
          // Wait briefly for onAuthStateChange listener to fire
          await new Promise((resolve) => setTimeout(resolve, 1500));
          const { data: retryData, error: retryError } = await supabase.auth.getSession();
          if (retryError) throw retryError;
          if (!retryData.session?.user) {
            throw new Error('Social authentication session could not be established. Please try logging in again.');
          }
        }

        setStatusText('Configuring your workspace...');
        const refreshedSession = await refreshSessionProfile();

        if (!alive) return;

        if (refreshedSession) {
          if (refreshedSession.roles.includes(targetRole)) {
            await activateRole(targetRole);
            setStatusText('Redirecting to your workspace...');
            const destination = refreshedSession.onboardingCompleted === false
              ? '/onboarding/' + targetRole
              : targetRole === 'developer' ? '/dashboard' : '/tester/dashboard';
            navigate(destination, { replace: true });
          } else {
            const activePath = defaultSessionPath(refreshedSession);
            navigate(activePath, { replace: true });
          }
        } else {
          throw new Error('Could not load your user profile after social sign in.');
        }
      } catch (err) {
        if (alive) {
          setError(err instanceof Error ? err.message : 'OAuth sign in failed.');
        }
      }
    };

    if (session) {
      navigate(defaultSessionPath(session), { replace: true });
    } else {
      processOAuthCallback();
    }

    return () => {
      alive = false;
    };
  }, [activateRole, navigate, refreshSessionProfile, session, targetRole]);

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc]">
      <PublicHeader />

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          {error ? (
            <div className="space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-100">
                <AlertCircle className="h-7 w-7" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">Authentication Issue</h1>
              <p className="text-sm text-slate-600">{error}</p>
              <div className="pt-2">
                <Link
                  to={`/login?role=${targetRole}`}
                  className="inline-flex items-center justify-center rounded-2xl bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
                >
                  Return to Login
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-green-50 text-green-600 ring-1 ring-green-100">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900">Authenticating</h1>
                <p className="mt-1 text-sm font-medium text-slate-500">{statusText}</p>
              </div>
              <div className="flex justify-center pt-2">
                <Loader2 className="h-7 w-7 animate-spin text-green-600" />
              </div>
            </div>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
