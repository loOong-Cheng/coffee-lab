/**
 * Guidance tiers change BEHAVIOUR, not just a badge (brief §3/§6). One table, consumed by the
 * sequence, quiz, identify and parameter-lab activities, so the differences are explicit and tested.
 */
import type { ActivityKind, Guidance } from '../../../domain/contracts';

export interface GuidancePolicy {
  /** Hint text is shown up front, without asking. */
  hintVisible: boolean;
  /** The learner may reveal a hint (button / H key). */
  hintOnRequest: boolean;
  /**
   * Each step / answer is checked the moment it is made (guided). Otherwise the learner builds a full
   * answer and checks it on submit.
   */
  instantFeedback: boolean;
  /** Quiz only: feedback is held until every question is answered (independent "exam" style). */
  deferredFeedback: boolean;
  /** Identify: number of wrong picks before the target is highlighted (Infinity = never). */
  highlightAfterMisses: number;
  /** Identify: number of wrong picks before the answer is revealed and counted as a miss. */
  revealAfterMisses: number;
  /** Parameter lab: a failed check says which way to move (more/less yield, dose). */
  directionalHints: boolean;
}

const POLICIES: Record<Guidance, GuidancePolicy> = {
  guided: {
    hintVisible: true,
    hintOnRequest: true,
    instantFeedback: true,
    deferredFeedback: false,
    highlightAfterMisses: 1,
    revealAfterMisses: 3,
    directionalHints: true,
  },
  assisted: {
    hintVisible: false,
    hintOnRequest: true,
    instantFeedback: false,
    deferredFeedback: false,
    highlightAfterMisses: 2,
    revealAfterMisses: 3,
    directionalHints: true,
  },
  independent: {
    hintVisible: false,
    hintOnRequest: false,
    instantFeedback: false,
    deferredFeedback: true,
    highlightAfterMisses: Number.POSITIVE_INFINITY,
    revealAfterMisses: 2,
    directionalHints: false,
  },
};

export function guidancePolicy(g: Guidance): GuidancePolicy {
  return POLICIES[g] ?? POLICIES.guided;
}

/** Activity kinds whose interaction actually changes with the guidance tier. */
export const GUIDANCE_SENSITIVE_KINDS: readonly ActivityKind[] = ['sequence', 'quiz', 'identify', 'parameter-lab'];

export function isGuidanceSensitive(kind: ActivityKind): boolean {
  return GUIDANCE_SENSITIVE_KINDS.includes(kind);
}
