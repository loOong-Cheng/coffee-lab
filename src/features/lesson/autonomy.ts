/**
 * How independently a lesson was completed (QA-08: "mastered" must not overstate guided completion).
 * Derived from the event transcript like all progress — nothing new is stored.
 *
 * For each required check (checkForUnderstanding, else all activities) take the LEAST-supported tier it
 * was ever completed at; the lesson's autonomy is the weakest of those ("weakest link").
 *  - 'guided' / 'assisted' → "completed with guidance / with light support"
 *  - 'independent'         → "mastered independently"
 *  - 'untiered'            → completed, but none of its checks has guidance tiers (e.g. reading only)
 *  - null                  → not completed yet
 */
import { getActivity } from '../../content';
import type { ActivityKind, Guidance, Lesson, LearningEvent } from '../../domain/contracts';
import { requiredActivityIds } from '../../domain/progress';
import { isGuidanceSensitive } from '../activities/logic/guidance';

export type Autonomy = Guidance | 'untiered';

const RANK: Record<Guidance, number> = { guided: 0, assisted: 1, independent: 2 };

export function lessonAutonomy(
  lesson: Pick<Lesson, 'activityIds' | 'checkForUnderstanding'>,
  events: readonly LearningEvent[],
  kindOf: (activityId: string) => ActivityKind | undefined = (id) => getActivity(id)?.kind,
): Autonomy | null {
  const required = requiredActivityIds(lesson);
  if (required.length === 0) return null;
  let weakest: Guidance | null = null;
  for (const id of required) {
    let best: Guidance | null = null;
    for (const e of events) {
      if (e.activityId !== id || e.outcome !== 'completed') continue;
      const g: Guidance = e.guidance in RANK ? e.guidance : 'guided';
      if (best === null || RANK[g] > RANK[best]) best = g;
    }
    if (best === null) return null; // a check is still open → not completed
    const kind = kindOf(id);
    if (!kind || !isGuidanceSensitive(kind)) continue;
    if (weakest === null || RANK[best] < RANK[weakest]) weakest = best;
  }
  return weakest ?? 'untiered';
}

/** True only when every tiered check was done at the Independent tier — the one case we call "mastered". */
export function isMasteredIndependently(a: Autonomy | null): boolean {
  return a === 'independent';
}
