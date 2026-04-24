import { CheckCircle2, GitBranch, Mail, Rocket, ShieldCheck } from 'lucide-react';
import PublicHeader from './PublicHeader';

export default function SquashApiDocsPage() {
  const steps = [
    'Get your API key from your dashboard',
    'Add the Squash SDK to your CI/CD pipeline',
    'Tests trigger automatically on every deploy',
    'Reports land in your inbox within hours',
  ];

  const benefits = [
    { title: 'Never forget to test before shipping', icon: CheckCircle2 },
    { title: 'Catch regressions automatically', icon: ShieldCheck },
    { title: 'Reports in your inbox within hours', icon: Mail },
    { title: 'Integrates with GitHub, GitLab, Vercel', icon: GitBranch },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <PublicHeader active="developers" />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="inline-flex rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
            R800/month · API access
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">
            Squash API — Automate Your Testing
          </h1>
          <p className="mt-3 max-w-3xl text-lg text-slate-600">
            Trigger tests automatically every time you ship. Get reports without lifting a finger.
          </p>
        </section>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-slate-900">How it works</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {steps.map((step, index) => (
              <div key={step} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                <span className="font-semibold text-green-700">Step {index + 1}:</span> {step}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-bold text-slate-900">Code example</h2>
          <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-900 p-4 text-sm leading-6 text-slate-100">
{`// Install
npm install @squash/sdk

// In your deployment pipeline
import { Squash } from '@squash/sdk';

const squash = new Squash({ 
  apiKey: process.env.SQUASH_API_KEY 
});

await squash.triggerTest({
  jobTemplate: 'SQ-TEMPLATE-001',
  url: 'https://staging.myapp.com',
  testers: 5,
  testType: 'usability',
  notify: 'dev@myapp.com'
});`}
          </pre>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-green-50 text-green-700">
                  <benefit.icon className="h-5 w-5" />
                </div>
                <div className="mt-3 font-semibold text-slate-900">{benefit.title}</div>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-green-200 bg-green-50 p-6 shadow-sm">
            <div className="text-2xl font-black text-slate-900">R800/month — API Access</div>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li>• Unlimited test triggers</li>
              <li>• 5 job templates</li>
              <li>• Email reports</li>
              <li>• Webhook notifications</li>
            </ul>
            <a
              href="/contact?intent=api-access"
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700"
            >
              <Rocket className="h-4 w-4" /> Get API Access
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}

