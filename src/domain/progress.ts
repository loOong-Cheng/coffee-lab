/**
 * Pure, derived progress selectors. Lesson progress is NEVER stored — it is computed from the
 * append-only LearningEvent transcript (contracts: LearnerState.events), so content changes
 * cannot corrupt saved progress.
 *
 * These take lessons as arguments (no import of src/content) so they are content-agnostic.
 */
import type { Goal, Lesson, LearningEvent, TrackId } from './contracts';

export type LessonStatus = 'not-started' | 'in-progress' | 'completed';

/** Minimal lesson shape the selectors need (lets tests and other callers pass partial lessons). */
export type LessonLike = Pick<Lesson, 'id' | 'track' | 'activityIds' | 'checkForUnderstanding' | 'prerequisites'>;

export interface LessonProgress {
  status: LessonStatus;
  /** Activities (from lesson.activityIds) with at least one `completed` event. */
  completedCount: number;
  totalCount: number;
  /** completedCount / totalCount (0 when the lesson has no activities). */
  fraction: number;
}

/** Ids of activities that have at least one event with outcome `completed`. */
export function completedActivityIds(events: readonly LearningEvent[]): Set<string> {
  const done = new Set<string>();
  for (const e of events) if (e.outcome === 'completed') done.add(e.activityId);
  return done;
}

/** Ids of activities that have ANY event (completed, retry or skipped). */
export function touchedActivityIds(events: readonly LearningEvent[]): Set<string> {
  const touched = new Set<string>();
  for (const e of events) touched.add(e.activityId);
  return touched;
}

/** Activity ids that decide completion: the checks for understanding, or every activity if none are marked. */
export function requiredActivityIds(lesson: Pick<Lesson, 'activityIds' | 'checkForUnderstanding'>): string[] {
  return lesson.checkForUnderstanding.length > 0 ? [...lesson.checkForUnderstanding] : [...lesson.activityIds];
}

function statusFrom(lesson: LessonLike, done: Set<string>, touched: Set<string>, touchedLessons: Set<string>): LessonStatus {
  const required = requiredActivityIds(lesson);
  if (required.length > 0 && required.every((id) => done.has(id))) return 'completed';
  if (touchedLessons.has(lesson.id) || lesson.activityIds.some((id) => touched.has(id))) return 'in-progress';
  return 'not-started';
}

function lessonIdsWithEvents(events: readonly LearningEvent[]): Set<string> {
  const s = new Set<string>();
  for (const e of events) s.add(e.lessonId);
  return s;
}

/**
 * - completed: every required activity (checkForUnderstanding, else all activityIds) has a `completed` event
 * - in-progress: any event exists for the lesson or one of its activities
 * - not-started: otherwise (a lesson with no activities is never "completed")
 */
export function lessonStatus(lesson: LessonLike, events: readonly LearningEvent[]): LessonStatus {
  return statusFrom(lesson, completedActivityIds(events), touchedActivityIds(events), lessonIdsWithEvents(events));
}

export function lessonProgress(lesson: LessonLike, events: readonly LearningEvent[]): LessonProgress {
  const done = completedActivityIds(events);
  const status = statusFrom(lesson, done, touchedActivityIds(events), lessonIdsWithEvents(events));
  const totalCount = lesson.activityIds.length;
  const completedCount = lesson.activityIds.filter((id) => done.has(id)).length;
  return { status, completedCount, totalCount, fraction: totalCount === 0 ? 0 : completedCount / totalCount };
}

/** Status for many lessons at once (one pass over events). */
export function lessonStatusMap(lessons: readonly LessonLike[], events: readonly LearningEvent[]): Map<string, LessonStatus> {
  const done = completedActivityIds(events);
  const touched = touchedActivityIds(events);
  const touchedLessons = lessonIdsWithEvents(events);
  const out = new Map<string, LessonStatus>();
  for (const l of lessons) out.set(l.id, statusFrom(l, done, touched, touchedLessons));
  return out;
}

/** Track priority per learner goal. Literacy always first: it is the beginner on-ramp. */
export const TRACK_PRIORITY: Record<Goal, TrackId[]> = {
  espresso: ['literacy', 'espresso', 'pourover', 'explore', 'culture'],
  pourover: ['literacy', 'pourover', 'espresso', 'explore', 'culture'],
  explore: ['literacy', 'explore', 'culture', 'espresso', 'pourover'],
};

/**
 * Next lesson to recommend, or null when everything is completed / no lessons.
 * Order: tracks by goal priority (default: espresso), then the given lesson order within a track.
 *  1. the first in-progress lesson (finish what you started)
 *  2. the first not-started lesson whose prerequisites are all completed
 *  3. the first not-completed lesson at all (never dead-ends on unmet prerequisites)
 */
export function nextRecommendedLesson<L extends LessonLike>(
  lessons: readonly L[],
  events: readonly LearningEvent[],
  goal?: Goal | null,
): L | null {
  if (lessons.length === 0) return null;
  const priority = TRACK_PRIORITY[goal ?? 'espresso'];
  const rank = (t: TrackId) => {
    const i = priority.indexOf(t);
    return i === -1 ? priority.length : i;
  };
  const ordered = lessons
    .map((lesson, index) => ({ lesson, index }))
    .sort((a, b) => rank(a.lesson.track) - rank(b.lesson.track) || a.index - b.index)
    .map((x) => x.lesson);

  const status = lessonStatusMap(ordered, events);
  const inProgress = ordered.find((l) => status.get(l.id) === 'in-progress');
  if (inProgress) return inProgress;

  const isDone = (id: string) => status.get(id) === 'completed' || !status.has(id);
  const ready = ordered.find((l) => status.get(l.id) === 'not-started' && l.prerequisites.every(isDone));
  if (ready) return ready;

  return ordered.find((l) => status.get(l.id) !== 'completed') ?? null;
}

/** Most recent event for an activity (events are append-only, so the last match wins). */
export function lastEventFor(events: readonly LearningEvent[], activityId: string): LearningEvent | undefined {
  for (let i = events.length - 1; i >= 0; i--) if (events[i].activityId === activityId) return events[i];
  return undefined;
}
