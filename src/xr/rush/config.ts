/**
 * Café Rush — EVERY tunable lives here (process times, patience, arrivals, order mix, scoring, bots).
 *
 * Times are COMPRESSED GAME TIME. Each process carries the real-world reference shown on its label;
 * the numeric references come from `src/content/drinks.ts` (timeNote / steps / milk notes) and a unit
 * test checks they still appear there. Processes without a sourced number say so qualitatively.
 */
import type { LocalizedText } from '../../domain/contracts';
import type { ShotStyle } from '../../features/cafe/model';

const L = (zh: string, en: string): LocalizedText => ({ zh, en });

/** Simulation fixed step. All internal clocks are integer milliseconds. */
export const FIXED_STEP_MS = 100;

export interface TimedProcess {
  /** Game seconds (compressed). */
  sec: number;
  /** Real-world reference for the label, e.g. "real shot ≈25–35 s". */
  real: LocalizedText;
}

/**
 * Espresso flow (illustrative, in game time): a few seconds of pre-infusion with nothing in the cup, then a steady
 * stream. Chosen so the wall's targets take about as long as the earlier fixed timers — 24 g ≈ 5.7 s, 36 g = 7 s,
 * 54 g = 9 s — so the tuned difficulty holds. The player stops the shot; what reaches the cup decides the style.
 */
export const SHOT_FLOW = {
  doseG: 18,
  preinfusionSec: 3,
  gPerSec: 9,
  /** A forgotten shot stops itself here (1:3.5, very long). */
  maxG: 63,
  /** Guided tier: the machine stops a manual shot this far past the target, so it still counts. */
  guidedGraceG: 4,
} as const;
/** Grams in the cup after `elapsedSec` of a running shot. */
export const shotYieldAt = (elapsedSec: number): number => Math.max(0, (elapsedSec - SHOT_FLOW.preinfusionSec) * SHOT_FLOW.gPerSec);
/** The style a yield counts as: midway between the wall's 24 / 36 / 54 g targets (1:1.3 / 1:2 / 1:3). */
export const styleForYield = (g: number): ShotStyle => (g < 30 ? 'ristretto' : g < 45 ? 'normal' : 'lungo');

export const PROCESS = {
  grind: { sec: 2.5, real: L('真实：通常几秒钟，取决于磨豆机', 'real: usually a few seconds, depends on the grinder') },
  shot: {
    ristretto: { sec: 6, real: L('真实短萃常见 20–30 秒', 'real ristretto commonly 20–30 s') },
    normal: { sec: 7, real: L('真实浓缩约 25–35 秒', 'real shot about 25–35 s') },
    lungo: { sec: 9, real: L('真实长萃常见 30–45 秒', 'real lungo commonly 30–45 s') },
  } satisfies Record<ShotStyle, TimedProcess>,
  steam: {
    baseSec: 3,
    per100MlSec: 2.5,
    real: L('真实：取决于蒸汽功率和奶量；常在约 55–65 °C 停', 'real: depends on wand power and milk volume; many stop at about 55–65 °C'),
  },
  /** Standard mode only: milk left on the wand this long after "ready" overheats (Relaxed: never). */
  overheatAfterSec: 6,
  overheatReal: L('真实：约 70 °C 以上，奶往往有煮过的味道，奶泡也会变差', 'real: around 70 °C and above milk tends to taste cooked and the foam suffers'),
  hotWater: { minSec: 1, per100MlSec: 1.2, real: L('真实：几秒钟', 'real: a few seconds') },
  kettle: { sec: 12, pours: 4, real: L('真实：普通水壶要几分钟', 'real: a few minutes on a typical kettle') },
  bloom: {
    pourover: { sec: 5, real: L('真实闷蒸 30–45 秒', 'real bloom 30–45 s') },
    phin: { sec: 4, real: L('真实闷蒸约 30 秒', 'real bloom about 30 s') },
  },
  drawdown: {
    pourover: { sec: 9, real: L('真实整杯约 2:30–4:00', 'real total about 2:30–4:00') },
    phin: { sec: 12, real: L('真实滴滤约 4–5 分钟', 'real drip about 4–5 minutes') },
  },
} as const;

/**
 * Action-list play: each action also costs this much game time (no reach time otherwise). Not in Relaxed
 * mode, and WAIVED on L1–L2 (see `LevelConfig.listCost`): QA gate #2 measured a guided first-timer at
 * ~1.4–2.2 s per list action — slower than the average 3D reach (1.3 s) — so on the learning levels the
 * surcharge only double-charged the phone / keyboard / screen-reader players (QA-R09).
 */
export const INPUT_COST = { listActionCostSec: 0.5 };
/** Game seconds one action-list action costs on a level (Standard mode). */
export const listCostSec = (level: RushLevelNo): number => (LEVELS[level].listCost ? INPUT_COST.listActionCostSec : 0);

/**
 * How a shift is played: `direct` = 3D counter / WebXR (point, tap or reach), `list` = the action list
 * (keyboard / screen reader / phone). Set when the shift starts; the 3D → list fallback switches it.
 */
export type RushInput = 'direct' | 'list';

// ───────────────────────────── patience ─────────────────────────────
export const PATIENCE = {
  /** Handling time per required action when estimating how long a drink takes (s). */
  perActionSec: 1.3,
};

// ───────────────────────────── levels ─────────────────────────────
export type RushLevelNo = 1 | 2 | 3 | 4 | 5;
export const RUSH_LEVELS: readonly RushLevelNo[] = [1, 2, 3, 4, 5];

export interface MixEntry {
  drinkId: string;
  weight: number;
}

export interface LevelConfig {
  level: RushLevelNo;
  title: LocalizedText;
  /** Drinks this level introduces (shown as "new on the wall"). */
  unlocks: readonly string[];
  shiftSec: number;
  /** No new customers in the last N seconds, so a good player can finish. */
  lastCallSec: number;
  firstArrivalSec: number;
  /** Mean gap between arrivals at shift start (s); ±jitter fraction. */
  arrivalSec: number;
  arrivalJitter: number;
  /** patience = (drink work estimate × mult + slack) × in-shift ramp. */
  patienceMult: number;
  patienceSlackSec: number;
  /** In-shift ramp: multipliers reached at the end of the shift (linear from 1). */
  rampArrivalEnd: number;
  rampPatienceEnd: number;
  maxOpenOrders: number;
  /** Does an action-list action pay `INPUT_COST.listActionCostSec`? (false on the learning levels L1–L2) */
  listCost: boolean;
  /**
   * Action-list shifts only: customer patience × this, on top of `patienceMult` (1 = the same as 3D / XR).
   * A person reading the list takes ~1.4–2.2 s per action (a 3D reach ~1.3 s) and pays the list cost from
   * L3, so without it list mode L3–L5 were far harder than the same level in 3D (follow-up to QA-R09).
   * L5 needs the most (longest shift, steepest ramp, widest mix); the list player's results still fall
   * level by level (`checkTargets` in harness.ts). Speed tips stay on the 3D clock (`Order.tipWindowMs`).
   */
  listPatienceMult: number;
  mix: readonly MixEntry[];
}

const mix = (o: Record<string, number>): MixEntry[] => Object.entries(o).map(([drinkId, weight]) => ({ drinkId, weight }));

export const LEVELS: Record<RushLevelNo, LevelConfig> = {
  1: {
    level: 1,
    title: L('浓缩吧台', 'Espresso bar'),
    unlocks: ['espresso-shot', 'ristretto', 'lungo'],
    shiftSec: 150,
    lastCallSec: 25,
    firstArrivalSec: 2,
    arrivalSec: 12,
    arrivalJitter: 0.2,
    patienceMult: 2.4,
    patienceSlackSec: 12,
    rampArrivalEnd: 0.8,
    rampPatienceEnd: 0.9,
    maxOpenOrders: 2,
    listCost: false,
    listPatienceMult: 1,
    mix: mix({ 'espresso-shot': 4, ristretto: 3, lungo: 3 }),
  },
  2: {
    level: 2,
    title: L('经典奶咖', 'Milk classics'),
    unlocks: ['espresso-macchiato', 'cortado', 'cappuccino', 'flat-white', 'caffe-latte', 'mocha'],
    shiftSec: 180,
    lastCallSec: 25,
    firstArrivalSec: 2,
    arrivalSec: 12,
    arrivalJitter: 0.2,
    // 2.2 → 2.4 (QA gate #2): a guided list player at ~2 s per action needs ~6 s more per milk drink.
    patienceMult: 2.4,
    patienceSlackSec: 12,
    rampArrivalEnd: 0.8,
    rampPatienceEnd: 0.88,
    maxOpenOrders: 2,
    listCost: false,
    listPatienceMult: 1,
    mix: mix({ 'espresso-macchiato': 2, cortado: 2, cappuccino: 3, 'flat-white': 3, 'caffe-latte': 3, mocha: 2, 'espresso-shot': 1 }),
  },
  3: {
    level: 3,
    title: L('黑咖、冰饮与世界咖啡', 'Black, iced & world'),
    unlocks: ['americano', 'long-black', 'iced-latte', 'affogato', 'cafe-cubano', 'yuenyeung'],
    shiftSec: 180,
    lastCallSec: 25,
    firstArrivalSec: 2,
    arrivalSec: 11,
    arrivalJitter: 0.2,
    patienceMult: 1.9,
    patienceSlackSec: 10,
    rampArrivalEnd: 0.78,
    rampPatienceEnd: 0.86,
    maxOpenOrders: 3,
    listCost: true,
    listPatienceMult: 1.55,
    mix: mix({ americano: 3, 'long-black': 3, 'iced-latte': 3, affogato: 2, 'cafe-cubano': 2, yuenyeung: 2, cappuccino: 1, 'flat-white': 1, 'caffe-latte': 1 }),
  },
  4: {
    level: 4,
    title: L('手冲与滴滤', 'Pour-over & drip'),
    unlocks: ['pourover-cone', 'japanese-iced-pourover', 'vietnamese-phin'],
    shiftSec: 210,
    lastCallSec: 30,
    firstArrivalSec: 2,
    arrivalSec: 11,
    arrivalJitter: 0.2,
    patienceMult: 1.9,
    patienceSlackSec: 10,
    rampArrivalEnd: 0.78,
    rampPatienceEnd: 0.85,
    maxOpenOrders: 3,
    listCost: true,
    listPatienceMult: 1.55,
    mix: mix({ 'pourover-cone': 3, 'japanese-iced-pourover': 2, 'vietnamese-phin': 2, americano: 1, 'caffe-latte': 1, 'espresso-shot': 1, cappuccino: 1 }),
  },
  5: {
    level: 5,
    title: L('高峰时段', 'Rush hour'),
    unlocks: [],
    shiftSec: 240,
    lastCallSec: 30,
    firstArrivalSec: 2,
    arrivalSec: 11,
    arrivalJitter: 0.2,
    patienceMult: 1.8,
    patienceSlackSec: 10,
    rampArrivalEnd: 0.75,
    rampPatienceEnd: 0.82,
    maxOpenOrders: 3,
    listCost: true,
    listPatienceMult: 1.8,
    mix: mix({
      'espresso-shot': 2,
      ristretto: 1,
      lungo: 1,
      'espresso-macchiato': 1,
      cortado: 2,
      cappuccino: 2,
      'flat-white': 2,
      'caffe-latte': 2,
      mocha: 1,
      americano: 2,
      'long-black': 1,
      'iced-latte': 2,
      affogato: 1,
      'cafe-cubano': 1,
      yuenyeung: 1,
      'pourover-cone': 1,
      'japanese-iced-pourover': 1,
      'vietnamese-phin': 1,
    }),
  },
};

/** Patience multiplier for a level and input: `patienceMult`, × `listPatienceMult` on the action list. */
export const patienceMultFor = (level: RushLevelNo, input: RushInput): number =>
  LEVELS[level].patienceMult * (input === 'list' ? LEVELS[level].listPatienceMult : 1);

/** Relaxed mode: no countdowns, no overheating; the shift ends after N accepted serves. */
export const RELAXED = { orders: 8, maxOpenOrders: 2, arrivalGapSec: 4 };

// ───────────────────────────── scoring ─────────────────────────────
export const SCORING = {
  /** Base points = base + perStep × make steps (coffee, milk, water, ice, each extra). */
  basePoints: 20,
  perStepPoints: 10,
  /** Speed tip: up to this share of base, scaled by the patience left. Standard mode only. */
  tipMaxShare: 0.5,
  /** Streak bonus per consecutive perfect serve after the first, capped. */
  streakStep: 2,
  streakCap: 10,
  /** One component off: accepted with this share of base (no tip, streak resets). */
  partlyShare: 0.5,
  /** Stars from points ÷ potential (Σ base of every order that arrived). Relaxed: share of perfect serves. */
  stars: [0.4, 0.75, 1.1] as const,
  /** Relaxed mode: stars from the share of serves that were textbook-perfect (no clock, no tips). */
  relaxedStars: [0.5, 0.75, 0.95] as const,
};

// ───────────────────────────── bots (tuning harness only) ─────────────────────────────
export type BotPlanning = 'serial' | 'pipelined' | 'parallel';
export interface BotProfile {
  id: 'novice' | 'average' | 'expert' | 'human-list';
  /** Mean seconds per action (reach, handle, read); ±latencyJitter. */
  latencySec: number;
  latencyJitter: number;
  /** Chance a new drink is built with one wrong component (fixed after feedback). */
  errorRate: number;
  planning: BotPlanning;
  maxJobs: number;
  /** Skip orders whose patience left is below this bot's estimated make time (time-management triage). */
  triage: boolean;
  /** Take ready milk off the steam wand before anything else (the guided coach does, so slow players avoid overheating). */
  wandFirst?: boolean;
  /**
   * Plays by following the guided coach like a person: sees the suggested step, reacts after its latency,
   * then does whatever the coach suggests at that moment (planning fields are unused).
   */
  followsCoach?: boolean;
}

export const BOT_PROFILES: Record<BotProfile['id'], BotProfile> = {
  novice: { id: 'novice', latencySec: 1.9, latencyJitter: 0.3, errorRate: 0.15, planning: 'serial', maxJobs: 1, triage: false },
  average: { id: 'average', latencySec: 1.3, latencyJitter: 0.25, errorRate: 0.07, planning: 'pipelined', maxJobs: 2, triage: true },
  expert: { id: 'expert', latencySec: 0.85, latencyJitter: 0.2, errorRate: 0.02, planning: 'parallel', maxJobs: 3, triage: true },
  /**
   * QA gate #2 "guided first-timer" on the ACTION LIST: reads the suggested step for 1.4–2.2 s, then does
   * what the guided coach suggests (never errs), and pays the list cost per action.
   */
  'human-list': { id: 'human-list', latencySec: 1.8, latencyJitter: 0.4 / 1.8, errorRate: 0, planning: 'parallel', maxJobs: 2, triage: true, followsCoach: true },
};

export const TUNING = { shiftsPerCell: 40, seedBase: 1000 };

/**
 * Shift seed of the real-speed L2 browser playtest (`tests/e2e/qa-rush.spec.ts`), fixed so it cannot flake.
 * Not cherry-picked: it is the L2 `human-list` tuning seed whose score is closest to the median of the 40
 * (`tuning.test.ts` re-derives it). Harness: 2★, 97% of menu value, 5 served, 0 walk-outs.
 */
export const REALSPEED_L2_SEED = 21015;
