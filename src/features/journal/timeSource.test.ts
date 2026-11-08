import { act } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { BrewLogEntry } from '../../domain/contracts';
import { getLearnerState, initLearnerStore, learnerActions } from '../../state';
import { LEGACY_TIME_SOURCE_KEY, legacyAppTimedIds, migrateLegacyTimeSource, timeSourceForSave, timeSourceOf } from './timeSource';

const e = (id: string, p: Partial<BrewLogEntry> = {}): BrewLogEntry => ({ id, evidence: 'self_report', drinkId: 'espresso-shot', createdAt: '2026-11-08T08:00:00.000Z', ...p });

describe('timeSource (contract field BrewLogEntry.timeSource)', () => {
  it('app-timer only when the entry says so; any other logged time is self-reported; no time → null', () => {
    expect(timeSourceOf({ timeSec: 28, timeSource: 'app-timer' })).toBe('app-timer');
    expect(timeSourceOf({ timeSec: 28, timeSource: 'self_report' })).toBe('self_report');
    expect(timeSourceOf({ timeSec: 28 })).toBe('self_report');
    expect(timeSourceOf({ timeSec: undefined, timeSource: 'app-timer' })).toBeNull();
  });

  it('timeSourceForSave: untouched measurement → app-timer; edited/typed → self_report; no time → undefined', () => {
    expect(timeSourceForSave(28, true)).toBe('app-timer');
    expect(timeSourceForSave(30, false)).toBe('self_report');
    expect(timeSourceForSave(undefined, true)).toBeUndefined();
  });
});

describe('one-time migration of the interim side key', () => {
  beforeEach(() => {
    localStorage.removeItem(LEGACY_TIME_SOURCE_KEY);
    initLearnerStore();
  });

  it('marks only entries whose time still equals the stored seconds and that have no timeSource yet', () => {
    const journal = [e('a', { timeSec: 28 }), e('b', { timeSec: 30 }), e('c'), e('d', { timeSec: 31, timeSource: 'self_report' })];
    expect(legacyAppTimedIds(journal, { a: 28, b: 29, c: 10, d: 31, gone: 5 })).toEqual(['a']);
  });

  it('writes timeSource through the store, then removes the key; a second run is a no-op', () => {
    let a!: BrewLogEntry;
    let b!: BrewLogEntry;
    act(() => {
      a = learnerActions.addJournalEntry({ drinkId: 'espresso-shot', timeSec: 28 });
      b = learnerActions.addJournalEntry({ drinkId: 'espresso-shot', timeSec: 40 });
    });
    localStorage.setItem(LEGACY_TIME_SOURCE_KEY, JSON.stringify({ [a.id]: 28, [b.id]: 41 }));
    let n = 0;
    act(() => {
      n = migrateLegacyTimeSource(getLearnerState().journal, learnerActions.updateJournalEntry);
    });
    expect(n).toBe(1);
    const j = getLearnerState().journal;
    expect(j.find((x) => x.id === a.id)).toMatchObject({ timeSource: 'app-timer', evidence: 'self_report' });
    expect(j.find((x) => x.id === b.id)?.timeSource).toBeUndefined();
    expect(localStorage.getItem(LEGACY_TIME_SOURCE_KEY)).toBeNull();
    expect(migrateLegacyTimeSource(getLearnerState().journal, () => { throw new Error('should not update'); })).toBe(0);
  });

  it('a corrupted legacy key migrates nothing but is still removed', () => {
    localStorage.setItem(LEGACY_TIME_SOURCE_KEY, '{oops');
    expect(migrateLegacyTimeSource([e('a', { timeSec: 28 })], () => { throw new Error('no'); })).toBe(0);
    expect(localStorage.getItem(LEGACY_TIME_SOURCE_KEY)).toBeNull();
  });
});
