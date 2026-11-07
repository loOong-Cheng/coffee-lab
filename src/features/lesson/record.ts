/** Turns an activity result into the LearningEvent the store records (pure; tested). */
import type { Activity, CapabilityProfile, Guidance, LearnerProfile, LearningEvent, Mode } from '../../domain/contracts';
import { RECORDED_BY_LESSON_PLAYER, evidenceForKind } from '../activities/logic/evidence';
import type { ActivityResult } from '../activities/types';

export type EventDraft = Omit<LearningEvent, 'id' | 'recordedAt'>;

/**
 * The 2D lesson player runs in 'desktop' or 'mobile' mode — whichever screen the learner is actually
 * using. A headset's 2D browser counts as 'desktop' (flat page). Before detection finishes we fall back
 * to the learner's stated preference.
 */
export function lessonMode(caps: CapabilityProfile | null, profile: Pick<LearnerProfile, 'preferredMode'> | null): Mode {
  if (caps) return caps.screen === 'mobile' ? 'mobile' : 'desktop';
  return profile?.preferredMode === 'mobile' || profile?.preferredMode === 'real-world-guide' ? 'mobile' : 'desktop';
}

/**
 * Returns null when nothing should be recorded:
 *  - skipped activities (deferring is not practice),
 *  - kinds that are recorded where they actually happen (real-world guide, XR mission).
 */
export function buildLessonEvent(
  activity: Pick<Activity, 'id' | 'lessonId' | 'kind'>,
  result: ActivityResult,
  ctx: { mode: Mode; guidance: Guidance },
): EventDraft | null {
  if (result.outcome === 'skipped') return null;
  if (!RECORDED_BY_LESSON_PLAYER.has(activity.kind)) return null;
  const evidence = evidenceForKind(activity.kind);
  const draft: EventDraft = {
    activityId: activity.id,
    lessonId: activity.lessonId,
    mode: ctx.mode,
    guidance: ctx.guidance,
    evidence,
    outcome: result.outcome,
  };
  // Scores only make sense for things the app actually assessed.
  if (evidence === 'assessed_answer' && typeof result.score === 'number' && Number.isFinite(result.score)) {
    draft.score = Math.min(1, Math.max(0, result.score));
  }
  const notes = result.notes?.trim();
  if (notes) draft.notes = notes;
  return draft;
}
