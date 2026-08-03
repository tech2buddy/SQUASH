import { Bell, CreditCard, FileText, Home, LockKeyhole, Menu, Search, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useAuth } from './auth';
import { getAdminReports, type AdminReportRow } from './lib/adminApi';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}
function statusClass(status: AdminReportRow['status']) {
  if (status === 'approved') return 'bg-green-50 text-green-700 ring-green-100';
  if (status === 'submitted') return 'bg-amber-50 text-amber-700 ring-amber-100';
  if (status === 'changes_requested') return 'bg-sky-50 text-sky-700 ring-sky-100';
  if (status === 'rejected') return 'bg-red-50 text-red-600 ring-red-100';
  return 'bg-slate-50 text-slate-700 ring-slate-200';
}

export default function SquashAdminReportsPage() {
  const { session } = useAuth();
  const [params] = useSearchParams();
  const jobId = params.get('job');
  const adminName = session?.name || 'Mzwakhe Khosa';
  const [reports, setReports] = useState<AdminReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      setError('');
      try { setReports(await getAdminReports(120)); }
      catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Could not load reports right now.'); }
      finally { setLoading(false); }
    };
    loadReports();
  }, []);

  const filteredReports = useMemo(() => jobId ? reports.filter((report) => report.jobId === jobId) : reports, [jobId, reports]);
  const navItems = [
    { label: 'Overview', href: '/A31/dashboard', icon: Home, active: false },
    { label: 'Payout Queue', href: '/A31/payouts', icon: CreditCard, active: false },
    { label: 'Users', href: '/A31/users', icon: Users, active: false },
    { label: 'Jobs', href: '/A31/jobs', icon: FileText, active: false },
    { label: 'Reports', href: '/A31/reports', icon: FileText, active: true },
    { label: 'Security', href: '/A31/security', icon: LockKeyhole, active: false },
  ];

  return <div className="min-h-screen bg-[#f8fafc] text-slate-900 lg:h-screen lg:overflow-hidden"><div className="grid min-h-screen lg:h-screen lg:grid-cols-[260px_1fr]"><aside className="hidden border-r border-slate-200 bg-white lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto"><div className="flex items-center gap-3 border-b border-slate-200 px-6 py-6"><img src="/squash-logo.png" alt="SQUASH logo" className="h-11 w-11 rounded-2xl border border-slate-200 object-cover shadow-sm" /><a href="/" className="text-2xl font-black tracking-tight text-slate-900 hover:text-green-700">SQUASH</a></div><nav className="flex-1 space-y-2 px-4 py-6">{navItems.map((item)=>{const Icon=item.icon;return <a key={item.label} href={item.href} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${item.active?'bg-green-50 text-green-700':'text-slate-700 hover:bg-slate-50'}`}><Icon className="h-4 w-4" />{item.label}</a>;})}</nav></aside><main className="min-w-0 lg:h-screen lg:overflow-y-auto"><header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur"><div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8"><div className="flex items-center gap-4"><a href="/A31/jobs" className="rounded-xl border border-slate-300 p-2.5 text-slate-600 lg:hidden"><Menu className="h-5 w-5" /></a><div className="hidden max-w-xl flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:flex md:min-w-[340px] lg:min-w-[460px]"><Search className="h-4 w-4 text-slate-400" /><input className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Search reports..." /></div></div><div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm"><Bell className="h-5 w-5 text-slate-500" /><div className="hidden sm:block"><div className="text-sm font-bold text-slate-900">{adminName}</div><div className="text-xs text-slate-500">Admin</div></div></div></div></header><div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><div className="inline-flex rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 ring-1 ring-green-100">Admin report management</div><h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">Reports</h1><p className="mt-2 max-w-3xl text-slate-600">{jobId ? 'Reports filtered to the selected job.' : 'All tester submissions across SQUASH.'}</p>{error?<div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>:null}{loading?<div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-600 shadow-sm">Loading reports...</div>:null}<section className="mt-8 rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="min-w-full"><thead><tr className="border-b border-slate-100 text-left text-sm text-slate-500"><th className="px-6 py-4 font-medium">Job</th><th className="px-6 py-4 font-medium">Tester</th><th className="px-6 py-4 font-medium">Score</th><th className="px-6 py-4 font-medium">Evidence</th><th className="px-6 py-4 font-medium">Status</th><th className="px-6 py-4 font-medium">Action</th></tr></thead><tbody>{filteredReports.map((report)=><tr key={report.id} className="border-b border-slate-100 last:border-b-0"><td className="px-6 py-5"><div className="font-semibold text-slate-900">{report.jobTitle}</div><div className="text-sm text-slate-500">{formatDate(report.submittedAt || report.createdAt)}</div></td><td className="px-6 py-5"><div className="font-semibold text-slate-900">{report.testerName}</div><div className="text-sm text-slate-500">{report.testerEmail}</div></td><td className="px-6 py-5"><span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700 ring-1 ring-green-100">{report.score===null?'Pending':`${report.score}/100`}</span></td><td className="px-6 py-5 text-sm text-slate-600">{report.bugCount} bugs · {report.videoBugCount} videos</td><td className="px-6 py-5"><span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ring-1 ${statusClass(report.status)}`}>{report.status.replace(/_/g,' ')}</span></td><td className="px-6 py-5"><a href={`/A31/reports/${report.id}`} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Open</a></td></tr>)}{filteredReports.length===0?<tr><td colSpan={6} className="px-6 py-8 text-sm leading-6 text-slate-600">No reports found.</td></tr>:null}</tbody></table></div></section></div></main></div></div>;
}
