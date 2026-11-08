/**
 * Brew companions for kitchen mode (pure detection, unit-tested):
 *  - 'shot-timer'    — espresso: a big Start/Stop the learner taps when THEY start and stop the pump.
 *  - 'pour-schedule' — pour-over: a user-started schedule of target scale readings over time.
 * Both only measure the interval between the learner's own taps; neither senses the machine or the scale,
 * and neither ever completes a step (lead rule: completion is always a self-reported tap).
 */
import type { DrinkRecipe, GuidedPracticeActivity, LocalizedText } from '../../domain/contracts';
import type { PourTemplateId } from './schedule';

/** Common beginner reference for an espresso shot (rule of thumb; mirrors journal/advice ESPRESSO_REFERENCE_WINDOW). */
export const SHOT_REFERENCE_SEC: [number, number] = [25, 35];

export interface ShotTimerSpec {
  kind: 'shot-timer';
  /** Steps sharing one shot timer, e.g. ['brew', 'stop']. A plan may have several shots (dial-in session). */
  groups: string[][];
  doseG?: number;
  targetOutG?: number;
  /** Illustrative time reference for comparison (never a pass mark). */
  referenceSec: [number, number];
  /** Where the reference came from: the recipe's own numbers, or the common beginner window. */
  referenceFrom: 'recipe' | 'common';
}

export interface PourScheduleSpec {
  kind: 'pour-schedule';
  templateId: PourTemplateId;
  /** Steps on which the schedule is shown (bloom → drawdown). */
  stepIds: string[];
  /** The recipe's own dose: the default for the scaling control. */
  doseG: number;
}

export type CompanionSpec = ShotTimerSpec | PourScheduleSpec;

/** Timer slot for a shot group (persisted per plan). */
export function shotSlot(group: readonly string[]): string {
  return `shot:${group[0] ?? 'x'}`;
}

export function companionGroupForStep(c: CompanionSpec | undefined, stepId: string): string[] | null {
  if (!c) return null;
  if (c.kind === 'pour-schedule') return c.stepIds.includes(stepId) ? c.stepIds : null;
  return c.groups.find((g) => g.includes(stepId)) ?? null;
}

// ───────────────────────── detection ─────────────────────────

/** A step where the learner starts an espresso extraction. */
const SHOT_START = /\b(?:start the shot|pull (?:a |the )?(?:double )?shot|brew (?:the )?(?:double )?shot|press brew|pull (?:again|the starting recipe))\b|^\s*shot\s+\d+\s*:/i;
/** The step right after, where they stop it ("Stop near 36 g…"). */
const SHOT_STOP = /^\s*stop\b/i;

/** "About 25–30 s", "Commonly 20–30 s" → [25, 30]. */
export function parseSecondsRange(text: LocalizedText | undefined): [number, number] | null {
  const m = text?.en?.match(/(\d+)\s*[–—-]\s*(\d+)\s*s\b/);
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[2]);
  return a > 0 && b >= a && b <= 120 ? [a, b] : null;
}

function shotGroups(steps: ReadonlyArray<{ id: string; text: LocalizedText }>): string[][] {
  const groups: string[][] = [];
  steps.forEach((s, i) => {
    if (!SHOT_START.test(s.text.en ?? '')) return;
    const g = [s.id];
    const next = steps[i + 1];
    if (next && SHOT_STOP.test(next.text.en ?? '')) g.push(next.id);
    groups.push(g);
  });
  return groups;
}

const POUR_TEMPLATE_FOR_DRINK: Record<string, PourTemplateId> = {
  'pourover-cone': 'cone',
  'chemex-brew': 'chemex',
};

/** Bloom step → drain step (inclusive), by text. */
function pourWindow(steps: ReadonlyArray<{ id: string; text: LocalizedText }>): string[] | null {
  const start = steps.findIndex((s) => /\bbloom\b/i.test(s.text.en ?? ''));
  if (start < 0) return null;
  const endRel = steps.slice(start).findIndex((s) => /\bdrain/i.test(s.text.en ?? ''));
  const end = endRel < 0 ? steps.length - 1 : start + endRel;
  return steps.slice(start, end + 1).map((s) => s.id);
}

export function companionForActivity(a: GuidedPracticeActivity): CompanionSpec | undefined {
  if (a.id === 'po-first-real-cup-guide') {
    const ids = ['bloom', 'pour-1', 'pour-2', 'drawdown'].filter((id) => a.steps.some((s) => s.id === id));
    if (ids.length && a.recipe) return { kind: 'pour-schedule', templateId: 'cone', stepIds: ids, doseG: a.recipe.doseG };
    return undefined;
  }
  const espresso = a.equipment.includes('espresso-machine') || a.equipment.includes('portafilter');
  if (!espresso || !a.logFields.includes('timeSec')) return undefined;
  const groups = shotGroups(a.steps);
  if (!groups.length) return undefined;
  return {
    kind: 'shot-timer',
    groups,
    doseG: a.recipe?.doseG,
    targetOutG: a.recipe?.outG,
    referenceSec: a.recipe?.targetTimeSec ? [a.recipe.targetTimeSec[0], a.recipe.targetTimeSec[1]] : SHOT_REFERENCE_SEC,
    referenceFrom: a.recipe?.targetTimeSec ? 'recipe' : 'common',
  };
}

export function companionForDrink(d: DrinkRecipe, stepIds: readonly string[]): CompanionSpec | undefined {
  const steps = d.steps.map((text, i) => ({ id: stepIds[i] ?? `s${i + 1}`, text }));
  if (d.category === 'espresso' || d.category === 'espresso-milk') {
    const groups = shotGroups(steps);
    if (!groups.length) return undefined;
    const ref = parseSecondsRange(d.recipe.timeNote);
    return {
      kind: 'shot-timer',
      groups,
      doseG: d.recipe.doseG,
      targetOutG: d.recipe.outG,
      referenceSec: ref ?? SHOT_REFERENCE_SEC,
      referenceFrom: ref ? 'recipe' : 'common',
    };
  }
  const templateId = POUR_TEMPLATE_FOR_DRINK[d.id];
  if (d.category === 'pourover' && templateId && d.recipe.doseG != null) {
    const ids = pourWindow(steps);
    if (ids?.length) return { kind: 'pour-schedule', templateId, stepIds: ids, doseG: d.recipe.doseG };
  }
  return undefined;
}
