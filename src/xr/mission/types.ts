/**
 * Espresso XR mission — pure types (no Babylon, no React).
 *
 * The same reducer is driven by: WebXR controllers, mouse/touch on the
 * non-immersive 3D fallback, the keyboard-operable 2D action list, and the
 * headless unit tests. Everything here is a *simulation* (evidence: 'simulated').
 */
import type { Guidance, LocalizedText } from '../../domain/contracts';
import type { SfxName } from '../../audio';

export const MISSION_ID = 'espresso-first-shot' as const;

/** Objects the learner can pick up. */
export type ItemId = 'portafilter' | 'cup' | 'tamper';

/**
 * Places an item can rest or be used. `basket` is a *use* target for the
 * tamper (the basket travels with the portafilter), not a resting spot.
 */
export type ZoneId =
  | 'tamp-mat'
  | 'grinder-fork'
  | 'group-head'
  | 'knock-box'
  | 'cup-home'
  | 'scale'
  | 'serve'
  | 'tamper-stand'
  | 'basket';

export type ButtonId = 'grinder' | 'brew' | 'tare';

/** Fixed station parts the learner can point at / inspect (orient step). */
export type StationPartId =
  | 'espresso-machine'
  | 'group-head'
  | 'brew-button'
  | 'drip-tray'
  | 'grinder'
  | 'scale'
  | 'knock-box'
  | 'tamp-mat'
  | 'serve';

/** Anything that can be inspected (tool info panels). */
export type InspectableId = StationPartId | ItemId;

/** Which hand holds an item. Mouse/touch/keyboard use the single `pointer` hand. */
export type HandId = 'left' | 'right' | 'pointer';

/** Where an action came from; used to report honestly what was practiced. */
export type InputSource = 'xr' | 'pointer' | 'panel' | 'test';

export type StepId =
  | 'locate'
  | 'grab-portafilter'
  | 'dose'
  | 'tamp'
  | 'attach'
  | 'place-cup'
  | 'tare'
  | 'brew'
  | 'stop'
  | 'serve'
  | 'remove'
  | 'knock-out'
  | 'flush';

export type BasketState = 'empty' | 'dosed' | 'tamped' | 'spent';
export type ShotStatus = 'idle' | 'running' | 'settling' | 'done';
export type MissionStatus = 'playing' | 'paused' | 'complete';

export interface ItemState {
  /** Resting zone (when held: the zone it was taken from). */
  zone: ZoneId;
  heldBy: HandId | null;
}

interface WithSource {
  source?: InputSource;
}

export type MissionAction =
  | ({ type: 'LOCATE'; target: InspectableId } & WithSource)
  | ({ type: 'GRAB'; item: ItemId; hand: HandId } & WithSource)
  | ({
      type: 'RELEASE';
      hand: HandId;
      /** Nearest compatible zone the adapter measured (omit when released in free space). */
      zone?: ZoneId;
      /** Distance between the item's anchor and the zone anchor, metres. Panel/keyboard sends 0. */
      distanceM?: number;
      /** Orientation error vs. the zone's expected pose, degrees (only meaningful for group-head). */
      angleDeg?: number;
      /** Tamper tilt from vertical, degrees (only for zone 'basket'). */
      tiltDeg?: number;
    } & WithSource)
  | ({ type: 'PRESS'; button: ButtonId } & WithSource)
  | ({ type: 'USE_TAMPER'; tiltDeg?: number } & WithSource)
  | { type: 'TICK'; dtSec: number }
  | ({ type: 'REQUEST_HINT' } & WithSource)
  | { type: 'SET_GUIDANCE'; guidance: Guidance }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'RESET' };

export type FeedbackKind = 'success' | 'info' | 'warn' | 'mistake';

/** Stable machine-readable codes so tests and adapters can react precisely. */
export type FeedbackCode =
  | 'step-complete'
  | 'mission-complete'
  | 'inspect'
  | 'located-other'
  | 'hand-full'
  | 'grinding-wait'
  | 'settling-wait'
  | 'remove-during-shot'
  | 'cup-during-shot'
  | 'near-miss'
  | 'near-miss-angle'
  | 'returned'
  | 'attach-empty'
  | 'attach-untamped'
  | 'attach-spent'
  | 'attach-keep-warm'
  | 'grind-no-portafilter'
  | 'grind-basket-full'
  | 'grind-busy'
  | 'tamp-empty'
  | 'tamp-already'
  | 'tamp-spent'
  | 'tamp-not-resting'
  | 'tamp-no-tamper'
  | 'tamp-tilted'
  | 'tare-no-cup'
  | 'tare-ok'
  | 'tare-during-shot'
  | 'brew-no-portafilter'
  | 'brew-no-cup'
  | 'brew-not-tared'
  | 'brew-busy'
  | 'shot-stopped'
  | 'shot-auto-stopped'
  | 'shot-approaching'
  | 'flush-cup-in-place'
  | 'flush-spent-attached'
  | 'flush-done'
  | 'knock-fresh-grounds'
  | 'knock-nothing'
  | 'knock-ok'
  | 'hint'
  | 'guidance-changed'
  | 'paused'
  | 'resumed'
  | 'reset';

export interface Feedback {
  /** Monotonic within one attempt; adapters show a toast when it changes. */
  seq: number;
  kind: FeedbackKind;
  code: FeedbackCode;
  text: LocalizedText;
  /** Optional "why" explanation. */
  detail?: LocalizedText;
  step?: StepId;
}

export type MissionEffect =
  | { type: 'sound'; name: SfxName }
  | { type: 'snap'; item: ItemId; zone: ZoneId }
  | { type: 'return-home'; item: ItemId; zone: ZoneId }
  | { type: 'grab'; item: ItemId; hand: HandId }
  | { type: 'tamp' }
  | { type: 'knock' }
  | { type: 'step-complete'; step: StepId }
  | { type: 'mission-complete' }
  | { type: 'reset' };

export interface MistakeRecord {
  code: FeedbackCode;
  step: StepId;
  atSec: number;
}

export interface MissionMetrics {
  /** Active (unpaused) simulated seconds. */
  elapsedSec: number;
  /** Seconds since the learner last did something meaningful (drives assisted auto-cues). */
  idleSec: number;
  hintsUsed: number;
  /** Counted workflow mistakes (wrong-order / unsafe actions). Near-misses are tracked separately. */
  mistakes: MistakeRecord[];
  /** Releases close to a valid zone but outside the snap tolerance. */
  nearMisses: number;
  /** Successful snaps into a zone. */
  snaps: number;
  actionsBySource: Record<InputSource, number>;
  /** Restarts before this attempt (carried across RESET). */
  resets: number;
  /** Elapsed time at which each step was first completed. */
  stepTimes: Partial<Record<StepId, number>>;
}

export interface ShotState {
  status: ShotStatus;
  /** Seconds since the brew button started the shot. */
  elapsedSec: number;
  /** Espresso in the cup (illustrative model), grams. */
  yieldG: number;
  /** Yield on the scale at the moment the learner pressed stop. */
  stoppedAtG: number | null;
  /** Shot time at stop. */
  stoppedAtSec: number | null;
  autoStopped: boolean;
  /** Post-stop drip progress, seconds. */
  settleSec: number;
  approachingCueShown: boolean;
}

export interface MissionState {
  missionId: typeof MISSION_ID;
  status: MissionStatus;
  guidance: Guidance;
  /** Every tier used during this attempt, in first-use order. */
  guidanceUsed: Guidance[];
  items: Record<ItemId, ItemState>;
  basket: BasketState;
  /** Ground coffee in the basket, grams (illustrative). */
  doseG: number;
  grinder: { running: boolean; elapsedSec: number };
  /** Scale tare offset, grams. */
  tareG: number;
  shot: ShotState;
  flush: { running: boolean; elapsedSec: number };
  flags: {
    located: boolean;
    portafilterGrabbed: boolean;
    knocked: boolean;
    flushed: boolean;
    tampTiltDeg: number | null;
  };
  /** When non-null, cues are forced visible until this elapsed time (hint request). */
  hintUntilSec: number | null;
  metrics: MissionMetrics;
  feedback: Feedback | null;
  /** Effects produced by the most recent action only (sounds, snaps…). */
  effects: MissionEffect[];
  completedAtSec: number | null;
  /** Increments on RESET; lets adapters key per-attempt side effects. */
  attempt: number;
}
