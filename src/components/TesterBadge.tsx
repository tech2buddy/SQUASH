import { Gem, Medal, ShieldCheck } from 'lucide-react';

export type TesterTier = 'new' | 'verified' | 'pro' | 'elite';

export type TesterTierMeta = {
  tier: TesterTier;
  label: string;
  color: string;
  bg: string;
  border: string;
};

export function getTesterTier(testsCompleted: number, rating: number): TesterTierMeta {
  if (testsCompleted >= 50 && rating >= 4.8) {
    return {
      tier: 'elite',
      label: 'Elite Tester 💎',
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      border: 'border-violet-200',
    };
  }

  if (testsCompleted >= 21 && testsCompleted <= 50 && rating >= 4.5) {
    return {
      tier: 'pro',
      label: 'Pro Tester',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
    };
  }

  if (testsCompleted >= 6 && testsCompleted <= 20 && rating >= 4.0) {
    return {
      tier: 'verified',
      label: 'Verified',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
    };
  }

  return {
    tier: 'new',
    label: 'New Tester',
    color: 'text-slate-500',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
  };
}

export default function TesterBadge({
  testsCompleted,
  rating,
  className = '',
}: {
  testsCompleted: number;
  rating: number;
  className?: string;
}) {
  const meta = getTesterTier(testsCompleted, rating);

  const icon =
    meta.tier === 'elite' ? (
      <Gem className="h-3.5 w-3.5" />
    ) : meta.tier === 'verified' ? (
      <ShieldCheck className="h-3.5 w-3.5" />
    ) : (
      <Medal className="h-3.5 w-3.5" />
    );

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.bg} ${meta.border} ${meta.color} ${className}`}
      title={`${meta.label} · ${testsCompleted} tests · ${rating.toFixed(1)} rating`}
    >
      {icon}
      {meta.label}
    </span>
  );
}

