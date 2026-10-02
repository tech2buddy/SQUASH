import { describe, expect, it } from 'vitest';
import { formatJobTitle, formatPersonName } from './displayText';

describe('display text formatting', () => {
  it('capitalizes every part of a person name', () => {
    expect(formatPersonName('sam mkwayi')).toBe('Sam Mkwayi');
    expect(formatPersonName("mary-jane o'neill")).toBe("Mary-Jane O'Neill");
  });

  it('capitalizes lowercase job titles while preserving acronyms and brand casing', () => {
    expect(formatJobTitle('rise management')).toBe('Rise Management');
    expect(formatJobTitle('mobile QA and KYC flow')).toBe('Mobile QA And KYC Flow');
    expect(formatJobTitle('PayFast checkout')).toBe('PayFast Checkout');
  });
});
