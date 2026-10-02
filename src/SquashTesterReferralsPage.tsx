import {
  BriefcaseBusiness,
  CheckCircle2,
  CircleDollarSign,
  Clipboard,
  ClipboardList,
  Gift,
  Home,
  Mail,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  UserCircle2,
  Users,
  Award,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from './auth';
import TesterMobileDrawer from './components/TesterMobileDrawer';
import MobileTabBar from './components/MobileTabBar';
import {
  getReferralCode,
  getTesterReferrals,
  inviteTesterReferral,
  type TesterReferralEntry,
} from './lib/profileApi';

function statusClasses(status: string) {
  if (status === 'reward_ready') return 'bg-rose-50 text-[#e63946] ring-rose-100';
  if (status === 'approved_work') return 'bg-rose-50 text-[#e63946] ring-rose-100';
  if (status === 'signed_up') return 'bg-sky-50 text-sky-700 ring-sky-100';
  return 'bg-amber-50 text-amber-700 ring-amber-100';
}

export default function SquashTesterReferralsPage() {
  const { session } = useAuth();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [referrals, setReferrals] = useState<TesterReferralEntry[]>([]);
  const [referralCode, setReferralCode] = useState('');
  const [loadError, setLoadError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!session?.userId) return;
    let mounted = true;

    Promise.all([getTesterReferrals(session.userId), getReferralCode()])
      .then(([referralData, code]) => {
        if (!mounted) return;
        setReferrals(referralData);
        setReferralCode(code || '');
      })
      .catch((error: Error) => {
        if (mounted) setLoadError(error.message || 'Could not load your referrals right now.');
      });

    return () => {
      mounted = false;
    };
  }, [session?.userId, session?.role]);

  const testerName = session?.name || 'Tester';
  // Issued by the database rather than derived from the user id, which used to
  // leak part of a primary key into a link people paste into group chats.
  const referralLink = referralCode
    ? `https://www.squashqa.co.za/signup?role=tester&ref=${referralCode}`
    : '';
  const [email, setEmail] = useState('');
  const [inviteNotice, setInviteNotice] = useState('');
  const [copied, setCopied] = useState(false);

  const navItems = [
    { label: 'Dashboard', icon: Home, href: '/tester/dashboard' },
    { label: 'Available Jobs', icon: BriefcaseBusiness, href: '/tester-jobs' },
    { label: 'My Tests', icon: ClipboardList, href: '/active-test' },
    { label: 'Reports', icon: ClipboardList, href: '/tester/reports' },
    { label: 'Earnings', icon: CircleDollarSign, href: '/tester/earnings' },
    { label: 'Profile', icon: UserCircle2, href: '/tester/profile' },
    { label: 'Settings', icon: Settings, href: '/tester/settings' },
  ];

  const invitedCount = referrals.filter((r) => r.status === 'invited').length;
  const signedUpCount = referrals.filter((r) => r.status === 'signed_up').length;
  const rewardReadyCount = referrals.filter((r) => r.status === 'reward_ready').length;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setInviteNotice('Copy failed. You can still highlight and copy the referral link manually.');
    }
  };

  const sendInvite = async () => {
    setInviteNotice('');
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      setInviteNotice('Enter a valid email address before sending an invite.');
      return;
    }

    setSending(true);
    try {
      // Persisted, unlike the previous version, which pushed a row into React
      // state and lost it on refresh.
      const created = await inviteTesterReferral(trimmed);
      setReferrals((prev) => [created, ...prev.filter((item) => item.email !== created.email)]);
      setEmail('');
      setInviteNotice('Invite recorded. Share your link with them so it gets credited to you.');
    } catch (error) {
      setInviteNotice(error instanceof Error ? error.message : 'Could not save that invite.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto">
          <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-6">
            <img src="/squash-logo.png" alt="SQUASH logo" className="h-11 w-11 rounded-2xl border border-slate-200 object-cover shadow-sm" />
            <a href="/" className="text-2xl font-black tracking-tight text-slate-900 hover:text-[#e63946]">SQUASH</a>
          </div>
          <nav className="flex-1 space-y-2 px-4 py-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <a key={item.href} href={item.href} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </a>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(true)}
                  className="rounded-xl border border-slate-300 p-2.5 text-slate-600 lg:hidden hover:bg-slate-50 transition"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="hidden max-w-xl flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:flex md:min-w-[340px] lg:min-w-[460px]">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Search referrals, invites, rewards..." />
                </div>
              </div>
              <a href="/tester/profile" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700">{testerName.charAt(0)}</div>
                <div className="hidden sm:block"><div className="text-sm font-bold text-slate-900">{testerName}</div><div className="text-xs text-slate-500">Tester</div></div>
              </a>
            </div>
          </header>

          <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-[#e63946] ring-1 ring-rose-100">
                  <Gift className="h-4 w-4" /> Referrals
                </div>
                <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">Invite everyday testers</h1>
                <p className="mt-2 max-w-2xl text-slate-600">Grow the SQUASH tester community with trusted people who have useful devices, network conditions and language experience.</p>
              </div>
              <a href="/tester-jobs" className="w-fit rounded-2xl bg-[#e63946] px-5 py-3 font-semibold text-white shadow-sm hover:bg-[#d62828]">Find Tests</a>
            </div>

            <section className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="text-sm font-semibold text-slate-500">Invites sent</div><div className="mt-2 text-3xl font-black text-slate-900">{invitedCount}</div></div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="text-sm font-semibold text-slate-500">Signed up</div><div className="mt-2 text-3xl font-black text-slate-900">{signedUpCount}</div></div>
              <div className="rounded-3xl border border-rose-100 bg-rose-50 p-5 shadow-sm"><div className="text-sm font-semibold text-[#e63946]">Reward ready</div><div className="mt-2 text-3xl font-black text-slate-900">{rewardReadyCount}</div></div>
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.85fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Your referral link</h2>
                    <p className="mt-1 text-sm text-slate-600">Share this with people you trust. Rewards should only unlock after approved work.</p>
                  </div>
                  <Gift className="h-8 w-8 text-[#1d1d1f]" />
                </div>
                <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Referral code</div>
                  <div className="mt-2 text-3xl font-black tracking-tight text-slate-900">{referralCode || '·······'}</div>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <input readOnly value={referralLink} placeholder="Generating your link..." className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 outline-none" />
                    <button type="button" disabled={!referralLink} onClick={copyLink} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#e63946] px-5 py-3 font-semibold text-white hover:bg-[#d62828] disabled:opacity-50">
                      {copied ? <CheckCircle2 className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900">Send an invite</h2>
                <p className="mt-1 text-sm text-slate-600">
                  We'll record the invite so it is credited to you. Send them your link above — that
                  is what links their signup to your account.
                </p>
                <div className="mt-5 flex flex-col gap-3">
                  <label className="block"><span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"><Mail className="h-4 w-4 text-slate-400" /> Email address</span><input value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#e63946]" placeholder="friend@example.com" /></label>
                  <button type="button" disabled={sending} onClick={() => void sendInvite()} className="rounded-2xl bg-[#e63946] px-5 py-3 font-semibold text-white shadow-sm hover:bg-[#d62828] disabled:opacity-50">{sending ? 'Saving...' : 'Save invite'}</button>
                </div>
                {inviteNotice ? <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-[#e63946]">{inviteNotice}</div> : null}
              </div>
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-5">
                  <h2 className="text-2xl font-bold text-slate-900">Referral tracker</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Everyone you have invited, and how far they have got.
                  </p>
                </div>
                {loadError ? (
                  <div className="px-6 py-4 text-sm font-semibold text-red-700">{loadError}</div>
                ) : null}
                {!loadError && referrals.length === 0 ? (
                  <div className="px-6 py-10 text-center">
                    <Users className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-3 text-sm font-semibold text-slate-600">No referrals yet</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Share your link above — referrals are credited when someone signs up through it.
                    </p>
                  </div>
                ) : null}
                <div className="divide-y divide-slate-100">
                  {referrals.map((referral) => (
                    <div key={referral.id} className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-50 text-slate-600 ring-1 ring-slate-200"><Users className="h-5 w-5" /></div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-900">{referral.name}</div>
                          <div className="text-xs text-slate-500">{referral.email}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${statusClasses(referral.status)}`}>
                          {referral.status === 'reward_ready' && <Award className="h-3 w-3" />}
                          {referral.status.replace('_', ' ').toUpperCase()}
                        </div>
                        <div className="mt-1 text-[10px] text-slate-400">{referral.detail}</div>
                      </div>
                    </div>
                  ))}
                  {referrals.length === 0 ? <div className="px-6 py-10 text-center text-sm text-slate-500">No referrals prepared yet.</div> : null}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-3xl border border-rose-100 bg-rose-50 p-6 shadow-sm">
                  <div className="flex items-start gap-3"><ShieldCheck className="mt-1 h-6 w-6 text-[#1d1d1f]" /><div><h2 className="text-2xl font-bold text-slate-900">Reward safety</h2><p className="mt-2 text-sm leading-6 text-slate-700">Referral rewards should only be reviewed after the invited tester signs up, completes real work, and has an approved submission.</p></div></div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-2xl font-bold text-slate-900">Who to invite</h2>
                  <div className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
                    <div className="flex gap-2"><span className="text-[#e63946]">?</span><span>People with real devices and honest feedback.</span></div>
                    <div className="flex gap-2"><span className="text-[#e63946]">?</span><span>Users from different network conditions and locations.</span></div>
                    <div className="flex gap-2"><span className="text-[#e63946]">?</span><span>People who can write clear, respectful reports.</span></div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
      <MobileTabBar role="tester" />
      <TesterMobileDrawer isOpen={isMobileDrawerOpen} onClose={() => setIsMobileDrawerOpen(false)} activePath="/tester/referrals" />
    </div>
  );
}
