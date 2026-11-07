/**
 * Pure kitchen-mode session logic. The persisted shape is the contract's PracticeSession
 * (state.activePractice); this module only computes the next values. The UI writes them with
 * learnerActions.updatePractice so an interrupted session resumes after reload.
 *
 * stepIndex === steps.length means "all steps confirmed — logging the brew" (the finish phase),
 * so a reload during the brew-log form still lands on the form.
 */
import type { Guidance, PracticeSession } from '../../domain/contracts';

export type StepStatus = PracticeSession['stepStatus'][string];

export type PracticeAction =
  | { type: 'done' }
  | { type: 'skip' }
  | { type: 'help' }
  | { type: 'back' }
  | { type: 'goto'; index: number }
  | { type: 'guidance'; guidance: Guidance };

export type SessionPatch = Pick<PracticeSession, 'stepIndex' | 'stepStatus' | 'guidance'>;

const clampIndex = (i: number, total: number) => (Number.isFinite(i) ? Math.min(Math.max(0, Math.floor(i)), total) : 0);

/**
 * Apply one learner action. `stepIds` is the plan's ordered step ids.
 * - done: marks the current step done and advances (to the finish phase after the last step)
 * - skip: marks it skipped and advances
 * - help: records that help was opened (unless already done/skipped); does not advance
 * - back: one step back (status kept, so a re-done step simply stays done)
 * - goto: jump (used by the independent checklist), clamped to [0, steps.length]
 */
export function reducePractice(s: SessionPatch, action: PracticeAction, stepIds: readonly string[]): SessionPatch {
  const total = stepIds.length;
  const idx = clampIndex(s.stepIndex, total);
  const currentId = idx < total ? stepIds[idx] : undefined;
  switch (action.type) {
    case 'done':
    case 'skip': {
      if (currentId === undefined) return { ...s, stepIndex: total };
      const stepStatus = { ...s.stepStatus, [currentId]: action.type === 'done' ? 'done' : 'skipped' } as SessionPatch['stepStatus'];
      return { ...s, stepStatus, stepIndex: Math.min(idx + 1, total) };
    }
    case 'help': {
      if (currentId === undefined) return s;
      const cur = s.stepStatus[currentId];
      if (cur === 'done' || cur === 'skipped') return s;
      return { ...s, stepStatus: { ...s.stepStatus, [currentId]: 'help' } };
    }
    case 'back':
      return { ...s, stepIndex: Math.max(0, idx - 1) };
    case 'goto':
      return { ...s, stepIndex: clampIndex(action.index, total) };
    case 'guidance':
      return { ...s, guidance: action.guidance };
    default:
      return s;
  }
}

export function isFinishPhase(s: Pick<PracticeSession, 'stepIndex'>, total: number): boolean {
  return total > 0 && s.stepIndex >= total;
}

export interface StepTally {
  done: number;
  skipped: number;
  help: number;
  total: number;
}

/** Counts by status, ignoring ids that are no longer in the plan (content may change between visits). */
export function tallySteps(stepStatus: PracticeSession['stepStatus'], stepIds: readonly string[]): StepTally {
  const t: StepTally = { done: 0, skipped: 0, help: 0, total: stepIds.length };
  for (const id of stepIds) {
    const st = stepStatus[id];
    if (st === 'done') t.done++;
    else if (st === 'skipped') t.skipped++;
    else if (st === 'help') t.help++;
  }
  return t;
}

export type ResumeDecision =
  | { kind: 'fresh' }
  | { kind: 'resume'; session: PracticeSession }
  | { kind: 'other-active'; session: PracticeSession };

/** What to offer when opening a plan: start fresh, resume this one, or deal with another in-progress guide. */
export function resumeDecision(active: PracticeSession | null | undefined, planId: string, stepCount: number): ResumeDecision {
  if (!active) return { kind: 'fresh' };
  if (active.activityId !== planId) return { kind: 'other-active', session: active };
  // A session pointing past the end of a (since shortened) plan resumes at the finish phase.
  const session = active.stepIndex > stepCount ? { ...active, stepIndex: stepCount } : active;
  return { kind: 'resume', session };
}

/** Event note summarising the self-reported run (kept short; for the learner's transcript). */
export function sessionSummaryNote(t: StepTally): string {
  return `self-reported steps: ${t.done} done, ${t.skipped} skipped, ${t.help} with help, of ${t.total}`;
}
