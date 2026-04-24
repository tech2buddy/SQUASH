import {
  BadgeCheck,
  Bug,
  CircleDollarSign,
  Lock,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import PublicHeader from './PublicHeader';

type TrustItem = {
  title: string;
  text: string;
  icon: LucideIcon;
};

export default function SquashPricingPage() {
  const plans = [
    {
      name: 'Starter',
      price: 'R500',
      suffix: '/ job',
      features: ['5 testers', 'Bug reports', 'Screenshots', 'PDF report', 'Screenshots only (upgrade for video reports)'],
      note: 'Best for small apps and quick checks',
      highlighted: false,
    },
    {
      name: 'Growth',
      price: 'R1,200',
      suffix: '/ job',
      features: ['10 testers', 'Screen recordings', 'UX scores', 'Detailed PDF report', 'Priority matching', 'Video bug reports included'],
      note: 'Best for startups before launch',
      highlighted: true,
      badge: 'Most Popular',
    },
    {
      name: 'Pro',
      price: 'R2,500',
      suffix: '/ job',
      features: ['20 testers', 'Full session recordings', 'Executive summary', 'Advanced analytics', 'Dedicated support', 'Video bug reports included'],
      note: 'Best for serious products and funded startups',
      highlighted: false,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      suffix: 'pricing',
      features: ['50+ testers', 'Dedicated test manager', 'Custom reporting', 'SLA guarantee'],
      note: 'Best for corporates and large teams',
      highlighted: false,
    },
  ];

  const trustItems: TrustItem[] = [
    {
      title: 'Secure Payments',
      text: 'Your payments are safe with us.',
      icon: Lock,
    },
    {
      title: 'Pay Only When Satisfied',
      text: "We hold payments until you're happy.",
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
      a: "We'll work with you and the tester to resolve issues before payment is released.",
    },
  ];

  const footerLinks = {
    Platform: ['For Developers', 'For Testers', 'Pricing'],
    Company: ['About Us', 'Careers', 'Contact'],
    Resources: ['Help Center', 'Blog', 'Guides'],
    Legal: ['Terms of Service', 'Privacy Policy'],
  };

  const footerHref: Record<string, string> = {
    'For Developers': '/for-developers',
    'For Testers': '/for-testers',
    Pricing: '/pricing',
    'About Us': '/about',
    Careers: '/careers',
    Contact: '/contact',
    'Help Center': '/help-center',
    Blog: '/blog',
    Guides: '/guides',
    'Terms of Service': '/terms',
    'Privacy Policy': '/privacy',
  };

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
              Simple Pricing for Better Testing
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Pay only for what you need. No subscriptions. No hidden fees.
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
                      Plans from R500 per job
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-4">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative flex h-full flex-col rounded-[28px] border bg-white p-8 shadow-sm transition hover:-translate-y-1 ${
                    plan.highlighted ? 'border-green-300 ring-2 ring-green-100' : 'border-slate-200'
                  }`}
                >
                  {plan.badge ? (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-green-100 px-4 py-2 text-sm font-bold text-green-700 ring-1 ring-green-200">
                      {plan.badge}
                    </div>
                  ) : null}

                  <div className="text-center">
                    <h2 className="text-2xl font-black text-green-700">{plan.name}</h2>
                    <div className="mt-4 flex items-end justify-center gap-2">
                      <span className="text-5xl font-black text-slate-900">{plan.price}</span>
                      <span className="pb-1 text-slate-500">{plan.suffix}</span>
                    </div>
                  </div>

                  <div className="my-6 border-t border-slate-200" />

                  <div className="space-y-4">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-3 text-slate-700">
                        <span className="mt-1 text-green-600">&#10003;</span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="my-6 border-t border-slate-200" />

                  <div className="mt-auto">
                    <div className="min-h-[56px] text-center leading-7 text-slate-600">{plan.note}</div>

                    <a
                      href={plan.name === 'Enterprise' ? '/contact?intent=enterprise' : `/post-job?plan=${plan.name.toLowerCase()}`}
                      className={`mt-4 inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 font-semibold shadow-sm transition ${
                        plan.highlighted
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      {plan.name === 'Enterprise' ? 'Contact Us' : 'Post a Job'}
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-center text-sm font-medium text-slate-700">
              Apps scoring 80+ receive a SQUASH CERTIFIED badge to use on your app store listing
              - included free with Growth and Pro plans.
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-center text-3xl font-black text-slate-900">Estimate Your Test Cost</h2>

            <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <div>
                  <div className="mb-3 text-sm font-semibold text-slate-700">Number of testers:</div>
                  <div className="flex items-center gap-4">
                    <div className="relative h-2 flex-1 rounded-full bg-slate-200">
                      <div className="absolute left-0 top-0 h-2 w-[78%] rounded-full bg-green-600" />
                      <span className="absolute left-[78%] top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-white shadow ring-2 ring-green-600" />
                    </div>
                    <div className="flex h-12 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg font-bold text-slate-900">
                      20
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <div className="mb-3 text-sm font-semibold text-slate-700">Package selected:</div>
                  <a href="/post-job?plan=pro" className="flex w-full max-w-sm items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left font-semibold text-slate-700">
                    Pro Plan <span className="text-slate-400">&#9662;</span>
                  </a>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <div className="space-y-4 text-base">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Package selected:</span>
                    <span className="font-semibold text-slate-900">Pro Plan</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Number of testers:</span>
                    <span className="font-semibold text-slate-900">20</span>
                  </div>
                </div>

                <div className="my-5 border-t border-dashed border-slate-300" />

                <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-4 shadow-sm">
                  <span className="text-sm font-semibold uppercase tracking-wide text-slate-500">Total:</span>
                  <span className="text-3xl font-black text-green-700">R2,500</span>
                </div>
                <div className="mt-3 text-sm text-slate-500">20 testers - Pro Plan - Total: R2,500</div>
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
              "We hold payments until you're happy with results."
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

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-[1.1fr_1fr_1fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-3">
                <img
                  src="/squash-logo.png"
                  alt="SQUASH logo"
                  className="h-10 w-10 rounded-2xl border border-slate-200 object-cover shadow-sm"
                />
                <div className="text-2xl font-black tracking-tight">SQUASH</div>
              </div>
              <p className="mt-4 max-w-xs leading-7 text-slate-600">Real people. Real feedback. Better apps.</p>
            </div>

            {Object.entries(footerLinks).map(([title, items]) => (
              <div key={title}>
                <h4 className="font-bold text-slate-900">{title}</h4>
                <div className="mt-4 space-y-3 text-slate-600">
                  {items.map((item) => (
                    <a key={item} href={footerHref[item] ?? '/'} className="block transition hover:text-slate-900">
                      {item}
                    </a>
                  ))}
                </div>
              </div>
            ))}

            <div>
              <h4 className="font-bold text-slate-900">Follow Us</h4>
              <div className="mt-4 flex gap-3 text-xl text-slate-600">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200">f</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200">X</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200">&#9678;</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
