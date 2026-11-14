/**
 * Controllable espresso shots (user report 2026-11-14: "extraction is uncontrolled… I don't see how much comes from
 * the machine and when to stop"). The player starts a shot, watches the grams and stops it; the yield decides the style.
 */
import { describe, expect, it } from 'vitest';
import { SHOT_FLOW, shotYieldAt, styleForYield } from './config';
import { STOP_CUE_G, actionsForTarget, coachSuggest, createCoach, listActions } from './play';
import { createShift, reduce, tick, type CupItem, type PlayerAction, type RushState, type ShiftOptions } from './sim';

const act = (s: RushState, a: PlayerAction): RushState => {
  const n = reduce(s, a);
  expect(n.lastResult.ok, `${a.type} → ${n.lastResult.code}`).toBe(true);
  return n;
};
/** A quiet level-1 shift with a ground portafilter locked in group 1 and a demitasse under it. */
function loaded(o: Partial<ShiftOptions> = {}): RushState {
  let s: RushState = { ...createShift({ level: 1, seed: 3, guidance: 'assisted', shotControl: 'manual', ...o }), nextArrivalMs: Number.MAX_SAFE_INTEGER };
  s = act(s, { type: 'grab', slot: 'group1' });
  s = act(s, { type: 'place', slot: 'grinder' });
  s = act(s, { type: 'grind' });
  s = tick(s, 3);
  s = act(s, { type: 'grab', slot: 'grinder' });
  s = act(s, { type: 'place', slot: 'group1' });
  s = act(s, { type: 'takeCup', size: 'demitasse' });
  return act(s, { type: 'place', slot: 'tray1' });
}
const shotIn = (s: RushState) => (s.items[s.slots.tray1!] as CupItem).adds.find((a) => a.k === 'shot') as { style: string; yieldG?: number } | undefined;
const pfLoad = (s: RushState) => (s.items[s.slots.group1!] as { load: string }).load;

describe('espresso flow model', () => {
  it('pre-infusion, then a steady stream; the wall targets take about as long as before', () => {
    expect(shotYieldAt(SHOT_FLOW.preinfusionSec)).toBe(0);
    expect(shotYieldAt(7)).toBeCloseTo(36);
    expect(shotYieldAt(9)).toBeCloseTo(54);
    expect(shotYieldAt(5.67)).toBeCloseTo(24, 0);
    expect([20, 29.9, 30, 44.9, 45, 63].map(styleForYield)).toEqual(['ristretto', 'ristretto', 'normal', 'normal', 'lungo', 'lungo']);
  });
});

describe('manual shots (the game UI)', () => {
  it('nothing in the cup during pre-infusion; the shot does not stop by itself at the target', () => {
    let s = act(loaded(), { type: 'startShot', group: 1, style: 'normal' });
    s = tick(s, 2.9);
    expect(s.m.groups[0]!.yieldG).toBe(0);
    s = tick(s, 4.6); // 7.5 s: past the 36 g target
    expect(s.m.groups[0]!.yieldG).toBeGreaterThan(36);
    expect(shotIn(s)).toBeUndefined(); // still running
  });

  it('stopping decides the shot: ~40 g counts as an espresso, ~25 g as a ristretto, with the grams recorded', () => {
    let s = act(loaded(), { type: 'startShot', group: 1, style: 'normal' });
    s = act(tick(s, 7.5), { type: 'stopShot', group: 1 });
    expect(shotIn(s)).toMatchObject({ style: 'normal' });
    expect(shotIn(s)!.yieldG).toBeCloseTo(40.5, 0);
    expect(pfLoad(s)).toBe('puck');

    let r = act(loaded(), { type: 'startShot', group: 1, style: 'normal' });
    r = act(tick(r, 5.8), { type: 'stopShot', group: 1 });
    expect(shotIn(r)).toMatchObject({ style: 'ristretto' });
  });

  it('a forgotten shot stops itself at the maximum, as a very long shot, and says so', () => {
    let s = act(loaded(), { type: 'startShot', group: 1, style: 'normal' });
    s = tick(s, 12);
    expect(s.m.groups[0]).toBeNull();
    expect(shotIn(s)).toMatchObject({ style: 'lungo', yieldG: SHOT_FLOW.maxG });
    expect(s.feedback.at(-1)!.code).toBe('shot-max');
  });

  it('Guided: the machine stops a little past the target, so the shot still counts', () => {
    let s = act(loaded({ guidance: 'guided' }), { type: 'startShot', group: 1, style: 'normal' });
    s = tick(s, 10);
    expect(shotIn(s)).toMatchObject({ style: 'normal', yieldG: 36 + SHOT_FLOW.guidedGraceG });
  });

  it('stopping during pre-infusion wastes nothing: no coffee in the cup, the grounds stay', () => {
    let s = act(loaded(), { type: 'startShot', group: 1, style: 'normal' });
    s = act(tick(s, 1), { type: 'stopShot', group: 1 });
    expect(shotIn(s)).toBeUndefined();
    expect(pfLoad(s)).toBe('ground');
    expect(s.feedback.at(-1)!.code).toBe('shot-cancelled');
  });

  it('Stop is offered only while a shot runs, and a click on the group stops it', () => {
    let s = loaded();
    expect(listActions(s).some((a) => a.action.type === 'stopShot')).toBe(false);
    expect(reduce(s, { type: 'stopShot', group: 1 }).lastResult.code).toBe('no-shot');
    s = act(s, { type: 'startShot', group: 1, style: 'normal' });
    expect(listActions(s).map((a) => a.id)).toContain('stopShot:1');
    expect(actionsForTarget(s, 'group1').map((a) => a.action)).toEqual([{ type: 'stopShot', group: 1 }]);
  });

  it('the guided coach says "stop" just before the target', () => {
    const coach = createCoach(1);
    let s = act(loaded({ guidance: 'guided' }), { type: 'startShot', group: 1, style: 'normal' });
    s = tick(s, 5); // ~18 g
    expect(coachSuggest(coach, s)).not.toEqual({ type: 'stopShot', group: 1 });
    s = tick(s, (36 - STOP_CUE_G - s.m.groups[0]!.yieldG) / SHOT_FLOW.gPerSec + 0.05);
    expect(coachSuggest(coach, s)).toEqual({ type: 'stopShot', group: 1 });
  });

  it('a wrong-style serve says how many grams you stopped at', () => {
    let s = loaded();
    s = { ...s, orders: [{ id: 'o1', drinkId: 'espresso-shot', customerId: 'mei', arrivedMs: 0, patienceMs: 90_000, remainingMs: 90_000, points: 10 }] };
    s = act(s, { type: 'startShot', group: 1, style: 'normal' });
    s = act(tick(s, 5.8), { type: 'stopShot', group: 1 }); // ~25 g: a ristretto
    s = act(s, { type: 'grab', slot: 'tray1' });
    s = act(s, { type: 'serve', orderId: 'o1' });
    const what = s.feedback.at(-1)!.details!.find((d) => d.component === 'shotStyle')!.what.en;
    expect(what).toMatch(/you stopped at 25(\.\d)? g ≈ 1:1\.4/);
  });
});

describe('auto shots (bots, tuning, tests)', () => {
  it('stop exactly at the wall target, as before', () => {
    let s = act(loaded({ shotControl: 'auto' }), { type: 'startShot', group: 1, style: 'normal' });
    s = tick(s, 6.9);
    expect(s.m.groups[0]).not.toBeNull();
    s = tick(s, 0.2);
    expect(shotIn(s)).toMatchObject({ style: 'normal', yieldG: 36 });
    expect(coachSuggest(createCoach(1), act(loaded({ shotControl: 'auto' }), { type: 'startShot', group: 1, style: 'normal' }))).not.toEqual({ type: 'stopShot', group: 1 });
  });
});
