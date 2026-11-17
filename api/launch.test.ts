import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectedJobTotal } from './create-checkout';
import { TEST_TYPES } from '../src/lib/testTypes';

const backend = vi.hoisted(() => ({ client: null as any }));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => backend.client }));

import paymentWebhook from './payment-webhook';
import scanUpload from './scan-upload';
import createCheckout from './create-checkout';

function response() {
  return {
    code: 200, body: null as any,
    status(code: number) { this.code = code; return this; },
    json(body: any) { this.body = body; return this; },
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('paid job safety', () => {
  it('uses the published rates and rejects invalid counts', () => {
    const guardSql = readFileSync(new URL('../supabase/phase67_job_pricing_guard.sql', import.meta.url), 'utf8');
    for (const type of TEST_TYPES) {
      expect(expectedJobTotal(type.key, type.minTesters)).toBe(type.ratePerTesterZar * type.minTesters);
      expect(guardSql).toContain(`('${type.key}', ${type.ratePerTesterZar}, ${type.minTesters})`);
    }
    expect(expectedJobTotal('bug-hunting', 1)).toBeNull();
    expect(expectedJobTotal('unknown', 5)).toBeNull();
  });

  it('rejects a tampered draft before creating a checkout', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://audit.invalid');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'fake');
    vi.stubEnv('YOCO_SECRET_KEY', 'fake');
    vi.stubEnv('APP_URL', 'https://audit.invalid');
    const insert = vi.fn();
    backend.client = {
      auth: { getUser: async () => ({ data: { user: { id: 'developer' } }, error: null }) },
      from: () => ({ select() { return this; }, eq() { return this; }, maybeSingle: async () => ({ data: { id: 'job', package_key: 'bug-hunting', testers_needed: 10, total_amount_zar: 1, status: 'draft' } }), insert }),
    };
    const res = response();
    await createCheckout({ method: 'POST', headers: { authorization: 'Bearer token' }, body: { jobId: '00000000-0000-0000-0000-000000000001' } }, res);
    expect(res.code).toBe(409);
    expect(insert).not.toHaveBeenCalled();
  });

  it('aborts if the job changes while creating the payment record', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://audit.invalid');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'fake');
    vi.stubEnv('YOCO_SECRET_KEY', 'fake');
    vi.stubEnv('APP_URL', 'https://audit.invalid');
    const providerCall = vi.fn();
    vi.stubGlobal('fetch', providerCall);
    const markFailed = vi.fn(() => ({ eq: async () => ({ error: null }) }));
    let jobReads = 0;
    backend.client = {
      auth: { getUser: async () => ({ data: { user: { id: 'developer' } }, error: null }) },
      from(table: string) {
        if (table === 'jobs') return {
          select() { return this; }, eq() { return this; },
          maybeSingle: async () => ({ data: { id: 'job', package_key: 'bug-hunting', testers_needed: 10, total_amount_zar: ++jobReads === 1 ? 1000 : 1, status: 'draft' } }),
        };
        return {
          select() { return this; }, eq() { return this; }, in() { return this; }, order() { return this; }, limit() { return this; },
          maybeSingle: async () => ({ data: null }),
          insert() { return this; }, single: async () => ({ data: { id: 'payment' } }),
          update: markFailed,
        };
      },
    };
    const res = response();
    await createCheckout({ method: 'POST', headers: { authorization: 'Bearer token' }, body: { jobId: '00000000-0000-0000-0000-000000000001' } }, res);
    expect(res.code).toBe(409);
    expect(markFailed).toHaveBeenCalledWith(expect.objectContaining({ status: 'failed' }));
    expect(providerCall).not.toHaveBeenCalled();
  });

  it('retries activation after payment was recorded but activation failed', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://audit.invalid');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'fake');
    const secret = Buffer.from('audit-secret').toString('base64');
    vi.stubEnv('YOCO_WEBHOOK_SECRET', secret);
    let eventSaved = false;
    let activated = false;
    let paymentSucceeded = false;
    let activationAttempts = 0;
    backend.client = { from(table: string) {
      if (table === 'payment_webhook_events') return { insert: async () => {
        if (eventSaved) return { error: { code: '23505' } };
        eventSaved = true; return { error: null };
      } };
      if (table === 'job_payments') return {
        select() { return this; }, eq() { return this; },
        maybeSingle: async () => ({ data: { id: 'payment', job_id: 'job', amount_cents: 10000, currency: 'ZAR', status: paymentSucceeded ? 'succeeded' : 'pending', provider_payment_id: paymentSucceeded ? 'provider-payment' : null } }),
        update() { paymentSucceeded = true; return { eq: async () => ({ error: null }) }; },
      };
      if (table === 'jobs') return { update() { let filters = 0; return { eq() {
        filters++;
        if (filters === 1) return this;
        activationAttempts++;
        if (activationAttempts === 1) return Promise.resolve({ error: { message: 'temporary failure' } });
        activated = true; return Promise.resolve({ error: null });
      } }; } };
      throw new Error(`Unexpected table ${table}`);
    } };
    const body = JSON.stringify({ type: 'payment.succeeded', payload: { metadata: { checkoutId: 'checkout' }, status: 'succeeded', amount: 10000, currency: 'ZAR', id: 'provider-payment' } });
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = createHmac('sha256', Buffer.from(secret, 'base64')).update(`delivery.${timestamp}.${body}`).digest('base64');
    const request = () => ({ method: 'POST', headers: { 'webhook-id': 'delivery', 'webhook-timestamp': timestamp, 'webhook-signature': `v1,${signature}` }, async *[Symbol.asyncIterator]() { yield body; } });
    const first = response(); const retry = response();
    await paymentWebhook(request(), first);
    await paymentWebhook(request(), retry);
    expect(first.code).toBe(500);
    expect(retry.code).toBe(200);
    expect(activated).toBe(true);
    expect(activationAttempts).toBe(2);
  });
});

describe('upload safety', () => {
  it('rejects a path outside the caller folder before the service role accesses it', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://audit.invalid');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'fake');
    const download = vi.fn();
    backend.client = { auth: { getUser: async () => ({ data: { user: { id: 'caller' } }, error: null }) }, storage: { from: () => ({ download }) } };
    const res = response();
    await scanUpload({ method: 'POST', headers: { authorization: 'Bearer token' }, body: { bucket: 'tester-banking-documents', path: 'another-user/file.pdf' } }, res);
    expect(res.code).toBe(403);
    expect(download).not.toHaveBeenCalled();
  });

  it('rejects and removes an unscanned file when no scanner is configured', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://audit.invalid');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'fake');
    vi.stubEnv('CLOUDMERSIVE_API_KEY', '');
    const remove = vi.fn().mockResolvedValue({ error: null });
    backend.client = {
      auth: { getUser: async () => ({ data: { user: { id: 'caller' } }, error: null }) },
      storage: { from: () => ({ remove }) },
      from: () => ({ upsert: async () => ({ error: null }) }),
    };
    const res = response();
    await scanUpload({ method: 'POST', headers: { authorization: 'Bearer token' }, body: { bucket: 'tester-banking-documents', path: 'caller/file.pdf' } }, res);
    expect(res.code).toBe(503);
    expect(remove).toHaveBeenCalledWith(['caller/file.pdf']);
  });
});
