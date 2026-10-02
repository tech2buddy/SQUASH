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
    <div className="min-h-screen bg-[radial-gradient(ellipse_100%_100%_at_50%_-20%,rgba(0,113,227,0.04),rgba(245,245,247,1))] bg-[#f3f3f6] text-[#1d1d1f]">
      <PublicHeader active="about" />

      <main>
        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:gap-12 sm:px-6 sm:py-14 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-20">
          <div className="animate-fade-up">
            <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-700">
              Quality Assurance
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-apple-tight text-[#1d1d1f] sm:mt-5 sm:text-5xl lg:text-6xl">
              We Are SQUASH.
            </h1>

            <p className="mt-4 max-w-3xl text-base leading-relaxed text-[#86868b] sm:mt-5 sm:text-lg sm:leading-8">
              Every great product in the world was tested by everyday users before it was launched.
              The ones that were not usually get deleted in minutes.
            </p>

            <p className="mt-3 max-w-3xl text-base leading-relaxed text-[#86868b] sm:mt-4 sm:text-lg sm:leading-8">
              SQUASH connects developers and startups with everyday real-world testers who evaluate
              apps and websites before launch. Not bots. Not internal teams. Not friends who only
              agree with you. Everyday users who match your market.
            </p>

            <a
              href="/post-job"
              className="mt-6 w-full text-center sm:w-auto inline-block rounded-full bg-[#e63946] px-6 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-[#d62828] active:scale-98 transition sm:mt-8"
            >
              Get Started
            </a>
          </div>

          <div className="animate-fade-up-delayed relative lg:pl-6">
            <div className="overflow-hidden rounded-2xl border border-white/80 bg-white/70 backdrop-blur-xl p-2 shadow-lg sm:p-3">
              <div className="aspect-[16/10] overflow-hidden rounded-xl sm:aspect-[4/3]">
                <img
                  src="/hero-illustration.png"
                  alt="Team squashing bugs in a mobile app before users see them"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-black/[0.06] bg-white py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-2xl sm:text-4xl font-extrabold tracking-apple-tight text-[#1d1d1f]">
              Here is the reality facing every developer and startup today.
            </h2>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
              {problems.map((item) => (
                <div
                  key={item.label}
                  className="apple-interactive-card p-5 text-center"
                >
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#1d1d1f] text-white shadow-2xs">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="mt-3 text-xs font-extrabold text-[#1d1d1f]">{item.label}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-black/[0.06] bg-[#f5f5f7] px-6 py-3.5 text-center text-xs sm:text-sm font-semibold text-[#86868b]">
              Most of these issues exist before launch day and simply go uncaught.
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div className="flex justify-center">
              <div className="flex h-48 w-48 sm:h-56 sm:w-56 items-center justify-center rounded-full border border-black/10 bg-white/80 backdrop-blur-md shadow-md">
                <ShieldCheck className="h-20 w-20 text-[#e63946]" />
              </div>
            </div>

            <div>
              <div className="inline-flex rounded-full bg-rose-50 px-3.5 py-1 text-xs font-bold text-[#e63946] border border-rose-100">
                SQUASH changes that entirely
              </div>
              <p className="mt-4 text-base sm:text-lg leading-relaxed text-[#86868b]">
                We connect developers and startups with everyday real-world testers who evaluate
                apps and websites before launch.
              </p>
              <div className="mt-5 space-y-3 text-xs sm:text-sm font-medium text-[#1d1d1f]">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Not bots. Not internal teams.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Not friends who tell you only what you want to hear.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#e63946]" />
                  <span>
                    Everyday users who match your target market, devices, and real user behavior.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-black/[0.06] bg-white py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5f5f7] border border-black/[0.06] px-3.5 py-1 text-xs font-bold text-[#86868b] uppercase tracking-wider">
                Simple 4-Step Process
              </span>
              <h2 className="mt-3 text-2xl sm:text-4xl font-extrabold tracking-apple-tight text-[#1d1d1f]">
                How SQUASH Works for Developers
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-[#86868b] font-medium">
                From app submission to developer-ready QA reports in hours.
              </p>
            </div>

            {/* 4 Process Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
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
                  className="apple-interactive-card p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1d1d1f] text-white shadow-2xs">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-bold tracking-widest text-[#86868b] uppercase">
                        STEP {item.step}
                      </span>
                    </div>
                    <h3 className="text-sm font-extrabold text-[#1d1d1f] leading-snug">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#86868b]">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Report Deliverables Banner */}
            <div className="apple-interactive-card p-6 sm:p-8">
              <div className="grid gap-6 md:grid-cols-3 items-center">
                <div className="md:col-span-1">
                  <span className="text-xs font-bold text-[#e63946] uppercase tracking-wider block mb-1">
                    Complete Deliverable
                  </span>
                  <h3 className="text-xl font-extrabold text-[#1d1d1f]">Your Report Includes:</h3>
                  <p className="mt-1 text-xs text-[#86868b]">Everything your team needs to fix issues fast.</p>
                </div>
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-semibold text-[#1d1d1f]">
                  {reportItems.map((item) => (
                    <div key={item} className="flex items-center gap-2.5 rounded-lg bg-[#f5f5f7] p-2.5 border border-black/[0.06]">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
            <div className="apple-interactive-card p-6 flex flex-col justify-between">
              <div className="inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-[#e63946] w-fit">
                Packages from
              </div>
              <div className="mt-4 text-5xl font-extrabold text-[#1d1d1f] tracking-tight">R500</div>
            </div>

            <div className="apple-interactive-card p-6">
              <p className="text-sm sm:text-base leading-relaxed text-[#1d1d1f]">
                For what a traditional UX agency charges for a single engagement, you could run
                comprehensive testing across your product on SQUASH.
              </p>
              <p className="mt-3 text-xs sm:text-sm leading-relaxed text-[#86868b]">
                No agency fees. No lengthy procurement. No waiting weeks for results. Value comes
                from speed, quality, and direct feedback from real users.
              </p>
            </div>
          </div>
        </section>

        <section className="border-y border-black/[0.06] bg-white py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="apple-interactive-card p-6 sm:p-8">
                <h2 className="text-2xl font-extrabold tracking-tight text-[#1d1d1f]">
                  For the testers on our platform
                </h2>
                <p className="mt-3 text-xs sm:text-sm leading-relaxed text-[#86868b]">
                  Young, skilled, everyday South Africans - SQUASH is a legitimate earning
                  opportunity in a space that has been hard to access.
                </p>
                <div className="mt-5 space-y-2.5 text-xs sm:text-sm text-[#1d1d1f] font-medium">
                  {testerBenefits.map((item) => (
                    <div key={item} className="flex items-start gap-2.5">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="apple-interactive-card p-6 sm:p-8 flex items-center">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e63946] text-white shadow-2xs shrink-0">
                    <UserCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-[#1d1d1f]">
                      We create value on both sides.
                    </h3>
                    <p className="mt-1 text-xs text-[#86868b] leading-relaxed">
                      Use apps, form opinions, and turn that into meaningful quality insights.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="apple-interactive-card p-6 sm:p-8">
              <h2 className="text-2xl font-extrabold tracking-tight text-[#1d1d1f]">
                The market is ready.
              </h2>
              <p className="mt-3 text-xs sm:text-sm leading-relaxed text-[#86868b]">
                The South African startup ecosystem is growing rapidly and teams are shipping
                products weekly.
              </p>
            </div>

            <div className="apple-interactive-card p-6 sm:p-8">
              <p className="text-xs sm:text-sm leading-relaxed text-[#86868b]">
                The gap between affordable testing and enterprise testing costs keeps growing.
                SQUASH sits directly in that gap with practical, fast feedback.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <TrustedLogosRow />
        </section>

        <section className="border-t border-black/[0.06] bg-[#1d1d1f] text-white py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">We are SQUASH.</h2>
            <p className="mt-2 text-base font-medium text-slate-300">
              Quality Assurance.
            </p>
            <p className="mt-2 text-xl font-extrabold text-[#e63946]">Find it before they do.</p>

            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="/post-job"
                className="rounded-full bg-[#e63946] px-6 py-3 text-xs font-semibold text-white shadow-md hover:bg-[#d62828] active:scale-98 transition"
              >
                Post a Job
              </a>
              <a
                href="/signup?role=tester"
                className="rounded-full border border-white/20 bg-white/10 px-6 py-3 text-xs font-semibold text-white hover:bg-white/20 transition"
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
