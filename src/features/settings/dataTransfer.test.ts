import { describe, expect, it } from 'vitest';
import { LEARNER_STATE_VERSION } from '../../domain/contracts';
import { STORAGE_KEY, createDefaultState, getLearnerState, initLearnerStore, learnerActions } from '../../state';
import { applyImportedState, buildExport, exportFileName, parseImport } from './dataTransfer';

describe('export / import (local only)', () => {
  it('round-trips an export through import validation', () => {
    const s = createDefaultState('en');
    s.journal.push({ id: 'brew_1', evidence: 'self_report', drinkId: 'espresso-shot', createdAt: '2026-11-07T10:00:00.000Z', doseG: 18, outG: 36 });
    const env = buildExport(s, new Date('2026-11-07T12:00:00Z'));
    const r = parseImport(JSON.stringify(env));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.summary).toEqual({ hasProfile: false, journal: 1, events: 0, activePractice: false });
      expect(r.state.journal[0]).toMatchObject({ doseG: 18, evidence: 'self_report' });
      expect(r.lossy).toBe(false);
    }
    expect(exportFileName(new Date('2026-11-07T12:00:00Z'))).toBe('coffee-lab-2026-11-07.json');
  });

  it('accepts a raw saved state too, and forces journal entries to self_report', () => {
    const raw = { version: LEARNER_STATE_VERSION, journal: [{ id: 'b', evidence: 'observed_by_app', drinkId: 'x', createdAt: 'now' }] };
    const r = parseImport(JSON.stringify(raw));
    expect(r.ok && r.state.journal[0].evidence).toBe('self_report');
  });

  it('rejects non-JSON and unrelated JSON without throwing', () => {
    expect(parseImport('not json')).toEqual({ ok: false, error: 'not-json' });
    expect(parseImport('{"hello":1}')).toEqual({ ok: false, error: 'not-coffee-lab' });
    expect(parseImport('[1,2]')).toEqual({ ok: false, error: 'not-coffee-lab' });
    expect(parseImport('x'.repeat(5 * 1024 * 1024 + 1))).toEqual({ ok: false, error: 'too-large' });
  });

  it('flags lossy imports (invalid entries dropped)', () => {
    const raw = { version: LEARNER_STATE_VERSION, journal: [{ nope: true }], events: [] };
    const r = parseImport(JSON.stringify(raw));
    expect(r.ok && r.lossy).toBe(true);
  });

  it('applies an imported state to the live store and storage', () => {
    initLearnerStore();
    learnerActions.addJournalEntry({ drinkId: 'old' });
    const next = createDefaultState('zh');
    next.journal.push({ id: 'brew_new', evidence: 'self_report', drinkId: 'cortado', createdAt: '2026-11-07T10:00:00.000Z' });
    expect(applyImportedState(next, getLearnerState())).toBe(true);
    expect(getLearnerState().journal.map((j) => j.drinkId)).toEqual(['cortado']);
    expect(getLearnerState().prefs.locale).toBe('zh');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).journal).toHaveLength(1);
  });
});
