import { describe, expect, it } from 'vitest';
import { LEARNER_STATE_VERSION } from '../domain/contracts';
import { createDefaultState, loadState, migrate, migrateWithReport } from './migrate';
import { CORRUPT_BACKUP_KEY, STORAGE_KEY, createMemoryStorage, type StorageLike } from './storage';

const validEvent = {
  id: 'evt_1',
  activityId: 'esp-workflow-sequence',
  lessonId: 'esp-workflow',
  mode: 'desktop',
  guidance: 'guided',
  evidence: 'assessed_answer',
  outcome: 'completed',
  score: 0.8,
  recordedAt: '2026-11-07T10:00:00.000Z',
};

const validState = {
  version: LEARNER_STATE_VERSION,
  profile: {
    goal: 'pourover',
    experience: 'some',
    devices: ['pc', 'phone'],
    equipment: ['grinder'],
    wishlist: ['scale'],
    preferredMode: 'mobile',
    onboardedAt: '2026-11-07T09:00:00.000Z',
  },
  prefs: { locale: 'zh', sfx: false, music: true, musicMood: 'focus', volume: 0.4, reducedMotion: 'on', theme: 'dark', defaultGuidance: 'assisted', speakSteps: true },
  events: [validEvent],
  journal: [{ id: 'brew_1', evidence: 'self_report', drinkId: 'espresso', createdAt: '2026-11-07T11:00:00.000Z', doseG: 18, outG: 36, rating: 4 }],
  activePractice: {
    activityId: 'esp-first-real-shot-guide',
    stepIndex: 2,
    stepStatus: { a: 'done', b: 'help' },
    guidance: 'guided',
    startedAt: '2026-11-07T11:00:00.000Z',
    updatedAt: '2026-11-07T11:05:00.000Z',
  },
  lastLocation: { route: '/learn/esp-workflow', at: '2026-11-07T11:06:00.000Z' },
};

describe('migrate', () => {
  it('round-trips a valid current-version state unchanged and without loss', () => {
    const r = migrateWithReport(JSON.parse(JSON.stringify(validState)));
    expect(r.lossy).toBe(false);
    expect(r.state).toEqual(validState);
  });

  it.each([null, undefined, 42, 'text', [], true])('returns defaults for non-object input %p', (raw) => {
    const s = migrate(raw);
    expect(s.version).toBe(LEARNER_STATE_VERSION);
    expect(s.profile).toBeNull();
    expect(s.events).toEqual([]);
    expect(s.prefs.music).toBe(false);
  });

  it('drops invalid events / journal entries but keeps valid ones (lossy)', () => {
    const r = migrateWithReport({
      ...validState,
      events: [validEvent, { ...validEvent, id: 'evt_2', evidence: 'telepathy' }, 'junk', { ...validEvent, id: '' }],
      journal: [{ id: 'x' }, validState.journal[0]],
    });
    expect(r.lossy).toBe(true);
    expect(r.state.events.map((e) => e.id)).toEqual(['evt_1']);
    expect(r.state.journal.map((j) => j.id)).toEqual(['brew_1']);
  });

  it('repairs prefs field by field and clamps volume', () => {
    const s = migrate({ ...validState, prefs: { locale: 'fr', sfx: 'yes', volume: 7, reducedMotion: 'off' } });
    expect(s.prefs.volume).toBe(1);
    expect(s.prefs.reducedMotion).toBe('off');
    expect(['zh', 'en']).toContain(s.prefs.locale);
    expect(s.prefs.sfx).toBe(true); // default
  });

  it('forces journal evidence to self_report and clamps event scores', () => {
    const s = migrate({
      ...validState,
      events: [{ ...validEvent, score: 3 }],
      journal: [{ ...validState.journal[0], evidence: 'observed_by_app', rating: 9 }],
    });
    expect(s.events[0].score).toBe(1);
    expect(s.journal[0].evidence).toBe('self_report');
    expect(s.journal[0].rating).toBeUndefined();
  });

  it('nulls an invalid profile instead of crashing', () => {
    const r = migrateWithReport({ ...validState, profile: { goal: 'tea' } });
    expect(r.state.profile).toBeNull();
    expect(r.lossy).toBe(true);
  });

  it('salvages a pre-versioned save without marking it lossy', () => {
    const { version: _v, ...noVersion } = validState;
    void _v;
    const r = migrateWithReport(noVersion);
    expect(r.fromVersion).toBeNull();
    expect(r.state.version).toBe(LEARNER_STATE_VERSION);
    expect(r.state.events).toHaveLength(1);
    expect(r.lossy).toBe(false);
  });

  it('treats a newer version as lossy (caller backs it up) and still salvages', () => {
    const r = migrateWithReport({ ...validState, version: 99 });
    expect(r.lossy).toBe(true);
    expect(r.state.version).toBe(LEARNER_STATE_VERSION);
    expect(r.state.profile?.goal).toBe('pourover');
  });
});

describe('loadState', () => {
  it('fresh when nothing is stored', () => {
    expect(loadState(createMemoryStorage()).status).toBe('fresh');
  });

  it('loads a valid save', () => {
    const storage = createMemoryStorage({ [STORAGE_KEY]: JSON.stringify(validState) });
    const r = loadState(storage);
    expect(r.status).toBe('loaded');
    expect(r.state.prefs.locale).toBe('zh');
  });

  it('recovers from corrupted JSON and backs up the raw value', () => {
    const storage = createMemoryStorage({ [STORAGE_KEY]: '{"version":1, "events": [oops' });
    const r = loadState(storage);
    expect(r.status).toBe('recovered');
    expect(r.state).toEqual(createDefaultState(r.state.prefs.locale));
    expect(storage.getItem(CORRUPT_BACKUP_KEY)).toBe('{"version":1, "events": [oops');
  });

  it('backs up partially invalid saves too', () => {
    const raw = JSON.stringify({ ...validState, events: ['junk'] });
    const storage = createMemoryStorage({ [STORAGE_KEY]: raw });
    const r = loadState(storage);
    expect(r.status).toBe('recovered');
    expect(storage.getItem(CORRUPT_BACKUP_KEY)).toBe(raw);
    expect(r.state.profile?.goal).toBe('pourover');
  });

  it('works when storage is null or getItem throws', () => {
    expect(loadState(null).status).toBe('unavailable');
    const throwing: StorageLike = {
      getItem: () => {
        throw new DOMException('denied', 'SecurityError');
      },
      setItem: () => {
        throw new DOMException('denied', 'SecurityError');
      },
      removeItem: () => {},
    };
    const r = loadState(throwing);
    expect(r.status).toBe('unavailable');
    expect(r.state.profile).toBeNull();
  });

  it('does not throw when the corrupt backup cannot be written', () => {
    const storage: StorageLike = {
      getItem: () => 'not json',
      setItem: () => {
        throw new DOMException('full', 'QuotaExceededError');
      },
      removeItem: () => {},
    };
    expect(loadState(storage).status).toBe('recovered');
  });
});
