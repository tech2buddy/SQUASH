import PublicFooter from './PublicFooter';
import PublicHeader from './PublicHeader';

export default function SquashLiveSessionPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <PublicHeader active="developers" />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Ask about a live test session</h1>
          <p className="mt-3 text-slate-600">
            Tell us about your app and preferred time. We will confirm availability and pricing before any session is booked.
          </p>
          <a
            href="mailto:support@squashqa.co.za?subject=Live%20test%20session%20enquiry"
            className="mt-6 inline-flex rounded-2xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
          >
            Email the team
          </a>
          <p className="mt-3 text-sm text-slate-500">Your email app will open a draft. Please send it to submit your enquiry.</p>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
