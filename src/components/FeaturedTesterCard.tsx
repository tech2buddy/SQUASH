import { Star } from 'lucide-react';
import TesterBadge from './TesterBadge';
import { getSpecializationLabel, hasSaLanguageTag } from './testerSpecializations';

export default function FeaturedTesterCard({
  name,
  avatar,
  rating,
  testsCompleted,
  specializations,
}: {
  name: string;
  avatar: string;
  rating: number;
  testsCompleted: number;
  specializations: string[];
}) {
  const topTags = specializations.slice(0, 3).map((id) => getSpecializationLabel(id));
  const isTownshipTester = specializations.includes('township-network');
  const isLanguageTester = hasSaLanguageTag(specializations);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
          {avatar}
        </div>
        <div className="min-w-0">
          <div className="font-bold text-slate-900">{name}</div>
          <div className="mt-1 flex items-center gap-1 text-sm text-slate-600">
            <Star className="h-4 w-4 fill-current text-amber-500" />
            {rating.toFixed(1)} · {testsCompleted} tests
          </div>
          <div className="mt-2">
            <TesterBadge testsCompleted={testsCompleted} rating={rating} />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {topTags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {isTownshipTester ? (
          <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
            Township Network Tester 🏘️
          </span>
        ) : null}
        {isLanguageTester ? (
          <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
            SA Language Tester 🇿🇦
          </span>
        ) : null}
      </div>
    </div>
  );
}

