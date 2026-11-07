import { describe, expect, it } from 'vitest';
import type { BrewLogEntry } from '../../domain/contracts';
import {
  attemptNumber,
  changedVariableCount,
  compareAttempts,
  drinkIdsInJournal,
  filterByDrink,
  formatDurationInput,
  laterAttempts,
  partiallyLoggedCount,
  parseDuration,
  parseGrams,
  previousAttempt,
  sortNewestFirst,
} from './model';

const e = (id: string, x: Partial<BrewLogEntry> = {}): BrewLogEntry => ({
  id,
  evidence: 'self_report',
  drinkId: 'espresso-shot',
  createdAt: `2026-11-07T10:0${id.length}:00.000Z`,
  ...x,
});

describe('form parsing (no invented values)', () => {
  it('parses grams, accepts comma decimals, keeps empty as undefined', () => {
    expect(parseGrams('18', 'doseG')).toEqual({ ok: true, value: 18 });
    expect(parseGrams(' 18,5 ', 'doseG')).toEqual({ ok: true, value: 18.5 });
    expect(parseGrams('', 'outG')).toEqual({ ok: true, value: undefined });
    expect(parseGrams('abc', 'outG')).toEqual({ ok: false, error: 'nan' });
    expect(parseGrams('-3', 'outG')).toEqual({ ok: false, error: 'nan' });
    expect(parseGrams('0', 'doseG')).toEqual({ ok: false, error: 'range' });
    expect(parseGrams('99999', 'outG')).toEqual({ ok: false, error: 'range' });
  });
  it('parses seconds, m:ss and h:mm:ss', () => {
    expect(parseDuration('28')).toEqual({ ok: true, value: 28 });
    expect(parseDuration('3:30')).toEqual({ ok: true, value: 210 });
    expect(parseDuration('12:00:00')).toEqual({ ok: true, value: 43200 });
    expect(parseDuration('')).toEqual({ ok: true, value: undefined });
    expect(parseDuration('3:75')).toEqual({ ok: false, error: 'nan' });
    expect(parseDuration('soon')).toEqual({ ok: false, error: 'nan' });
    expect(parseDuration('999:00:00')).toEqual({ ok: false, error: 'range' });
  });
  it('formats durations back for editing', () => {
    expect(formatDurationInput(28)).toBe('28');
    expect(formatDurationInput(210)).toBe('3:30');
    expect(formatDurationInput(43200)).toBe('12:00:00');
    expect(formatDurationInput(undefined)).toBe('');
  });
});

describe('sorting, filtering, attempt chains', () => {
  const a = e('a', { createdAt: '2026-11-07T08:00:00.000Z', doseG: 18, outG: 36, timeSec: 20, grind: '8', tasteTags: ['sour'], rating: 2 });
  const b = e('b', { createdAt: '2026-11-07T08:10:00.000Z', attemptOf: 'a', doseG: 18, outG: 36, timeSec: 27, grind: '7', tasteTags: ['sweet'], rating: 4 });
  const c = e('c', { createdAt: '2026-11-07T08:20:00.000Z', attemptOf: 'b' });
  const p = e('p', { createdAt: '2026-11-07T09:00:00.000Z', drinkId: 'pourover-cone' });
  const all = [a, b, c, p];

  it('sorts newest first and filters by drink', () => {
    expect(sortNewestFirst(all).map((x) => x.id)).toEqual(['p', 'c', 'b', 'a']);
    expect(filterByDrink(all, 'pourover-cone').map((x) => x.id)).toEqual(['p']);
    expect(filterByDrink(all, null)).toHaveLength(4);
    expect(drinkIdsInJournal(all)).toEqual([
      { drinkId: 'espresso-shot', count: 3 },
      { drinkId: 'pourover-cone', count: 1 },
    ]);
  });

  it('follows attempt links (cycle-safe)', () => {
    expect(previousAttempt(b, all)?.id).toBe('a');
    expect(previousAttempt(a, all)).toBeUndefined();
    expect(laterAttempts(a, all).map((x) => x.id)).toEqual(['b']);
    expect(attemptNumber(c, all)).toBe(3);
    const x = e('x', { attemptOf: 'y' });
    const y = e('y', { attemptOf: 'x' });
    expect(attemptNumber(x, [x, y])).toBe(2);
  });

  it('compares attempts field by field and counts recipe changes only', () => {
    const rows = compareAttempts(a, b);
    const byField = Object.fromEntries(rows.map((r) => [r.field, r]));
    expect(byField.doseG).toMatchObject({ before: 18, after: 18, changed: false });
    expect(byField.ratio).toMatchObject({ before: 2, after: 2, changed: false });
    expect(byField.timeSec).toMatchObject({ before: 20, after: 27, changed: true });
    expect(byField.grind).toMatchObject({ before: '8', after: '7', changed: true });
    expect(byField.tasteTags).toMatchObject({ before: ['sour'], after: ['sweet'], changed: true });
    expect(changedVariableCount(rows)).toBe(1); // only the grind; time/taste are results
    expect(partiallyLoggedCount(rows)).toBe(0);
    const partialRows = compareAttempts(e('p1', { doseG: 18 }), e('p2', { doseG: 18, grind: '7' }));
    expect(changedVariableCount(partialRows)).toBe(0);
    expect(partiallyLoggedCount(partialRows)).toBe(1);
    // fields neither attempt recorded are omitted
    expect(compareAttempts(c, e('z')).length).toBe(0);
  });
});
