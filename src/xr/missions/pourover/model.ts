/**
 * ILLUSTRATIVE pour-over model — not fluid dynamics and never a taste
 * prediction. It only makes kettle tilt and stream position matter in a
 * plausible way so the learner can practise steady, centred, staged pours.
 * Recipe numbers (15 g : 250 g, bloom ≈2× dose, 30–45 s) match the curriculum's
 * illustrative starting points (src/content/tracks/pourover.ts).
 */
import type { LocalizedText } from '../../../domain/contracts';

export const POUR = {
  illustrative: true,
  doseG: 15,
  targetWaterG: 250,
  /** Bloom ≈ 2× the dose (curriculum: 2–3×). */
  bloomIdealG: 30,
  bloomMinG: 24,
  bloomMaxG: 48,
  bloomWaitMinSec: 30,
  bloomWaitMaxSec: 45,
  rinseMinG: 20,
  /** The pour step counts as finished from here (and the learner has stopped pouring). */
  finishMinG: 240,
  overshootWarnG: 255,
  approachG: 235,
  kettleCapacityG: 600,
  maxFlowGps: 12,
  fullTiltDeg: 80,
  /** A pour ends after this long without flow. */
  pourEndGapSec: 0.4,
  /** Measured pours from the action list: steady flow and the largest single pulse. */
  pulseFlowGps: 4,
  maxPulseG: 100,
  /** Water held by wet grounds (g per g coffee). */
  retainedPerDose: 2,
  drainBaseGps: 1.5,
  drainPerFreeG: 0.06,
  rinseDrainGps: 25,
  /** Stream landing radius classes around the dripper centre, metres. */
  centerR: 0.022,
  bedR: 0.042,
  wallR: 0.064,
  wallWarnG: 3,
  spillWarnG: 3,
  carafeMassG: 300,
  dripperMassG: 120,
  filterMassG: 2,
} as const;

export const FLOW_MODEL_NOTE: LocalizedText = {
  en: 'Illustrative flow model: in this simulation more tilt means more flow. Real kettles differ with fill level, spout shape and hand.',
  zh: '示意流量模型：在本模拟中倾斜越多水流越大。真实水壶会因水量、壶嘴形状和手法而不同。',
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** Tilt (deg) at which water first reaches the spout; a fuller kettle pours sooner. */
export function pourThresholdDeg(fillFrac: number): number {
  return 12 + 28 * (1 - clamp01(fillFrac));
}

/** Flow (g/s) for a kettle tilt. Non-decreasing in tilt; 0 when upright or empty. */
export function flowFromTilt(tiltDeg: number, fillFrac = 1): number {
  if (!(fillFrac > 0) || !Number.isFinite(tiltDeg)) return 0;
  const th = pourThresholdDeg(fillFrac);
  if (tiltDeg <= th) return 0;
  const x = clamp01((tiltDeg - th) / (POUR.fullTiltDeg - th));
  return POUR.maxFlowGps * Math.pow(x, 1.3);
}

/** Inverse of flowFromTilt (used by the action list's "pour gently / faster"). */
export function tiltForFlow(flowGps: number, fillFrac = 1): number {
  const th = pourThresholdDeg(fillFrac);
  if (flowGps <= 0) return 0;
  const x = Math.pow(Math.min(1, flowGps / POUR.maxFlowGps), 1 / 1.3);
  return th + x * (POUR.fullTiltDeg - th);
}

export type StreamSpot = 'center' | 'bed' | 'wall' | 'off';

/** Where the stream lands, from its horizontal distance to the dripper centre (null = not over the dripper). */
export function classifyStream(offsetM: number | null): StreamSpot {
  if (offsetM === null || !Number.isFinite(offsetM)) return 'off';
  const r = Math.abs(offsetM);
  if (r <= POUR.centerR) return 'center';
  if (r <= POUR.bedR) return 'bed';
  if (r <= POUR.wallR) return 'wall';
  return 'off';
}

/** Free water draining from the bed into the carafe, g/s (illustrative). */
export function drainRate(freeG: number, hasGrounds: boolean): number {
  if (freeG <= 0) return 0;
  return hasGrounds ? POUR.drainBaseGps + POUR.drainPerFreeG * freeG : POUR.rinseDrainGps;
}

/** Running flow statistics (time-weighted) → steadiness 0..1 = 1 − coefficient of variation. */
export interface FlowStats {
  w: number;
  s1: number;
  s2: number;
}
export function addFlow(st: FlowStats, flow: number, dt: number): FlowStats {
  return { w: st.w + dt, s1: st.s1 + flow * dt, s2: st.s2 + flow * flow * dt };
}
export function flowSummary(st: FlowStats): { meanGps: number; steadiness: number } {
  if (st.w <= 0) return { meanGps: 0, steadiness: 0 };
  const mean = st.s1 / st.w;
  const variance = Math.max(0, st.s2 / st.w - mean * mean);
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 1;
  return { meanGps: Math.round(mean * 10) / 10, steadiness: Math.round(clamp01(1 - cv) * 100) / 100 };
}

/** 1 within ±5 g of the target, linearly to 0 at ±30 g. */
export function targetAccuracy(waterG: number, target: number = POUR.targetWaterG): number {
  const err = Math.abs(waterG - target);
  return Math.round(clamp01(1 - Math.max(0, err - 5) / 25) * 100) / 100;
}
