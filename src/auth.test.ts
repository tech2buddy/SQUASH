import { describe, expect, it } from 'vitest';
import { buildIdleSignOutUrl, idleTimeoutMinutes, isSafeInternalPath, resolvePostLoginPath, routeRole } from './auth';

describe('routing safety', () => {
  it('identifies protected routes by role', () => {
    expect(routeRole('/dashboard')).toBe('developer');
    expect(routeRole('/developer/support')).toBe('developer');
    expect(routeRole('/tester/dashboard')).toBe('tester');
    expect(routeRole('/tester/support')).toBe('tester');
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

describe('idle sign-out', () => {
  it('gives admin accounts a shorter idle window than developer/tester', () => {
    expect(idleTimeoutMinutes(true)).toBe(15);
    expect(idleTimeoutMinutes(false)).toBe(30);
  });

  it('carries the active workspace role forward so the login toggle matches', () => {
    expect(buildIdleSignOutUrl('tester', '/tester/dashboard')).toBe('/login?reason=idle&next=%2Ftester%2Fdashboard&role=tester');
    expect(buildIdleSignOutUrl('developer', '/dashboard')).toBe('/login?reason=idle&next=%2Fdashboard&role=developer');
  });

  it('omits role for admin -- the toggle only understands developer/tester, and the admin path is driven by next', () => {
    expect(buildIdleSignOutUrl('admin', '/A31/dashboard')).toBe('/login?reason=idle&next=%2FA31%2Fdashboard');
  });

  it('omits role when the active workspace is unknown', () => {
    expect(buildIdleSignOutUrl(undefined, '/dashboard')).toBe('/login?reason=idle&next=%2Fdashboard');
  });

  it('preserves an existing query string on the return path', () => {
    expect(buildIdleSignOutUrl('tester', '/tester/jobs?filter=open')).toBe('/login?reason=idle&next=%2Ftester%2Fjobs%3Ffilter%3Dopen&role=tester');
  });
});
