import { describe, expect, it } from 'vitest';
import { brewRatio, formatBrewRatio, formatRatio, outForRatio, tryBrewRatio } from './brew';

describe('brewRatio', () => {
  it('espresso: yield / dose', () => {
    expect(brewRatio(18, 36)).toBe(2);
    expect(brewRatio(18, 45)).toBeCloseTo(2.5);
  });
  it('pour-over: water / dose', () => {
    expect(brewRatio(15, 250)).toBeCloseTo(16.667, 3);
  });
  it('allows 0 output (e.g. nothing pulled yet)', () => {
    expect(brewRatio(18, 0)).toBe(0);
  });
  it.each([
    [0, 36],
    [-1, 36],
    [18, -1],
    [Number.NaN, 36],
    [18, Number.POSITIVE_INFINITY],
  ])('rejects invalid input dose=%p out=%p', (dose, out) => {
    expect(() => brewRatio(dose, out)).toThrow(RangeError);
  });
  it('tryBrewRatio returns null instead of throwing', () => {
    expect(tryBrewRatio(undefined, 36)).toBeNull();
    expect(tryBrewRatio(0, 36)).toBeNull();
    expect(tryBrewRatio(18, 36)).toBe(2);
  });
});

describe('formatRatio', () => {
  it('formats locale-agnostically with one decimal by default', () => {
    expect(formatRatio(2)).toBe('1:2.0');
    expect(formatRatio(16.6667)).toBe('1:16.7');
    expect(formatRatio(2.25, 2)).toBe('1:2.25');
  });
  it('handles invalid ratios', () => {
    expect(formatRatio(Number.NaN)).toBe('1:–');
    expect(formatRatio(null)).toBe('1:–');
    expect(formatBrewRatio(0, 36)).toBe('1:–');
    expect(formatBrewRatio(18, 36)).toBe('1:2.0');
  });
  it('outForRatio is the inverse', () => {
    expect(outForRatio(18, 2)).toBe(36);
    expect(() => outForRatio(0, 2)).toThrow(RangeError);
  });
});
