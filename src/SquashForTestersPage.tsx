import {
  Banknote,
  BriefcaseBusiness,
  Bug,
  CheckCircle2,
  Compass,
  Laptop2,
  Sparkles,
  Star,
  type LucideIcon,
} from 'lucide-react';
import PublicFooter from './PublicFooter';
import PublicHeader from './PublicHeader';
import TrustedLogosRow from './TrustedLogosRow';
import { TEST_TYPES } from './lib/testTypes';
import { TESTER_POOL_SHARE } from './lib/jobApi';

type ItemWithIcon = {
  number?: string;
  title: string;
  text: string;
  icon: LucideIcon;
};

export default function SquashForTestersPage() {
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
    <div className="min-h-screen bg-white text-slate-900">
      <PublicHeader active="testers" />

      <main>
        <section className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div className="animate-fade-up flex flex-col justify-center">
            <div className="inline-flex w-fit rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
              Real testing opportunities for everyday users
            </div>

            <h1 className="mt-6 max-w-xl text-4xl font-black leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Find Bugs.
              <br />
              Earn Money.
              <br />
              Help Build Better Apps.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Squash connects you with developers who need real testing from everyday users like
              you.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="/tester-jobs"
                className="rounded-2xl bg-green-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-green-700"
              >
                Browse Open Tests
              </a>
              <a
                href="#how-it-works"
                className="rounded-2xl border border-slate-300 px-6 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                How It Works
              </a>
            </div>
          </div>

          <div className="animate-fade-up-delayed flex items-center justify-center">
            <div className="w-full max-w-2xl rounded-[28px] border border-slate-200 bg-slate-50 p-5 shadow-xl">
              <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr] md:items-center">
                  <div className="space-y-4">
                    <div className="mx-auto grid h-40 w-24 place-items-center rounded-[28px] border-4 border-slate-900 bg-white shadow-sm">
                      <Laptop2 className="h-10 w-10 text-emerald-700" />
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-green-50 p-4 text-center">
                      <div className="text-sm font-semibold text-slate-700">Task Approved</div>
                      <div className="mt-2 grid place-items-center">
                        <CheckCircle2 className="h-8 w-8 text-green-700" />
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
                            <div className="w-full rounded-t-xl bg-green-600/80" style={{ height: `${h}%` }} />
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

        <section id="how-it-works" className="border-y border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
                HOW IT WORKS (FOR TESTERS)
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
            <h2 className="text-2xl font-black text-slate-900 sm:text-3xl">How Much Can You Earn?</h2>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full rounded-2xl border border-slate-200">
                <thead>
                  <tr className="bg-slate-50 text-left text-sm text-slate-600">
                    <th className="px-4 py-3 font-semibold">Test Type</th>
                    <th className="px-4 py-3 font-semibold">Earnings</th>
                    <th className="px-4 py-3 font-semibold">Time Required</th>
                  </tr>
                </thead>
                <tbody>
                  {earningRows.map((row) => (
                    <tr key={row.type} className="border-t border-slate-200 text-sm text-slate-700">
                      <td className="px-4 py-3 font-semibold text-slate-900">{row.type}</td>
                      <td className="px-4 py-3">{row.amount}</td>
                      <td className="px-4 py-3">{row.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-5 text-sm leading-7 text-slate-600 sm:text-base">
              Approved earnings are scheduled for the next eligible Friday EFT payout, subject to banking verification, review, and any account holds.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="text-center">
            <div className="inline-flex rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 ring-1 ring-green-100">
              WHY TESTERS LOVE SQUASH
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

          <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1fr_0.8fr]">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-2xl font-black text-slate-900">Lots of Opportunities</h3>
              <div className="mt-5 space-y-4">
                {opportunityItems.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-1 text-green-600">&#8226;</span>
                    <p className="text-slate-600">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
              <h3 className="text-2xl font-black text-slate-900">Earn What You Deserve</h3>
              <div className="mt-7 text-center">
                <div className="text-[clamp(1.35rem,2.6vw,2.15rem)] font-black leading-none tracking-tight text-green-700 whitespace-nowrap">
                  R630 - R6,320+
                </div>
                <div className="mx-auto mt-3 max-w-[32ch] text-slate-600">
                  per month depending on activity and report quality.
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-green-200 bg-green-50 p-6 shadow-sm">
              <div className="text-5xl leading-none text-green-600">&#8220;</div>
              <p className="mt-3 leading-7 text-slate-700">
                Squash gives me the freedom to test apps, find bugs and earn money on my own
                schedule. Love it!
              </p>
              <div className="mt-5 font-bold text-slate-900">Priya, Top Tester</div>
              <div className="mt-3 flex items-center gap-1 text-green-600">
                {[1, 2, 3, 4, 5].map((value) => (
                  <Star key={value} className="h-4 w-4 fill-current" />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10">
            <TrustedLogosRow title="Trusted by developers worldwide" />
          </div>

          <div className="mt-10 rounded-[28px] border border-green-200 bg-green-50 px-6 py-8 shadow-sm sm:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Ready to start testing and earning?</h3>
                <p className="mt-2 text-base text-slate-600">
                  Join thousands of testers on Squash and turn your time into rewards.
                </p>
              </div>
              <a
                href="/tester-jobs"
                className="rounded-2xl bg-green-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-green-700"
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
