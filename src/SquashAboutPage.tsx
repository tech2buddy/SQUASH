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

type IconItem = {
  icon: LucideIcon;
  label: string;
};

export default function SquashAboutPage() {
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

  const processSteps = [
    { icon: FileText, title: 'You post your app' },
    { icon: Search, title: 'You tell us what to test' },
    { icon: Users, title: 'We handle everything else' },
    { icon: CheckCircle2, title: 'You receive reports after testing and review' },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <PublicHeader />

      <main>
        <section className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-24">
          <div className="animate-fade-up">
            <div className="inline-flex rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
              Quality Assurance
            </div>

            <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              We Are SQUASH.
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-700">
              Every great product in the world was tested by everyday users before it was launched.
              The ones that were not usually get deleted in minutes.
            </p>

            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              SQUASH connects developers and startups with verified real-world testers who evaluate
              apps and websites before launch. Not bots. Not internal teams. Not friends who only
              agree with you. Everyday users who match your market.
            </p>

            <a
              href="/post-job"
              className="mt-8 inline-block rounded-2xl bg-green-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-green-700"
            >
              Get Started
            </a>
          </div>

          <div className="animate-fade-up-delayed relative lg:pl-6">
            <div className="absolute -inset-6 -z-10 hidden rounded-[40px] bg-gradient-to-br from-emerald-100 via-slate-100 to-white blur-2xl sm:block" />
            <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white p-2 shadow-xl sm:p-3">
              <div className="aspect-[4/3] overflow-hidden rounded-[22px]">
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
                We connect developers and startups with verified real-world testers who evaluate
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

        <section className="border-y border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-black tracking-tight text-slate-900">
              Here is how simple it is for you as a developer.
            </h2>

            <div className="mt-10 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
              <div className="grid gap-6 md:grid-cols-4">
                {processSteps.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm"
                  >
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-700 ring-1 ring-green-100">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div className="mt-4 text-sm font-semibold leading-6 text-slate-700">
                      {item.title}
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-black text-slate-900">Your report includes:</h3>
                <div className="mt-5 space-y-3 text-slate-700">
                  {reportItems.map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-green-600" />
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
          <TrustedLogosRow title="Trusted by developers worldwide" />
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
