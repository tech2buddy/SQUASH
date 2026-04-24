type ScoreMeaning = {
  label: string;
  ring: string;
  text: string;
};

export type SquashScoreBreakdown = {
  usability: number;
  performance: number;
  onboarding: number;
  bugSeverity: number;
  deviceCompatibility: number;
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getMeaning(score: number): ScoreMeaning {
  if (score <= 49) return { label: 'Needs Work', ring: '#ef4444', text: 'text-red-600' };
  if (score <= 69) return { label: 'Improving', ring: '#f59e0b', text: 'text-amber-600' };
  if (score <= 84) return { label: 'Good', ring: '#22c55e', text: 'text-green-600' };
  return { label: 'Excellent', ring: '#10b981', text: 'text-emerald-600' };
}

export function getOverallScore(scores: SquashScoreBreakdown) {
  const values = Object.values(scores).map(clampScore);
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export default function SquashScore({
  scores,
  compact = false,
  className = '',
}: {
  scores: SquashScoreBreakdown;
  compact?: boolean;
  className?: string;
}) {
  const normalized = {
    usability: clampScore(scores.usability),
    performance: clampScore(scores.performance),
    onboarding: clampScore(scores.onboarding),
    bugSeverity: clampScore(scores.bugSeverity),
    deviceCompatibility: clampScore(scores.deviceCompatibility),
  };
  const overall = getOverallScore(normalized);
  const meaning = getMeaning(overall);
  const rotation = Math.round((overall / 100) * 360);

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <div
          className="relative h-10 w-10 rounded-full"
          style={{
            background: `conic-gradient(${meaning.ring} ${rotation}deg, #e2e8f0 ${rotation}deg)`,
          }}
          aria-label={`Squash Score ${overall} out of 100`}
        >
          <div className="absolute inset-[3px] grid place-items-center rounded-full bg-white text-[10px] font-bold text-slate-700">
            {overall}
          </div>
        </div>
        <div className="text-xs font-semibold text-slate-600">Squash Score</div>
      </div>
    );
  }

  const rows: Array<{ label: string; value: number }> = [
    { label: 'Usability', value: normalized.usability },
    { label: 'Performance', value: normalized.performance },
    { label: 'Onboarding', value: normalized.onboarding },
    { label: 'Bug Severity', value: normalized.bugSeverity },
    { label: 'Device Compatibility', value: normalized.deviceCompatibility },
  ];

  return (
    <div className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-2xl font-bold text-slate-900">Squash Score</div>
        <div
          className="relative h-24 w-24 rounded-full"
          style={{
            background: `conic-gradient(${meaning.ring} ${rotation}deg, #e2e8f0 ${rotation}deg)`,
          }}
          aria-label={`Squash Score ${overall} out of 100`}
        >
          <div className="absolute inset-[6px] grid place-items-center rounded-full bg-white text-center">
            <div className="text-2xl font-black text-slate-900">{overall}</div>
            <div className="text-[10px] font-semibold text-slate-500">/ 100</div>
          </div>
        </div>
      </div>

      <p className={`mt-3 text-sm font-semibold ${meaning.text}`}>{meaning.label}</p>

      <div className="mt-6 space-y-4">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-700">{row.label}</span>
              <span className="font-semibold text-slate-900">{row.value}/100</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-100">
              <div className="h-2.5 rounded-full bg-green-600" style={{ width: `${row.value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

