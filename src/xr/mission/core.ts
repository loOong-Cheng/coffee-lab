/**
 * Generic mission framework (pure). Every XR-lab mission is a pure reducer +
 * a definition the shared UI/scene runtime renders. Evidence is always
 * 'simulated'; numbers from physical models are illustrative.
 */
import type { Guidance, LearningEvent, LocalizedText, Mode } from '../../domain/contracts';
import type { SfxName } from '../../audio';
import type { FeedbackKind, InputSource, MissionStatus } from './types';
import { cueVisibility, mostSupportive, TIERS, type CueVisibility } from './tiers';

export type MissionId = 'espresso-first-shot' | 'station-tour' | 'pourover-bloom';

export interface CoreFeedback {
  seq: number;
  kind: FeedbackKind;
  code: string;
  text: LocalizedText;
  detail?: LocalizedText;
}

export interface CoreMetrics {
  elapsedSec: number;
  idleSec: number;
  hintsUsed: number;
  resets: number;
  actionsBySource: Record<InputSource, number>;
  mistakes: ReadonlyArray<{ code: string; atSec: number }>;
}

export interface CoreState {
  status: MissionStatus;
  guidance: Guidance;
  guidanceUsed: Guidance[];
  attempt: number;
  hintUntilSec: number | null;
  feedback: CoreFeedback | null;
  effects: ReadonlyArray<{ type: string; name?: SfxName }>;
  metrics: CoreMetrics;
  completedAtSec: number | null;
}

export type CoreAction =
  | { type: 'TICK'; dtSec: number }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'RESET' }
  | { type: 'SET_GUIDANCE'; guidance: Guidance }
  | { type: 'REQUEST_HINT'; source?: InputSource };

export interface PanelAction<A = unknown> {
  id: string;
  label: LocalizedText;
  actions: A[];
  recommended: boolean;
}

/** What the HUD / in-headset panel shows (tier-aware, computed by the mission). */
export interface HudView {
  status: MissionStatus;
  guidance: Guidance;
  stepIndex: number;
  stepCount: number;
  stepTitle: LocalizedText | null;
  doXr: LocalizedText | null;
  doScreen: LocalizedText | null;
  showStepLabel: boolean;
  showInstruction: boolean;
  /** Small progress note, e.g. "Explored 3 of 5". */
  progress: LocalizedText | null;
  feedback: CoreFeedback | null;
}

export interface Readout {
  big: string;
  small: LocalizedText;
  tone: 'normal' | 'near' | 'on';
  /** Optional progress bar toward a target (same unit as `big`). */
  bar?: { value: number; max: number; target: number };
}

export interface StatRow {
  label: LocalizedText;
  value: LocalizedText;
}

/** Generic, honest end-of-mission result. */
export interface MissionResult {
  missionId: MissionId;
  completed: boolean;
  evidence: 'simulated';
  illustrativeModel: boolean;
  claims: { realSkill: false; taste: false; gripForce: false; haptics: false };
  durationSec: number;
  hintsUsed: number;
  mistakes: number;
  stats: StatRow[];
  /** Illustrative-model callout (e.g. stop accuracy explanation), if any. */
  note: LocalizedText | null;
  practiced: LocalizedText[];
  notTrained: readonly LocalizedText[];
  score: number;
  guidanceUsed: Guidance[];
  guidanceForRecord: Guidance;
  guidanceFinal: Guidance;
  primaryInput: InputSource;
  spatialPractice: boolean;
  /** Compact machine-readable notes for the learning event. */
  notes: string;
}

/** Scene factory contract (implemented in src/xr/scene, loaded lazily). */
export interface SceneHandle {
  readonly xrReady: boolean;
  enterVR(): Promise<{ ok: boolean; error?: string }>;
  exitVR(): Promise<void>;
  inXR(): boolean;
  setLocale(l: 'zh' | 'en'): void;
  setCounterHeight(mode: 'standing' | 'seated' | 'up' | 'down'): void;
  recenter(): void;
  resetView(): void;
  stats(): { meshes: number; activeMeshes: number; drawCalls: number; fps: number };
  /** Test/diagnostic hook: client coordinates of a named target (optionally at a station-local height). */
  project(target: string, atLocalY?: number): { x: number; y: number } | null;
  dispose(): void;
}

export interface Store<S extends CoreState, A> {
  getState(): S;
  dispatch(action: A): S;
  subscribe(listener: () => void): () => void;
  onEffects(listener: (effects: S['effects'], state: S, action: A) => void): () => void;
}

export type AnyStore = Store<CoreState, CoreAction>;

export interface SceneOptions {
  canvas: HTMLCanvasElement;
  store: AnyStore;
  def: AnyMission;
  locale: 'zh' | 'en';
  reducedMotion: boolean;
  xrSupported: boolean;
  onXrChange?(inXr: boolean): void;
  onHover?(info: { name: LocalizedText; purpose: LocalizedText } | null): void;
  onLocaleToggle?(): void;
}

export type SceneFactory = (opts: SceneOptions) => Promise<SceneHandle>;

/** A mission the shared player can run. Methods (not properties) keep parameters bivariant for erasure. */
export interface MissionDef<S extends CoreState, A> {
  readonly id: MissionId;
  readonly activityId: string;
  readonly lessonId: string;
  readonly title: LocalizedText;
  readonly short: LocalizedText;
  readonly intro: LocalizedText;
  readonly practices: readonly LocalizedText[];
  readonly notTrains: readonly LocalizedText[];
  readonly minutes: readonly [number, number];
  readonly stepTitles: readonly LocalizedText[];
  readonly realNext: { to: string; label: LocalizedText };
  readonly controlsHelp: { pointer: LocalizedText; xr: LocalizedText };
  create(guidance: Guidance): S;
  reduce(s: S, a: A): S;
  hud(s: S): HudView;
  actions(s: S): PanelAction<A>[];
  actionsKey(s: S): string;
  result(s: S): MissionResult;
  readout(s: S): Readout | null;
  status(s: S): LocalizedText[];
  /** Extra in-headset panel buttons (e.g. "Skip wait"). */
  xrButtons(s: S): Array<{ id: string; label: LocalizedText; action: A }>;
  loadScene(): Promise<SceneFactory>;
}

export type AnyMission = MissionDef<CoreState, CoreAction>;

export function createStore<S extends CoreState, A>(reduce: (s: S, a: A) => S, initial: S): Store<S, A> {
  let state = initial;
  const listeners = new Set<() => void>();
  const effectListeners = new Set<(effects: S['effects'], state: S, action: A) => void>();
  return {
    getState: () => state,
    dispatch(action) {
      const next = reduce(state, action);
      if (next === state) return state;
      state = next;
      if (next.effects.length > 0) for (const l of [...effectListeners]) l(next.effects, next, action);
      for (const l of [...listeners]) l();
      return state;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    onEffects(listener) {
      effectListeners.add(listener);
      return () => effectListeners.delete(listener);
    },
  };
}

export function emptyMetrics(resets = 0): CoreMetrics {
  return { elapsedSec: 0, idleSec: 0, hintsUsed: 0, resets, actionsBySource: { xr: 0, pointer: 0, panel: 0, test: 0 }, mistakes: [] };
}

export function primaryInputOf(inputs: Record<InputSource, number>): InputSource {
  let best: InputSource = 'test';
  let n = -1;
  for (const k of ['xr', 'pointer', 'panel', 'test'] as const) {
    if (inputs[k] > n) {
      best = k;
      n = inputs[k];
    }
  }
  return best;
}

export function cuesOf(s: CoreState): CueVisibility {
  return cueVisibility(s.guidance, { idleSec: s.metrics.idleSec, elapsedSec: s.metrics.elapsedSec, hintUntilSec: s.hintUntilSec });
}

export function baseResult(s: CoreState, missionId: MissionId) {
  const inputs = { ...s.metrics.actionsBySource };
  return {
    missionId,
    completed: s.status === 'complete',
    evidence: 'simulated' as const,
    claims: { realSkill: false, taste: false, gripForce: false, haptics: false } as const,
    durationSec: Math.round(s.completedAtSec ?? s.metrics.elapsedSec),
    hintsUsed: s.metrics.hintsUsed,
    mistakes: s.metrics.mistakes.length,
    guidanceUsed: [...s.guidanceUsed],
    guidanceForRecord: mostSupportive(s.guidanceUsed),
    guidanceFinal: s.guidance,
    primaryInput: primaryInputOf(inputs),
    spatialPractice: inputs.xr + inputs.pointer > inputs.panel,
  };
}

/** Mode for the learning event: XR only when the work was actually done in a headset session. */
export function modeFor(result: Pick<MissionResult, 'primaryInput'>, env: { immersive: boolean; touch: boolean }): Mode {
  if (env.immersive || result.primaryInput === 'xr') return 'xr';
  return env.touch ? 'mobile' : 'desktop';
}

export function completionEvent(
  def: Pick<AnyMission, 'activityId' | 'lessonId'>,
  r: MissionResult,
  env: { immersive: boolean; touch: boolean },
): Omit<LearningEvent, 'id' | 'recordedAt'> {
  return {
    activityId: def.activityId,
    lessonId: def.lessonId,
    mode: modeFor(r, env),
    guidance: r.guidanceForRecord,
    evidence: 'simulated',
    outcome: r.completed ? 'completed' : 'retry',
    score: r.score,
    notes: r.notes,
  };
}

/**
 * Shared handling of meta actions for the simpler missions (tour, pour-over).
 * Returns null when the action is mission-specific.
 */
export function reduceMeta<S extends CoreState>(
  s: S,
  a: { type: string; [k: string]: unknown },
  fresh: (guidance: Guidance, carry: { resets: number; attempt: number; seq: number }) => S,
  texts: { paused: LocalizedText; resumed: LocalizedText; guidance: (g: Guidance) => LocalizedText },
): S | null {
  const next = (patch: Partial<CoreState>): S => ({ ...s, effects: [], ...patch }) as S;
  const say = (kind: FeedbackKind, code: string, text: LocalizedText): CoreFeedback => ({ seq: (s.feedback?.seq ?? 0) + 1, kind, code, text });
  switch (a.type) {
    case 'RESET':
      return fresh(s.guidance, { resets: s.metrics.resets + 1, attempt: s.attempt + 1, seq: s.feedback?.seq ?? 0 });
    case 'SET_GUIDANCE': {
      const g = a.guidance as Guidance;
      if (g === s.guidance) return s;
      const used = s.status !== 'complete' && !s.guidanceUsed.includes(g) ? [...s.guidanceUsed, g] : s.guidanceUsed;
      return next({ guidance: g, guidanceUsed: used, feedback: say('info', 'guidance-changed', texts.guidance(g)) });
    }
    case 'PAUSE':
      return s.status === 'playing' ? next({ status: 'paused', feedback: say('info', 'paused', texts.paused) }) : s;
    case 'RESUME':
      return s.status === 'paused' ? next({ status: 'playing', feedback: say('info', 'resumed', texts.resumed) }) : s;
    default:
      return null;
  }
}

export function hintWindow(s: CoreState): number {
  return s.metrics.elapsedSec + TIERS[s.guidance].hintDurationSec;
}
