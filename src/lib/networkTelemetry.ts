import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Network telemetry for Low-Data testing (phases 48 and 50).
 *
 * The Low-Data package sells testing under real 2G/3G conditions. This samples
 * the connection while the tester works so the report can state measured
 * conditions rather than assert them.
 *
 * Everything read here is a *hint from the tester's own browser*, and phase 50
 * stopped treating hints as evidence: samples are posted to /api/network-probe,
 * which records them next to the ASN it observes for the caller and decides
 * whether both stories can be true. Fabricating a body achieves nothing but a
 * contradicted row. Use `networkConfidence()` before showing any of it to a
 * developer as fact.
 *
 * Availability caveat: the Network Information API is Chromium-only. Safari and
 * Firefox expose nothing, so `readNetworkSample` returns null there and no rows
 * are written. That is deliberate -- an absent measurement is reported as "not
 * captured" rather than guessed at. In practice most SA testers on the low-data
 * package are on Android/Chrome, which is exactly where this works.
 */

export type NetworkEffectiveType = 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';

export type NetworkSample = {
  effectiveType: NetworkEffectiveType;
  downlinkKbps: number | null;
  rttMs: number | null;
  saveData: boolean;
};

export type NetworkSummary = {
  sampleCount: number;
  dominantEffectiveType: NetworkEffectiveType | null;
  medianDownlinkKbps: number | null;
  medianRttMs: number | null;
  /** Jitter across the session. Near zero suggests emulated throttling. */
  rttStddevMs: number | null;
  slowestLoadMs: number | null;
  saveDataShare: number;
  /** What SQUASH observed about the origin network, not what was claimed. */
  observedNetworkKind: 'mobile' | 'fixed' | 'datacenter' | 'unknown' | null;
  observedAsnName: string | null;
  contradictedCount: number;
  unverifiedCount: number;
  firstSampleAt: string | null;
  lastSampleAt: string | null;
};

const EFFECTIVE_TYPES: NetworkEffectiveType[] = ['slow-2g', '2g', '3g', '4g'];

function connection(): any {
  if (typeof navigator === 'undefined') return undefined;
  const nav = navigator as any;
  return nav.connection || nav.mozConnection || nav.webkitConnection;
}

/** One reading, or null when the browser does not expose the API. */
export function readNetworkSample(): NetworkSample | null {
  const conn = connection();
  if (!conn) return null;

  const raw = String(conn.effectiveType || '');
  const effectiveType = (EFFECTIVE_TYPES as string[]).includes(raw)
    ? (raw as NetworkEffectiveType)
    : 'unknown';

  // navigator.connection.downlink is Mbit/s; stored as kbps so a 0.15 Mbit/s
  // 2G link does not round to zero.
  const downlink = typeof conn.downlink === 'number' ? Math.round(conn.downlink * 1000) : null;
  const rtt = typeof conn.rtt === 'number' ? Math.round(conn.rtt) : null;

  return {
    effectiveType,
    downlinkKbps: downlink,
    rttMs: rtt,
    saveData: Boolean(conn.saveData),
  };
}

export type SampleVerdict = {
  consistency: 'consistent' | 'contradicted' | 'unverified';
  networkKind: 'mobile' | 'fixed' | 'datacenter' | 'unknown';
};

/**
 * Sends a sample to /api/network-probe, which is the only thing allowed to
 * write one (phase 50 revoked the client's insert grant).
 *
 * These values are *hints*, not measurements SQUASH stands behind. The server
 * records them beside what it observes about the caller's network and decides
 * whether the two can both be true. Sending a fabricated body here achieves
 * nothing except a contradicted row.
 */
async function persistSample(
  sessionId: string,
  sample: NetworkSample,
  slowestLoadMs: number | null,
): Promise<SampleVerdict | null> {
  if (!isSupabaseConfigured) return null;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return null;

  const response = await fetch('/api/network-probe', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionId,
      effectiveType: sample.effectiveType,
      downlinkKbps: sample.downlinkKbps,
      rttMs: sample.rttMs,
      saveData: sample.saveData,
      slowestLoadMs,
    }),
  });

  if (!response.ok) return null;
  const payload = await response.json().catch(() => null);
  if (!payload?.recorded) return null;

  return { consistency: payload.consistency, networkKind: payload.networkKind };
}

const SAMPLE_INTERVAL_MS = 30_000;

/**
 * Samples the connection for the life of a Test Lab session.
 *
 * Returns a stop function. Samples on a fixed interval, plus immediately on any
 * connection change so a drop from 4G to 3G mid-test is captured rather than
 * averaged away. Failures are swallowed: telemetry must never interrupt a
 * tester's paid work.
 */
export function startNetworkSampling(
  sessionId: string,
  testerId: string,
  onVerdict?: (verdict: SampleVerdict) => void,
): () => void {
  if (!sessionId || !testerId) return () => {};

  const conn = connection();
  if (!conn) return () => {};

  let stopped = false;
  let slowestLoadMs: number | null = null;
  let observer: PerformanceObserver | undefined;

  // Track the slowest resource load between samples -- the number a developer
  // actually feels, as opposed to the theoretical link speed.
  if (typeof PerformanceObserver !== 'undefined') {
    try {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const duration = Math.round(entry.duration);
          if (Number.isFinite(duration) && (slowestLoadMs === null || duration > slowestLoadMs)) {
            slowestLoadMs = duration;
          }
        }
      });
      observer.observe({ type: 'resource', buffered: true });
    } catch {
      observer = undefined;
    }
  }

  const capture = () => {
    if (stopped) return;
    const sample = readNetworkSample();
    if (!sample) return;
    const slowest = slowestLoadMs;
    slowestLoadMs = null;
    void persistSample(sessionId, sample, slowest)
      .then((verdict) => {
        if (verdict && !stopped) onVerdict?.(verdict);
      })
      .catch(() => {
        // Telemetry is best-effort; a dropped sample is not worth an error state.
      });
  };

  capture();
  const timer = window.setInterval(capture, SAMPLE_INTERVAL_MS);
  conn.addEventListener?.('change', capture);

  return () => {
    stopped = true;
    window.clearInterval(timer);
    conn.removeEventListener?.('change', capture);
    observer?.disconnect();
  };
}

export async function getSessionNetworkSummary(sessionId: string): Promise<NetworkSummary | null> {
  if (!isSupabaseConfigured || !sessionId) return null;

  const { data, error } = await (supabase.rpc as any)('get_session_network_summary', {
    p_session_id: sessionId,
  });
  if (error) return null;

  const row = (data || [])[0] as
    | {
        sample_count: number;
        dominant_effective_type: NetworkEffectiveType | null;
        median_downlink_kbps: number | null;
        median_rtt_ms: number | null;
        rtt_stddev_ms: number | null;
        slowest_load_ms: number | null;
        save_data_share: number | null;
        observed_network_kind: NetworkSummary['observedNetworkKind'];
        observed_asn_name: string | null;
        contradicted_count: number;
        unverified_count: number;
        first_sample_at: string | null;
        last_sample_at: string | null;
      }
    | undefined;

  if (!row || !row.sample_count) return null;

  return {
    sampleCount: row.sample_count,
    dominantEffectiveType: row.dominant_effective_type,
    medianDownlinkKbps: row.median_downlink_kbps,
    medianRttMs: row.median_rtt_ms,
    rttStddevMs: row.rtt_stddev_ms,
    slowestLoadMs: row.slowest_load_ms,
    saveDataShare: Number(row.save_data_share ?? 0),
    observedNetworkKind: row.observed_network_kind,
    observedAsnName: row.observed_asn_name,
    contradictedCount: row.contradicted_count ?? 0,
    unverifiedCount: row.unverified_count ?? 0,
    firstSampleAt: row.first_sample_at,
    lastSampleAt: row.last_sample_at,
  };
}

/**
 * How much weight a developer should put on the summary.
 *
 * `observed` is the only level that means SQUASH checked anything. `claimed`
 * exists because unclassified ASNs and browsers without the Network Information
 * API are both normal, and neither is the tester's fault -- but neither is
 * evidence either, and the report must not imply otherwise.
 */
export type NetworkConfidence = 'observed' | 'claimed' | 'disputed';

export function networkConfidence(summary: NetworkSummary | null): NetworkConfidence {
  if (!summary) return 'claimed';
  if (summary.contradictedCount > 0) return 'disputed';
  if (summary.observedNetworkKind && summary.observedNetworkKind !== 'unknown') return 'observed';
  return 'claimed';
}

/**
 * Same summary, keyed by assignment — which is what the report pages actually
 * hold. Sessions are unique per assignment (test_lab_sessions has a unique
 * constraint on assignment_id), so this resolves to at most one session.
 */
export async function getAssignmentNetworkSummary(assignmentId: string): Promise<NetworkSummary | null> {
  if (!isSupabaseConfigured || !assignmentId) return null;

  const { data, error } = await (supabase.from('test_lab_sessions') as any)
    .select('id')
    .eq('assignment_id', assignmentId)
    .maybeSingle();

  if (error || !data?.id) return null;
  return getSessionNetworkSummary(data.id);
}

/**
 * The one-line version for a report header, e.g.
 * "Tested on 3G · 480 kbps down · 180 ms RTT · slowest load 8.4 s".
 */
export function describeNetworkSummary(summary: NetworkSummary | null): string {
  if (!summary || summary.sampleCount === 0) return 'Network conditions not captured';

  const parts: string[] = [];
  if (summary.dominantEffectiveType && summary.dominantEffectiveType !== 'unknown') {
    parts.push(`Tested on ${summary.dominantEffectiveType.toUpperCase()}`);
  }
  if (summary.medianDownlinkKbps !== null) {
    parts.push(`${summary.medianDownlinkKbps} kbps down`);
  }
  if (summary.medianRttMs !== null) {
    parts.push(`${summary.medianRttMs} ms RTT`);
  }
  if (summary.slowestLoadMs !== null) {
    parts.push(`slowest load ${(summary.slowestLoadMs / 1000).toFixed(1)} s`);
  }
  if (summary.saveDataShare >= 0.5) {
    parts.push('data saver on');
  }

  return parts.length > 0 ? parts.join(' · ') : 'Network conditions not captured';
}

/**
 * The plain-language caveat that must travel with the numbers. SQUASH sells
 * "real humans on real networks", so overstating what was checked is worse than
 * saying less -- a developer who learns the guarantee was softer than implied
 * is a refund and a reputation problem.
 */
export function describeNetworkConfidence(summary: NetworkSummary | null): string {
  switch (networkConfidence(summary)) {
    case 'observed':
      return `Origin network independently confirmed by SQUASH as ${
        summary?.observedNetworkKind === 'mobile' ? 'a mobile carrier' : 'a fixed-line ISP'
      }${summary?.observedAsnName ? ` (${summary.observedAsnName})` : ''}.`;
    case 'disputed':
      return 'These readings conflict with the network SQUASH observed. Treat them as unverified — this session is flagged for review.';
    default:
      return 'Speeds reported by the tester’s browser. SQUASH could not independently classify the origin network, so treat these as indicative rather than confirmed.';
  }
}
