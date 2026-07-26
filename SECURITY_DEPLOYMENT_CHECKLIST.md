# SQUASH security deployment checklist

## Required before the next production deployment

1. In the production Supabase SQL editor, run `supabase/phase27_security_hardening.sql` once.
2. In Supabase Authentication MFA settings, enable TOTP enrollment, challenge, and verification.
3. Deploy the current application to Vercel. The email endpoint depends on the phase 27 rate-limit function.
4. Sign in through `/A31`, enroll an authenticator app, and confirm every `/A31/*` page redirects to `/A31/mfa` until an AAL2 code is verified.
5. Run `supabase/verify_production_security.sql` in the production SQL editor and review every result. The RLS-disabled and anonymous/public SECURITY DEFINER grant reports should return zero rows.
6. Confirm response headers on the production domain: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, and HSTS.

## External control still required

File signature, MIME, extension, size, private-bucket, and signed-URL controls are implemented. These are not malware scanning. Before accepting untrusted public uploads at scale, connect a malware scanning service or quarantine scanner and only release files after a clean verdict.

## Security testing before public launch

- Run authenticated authorization tests with separate developer, tester, and admin accounts.
- Attempt horizontal access to another user's jobs, reports, banking documents, payouts, and support records.
- Attempt email endpoint requests with unknown event types, another developer's record IDs, another tester's payout ID, missing/expired tokens, and more than 20 requests per hour.
- Test upload files with spoofed MIME types, double extensions, oversized payloads, and malformed file headers.
- Arrange an independent penetration test before representing the platform as security-tested.

## Current automated verification

- TypeScript typecheck: passing.
- Vitest: 3/3 passing.
- Production Vite build: passing.
- npm audit: 0 known vulnerabilities.
- ESLint: no new security-pass errors; the repository retains existing non-blocking React warnings.