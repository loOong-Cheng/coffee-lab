/**
 * Pure mission state machine for "espresso-first-shot".
 *
 * Design: learners may physically pick things up in any order (it's VR), but
 * *workflow rules* are enforced with gentle, specific feedback. The current
 * step is DERIVED (first unsatisfied step), so the mission never dead-ends:
 * undoing something (e.g. lifting the cup off the scale) simply moves the
 * guidance back to that step. Only rule-breaking actions count as mistakes.
 */
import type { Guidance, LocalizedText } from '../../domain/contracts';
import type {
  ButtonId,
  FeedbackCode,
  FeedbackKind,
  HandId,
  InputSource,
  ItemId,
  MissionAction,
  MissionState,
  StepId,
  ZoneId,
} from './types';
import { MISSION_ID } from './types';
import { TIERS, cueVisibility, evaluateSnap } from './tiers';
import { MODEL, RECIPE, round1, scoreStop, yieldAt } from './extraction';
import { FEEDBACK, GUIDANCE_LABEL, STEPS, STEP_ORDER, STOP_FEEDBACK, TOOL_INFO, fmt } from './content';

export const ITEM_HOME: Record<ItemId, ZoneId> = {
  portafilter: 'tamp-mat',
  cup: 'cup-home',
  tamper: 'tamper-stand',
};

export const ZONE_ACCEPTS: Record<ZoneId, readonly ItemId[]> = {
  'tamp-mat': ['portafilter'],
  'grinder-fork': ['portafilter'],
  'group-head': ['portafilter'],
  'knock-box': ['portafilter'],
  'cup-home': ['cup'],
  scale: ['cup'],
  serve: ['cup'],
  'tamper-stand': ['tamper'],
  basket: ['tamper'],
};

/** Zones an item can be released into, in a stable order (for adapters and the action list). */
export function zonesFor(item: ItemId): ZoneId[] {
  return (Object.keys(ZONE_ACCEPTS) as ZoneId[]).filter((z) => ZONE_ACCEPTS[z].includes(item));
}

/** Station parts that count as "the espresso machine" for the orient step. */
const MACHINE_PARTS = new Set(['espresso-machine', 'group-head', 'brew-button', 'drip-tray']);

const ITEMS: readonly ItemId[] = ['portafilter', 'cup', 'tamper'];
const MAX_TICK_SEC = 0.25;

export function createInitialState(
  guidance: Guidance = 'guided',
  carry: { resets?: number; attempt?: number; feedbackSeq?: number } = {},
): MissionState {
  return {
    missionId: MISSION_ID,
    status: 'playing',
    guidance,
    guidanceUsed: [guidance],
    items: {
      portafilter: { zone: ITEM_HOME.portafilter, heldBy: null },
      cup: { zone: ITEM_HOME.cup, heldBy: null },
      tamper: { zone: ITEM_HOME.tamper, heldBy: null },
    },
    basket: 'empty',
    doseG: 0,
    grinder: { running: false, elapsedSec: 0 },
    tareG: 0,
    shot: {
      status: 'idle',
      elapsedSec: 0,
      yieldG: 0,
      stoppedAtG: null,
      stoppedAtSec: null,
      autoStopped: false,
      settleSec: 0,
      approachingCueShown: false,
    },
    flush: { running: false, elapsedSec: 0 },
    flags: { located: false, portafilterGrabbed: false, knocked: false, flushed: false, tampTiltDeg: null },
    hintUntilSec: null,
    metrics: {
      elapsedSec: 0,
      idleSec: 0,
      hintsUsed: 0,
      mistakes: [],
      nearMisses: 0,
      snaps: 0,
      actionsBySource: { xr: 0, pointer: 0, panel: 0, test: 0 },
      resets: carry.resets ?? 0,
      stepTimes: {},
    },
    feedback:
      carry.feedbackSeq !== undefined
        ? { seq: carry.feedbackSeq + 1, kind: 'info', code: 'reset', text: FEEDBACK.reset }
        : null,
    effects: [],
    completedAtSec: null,
    attempt: carry.attempt ?? 1,
  };
}

// ───────────────────────────── derived selectors ─────────────────────────────

export function heldItem(s: MissionState, hand: HandId): ItemId | null {
  for (const id of ITEMS) if (s.items[id].heldBy === hand) return id;
  return null;
}

/** Item is resting (not held) in a zone. */
export function isAt(s: MissionState, item: ItemId, zone: ZoneId): boolean {
  const it = s.items[item];
  return it.heldBy === null && it.zone === zone;
}

export function cupLiquidG(s: MissionState): number {
  return s.shot.yieldG;
}

/** Gross load on the scale, grams. */
export function scaleLoadG(s: MissionState): number {
  return isAt(s, 'cup', 'scale') ? MODEL.cupMassG + cupLiquidG(s) : 0;
}

/** What the scale display shows (load minus tare), grams. */
export function scaleReadingG(s: MissionState): number {
  return round1(scaleLoadG(s) - s.tareG);
}

function shotStarted(s: MissionState): boolean {
  return s.shot.status !== 'idle';
}

export function isStepDone(s: MissionState, step: StepId): boolean {
  switch (step) {
    case 'locate':
      return s.flags.located;
    case 'grab-portafilter':
      return s.flags.portafilterGrabbed;
    case 'dose':
      return s.basket !== 'empty' || shotStarted(s);
    case 'tamp':
      return s.basket === 'tamped' || shotStarted(s);
    case 'attach':
      return isAt(s, 'portafilter', 'group-head') || shotStarted(s);
    case 'place-cup':
      return isAt(s, 'cup', 'scale') || shotStarted(s);
    case 'tare':
      return (isAt(s, 'cup', 'scale') && Math.abs(scaleReadingG(s)) < 0.5) || shotStarted(s);
    case 'brew':
      return shotStarted(s);
    case 'stop':
      return s.shot.status === 'settling' || s.shot.status === 'done';
    case 'serve':
      return s.shot.status === 'done' && isAt(s, 'cup', 'serve');
    case 'remove':
      return (s.shot.status === 'done' && !isAt(s, 'portafilter', 'group-head')) || s.flags.knocked;
    case 'knock-out':
      return s.flags.knocked;
    case 'flush':
      return s.flags.flushed;
  }
}

/** Index of the first unsatisfied step; STEP_ORDER.length when everything is done. */
export function currentStepIndex(s: MissionState): number {
  const i = STEP_ORDER.findIndex((id) => !isStepDone(s, id));
  return i === -1 ? STEP_ORDER.length : i;
}

export function currentStep(s: MissionState): StepId | null {
  return STEP_ORDER[currentStepIndex(s)] ?? null;
}

export type CueTarget =
  | { kind: 'look'; part: 'espresso-machine' }
  /** Pick up `item`; `zone` is where it should go next (for ghost previews). */
  | { kind: 'grab'; item: ItemId; zone?: ZoneId }
  | { kind: 'place'; item: ItemId; zone: ZoneId }
  | { kind: 'press'; button: ButtonId }
  | { kind: 'wait'; reason: 'grinding' | 'brewing' | 'settling' | 'flushing' };

function moveCue(s: MissionState, item: ItemId, zone: ZoneId): CueTarget | null {
  if (isAt(s, item, zone)) return null;
  return s.items[item].heldBy ? { kind: 'place', item, zone } : { kind: 'grab', item, zone };
}

/** What guidance should point at right now (pure; shared by 3D cues and the action list). */
export function stepCue(s: MissionState): CueTarget | null {
  const step = currentStep(s);
  if (!step) return null;
  if (s.grinder.running) return { kind: 'wait', reason: 'grinding' };
  if (s.flush.running) return { kind: 'wait', reason: 'flushing' };
  if (s.shot.status === 'settling') return { kind: 'wait', reason: 'settling' };
  switch (step) {
    case 'locate':
      return { kind: 'look', part: 'espresso-machine' };
    case 'grab-portafilter':
      return { kind: 'grab', item: 'portafilter', zone: 'grinder-fork' };
    case 'dose':
      return isAt(s, 'portafilter', 'grinder-fork')
        ? { kind: 'press', button: 'grinder' }
        : moveCue(s, 'portafilter', 'grinder-fork');
    case 'tamp': {
      const tamperHand = s.items.tamper.heldBy;
      const pfSteady =
        isAt(s, 'portafilter', 'tamp-mat') ||
        (s.items.portafilter.heldBy !== null && tamperHand !== null && s.items.portafilter.heldBy !== tamperHand);
      if (!pfSteady) return moveCue(s, 'portafilter', 'tamp-mat');
      return tamperHand ? { kind: 'place', item: 'tamper', zone: 'basket' } : { kind: 'grab', item: 'tamper', zone: 'basket' };
    }
    case 'attach':
      return moveCue(s, 'portafilter', 'group-head');
    case 'place-cup':
      return moveCue(s, 'cup', 'scale');
    case 'tare':
      return { kind: 'press', button: 'tare' };
    case 'brew':
      return { kind: 'press', button: 'brew' };
    case 'stop':
      return { kind: 'press', button: 'brew' };
    case 'serve':
      return moveCue(s, 'cup', 'serve');
    case 'remove':
      return { kind: 'grab', item: 'portafilter', zone: 'knock-box' };
    case 'knock-out':
      return moveCue(s, 'portafilter', 'knock-box');
    case 'flush':
      return { kind: 'press', button: 'brew' };
  }
}

/** Convenience: tier-aware cue visibility for the current state. */
export function cuesFor(s: MissionState) {
  return cueVisibility(s.guidance, {
    idleSec: s.metrics.idleSec,
    elapsedSec: s.metrics.elapsedSec,
    hintUntilSec: s.hintUntilSec,
  });
}

// ───────────────────────────── reducer ─────────────────────────────

function cloneState(s: MissionState): MissionState {
  return {
    ...s,
    guidanceUsed: [...s.guidanceUsed],
    items: {
      portafilter: { ...s.items.portafilter },
      cup: { ...s.items.cup },
      tamper: { ...s.items.tamper },
    },
    grinder: { ...s.grinder },
    shot: { ...s.shot },
    flush: { ...s.flush },
    flags: { ...s.flags },
    metrics: {
      ...s.metrics,
      mistakes: [...s.metrics.mistakes],
      actionsBySource: { ...s.metrics.actionsBySource },
      stepTimes: { ...s.metrics.stepTimes },
    },
    effects: [],
  };
}

type Vars = Record<string, string | number | LocalizedText>;

class Draft {
  readonly d: MissionState;
  private seq: number;
  explicitFeedback = false;
  constructor(readonly prev: MissionState) {
    this.d = cloneState(prev);
    this.seq = prev.feedback?.seq ?? 0;
  }
  say(kind: FeedbackKind, code: FeedbackCode, vars: Vars = {}, detail?: LocalizedText): void {
    this.seq += 1;
    this.d.feedback = { seq: this.seq, kind, code, text: fmt(FEEDBACK[code], vars), detail, step: currentStep(this.d) ?? undefined };
    this.explicitFeedback = true;
  }
  sayText(kind: FeedbackKind, code: FeedbackCode, text: LocalizedText, detail?: LocalizedText): void {
    this.seq += 1;
    this.d.feedback = { seq: this.seq, kind, code, text, detail, step: currentStep(this.d) ?? undefined };
    this.explicitFeedback = true;
  }
  mistake(code: FeedbackCode, vars: Vars = {}): void {
    const step = currentStep(this.d) ?? 'flush';
    this.d.metrics.mistakes.push({ code, step, atSec: round1(this.d.metrics.elapsedSec) });
    this.say('mistake', code, vars, STEPS[step].why);
    this.sound('incorrect');
  }
  sound(name: Parameters<typeof soundEffect>[0]): void {
    this.d.effects.push(soundEffect(name));
  }
  returnHome(item: ItemId): void {
    const it = this.d.items[item];
    it.heldBy = null;
    it.zone = ITEM_HOME[item];
    this.d.effects.push({ type: 'return-home', item, zone: it.zone });
  }
}

function soundEffect(name: 'tap' | 'select' | 'correct' | 'incorrect' | 'complete' | 'grind' | 'pour' | 'drip' | 'timer' | 'snap' | 'whoosh' | 'reset') {
  return { type: 'sound' as const, name };
}

function countAction(x: Draft, source: InputSource | undefined): void {
  x.d.metrics.actionsBySource[source ?? 'test'] += 1;
  x.d.metrics.idleSec = 0;
}

export function missionReducer(s: MissionState, a: MissionAction): MissionState {
  // Meta actions work in any status.
  switch (a.type) {
    case 'RESET': {
      const next = createInitialState(s.guidance, {
        resets: s.metrics.resets + 1,
        attempt: s.attempt + 1,
        feedbackSeq: s.feedback?.seq ?? 0,
      });
      next.effects = [{ type: 'reset' }, soundEffect('reset')];
      return next;
    }
    case 'SET_GUIDANCE': {
      if (a.guidance === s.guidance) return s;
      const x = new Draft(s);
      x.d.guidance = a.guidance;
      if (s.status !== 'complete' && !x.d.guidanceUsed.includes(a.guidance)) x.d.guidanceUsed.push(a.guidance);
      x.say('info', 'guidance-changed', { tier: GUIDANCE_LABEL[a.guidance] });
      return x.d;
    }
    case 'PAUSE': {
      if (s.status !== 'playing') return s;
      const x = new Draft(s);
      x.d.status = 'paused';
      x.say('info', 'paused');
      return x.d;
    }
    case 'RESUME': {
      if (s.status !== 'paused') return s;
      const x = new Draft(s);
      x.d.status = 'playing';
      x.say('info', 'resumed');
      return x.d;
    }
    default:
      break;
  }

  if (s.status !== 'playing') return s;
  if (a.type === 'TICK' && !(a.dtSec > 0)) return s;

  const x = new Draft(s);
  const d = x.d;

  switch (a.type) {
    case 'TICK':
      tick(x, Math.min(a.dtSec, MAX_TICK_SEC));
      break;
    case 'LOCATE': {
      countAction(x, a.source);
      const info = TOOL_INFO[a.target];
      if (MACHINE_PARTS.has(a.target)) {
        if (!d.flags.located) {
          d.flags.located = true;
        } else {
          x.say('info', 'inspect', { name: info.name, purpose: info.purpose });
          x.sound('tap');
        }
      } else if (!d.flags.located) {
        x.say('info', 'located-other', { name: info.name });
        x.sound('tap');
      } else {
        x.say('info', 'inspect', { name: info.name, purpose: info.purpose });
        x.sound('tap');
      }
      break;
    }
    case 'REQUEST_HINT': {
      countAction(x, a.source);
      d.metrics.hintsUsed += 1;
      d.hintUntilSec = d.metrics.elapsedSec + TIERS[d.guidance].hintDurationSec;
      const step = currentStep(d);
      if (step) {
        const c = STEPS[step];
        x.say('info', 'hint', { title: c.title, instruction: a.source === 'xr' ? c.doXr : c.doScreen }, c.why);
      }
      x.sound('select');
      break;
    }
    case 'GRAB':
      countAction(x, a.source);
      grab(x, a.item, a.hand);
      break;
    case 'RELEASE':
      if (!heldItem(s, a.hand)) return s;
      countAction(x, a.source);
      release(x, a);
      break;
    case 'PRESS':
      countAction(x, a.source);
      press(x, a.button);
      break;
    case 'USE_TAMPER': {
      countAction(x, a.source);
      const hand = d.items.tamper.heldBy;
      if (!hand) {
        x.say('info', 'tamp-no-tamper');
        break;
      }
      tamp(x, hand, a.tiltDeg);
      break;
    }
  }

  return finalize(x);
}

function grab(x: Draft, item: ItemId, hand: HandId): void {
  const d = x.d;
  const inHand = heldItem(d, hand);
  if (inHand === item) return;
  if (inHand) {
    x.say('info', 'hand-full');
    return;
  }
  const it = d.items[item];
  if (it.heldBy === null) {
    if (item === 'portafilter' && it.zone === 'group-head') {
      if (d.shot.status === 'running') return x.mistake('remove-during-shot');
      if (d.shot.status === 'settling') return x.say('info', 'settling-wait');
      if (d.flush.running) return x.say('info', 'brew-busy');
    }
    if (item === 'portafilter' && it.zone === 'grinder-fork' && d.grinder.running) return x.say('info', 'grinding-wait');
    if (item === 'cup' && it.zone === 'scale') {
      if (d.shot.status === 'running') return x.mistake('cup-during-shot');
      if (d.shot.status === 'settling') return x.say('info', 'settling-wait');
    }
  }
  it.heldBy = hand; // also covers hand-to-hand transfer
  if (item === 'portafilter') d.flags.portafilterGrabbed = true;
  d.effects.push({ type: 'grab', item, hand });
  x.sound('select');
}

function release(x: Draft, a: Extract<MissionAction, { type: 'RELEASE' }>): void {
  const d = x.d;
  const item = heldItem(d, a.hand)!;
  const tier = TIERS[d.guidance];
  const zone = a.zone && ZONE_ACCEPTS[a.zone].includes(item) ? a.zone : undefined;
  const snap = zone
    ? evaluateSnap(tier, a.distanceM ?? 0, zone === 'group-head' ? a.angleDeg : undefined)
    : { result: 'none' as const, angleOk: true };

  if (zone && snap.result === 'snap') {
    if (zone === 'basket') {
      const before = d.basket;
      tamp(x, a.hand, a.tiltDeg);
      if (before === 'dosed' && d.basket === 'tamped') d.metrics.snaps += 1;
      x.returnHome('tamper');
      return;
    }
    place(x, item, zone);
    return;
  }
  if (zone && snap.result === 'near') {
    d.metrics.nearMisses += 1;
    x.say('info', snap.angleOk ? 'near-miss' : 'near-miss-angle');
  }
  x.returnHome(item);
  x.sound('whoosh');
}

function place(x: Draft, item: ItemId, zone: ZoneId): void {
  const d = x.d;
  const it = d.items[item];
  if (item === 'portafilter' && zone === 'group-head') {
    if (d.basket === 'dosed') return rejectHome(x, item, 'attach-untamped');
    if (d.basket === 'spent') return rejectHome(x, item, 'attach-spent');
    if (d.basket === 'empty') {
      if (d.shot.status !== 'done') return rejectHome(x, item, 'attach-empty');
      x.say('info', 'attach-keep-warm');
    }
  }
  if (item === 'portafilter' && zone === 'knock-box') {
    if (d.basket === 'dosed' || d.basket === 'tamped') return rejectHome(x, item, 'knock-fresh-grounds');
    if (d.basket === 'spent') {
      d.basket = 'empty';
      d.doseG = 0;
      d.flags.knocked = true;
      d.effects.push({ type: 'knock' });
      x.say('success', 'knock-ok');
      x.sound('tap');
    } else {
      x.say('info', 'knock-nothing');
    }
  }
  it.heldBy = null;
  it.zone = zone;
  d.metrics.snaps += 1;
  d.effects.push({ type: 'snap', item, zone });
  x.sound('snap');
}

function rejectHome(x: Draft, item: ItemId, code: FeedbackCode): void {
  x.mistake(code);
  x.returnHome(item);
}

function tamp(x: Draft, tamperHand: HandId, tiltDeg: number | undefined): void {
  const d = x.d;
  const pf = d.items.portafilter;
  const steady = isAt(d, 'portafilter', 'tamp-mat') || (pf.heldBy !== null && pf.heldBy !== tamperHand);
  if (d.basket === 'empty') return x.mistake('tamp-empty');
  if (d.basket === 'spent') return x.say('info', 'tamp-spent');
  if (d.basket === 'tamped') return x.say('info', 'tamp-already');
  if (!steady) return x.say('info', 'tamp-not-resting');
  d.basket = 'tamped';
  const tilt = Math.abs(tiltDeg ?? 0);
  d.flags.tampTiltDeg = round1(tilt);
  d.effects.push({ type: 'tamp' });
  x.sound('snap');
  if (tilt > TIERS[d.guidance].tampTiltToleranceDeg) x.say('warn', 'tamp-tilted', { deg: Math.round(tilt) });
}

function press(x: Draft, button: ButtonId): void {
  const d = x.d;
  x.sound('tap');
  if (button === 'grinder') {
    if (d.grinder.running) return x.say('info', 'grind-busy');
    if (!isAt(d, 'portafilter', 'grinder-fork')) return x.mistake('grind-no-portafilter');
    if (d.basket !== 'empty') return x.mistake('grind-basket-full');
    d.grinder = { running: true, elapsedSec: 0 };
    x.sound('grind');
    return;
  }
  if (button === 'tare') {
    if (d.shot.status === 'running') return x.say('info', 'tare-during-shot');
    d.tareG = scaleLoadG(d);
    if (!isAt(d, 'cup', 'scale')) return x.say('info', 'tare-no-cup');
    x.say('info', 'tare-ok');
    return;
  }
  // brew button
  if (d.flush.running) return x.say('info', 'brew-busy');
  switch (d.shot.status) {
    case 'running':
      stopShot(x, false);
      return;
    case 'settling':
      return x.say('info', 'settling-wait');
    case 'idle': {
      if (!isAt(d, 'portafilter', 'group-head')) return x.mistake('brew-no-portafilter');
      if (!isAt(d, 'cup', 'scale')) return x.mistake('brew-no-cup');
      const reading = scaleReadingG(d);
      if (Math.abs(reading) >= 0.5) return x.mistake('brew-not-tared', { g: reading.toFixed(1) });
      d.shot = { ...d.shot, status: 'running', elapsedSec: 0, yieldG: 0 };
      x.sound('pour');
      return;
    }
    case 'done': {
      if (isAt(d, 'portafilter', 'group-head') && d.basket === 'spent') return x.mistake('flush-spent-attached');
      if (isAt(d, 'cup', 'scale')) return x.mistake('flush-cup-in-place');
      d.flush = { running: true, elapsedSec: 0 };
      x.sound('pour');
      return;
    }
  }
}

function stopShot(x: Draft, auto: boolean): void {
  const d = x.d;
  d.shot.status = 'settling';
  d.shot.stoppedAtG = round1(d.shot.yieldG);
  d.shot.stoppedAtSec = round1(d.shot.elapsedSec);
  d.shot.autoStopped = auto;
  d.shot.settleSec = 0;
  if (auto) x.say('warn', 'shot-auto-stopped', { g: d.shot.stoppedAtG.toFixed(1), target: RECIPE.targetYieldG });
  else x.say('success', 'shot-stopped', { g: d.shot.stoppedAtG.toFixed(1) });
}

function tick(x: Draft, dt: number): void {
  const d = x.d;
  d.metrics.elapsedSec += dt;
  d.metrics.idleSec += dt;

  if (d.grinder.running) {
    d.grinder.elapsedSec += dt;
    if (d.grinder.elapsedSec >= MODEL.grindSec) {
      d.grinder = { running: false, elapsedSec: MODEL.grindSec };
      d.basket = 'dosed';
      d.doseG = RECIPE.doseG;
    }
  }

  if (d.shot.status === 'running') {
    d.shot.elapsedSec += dt;
    d.shot.yieldG = yieldAt(d.shot.elapsedSec);
    if (!d.shot.approachingCueShown && d.shot.yieldG >= RECIPE.targetYieldG - MODEL.approachWindowG) {
      d.shot.approachingCueShown = true;
      if (cuesFor(d).yieldCue) {
        x.say('info', 'shot-approaching', { target: RECIPE.targetYieldG });
        x.sound('timer');
      }
    }
    if (d.shot.yieldG >= MODEL.autoStopYieldG) stopShot(x, true);
  } else if (d.shot.status === 'settling') {
    d.shot.settleSec += dt;
    const frac = Math.min(1, d.shot.settleSec / MODEL.settleSec);
    d.shot.yieldG = (d.shot.stoppedAtG ?? 0) + MODEL.postStopDripG * frac;
    if (frac >= 1) {
      d.shot.status = 'done';
      d.basket = 'spent';
      const acc = scoreStop(d.shot.yieldG);
      const key = acc.direction === 'on' ? 'on-target' : acc.direction;
      x.sayText(
        acc.band === 'on-target' ? 'success' : 'info',
        'shot-stopped',
        fmt(STOP_FEEDBACK[key], {
          g: acc.finalYieldG.toFixed(1),
          target: acc.targetG,
          err: acc.errorG.toFixed(1),
          ratio: acc.ratio.toFixed(1),
        }),
      );
      x.sound('drip');
    }
  }

  if (d.flush.running) {
    d.flush.elapsedSec += dt;
    if (d.flush.elapsedSec >= MODEL.flushSec) {
      d.flush = { running: false, elapsedSec: MODEL.flushSec };
      d.flags.flushed = true;
      x.say('success', 'flush-done');
    }
  }
}

function finalize(x: Draft): MissionState {
  const { prev, d } = x;
  const before = currentStepIndex(prev);
  const after = currentStepIndex(d);
  const newly: StepId[] = [];
  for (let i = 0; i < after; i++) {
    const id = STEP_ORDER[i];
    if (d.metrics.stepTimes[id] === undefined) {
      d.metrics.stepTimes[id] = round1(d.metrics.elapsedSec);
      newly.push(id);
    }
  }
  if (newly.length > 0) {
    for (const step of newly) d.effects.push({ type: 'step-complete', step });
    const last = newly[newly.length - 1];
    const fb = d.feedback;
    // Keep a specific message from this action (e.g. "Shot stopped at 35.2 g", a tilt warning)
    // rather than the generic "Done: …"; the bare "Scale reads 0.0 g" is less useful than the step text.
    if (x.explicitFeedback && fb && fb.code !== 'tare-ok') {
      d.feedback = { ...fb, kind: fb.kind === 'info' ? 'success' : fb.kind, detail: fb.detail ?? STEPS[last].why, step: last };
    } else {
      x.say('success', 'step-complete', { title: STEPS[last].title }, STEPS[last].why);
      d.feedback = { ...d.feedback!, step: last };
    }
    d.effects.push(soundEffect('correct'));
  }
  if (after >= STEP_ORDER.length && before < STEP_ORDER.length) {
    d.status = 'complete';
    d.completedAtSec = round1(d.metrics.elapsedSec);
    d.hintUntilSec = null;
    x.say('success', 'mission-complete');
    d.effects.push({ type: 'mission-complete' }, soundEffect('complete'));
  }
  return d;
}
