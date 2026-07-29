import { Cookie, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('squash_cookie_consent');
    if (!consent) {
      // Short delay so it doesn't jar the initial page load animation
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('squash_cookie_consent', 'all');
    setIsVisible(false);
  };

  const handleEssentialOnly = () => {
    localStorage.setItem('squash_cookie_consent', 'essential');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in slide-in-from-bottom duration-300">
      <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-2xl backdrop-blur-xl text-slate-900 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <Cookie className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 leading-tight">We value your privacy</h3>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">POPIA & Cookie Compliance</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleEssentialOnly}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            aria-label="Close cookie banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs leading-relaxed text-slate-600 font-medium">
          SQUASH uses essential cookies for secure login authentication, session management, and analytics to improve real-device QA testing. Learn more in our{' '}
          <Link to="/privacy" className="font-bold text-emerald-700 hover:underline">
            Privacy Policy
          </Link>
          .
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleAcceptAll}
            className="flex-1 rounded-2xl bg-emerald-600 py-2.5 px-4 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition apple-press-effect"
          >
            Accept Cookies
          </button>
          <button
            type="button"
            onClick={handleEssentialOnly}
            className="flex-1 rounded-2xl border border-slate-200 bg-white py-2.5 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 transition apple-press-effect"
          >
            Essential Only
          </button>
        </div>
      </div>
    </div>
  );
}
