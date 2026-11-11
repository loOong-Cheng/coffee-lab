/**
 * Café Rush drink roster, per-drink requirements and the RECIPE WALL.
 *
 * Source of truth: Café Counter `BUILD_SPECS` (what makes each drink that drink) and the Drink Atlas
 * `drinks` (illustrative recipe numbers). Nothing numeric is invented here: wall numbers are read from
 * `drinks.ts`, pitcher/water marks and cups from the canonical café build.
 *
 * Pour-over drinks have no Café Counter spec yet: see ./filterSpecs.ts (TODO: move into BUILD_SPECS).
 */
import type { DrinkRecipe, LocalizedText } from '../../domain/contracts';
import { drinks } from '../../content/drinks';
import type { CupSize, Extra, MilkMl, MilkTexture, ShotStyle, WaterMl, WaterOrder } from '../../features/cafe/model';
import { getBuildSpec, type BuildSpec } from '../../features/cafe/specs';
import { getFilterSpec } from './filterSpecs';
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
  /** What `milkMl` measures: steamed / cold milk, or the milk that rides in an extra (QA-R03). */
  milkLabel?: LocalizedText;
  /** e.g. "in the HK milk tea" — the milk is part of an extra, not the pitcher. */
  milkNote?: LocalizedText;
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

/**
 * When the Rush build takes NO pitcher milk but the Atlas lists `milkMl`, that milk rides in an extra
 * (consistent with BUILD_SPECS: yuenyeung = coffee + milk tea made with evaporated milk; phin = condensed
 * milk in the glass). Label the real component instead of "milk", so nobody adds steamed milk.
 */
const MILK_IN_EXTRA: Partial<Record<Extra, { label: LocalizedText; note?: LocalizedText }>> = {
  'condensed-milk': { label: L('炼乳', 'condensed milk') },
  'milk-tea': { label: L('淡奶', 'evaporated milk'), note: L('在港式奶茶里', 'in the HK milk tea') },
};

function milkOf(n: Needs, atlasMl: number | undefined): { milkMl?: number; milkLabel?: LocalizedText; milkNote?: LocalizedText } {
  if (!atlasMl) return {};
  if (n.milk !== 'none') return { milkMl: atlasMl, milkLabel: L('奶', 'milk') };
  const e = n.extras.map((x) => MILK_IN_EXTRA[x]).find(Boolean);
  // Unknown carrier: keep the number out of the line rather than call it "milk".
  return e ? { milkMl: atlasMl, milkLabel: e.label, milkNote: e.note } : { milkMl: atlasMl };
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
      ...milkOf(n, a?.recipe.milkMl),
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

/**
 * The key numbers of one wall entry (ratio, milk / its carrier, water mark), as short phrases. Shared by
 * the wall and the order tickets so a ticket never says anything the wall does not (QA-R07).
 */
export function wallFacts(w: WallEntry): LocalizedText[] {
  const out: LocalizedText[] = [];
  if (w.ratio) out.push(L(`${w.doseG} g → ${w.outG} g（${w.ratio}）`, `${w.doseG} g → ${w.outG} g (${w.ratio})`));
  else if (w.doseG) out.push(L(`咖啡粉 ${w.doseG} g`, `${w.doseG} g coffee`));
  if (w.milkMl && w.milkLabel) {
    const mark = w.pitcherMark ? L(` → 奶缸刻度 ${w.pitcherMark}`, ` → pitcher mark ${w.pitcherMark}`) : L('', '');
    const note = w.milkNote ? L(`（${w.milkNote.zh}）`, ` (${w.milkNote.en})`) : L('', '');
    out.push(L(`${w.milkLabel.zh} ≈${w.milkMl} ml${mark.zh}${note.zh}`, `${w.milkLabel.en} ≈${w.milkMl} ml${mark.en}${note.en}`));
  } else if (w.pitcherMark) out.push(L(`奶缸刻度 ${w.pitcherMark} ml`, `pitcher mark ${w.pitcherMark} ml`));
  if (w.waterMark) out.push(w.water === 'before' ? L(`先放热水 ${w.waterMark} ml`, `hot water ${w.waterMark} ml first`) : L(`热水 ${w.waterMark} ml（后加）`, `hot water ${w.waterMark} ml after`));
  return out;
}

const wallById = new Map<string, WallEntry>();
/** Wall entry for one drink (any roster drink; independent of the level's wall). */
export function wallEntry(drinkId: string): WallEntry | undefined {
  if (!wallById.size) for (const w of recipeWall(5)) wallById.set(w.drinkId, w);
  return wallById.get(drinkId);
}

// ───────────────────────────── game time vs real time ─────────────────────────────
export interface TimingRow {
  what: LocalizedText;
  /** Compressed game seconds, e.g. "7" or "3–8". */
  gameSec: string;
  /** Real-world reference (PROCESS.*.real, quoted from drinks.ts). */
  real: LocalizedText;
}

const SHOT_NAME: Record<ShotStyle, LocalizedText> = {
  ristretto: L('短萃浓缩', 'Ristretto shot'),
  normal: L('浓缩萃取', 'Espresso shot'),
  lungo: L('长萃浓缩', 'Lungo shot'),
};
const range = (xs: number[]) => {
  const lo = Math.round(Math.min(...xs) * 10) / 10;
  const hi = Math.round(Math.max(...xs) * 10) / 10;
  return lo === hi ? `${lo}` : `${lo}–${hi}`;
};

/** Every compressed process the level's drinks use, with its game time and real reference (QA-R04). */
export function processTimings(level: RushLevelNo): TimingRow[] {
  const wall = recipeWall(level);
  const rows: TimingRow[] = [];
  for (const st of ['ristretto', 'normal', 'lungo'] as const)
    if (wall.some((w) => w.shot === st)) rows.push({ what: SHOT_NAME[st], gameSec: `${PROCESS.shot[st].sec}`, real: PROCESS.shot[st].real });
  const hot = wall.filter((w) => w.pitcherMark && w.milk !== 'cold' && w.milk !== 'none');
  if (hot.length) rows.push({ what: L('打奶', 'Steaming milk'), gameSec: range(hot.map((w) => steamSec(w.pitcherMark!))), real: PROCESS.steam.real });
  if (hot.length) rows.push({ what: L('奶留在蒸汽棒上会过热', 'Milk left on the wand overheats'), gameSec: `${PROCESS.overheatAfterSec}`, real: PROCESS.overheatReal });
  const water = wall.filter((w) => w.waterMark);
  if (water.length) rows.push({ what: L('热水口', 'Hot-water spout'), gameSec: range(water.map((w) => hotWaterSec(w.waterMark!))), real: PROCESS.hotWater.real });
  const brewers = (['pourover', 'phin'] as const).filter((b) => wall.some((w) => w.brewer === b));
  if (brewers.length) rows.push({ what: L('烧水壶', 'Kettle'), gameSec: `${PROCESS.kettle.sec}`, real: PROCESS.kettle.real });
  for (const b of brewers) {
    const name = b === 'pourover' ? L('手冲', 'Pour-over') : L('越南滴滤壶', 'Phin');
    rows.push({ what: L(`${name.zh}闷蒸`, `${name.en} bloom`), gameSec: `${PROCESS.bloom[b].sec}`, real: PROCESS.bloom[b].real });
    rows.push({ what: L(`${name.zh}${b === 'pourover' ? '注水到滴完' : '滴滤'}`, `${name.en} ${b === 'pourover' ? 'main pour to finish' : 'drip'}`), gameSec: `${PROCESS.drawdown[b].sec}`, real: PROCESS.drawdown[b].real });
  }
  return rows;
}
