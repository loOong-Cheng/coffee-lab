/**
 * Play helpers shared by every input mode (action list, 3D pointer, XR controllers):
 *  - listActions: every action that is valid RIGHT NOW (validated through the real reducer), labelled
 *  - coach: the guided tier's "suggested next step", using the expert bot's planner (no errors)
 *  - runningText: what is brewing, for the "while that brews…" hint
 *  - store: a tiny external store for React / the 3D scene
 */
import type { LocalizedText } from '../../domain/contracts';
import { CUPS, MILK_ML, SHOT_STYLES, SHOT_YIELD_ML, WATER_ML, type Extra } from '../../features/cafe/model';
import { createBot, decide, type Bot } from './bots';
import { PROCESS, type BotProfile, type RushLevelNo } from './config';
import { drinkName, hotWaterSec, steamSec } from './drinks';
import { actionText, customerName, fmtR, R } from './strings';
import { COUNTERS, SLOTS, itemIn, reduce, type Order, type PlayerAction, type RushState, type SlotId } from './sim';

const L = (zh: string, en: string): LocalizedText => ({ zh, en });
export const RUSH_EXTRAS: readonly Extra[] = ['chocolate', 'ice-cream', 'sugar', 'condensed-milk', 'milk-tea'];
const TEXTURES = ['steamed', 'microfoam', 'foam'] as const;

export type ActionGroup = 'serve' | 'hand' | 'station' | 'pick';
export interface ListAction {
  id: string;
  group: ActionGroup;
  action: PlayerAction;
  label: LocalizedText;
  recommended: boolean;
}

export function actionId(a: PlayerAction): string {
  switch (a.type) {
    case 'takeCup':
      return `takeCup:${a.size}`;
    case 'grab':
    case 'pour':
      return `${a.type}:${a.slot}`;
    case 'place':
      return a.slot.startsWith('counter') ? 'place:counter' : `place:${a.slot}`;
    case 'startShot':
      return `startShot:${a.group}:${a.style}`;
    case 'stopShot':
      return `stopShot:${a.group}`;
    case 'fillMilk':
    case 'dispenseWater':
      return `${a.type}:${a.ml}`;
    case 'steam':
      return `steam:${a.texture}`;
    case 'addExtra':
      return `addExtra:${a.extra}`;
    case 'serve':
      return `serve:${a.orderId}`;
    default:
      return a.type;
  }
}

function candidates(s: RushState): Array<[ActionGroup, PlayerAction]> {
  const out: Array<[ActionGroup, PlayerAction]> = [];
  const h = s.hand ? s.items[s.hand] : null;
  if (h?.kind === 'cup') for (const o of s.orders) out.push(['serve', { type: 'serve', orderId: o.id }]);
  if (h) {
    out.push(['hand', { type: 'addIce' }]);
    for (const extra of RUSH_EXTRAS) out.push(['hand', { type: 'addExtra', extra }]);
    for (const ml of MILK_ML) out.push(['hand', { type: 'fillMilk', ml }]);
    out.push(['hand', { type: 'knock' }]);
    for (const slot of SLOTS) if (!slot.startsWith('counter') || s.slots[slot]) out.push(['hand', { type: 'pour', slot }]);
    for (const slot of SLOTS) if (!slot.startsWith('counter')) out.push(['hand', { type: 'place', slot }]);
    const free = COUNTERS.find((c) => !s.slots[c]);
    if (free) out.push(['hand', { type: 'place', slot: free }]);
    out.push(['hand', { type: 'trash' }]);
  } else {
    for (const slot of SLOTS) if (s.slots[slot]) out.push(['pick', { type: 'grab', slot }]);
    for (const size of CUPS) out.push(['pick', { type: 'takeCup', size }]);
  }
  out.push(['station', { type: 'grind' }]);
  for (const group of [1, 2] as const) {
    out.push(['station', { type: 'stopShot', group }]);
    for (const style of SHOT_STYLES) out.push(['station', { type: 'startShot', group, style }]);
  }
  for (const texture of TEXTURES) out.push(['station', { type: 'steam', texture }]);
  for (const ml of WATER_ML) out.push(['station', { type: 'dispenseWater', ml }]);
  out.push(['station', { type: 'heatKettle' }]);
  return out;
}

/** Only actions the reducer would accept now, labelled; `recommended` marks the coach's suggestion. */
export function listActions(s: RushState, suggestion: PlayerAction | null = null): ListAction[] {
  if (s.status !== 'playing') return [];
  const rec = suggestion ? actionId(suggestion) : null;
  const seen = new Set<string>();
  const out: ListAction[] = [];
  for (const [group, action] of candidates(s)) {
    const id = actionId(action);
    if (seen.has(id) || !reduce(s, action).lastResult.ok) continue;
    seen.add(id);
    out.push({ id, group, action, label: actionText(s, action), recommended: id === rec });
  }
  return out;
}

/** Changes whenever the set of possible actions may change (not on every tick). */
export function listKey(s: RushState): string {
  const items = Object.values(s.items)
    .map((it) => (it.kind === 'cup' ? `${it.id}${it.adds.length}` : JSON.stringify(it)))
    .join();
  const m = s.m;
  // a running shot changes the key when it reaches the coach's "stop now" point, so the suggestion refreshes
  const shot = (g: (typeof m.groups)[number]) => (g ? (g.yieldG >= SHOT_YIELD_ML[g.style] - STOP_CUE_G ? 'cue' : 'run') : '-');
  const busy = [m.grinderMs > 0, shot(m.groups[0]), shot(m.groups[1]), m.wand ? m.wand.remainingMs > 0 : 'n', !!m.hotwater, m.kettleMs > 0, m.brewers.pourover.stage, m.brewers.phin.stage].join();
  return [s.status, s.hand, Object.values(s.slots).join(), items, busy, s.orders.map((o) => o.id).join()].join('|');
}

// ───────────────────────────── coach (guided tier) ─────────────────────────────
const COACH: BotProfile = { id: 'expert', latencySec: 1, latencyJitter: 0, errorRate: 0, planning: 'parallel', maxJobs: 2, triage: true, wandFirst: true };
export type Coach = Bot;
export const createCoach = (level: RushLevelNo): Coach => createBot(COACH, 1, level);

/** The coach says "stop now" this many grams before the target (about a third of a second at full flow). */
export const STOP_CUE_G = 3;

export function coachSuggest(coach: Coach, s: RushState): PlayerAction | null {
  if (s.status !== 'playing') return null;
  // A shot the player has to stop comes first: suggest Stop as it nears its target.
  if (s.shotControl === 'manual') {
    for (const group of [1, 2] as const) {
      const run = s.m.groups[group - 1];
      if (run && run.yieldG >= SHOT_YIELD_ML[run.style] - STOP_CUE_G) return { type: 'stopShot', group };
    }
  }
  const a = decide(coach, s);
  if (!a || a.type === 'tick' || a.type === 'pause' || a.type === 'resume' || a.type === 'reset' || a.type === 'setInput' || a.type === 'endShift') return null;
  return reduce(s, a).lastResult.ok ? a : null;
}

/** What is running right now ("the shot runs"), for the guided "while that brews…" hint. */
export function runningText(s: RushState): LocalizedText | null {
  const m = s.m;
  if (m.groups[0] || m.groups[1]) return L('浓缩萃取', 'the shot runs');
  if (m.wand && m.wand.remainingMs > 0) return L('打奶', 'the milk steams');
  if (m.brewers.pourover.stage === 'drawdown' || m.brewers.phin.stage === 'drawdown') return L('咖啡滴滤', 'the coffee drips');
  if (m.brewers.pourover.stage === 'bloom' || m.brewers.phin.stage === 'bloom') return L('闷蒸', 'the bloom settles');
  if (m.kettleMs > 0) return L('烧水', 'the kettle heats');
  if (m.grinderMs > 0) return L('磨豆', 'the grinder runs');
  if (m.hotwater) return L('出热水', 'the water runs');
  return null;
}

export function whileBrewsHint(s: RushState, suggestion: PlayerAction | null): LocalizedText | null {
  const p = runningText(s);
  if (!p || !suggestion) return null;
  const a = actionText(s, suggestion);
  return { zh: fmtR(R.whileBrews, { p: p.zh, a: a.zh }).zh, en: fmtR(R.whileBrews, { p: p.en, a: a.en }).en };
}

// ───────────────────────────── store ─────────────────────────────
export interface RushStore {
  get(): RushState;
  set(next: RushState): void;
  subscribe(fn: () => void): () => void;
  onEffects(fn: (effects: readonly string[], s: RushState) => void): () => void;
}

export function createRushStore(initial: RushState): RushStore {
  let state = initial;
  const ls = new Set<() => void>();
  const es = new Set<(e: readonly string[], s: RushState) => void>();
  return {
    get: () => state,
    set(next) {
      if (next === state) return;
      state = next;
      if (next.effects.length) for (const f of [...es]) f(next.effects, next);
      for (const f of [...ls]) f();
    },
    subscribe(fn) {
      ls.add(fn);
      return () => ls.delete(fn);
    },
    onEffects(fn) {
      es.add(fn);
      return () => es.delete(fn);
    },
  };
}

/** Which slots an action touches (3D highlight of the guided next step). */
export function slotsOf(a: PlayerAction | null): SlotId[] {
  if (!a) return [];
  switch (a.type) {
    case 'grab':
    case 'place':
    case 'pour':
      return [a.slot];
    case 'grind':
      return ['grinder'];
    case 'startShot':
    case 'stopShot':
      return [a.group === 1 ? 'group1' : 'group2'];
    case 'steam':
      return ['wand'];
    case 'dispenseWater':
      return ['hotwater'];
    case 'heatKettle':
      return ['kettleBase'];
    default:
      return [];
  }
}


// ───────────────────────────── 3D / XR targets ─────────────────────────────
/** Something you can point at on the counter: a slot, or a station used with the item in your hand. */
export type Target = SlotId | 'shelf' | 'ice' | 'extras' | 'fridge' | 'knock' | 'bin' | 'pass';
export const HAND_STATIONS = ['shelf', 'ice', 'extras', 'fridge', 'knock', 'bin', 'pass'] as const;

export function targetOf(a: PlayerAction): Target {
  switch (a.type) {
    case 'grab':
    case 'place':
    case 'pour':
      return a.slot;
    case 'grind':
      return 'grinder';
    case 'startShot':
    case 'stopShot':
      return a.group === 1 ? 'group1' : 'group2';
    case 'steam':
      return 'wand';
    case 'dispenseWater':
      return 'hotwater';
    case 'heatKettle':
      return 'kettleBase';
    case 'takeCup':
      return 'shelf';
    case 'addIce':
      return 'ice';
    case 'addExtra':
      return 'extras';
    case 'fillMilk':
      return 'fridge';
    case 'knock':
      return 'knock';
    case 'trash':
      return 'bin';
    case 'serve':
      return 'pass';
  }
}

/** Valid actions at one target (a click / tap / trigger on it). Putting down goes to that exact spot. */
export function actionsForTarget(s: RushState, target: Target): ListAction[] {
  const out = listActions(s).filter((a) => targetOf(a.action) === target);
  if (target.startsWith('counter') && s.hand && !s.slots[target as SlotId]) {
    const a: PlayerAction = { type: 'place', slot: target as SlotId };
    if (reduce(s, a).lastResult.ok) return [{ id: `place:${target}`, group: 'hand', action: a, label: actionText(s, a), recommended: false }];
  }
  return out;
}

/** 0..1 progress of the process running at a slot, or null when nothing runs there. */
export function processProgress(s: RushState, slot: SlotId): number | null {
  const m = s.m;
  const f = (left: number, totalSec: number) => Math.max(0, Math.min(1, 1 - left / (totalSec * 1000)));
  switch (slot) {
    case 'grinder':
      return m.grinderMs > 0 ? f(m.grinderMs, PROCESS.grind.sec) : null;
    case 'group1':
    case 'group2': {
      const g = m.groups[slot === 'group1' ? 0 : 1];
      return g ? Math.max(0, Math.min(1, g.yieldG / SHOT_YIELD_ML[g.style])) : null;
    }
    case 'wand': {
      const p = itemIn(s, 'wand');
      return m.wand && m.wand.remainingMs > 0 && p?.kind === 'pitcher' && p.milk ? f(m.wand.remainingMs, steamSec(p.milk.ml)) : null;
    }
    case 'hotwater':
      return m.hotwater ? f(m.hotwater.remainingMs, hotWaterSec(m.hotwater.ml)) : null;
    case 'kettleBase':
      return m.kettleMs > 0 ? f(m.kettleMs, PROCESS.kettle.sec) : null;
    case 'dripper':
    case 'phin': {
      const b = slot === 'dripper' ? 'pourover' : 'phin';
      const br = m.brewers[b];
      if (br.stage === 'bloom') return f(br.remainingMs, PROCESS.bloom[b].sec);
      if (br.stage === 'drawdown') return f(br.remainingMs, PROCESS.drawdown[b].sec);
      return null;
    }
    default:
      return null;
  }
}

/** Real-world reference for the process running at a slot (shown next to its game-time bar, QA-R04). */
export function processReal(s: RushState, slot: SlotId): LocalizedText | null {
  const m = s.m;
  switch (slot) {
    case 'grinder':
      return m.grinderMs > 0 ? PROCESS.grind.real : null;
    case 'group1':
    case 'group2': {
      const g = m.groups[slot === 'group1' ? 0 : 1];
      return g ? PROCESS.shot[g.style].real : null;
    }
    case 'wand':
      return m.wand && m.wand.remainingMs > 0 ? PROCESS.steam.real : null;
    case 'hotwater':
      return m.hotwater ? PROCESS.hotWater.real : null;
    case 'kettleBase':
      return m.kettleMs > 0 ? PROCESS.kettle.real : null;
    case 'dripper':
    case 'phin': {
      const b = slot === 'dripper' ? 'pourover' : 'phin';
      const st = m.brewers[b].stage;
      return st === 'bloom' ? PROCESS.bloom[b].real : st === 'drawdown' ? PROCESS.drawdown[b].real : null;
    }
    default:
      return null;
  }
}

// ───────────────────────────── screen-reader announcements ─────────────────────────────
/** A ticket shows "About to leave!" at or below this share of its patience. */
export const LEAVING_SHARE = 0.3;
export const isLeaving = (o: Pick<Order, 'remainingMs' | 'patienceMs'>): boolean =>
  o.remainingMs !== null && !!o.patienceMs && o.remainingMs / o.patienceMs <= LEAVING_SHARE;

/** Feedback that reaches the screen reader: every serve result, arrivals, walk-outs, process mistakes. */
const ANNOUNCE: Record<string, boolean> = {
  'serve-correct': true,
  'serve-partly': true,
  'serve-wrong': true,
  'order-timeout': true,
  'milk-overheated': true,
  'shot-wasted': true,
  'brew-wasted': true,
  'bloom-rushed': true,
  'shift-over': true,
  'order-in': false,
};

export interface AnnounceCursor {
  /** Shift attempt the cursor belongs to (a reset starts a new feedback log). */
  attempt: number;
  seq: number;
  leaving: readonly string[];
}
export interface Announcement {
  text: LocalizedText;
  /** Result of the player's own action or a loss: say it now. Otherwise (arrivals, leave cue) it may wait. */
  urgent: boolean;
}
export const announceCursor = (s: RushState): AnnounceCursor => ({ attempt: s.attempt, seq: s.seq.feedback, leaving: [] });

/**
 * What to announce since `cur` (pure; QA-R01). Reads the feedback log by sequence number, so it does not
 * matter how much game time passed in the same transition (e.g. the list cost ticking after a serve).
 * The "about to leave" cue is announced once per order, and only where the tier shows it.
 */
export function rushAnnouncements(s: RushState, cur: AnnounceCursor, leavingCue: boolean): { cursor: AnnounceCursor; items: Announcement[] } {
  const items: Announcement[] = [];
  const fresh = s.attempt !== cur.attempt; // a reset shift starts its log again
  const since = fresh ? 0 : cur.seq;
  for (const f of s.feedback) {
    if (f.seq <= since) continue;
    const urgent = ANNOUNCE[f.code];
    if (urgent !== undefined || f.kind === 'mistake') items.push({ text: f.text, urgent: urgent ?? true });
  }
  const leaving = leavingCue ? s.orders.filter(isLeaving).map((o) => o.id) : [];
  for (const o of s.orders) {
    if (!leaving.includes(o.id) || (!fresh && cur.leaving.includes(o.id))) continue;
    const c = customerName(o.customerId);
    const d = drinkName(o.drinkId);
    items.push({ text: { zh: fmtR(R.leavingAnn, { c: c.zh, d: d.zh }).zh, en: fmtR(R.leavingAnn, { c: c.en, d: d.en }).en }, urgent: false });
  }
  return { cursor: { attempt: s.attempt, seq: s.seq.feedback, leaving }, items };
}

/**
 * One polite live region, without flooding: urgent messages are said at once; arrivals and leave cues
 * are de-duplicated, capped and said at most once per `gapMs`. Timers are injectable for unit tests.
 */
export function createAnnounceQueue(
  say: (text: string) => void,
  opts: { gapMs?: number; now?: () => number; setTimer?: (fn: () => void, ms: number) => unknown; clearTimer?: (h: unknown) => void } = {},
) {
  const gap = opts.gapMs ?? 1500;
  const now = opts.now ?? (() => Date.now());
  const setTimer = opts.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
  const clearTimer = opts.clearTimer ?? ((h) => clearTimeout(h as ReturnType<typeof setTimeout>));
  let pending: string[] = [];
  let last = -Infinity;
  let timer: unknown = null;
  const emit = (text: string) => {
    say(text);
    last = now();
  };
  const flush = () => {
    timer = null;
    if (!pending.length) return;
    const wait = last + gap - now();
    if (wait > 0) {
      timer = setTimer(flush, wait);
      return;
    }
    emit(pending.splice(0).join(' '));
  };
  return {
    push(items: ReadonlyArray<{ text: string; urgent: boolean }>) {
      const urgent: string[] = [];
      for (const i of items) {
        const list = i.urgent ? urgent : pending;
        if (i.text && !list.includes(i.text)) list.push(i.text);
      }
      if (pending.length > 3) pending = pending.slice(-3);
      if (urgent.length) emit(urgent.join(' '));
      if (pending.length && timer === null) timer = setTimer(flush, Math.max(0, last + gap - now()));
    },
    dispose() {
      if (timer !== null) clearTimer(timer);
      timer = null;
      pending = [];
    },
  };
}
