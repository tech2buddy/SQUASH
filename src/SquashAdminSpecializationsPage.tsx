import {
  BadgeCheck,
  Bell,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  ExternalLink,
  FileImage,
  FileText,
  Home,
  LockKeyhole,
  ShieldCheck,
  Users,
  Video,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from './auth';
import { getSpecializationLabel, getSpecializationOption } from './components/testerSpecializations';
import {
  getChallengePrompt,
  getSpecializationCoverage,
  getSpecializationEvidenceUrl,
  getSpecializationMatchQuality,
  isSpecializationActive,
  listApprovedSpecializations,
  listPendingSpecializations,
  revokeSpecialization,
  reviewSpecialization,
  type MatchQualityRow,
  type PendingSpecializationReview,
  type SpecializationCoverageRow,
} from './lib/specializationApi';

type IssuedChallenge = {
  promptText: string;
  issuedAt: string;
  answeredWithinWindow: boolean;
};

function formatDate(value: string | null) {
  if (!value) return 'Unknown';
  return new Intl.DateTimeFormat('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function SquashAdminSpecializationsPage() {
  const { session } = useAuth();
  const [queue, setQueue] = useState<PendingSpecializationReview[]>([]);
  const [coverage, setCoverage] = useState<SpecializationCoverageRow[]>([]);
  const [matchQuality, setMatchQuality] = useState<MatchQualityRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<'approved' | 'rejected' | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [issuedChallenge, setIssuedChallenge] = useState<IssuedChallenge | null>(null);
  const [approved, setApproved] = useState<PendingSpecializationReview[]>([]);
  const [revoking, setRevoking] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [pending, verified, coverageRows, quality] = await Promise.all([
        listPendingSpecializations(),
        listApprovedSpecializations(),
        getSpecializationCoverage(),
        getSpecializationMatchQuality(),
      ]);
      setQueue(pending);
      setApproved(verified);
      setCoverage(coverageRows);
      setMatchQuality(quality);
      setSelectedId((current) =>
        pending.some((item) => item.id === current) ? current : pending[0]?.id || null,
      );
      setNotes((current) =>
        Object.fromEntries(pending.map((item) => [item.id, current[item.id] || ''])),
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'Could not load the verification queue.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  // The prompt this tester was actually given. Without it a reviewer cannot do
  // the one check that catches a borrowed or reused recording: does the answer
  // fit the question that was asked?
  useEffect(() => {
    if (!selectedId) {
      setIssuedChallenge(null);
      return;
    }
    let active = true;
    getChallengePrompt(selectedId)
      .then((prompt) => {
        if (active) setIssuedChallenge(prompt);
      })
      .catch(() => {
        if (active) setIssuedChallenge(null);
      });
    return () => {
      active = false;
    };
  }, [selectedId]);

  const selected = useMemo(
    () => queue.find((item) => item.id === selectedId) || null,
    [queue, selectedId],
  );
  const adminName = session?.name || 'Owner Admin';

  // Only keys that gate a paid test type matter here -- an unverifiable key like
  // "Budget Android" is a preference, not a claim anyone is paying extra for.
  const gatedCoverage = useMemo(
    () => coverage.filter((row) => row.requiresVerification),
    [coverage],
  );

  const decide = async (decision: 'approved' | 'rejected') => {
    if (!selected) return;
    const note = notes[selected.id] || '';
    if (decision === 'rejected' && note.trim().length < 10) {
      setError('Add a clear reviewer note before rejecting a specialization.');
      return;
    }
    const label = getSpecializationLabel(selected.key);
    const action = decision === 'approved' ? 'verify' : 'reject';
    if (!window.confirm(`Are you sure you want to ${action} ${selected.testerName}'s "${label}"?`)) {
      return;
    }

    setUpdating(decision);
    setError('');
    setNotice('');
    try {
      await reviewSpecialization(selected.id, decision, note);
      setNotice(
        decision === 'approved'
          ? `${selected.testerName} is now verified for ${label} and can apply to those jobs.`
          : `${selected.testerName}'s ${label} claim was rejected.`,
      );
      await load();
    } catch (reviewError) {
      setError(
        reviewError instanceof Error ? reviewError.message : 'Could not save this decision.',
      );
    } finally {
      setUpdating(null);
    }
  };

  const revoke = async (item: PendingSpecializationReview) => {
    const label = getSpecializationLabel(item.key);
    // Free text rather than a preset list: the reason is permanent, it is the
    // record of an accusation against a real person, and the RPC rejects
    // anything under 20 characters precisely so it cannot be a shrug.
    const reason = window.prompt(
      `Why is ${item.testerName}'s "${label}" verification being revoked?\n\nThis is recorded permanently and counts as a strike. A second strike pauses them from all specialized test types for 180 days.`,
      '',
    );
    if (reason === null) return;
    if (reason.trim().length < 20) {
      setError('Give a specific written reason of at least 20 characters when revoking.');
      return;
    }

    setRevoking(item.id);
    setError('');
    setNotice('');
    try {
      const result = await revokeSpecialization(item.id, reason);
      const parts = [`${label} revoked for ${item.testerName} (strike ${result.strikes}).`];
      if (result.blockedUntil) {
        parts.push(
          `They are now paused from all specialized test types until ${formatDate(result.blockedUntil)}.`,
        );
      }
      if (result.affectedSubmissions > 0) {
        // Money is never moved as a side effect of revocation -- the admin is
        // told what is in flight and decides separately.
        parts.push(
          `${result.affectedSubmissions} in-flight submission${
            result.affectedSubmissions === 1 ? '' : 's'
          } relied on this claim and need${result.affectedSubmissions === 1 ? 's' : ''} a separate review.`,
        );
      }
      setNotice(parts.join(' '));
      await load();
    } catch (revokeError) {
      setError(
        revokeError instanceof Error ? revokeError.message : 'Could not revoke this verification.',
      );
    } finally {
      setRevoking('');
    }
  };

  const openEvidence = async (path: string) => {
    const url = await getSpecializationEvidenceUrl(path);
    if (!url) {
      setError('Could not open that evidence file.');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const navItems = [
    { label: 'Overview', href: '/A31/dashboard', icon: Home },
    { label: 'Qualifications', href: '/A31/qualifications', icon: BadgeCheck },
    { label: 'Sample Test Template', href: '/A31/qualification-template', icon: BadgeCheck },
    { label: 'Specializations', href: '/A31/specializations', icon: ShieldCheck, active: true },
    { label: 'Probation watch', href: '/A31/probation', icon: Clock3 },
    { label: 'Payout Queue', href: '/A31/payouts', icon: FileText },
    { label: 'Users', href: '/A31/users', icon: Users },
    { label: 'Reports', href: '/A31/reports', icon: ClipboardCheck },
    { label: 'Security', href: '/A31/security', icon: LockKeyhole },
  ];

  const matched = matchQuality.find((row) => row.matched);
  const unmatched = matchQuality.find((row) => !row.matched);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 lg:h-screen lg:overflow-hidden">
      <div className="grid min-h-screen lg:h-screen lg:grid-cols-[260px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-white lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto">
          <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-6">
            <img
              src="/squash-logo.png"
              alt="SQUASH logo"
              className="h-11 w-11 rounded-2xl border border-slate-200 object-cover shadow-sm"
            />
            <a href="/" className="text-2xl font-black tracking-tight text-slate-900 hover:text-green-700">
              SQUASH
            </a>
          </div>
          <nav className="flex-1 space-y-2 px-4 py-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    item.active ? 'bg-green-50 text-green-700' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </a>
              );
            })}
          </nav>
          <div className="p-4 pt-0">
            <div className="rounded-3xl border border-green-100 bg-green-50 p-5 text-sm leading-6 text-slate-700">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <ShieldCheck className="h-5 w-5 text-green-700" />
                What you are certifying
              </div>
              <p className="mt-2">
                Approving means SQUASH vouches for this claim to a paying developer. If the evidence
                does not clearly show the language, network or assistive technology, reject it.
              </p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 lg:h-screen lg:overflow-y-auto">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                  <BadgeCheck className="h-3.5 w-3.5" /> Private administrator workspace
                </div>
                <h1 className="mt-2 text-xl font-black text-slate-950 sm:text-2xl">
                  Specialization verification
                </h1>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <Bell className="h-5 w-5 text-slate-500" />
                <div className="hidden sm:block">
                  <div className="text-sm font-bold text-slate-900">{adminName}</div>
                  <div className="text-xs text-slate-500">Admin</div>
                </div>
              </div>
            </div>
          </header>

          <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {notice ? (
              <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
                {notice}
              </div>
            ) : null}
            {error ? (
              <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {error}
              </div>
            ) : null}

            {/* Coverage: the answer to "how many verified isiZulu testers do you have?" */}
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="font-black text-slate-900">Verified coverage</h2>
              <p className="mt-1 text-sm text-slate-500">
                Only verified testers can be staffed onto Localization, Low-Data and Accessibility
                jobs. A key with too few verified testers cannot fill its minimum tester count.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {gatedCoverage.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Nothing verified yet — the queue below is where that starts.
                  </p>
                ) : (
                  gatedCoverage.map((row) => (
                    <div key={row.key} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <div className="text-sm font-bold text-slate-800">
                        {getSpecializationLabel(row.key)}
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-950">{row.approved}</span>
                        <span className="text-xs font-semibold text-slate-500">verified</span>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {row.pending} awaiting review · {row.declared} unverified claims
                      </div>
                      {row.expired > 0 || row.revoked > 0 ? (
                        <div className="mt-1 text-xs font-semibold text-amber-700">
                          {row.expired > 0 ? `${row.expired} expired` : ''}
                          {row.expired > 0 && row.revoked > 0 ? ' · ' : ''}
                          {row.revoked > 0 ? `${row.revoked} revoked` : ''}
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Match quality: is phase 14's matching actually earning its keep? */}
            <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="font-black text-slate-900">Match quality</h2>
              <p className="mt-1 text-sm text-slate-500">
                Approval rate of reviewed submissions, split by whether the tester matched the job's
                preferred specializations. If the two are the same, the matching is not earning its
                keep.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  { label: 'Specialization match', row: matched },
                  { label: 'No match', row: unmatched },
                ].map((entry) => (
                  <div key={entry.label} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="text-sm font-bold text-slate-800">{entry.label}</div>
                    <div className="mt-2 text-2xl font-black text-slate-950">
                      {entry.row ? `${Math.round(entry.row.approvalRate * 100)}%` : '—'}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {entry.row
                        ? `${entry.row.approved} approved of ${entry.row.submissions} reviewed`
                        : 'Not enough reviewed submissions yet'}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Revocation. Verification is a snapshot; this is what makes it
                continuous — and what gives a caught tester something to lose. */}
            {!loading && approved.length > 0 ? (
              <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="font-black text-slate-900">Currently verified</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Revoking blocks the tester from that test type immediately and records a strike. It
                  does not touch money — any in-flight work is reported so you can review it
                  separately.
                </p>
                <div className="mt-4 divide-y divide-slate-100">
                  {approved.map((item) => {
                    const lapsed = !isSpecializationActive(item);
                    return (
                      <div
                        key={item.id}
                        className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="truncate font-bold text-slate-900">{item.testerName}</div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-bold text-slate-700">
                              {getSpecializationLabel(item.key)}
                            </span>
                            <span>verified {formatDate(item.verifiedAt)}</span>
                            {item.expiresAt ? (
                              <span
                                className={
                                  lapsed ? 'font-bold text-amber-700' : 'text-slate-500'
                                }
                              >
                                {lapsed ? 'expired' : 'expires'} {formatDate(item.expiresAt)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={revoking === item.id}
                          onClick={() => void revoke(item)}
                          className="shrink-0 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                        >
                          {revoking === item.id ? 'Revoking...' : 'Revoke'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {loading ? (
              <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-500 shadow-sm">
                Loading verification queue...
              </div>
            ) : null}

            {!loading && queue.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
                <h2 className="mt-3 text-xl font-black text-slate-950">Verification queue is clear</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Evidence submitted by testers will appear here for review.
                </p>
              </div>
            ) : null}

            {!loading && selected ? (
              <div className="mt-6 grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
                <section className="h-fit overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-5 py-4">
                    <h2 className="font-black text-slate-900">Review queue</h2>
                    <p className="mt-1 text-xs text-slate-500">Oldest submissions first</p>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {queue.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => {
                          setSelectedId(item.id);
                          setError('');
                          setNotice('');
                        }}
                        className={`w-full p-5 text-left transition ${
                          selectedId === item.id ? 'bg-green-50/70' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="truncate font-bold text-slate-900">{item.testerName}</div>
                          <div className="mt-1 truncate text-xs text-slate-500">{item.testerEmail}</div>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-2 text-xs">
                          <span className="rounded-full bg-slate-100 px-2 py-1 font-bold text-slate-700">
                            {getSpecializationLabel(item.key)}
                          </span>
                          <span className="text-slate-400">{formatDate(item.submittedAt)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="min-w-0 space-y-5">
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                      {getSpecializationLabel(selected.key)}
                    </span>
                    <h2 className="mt-3 text-2xl font-black text-slate-950">{selected.testerName}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {selected.testerEmail} · submitted {formatDate(selected.submittedAt)}
                    </p>
                    {issuedChallenge ? (
                      <div className="mt-4 rounded-2xl border border-slate-900 bg-slate-900 p-4 text-white">
                        <div className="text-[11px] font-black uppercase tracking-wider text-green-400">
                          Randomised prompt issued to this tester
                        </div>
                        <p className="mt-2 text-sm font-bold leading-6">{issuedChallenge.promptText}</p>
                        <p className="mt-2 text-[11px] font-semibold text-slate-300">
                          Check the recording answers <em>this</em> question. A response that does not
                          fit was almost certainly recorded before the prompt was issued.
                        </p>
                        {!issuedChallenge.answeredWithinWindow ? (
                          <p className="mt-2 rounded-lg bg-red-500/20 px-2.5 py-1.5 text-[11px] font-bold text-red-200">
                            Submitted outside the 30-minute window.
                          </p>
                        ) : null}
                      </div>
                    ) : getSpecializationOption(selected.key)?.evidenceHint ? (
                      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                        <strong className="text-slate-800">What was asked for:</strong>{' '}
                        {getSpecializationOption(selected.key)?.evidenceHint}
                      </div>
                    ) : null}
                  </div>

                  <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="flex items-center gap-2 font-black text-slate-900">
                      <FileImage className="h-4 w-4 text-blue-600" /> Evidence
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Private malware-scanned file. Signed links expire after ten minutes.
                    </p>
                    {selected.evidencePath ? (
                      <button
                        type="button"
                        onClick={() => void openEvidence(selected.evidencePath!)}
                        className="mt-4 flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm font-semibold text-slate-700 hover:border-green-300 hover:bg-green-50"
                      >
                        <span className="flex min-w-0 items-center gap-2 truncate">
                          {/\.(mp4|webm)$/i.test(selected.evidencePath) ? (
                            <Video className="h-4 w-4 shrink-0 text-rose-600" />
                          ) : (
                            <FileImage className="h-4 w-4 shrink-0 text-blue-600" />
                          )}
                          {selected.evidenceName || 'Evidence file'}
                        </span>
                        <ExternalLink className="h-4 w-4 shrink-0 text-slate-400" />
                      </button>
                    ) : (
                      <p className="mt-4 text-sm text-slate-500">No evidence file attached.</p>
                    )}
                  </section>

                  <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
                      <div>
                        <h3 className="font-black text-slate-900">Make a verification decision</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          Verifying unlocks this tester for the premium test type that requires it.
                          Rejecting leaves the claim visible on their profile as unverified.
                        </p>
                      </div>
                    </div>
                    <textarea
                      value={notes[selected.id] || ''}
                      onChange={(event) =>
                        setNotes((current) => ({ ...current, [selected.id]: event.target.value }))
                      }
                      placeholder="Reviewer note — required to reject, optional to verify"
                      rows={3}
                      className="mt-5 w-full resize-y rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green-500"
                    />
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        disabled={updating !== null}
                        onClick={() => void decide('rejected')}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                      <button
                        type="button"
                        disabled={updating !== null}
                        onClick={() => void decide('approved')}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {updating === 'approved' ? 'Verifying...' : 'Verify specialization'}
                      </button>
                    </div>
                  </section>
                </section>
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
