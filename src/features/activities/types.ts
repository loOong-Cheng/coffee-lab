import type { Activity, Guidance, LearningEvent } from '../../domain/contracts';

/** What an activity reports back to the lesson player. The player turns it into a LearningEvent. */
export interface ActivityResult {
  /**
   * completed — the learner reached the goal (for checks: the right answer, possibly after retries);
   * retry — they moved on without getting there (honest: the check stays open);
   * skipped — they chose not to do it now (not recorded as practice).
   */
  outcome: LearningEvent['outcome'];
  /** 0..1, first-attempt accuracy for assessed activities. Omitted for reading / reflection. */
  score?: number;
  /** Free text the learner wrote (reflection). */
  notes?: string;
}

export interface ActivityProps<A extends Activity = Activity> {
  activity: A;
  guidance: Guidance;
  onComplete(result: ActivityResult): void;
  /** Increments every time the learner presses the H shortcut; activities that allow hints reveal one. */
  hintSignal?: number;
  /**
   * The lesson player offers ←/→ to the activity first (e.g. explain cards page through themselves);
   * return true when the key was consumed. Activities that don't page leave it unset.
   */
  keyNavRef?: { current: ((dir: 1 | -1) => boolean) | null };
  /** Offered after repeated misses ("Want more support?") — moves to the next more supportive tier. Never automatic. */
  onStepDown?: () => void;
}
