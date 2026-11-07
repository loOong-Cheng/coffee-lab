import { describe, expect, it } from 'vitest';
import type { LearningEvent } from '../../domain/contracts';
import {
  CUP_CAPACITY_ML,
  cafeActivityId,
  cafeMastery,
  composeRound,
  cupLayers,
  emptyBuild,
  evaluate,
  isComplete,
  missingChoices,
  perfectMatchOther,
  recommendedLevel,
  seededRandom,
  statusFor,
  toggleExtra,
  visibleStations,
  type CompleteBuild,
} from './model';
import { BUILD_SPECS, getBuildSpec } from './specs';
import { genericWhy, valueText } from './strings';

const spec = (id: string) => getBuildSpec(id)!;
const withPatch = (id: string, patch: Partial<CompleteBuild>): CompleteBuild => ({ ...spec(id).canonical, ...patch });

describe('evaluate: specific, explainable differences', () => {
  it('flat white made with thick foam → one milk-texture diff, “partly”, explains flat white vs cappuccino', () => {
    const e = evaluate(withPatch('flat-white', { milk: 'foam' }), spec('flat-white'));
    expect(e.correct).toBe(false);
    expect(e.diffs.map((d) => d.component)).toEqual(['milk']);
    expect(e.diffs[0]).toMatchObject({ got: 'foam', expected: ['microfoam'] });
    expect(statusFor(e)).toBe('partly');
    expect(spec('flat-white').why.milk?.en).toMatch(/thinner microfoam layer than a cappuccino/);
    // …and it is exactly a cappuccino:
    expect(perfectMatchOther(withPatch('flat-white', { milk: 'foam' }), BUILD_SPECS, 'flat-white')?.drinkId).toBe('cappuccino');
  });

  it('americano vs long black: water order is the difference', () => {
    const lb = spec('long-black').canonical;
    const e = evaluate(lb, spec('americano'));
    expect(e.diffs.map((d) => d.component)).toContain('water');
    expect(spec('americano').why.water?.en).toMatch(/after the shot/);
  });

  it('score is the share of judged components that match', () => {
    const b = withPatch('cortado', { milkMl: 200, cup: 'large' });
    const e = evaluate(b, spec('cortado'));
    expect(e.diffs.map((d) => d.component).sort()).toEqual(['cup', 'milkMl']);
    expect(e.score).toBeCloseTo((e.judged.length - 2) / e.judged.length, 3);
    expect(statusFor(e)).toBe('incorrect');
  });

  it('shots are only judged at the espresso machine', () => {
    const turkish = spec('turkish-coffee');
    const e = evaluate({ ...turkish.canonical, shots: 1, shotStyle: 'lungo' }, turkish);
    expect(e.correct).toBe(true);
    expect(e.judged).not.toContain('shots');
    const viaEspresso = evaluate({ ...turkish.canonical, method: 'espresso' }, turkish);
    expect(viaEspresso.diffs.map((d) => d.component)).toEqual(['method']);
  });

  it('milk/water amounts are judged only when both the order and the build include them', () => {
    const esp = spec('espresso-shot');
    const e = evaluate({ ...esp.canonical, milk: 'steamed', milkMl: 200 }, esp);
    expect(e.diffs.map((d) => d.component)).toContain('milk');
    expect(e.judged).not.toContain('milkMl');
  });

  it('extras: missing and unexpected are both reported with a generic reason', () => {
    const e = evaluate(withPatch('mocha', { extras: ['sugar'] }), spec('mocha'));
    const d = e.diffs.find((x) => x.component === 'extras')!;
    expect(d.missing).toEqual(['chocolate']);
    expect(d.unexpected).toEqual(['sugar']);
    expect(genericWhy(d).en).toMatch(/Missing: Chocolate sauce\. Not part of this order: Sugar\./);
  });

  it('an accepted cup that overflows is still flagged, with volumes', () => {
    const e = evaluate(withPatch('americano', { waterMl: 200, cup: 'medium' }), spec('americano'));
    const d = e.diffs.find((x) => x.component === 'cup')!;
    expect(d.overflow).toEqual({ volumeMl: 236, capacityMl: CUP_CAPACITY_ML.medium });
  });

  it('labels exist for values shown in feedback', () => {
    expect(valueText('milk', 'microfoam').en).toBe('Microfoam');
    expect(valueText('cup', 'demitasse').zh).toBe('浓缩小杯');
    expect(valueText('ice', true).en).toBe('Over ice');
    expect(valueText('extras', '').en).toBe('No extras');
  });
});

describe('builds and stations', () => {
  it('espresso-bar levels start at the machine; the world café makes you pick a brewer; cup is always chosen', () => {
    expect(emptyBuild('bar').method).toBe('espresso');
    expect(missingChoices(emptyBuild('bar'))).toEqual(['cup']);
    expect(missingChoices(emptyBuild('world'))).toEqual(['method', 'cup']);
    expect(isComplete({ ...emptyBuild('milk'), cup: 'medium' })).toBe(true);
  });

  it('shots station only applies to the espresso machine', () => {
    expect(visibleStations({ method: 'espresso' })).toContain('shots');
    expect(visibleStations({ method: 'phin' })).not.toContain('shots');
  });

  it('toggleExtra keeps a stable order', () => {
    expect(toggleExtra(['sugar'], 'chocolate')).toEqual(['chocolate', 'sugar']);
    expect(toggleExtra(['chocolate', 'sugar'], 'chocolate')).toEqual(['sugar']);
  });

  it('cup layers show the structural differences', () => {
    const kinds = (id: string) => cupLayers(spec(id).canonical).map((l) => l.kind);
    expect(kinds('long-black')).toEqual(['water', 'espresso', 'crema']); // crema survives
    expect(kinds('americano')).toEqual(['diluted']);
    expect(kinds('cappuccino')).toEqual(['espresso', 'milk', 'foam']);
    expect(kinds('iced-latte')).toEqual(['cold-milk', 'espresso', 'crema']);
    expect(kinds('vietnamese-phin')).toEqual(['condensed', 'brew']);
    const foam = (id: string) => cupLayers(spec(id).canonical).find((l) => l.kind === 'foam')!.ml;
    expect(foam('cappuccino')).toBeGreaterThan(foam('flat-white'));
  });
});

describe('rounds and progress', () => {
  it('composeRound: 5 distinct drinks from the level, unmastered first, reproducible with a seed', () => {
    const a = composeRound('milk', BUILD_SPECS, new Set(), seededRandom(42));
    const b = composeRound('milk', BUILD_SPECS, new Set(), seededRandom(42));
    expect(a).toEqual(b);
    expect(a).toHaveLength(5);
    expect(new Set(a).size).toBe(5);
    for (const id of a) expect(spec(id).level).toBe('milk');
    const milkIds = BUILD_SPECS.filter((s) => s.level === 'milk').map((s) => s.drinkId);
    const mastered = new Set(milkIds.slice(0, 5));
    const r = composeRound('milk', BUILD_SPECS, mastered, seededRandom(7));
    for (const id of milkIds.slice(5)) expect(r).toContain(id); // the two unmastered drinks are always included
  });

  it('cafeMastery derives a collection from perfect assessed serves, keeping the most independent tier', () => {
    const ev = (activityId: string, score: number, guidance: LearningEvent['guidance']): LearningEvent => ({
      id: Math.random().toString(36),
      activityId,
      lessonId: '',
      mode: 'desktop',
      guidance,
      evidence: 'assessed_answer',
      outcome: score === 1 ? 'completed' : 'retry',
      score,
      recordedAt: '2026-11-08T10:00:00.000Z',
    });
    const m = cafeMastery([
      ev(cafeActivityId('cortado'), 0.8, 'independent'),
      ev(cafeActivityId('cortado'), 1, 'guided'),
      ev(cafeActivityId('cortado'), 1, 'assisted'),
      ev(cafeActivityId('latte-typo'), 0.5, 'guided'),
      ev('esp-ratio-lab-lab', 1, 'independent'),
    ]);
    expect([...m.keys()]).toEqual(['cortado']);
    expect(m.get('cortado')).toMatchObject({ best: 'assisted', correctServes: 2 });
  });

  it('recommends the first level that still has unmastered drinks', () => {
    expect(recommendedLevel(BUILD_SPECS, new Set())).toBe('bar');
    const bar = new Set(BUILD_SPECS.filter((s) => s.level === 'bar').map((s) => s.drinkId));
    expect(recommendedLevel(BUILD_SPECS, bar)).toBe('milk');
    expect(recommendedLevel(BUILD_SPECS, new Set(BUILD_SPECS.map((s) => s.drinkId)))).toBeNull();
  });
});
