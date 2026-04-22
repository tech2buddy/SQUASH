import { createContext, useContext, useMemo, useState } from 'react';

export type UserRole = 'developer' | 'tester';

type AuthSession = {
  role: UserRole;
  email: string;
  name: string;
  isAuthenticated: true;
};

type LoginPayload = {
  role: UserRole;
  email: string;
  name: string;
};

type AuthContextValue = {
  session: AuthSession | null;
  login: (payload: LoginPayload) => void;
  logout: () => void;
};

const STORAGE_KEY = 'squash_auth_session_v1';

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredSession(): AuthSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.role || !parsed?.email || !parsed?.name || !parsed?.isAuthenticated) return null;
    if (parsed.role !== 'developer' && parsed.role !== 'tester') return null;
    return parsed;
  } catch {
    return null;
  }
}

function persistSession(session: AuthSession | null) {
  try {
    if (!session) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // no-op: if storage is unavailable, session remains in-memory
  }
}

export function roleHomePath(role: UserRole): string {
  return role === 'developer' ? '/dashboard' : '/tester-jobs';
}

export function routeRole(pathname: string): UserRole | 'public' {
  const developerRoutes = new Set(['/dashboard', '/post-job', '/report-details']);
  const testerRoutes = new Set(['/tester-jobs', '/active-test']);
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
  const [session, setSession] = useState<AuthSession | null>(() => readStoredSession());

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      login: (payload) => {
        const nextSession: AuthSession = {
          role: payload.role,
          email: payload.email,
          name: payload.name,
          isAuthenticated: true,
        };
        setSession(nextSession);
        persistSession(nextSession);
      },
      logout: () => {
        setSession(null);
        persistSession(null);
      },
    }),
    [session],
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
