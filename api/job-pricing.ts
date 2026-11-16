import { TEST_TYPES } from '../src/lib/testTypes';

// Shared rates are code, not a browser-supplied price. The database guard in
// phase67 repeats them so direct table writes cannot bypass checkout.

export function expectedJobTotal(type: unknown, count: unknown): number | null {
  const price = TEST_TYPES.find((item) => item.key === type);
  if (!price || !Number.isSafeInteger(count) || (count as number) < price.minTesters || (count as number) > 1000) return null;
  return price.ratePerTesterZar * (count as number);
}
