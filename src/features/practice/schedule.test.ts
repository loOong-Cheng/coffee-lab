import { describe, expect, it } from 'vitest';
import { formatRatio } from '../../domain/brew';
import { buildPourSchedule, clampDose, phaseInstruction, POUR_TEMPLATES, scheduleAt } from './schedule';

const cone = POUR_TEMPLATES.cone;
const chemex = POUR_TEMPLATES.chemex;

describe('pour schedule — reference recipe (matches the authored guide)', () => {
  it('15 g → bloom ~40 g, ~150 g, 250 g total at about 1:16.7', () => {
    const s = buildPourSchedule(cone, 15);
    expect(s.waterG).toBe(250);
    expect(formatRatio(s.ratio)).toBe('1:16.7');
    expect(s.phases.map((p) => [p.id, p.startG, p.targetG])).toEqual([
      ['bloom-pour', 0, 40],
      ['bloom-wait', 40, 40],
      ['pour-1', 40, 150],
      ['settle', 150, 150],
      ['pour-2', 150, 250],
      ['drawdown', 250, 250],
    ]);
    expect(s.pourEndSec).toBe(120);
    expect(s.finishWindowSec).toEqual([150, 210]);
    expect(s.stagesIllustrative).toBe(false);
  });

  it('Chemex 30 g → bloom 75 g (within the authored 60–90 g), 500 g total; stage split flagged illustrative', () => {
    const s = buildPourSchedule(chemex, 30);
    expect(s.phases.filter((p) => p.kind === 'pour').map((p) => p.targetG)).toEqual([75, 300, 500]);
    expect(s.phases[1]!.endSec).toBe(45); // "bloom … for 45 s"
    expect(s.stagesIllustrative).toBe(true);
  });
});

describe('pour schedule — scaling to the learner’s dose', () => {
  it('keeps the water:coffee ratio (total via domain math), rounds intermediate targets to 5 g', () => {
    const s = buildPourSchedule(cone, 20);
    expect(s.waterG).toBe(333); // 20 × 250/15 = 333.3
    expect(s.phases.filter((p) => p.kind === 'pour').map((p) => p.targetG)).toEqual([55, 200, 333]);
    // The shown ratio is the arithmetic of the shown (whole-gram) numbers: 333 ÷ 20 = 16.65.
    expect(s.ratio).toBeCloseTo(16.65, 5);
  });

  it('every dose in range: ratio within rounding of the reference, targets never decrease, last = total', () => {
    const ref = 250 / 15;
    for (let d = cone.doseRangeG[0]; d <= cone.doseRangeG[1]; d++) {
      const s = buildPourSchedule(cone, d);
      expect(Math.abs(s.waterG / d - ref)).toBeLessThanOrEqual(0.5 / d + 1e-9);
      const targets = s.phases.map((p) => p.targetG);
      targets.forEach((g, i) => expect(g).toBeGreaterThanOrEqual(i ? targets[i - 1]! : 0));
      expect(targets[targets.length - 1]).toBe(s.waterG);
      expect(Math.max(...targets)).toBeLessThanOrEqual(s.waterG);
    }
  });

  it('clamps the dose to the template range and to whole grams', () => {
    expect(clampDose(cone, 3)).toBe(8);
    expect(clampDose(cone, 99)).toBe(30);
    expect(clampDose(cone, 15.6)).toBe(16);
    expect(clampDose(cone, Number.NaN)).toBe(15);
    expect(buildPourSchedule(cone, 2).doseG).toBe(8);
  });
});

describe('scheduleAt — phase at time t', () => {
  const s = buildPourSchedule(cone, 15);

  it('starts in the bloom pour with 0 g expected; clamps negative/NaN time to 0', () => {
    expect(scheduleAt(s, 0)).toMatchObject({ index: 0, expectedG: 0, over: false });
    expect(scheduleAt(s, -5).index).toBe(0);
    expect(scheduleAt(s, Number.NaN).index).toBe(0);
  });

  it('interpolates the expected reading within a pour', () => {
    expect(scheduleAt(s, 5).expectedG).toBeCloseTo(20); // halfway to 40 g
    const mid = scheduleAt(s, 60); // halfway through 0:45–1:15 (40 → 150)
    expect(mid.phase?.id).toBe('pour-1');
    expect(mid.expectedG).toBeCloseTo(95);
    expect(mid.phaseLeftSec).toBe(15);
  });

  it('holds during waits and counts down to the next pour', () => {
    const w = scheduleAt(s, 20);
    expect(w.phase?.id).toBe('bloom-wait');
    expect(w.expectedG).toBe(40);
    expect(w.nextPour).toMatchObject({ inSec: 25 });
    expect(w.nextPour?.phase.id).toBe('pour-1');
    expect(scheduleAt(s, 80).nextPour).toMatchObject({ inSec: 10 });
    expect(scheduleAt(s, 80).nextPour?.phase.targetG).toBe(250);
  });

  it('phase boundaries belong to the next phase', () => {
    expect(scheduleAt(s, 10).phase?.id).toBe('bloom-wait');
    expect(scheduleAt(s, 45).phase?.id).toBe('pour-1');
    expect(scheduleAt(s, 120).phase?.id).toBe('drawdown');
  });

  it('drawdown has no next pour; after the reference end it is "over" with the full total', () => {
    const d = scheduleAt(s, 150);
    expect(d.phase?.id).toBe('drawdown');
    expect(d.nextPour).toBeNull();
    const o = scheduleAt(s, 200);
    expect(o).toMatchObject({ index: s.phases.length, phase: null, over: true, expectedG: 250, nextPour: null });
  });

  it('instructions use the scaled numbers', () => {
    const s20 = buildPourSchedule(cone, 20);
    expect(phaseInstruction(s20.phases[0]!).en).toContain('55 g');
    expect(phaseInstruction(s20.phases[4]!).en).toContain('333 g');
    expect(phaseInstruction(s20.phases[4]!).zh).toContain('333');
  });
});
