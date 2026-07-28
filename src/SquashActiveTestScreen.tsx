import {
  Bug,
  Camera,
  CheckCircle2,
  ChevronDown,
  Monitor,
  Square,
  Upload,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from './auth';
import type { TaskOutcome } from './lib/testBrief';
import { getTesterAssignmentById, getTesterPrimaryAssignment, saveAssignmentBugReport, submitAssignmentReport, type TesterAssignment } from './lib/jobApi';
import { uploadBugReportFile } from './lib/storageApi';
import TesterHeaderNav from './components/TesterHeaderNav';
import {
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


  const [assignment, setAssignment] = useState<TesterAssignment | null>(null);
  const [labSessionId, setLabSessionId] = useState<string | null>(null);
  const [assignmentError, setAssignmentError] = useState('');
  const [loadingAssignment, setLoadingAssignment] = useState(false);
  const [tasks, setTasks] = useState(fallbackTasks);
  const [taskState, setTaskState] = useState(fallbackTasks.map((_, index) => index < 2));
  const [taskResults, setTaskResults] = useState<TestTaskResult[]>([]);
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
  const [progressNotice, setProgressNotice] = useState('');
  const [recordCountdown, setRecordCountdown] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSecondsLeft, setRecordingSecondsLeft] = useState(60);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState('');
  const [recordedVideoDuration, setRecordedVideoDuration] = useState(0);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidencePreviewUrl, setEvidencePreviewUrl] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordingStartedAtRef = useRef<number | null>(null);
  const mediaChunksRef = useRef<Blob[]>([]);
  const recordedVideoBlobRef = useRef<Blob | null>(null);
  const evidenceInputRef = useRef<HTMLInputElement | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const recordingIntervalRef = useRef<number | null>(null);
  const completedTasks = useMemo(() => taskState.filter(Boolean).length, [taskState]);
  const progressPercent = useMemo(
    () => Math.round((completedTasks / taskState.length) * 100),
    [completedTasks, taskState.length],
  );


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

  const refreshTaskResults = async (sessionId: string) => {
    try {
      setTaskResults(await getTestLabTaskResults(sessionId));
    } catch {
      // Instrumentation is additive: if it fails the checklist still works.
    }
  };

  const toggleTask = (index: number, checked: boolean) => {
    setTaskState((prev) => prev.map((item, idx) => (idx === index ? checked : item)));

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
    try {
      await recordTestTaskOutcome({ sessionId: labSessionId, taskKey: `task-${index + 1}`, outcome, note });
      await refreshTaskResults(labSessionId);
      if (outcome === 'fail') setBugNotice('Document the failed task with a structured bug report below.');
    } catch (error) {
      setProgressNotice(error instanceof Error ? error.message : 'Could not save this task result.');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const clearIntervals = () => {
    if (countdownIntervalRef.current) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (recordingIntervalRef.current) {
      window.clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  };

  const stopMediaStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const stopRecording = (autoStopped = false) => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    clearIntervals();
    setIsRecording(false);
    recordingStartedAtRef.current = null;
    if (autoStopped) {
      setBugNotice('Recording stopped automatically after 60 seconds.');
    }
  };

  const startMediaRecording = async () => {
    try {
      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getDisplayMedia ||
        typeof MediaRecorder === 'undefined'
      ) {
        setBugNotice('Screen recording is not supported on this browser.');
        return;
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      mediaStreamRef.current = stream;
      mediaChunksRef.current = [];
      recordedVideoBlobRef.current = null;

      const recorder = new MediaRecorder(stream, {
        videoBitsPerSecond: 900_000,
        audioBitsPerSecond: 64_000,
      });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) mediaChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(mediaChunksRef.current, { type: 'video/webm' });
        recordedVideoBlobRef.current = blob;
        if (recordedVideoUrl) {
          URL.revokeObjectURL(recordedVideoUrl);
        }
        const previewUrl = URL.createObjectURL(blob);
        setRecordedVideoUrl(previewUrl);
        const elapsed = recordingStartedAtRef.current
          ? Math.min(60, Math.max(1, Math.round((Date.now() - recordingStartedAtRef.current) / 1000)))
          : Math.max(1, 60 - recordingSecondsLeft);
        setRecordedVideoDuration(Math.max(1, elapsed));
        recordingStartedAtRef.current = null;

        stopMediaStream();
      };

      recorder.start(200);
      setIsRecording(true);
      setRecordingSecondsLeft(60);
      setBugNotice('');
      recordingStartedAtRef.current = Date.now();

      recordingIntervalRef.current = window.setInterval(() => {
        setRecordingSecondsLeft((prev) => {
          if (prev <= 1) {
            stopRecording(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setBugNotice('Could not start recording. Please allow screen recording permissions.');
      setRecordCountdown(null);
      stopMediaStream();
    }
  };

  const startRecordingWithCountdown = () => {
    if (isRecording) return;
    setBugNotice('');
    setRecordCountdown(3);
    countdownIntervalRef.current = window.setInterval(() => {
      setRecordCountdown((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearIntervals();
          startMediaRecording();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
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
    setBugNotice(`${file.type.startsWith('image/') ? 'Screenshot' : 'Video'} ready to upload.`);
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
        const recordedBlob = recordedVideoBlobRef.current;
        const uploadFile = evidenceFile
          ?? (recordedBlob ? new File([recordedBlob], `recording-${Date.now()}.webm`, { type: recordedBlob.type || 'video/webm' }) : null);
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

    setBugNotice(recordedVideoUrl || evidenceFile ? 'Bug report with evidence saved.' : 'Bug report saved.');
    setBugDescription('');
    setBugTitle('');
    setBugSteps('');
    setBugExpected('');
    setBugActual('');
    setEvidenceFile(null);
    if (evidencePreviewUrl) URL.revokeObjectURL(evidencePreviewUrl);
    setEvidencePreviewUrl('');
    recordedVideoBlobRef.current = null;
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
  const submitTest = async () => {
    if (evidenceFile || recordedVideoBlobRef.current) {
      setProgressNotice('Evidence is attached but not uploaded yet. Click Save Bug Report before submitting the test.');
      return;
    }
    if (bugDescription.trim() || bugTitle.trim() || bugSteps.trim() || bugExpected.trim() || bugActual.trim()) {
      setProgressNotice('You have an unsaved bug report. Save it or clear the description before submitting the test.');
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
    if (assignment && session?.userId) {
      try {
        await submitAssignmentReport({
          assignmentId: assignment.id,
          testerId: session.userId,
          jobId: assignment.jobId,
          summary: reportSummary || `Completed ${completedTasks} of ${taskState.length} tasks.`,
        });
        if (labSessionId) await markTestLabSubmitted(labSessionId);
      } catch (error) {
        setProgressNotice(error instanceof Error ? error.message : 'Could not submit this test right now.');
        return;
      }
    }

    setProgressNotice('Test submitted successfully.');
    navigate('/tester/reports');
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
      clearIntervals();
      stopMediaStream();
      if (recordedVideoUrl) URL.revokeObjectURL(recordedVideoUrl);
      if (evidencePreviewUrl) URL.revokeObjectURL(evidencePreviewUrl);
    },
    [recordedVideoUrl, evidencePreviewUrl],
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-white px-4 py-3 sm:px-6 lg:px-8 shadow-xs">
        {/* Left: Job Logo + Title + Metadata Badges */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 font-bold text-white shadow-sm overflow-hidden">
            {assignment?.jobLogoUrl ? (
              <img src={assignment.jobLogoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-black tracking-tight">
                {(assignment?.jobTitle || 'B').slice(0, 1)}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-slate-900 truncate sm:text-xl">
              {assignment?.jobTitle || 'Bolt — Checkout Flow Test'}
            </h1>

            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500">
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 border border-emerald-100">
                Test in progress
              </span>
              <span className="text-slate-300">|</span>
              <span>
                Payout <strong className="font-bold text-emerald-600 ml-1">R{(assignment?.jobPackageKey as string) === 'growth' ? 120 : (assignment?.jobPackageKey as string) === 'pro' ? 200 : 80}</strong>
              </span>
              <span className="text-slate-300">|</span>
              <span className="inline-flex items-center gap-1 text-slate-500">
                <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {assignment?.dueAt ? new Date(assignment.dueAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '25 May 2025, 23:59'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Header Navigation & Profile */}
        <div className="flex items-center gap-3 shrink-0">
          <TesterHeaderNav />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Responsive 2-Column Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* Left Column (Brief & Tasks) */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Developer Brief Card */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base mb-4 border-b border-slate-100 pb-3">
                <span className="text-slate-400 font-mono text-sm font-bold">&lt;/&gt;</span>
                <h2>Developer Brief</h2>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* Objective */}
                <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-2 items-start">
                  <span className="font-bold text-slate-500 flex items-center gap-1.5">
                    <span className="text-sm">🎯</span> Objective
                  </span>
                  <p className="text-slate-700 leading-relaxed font-medium">
                    {assignment?.jobBrief.objective || assignment?.jobFocusAreas || assignment?.jobDescription || 'Verify that users can add a payment method and proceed through the checkout flow without errors.'}
                  </p>
                </div>

                {/* Test Link */}
                <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-2 items-center">
                  <span className="font-bold text-slate-500 flex items-center gap-1.5">
                    <span className="text-sm">🔗</span> Test link
                  </span>
                  <div className="flex items-center justify-between gap-3 min-w-0">
                    <a
                      href={assignment?.jobAppUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-blue-600 hover:underline truncate"
                    >
                      {assignment?.jobAppUrl || 'https://bolt.new/checkout'}
                    </a>
                    {assignment?.jobAppUrl ? (
                      <a
                        href={assignment.jobAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                      >
                        Open test website ↗
                      </a>
                    ) : null}
                  </div>
                </div>

                {/* Required Environment */}
                <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-2 items-start">
                  <span className="font-bold text-slate-500 flex items-center gap-1.5">
                    <span className="text-sm">🖥️</span> Required environment
                  </span>
                  <span className="text-slate-700 font-medium">
                    {assignment?.jobBrief.requiredEnvironment || assignment?.jobPlatform || 'Windows 11, Chrome (latest), 1920 x 1080'}
                  </span>
                </div>

                {/* Out of Scope */}
                <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-2 items-start">
                  <span className="font-bold text-slate-500 flex items-center gap-1.5">
                    <span className="text-sm">🚫</span> Out of scope
                  </span>
                  <span className="text-slate-600 font-medium">
                    {assignment?.jobBrief.outOfScope || 'Promotions, coupon codes, saved addresses, and account deletion.'}
                  </span>
                </div>
              </div>
            </section>

            {/* 2. Test Tasks Card */}
            <section id="task-list" className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
                  <svg className="h-4 w-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
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
              <div className="space-y-3">
                {tasks.map((task, index) => {
                  const result = taskResults.find((item) => item.taskKey === 'task-' + (index + 1));
                  const isExpanded = expandedTaskIndex === index;
                  const structuredTask = assignment?.jobBrief.tasks[index];
                  const status = result?.outcome || (taskState[index] ? 'completed' : 'pending');

                  return (
                    <div
                      key={task + index}
                      className={`rounded-xl border transition-all ${
                        isExpanded ? 'border-blue-200 bg-white shadow-xs' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                      }`}
                    >
                      {/* Accordion Header */}
                      <button
                        type="button"
                        onClick={() => setExpandedTaskIndex(isExpanded ? -1 : index)}
                        className="flex w-full items-center gap-3 p-3.5 text-left"
                      >
                        {/* Number Circle or Check */}
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            taskState[index]
                              ? 'bg-emerald-500 text-white'
                              : isExpanded
                              ? 'border-2 border-blue-500 text-blue-600 font-extrabold'
                              : 'border border-slate-300 bg-white text-slate-600'
                          }`}
                        >
                          {taskState[index] ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
                        </span>

                        {/* Task Title */}
                        <span className="min-w-0 flex-1 text-xs font-bold text-slate-800">
                          {task}
                        </span>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                          {status === 'pass' || status === 'completed' || taskState[index] ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200/60">
                              <CheckCircle2 className="h-3 w-3" /> Done
                            </span>
                          ) : isExpanded ? (
                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-600">
                              In progress
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                              Pending
                            </span>
                          )}

                          <ChevronDown
                            className={`h-4 w-4 text-slate-400 transition-transform ${
                              isExpanded ? 'rotate-180 text-slate-600' : ''
                            }`}
                          />
                        </div>
                      </button>

                      {/* Expanded Task Steps & Outcomes */}
                      {isExpanded ? (
                        <div className="border-t border-slate-100 p-4 space-y-4 bg-white rounded-b-xl">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Steps to Perform */}
                            <div>
                              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                                Steps to perform
                              </h3>
                              {structuredTask?.instructions ? (
                                <p className="text-xs leading-relaxed text-slate-700 whitespace-pre-line">
                                  {structuredTask.instructions}
                                </p>
                              ) : (
                                <ol className="space-y-1.5 text-xs text-slate-700">
                                  <li className="flex items-start gap-2">
                                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white mt-0.5">1</span>
                                    <span>Navigate to the billing/target section.</span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white mt-0.5">2</span>
                                    <span>Execute task requirement for: <strong>{task}</strong>.</span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white mt-0.5">3</span>
                                    <span>Observe behavior and document outcomes.</span>
                                  </li>
                                </ol>
                              )}
                            </div>

                            {/* Expected Result */}
                            <div className="border-t border-slate-100 pt-3 md:border-t-0 md:border-l md:border-slate-100 md:pl-4 md:pt-0">
                              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                                Expected result
                              </h3>
                              <p className="text-xs leading-relaxed text-slate-700 font-medium">
                                {structuredTask?.expectedOutcome || 'The payment method is saved and appears in the list with masked card details without errors.'}
                              </p>
                            </div>
                          </div>

                          {/* Action Outcome Buttons: PASS | FAIL | BLOCKED */}
                          <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => void recordTaskOutcome(index, 'pass')}
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-xs font-bold transition-all ${
                                result?.outcome === 'pass' || (taskState[index] && result?.outcome !== 'fail' && result?.outcome !== 'blocked')
                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20'
                                  : 'border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50/50'
                              }`}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> PASS
                            </button>

                            <button
                              type="button"
                              onClick={() => void recordTaskOutcome(index, 'fail')}
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-xs font-bold transition-all ${
                                result?.outcome === 'fail'
                                  ? 'border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-500/20'
                                  : 'border-rose-200 bg-white text-rose-600 hover:bg-rose-50/50'
                              }`}
                            >
                              <Square className="h-3.5 w-3.5 rotate-45 text-rose-500" /> FAIL
                            </button>

                            <button
                              type="button"
                              onClick={() => void recordTaskOutcome(index, 'blocked')}
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-xs font-bold transition-all ${
                                result?.outcome === 'blocked'
                                  ? 'border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-500/20'
                                  : 'border-amber-200 bg-white text-amber-600 hover:bg-amber-50/50'
                              }`}
                            >
                              <span className="h-3.5 w-3.5 rounded-full border-2 border-amber-500 flex items-center justify-center text-[9px] font-black">/</span> BLOCKED
                            </button>

                            {taskState[index] ? (
                              <button
                                type="button"
                                onClick={() => toggleTask(index, false)}
                                className="ml-auto text-[11px] font-semibold text-slate-400 hover:text-slate-600 hover:underline"
                              >
                                Reset task
                              </button>
                            ) : null}
                          </div>

                          {result?.outcomeNote ? (
                            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 font-medium">
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
          </div>

          {/* Right Column (Evidence, Bug Report, Captured Environment) */}
          <div className="lg:col-span-5 space-y-6">
            {/* 1. Evidence for Task Card */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                  <Camera className="h-4.5 w-4.5 text-blue-600" />
                  <h2>Evidence for Task {expandedTaskIndex >= 0 ? expandedTaskIndex + 1 : 1}</h2>
                </div>
                <span className="text-xs font-semibold text-slate-400">
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
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center transition hover:bg-slate-50">
                {evidencePreviewUrl || recordedVideoUrl ? (
                  <div>
                    <p className="text-xs font-bold text-slate-800">{evidenceFile?.name || 'Screen recording ready'}</p>
                    <p className="mt-1 text-[11px] text-slate-500">Evidence will attach when saving the bug report.</p>
                  </div>
                ) : (
                  <div>
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-2xs text-slate-400 mb-2">
                      <Camera className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">No evidence added yet</p>
                    <p className="mt-1 text-[11px] text-slate-500">Add a screenshot, screen recording, or file.</p>
                  </div>
                )}
              </div>

              {/* Upload Buttons Row */}
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={captureScreenshot}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                >
                  <Camera className="h-3.5 w-3.5 text-slate-500" /> Screenshot
                </button>
                <button
                  type="button"
                  onClick={isRecording ? () => stopRecording(false) : startRecordingWithCountdown}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-2 text-[11px] font-bold text-rose-600 hover:bg-rose-100 transition shadow-2xs"
                >
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                  {isRecording ? 'Stop' : 'Record screen'}
                </button>
                <button
                  type="button"
                  onClick={() => evidenceInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                >
                  <Upload className="h-3.5 w-3.5 text-slate-500" /> Attach file
                </button>
              </div>

              {recordCountdown !== null ? (
                <p className="mt-2 text-xs font-semibold text-amber-700 text-center">Starting in {recordCountdown}s...</p>
              ) : null}
              {isRecording ? (
                <p className="mt-2 text-xs font-semibold text-rose-600 text-center">Recording: {formatDuration(60 - recordingSecondsLeft)}</p>
              ) : null}

              {evidencePreviewUrl && evidenceFile?.type.startsWith('image/') ? (
                <img src={evidencePreviewUrl} alt="Evidence preview" className="mt-3 max-h-40 w-full rounded-lg border border-slate-200 object-contain" />
              ) : null}
              {recordedVideoUrl ? (
                <video controls src={recordedVideoUrl} className="mt-3 max-h-40 w-full rounded-lg bg-black" />
              ) : null}
            </section>

            {/* 2. Report a Bug Card */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 text-rose-500 font-bold text-base mb-4 border-b border-slate-100 pb-3">
                <Bug className="h-4.5 w-4.5" />
                <h2 className="text-slate-900">Report a Bug</h2>
              </div>

              <div className="space-y-3.5">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bug title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    value={bugTitle}
                    onChange={(event) => setBugTitle(event.target.value)}
                    placeholder="Short, clear summary of the issue"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>

                {/* Steps */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Steps to reproduce <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={bugSteps}
                    onChange={(event) => setBugSteps(event.target.value)}
                    placeholder="List the exact steps to reproduce the issue"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>

                {/* Expected & Actual Side by Side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Expected result <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={bugExpected}
                      onChange={(event) => setBugExpected(event.target.value)}
                      placeholder="What should have happened?"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Actual result <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={bugActual}
                      onChange={(event) => setBugActual(event.target.value)}
                      placeholder="What actually happened?"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                    />
                  </div>
                </div>

                {/* Severity & Reproducibility Side by Side */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Severity <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={severity}
                      onChange={(event) => setSeverity(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500"
                    >
                      <option value="Critical">🔴 Critical</option>
                      <option value="High">🟠 High</option>
                      <option value="Medium">🟡 Medium</option>
                      <option value="Low">🟢 Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Reproducibility <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={bugFrequency}
                      onChange={(event) => setBugFrequency(event.target.value as 'once' | 'sometimes' | 'every_time')}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500"
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
                  className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2.5 text-xs font-bold text-white transition shadow-xs"
                >
                  Save Bug Report
                </button>
                {bugNotice ? <p className="text-xs font-semibold text-emerald-600 text-center">{bugNotice}</p> : null}
              </div>
            </section>

            {/* 3. Captured Environment Card */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base mb-3 border-b border-slate-100 pb-3">
                <Monitor className="h-4.5 w-4.5 text-slate-600" />
                <h2>Captured environment</h2>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">OS</p>
                  <p className="mt-1 font-semibold text-slate-800 truncate">
                    {typeof navigator === 'undefined' ? 'Windows 11' : navigator.platform.includes('Win') ? 'Windows 11' : navigator.platform || 'macOS'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Browser</p>
                  <p className="mt-1 font-semibold text-slate-800 truncate">
                    {typeof navigator === 'undefined' ? 'Chrome 150.0.0.0' : navigator.userAgent.includes('Chrome') ? 'Chrome 150.0.0.0' : 'Safari'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Resolution</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {typeof window === 'undefined' ? '1920 x 1080' : `${window.screen.width} x ${window.screen.height}`}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Floating Bottom Action Bar */}
      <footer className="sticky bottom-0 z-40 border-t border-slate-200/80 bg-white/95 backdrop-blur-md px-4 py-3.5 sm:px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Readiness Progress Bar */}
          <div className="flex items-center gap-3.5 flex-1 w-full sm:max-w-md">
            <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
              Report readiness
            </span>
            <div className="h-2.5 flex-1 rounded-full bg-slate-100 overflow-hidden border border-slate-200/50">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-300"
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
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={saveProgress}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            >
              <Square className="h-3.5 w-3.5 text-slate-400" /> Save draft
            </button>
            <button
              type="button"
              onClick={submitTest}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Review & Submit
            </button>
          </div>
        </div>
        {progressNotice ? <p className="mt-2 text-xs font-semibold text-emerald-600 text-center">{progressNotice}</p> : null}
      </footer>
    </div>
  );
}
