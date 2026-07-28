import { AlertCircle } from 'lucide-react';
import { Link } from 'react-router';
import { useAuth } from './auth';

export default function SquashNotFoundPage() {
  const { session } = useAuth();

  return (
    <div className="grid min-h-screen place-items-center bg-[#f8fafc] px-4 text-slate-900">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-600">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-900">404</h1>
        <p className="mt-2 text-lg font-semibold text-slate-800">Page not found</p>
        <p className="mt-3 text-slate-600">
          This destination has not been built yet, or the URL is incorrect.
        </p>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Go to Home
          </Link>
          <Link
            to={session?.role === 'developer' ? '/dashboard' : session?.role === 'tester' ? '/tester-jobs' : '/login'}
            className="rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700"
          >
            {session ? 'Go to Dashboard' : 'Go to Login'}
          </Link>
        </div>
      </div>
    </div>
  );
}
