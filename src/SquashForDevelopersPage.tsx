import {
  BarChart3,
  Bug,
  CheckCircle2,
  Clock3,
  Code2,
  FileText,
  Laptop,
  Link as LinkIcon,
  ShieldCheck,
  Smartphone,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import PublicFooter from './PublicFooter';
import PublicHeader from './PublicHeader';
import FeaturedTesterCard from './components/FeaturedTesterCard';
import { TEST_CATEGORIES } from './components/testCategories';
import TrustedLogosRow from './TrustedLogosRow';
import { usePageMeta } from './hooks/usePageMeta';

type ItemWithIcon = {
  number?: string;
  title: string;
  text: string;
  icon: LucideIcon;
};

export default function SquashForDevelopersPage() {
  usePageMeta({
    title: 'For Developers',
    description: 'Post a testing job and get real bug reports and usability feedback from everyday South African testers before you launch. Pay per test, no subscriptions.',
    path: '/for-developers',
  });

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
      text: 'Everyday testers apply and you choose the best fit.',
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
      title: 'Everyday Users',
      text: 'Work with everyday users on real devices and environments.',
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
    <div className="min-h-screen bg-[radial-gradient(ellipse_100%_100%_at_50%_-20%,rgba(0,113,227,0.04),rgba(245,245,247,1))] bg-[#f3f3f6] text-[#1d1d1f]">
      <PublicHeader active="developers" />

      <main>
        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:gap-12 sm:px-6 sm:py-14 lg:grid-cols-2 lg:px-8 lg:py-20">
          <div className="animate-fade-up flex flex-col justify-center">
            <div className="inline-flex w-fit rounded-full border border-rose-100 bg-rose-50 px-3.5 py-1 text-xs font-bold text-[#e63946]">
              Built for teams that want better launches
            </div>

            <h1 className="mt-4 max-w-xl text-3xl font-extrabold leading-tight tracking-apple-tight text-[#1d1d1f] sm:mt-5 sm:text-5xl lg:text-6xl">
              Get Real Feedback.
              <br />
              Ship Better Apps.
            </h1>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-[#86868b] sm:mt-5 sm:text-lg sm:leading-8">
              Squash connects you with everyday testers who find bugs, verify flows and help you
              deliver flawless digital experiences.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:mt-7 sm:flex-row">
              <a
                href="/post-job"
                className="w-full text-center rounded-full bg-[#e63946] px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-rose-500/20 hover:bg-[#d62828] active:scale-98 transition sm:w-auto"
              >
                Post a New Job
              </a>
              <a
                href="#how-it-works"
                className="w-full text-center rounded-full border border-black/10 bg-white/80 backdrop-blur-md px-6 py-3.5 text-sm font-semibold text-[#1d1d1f] transition hover:bg-white sm:w-auto shadow-2xs"
              >
                View How It Works
              </a>
            </div>
          </div>

          <div className="animate-fade-up-delayed flex items-center justify-center">
            <div className="w-full max-w-2xl rounded-2xl border border-white/80 bg-white/70 backdrop-blur-xl p-3.5 sm:p-5 shadow-lg">
              <div className="rounded-xl border border-black/[0.06] bg-white p-3.5 sm:p-5 shadow-2xs">
                <div className="mb-3 sm:mb-4 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-amber-400" />
                  <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-rose-400" />
                </div>

                <div className="grid gap-3.5 sm:gap-4 md:grid-cols-[0.95fr_1.05fr]">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="rounded-xl border border-black/[0.06] bg-[#f5f5f7] p-4 sm:p-5">
                      <div className="mb-3 sm:mb-4 grid h-14 w-14 sm:h-16 sm:w-16 place-items-center rounded-xl bg-[#e63946] text-white shadow-2xs">
                        <Bug className="h-6 w-6 sm:h-8 sm:w-8" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-2.5 sm:h-3 rounded-full bg-slate-200" />
                        <div className="h-2.5 sm:h-3 w-3/4 rounded-full bg-slate-200" />
                        <div className="h-2.5 sm:h-3 w-1/2 rounded-full bg-slate-200" />
                      </div>
                    </div>

                    <div className="rounded-xl border border-black/[0.06] bg-white p-4 sm:p-5">
                      <div className="mb-3 sm:mb-4 h-16 sm:h-20 rounded-xl bg-rose-50 p-3 sm:p-4">
                        <div className="flex h-full items-end justify-between gap-1.5 sm:gap-2">
                          {[30, 55, 40, 72, 60, 85].map((h, i) => (
                            <div key={i} className="flex flex-1 items-end">
                              <div
                                className="w-full rounded-t-xl bg-[#e63946]/80"
                                style={{ height: `${h}%` }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <div className="rounded-xl border border-black/[0.06] bg-white p-4 sm:p-5">
                      <div className="space-y-2.5 sm:space-y-3">
                        {[1, 2, 3].map((item) => (
                          <div
                            key={item}
                            className="flex items-center gap-2.5 sm:gap-3 rounded-lg bg-[#f5f5f7] px-3 py-2.5 sm:py-3"
                          >
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            <div className="h-2.5 sm:h-3 flex-1 rounded-full bg-slate-200" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:gap-4 grid-cols-2">
                      <div className="rounded-xl border border-black/[0.06] bg-white p-4 sm:p-5 flex items-center justify-center">
                        <div className="flex h-14 w-14 sm:h-20 sm:w-20 items-center justify-center rounded-full border-4 sm:border-6 border-rose-100 text-xs sm:text-sm font-bold text-[#1d1d1f]">
                          72%
                        </div>
                      </div>
                      <div className="rounded-xl border border-black/[0.06] bg-white p-4 sm:p-5">
                        <div className="mb-2 sm:mb-3">
                          <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-[#e63946]" />
                        </div>
                        <div className="space-y-2 sm:space-y-3">
                          <div className="h-2.5 sm:h-3 rounded-full bg-slate-200" />
                          <div className="h-2.5 sm:h-3 w-5/6 rounded-full bg-slate-200" />
                          <div className="h-2.5 sm:h-3 w-2/3 rounded-full bg-slate-200" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-y border-black/[0.06] bg-white py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-flex rounded-full bg-[#f5f5f7] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#86868b] border border-black/[0.06]">
                HOW IT WORKS
              </div>
            </div>

            <div className="mt-8 sm:mt-12 grid gap-4 sm:gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {steps.map((step) => (
                <div key={step.number} className="apple-interactive-card p-5 sm:p-6">
                  <div className="mb-4 sm:mb-5 grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-xl bg-[#1d1d1f] text-white shadow-2xs">
                    <step.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div className="text-xs font-bold text-[#e63946] uppercase tracking-wider">Step {step.number}</div>
                  <h3 className="mt-1 text-base sm:text-lg font-extrabold text-[#1d1d1f]">{step.title}</h3>
                  <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-[#86868b]">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="apple-interactive-card p-6 sm:p-10">
            <div className="text-center">
              <div className="inline-flex rounded-full bg-rose-50 px-4 py-1 text-xs font-extrabold text-[#e63946] border border-rose-100">
                Zero Friction Integration — 2 Minute Setup
              </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-black/[0.06] bg-[#f5f5f7] p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1d1d1f] text-white shadow-2xs">
                    <Code2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#e63946]">Option A</p>
                    <h3 className="text-lg font-extrabold text-[#1d1d1f]">Add One Script Tag</h3>
                  </div>
                </div>
                <p className="mt-3 text-xs sm:text-sm text-[#86868b] leading-relaxed">
                  Paste one line into your staging site. Our testing toolbar appears automatically for
                  testers only. Your real users never see it.
                </p>
                <pre className="mt-4 overflow-x-auto rounded-xl bg-[#1d1d1f] p-4 text-xs font-mono text-slate-100 shadow-md">
{`<script
  src="https://www.squashqa.co.za/widget.js"
  data-job="YOUR-JOB-ID">
</script>`}
                </pre>
              </div>

              <div className="rounded-2xl border border-black/[0.06] bg-[#f5f5f7] p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1d1d1f] text-white shadow-2xs">
                    <LinkIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#e63946]">Option B</p>
                    <h3 className="text-lg font-extrabold text-[#1d1d1f]">Just Submit Your URL</h3>
                  </div>
                </div>
                <p className="mt-3 text-xs sm:text-sm text-[#86868b] leading-relaxed">
                  No code required. Submit your website link when posting a job. We wrap it in a
                  secure Squash session and testers access it through our platform.
                </p>
                <div className="mt-4 rounded-xl border border-black/[0.06] bg-white p-3.5 text-xs text-[#1d1d1f]">
                  <div><span className="font-bold">You submit:</span> https://myapp.com/staging</div>
                  <div className="mt-1"><span className="font-bold text-[#e63946]">We create:</span> www.squashqa.co.za/test/JOB-ID</div>
                </div>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-[#86868b]">
              Either way, only logged-in Squash testers can see the testing toolbar. Your real users and
              customers are completely unaffected.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="apple-interactive-card p-6 sm:p-8">
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#1d1d1f] tracking-tight">Target The Exact Audience You Need</h3>
            <p className="mt-1.5 text-xs sm:text-sm text-[#86868b]">
              Filter testers by device model, real-world network conditions, local languages, and app domain expertise. Get feedback from users matching your exact target demographic.
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <FeaturedTesterCard
                name="Township & Mobile Money"
                icon={Smartphone}
                subtitle="Target Demographic Filter"
                specializations={['township-network', 'zulu', 'ecommerce', 'samsung-a-series']}
              />
              <FeaturedTesterCard
                name="Fintech & Load Shedding"
                icon={Zap}
                subtitle="Target Demographic Filter"
                specializations={['2g-3g-only', 'load-shedding', 'banking', 'xhosa']}
              />
              <FeaturedTesterCard
                name="iOS & Web App Experience"
                icon={Laptop}
                subtitle="Target Demographic Filter"
                specializations={['iphone-12-plus', 'education', 'afrikaans', 'desktop-laptop']}
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex rounded-full bg-rose-50 px-4 py-1 text-xs font-extrabold text-[#e63946] border border-rose-100">
              WHY DEVELOPERS LOVE SQUASH
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-4">
            {benefits.map((item) => (
              <div key={item.title} className="apple-interactive-card p-6 flex flex-col justify-between">
                <div>
                  <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-[#1d1d1f] text-white shadow-2xs">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-extrabold text-[#1d1d1f]">{item.title}</h3>
                  <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-[#86868b]">{item.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 apple-interactive-card p-6">
            <div className="text-xs font-bold text-[#86868b] uppercase tracking-wider">Test categories available</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {TEST_CATEGORIES.map((category) => {
                const Icon = category.icon;
                return (
                  <span
                    key={category.id}
                    className="inline-flex items-center gap-2 rounded-full border border-black/[0.06] bg-[#f5f5f7] px-3 py-1.5 text-xs font-semibold text-[#1d1d1f]"
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: category.color }} />
                    {category.name}
                    {category.saExclusive ? (
                      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[9px] font-extrabold text-[#e63946] border border-rose-100">SA 🇿🇦</span>
                    ) : null}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="mt-6 apple-interactive-card p-6 sm:p-8">
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#1d1d1f] tracking-tight">Live Test Sessions</h3>
            <p className="mt-1.5 text-xs sm:text-sm text-[#86868b] leading-relaxed">
              Ask us about arranging a session where you watch a real user navigate your app via video call.
              We will confirm availability, format, and pricing with you.
            </p>
            <a
              href="/live-session"
              className="mt-4 inline-flex rounded-full bg-[#e63946] px-5 py-2.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#d62828] active:scale-98 transition"
            >
              Ask About Live Sessions
            </a>
          </div>

          <div className="mt-10">
            <TrustedLogosRow />
          </div>

          <div className="mt-10 relative overflow-hidden rounded-2xl border border-black/[0.06] bg-[#1d1d1f] p-8 text-white shadow-lg">
            <div className="pointer-events-none absolute -left-12 -top-12 h-36 w-36 rounded-full bg-[#e63946]/20 blur-3xl" />
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between relative z-10">
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">Ready to ship a better product?</h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-300">
                  Join the developers using Squash to build bug-free apps.
                </p>
              </div>
              <a
                href="/post-job"
                className="rounded-full bg-[#e63946] px-6 py-3 text-xs font-semibold text-white shadow-sm hover:bg-[#d62828] active:scale-98 transition shrink-0"
              >
                Post a New Job
              </a>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
