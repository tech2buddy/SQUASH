import { describe, expect, it } from 'vitest';
import migrationSql from '../../supabase/phase50_server_observed_network.sql?raw';
import {
  describeNetworkConfidence,
  describeNetworkSummary,
  networkConfidence,
  type NetworkSummary,
} from './networkTelemetry';

function summary(overrides: Partial<NetworkSummary> = {}): NetworkSummary {
  return {
    sampleCount: 12,
    dominantEffectiveType: '3g',
    medianDownlinkKbps: 480,
    medianRttMs: 180,
    rttStddevMs: 45,
    slowestLoadMs: 8400,
    saveDataShare: 0,
    observedNetworkKind: 'mobile',
    observedAsnName: 'Vodacom',
    contradictedCount: 0,
    unverifiedCount: 0,
    firstSampleAt: '2026-07-31T10:00:00Z',
    lastSampleAt: '2026-07-31T10:30:00Z',
    ...overrides,
  };
}

describe('network confidence', () => {
  it('only claims verification when the origin network was classified', () => {
    expect(networkConfidence(summary())).toBe('observed');
    expect(networkConfidence(summary({ observedNetworkKind: 'fixed' }))).toBe('observed');
  });

  it('does not claim verification for an unclassified network', () => {
    // An unknown ASN is normal and is not the tester's fault, but it is also
    // not evidence -- the report must not imply SQUASH checked anything.
    expect(networkConfidence(summary({ observedNetworkKind: 'unknown' }))).toBe('claimed');
    expect(networkConfidence(summary({ observedNetworkKind: null }))).toBe('claimed');
  });

  it('reports a disputed session even when everything else looks clean', () => {
    // A single contradiction outranks a hundred agreeable samples: the point of
    // the check is that one impossible reading discredits the set.
    expect(networkConfidence(summary({ contradictedCount: 1 }))).toBe('disputed');
    expect(
      networkConfidence(summary({ contradictedCount: 1, observedNetworkKind: 'mobile' })),
    ).toBe('disputed');
  });

  it('treats a missing summary as unverified rather than verified', () => {
    expect(networkConfidence(null)).toBe('claimed');
  });

  it('never describes an unverified session as confirmed', () => {
    for (const value of [
      describeNetworkConfidence(null),
      describeNetworkConfidence(summary({ observedNetworkKind: 'unknown' })),
      describeNetworkConfidence(summary({ contradictedCount: 2 })),
    ]) {
      expect(value.toLowerCase()).not.toContain('independently confirmed');
    }
    expect(describeNetworkConfidence(summary()).toLowerCase()).toContain('confirmed');
  });
});

describe('summary rendering', () => {
  it('states the measured conditions', () => {
    const text = describeNetworkSummary(summary());
    expect(text).toContain('3G');
    expect(text).toContain('480 kbps down');
    expect(text).toContain('180 ms RTT');
    expect(text).toContain('8.4 s');
  });

  it('says nothing was captured rather than inventing zeroes', () => {
    expect(describeNetworkSummary(null)).toBe('Network conditions not captured');
    expect(describeNetworkSummary(summary({ sampleCount: 0 }))).toBe(
      'Network conditions not captured',
    );
  });

  it('omits fields the browser never provided', () => {
    const text = describeNetworkSummary(
      summary({ medianDownlinkKbps: null, medianRttMs: null, slowestLoadMs: null }),
    );
    expect(text).toBe('Tested on 3G');
  });
});

describe('ASN classification seed', () => {
  const seeded = [...migrationSql.matchAll(/\((\d+),\s*'([^']+)',\s*'(mobile|fixed|datacenter|unknown)'/g)];

  it('seeds classifications for the major SA mobile carriers', () => {
    const mobileNames = seeded
      .filter(([, , , kind]) => kind === 'mobile')
      .map(([, , name]) => name.toLowerCase());

    for (const carrier of ['vodacom', 'mtn', 'cell c']) {
      expect(
        mobileNames.some((name) => name.includes(carrier)),
        `no mobile ASN seeded for ${carrier}`,
      ).toBe(true);
    }
  });

  it('classifies the common VPN and hosting exits a tester might hide behind', () => {
    const datacenterAsns = seeded
      .filter(([, , , kind]) => kind === 'datacenter')
      .map(([, asn]) => Number(asn));

    // AWS, Cloudflare and DigitalOcean are the ones a casual faker reaches for.
    for (const asn of [16509, 13335, 14061]) {
      expect(datacenterAsns, `AS${asn} should be classified as datacenter`).toContain(asn);
    }
  });

  it('never classifies a hosting provider as a mobile carrier', () => {
    const mobileAsns = new Set(
      seeded.filter(([, , , kind]) => kind === 'mobile').map(([, asn]) => Number(asn)),
    );
    for (const asn of [16509, 15169, 8075, 13335, 24940]) {
      expect(mobileAsns.has(asn)).toBe(false);
    }
  });

  it('revokes the client insert grant that made phase 48 spoofable', () => {
    // If this line ever disappears, testers can write their own "evidence"
    // again and the whole observed/reported split becomes decorative.
    expect(migrationSql).toContain(
      'revoke insert on public.test_session_network_samples from authenticated',
    );
  });

  it('summarises only server-observed samples', () => {
    expect(migrationSql).toMatch(/and source = 'server'/);
  });
});
