const footerLinks = {
  Platform: [
    { label: 'For Developers', href: '/for-developers' },
    { label: 'For Testers', href: '/for-testers' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'About', href: '/about' },
  ],
  Resources: [
    { label: 'API Docs', href: '/api-docs' },
    { label: 'Help Center', href: '/help-center' },
    { label: 'Blog', href: '/blog' },
    { label: 'Guides', href: '/guides' },
  ],
  Legal: [
    { label: 'Terms', href: '/terms' },
    { label: 'Privacy', href: '/privacy' },
    { label: 'Refund Policy', href: '/refund-policy' },
    { label: 'Payout Policy', href: '/payout-policy' },
    { label: 'Disputes', href: '/dispute-resolution-policy' },
    { label: 'POPIA', href: '/popia-data-protection-policy' },
  ],
};

export default function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <img src="/squash-logo.png" alt="SQUASH logo" className="h-10 w-10 rounded-2xl border border-slate-200 object-cover shadow-sm" />
            <div>
              <div className="text-lg font-extrabold tracking-tight text-slate-900">SQUASH</div>
              <div className="text-xs text-slate-500">Source Quality User Assurance Solutions Here</div>
            </div>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600">
            Real people. Real feedback. Better apps built for South Africa and beyond.
          </p>
        </div>

        {Object.entries(footerLinks).map(([title, links]) => (
          <div key={title}>
            <h4 className="text-sm font-bold text-slate-900">{title}</h4>
            <div className="mt-4 grid gap-3 text-sm text-slate-600">
              {links.map((link) => (
                <a key={link.label} href={link.href} className="transition hover:text-slate-900">
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </footer>
  );
}
