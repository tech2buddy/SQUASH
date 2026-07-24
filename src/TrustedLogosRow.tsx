import { BugOff } from 'lucide-react';

const bugs = [
  'Login Bugs',
  'Payment Bugs',
  'UX Issues',
  'Broken Links',
  'Mobile Bugs',
  'Performance Issues',
  'Accessibility',
  'Browser Compatibility',
];

export default function TrustedLogosRow({ title = 'Bugs We Squash' }: { title?: string }) {
  // Duplicate array to ensure seamless infinite scrolling
  const marqueeItems = [...bugs, ...bugs, ...bugs];

  return (
    <div className="rounded-[28px] border border-slate-200 bg-slate-50 px-6 py-8 text-center shadow-sm sm:px-8 overflow-hidden">
      <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
        {title}
      </div>
      <div className="mt-8 flex w-full overflow-hidden relative mask-image-edges">
        <div className="flex w-max animate-marquee items-center gap-6 px-4">
          {marqueeItems.map((bug, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-xl border border-red-100 bg-white px-5 py-3 shadow-[0_2px_10px_rgba(239,68,68,0.06)] animate-squash"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <BugOff className="h-5 w-5 text-red-500" />
              <span className="font-semibold text-slate-700 whitespace-nowrap">{bug}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
