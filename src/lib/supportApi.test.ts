import { describe, expect, it, vi } from 'vitest';

const backend = vi.hoisted(() => ({ client: null as any }));
vi.mock('./supabase', () => ({ supabase: new Proxy({}, { get: (_target, key) => backend.client[key] }) }));
import { createSupportTicket } from './supportApi';

describe('support ticket delivery', () => {
  it('reports failure when neither the RPC nor fallback insert saves the ticket', async () => {
    backend.client = {
      rpc: async () => ({ error: { message: 'RPC unavailable' } }),
      auth: { getSession: async () => ({ data: { session: { user: { id: 'tester' } } } }) },
      from: () => ({ insert() { return this; }, select() { return this; }, single: async () => ({ data: null, error: { message: 'insert failed' } }) }),
    };
    await expect(createSupportTicket({ category: 'account', subject: 'Login help', description: 'I cannot log in.' }))
      .rejects.toThrow('Your support request was not saved');
  });
});
