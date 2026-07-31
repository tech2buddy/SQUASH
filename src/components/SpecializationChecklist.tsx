import {
  SPECIALIZATION_GROUPS,
  getSpecializationLabel,
  requiresVerification,
} from './testerSpecializations';
import type { SpecializationVerificationStatus } from '../lib/specializationApi';

/**
 * `expired` is a display-only state. The database stores an approved row with a
 * past `expires_at`; the gate rejects it, so the tester must see it as lapsed
 * rather than verified.
 */
export type SpecializationDisplayStatus = SpecializationVerificationStatus | 'expired';

const STATUS_BADGE: Record<SpecializationDisplayStatus, { label: string; className: string }> = {
  approved: { label: 'Verified', className: 'border-green-200 bg-green-50 text-green-700' },
  pending: { label: 'In review', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  rejected: { label: 'Not verified', className: 'border-red-200 bg-red-50 text-red-700' },
  revoked: { label: 'Revoked', className: 'border-red-200 bg-red-50 text-red-700' },
  expired: { label: 'Expired', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  declared: { label: 'Unverified', className: 'border-slate-200 bg-slate-50 text-slate-600' },
};

function VerificationBadge({ status }: { status: SpecializationDisplayStatus }) {
  const badge = STATUS_BADGE[status];
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${badge.className}`}>
      {badge.label}
    </span>
  );
}

export default function SpecializationChecklist({
  selected,
  onToggle,
  readOnly = false,
  compact = false,
  verification,
  onRequestVerification,
}: {
  selected: string[];
  onToggle?: (id: string, nextChecked: boolean) => void;
  readOnly?: boolean;
  compact?: boolean;
  /**
   * Verification state per specialization key. When omitted the checklist
   * behaves exactly as before -- the onboarding and post-job flows pass nothing,
   * because neither is the place to prove a specialization.
   */
  verification?: Record<string, SpecializationDisplayStatus>;
  onRequestVerification?: (id: string) => void;
}) {
  if (readOnly) {
    return (
      <div className="flex flex-wrap gap-2">
        {selected.length === 0 ? (
          <span className="text-sm text-slate-500">No specializations selected yet.</span>
        ) : (
          selected.map((id) => {
            const status = verification?.[id];
            return (
              <span
                key={id}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                  status === 'approved'
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                {getSpecializationLabel(id)}
                {status === 'approved' ? <span aria-label="Verified by SQUASH">✓</span> : null}
              </span>
            );
          })
        )}
      </div>
    );
  }

  return (
    <div className={compact ? 'space-y-4' : 'space-y-6'}>
      {SPECIALIZATION_GROUPS.map((group) => (
        <div key={group.id}>
          <div className="mb-1 text-sm font-semibold text-slate-700">{group.title}</div>
          {group.description ? (
            <p className="mb-2 text-xs text-slate-500">{group.description}</p>
          ) : null}
          <div className="grid gap-2 sm:grid-cols-2">
            {group.options.map((option) => {
              const checked = selected.includes(option.id);
              const status = verification?.[option.id];
              const needsVerification = requiresVerification(option.id);
              return (
                <div
                  key={option.id}
                  className={`rounded-xl border px-3 py-2 text-sm transition ${
                    checked
                      ? 'border-green-200 bg-green-50 text-green-700'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => onToggle?.(option.id, event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 accent-green-600"
                    />
                    <span className="flex-1">{option.label}</span>
                    {verification && checked && needsVerification ? (
                      <VerificationBadge status={status ?? 'declared'} />
                    ) : null}
                  </label>

                  {verification && checked && needsVerification && status !== 'approved' ? (
                    <div className="mt-2 border-t border-black/5 pt-2">
                      {option.evidenceHint ? (
                        <p className="text-[11px] text-slate-500">{option.evidenceHint}</p>
                      ) : null}
                      {status === 'pending' ? (
                        <p className="mt-1 text-[11px] font-semibold text-amber-700">
                          Evidence submitted — a reviewer will get to it shortly.
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onRequestVerification?.(option.id)}
                          className="mt-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 transition hover:bg-slate-50"
                        >
                          {status === 'rejected' ? 'Submit new evidence' : 'Get verified'}
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
