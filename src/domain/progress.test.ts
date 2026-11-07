import { describe, expect, it } from 'vitest';
import type { LearningEvent, TrackId } from './contracts';
import {
  completedActivityIds,
  lastEventFor,
  lessonProgress,
  lessonStatus,
  nextRecommendedLesson,
  type LessonLike,
} from './progress';

let n = 0;
function ev(activityId: string, outcome: LearningEvent['outcome'] = 'completed', lessonId = ''): LearningEvent {
  n += 1;
  return {
    id: `e${n}`,
    activityId,
    lessonId,
    mode: 'desktop',
    guidance: 'guided',
    evidence: 'assessed_answer',
    outcome,
    recordedAt: `2026-11-07T10:00:${String(n).padStart(2, '0')}.000Z`,
  };
}

function lesson(id: string, track: TrackId, activityIds: string[], cfu: string[] = [], prerequisites: string[] = []): LessonLike {
  return { id, track, activityIds, checkForUnderstanding: cfu, prerequisites };
}

const lit1 = lesson('lit-1', 'literacy', ['lit-1-a', 'lit-1-quiz'], ['lit-1-quiz']);
const esp1 = lesson('esp-1', 'espresso', ['esp-1-a', 'esp-1-b'], [], ['lit-1']);
const esp2 = lesson('esp-2', 'espresso', ['esp-2-a'], ['esp-2-a'], ['esp-1']);
const po1 = lesson('po-1', 'pourover', ['po-1-a'], ['po-1-a'], ['lit-1']);
const cul1 = lesson('cul-1', 'culture', ['cul-1-a'], ['cul-1-a']);
const all = [cul1, po1, esp2, esp1, lit1]; // deliberately scrambled across tracks

describe('lesson status', () => {
  it('not-started → in-progress → completed (via checkForUnderstanding)', () => {
    expect(lessonStatus(lit1, [])).toBe('not-started');
    expect(lessonStatus(lit1, [ev('lit-1-a')])).toBe('in-progress');
    expect(lessonStatus(lit1, [ev('lit-1-quiz', 'retry')])).toBe('in-progress');
    expect(lessonStatus(lit1, [ev('lit-1-quiz')])).toBe('completed');
  });

  it('without checks, every activity must be completed; skipped does not count', () => {
    expect(lessonStatus(esp1, [ev('esp-1-a'), ev('esp-1-b', 'skipped')])).toBe('in-progress');
    expect(lessonStatus(esp1, [ev('esp-1-a'), ev('esp-1-b')])).toBe('completed');
  });

  it('a lesson-level event alone marks in-progress', () => {
    expect(lessonStatus(esp2, [ev('unrelated', 'skipped', 'esp-2')])).toBe('in-progress');
  });

  it('a lesson with no activities never counts as completed', () => {
    expect(lessonStatus(lesson('empty', 'explore', []), [])).toBe('not-started');
  });

  it('lessonProgress counts completed activities', () => {
    const p = lessonProgress(lit1, [ev('lit-1-a'), ev('lit-1-a')]);
    expect(p).toEqual({ status: 'in-progress', completedCount: 1, totalCount: 2, fraction: 0.5 });
  });

  it('completedActivityIds + lastEventFor', () => {
    const events = [ev('x'), ev('y', 'retry'), ev('x', 'retry')];
    expect([...completedActivityIds(events)]).toEqual(['x']);
    expect(lastEventFor(events, 'x')?.outcome).toBe('retry');
    expect(lastEventFor(events, 'none')).toBeUndefined();
  });
});

describe('nextRecommendedLesson', () => {
  it('starts with literacy for every goal', () => {
    expect(nextRecommendedLesson(all, [], 'espresso')?.id).toBe('lit-1');
    expect(nextRecommendedLesson(all, [], 'pourover')?.id).toBe('lit-1');
    expect(nextRecommendedLesson(all, [], null)?.id).toBe('lit-1');
  });

  it('follows the goal track once prerequisites are met', () => {
    const done = [ev('lit-1-quiz')];
    expect(nextRecommendedLesson(all, done, 'espresso')?.id).toBe('esp-1');
    expect(nextRecommendedLesson(all, done, 'pourover')?.id).toBe('po-1');
    expect(nextRecommendedLesson(all, done, 'explore')?.id).toBe('cul-1');
  });

  it('prefers finishing an in-progress lesson', () => {
    const events = [ev('lit-1-quiz'), ev('po-1-a', 'retry')];
    expect(nextRecommendedLesson(all, events, 'espresso')?.id).toBe('po-1');
  });

  it('skips lessons whose prerequisites are unmet when a ready one exists', () => {
    const events = [ev('lit-1-quiz'), ev('esp-1-a'), ev('esp-1-b')];
    expect(nextRecommendedLesson(all, events, 'espresso')?.id).toBe('esp-2');
  });

  it('never dead-ends: falls back to any incomplete lesson, then null', () => {
    const blocked = [lesson('b', 'espresso', ['b-a'], [], ['missing-but-incomplete']), lesson('missing-but-incomplete', 'explore', ['m'])];
    expect(nextRecommendedLesson(blocked.slice(0, 1), [], 'espresso')?.id).toBe('b'); // unknown prereq ignored
    const everything = all.flatMap((l) => l.activityIds.map((a) => ev(a)));
    expect(nextRecommendedLesson(all, everything, 'espresso')).toBeNull();
    expect(nextRecommendedLesson([], [], 'espresso')).toBeNull();
  });
});
