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

  const stats = [
    { label: 'Real User Testing', icon: Users },
    { label: 'Verified Testers', icon: ShieldCheck },
    { label: 'Detailed Bug Reports', icon: Bug },
    { label: 'Fast Turnaround', icon: Gauge },
  ];

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
        'Squash helped us find checkout issues before launch. The feedback was fast, practical, and easy to act on.',
      name: 'Sipho N.',
      role: 'Founder, PayFlow',
    },
    {
      quote:
        'We got clear bug reports, helpful usability notes, and real everyday users who matched our audience.',
      name: 'Lerato D.',
      role: 'CTO, HealthApp',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <PublicHeader active="home" />

      <main>
        <section className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div className="animate-fade-up flex flex-col justify-center">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              Catch bugs before your users do
            </div>

            <h1 className="max-w-xl text-4xl font-black leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Squash <span className="text-red-500">Bugs</span> Before{' '}
              <span className="text-green-600">Launch</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              SQUASH connects developers and startups with everyday users who test your products, find bugs,
              complete usability tests, and deliver real feedback before launch day.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="/signup?role=developer&next=%2Fpost-job"
                className="rounded-2xl bg-green-500 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-green-600"
              >
                Post a Job
              </a>
              <a
                href="/signup?role=tester&next=%2Ftester-jobs"
                className="rounded-2xl border border-slate-300 px-6 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Become a Tester
              </a>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <span className="text-green-600">&#10003;</span> Real everyday users
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">&#10003;</span> Screenshots and reports
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">&#10003;</span> Faster product feedback
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">&#10003;</span> Built for South Africa
              </div>
            </div>
          </div>

          <div className="animate-fade-up-delayed relative lg:pl-6">
            <div className="absolute -inset-6 -z-10 hidden rounded-[40px] bg-gradient-to-br from-emerald-100 via-slate-100 to-white blur-2xl sm:block" />
            <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white p-2 shadow-xl sm:p-3">
              <div className="aspect-[4/3] overflow-hidden rounded-[22px]">
                <img
                  src="/about-hero.png"
                  alt="Bug testing illustration with code, charts, and magnifying glass"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-slate-50">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-8 sm:grid-cols-4 sm:px-6 lg:px-8">
            {stats.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="apple-bento-card apple-press-effect animate-fade-up group flex flex-col items-center justify-center gap-3.5 p-5 text-center cursor-default hover:border-green-200"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-700 shadow-[0_6px_16px_-6px_rgba(15,23,42,0.35)] transition-transform duration-200 ease-out group-hover:scale-[1.03]">
                    <Icon className="h-6 w-6 text-white" strokeWidth={2} />
                  </div>
                  <div className="text-base font-bold text-slate-800 sm:text-lg">{item.label}</div>
                </div>
              );
            })}
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex rounded-full bg-green-50 px-4 py-2 text-sm font-medium text-green-700 ring-1 ring-green-100">
              How it works
            </div>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              A faster way to validate your product before launch
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Post a testing job, get matched with everyday users, and receive clear bug reports
              and usability feedback.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold text-white">
                  {index + 1}
                </div>
                <h3 className="text-xl font-bold text-slate-900">{step.title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{step.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="text-sm font-semibold text-slate-700">Popular test categories</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {TEST_CATEGORIES.slice(0, 8).map((category) => {
                const Icon = category.icon;
                return (
                  <span
                    key={category.id}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: category.color }} />
                    {category.name}
                    {category.saExclusive ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
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
                {testimonials.map((item) => (
                  <div key={item.name} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
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

