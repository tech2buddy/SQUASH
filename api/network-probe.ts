import { createClient } from '@supabase/supabase-js';
import { promises as dns } from 'node:dns';

/**
 * Records one network sample for an active Test Lab session.
 *
 * This endpoint exists because the tester used to write these rows directly,
 * which made the Low-Data report worthless as evidence -- anyone could insert
 * `effective_type: '2g'` from the browser console. Phase 50 revoked that grant,
 * so this function (holding the service role key) is now the only writer.
 *
 * It keeps two things apart:
 *   reported_* -- navigator.connection hints sent by the client. Recorded, not
 *                 trusted. DevTools throttling changes these for real.
 *   observed_* -- derived here from the request itself. The caller cannot set
 *                 these without routing traffic through a matching network.
 *
 * The observed signal is the caller's ASN. Someone claiming a township mobile
 * connection whose packets arrive from a hosting provider is contradicted by
 * infrastructure rather than by their own testimony.
 *
 * What this does NOT do: prove the tester was on that network. A determined
 * faker can tether through a real SA mobile connection and throttle on top. The
 * goal is to make casual fraud fail and sustained fraud visible.
 */

const EFFECTIVE_TYPES = new Set(['slow-2g', '2g', '3g', '4g', 'unknown']);
const ASN_LOOKUP_TIMEOUT_MS = 2_000;

// Cheap per-instance memo. A warm lambda serving one tester's 30-second samples
// should not re-resolve the same IP every time.
const asnCache = new Map<string, { asn: number | null; name: string; country: string | null }>();

function bearerToken(header: unknown) {
  return typeof header === 'string' ? header.replace(/^Bearer\s+/i, '') : '';
}

/**
 * The caller's real IP. Vercel appends the true client address to
 * x-forwarded-for; the leftmost entry is the client, later ones are proxies.
 */
function clientIp(req: any): string {
  const forwarded = req.headers['x-forwarded-for'];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  if (typeof raw === 'string' && raw.trim()) {
    return raw.split(',')[0].trim();
  }
  const real = req.headers['x-real-ip'];
  return typeof real === 'string' ? real.trim() : '';
}

function isPublicIpv4(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  const octets = parts.map((part) => Number(part));
  if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) return false;

  const [a, b] = octets;
  if (a === 10 || a === 127 || a === 0) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 169 && b === 254) return false;
  if (a === 100 && b >= 64 && b <= 127) return false; // CGNAT
  return true;
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), ms);
      }),
    ]);
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Resolves an IPv4 address to its origin ASN using Team Cymru's public DNS
 * interface -- no API key, no account, no per-request cost.
 *
 * A TXT lookup of 4.3.2.1.origin.asn.cymru.com answers for 1.2.3.4 with
 * "13335 | 1.1.1.0/24 | US | arin | 2010-07-14".
 *
 * IPv6 is not resolved here (it needs the nibble-format origin6 zone); those
 * samples record as unverified rather than being guessed at.
 */
async function resolveAsn(ip: string) {
  if (asnCache.has(ip)) return asnCache.get(ip)!;

  const empty = { asn: null as number | null, name: '', country: null as string | null };
  if (!isPublicIpv4(ip)) {
    asnCache.set(ip, empty);
    return empty;
  }

  const query = `${ip.split('.').reverse().join('.')}.origin.asn.cymru.com`;
  const records = await withTimeout(dns.resolveTxt(query), ASN_LOOKUP_TIMEOUT_MS);
  if (!records || records.length === 0) {
    asnCache.set(ip, empty);
    return empty;
  }

  const fields = records[0].join('').split('|').map((field) => field.trim());
  const asn = Number(fields[0]?.split(' ')[0]);
  const result = {
    asn: Number.isInteger(asn) ? asn : null,
    name: '',
    country: fields[2] || null,
  };
  asnCache.set(ip, result);
  return result;
}

/**
 * Decides whether the client's story and the server's observation can both be
 * true. Deliberately conservative: only a genuine contradiction is called one,
 * because a false accusation costs a tester real money.
 */
function assessConsistency(
  reportedType: string,
  networkKind: string,
): { consistency: 'consistent' | 'contradicted' | 'unverified'; reason: string | null } {
  if (networkKind === 'unknown') {
    return { consistency: 'unverified', reason: 'Origin network could not be classified' };
  }

  // A phone on a mobile network is never behind a hosting provider or VPN exit.
  // This holds regardless of what speed was reported.
  if (networkKind === 'datacenter') {
    return {
      consistency: 'contradicted',
      reason: 'Traffic originated from a hosting provider or VPN, not a consumer connection',
    };
  }

  if (reportedType === 'unknown') {
    return { consistency: 'unverified', reason: 'Browser exposed no connection information' };
  }

  // Constrained speeds claimed from a fixed line. Not impossible -- rural DSL and
  // congested fixed-wireless are genuinely slow -- so this is flagged for a human
  // rather than treated as fraud.
  if (networkKind === 'fixed' && (reportedType === '2g' || reportedType === 'slow-2g')) {
    return {
      consistency: 'contradicted',
      reason: '2G-class speed reported from a fixed-line network',
    };
  }

  return { consistency: 'consistent', reason: null };
}

function intOrNull(value: unknown, max: number): number | null {
  const parsed = typeof value === 'number' ? Math.round(value) : NaN;
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > max) return null;
  return parsed;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(503).json({ error: 'Network telemetry is not configured' });
  }

  const token = bearerToken(req.headers.authorization);
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const sessionId = typeof req.body?.sessionId === 'string' ? req.body.sessionId : '';
  if (!sessionId) return res.status(400).json({ error: 'A session reference is required' });

  const reportedTypeRaw = typeof req.body?.effectiveType === 'string' ? req.body.effectiveType : 'unknown';
  const reportedType = EFFECTIVE_TYPES.has(reportedTypeRaw) ? reportedTypeRaw : 'unknown';
  const downlinkKbps = intOrNull(req.body?.downlinkKbps, 10_000_000);
  const rttMs = intOrNull(req.body?.rttMs, 600_000);
  const slowestLoadMs = intOrNull(req.body?.slowestLoadMs, 600_000);
  const saveData = req.body?.saveData === true;

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

  // The service role bypasses RLS, so the ownership check phase 48 expressed as
  // a policy has to be made explicitly here instead.
  const { data: session, error: sessionError } = await supabase
    .from('test_lab_sessions')
    .select('id, tester_id, status')
    .eq('id', sessionId)
    .maybeSingle();

  if (sessionError || !session) return res.status(404).json({ error: 'Session not found' });
  if (session.tester_id !== user.id) return res.status(403).json({ error: 'Forbidden' });
  if (session.status === 'submitted') {
    return res.status(409).json({ error: 'This session has already been submitted' });
  }

  const ip = clientIp(req);
  const { asn, country } = await resolveAsn(ip);

  let networkKind = 'unknown';
  let asnName = '';
  if (asn !== null) {
    const { data: classification } = await supabase
      .from('asn_classifications')
      .select('asn_name, network_kind')
      .eq('asn', asn)
      .maybeSingle();

    if (classification) {
      networkKind = classification.network_kind;
      asnName = classification.asn_name;
    } else {
      // Unclassified ASNs are recorded so an admin can classify them later,
      // rather than being silently dropped.
      asnName = `AS${asn}`;
      await supabase
        .from('asn_classifications')
        .upsert(
          { asn, asn_name: asnName, network_kind: 'unknown', country_code: country },
          { onConflict: 'asn', ignoreDuplicates: true },
        );
    }
  }

  const { consistency, reason } = assessConsistency(reportedType, networkKind);

  const { error: insertError } = await supabase.from('test_session_network_samples').insert({
    session_id: sessionId,
    tester_id: user.id,
    effective_type: reportedType,
    downlink_kbps: downlinkKbps,
    rtt_ms: rttMs,
    save_data: saveData,
    slowest_load_ms: slowestLoadMs,
    observed_asn: asn,
    observed_asn_name: asnName || null,
    observed_network_kind: networkKind,
    observed_country_code: country,
    consistency,
    consistency_reason: reason,
    source: 'server',
  });

  if (insertError) {
    console.error('network-probe: could not record sample', { sessionId, error: insertError });
    return res.status(500).json({ error: 'Could not record this sample' });
  }

  // The tester is told what was observed rather than being quietly scored. If
  // their connection looks contradicted they should have the chance to fix it
  // (turn the VPN off, get off the office wifi) before submitting.
  return res.status(200).json({ recorded: true, consistency, networkKind });
}
