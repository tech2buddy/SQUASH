import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from './lib/supabase';

export type UserRole = 'developer' | 'tester';
type SupabaseProfileRole = UserRole | 'admin';

type AuthSession = {
  role: UserRole;
  email: string;
  name: string;
  isAuthenticated: true;
  userId?: string;
  source: 'supabase' | 'demo';
};

type DemoLoginPayload = {
  role: UserRole;
  email: string;
  name: string;
};

type AuthResult = {
  session: AuthSession | null;
  requiresEmailConfirmation?: boolean;
};

type AuthContextValue = {
  session: AuthSession | null;
  loading: boolean;
  loginDemo: (payload: DemoLoginPayload) => void;
  signIn: (payload: { email: string; password: string }) => Promise<AuthResult>;
  signUp: (payload: { role: UserRole; email: string; password: string; name: string }) => Promise<AuthResult>;
  signInWithOAuth: (payload: { provider: 'google' | 'github'; role: UserRole }) => Promise<void>;
  logout: () => Promise<void>;
};

const DEMO_STORAGE_KEY = 'squash_demo_auth_session_v1';

const AuthContext = createContext<AuthContextValue | null>(null);

type ProfileRow = {
  id: string;
  role: SupabaseProfileRole;
  full_name: string;
  email: string;
};

function readStoredDemoSession(): AuthSession | null {
  try {
    const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.role || !parsed?.email || !parsed?.name || !parsed?.isAuthenticated) return null;
    if (parsed.role !== 'developer' && parsed.role !== 'tester') return null;
    return { ...parsed, source: 'demo' };
  } catch {
    return null;
  }
}

function persistDemoSession(session: AuthSession | null) {
  try {
    if (!session) {
      window.localStorage.removeItem(DEMO_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // no-op: if storage is unavailable, session remains in-memory
  }
}

async function readProfileSession(userId: string, fallbackEmail: string): Promise<AuthSession | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, full_name, email')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const profile = data as ProfileRow;
  if (profile.role === 'admin') {
    throw new Error('Admin dashboard access is not enabled yet.');
  }

  return {
    role: profile.role,
    email: profile.email || fallbackEmail,
    name: profile.full_name,
    userId: profile.id,
    isAuthenticated: true,
    source: 'supabase',
  };
}

export function roleHomePath(role: UserRole): string {
  return role === 'developer' ? '/dashboard' : '/tester/dashboard';
}

export function routeRole(pathname: string): UserRole | 'public' {
  const developerRoutes = new Set([
    '/dashboard',
    '/post-job',
    '/billing',
    '/report-details',
    '/developer/jobs',
    '/developer/submissions',
    '/developer/activity',
    '/report-details/attachments',
  ]);
  const testerRoutes = new Set([
    '/tester/dashboard',
    '/tester-jobs',
    '/active-test',
    '/tester/profile',
    '/tester/earnings',
    '/tester/payments',
    '/tester/reports',
    '/tester/submissions',
    '/tester/settings',
  ]);
  if (developerRoutes.has(pathname)) return 'developer';
  if (testerRoutes.has(pathname)) return 'tester';
  return 'public';
}

export function isSafeInternalPath(path: string): boolean {
  return path.startsWith('/') && !path.startsWith('//');
}

export function resolvePostLoginPath(role: UserRole, nextPath: string | null): string {
  if (!nextPath || !isSafeInternalPath(nextPath)) return roleHomePath(role);
  const targetRole = routeRole(nextPath);
  if (targetRole === 'public' || targetRole === role) return nextPath;
  return roleHomePath(role);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => readStoredDemoSession());
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadSession = async () => {
      setLoading(true);
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;

      if (error || !data.session?.user) {
        setLoading(false);
        return;
      }

      try {
        const profileSession = await readProfileSession(data.session.user.id, data.session.user.email ?? '');
        if (!mounted) return;
        if (profileSession) {
          persistDemoSession(null);
          setSession(profileSession);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, authSession) => {
      if (!mounted) return;
      if (!authSession?.user) {
        setSession(readStoredDemoSession());
        setLoading(false);
        return;
      }

      try {
        const profileSession = await readProfileSession(authSession.user.id, authSession.user.email ?? '');
        if (!mounted) return;
        if (profileSession) {
          persistDemoSession(null);
          setSession(profileSession);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      loading,
      loginDemo: (payload) => {
        const nextSession: AuthSession = {
          role: payload.role,
          email: payload.email,
          name: payload.name,
          isAuthenticated: true,
          source: 'demo',
        };
        setSession(nextSession);
        persistDemoSession(nextSession);
      },
      signIn: async ({ email, password }) => {
        if (!isSupabaseConfigured) {
          throw new Error('Supabase is not configured yet.');
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (error) throw error;
        if (!data.user) return { session: null };

        const profileSession = await readProfileSession(data.user.id, data.user.email ?? email);
        if (profileSession) {
          persistDemoSession(null);
          setSession(profileSession);
        }
        return { session: profileSession };
      },
      signUp: async ({ role, email, password, name }) => {
        if (!isSupabaseConfigured) {
          throw new Error('Supabase is not configured yet.');
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              role,
              full_name: name.trim(),
            },
          },
        });

        if (error) throw error;
        if (!data.user) return { session: null };

        if (!data.session) {
          return { session: null, requiresEmailConfirmation: true };
        }

        const profileSession = await readProfileSession(data.user.id, data.user.email ?? email);
        if (profileSession) {
          persistDemoSession(null);
          setSession(profileSession);
        }
        return { session: profileSession };
      },
      signInWithOAuth: async ({ provider, role }) => {
        if (!isSupabaseConfigured) {
          throw new Error('Supabase is not configured yet.');
        }

        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/login?role=${role}`,
            queryParams: {
              role,
            },
          },
        });

        if (error) throw error;
      },
      logout: async () => {
        persistDemoSession(null);
        if (isSupabaseConfigured) {
          await supabase.auth.signOut();
        }
        setSession(null);
      },
    }),
    [loading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
