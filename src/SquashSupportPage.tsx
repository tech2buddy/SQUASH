import { useEffect, useState } from 'react';
import PublicFooter from './PublicFooter';
import PublicHeader from './PublicHeader';
import { useAuth } from './auth';
import { createSupportTicket, getMySupportTickets, type SupportCategory, type SupportTicket } from './lib/supportApi';
import { usePageMeta } from './hooks/usePageMeta';

const categories: Array<{ value: SupportCategory; label: string }> = [
  { value: 'account', label: 'Account' },
  { value: 'payment', label: 'Developer payment' },
  { value: 'payout', label: 'Tester payout' },
  { value: 'job', label: 'Job' },
  { value: 'report', label: 'Report' },
  { value: 'safety', label: 'Safety or abuse' },
  { value: 'privacy', label: 'Privacy' },
  { value: 'other', label: 'Other' },
];

export default function SquashSupportPage() {
  usePageMeta({
    title: 'Contact & Support',
    description: 'Get help with SQUASH — contact our support team about jobs, payouts, your account, or anything else.',
    path: '/contact',
  });

  const { session, loading } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [category, setCategory] = useState<SupportCategory>('account');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadTickets = async () => {
    if (!session) return;
    try {
      setTickets(await getMySupportTickets());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load your support requests.');
    }
  };

  useEffect(() => { loadTickets(); }, [session?.userId]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (subject.trim().length < 5 || description.trim().length < 10) {
      setError('Add a clear subject and at least 10 characters of detail.');
      return;
    }
    setSubmitting(true);
    try {
      await createSupportTicket({ category, subject, description });
      setSubject('');
      setDescription('');
      setNotice('Your support request has been recorded. You can track its status below.');
      await loadTickets();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not create your support request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PublicHeader />
      <main className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <div className="inline-flex rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 ring-1 ring-green-100">SQUASH Support</div>
          <h1 className="mt-5 text-4xl font-black tracking-tight">How can we help?</h1>
          <p className="mt-3 text-lg leading-8 text-slate-600">Create a tracked request for account, payment, payout, job, report, safety or privacy help.</p>
        </div>

        {loading ? <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm">Loading your account...</div> : !session ? (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold">Sign in to contact support</h2>
            <p className="mt-2 text-slate-600">Signing in lets us link the request to your account and show you its progress.</p>
            <a href="/login?next=%2Fhelp-center" className="mt-5 inline-flex rounded-xl bg-green-600 px-5 py-3 font-bold text-white hover:bg-green-700">Sign in</a>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <form onSubmit={submit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold">New support request</h2>
              {error ? <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div> : null}
              {notice ? <div className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">{notice}</div> : null}
              <label className="mt-5 block text-sm font-semibold">Category
                <select value={category} onChange={(event) => setCategory(event.target.value as SupportCategory)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500">
                  {categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              <label className="mt-4 block text-sm font-semibold">Subject
                <input value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={160} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500" />
              </label>
              <label className="mt-4 block text-sm font-semibold">What happened?
                <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={5000} rows={7} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500" />
              </label>
              <button disabled={submitting} className="mt-5 rounded-xl bg-green-600 px-5 py-3 font-bold text-white hover:bg-green-700 disabled:opacity-50">{submitting ? 'Sending...' : 'Send request'}</button>
            </form>
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold">Your requests</h2>
              <div className="mt-4 space-y-3">
                {tickets.map((ticket) => (
                  <article key={ticket.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3"><div className="font-bold">{ticket.subject}</div><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold capitalize">{ticket.status.replace('_', ' ')}</span></div>
                    <div className="mt-2 text-xs capitalize text-slate-500">{ticket.category} · {ticket.priority} priority</div>
                    {ticket.adminNote ? <p className="mt-3 text-sm text-slate-700">{ticket.adminNote}</p> : null}
                  </article>
                ))}
                {tickets.length === 0 ? <p className="text-sm text-slate-600">You have no support requests yet.</p> : null}
              </div>
            </section>
          </div>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
