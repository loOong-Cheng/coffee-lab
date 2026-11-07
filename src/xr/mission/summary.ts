/**
 * Mission summary + learner-event mapping. Honesty is structural here:
 * evidence is always 'simulated', the extraction is an illustrative model,
 * and the summary lists what still needs real hands-on practice.
 */
import type { Guidance, LearningEvent, LocalizedText, Mode } from '../../domain/contracts';
import type { FeedbackCode, InputSource, MissionState } from './types';
import { MISSION_ID } from './types';
import { STEP_ORDER, NOT_TRAINED, PRACTICED, STOP_FEEDBACK, fmt } from './content';
import { RECIPE, round1, scoreStop, type StopAccuracy } from './extraction';
import { mostSupportive } from './tiers';

export const XR_ACTIVITY_ID = 'esp-workflow-xr';
export const XR_LESSON_ID = 'esp-workflow';

export interface MissionSummary {
  missionId: typeof MISSION_ID;
  completed: boolean;
  evidence: 'simulated';
  /** The extraction numbers come from an illustrative model. */
  illustrativeModel: true;
  /** What this result does NOT claim. All false by construction. */
  claims: { realSkill: false; taste: false; gripForce: false; haptics: false };
  durationSec: number;
  hintsUsed: number;
  mistakes: number;
  mistakeCodes: FeedbackCode[];
  nearMisses: number;
  snaps: number;
  /** steps ÷ (steps + counted mistakes), 0..1. */
  sequenceAccuracy: number;
  stop: StopAccuracy | null;
  stopFeedback: LocalizedText | null;
  autoStopped: boolean;
  shotTimeSec: number | null;
  tampTiltDeg: number | null;
  guidanceUsed: Guidance[];
  /** Most supportive tier used during the attempt (recorded, so a guided assist is never hidden). */
  guidanceForRecord: Guidance;
  guidanceFinal: Guidance;
  inputs: Record<InputSource, number>;
  primaryInput: InputSource;
  /** True if most actions were spatial (XR controllers or mouse/touch in 3D) rather than the action list. */
  spatialPractice: boolean;
  practiced: LocalizedText[];
  notTrained: readonly LocalizedText[];
  resets: number;
  /** 0..1 simulated task score: 60 % sequence accuracy + 40 % stop accuracy. Hints never reduce it. */
  score: number;
}

function primaryInputOf(inputs: Record<InputSource, number>): InputSource {
  const order: InputSource[] = ['xr', 'pointer', 'panel', 'test'];
  let best: InputSource = 'test';
  let bestN = -1;
  for (const k of order) {
    if (inputs[k] > bestN) {
      best = k;
      bestN = inputs[k];
    }
  }
  return best;
}

export function buildSummary(s: MissionState): MissionSummary {
  const steps = STEP_ORDER.length;
  const mistakes = s.metrics.mistakes.length;
  const sequenceAccuracy = Math.round((steps / (steps + mistakes)) * 100) / 100;
  const stop = s.shot.stoppedAtG !== null ? scoreStop(s.shot.yieldG) : null;
  const inputs = { ...s.metrics.actionsBySource };
  const primaryInput = primaryInputOf(inputs);
  const spatialPractice = inputs.xr + inputs.pointer > inputs.panel;
  const stopKey = stop ? (stop.direction === 'on' ? 'on-target' : stop.direction) : null;
  const score = Math.round((0.6 * sequenceAccuracy + 0.4 * (stop?.score ?? 0)) * 100) / 100;
  return {
    missionId: MISSION_ID,
    completed: s.status === 'complete',
    evidence: 'simulated',
    illustrativeModel: true,
    claims: { realSkill: false, taste: false, gripForce: false, haptics: false },
    durationSec: Math.round(s.completedAtSec ?? s.metrics.elapsedSec),
    hintsUsed: s.metrics.hintsUsed,
    mistakes,
    mistakeCodes: s.metrics.mistakes.map((m) => m.code),
    nearMisses: s.metrics.nearMisses,
    snaps: s.metrics.snaps,
    sequenceAccuracy,
    stop,
    stopFeedback:
      stop && stopKey
        ? fmt(STOP_FEEDBACK[stopKey], {
            g: stop.finalYieldG.toFixed(1),
            target: stop.targetG,
            err: stop.errorG.toFixed(1),
            ratio: stop.ratio.toFixed(1),
          })
        : null,
    autoStopped: s.shot.autoStopped,
    shotTimeSec: s.shot.stoppedAtSec !== null ? round1(s.shot.stoppedAtSec) : null,
    tampTiltDeg: s.flags.tampTiltDeg,
    guidanceUsed: [...s.guidanceUsed],
    guidanceForRecord: mostSupportive(s.guidanceUsed),
    guidanceFinal: s.guidance,
    inputs,
    primaryInput,
    spatialPractice,
    practiced: [
      PRACTICED.locate,
      PRACTICED.order,
      spatialPractice ? PRACTICED.placement : PRACTICED.placementPanel,
      PRACTICED.timing,
    ],
    notTrained: NOT_TRAINED,
    resets: s.metrics.resets,
    score,
  };
}

/** Mode for the learning event: XR only when the work was actually done in a headset session. */
export function eventModeFor(summary: MissionSummary, env: { immersive: boolean; touch: boolean }): Mode {
  if (env.immersive || summary.primaryInput === 'xr') return 'xr';
  return env.touch ? 'mobile' : 'desktop';
}

export function buildCompletionEvent(
  summary: MissionSummary,
  env: { immersive: boolean; touch: boolean },
): Omit<LearningEvent, 'id' | 'recordedAt'> {
  const stopPart = summary.stop ? `${summary.stop.finalYieldG}/${RECIPE.targetYieldG}g` : 'n/a';
  return {
    activityId: XR_ACTIVITY_ID,
    lessonId: XR_LESSON_ID,
    mode: eventModeFor(summary, env),
    guidance: summary.guidanceForRecord,
    evidence: 'simulated',
    outcome: summary.completed ? 'completed' : 'retry',
    score: summary.score,
    notes:
      `simulated espresso-first-shot; seq=${summary.sequenceAccuracy} stop=${stopPart} ` +
      `hints=${summary.hintsUsed} tiers=${summary.guidanceUsed.join('>')} input=${summary.primaryInput}`,
  };
}
