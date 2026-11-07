/**
 * Kitchen-mode practice plans (pure, no React, no content import).
 *
 * A PracticePlan is the normalized shape the real-world guide runs. It comes from either
 *  - a curriculum `guided-practice` activity (route id = activity id), or
 *  - a Drink Atlas recipe (route id = `drink:<drinkId>`), built from the drink's authored steps.
 *
 * Nothing here senses the physical world: every step completion is the learner's own report.
 */
import type {
  Activity,
  DrinkRecipe,
  GuidedPracticeActivity,
  LocalizedText,
} from '../../domain/contracts';

export type LogField = GuidedPracticeActivity['logFields'][number];

/** Which ratio convention applies to this brew (see src/domain/brew.ts). */
export type BrewKind = 'espresso' | 'brew' | 'none';

/**
 * How a step's timerSec is offered (lead decision: timerSec is a REFERENCE, never auto-advance):
 *  - 'countdown': a wait (bloom, steep, cool) — a user-started countdown with a cue at zero;
 *  - 'reference': an action judged by weight/taste — the user-started stopwatch shows "reference ≈ N s".
 * Neither ever completes a step; completion is always the learner's own tap.
 */
export type TimerMode = 'countdown' | 'reference';

export interface PracticeStep {
  id: string;
  text: LocalizedText;
  detail?: LocalizedText;
  timerSec?: number;
  timerMode?: TimerMode;
  /** True when timerSec was derived from the step text (not authored as a timer). */
  timerFromText?: boolean;
  safety?: LocalizedText[];
  help: LocalizedText;
  illustration?: string;
}

export interface PracticeRecipe {
  doseG?: number;
  outG?: number;
  milkMl?: number;
  ratioLabel?: LocalizedText;
  summary: LocalizedText;
  notes: LocalizedText[];
  targetTimeSec?: [number, number];
}

export interface PracticePlan {
  /** Route id: activity id or `drink:<drinkId>`. Also the PracticeSession.activityId. */
  id: string;
  source: 'activity' | 'drink';
  /** Lesson to return to / record progress against ('' for drink practices). */
  lessonId: string;
  /** Drink id written to the brew log (a DrinkRecipe id when one fits, else the activity id). */
  drinkId: string;
  title: LocalizedText;
  intro?: LocalizedText;
  equipment: string[];
  safetyNotes: LocalizedText[];
  recipe?: PracticeRecipe;
  brewKind: BrewKind;
  steps: PracticeStep[];
  logFields: LogField[];
}

export const DRINK_PREFIX = 'drink:';

export function drinkPracticeId(drinkId: string): string {
  return `${DRINK_PREFIX}${drinkId}`;
}

export function parsePracticeId(id: string): { kind: 'drink'; drinkId: string } | { kind: 'activity'; activityId: string } {
  if (id.startsWith(DRINK_PREFIX)) return { kind: 'drink', drinkId: id.slice(DRINK_PREFIX.length) };
  return { kind: 'activity', activityId: id };
}

const L = (zh: string, en: string): LocalizedText => ({ zh, en });

// ───────────────────────── brew kind ─────────────────────────

export function brewKindForDrink(d: Pick<DrinkRecipe, 'category'>): BrewKind {
  return d.category === 'espresso' || d.category === 'espresso-milk' ? 'espresso' : 'brew';
}

/** Activities have no category; infer from the gear and log fields (dose+yield logged → a brew). */
export function brewKindForActivity(a: Pick<GuidedPracticeActivity, 'equipment' | 'logFields'>): BrewKind {
  const logsRatio = a.logFields.includes('doseG') && a.logFields.includes('outG');
  if (!logsRatio) return 'none';
  if (a.equipment.includes('portafilter') || a.equipment.includes('espresso-machine')) return 'espresso';
  return 'brew';
}

/** Known activity → atlas drink mapping, so journal entries from lessons share the drink filter. */
const ACTIVITY_DRINK: Record<string, string> = {
  'esp-first-real-shot-guide': 'espresso-shot',
};

export function drinkIdForActivity(a: Pick<GuidedPracticeActivity, 'id' | 'equipment' | 'logFields'>, knownDrinkIds?: ReadonlySet<string>): string {
  const mapped = ACTIVITY_DRINK[a.id];
  if (mapped && (!knownDrinkIds || knownDrinkIds.has(mapped))) return mapped;
  const kind = brewKindForActivity(a);
  const guess = kind === 'espresso' ? 'espresso-shot' : a.equipment.includes('dripper') ? 'pourover-cone' : null;
  if (guess && kind !== 'none' && (!knownDrinkIds || knownDrinkIds.has(guess))) return guess;
  return a.id;
}

// ───────────────────────── timers ─────────────────────────

const WAIT_EN = /\b(wait|waiting|bloom|steep|steeping|rest|resting|cool|cools|after another|let (?:it|them|both|the \w+) (?:bloom|steep|rest|cool|sit|stand|drip))\b/i;
const WAIT_ZH = /等待|等候|闷蒸|浸泡|静置|放凉|焖/;

/** A wait (bloom/steep/cool) gets a countdown; anything you judge by weight or taste gets a reference stopwatch. */
export function timerModeForStep(text: LocalizedText): TimerMode {
  return WAIT_EN.test(text.en ?? '') || WAIT_ZH.test(text.zh ?? '') ? 'countdown' : 'reference';
}

// ───────────────────────── activity → plan ─────────────────────────

export function isGuidedPractice(a: Activity | undefined | null): a is GuidedPracticeActivity {
  return !!a && a.kind === 'guided-practice';
}

export function planFromActivity(a: GuidedPracticeActivity, knownDrinkIds?: ReadonlySet<string>): PracticePlan {
  const recipe: PracticeRecipe | undefined = a.recipe
    ? {
        doseG: a.recipe.doseG,
        outG: a.recipe.outG,
        ratioLabel: a.recipe.ratioLabel,
        summary: a.recipe.note,
        notes: [],
        targetTimeSec: a.recipe.targetTimeSec,
      }
    : undefined;
  return {
    id: a.id,
    source: 'activity',
    lessonId: a.lessonId,
    drinkId: drinkIdForActivity(a, knownDrinkIds),
    title: a.title,
    intro: a.intro,
    equipment: [...a.equipment],
    safetyNotes: [...(a.safetyNotes ?? [])],
    recipe,
    brewKind: brewKindForActivity(a),
    steps: a.steps.map((s) => ({
      id: s.id,
      text: s.text,
      detail: s.detail,
      ...(s.timerSec && s.timerSec > 0 ? { timerSec: s.timerSec, timerMode: timerModeForStep(s.text) } : {}),
      safety: s.safety ? [s.safety] : undefined,
      help: s.help,
      illustration: s.illustration,
    })),
    logFields: a.logFields.length > 0 ? [...a.logFields] : ['taste', 'rating', 'notes'],
  };
}

// ───────────────────────── drink → plan ─────────────────────────

/** Durations in step text ("steep 4 min", "约 30 秒") → seconds. Only short, kitchen-timer-sized spans (5 s – 20 min). */
export function parseStepDurationSec(text: LocalizedText): number | undefined {
  const en = text.en ?? '';
  // "3–4 min", "30 s", "1:30"? (we only accept number + unit). Use the LOWER bound of a range:
  // the learner tastes/checks then, and can always keep going.
  const m = en.match(/(\d+(?:\.\d+)?)\s*(?:[–—-]|to)?\s*(?:\d+(?:\.\d+)?)?\s*(seconds?|secs?|s|minutes?|mins?|min)\b/i);
  let sec: number | undefined;
  if (m) {
    const n = Number(m[1]);
    const unit = m[2].toLowerCase();
    sec = unit.startsWith('m') ? n * 60 : n;
  } else {
    const zh = text.zh ?? '';
    const z = zh.match(/(\d+(?:\.\d+)?)\s*(?:[–—-]|到|至)?\s*(?:\d+(?:\.\d+)?)?\s*(秒|分钟)/);
    if (z) sec = z[2] === '分钟' ? Number(z[1]) * 60 : Number(z[1]);
  }
  if (sec === undefined || !Number.isFinite(sec)) return undefined;
  sec = Math.round(sec);
  return sec >= 5 && sec <= 20 * 60 ? sec : undefined;
}

type Hazard = 'steam' | 'stove' | 'hot' | 'grinder' | 'glass' | 'espresso';

const HAZARD_STEP: Record<Hazard, RegExp> = {
  steam: /steam|wand|froth/i,
  stove: /stove|boil|simmer|flame|heat (?:the|it|on)|saucepan|over (?:low|medium|high) heat|burner/i,
  hot: /hot water|kettle|pour (?:the )?(?:hot|just-boiled|boiling)|just off the boil|°C|scald/i,
  grinder: /grind/i,
  glass: /glass|siphon|chemex|carafe/i,
  espresso: /portafilter|group head|pull (?:a|the) (?:double )?shot|lock in/i,
};

const HAZARD_NOTE: Record<Hazard, RegExp> = {
  steam: /steam/i,
  stove: /stove|boil|flame|burner/i,
  hot: /hot|scald|boil/i,
  grinder: /grinder/i,
  glass: /glass/i,
  espresso: /group head|portafilter|brew stream/i,
};

/**
 * Attach the drink's OWN authored safety notes to the steps that mention the matching hazard.
 * Never invents safety text; a step with no match simply has none (plan-level notes stay visible).
 */
export function safetyForStep(step: LocalizedText, notes: readonly LocalizedText[]): LocalizedText[] {
  const out: LocalizedText[] = [];
  for (const hazard of Object.keys(HAZARD_STEP) as Hazard[]) {
    if (!HAZARD_STEP[hazard].test(step.en ?? '')) continue;
    for (const n of notes) if (HAZARD_NOTE[hazard].test(n.en ?? '') && !out.includes(n)) out.push(n);
  }
  return out;
}

const DRINK_HELP = (d: DrinkRecipe): LocalizedText =>
  L(
    `这一步没有专门的提示。可以对照上方“示例配方”：${d.recipe.summary.zh} 机器或器具的具体操作以说明书为准；不确定时宁可放慢、先停下来。`,
    `No step-specific tip here. Check the illustrative recipe: ${d.recipe.summary.en} For machine or device controls, your manual wins; when unsure, slow down or pause.`,
  );

/** Build a kitchen-mode plan from a Drink Atlas recipe. */
export function planFromDrink(d: DrinkRecipe): PracticePlan {
  const brewKind = brewKindForDrink(d);
  const notes = [d.recipe.waterTempNote, d.recipe.timeNote].filter((n): n is LocalizedText => !!n);
  const logFields: LogField[] =
    d.recipe.doseG != null && d.recipe.outG != null
      ? ['doseG', 'outG', 'timeSec', 'grind', 'taste', 'rating', 'notes']
      : ['doseG', 'timeSec', 'taste', 'rating', 'notes'];
  return {
    id: drinkPracticeId(d.id),
    source: 'drink',
    lessonId: '',
    drinkId: d.id,
    title: d.name,
    intro: d.tagline,
    equipment: [...d.equipment],
    safetyNotes: [...d.safetyNotes],
    recipe: {
      doseG: d.recipe.doseG,
      outG: d.recipe.outG,
      milkMl: d.recipe.milkMl,
      summary: d.recipe.summary,
      notes,
    },
    brewKind,
    steps: d.steps.map((text, i) => {
      const timerSec = parseStepDurationSec(text);
      const safety = safetyForStep(text, d.safetyNotes);
      return {
        id: `s${i + 1}`,
        text,
        help: DRINK_HELP(d),
        ...(timerSec ? { timerSec, timerMode: timerModeForStep(text), timerFromText: true } : {}),
        ...(safety.length ? { safety } : {}),
      };
    }),
    logFields,
  };
}

export interface PlanSources {
  getActivity(id: string): Activity | undefined;
  getDrink(id: string): DrinkRecipe | undefined;
  drinkIds?: ReadonlySet<string>;
}

export type PlanResolution =
  | { ok: true; plan: PracticePlan }
  | { ok: false; reason: 'not-found' | 'not-practice' | 'empty'; id: string };

/** Route id → plan. Never throws. */
export function resolvePracticePlan(id: string, src: PlanSources): PlanResolution {
  try {
    const parsed = parsePracticeId(id);
    if (parsed.kind === 'drink') {
      const d = src.getDrink(parsed.drinkId);
      if (!d) return { ok: false, reason: 'not-found', id };
      const plan = planFromDrink(d);
      return plan.steps.length ? { ok: true, plan } : { ok: false, reason: 'empty', id };
    }
    const a = src.getActivity(parsed.activityId);
    if (!a) return { ok: false, reason: 'not-found', id };
    if (!isGuidedPractice(a)) return { ok: false, reason: 'not-practice', id };
    const plan = planFromActivity(a, src.drinkIds);
    return plan.steps.length ? { ok: true, plan } : { ok: false, reason: 'empty', id };
  } catch {
    return { ok: false, reason: 'not-found', id };
  }
}
