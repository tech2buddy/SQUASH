# SQUASH security deployment checklist

## Required before the next production deployment

1. In the production Supabase SQL editor, run `supabase/phase27_security_hardening.sql` once.
2. In Supabase Authentication MFA settings, enable TOTP enrollment, challenge, and verification.
3. Deploy the current application to Vercel. The email endpoint depends on the phase 27 rate-limit function.
4. Sign in through `/A31`, enroll an authenticator app, and confirm every `/A31/*` page redirects to `/A31/mfa` until an AAL2 code is verified.
5. Run `supabase/verify_production_security.sql` in the production SQL editor and review every result. The RLS-disabled and anonymous/public SECURITY DEFINER grant reports should return zero rows.
6. Confirm response headers on the production domain: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, and HSTS.

## Upload malware scanning

Implemented in phase 38 (`supabase/phase38_file_scanning.sql` + `api/scan-upload.ts`), using Cloudmersive. Files are scanned immediately after upload; infected files are deleted from the bucket server-side and recorded in `public.file_scans`.

Required to activate:

1. Create a Cloudmersive account and get an API key.
2. Set `CLOUDMERSIVE_API_KEY` in Vercel (server-only — do **not** prefix with `VITE_`).
3. Run `supabase/phase38_file_scanning.sql` in the production SQL editor.
4. Redeploy.

Behaviour when the scanner is unavailable (no key configured, API error, or timeout) is deliberately split by risk:

- `tester-banking-documents` **fails closed** — the upload is deleted and the tester sees an error. These are reviewed by admins and are the highest-value target.
- All other buckets **fail open** — the upload is allowed and the failure is recorded in `file_scans` with status `error`, so a scanner outage cannot block testers from submitting bug reports. Query `select * from public.file_scans where status = 'error'` to find anything that slipped through during an outage.

Do **not** substitute VirusTotal's free API here: it shares submitted files with its security community, which would leak testers' bank statements.

File signature, MIME, extension, size, private-bucket, and signed-URL controls remain in place as the first line of defence.

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