import { X } from 'lucide-react';
import { useMemo, useState } from 'react';

type Plan = 'Starter' | 'Growth' | 'Pro';

function getRetestPrice(plan: Plan) {
  if (plan === 'Starter') return 250;
  if (plan === 'Growth') return 600;
  return 1250;
}

export type RetestSubmission = {
  url: string;
  focusAreas: string;
  price: number;
  plan: Plan;
};

export default function RetestRequestModal({
  open,
  onClose,
  plan,
  originalScore,
  initialUrl,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  plan: Plan;
  originalScore: number;
  initialUrl: string;
  onSubmit: (payload: RetestSubmission) => void;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [focusAreas, setFocusAreas] = useState('');
  const retestPrice = useMemo(() => getRetestPrice(plan), [plan]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/45 p-4">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Request Retest</h3>
            <p className="mt-1 text-sm text-slate-600">
              Same testers get priority for the retest so they can compare improvements quickly.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
            aria-label="Close retest modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
          <div className="flex items-center justify-between text-slate-700">
            <span>Original Squash Score</span>
            <span className="font-semibold text-slate-900">{originalScore}/100</span>
          </div>
          <div className="flex items-center justify-between text-slate-700">
            <span>Retest plan</span>
            <span className="font-semibold text-slate-900">{plan}</span>
          </div>
          <div className="flex items-center justify-between text-slate-700">
            <span>Retest price (50% off)</span>
            <span className="text-lg font-black text-green-700">R{retestPrice.toLocaleString('en-ZA')}</span>
          </div>
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-semibold text-slate-700">Updated app URL (optional)</label>
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-green-500"
            placeholder="https://staging.myapp.com"
          />
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm font-semibold text-slate-700">Areas to focus on</label>
          <textarea
            value={focusAreas}
            onChange={(event) => setFocusAreas(event.target.value)}
            rows={4}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-green-500"
            placeholder="Example: onboarding, payment flow, performance on low data."
          />
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() =>
              onSubmit({
                url: url.trim() || initialUrl,
                focusAreas: focusAreas.trim(),
                plan,
                price: retestPrice,
              })
            }
            className="rounded-2xl bg-green-600 px-5 py-2.5 font-semibold text-white hover:bg-green-700"
          >
            Submit Retest
          </button>
        </div>
      </div>
    </div>
  );
}

