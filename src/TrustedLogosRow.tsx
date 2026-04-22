import type { ComponentType } from 'react';
import type { IconType } from 'react-icons';
import {
  SiAirbnb,
  SiShopify,
} from 'react-icons/si';

function MicrosoftLogo({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="10" height="10" fill="#F25022" />
      <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
      <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
      <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
    </svg>
  );
}

function GoogleMark({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <circle cx="8" cy="8" r="4.2" fill="#EA4335" />
      <circle cx="16" cy="8" r="4.2" fill="#FBBC05" />
      <circle cx="8" cy="16" r="4.2" fill="#34A853" />
      <circle cx="16" cy="16" r="4.2" fill="#4285F4" />
    </svg>
  );
}

function StripeMark({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <rect x="3" y="6" width="18" height="3.2" rx="1.6" fill="#635BFF" transform="rotate(-12 12 7.6)" />
      <rect x="4" y="11" width="16" height="3.2" rx="1.6" fill="#635BFF" transform="rotate(-12 12 12.6)" />
      <rect x="5" y="16" width="14" height="3.2" rx="1.6" fill="#635BFF" transform="rotate(-12 12 17.6)" />
    </svg>
  );
}

type LogoIcon = IconType | ComponentType<{ className?: string }>;

const brands: Array<{ name: string; Icon: LogoIcon; iconClassName: string }> = [
  { name: 'Google', Icon: GoogleMark, iconClassName: '' },
  { name: 'Microsoft', Icon: MicrosoftLogo as IconType, iconClassName: '' },
  { name: 'airbnb', Icon: SiAirbnb, iconClassName: 'text-[#FF5A5F]' },
  { name: 'shopify', Icon: SiShopify, iconClassName: 'text-[#7AB55C]' },
  { name: 'stripe', Icon: StripeMark, iconClassName: '' },
];

export default function TrustedLogosRow({ title }: { title: string }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-slate-50 px-6 py-8 text-center shadow-sm sm:px-8">
      <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{title}</div>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-8 sm:gap-12">
        {brands.map((brand) => (
          <span
            key={brand.name}
            className="inline-flex items-center gap-2.5 text-2xl font-bold text-slate-500"
          >
            <brand.Icon className={`h-6 w-6 ${brand.iconClassName}`} aria-hidden="true" />
            <span>{brand.name}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
