import {
  AlertCircle,
  BadgeCheck,
  Camera,
  Clock3,
  FileText,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';




import { useAuth } from './auth';
import { getTesterReportSubmissions, type TesterReportSubmission } from './lib/jobApi';
import { getTesterProfile, type TesterPublicProfile } from './lib/profileApi';

type ReportStatus = 'Pending Review' | 'Approved' | 'Changes Requested' | 'Under Review' | 'Rejected';


function formatRands(value: number) {
  return `R${Math.round(value).toLocaleString('en-ZA')}`;
}

function formatDate(value: string | null) {
  if (!value) return 'Not submitted yet';
  return new Intl.DateTimeFormat('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

function toReportStatus(status: TesterReportSubmission['status']): ReportStatus {
  if (status === 'approved') return 'Approved';
  if (status === 'changes_requested') return 'Changes Requested';
  if (status === 'rejected') return 'Rejected';
  if (status === 'draft') return 'Under Review';
  return 'Pending Review';
}

const emptyReports: TesterReportSubmission[] = [];

export default function SquashTesterReportsPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  
  const [realReports, setRealReports] = useState<TesterReportSubmission[]>(emptyReports);
  const [reportsError, setReportsError] = useState('');
  const [loadingReports, setLoadingReports] = useState(true);
  const [testerProfile, setTesterProfile] = useState<TesterPublicProfile | null>(null);

  useEffect(() => {
    if (!session?.userId) return;

    let mounted = true;
    setReportsError('');

    Promise.all([
      getTesterReportSubmissions(session.userId),
      getTesterProfile(session.userId)
    ])
      .then(([items, profile]) => {
        if (mounted) {
          setRealReports(items);
          setTesterProfile(profile);
        }
      })
      .catch((error: Error) => {
        if (mounted) setReportsError(error.message || 'Could not load your reports right now.');
      })
      .finally(() => {
        if (mounted) setLoadingReports(false);
      });

    return () => {
      mounted = false;
    };
  }, [session?.userId]);

  

  const reports = useMemo(() => {
    // No placeholder report here: showing a fake "R80 Awaiting approval" row
    // to a tester with no submissions implies earnings that do not exist.
    return realReports.map((report, index) => ({
      submissionId: report.id,
      title: report.summary?.split('.')[0]?.slice(0, 42) || 'Submitted test report',
      id: `Report #${String(index + 1).padStart(4, '0')}`,
      app: report.jobTitle,
      platform: report.jobPlatform,
      submitted: formatDate(report.submittedAt || report.createdAt),
      status: toReportStatus(report.status),
      earnings: report.status === 'approved' ? `${formatRands(report.amountZar)} Approved` : report.status === 'rejected' ? 'Not earned' : 'Awaiting approval',
      hasVideo: report.videoBugCount > 0,
      bugCount: report.bugCount,
    }));
  }, [realReports]);

  const summaryCards = [
    { title: 'Submitted', value: String(realReports.length), note: 'Total reports', icon: FileText, color: 'text-slate-700', bg: 'bg-slate-50' },
    {
      title: 'Approved',
      value: String(realReports.filter((report) => report.status === 'approved').length),
      note: 'Payment released',
      icon: BadgeCheck,
      color: 'text-[#e63946]',
      bg: 'bg-rose-50',
    },
    {
      title: 'Pending',
      value: String(realReports.filter((report) => report.status === 'submitted' || report.status === 'draft').length),
      note: 'Awaiting review',
      icon: Clock3,
      color: 'text-amber-700',
      bg: 'bg-amber-50',
    },
    {
      title: 'Changes',
      value: String(realReports.filter((report) => report.status === 'changes_requested').length),
      note: 'Need attention',
      icon: AlertCircle,
      color: 'text-[#1d1d1f]',
      bg: 'bg-slate-100',
    },
  ];

  const requestedChanges = realReports
    .filter((report) => report.status === 'changes_requested')
    .map((report) => ({
      title: report.summary?.split('.')[0]?.slice(0, 36) || 'Report needs updates',
      app: report.jobTitle,
      comment: 'Developer requested more detail. Add clearer steps, evidence, or a short video before resubmitting.',
      due: 'Action needed',
    }));

  if (loadingReports) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f7] px-4 text-center text-xs font-bold text-slate-500">
        Loading reports...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1 border-b border-[#E7E7E5]">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[#181817]">Reports & Submissions</h1>
          <p className="mt-0.5 text-xs text-[#666663]">
            Track bug reports, requested changes, approvals, and evidence files.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/active-test" className="squash-btn-primary">
            Continue Test
          </Link>
          <Link to="/tester-jobs" className="squash-btn-secondary">
            Find Tests
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="squash-panel p-3.5 h-[84px] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-[#666663]">{card.title}</span>
                <Icon className="h-3.5 w-3.5 text-[#92928E]" />
              </div>
              <div>
                <div className="text-xl font-semibold text-[#181817] leading-none">{card.value}</div>
                <div className="mt-1 text-[11px] text-[#92928E]">{card.note}</div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Main Reports Table & Sidebar */}
      <section className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="squash-panel overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E7E7E5] bg-[#FAFAF9]">
            <h2 className="text-sm font-semibold text-[#181817]">My Reports</h2>
            <span className="text-xs text-[#666663]">{reports.length} total</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="squash-table-header">
                  <th className="px-4 py-2 font-medium">Report</th>
                  <th className="px-4 py-2 font-medium">App</th>
                  <th className="px-4 py-2 font-medium">Evidence</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 text-right font-medium">Earnings</th>
                </tr>
              </thead>
              <tbody>
                {loadingReports ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-xs text-[#92928E]">
                      Loading submissions...
                    </td>
                  </tr>
                ) : null}
                {reportsError ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-xs text-[#C95050] bg-[#FDECEC]">
                      {reportsError}
                    </td>
                  </tr>
                ) : null}
                {!loadingReports && !reportsError && reports.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-xs text-[#92928E]">
                      You have not submitted any reports yet.
                    </td>
                  </tr>
                ) : null}
                {reports.map((report) => (
                  <tr
                    key={report.submissionId}
                    onClick={() => navigate(`/tester/reports/${report.submissionId}`)}
                    className="squash-table-row cursor-pointer"
                  >
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-[#181817] text-xs max-w-[200px] truncate">{report.title}</div>
                      <div className="text-[10px] text-[#92928E]">{report.id}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-[#181817] text-xs max-w-[150px] truncate">{report.app}</div>
                      <div className="text-[10px] text-[#92928E]">{report.platform}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5 text-xs text-[#666663]">
                        <Camera className="h-3 w-3 text-[#92928E]" />
                        <span>{report.bugCount > 0 ? `${report.bugCount} bugs` : 'Report'}</span>
                        {report.hasVideo ? (
                          <span className="squash-status-pill squash-status-error !text-[9.5px] !h-4">
                            Video
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`squash-status-pill ${
                        report.status === 'Approved'
                          ? 'squash-status-success'
                          : report.status === 'Pending Review' || report.status === 'Under Review'
                          ? 'squash-status-info'
                          : report.status === 'Changes Requested'
                          ? 'squash-status-warning'
                          : 'squash-status-error'
                      }`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-xs text-[#181817]">{report.earnings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="squash-panel p-4 space-y-3">
            <h2 className="text-xs font-semibold text-[#181817] uppercase tracking-wider">Changes Requested</h2>
            <div className="space-y-2">
              {requestedChanges.map((item) => (
                <div key={`${item.app}-${item.title}`} className="p-3 rounded-md bg-[#F7F7F6] border border-[#E7E7E5] space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-xs font-medium text-[#181817] truncate">{item.title}</div>
                    <span className="squash-status-pill squash-status-warning !text-[9px] !h-4">
                      Action needed
                    </span>
                  </div>
                  <p className="text-[11px] text-[#666663]">{item.comment}</p>
                  <Link to="/active-test" className="inline-block text-[11px] font-medium text-[#181817] hover:underline pt-1">
                    Update Report →
                  </Link>
                </div>
              ))}
              {requestedChanges.length === 0 ? (
                <div className="text-xs text-[#92928E] py-2 text-center">Nothing needs changes right now.</div>
              ) : null}
            </div>
          </div>

          <div className="squash-panel p-4 space-y-3">
            <h2 className="text-xs font-semibold text-[#181817] uppercase tracking-wider">Quality Score</h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-[#666663]">
                <span>Approval Rate</span>
                <span className="font-semibold text-[#181817]">{testerProfile ? `${testerProfile.approvalRate}%` : '0%'}</span>
              </div>
              <div className="h-1.5 w-full bg-[#EEEEEC] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#16A34A] rounded-full transition-all duration-300"
                  style={{ width: `${testerProfile?.approvalRate || 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

