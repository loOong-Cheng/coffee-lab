/**
 * Guidance tiers as plain data (unit-tested). Brief §5 XR:
 * (1) guided — full ghost cues/arrows, labels, forgiving snap;
 * (2) assisted — contextual cues only after idle or on request, reduced assist;
 * (3) independent — no step labels, tight snap, still reset + hints on request + accessibility.
 */
import type { Guidance } from '../../domain/contracts';

export type ZoneRingMode = 'all-compatible' | 'near' | 'snap-only';

export interface TierParams {
  id: Guidance;
  /** Release within this distance (m) of a compatible zone snaps the item in. */
  snapRadiusM: number;
  /** Releases within this distance (but outside snap) count as a near-miss with a "closer" hint. */
  nearRadiusM: number;
  /** Max orientation error (deg) accepted when locking the portafilter into the group head. */
  snapAngleDeg: number;
  /** Tamper tilt above this triggers a gentle "level it" note (tamp still counts). */
  tampTiltToleranceDeg: number;
  /** When ghost/arrow/target-highlight cues are visible. */
  cues: 'always' | 'idle-or-hint' | 'hint-only';
  /** Assisted: idle seconds before cues appear on their own. */
  autoCueAfterIdleSec: number | null;
  /** Show "Step n/13 — title" labels. */
  stepLabels: 'always' | 'with-cues' | 'hint-only';
  /** Show the next-step instruction text. */
  nextStepText: 'always' | 'with-cues';
  /** Floating name tags over tools (hover info panels exist in every tier). */
  toolTags: 'always' | 'hover';
  /** Visual "almost there" cue on the shot monitor as the yield nears target. */
  yieldCue: boolean;
  /** Which zone rings appear while holding an item. */
  zoneRings: ZoneRingMode;
  /** How long a requested hint keeps cues on, seconds. */
  hintDurationSec: number;
}

export const TIERS: Record<Guidance, TierParams> = {
  guided: {
    id: 'guided',
    snapRadiusM: 0.12,
    nearRadiusM: 0.25,
    snapAngleDeg: 60,
    tampTiltToleranceDeg: 15,
    cues: 'always',
    autoCueAfterIdleSec: null,
    stepLabels: 'always',
    nextStepText: 'always',
    toolTags: 'always',
    yieldCue: true,
    zoneRings: 'all-compatible',
    hintDurationSec: 10,
  },
  assisted: {
    id: 'assisted',
    snapRadiusM: 0.07,
    nearRadiusM: 0.15,
    snapAngleDeg: 35,
    tampTiltToleranceDeg: 10,
    cues: 'idle-or-hint',
    autoCueAfterIdleSec: 12,
    stepLabels: 'always',
    nextStepText: 'with-cues',
    toolTags: 'hover',
    yieldCue: false,
    zoneRings: 'near',
    hintDurationSec: 8,
  },
  independent: {
    id: 'independent',
    snapRadiusM: 0.045,
    nearRadiusM: 0.1,
    snapAngleDeg: 20,
    tampTiltToleranceDeg: 7,
    cues: 'hint-only',
    autoCueAfterIdleSec: null,
    stepLabels: 'hint-only',
    nextStepText: 'with-cues',
    toolTags: 'hover',
    yieldCue: false,
    zoneRings: 'snap-only',
    hintDurationSec: 6,
  },
};

export const GUIDANCE_ORDER: readonly Guidance[] = ['guided', 'assisted', 'independent'];

export function tierParams(g: Guidance): TierParams {
  return TIERS[g];
}

/** Lower index = more support. */
export function mostSupportive(used: readonly Guidance[]): Guidance {
  let best: Guidance = used[0] ?? 'guided';
  for (const g of used) if (GUIDANCE_ORDER.indexOf(g) < GUIDANCE_ORDER.indexOf(best)) best = g;
  return best;
}

export type SnapResult = 'snap' | 'near' | 'none';

/** Pure snap decision used by every input adapter. Missing angle = orientation not checked. */
export function evaluateSnap(
  tier: TierParams,
  distanceM: number | undefined,
  angleDeg?: number,
): { result: SnapResult; angleOk: boolean } {
  if (distanceM === undefined || !Number.isFinite(distanceM)) return { result: 'none', angleOk: true };
  const angleOk = angleDeg === undefined || Math.abs(angleDeg) <= tier.snapAngleDeg;
  if (distanceM <= tier.snapRadiusM && angleOk) return { result: 'snap', angleOk };
  if (distanceM <= tier.nearRadiusM || (distanceM <= tier.snapRadiusM && !angleOk)) return { result: 'near', angleOk };
  return { result: 'none', angleOk };
}

export interface CueVisibility {
  /** Ghost copy of the item at its target + arrow + pulsing target highlight. */
  cues: boolean;
  stepLabel: boolean;
  nextStepText: boolean;
  toolTags: boolean;
  yieldCue: boolean;
  reason: 'tier' | 'idle' | 'hint' | null;
}

/** Which guidance affordances are visible right now (pure; adapters render it). */
export function cueVisibility(
  guidance: Guidance,
  ctx: { idleSec: number; elapsedSec: number; hintUntilSec: number | null },
): CueVisibility {
  const t = TIERS[guidance];
  const hintActive = ctx.hintUntilSec !== null && ctx.elapsedSec < ctx.hintUntilSec;
  let reason: CueVisibility['reason'] = null;
  if (t.cues === 'always') reason = 'tier';
  else if (hintActive) reason = 'hint';
  else if (t.cues === 'idle-or-hint' && t.autoCueAfterIdleSec !== null && ctx.idleSec >= t.autoCueAfterIdleSec)
    reason = 'idle';
  const cues = reason !== null;
  return {
    cues,
    stepLabel: t.stepLabels === 'always' || (t.stepLabels === 'with-cues' && cues) || hintActive,
    nextStepText: t.nextStepText === 'always' || cues,
    toolTags: t.toolTags === 'always',
    yieldCue: t.yieldCue || hintActive,
    reason,
  };
}
