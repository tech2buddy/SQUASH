import { useEffect, useState } from 'react';
import { useAuth } from './auth';
import {
  createModerationCase,
  createOperationalIncident,
  getAdminSupportTickets,
  getOperationalReadiness,
  updateSupportTicket,
  type ModerationCase,
  type OperationalIncident,
  type OperationalPlaybook,
  type SupportPriority,
  type SupportStatus,
  type SupportTicket,
} from './lib/supportApi';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function SquashAdminOperationsPage() {
  const { session } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [playbooks, setPlaybooks] = useState<OperationalPlaybook[]>([]);
  const [incidents, setIncidents] = useState<OperationalIncident[]>([]);
  const [moderationCases, setModerationCases] = useState<ModerationCase[]>([]);
  const [ticketDrafts, setTicketDrafts] = useState<Record<string, { status: SupportStatus; priority: SupportPriority; note: string }>>({});
  const [incident, setIncident] = useState({ title: '', severity: 'sev3' as OperationalIncident['severity'], impact: '' });
  const [moderation, setModeration] = useState({ subjectUserId: '', jobId: '', reason: '', severity: 'medium' as ModerationCase['severity'], payoutHold: false });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setError('');
    try {
      const [support, operations] = await Promise.all([getAdminSupportTickets(), getOperationalReadiness()]);
      setTickets(support);
      setPlaybooks(operations.playbooks);
      setIncidents(operations.incidents);
      setModerationCases(operations.moderationCases);
      setTicketDrafts((current) => {
        const next = { ...current };
        support.forEach((ticket) => {
          next[ticket.id] ||= { status: ticket.status, priority: ticket.priority, note: ticket.adminNote || '' };
        });
        return next;
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load operations.');
    }
  };

  useEffect(() => { load(); }, []);

  const saveTicket = async (ticket: SupportTicket) => {
    const draft = ticketDrafts[ticket.id];
    setBusyId(ticket.id);
    setError('');
    try {
      await updateSupportTicket({ ticketId: ticket.id, ...draft });
      setNotice(`Support ticket "${ticket.subject}" was updated.`);
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not update this ticket.');
    } finally {
      setBusyId(null);
    }
  };

  const addIncident = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!session?.userId) return;
    setBusyId('incident');
    setError('');
    try {
      await createOperationalIncident({ ...incident, ownerAdmin: session.userId });
      setIncident({ title: '', severity: 'sev3', impact: '' });
      setNotice('Incident opened and recorded.');
      await load();
    } catch (incidentError) {
      setError(incidentError instanceof Error ? incidentError.message : 'Could not open the incident.');
    } finally {
      setBusyId(null);
    }
  };

  const addModerationCase = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!session?.userId) return;
    setBusyId('moderation');
    setError('');
    try {
      await createModerationCase({ ...moderation, createdBy: session.userId });
      setModeration({ subjectUserId: '', jobId: '', reason: '', severity: 'medium', payoutHold: false });
      setNotice('Moderation case opened and recorded.');
      await load();
    } catch (moderationError) {
      setError(moderationError instanceof Error ? moderationError.message : 'Could not open the moderation case.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div><div className="text-xs font-bold uppercase tracking-wide text-green-700">Admin operations</div><h1 className="mt-1 text-3xl font-black">Support, moderation and incidents</h1></div>
          <div className="flex gap-2"><a href="/A31/dashboard" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold">Dashboard</a><button onClick={load} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">Refresh</button></div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div> : null}
        {notice ? <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">{notice}</div> : null}

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6"><h2 className="text-2xl font-bold">Support inbox</h2><p className="mt-1 text-sm text-slate-600">Overdue requests are highlighted. Safety/privacy and financial issues receive shorter response targets.</p></div>
          <div className="grid gap-4 p-5 xl:grid-cols-2">
            {tickets.map((ticket) => {
              const draft = ticketDrafts[ticket.id] || { status: ticket.status, priority: ticket.priority, note: '' };
              return (
                <article key={ticket.id} className={`rounded-3xl border p-5 ${ticket.isOverdue ? 'border-red-300 bg-red-50/40' : 'border-slate-200'}`}>
                  <div className="flex items-start justify-between gap-3"><div><div className="font-bold">{ticket.subject}</div><div className="text-sm text-slate-500">{ticket.userName} · {ticket.userEmail}</div></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize">{ticket.category}</span></div>
                  <p className="mt-4 text-sm leading-6 text-slate-700">{ticket.description}</p>
                  <div className={`mt-3 text-xs font-semibold ${ticket.isOverdue ? 'text-red-700' : 'text-slate-500'}`}>{ticket.isOverdue ? 'Response overdue' : 'Respond by'}: {formatDate(ticket.responseDueAt)}</div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <select value={draft.status} onChange={(event) => setTicketDrafts((current) => ({ ...current, [ticket.id]: { ...draft, status: event.target.value as SupportStatus } }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                      {['open', 'in_progress', 'waiting_user', 'resolved', 'closed'].map((value) => <option key={value} value={value}>{value.replace('_', ' ')}</option>)}
                    </select>
                    <select value={draft.priority} onChange={(event) => setTicketDrafts((current) => ({ ...current, [ticket.id]: { ...draft, priority: event.target.value as SupportPriority } }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                      {['low', 'normal', 'high', 'urgent'].map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                    <textarea value={draft.note} onChange={(event) => setTicketDrafts((current) => ({ ...current, [ticket.id]: { ...draft, note: event.target.value } }))} placeholder="Admin response or internal note" rows={2} className="rounded-xl border border-slate-200 px-3 py-2 text-sm sm:col-span-2" />
                  </div>
                  <button onClick={() => saveTicket(ticket)} disabled={busyId === ticket.id} className="mt-3 rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Save ticket</button>
                </article>
              );
            })}
            {tickets.length === 0 ? <p className="p-3 text-sm text-slate-600">No open support tickets.</p> : null}
          </div>
        </section>

        <div className="grid gap-8 xl:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">Open an incident</h2>
            <form onSubmit={addIncident} className="mt-4 space-y-3">
              <input required minLength={5} value={incident.title} onChange={(event) => setIncident({ ...incident, title: event.target.value })} placeholder="Incident title" className="w-full rounded-xl border border-slate-200 px-4 py-3" />
              <select value={incident.severity} onChange={(event) => setIncident({ ...incident, severity: event.target.value as OperationalIncident['severity'] })} className="w-full rounded-xl border border-slate-200 px-4 py-3"><option value="sev1">SEV1 - critical</option><option value="sev2">SEV2 - major</option><option value="sev3">SEV3 - moderate</option><option value="sev4">SEV4 - minor</option></select>
              <textarea required minLength={5} rows={4} value={incident.impact} onChange={(event) => setIncident({ ...incident, impact: event.target.value })} placeholder="Known or suspected impact" className="w-full rounded-xl border border-slate-200 px-4 py-3" />
              <button disabled={busyId === 'incident'} className="rounded-xl bg-red-600 px-4 py-2 font-bold text-white disabled:opacity-50">Open incident</button>
            </form>
            <div className="mt-5 space-y-2">{incidents.map((item) => <div key={item.id} className="rounded-2xl bg-slate-50 p-3 text-sm"><span className="font-bold uppercase text-red-700">{item.severity}</span> · {item.title} · <span className="capitalize">{item.status}</span></div>)}</div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">Open a moderation case</h2>
            <form onSubmit={addModerationCase} className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2"><input value={moderation.subjectUserId} onChange={(event) => setModeration({ ...moderation, subjectUserId: event.target.value })} placeholder="Subject user UUID (optional)" className="rounded-xl border border-slate-200 px-4 py-3" /><input value={moderation.jobId} onChange={(event) => setModeration({ ...moderation, jobId: event.target.value })} placeholder="Job UUID (optional)" className="rounded-xl border border-slate-200 px-4 py-3" /></div>
              <select value={moderation.severity} onChange={(event) => setModeration({ ...moderation, severity: event.target.value as ModerationCase['severity'] })} className="w-full rounded-xl border border-slate-200 px-4 py-3"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select>
              <textarea required minLength={5} rows={4} value={moderation.reason} onChange={(event) => setModeration({ ...moderation, reason: event.target.value })} placeholder="Reason and preserved evidence" className="w-full rounded-xl border border-slate-200 px-4 py-3" />
              <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={moderation.payoutHold} onChange={(event) => setModeration({ ...moderation, payoutHold: event.target.checked })} />Place documented payout hold</label>
              <button disabled={busyId === 'moderation'} className="rounded-xl bg-slate-900 px-4 py-2 font-bold text-white disabled:opacity-50">Open case</button>
            </form>
            <div className="mt-5 space-y-2">{moderationCases.map((item) => <div key={item.id} className="rounded-2xl bg-slate-50 p-3 text-sm"><span className="font-bold capitalize">{item.severity}</span> · {item.reason}{item.payoutHold ? ' · payout hold' : ''}</div>)}</div>
          </section>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Operational playbooks</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">{playbooks.map((playbook) => <article key={playbook.key} className="rounded-2xl border border-slate-200 p-5"><div className="font-bold">{playbook.title}</div><div className="mt-1 text-xs text-slate-500">Version {playbook.version}</div><p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">{playbook.content}</p></article>)}</div>
        </section>
      </main>
    </div>
  );
}
