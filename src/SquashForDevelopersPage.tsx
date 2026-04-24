import {
  BarChart3,
  Bug,
  CheckCircle2,
  Clock3,
  Code2,
  FileText,
  Link as LinkIcon,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import PublicHeader from './PublicHeader';
import FeaturedTesterCard from './components/FeaturedTesterCard';
import { TEST_CATEGORIES } from './components/testCategories';
import TrustedLogosRow from './TrustedLogosRow';

type ItemWithIcon = {
  number?: string;
  title: string;
  text: string;
  icon: LucideIcon;
};

export default function SquashForDevelopersPage() {
  const steps: ItemWithIcon[] = [
    {
      number: '1',
      title: 'Post a Job',
      text: 'Tell us what you want tested, set your budget and timeline.',
      icon: FileText,
    },
    {
      number: '2',
      title: 'Get Testers',
      text: 'Skilled testers apply and you choose the best fit.',
      icon: Users,
    },
    {
      number: '3',
      title: 'Receive Reports',
      text: 'Get detailed bug reports, screenshots, videos and reproduction steps.',
      icon: Bug,
    },
    {
      number: '4',
      title: 'Fix & Ship',
      text: 'Resolve issues faster and ship with confidence.',
      icon: CheckCircle2,
    },
  ];

  const benefits: ItemWithIcon[] = [
    {
      title: 'Real Testers',
      text: 'Work with real people on real devices and environments.',
      icon: Users,
    },
    {
      title: 'Detailed Reports',
      text: 'Structured bug reports with steps, screenshots and severity.',
      icon: FileText,
    },
    {
      title: 'Faster Feedback',
      text: 'Get results in hours, not days.',
      icon: Clock3,
    },
    {
      title: 'Save Time & Money',
      text: 'Catch issues early and reduce support and rework costs.',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <PublicHeader active="developers" />

      <main>
        <section className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div className="animate-fade-up flex flex-col justify-center">
            <div className="inline-flex w-fit rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
              Built for teams that want better launches
            </div>

            <h1 className="mt-6 max-w-xl text-4xl font-black leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Get Real Feedback.
              <br />
              Ship Better Apps.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Squash connects you with real testers who find bugs, verify flows and help you
              deliver flawless digital experiences.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="/post-job"
                className="rounded-2xl bg-green-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-green-700"
              >
                Post a New Job
              </a>
              <a
                href="#how-it-works"
                className="rounded-2xl border border-slate-300 px-6 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                View How It Works
              </a>
            </div>
          </div>

          <div className="animate-fade-up-delayed flex items-center justify-center">
            <div className="w-full max-w-2xl rounded-[28px] border border-slate-200 bg-slate-50 p-5 shadow-xl">
              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="h-3 w-3 rounded-full bg-green-400" />
                </div>

                <div className="grid gap-4 md:grid-cols-[0.95fr_1.05fr]">
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <div className="mb-4 grid h-20 w-20 place-items-center rounded-2xl bg-white shadow-sm">
                        <Bug className="h-9 w-9 text-emerald-700" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 rounded-full bg-slate-200" />
                        <div className="h-3 w-3/4 rounded-full bg-slate-200" />
                        <div className="h-3 w-1/2 rounded-full bg-slate-200" />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                      <div className="mb-4 h-24 rounded-2xl bg-green-50 p-4">
                        <div className="flex h-full items-end justify-between gap-2">
                          {[30, 55, 40, 72, 60, 85].map((h, i) => (
                            <div key={i} className="flex flex-1 items-end">
                              <div
                                className="w-full rounded-t-xl bg-green-600/80"
                                style={{ height: `${h}%` }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                      <div className="space-y-3">
                        {[1, 2, 3].map((item) => (
                          <div
                            key={item}
                            className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3"
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <div className="h-3 flex-1 rounded-full bg-slate-200" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-8 border-green-100 text-sm font-bold text-slate-700">
                          72%
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="mb-3">
                          <BarChart3 className="h-5 w-5 text-emerald-700" />
                        </div>
                        <div className="space-y-3">
                          <div className="h-3 rounded-full bg-slate-200" />
                          <div className="h-3 w-5/6 rounded-full bg-slate-200" />
                          <div className="h-3 w-2/3 rounded-full bg-slate-200" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-y border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
                HOW IT WORKS
              </div>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {steps.map((step) => (
                <div key={step.number} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1">
                  <div className="mb-5 grid h-14 w-14 place-items-center rounded-full bg-green-50 ring-1 ring-green-100">
                    <step.icon className="h-7 w-7 text-green-700" />
                  </div>
                  <div className="text-sm font-semibold text-green-700">Step {step.number}</div>
                  <h3 className="mt-2 text-xl font-bold text-slate-900">{step.title}</h3>
                  <p className="mt-3 leading-7 text-slate-600">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="text-center">
              <div className="inline-flex rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 ring-1 ring-green-100">
                Easy Integration - No Setup Required
              </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                    <Code2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Option A</p>
                    <h3 className="text-xl font-bold text-slate-900">Add one script tag</h3>
                  </div>
                </div>
                <p className="mt-4 text-slate-600">
                  Paste one line into your staging site. Our testing toolbar appears automatically for
                  testers only. Your real users never see it.
                </p>
                <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-900 p-4 text-sm leading-6 text-slate-100">
{`<script
  src="https://squash.app/widget.js"
  data-job="YOUR-JOB-ID">
</script>`}
                </pre>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                    <LinkIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Option B</p>
                    <h3 className="text-xl font-bold text-slate-900">Just submit your URL</h3>
                  </div>
                </div>
                <p className="mt-4 text-slate-600">
                  No code required. Submit your website link when posting a job. We wrap it in a
                  secure Squash session and testers access it through our platform.
                </p>
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-7 text-slate-700">
                  <div><span className="font-semibold">You submit:</span> https://myapp.com/staging</div>
                  <div><span className="font-semibold">We create:</span> squash.app/test/JOB-ID</div>
                </div>
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-slate-600">
              Either way, only verified Squash testers can see the testing toolbar. Your real users and
              customers are completely unaffected.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-2xl font-bold text-slate-900">Test With The Right Users</h3>
            <p className="mt-2 text-slate-600">
              Filter testers by device, network conditions, language and app expertise. Get feedback from users who match your exact target market.
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <FeaturedTesterCard
                name="Lerato D."
                avatar="LD"
                rating={4.9}
                testsCompleted={62}
                specializations={['township-network', 'zulu', 'ecommerce', 'samsung-a-series']}
              />
              <FeaturedTesterCard
                name="Sipho N."
                avatar="SN"
                rating={4.7}
                testsCompleted={34}
                specializations={['2g-3g-only', 'load-shedding', 'banking', 'xhosa']}
              />
              <FeaturedTesterCard
                name="Thando M."
                avatar="TM"
                rating={4.4}
                testsCompleted={16}
                specializations={['iphone-12-plus', 'education', 'afrikaans']}
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="text-center">
            <div className="inline-flex rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 ring-1 ring-green-100">
              WHY DEVELOPERS LOVE SQUASH
            </div>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {benefits.map((item) => (
              <div key={item.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1">
                <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-slate-50">
                  <item.icon className="h-7 w-7 text-emerald-700" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="text-sm font-semibold text-slate-700">Test categories available</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {TEST_CATEGORIES.map((category) => {
                const Icon = category.icon;
                return (
                  <span
                    key={category.id}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: category.color }} />
                    {category.name}
                    {category.saExclusive ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">SA 🇿🇦</span>
                    ) : null}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-green-200 bg-green-50 p-6 shadow-sm">
            <h3 className="text-2xl font-bold text-slate-900">Live Test Sessions</h3>
            <p className="mt-2 text-slate-700">
              Book a live session where you watch a real user navigate your app via video call.
              See exactly where they hesitate, what confuses them, and ask questions in real time.
            </p>
            <div className="mt-3 text-sm font-semibold text-green-700">From R2,000 per session</div>
            <a
              href="/live-session"
              className="mt-4 inline-flex rounded-2xl bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700"
            >
              Book a Live Session
            </a>
          </div>

          <div className="mt-10">
            <TrustedLogosRow title="Trusted by indie makers, startups and enterprises worldwide" />
          </div>

          <div className="mt-10 rounded-[28px] border border-green-200 bg-green-50 px-6 py-8 shadow-sm sm:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Ready to ship a better product?</h3>
                <p className="mt-2 text-base text-slate-600">
                  Join thousands of developers who use Squash to build bug-free apps.
                </p>
              </div>
              <a
                href="/post-job"
                className="rounded-2xl bg-green-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-green-700"
              >
                Post a New Job
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
