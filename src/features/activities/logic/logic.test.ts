import { describe, expect, it } from 'vitest';
import type { LocalizedText, ParameterLabActivity, QuizActivity, DiagnoseActivity } from '../../../domain/contracts';
import { checkChallenge, clampToRange, suggestedOut } from './ratioLab';
import { checkNextStep, checkSequence, detectMisconceptions, moveItem, relocate, shuffleSteps } from './sequence';
import { evaluateOption, quizComplete, quizScore, recordAttempt, type QuizAttempts } from './quiz';
import { extractionModel, ZONE_THRESHOLDS } from './extractionModel';
import { guidancePolicy, isGuidanceSensitive } from './guidance';
import { diagnoseScore, scenarioResolved } from './diagnose';
import { evidenceForKind } from './evidence';

const L = (en: string): LocalizedText => ({ zh: en, en });

describe('sequence logic', () => {
  const correct = ['harvest', 'process', 'roast', 'grind', 'brew'];
  const misconceptions = [
    { earlierStep: 'roast', laterStep: 'grind', feedback: L('roast before grinding') },
    { earlierStep: 'process', laterStep: 'roast', feedback: L('dry seeds first') },
  ];

  it('scores by correct positions and flags the first wrong slot', () => {
    const r = checkSequence(['harvest', 'process', 'grind', 'roast', 'brew'], correct, misconceptions);
    expect(r.correctPositions).toEqual([true, true, false, false, true]);
    expect(r.correctCount).toBe(3);
    expect(r.score).toBeCloseTo(0.6);
    expect(r.allCorrect).toBe(false);
    expect(r.firstWrongIndex).toBe(2);
  });

  it('detects misconceptions only when the later step is placed ahead of the earlier one', () => {
    const r = checkSequence(['harvest', 'process', 'grind', 'roast', 'brew'], correct, misconceptions);
    expect(r.misconceptions.map((m) => m.feedback.en)).toEqual(['roast before grinding']);
    expect(detectMisconceptions(correct, misconceptions)).toEqual([]);
    expect(detectMisconceptions(['roast', 'process'], misconceptions)).toHaveLength(1);
  });

  it('a perfect order is allCorrect with score 1', () => {
    const r = checkSequence(correct, correct, misconceptions);
    expect(r.allCorrect).toBe(true);
    expect(r.score).toBe(1);
    expect(r.firstWrongIndex).toBe(-1);
  });

  it('guided next-step check returns the misconception for a jump-ahead', () => {
    expect(checkNextStep(['harvest'], 'process', correct, misconceptions).ok).toBe(true);
    const bad = checkNextStep(['harvest', 'process'], 'grind', correct, misconceptions);
    expect(bad.ok).toBe(false);
    expect(bad.expected).toBe('roast');
    expect(bad.misconception?.feedback.en).toBe('roast before grinding');
    // No misconception authored for this jump → still wrong, no targeted text.
    expect(checkNextStep(['harvest'], 'brew', correct, misconceptions).misconception).toBeUndefined();
  });

  it('shuffle is deterministic, a permutation, and never the solved order', () => {
    for (let seed = 1; seed < 200; seed++) {
      const s = shuffleSteps(correct, seed);
      expect([...s].sort()).toEqual([...correct].sort());
      expect(s).not.toEqual(correct);
      expect(shuffleSteps(correct, seed)).toEqual(s);
    }
    expect(shuffleSteps(['a', 'b'], 7)).toEqual(['b', 'a']);
  });

  it('moveItem / relocate reorder without mutating', () => {
    const list = ['a', 'b', 'c'];
    expect(moveItem(list, 0, 1)).toEqual(['b', 'a', 'c']);
    expect(moveItem(list, 0, -1)).toEqual(list);
    expect(relocate(list, 2, 0)).toEqual(['c', 'a', 'b']);
    expect(list).toEqual(['a', 'b', 'c']);
  });
});

describe('quiz logic', () => {
  const q: QuizActivity['questions'][number] = {
    id: 'q1',
    prompt: L('Botanically, what is a coffee bean?'),
    options: [
      { id: 'seed', text: L('seed'), correct: true, feedback: L('Right — the seed.') },
      { id: 'legume', text: L('legume'), correct: false, feedback: L('Called a bean, but not a legume.') },
    ],
    explanation: L('Bean = seed of the cherry.'),
  };

  it('returns option-specific misconception feedback plus the explanation', () => {
    const wrong = evaluateOption(q, 'legume');
    expect(wrong.correct).toBe(false);
    expect(wrong.feedback.en).toBe('Called a bean, but not a legume.');
    expect(wrong.explanation.en).toBe('Bean = seed of the cherry.');
    expect(wrong.correctOptionId).toBe('seed');
    expect(evaluateOption(q, 'seed').correct).toBe(true);
    expect(evaluateOption(q, 'nope').correct).toBe(false);
  });

  it('scores first tries only; completes once every question is eventually right', () => {
    const q2 = { ...q, id: 'q2' };
    let a: QuizAttempts = {};
    a = recordAttempt(a, 'q1', 'legume');
    a = recordAttempt(a, 'q1', 'seed');
    a = recordAttempt(a, 'q2', 'seed');
    expect(quizScore([q, q2], a)).toBe(0.5);
    expect(quizComplete([q, q2], a)).toBe(true);
    expect(quizComplete([q, q2], { q1: ['legume'] })).toBe(false);
  });
});

describe('ratio lab challenge checks', () => {
  const ch: ParameterLabActivity['challenges'][number] = {
    id: 'c',
    prompt: L('16 g at about 1:2'),
    target: { ratioMin: 1.9, ratioMax: 2.1, doseG: [15.5, 16.5] },
    success: L('ok'),
  };

  it('passes inside the band (inclusive edges) and fails outside', () => {
    expect(checkChallenge(ch, 16, 32).ok).toBe(true);
    expect(checkChallenge(ch, 16, 33.6).ok).toBe(true); // exactly 2.1
    expect(checkChallenge(ch, 16, 40).ok).toBe(false);
  });

  it('gives a direction: dose first, then yield', () => {
    expect(checkChallenge(ch, 18, 32).direction).toBe('less-dose');
    expect(checkChallenge(ch, 14, 28).direction).toBe('more-dose');
    expect(checkChallenge(ch, 16, 20).direction).toBe('more-out');
    expect(checkChallenge(ch, 16, 48).direction).toBe('less-out');
  });

  it('computes the ratio with domain maths (20 g at 1:2.25 → 45 g)', () => {
    const recipe = { ...ch, target: { ratioMin: 2.2, ratioMax: 2.3, doseG: [19.5, 20.5] as [number, number] } };
    const r = checkChallenge(recipe, 20, 45);
    expect(r.ratio).toBeCloseTo(2.25);
    expect(r.ok).toBe(true);
    expect(suggestedOut(recipe, 20)).toBe(45);
  });

  it('clampToRange snaps and clamps typed values', () => {
    expect(clampToRange(18.26, [7, 24], 0.5)).toBe(18.5);
    expect(clampToRange(99, [7, 24])).toBe(24);
    expect(clampToRange(Number.NaN, [7, 24])).toBe(7);
  });
});

describe('illustrative extraction model', () => {
  const base = { doseG: 18, outG: 36, timeSec: 28, grind: 5 };

  it('is flagged illustrative and lands in the balanced zone at the common starting point', () => {
    const r = extractionModel(base);
    expect(r.illustrative).toBe(true);
    expect(r.zone).toBe('balanced');
    expect(r.ratio).toBeCloseTo(2);
  });

  it('extraction rises monotonically with yield, time and finer grind', () => {
    let prev = -1;
    for (let out = 14; out <= 66; out += 4) {
      const e = extractionModel({ ...base, outG: out }).extraction;
      expect(e).toBeGreaterThanOrEqual(prev);
      prev = e;
    }
    prev = -1;
    for (let t = 10; t <= 60; t += 5) {
      const e = extractionModel({ ...base, timeSec: t }).extraction;
      expect(e).toBeGreaterThanOrEqual(prev);
      prev = e;
    }
    prev = -1;
    for (let g = 10; g >= 1; g--) {
      const e = extractionModel({ ...base, grind: g }).extraction;
      expect(e).toBeGreaterThanOrEqual(prev);
      prev = e;
    }
  });

  it('strength falls as the ratio gets longer; outputs stay in 0..1', () => {
    expect(extractionModel({ ...base, outG: 27 }).strength).toBeGreaterThan(extractionModel({ ...base, outG: 54 }).strength);
    const extremes = [
      extractionModel({ doseG: 14, outG: 66, timeSec: 60, grind: 1 }),
      extractionModel({ doseG: 22, outG: 14, timeSec: 10, grind: 10 }),
      extractionModel({ doseG: 0, outG: 30, timeSec: 30, grind: 5 }),
    ];
    for (const r of extremes) {
      expect(r.extraction).toBeGreaterThanOrEqual(0);
      expect(r.extraction).toBeLessThanOrEqual(1);
      expect(r.strength).toBeGreaterThanOrEqual(0);
      expect(r.strength).toBeLessThanOrEqual(1);
    }
    expect(extremes[0]!.zone).toBe('over');
    expect(extremes[1]!.zone).toBe('under');
    expect(extremes[2]!.ratio).toBeNull();
    expect(ZONE_THRESHOLDS.under).toBeLessThan(ZONE_THRESHOLDS.over);
  });
});

describe('guidance tiers change behaviour', () => {
  it('guided shows hints and checks instantly; independent hides hints and defers feedback', () => {
    const g = guidancePolicy('guided');
    const a = guidancePolicy('assisted');
    const i = guidancePolicy('independent');
    expect(g.hintVisible && g.instantFeedback).toBe(true);
    expect(a.hintVisible).toBe(false);
    expect(a.hintOnRequest).toBe(true);
    expect(a.instantFeedback).toBe(false);
    expect(i.hintOnRequest).toBe(false);
    expect(i.deferredFeedback).toBe(true);
    expect(i.directionalHints).toBe(false);
    expect(g.highlightAfterMisses).toBeLessThan(a.highlightAfterMisses);
    expect(i.highlightAfterMisses).toBe(Number.POSITIVE_INFINITY);
    expect(isGuidanceSensitive('sequence') && isGuidanceSensitive('quiz')).toBe(true);
    expect(isGuidanceSensitive('explain')).toBe(false);
  });
});

describe('diagnose + evidence', () => {
  const s: DiagnoseActivity['scenarios'][number] = {
    id: 's1',
    situation: L('fast and sour'),
    observations: { doseG: 18, outG: 36, timeSec: 15 },
    choices: [
      { id: 'finer', text: L('finer'), quality: 'best', feedback: L('yes') },
      { id: 'longer', text: L('longer'), quality: 'reasonable', feedback: L('maybe') },
      { id: 'all', text: L('all'), quality: 'unhelpful', feedback: L('no') },
    ],
    caveat: L('depends'),
  };

  it('scores first pick quality and resolves only on the best choice', () => {
    expect(diagnoseScore([s], { s1: ['longer', 'finer'] })).toBe(0.5);
    expect(scenarioResolved(s, { s1: ['longer'] })).toBe(false);
    expect(scenarioResolved(s, { s1: ['longer', 'finer'] })).toBe(true);
  });

  it('maps kinds to honest evidence', () => {
    expect(evidenceForKind('quiz')).toBe('assessed_answer');
    expect(evidenceForKind('reflect')).toBe('self_report');
    expect(evidenceForKind('explain')).toBe('observed_by_app');
    expect(evidenceForKind('guided-practice')).toBe('self_report');
    expect(evidenceForKind('spatial-practice')).toBe('simulated');
  });
});
