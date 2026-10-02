import {
  Building2,
  Check,
  Eye,
  Globe,
  Languages,
  Laptop,
  Radio,
  Shield,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Volume2,
  Wifi,
  Zap,
} from 'lucide-react';
import type { ComponentType } from 'react';
import {
  SPECIALIZATION_GROUPS,
  getSpecializationLabel,
  requiresVerification,
} from './testerSpecializations';
import type { SpecializationVerificationStatus } from '../lib/specializationApi';

export type SpecializationDisplayStatus = SpecializationVerificationStatus | 'expired';

const GROUP_HEADER_CONFIG: Record<string, { icon: ComponentType<{ className?: string }>; bg: string; color: string }> = {
  device: { icon: Smartphone, bg: 'bg-[#1d1d1f]', color: 'text-white' },
  network: { icon: Wifi, bg: 'bg-[#1d1d1f]', color: 'text-white' },
  language: { icon: Languages, bg: 'bg-[#1d1d1f]', color: 'text-white' },
  accessibility: { icon: Eye, bg: 'bg-[#1d1d1f]', color: 'text-white' },
  expertise: { icon: Building2, bg: 'bg-[#1d1d1f]', color: 'text-white' },
};

const ITEM_ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  'samsung-a-series': Smartphone,
  'samsung-s-series': Smartphone,
  'iphone-6-11': Smartphone,
  'iphone-12-plus': Smartphone,
  'huawei-honor': Smartphone,
  'budget-android': Smartphone,
  'desktop-laptop': Laptop,

  'township-network': Wifi,
  'rural-network': Radio,
  '2g-3g-only': Radio,
  'lte-4g-5g': Wifi,
  'load-shedding': Zap,

  zulu: Languages,
  xhosa: Languages,
  sotho: Languages,
  afrikaans: Languages,
  english: Globe,
  venda: Languages,
  tsonga: Languages,

  'screen-reader': Volume2,
  'screen-magnification': Eye,
  'switch-or-motor': Sparkles,
  'deaf-hard-of-hearing': Volume2,
  'colour-vision': Eye,
  'cognitive-support': Sparkles,

  banking: Building2,
  ecommerce: ShoppingBag,
  government: Shield,
  education: Laptop,
  health: Sparkles,
  transport: Smartphone,
};

const STATUS_BADGE: Record<SpecializationDisplayStatus, { label: string; className: string }> = {
  approved: { label: 'Verified 💎', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  pending: { label: 'In Review ⏳', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  rejected: { label: 'Not Verified', className: 'border-slate-200 bg-slate-50 text-slate-600' },
  revoked: { label: 'Revoked', className: 'border-red-200 bg-red-50 text-red-700' },
  expired: { label: 'Lapsed', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  declared: { label: 'Unverified', className: 'border-slate-200 bg-slate-50 text-slate-500' },
};

function VerificationBadge({ status }: { status: SpecializationDisplayStatus }) {
  const badge = STATUS_BADGE[status];
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold ${badge.className}`}>
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
  verification?: Record<string, SpecializationDisplayStatus>;
  onRequestVerification?: (id: string) => void;
}) {
  if (readOnly) {
    return (
      <div className="flex flex-wrap gap-2">
        {selected.length === 0 ? (
          <span className="text-xs text-[#86868b]">No specializations selected yet.</span>
        ) : (
          selected.map((id) => {
            const status = verification?.[id];
            return (
              <span
                key={id}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                  status === 'approved'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-black/[0.06] bg-[#f5f5f7] text-[#1d1d1f]'
                }`}
              >
                {getSpecializationLabel(id)}
                {status === 'approved' ? <Check className="h-3 w-3 text-emerald-600" /> : null}
              </span>
            );
          })
        )}
      </div>
    );
  }

  return (
    <div className={compact ? 'space-y-6' : 'space-y-8'}>
      {SPECIALIZATION_GROUPS.map((group) => {
        const headerConfig = GROUP_HEADER_CONFIG[group.id] || { icon: Sparkles, bg: 'bg-[#1d1d1f]', color: 'text-white' };
        const GroupIcon = headerConfig.icon;

        return (
          <div key={group.id} className="space-y-3">
            {/* macOS System Settings Group Header */}
            <div className="flex items-center gap-2.5">
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${headerConfig.bg} ${headerConfig.color} shadow-2xs`}>
                <GroupIcon className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#1d1d1f] tracking-tight">{group.title}</h3>
                {group.description ? (
                  <p className="text-[11px] text-[#86868b] font-normal">{group.description}</p>
                ) : null}
              </div>
            </div>

            {/* Grid of macOS Control Cards */}
            <div className="grid gap-2.5 sm:grid-cols-2">
              {group.options.map((option) => {
                const checked = selected.includes(option.id);
                const status = verification?.[option.id];
                const needsVerification = requiresVerification(option.id);
                const ItemIcon = ITEM_ICON_MAP[option.id] || Sparkles;

                return (
                  <div
                    key={option.id}
                    onClick={() => onToggle?.(option.id, !checked)}
                    className={`group rounded-2xl border p-3.5 transition-all duration-200 cursor-pointer select-none ${
                      checked
                        ? 'border-[#e63946]/40 bg-[#e63946]/[0.03] ring-1 ring-[#e63946]/20 shadow-2xs'
                        : 'border-black/[0.06] bg-white hover:bg-[#f5f5f7]/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Apple Blue Checkbox Circle */}
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                            checked
                              ? 'border-[#e63946] bg-[#e63946] text-white shadow-2xs'
                              : 'border-black/20 bg-white group-hover:border-black/40'
                          }`}
                        >
                          {checked && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>

                        <div className="flex items-center gap-2 min-w-0">
                          <ItemIcon className={`h-4 w-4 shrink-0 ${checked ? 'text-[#e63946]' : 'text-[#86868b]'}`} />
                          <span className={`text-xs font-semibold truncate ${checked ? 'text-[#1d1d1f]' : 'text-slate-700'}`}>
                            {option.label}
                          </span>
                        </div>
                      </div>

                      {verification && checked && needsVerification ? (
                        <VerificationBadge status={status ?? 'declared'} />
                      ) : null}
                    </div>

                    {/* Verification Evidence Action Block */}
                    {verification && checked && needsVerification && status !== 'approved' ? (
                      <div className="mt-3 border-t border-black/[0.06] pt-2.5" onClick={(e) => e.stopPropagation()}>
                        {option.evidenceHint ? (
                          <p className="text-[11px] text-[#86868b] leading-relaxed">{option.evidenceHint}</p>
                        ) : null}
                        {status === 'pending' ? (
                          <p className="mt-1.5 text-[11px] font-semibold text-amber-700 flex items-center gap-1">
                            <span>⏳ Evidence submitted — a reviewer will check it shortly.</span>
                          </p>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onRequestVerification?.(option.id)}
                            className="mt-2 rounded-full bg-[#e63946] hover:bg-[#d62828] px-3.5 py-1 text-xs font-semibold text-white transition active:scale-97 shadow-2xs"
                          >
                            {status === 'rejected' ? 'Submit New Evidence' : 'Get Verified →'}
                          </button>
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

