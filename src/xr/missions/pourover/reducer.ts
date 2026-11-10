/**
 * "pourover-bloom" pure state machine. Physical pours are continuous: adapters
 * report kettle tilt + stream offset (KETTLE); TICK moves water with the
 * illustrative model. Workflow slips get specific, gentle feedback; the
 * current step is derived, so nothing dead-ends.
 */
import type { Guidance, LocalizedText } from '../../../domain/contracts';
import type { FeedbackKind, HandId, InputSource } from '../../mission/types';
import type { CoreAction, CoreState } from '../../mission/core';
import { cuesOf, emptyMetrics, hintWindow, reduceMeta } from '../../mission/core';
import { TIERS, evaluateSnap } from '../../mission/tiers';
import { FEEDBACK, GUIDANCE_LABEL, fmt } from '../../mission/content';
import { POUR, addFlow, classifyStream, drainRate, flowFromTilt, tiltForFlow, type FlowStats, type StreamSpot } from './model';
import { P, POUR_STEPS, pourInfo, type PourItem, type PourPart, type PourStep, type PourZone } from './content';

export type PourAction =
  | CoreAction
  | { type: 'GRAB'; item: PourItem; hand: HandId; source?: InputSource }
  | { type: 'RELEASE'; hand: HandId; zone?: PourZone; distanceM?: number; source?: InputSource }
  /** Continuous kettle pose from the adapter: tilt (deg) and stream offset from the dripper centre (m, null = not over it). */
  | { type: 'KETTLE'; tiltDeg?: number; offsetM?: number | null; source?: InputSource }
  /**
   * A measured pour (action list / accessibility): tip the held kettle at a steady
   * flow until about `grams` have left the spout, then tip it back. Simulated time
   * advances by the pour's duration — no real-time reflexes needed.
   */
  | { type: 'POUR_PULSE'; grams: number; flowGps?: number; source?: InputSource }
  | { type: 'PRESS'; button: 'tare'; source?: InputSource }
  | { type: 'SKIP_WAIT'; source?: InputSource }
  | { type: 'LOCATE'; target: PourPart; source?: InputSource };

type Sfx = 'tap' | 'select' | 'correct' | 'incorrect' | 'complete' | 'pour' | 'drip' | 'timer' | 'snap' | 'whoosh' | 'reset';

export interface PourState extends CoreState {
  missionId: 'pourover-bloom';
  items: Record<PourItem, { zone: PourZone; heldBy: HandId | null }>;
  filterIn: boolean;
  groundsIn: boolean;
  tareG: number;
  kettleG: number;
  tiltDeg: number;
  offsetM: number | null;
  /** Water sitting in the dripper (incl. what the grounds hold). */
  bedG: number;
  carafeG: number;
  rinseG: number;
  rinseDiscarded: boolean;
  /** Water poured onto the grounds (centre/bed/wall) — the brew water for the ratio. */
  brewG: number;
  wallG: number;
  spillG: number;
  pour: { active: boolean; quietSec: number; kind: 'rinse' | 'brew'; g: number; wallG: number; spillG: number; flaggedWall: boolean; flaggedSpill: boolean; spot: StreamSpot };
  /** Brew pours after the bloom. */
  stagePours: number;
  bloom: { pouredG: number; endedAtSec: number | null; waitedSec: number; skipped: boolean; cutShort: boolean };
  brewStartSec: number | null;
  drawdownDoneSec: number | null;
  drawdownSkipped: boolean;
  flowStats: FlowStats;
  flags: { taredAfterGrounds: boolean; pourBeforeTare: boolean; overshoot: boolean; approaching: boolean };
  stepTimes: Partial<Record<PourStep, number>>;
  effects: Array<{ type: string; name?: Sfx }>;
}

export const POUR_HOME: Record<PourItem, PourZone> = { filter: 'filter-stack', grounds: 'grounds-spot', carafe: 'scale', kettle: 'kettle-base' };
export const POUR_ZONES: Record<PourItem, PourZone[]> = {
  filter: ['dripper'],
  grounds: ['dripper'],
  carafe: ['scale', 'sink'],
  kettle: ['kettle-base'],
};
const ITEMS: readonly PourItem[] = ['filter', 'grounds', 'carafe', 'kettle'];
const r1 = (n: number) => Math.round(n * 10) / 10;

export function createPour(guidance: Guidance = 'guided', carry?: { resets: number; attempt: number; seq: number }): PourState {
  return {
    missionId: 'pourover-bloom',
    status: 'playing',
    guidance,
    guidanceUsed: [guidance],
    attempt: carry?.attempt ?? 1,
    hintUntilSec: null,
    feedback: carry ? { seq: carry.seq + 1, kind: 'info', code: 'reset', text: FEEDBACK.reset } : null,
    effects: carry ? [{ type: 'reset' }, { type: 'sound', name: 'reset' }] : [],
    metrics: emptyMetrics(carry?.resets ?? 0),
    completedAtSec: null,
    items: {
      filter: { zone: 'filter-stack', heldBy: null },
      grounds: { zone: 'grounds-spot', heldBy: null },
      carafe: { zone: 'scale', heldBy: null },
      kettle: { zone: 'kettle-base', heldBy: null },
    },
    filterIn: false,
    groundsIn: false,
    tareG: 0,
    kettleG: POUR.kettleCapacityG,
    tiltDeg: 0,
    offsetM: null,
    bedG: 0,
    carafeG: 0,
    rinseG: 0,
    rinseDiscarded: false,
    brewG: 0,
    wallG: 0,
    spillG: 0,
    pour: { active: false, quietSec: 0, kind: 'rinse', g: 0, wallG: 0, spillG: 0, flaggedWall: false, flaggedSpill: false, spot: 'off' },
    stagePours: 0,
    bloom: { pouredG: 0, endedAtSec: null, waitedSec: 0, skipped: false, cutShort: false },
    brewStartSec: null,
    drawdownDoneSec: null,
    drawdownSkipped: false,
    flowStats: { w: 0, s1: 0, s2: 0 },
    flags: { taredAfterGrounds: false, pourBeforeTare: false, overshoot: false, approaching: false },
    stepTimes: {},
  };
}

// ── derived ──
export const isAtP = (s: PourState, item: PourItem, zone: PourZone) => s.items[item].heldBy === null && s.items[item].zone === zone;
export function freeWaterG(s: Pick<PourState, 'bedG' | 'groundsIn'>): number {
  return Math.max(0, s.bedG - (s.groundsIn ? POUR.doseG * POUR.retainedPerDose : 0));
}
export function grossLoadG(s: PourState): number {
  if (!isAtP(s, 'carafe', 'scale')) return 0;
  return POUR.carafeMassG + POUR.dripperMassG + (s.filterIn ? POUR.filterMassG : 0) + (s.groundsIn ? POUR.doseG : 0) + s.bedG + s.carafeG;
}
export const scaleReading = (s: PourState) => r1(grossLoadG(s) - s.tareG);
export const kettleFlow = (s: PourState) => (s.items.kettle.heldBy ? flowFromTilt(s.tiltDeg, s.kettleG / POUR.kettleCapacityG) : 0);
const bloomWaitDone = (s: PourState) => s.bloom.endedAtSec !== null && (s.bloom.waitedSec >= POUR.bloomWaitMinSec || s.bloom.skipped || s.bloom.cutShort);

export function isPourStepDone(s: PourState, step: PourStep): boolean {
  switch (step) {
    case 'place-filter':
      return s.filterIn;
    case 'rinse':
      return s.rinseG >= POUR.rinseMinG || s.groundsIn;
    case 'discard':
      return (s.rinseDiscarded && isAtP(s, 'carafe', 'scale') && s.carafeG + freeWaterG(s) <= 0.5) || s.groundsIn;
    case 'add-grounds':
      return s.groundsIn;
    case 'tare':
      return s.flags.taredAfterGrounds || s.bloom.endedAtSec !== null;
    case 'bloom':
      return s.bloom.endedAtSec !== null;
    case 'bloom-wait':
      return bloomWaitDone(s);
    case 'pour':
      return bloomWaitDone(s) && s.brewG >= POUR.finishMinG && !s.pour.active;
    case 'drawdown':
      return s.drawdownDoneSec !== null;
  }
}
export function pourStepIndex(s: PourState): number {
  const i = POUR_STEPS.findIndex((id) => !isPourStepDone(s, id));
  return i === -1 ? POUR_STEPS.length : i;
}
export const currentPourStep = (s: PourState): PourStep | null => POUR_STEPS[pourStepIndex(s)] ?? null;

export type PourCue =
  | { kind: 'grab'; item: PourItem; zone?: PourZone }
  | { kind: 'place'; item: PourItem; zone: PourZone }
  | { kind: 'press' }
  | { kind: 'pour'; toG: number; rinse: boolean }
  | { kind: 'wait' };

export function pourCue(s: PourState): PourCue | null {
  const step = currentPourStep(s);
  if (!step || s.status !== 'playing') return null;
  const move = (item: PourItem, zone: PourZone): PourCue => (s.items[item].heldBy ? { kind: 'place', item, zone } : { kind: 'grab', item, zone });
  switch (step) {
    case 'place-filter':
      return move('filter', 'dripper');
    case 'rinse':
      return { kind: 'pour', toG: POUR.rinseMinG + 5, rinse: true };
    case 'discard':
      if (freeWaterG(s) > 0.5) return { kind: 'wait' };
      return s.carafeG > 0.5 || s.items.carafe.zone !== 'sink' ? move('carafe', 'sink') : move('carafe', 'scale');
    case 'add-grounds':
      return move('grounds', 'dripper');
    case 'tare':
      return { kind: 'press' };
    case 'bloom':
      return { kind: 'pour', toG: POUR.bloomIdealG, rinse: false };
    case 'bloom-wait':
    case 'drawdown':
      return { kind: 'wait' };
    case 'pour':
      return { kind: 'pour', toG: POUR.targetWaterG, rinse: false };
  }
}

// ── reducer ──
export function pourReducer(s: PourState, a: PourAction): PourState {
  const meta = reduceMeta(s, a as { type: string }, (g, carry) => createPour(g, carry), {
    paused: FEEDBACK.paused,
    resumed: FEEDBACK.resumed,
    guidance: (g) => fmt(FEEDBACK['guidance-changed'], { tier: GUIDANCE_LABEL[g] }),
  });
  if (meta) return meta;
  if (s.status !== 'playing') return s;
  if (a.type === 'TICK' && !(a.dtSec > 0)) return s;
  if (a.type === 'PAUSE' || a.type === 'RESUME' || a.type === 'RESET' || a.type === 'SET_GUIDANCE') return s;

  const d: PourState = {
    ...s,
    items: { filter: { ...s.items.filter }, grounds: { ...s.items.grounds }, carafe: { ...s.items.carafe }, kettle: { ...s.items.kettle } },
    pour: { ...s.pour },
    bloom: { ...s.bloom },
    flags: { ...s.flags },
    stepTimes: { ...s.stepTimes },
    effects: [],
    metrics: { ...s.metrics, mistakes: [...s.metrics.mistakes], actionsBySource: { ...s.metrics.actionsBySource } },
  };
  let seq = s.feedback?.seq ?? 0;
  let explicit = false;
  const say = (kind: FeedbackKind, code: string, text: LocalizedText, detail?: LocalizedText) => {
    d.feedback = { seq: ++seq, kind, code, text, detail };
    explicit = true;
  };
  const sound = (name: Sfx) => d.effects.push({ type: 'sound', name });
  const mistake = (code: keyof typeof P.fb, vars: Record<string, string | number> = {}) => {
    const step = currentPourStep(d);
    (d.metrics.mistakes as Array<{ code: string; atSec: number }>).push({ code, atSec: r1(d.metrics.elapsedSec) });
    say('mistake', code, fmt(P.fb[code], vars), step ? P.steps[step].why : undefined);
    sound('incorrect');
  };
  const learner = (src: InputSource | undefined) => {
    d.metrics.actionsBySource[src ?? 'test'] += 1;
    d.metrics.idleSec = 0;
  };
  const heldBy = (hand: HandId) => ITEMS.find((i) => d.items[i].heldBy === hand) ?? null;
  const home = (item: PourItem) => {
    d.items[item] = { zone: POUR_HOME[item], heldBy: null };
    d.effects.push({ type: 'return-home' });
  };

  switch (a.type) {
    case 'TICK':
      tick(d, Math.min(a.dtSec, 0.25), { say, sound, mistake });
      break;
    case 'REQUEST_HINT': {
      learner(a.source);
      d.metrics.hintsUsed += 1;
      d.hintUntilSec = hintWindow(d);
      const step = currentPourStep(d);
      if (step) say('info', 'hint', fmt(FEEDBACK.hint, { title: P.steps[step].title, instruction: a.source === 'xr' ? P.steps[step].doXr : P.steps[step].doScreen }), P.steps[step].why);
      sound('select');
      break;
    }
    case 'LOCATE': {
      learner(a.source);
      const info = pourInfo(a.target);
      say('info', 'inspect', fmt(P.fb.inspect, { name: info.name, purpose: info.purpose }));
      sound('tap');
      break;
    }
    case 'GRAB': {
      learner(a.source);
      const inHand = heldBy(a.hand);
      if (inHand === a.item) return s;
      if (inHand) {
        say('info', 'hand-full', FEEDBACK['hand-full']);
        break;
      }
      if (a.item === 'filter' && d.filterIn) {
        say('info', 'filter-in', P.fb['filter-in']);
        break;
      }
      if (a.item === 'grounds' && d.groundsIn) {
        say('info', 'grounds-in', P.fb['grounds-in']);
        break;
      }
      d.items[a.item].heldBy = a.hand;
      if (a.item === 'kettle') {
        d.tiltDeg = 0;
        d.offsetM = null;
      }
      d.effects.push({ type: 'grab' });
      sound('select');
      break;
    }
    case 'RELEASE': {
      const item = heldBy(a.hand);
      if (!item) return s;
      learner(a.source);
      if (item === 'kettle') {
        d.tiltDeg = 0;
        d.offsetM = null;
        d.kettleG = POUR.kettleCapacityG; // simulated refill on its base
        endPour(d, { say });
        home('kettle');
        sound('snap');
        break;
      }
      const zone = a.zone && POUR_ZONES[item].includes(a.zone) ? a.zone : undefined;
      const snap = zone ? evaluateSnap(TIERS[d.guidance], a.distanceM ?? 0) : null;
      if (!zone || snap?.result !== 'snap') {
        if (zone && snap?.result === 'near') say('info', 'near-miss', FEEDBACK['near-miss']);
        home(item);
        sound('whoosh');
        break;
      }
      place(d, item, zone, { say, sound, mistake, home });
      break;
    }
    case 'KETTLE': {
      if (!d.items.kettle.heldBy) return s;
      if (a.tiltDeg !== undefined) d.tiltDeg = Math.max(0, Math.min(120, a.tiltDeg));
      if (a.offsetM !== undefined) d.offsetM = a.offsetM;
      const startsPour = !s.pour.active && kettleFlow(d) > 0 && kettleFlow(s) === 0;
      if (startsPour) learner(a.source);
      else if (d.tiltDeg === s.tiltDeg && d.offsetM === s.offsetM) return s;
      break;
    }
    case 'POUR_PULSE': {
      if (!d.items.kettle.heldBy || !(a.grams > 0)) return s;
      learner(a.source);
      const tools = { say, sound, mistake };
      const want = Math.min(a.grams, POUR.maxPulseG);
      const gps = Math.max(0.5, Math.min(POUR.maxFlowGps, a.flowGps ?? POUR.pulseFlowGps));
      let poured = 0;
      for (let i = 0; i < 2000 && poured < want - 0.01 && d.kettleG > 0; i++) {
        d.tiltDeg = tiltForFlow(gps, d.kettleG / POUR.kettleCapacityG);
        const f = kettleFlow(d);
        if (!(f > 0)) break;
        const before = d.kettleG;
        tick(d, Math.min(0.1, (want - poured) / f), tools);
        poured += before - d.kettleG;
      }
      d.tiltDeg = 0;
      tick(d, POUR.pourEndGapSec, tools); // the pause that ends this pour
      break;
    }
    case 'PRESS': {
      learner(a.source);
      sound('tap');
      if (d.pour.active) {
        say('info', 'tare-during-pour', P.fb['tare-during-pour']);
        break;
      }
      d.tareG = grossLoadG(d);
      if (!d.groundsIn) say('info', 'tare-early', P.fb['tare-early']);
      else {
        d.flags.taredAfterGrounds = true;
        say('info', 'tare-ok', P.fb['tare-ok']);
      }
      break;
    }
    case 'SKIP_WAIT': {
      learner(a.source);
      const step = currentPourStep(d);
      if (step === 'bloom-wait') {
        d.bloom.skipped = true;
        say('info', 'skipped', P.fb.skipped);
      } else if (step === 'drawdown' || (step === 'discard' && freeWaterG(d) > 0)) {
        d.carafeG += freeWaterG(d);
        d.bedG -= freeWaterG(d);
        if (step === 'drawdown') d.drawdownSkipped = true;
        say('info', 'skipped', P.fb.skipped);
      } else say('info', 'nothing-to-skip', P.fb['nothing-to-skip']);
      break;
    }
  }
  finalize(s, d, explicit, { say, sound });
  return d;
}

type Tools = {
  say: (kind: FeedbackKind, code: string, text: LocalizedText, detail?: LocalizedText) => void;
  sound: (name: Sfx) => void;
  mistake: (code: keyof typeof P.fb, vars?: Record<string, string | number>) => void;
};

function place(d: PourState, item: PourItem, zone: PourZone, t: Tools & { home: (i: PourItem) => void }) {
  if (item === 'filter') {
    d.filterIn = true;
    d.items.filter = { zone: 'dripper', heldBy: null };
    d.effects.push({ type: 'snap' });
    t.sound('snap');
    return;
  }
  if (item === 'grounds') {
    if (!d.filterIn) return void (t.mistake('grounds-no-filter'), t.home('grounds'));
    if (d.rinseG < POUR.rinseMinG) return void (t.mistake('grounds-before-rinse'), t.home('grounds'));
    if (d.carafeG + freeWaterG(d) > 0.5) return void (t.mistake('grounds-before-discard'), t.home('grounds'));
    d.groundsIn = true;
    t.home('grounds');
    d.effects.push({ type: 'snap' });
    t.sound('snap');
    return;
  }
  // carafe
  if (zone === 'sink') {
    if (d.groundsIn) return void (t.mistake('discard-coffee'), t.home('carafe'));
    const had = d.carafeG + d.bedG;
    d.carafeG = 0;
    d.bedG = 0;
    d.items.carafe = { zone: 'sink', heldBy: null };
    if (had > 0.5) {
      if (d.rinseG >= POUR.rinseMinG) d.rinseDiscarded = true;
      t.say('success', 'discard-ok', P.fb['discard-ok']);
      t.sound('whoosh');
    } else t.say('info', 'discard-empty', P.fb['discard-empty']);
    return;
  }
  d.items.carafe = { zone: 'scale', heldBy: null };
  d.effects.push({ type: 'snap' });
  t.sound('snap');
}

function tick(d: PourState, dt: number, t: Tools) {
  d.metrics.elapsedSec += dt;
  d.metrics.idleSec += dt;
  const flow = kettleFlow(d);
  const out = Math.min(flow * dt, d.kettleG);
  if (out > 0) {
    d.metrics.idleSec = 0;
    d.kettleG -= out;
    const spot = classifyStream(d.offsetM);
    if (!d.pour.active) {
      const kind = d.groundsIn ? 'brew' : 'rinse';
      d.pour = { active: true, quietSec: 0, kind, g: 0, wallG: 0, spillG: 0, flaggedWall: false, flaggedSpill: false, spot };
      if (kind === 'brew') {
        d.brewStartSec ??= d.metrics.elapsedSec;
        if (!d.flags.taredAfterGrounds && !d.flags.pourBeforeTare) {
          d.flags.pourBeforeTare = true;
          t.mistake('pour-before-tare');
        }
        if (d.bloom.endedAtSec !== null) {
          if (!bloomWaitDone(d)) {
            d.bloom.cutShort = true;
            t.mistake('bloom-cut-short', { s: Math.round(d.bloom.waitedSec) });
          }
          d.stagePours += 1;
        }
      }
      if (spot !== 'off' && !d.filterIn) t.mistake('pour-no-filter');
      t.sound('pour');
    }
    d.pour.quietSec = 0;
    d.pour.spot = spot;
    d.pour.g += out;
    if (spot === 'off') {
      d.spillG += out;
      d.pour.spillG += out;
      if (d.pour.spillG > POUR.spillWarnG && !d.pour.flaggedSpill) {
        d.pour.flaggedSpill = true;
        t.mistake('spill');
      }
    } else {
      if (!d.filterIn) d.carafeG += out;
      else d.bedG += out;
      if (d.pour.kind === 'rinse') {
        if (d.filterIn) d.rinseG += out;
      } else {
        d.brewG += out;
        if (d.bloom.endedAtSec === null) d.bloom.pouredG += out;
        d.flowStats = addFlow(d.flowStats, flow, dt);
        if (spot === 'wall') {
          d.wallG += out;
          d.pour.wallG += out;
          if (d.pour.wallG > POUR.wallWarnG && !d.pour.flaggedWall) {
            d.pour.flaggedWall = true;
            t.mistake('pour-wall');
          }
        }
        if (bloomWaitDone(d) && d.brewG >= POUR.approachG && !d.flags.approaching && cuesOf(d).yieldCue) {
          d.flags.approaching = true;
          t.say('info', 'approaching', fmt(P.fb.approaching, { g: Math.round(d.brewG) }));
          t.sound('timer');
        }
        if (d.brewG > POUR.overshootWarnG && !d.flags.overshoot) {
          d.flags.overshoot = true;
          t.say('warn', 'overshoot', fmt(P.fb.overshoot, { g: Math.round(d.brewG) }));
        }
      }
    }
  } else if (d.pour.active) {
    d.pour.quietSec += dt;
    if (d.pour.quietSec >= POUR.pourEndGapSec) endPour(d, t);
  }
  if (d.items.kettle.heldBy && d.kettleG <= 0 && d.tiltDeg > 0 && d.feedback?.code !== 'kettle-empty') t.say('info', 'kettle-empty', P.fb['kettle-empty']);
  // drain
  const free = freeWaterG(d);
  if (free > 0) {
    const g = Math.min(free, drainRate(free, d.groundsIn) * dt);
    d.bedG -= g;
    d.carafeG += g;
  }
  if (d.bloom.endedAtSec !== null && !bloomWaitDone(d)) {
    d.bloom.waitedSec += dt;
    if (bloomWaitDone(d)) {
      t.say('success', 'bloom-waited', fmt(P.fb['bloom-waited'], { s: Math.round(d.bloom.waitedSec) }));
      t.sound('timer');
    }
  }
  if (d.drawdownDoneSec === null && isPourStepDone(d, 'pour') && freeWaterG(d) < 1) d.drawdownDoneSec = d.metrics.elapsedSec;
}

/** A pour ends after a short pause without flow, or when the kettle is put down. */
function endPour(d: PourState, t: Pick<Tools, 'say'>) {
  if (!d.pour.active) return;
  d.pour.active = false;
  if (d.pour.kind === 'brew' && d.bloom.endedAtSec === null) {
    const g = Math.round(d.bloom.pouredG);
    if (d.bloom.pouredG >= POUR.bloomMinG) {
      d.bloom.endedAtSec = d.metrics.elapsedSec;
      const big = d.bloom.pouredG > POUR.bloomMaxG;
      t.say(big ? 'warn' : 'success', big ? 'bloom-big' : 'bloom-ok', fmt(P.fb[big ? 'bloom-big' : 'bloom-ok'], { g }));
    } else t.say('info', 'bloom-more', fmt(P.fb['bloom-more'], { g }));
  } else if (d.pour.kind === 'brew' && d.brewG < POUR.finishMinG) {
    t.say('info', 'keep-going', fmt(P.fb['keep-going'], { g: Math.round(d.brewG) }));
  }
}

function finalize(prev: PourState, d: PourState, explicit: boolean, t: Pick<Tools, 'say' | 'sound'>) {
  const before = pourStepIndex(prev);
  const after = pourStepIndex(d);
  const newly: PourStep[] = [];
  for (let i = 0; i < after; i++) {
    const id = POUR_STEPS[i]!;
    if (d.stepTimes[id] === undefined) {
      d.stepTimes[id] = r1(d.metrics.elapsedSec);
      newly.push(id);
    }
  }
  if (newly.length) {
    const last = newly[newly.length - 1]!;
    for (let i = 0; i < newly.length; i++) d.effects.push({ type: 'step-complete' });
    if (!explicit || d.feedback?.kind === 'info') {
      if (!explicit) t.say('success', 'step-complete', fmt(P.fb['step-complete'], { title: P.steps[last].title }), P.steps[last].why);
      else if (d.feedback) d.feedback = { ...d.feedback, kind: 'success', detail: d.feedback.detail ?? P.steps[last].why };
    }
    t.sound('correct');
  }
  if (after >= POUR_STEPS.length && before < POUR_STEPS.length) {
    d.status = 'complete';
    d.completedAtSec = r1(d.metrics.elapsedSec);
    d.hintUntilSec = null;
    d.pour.active = false;
    t.say('success', 'mission-complete', P.fb.complete);
    d.effects.push({ type: 'mission-complete' });
    t.sound('complete');
  }
}

export const pourCues = (s: PourState) => cuesOf(s);
