import {
  Ban,
  Bug,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronDown,
  Code2,
  ExternalLink,
  Link2,
  ListOrdered,
  Monitor,
  Paperclip,
  Slash,
  Square,
  Target,
  Video,
  X,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from './auth';
import type { TaskOutcome } from './lib/testBrief';
import { getTesterAssignmentById, getTesterPrimaryAssignment, saveAssignmentBugReport, submitAssignmentReport, getAssignmentBugReports, deleteBugReportsByIds, type SavedBugReportItem, type TesterAssignment } from './lib/jobApi';
import { uploadBugReportFile } from './lib/storageApi';
import { testerPayoutForJob } from './lib/pricing';
import {
  captureSessionEnvironment,
  completeTestLabTask,
  recordTestTaskOutcome,
  getOrCreateTestLabSession,
  getTestLabTaskResults,
  markTestLabSubmitted,
  reopenTestLabTask,
  saveTestLabProgress,
  startTestLabTask,
  type TestTaskResult,
} from './lib/testLabApi';
import { startNetworkSampling } from './lib/networkTelemetry';

const fallbackTasks = [
  'Create an account / Sign up',
  'Set a daily step goal',
  'Navigate to the Stats page',
  'Track a workout',
  'Check how to view history',
  'Log out of the app',
];

export default function SquashActiveTestScreen() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const assignmentId = searchParams.get('assignment');


  const [savedBugs, setSavedBugs] = useState<SavedBugReportItem[]>([]);
  const [assignment, setAssignment] = useState<TesterAssignment | null>(null);
  const [labSessionId, setLabSessionId] = useState<string | null>(null);
  const [assignmentError, setAssignmentError] = useState('');
  const [loadingAssignment, setLoadingAssignment] = useState(false);
  const [tasks, setTasks] = useState(fallbackTasks);
  const [taskState, setTaskState] = useState(fallbackTasks.map((_, index) => index < 2));
  const [taskResults, setTaskResults] = useState<TestTaskResult[]>([]);
  // Captured once per mount so the panel and the saved session agree.
  const liveEnvironment = useMemo(() => captureSessionEnvironment(), []);
  // Uses the same 62% split the payout RPC enforces, rather than guessing
  // from the package key (which still named the removed growth/pro tiers).
  const assignmentPayout = useMemo(
    () => testerPayoutForJob(assignment?.jobTotalAmountZar || 0, assignment?.jobTestersNeeded || 0),
    [assignment?.jobTotalAmountZar, assignment?.jobTestersNeeded],
  );
  const [expandedTaskIndex, setExpandedTaskIndex] = useState(0);
  const [bugDescription, setBugDescription] = useState('');
  const [bugTitle, setBugTitle] = useState('');
  const [bugSteps, setBugSteps] = useState('');
  const [bugExpected, setBugExpected] = useState('');
  const [bugActual, setBugActual] = useState('');
  const [bugFrequency, setBugFrequency] = useState<'once' | 'sometimes' | 'every_time'>('sometimes');
  const [reportSummary, setReportSummary] = useState('');
  const [severity, setSeverity] = useState('Medium');
  const [bugNotice, setBugNotice] = useState('');
  const [networkWarning, setNetworkWarning] = useState('');
  const [progressNotice, setProgressNotice] = useState('');
  const [recordedVideoUrl, setRecordedVideoUrl] = useState('');
  const [recordedVideoDuration, setRecordedVideoDuration] = useState(0);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidencePreviewUrl, setEvidencePreviewUrl] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);
  const evidenceInputRef = useRef<HTMLInputElement | null>(null);
  const completedTasks = useMemo(() => taskState.filter(Boolean).length, [taskState]);
  const progressPercent = useMemo(
    () => Math.round((completedTasks / taskState.length) * 100),
    [completedTasks, taskState.length],
  );

  const [liveTime, setLiveTime] = useState('');
  useEffect(() => {
    const updateClock = () => {
      setLiveTime(
        new Intl.DateTimeFormat('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }).format(new Date())
      );
    };
    updateClock();
    const timer = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const fetchSavedBugs = (assignmentId: string) => {
    getAssignmentBugReports(assignmentId)
      .then(setSavedBugs)
      .catch(() => {});
  };

  useEffect(() => {
    if (!session?.userId) return;

    let mounted = true;
    setLoadingAssignment(true);
    setAssignmentError('');

    const loadAssignment = assignmentId
      ? getTesterAssignmentById(assignmentId, session.userId)
      : getTesterPrimaryAssignment(session.userId);

    loadAssignment
      .then((item) => {
        if (!mounted) return;
        if (!item) {
          setAssignmentError('No accepted test assignment found yet.');
          return;
        }

        setAssignment(item);
        fetchSavedBugs(item.id);
        getOrCreateTestLabSession({ assignmentId: item.id, jobId: item.jobId, testerId: session.userId! })
          .then((labSession) => {
            setLabSessionId(labSession.id);
            const savedProgress = labSession.metadata as { task_state?: boolean[]; report_summary?: string };
            if (Array.isArray(savedProgress.task_state)) setTaskState(savedProgress.task_state);
            if (savedProgress.report_summary) setReportSummary(savedProgress.report_summary);
            return getTestLabTaskResults(labSession.id).then((results) => {
              setTaskResults(results);
            });
          })
          .catch(() => {});
        const structuredTasks = item.jobBrief.tasks.map((task) => task.title);
        const parsedTasks = (item.jobTasks || '')
          .split(/[\r\n,]+/)
          .map((task) => task.trim())
          .filter(Boolean);
        const nextTasks = structuredTasks.length > 0 ? structuredTasks : (parsedTasks.length > 0 ? parsedTasks : fallbackTasks);
        setTasks(nextTasks);

        setTaskState(nextTasks.map(() => false));
      })
      .catch((error: Error) => {
        if (mounted) setAssignmentError(error.message || 'Could not load this accepted test.');
      })
      .finally(() => {
        if (mounted) setLoadingAssignment(false);
      });

    return () => {
      mounted = false;
    };
  }, [assignmentId, session?.userId]);

  // Sample the connection for as long as the tester has the lab open. This is
  // what turns "the checkout felt slow" into a measured claim on the Low-Data
  // report; it no-ops on browsers without the Network Information API.
  useEffect(() => {
    if (!labSessionId || !session?.userId) return;
    return startNetworkSampling(labSessionId, session.userId, (verdict) => {
      // Told plainly and early rather than scored in silence. A tester on the
      // office wifi or behind a VPN can still fix this before submitting;
      // finding out after the developer rejects the report helps nobody.
      setNetworkWarning(
        verdict.consistency === 'contradicted'
          ? verdict.networkKind === 'datacenter'
            ? 'Your connection looks like a VPN or hosting provider. Turn any VPN off and use your normal mobile connection, or this test may be rejected.'
            : 'The speeds your browser reports do not match the network we can see. If you are throttling your connection, use your real one instead.'
          : '',
      );
    });
  }, [labSessionId, session?.userId]);

  const refreshTaskResults = async (sessionId: string) => {
    try {
      setTaskResults(await getTestLabTaskResults(sessionId));
    } catch {
      // Instrumentation is additive: if it fails the checklist still works.
    }
  };

  const getTaskBugTitlePrefix = (index: number) => `Issue in Task ${index + 1}:`;

  const toggleTask = (index: number, checked: boolean) => {
    setTaskState((prev) => prev.map((item, idx) => (idx === index ? checked : item)));

    // When resetting a task, remove its bugs from UI state AND permanently from the database
    if (!checked) {
      const prefix = getTaskBugTitlePrefix(index);
      setSavedBugs((prev) => {
        const toDelete = prev.filter((bug) => bug.title.startsWith(prefix));
        if (toDelete.length > 0) {
          deleteBugReportsByIds(toDelete.map((b) => b.id)).catch(() => {});
        }
        return prev.filter((bug) => !bug.title.startsWith(prefix));
      });
    }

    if (!labSessionId) return;
    const taskKey = `task-${index + 1}`;

    if (checked) {
      completeTestLabTask({ sessionId: labSessionId, taskKey })
        .then(() => {
          const nextIndex = taskState.findIndex((done, idx) => idx !== index && !done);
          if (nextIndex >= 0) return startTestLabTask(labSessionId, `task-${nextIndex + 1}`);
          return undefined;
        })
        .then(() => refreshTaskResults(labSessionId))
        .catch(() => {});
    } else {
      reopenTestLabTask(labSessionId, taskKey)
        .then(() => refreshTaskResults(labSessionId))
        .catch(() => {});
    }
  };

  const recordTaskOutcome = async (index: number, outcome: TaskOutcome) => {
    if (!labSessionId) return;
    let note = '';
    if (outcome === 'blocked' || outcome === 'not_applicable') {
      note = window.prompt(outcome === 'blocked' ? 'Why could this task not be completed?' : 'Why does this task not apply in your environment?')?.trim() || '';
      if (!note) {
        setProgressNotice('Add a reason before marking a task blocked or not applicable.');
        return;
      }
    }
    setTaskState((previous) => previous.map((done, taskIndex) => taskIndex === index ? true : done));

    // Auto-fill only the bug title so the tester knows which task it refers to
    if (outcome === 'fail' || outcome === 'blocked') {
      const taskName = tasks[index] || `Task ${index + 1}`;
      setBugTitle(`${getTaskBugTitlePrefix(index)} ${taskName}`);
    }

    try {
      await recordTestTaskOutcome({ sessionId: labSessionId, taskKey: `task-${index + 1}`, outcome, note });
      await refreshTaskResults(labSessionId);
    } catch (error) {
      setProgressNotice(error instanceof Error ? error.message : 'Could not save this task result.');
    }
  };

  const recordTaskRating = async (index: number, difficultyRating?: 'Easy' | 'Neutral' | 'Difficult', emotionRating?: 'Smooth' | 'Confusing' | 'Frustrating') => {
    if (!labSessionId) return;
    try {
      await completeTestLabTask({
        sessionId: labSessionId,
        taskKey: `task-${index + 1}`,
        difficultyRating,
        emotionRating,
      });
      await refreshTaskResults(labSessionId);
    } catch {
      // Non-blocking rating save
    }
  };





  const selectEvidence = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      setBugNotice('Choose an image or video file.');
      return;
    }
    if (evidencePreviewUrl) URL.revokeObjectURL(evidencePreviewUrl);
    setEvidenceFile(file);
    setEvidencePreviewUrl(URL.createObjectURL(file));
    setBugNotice(`Attached: ${file.name}`);
  };

  const removeEvidence = () => {
    if (evidencePreviewUrl) URL.revokeObjectURL(evidencePreviewUrl);
    setEvidenceFile(null);
    setEvidencePreviewUrl('');
    if (evidenceInputRef.current) evidenceInputRef.current.value = '';
    setBugNotice('');
  };

  const captureScreenshot = async () => {
    let stream: MediaStream | null = null;
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) throw new Error('Screen capture is not supported on this browser.');
      stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      await video.play();
      await new Promise((resolve) => window.setTimeout(resolve, 250));
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Could not create the screenshot.');
      selectEvidence(new File([blob], `screenshot-${Date.now()}.png`, { type: 'image/png' }));
    } catch (error) {
      setBugNotice(error instanceof Error ? error.message : 'Could not capture the screenshot.');
    } finally {
      stream?.getTracks().forEach((track) => track.stop());
    }
  };
  const saveBugReport = async () => {
    const normalizedDescription = [bugDescription.trim(), 'Steps: ' + bugSteps.trim(), 'Expected: ' + bugExpected.trim(), 'Actual: ' + bugActual.trim()].filter(Boolean).join('\n\n');
    if (!bugTitle.trim() || !bugSteps.trim() || !bugExpected.trim() || !bugActual.trim()) {
      setBugNotice('Add a title, reproduction steps, expected result and actual result before saving.');
      return;
    }
    if (!normalizedDescription) {
      setBugNotice('Please describe the issue before saving.');
      return;
    }
    if (/^(?:n\/?a|none|no bugs?)$/i.test(normalizedDescription)) {
      setBugNotice('Describe the actual issue. If you found no bug, do not create a bug report.');
      return;
    }
    if (!assignment || !session?.userId || !labSessionId) {
      setBugNotice('The secure Test Lab session is still loading. Please try again.');
      return;
    }

    if (assignment && session?.userId) {
      try {
        let screenshotPath: string | null = null;
        let videoPath: string | null = null;
        const uploadFile = evidenceFile;
        if (uploadFile) {
          const uploadType = uploadFile.type.startsWith('image/') ? 'screenshot' : 'video';
          const upload = await uploadBugReportFile(uploadFile, uploadType, session.userId, assignment.jobId);
          if (upload.error) throw new Error(`Evidence upload failed: ${upload.error}`);
          if (uploadType === 'screenshot') screenshotPath = upload.path;
          else videoPath = upload.path;
        }
        await saveAssignmentBugReport({
          assignmentId: assignment.id,
          testerId: session.userId,
          jobId: assignment.jobId,
          sessionId: labSessionId,
          description: bugDescription,
          title: bugTitle,
          stepsToReproduce: bugSteps,
          expectedResult: bugExpected,
          actualResult: bugActual,
          frequency: bugFrequency,
          severity: severity as 'Low' | 'Medium' | 'High' | 'Critical',
          screenshotPath,
          videoPath,
          videoDurationSeconds: recordedVideoDuration || null,
        });
      } catch (error) {
        setBugNotice(error instanceof Error ? error.message : 'Could not save this bug report.');
        return;
      }
    }

    if (assignment?.id) {
      fetchSavedBugs(assignment.id);
    }

    setBugNotice(recordedVideoUrl || evidenceFile ? 'Bug report with evidence saved.' : 'Bug report saved.');
    setBugDescription('');
    setBugTitle('');
    setBugSteps('');
    setBugExpected('');
    setBugActual('');
    setEvidenceFile(null);
    if (evidencePreviewUrl) URL.revokeObjectURL(evidencePreviewUrl);
    setEvidencePreviewUrl('');
    if (recordedVideoUrl) URL.revokeObjectURL(recordedVideoUrl);
    setRecordedVideoUrl('');
    setRecordedVideoDuration(0);
  };

  const saveProgress = async () => {
    try {
      if (!labSessionId) throw new Error('The Test Lab session is still loading. Please try again.');
      await saveTestLabProgress({ sessionId: labSessionId, tasks, taskState, reportSummary });
      setProgressNotice('Progress saved securely.');
    } catch (error) {
      setProgressNotice(error instanceof Error ? error.message : 'Could not save progress right now.');
    }
  };
  const openReviewModal = () => {
    if (evidenceFile) {
      setProgressNotice('Evidence is attached but not uploaded yet. Click Save Bug Report before submitting.');
      return;
    }
    if (bugDescription.trim() || bugTitle.trim() || bugSteps.trim() || bugExpected.trim() || bugActual.trim()) {
      setProgressNotice('You have an unsaved bug report. Save it or clear the fields before submitting.');
      return;
    }
    if (completedTasks < taskState.length) {
      setProgressNotice(`Complete all tasks before submitting (${completedTasks}/${taskState.length}).`);
      return;
    }
    if (!assignment || !session?.userId || !labSessionId) {
      setProgressNotice('The secure Test Lab session is still loading. Please try again.');
      return;
    }
    setProgressNotice('');
    setShowReviewModal(true);
  };

  const submitTest = async () => {
    if (!reportSummary.trim()) {
      setProgressNotice('Please write an executive summary before final submission.');
      return;
    }
    setSubmittingReport(true);
    setProgressNotice('');
    try {
      if (assignment && session?.userId) {
        await submitAssignmentReport({
          assignmentId: assignment.id,
          testerId: session.userId,
          jobId: assignment.jobId,
          summary: reportSummary.trim(),
        });
        if (labSessionId) await markTestLabSubmitted(labSessionId);
      }
      setProgressNotice('Test submitted successfully.');
      navigate('/tester/reports');
    } catch (error) {
      setProgressNotice(error instanceof Error ? error.message : 'Could not submit this test right now.');
    } finally {
      setSubmittingReport(false);
    }
  };

  useEffect(() => {
    if (!labSessionId || !assignment) return;
    const timer = window.setTimeout(() => {
      saveTestLabProgress({ sessionId: labSessionId, tasks, taskState, reportSummary })
        .catch(() => setProgressNotice('Autosave could not sync. Please save again before leaving this test.'));
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [assignment, labSessionId, reportSummary, taskState, tasks]);

  // Starts the clock on the first unfinished task. Runs after the autosave
  // above has had time to create the task rows, since startTestLabTask
  // updates an existing row rather than creating one.
  useEffect(() => {
    if (!labSessionId || !tasks.length) return;
    const firstOpen = taskState.findIndex((done) => !done);
    if (firstOpen < 0) return;
    const alreadyRunning = taskResults.some(
      (result) => result.taskKey === `task-${firstOpen + 1}` && result.startedAt,
    );
    if (alreadyRunning) return;

    const timer = window.setTimeout(() => {
      startTestLabTask(labSessionId, `task-${firstOpen + 1}`)
        .then(() => getTestLabTaskResults(labSessionId))
        .then(setTaskResults)
        .catch(() => {});
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [labSessionId, tasks.length, taskState, taskResults]);
  useEffect(
    () => () => {
      if (recordedVideoUrl) URL.revokeObjectURL(recordedVideoUrl);
      if (evidencePreviewUrl) URL.revokeObjectURL(evidencePreviewUrl);
    },
    [recordedVideoUrl, evidencePreviewUrl],
  );

  if (loadingAssignment) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-2xs">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#e63946] border-t-transparent mb-3" />
        <p className="text-sm font-bold text-slate-800">Loading test lab environment...</p>
        <p className="text-xs text-slate-500 mt-1">Preparing test brief, tasks, and environment metrics</p>
      </div>
    );
  }

  if (assignmentError && !assignment) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-2xs space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
          <Target className="h-6 w-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">No active test selected</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          {assignmentError || 'You do not have an active test assignment running right now. Choose a job from Available Jobs to start testing.'}
        </p>
        <a
          href="/tester-jobs"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition"
        >
          Browse Available Jobs
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Banner Card (Job Banner) */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Job Logo & Title & Metadata Badges */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1d1d1f] font-bold text-white shadow-xs overflow-hidden">
              {assignment?.jobLogoUrl ? (
                <img src={assignment.jobLogoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-black tracking-tight">
                  {(assignment?.jobTitle || 'T').slice(0, 1)}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-0.5 min-w-0">
              <h1 className="text-base font-extrabold tracking-tight text-slate-900 truncate sm:text-lg">
                {assignment?.jobTitle || 'Active Test'}
              </h1>

              <div className="flex flex-wrap items-center gap-2.5 text-xs font-medium text-slate-500">
                <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-[#e63946] border border-rose-100">
                  Test in progress
                </span>
                <span className="text-slate-300">|</span>
                <span>
                  Payout <strong className="ml-0.5 font-bold text-[#e63946]">R{assignmentPayout}</strong>
                </span>
                <span className="text-slate-300">|</span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                  <Calendar className="h-3.5 w-3.5 text-[#e63946] shrink-0" />
                  {liveTime || '28 Jul 2026, 22:07:53'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Responsive 2-Column Grid */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-start">
          {/* Left Column (Brief & Tasks) */}
          <div className="lg:col-span-7 space-y-4">
            {/* 1. Developer Brief Card */}
            <section className="apple-bento-card p-4 sm:p-5">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-4 border-b border-slate-100 pb-2.5">
                <Code2 className="h-4 w-4 text-slate-500" />
                <h2>Developer Brief</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                {/* Objective */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 flex flex-col justify-between">
                  <span className="font-bold text-slate-500 flex items-center gap-1.5 mb-1.5">
                    <Target className="h-3.5 w-3.5 text-rose-500" /> Objective
                  </span>
                  <p className="text-slate-800 leading-relaxed font-semibold">
                    {assignment?.jobBrief?.objective || assignment?.jobFocusAreas || assignment?.jobDescription || 'Execute test tasks and report bugs found.'}
                  </p>
                </div>

                {/* Test Link */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 flex flex-col justify-between">
                  <span className="font-bold text-slate-500 flex items-center gap-1.5 mb-1.5">
                    <Link2 className="h-3.5 w-3.5 text-[#e63946]" /> Test link
                  </span>
                  {assignment?.jobAppUrl ? (
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <a
                        href={assignment.jobAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-[#e63946] hover:underline truncate"
                      >
                        {assignment.jobAppUrl}
                      </a>
                      <a
                        href={assignment.jobAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs inline-flex items-center gap-1"
                      >
                        Open <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ) : (
                    <span className="text-slate-400 font-medium italic">No link provided</span>
                  )}
                </div>

                {/* Required Environment */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 flex flex-col justify-between">
                  <span className="font-bold text-slate-500 flex items-center gap-1.5 mb-1.5">
                    <Monitor className="h-3.5 w-3.5 text-[#1d1d1f]" /> Required environment
                  </span>
                  <p className="text-slate-800 font-semibold leading-relaxed">
                    {assignment?.jobBrief?.requiredEnvironment || assignment?.jobPlatform || 'Browser'}
                  </p>
                </div>

                {/* Out of Scope */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 flex flex-col justify-between">
                  <span className="font-bold text-slate-500 flex items-center gap-1.5 mb-1.5">
                    <Ban className="h-3.5 w-3.5 text-amber-500" /> Out of scope
                  </span>
                  <p className="text-slate-700 font-medium leading-relaxed">
                    {assignment?.jobBrief?.outOfScope || 'None'}
                  </p>
                </div>
              </div>
            </section>

            {/* 2. Test Tasks Card */}
            <section id="task-list" className="apple-bento-card p-4">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <ListOrdered className="h-4 w-4 text-slate-600" />
                  <h2>Test Tasks</h2>
                  <span className="text-slate-300 font-normal">—</span>
                  <span className="text-xs font-semibold text-slate-500">
                    {completedTasks} of {taskState.length} complete
                  </span>
                </div>
              </div>

              {loadingAssignment ? <p className="py-2 text-xs font-semibold text-slate-500">Loading tasks...</p> : null}
              {assignmentError ? <p className="py-2 text-xs font-semibold text-red-600">{assignmentError}</p> : null}

              {/* Tasks Accordion List */}
              <div className="space-y-2.5">
                {tasks.map((task, index) => {
                  const result = taskResults.find((item) => item.taskKey === 'task-' + (index + 1));
                  const isExpanded = expandedTaskIndex === index;
                  const structuredTask = assignment?.jobBrief.tasks[index];
                  const status = result?.outcome || (taskState[index] ? 'completed' : 'pending');

                  return (
                    <div
                      key={task + index}
                      className={`apple-interactive-card overflow-hidden transition-all ${
                        isExpanded ? 'ring-1 ring-[#e63946]/30' : ''
                      }`}
                    >
                      {/* Accordion Header */}
                      <button
                        type="button"
                        onClick={() => setExpandedTaskIndex(isExpanded ? -1 : index)}
                        className="flex w-full items-center gap-2.5 p-3.5 text-left"
                      >
                        {/* Number Circle or Check */}
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                            taskState[index]
                              ? 'bg-[#1d1d1f] text-white shadow-2xs'
                              : isExpanded
                              ? 'border-2 border-[#e63946] text-[#e63946] font-extrabold'
                              : 'border border-black/20 bg-white text-[#1d1d1f]'
                          }`}
                        >
                          {taskState[index] ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
                        </span>

                        {/* Task Title */}
                        <span className="min-w-0 flex-1 text-xs font-extrabold text-[#1d1d1f] tracking-tight">
                          {task}
                        </span>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                          {status === 'pass' || status === 'completed' || taskState[index] ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[9px] font-extrabold text-[#e63946] border border-rose-100">
                              <CheckCircle2 className="h-3 w-3" /> Done
                            </span>
                          ) : isExpanded ? (
                            <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[9px] font-extrabold text-[#e63946] border border-rose-100">
                              In Progress
                            </span>
                          ) : (
                            <span className="rounded-full bg-[#f5f5f7] px-2.5 py-0.5 text-[9px] font-semibold text-[#86868b] border border-black/[0.04]">
                              Pending
                            </span>
                          )}

                          <ChevronDown
                            className={`h-4 w-4 text-[#86868b] transition-transform duration-200 ${
                              isExpanded ? 'rotate-180 text-[#1d1d1f]' : ''
                            }`}
                          />
                        </div>
                      </button>

                      {/* Expanded Task Steps & Expected Result + PASS/FAIL/BLOCKED */}
                      {isExpanded ? (
                        <div className="border-t border-slate-100 p-3.5 space-y-3 bg-white rounded-b-xl">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                            {/* Left: STEPS TO PERFORM */}
                            <div>
                              <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                                STEPS TO PERFORM
                              </h3>
                              {structuredTask?.instructions ? (
                                <p className="text-xs leading-relaxed text-slate-700 whitespace-pre-line font-medium">
                                  {structuredTask.instructions}
                                </p>
                              ) : (
                                <ol className="space-y-1 text-xs text-slate-700 font-medium">
                                  <li className="flex items-start gap-1.5">
                                    <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#1d1d1f] text-[9px] font-bold text-white mt-0.5">1</span>
                                    <span>Navigate to the Billing page.</span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#1d1d1f] text-[9px] font-bold text-white mt-0.5">2</span>
                                    <span>Click "Add payment method".</span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#1d1d1f] text-[9px] font-bold text-white mt-0.5">3</span>
                                    <span>Enter valid card details.</span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#1d1d1f] text-[9px] font-bold text-white mt-0.5">4</span>
                                    <span>Click "Save card".</span>
                                  </li>
                                </ol>
                              )}
                            </div>

                            {/* Right: EXPECTED RESULT + PASS / FAIL / BLOCKED BUTTONS DIRECTLY UNDER IT */}
                            <div className="border-t border-slate-100 pt-3 md:border-t-0 md:border-l md:border-slate-100 md:pl-4 md:pt-0 flex flex-col justify-between min-h-full">
                              <div>
                                <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                                  EXPECTED RESULT
                                </h3>
                                <p className="text-xs leading-relaxed text-slate-700 font-medium">
                                  {structuredTask?.expectedOutcome || 'The payment method is saved and appears in the list with masked card details.'}
                                </p>
                              </div>

                              {/* Action Outcome Buttons: PASS | FAIL | BLOCKED (Positioned under Expected Result) */}
                              <div className="mt-3 pt-2 flex flex-wrap items-center gap-2 border-t border-slate-100">
                                <button
                                  type="button"
                                  onClick={() => void recordTaskOutcome(index, 'pass')}
                                  className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1 text-xs font-bold transition-all ${
                                    result?.outcome === 'pass' || (taskState[index] && result?.outcome !== 'fail' && result?.outcome !== 'blocked')
                                      ? 'border-[#f5f5f7] bg-[#f5f5f7] text-[#1d1d1f] ring-2 ring-black/10'
                                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                  }`}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" /> PASS
                                </button>

                                <button
                                  type="button"
                                  onClick={() => void recordTaskOutcome(index, 'fail')}
                                  className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1 text-xs font-bold transition-all ${
                                    result?.outcome === 'fail'
                                      ? 'border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-500/20'
                                      : 'border-rose-200 bg-white text-rose-600 hover:bg-rose-50/50'
                                  }`}
                                >
                                  <XCircle className="h-3.5 w-3.5 text-rose-500" /> FAIL
                                </button>

                                <button
                                  type="button"
                                  onClick={() => void recordTaskOutcome(index, 'blocked')}
                                  className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1 text-xs font-bold transition-all ${
                                    result?.outcome === 'blocked'
                                      ? 'border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-500/20'
                                      : 'border-amber-200 bg-white text-amber-600 hover:bg-amber-50/50'
                                  }`}
                                >
                                  <Slash className="h-3.5 w-3.5 text-amber-500" /> BLOCKED
                                </button>

                                {taskState[index] ? (
                                  <button
                                    type="button"
                                    onClick={() => toggleTask(index, false)}
                                    className="ml-auto text-[10px] font-semibold text-slate-400 hover:text-slate-600 hover:underline"
                                  >
                                    Reset
                                  </button>
                                ) : null}
                              </div>

                              {/* UX Task Ratings (Option A: Difficulty & How it felt) */}
                              <div className="mt-3 pt-2.5 border-t border-slate-100/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-bold text-slate-500">Difficulty:</span>
                                  <div className="flex items-center gap-1">
                                    {(['Easy', 'Neutral', 'Difficult'] as const).map((level) => (
                                      <button
                                        key={level}
                                        type="button"
                                        onClick={() => void recordTaskRating(index, level, undefined)}
                                        className={`rounded-md px-2.5 py-1 text-[10px] font-bold transition-all ${
                                          result?.difficultyRating === level
                                            ? 'bg-slate-900 text-white shadow-2xs'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                      >
                                        {level}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-bold text-slate-500">How it felt:</span>
                                  <div className="flex items-center gap-1">
                                    {(['Smooth', 'Confusing', 'Frustrating'] as const).map((feel) => (
                                      <button
                                        key={feel}
                                        type="button"
                                        onClick={() => void recordTaskRating(index, undefined, feel)}
                                        className={`rounded-md px-2.5 py-1 text-[10px] font-bold transition-all ${
                                          result?.emotionRating === feel
                                            ? 'bg-slate-900 text-white shadow-2xs'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                      >
                                        {feel}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {result?.outcomeNote ? (
                            <p className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-800 font-medium">
                              Note: {result.outcomeNote}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>

                        {/* Logged Bugs Card — directly under Test Tasks */}
            {savedBugs.length > 0 ? (
              <section className="apple-bento-card p-4">
                <div className="flex items-center justify-between mb-2 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <Bug className="h-4 w-4 text-[#e63946]" />
                    <h2>Logged Bugs ({savedBugs.length})</h2>
                  </div>
                  <span className="text-[11px] font-semibold text-[#e63946]">Saved to session</span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {savedBugs.map((bug) => (
                    <div key={bug.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-slate-800 line-clamp-1">{bug.title}</span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          bug.severity === 'Critical' ? 'bg-rose-100 text-rose-700' :
                          bug.severity === 'High' ? 'bg-orange-100 text-orange-700' :
                          bug.severity === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-[#f5f5f7] text-[#1d1d1f]'
                        }`}>
                          {bug.severity}
                        </span>
                      </div>
                      {bug.stepsToReproduce ? (
                        <p className="mt-0.5 text-slate-500 line-clamp-1 text-[11px] font-medium">{bug.stepsToReproduce}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          {/* Right Column (Evidence, Bug Report, Captured Environment) */}
          <div className="lg:col-span-5 space-y-4">
            {/* 1. Evidence for Task Card */}
            <section className="apple-bento-card p-4">
              <div className="flex items-center justify-between mb-2.5 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Camera className="h-4 w-4 text-[#e63946]" />
                  <h2>Evidence for Task {expandedTaskIndex >= 0 ? expandedTaskIndex + 1 : 1}</h2>
                </div>
                <span className="text-[11px] font-semibold text-slate-400">
                  {evidenceFile || recordedVideoUrl ? '1 / 3 uploaded' : '0 / 3 uploaded'}
                </span>
              </div>

              <input
                ref={evidenceInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
                className="hidden"
                onChange={(event) => selectEvidence(event.target.files?.[0] ?? null)}
              />

              {/* Dotted Upload Drop Area */}
              <div
                onClick={() => evidenceInputRef.current?.click()}
                className="cursor-pointer flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-4 text-center transition hover:border-rose-300 hover:bg-rose-50/20"
              >
                {evidencePreviewUrl || recordedVideoUrl ? (
                  <div className="space-y-2 w-full">
                    {evidencePreviewUrl && evidenceFile?.type.startsWith('image/') ? (
                      <img src={evidencePreviewUrl} alt="Evidence preview" className="max-h-36 mx-auto rounded-lg border border-slate-200 object-contain shadow-2xs" />
                    ) : (
                      <p className="text-xs font-bold text-slate-800">{evidenceFile?.name || 'File ready'}</p>
                    )}
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xs font-bold text-slate-800 truncate max-w-[200px]">{evidenceFile?.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeEvidence();
                        }}
                        className="rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600 hover:bg-rose-100"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-2xs text-slate-400 mb-1.5">
                      <Camera className="h-4 w-4 text-[#e63946]" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">Click to upload screenshot or evidence</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">Supports PNG, JPG, WEBP, MP4</p>
                  </div>
                )}
              </div>

              {/* Upload Buttons Row */}
              <div className="mt-2.5 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={captureScreenshot}
                  className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                >
                  <Camera className="h-3.5 w-3.5 text-slate-500" /> Screenshot
                </button>
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-100 px-1.5 py-1.5 text-[10px] font-bold text-slate-400 cursor-not-allowed opacity-75"
                  title="Screen recording will be available in the upcoming release"
                >
                  <Video className="h-3.5 w-3.5 text-slate-400" /> Record video
                  <span className="rounded-full bg-slate-200 px-1 py-0.2 text-[8px] font-extrabold text-slate-600">Soon</span>
                </button>
                <button
                  type="button"
                  onClick={() => evidenceInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                >
                  <Paperclip className="h-3.5 w-3.5 text-slate-500" /> Attach file
                </button>
              </div>

              {evidencePreviewUrl && evidenceFile?.type.startsWith('image/') ? (
                <img src={evidencePreviewUrl} alt="Evidence preview" className="mt-2.5 max-h-36 w-full rounded-lg border border-slate-200 object-contain" />
              ) : null}
              {recordedVideoUrl ? (
                <video controls src={recordedVideoUrl} className="mt-2.5 max-h-36 w-full rounded-lg bg-black" />
              ) : null}
            </section>

            {/* 2. Report a Bug Card */}
            <section className="apple-bento-card p-4">
              <div className="flex items-center gap-2 text-rose-500 font-bold text-sm mb-3 border-b border-slate-100 pb-2">
                <Bug className="h-4 w-4" />
                <h2 className="text-slate-900">Report a Bug</h2>
              </div>

              <div className="space-y-2.5">
                {/* Title */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    Bug title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    value={bugTitle}
                    onChange={(event) => setBugTitle(event.target.value)}
                    placeholder="Short, clear summary of the issue"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-[#e63946] focus:ring-1 focus:ring-rose-200 transition"
                  />
                </div>

                {/* Steps */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    Steps to reproduce <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={bugSteps}
                    onChange={(event) => setBugSteps(event.target.value)}
                    placeholder="List the exact steps to reproduce the issue"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-[#e63946] focus:ring-1 focus:ring-rose-200 transition"
                  />
                </div>

                {/* Expected & Actual Side by Side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Expected result <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={1.5}
                      value={bugExpected}
                      onChange={(event) => setBugExpected(event.target.value)}
                      placeholder="What should have happened?"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-[#e63946] focus:ring-1 focus:ring-rose-200 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Actual result <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={1.5}
                      value={bugActual}
                      onChange={(event) => setBugActual(event.target.value)}
                      placeholder="What actually happened?"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-[#e63946] focus:ring-1 focus:ring-rose-200 transition"
                    />
                  </div>
                </div>

                {/* Severity & Reproducibility Side by Side */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Severity <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={severity}
                      onChange={(event) => setSeverity(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-[#e63946]"
                    >
                      <option value="Critical">🔴 Critical</option>
                      <option value="High">🟠 High</option>
                      <option value="Medium">🟡 Medium</option>
                      <option value="Low">🟢 Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Reproducibility <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={bugFrequency}
                      onChange={(event) => setBugFrequency(event.target.value as 'once' | 'sometimes' | 'every_time')}
                      className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-[#e63946]"
                    >
                      <option value="every_time">Every time</option>
                      <option value="sometimes">Sometimes</option>
                      <option value="once">Once</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={saveBugReport}
                  className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2 text-xs font-bold text-white transition shadow-xs"
                >
                  Save Bug Report
                </button>
                {bugNotice ? <p className="text-xs font-semibold text-slate-700 text-center">{bugNotice}</p> : null}
              </div>
            </section>



            {networkWarning ? (
              <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="text-xs font-black uppercase tracking-wider text-amber-800">
                  Check your connection
                </div>
                <p className="mt-1.5 text-xs font-semibold leading-5 text-amber-900">{networkWarning}</p>
              </section>
            ) : null}

            {/* 3. Captured Environment Card */}
            <section className="apple-bento-card p-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-2.5 border-b border-slate-100 pb-2">
                <Monitor className="h-4 w-4 text-slate-600" />
                <h2>Captured environment</h2>
              </div>

              {/* Real values from the tester's device, captured into the lab
                  session and shown on the report. Previously this reported
                  "Chrome 150.0.0.0" and "Windows 11" regardless of browser. */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { label: 'OS', value: liveEnvironment.os },
                  { label: 'Browser', value: liveEnvironment.browser },
                  { label: 'Resolution', value: liveEnvironment.resolution },
                  { label: 'Network', value: liveEnvironment.network },
                  { label: 'Language', value: liveEnvironment.language },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.label}</p>
                    <p className="mt-0.5 truncate font-semibold text-slate-800">{item.value}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

      {/* Floating Bottom Action Bar */}
      <footer className="fixed bottom-0 left-0 right-0 lg:left-[260px] z-40 border-t border-slate-200/80 bg-white/95 backdrop-blur-md px-4 py-2.5 sm:px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Readiness Progress Bar */}
          <div className="flex items-center gap-3 flex-1 w-full sm:max-w-md">
            <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
              Report readiness
            </span>
            <div className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden border border-slate-200/50">
              <div
                className="h-full rounded-full bg-[#e63946] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-black text-slate-900 min-w-[32px] text-right">
              {progressPercent}%
            </span>
          </div>

          {/* Prompt */}
          <p className="hidden md:block text-xs font-medium text-slate-400">
            Complete all tasks and add any necessary bug reports.
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={saveProgress}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            >
              <Square className="h-3.5 w-3.5 text-slate-400" /> Save draft
            </button>
            <button
              type="button"
              onClick={openReviewModal}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-[#e63946] hover:bg-[#d62828] px-4.5 py-2 text-xs font-bold text-white shadow-sm transition"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Review & Submit
            </button>
          </div>
        </div>
        {progressNotice ? <p className="mt-1.5 text-xs font-semibold text-slate-700 text-center">{progressNotice}</p> : null}
      </footer>

      {/* Review & Executive Summary Submission Modal */}
      {showReviewModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-[#e63946] border border-rose-100">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Review & Executive Summary</h3>
                  <p className="text-xs text-slate-500">Provide your overall test executive summary before final submission.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Overview Stats Row */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Tasks Tested</span>
                <span className="text-lg font-black text-slate-900">{completedTasks} / {taskState.length}</span>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Bugs Reported</span>
                <span className="text-lg font-black text-slate-900">{savedBugs.length}</span>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Readiness</span>
                <span className="text-lg font-black text-[#e63946]">100%</span>
              </div>
            </div>

            {/* Executive Summary Input Area */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-800 block">
                Write Executive Summary <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                value={reportSummary}
                onChange={(e) => setReportSummary(e.target.value)}
                placeholder="Provide a clear, detailed summary of your overall app testing experience, performance observations, and key recommendations for the developer..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#e63946] focus:bg-white focus:ring-2 focus:ring-rose-100 transition leading-relaxed font-medium"
              />
              <p className="text-[11px] text-slate-400 font-medium">This executive summary will be included in the report delivered to the developer.</p>
            </div>

            {progressNotice ? (
              <p className="text-xs font-semibold text-rose-600 text-center">{progressNotice}</p>
            ) : null}

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Back to Test Lab
              </button>
              <button
                type="button"
                disabled={submittingReport}
                onClick={submitTest}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#e63946] hover:bg-[#d62828] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition disabled:opacity-50"
              >
                {submittingReport ? 'Submitting...' : 'Final Submit Test Report'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
