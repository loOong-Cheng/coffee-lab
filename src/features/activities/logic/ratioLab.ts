/**
 * Parameter-lab challenge checks. All arithmetic goes through src/domain/brew (the single source of
 * ratio maths); this file only compares against challenge targets and phrases a direction.
 */
import type { ParameterLabActivity } from '../../../domain/contracts';
import { tryBrewRatio } from '../../../domain/brew';

export type LabChallenge = ParameterLabActivity['challenges'][number];

const EPS = 1e-9;

export type LabDirection = 'more-out' | 'less-out' | 'more-dose' | 'less-dose';

export interface ChallengeCheck {
  ok: boolean;
  ratio: number | null;
  ratioOk: boolean;
  doseOk: boolean;
  /** Which way to move first (dose is fixed first because the ratio depends on it). */
  direction?: LabDirection;
}

export function checkChallenge(ch: LabChallenge, doseG: number, outG: number): ChallengeCheck {
  const ratio = tryBrewRatio(doseG, outG);
  const [dMin, dMax] = ch.target.doseG ?? [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY];
  const doseOk = doseG >= dMin - EPS && doseG <= dMax + EPS;
  const ratioOk = ratio !== null && ratio >= ch.target.ratioMin - EPS && ratio <= ch.target.ratioMax + EPS;
  let direction: LabDirection | undefined;
  if (!doseOk) direction = doseG < dMin ? 'more-dose' : 'less-dose';
  else if (!ratioOk) direction = ratio === null || ratio < ch.target.ratioMin ? 'more-out' : 'less-out';
  return { ok: doseOk && ratioOk, ratio, ratioOk, doseOk, direction };
}

/** Output grams that would land in the middle of the target ratio band (for "show me" in guided mode). */
export function suggestedOut(ch: LabChallenge, doseG: number): number {
  const mid = (ch.target.ratioMin + ch.target.ratioMax) / 2;
  return Math.round(doseG * mid);
}

/** Clamp + snap a slider value to its range/step (keeps typed numbers sane). */
export function clampToRange(value: number, [min, max]: readonly [number, number], step = 0.5): number {
  if (!Number.isFinite(value)) return min;
  const snapped = Math.round(value / step) * step;
  return Math.min(max, Math.max(min, Number(snapped.toFixed(3))));
}
