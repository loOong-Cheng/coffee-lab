import type { ActivityKind } from '../../domain/contracts';
import type { IconName } from '../../ui/icons';

export const KIND_ICON: Record<ActivityKind, IconName> = {
  explain: 'book',
  identify: 'target',
  sequence: 'menu',
  quiz: 'help',
  'parameter-lab': 'sliders',
  diagnose: 'flask',
  'guided-practice': 'phone',
  'spatial-practice': 'headset',
  reflect: 'journal',
};

/** Activities that live outside the lesson player and never block it. */
export const ELSEWHERE_KINDS: ReadonlySet<ActivityKind> = new Set<ActivityKind>(['guided-practice', 'spatial-practice']);

export { isTypingTarget } from '../activities/keys';
