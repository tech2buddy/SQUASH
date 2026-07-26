import {
  Activity,
  Bell,
  CheckCircle2,
  CreditCard,
  FileText,
  Home,
  KeyRound,
  LockKeyhole,
  Menu,
  Plus,
  Save,
  Search,
  ShieldAlert,
  ShieldCheck,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from './auth';
import {
  getAdminActivityLogs,
  getAdminOverview,
  getAdminPayoutQueue,
  getAdminPolicies,
  getAdminUsers,
  saveAdminPolicy,
  type AdminActivityLog,
  type AdminOverview,
  type AdminPayoutRow,
  type AdminPolicyRow,
  type AdminUserRow,
} from './lib/adminApi';
import type { PolicyStatus } from './lib/supabase.types';

const emptyOverview: AdminOverview = {
  totalUsers: 0,
  developers: 0,
  testers: 0,
  activeJobs: 0,
  submittedReports: 0,
  pendingPayouts: 0,
  pendingPayoutTotalZar: 0,
};

const fallbackPolicies: AdminPolicyRow[] = [
  { id: 'fallback-terms', slug: 'terms', title: 'Terms of Service', content: 'Quality Assurance. These terms explain how SQUASH works for developers and testers.', status: 'published', version: 'v1.0', effectiveDate: null, publishedAt: null, updatedBy: null, createdAt: '', updatedAt: '' },
  { id: 'fallback-privacy', slug: 'privacy', title: 'Privacy Policy', content: 'SQUASH protects user data and uses it only to operate the platform safely.', status: 'published', version: 'v1.0', effectiveDate: null, publishedAt: null, updatedBy: null, createdAt: '', updatedAt: '' },
  { id: 'fallback-tester-code', slug: 'tester-code-of-conduct', title: 'Tester Code of Conduct', content: 'Tester standards for honest, respectful and secure testing work.', status: 'draft', version: 'v0.1', effectiveDate: null, publishedAt: null, updatedBy: null, createdAt: '', updatedAt: '' },
  { id: 'fallback-developer-terms', slug: 'developer-terms', title: 'Developer Terms', content: 'Developer responsibilities for test access, instructions and review.', status: 'draft', version: 'v0.1', effectiveDate: null, publishedAt: null, updatedBy: null, createdAt: '', updatedAt: '' },
  { id: 'fallback-payout', slug: 'payout-policy', title: 'Payout Policy', content: 'How approved tester earnings move to payout.', status: 'draft', version: 'v0.1', effectiveDate: null, publishedAt: null, updatedBy: null, createdAt: '', updatedAt: '' },
  { id: 'fallback-refund', slug: 'refund-policy', title: 'Refund Policy', content: 'How refund requests are reviewed.', status: 'draft', version: 'v0.1', effectiveDate: null, publishedAt: null, updatedBy: null, createdAt: '', updatedAt: '' },
  { id: 'fallback-dispute', slug: 'dispute-resolution', title: 'Dispute Resolution Policy', content: 'How disputes are reviewed using job evidence and communication.', status: 'draft', version: 'v0.1', effectiveDate: null, publishedAt: null, updatedBy: null, createdAt: '', updatedAt: '' },
  { id: 'fallback-popia', slug: 'popia-data-protection', title: 'POPIA Data Protection Policy', content: 'How SQUASH handles personal information responsibly.', status: 'draft', version: 'v0.1', effectiveDate: null, publishedAt: null, updatedBy: null, createdAt: '', updatedAt: '' },
];

const checklist = [
  'Supabase RLS enabled on money and user tables',
  'Admin routes protected by admin role',
  'Public signup cannot create admin accounts',
  'Payout references required before marking paid',
  'No secret keys stored in frontend code',
  'Storage buckets must be private before launch',
  'Payment webhooks must verify provider signatures',
  'Published policies visible from footer and signup links',
];

function formatRand(value: number) {
  return `R${Math.round(value).toLocaleString('en-ZA')}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

function policyDestination(slug: string) {
  const routes: Record<string, string> = {
    terms: '/terms',
    privacy: '/privacy',
    'tester-code-of-conduct': '/tester-code-of-conduct',
    'developer-terms': '/developer-terms',
    'payout-policy': '/payout-policy',
    'refund-policy': '/refund-policy',
    'dispute-resolution': '/dispute-resolution-policy',
    'popia-data-protection': '/popia-data-protection-policy',
  };
  return routes[slug] || '/help-center';
}

function statusClasses(status: PolicyStatus) {
  if (status === 'published') return 'bg-green-50 text-green-700 ring-green-100';
  if (status === 'archived') return 'bg-slate-100 text-slate-600 ring-slate-200';
  return 'bg-amber-50 text-amber-700 ring-amber-100';
}

function emptyDraft() {
  return {
    id: '',
    slug: '',
    title: '',
    content: '',
    status: 'draft' as PolicyStatus,
    version: 'v1.0',
    effectiveDate: '',
  };
}

export default function SquashAdminSecurityPage() {
  const { session } = useAuth();
  const adminName = session?.name || 'Mzwakhe Khosa';
  const [overview, setOverview] = useState<AdminOverview>(emptyOverview);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [payouts, setPayouts] = useState<AdminPayoutRow[]>([]);
  const [activityLogs, setActivityLogs] = useState<AdminActivityLog[]>([]);
  const [policies, setPolicies] = useState<AdminPolicyRow[]>([]);
  const [editingPolicy, setEditingPolicy] = useState(false);
  const [policyDraft, setPolicyDraft] = useState(emptyDraft());
  const [policyNotice, setPolicyNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [error, setError] = useState('');

  const loadSecurityData = async () => {
    setLoading(true);
    setError('');
    try {
      const [overviewResult, userResult, payoutResult, activityResult, policyResult] = await Promise.allSettled([
        getAdminOverview(),
        getAdminUsers(80),
        getAdminPayoutQueue(),
        getAdminActivityLogs(20),
        getAdminPolicies(),
      ]);

      const failedSections: string[] = [];
      const failureDetails: string[] = [];
      const trackFailure = (section: string, reason: unknown) => {
        failedSections.push(section);
        const message = reason instanceof Error ? reason.message : String(reason);
        failureDetails.push(section + ': ' + message);
      };

      if (overviewResult.status === 'fulfilled') setOverview(overviewResult.value);
      else trackFailure('overview', overviewResult.reason);

      if (userResult.status === 'fulfilled') setUsers(userResult.value);
      else trackFailure('users', userResult.reason);

      if (payoutResult.status === 'fulfilled') setPayouts(payoutResult.value);
      else trackFailure('payouts', payoutResult.reason);

      if (activityResult.status === 'fulfilled') setActivityLogs(activityResult.value);
      else trackFailure('audit trail', activityResult.reason);

      if (policyResult.status === 'fulfilled') {
        setPolicies(policyResult.value);
        if (policyResult.value.length === 0) {
          setPolicyNotice('Run supabase/phase8_policy_center.sql to turn these policy cards into saved admin-managed records.');
        }
      } else {
        trackFailure('policies', policyResult.reason);
        setPolicies([]);
        setPolicyNotice('Run supabase/phase8_policy_center.sql to enable saved policy records.');
      }

      const onlyPolicyFallback = failedSections.length === 1 && failedSections[0] === 'policies';
      if (failedSections.length && !onlyPolicyFallback) {
        setError('Some security sections could not load yet: ' + failedSections.join(', ') + '. ' + failureDetails.join(' | '));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSecurityData();
  }, []);

  const adminUsers = users.filter((user) => user.role === 'admin');
  const processingPayouts = payouts.filter((payout) => payout.status === 'processing');
  const paidPayouts = payouts.filter((payout) => payout.status === 'paid');
  const missingReferences = payouts.filter((payout) => payout.status === 'paid' && !payout.payoutReference);
  const visiblePolicies = policies.length ? policies : fallbackPolicies;

  const publishedCount = useMemo(() => visiblePolicies.filter((policy) => policy.status === 'published').length, [visiblePolicies]);

  const navItems = [
    { label: 'Overview', href: '/A31/dashboard', icon: Home, active: false },
    { label: 'Payout Queue', href: '/A31/payouts', icon: CreditCard, active: false },
    { label: 'Users', href: '/A31/users', icon: Users, active: false },
    { label: 'Jobs', href: '/A31/jobs', icon: FileText, active: false },
    { label: 'Reports', href: '/A31/reports', icon: FileText, active: false },
    { label: 'Security', href: '/A31/security', icon: LockKeyhole, active: true },
  ];

  const riskCards = [
    { label: 'Pending payout value', value: formatRand(overview.pendingPayoutTotalZar), note: `${overview.pendingPayouts} requests`, icon: Wallet, bg: 'bg-amber-50', color: 'text-amber-700' },
    { label: 'Processing payouts', value: processingPayouts.length, note: 'Currently being handled', icon: CreditCard, bg: 'bg-sky-50', color: 'text-sky-700' },
    { label: 'Paid payouts', value: paidPayouts.length, note: 'Completed payout records', icon: CheckCircle2, bg: 'bg-green-50', color: 'text-green-700' },
    { label: 'Policy coverage', value: `${publishedCount}/${visiblePolicies.length}`, note: 'Published user-facing policies', icon: FileText, bg: 'bg-green-50', color: 'text-green-700' },
    { label: 'Missing references', value: missingReferences.length, note: 'Paid rows without reference', icon: ShieldAlert, bg: 'bg-red-50', color: 'text-red-600' },
  ];

  const startEditingPolicy = (policy?: AdminPolicyRow) => {
    setPolicyNotice('');
    if (policy) {
      setPolicyDraft({
        id: policy.id.startsWith('fallback-') ? '' : policy.id,
        slug: policy.slug,
        title: policy.title,
        content: policy.content,
        status: policy.status,
        version: policy.version,
        effectiveDate: policy.effectiveDate || '',
      });
    } else {
      setPolicyDraft(emptyDraft());
    }
    setEditingPolicy(true);
  };

  const handleSavePolicy = async () => {
    if (!session?.userId) {
      setPolicyNotice('Sign in as an admin before saving policies.');
      return;
    }

    setSavingPolicy(true);
    setPolicyNotice('');
    try {
      await saveAdminPolicy({
        id: policyDraft.id || undefined,
        adminId: session.userId,
        slug: policyDraft.slug,
        title: policyDraft.title,
        content: policyDraft.content,
        status: policyDraft.status,
        version: policyDraft.version,
        effectiveDate: policyDraft.effectiveDate || null,
      });
      setEditingPolicy(false);
      setPolicyDraft(emptyDraft());
      setPolicyNotice('Policy saved. Published policies are visible on their matching user pages.');
      const latestPolicies = await getAdminPolicies();
      setPolicies(latestPolicies);
    } catch (saveError) {
      setPolicyNotice(saveError instanceof Error ? saveError.message : 'Could not save this policy right now.');
    } finally {
      setSavingPolicy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto">
          <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-6">
            <img src="/squash-logo.png" alt="SQUASH logo" className="h-11 w-11 rounded-2xl border border-slate-200 object-cover shadow-sm" />
            <a href="/" className="text-2xl font-black tracking-tight text-slate-900 hover:text-green-700">SQUASH</a>
          </div>

          <nav className="flex-1 space-y-2 px-4 py-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <a key={item.label} href={item.href} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${item.active ? 'bg-green-50 text-green-700' : 'text-slate-700 hover:bg-slate-50'}`}>
                  <Icon className="h-4 w-4" />
                  {item.label}
                </a>
              );
            })}
          </nav>

          <div className="p-4 pt-0">
            <div className="rounded-3xl border border-green-100 bg-green-50 p-5 shadow-sm">
              <div className="flex items-center gap-2 font-bold text-slate-900"><ShieldCheck className="h-5 w-5 text-green-700" /> Security posture</div>
              <p className="mt-3 text-sm leading-6 text-slate-700">Policies, admin access, payout controls and audit activity live here.</p>
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4">
                <a href="/A31/dashboard" className="rounded-xl border border-slate-300 p-2.5 text-slate-600 lg:hidden"><Menu className="h-5 w-5" /></a>
                <div className="hidden max-w-xl flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:flex md:min-w-[340px] lg:min-w-[460px]"><Search className="h-4 w-4 text-slate-400" /><input className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Search security, policies, audit logs..." /></div>
              </div>
              <div className="flex items-center gap-3 sm:gap-4"><button type="button" className="relative rounded-full border border-slate-200 p-2.5 text-slate-600"><Bell className="h-5 w-5" /></button><div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700">{adminName.charAt(0)}</div><div className="hidden sm:block"><div className="text-sm font-bold text-slate-900">{adminName}</div><div className="text-xs text-slate-500">Owner Admin</div></div></div></div>
            </div>
          </header>

          <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div><div className="inline-flex rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 ring-1 ring-green-100">Platform security</div><h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">Security</h1><p className="mt-2 max-w-3xl text-slate-600">Control access, review risk, monitor sensitive admin actions and prepare platform policies for users.</p></div>
              <button type="button" onClick={loadSecurityData} disabled={loading} className="w-fit rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">{loading ? 'Refreshing...' : 'Refresh Security'}</button>
            </div>

            {error ? <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div> : null}

            <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {riskCards.map((card) => { const Icon = card.icon; return <div key={card.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><div className="text-sm font-semibold text-slate-600">{card.label}</div><div className="mt-2 text-2xl font-black text-slate-900">{card.value}</div><div className="mt-2 text-xs leading-5 text-slate-500">{card.note}</div></div><div className={`grid h-11 w-11 place-items-center rounded-2xl ${card.bg}`}><Icon className={`h-5 w-5 ${card.color}`} /></div></div></div>; })}
            </section>

            <section className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-green-700" /><h2 className="text-2xl font-bold text-slate-900">Admin access control</h2></div><p className="mt-2 text-sm text-slate-600">People with elevated access to SQUASH operations.</p><div className="mt-5 space-y-3">{adminUsers.map((user)=><a key={user.id} href={`/A31/users/${user.id}`} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 hover:bg-slate-100"><div><div className="font-semibold text-slate-900">{user.name}</div><div className="text-sm text-slate-500">{user.email}</div></div><span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700 ring-1 ring-green-100">Admin</span></a>)}{adminUsers.length===0?<div className="text-sm text-slate-600">No admin users found.</div>:null}</div></div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-2"><Activity className="h-5 w-5 text-green-700" /><h2 className="text-2xl font-bold text-slate-900">Audit trail</h2></div><p className="mt-2 text-sm text-slate-600">Recent sensitive admin actions.</p><div className="mt-5 space-y-3">{activityLogs.map((log)=><div key={log.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-semibold capitalize text-slate-900">{log.action.replace(/_/g,' ')}</div><div className="mt-1 text-sm text-slate-500">{log.adminName} - {formatDate(log.createdAt)}</div>{log.note?<div className="mt-2 text-sm text-slate-600">{log.note}</div>:null}</div><span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">{log.entityType}</span></div></div>)}{activityLogs.length===0?<div className="text-sm text-slate-600">No audit activity recorded yet.</div>:null}</div></div>
            </section>

            <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div><div className="flex items-center gap-2"><FileText className="h-5 w-5 text-green-700" /><h2 className="text-2xl font-bold text-slate-900">Policy Center</h2></div><p className="mt-2 text-sm text-slate-600">Create, publish and manage policies that users can access from the public website and dashboards.</p></div>
                <button type="button" onClick={() => startEditingPolicy()} className="inline-flex w-fit items-center gap-2 rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700"><Plus className="h-4 w-4" /> Add Policy</button>
              </div>

              {policyNotice ? <div className="mt-5 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">{policyNotice}</div> : null}

              {editingPolicy ? (
                <div className="mt-6 rounded-3xl border border-green-100 bg-green-50 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div><h3 className="text-xl font-bold text-slate-900">{policyDraft.id ? 'Edit policy' : 'Add policy'}</h3><p className="mt-1 text-sm text-slate-600">Published policies appear on their matching destination pages.</p></div>
                    <button type="button" onClick={() => setEditingPolicy(false)} className="rounded-xl bg-white p-2 text-slate-500 ring-1 ring-green-100 hover:text-slate-800"><X className="h-4 w-4" /></button>
                  </div>
                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    <label className="text-sm font-semibold text-slate-700">Title<input value={policyDraft.title} onChange={(event)=>setPolicyDraft({...policyDraft,title:event.target.value})} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-green-500" placeholder="Terms of Service" /></label>
                    <label className="text-sm font-semibold text-slate-700">Slug<input value={policyDraft.slug} onChange={(event)=>setPolicyDraft({...policyDraft,slug:event.target.value})} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-green-500" placeholder="terms" /></label>
                    <label className="text-sm font-semibold text-slate-700">Version<input value={policyDraft.version} onChange={(event)=>setPolicyDraft({...policyDraft,version:event.target.value})} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-green-500" placeholder="v1.0" /></label>
                    <label className="text-sm font-semibold text-slate-700">Status<select value={policyDraft.status} onChange={(event)=>setPolicyDraft({...policyDraft,status:event.target.value as PolicyStatus})} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-green-500"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
                    <label className="text-sm font-semibold text-slate-700 lg:col-span-2">Effective date<input type="date" value={policyDraft.effectiveDate} onChange={(event)=>setPolicyDraft({...policyDraft,effectiveDate:event.target.value})} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-green-500" /></label>
                    <label className="text-sm font-semibold text-slate-700 lg:col-span-2">Policy content<textarea value={policyDraft.content} onChange={(event)=>setPolicyDraft({...policyDraft,content:event.target.value})} rows={7} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-green-500" placeholder="Write the policy content users should see..." /></label>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button type="button" onClick={handleSavePolicy} disabled={savingPolicy || !policyDraft.title.trim() || !policyDraft.slug.trim()} className="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"><Save className="h-4 w-4" /> {savingPolicy ? 'Saving...' : 'Save Policy'}</button>
                    <button type="button" onClick={() => setEditingPolicy(false)} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
                  </div>
                </div>
              ) : null}

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {visiblePolicies.map((policy)=>(
                  <div key={policy.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-slate-900">{policy.title}</h3><div className="mt-2 text-sm text-slate-500">{policy.slug} - {policy.version}</div></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ring-1 ${statusClasses(policy.status)}`}>{policy.status}</span></div>
                    <div className="mt-4 text-sm text-slate-600">Appears on: <span className="font-semibold text-slate-900">{policyDestination(policy.slug)}</span></div>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{policy.content}</p>
                    <div className="mt-4 flex gap-2"><button type="button" onClick={() => startEditingPolicy(policy)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Edit</button><a href={policyDestination(policy.slug)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">View</a></div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-8 rounded-3xl border border-green-100 bg-green-50 p-6 shadow-sm"><div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-green-700" /><h2 className="text-2xl font-bold text-slate-900">Security checklist</h2></div><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{checklist.map((item)=><div key={item} className="rounded-2xl border border-green-100 bg-white p-4 text-sm font-semibold leading-6 text-slate-700"><CheckCircle2 className="mb-3 h-5 w-5 text-green-700" />{item}</div>)}</div></section>

            <section className="mt-8 rounded-3xl border border-red-100 bg-red-50 p-6 shadow-sm"><div className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-red-600" /><h2 className="text-2xl font-bold text-slate-900">Incident response controls</h2></div><p className="mt-2 text-sm leading-6 text-slate-700">These controls should only become active after backend enforcement is designed and tested.</p><div className="mt-5 flex flex-wrap gap-3"><button disabled className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-400 ring-1 ring-red-100">Freeze Payouts</button><button disabled className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-400 ring-1 ring-red-100">Platform Review Mode</button><button disabled className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-400 ring-1 ring-red-100">Export Audit Log</button></div></section>
          </div>
        </main>
      </div>
    </div>
  );
}
