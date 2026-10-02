import { getSpecializationLabel, hasSaLanguageTag } from './testerSpecializations';
import { Target, Building2, Globe, type LucideIcon } from 'lucide-react';

export default function FeaturedTesterCard({
  name,
  icon: Icon,
  subtitle = 'Target Audience Filter',
  specializations,
}: {
  name: string;
  icon: LucideIcon;
  subtitle?: string;
  specializations: string[];
}) {
  const topTags = specializations.slice(0, 3).map((id) => getSpecializationLabel(id));
  const isTownshipTester = specializations.includes('township-network');
  const isLanguageTester = hasSaLanguageTag(specializations);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:border-rose-200 hover:shadow-md transition">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#1d1d1f] text-white border border-black/10 shadow-2xs">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="font-bold text-slate-900 leading-snug">{name}</div>
          <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
            <Target className="h-3 w-3 text-[#e63946]" />
            {subtitle}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {topTags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {isTownshipTester ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-100 px-2.5 py-1 text-xs font-semibold text-[#e63946]">
            <Building2 className="h-3 w-3" /> Township Network Tester
          </span>
        ) : null}
        {isLanguageTester ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-100 px-2.5 py-1 text-xs font-semibold text-[#e63946]">
            <Globe className="h-3 w-3" /> SA Language Tester
          </span>
        ) : null}
      </div>
    </div>
  );
}

