import { ShieldCheck } from 'lucide-react';

function addMonths(date: Date, months: number) {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

export function isCertificationExpired(certifiedAtIso: string) {
  const certifiedAt = new Date(certifiedAtIso);
  const expiry = addMonths(certifiedAt, 6);
  return new Date() > expiry;
}

export default function SquashCertified({
  score,
  testers,
  certifiedAt,
  compact = false,
  className = '',
}: {
  score: number;
  testers: number;
  certifiedAt: string;
  compact?: boolean;
  className?: string;
}) {
  if (score < 80) return null;

  const certifiedDate = new Date(certifiedAt);
  const expired = isCertificationExpired(certifiedAt);

  const monthYear = certifiedDate.toLocaleDateString('en-ZA', {
    month: 'long',
    year: 'numeric',
  });

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700 ${className}`}>
        <ShieldCheck className="h-3.5 w-3.5" />
        SQUASH CERTIFIED ✓
      </span>
    );
  }

  return (
    <div className={`rounded-3xl border border-green-200 bg-green-50 p-5 shadow-sm ${className}`}>
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-green-700 shadow-sm">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <div className="text-base font-black text-green-800">SQUASH CERTIFIED ✓</div>
          <div className="text-sm text-slate-700">Tested by {testers} real SA users</div>
          <div className="text-sm text-slate-700">Certified {monthYear}</div>
        </div>
      </div>

      {expired ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          Your SQUASH CERTIFIED badge expired. Recertify for R500 to keep your badge active.
        </div>
      ) : null}
    </div>
  );
}
