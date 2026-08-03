import {
  CheckCircle2,
  FileText,
  Search,
  ShieldCheck,
  Smartphone,
  Star,
  TrendingDown,
  Trash2,
  UserCircle2,
  Users,
  Wifi,
  type LucideIcon,
} from 'lucide-react';
import PublicFooter from './PublicFooter';
import PublicHeader from './PublicHeader';
import TrustedLogosRow from './TrustedLogosRow';
import { usePageMeta } from './hooks/usePageMeta';

type IconItem = {
  icon: LucideIcon;
  label: string;
};

export default function SquashAboutPage() {
  usePageMeta({
    title: 'About',
    description: 'SQUASH is a South African testing marketplace connecting developers with real everyday users for honest, human bug reports and usability feedback.',
    path: '/about',
  });

  const problems: IconItem[] = [
    { icon: Smartphone, label: 'Wrong device' },
    { icon: Wifi, label: 'Wrong network' },
    { icon: Search, label: 'Wrong assumptions' },
    { icon: Star, label: 'One-star reviews' },
    { icon: Trash2, label: 'Uninstalls' },
    { icon: TrendingDown, label: 'Lost revenue' },
  ];

  const reportItems = [
    'Every bug found',
    'Every screen that confused a real user',
    'Usability scores',
    'Screenshots and recordings',
    'Organized, clear and actionable insights',
  ];

  const testerBenefits = [
    'Earn real money',
    'Paid directly and promptly',
    'Do what you already do every day',
  ];


  return (
    <div className="min-h-screen bg-white text-slate-900">
      <PublicHeader active="about" />

      <main>
        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:gap-12 sm:px-6 sm:py-16 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-24">
          <div className="animate-fade-up">
            <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 sm:text-sm">
              Quality Assurance
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:mt-6 sm:text-5xl lg:text-6xl">
              We Are SQUASH.
            </h1>

            <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-700 sm:mt-6 sm:text-lg sm:leading-8">
              Every great product in the world was tested by everyday users before it was launched.
              The ones that were not usually get deleted in minutes.
            </p>

            <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-600 sm:mt-5 sm:text-lg sm:leading-8">
              SQUASH connects developers and startups with everyday real-world testers who evaluate
              apps and websites before launch. Not bots. Not internal teams. Not friends who only
              agree with you. Everyday users who match your market.
            </p>

            <a
              href="/post-job"
              className="mt-6 w-full text-center sm:w-auto inline-block rounded-2xl bg-emerald-600 px-6 py-3.5 text-base font-bold text-white shadow-sm transition hover:bg-emerald-700 sm:mt-8"
            >
              Get Started
            </a>
          </div>

          <div className="animate-fade-up-delayed relative lg:pl-6">
            <div className="absolute -inset-6 -z-10 hidden rounded-[40px] bg-gradient-to-br from-emerald-100 via-slate-100 to-white blur-2xl sm:block" />
            <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white p-2 shadow-lg sm:rounded-[30px] sm:p-3 sm:shadow-xl">
              <div className="aspect-[16/10] overflow-hidden rounded-[18px] sm:aspect-[4/3] sm:rounded-[22px]">
                <img
                  src="/hero-illustration.png"
                  alt="Team squashing bugs in a mobile app before users see them"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-black tracking-tight text-slate-900">
              Here is the reality facing every developer and startup today.
            </h2>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
              {problems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-700">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="mt-3 text-sm font-semibold text-slate-700">{item.label}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-center text-lg font-semibold text-slate-700 shadow-sm">
              Most of these issues exist before launch day and simply go uncaught.
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div className="flex justify-center">
              <div className="flex h-64 w-64 items-center justify-center rounded-full border border-green-200 bg-green-50 shadow-sm">
                <ShieldCheck className="h-24 w-24 text-green-700" />
              </div>
            </div>

            <div>
              <div className="inline-flex rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 ring-1 ring-green-100">
                SQUASH changes that entirely
              </div>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                We connect developers and startups with everyday real-world testers who evaluate
                apps and websites before launch.
              </p>
              <div className="mt-6 space-y-4 text-base text-slate-700">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-green-600" />
                  <span>Not bots. Not internal teams.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-green-600" />
                  <span>Not friends who tell you only what you want to hear.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-green-600" />
                  <span>
                    Everyday users who match your target market, devices, and real user behavior.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200/80 bg-slate-50/50 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-3.5 py-1 text-xs font-extrabold text-emerald-700 uppercase tracking-wider">
                Simple 4-Step Process
              </span>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                How SQUASH Works for Developers
              </h2>
              <p className="mt-3 text-base text-slate-600 font-medium">
                From app submission to developer-ready QA reports in hours.
              </p>
            </div>

            {/* 4 Process Cards */}
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4 mb-10">
              {[
                {
                  step: '01',
                  icon: FileText,
                  title: 'Post Your App',
                  desc: 'Submit your staging URL, web app, or mobile build with target requirements.',
                },
                {
                  step: '02',
                  icon: Search,
                  title: 'Define Test Tasks',
                  desc: 'List the specific user flows, checkout steps, or edge cases you want checked.',
                },
                {
                  step: '03',
                  icon: Users,
                  title: 'Matched QA Testing',
                  desc: 'Everyday testers on matching devices run real-world testing sessions.',
                },
                {
                  step: '04',
                  icon: CheckCircle2,
                  title: 'Get Verified Reports',
                  desc: 'Receive organized bug logs, screenshot proofs, and executive summaries.',
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs hover:border-emerald-200 hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100/80 shadow-2xs">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-black tracking-widest text-slate-300 uppercase">
                        STEP {item.step}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600 font-medium">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Report Deliverables Banner */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
              <div className="grid gap-6 md:grid-cols-3 items-center">
                <div className="md:col-span-1">
                  <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-wider block mb-1">
                    Complete Deliverable
                  </span>
                  <h3 className="text-xl font-black text-slate-900">Your Report Includes:</h3>
                  <p className="mt-1 text-xs text-slate-500 font-medium">Everything your team needs to fix issues fast.</p>
                </div>
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold text-slate-700">
                  {reportItems.map((item) => (
                    <div key={item} className="flex items-center gap-2.5 rounded-xl bg-slate-50 p-3 border border-slate-100">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
            <div className="rounded-[28px] border border-green-200 bg-green-50 p-8 shadow-sm">
              <div className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-green-700 ring-1 ring-green-200">
                Packages from
              </div>
              <div className="mt-5 text-6xl font-black text-slate-900">R500</div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-lg leading-8 text-slate-700">
                For what a traditional UX agency charges for a single engagement, you could run
                comprehensive testing across your product on SQUASH.
              </p>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                No agency fees. No lengthy procurement. No waiting weeks for results. Value comes
                from speed, quality, and direct feedback from real users.
              </p>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
                <h2 className="text-3xl font-black tracking-tight text-slate-900">
                  For the testers on our platform
                </h2>
                <p className="mt-5 text-lg leading-8 text-slate-600">
                  Young, skilled, everyday South Africans - SQUASH is a legitimate earning
                  opportunity in a space that has been hard to access.
                </p>
                <div className="mt-6 space-y-4 text-slate-700">
                  {testerBenefits.map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-green-600" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-green-200 bg-green-50 p-8 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-green-700 shadow-sm">
                    <UserCircle2 className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">
                      We create value on both sides.
                    </h3>
                    <p className="mt-2 text-slate-700">
                      Use apps, form opinions, and turn that into meaningful quality insights.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-3xl font-black tracking-tight text-slate-900">
                The market is ready.
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                The South African startup ecosystem is growing rapidly and teams are shipping
                products weekly.
              </p>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-lg leading-8 text-slate-600">
                The gap between affordable testing and enterprise testing costs keeps growing.
                SQUASH sits directly in that gap with practical, fast feedback.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <TrustedLogosRow />
        </section>

        <section className="border-t border-slate-200 bg-green-50">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-4xl font-black tracking-tight text-slate-900">We are SQUASH.</h2>
              <p className="mt-4 text-xl font-semibold text-slate-700">
                Quality Assurance.
              </p>
              <p className="mt-3 text-2xl font-black text-green-700">Find it before they do.</p>
            </div>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="/post-job"
                className="rounded-2xl bg-green-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-green-700"
              >
                Post a Job
              </a>
              <a
                href="/tester-jobs"
                className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Become a Tester
              </a>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
