/**
 * ILLUSTRATIVE extraction model — not a physical simulation and not a taste
 * prediction. It only produces a plausible-looking yield curve so the learner
 * can practise watching a scale and stopping near a target. Real shots vary
 * with beans, grind, machine, puck prep and temperature.
 */

export const RECIPE = {
  /** Ground coffee dosed by the (simulated) grinder, grams. */
  doseG: 18,
  /** Target beverage weight in the cup, grams (1:2 — a common illustrative starting point). */
  targetYieldG: 36,
} as const;

export const MODEL = {
  /** Seconds after pressing brew before the first drops reach the cup. */
  firstDropsSec: 5,
  /** Flow ramps linearly from 0 to steady over this many seconds. */
  rampSec: 3,
  /** Steady flow into the cup, g/s. */
  flowGPerSec: 1.65,
  /** Espresso that still drips in after pressing stop, grams. */
  postStopDripG: 0.8,
  /** Duration of those last drips, seconds. */
  settleSec: 1.2,
  /** Simulated machine cut-off if the learner never stops (ratio 1:3), grams. */
  autoStopYieldG: 54,
  /** Simulated grinder run time (shortened for play), seconds. */
  grindSec: 3,
  /** Group-head flush duration, seconds. */
  flushSec: 2,
  /** Show the "almost there" cue from this many grams below target. */
  approachWindowG: 6,
  /** Empty espresso cup weight on the scale, grams. */
  cupMassG: 92,
} as const;

/** Yield (g) in the cup t seconds after the shot started. Monotonic, illustrative. */
export function yieldAt(tSec: number, m: typeof MODEL = MODEL): number {
  if (tSec <= m.firstDropsSec) return 0;
  const t = tSec - m.firstDropsSec;
  if (t <= m.rampSec) return (m.flowGPerSec * t * t) / (2 * m.rampSec);
  return (m.flowGPerSec * m.rampSec) / 2 + m.flowGPerSec * (t - m.rampSec);
}

/** Inverse of yieldAt: shot time at which a given yield is reached. */
export function timeForYield(yieldG: number, m: typeof MODEL = MODEL): number {
  if (yieldG <= 0) return m.firstDropsSec;
  const rampYield = (m.flowGPerSec * m.rampSec) / 2;
  if (yieldG <= rampYield) return m.firstDropsSec + Math.sqrt((2 * m.rampSec * yieldG) / m.flowGPerSec);
  return m.firstDropsSec + m.rampSec + (yieldG - rampYield) / m.flowGPerSec;
}

export type StopBand = 'on-target' | 'close' | 'far';

export interface StopAccuracy {
  targetG: number;
  finalYieldG: number;
  errorG: number;
  direction: 'under' | 'over' | 'on';
  band: StopBand;
  /** 0..1 — 1 within ±1 g, linearly to 0 at ±10 g. */
  score: number;
  /** Yield ÷ dose, e.g. 2.0 for 1:2. */
  ratio: number;
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function scoreStop(finalYieldG: number, targetG: number = RECIPE.targetYieldG, doseG: number = RECIPE.doseG): StopAccuracy {
  const signed = finalYieldG - targetG;
  const errorG = Math.abs(signed);
  const band: StopBand = errorG <= 1.5 ? 'on-target' : errorG <= 4 ? 'close' : 'far';
  const score = Math.max(0, Math.min(1, 1 - Math.max(0, errorG - 1) / 9));
  return {
    targetG,
    finalYieldG: round1(finalYieldG),
    errorG: round1(errorG),
    direction: errorG <= 1.5 ? 'on' : signed < 0 ? 'under' : 'over',
    band,
    score: Math.round(score * 100) / 100,
    ratio: Math.round((finalYieldG / doseG) * 100) / 100,
  };
}
