import PublicFooter from './PublicFooter';
import PublicHeader from './PublicHeader';
import { Star, Users, ShieldCheck, Bug, Gauge } from 'lucide-react';
import { TEST_CATEGORIES } from './components/testCategories';
import { usePageMeta } from './hooks/usePageMeta';

export default function SquashHomepage() {
  usePageMeta({
    title: 'SQUASH',
    description: 'SQUASH connects developers and startups with real South African testers to find bugs, run usability tests, and validate apps before launch. Post a testing job or earn money testing apps.',
    path: '/',
  });



  const steps = [
    {
      title: 'Post your app',
      text: 'Developers submit a website or app test job with goals, tasks, and target users.',
    },
    {
      title: 'Everyday users test it',
      text: 'Qualified testers complete real usability checks, bug hunts, and task-based flows.',
    },
    {
      title: 'Get your report',
      text: 'Receive screenshots, bug details, usability scores, and written feedback before launch.',
    },
  ];

  const testimonials = [
    {
      quote:
        "Building a great app is hard; testing it shouldn't be. SQUASH helps engineering teams ship faster with 100% confidence by turning real user testing into structured, developer-ready reports.",
      name: 'M. Khosa',
      role: 'Founder, SQUASH',
    },
    {
      quote:
        "As a builder, nothing hurts more than losing users on day one to silent bugs you didn't catch. SQUASH was created to give every startup access to enterprise-grade QA from day one.",
      name: 'M. Khosa',
      role: 'Founder, SQUASH',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <PublicHeader active="home" />

      <main>
        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:gap-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div className="animate-fade-up flex flex-col justify-center">
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3.5 py-1.5 text-xs font-semibold text-red-600 sm:text-sm">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Catch bugs before your users do
            </div>

            <h1 className="max-w-xl text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Squash <span className="text-red-500">Bugs</span> Before{' '}
              <span className="text-emerald-600">Launch</span>
            </h1>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:mt-6 sm:text-lg sm:leading-8">
              SQUASH connects developers and startups with everyday users who test your products, find bugs,
              complete usability tests, and deliver real feedback before launch day.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row">
              <a
                href="/signup?role=developer&next=%2Fpost-job"
                className="w-full text-center rounded-2xl bg-emerald-600 px-6 py-3.5 text-base font-bold text-white shadow-sm transition hover:bg-emerald-700 sm:w-auto"
              >
                Post a Job
              </a>
              <a
                href="/signup?role=tester&next=%2Ftester-jobs"
                className="w-full text-center rounded-2xl border border-slate-300 px-6 py-3.5 text-base font-bold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
              >
                Become a Tester
              </a>
            </div>

            {/* Checkmarks list optimized for mobile grid */}
            <div className="mt-6 grid grid-cols-2 gap-2.5 text-xs font-semibold text-slate-600 sm:mt-10 sm:flex sm:flex-wrap sm:gap-6 sm:text-sm">
              <div className="flex items-center gap-1.5">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-black text-emerald-700">✓</span> Real everyday users
              </div>
              <div className="flex items-center gap-1.5">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-black text-emerald-700">✓</span> Screenshots and reports
              </div>
              <div className="flex items-center gap-1.5">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-black text-emerald-700">✓</span> Faster product feedback
              </div>
              <div className="flex items-center gap-1.5">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-black text-emerald-700">✓</span> Built for South Africa
              </div>
            </div>
          </div>

          <div className="animate-fade-up-delayed relative lg:pl-6">
            <div className="absolute -inset-6 -z-10 hidden rounded-[40px] bg-gradient-to-br from-emerald-100 via-slate-100 to-white blur-2xl sm:block" />
            <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white p-2 shadow-lg sm:rounded-[30px] sm:p-3 sm:shadow-xl">
              <div className="aspect-[16/10] overflow-hidden rounded-[18px] sm:aspect-[4/3] sm:rounded-[22px]">
                <img
                  src="/about-hero.png"
                  alt="Bug testing illustration with code, charts, and magnifying glass"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Motion Graphic Hero Bento Section */}
        <section className="border-y border-slate-200/80 bg-slate-50/80 py-8 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">

              {/* Bento Card 1: Real User Testing (Live Avatar Radar) */}
              <div className="group relative rounded-3xl border border-slate-200/90 bg-white p-4.5 sm:p-6 shadow-sm hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 flex flex-col justify-between overflow-hidden">
                <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-emerald-400/10 blur-2xl group-hover:bg-emerald-400/20 transition" />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-2xs group-hover:scale-110 transition-transform duration-300">
                      <Users className="h-5.5 w-5.5" />
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-700">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      Live Pool
                    </span>
                  </div>

                  {/* Motion Graphic Widget: Floating Avatars & Active Beacon */}
                  <div className="my-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {['NK', 'KM', 'AV'].map((avatar, idx) => (
                          <div
                            key={avatar}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[10px] font-extrabold text-white ring-2 ring-white shadow-xs animate-float-slow"
                            style={{ animationDelay: `${idx * 400}ms` }}
                          >
                            {avatar}
                          </div>
                        ))}
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-black text-white ring-2 ring-white shadow-xs">
                          +50
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                        24 Online
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                    Real User Testing
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 font-medium leading-relaxed">
                    Real humans on real devices finding issues that automated scripts miss.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400">Coverage</span>
                  <span className="font-extrabold text-emerald-600">100% Human QA</span>
                </div>
              </div>

              {/* Bento Card 2: Verified Devices (Laser Scanline Graphic) */}
              <div className="group relative rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 flex flex-col justify-between overflow-hidden">
                <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-blue-400/10 blur-2xl group-hover:bg-blue-400/20 transition" />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 border border-blue-100 shadow-2xs group-hover:scale-110 transition-transform duration-300">
                      <ShieldCheck className="h-5.5 w-5.5" />
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-extrabold text-slate-700">
                      Target Filter
                    </span>
                  </div>

                  {/* Motion Graphic Widget: Device Scanner & Laser Beam */}
                  <div className="my-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 relative overflow-hidden">
                    {/* Glowing Laser Scanline */}
                    <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_8px_#10b981] animate-scanline z-10" />

                    <div className="flex items-center justify-between gap-1 text-[10px] font-extrabold text-slate-600">
                      <span className="rounded-md bg-white border border-slate-200/80 px-2 py-1 shadow-2xs">Android 14</span>
                      <span className="rounded-md bg-white border border-slate-200/80 px-2 py-1 shadow-2xs">iOS 17</span>
                      <span className="rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-1 shadow-2xs">4G / 5G</span>
                    </div>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                    Verified Devices
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 font-medium leading-relaxed">
                    Filter by exact phone model, OS version, language, and network conditions.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400">Environment</span>
                  <span className="font-extrabold text-blue-600">Real Hardware</span>
                </div>
              </div>

              {/* Bento Card 3: Detailed Bug Reports (Floating Proof Card) */}
              <div className="group relative rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 flex flex-col justify-between overflow-hidden">
                <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-rose-400/10 blur-2xl group-hover:bg-rose-400/20 transition" />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 shadow-2xs group-hover:scale-110 transition-transform duration-300">
                      <Bug className="h-5.5 w-5.5" />
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-extrabold text-slate-700">
                      Structured QA
                    </span>
                  </div>

                  {/* Motion Graphic Widget: Mini Floating Bug Card */}
                  <div className="my-3 rounded-2xl border border-rose-100 bg-rose-50/30 p-2.5 animate-float-slow">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-extrabold text-slate-800 truncate max-w-[110px]">Issue in Task 1</span>
                      <span className="rounded-full bg-rose-100 border border-rose-200 px-1.5 py-0.2 text-[9px] font-black text-rose-700 animate-pulse">
                        CRITICAL
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full w-4/5 animate-pulse" />
                    </div>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                    Rich Bug Reports
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 font-medium leading-relaxed">
                    Clear reproduction steps, screenshot proofs, and executive summaries.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400">Evidence</span>
                  <span className="font-extrabold text-rose-600">Full Visual Logs</span>
                </div>
              </div>

              {/* Bento Card 4: Fast Turnaround (Speed Dial Graphic) */}
              <div className="group relative rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 flex flex-col justify-between overflow-hidden">
                <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl group-hover:bg-amber-400/20 transition" />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 shadow-2xs group-hover:scale-110 transition-transform duration-300">
                      <Gauge className="h-5.5 w-5.5" />
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/60 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-700">
                      &lt; 24h Delivery
                    </span>
                  </div>

                  {/* Motion Graphic Widget: Speedometer Ticker */}
                  <div className="my-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                      <span className="text-xs font-black text-slate-800">Avg 4.2 Hours</span>
                    </div>
                    <span className="rounded-md bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5">
                      Fast Track
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                    Fast Turnaround
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 font-medium leading-relaxed">
                    Post your app testing brief and start getting actionable bug reports in hours.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400">Speed</span>
                  <span className="font-extrabold text-amber-600">Same-Day Results</span>
                </div>
              </div>

            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-700 backdrop-blur-md">
              How It Works
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              A faster way to validate your product before launch
            </h2>
            <p className="mt-4 text-base font-medium leading-relaxed text-slate-600 sm:text-lg">
              Post a testing job, get matched with everyday users, and receive clear bug reports
              and usability feedback.
            </p>
          </div>

          {/* Apple Bento Cards Grid */}
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="group relative rounded-[28px] border border-slate-200/90 bg-white p-7 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_12px_36px_rgba(0,0,0,0.07)]"
              >
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-sm font-black text-white shadow-md group-hover:scale-105 transition-transform">
                    0{index + 1}
                  </div>
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
                    Step 0{index + 1}
                  </span>
                </div>
                <h3 className="text-xl font-extrabold tracking-tight text-slate-900">{step.title}</h3>
                <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">{step.text}</p>
              </div>
            ))}
          </div>

          {/* Popular Categories Frosted Strip */}
          <div className="mt-10 rounded-[28px] border border-slate-200/80 bg-slate-50/80 p-6 backdrop-blur-md shadow-2xs">
            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Popular Test Categories
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {TEST_CATEGORIES.slice(0, 8).map((category) => {
                const Icon = category.icon;
                return (
                  <span
                    key={category.id}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:border-slate-300 transition"
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: category.color }} />
                    {category.name}
                    {category.saExclusive ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                        SA
                      </span>
                    ) : null}
                  </span>
                );
              })}
            </div>
          </div>
          <p className="mt-8 text-center text-sm text-slate-500">
            Serving developers and everyday users across Johannesburg, Cape Town, Durban and beyond.
          </p>
        </section>

        <section className="bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <div className="inline-flex rounded-full bg-red-50 px-4 py-2 text-sm font-medium text-red-600 ring-1 ring-red-100">
                  Built for startups and developers
                </div>
                <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                  Know what breaks, what confuses users, and what to fix first
                </h2>
                <p className="mt-4 text-lg leading-8 text-slate-600">
                  SQUASH helps teams launch with confidence by collecting feedback from real users,
                  not guesses.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Keyed by quote, not name: both cards are from the same
                    founder, so name alone was not unique and React warned
                    about duplicate keys. */}
                {testimonials.map((item) => (
                  <div key={item.quote} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center gap-1 text-green-600">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <Star key={value} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <p className="leading-7 text-slate-600">"{item.quote}"</p>
                    <div className="mt-6 border-t border-slate-100 pt-4">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-sm text-slate-500">{item.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-[32px] bg-slate-900 px-6 py-12 text-white sm:px-10 lg:px-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                  Ready to test before you launch?
                </h2>
                <p className="mt-4 max-w-2xl text-lg text-slate-300">
                  Post your first job or join as a tester and start building better digital
                  experiences with SQUASH.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <a
                  href="/signup?role=developer&next=%2Fpost-job"
                  className="rounded-2xl bg-green-500 px-6 py-3 font-semibold text-white transition hover:bg-green-600"
                >
                  Post a Job
                </a>
                <a
                  href="/signup?role=tester&next=%2Ftester-jobs"
                  className="rounded-2xl border border-white/20 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
                >
                  Become a Tester
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}

