import {
  Banknote,
  BriefcaseBusiness,
  Bug,
  CheckCircle2,
  Compass,
  Laptop2,
  Monitor,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import PublicFooter from './PublicFooter';
import PublicHeader from './PublicHeader';
import TrustedLogosRow from './TrustedLogosRow';
import { TEST_TYPES } from './lib/testTypes';
import { TESTER_POOL_SHARE } from './lib/pricing';
import { usePageMeta } from './hooks/usePageMeta';

type ItemWithIcon = {
  number?: string;
  title: string;
  text: string;
  icon: LucideIcon;
};

export default function SquashForTestersPage() {
  usePageMeta({
    title: 'For Testers',
    description: 'Earn money testing apps and websites in South Africa. Find bugs, complete usability tests, and get paid via EFT â€” flexible, remote work on your own schedule.',
    path: '/for-testers',
  });

  const steps: ItemWithIcon[] = [
    {
      number: '1',
      title: 'Find a Test',
      text: 'Browse open tests that match your devices, skills and availability.',
      icon: Compass,
    },
    {
      number: '2',
      title: 'Apply & Start',
      text: 'Apply to tests and follow the instructions to start testing.',
      icon: BriefcaseBusiness,
    },
    {
      number: '3',
      title: 'Report Issues',
      text: 'Find bugs, record steps, screenshots and submit detailed reports.',
      icon: Bug,
    },
    {
      number: '4',
      title: 'Get Paid',
      text: 'Get paid once your report is approved by the developer.',
      icon: Banknote,
    },
  ];

  const benefits: ItemWithIcon[] = [
    {
      title: 'Earn Money',
      text: 'Get paid for every valid bug report you submit.',
      icon: Banknote,
    },
    {
      title: 'Flexible & Remote',
      text: 'Test anytime, anywhere using your own devices.',
      icon: Star,
    },
    {
      title: 'Build Your Profile',
      text: 'Gain experience, improve your skills and boost your reputation.',
      icon: Sparkles,
    },
    {
      title: 'Be Part of a Community',
      text: 'Join a community of testers and get support, tips and updates.',
      icon: CheckCircle2,
    },
  ];

  const opportunityItems = [
    'Web, Mobile & Desktop Apps - test all kinds of applications.',
    'Projects from Startups to Enterprises - work on exciting real-world products.',
    'New Tests Posted Daily - always something new to test.',
  ];

  const earningRows = TEST_TYPES.map((testType) => ({
    type: testType.label,
    amount: `R${Math.floor(testType.ratePerTesterZar * TESTER_POOL_SHARE)} per test`,
    time: `About ${testType.estimatedMinutes} minutes`,
  }));

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_100%_100%_at_50%_-20%,rgba(0,113,227,0.04),rgba(245,245,247,1))] bg-[#f3f3f6] text-[#1d1d1f]">
      <PublicHeader active="testers" />

      <main>
        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:gap-12 sm:px-6 sm:py-14 lg:grid-cols-2 lg:px-8 lg:py-20">
          <div className="animate-fade-up flex flex-col justify-center">
            <div className="inline-flex w-fit rounded-full border border-rose-100 bg-rose-50 px-3.5 py-1 text-xs font-bold text-[#e63946]">
              Real testing opportunities for everyday users
            </div>

            <h1 className="mt-4 max-w-xl text-3xl font-extrabold leading-tight tracking-apple-tight text-[#1d1d1f] sm:mt-5 sm:text-5xl lg:text-6xl">
              Find Bugs.
              <br />
              Earn Money.
              <br />
              Help Build Better Apps.
            </h1>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-[#86868b] sm:mt-5 sm:text-lg sm:leading-8">
              Squash connects you with developers who need real testing from everyday users like
              you.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:mt-7 sm:flex-row">
              <a
                href="/signup?role=tester"
                className="w-full text-center rounded-full bg-[#e63946] px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-rose-500/20 hover:bg-[#d62828] active:scale-98 transition sm:w-auto"
              >
                Become a Tester
              </a>
              <a
                href="#how-it-works"
                className="w-full text-center rounded-full border border-black/10 bg-white/80 backdrop-blur-md px-6 py-3.5 text-sm font-semibold text-[#1d1d1f] transition hover:bg-white sm:w-auto shadow-2xs"
              >
                See How It Works
              </a>
            </div>
          </div>

          <div className="animate-fade-up-delayed flex items-center justify-center">
            <div className="w-full max-w-2xl rounded-[24px] border border-slate-200 bg-slate-50 p-3.5 sm:rounded-[28px] sm:p-5 shadow-xl">
              <div className="rounded-[20px] border border-slate-200 bg-white p-4 sm:rounded-[24px] sm:p-6 shadow-sm">
                <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr] md:items-center">
                  <div className="space-y-4">
                    <div className="mx-auto grid h-40 w-24 place-items-center rounded-[28px] border-4 border-slate-900 bg-white shadow-sm">
                      <Laptop2 className="h-10 w-10 text-[#e63946]" />
                    </div>
                    <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-center">
                      <div className="text-sm font-semibold text-slate-700">Task Approved</div>
                      <div className="mt-2 grid place-items-center">
                        <CheckCircle2 className="h-8 w-8 text-[#e63946]" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <div className="text-lg font-bold text-slate-900">Tester Earnings</div>
                      <div className="mt-4 text-4xl font-black text-slate-900">R3,240</div>
                      <div className="mt-4 flex h-20 items-end justify-between gap-2">
                        {[20, 30, 45, 40, 65].map((h, i) => (
                          <div key={i} className="flex flex-1 items-end">
                            <div className="w-full rounded-t-xl bg-[#e63946]/80" style={{ height: `${h}%` }} />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="text-sm font-semibold text-slate-500">Open Tests</div>
                        <div className="mt-2 text-3xl font-black text-slate-900">18</div>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="text-sm font-semibold text-slate-500">Approved Reports</div>
                        <div className="mt-2 text-3xl font-black text-slate-900">42</div>
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
                HOW IT WORKS (FOR TESTERS)
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

        {/* Recommended Setup for Best Performance Card - 3D Animated Motion Card */}
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="group relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/60 p-6 sm:p-10 shadow-sm transition-all duration-500 hover:shadow-xl hover:border-emerald-200">
            {/* Ambient Background Glow */}
            <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-emerald-500/5 blur-3xl transition duration-500 group-hover:bg-emerald-500/10" />

            <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
              {/* Left Column: Text & Badges */}
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-red-200/80 bg-red-50/80 px-3.5 py-1.5 text-xs font-extrabold text-red-700 shadow-2xs">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white shadow-xs">
                    <Laptop2 className="h-3 w-3" />
                  </div>
                  <span>Optimal Performance Setup</span>
                </div>

                <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 leading-tight">
                  Laptop / PC + Mobile Phone Recommended
                </h2>

                <p className="text-sm sm:text-base leading-relaxed text-slate-600 font-medium max-w-2xl">
                  While mobile app tests can be performed directly on your smartphone, pairing your <strong>Mobile Device</strong> with a <strong>Laptop or PC</strong> guarantees optimal performance, priority job invites for web QA jobs, and faster screen recording management.
                </p>

                {/* Motion Specs Pills */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200/90 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-2xs hover:border-slate-300 transition">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                      <ShieldCheck className="h-3.5 w-3.5" />
                    </div>
                    <span>Priority Web QA Invites</span>
                  </div>

                  <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200/90 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-2xs hover:border-slate-300 transition">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                      <TrendingUp className="h-3.5 w-3.5" />
                    </div>
                    <span>Maximum Earnings Potential</span>
                  </div>
                </div>
              </div>

              {/* Right Column: 3D Motion Device Graphic Visual */}
              <div className="lg:col-span-5 relative flex items-center justify-center pt-4 lg:pt-0">
                <div className="relative w-full max-w-xs sm:max-w-sm aspect-[4/3] flex items-center justify-center">
                  
                  {/* Laptop 3D Graphic Canvas */}
                  <div className="absolute inset-x-2 bottom-2 rounded-2xl border border-slate-200 bg-slate-900 p-3 shadow-2xl transition-transform duration-500 group-hover:-translate-y-2 group-hover:rotate-1">
                    {/* Screen */}
                    <div className="aspect-[16/10] w-full rounded-xl bg-slate-950 p-2.5 flex flex-col justify-between border border-slate-800 relative overflow-hidden">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-2 rounded-full bg-red-500" />
                          <div className="h-2 w-2 rounded-full bg-amber-500/80" />
                          <div className="h-2 w-2 rounded-full bg-red-600/80" />
                        </div>
                        <div className="text-[9px] font-mono font-bold text-red-500">SQUASH Web QA Active</div>
                      </div>
                      <div className="space-y-1.5 py-2">
                        <div className="h-2 w-3/4 rounded bg-slate-800 animate-pulse" />
                        <div className="h-2 w-1/2 rounded bg-slate-800" />
                        <div className="h-2 w-5/6 rounded bg-slate-800/80" />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold border-t border-slate-800/60 pt-1">
                        <span className="flex items-center gap-1"><Monitor className="h-3 w-3 text-red-500" /> Desktop / PC</span>
                        <span className="text-red-500 font-bold">Web Active</span>
                      </div>
                    </div>
                    {/* Laptop Keyboard Base */}
                    <div className="mt-1 flex items-center justify-center">
                      <div className="h-1 w-12 rounded-full bg-slate-700" />
                    </div>
                  </div>

                  {/* Smartphone 3D Graphic Canvas (Overlapping in Perspective) */}
                  <div className="absolute -left-2 top-0 w-28 sm:w-32 rounded-2xl border-2 border-slate-900 bg-white p-1.5 shadow-2xl transition-transform duration-500 group-hover:translate-x-2 group-hover:-translate-y-3 group-hover:-rotate-3">
                    <div className="rounded-xl bg-slate-900 p-2 text-white space-y-2">
                      <div className="flex justify-center">
                        <div className="h-1 w-5 rounded-full bg-slate-700" />
                      </div>
                      <div className="space-y-1 py-1">
                        <div className="flex items-center gap-1">
                          <Smartphone className="h-3.5 w-3.5 text-red-500 shrink-0" />
                          <span className="text-[9px] font-bold text-white truncate">Mobile QA</span>
                        </div>
                        <div className="h-1.5 w-full rounded bg-red-500/30" />
                        <div className="h-1.5 w-2/3 rounded bg-slate-700" />
                      </div>
                      <div className="rounded-lg bg-red-600 py-0.5 text-center text-[9px] font-extrabold text-white shadow-xs">
                        Mobile Active
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="apple-interactive-card p-6 sm:p-8">
            <h2 className="text-xl sm:text-3xl font-extrabold text-[#1d1d1f] tracking-tight">How Much Can You Earn?</h2>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full rounded-xl border border-black/[0.06] overflow-hidden">
                <thead>
                  <tr className="bg-[#f5f5f7] text-left text-xs font-bold text-[#86868b] uppercase tracking-wider">
                    <th className="px-4 py-3 font-bold">Test Type</th>
                    <th className="px-4 py-3 font-bold">Earnings</th>
                    <th className="px-4 py-3 font-bold">Time Required</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.06]">
                  {earningRows.map((row) => (
                    <tr key={row.type} className="text-xs text-[#1d1d1f] hover:bg-[#f5f5f7]/50 transition-colors">
                      <td className="px-4 py-3.5 font-extrabold text-[#1d1d1f]">{row.type}</td>
                      <td className="px-4 py-3.5 font-bold text-[#e63946]">{row.amount}</td>
                      <td className="px-4 py-3.5 text-[#86868b]">{row.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-xs text-[#86868b] leading-relaxed">
              Approved earnings are scheduled for the next eligible Friday EFT payout, subject to banking verification, review, and any account holds.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex rounded-full bg-rose-50 px-4 py-1 text-xs font-extrabold text-[#e63946] border border-rose-100">
              WHY TESTERS LOVE SQUASH
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

          <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1fr_0.8fr]">
            <div className="apple-interactive-card p-6">
              <h3 className="text-xl font-extrabold text-[#1d1d1f] tracking-tight">Lots of Opportunities</h3>
              <div className="mt-4 space-y-3">
                {opportunityItems.map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-[#86868b] leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="apple-interactive-card p-8 flex flex-col justify-center text-center">
              <h3 className="text-xl font-extrabold text-[#1d1d1f] tracking-tight">Earn What You Deserve</h3>
              <div className="mt-4">
                <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#e63946]">
                  R630 - R6,320+
                </div>
                <div className="mt-2 text-xs text-[#86868b] font-medium">
                  per month depending on activity and report quality.
                </div>
              </div>
            </div>

            <div className="apple-interactive-card p-6 border-l-4 border-l-[#e63946]">
              <div className="text-3xl font-extrabold text-[#e63946]">“</div>
              <p className="mt-1 text-xs text-[#86868b] leading-relaxed italic">
                We built Squash so your time and your honesty are worth something. Every report
                you submit helps a real developer ship something better.
              </p>
              <div className="mt-4 text-xs font-extrabold text-[#1d1d1f]">M. Khosa, Founder, SQUASH</div>
            </div>
          </div>

          <div className="mt-10">
            <TrustedLogosRow />
          </div>

          <div className="mt-10 relative overflow-hidden rounded-2xl border border-black/[0.06] bg-[#1d1d1f] p-8 text-white shadow-lg">
            <div className="pointer-events-none absolute -left-12 -top-12 h-36 w-36 rounded-full bg-[#e63946]/20 blur-3xl" />
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between relative z-10">
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">Ready to start testing and earning?</h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-300">
                  Join the testers on Squash turning their time into real earnings.
                </p>
              </div>
              <a
                href="/tester-jobs"
                className="rounded-full bg-[#e63946] px-6 py-3 text-xs font-semibold text-white shadow-sm hover:bg-[#d62828] active:scale-98 transition shrink-0"
              >
                Browse Open Tests
              </a>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
