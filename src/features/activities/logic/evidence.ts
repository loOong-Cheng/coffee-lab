/**
 * Which evidence kind an activity's in-lesson completion produces (CONTRACTS.md §9).
 * - answers the app can check → assessed_answer
 * - concept cards paged through → observed_by_app (the app genuinely saw the cards being viewed;
 *   it says nothing about understanding — UI calls this "viewed")
 * - writing a reflection → self_report (the learner's own words)
 * - real-world guide → self_report (recorded by the kitchen-mode page, not the lesson player)
 * - XR / 3D mission → simulated (recorded by the XR route)
 */
import type { ActivityKind, EvidenceKind } from '../../../domain/contracts';

export const EVIDENCE_BY_KIND: Record<ActivityKind, EvidenceKind> = {
  quiz: 'assessed_answer',
  sequence: 'assessed_answer',
  identify: 'assessed_answer',
  diagnose: 'assessed_answer',
  'parameter-lab': 'assessed_answer',
  explain: 'observed_by_app',
  reflect: 'self_report',
  'guided-practice': 'self_report',
  'spatial-practice': 'simulated',
};

/** Kinds the lesson player itself records. Practice/XR activities are recorded where they happen. */
export const RECORDED_BY_LESSON_PLAYER: ReadonlySet<ActivityKind> = new Set<ActivityKind>([
  'quiz',
  'sequence',
  'identify',
  'diagnose',
  'parameter-lab',
  'explain',
  'reflect',
]);

export function evidenceForKind(kind: ActivityKind): EvidenceKind {
  return EVIDENCE_BY_KIND[kind];
}
