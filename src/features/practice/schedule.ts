/**
 * Pour-over pour schedule (pure, unit-tested). A SCHEDULE TO FOLLOW, not a measurement: the app never
 * knows what the learner's scale reads. It only says what an illustrative recipe would have the scale
 * reading at a given time since the learner tapped Start.
 *
 * Templates come from authored content:
 *  - 'cone'  — po-first-real-cup-guide (bloom ~40 g, wait to ~0:45; ~150 g by ~1:15; 250 g by ~2:00;
 *              many finish ~2:30–4:00) and the Atlas cone pour-over (15 g → 250 g, 2:30–4:00).
 *  - 'chemex'— Atlas Chemex (30 g → 500 g, bloom 60–90 g for 45 s, pour in stages, ~4–5 min).
 *              The split of the stages is illustrative (the content only says "in stages").
 * Scaling keeps the template's water:coffee ratio exactly (total via domain/brew outForRatio);
 * intermediate targets are rounded to 5 g because nobody pours to the gram mid-brew. Times are not
 * scaled (bigger batches usually run a little longer — the UI says so).
 */
import type { LocalizedText } from '../../domain/contracts';
import { brewRatio, outForRatio } from '../../domain/brew';

export type PourPhaseKind = 'pour' | 'wait' | 'drawdown';
export type PourTemplateId = 'cone' | 'chemex';

export interface PourPhaseDef {
  id: 'bloom-pour' | 'bloom-wait' | 'pour-1' | 'settle' | 'pour-2' | 'drawdown';
  kind: PourPhaseKind;
  startSec: number;
  endSec: number;
  /** Cumulative scale reading at the END of a pour phase, at the template's reference dose. */
  refTargetG?: number;
}

export interface PourTemplate {
  id: PourTemplateId;
  refDoseG: number;
  refWaterG: number;
  /** Allowed dose range for the scaling control. */
  doseRangeG: [number, number];
  phases: PourPhaseDef[];
  /** Total-time reference ("many finish around…"), seconds. */
  finishWindowSec: [number, number];
  /** True when the stage split is the app's illustration rather than authored timings. */
  stagesIllustrative: boolean;
}

export const POUR_TEMPLATES: Record<PourTemplateId, PourTemplate> = {
  cone: {
    id: 'cone',
    refDoseG: 15,
    refWaterG: 250,
    doseRangeG: [8, 30],
    phases: [
      { id: 'bloom-pour', kind: 'pour', startSec: 0, endSec: 10, refTargetG: 40 },
      { id: 'bloom-wait', kind: 'wait', startSec: 10, endSec: 45 },
      { id: 'pour-1', kind: 'pour', startSec: 45, endSec: 75, refTargetG: 150 },
      { id: 'settle', kind: 'wait', startSec: 75, endSec: 90 },
      { id: 'pour-2', kind: 'pour', startSec: 90, endSec: 120, refTargetG: 250 },
      { id: 'drawdown', kind: 'drawdown', startSec: 120, endSec: 180 },
    ],
    finishWindowSec: [150, 240],
    stagesIllustrative: false,
  },
  chemex: {
    id: 'chemex',
    refDoseG: 30,
    refWaterG: 500,
    doseRangeG: [15, 60],
    phases: [
      { id: 'bloom-pour', kind: 'pour', startSec: 0, endSec: 15, refTargetG: 75 },
      { id: 'bloom-wait', kind: 'wait', startSec: 15, endSec: 45 },
      { id: 'pour-1', kind: 'pour', startSec: 45, endSec: 105, refTargetG: 300 },
      { id: 'settle', kind: 'wait', startSec: 105, endSec: 120 },
      { id: 'pour-2', kind: 'pour', startSec: 120, endSec: 180, refTargetG: 500 },
      { id: 'drawdown', kind: 'drawdown', startSec: 180, endSec: 270 },
    ],
    finishWindowSec: [240, 300],
    stagesIllustrative: true,
  },
};

export interface ScaledPhase extends PourPhaseDef {
  /** Expected cumulative reading when the phase starts. */
  startG: number;
  /** Expected cumulative reading when the phase ends (equal to startG for waits/drawdown). */
  targetG: number;
}

export interface PourSchedule {
  templateId: PourTemplateId;
  doseG: number;
  waterG: number;
  /** water ÷ coffee, from the scaled numbers. */
  ratio: number;
  phases: ScaledPhase[];
  /** When the last pour should be finished. */
  pourEndSec: number;
  finishWindowSec: [number, number];
  stagesIllustrative: boolean;
}

const round5 = (g: number) => Math.round(g / 5) * 5;

/** Clamp a requested dose into the template's range (whole grams; non-finite → reference dose). */
export function clampDose(template: PourTemplate, doseG: number): number {
  if (!Number.isFinite(doseG)) return template.refDoseG;
  const [lo, hi] = template.doseRangeG;
  return Math.min(hi, Math.max(lo, Math.round(doseG)));
}

/** Scale a template to the learner's chosen dose. Ratio is preserved; the final target is the exact total. */
export function buildPourSchedule(template: PourTemplate, doseG: number): PourSchedule {
  const dose = clampDose(template, doseG);
  const refRatio = brewRatio(template.refDoseG, template.refWaterG);
  const waterG = Math.round(outForRatio(dose, refRatio));
  const lastPour = [...template.phases].reverse().find((p) => p.kind === 'pour');
  let level = 0;
  const phases: ScaledPhase[] = template.phases.map((p) => {
    const startG = level;
    if (p.kind === 'pour' && p.refTargetG != null) {
      const scaled = p === lastPour ? waterG : round5((p.refTargetG * dose) / template.refDoseG);
      // Never above the total, never below where we already are.
      level = Math.min(waterG, Math.max(startG, scaled));
    }
    return { ...p, startG, targetG: level };
  });
  return {
    templateId: template.id,
    doseG: dose,
    waterG,
    ratio: brewRatio(dose, waterG),
    phases,
    pourEndSec: lastPour ? lastPour.endSec : 0,
    finishWindowSec: template.finishWindowSec,
    stagesIllustrative: template.stagesIllustrative,
  };
}

export interface ScheduleStatus {
  /** Current phase index; equals phases.length once past the drawdown reference. */
  index: number;
  phase: ScaledPhase | null;
  /** Seconds into / left of the current phase (0 when past the end). */
  inPhaseSec: number;
  phaseLeftSec: number;
  /** What the schedule expects the scale to read now (linear within a pour). Not a measurement. */
  expectedG: number;
  /** The next pour phase that has not started yet. */
  nextPour: { index: number; phase: ScaledPhase; inSec: number } | null;
  /** True after the drawdown reference end: keep waiting until it drains, then stop. */
  over: boolean;
}

/** Where the schedule is at `tSec` seconds after the learner tapped Start. */
export function scheduleAt(s: PourSchedule, tSec: number): ScheduleStatus {
  const t = Number.isFinite(tSec) && tSec > 0 ? tSec : 0;
  const idx = s.phases.findIndex((p) => t < p.endSec);
  const index = idx === -1 ? s.phases.length : idx;
  const phase = s.phases[index] ?? null;
  let expectedG = s.waterG;
  if (phase) {
    if (phase.kind === 'pour') {
      const span = phase.endSec - phase.startSec;
      const f = span > 0 ? Math.min(1, Math.max(0, (t - phase.startSec) / span)) : 1;
      expectedG = phase.startG + (phase.targetG - phase.startG) * f;
    } else expectedG = phase.startG;
  }
  const next = s.phases.findIndex((p, i) => i > index && p.kind === 'pour');
  const nextPhase = next >= 0 ? s.phases[next]! : null;
  return {
    index,
    phase,
    inPhaseSec: phase ? Math.max(0, t - phase.startSec) : 0,
    phaseLeftSec: phase ? Math.max(0, phase.endSec - t) : 0,
    expectedG,
    nextPour: nextPhase ? { index: next, phase: nextPhase, inSec: Math.max(0, nextPhase.startSec - t) } : null,
    over: index >= s.phases.length,
  };
}

const L = (zh: string, en: string): LocalizedText => ({ zh, en });

/** Short instruction for a phase (numbers are the scaled schedule's). */
export function phaseInstruction(p: ScaledPhase): LocalizedText {
  switch (p.id) {
    case 'bloom-pour':
      return L(`闷蒸：慢慢注水到约 ${p.targetG} 克，浇湿所有咖啡粉`, `Bloom: pour slowly to about ${p.targetG} g, wetting all the grounds`);
    case 'bloom-wait':
      return L(`闷蒸：停手等待（秤上约 ${p.startG} 克）`, `Bloom: hands off and wait (scale about ${p.startG} g)`);
    case 'pour-1':
      return L(`从中心小圈注水到约 ${p.targetG} 克`, `Pour in small circles from the centre to about ${p.targetG} g`);
    case 'settle':
      return L('停一下，让水位降下一些', 'Pause and let the level drop a little');
    case 'pour-2':
      return L(`继续注水到 ${p.targetG} 克`, `Keep pouring to ${p.targetG} g`);
    case 'drawdown':
      return L('等它滴完——不用再注水', 'Drawdown: let it drain — no more pouring');
  }
}

/** Compact phase name for the timeline list. */
export function phaseName(p: Pick<PourPhaseDef, 'id'>): LocalizedText {
  switch (p.id) {
    case 'bloom-pour':
      return L('闷蒸注水', 'Bloom pour');
    case 'bloom-wait':
      return L('闷蒸等待', 'Bloom wait');
    case 'pour-1':
      return L('第一段注水', 'First pour');
    case 'settle':
      return L('稍停', 'Settle');
    case 'pour-2':
      return L('第二段注水', 'Second pour');
    case 'drawdown':
      return L('滴滤', 'Drawdown');
  }
}
