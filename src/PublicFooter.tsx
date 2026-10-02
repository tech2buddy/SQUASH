import { Mail } from 'lucide-react';
import { InstagramIcon, LinkedInIcon, XIcon } from './BrandIcons';

const footerLinks = {
  Platform: [
    { label: 'For Developers', href: '/for-developers' },
    { label: 'For Testers', href: '/for-testers' },
    { label: 'Pricing & Specs', href: '/pricing' },
    { label: 'Platform Story', href: '/about' },
  ],
  Resources: [
    { label: 'API Documentation', href: '/api-docs' },
    { label: 'Help & Support', href: '/help-center' },
    { label: 'Developer Guides', href: '/guides' },
  ],
  'Legal & Compliance': [
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'POPIA Compliance', href: '/popia-data-protection-policy' },
    { label: 'Payout Policy', href: '/payout-policy' },
    { label: 'Dispute Resolution', href: '/dispute-resolution-policy' },
  ],
};

export default function PublicFooter() {
  return (
    <footer className="border-t border-black/[0.06] bg-[#f5f5f7] text-[#86868b] text-xs">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <img
                src="/squash-logo.png"
                alt="SQUASH logo"
                className="h-8 w-8 rounded-xl border border-black/10 object-cover shadow-2xs"
              />
              <div>
                <div className="text-sm font-extrabold tracking-apple-tight text-[#1d1d1f]">
                  SQUASH
                </div>
                <div className="text-[11px] text-[#86868b]">Quality Assurance</div>
              </div>
            </div>
            <p className="mt-3 max-w-sm text-xs leading-relaxed text-[#86868b]">
              Everyday South Africans test your mobile app or website on real hardware and real networks before launch day.
            </p>

            <div className="mt-5 flex items-center gap-3">
              <a
                href="https://www.instagram.com/squash_za?igsh=MThtZnI5enUydXp4dw%3D%3D&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-full text-[#86868b] hover:text-[#1d1d1f] transition"
              >
                <span className="sr-only">Instagram</span>
                <InstagramIcon className="h-4 w-4" />
              </a>
              <a
                href="mailto:support@squashqa.co.za"
                className="p-1.5 rounded-full text-[#86868b] hover:text-[#1d1d1f] transition"
              >
                <span className="sr-only">Email</span>
                <Mail className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="p-1.5 rounded-full text-[#86868b] hover:text-[#1d1d1f] transition"
              >
                <span className="sr-only">Twitter</span>
                <XIcon className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="p-1.5 rounded-full text-[#86868b] hover:text-[#1d1d1f] transition"
              >
                <span className="sr-only">LinkedIn</span>
                <LinkedInIcon className="h-4 w-4" />
              </a>
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-xs font-semibold text-[#1d1d1f] tracking-tight">{title}</h4>
              <ul className="mt-3 space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-[#86868b] hover:text-[#1d1d1f] transition">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-black/[0.06] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#86868b] gap-3">
          <div>
            Copyright © {new Date().getFullYear()} SQUASH QA (Pty) Ltd. All rights reserved.
          </div>
          <div className="flex items-center gap-3">
            <span>Johannesburg</span>
            <span>•</span>
            <span>Cape Town</span>
            <span>•</span>
            <span>Durban</span>
          </div>
        </div>
      </div>
    </footer>
  );
}


