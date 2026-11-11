/**
 * Café Rush — pure deterministic simulation (no rendering, no Babylon, no React).
 *
 * One discrete ACTION API shared by the 3D scene, the XR controllers and the accessible keyboard
 * action list (M2): `reduce(state, action)`. Time advances only through `{ type: 'tick' }`, which
 * runs whole FIXED_STEP_MS steps (remainder carried), so the same seed + the same action/tick
 * sequence always gives the same state. All clocks are COMPRESSED GAME TIME.
 *
 * Model: one pair of hands (holds one item). Items sit in SLOTS. Station verbs either act on a slot
 * (grind, startShot, steam, dispenseWater, heatKettle) or on the held item at a counter station
 * (knock, fillMilk, addIce, addExtra, trash, serve). `pour` moves the held vessel's contents into a slot.
 */
import type { Guidance, LocalizedText } from '../../domain/contracts';
import type { CupSize, Extra, MilkMl, ShotStyle, WaterMl } from '../../features/cafe/model';
import { CUSTOMERS } from '../../features/cafe/specs';
import { FIXED_STEP_MS, LEVELS, PROCESS, RELAXED, SCORING, type RushLevelNo } from './config';
import { basePoints, drinkName, hotWaterSec, steamSec, workEstimateSec, type Brewer } from './drinks';
import { explain, judge, judgementSummary, type Addition, type Explanation, type RushDiff } from './judge';
import { rngNext } from './rng';

const L = (zh: string, en: string): LocalizedText => ({ zh, en });

// ───────────────────────────── world ─────────────────────────────
export const COUNTERS = ['counter1', 'counter2', 'counter3', 'counter4', 'counter5', 'counter6', 'counter7', 'counter8'] as const;
export const SLOTS = ['grinder', 'group1', 'group2', 'tray1', 'tray2', 'wand', 'hotwater', 'kettleBase', 'dripper', 'phin', ...COUNTERS] as const;
export type SlotId = (typeof SLOTS)[number];
export type GroupNo = 1 | 2;
export type SteamTexture = 'steamed' | 'microfoam' | 'foam';

export interface CupItem {
  id: string;
  kind: 'cup';
  size: CupSize;
  adds: readonly Addition[];
}
export interface PortafilterItem {
  id: string;
  kind: 'portafilter';
  load: 'empty' | 'ground' | 'puck';
}
export interface PitcherMilk {
  ml: number;
  state: 'cold' | 'steaming' | SteamTexture;
  overheated: boolean;
}
export interface PitcherItem {
  id: string;
  kind: 'pitcher';
  milk: PitcherMilk | null;
}
export interface KettleItem {
  id: string;
  kind: 'kettle';
  hot: boolean;
  pours: number;
}
export interface DoserItem {
  id: string;
  kind: 'doser';
  filled: boolean;
}
export type Item = CupItem | PortafilterItem | PitcherItem | KettleItem | DoserItem;
export type ItemKind = Item['kind'];

export interface BrewerState {
  grounds: boolean;
  stage: 'idle' | 'bloom' | 'bloomed' | 'drawdown';
  remainingMs: number;
  bloomed: boolean;
}

export interface Machines {
  grinderMs: number;
  groups: [{ style: ShotStyle; remainingMs: number } | null, { style: ShotStyle; remainingMs: number } | null];
  /** Non-null while a pitcher is on the wand being / having been steamed. */
  wand: { texture: SteamTexture; remainingMs: number; readyMs: number } | null;
  hotwater: { ml: number; remainingMs: number } | null;
  kettleMs: number;
  brewers: Record<Brewer, BrewerState>;
}

export interface Order {
  id: string;
  drinkId: string;
  customerId: string;
  arrivedMs: number;
  /** null in Relaxed mode (no countdown). */
  patienceMs: number | null;
  remainingMs: number | null;
  points: number;
}

export type Outcome = 'correct' | 'partly' | 'timeout' | 'open';
export interface OrderRecord {
  orderId: string;
  drinkId: string;
  outcome: Outcome;
  arrivedMs: number;
  closedMs: number;
  base: number;
  points: number;
  tip: number;
  streakBonus: number;
  diffs: readonly RushDiff[];
}

export type FeedbackKind = 'success' | 'info' | 'warn' | 'mistake';
export interface RushFeedback {
  seq: number;
  atMs: number;
  kind: FeedbackKind;
  code: string;
  text: LocalizedText;
  /** What differs and why (serves). */
  details?: readonly Explanation[];
  orderId?: string;
}

export interface RushStats {
  points: number;
  tips: number;
  streak: number;
  bestStreak: number;
  correct: number;
  partly: number;
  wrongServes: number;
  timeouts: number;
  wasted: number;
  overheated: number;
  actions: number;
  rejected: number;
  lastActionMs: number;
}

export type RushMode = 'standard' | 'relaxed';
export type RushStatus = 'playing' | 'paused' | 'over';

export interface RushState {
  level: RushLevelNo;
  mode: RushMode;
  guidance: Guidance;
  seed: number;
  attempt: number;
  rng: number;
  status: RushStatus;
  tMs: number;
  accMs: number;
  shiftMs: number;
  nextArrivalMs: number;
  lastDrinkId: string | null;
  seq: { order: number; item: number; feedback: number };
  orders: Order[];
  records: readonly OrderRecord[];
  items: Record<string, Item>;
  slots: Record<SlotId, string | null>;
  hand: string | null;
  m: Machines;
  stats: RushStats;
  feedback: readonly RushFeedback[];
  lastResult: { ok: boolean; code: string };
  /** Events of the last transition (sound / visual cues for M2). */
  effects: readonly string[];
}

// ───────────────────────────── actions ─────────────────────────────
export type RushAction =
  | { type: 'takeCup'; size: CupSize }
  | { type: 'grab'; slot: SlotId }
  | { type: 'place'; slot: SlotId }
  | { type: 'grind' }
  | { type: 'knock' }
  | { type: 'startShot'; group: GroupNo; style: ShotStyle }
  | { type: 'fillMilk'; ml: MilkMl }
  | { type: 'steam'; texture: SteamTexture }
  | { type: 'dispenseWater'; ml: WaterMl }
  | { type: 'heatKettle' }
  | { type: 'addIce' }
  | { type: 'addExtra'; extra: Extra }
  | { type: 'pour'; slot: SlotId }
  | { type: 'serve'; orderId: string }
  | { type: 'trash' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'endShift' }
  | { type: 'reset' }
  | { type: 'tick'; dtSec: number };

export type PlayerAction = Exclude<RushAction, { type: 'pause' | 'resume' | 'endShift' | 'reset' | 'tick' }>;

export interface ShiftOptions {
  level: RushLevelNo;
  seed: number;
  mode?: RushMode;
  guidance?: Guidance;
  attempt?: number;
}

const FEEDBACK_KEEP = 12;
const sec = (s: number) => Math.round(s * 1000);
const EMPTY_BREWER: BrewerState = { grounds: false, stage: 'idle', remainingMs: 0, bloomed: false };

export function createShift(o: ShiftOptions): RushState {
  const mode = o.mode ?? 'standard';
  const cfg = LEVELS[o.level];
  const slots = Object.fromEntries(SLOTS.map((s) => [s, null])) as Record<SlotId, string | null>;
  const items: Record<string, Item> = {
    pf1: { id: 'pf1', kind: 'portafilter', load: 'empty' },
    pf2: { id: 'pf2', kind: 'portafilter', load: 'empty' },
    pitcher1: { id: 'pitcher1', kind: 'pitcher', milk: null },
    pitcher2: { id: 'pitcher2', kind: 'pitcher', milk: null },
    doser: { id: 'doser', kind: 'doser', filled: false },
    kettle: { id: 'kettle', kind: 'kettle', hot: false, pours: 0 },
  };
  slots.group1 = 'pf1';
  slots.group2 = 'pf2';
  slots.counter1 = 'pitcher1';
  slots.counter2 = 'pitcher2';
  slots.counter3 = 'doser';
  slots.kettleBase = 'kettle';
  return {
    level: o.level,
    mode,
    guidance: o.guidance ?? 'guided',
    seed: o.seed,
    attempt: o.attempt ?? 1,
    rng: o.seed >>> 0,
    status: 'playing',
    tMs: 0,
    accMs: 0,
    shiftMs: sec(cfg.shiftSec),
    nextArrivalMs: sec(cfg.firstArrivalSec),
    lastDrinkId: null,
    seq: { order: 0, item: 0, feedback: 0 },
    orders: [],
    records: [],
    items,
    slots,
    hand: null,
    m: {
      grinderMs: 0,
      groups: [null, null],
      wand: null,
      hotwater: null,
      kettleMs: 0,
      brewers: { pourover: { ...EMPTY_BREWER }, phin: { ...EMPTY_BREWER } },
    },
    stats: {
      points: 0,
      tips: 0,
      streak: 0,
      bestStreak: 0,
      correct: 0,
      partly: 0,
      wrongServes: 0,
      timeouts: 0,
      wasted: 0,
      overheated: 0,
      actions: 0,
      rejected: 0,
      lastActionMs: 0,
    },
    feedback: [],
    lastResult: { ok: true, code: 'start' },
    effects: [],
  };
}

/** Copy containers; nested objects are replaced (never mutated) by the rules below. */
function draft(s: RushState): RushState {
  const items: Record<string, Item> = {};
  for (const k in s.items) items[k] = { ...s.items[k]! };
  const m = s.m;
  return {
    ...s,
    seq: { ...s.seq },
    orders: s.orders.map((o) => ({ ...o })),
    items,
    slots: { ...s.slots },
    m: {
      grinderMs: m.grinderMs,
      groups: [m.groups[0] && { ...m.groups[0] }, m.groups[1] && { ...m.groups[1] }],
      wand: m.wand && { ...m.wand },
      hotwater: m.hotwater && { ...m.hotwater },
      kettleMs: m.kettleMs,
      brewers: { pourover: { ...m.brewers.pourover }, phin: { ...m.brewers.phin } },
    },
    stats: { ...s.stats },
    effects: [],
  };
}

// ───────────────────────────── queries (also used by M2 + bots) ─────────────────────────────
export const slotOf = (s: RushState, itemId: string): SlotId | null => {
  for (const k of SLOTS) if (s.slots[k] === itemId) return k;
  return null;
};
export const itemIn = (s: RushState, slot: SlotId): Item | null => {
  const id = s.slots[slot];
  return id ? s.items[id]! : null;
};
export const held = (s: RushState): Item | null => (s.hand ? s.items[s.hand]! : null);
export const brewerOfSlot = (slot: SlotId): Brewer | null => (slot === 'dripper' ? 'pourover' : slot === 'phin' ? 'phin' : null);
export const slotOfBrewer = (b: Brewer): SlotId => (b === 'pourover' ? 'dripper' : 'phin');
export const groupOfSlot = (slot: SlotId): GroupNo | null => (slot === 'group1' || slot === 'tray1' ? 1 : slot === 'group2' || slot === 'tray2' ? 2 : null);

const ACCEPTS: Partial<Record<SlotId, readonly ItemKind[]>> = {
  grinder: ['portafilter', 'doser'],
  group1: ['portafilter'],
  group2: ['portafilter'],
  tray1: ['cup'],
  tray2: ['cup'],
  hotwater: ['cup'],
  dripper: ['cup'],
  phin: ['cup'],
  wand: ['pitcher'],
  kettleBase: ['kettle'],
};
export const slotAccepts = (slot: SlotId, kind: ItemKind): boolean => ACCEPTS[slot]?.includes(kind) ?? true;

/** True while a running process holds the item in this slot in place. */
export function slotLocked(s: RushState, slot: SlotId): boolean {
  switch (slot) {
    case 'grinder':
      return s.m.grinderMs > 0;
    case 'group1':
    case 'tray1':
      return s.m.groups[0] !== null;
    case 'group2':
    case 'tray2':
      return s.m.groups[1] !== null;
    case 'wand':
      return (s.m.wand?.remainingMs ?? 0) > 0;
    case 'hotwater':
      return s.m.hotwater !== null;
    case 'kettleBase':
      return s.m.kettleMs > 0;
    case 'dripper':
    case 'phin': {
      const st = s.m.brewers[brewerOfSlot(slot)!].stage;
      return st === 'bloom' || st === 'drawdown';
    }
    default:
      return false;
  }
}

// ───────────────────────────── messages ─────────────────────────────
const MSG = {
  handsFull: L('手里已经拿着东西了——先放下。', 'Your hands are full — put something down first.'),
  handsEmpty: L('手里没有东西。', 'You are not holding anything.'),
  slotEmpty: L('那里没有东西。', 'Nothing there.'),
  slotBusy: L('那里已经有东西了。', 'That spot is taken.'),
  locked: L('正在运行——等它完成。', 'It is running — wait for it to finish.'),
  wrongSlot: L('这件东西不能放在那里。', 'That item does not go there.'),
  needPf: L('冲煮头上没有手柄。', 'No portafilter in that group head.'),
  noCoffee: L('手柄里还没有咖啡粉——先去磨豆。', 'The basket is empty — grind first.'),
  usedPuck: L('手柄里是用过的粉饼——先敲掉再磨新的。', 'That basket holds a used puck — knock it out and grind fresh.'),
  knockFirst: L('先把用过的粉饼敲掉。', 'Knock out the used puck first.'),
  alreadyGround: L('已经有咖啡粉了。', 'Already filled with grounds.'),
  grinderEmpty: L('磨豆机下面没有手柄或粉杯。', 'Put a portafilter or the dosing cup under the grinder.'),
  groupBusy: L('这个冲煮头正在萃取。', 'That group is already pulling a shot.'),
  notPf: L('只能敲手柄。', 'Only a portafilter can be knocked out.'),
  nothingToKnock: L('手柄是空的。', 'The basket is already empty.'),
  notPitcher: L('先拿起一个奶缸。', 'Pick up a milk pitcher first.'),
  pitcherFull: L('奶缸里已经有奶了。', 'The pitcher already has milk.'),
  pitcherEmpty: L('奶缸是空的——先去冰箱倒奶。', 'The pitcher is empty — fill it at the fridge.'),
  noPitcherOnWand: L('蒸汽棒下面没有奶缸。', 'No pitcher on the steam wand.'),
  alreadySteamed: L('这缸奶已经打过了。', 'This milk is already steamed.'),
  noCupUnderWater: L('热水口下面没有杯子。', 'No cup under the hot-water spout.'),
  noKettle: L('水壶不在底座上。', 'The kettle is not on its base.'),
  kettleHot: L('水壶已经是热的。', 'The kettle is already hot.'),
  notCup: L('先拿起一个杯子。', 'Pick up a cup first.'),
  alreadyIced: L('已经加过冰了。', 'Ice is already in.'),
  alreadyAdded: L('这个已经加过了。', 'Already added.'),
  noCupThere: L('那里没有杯子。', 'There is no cup there.'),
  notBrewer: L('只能倒进手冲滤杯或越南滴滤壶。', 'Pour into the dripper or the phin.'),
  groundsAlready: L('滤杯里已经有咖啡粉了。', 'There are already grounds in there.'),
  noGrounds: L('先放咖啡粉（磨好的粉杯）。', 'Add grounds first (from the dosing cup).'),
  kettleCold: L('水壶还没烧热。', 'The kettle is not hot yet.'),
  alreadyPouring: L('正在滴滤——等它滴完。', 'Already dripping — let it finish.'),
  cannotPour: L('这个不能倒。', 'You cannot pour that.'),
  dosingEmpty: L('粉杯是空的——先去磨豆。', 'The dosing cup is empty — grind first.'),
  noOrder: L('这张订单已经不在了。', 'That order is no longer open.'),
  cannotTrash: L('这个不用倒掉。', 'Nothing to throw away there.'),
  notPlaying: L('班次未在进行。', 'The shift is not running.'),
};

// ───────────────────────────── helpers on a draft ─────────────────────────────
type Res = { ok: true; code: string } | { ok: false; code: string; text: LocalizedText };
const ok = (code: string): Res => ({ ok: true, code });
const fail = (code: string, text: LocalizedText): Res => ({ ok: false, code, text });

function say(d: RushState, kind: FeedbackKind, code: string, text: LocalizedText, extra?: Partial<RushFeedback>) {
  d.seq.feedback += 1;
  const f: RushFeedback = { seq: d.seq.feedback, atMs: d.tMs, kind, code, text, ...extra };
  d.feedback = [...d.feedback.slice(-(FEEDBACK_KEEP - 1)), f];
}
const fx = (d: RushState, e: string) => {
  d.effects = [...d.effects, e];
};
function rand(d: RushState): number {
  const [v, n] = rngNext(d.rng);
  d.rng = n;
  return v;
}
function addTo(d: RushState, cupId: string, a: Addition) {
  const c = d.items[cupId] as CupItem;
  d.items[cupId] = { ...c, adds: [...c.adds, a] };
}
const shotMs = (style: ShotStyle) => sec(PROCESS.shot[style].sec);

// ───────────────────────────── player actions ─────────────────────────────
function apply(d: RushState, a: PlayerAction): Res {
  const h = held(d);
  switch (a.type) {
    case 'takeCup': {
      if (h) return fail('hands-full', MSG.handsFull);
      d.seq.item += 1;
      const id = `cup${d.seq.item}`;
      d.items[id] = { id, kind: 'cup', size: a.size, adds: [] };
      d.hand = id;
      return ok('cup-taken');
    }
    case 'grab': {
      if (h) return fail('hands-full', MSG.handsFull);
      const id = d.slots[a.slot];
      if (!id) return fail('slot-empty', MSG.slotEmpty);
      if (slotLocked(d, a.slot)) return fail('locked', MSG.locked);
      d.slots[a.slot] = null;
      d.hand = id;
      if (a.slot === 'wand') d.m.wand = null;
      return ok('grabbed');
    }
    case 'place': {
      if (!h) return fail('hands-empty', MSG.handsEmpty);
      if (d.slots[a.slot]) return fail('slot-busy', MSG.slotBusy);
      if (!slotAccepts(a.slot, h.kind)) return fail('wrong-slot', MSG.wrongSlot);
      d.slots[a.slot] = h.id;
      d.hand = null;
      return ok('placed');
    }
    case 'grind': {
      const it = itemIn(d, 'grinder');
      if (!it) return fail('grinder-empty', MSG.grinderEmpty);
      if (d.m.grinderMs > 0) return fail('locked', MSG.locked);
      if (it.kind === 'portafilter') {
        if (it.load === 'puck') return fail('knock-first', MSG.knockFirst);
        if (it.load === 'ground') return fail('already-ground', MSG.alreadyGround);
      } else if (it.kind === 'doser' && it.filled) return fail('already-ground', MSG.alreadyGround);
      d.m.grinderMs = sec(PROCESS.grind.sec);
      fx(d, 'grind-start');
      return ok('grinding');
    }
    case 'knock': {
      if (!h || h.kind !== 'portafilter') return fail('not-pf', MSG.notPf);
      if (h.load === 'empty') return fail('nothing-to-knock', MSG.nothingToKnock);
      d.items[h.id] = { ...h, load: 'empty' };
      fx(d, 'knock');
      return ok('knocked');
    }
    case 'startShot': {
      const gi = a.group - 1;
      const pf = itemIn(d, a.group === 1 ? 'group1' : 'group2');
      if (!pf || pf.kind !== 'portafilter') return fail('no-pf', MSG.needPf);
      if (d.m.groups[gi]) return fail('group-busy', MSG.groupBusy);
      if (pf.load === 'empty') return fail('no-coffee', MSG.noCoffee);
      if (pf.load === 'puck') return fail('used-puck', MSG.usedPuck);
      d.m.groups[gi] = { style: a.style, remainingMs: shotMs(a.style) };
      fx(d, 'shot-start');
      return ok('shot-started');
    }
    case 'fillMilk': {
      if (!h || h.kind !== 'pitcher') return fail('not-pitcher', MSG.notPitcher);
      if (h.milk) return fail('pitcher-full', MSG.pitcherFull);
      d.items[h.id] = { ...h, milk: { ml: a.ml, state: 'cold', overheated: false } };
      return ok('milk-filled');
    }
    case 'steam': {
      const p = itemIn(d, 'wand');
      if (!p || p.kind !== 'pitcher') return fail('no-pitcher', MSG.noPitcherOnWand);
      if (!p.milk) return fail('pitcher-empty', MSG.pitcherEmpty);
      if (p.milk.state !== 'cold' || d.m.wand) return fail('already-steamed', MSG.alreadySteamed);
      d.items[p.id] = { ...p, milk: { ...p.milk, state: 'steaming' } };
      d.m.wand = { texture: a.texture, remainingMs: sec(steamSec(p.milk.ml)), readyMs: 0 };
      fx(d, 'steam-start');
      return ok('steaming');
    }
    case 'dispenseWater': {
      const c = itemIn(d, 'hotwater');
      if (!c || c.kind !== 'cup') return fail('no-cup', MSG.noCupUnderWater);
      if (d.m.hotwater) return fail('locked', MSG.locked);
      d.m.hotwater = { ml: a.ml, remainingMs: sec(hotWaterSec(a.ml)) };
      return ok('water-running');
    }
    case 'heatKettle': {
      const k = itemIn(d, 'kettleBase');
      if (!k || k.kind !== 'kettle') return fail('no-kettle', MSG.noKettle);
      if (d.m.kettleMs > 0) return fail('locked', MSG.locked);
      if (k.hot && k.pours > 0) return fail('kettle-hot', MSG.kettleHot);
      d.m.kettleMs = sec(PROCESS.kettle.sec);
      return ok('kettle-heating');
    }
    case 'addIce': {
      if (!h || h.kind !== 'cup') return fail('not-cup', MSG.notCup);
      if (h.adds.some((x) => x.k === 'ice')) return fail('already-iced', MSG.alreadyIced);
      addTo(d, h.id, { k: 'ice' });
      return ok('iced');
    }
    case 'addExtra': {
      if (!h || h.kind !== 'cup') return fail('not-cup', MSG.notCup);
      if (h.adds.some((x) => x.k === 'extra' && x.extra === a.extra)) return fail('already-added', MSG.alreadyAdded);
      addTo(d, h.id, { k: 'extra', extra: a.extra });
      return ok('extra-added');
    }
    case 'pour':
      return pour(d, h, a.slot);
    case 'serve':
      return serve(d, h, a.orderId);
    case 'trash': {
      if (!h) return fail('hands-empty', MSG.handsEmpty);
      if (h.kind === 'cup') {
        delete d.items[h.id];
        d.hand = null;
      } else if (h.kind === 'pitcher' && h.milk) d.items[h.id] = { ...h, milk: null };
      else if (h.kind === 'doser' && h.filled) d.items[h.id] = { ...h, filled: false };
      else if (h.kind === 'portafilter' && h.load !== 'empty') d.items[h.id] = { ...h, load: 'empty' };
      else return fail('cannot-trash', MSG.cannotTrash);
      fx(d, 'trash');
      return ok('trashed');
    }
  }
}

function pour(d: RushState, h: Item | null, slot: SlotId): Res {
  if (!h) return fail('hands-empty', MSG.handsEmpty);
  const target = itemIn(d, slot);
  if (h.kind === 'pitcher') {
    if (!h.milk || h.milk.state === 'steaming') return fail('pitcher-empty', MSG.pitcherEmpty);
    if (!target || target.kind !== 'cup') return fail('no-cup', MSG.noCupThere);
    const texture = h.milk.state === 'cold' ? 'cold' : h.milk.state;
    addTo(d, target.id, { k: 'milk', texture, ml: h.milk.ml, overheated: h.milk.overheated });
    d.items[h.id] = { ...h, milk: null };
    fx(d, 'pour-milk');
    return ok('milk-poured');
  }
  const b = brewerOfSlot(slot);
  if (h.kind === 'doser') {
    if (!b) return fail('not-brewer', MSG.notBrewer);
    if (!h.filled) return fail('doser-empty', MSG.dosingEmpty);
    const br = d.m.brewers[b];
    if (br.grounds || br.stage !== 'idle') return fail('grounds-already', MSG.groundsAlready);
    d.m.brewers[b] = { ...br, grounds: true };
    d.items[h.id] = { ...h, filled: false };
    return ok('grounds-added');
  }
  if (h.kind === 'kettle') {
    if (!b) return fail('not-brewer', MSG.notBrewer);
    if (!h.hot || h.pours <= 0) return fail('kettle-cold', MSG.kettleCold);
    const br = d.m.brewers[b];
    if (!br.grounds) return fail('no-grounds', MSG.noGrounds);
    if (br.stage === 'drawdown') return fail('already-pouring', MSG.alreadyPouring);
    if (br.stage === 'idle') {
      d.m.brewers[b] = { ...br, stage: 'bloom', remainingMs: sec(PROCESS.bloom[b].sec) };
      fx(d, 'bloom-start');
      return ok('bloom-started');
    }
    const bloomed = br.stage === 'bloomed';
    d.m.brewers[b] = { ...br, stage: 'drawdown', remainingMs: sec(PROCESS.drawdown[b].sec), bloomed };
    const pours = h.pours - 1;
    d.items[h.id] = { ...h, pours, hot: pours > 0 };
    if (!bloomed) say(d, 'warn', 'bloom-rushed', L('闷蒸还没结束就开始注水了。', 'Main pour started before the bloom finished.'));
    fx(d, 'pour-water');
    return ok('drawdown-started');
  }
  return fail('cannot-pour', MSG.cannotPour);
}

function serve(d: RushState, h: Item | null, orderId: string): Res {
  if (!h || h.kind !== 'cup') return fail('not-cup', MSG.notCup);
  const idx = d.orders.findIndex((o) => o.id === orderId);
  if (idx < 0) return fail('no-order', MSG.noOrder);
  const o = d.orders[idx]!;
  const j = judge(h, o.drinkId);
  const details = j.diffs.map((x) => explain(o.drinkId, x));
  const summary = judgementSummary(j);
  if (j.status === 'incorrect') {
    d.stats.wrongServes += 1;
    d.stats.streak = 0;
    say(d, 'mistake', 'serve-wrong', L(`${summary.zh} 杯子还给你——可以调整或倒掉重做。`, `${summary.en} The cup comes back to you — fix it or start fresh.`), {
      details,
      orderId,
    });
    fx(d, 'serve-wrong');
    return ok('serve-wrong');
  }
  const correct = j.status === 'correct';
  const st = d.stats;
  let tip = 0;
  let bonus = 0;
  let points: number;
  if (correct) {
    st.correct += 1;
    st.streak += 1;
    st.bestStreak = Math.max(st.bestStreak, st.streak);
    bonus = Math.min(SCORING.streakCap, SCORING.streakStep * (st.streak - 1));
    if (o.patienceMs && o.remainingMs !== null) tip = Math.round(o.points * SCORING.tipMaxShare * Math.max(0, o.remainingMs / o.patienceMs));
    points = o.points + tip + bonus;
  } else {
    st.partly += 1;
    st.streak = 0;
    points = Math.round(o.points * SCORING.partlyShare);
  }
  st.points += points;
  st.tips += tip;
  d.records = [
    ...d.records,
    { orderId, drinkId: o.drinkId, outcome: correct ? 'correct' : 'partly', arrivedMs: o.arrivedMs, closedMs: d.tMs, base: o.points, points, tip, streakBonus: bonus, diffs: j.diffs },
  ];
  d.orders.splice(idx, 1);
  delete d.items[h.id];
  d.hand = null;
  const plus = L(` +${points}`, ` +${points}`);
  say(d, correct ? 'success' : 'info', correct ? 'serve-correct' : 'serve-partly', L(summary.zh + plus.zh, summary.en + plus.en), { details, orderId });
  fx(d, correct ? 'serve-correct' : 'serve-partly');
  if (d.mode === 'relaxed' && st.correct + st.partly >= RELAXED.orders) finish(d);
  return ok(correct ? 'serve-correct' : 'serve-partly');
}

// ───────────────────────────── time ─────────────────────────────
function finish(d: RushState) {
  if (d.status === 'over') return;
  d.status = 'over';
  const open = d.orders.map<OrderRecord>((o) => ({
    orderId: o.id,
    drinkId: o.drinkId,
    outcome: 'open',
    arrivedMs: o.arrivedMs,
    closedMs: d.tMs,
    base: o.points,
    points: 0,
    tip: 0,
    streakBonus: 0,
    diffs: [],
  }));
  d.records = [...d.records, ...open];
  d.orders = [];
  say(d, 'info', 'shift-over', L('打烊了！看看这一班的总结。', 'Closing time! Here is your shift summary.'));
  fx(d, 'shift-over');
}

function pickDrink(d: RushState): string {
  const mix = LEVELS[d.level].mix;
  const total = mix.reduce((s, m) => s + m.weight, 0);
  const roll = () => {
    let r = rand(d) * total;
    for (const m of mix) {
      r -= m.weight;
      if (r < 0) return m.drinkId;
    }
    return mix[mix.length - 1]!.drinkId;
  };
  const first = roll();
  return first === d.lastDrinkId ? roll() : first;
}

const lerp = (a: number, b: number, f: number) => a + (b - a) * Math.min(1, Math.max(0, f));

function spawnOrder(d: RushState) {
  const cfg = LEVELS[d.level];
  const drinkId = pickDrink(d);
  const customer = CUSTOMERS[Math.floor(rand(d) * CUSTOMERS.length)]!;
  const f = d.tMs / d.shiftMs;
  const patienceMs =
    d.mode === 'relaxed' ? null : sec((workEstimateSec(drinkId) * cfg.patienceMult + cfg.patienceSlackSec) * lerp(1, cfg.rampPatienceEnd, f));
  d.seq.order += 1;
  const o: Order = {
    id: `o${d.seq.order}`,
    drinkId,
    customerId: customer.id,
    arrivedMs: d.tMs,
    patienceMs,
    remainingMs: patienceMs,
    points: basePoints(drinkId),
  };
  d.orders = [...d.orders, o];
  d.lastDrinkId = drinkId;
  const name = drinkName(drinkId);
  say(d, 'info', 'order-in', L(`${customer.name.zh}：一杯${name.zh}。`, `${customer.name.en}: one ${name.en}.`), { orderId: o.id });
  fx(d, 'order-in');
  if (d.mode === 'relaxed') {
    d.nextArrivalMs = d.tMs + sec(RELAXED.arrivalGapSec);
  } else {
    const gap = cfg.arrivalSec * lerp(1, cfg.rampArrivalEnd, f) * (1 + cfg.arrivalJitter * (2 * rand(d) - 1));
    d.nextArrivalMs = d.tMs + sec(gap);
  }
}

function step(d: RushState) {
  const dt = FIXED_STEP_MS;
  d.tMs += dt;
  const m = d.m;

  if (m.grinderMs > 0) {
    m.grinderMs = Math.max(0, m.grinderMs - dt);
    if (m.grinderMs === 0) {
      const it = itemIn(d, 'grinder');
      if (it?.kind === 'portafilter') d.items[it.id] = { ...it, load: 'ground' };
      else if (it?.kind === 'doser') d.items[it.id] = { ...it, filled: true };
      fx(d, 'grind-done');
    }
  }

  for (const gi of [0, 1] as const) {
    const g = m.groups[gi];
    if (!g) continue;
    g.remainingMs -= dt;
    if (g.remainingMs > 0) continue;
    m.groups[gi] = null;
    const pf = itemIn(d, gi === 0 ? 'group1' : 'group2');
    if (pf?.kind === 'portafilter') d.items[pf.id] = { ...pf, load: 'puck' };
    const cup = itemIn(d, gi === 0 ? 'tray1' : 'tray2');
    if (cup?.kind === 'cup') {
      addTo(d, cup.id, { k: 'shot', style: g.style });
      fx(d, 'shot-done');
    } else {
      d.stats.wasted += 1;
      say(d, 'mistake', 'shot-wasted', L(`${gi + 1} 号冲煮头下面没有杯子——这份浓缩流进了滴水盘。`, `No cup under group ${gi + 1} — that shot went into the drip tray.`));
    }
  }

  if (m.wand) {
    const w = m.wand;
    const p = itemIn(d, 'wand');
    if (w.remainingMs > 0) {
      w.remainingMs -= dt;
      if (w.remainingMs <= 0) {
        w.remainingMs = 0;
        if (p?.kind === 'pitcher' && p.milk) d.items[p.id] = { ...p, milk: { ...p.milk, state: w.texture } };
        fx(d, 'steam-done');
      }
    } else {
      w.readyMs += dt;
      if (d.mode === 'standard' && w.readyMs >= sec(PROCESS.overheatAfterSec) && p?.kind === 'pitcher' && p.milk && !p.milk.overheated) {
        d.items[p.id] = { ...p, milk: { ...p.milk, overheated: true } };
        d.stats.overheated += 1;
        say(d, 'warn', 'milk-overheated', L(`奶在蒸汽棒上放太久，过热了——倒掉重打。（${PROCESS.overheatReal.zh}）`, `The milk sat on the wand too long and overheated — pour it away and start fresh (${PROCESS.overheatReal.en}).`));
      }
    }
  }

  if (m.hotwater) {
    m.hotwater.remainingMs -= dt;
    if (m.hotwater.remainingMs <= 0) {
      const cup = itemIn(d, 'hotwater');
      if (cup?.kind === 'cup') addTo(d, cup.id, { k: 'water', ml: m.hotwater.ml });
      m.hotwater = null;
      fx(d, 'water-done');
    }
  }

  if (m.kettleMs > 0) {
    m.kettleMs = Math.max(0, m.kettleMs - dt);
    if (m.kettleMs === 0) {
      const k = itemIn(d, 'kettleBase');
      if (k?.kind === 'kettle') d.items[k.id] = { ...k, hot: true, pours: PROCESS.kettle.pours };
      fx(d, 'kettle-done');
    }
  }

  for (const b of ['pourover', 'phin'] as const) {
    const br = m.brewers[b];
    if (br.stage !== 'bloom' && br.stage !== 'drawdown') continue;
    br.remainingMs -= dt;
    if (br.remainingMs > 0) continue;
    if (br.stage === 'bloom') {
      m.brewers[b] = { ...br, stage: 'bloomed', remainingMs: 0 };
      fx(d, 'bloom-done');
      continue;
    }
    const cup = itemIn(d, slotOfBrewer(b));
    if (cup?.kind === 'cup') {
      addTo(d, cup.id, { k: 'brew', brewer: b, bloomed: br.bloomed });
      fx(d, 'brew-done');
    } else {
      d.stats.wasted += 1;
      say(d, 'mistake', 'brew-wasted', L('滤杯下面没有杯子——咖啡流掉了。', 'No cup under the brewer — the coffee ran away.'));
    }
    m.brewers[b] = { ...EMPTY_BREWER };
  }

  if (d.mode === 'standard') {
    const gone: Order[] = [];
    for (const o of d.orders) {
      if (o.remainingMs === null) continue;
      o.remainingMs -= dt;
      if (o.remainingMs <= 0) gone.push(o);
    }
    for (const o of gone) {
      d.orders = d.orders.filter((x) => x !== o);
      d.stats.timeouts += 1;
      d.stats.streak = 0;
      d.records = [
        ...d.records,
        { orderId: o.id, drinkId: o.drinkId, outcome: 'timeout', arrivedMs: o.arrivedMs, closedMs: d.tMs, base: o.points, points: 0, tip: 0, streakBonus: 0, diffs: [] },
      ];
      const name = drinkName(o.drinkId);
      say(
        d,
        'warn',
        'order-timeout',
        L(`等${name.zh}的客人先走了。小技巧：浓缩在萃取时，去准备奶或下一杯。`, `The customer waiting for a ${name.en} had to go. Tip: while a shot runs, prep milk or the next cup.`),
        { orderId: o.id },
      );
      fx(d, 'order-timeout');
    }
  }

  const cfg = LEVELS[d.level];
  if (d.mode === 'standard') {
    const open = d.tMs <= d.shiftMs - sec(cfg.lastCallSec);
    if (open && d.tMs >= d.nextArrivalMs && d.orders.length < cfg.maxOpenOrders) spawnOrder(d);
    if (d.tMs >= d.shiftMs) finish(d);
  } else {
    const st = d.stats;
    if (d.tMs >= d.nextArrivalMs && d.orders.length < RELAXED.maxOpenOrders && st.correct + st.partly + d.orders.length < RELAXED.orders) spawnOrder(d);
  }
}

export function tick(s: RushState, dtSec: number): RushState {
  if (s.status !== 'playing' || !(dtSec > 0)) return s;
  const d = draft(s);
  d.accMs += Math.round(dtSec * 1000);
  while (d.accMs >= FIXED_STEP_MS && d.status === 'playing') {
    d.accMs -= FIXED_STEP_MS;
    step(d);
  }
  return d;
}

/** The one entry point: player actions, meta actions and time. */
export function reduce(s: RushState, a: RushAction): RushState {
  switch (a.type) {
    case 'tick':
      return tick(s, a.dtSec);
    case 'pause':
      if (s.status !== 'playing') return s;
      return { ...s, status: 'paused', effects: ['pause'] };
    case 'resume':
      if (s.status !== 'paused') return s;
      return { ...s, status: 'playing', effects: ['resume'] };
    case 'reset':
      return createShift({ level: s.level, seed: s.seed + 1, mode: s.mode, guidance: s.guidance, attempt: s.attempt + 1 });
    case 'endShift': {
      if (s.status === 'over') return s;
      const d = draft(s);
      finish(d);
      return d;
    }
    default: {
      const d = draft(s);
      if (s.status !== 'playing') {
        d.lastResult = { ok: false, code: 'not-playing' };
        say(d, 'warn', 'not-playing', MSG.notPlaying);
        return d;
      }
      const r = apply(d, a);
      d.stats.actions += 1;
      d.stats.lastActionMs = d.tMs;
      d.lastResult = { ok: r.ok, code: r.code };
      if (!r.ok) {
        d.stats.rejected += 1;
        say(d, 'warn', r.code, r.text);
      }
      return d;
    }
  }
}
