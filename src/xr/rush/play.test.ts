import { describe, expect, it } from 'vitest';
import type { EvidenceKind } from '../../domain/contracts';
import { INPUT_COST } from './config';
import { coachSuggest, createCoach, listActions, listKey, whileBrewsHint } from './play';
import { bestStarsFromEvents, rushCompletionEvent, rushResult, unlockedLevels } from './record';
import { createShift, listAct, reduce, tick, type RushState } from './sim';

const quiet = (mode: 'standard' | 'relaxed' = 'standard', level: 1 | 2 | 3 | 4 | 5 = 1): RushState => ({
  ...createShift({ level, seed: 4, mode }),
  nextArrivalMs: Number.MAX_SAFE_INTEGER,
});
const ev = (level: number, stars: number, evidence: EvidenceKind = 'simulated') => ({ activityId: `rush:${level}`, evidence, score: stars / 3 });

describe('Café Rush · lobby unlocks and stars (derived from simulated events)', () => {
  it('derives the best stars per level, ignoring other activities and non-simulated evidence', () => {
    const best = bestStarsFromEvents([ev(1, 1), ev(1, 3), ev(1, 2), ev(2, 0), ev(3, 3, 'self_report'), { activityId: 'esp-workflow-xr', evidence: 'simulated' as const, score: 1 }, ev(9, 3)]);
    expect(best).toEqual({ 1: 3, 2: 0 });
  });

  it('level n+1 opens only after ≥1★ on level n', () => {
    expect(unlockedLevels(bestStarsFromEvents([]))).toEqual([1]);
    expect(unlockedLevels(bestStarsFromEvents([ev(1, 0)]))).toEqual([1]);
    expect(unlockedLevels(bestStarsFromEvents([ev(1, 1)]))).toEqual([1, 2]);
    expect(unlockedLevels(bestStarsFromEvents([ev(1, 2), ev(2, 1), ev(4, 3)]))).toEqual([1, 2, 3]);
  });

  it('a recorded shift round-trips: event score encodes stars, activityId rush:<level>', () => {
    let s = createShift({ level: 2, seed: 8 });
    s = reduce(tick(s, 30), { type: 'endShift' });
    const r = rushResult(s);
    const e = rushCompletionEvent(r, { immersive: false, touch: true });
    expect(e).toMatchObject({ activityId: 'rush:2', evidence: 'simulated', mode: 'mobile' });
    expect(bestStarsFromEvents([e])[2]).toBe(r.stars);
  });
});

describe('Café Rush · action list', () => {
  it('lists only valid actions, with labels, and they all succeed through the reducer', () => {
    const s = quiet();
    const list = listActions(s);
    expect(list.map((a) => a.id)).toEqual(expect.arrayContaining(['takeCup:demitasse', 'grab:group1', 'grab:counter1', 'heatKettle']));
    expect(list.some((a) => a.id.startsWith('startShot'))).toBe(false); // no coffee in the basket yet
    for (const a of list) {
      expect(reduce(s, a.action).lastResult.ok, a.id).toBe(true);
      expect(a.label.en.length).toBeGreaterThan(3);
      expect(a.label.zh.length).toBeGreaterThan(1);
    }
    const holding = reduce(s, { type: 'takeCup', size: 'large' });
    const ids = listActions(holding).map((a) => a.id);
    expect(ids).toEqual(expect.arrayContaining(['addIce', 'place:tray1', 'place:counter', 'trash']));
    expect(ids).not.toContain('takeCup:large');
  });

  it('each list action costs a little game time in Standard mode only', () => {
    const a = { type: 'takeCup', size: 'demitasse' } as const;
    expect(listAct(quiet('standard'), a).tMs).toBe(INPUT_COST.listActionCostSec * 1000);
    expect(listAct(quiet('relaxed'), a).tMs).toBe(0);
    expect(reduce(quiet('standard'), a).tMs).toBe(0); // 3D / XR: real reach time instead
    const rejected = listAct(quiet('standard'), { type: 'knock' });
    expect(rejected.tMs).toBe(0);
  });

  it('the list key ignores pure time passing but changes with the world', () => {
    const s = quiet();
    expect(listKey(tick(s, 0.3))).toBe(listKey(s));
    expect(listKey(reduce(s, { type: 'takeCup', size: 'small' }))).not.toBe(listKey(s));
  });
});

describe('Café Rush · guided coach', () => {
  it('suggests a valid next step and a "while that brews" hint during a process', () => {
    let s = createShift({ level: 1, seed: 21 });
    while (s.orders.length === 0) s = tick(s, 0.1);
    const coach = createCoach(1);
    let hinted = false;
    for (let i = 0; i < 80 && s.records.length === 0; i++) {
      const a = coachSuggest(coach, s);
      if (a) {
        if (whileBrewsHint(s, a)) hinted = true;
        expect(listActions(s, a).find((x) => x.recommended)?.action).toEqual(a);
        s = listAct(s, a);
      } else s = tick(s, 0.5);
    }
    expect(s.records[0]?.outcome).toBe('correct');
    expect(hinted).toBe(true);
  });

  it('follows a cup the player started and flags a wrong cup for the bin', () => {
    let s = createShift({ level: 1, seed: 21 });
    while (s.orders.length === 0) s = tick(s, 0.1);
    const coach = createCoach(1);
    const want = s.orders[0]!.drinkId;
    const size = want === 'lungo' ? 'small' : 'demitasse';
    s = reduce(s, { type: 'takeCup', size });
    expect(coachSuggest(coach, s)?.type).not.toBe('trash');
    s = reduce(s, { type: 'addIce' }); // no Level-1 drink has ice
    expect(coachSuggest(coach, s)?.type).toBe('trash');
  });
});
