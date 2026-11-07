import { describe, expect, it } from 'vitest';
import type { PracticeSession } from '../../domain/contracts';
import { isFinishPhase, reducePractice, resumeDecision, sessionSummaryNote, tallySteps, type SessionPatch } from './session';

const IDS = ['a', 'b', 'c'];
const start: SessionPatch = { stepIndex: 0, stepStatus: {}, guidance: 'guided' };

describe('reducePractice', () => {
  it('done marks the current step and advances to the finish phase after the last step', () => {
    let s = reducePractice(start, { type: 'done' }, IDS);
    expect(s).toMatchObject({ stepIndex: 1, stepStatus: { a: 'done' } });
    s = reducePractice(s, { type: 'done' }, IDS);
    s = reducePractice(s, { type: 'done' }, IDS);
    expect(s.stepIndex).toBe(3);
    expect(isFinishPhase(s, IDS.length)).toBe(true);
    // done in the finish phase is a no-op that stays at the end
    expect(reducePractice(s, { type: 'done' }, IDS).stepIndex).toBe(3);
  });

  it('skip marks skipped; help is recorded without advancing and never downgrades done', () => {
    let s = reducePractice(start, { type: 'help' }, IDS);
    expect(s).toMatchObject({ stepIndex: 0, stepStatus: { a: 'help' } });
    s = reducePractice(s, { type: 'done' }, IDS);
    expect(s.stepStatus.a).toBe('done');
    s = reducePractice(s, { type: 'skip' }, IDS);
    expect(s).toMatchObject({ stepIndex: 2, stepStatus: { a: 'done', b: 'skipped' } });
    s = reducePractice({ ...s, stepIndex: 0 }, { type: 'help' }, IDS);
    expect(s.stepStatus.a).toBe('done');
  });

  it('back never goes below 0 and keeps statuses; goto is clamped', () => {
    const s = reducePractice({ ...start, stepIndex: 2, stepStatus: { a: 'done', b: 'done' } }, { type: 'back' }, IDS);
    expect(s).toMatchObject({ stepIndex: 1, stepStatus: { a: 'done', b: 'done' } });
    expect(reducePractice(start, { type: 'back' }, IDS).stepIndex).toBe(0);
    expect(reducePractice(start, { type: 'goto', index: 99 }, IDS).stepIndex).toBe(3);
    expect(reducePractice(start, { type: 'goto', index: -4 }, IDS).stepIndex).toBe(0);
    expect(reducePractice(start, { type: 'goto', index: Number.NaN }, IDS).stepIndex).toBe(0);
  });

  it('changes guidance without touching progress', () => {
    const s = reducePractice({ ...start, stepIndex: 1 }, { type: 'guidance', guidance: 'independent' }, IDS);
    expect(s).toMatchObject({ stepIndex: 1, guidance: 'independent' });
  });

  it('does not mutate its input', () => {
    const before = { ...start, stepStatus: {} };
    reducePractice(before, { type: 'done' }, IDS);
    expect(before).toEqual(start);
  });
});

describe('tallySteps / summary', () => {
  it('counts only current plan step ids', () => {
    const t = tallySteps({ a: 'done', b: 'help', c: 'skipped', stale: 'done' }, IDS);
    expect(t).toEqual({ done: 1, skipped: 1, help: 1, total: 3 });
    expect(sessionSummaryNote(t)).toContain('self-reported');
  });
});

describe('resumeDecision', () => {
  const session: PracticeSession = {
    activityId: 'drink:cortado',
    stepIndex: 2,
    stepStatus: { s1: 'done', s2: 'done' },
    guidance: 'assisted',
    startedAt: '2026-11-07T10:00:00.000Z',
    updatedAt: '2026-11-07T10:05:00.000Z',
  };
  it('fresh when nothing is active', () => {
    expect(resumeDecision(null, 'drink:cortado', 4)).toEqual({ kind: 'fresh' });
  });
  it('resume when the same plan is active', () => {
    expect(resumeDecision(session, 'drink:cortado', 4)).toEqual({ kind: 'resume', session });
  });
  it('clamps a stale index to the finish phase when the plan got shorter', () => {
    const r = resumeDecision({ ...session, stepIndex: 9 }, 'drink:cortado', 4);
    expect(r.kind === 'resume' && r.session.stepIndex).toBe(4);
  });
  it('other-active when a different guide is in progress', () => {
    expect(resumeDecision(session, 'esp-first-real-shot-guide', 8)).toEqual({ kind: 'other-active', session });
  });
});
