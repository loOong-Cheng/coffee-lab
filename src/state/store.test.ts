import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LearnerProfile } from '../domain/contracts';
import {
  RESET_BACKUP_KEY,
  STORAGE_KEY,
  createMemoryStorage,
  getLearnerState,
  getPersistenceStatus,
  initLearnerStore,
  learnerActions,
  useLearner,
  type StorageLike,
} from './index';

const profile: LearnerProfile = {
  goal: 'espresso',
  experience: 'new',
  devices: ['pc'],
  equipment: ['espresso-machine', 'grinder'],
  wishlist: [],
  preferredMode: 'desktop',
  onboardedAt: '2026-11-07T09:00:00.000Z',
};

let storage: ReturnType<typeof createMemoryStorage>;
const saved = () => JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null');

beforeEach(() => {
  storage = createMemoryStorage();
  initLearnerStore(storage);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('learnerActions', () => {
  it('setProfile + updatePrefs persist under coffee-lab:state with a version', () => {
    learnerActions.setProfile(profile);
    learnerActions.updatePrefs({ locale: 'zh', volume: 3 });
    const s = saved();
    expect(s.version).toBe(1);
    expect(s.profile.goal).toBe('espresso');
    expect(s.prefs.locale).toBe('zh');
    expect(s.prefs.volume).toBe(1);
  });

  it('updatePrefs ignores explicit undefined values', () => {
    learnerActions.updatePrefs({ sfx: undefined, music: true });
    expect(getLearnerState().prefs.sfx).toBe(true);
    expect(getLearnerState().prefs.music).toBe(true);
  });

  it('recordEvent assigns id + recordedAt, clamps score and appends', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-07T12:00:00.000Z'));
    const e = learnerActions.recordEvent({
      activityId: 'a1',
      lessonId: 'l1',
      mode: 'mobile',
      guidance: 'assisted',
      evidence: 'assessed_answer',
      outcome: 'completed',
      score: 1.7,
    });
    expect(e.id).toMatch(/^evt_/);
    expect(e.recordedAt).toBe('2026-11-07T12:00:00.000Z');
    expect(e.score).toBe(1);
    expect(getLearnerState().events).toEqual([e]);
    expect(saved().events).toHaveLength(1);
  });

  it('journal add/update/delete; evidence is always self_report', () => {
    const entry = learnerActions.addJournalEntry({ drinkId: 'espresso', doseG: 18, outG: 36, rating: 3 });
    expect(entry.evidence).toBe('self_report');
    expect(entry.id).toMatch(/^brew_/);
    learnerActions.updateJournalEntry(entry.id, { notes: 'sour', nextChange: 'grind finer', evidence: 'simulated' } as never);
    const updated = getLearnerState().journal[0];
    expect(updated.notes).toBe('sour');
    expect(updated.evidence).toBe('self_report');
    expect(updated.id).toBe(entry.id);
    learnerActions.updateJournalEntry('missing', { notes: 'x' });
    learnerActions.deleteJournalEntry(entry.id);
    expect(getLearnerState().journal).toEqual([]);
  });

  it('practice session start/update/end (resumable)', () => {
    learnerActions.updatePractice({ stepIndex: 3 }); // no active session → no-op
    expect(getLearnerState().activePractice).toBeNull();
    learnerActions.startPractice('po-first-real-cup-guide', 'guided');
    learnerActions.updatePractice({ stepIndex: 2, stepStatus: { s1: 'done', s2: 'help' } });
    const p = getLearnerState().activePractice;
    expect(p?.stepIndex).toBe(2);
    expect(p?.stepStatus).toEqual({ s1: 'done', s2: 'help' });
    // survives a reload (re-init from the same storage)
    initLearnerStore(storage);
    expect(getLearnerState().activePractice?.activityId).toBe('po-first-real-cup-guide');
    learnerActions.endPractice();
    expect(getLearnerState().activePractice).toBeNull();
  });

  it('setLastLocation records route + time', () => {
    learnerActions.setLastLocation('/learn/esp-workflow');
    expect(getLearnerState().lastLocation?.route).toBe('/learn/esp-workflow');
  });

  it('resetAll clears progress, keeps locale and writes a backup', () => {
    learnerActions.updatePrefs({ locale: 'zh' });
    learnerActions.setProfile(profile);
    learnerActions.addJournalEntry({ drinkId: 'espresso' });
    learnerActions.resetAll();
    const s = getLearnerState();
    expect(s.profile).toBeNull();
    expect(s.journal).toEqual([]);
    expect(s.prefs.locale).toBe('zh');
    expect(JSON.parse(storage.getItem(RESET_BACKUP_KEY) ?? '{}').profile.goal).toBe('espresso');
  });
});

describe('storage failures', () => {
  it('keeps working in memory when storage is unavailable', () => {
    expect(initLearnerStore(null)).toBe('unavailable');
    learnerActions.setProfile(profile);
    expect(getLearnerState().profile?.goal).toBe('espresso');
    expect(getPersistenceStatus()).toBe('unavailable');
  });

  it('reports write-failed when setItem throws (quota) without throwing', () => {
    const failing: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new DOMException('full', 'QuotaExceededError');
      },
      removeItem: () => {},
    };
    initLearnerStore(failing);
    expect(() => learnerActions.recordEvent({
      activityId: 'a', lessonId: 'l', mode: 'desktop', guidance: 'guided', evidence: 'assessed_answer', outcome: 'completed',
    })).not.toThrow();
    expect(getLearnerState().events).toHaveLength(1);
    expect(getPersistenceStatus()).toBe('write-failed');
  });
});

describe('useLearner', () => {
  it('re-renders on change and allows derived (non-memoised) selector results', () => {
    const { result } = renderHook(() => useLearner((s) => s.journal.map((j) => j.drinkId)));
    expect(result.current).toEqual([]);
    act(() => {
      learnerActions.addJournalEntry({ drinkId: 'latte' });
    });
    expect(result.current).toEqual(['latte']);
  });
});
