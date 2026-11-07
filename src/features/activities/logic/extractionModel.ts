/**
 * ILLUSTRATIVE extraction model for the "Extraction Explorer" parameter lab.
 *
 * This is a deliberately simple teaching toy that shows the DIRECTION of cause and effect
 * (more water / longer contact / finer grind → more extraction; more water → weaker drink).
 * It is NOT a chemistry model and NOT a taste prediction: real results depend on beans, roast,
 * grinder, machine, water and the drinker. Every consumer must show the `illustrative` label.
 */

export interface ExtractionInputs {
  doseG: number;
  outG: number;
  /** Contact / shot time in seconds. */
  timeSec: number;
  /** Virtual grind dial: 1 = finest … 10 = coarsest. */
  grind: number;
}

export type ExtractionZone = 'under' | 'balanced' | 'over';

export interface ExtractionModelResult {
  /** 0..1 index: how far along the (illustrative) extraction scale the brew sits. Not a percentage yield. */
  extraction: number;
  /** 0..1 index: how concentrated the drink is (driven by the brew ratio only). */
  strength: number;
  zone: ExtractionZone;
  ratio: number | null;
  /** Always true — a type-level reminder that this is a teaching model. */
  illustrative: true;
}

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

/** Model range constants (exported so the UI can explain them). */
export const MODEL_RANGES = {
  ratio: [1, 3.5] as const,
  timeSec: [10, 60] as const,
  grind: [1, 10] as const,
};

/** Zone thresholds on the extraction index. */
export const ZONE_THRESHOLDS = { under: 0.35, over: 0.65 } as const;

const WEIGHTS = { ratio: 0.4, time: 0.3, grind: 0.3 } as const;

export function extractionModel(input: ExtractionInputs): ExtractionModelResult {
  const ratio = input.doseG > 0 && Number.isFinite(input.doseG) && Number.isFinite(input.outG) && input.outG >= 0 ? input.outG / input.doseG : null;
  const [rMin, rMax] = MODEL_RANGES.ratio;
  const [tMin, tMax] = MODEL_RANGES.timeSec;
  const [gMin, gMax] = MODEL_RANGES.grind;

  const rTerm = ratio === null ? 0 : clamp01((ratio - rMin) / (rMax - rMin));
  const tTerm = clamp01((input.timeSec - tMin) / (tMax - tMin));
  // Finer grind (lower number) → more surface area → more extraction.
  const gTerm = clamp01((gMax - input.grind) / (gMax - gMin));

  const extraction = clamp01(WEIGHTS.ratio * rTerm + WEIGHTS.time * tTerm + WEIGHTS.grind * gTerm);
  const strength = ratio === null ? 0 : clamp01((rMax - ratio) / (rMax - rMin));
  const zone: ExtractionZone =
    extraction < ZONE_THRESHOLDS.under ? 'under' : extraction > ZONE_THRESHOLDS.over ? 'over' : 'balanced';

  return { extraction, strength, zone, ratio, illustrative: true };
}
