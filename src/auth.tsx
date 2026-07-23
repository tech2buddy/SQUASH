import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { createNotification } from './lib/notificationApi';

export type UserRole = 'developer' | 'tester' | 'admin';
export type WorkspaceRole = Exclude<UserRole, 'admin'>;
type SupabaseProfileRole = UserRole;

type AuthSession = {
  role: UserRole;
  roles: UserRole[];
  email: string;
  name: string;
  isAuthenticated: true;
  userId?: string;
};


type AuthResult = {
  session: AuthSession | null;
  requiresEmailConfirmation?: boolean;
};

type AuthContextValue = {
  session: AuthSession | null;
  loading: boolean;
  signIn: (payload: { email: string; password: string }) => Promise<AuthResult>;
  signUp: (payload: { role: WorkspaceRole; email: string; password: string; name: string }) => Promise<AuthResult>;
  signInWithOAuth: (payload: { provider: 'google' | 'github'; role: WorkspaceRole }) => Promise<void>;
  refreshSessionProfile: () => Promise<AuthSession | null>;
  activateRole: (role: UserRole) => Promise<AuthSession | null>;
  addRole: (role: WorkspaceRole) => Promise<AuthSession | null>;
  resetPasswordForEmail: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type ProfileRow = {
  id: string;
  role: SupabaseProfileRole;
  full_name: string;
  email: string;
};

function normalizeRoles(roles: UserRole[]): UserRole[] {
  return Array.from(new Set(roles)).filter(
    (role): role is UserRole => role === 'developer' || role === 'tester' || role === 'admin',
  );
}

async function readAccountRoles(userId: string, fallbackRole: UserRole): Promise<UserRole[]> {
  const roles: UserRole[] = fallbackRole === 'admin' ? ['admin'] : [];

  const [{ data: developerProfile, error: developerError }, { data: testerProfile, error: testerError }] = await Promise.all([
    supabase.from('developer_profiles').select('user_id').eq('user_id', userId).maybeSingle(),
    supabase.from('tester_profiles').select('user_id').eq('user_id', userId).maybeSingle(),
  ]);

  if (developerError) throw developerError;
  if (testerError) throw testerError;
  if (developerProfile) roles.push('developer');
  if (testerProfile) roles.push('tester');

  return normalizeRoles(roles.length > 0 ? roles : [fallbackRole]);
}

async function readProfileSession(
  userId: string,
  fallbackEmail: string,
  targetRole?: WorkspaceRole,
): Promise<AuthSession | null> {
  let { data, error } = await supabase
    .from('profiles')
    .select('id, role, full_name, email')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    const { data: authUserData } = await supabase.auth.getUser();
    const authUser = authUserData?.user;
    if (authUser && authUser.id === userId) {
      const defaultRole: UserRole = targetRole || (authUser.user_metadata?.role as WorkspaceRole) || 'developer';
      const fullName =
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        fallbackEmail.split('@')[0] ||
        'SQUASH User';

      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          role: defaultRole,
          full_name: fullName,
          email: authUser.email || fallbackEmail,
        })
        .select('id, role, full_name, email')
        .single();

      if (!insertError && newProfile) {
        data = newProfile;
        if (defaultRole === 'developer') {
          await supabase.from('developer_profiles').upsert({
            user_id: userId,
            company_name: fullName,
            billing_email: authUser.email || fallbackEmail,
          });
        } else if (defaultRole === 'tester') {
          await supabase.from('tester_profiles').upsert({
            user_id: userId,
          });
        }
      }
    }
  }

  if (!data) return null;

  const profile = data as ProfileRow;
  const fallbackRole: UserRole = profile.role === 'admin' ? 'admin' : profile.role === 'developer' ? 'developer' : 'tester';
  const roles = await readAccountRoles(profile.id, fallbackRole);
  const activeRole = roles.includes(fallbackRole) ? fallbackRole : roles[0];

  return {
    role: activeRole,
    roles,
    email: profile.email || fallbackEmail,
    name: profile.full_name,
    userId: profile.id,
    isAuthenticated: true,
  };
}

export function roleHomePath(role: UserRole): string {
  if (role === 'admin') return '/admin';
  return role === 'developer' ? '/dashboard' : '/tester/dashboard';
}

export function defaultSessionPath(session: AuthSession): string {
  if (session.role === 'admin') return '/admin';
  return roleHomePath(session.role);
}

export function routeRole(pathname: string): UserRole | 'public' {
  const adminRoutes = new Set(['/admin']);
  const developerRoutes = new Set([
    '/dashboard',
    '/post-job',
    '/billing',
    '/report-details',
    '/developer/jobs',
    '/developer/submissions',
    '/developer/activity',
    '/report-details/attachments',
    '/billing/payment-methods',
  ]);
  const testerRoutes = new Set([
    '/tester/dashboard',
    '/tester-jobs',
    '/active-test',
    '/test-lab',
    '/tester/profile',
    '/tester/earnings',
    '/tester/payments',
    '/tester/reports',
    '/tester/submissions',
    '/tester/settings',
    '/tester/menu',
    '/tester/notifications',
    '/tester/payout-method',
    '/tester/leaderboard',
    '/tester/level-benefits',
    '/tester/referrals',
  ]);
  if (adminRoutes.has(pathname)) return 'admin';
  if (developerRoutes.has(pathname)) return 'developer';
  if (testerRoutes.has(pathname)) return 'tester';
  return 'public';
}

export function isSafeInternalPath(path: string): boolean {
  return path.startsWith('/') && !path.startsWith('//');
}

export function resolvePostLoginPath(sessionOrRole: AuthSession | UserRole, nextPath: string | null): string {
  const session = typeof sessionOrRole === 'string' ? null : sessionOrRole;
  const roles = session ? session.roles : [sessionOrRole as UserRole];
  const fallbackPath = session ? defaultSessionPath(session) : roleHomePath(sessionOrRole as UserRole);

  if (!nextPath || !isSafeInternalPath(nextPath)) return fallbackPath;
  const targetRole = routeRole(nextPath);
  if (targetRole === 'public' || roles.includes(targetRole)) return nextPath;
  return fallbackPath;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
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
        setSession(null);
        setLoading(false);
        return;
      }

      try {
        const profileSession = await readProfileSession(authSession.user.id, authSession.user.email ?? '');
        if (!mounted) return;
        if (profileSession) {

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
          createNotification({
            userId: data.user.id,
            title: 'Welcome to SQUASH! 🚀',
            body: "We're excited to have you here. Let's get you set up!",
            type: 'security',
            linkPath: role === 'tester' ? '/tester/profile' : '/developer/settings',
          }).catch(console.error);

          if (role === 'tester') {
            createNotification({
              userId: data.user.id,
              title: 'Profile Reminder 📝',
              body: 'Complete your profile! Add your devices and specializations to unlock higher-paying jobs.',
              type: 'security',
              linkPath: '/tester/profile',
            }).catch(console.error);
          }

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
            redirectTo: `${window.location.origin}/auth/callback?role=${role}`,
            queryParams: {
              role,
            },
          },
        });

        if (error) throw error;
      },
      refreshSessionProfile: async () => {
        if (!isSupabaseConfigured) return session;

        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (!data.user) return null;

        const profileSession = await readProfileSession(data.user.id, data.user.email ?? session?.email ?? '');
        if (profileSession) {

          setSession(profileSession);
        }
        return profileSession;
      },
      activateRole: async (role) => {
        if (!session || !session.roles.includes(role)) return session;

        const nextSession: AuthSession = { ...session, role };
        setSession(nextSession);


        if (isSupabaseConfigured && session.userId) {
          const { error } = await supabase.from('profiles').update({ role }).eq('id', session.userId);
          if (error) throw error;
        }

        return nextSession;
      },
      addRole: async (role) => {
        if (!session?.userId || false) {
          throw new Error('Please log in with a real account before adding another workspace.');
        }

        if (role === 'developer') {
          const { error } = await supabase.from('developer_profiles').upsert({
            user_id: session.userId,
            company_name: session.name,
            billing_email: session.email,
          });
          if (error) throw error;
        } else {
          const { error } = await supabase.from('tester_profiles').upsert({ user_id: session.userId });
          if (error) throw error;
        }

        const roles = normalizeRoles([...session.roles, role]);
        const nextSession: AuthSession = { ...session, role, roles };
        const { error: profileError } = await supabase.from('profiles').update({ role }).eq('id', session.userId);
        if (profileError) throw profileError;
        setSession(nextSession);
        return nextSession;
      },
      resetPasswordForEmail: async (email: string) => {
        if (!isSupabaseConfigured) {
          return;
        }
        const redirectTo = `${window.location.origin}/reset-password`;
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
          redirectTo,
        });
        if (error) throw error;
      },
      updatePassword: async (newPassword: string) => {
        if (!isSupabaseConfigured) {
          return;
        }
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (error) throw error;
      },
      logout: async () => {
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


