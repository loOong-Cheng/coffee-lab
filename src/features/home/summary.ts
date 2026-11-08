/** Pure, honest progress summary for the home page (tested). */
import type { BrewLogEntry, Goal, Lesson, LearningEvent, TrackId } from '../../domain/contracts';
import { completedActivityIds, lessonStatusMap } from '../../domain/progress';
import { lessonAutonomy } from '../lesson/autonomy';

export interface ProgressSummary {
  coreTotal: number;
  /** Core lessons whose checks for understanding are all completed (assessed answers, any tier). */
  coreCompleted: number;
  /** Core lessons whose tiered checks were all completed at the Independent tier ("mastered"). */
  coreIndependent: number;
  optionalCompleted: number;
  /** Distinct activities with a completed event (any evidence kind). */
  activitiesDone: number;
  /** Journal entries — real cups the learner says they made (self-reported). */
  cupsLogged: number;
  /** Distinct simulated (XR / 3D) activities completed. */
  simulatedDone: number;
}

export function progressSummary(
  lessons: readonly Lesson[],
  events: readonly LearningEvent[],
  journal: readonly BrewLogEntry[],
  isCore: (track: TrackId) => boolean,
): ProgressSummary {
  const status = lessonStatusMap(lessons, events);
  let coreTotal = 0;
  let coreCompleted = 0;
  let coreIndependent = 0;
  let optionalCompleted = 0;
  for (const l of lessons) {
    const completed = status.get(l.id) === 'completed';
    if (isCore(l.track)) {
      coreTotal += 1;
      if (completed) {
        coreCompleted += 1;
        if (lessonAutonomy(l, events) === 'independent') coreIndependent += 1;
      }
    } else if (completed) optionalCompleted += 1;
  }
  const simulated = new Set(events.filter((e) => e.evidence === 'simulated' && e.outcome === 'completed').map((e) => e.activityId));
  return {
    coreTotal,
    coreCompleted,
    coreIndependent,
    optionalCompleted,
    activitiesDone: completedActivityIds(events).size,
    cupsLogged: journal.length,
    simulatedDone: simulated.size,
  };
}

/** Which real-world guide to offer first: follow the goal, then the gear the learner says they own. */
export function pickPracticeActivity(goal: Goal | undefined, equipment: readonly string[]): string {
  const ESPRESSO = 'esp-first-real-shot-guide';
  const POUROVER = 'po-first-real-cup-guide';
  if (goal === 'espresso') return ESPRESSO;
  if (goal === 'pourover') return POUROVER;
  const hasPour = equipment.some((e) => ['dripper', 'chemex', 'paper-filter', 'gooseneck-kettle'].includes(e));
  const hasEspresso = equipment.includes('espresso-machine');
  if (hasPour || !hasEspresso) return POUROVER;
  return ESPRESSO;
}

/** Core tracks first (literacy, then the goal's track), optional tracks after. */
export function orderTracks<T extends { id: TrackId; order: number; optional?: boolean }>(tracks: readonly T[], priority: readonly TrackId[]): T[] {
  const rank = (t: T) => {
    const i = priority.indexOf(t.id);
    return (t.optional ? 100 : 0) + (i === -1 ? 50 + t.order : i);
  };
  return [...tracks].sort((a, b) => rank(a) - rank(b));
}
