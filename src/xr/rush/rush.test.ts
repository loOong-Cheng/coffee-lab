import { describe, expect, it } from 'vitest';
import { drinks } from '../../content/drinks';
import { getBuildSpec } from '../../features/cafe/specs';
import { LEVELS, PROCESS, RELAXED, RUSH_LEVELS, SCORING } from './config';
import { basePoints, needsFor, recipeWall, ROSTER, workEstimateSec } from './drinks';
import { explain, judge, type Addition, type CupContents } from './judge';
import { rushCompletionEvent, rushResult, unlockedLevels } from './record';
import { createShift, held, reduce, slotOf, tick, type CupItem, type PlayerAction, type RushState, type SlotId } from './sim';

// ───────────── helpers ─────────────
const act = (s: RushState, a: PlayerAction): RushState => {
  const n = reduce(s, a);
  expect(n.lastResult.ok, `${a.type} → ${n.lastResult.code}`).toBe(true);
  return n;
};
const free = (s: RushState): SlotId => (['counter4', 'counter5', 'counter6', 'counter7', 'counter8'] as const).find((c) => !s.slots[c])!;
const withOrder = (s: RushState, drinkId: string, patienceMs: number | null = 60_000): RushState => ({
  ...s,
  orders: [{ id: 'test', drinkId, customerId: 'mei', arrivedMs: s.tMs, patienceMs, remainingMs: patienceMs, points: basePoints(drinkId) }],
});
/** A quiet shift: no customers arrive on their own, so a test controls every order. */
const quiet = (mode: 'standard' | 'relaxed' = 'standard') => ({ ...createShift({ level: 5, seed: 1, mode }), nextArrivalMs: Number.MAX_SAFE_INTEGER });

/** Build a drink's textbook version purely through the public action API; ends with the cup in hand. */
function build(s0: RushState, drinkId: string): RushState {
  const n = needsFor(drinkId);
  let s = act(s0, { type: 'takeCup', size: n.cup });
  const cupId = s.hand!;
  if (n.ice) s = act(s, { type: 'addIce' });
  for (const extra of n.extras) s = act(s, { type: 'addExtra', extra });
  if (n.water === 'before') {
    s = act(s, { type: 'place', slot: 'hotwater' });
    s = act(s, { type: 'dispenseWater', ml: n.waterMl });
    s = tick(s, 5);
    s = act(s, { type: 'grab', slot: 'hotwater' });
  }
  if (n.shot) {
    s = act(s, { type: 'place', slot: 'tray1' });
    s = act(s, { type: 'grab', slot: 'group1' });
    s = act(s, { type: 'place', slot: 'grinder' });
    s = act(s, { type: 'grind' });
    s = tick(s, PROCESS.grind.sec);
    s = act(s, { type: 'grab', slot: 'grinder' });
    s = act(s, { type: 'place', slot: 'group1' });
    s = act(s, { type: 'startShot', group: 1, style: n.shot });
    s = tick(s, PROCESS.shot[n.shot].sec);
  }
  if (n.brewer) {
    const bs: SlotId = n.brewer === 'pourover' ? 'dripper' : 'phin';
    s = act(s, { type: 'place', slot: bs });
    s = act(s, { type: 'grab', slot: slotOf(s, 'doser')! });
    s = act(s, { type: 'place', slot: 'grinder' });
    s = act(s, { type: 'grind' });
    s = tick(s, PROCESS.grind.sec);
    s = act(s, { type: 'grab', slot: 'grinder' });
    s = act(s, { type: 'pour', slot: bs });
    s = act(s, { type: 'place', slot: free(s) });
    const k = s.items.kettle!;
    if (k.kind === 'kettle' && !(k.hot && k.pours > 0)) {
      s = act(s, { type: 'heatKettle' });
      s = tick(s, PROCESS.kettle.sec);
    }
    s = act(s, { type: 'grab', slot: 'kettleBase' });
    s = act(s, { type: 'pour', slot: bs });
    s = tick(s, PROCESS.bloom[n.brewer].sec);
    s = act(s, { type: 'pour', slot: bs });
    s = act(s, { type: 'place', slot: 'kettleBase' });
    s = tick(s, PROCESS.drawdown[n.brewer].sec);
  }
  if (n.milk !== 'none') {
    s = act(s, { type: 'grab', slot: slotOf(s, 'pitcher1')! });
    s = act(s, { type: 'fillMilk', ml: n.milkMl });
    if (n.milk !== 'cold') {
      s = act(s, { type: 'place', slot: 'wand' });
      s = act(s, { type: 'steam', texture: n.milk });
      s = tick(s, 9);
      s = act(s, { type: 'grab', slot: 'wand' });
    }
    s = act(s, { type: 'pour', slot: slotOf(s, cupId)! });
    s = act(s, { type: 'place', slot: free(s) });
  }
  if (n.water === 'after') {
    s = act(s, { type: 'grab', slot: slotOf(s, cupId)! });
    s = act(s, { type: 'place', slot: 'hotwater' });
    s = act(s, { type: 'dispenseWater', ml: n.waterMl });
    s = tick(s, 5);
  }
  if (s.hand !== cupId) s = act(s, { type: 'grab', slot: slotOf(s, cupId)! });
  return s;
}

const cup = (size: CupContents['size'], ...adds: Addition[]): CupContents => ({ size, adds });
const shot = (style: 'ristretto' | 'normal' | 'lungo' = 'normal'): Addition => ({ k: 'shot', style });
const milk = (texture: 'cold' | 'steamed' | 'microfoam' | 'foam', ml: number, overheated = false): Addition => ({ k: 'milk', texture, ml, overheated });
const water = (ml: number): Addition => ({ k: 'water', ml });
const brew = (brewer: 'pourover' | 'phin', bloomed = true): Addition => ({ k: 'brew', brewer, bloomed });

// ───────────── tests ─────────────
describe('Café Rush · roster and recipe wall', () => {
  it('every roster drink built through the action API is judged a textbook serve', () => {
    for (const id of ROSTER) {
      let s = withOrder(build(quiet(), id), id);
      s = act(s, { type: 'serve', orderId: 'test' });
      expect(s.records.at(-1)?.outcome, id).toBe('correct');
      expect(s.hand).toBeNull();
    }
  });

  it('café drinks reuse BUILD_SPECS; the wall numbers come from drinks.ts, never typed in', () => {
    for (const id of ROSTER) expect(getBuildSpec(id) !== undefined || id.includes('pourover'), id).toBe(true);
    const wall = recipeWall(5);
    expect(wall.map((w) => w.drinkId).sort()).toEqual([...ROSTER].sort());
    for (const w of wall) {
      const d = drinks.find((x) => x.id === w.drinkId)!;
      expect(w.doseG).toBe(d.recipe.doseG);
      expect(w.outG).toBe(d.recipe.outG);
      expect(w.milkMl).toBe(d.recipe.milkMl);
      expect(w.illustrative).toBe(true);
    }
    const ratio = (id: string) => wall.find((w) => w.drinkId === id)!.ratio;
    expect([ratio('espresso-shot'), ratio('ristretto'), ratio('lungo'), ratio('pourover-cone')]).toEqual(['1:2', '1:1.3', '1:3', '1:16.7']);
    expect(recipeWall(1).every((w) => w.isNew)).toBe(true);
    expect(recipeWall(2).filter((w) => w.isNew)).toHaveLength(LEVELS[2].unlocks.length);
  });

  it('every real-world time reference on a label is quoted from the Drink Atlas', () => {
    const text = (id: string) => JSON.stringify(drinks.find((d) => d.id === id)!);
    expect(text('espresso-shot')).toContain('25–35');
    expect(PROCESS.shot.normal.real.en).toContain('25–35');
    expect(text('ristretto')).toContain(PROCESS.shot.ristretto.real.en.match(/\d+–\d+/)![0]);
    expect(text('lungo')).toContain(PROCESS.shot.lungo.real.en.match(/\d+–\d+/)![0]);
    expect(text('pourover-cone')).toContain(PROCESS.bloom.pourover.real.en.match(/\d+–\d+/)![0]);
    expect(text('pourover-cone')).toContain(PROCESS.drawdown.pourover.real.en.match(/\d:\d+–\d:\d+/)![0]);
    expect(text('vietnamese-phin')).toContain(PROCESS.drawdown.phin.real.en.match(/\d–\d/)![0]);
    expect(text('caffe-latte') + text('cappuccino')).toContain('55–65');
  });
});

describe('Café Rush · per-drink correctness (reuses café evaluate)', () => {
  const cases: Array<[string, CupContents, CupContents, string]> = [
    ['espresso-shot', cup('demitasse', shot()), cup('demitasse', shot('lungo')), 'shotStyle'],
    ['ristretto', cup('demitasse', shot('ristretto')), cup('demitasse', shot('ristretto'), water(60)), 'water'],
    ['americano', cup('large', shot(), water(150)), cup('large', water(150), shot()), 'water'],
    ['long-black', cup('medium', water(100), shot()), cup('medium', shot(), water(100)), 'water'],
    ['cappuccino', cup('medium', shot(), milk('foam', 120)), cup('medium', shot(), milk('microfoam', 120)), 'milk'],
    ['caffe-latte', cup('large', shot(), milk('microfoam', 200)), cup('large', shot(), milk('microfoam', 50)), 'milkMl'],
    ['mocha', cup('large', { k: 'extra', extra: 'chocolate' }, shot(), milk('microfoam', 200)), cup('large', shot(), milk('microfoam', 200)), 'extras'],
    ['iced-latte', cup('large', { k: 'ice' }, milk('cold', 200), shot()), cup('large', { k: 'ice' }, milk('steamed', 200), shot()), 'milk'],
    ['vietnamese-phin', cup('large', { k: 'ice' }, { k: 'extra', extra: 'condensed-milk' }, brew('phin')), cup('large', { k: 'ice' }, { k: 'extra', extra: 'condensed-milk' }, brew('phin', false)), 'bloom'],
    ['pourover-cone', cup('large', brew('pourover')), cup('large', brew('pourover'), milk('steamed', 120)), 'milk'],
    ['flat-white', cup('medium', shot(), milk('microfoam', 120)), cup('medium', shot(), milk('microfoam', 120, true)), 'milkTemp'],
  ];
  it.each(cases)('%s: right build passes, wrong build names the difference', (id, right, wrong, component) => {
    expect(judge(right, id).status).toBe('correct');
    const j = judge(wrong, id);
    expect(j.status).toBe('partly');
    expect(j.diffs.map((d) => d.component)).toEqual([component]);
    const e = explain(id, j.diffs[0]!);
    expect(e.what.en.length).toBeGreaterThan(3);
    expect(e.why.en.length).toBeGreaterThan(10);
  });

  it('explains with the café spec reason and recognises what was made instead', () => {
    const j = judge(cup('medium', shot(), milk('microfoam', 120)), 'cappuccino');
    expect(j.madeInstead).toBe('flat-white');
    expect(explain('cappuccino', j.diffs[0]!).why).toEqual(getBuildSpec('cappuccino')!.why.milk);
    expect(judge(cup('large'), 'caffe-latte')).toMatchObject({ status: 'incorrect', diffs: [{ component: 'coffee' }] });
    expect(judge(cup('demitasse', brew('pourover')), 'espresso-shot').diffs[0]!.component).toBe('method');
  });
});

describe('Café Rush · simulation', () => {
  const script: PlayerAction[] = [
    { type: 'takeCup', size: 'demitasse' },
    { type: 'place', slot: 'tray1' },
    { type: 'grab', slot: 'group1' },
    { type: 'place', slot: 'grinder' },
    { type: 'grind' },
  ];
  const play = (seed: number) => {
    let s = createShift({ level: 3, seed });
    for (const a of script) s = tick(reduce(s, a), 1.3);
    return tick(s, 90);
  };

  it('is deterministic: same seed and inputs give the same state; another seed differs', () => {
    expect(play(42)).toEqual(play(42));
    expect(play(42).records.map((r) => r.drinkId)).not.toEqual(play(43).records.map((r) => r.drinkId));
  });

  it('tick runs fixed steps and carries the remainder', () => {
    const s = createShift({ level: 1, seed: 5 });
    const a = [0.25, 0.25, 0.25, 0.25].reduce((x, dt) => tick(x, dt), s);
    expect(a.tMs).toBe(tick(s, 1).tMs);
    expect(tick(s, 0.05).tMs).toBe(0);
  });

  it('scores a correct serve with tip and streak, half points for one difference, and hands back a wrong cup', () => {
    let s = withOrder(build(quiet(), 'espresso-shot'), 'espresso-shot');
    const base = basePoints('espresso-shot');
    s = act(s, { type: 'serve', orderId: 'test' });
    const r1 = s.records.at(-1)!;
    expect(r1.points).toBe(base + r1.tip);
    expect(r1.tip).toBeGreaterThan(0);
    expect(s.stats.streak).toBe(1);
    // a second perfect serve in a row earns a streak bonus
    let s2 = withOrder(build(quiet(), 'espresso-shot'), 'espresso-shot');
    s2 = { ...s2, stats: { ...s2.stats, streak: 1 } };
    s2 = act(s2, { type: 'serve', orderId: 'test' });
    expect(s2.records.at(-1)!.streakBonus).toBe(SCORING.streakStep);

    // partly: lungo served as an espresso → accepted at half points, streak resets
    let p = withOrder(quiet(), 'espresso-shot');
    p = act(p, { type: 'takeCup', size: 'demitasse' });
    p = { ...p, items: { ...p.items, [p.hand!]: { ...(held(p) as CupItem), adds: [shot('lungo')] } } };
    p = act(p, { type: 'serve', orderId: 'test' });
    expect(p.records.at(-1)).toMatchObject({ outcome: 'partly', points: Math.round(base * SCORING.partlyShare) });
    expect(p.feedback.at(-1)!.details![0]!.component).toBe('shotStyle');

    // incorrect (empty cup): order stays open, cup comes back, explanation given
    let w = withOrder(quiet(), 'cappuccino');
    w = act(w, { type: 'takeCup', size: 'demitasse' });
    w = act(w, { type: 'serve', orderId: 'test' });
    expect(w.hand).not.toBeNull();
    expect(w.orders).toHaveLength(1);
    expect(w.stats.wrongServes).toBe(1);
    expect(w.feedback.at(-1)!.kind).toBe('mistake');
  });

  it('rejects impossible actions with a reason instead of changing the world', () => {
    let s = quiet();
    s = reduce(s, { type: 'startShot', group: 1, style: 'normal' });
    expect(s.lastResult).toEqual({ ok: false, code: 'no-coffee' });
    expect(s.feedback.at(-1)!.text.en).toMatch(/grind/i);
    s = reduce(s, { type: 'place', slot: 'tray1' });
    expect(s.lastResult.code).toBe('hands-empty');
  });

  it('a shot with no cup underneath is wasted, with feedback', () => {
    let s = quiet();
    for (const a of [
      { type: 'grab', slot: 'group1' },
      { type: 'place', slot: 'grinder' },
      { type: 'grind' },
    ] as PlayerAction[])
      s = act(s, a);
    s = tick(s, PROCESS.grind.sec);
    s = act(s, { type: 'grab', slot: 'grinder' });
    s = act(s, { type: 'place', slot: 'group1' });
    s = act(s, { type: 'startShot', group: 1, style: 'normal' });
    s = tick(s, PROCESS.shot.normal.sec);
    expect(s.stats.wasted).toBe(1);
    expect(s.feedback.at(-1)!.code).toBe('shot-wasted');
  });

  it('milk left on the wand overheats in Standard mode but never in Relaxed mode', () => {
    for (const mode of ['standard', 'relaxed'] as const) {
      let s = quiet(mode);
      s = act(s, { type: 'grab', slot: 'counter1' });
      s = act(s, { type: 'fillMilk', ml: 120 });
      s = act(s, { type: 'place', slot: 'wand' });
      s = act(s, { type: 'steam', texture: 'foam' });
      s = tick(s, 30);
      const p = s.items.pitcher1!;
      expect(p.kind === 'pitcher' && p.milk?.overheated).toBe(mode === 'standard');
    }
  });

  it('pause freezes the clock; reset starts a fresh attempt', () => {
    let s = reduce(createShift({ level: 1, seed: 9 }), { type: 'pause' });
    expect(tick(s, 10).tMs).toBe(0);
    s = reduce(s, { type: 'resume' });
    expect(tick(s, 1).tMs).toBe(1000);
    const r = reduce(tick(s, 20), { type: 'reset' });
    expect(r).toMatchObject({ tMs: 0, attempt: 2, status: 'playing', orders: [] });
  });
});

describe('Café Rush · patience, timeouts and Relaxed mode', () => {
  it('patience follows the level formula, then the customer leaves with a gentle tip', () => {
    let s = createShift({ level: 2, seed: 3 });
    while (s.orders.length === 0) s = tick(s, 0.1);
    const o = s.orders[0]!;
    const cfg = LEVELS[2];
    const f = o.arrivedMs / s.shiftMs;
    const expected = (workEstimateSec(o.drinkId) * cfg.patienceMult + cfg.patienceSlackSec) * (1 + (cfg.rampPatienceEnd - 1) * f);
    expect(o.patienceMs).toBe(Math.round(expected * 1000));
    s = tick(s, o.patienceMs! / 1000 + 0.2);
    expect(s.records.find((r) => r.orderId === o.id)?.outcome).toBe('timeout');
    expect(s.stats.timeouts).toBeGreaterThanOrEqual(1);
    expect(s.feedback.some((f2) => f2.code === 'order-timeout' && /Tip/.test(f2.text.en))).toBe(true);
  });

  it('tightens level by level and ramps within a shift', () => {
    for (const l of RUSH_LEVELS.slice(1)) {
      const prev = LEVELS[(l - 1) as 1];
      expect(LEVELS[l].arrivalSec).toBeLessThanOrEqual(prev.arrivalSec);
      expect(LEVELS[l].patienceMult).toBeLessThanOrEqual(prev.patienceMult);
      expect(LEVELS[l].rampArrivalEnd).toBeLessThan(1);
      expect(LEVELS[l].rampPatienceEnd).toBeLessThanOrEqual(prev.rampPatienceEnd);
    }
    expect(LEVELS[5].patienceMult).toBeLessThan(LEVELS[1].patienceMult);
  });

  it('Relaxed mode never times out and ends after the set number of serves', () => {
    let s = createShift({ level: 5, seed: 11, mode: 'relaxed' });
    s = tick(s, 3000);
    expect(s.status).toBe('playing');
    expect(s.stats.timeouts).toBe(0);
    expect(s.orders).toHaveLength(RELAXED.maxOpenOrders);
    expect(s.orders.every((o) => o.remainingMs === null)).toBe(true);
    for (let i = 0; i < RELAXED.orders && s.status === 'playing'; i++) {
      const o = s.orders[0]!;
      s = act(build(s, o.drinkId), { type: 'serve', orderId: o.id });
      if (s.status !== 'playing') break;
      s = tick(s, RELAXED.arrivalGapSec + 0.1);
      // reset the espresso station between drinks
      const pf = s.items.pf1!;
      if (pf.kind === 'portafilter' && pf.load === 'puck') s = act(act(s, { type: 'grab', slot: 'group1' }), { type: 'knock' });
      if (s.hand) s = act(s, { type: 'place', slot: 'group1' });
    }
    expect(s.status).toBe('over');
    expect(rushResult(s)).toMatchObject({ timeouts: 0, stars: 3, mode: 'relaxed' });
  });
});

describe('Café Rush · evidence record', () => {
  it('is simulated, illustrative, game-time, and claims no real skill', () => {
    let s = createShift({ level: 1, seed: 2 });
    s = reduce(tick(s, 40), { type: 'endShift' });
    const r = rushResult(s);
    expect(r).toMatchObject({
      evidence: 'simulated',
      illustrativeModel: true,
      gameTimeCompressed: true,
      completed: true,
      claims: { realSkill: false, taste: false, gripForce: false, haptics: false, realTiming: false },
    });
    expect(r.notTrained.length).toBeGreaterThan(0);
    const ev = rushCompletionEvent(r, { immersive: true, touch: false });
    expect(ev).toMatchObject({ evidence: 'simulated', mode: 'xr', activityId: 'rush:1', lessonId: '' });
    expect(rushCompletionEvent(r, { immersive: false, touch: false }).mode).toBe('desktop');
    expect(ev.score).toBeGreaterThanOrEqual(0);
    expect(ev.score).toBeLessThanOrEqual(1);
  });

  it('unlocks the next level after one star, no streak pressure', () => {
    expect(unlockedLevels({})).toEqual([1]);
    expect(unlockedLevels({ 1: 1, 2: 3 })).toEqual([1, 2, 3]);
    expect(unlockedLevels({ 1: 0, 2: 3 })).toEqual([1]);
  });
});
