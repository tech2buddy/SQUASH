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
      title: 'Rated Testers',
      text: 'Testers build a track record through ratings and approved reports.',
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
    <div className="min-h-screen bg-[radial-gradient(ellipse_100%_100%_at_50%_-20%,rgba(0,113,227,0.04),rgba(245,245,247,1))] bg-[#f3f3f6] text-[#1d1d1f]">
      <PublicHeader active="pricing" />

      <main>
        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:gap-12 sm:px-6 sm:py-14 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-20">
          <div className="animate-fade-up flex flex-col justify-center">
            <div className="inline-flex w-fit rounded-full border border-rose-100 bg-rose-50 px-3.5 py-1 text-xs font-bold text-[#e63946]">
              Transparent pricing with no hidden fees
            </div>

            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-apple-tight text-[#1d1d1f] sm:mt-5 sm:text-5xl lg:text-6xl">
              Pay for the Test Type You Need
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#86868b] sm:mt-5 sm:text-lg sm:leading-8">
              Pick the kind of testing your product needs. Pay per tester, not a flat tier. No subscriptions. No hidden fees.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:mt-7 sm:flex-row">
              <a
                href="/post-job"
                className="w-full text-center rounded-full bg-[#e63946] px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-rose-500/20 hover:bg-[#d62828] active:scale-98 transition sm:w-auto"
              >
                Post a Job
              </a>
              <a
                href="/contact?intent=sales"
                className="w-full text-center rounded-full border border-black/10 bg-white/80 backdrop-blur-md px-6 py-3.5 text-sm font-semibold text-[#1d1d1f] transition hover:bg-white sm:w-auto shadow-2xs"
              >
                Talk to Sales
              </a>
            </div>
          </div>

          <div className="animate-fade-up-delayed flex items-center justify-center">
            <div className="w-full max-w-xl rounded-2xl border border-white/80 bg-white/70 backdrop-blur-xl p-5 shadow-lg">
              <div className="rounded-xl border border-black/[0.06] bg-white p-5 shadow-2xs">
                <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="rounded-xl border border-black/[0.06] bg-[#f5f5f7] p-5">
                    <div className="mb-4 grid h-14 w-14 place-items-center rounded-xl bg-[#e63946] text-white shadow-2xs">
                      <CircleDollarSign className="h-7 w-7" />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-3 shadow-sm">
                        <Bug className="h-4 w-4 text-[#e63946]" />
                        <div className="h-3 flex-1 rounded-full bg-slate-200" />
                      </div>
                      <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-3 shadow-sm">
                        <ShieldCheck className="h-4 w-4 text-[#e63946]" />
                        <div className="h-3 w-4/5 rounded-full bg-slate-200" />
                      </div>
                      <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-3 shadow-sm">
                        <Users className="h-4 w-4 text-[#e63946]" />
                        <div className="h-3 w-3/5 rounded-full bg-slate-200" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-4 sm:items-end">
                    <div className="grid h-24 w-24 place-items-center rounded-full border border-rose-100 bg-rose-50 shadow-sm">
                      <Bug className="h-8 w-8 text-[#e63946]" />
                    </div>
                    <div className="rounded-full border border-rose-100 bg-rose-50 px-4 py-1.5 text-xs font-bold text-[#e63946]">
                      Plans from R{cheapestJobPrice} per job
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-black/[0.06] bg-white py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-apple-tight text-[#1d1d1f]">
                Select Your Testing Specification
              </h2>
              <p className="mt-2 text-sm text-[#86868b]">
                Pay per tester with fixed single-source-of-truth rates. No subscriptions or hidden fees.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {TEST_TYPES.map((testType) => {
                const minJobTotal = testType.ratePerTesterZar * testType.minTesters;
                const highlighted = testType.key === 'bug-hunting';
                return (
                  <div
                    key={testType.key}
                    className={`relative flex h-full flex-col apple-interactive-card p-6 sm:p-8 ${
                      highlighted ? 'border-[#e63946] ring-2 ring-[#e63946]/15 shadow-md' : ''
                    }`}
                  >
                    {highlighted ? (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#e63946] px-3.5 py-0.5 text-[11px] font-bold text-white shadow-xs">
                        Most Popular
                      </div>
                    ) : null}

                    <div className="text-center">
                      <h2 className="text-xl font-extrabold text-[#1d1d1f] tracking-tight">{testType.label}</h2>
                      <div className="mt-3 flex items-end justify-center gap-1.5">
                        <span className="text-4xl font-extrabold text-[#1d1d1f] tracking-tight">R{testType.ratePerTesterZar}</span>
                        <span className="pb-1 text-xs text-[#86868b] font-medium">/ tester</span>
                      </div>
                    </div>

                    <div className="my-5 border-t border-black/[0.06]" />

                    <div className="space-y-3 text-xs sm:text-sm">
                      <div className="flex items-start gap-2.5 text-[#1d1d1f]">
                      <span className="mt-0.5 text-emerald-600 font-extrabold">✓</span>
                        <span>Minimum {testType.minTesters} testers (R{minJobTotal} to start)</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-[#1d1d1f]">
                      <span className="mt-0.5 text-emerald-600 font-extrabold">✓</span>
                        <span>About {testType.estimatedMinutes} minutes per tester</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-[#86868b] leading-relaxed">
                      <span className="mt-0.5 text-emerald-600 font-extrabold">✓</span>
                        <span>{testType.description}</span>
                      </div>
                    </div>

                    <div className="my-5 border-t border-black/[0.06]" />

                    <div className="mt-auto">
                      <a
                        href={`/post-job?plan=${testType.key}`}
                        className={`inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-xs font-semibold shadow-xs transition active:scale-98 ${
                          highlighted
                            ? 'bg-[#e63946] text-white hover:bg-[#d62828]'
                            : 'border border-black/10 bg-white text-[#1d1d1f] hover:bg-[#f5f5f7]'
                        }`}
                      >
                        Post a Job
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-xl border border-black/[0.06] bg-[#f5f5f7] px-4 py-2.5 text-center text-xs font-semibold text-[#86868b]">
              Certification badges are not issued during beta.
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="apple-interactive-card p-6 sm:p-10">
            <h2 className="text-center text-2xl sm:text-4xl font-extrabold text-[#1d1d1f] tracking-tight">Estimate Your Test Cost</h2>

            <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <div className="mb-2.5 text-xs font-bold text-[#1d1d1f]">Select Test Specification:</div>
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
                  className="w-full max-w-sm rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-xs font-semibold text-[#1d1d1f] focus:border-[#e63946] focus:outline-none focus:ring-2 focus:ring-[#e63946]/20 shadow-2xs"
                >
                  {TEST_TYPES.map((testType) => (
                    <option key={testType.key} value={testType.key}>
                      {testType.label} (R{testType.ratePerTesterZar}/tester)
                    </option>
                  ))}
                </select>

                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between text-xs font-bold text-[#1d1d1f]">
                    <span>Number of Testers:</span>
                    <span className="text-[#86868b] font-medium">Min {activeTestType.minTesters}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={activeTestType.minTesters}
                      max="50"
                      step="1"
                      value={effectiveTesters}
                      onChange={(e) => setTesters(parseInt(e.target.value, 10))}
                      className="h-2 flex-1 appearance-none rounded-full bg-slate-200 accent-[#e63946]"
                    />
                    <div className="flex h-10 w-14 items-center justify-center rounded-xl border border-black/10 bg-white text-sm font-extrabold text-[#1d1d1f] shadow-2xs">
                      {effectiveTesters}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-black/[0.06] bg-[#f5f5f7] p-5">
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between text-[#86868b]">
                    <span>Test Spec:</span>
                    <span className="font-bold text-[#1d1d1f]">{activeTestType.label}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#86868b]">
                    <span>Number of Testers:</span>
                    <span className="font-bold text-[#1d1d1f]">{effectiveTesters}</span>
                  </div>
                </div>

                <div className="my-4 border-t border-dashed border-black/10" />

                <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3.5 border border-black/[0.06] shadow-2xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#86868b]">Total:</span>
                   <span className="text-3xl font-extrabold text-[#e63946]">R{totalCost.toLocaleString()}</span>
                </div>
                <div className="mt-2.5 text-[11px] text-[#86868b] font-medium text-center">{effectiveTesters} testers × {activeTestType.label} = R{totalCost.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-black/[0.06] bg-white p-6 sm:p-8 shadow-2xs">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {trustItems.map((item) => (
                <div key={item.title} className="apple-interactive-card p-5">
                  <div className="mb-3.5 grid h-10 w-10 place-items-center rounded-xl bg-[#1d1d1f] text-white shadow-2xs">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-extrabold text-[#1d1d1f]">{item.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#86868b]">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center text-xs sm:text-sm font-semibold text-[#86868b] italic">
              "Clear pricing, documented reviews, and practical testing reports."
            </div>
          </div>

          <div className="mt-8 apple-interactive-card p-6 sm:p-8">
            <h2 className="text-center text-2xl font-extrabold text-[#1d1d1f] tracking-tight">Frequently Asked Questions</h2>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {faqs.map((faq) => (
                <div key={faq.q} className="rounded-xl border border-black/[0.06] bg-[#f5f5f7] p-4 sm:p-5">
                  <h3 className="text-xs sm:text-sm font-bold text-[#1d1d1f]">Q: {faq.q}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#86868b]">A: {faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-black/[0.06] bg-[#1d1d1f] text-white p-6 sm:p-8 shadow-md">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/10 text-white border border-white/20">
                  <Bug className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold tracking-tight">Ready to squash bugs before launch?</h3>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 sm:flex-row">
                <a
                  href="/post-job"
                  className="rounded-full bg-[#e63946] px-6 py-3 text-xs font-semibold text-white shadow-md hover:bg-[#d62828] active:scale-98 transition text-center"
                >
                  Post a Job
                </a>
                <a
                  href="/signup"
                  className="rounded-full border border-white/20 bg-white/10 px-6 py-3 text-xs font-semibold text-white hover:bg-white/20 transition text-center"
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
