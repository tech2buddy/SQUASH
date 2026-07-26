import { describe, expect, it } from 'vitest';
import { isSafeInternalPath, resolvePostLoginPath, routeRole } from './auth';

describe('routing safety', () => {
  it('identifies protected routes by role', () => {
    expect(routeRole('/dashboard')).toBe('developer');
    expect(routeRole('/tester/dashboard')).toBe('tester');
    expect(routeRole('/admin')).toBe('public');
    expect(routeRole('/A31')).toBe('public');
    expect(routeRole('/A31/payouts')).toBe('admin');
    expect(routeRole('/A31/users/example-user')).toBe('admin');
    expect(routeRole('/pricing')).toBe('public');
  });

  it('rejects external redirect targets', () => {
    expect(isSafeInternalPath('//attacker.example')).toBe(false);
    expect(isSafeInternalPath('https://attacker.example')).toBe(false);
    expect(resolvePostLoginPath('tester', '//attacker.example')).toBe('/tester/dashboard');
  });

  it('does not send a user to a route their role cannot access', () => {
    expect(resolvePostLoginPath('tester', '/dashboard')).toBe('/tester/dashboard');
    expect(resolvePostLoginPath('developer', '/tester/dashboard')).toBe('/dashboard');
    expect(resolvePostLoginPath('developer', '/post-job')).toBe('/post-job');
  });
});
