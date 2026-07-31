import { Loader2, LockKeyhole } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../auth';
import { getTesterQualificationStatus, type QualificationStatus } from '../lib/testerQualificationApi';

const ALLOWED_BEFORE_APPROVAL = [
  '/tester-qualification',
  '/tester/profile',
  '/tester/settings',
];

function isAllowedBeforeApproval(pathname: string) {
  return ALLOWED_BEFORE_APPROVAL.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export default function TesterQualificationGate() {
  const { session } = useAuth();
  const location = useLocation();
  const [status, setStatus] = useState<QualificationStatus | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session?.userId) return;
    let active = true;
    setStatus(null);
    setError('');
    const refreshStatus = async () => {
      try {
        const nextStatus = await getTesterQualificationStatus(session.userId!);
        if (active) {
          setStatus(nextStatus);
          setError('');
        }
      } catch {
        if (active) setError('We could not confirm your Tester Academy status. Please refresh and try again.');
      }
    };
    void refreshStatus();
    const interval = window.setInterval(() => { void refreshStatus(); }, 30_000);
    window.addEventListener('focus', refreshStatus);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshStatus);
    };
  }, [session?.userId]);

  if (error) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] p-6"><div className="max-w-md rounded-3xl border border-rose-200 bg-white p-7 text-center shadow-sm"><LockKeyhole className="mx-auto h-8 w-8 text-rose-600" /><h1 className="mt-4 text-xl font-black text-slate-950">Tester Academy status unavailable</h1><p className="mt-2 text-sm leading-6 text-slate-600">{error}</p></div></div>;
  }

  if (!status) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] text-sm font-semibold text-slate-600"><Loader2 className="mr-2 h-5 w-5 animate-spin text-green-600" />Checking Tester Academy access...</div>;
  }

  if (status === 'approved') {
    if (location.pathname === '/tester-qualification' || location.pathname.startsWith('/tester-qualification/')) return <Navigate to="/tester/dashboard" replace />;
    return <Outlet />;
  }

  if (!isAllowedBeforeApproval(location.pathname)) return <Navigate to="/tester-qualification" replace />;
  return <Outlet />;
}
