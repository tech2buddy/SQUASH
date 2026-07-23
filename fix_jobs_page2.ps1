$content = [System.IO.File]::ReadAllText('src\SquashDeveloperViewsPage.tsx')

$newJobsPage = "export function SquashDeveloperJobsPage() {
  const { session } = useAuth();
  const [databaseJobs, setDatabaseJobs] = useState<DeveloperJob[]>([]);
  const [applications, setApplications] = useState<DeveloperApplication[]>([]);
  const [reports, setReports] = useState<DeveloperSubmissionReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.userId || !session.roles.includes('developer')) return;

    let mounted = true;
    Promise.all([
      getDeveloperJobs(session.userId),
      getDeveloperApplications(session.userId),
      getDeveloperSubmittedReports(session.userId),
    ])
      .then(([jobs, apps, reps]) => {
        if (mounted) {
          setDatabaseJobs(jobs);
          setApplications(apps);
          setReports(reps);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [session?.userId, session?.roles]);

  const jobs = useMemo(
    () =>
      databaseJobs.map((job) => {
        const acceptedTesters = applications.filter((a) => a.jobId === job.id && a.status === 'accepted').length;
        const submittedReports = reports.filter((r) => r.jobId === job.id).length;
        return {
          name: job.title,
          type: job.platform,
          testers: \\ / \\,
          status: job.status === 'active' ? ('Open' as const) : job.status === 'completed' ? ('Completed' as const) : ('Reviewing' as const),
          deadline: new Date(job.createdAt).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }),
          submissions: \\ / \\,
          accent: 'bg-green-600 text-white',
          logoUrl: job.logoUrl,
          categoryId: job.category as TestCategoryId,
        };
      }),
    [databaseJobs, applications, reports],
  );

  return (
    <DeveloperShell
      title=\"All Active Jobs\"
      subtitle=\"Complete list of jobs posted by your team.\"
      active=\"dashboard\"
    >
      <div className=\"rounded-3xl border border-slate-200 bg-white shadow-sm\">
        {loading ? (
          <div className=\"p-6 text-center text-sm font-semibold text-slate-500\">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className=\"p-6 text-center text-sm font-semibold text-slate-500\">No active jobs found.</div>
        ) : (
          <>
        {/* Mobile Cards List */}
        <div className=\"divide-y divide-slate-100 md:hidden\">
          {jobs.map((job) => {
            const category = getCategoryById(job.categoryId);
            const CategoryIcon = category.icon;
            return (
              <div key={job.name} className=\"p-4 space-y-3\">
                <div className=\"flex items-start justify-between gap-3\">
                  <div className=\"flex items-center gap-3\">
                    <div className={\lex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-bold overflow-hidden \\}>
                      {job.logoUrl ? (
                        <img src={job.logoUrl} alt={job.name} className=\"h-full w-full object-cover\" />
                      ) : (
                        job.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <div className=\"font-bold text-slate-900\">{job.name}</div>
                      <div className=\"text-xs text-slate-500\">{job.type}</div>
                    </div>
                  </div>
                  <span className={\shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold \\}>
                    {job.status}
                  </span>
                </div>
                <div className=\"flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600\">
                  <span className=\"inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 font-semibold text-slate-700\">
                    <CategoryIcon className=\"h-3 w-3\" style={{ color: category.color }} />
                    {category.name}
                  </span>
                  <span>Testers: <strong className=\"text-slate-900\">{job.testers}</strong></span>
                </div>
                <div className=\"flex items-center justify-between pt-1 text-xs\">
                  <span className=\"text-slate-500\">Submissions: {job.submissions} • Deadline: {job.deadline}</span>
                  <Link
                    to=\"/report-details\"
                    className=\"inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm\"
                  >
                    Open
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table View */}
        <div className=\"hidden md:block overflow-x-auto\">
          <table className=\"min-w-full\">
            <thead>
                      <tr className=\"border-b border-slate-100 text-left text-sm text-slate-500\">
                        <th className=\"px-5 py-3 font-medium\">App / Job</th>
                        <th className=\"px-5 py-3 font-medium\">Category</th>
                        <th className=\"px-5 py-3 font-medium\">Testers</th>
                <th className=\"px-5 py-3 font-medium\">Status</th>
                <th className=\"px-5 py-3 font-medium\">Deadline</th>
                <th className=\"px-5 py-3 font-medium\">Submissions</th>
                <th className=\"px-5 py-3 font-medium\">Open</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.name} className=\"border-b border-slate-100 last:border-b-0\">
                  <td className=\"px-5 py-3\">
                    <div className=\"flex items-center gap-3\">
                      <div className={\lex h-10 w-10 items-center justify-center rounded-xl text-base font-bold overflow-hidden \\}>
                        {job.logoUrl ? (
                          <img src={job.logoUrl} alt={job.name} className=\"h-full w-full object-cover\" />
                        ) : (
                          job.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <div className=\"font-semibold text-slate-900\">{job.name}</div>
                        <div className=\"text-sm text-slate-500\">{job.type}</div>
                      </div>
                    </div>
                  </td>
                  <td className=\"px-5 py-3\">
                    {(() => {
                      const category = getCategoryById(job.categoryId);
                      const CategoryIcon = category.icon;
                      return (
                        <span className=\"inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700\">
                          <CategoryIcon className=\"h-3.5 w-3.5\" style={{ color: category.color }} />
                          {category.name}
                          {category.saExclusive ? (
                            <span className=\"rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700\">SA ????</span>
                          ) : null}
                        </span>
                      );
                    })()}
                  </td>
                  <td className=\"px-5 py-3 text-sm font-medium text-slate-700\">{job.testers}</td>
                  <td className=\"px-5 py-3\">
                    <span className={\ounded-full px-3 py-1 text-xs font-semibold \\}>
                      {job.status}
                    </span>
                  </td>
                  <td className=\"px-5 py-3 text-sm font-medium text-slate-700\">{job.deadline}</td>
                  <td className=\"px-5 py-3 text-sm font-medium text-slate-700\">{job.submissions}</td>
                  <td className=\"px-5 py-3\">
                    <Link
                      to=\"/report-details\"
                      className=\"inline-flex items-center rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50\"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
        )}
      </div>
    </DeveloperShell>
  );
}
"

$content = $content -replace '(?s)export function SquashDeveloperJobsPage\(\) \{.*?export function SquashDeveloperSubmissionsPage', ($newJobsPage + "

export function SquashDeveloperSubmissionsPage")
[System.IO.File]::WriteAllText('src\SquashDeveloperViewsPage.tsx', $content)
