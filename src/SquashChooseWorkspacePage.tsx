import { BriefcaseBusiness, ClipboardList, ShieldCheck, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { roleHomePath, useAuth, type WorkspaceRole } from './auth';

export default function SquashChooseWorkspacePage() {
  const { session, loading, activateRole, addRole } = useAuth();
  const navigate = useNavigate();
  const [busyRole, setBusyRole] = useState<WorkspaceRole | null>(null);
  const [error, setError] = useState('');

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 text-center text-sm font-semibold text-slate-600">
        Loading your SQUASH workspace...
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  const chooseRole = async (role: WorkspaceRole) => {
    setBusyRole(role);
    setError('');
    try {
      if (session.roles.includes(role)) {
        await activateRole(role);
      } else {
        await addRole(role);
      }
      navigate(roleHomePath(role), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to open this workspace right now.');
    } finally {
      setBusyRole(null);
    }
  };

  const cards = [
    {
      role: 'developer' as const,
      title: 'Developer Workspace',
      description: 'Post jobs, manage testers, review reports and handle billing.',
      icon: BriefcaseBusiness,
      cta: session.roles.includes('developer') ? 'Continue as Developer' : 'Add Developer Workspace',
    },
    {
      role: 'tester' as const,
      title: 'Tester Workspace',
      description: 'Find tests, submit reports, track earnings and manage payout details.',
      icon: ClipboardList,
      cta: session.roles.includes('tester') ? 'Continue as Tester' : 'Add Tester Workspace',
    },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fff1f2_0%,#f8fafc_45%,#f8fafc_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-3">
            <img
              src="/squash-logo.png"
              alt="SQUASH logo"
              className="h-11 w-11 rounded-2xl border border-slate-200 object-cover shadow-sm"
            />
            <span className="text-3xl font-black tracking-tight text-slate-900">SQUASH</span>
          </a>
          <div className="flex items-center gap-2">
            <a href="/logout" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Sign out
            </a>
          </div>
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-[#e63946]">
            <ShieldCheck className="h-4 w-4" /> Secure workspace access
          </div>
          <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">Choose your workspace</h1>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">
            Welcome, {session.name}. Your account can safely use one or both sides of SQUASH.
          </p>
        </div>

        {error ? (
          <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        ) : null}

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {cards.map((card) => {
            const Icon = card.icon;
            const hasAccess = session.roles.includes(card.role);
            return (
              <div key={card.role} className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1d1d1f] text-white ring-1 ring-black/10">
                  <Icon className="h-7 w-7" />
                </div>
                <h2 className="mt-5 text-2xl font-black text-slate-900">{card.title}</h2>
                <p className="mt-3 leading-7 text-slate-600">{card.description}</p>
                <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-slate-500">
                  <UserRound className="h-4 w-4" />
                  {hasAccess ? 'Already enabled on your account' : 'Can be added to this same account'}
                </div>
                <button
                  type="button"
                  onClick={() => chooseRole(card.role)}
                  disabled={busyRole !== null}
                  className={`mt-6 w-full rounded-2xl px-5 py-3 font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:bg-slate-300 ${
                    hasAccess
                      ? 'bg-[#e63946] text-white hover:bg-[#d62828]'
                      : 'border border-rose-200 bg-rose-50 text-[#e63946] hover:bg-rose-100'
                  }`}
                >
                  {busyRole === card.role ? 'Opening...' : card.cta}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
