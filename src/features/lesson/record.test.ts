import { beforeEach, describe, expect, it } from 'vitest';
import { lessonStatus } from '../../domain/progress';
import { createMemoryStorage, getLearnerState, initLearnerStore, learnerActions } from '../../state';
import { buildLessonEvent, lessonMode } from './record';

const lesson = {
  id: 'lit-x',
  track: 'literacy' as const,
  activityIds: ['lit-x-cards', 'lit-x-order', 'lit-x-quiz', 'lit-x-reflect'],
  checkForUnderstanding: ['lit-x-order', 'lit-x-quiz'],
  prerequisites: [],
};
const ctx = { mode: 'desktop' as const, guidance: 'assisted' as const };

beforeEach(() => {
  initLearnerStore(createMemoryStorage());
});

describe('buildLessonEvent', () => {
  it('records checks as assessed answers with a clamped score', () => {
    const e = buildLessonEvent({ id: 'lit-x-quiz', lessonId: 'lit-x', kind: 'quiz' }, { outcome: 'completed', score: 1.4 }, ctx);
    expect(e).toMatchObject({ evidence: 'assessed_answer', outcome: 'completed', score: 1, mode: 'desktop', guidance: 'assisted' });
  });

  it('records viewed cards as observed_by_app and reflection as self-report, neither with a score', () => {
    const cards = buildLessonEvent({ id: 'lit-x-cards', lessonId: 'lit-x', kind: 'explain' }, { outcome: 'completed', score: 1 }, ctx);
    expect(cards).toMatchObject({ evidence: 'observed_by_app', outcome: 'completed' });
    expect(cards?.score).toBeUndefined();
    const e = buildLessonEvent(
      { id: 'lit-x-reflect', lessonId: 'lit-x', kind: 'reflect' },
      { outcome: 'completed', score: 0.5, notes: '  smells like toast  ' },
      ctx,
    );
    expect(e).toMatchObject({ evidence: 'self_report', notes: 'smells like toast' });
    expect(e?.score).toBeUndefined();
  });

  it('does not record skips, real-world practice or XR missions from the lesson player', () => {
    expect(buildLessonEvent({ id: 'a', lessonId: 'l', kind: 'quiz' }, { outcome: 'skipped' }, ctx)).toBeNull();
    expect(buildLessonEvent({ id: 'a', lessonId: 'l', kind: 'guided-practice' }, { outcome: 'completed' }, ctx)).toBeNull();
    expect(buildLessonEvent({ id: 'a', lessonId: 'l', kind: 'spatial-practice' }, { outcome: 'completed' }, ctx)).toBeNull();
  });

  it('lessonMode follows the actual screen, falling back to the profile', () => {
    const caps = { screen: 'mobile' } as Parameters<typeof lessonMode>[0];
    expect(lessonMode(caps, { preferredMode: 'desktop' })).toBe('mobile');
    expect(lessonMode(null, { preferredMode: 'real-world-guide' })).toBe('mobile');
    expect(lessonMode(null, { preferredMode: 'xr' })).toBe('desktop');
    expect(lessonMode(null, null)).toBe('desktop');
  });
});

describe('lesson completion → derived progress', () => {
  it('a lesson becomes completed only when every check is completed (a "retry" keeps it open)', () => {
    const rec = (activityId: string, kind: 'explain' | 'sequence' | 'quiz', outcome: 'completed' | 'retry', score?: number) => {
      const draft = buildLessonEvent({ id: activityId, lessonId: 'lit-x', kind }, { outcome, score }, ctx);
      if (draft) learnerActions.recordEvent(draft);
    };
    expect(lessonStatus(lesson, getLearnerState().events)).toBe('not-started');
    rec('lit-x-cards', 'explain', 'completed');
    expect(lessonStatus(lesson, getLearnerState().events)).toBe('in-progress');
    rec('lit-x-order', 'sequence', 'completed', 0.6);
    rec('lit-x-quiz', 'quiz', 'retry', 0.25);
    expect(lessonStatus(lesson, getLearnerState().events)).toBe('in-progress');
    rec('lit-x-quiz', 'quiz', 'completed', 0.5);
    expect(lessonStatus(lesson, getLearnerState().events)).toBe('completed');
    expect(getLearnerState().events.every((e) => e.lessonId === 'lit-x')).toBe(true);
  });
});
