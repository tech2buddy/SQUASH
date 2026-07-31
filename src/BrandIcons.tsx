export function GoogleIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.4c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.6 2.9-4 2.9-6.9 0-.7-.1-1.5-.2-2.2H12z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.6 0 4.8-.9 6.4-2.5l-3.1-2.4c-.9.6-2 .9-3.3.9-2.5 0-4.6-1.7-5.3-4H3.5v2.5C5.1 19.8 8.3 22 12 22z"
      />
      <path
        fill="#FBBC05"
        d="M6.7 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.5H3.5C2.9 8.8 2.5 10.3 2.5 12s.4 3.2 1 4.5L6.7 14z"
      />
      <path
        fill="#4285F4"
        d="M12 6.1c1.4 0 2.7.5 3.7 1.4l2.8-2.8C16.8 3.1 14.6 2 12 2 8.3 2 5.1 4.2 3.5 7.5l3.2 2.5c.7-2.3 2.8-3.9 5.3-3.9z"
      />
    </svg>
  );
}

export function GitHubIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
    >
      <path d="M12 .5A12 12 0 0 0 8.2 23.9c.6.1.8-.2.8-.6v-2.3c-3.3.7-4-1.4-4-1.4-.6-1.4-1.3-1.8-1.3-1.8-1.1-.8.1-.8.1-.8 1.2.1 1.9 1.2 1.9 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.4-5.5-6A4.7 4.7 0 0 1 6.5 8.4c-.1-.3-.5-1.6.1-3.2 0 0 1-.3 3.4 1.2a11.7 11.7 0 0 1 6.2 0c2.3-1.5 3.4-1.2 3.4-1.2.6 1.6.2 2.9.1 3.2a4.7 4.7 0 0 1 1.3 3.3c0 4.7-2.9 5.7-5.6 6 .4.4.8 1 .8 2.1v3.1c0 .4.2.7.8.6A12 12 0 0 0 12 .5z" />
    </svg>
  );
}

/**
 * Social icons drawn inline rather than pulled from react-icons.
 *
 * `react-icons/tb` is a barrel re-exporting several thousand components; the
 * footer needed three of them, and the dependency was 84 MB installed. These
 * are stroked outlines matching the Tabler set they replace, so the footer
 * looks the same.
 */
function socialProps(className: string) {
  return {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: 'false' as const,
  };
}

export function InstagramIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg {...socialProps(className)}>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <circle cx="12" cy="12" r="3" />
      <line x1="16.5" y1="7.5" x2="16.51" y2="7.5" />
    </svg>
  );
}

export function XIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg {...socialProps(className)}>
      <path d="M4 4l11.733 16H20L8.267 4H4z" />
      <line x1="4" y1="20" x2="10.5" y2="13.5" />
      <line x1="13.5" y1="10.5" x2="20" y2="4" />
    </svg>
  );
}

export function LinkedInIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg {...socialProps(className)}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <line x1="8" y1="11" x2="8" y2="16" />
      <line x1="8" y1="8" x2="8" y2="8.01" />
      <line x1="12" y1="16" x2="12" y2="11" />
      <path d="M16 16v-3a2 2 0 0 0-4 0" />
    </svg>
  );
}
