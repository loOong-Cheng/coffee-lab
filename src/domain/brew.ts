/**
 * Pure brew math. Ratio convention (see contracts ParameterLabActivity):
 *   espresso  → yield / dose  ("1:2.0" means 36 g out from 18 g in)
 *   pour-over → water / dose  ("1:16.0" means 240 g water for 15 g coffee)
 * Both are "output-ish grams divided by dry coffee grams", so one function serves both.
 * These are arithmetic facts, not flavor predictions.
 */

function assertFinite(name: string, value: number): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new RangeError(`${name} must be a finite number (got ${String(value)})`);
  }
}

/** out / dose. Throws RangeError for non-finite input, dose <= 0, or out < 0. */
export function brewRatio(doseG: number, outG: number): number {
  assertFinite('doseG', doseG);
  assertFinite('outG', outG);
  if (doseG <= 0) throw new RangeError(`doseG must be > 0 (got ${doseG})`);
  if (outG < 0) throw new RangeError(`outG must be >= 0 (got ${outG})`);
  return outG / doseG;
}

/** Same as brewRatio but returns null instead of throwing (handy for half-filled forms). */
export function tryBrewRatio(doseG: number | undefined | null, outG: number | undefined | null): number | null {
  if (doseG == null || outG == null) return null;
  try {
    return brewRatio(doseG, outG);
  } catch {
    return null;
  }
}

/**
 * Formats a ratio as "1:2.0" — locale-agnostic (always ASCII digits, '.' decimal, ':' separator)
 * so it reads identically in zh and en UI. Returns "1:–" for invalid input.
 */
export function formatRatio(ratio: number | null | undefined, digits = 1): string {
  if (ratio == null || !Number.isFinite(ratio) || ratio < 0) return '1:–';
  const d = Math.max(0, Math.min(3, Math.trunc(digits)));
  return `1:${ratio.toFixed(d)}`;
}

/** Convenience: formatRatio(tryBrewRatio(dose, out)). */
export function formatBrewRatio(doseG: number | undefined | null, outG: number | undefined | null, digits = 1): string {
  return formatRatio(tryBrewRatio(doseG, outG), digits);
}

/** Output grams needed to hit `ratio` from `doseG` (inverse of brewRatio). */
export function outForRatio(doseG: number, ratio: number): number {
  assertFinite('doseG', doseG);
  assertFinite('ratio', ratio);
  if (doseG <= 0) throw new RangeError(`doseG must be > 0 (got ${doseG})`);
  if (ratio < 0) throw new RangeError(`ratio must be >= 0 (got ${ratio})`);
  return doseG * ratio;
}
