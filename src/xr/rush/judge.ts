/**
 * Café Rush judging. A cup is an ordered list of additions; it is summarised into a Café Counter
 * `CompleteBuild` and judged with the café's own `evaluate()` against `BUILD_SPECS`, so both games
 * always agree on what makes a cappuccino a cappuccino. Rush adds a few process checks of its own
 * (bloom skipped, milk overheated, two shots in one cup) and Rush-local pour-over specs.
 */
import type { LocalizedText } from '../../domain/contracts';
import {
  EXTRAS,
  MILK_ML,
  WATER_ML,
  evaluate,
  type CompleteBuild,
  type Component,
  type CupSize,
  type Diff,
  type Extra,
  type MilkMl,
  type MilkTexture,
  type ShotStyle,
  type Value,
  type WaterMl,
  type WaterOrder,
} from '../../features/cafe/model';
import { getBuildSpec } from '../../features/cafe/specs';
import { COMPONENT_TEXT, genericWhy, joinValues, valueText } from '../../features/cafe/strings';
import { PROCESS } from './config';
import { drinkName, ROSTER, type Brewer, type RushMethod } from './drinks';
import { getFilterSpec } from './filterSpecs';

const L = (zh: string, en: string): LocalizedText => ({ zh, en });

export type Addition =
  | { k: 'shot'; style: ShotStyle }
  | { k: 'brew'; brewer: Brewer; bloomed: boolean }
  | { k: 'water'; ml: number }
  | { k: 'milk'; texture: Exclude<MilkTexture, 'none'>; ml: number; overheated: boolean }
  | { k: 'ice' }
  | { k: 'extra'; extra: Extra };

export interface CupContents {
  size: CupSize;
  adds: readonly Addition[];
}

export interface CupSummary {
  method: RushMethod | null;
  coffees: number;
  shotStyle: ShotStyle;
  bloomed: boolean;
  water: WaterOrder;
  waterMl: number;
  milk: MilkTexture;
  milkMl: number;
  overheated: boolean;
  ice: boolean;
  extras: Extra[];
  cup: CupSize;
}

export function summarize(c: CupContents): CupSummary {
  let method: RushMethod | null = null;
  let coffees = 0;
  let shotStyle: ShotStyle = 'normal';
  let bloomed = true;
  let firstCoffee = -1;
  let firstWater = -1;
  let waterMl = 0;
  let milk: MilkTexture = 'none';
  let milkMl = 0;
  let overheated = false;
  let ice = false;
  const extras = new Set<Extra>();
  for (const [i, a] of c.adds.entries()) {
    switch (a.k) {
      case 'shot':
      case 'brew':
        coffees += 1;
        if (firstCoffee < 0) {
          firstCoffee = i;
          method = a.k === 'shot' ? 'espresso' : a.brewer;
          if (a.k === 'shot') shotStyle = a.style;
        }
        if (a.k === 'brew' && !a.bloomed) bloomed = false;
        break;
      case 'water':
        if (firstWater < 0) firstWater = i;
        waterMl += a.ml;
        break;
      case 'milk':
        milk = a.texture;
        milkMl += a.ml;
        overheated ||= a.overheated;
        break;
      case 'ice':
        ice = true;
        break;
      case 'extra':
        extras.add(a.extra);
        break;
    }
  }
  const water: WaterOrder = firstWater < 0 ? 'none' : firstCoffee >= 0 && firstWater < firstCoffee ? 'before' : 'after';
  return {
    method,
    coffees,
    shotStyle,
    bloomed,
    water,
    waterMl,
    milk,
    milkMl,
    overheated,
    ice,
    extras: EXTRAS.filter((e) => extras.has(e)),
    cup: c.size,
  };
}

const nearest = <T extends number>(options: readonly T[], v: number): T =>
  options.reduce((best, o) => (Math.abs(o - v) < Math.abs(best - v) ? o : best), options[0]!);

export type RushComponent = Component | 'coffee' | 'bloom' | 'milkTemp' | 'shotCount';
export interface RushDiff {
  component: RushComponent;
  got: Value;
  expected: readonly Value[];
  missing?: Extra[];
  unexpected?: Extra[];
  overflow?: { volumeMl: number; capacityMl: number };
}

export type JudgeStatus = 'correct' | 'partly' | 'incorrect';
export interface Judgement {
  drinkId: string;
  status: JudgeStatus;
  diffs: RushDiff[];
  /** Another roster drink this cup matches perfectly ("you made a textbook cappuccino"). */
  madeInstead: string | null;
}

function toBuild(s: CupSummary, method: 'espresso' | 'phin'): CompleteBuild {
  return {
    method,
    shots: 2,
    shotStyle: s.shotStyle,
    water: s.water,
    waterMl: nearest<WaterMl>(WATER_ML, s.waterMl),
    milk: s.milk,
    milkMl: nearest<MilkMl>(MILK_ML, s.milkMl),
    ice: s.ice,
    extras: s.extras,
    cup: s.cup,
  };
}

/** Core judgement without the "made instead" search. */
export function diffsFor(c: CupContents, drinkId: string): RushDiff[] {
  const s = summarize(c);
  if (s.method === null) return [{ component: 'coffee', got: 'none', expected: ['coffee'] }];
  const diffs: RushDiff[] = [];
  const spec = getBuildSpec(drinkId);
  if (spec) {
    const sameFamily = s.method !== 'pourover' && spec.accept.method.includes(s.method);
    const asMethod = sameFamily ? (s.method as 'espresso' | 'phin') : spec.accept.method.includes('espresso') ? 'espresso' : 'phin';
    if (!sameFamily) diffs.push({ component: 'method', got: s.method, expected: spec.accept.method });
    const ev = evaluate(toBuild(s, asMethod), spec);
    diffs.push(...ev.diffs.filter((d: Diff) => d.component !== 'method' || sameFamily));
  } else {
    const f = getFilterSpec(drinkId);
    if (!f) throw new Error(`Unknown Café Rush drink: ${drinkId}`);
    if (s.method !== 'pourover') diffs.push({ component: 'method', got: s.method, expected: ['pourover'] });
    if (s.water !== 'none') diffs.push({ component: 'water', got: s.water, expected: ['none'] });
    if (s.milk !== 'none') diffs.push({ component: 'milk', got: s.milk, expected: ['none'] });
    if (s.ice !== f.ice) diffs.push({ component: 'ice', got: s.ice, expected: [f.ice] });
    if (s.extras.length) diffs.push({ component: 'extras', got: s.extras.join(','), expected: [], missing: [], unexpected: s.extras });
    if (!f.cup.includes(s.cup)) diffs.push({ component: 'cup', got: s.cup, expected: f.cup });
  }
  if (s.coffees > 1) diffs.push({ component: 'shotCount', got: s.coffees, expected: [1] });
  if (s.method !== 'espresso' && !s.bloomed) diffs.push({ component: 'bloom', got: false, expected: [true] });
  if (s.overheated) diffs.push({ component: 'milkTemp', got: 'overheated', expected: ['ok'] });
  return diffs;
}

export function judge(c: CupContents, drinkId: string): Judgement {
  const diffs = diffsFor(c, drinkId);
  const noCoffee = diffs[0]?.component === 'coffee';
  const status: JudgeStatus = diffs.length === 0 ? 'correct' : diffs.length === 1 && !noCoffee ? 'partly' : 'incorrect';
  let madeInstead: string | null = null;
  if (status !== 'correct' && !noCoffee) {
    madeInstead = ROSTER.find((id) => id !== drinkId && diffsFor(c, id).length === 0) ?? null;
  }
  return { drinkId, status, diffs, madeInstead };
}

// ───────────────────────────── explanations ─────────────────────────────
const RUSH_TEXT: Record<'coffee' | 'bloom' | 'milkTemp' | 'shotCount', { label: LocalizedText; why: LocalizedText }> = {
  coffee: {
    label: L('咖啡', 'Coffee'),
    why: L('杯子里还没有咖啡——先萃一份浓缩或冲煮。', 'There is no coffee in the cup yet — pull a shot or brew first.'),
  },
  bloom: {
    label: L('闷蒸', 'Bloom'),
    why: L(
      '闷蒸还没结束就继续注水了。食谱里先短暂闷蒸、等它完成再注水（真实咖啡的味道变化本游戏无法判断）。',
      'The main pour started before the bloom finished. The recipe blooms first and waits (the game cannot judge real taste).',
    ),
  },
  milkTemp: {
    label: L('奶温', 'Milk temperature'),
    why: L(
      `游戏里奶在蒸汽棒上停太久就会过热。${PROCESS.overheatReal.zh}。`,
      `In the game, milk left on the wand too long overheats; ${PROCESS.overheatReal.en}.`,
    ),
  },
  shotCount: {
    label: L('咖啡份数', 'Coffee count'),
    why: L('一份双份浓缩已经是 18 克粉的量，这杯里放了两份。', 'One double already uses the 18 g dose — this cup got two.'),
  },
};

export interface Explanation {
  component: RushComponent;
  /** What differs: "Milk: you gave Foam — this order wants Microfoam". */
  what: LocalizedText;
  /** Why it matters for this drink (café spec reason when there is one). */
  why: LocalizedText;
}

const METHOD_EXTRA: Record<string, LocalizedText> = { pourover: L('手冲滤杯', 'Pour-over dripper') };
const valueOf = (component: Component, v: Value): LocalizedText =>
  component === 'method' && METHOD_EXTRA[String(v)] ? METHOD_EXTRA[String(v)]! : valueText(component, v);
const listOf = (component: Component, vs: readonly Value[]): LocalizedText =>
  component === 'method'
    ? L(vs.map((v) => valueOf('method', v).zh).join(' 或 '), vs.map((v) => valueOf('method', v).en).join(' or '))
    : joinValues(component, vs);

export function explain(drinkId: string, d: RushDiff): Explanation {
  if (d.component in RUSH_TEXT) {
    const t = RUSH_TEXT[d.component as keyof typeof RUSH_TEXT];
    const why = d.component === 'bloom' ? (getFilterSpec(drinkId)?.why.bloom ?? t.why) : t.why;
    return { component: d.component, what: t.label, why };
  }
  const c = d.component as Component;
  const name = COMPONENT_TEXT[c];
  const what =
    c === 'extras'
      ? L(`${name.zh}：`, `${name.en}: `)
      : L(`${name.zh}：你给的是${valueOf(c, d.got).zh}，这单要${listOf(c, d.expected).zh}`, `${name.en}: you gave ${valueOf(c, d.got).en} — this order wants ${listOf(c, d.expected).en}`);
  const cafeWhy = getBuildSpec(drinkId)?.why[c];
  const filter = getFilterSpec(drinkId);
  const filterWhy = filter && (c === 'method' || c === 'ice' || c === 'cup') ? filter.why[c] : undefined;
  const why = cafeWhy ?? filterWhy ?? (c === 'method' ? L(`这款用${listOf(c, d.expected).zh}制作。`, `This drink is made with: ${listOf(c, d.expected).en}.`) : genericWhy(d as Diff));
  return { component: d.component, what: c === 'extras' ? L(what.zh + genericWhy(d as Diff).zh, what.en + genericWhy(d as Diff).en) : what, why };
}

export function judgementSummary(j: Judgement): LocalizedText {
  const name = drinkName(j.drinkId);
  if (j.status === 'correct') return L(`完美的${name.zh}！`, `A textbook ${name.en}!`);
  if (j.madeInstead) {
    const other = drinkName(j.madeInstead);
    return L(`这杯其实是标准的${other.zh}——订单是${name.zh}。`, `That is a textbook ${other.en} — the order was a ${name.en}.`);
  }
  return j.status === 'partly' ? L(`很接近${name.zh}，差一处。`, `Close to a ${name.en} — one thing differs.`) : L(`还不是${name.zh}。`, `Not a ${name.en} yet.`);
}
