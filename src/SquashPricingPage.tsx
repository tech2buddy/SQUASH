import { useState } from 'react';
import {
  BadgeCheck,
  Bug,
  CircleDollarSign,
  Lock,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import PublicFooter from './PublicFooter';
import PublicHeader from './PublicHeader';
import { TEST_TYPES, getTestTypeByKey, type TestTypeKey } from './lib/testTypes';
import { usePageMeta } from './hooks/usePageMeta';

type TrustItem = {
  title: string;
  text: string;
  icon: LucideIcon;
};

const cheapestJobPrice = Math.min(...TEST_TYPES.map((testType) => testType.ratePerTesterZar * testType.minTesters));

export default function SquashPricingPage() {
  usePageMeta({
    title: 'Pricing',
    description: `Pay per tester, not a flat tier. SQUASH testing jobs start from R${cheapestJobPrice} — pick bug hunting, usability, accessibility, localization, or low-data testing.`,
    path: '/pricing',
  });

  const [testers, setTesters] = useState(getTestTypeByKey('bug-hunting').defaultTesters);
  const [selectedTestType, setSelectedTestType] = useState<TestTypeKey>('bug-hunting');

  const activeTestType = getTestTypeByKey(selectedTestType);
  const effectiveTesters = Math.max(testers, activeTestType.minTesters);
  const totalCost = effectiveTesters * activeTestType.ratePerTesterZar;

  const trustItems: TrustItem[] = [
    {
      title: 'Online Payments',
      text: 'Complete payment online when you are ready to publish a testing job.',
      icon: Lock,
    },
    {
      title: 'Clear Review Process',
      text: "Review tester submissions and request revisions when required.",
      icon: ShieldCheck,
    },
    {
      title: 'Verified Testers',
      text: 'All testers are screened and rated.',
      icon: Users,
    },
    {
      title: 'Quality Guaranteed',
      text: 'High quality reports or we make it right.',
      icon: BadgeCheck,
    },
  ];

  const faqs = [
    {
      q: 'How do payments work?',
      a: 'You pay once testers are assigned and start working on your test.',
    },
    {
      q: 'Can I request revisions?',
      a: 'Yes. Testers will update their reports if you need more information.',
    },
    {
      q: "What if I'm not satisfied?",
      a: "We'll help you and the tester resolve submission issues through the documented review process.",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <PublicHeader active="pricing" />

      <main>
        <section className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-24">
          <div className="animate-fade-up flex flex-col justify-center">
            <div className="inline-flex w-fit rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
              Transparent pricing with no hidden fees
            </div>

            <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Pay for the Test Type You Need
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Pick the kind of testing your product needs. Pay per tester, not a flat tier. No subscriptions. No hidden fees.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="/post-job"
                className="rounded-2xl bg-green-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-green-700"
              >
                Post a Job
              </a>
              <a
                href="/contact?intent=sales"
                className="rounded-2xl border border-slate-300 px-6 py-3 text-center text-base font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Talk to Sales
              </a>
            </div>
          </div>

          <div className="animate-fade-up-delayed flex items-center justify-center">
            <div className="w-full max-w-xl rounded-[28px] border border-slate-200 bg-slate-50 p-5 shadow-xl">
              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-white shadow-sm">
                      <CircleDollarSign className="h-8 w-8 text-emerald-700" />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-3 shadow-sm">
                        <Bug className="h-4 w-4 text-green-600" />
                        <div className="h-3 flex-1 rounded-full bg-slate-200" />
                      </div>
                      <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-3 shadow-sm">
                        <ShieldCheck className="h-4 w-4 text-green-600" />
                        <div className="h-3 w-4/5 rounded-full bg-slate-200" />
                      </div>
                      <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-3 shadow-sm">
                        <Users className="h-4 w-4 text-green-600" />
                        <div className="h-3 w-3/5 rounded-full bg-slate-200" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-4 sm:items-end">
                    <div className="grid h-28 w-28 place-items-center rounded-full border border-green-200 bg-green-50 shadow-sm">
                      <Bug className="h-10 w-10 text-emerald-700" />
                    </div>
                    <div className="rounded-2xl border border-green-200 bg-white px-4 py-2 text-sm font-semibold text-green-700 shadow-sm">
                      Plans from R{cheapestJobPrice} per job
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {TEST_TYPES.map((testType) => {
                const minJobTotal = testType.ratePerTesterZar * testType.minTesters;
                const highlighted = testType.key === 'bug-hunting';
                return (
                  <div
                    key={testType.key}
                    className={`relative flex h-full flex-col rounded-[28px] border bg-white p-8 shadow-sm transition hover:-translate-y-1 ${
                      highlighted ? 'border-green-300 ring-2 ring-green-100' : 'border-slate-200'
                    }`}
                  >
                    {highlighted ? (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-green-100 px-4 py-2 text-sm font-bold text-green-700 ring-1 ring-green-200">
                        Most Popular
                      </div>
                    ) : null}

                    <div className="text-center">
                      <h2 className="text-2xl font-black text-green-700">{testType.label}</h2>
                      <div className="mt-4 flex items-end justify-center gap-2">
                        <span className="text-5xl font-black text-slate-900">R{testType.ratePerTesterZar}</span>
                        <span className="pb-1 text-slate-500">/ tester</span>
                      </div>
                    </div>

                    <div className="my-6 border-t border-slate-200" />

                    <div className="space-y-4">
                      <div className="flex items-start gap-3 text-slate-700">
                        <span className="mt-1 text-green-600">&#10003;</span>
                        <span>Minimum {testType.minTesters} testers (R{minJobTotal} to start)</span>
                      </div>
                      <div className="flex items-start gap-3 text-slate-700">
                        <span className="mt-1 text-green-600">&#10003;</span>
                        <span>About {testType.estimatedMinutes} minutes per tester</span>
                      </div>
                      <div className="flex items-start gap-3 text-slate-700">
                        <span className="mt-1 text-green-600">&#10003;</span>
                        <span>{testType.description}</span>
                      </div>
                    </div>

                    <div className="my-6 border-t border-slate-200" />

                    <div className="mt-auto">
                      <a
                        href={`/post-job?plan=${testType.key}`}
                        className={`mt-4 inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 font-semibold shadow-sm transition ${
                          highlighted
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        Post a Job
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-center text-sm font-medium text-slate-700">
              Certification badges are not issued during beta.
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-center text-3xl font-black text-slate-900">Estimate Your Test Cost</h2>

            <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <div className="mb-3 text-sm font-semibold text-slate-700">Test type:</div>
                <select
                  value={selectedTestType}
                  onChange={(e) => {
                    const nextKey = e.target.value as TestTypeKey;
                    setSelectedTestType(nextKey);
                    const nextConfig = getTestTypeByKey(nextKey);
                    if (testers < nextConfig.minTesters) {
                      setTesters(nextConfig.minTesters);
                    }
                  }}
                  className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                >
                  {TEST_TYPES.map((testType) => (
                    <option key={testType.key} value={testType.key}>
                      {testType.label} (R{testType.ratePerTesterZar}/tester)
                    </option>
                  ))}
                </select>

                <div className="mt-8">
                  <div className="mb-3 flex items-center justify-between text-sm font-semibold text-slate-700">
                    <span>Number of testers:</span>
                    <span className="text-slate-500">Min {activeTestType.minTesters}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={activeTestType.minTesters}
                      max="50"
                      step="1"
                      value={effectiveTesters}
                      onChange={(e) => setTesters(parseInt(e.target.value, 10))}
                      className="h-2 flex-1 appearance-none rounded-full bg-slate-200 accent-green-600"
                    />
                    <div className="flex h-12 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg font-bold text-slate-900">
                      {effectiveTesters}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <div className="space-y-4 text-base">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Test type:</span>
                    <span className="font-semibold text-slate-900">{activeTestType.label}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Number of testers:</span>
                    <span className="font-semibold text-slate-900">{effectiveTesters}</span>
                  </div>
                </div>

                <div className="my-5 border-t border-dashed border-slate-300" />

                <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-4 shadow-sm">
                  <span className="text-sm font-semibold uppercase tracking-wide text-slate-500">Total:</span>
                  <span className="text-3xl font-black text-green-700">R{totalCost.toLocaleString()}</span>
                </div>
                <div className="mt-3 text-sm text-slate-500">{effectiveTesters} testers - {activeTestType.label} - Total: R{totalCost.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-[28px] border border-green-200 bg-green-50 p-8 shadow-sm">
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {trustItems.map((item) => (
                <div key={item.title} className="rounded-3xl border border-green-100 bg-white p-5 shadow-sm">
                  <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-green-50 ring-1 ring-green-100">
                    <item.icon className="h-7 w-7 text-emerald-700" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-2 leading-7 text-slate-600">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center text-lg font-semibold text-slate-700">
              "Clear pricing, documented reviews, and practical testing reports."
            </div>
          </div>

          <div className="mt-10 rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-center text-3xl font-black text-slate-900">Frequently Asked Questions</h2>

            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              {faqs.map((faq) => (
                <div key={faq.q} className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <h3 className="text-lg font-bold text-slate-900">Q: {faq.q}</h3>
                  <p className="mt-4 leading-7 text-slate-600">A: {faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 rounded-[28px] border border-green-200 bg-green-50 px-6 py-8 shadow-sm sm:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-white shadow-sm">
                  <Bug className="h-8 w-8 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Ready to squash bugs before launch?</h3>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href="/post-job"
                  className="rounded-2xl bg-green-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-green-700"
                >
                  Post a Job
                </a>
                <a
                  href="/signup"
                  className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Get Started
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
