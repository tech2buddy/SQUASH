import { CheckCircle2, ClipboardCheck, FlaskConical, Lock, ShieldCheck, UserRound } from 'lucide-react';

type Props = {
  current: 1 | 2 | 3 | 4;
  awaitingReview?: boolean;
};

const steps = [
  { label: 'Profile basics', description: 'Account setup', icon: UserRound },
  { label: 'QA foundations', description: 'Core testing principles', icon: ClipboardCheck },
  { label: 'Sample test', description: 'Practical scenario', icon: FlaskConical },
  { label: 'SQUASH review', description: 'Final verification', icon: ShieldCheck },
];

function currentCopy(current: number, awaitingReview: boolean) {
  if (awaitingReview) return 'Your sample test report is under review by our QA team. We will notify you once approved.';
  if (current === 1) return 'Complete your basic profile details to unlock your QA foundations module.';
  if (current === 2) return 'Master essential bug reporting standards before taking on client test jobs.';
  if (current === 3) return 'Execute one practical test scenario with clear steps and visual evidence.';
  return 'Your application is undergoing final review by the SQUASH team.';
}

export default function TesterApplicationProgress({ current, awaitingReview = false }: Props) {
  const completedSteps = awaitingReview ? 3 : current - 1;
  const progress = awaitingReview ? 100 : Math.round((completedSteps / 3) * 100);
  const activeStep = awaitingReview ? 4 : current;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-6 sm:p-7 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] backdrop-blur-md">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Tester Academy</span>
          </div>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {awaitingReview ? 'Application Under Review' : 'Tester Qualification'}
          </h1>
          <p className="mt-1 text-sm text-slate-500 font-normal">{currentCopy(current, awaitingReview)}</p>
        </div>

        <div className="flex items-center gap-2 self-start rounded-full border border-slate-200/80 bg-slate-50/80 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs sm:self-center">
          <span className="text-slate-400">Stage</span>
          <span className="font-bold text-slate-900">{awaitingReview ? 'Reviewing' : `${current} / 4`}</span>
        </div>
      </div>

      {/* Stepper Timeline */}
      <div className="pt-6">
        {/* Desktop View */}
        <div className="hidden md:grid md:grid-cols-4 md:gap-4 relative">
          {steps.map((step, index) => {
            const number = index + 1;
            const complete = number <= completedSteps;
            const active = number === activeStep;
            const upcoming = !complete && !active;
            const Icon = step.icon;

            return (
              <div key={step.label} className="relative flex flex-col">
                <div className="flex items-center gap-3">
                  <div
                    className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold transition-all ${
                      complete
                        ? 'bg-[#e63946] text-white shadow-xs'
                        : active
                        ? 'bg-slate-900 text-white ring-4 ring-slate-100 shadow-xs'
                        : 'border border-slate-200 bg-slate-50 text-slate-400'
                    }`}
                  >
                    {complete ? <CheckCircle2 className="h-4 w-4" /> : upcoming ? <Lock className="h-3.5 w-3.5 text-slate-300" /> : <Icon className="h-4 w-4" />}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 rounded-full transition-all ${
                        number <= completedSteps ? 'bg-[#e63946]' : 'bg-slate-100'
                      }`}
                    />
                  )}
                </div>

                <div className="mt-3">
                  <p className={`text-xs font-bold ${active ? 'text-slate-900' : complete ? 'text-slate-700' : 'text-slate-400'}`}>
                    {step.label}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400 font-normal">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile View */}
        <div className="grid grid-cols-2 gap-2.5 md:hidden">
          {steps.map((step, index) => {
            const number = index + 1;
            const complete = number <= completedSteps;
            const active = number === activeStep;

            return (
              <div
                key={step.label}
                className={`rounded-xl border p-3 transition-all ${
                  active
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                    : complete
                    ? 'border-rose-100 bg-rose-50 text-slate-900'
                    : 'border-slate-100 bg-slate-50/60 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold">Step {number}</span>
                  {complete ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : null}
                </div>
                <p className="mt-1 text-xs font-bold truncate">{step.label}</p>
              </div>
            );
          })}
        </div>

        {/* Apple-style thin Progress Bar */}
        <div className="mt-6 flex items-center gap-3 pt-4 border-t border-slate-100">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#e63946] transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[11px] font-semibold text-slate-400">{awaitingReview ? 'Reviewing' : `${progress}% Complete`}</span>
        </div>
      </div>
    </section>
  );
}