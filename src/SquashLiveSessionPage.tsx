import { useState } from 'react';
import PublicFooter from './PublicFooter';
import PublicHeader from './PublicHeader';

export default function SquashLiveSessionPage() {
  const [appUrl, setAppUrl] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [focusAreas, setFocusAreas] = useState('');
  const [email, setEmail] = useState('');
  const [notice, setNotice] = useState('');

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <PublicHeader active="developers" />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Book a Live Test Session</h1>
          <p className="mt-2 text-slate-600">
            1 tester - 60 minute session - Screen share included - R2,000
          </p>

          <form
            className="mt-6 space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              setNotice('Live session request submitted. You will receive a Zoom/Google Meet link 24 hours before your session.');
            }}
          >
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">App URL or description</label>
              <input
                value={appUrl}
                onChange={(event) => setAppUrl(event.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-green-500"
                placeholder="https://staging.myapp.com"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Preferred date and time</label>
              <input
                type="datetime-local"
                value={preferredTime}
                onChange={(event) => setPreferredTime(event.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-green-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Focus areas for the session</label>
              <textarea
                rows={4}
                value={focusAreas}
                onChange={(event) => setFocusAreas(event.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-green-500"
                placeholder="Where do users hesitate? Which flows should be observed?"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Contact email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-green-500"
                placeholder="dev@company.com"
              />
            </div>

            <button
              type="submit"
              className="rounded-2xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
            >
              Submit Live Session Request
            </button>
          </form>
          {notice ? <p className="mt-4 text-sm font-semibold text-green-700">{notice}</p> : null}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

