/**
 * Café Rush drink roster, per-drink requirements and the RECIPE WALL.
 *
 * Source of truth: Café Counter `BUILD_SPECS` (what makes each drink that drink) and the Drink Atlas
 * `drinks` (illustrative recipe numbers). Nothing numeric is invented here: wall numbers are read from
 * `drinks.ts`, pitcher/water marks and cups from the canonical café build.
 *
 * Pour-over drinks have no Café Counter spec yet (its METHODS lack 'pourover'), so two small
 * Rush-local FILTER_SPECS cover them (structure only; their numbers still come from drinks.ts).
 */
import type { DrinkRecipe, LocalizedText } from '../../domain/contracts';
import { drinks } from '../../content/drinks';
import type { CupSize, Extra, MilkMl, MilkTexture, ShotStyle, WaterMl, WaterOrder } from '../../features/cafe/model';
import { getBuildSpec, type BuildSpec } from '../../features/cafe/specs';
import { LEVELS, PATIENCE, PROCESS, RUSH_LEVELS, SCORING, type RushLevelNo } from './config';

const L = (zh: string, en: string): LocalizedText => ({ zh, en });

/** Coffee makers on the Rush counter. Moka / ibrik / pot drinks stay in the 2D Café Counter. */
export type RushMethod = 'espresso' | 'phin' | 'pourover';
export type Brewer = 'pourover' | 'phin';

/** What a correct build needs, in Rush terms (used by the wall, patience, bots and tests). */
export interface Needs {
  cup: CupSize;
  shot: ShotStyle | null;
  brewer: Brewer | null;
  water: WaterOrder;
  waterMl: WaterMl;
  milk: MilkTexture;
  milkMl: MilkMl;
  ice: boolean;
  extras: Extra[];
}

export interface FilterSpec {
  drinkId: string;
  ice: boolean;
  cup: readonly CupSize[];
  keyPoint: LocalizedText;
  why: { method: LocalizedText; ice: LocalizedText; cup: LocalizedText; bloom: LocalizedText };
}

const BLOOM_WHY = L(
  '先用少量热水把粉全部润湿（闷蒸），等它鼓起再继续注水——这是食谱里的一步，不要跳过。',
  'Wet all the grounds with a little hot water first (the bloom) and let it settle before the main pour — it is a step in the recipe.',
);

export const FILTER_SPECS: readonly FilterSpec[] = [
  {
    drinkId: 'pourover-cone',
    ice: false,
    cup: ['large'],
    keyPoint: L('热水分段流过滤纸上的咖啡粉：先闷蒸，再注完剩下的水。', 'Hot water poured through grounds in a paper filter: bloom first, then the rest of the pour.'),
    why: {
      method: L('手冲是滤杯里的滴滤咖啡，不是浓缩。', 'A pour-over is drip coffee from a dripper, not espresso.'),
      ice: L('这杯是热的手冲，不加冰。', 'This is a hot pour-over — no ice.'),
      cup: L('一杯手冲有两百多毫升，需要马克杯。', 'A pour-over is a couple of hundred ml — it needs a mug.'),
      bloom: BLOOM_WHY,
    },
  },
  {
    drinkId: 'japanese-iced-pourover',
    ice: true,
    cup: ['large'],
    keyPoint: L('把一部分水换成冰：热水负责萃取，直接冲在冰上降温。', 'Part of the water is swapped for ice: hot water extracts, brewed straight onto ice to chill.'),
    why: {
      method: L('日式冰手冲用滤杯冲煮，不是浓缩。', 'Japanese-style iced coffee is brewed in a dripper, not on the espresso machine.'),
      ice: L('冰是配方的一部分——咖啡直接冲在冰上。', 'The ice is part of the recipe — the coffee is brewed straight onto it.'),
      cup: L('冰加咖啡，需要高玻璃杯。', 'Ice plus coffee needs a tall glass.'),
      bloom: BLOOM_WHY,
    },
  },
];

const FILTER_INDEX = new Map(FILTER_SPECS.map((s) => [s.drinkId, s]));
export const getFilterSpec = (id: string): FilterSpec | undefined => FILTER_INDEX.get(id);

const ATLAS = new Map(drinks.map((d) => [d.id, d]));
export const atlasDrink = (id: string): DrinkRecipe | undefined => ATLAS.get(id);
export const drinkName = (id: string): LocalizedText => ATLAS.get(id)?.name ?? L(id, id);

const RUSH_METHODS: readonly string[] = ['espresso', 'phin'];

/** Every drink any level can order (unique, in level order). */
export const ROSTER: readonly string[] = [...new Set(RUSH_LEVELS.flatMap((l) => LEVELS[l].mix.map((m) => m.drinkId)))];

/** Level a drink is first unlocked at. */
export function unlockLevel(drinkId: string): RushLevelNo | null {
  for (const l of RUSH_LEVELS) if (LEVELS[l].unlocks.includes(drinkId)) return l;
  return null;
}

/** The canonical (textbook) Rush build for a drink. Throws for drinks outside the roster. */
export function needsFor(drinkId: string): Needs {
  const spec = getBuildSpec(drinkId);
  if (spec) {
    const c = spec.canonical;
    const method = RUSH_METHODS.includes(c.method) ? c.method : spec.accept.method.find((m) => RUSH_METHODS.includes(m));
    if (!method) throw new Error(`Café Rush cannot make ${drinkId}: no Rush method in its spec`);
    return {
      cup: c.cup,
      shot: method === 'espresso' ? c.shotStyle : null,
      brewer: method === 'phin' ? 'phin' : null,
      water: c.water,
      waterMl: c.waterMl,
      milk: c.milk,
      milkMl: c.milkMl,
      ice: c.ice,
      extras: [...c.extras],
    };
  }
  const f = getFilterSpec(drinkId);
  if (!f) throw new Error(`Unknown Café Rush drink: ${drinkId}`);
  return { cup: f.cup[0]!, shot: null, brewer: 'pourover', water: 'none', waterMl: 100, milk: 'none', milkMl: 120, ice: f.ice, extras: [] };
}

/** Make steps: coffee, milk, water, ice, each extra (drives base points). */
export function makeSteps(n: Needs): number {
  return 1 + (n.milk !== 'none' ? 1 : 0) + (n.water !== 'none' ? 1 : 0) + (n.ice ? 1 : 0) + n.extras.length;
}

export function basePoints(drinkId: string): number {
  return SCORING.basePoints + SCORING.perStepPoints * makeSteps(needsFor(drinkId));
}

export const steamSec = (ml: number) => PROCESS.steam.baseSec + (PROCESS.steam.per100MlSec * ml) / 100;
export const hotWaterSec = (ml: number) => Math.max(PROCESS.hotWater.minSec, (PROCESS.hotWater.per100MlSec * ml) / 100);

/** Rough "skilled but not rushed" time to make a drink (critical path + handling), for patience. */
export function workEstimateSec(drinkId: string): number {
  const n = needsFor(drinkId);
  const coffee = n.shot
    ? PROCESS.grind.sec + PROCESS.shot[n.shot].sec
    : n.brewer
      ? PROCESS.grind.sec + PROCESS.bloom[n.brewer].sec + PROCESS.drawdown[n.brewer].sec
      : 0;
  const hotMilk = n.milk !== 'none' && n.milk !== 'cold';
  const milk = hotMilk ? steamSec(n.milkMl) : 0;
  const water = n.water !== 'none' ? hotWaterSec(n.waterMl) : 0;
  const actions =
    2 + (n.shot ? 8 : 0) + (n.brewer ? 9 : 0) + (hotMilk ? 6 : n.milk === 'cold' ? 3 : 0) + (n.water !== 'none' ? 3 : 0) + (n.ice ? 1 : 0) + n.extras.length;
  return Math.max(coffee, milk) + water + actions * PATIENCE.perActionSec;
}

// ───────────────────────────── recipe wall ─────────────────────────────
export interface WallEntry {
  drinkId: string;
  name: LocalizedText;
  /** From drinks.ts (illustrative). */
  doseG?: number;
  outG?: number;
  /** "1:2" — computed from doseG/outG, never typed in. */
  ratio?: string;
  milkMl?: number;
  /** Game marks from the canonical café build. */
  pitcherMark?: MilkMl;
  milk: MilkTexture;
  water: WaterOrder;
  waterMark?: WaterMl;
  shot: ShotStyle | null;
  brewer: Brewer | null;
  ice: boolean;
  extras: Extra[];
  cup: CupSize;
  keyPoint: LocalizedText;
  summary: LocalizedText | null;
  timeNote: LocalizedText | null;
  isNew: boolean;
  illustrative: true;
}

export function formatRatio(doseG?: number, outG?: number): string | undefined {
  if (!doseG || !outG) return undefined;
  const r = Math.round((outG / doseG) * 10) / 10;
  return `1:${r}`;
}

function keyPointOf(drinkId: string, spec: BuildSpec | undefined): LocalizedText {
  return spec?.keyPoint ?? getFilterSpec(drinkId)?.keyPoint ?? L('', '');
}

/** Wall for a level: every drink unlocked up to and including it (new ones flagged). */
export function recipeWall(level: RushLevelNo): WallEntry[] {
  const ids = RUSH_LEVELS.filter((l) => l <= level).flatMap((l) => LEVELS[l].unlocks);
  return ids.map((drinkId) => {
    const a = atlasDrink(drinkId);
    const spec = getBuildSpec(drinkId);
    const n = needsFor(drinkId);
    return {
      drinkId,
      name: drinkName(drinkId),
      doseG: a?.recipe.doseG,
      outG: a?.recipe.outG,
      ratio: formatRatio(a?.recipe.doseG, a?.recipe.outG),
      milkMl: a?.recipe.milkMl,
      pitcherMark: n.milk !== 'none' ? n.milkMl : undefined,
      milk: n.milk,
      water: n.water,
      waterMark: n.water !== 'none' ? n.waterMl : undefined,
      shot: n.shot,
      brewer: n.brewer,
      ice: n.ice,
      extras: n.extras,
      cup: n.cup,
      keyPoint: keyPointOf(drinkId, spec),
      summary: a?.recipe.summary ?? null,
      timeNote: a?.recipe.timeNote ?? null,
      isNew: LEVELS[level].unlocks.includes(drinkId),
      illustrative: true,
    };
  });
}
