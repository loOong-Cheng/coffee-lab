/**
 * Café Counter — pure game model (no React). Builds, judging, cup layers, round composition,
 * mastery derived from the shared event transcript. Everything here is unit-tested.
 *
 * Volumes are ROUGH illustrative numbers for drawing the cup and spotting overflow — not recipes.
 */
import type { Guidance, LearningEvent } from '../../domain/contracts';

// ───────────────────────────── build options ─────────────────────────────
export const METHODS = ['espresso', 'moka', 'phin', 'ibrik', 'pot'] as const;
export type Method = (typeof METHODS)[number];

export const SHOT_COUNTS = [1, 2] as const;
export type Shots = (typeof SHOT_COUNTS)[number];

export const SHOT_STYLES = ['ristretto', 'normal', 'lungo'] as const;
export type ShotStyle = (typeof SHOT_STYLES)[number];

export const WATER_ORDERS = ['none', 'before', 'after'] as const;
export type WaterOrder = (typeof WATER_ORDERS)[number];

export const WATER_ML = [60, 100, 150, 200] as const;
export type WaterMl = (typeof WATER_ML)[number];

export const MILK_TEXTURES = ['none', 'cold', 'steamed', 'microfoam', 'foam'] as const;
export type MilkTexture = (typeof MILK_TEXTURES)[number];

export const MILK_ML = [15, 50, 120, 200] as const;
export type MilkMl = (typeof MILK_ML)[number];

export const EXTRAS = ['chocolate', 'condensed-milk', 'ice-cream', 'milk-tea', 'cinnamon-piloncillo', 'sugar', 'cardamom'] as const;
export type Extra = (typeof EXTRAS)[number];

export const CUPS = ['demitasse', 'small', 'medium', 'large'] as const;
export type CupSize = (typeof CUPS)[number];

/** Rough usable capacity of each cup, ml. */
export const CUP_CAPACITY_ML: Record<CupSize, number> = { demitasse: 90, small: 150, medium: 200, large: 350 };

/** Liquid out of a DOUBLE basket (~18 g dose) by shot style; a single is half. Illustrative. */
export const SHOT_YIELD_ML: Record<ShotStyle, number> = { ristretto: 24, normal: 36, lungo: 54 };

/** Coffee volume by non-espresso brewer (one serving). `pot` is ladled to fill the cup instead. */
const BREW_ML: Record<Exclude<Method, 'espresso' | 'pot'>, number> = { moka: 50, phin: 60, ibrik: 60 };

export const EXTRA_ML: Record<Extra, number> = {
  chocolate: 15,
  'condensed-milk': 25,
  'ice-cream': 60,
  'milk-tea': 200,
  'cinnamon-piloncillo': 0,
  sugar: 0,
  cardamom: 0,
};
export const ICE_ML = 80;

/** Share of the poured milk that sits on top as foam, by texture (drives the drawing). */
export const FOAM_SHARE: Record<MilkTexture, number> = { none: 0, cold: 0, steamed: 0.05, microfoam: 0.15, foam: 0.4 };

export interface Build {
  method: Method | null;
  shots: Shots;
  shotStyle: ShotStyle;
  water: WaterOrder;
  waterMl: WaterMl;
  milk: MilkTexture;
  milkMl: MilkMl;
  ice: boolean;
  extras: Extra[];
  cup: CupSize | null;
}
export type CompleteBuild = Build & { method: Method; cup: CupSize };

export const STATIONS = ['method', 'shots', 'water', 'milk', 'ice', 'extras', 'cup'] as const;
export type StationId = (typeof STATIONS)[number];

/** What gets judged. Sub-components (shotStyle, waterMl, milkMl) live in their station. */
export const COMPONENTS = ['method', 'shots', 'shotStyle', 'water', 'waterMl', 'milk', 'milkMl', 'ice', 'extras', 'cup'] as const;
export type Component = (typeof COMPONENTS)[number];

export const STATION_OF: Record<Component, StationId> = {
  method: 'method',
  shots: 'shots',
  shotStyle: 'shots',
  water: 'water',
  waterMl: 'water',
  milk: 'milk',
  milkMl: 'milk',
  ice: 'ice',
  extras: 'extras',
  cup: 'cup',
};

// ───────────────────────────── specs ─────────────────────────────
export type CafeLevelId = 'bar' | 'milk' | 'world';
export const LEVEL_ORDER: readonly CafeLevelId[] = ['bar', 'milk', 'world'];

/** Acceptable values per component. Anything listed is "right" for this game's one common version. */
export interface Accept {
  method: readonly Method[];
  shots?: readonly Shots[];
  shotStyle?: readonly ShotStyle[];
  water: readonly WaterOrder[];
  /** Judged only when the order wants water and the build adds some. Omit = any amount. */
  waterMl?: readonly WaterMl[];
  milk: readonly MilkTexture[];
  /** Judged whenever the build adds milk and the order wants milk. */
  milkMl?: readonly MilkMl[];
  ice: readonly boolean[];
  /** Required extras (all of them). */
  extras: readonly Extra[];
  /** Allowed but not required. */
  optionalExtras?: readonly Extra[];
  cup: readonly CupSize[];
}

export interface BuildSpecCore {
  drinkId: string;
  level: CafeLevelId;
  canonical: CompleteBuild;
  accept: Accept;
}

// ───────────────────────────── helpers ─────────────────────────────
export function emptyBuild(level: CafeLevelId): Build {
  return {
    // The espresso bar levels start at the machine; the world café makes you pick the brewer.
    method: level === 'world' ? null : 'espresso',
    shots: 2,
    shotStyle: 'normal',
    water: 'none',
    waterMl: 100,
    milk: 'none',
    milkMl: 120,
    ice: false,
    extras: [],
    cup: null,
  };
}

export function isComplete(b: Build): b is CompleteBuild {
  return b.method !== null && b.cup !== null;
}

/** Stations the player still has to choose before serving. */
export function missingChoices(b: Build): StationId[] {
  const out: StationId[] = [];
  if (b.method === null) out.push('method');
  if (b.cup === null) out.push('cup');
  return out;
}

/** Stations that apply to this build (shots only at the espresso machine). */
export function visibleStations(b: Pick<Build, 'method'>): StationId[] {
  return STATIONS.filter((s) => s !== 'shots' || b.method === null || b.method === 'espresso');
}

export function toggleExtra(extras: readonly Extra[], e: Extra): Extra[] {
  return extras.includes(e) ? extras.filter((x) => x !== e) : EXTRAS.filter((x) => x === e || extras.includes(x));
}

function espressoMl(b: Pick<Build, 'shots' | 'shotStyle'>): number {
  return (SHOT_YIELD_ML[b.shotStyle] * b.shots) / 2;
}

function nonCoffeeMl(b: Build): number {
  let ml = b.extras.reduce((sum, e) => sum + EXTRA_ML[e], 0);
  if (b.ice) ml += ICE_ML;
  if (b.water !== 'none') ml += b.waterMl;
  if (b.milk !== 'none') ml += b.milkMl;
  return ml;
}

/** Coffee liquid volume for the build (pot-brewed coffee is ladled to ~85% of the cup). */
export function coffeeMl(b: Build): number {
  if (b.method === null) return 0;
  if (b.method === 'espresso') return espressoMl(b);
  if (b.method === 'pot') {
    const cap = CUP_CAPACITY_ML[b.cup ?? 'medium'];
    return Math.max(30, Math.round(cap * 0.85 - nonCoffeeMl(b)));
  }
  return BREW_ML[b.method];
}

export function buildVolumeMl(b: Build): number {
  return Math.round(coffeeMl(b) + nonCoffeeMl(b));
}

export function overflows(b: Build): boolean {
  return b.cup !== null && buildVolumeMl(b) > CUP_CAPACITY_ML[b.cup];
}

// ───────────────────────────── judging ─────────────────────────────
export type Value = string | number | boolean;

export interface Diff {
  component: Component;
  got: Value;
  expected: readonly Value[];
  /** extras only */
  missing?: Extra[];
  unexpected?: Extra[];
  /** cup only: the drink would not fit. */
  overflow?: { volumeMl: number; capacityMl: number };
}

export interface Evaluation {
  judged: Component[];
  diffs: Diff[];
  /** 0..1 share of judged components that match. */
  score: number;
  correct: boolean;
  volumeMl: number;
}

/**
 * Compare a build with an order. Components are judged only where they make sense:
 * shot count/style only at the espresso machine (when the order is espresso-based),
 * water/milk amounts only when both the order and the build include water/milk.
 */
export function evaluate(b: CompleteBuild, spec: Pick<BuildSpecCore, 'accept'>): Evaluation {
  const a = spec.accept;
  const judged: Component[] = [];
  const diffs: Diff[] = [];
  const check = (component: Component, got: Value, expected: readonly Value[]) => {
    judged.push(component);
    if (!expected.includes(got)) diffs.push({ component, got, expected });
  };

  check('method', b.method, a.method);
  if (b.method === 'espresso' && a.method.includes('espresso')) {
    if (a.shots) check('shots', b.shots, a.shots);
    if (a.shotStyle) check('shotStyle', b.shotStyle, a.shotStyle);
  }
  check('water', b.water, a.water);
  if (a.waterMl && b.water !== 'none' && a.water.some((w) => w !== 'none')) check('waterMl', b.waterMl, a.waterMl);
  check('milk', b.milk, a.milk);
  if (a.milkMl && b.milk !== 'none' && a.milk.some((m) => m !== 'none')) check('milkMl', b.milkMl, a.milkMl);
  check('ice', b.ice, a.ice);

  judged.push('extras');
  const allowed = new Set<Extra>([...a.extras, ...(a.optionalExtras ?? [])]);
  const missing = a.extras.filter((e) => !b.extras.includes(e));
  const unexpected = b.extras.filter((e) => !allowed.has(e));
  if (missing.length || unexpected.length) {
    diffs.push({ component: 'extras', got: b.extras.join(','), expected: a.extras, missing, unexpected });
  }

  judged.push('cup');
  const volumeMl = buildVolumeMl(b);
  const capacityMl = CUP_CAPACITY_ML[b.cup];
  const cupOk = a.cup.includes(b.cup);
  const spill = volumeMl > capacityMl;
  if (!cupOk || spill) {
    diffs.push({ component: 'cup', got: b.cup, expected: a.cup, ...(spill ? { overflow: { volumeMl, capacityMl } } : {}) });
  }

  const score = judged.length ? (judged.length - diffs.length) / judged.length : 0;
  return { judged, diffs, score: Math.round(score * 1000) / 1000, correct: diffs.length === 0, volumeMl };
}

/** Another drink this build matches perfectly (for "what you made is a textbook cappuccino"). */
export function perfectMatchOther<S extends BuildSpecCore>(b: CompleteBuild, specs: readonly S[], excludeId: string): S | null {
  for (const s of specs) {
    if (s.drinkId !== excludeId && evaluate(b, s).correct) return s;
  }
  return null;
}

export type FeedbackStatus = 'correct' | 'partly' | 'incorrect';
export function statusFor(e: Pick<Evaluation, 'correct' | 'diffs'>): FeedbackStatus {
  if (e.correct) return 'correct';
  return e.diffs.length === 1 ? 'partly' : 'incorrect';
}

// ───────────────────────────── cup drawing model ─────────────────────────────
export type LayerKind =
  | 'chocolate'
  | 'condensed'
  | 'ice-cream'
  | 'water'
  | 'cold-milk'
  | 'milk-tea'
  | 'espresso'
  | 'diluted'
  | 'brew'
  | 'crema'
  | 'milk'
  | 'foam';
export interface Layer {
  kind: LayerKind;
  ml: number;
}

/** Bottom → top layers of the drink (a cross-section diagram, not a photo). */
export function cupLayers(b: Build): Layer[] {
  const out: Layer[] = [];
  const push = (kind: LayerKind, ml: number) => {
    if (ml > 0) out.push({ kind, ml: Math.round(ml) });
  };
  if (b.extras.includes('chocolate')) push('chocolate', EXTRA_ML.chocolate);
  if (b.extras.includes('condensed-milk')) push('condensed', EXTRA_ML['condensed-milk']);
  if (b.extras.includes('ice-cream')) push('ice-cream', EXTRA_ML['ice-cream']);
  if (b.water === 'before') push('water', b.waterMl);
  if (b.milk === 'cold') push('cold-milk', b.milkMl);
  if (b.extras.includes('milk-tea')) push('milk-tea', EXTRA_ML['milk-tea']);

  const coffee = coffeeMl(b);
  const hotMilk = b.milk === 'steamed' || b.milk === 'microfoam' || b.milk === 'foam';
  if (b.method === 'espresso') {
    if (b.water === 'after') {
      push('diluted', coffee + b.waterMl);
    } else if (hotMilk) {
      push('espresso', coffee);
    } else {
      // Nothing poured on top: the crema survives (espresso, long black, iced latte, affogato…).
      const crema = Math.min(4, coffee * 0.15);
      push('espresso', coffee - crema);
      push('crema', crema);
    }
  } else if (b.method !== null) {
    if (b.method === 'ibrik') {
      // Turkish coffee is prized for its foam (köpük).
      push('brew', coffee - 4);
      push('crema', 4);
    } else {
      push('brew', coffee);
    }
    if (b.water === 'after') push('water', b.waterMl);
  }
  if (hotMilk) {
    const foam = b.milkMl * FOAM_SHARE[b.milk];
    push('milk', b.milkMl - foam);
    push('foam', foam);
  }
  return out;
}

// ───────────────────────────── rounds ─────────────────────────────
export const ROUND_SIZE = 5;

/** Small deterministic PRNG (mulberry32) so rounds can be reproduced in tests. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/**
 * Pick the drinks for one shift: drinks you haven't mastered yet come first, then a refresher
 * of mastered ones; order within the shift is shuffled. Never repeats a drink inside a shift.
 */
export function composeRound(
  level: CafeLevelId,
  specs: readonly Pick<BuildSpecCore, 'drinkId' | 'level'>[],
  mastered: ReadonlySet<string>,
  random: () => number,
  size = ROUND_SIZE,
): string[] {
  const pool = specs.filter((s) => s.level === level).map((s) => s.drinkId);
  const fresh = shuffle(
    pool.filter((id) => !mastered.has(id)),
    random,
  );
  const review = shuffle(
    pool.filter((id) => mastered.has(id)),
    random,
  );
  return shuffle([...fresh, ...review].slice(0, size), random);
}

// ───────────────────────────── progress (derived from events) ─────────────────────────────
export const CAFE_PREFIX = 'cafe:';
export const cafeActivityId = (drinkId: string) => `${CAFE_PREFIX}${drinkId}`;

const AUTONOMY: Record<Guidance, number> = { guided: 0, assisted: 1, independent: 2 };

export interface Mastery {
  drinkId: string;
  /** Most autonomous guidance tier with a perfect serve. */
  best: Guidance;
  correctServes: number;
  firstAt: string;
}

/** Drinks with at least one perfect serve (score 1, assessed answer). */
export function cafeMastery(events: readonly LearningEvent[]): Map<string, Mastery> {
  const out = new Map<string, Mastery>();
  for (const e of events) {
    if (!e.activityId.startsWith(CAFE_PREFIX) || e.evidence !== 'assessed_answer' || e.score !== 1) continue;
    const drinkId = e.activityId.slice(CAFE_PREFIX.length);
    const prev = out.get(drinkId);
    if (!prev) {
      out.set(drinkId, { drinkId, best: e.guidance, correctServes: 1, firstAt: e.recordedAt });
    } else {
      prev.correctServes += 1;
      if (AUTONOMY[e.guidance] > AUTONOMY[prev.best]) prev.best = e.guidance;
    }
  }
  return out;
}

/** First level (in recommended order) that still has unmastered drinks. */
export function recommendedLevel(
  specs: readonly Pick<BuildSpecCore, 'drinkId' | 'level'>[],
  mastered: ReadonlySet<string>,
): CafeLevelId | null {
  for (const level of LEVEL_ORDER) {
    if (specs.some((s) => s.level === level && !mastered.has(s.drinkId))) return level;
  }
  return null;
}
