import { parsePrice } from '../../../src/utils/parsePrice';

describe('parsePrice', () => {
  it('parses numeric string', () => {
    expect(parsePrice('10.50')).toBe(10.5);
  });

  it('returns number as-is', () => {
    expect(parsePrice(42)).toBe(42);
  });

  it('returns 0 for null', () => {
    expect(parsePrice(null)).toBe(0);
  });

  it('returns 0 for undefined', () => {
    expect(parsePrice(undefined)).toBe(0);
  });

  it('returns 0 for empty string', () => {
    expect(parsePrice('')).toBe(0);
  });

  it('strips currency symbols', () => {
    expect(parsePrice('$10.50')).toBe(10.5);
  });

  it('strips commas', () => {
    expect(parsePrice('1,234.56')).toBe(1234.56);
  });

  it('handles integer strings', () => {
    expect(parsePrice('100')).toBe(100);
  });

  it('returns 0 for non-numeric string', () => {
    expect(parsePrice('abc')).toBe(0);
  });
});
