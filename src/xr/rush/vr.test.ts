/**
 * Café Rush VR controller mapping (target + button → reducer action), headless — no Babylon, no headset.
 * The full espresso sequence below is driven ONLY through the VR mapping and ends in a textbook serve.
 */
import { describe, expect, it } from 'vitest';
import { actionsForTarget } from './play';
import { createShift, reduce, tick, type PlayerAction, type RushState } from './sim';
import { GRAB_REACH_M, SNAP_M, TARGET_POS, chooseOption, grabPoint, onGripDown, onGripUp, onTrigger, pulseGamepad, snapTarget, vrTickets, type V3, type VrIntent } from './vr';

const quiet = (): RushState => ({ ...createShift({ level: 1, seed: 4 }), nextArrivalMs: Number.MAX_SAFE_INTEGER });
const near = (t: keyof typeof TARGET_POS, dx = 0.03): V3 => {
  const p = grabPoint(t);
  return [p[0] + dx, p[1], p[2]];
};
const act = (s: RushState, i: VrIntent | PlayerAction | null): RushState => {
  const a = i && 'kind' in i ? (i.kind === 'act' ? i.action : null) : i;
  expect(a, 'an action').not.toBeNull();
  const n = reduce(s, a!);
  expect(n.lastResult.ok, `${a!.type} ok`).toBe(true);
  return n;
};
const runFor = (s: RushState, sec: number) => tick(s, sec);

describe('Café Rush · VR trigger (ray + trigger → actionsForTarget)', () => {
  it('one valid option acts at once; it is the same action a mouse click would give', () => {
    const s = quiet();
    const i = onTrigger(s, 'group1');
    expect(i).toEqual({ kind: 'act', action: { type: 'grab', slot: 'group1' }, target: 'group1' });
    expect(actionsForTarget(s, 'group1').map((a) => a.action)).toEqual([{ type: 'grab', slot: 'group1' }]);
  });

  it('several options open a choice panel; picking one is re-validated', () => {
    const s = quiet();
    const i = onTrigger(s, 'shelf');
    expect(i?.kind).toBe('choose');
    if (i?.kind !== 'choose') return;
    expect(i.options.map((o) => o.id)).toEqual(['takeCup:demitasse', 'takeCup:small', 'takeCup:medium', 'takeCup:large']);
    expect(chooseOption(s, i, 'takeCup:small')).toEqual({ type: 'takeCup', size: 'small' });
    // stale panel: once a cup is in hand, the shelf choice no longer applies
    const holding = reduce(s, { type: 'takeCup', size: 'demitasse' });
    expect(chooseOption(holding, i, 'takeCup:small')).toBeNull();
    expect(chooseOption(s, i, 'nonsense')).toBeNull();
  });

  it('trigger = use, grip = grab: a station verb wins over picking the item up', () => {
    let s = reduce(quiet(), { type: 'grab', slot: 'group1' });
    s = reduce(s, { type: 'place', slot: 'grinder' });
    expect(actionsForTarget(s, 'grinder').map((a) => a.id).sort()).toEqual(['grab:grinder', 'grind']);
    expect(onTrigger(s, 'grinder')).toMatchObject({ kind: 'act', action: { type: 'grind' } });
    expect(onGripDown(s, near('grinder'), null)).toMatchObject({ action: { type: 'grab', slot: 'grinder' } });
  });

  it('nothing to do → a "none" intent (no state change); paused or no target → null', () => {
    const s = quiet();
    expect(onTrigger(s, 'knock')).toEqual({ kind: 'none', target: 'knock' });
    expect(onTrigger(s, null)).toBeNull();
    expect(onTrigger(reduce(s, { type: 'pause' }), 'group1')).toBeNull();
  });
});

describe('Café Rush · VR grip (grab / carry / release-to-place)', () => {
  it('grip near an item grabs it; far away with no ray does nothing; the ray is a fallback', () => {
    const s = quiet();
    expect(onGripDown(s, near('group1'), null)).toMatchObject({ kind: 'act', action: { type: 'grab', slot: 'group1' } });
    expect(onGripDown(s, [0, 0.6, -0.5], null)).toBeNull();
    expect(onGripDown(s, [0, 0.6, -0.5], 'counter1')).toMatchObject({ action: { type: 'grab', slot: 'counter1' } });
    expect(onGripDown(s, near('shelf'), null)?.kind).toBe('choose'); // cup sizes
    expect(onGripDown(reduce(s, { type: 'grab', slot: 'group1' }), near('group2'), null)).toBeNull(); // hands full
  });

  it('release near a free slot that accepts the item places it; snap radius follows the tier', () => {
    const s = reduce(quiet(), { type: 'grab', slot: 'group1' });
    expect(onGripUp(s, near('grinder'), null, 'guided')).toEqual({ type: 'place', slot: 'grinder' });
    const off = (r: number): V3 => {
      const p = grabPoint('grinder');
      return [p[0], p[1], p[2] - r]; // straight towards the user, away from other slots
    };
    expect(SNAP_M.guided).toBeGreaterThan(SNAP_M.assisted);
    expect(SNAP_M.assisted).toBeGreaterThan(SNAP_M.independent);
    expect(snapTarget(s, off(0.17), null, 'guided')).toBe('grinder');
    expect(snapTarget(s, off(0.17), null, 'independent')).toBeNull();
    // far from everything: keep carrying, unless the ray points at a free slot
    expect(onGripUp(s, [0, 0.7, -0.6], null, 'guided')).toBeNull();
    expect(onGripUp(s, [0, 0.7, -0.6], 'counter8', 'independent')).toEqual({ type: 'place', slot: 'counter8' });
    // occupied or incompatible slots are never snap targets
    expect(snapTarget(s, near('counter1'), null, 'guided')).not.toBe('counter1');
    expect(onGripUp(quiet(), near('grinder'), null, 'guided')).toBeNull(); // nothing held
    expect(GRAB_REACH_M).toBeLessThanOrEqual(SNAP_M.guided);
  });

  it('every target anchor is within ±0.75 m of the counter centre (seated reach)', () => {
    for (const [t, p] of Object.entries(TARGET_POS)) {
      expect(Math.abs(p[0]), t).toBeLessThanOrEqual(0.75);
      expect(Math.abs(p[2]), t).toBeLessThanOrEqual(0.75);
    }
  });
});

describe('Café Rush · a whole espresso through the VR mapping only', () => {
  it('grip → carry → snap → trigger → choose → serve ends in a textbook serve', () => {
    let s = createShift({ level: 1, seed: 21 });
    while (s.orders.length === 0) s = runFor(s, 0.1);
    const order = s.orders[0]!;
    const style = order.drinkId === 'ristretto' ? 'ristretto' : order.drinkId === 'lungo' ? 'lungo' : 'normal';
    const size = order.drinkId === 'lungo' ? 'small' : 'demitasse';

    s = act(s, onGripDown(s, near('group1'), null)); // grab the portafilter from the group head
    s = act(s, onGripUp(s, near('grinder'), null, 'guided')); // carry it to the grinder and let go
    s = act(s, onTrigger(s, 'grinder')); // trigger → grind
    s = runFor(s, 3);
    s = act(s, onGripDown(s, near('grinder'), null));
    s = act(s, onGripUp(s, near('group1'), null, 'guided')); // lock it back in
    const cups = onTrigger(s, 'shelf');
    expect(cups?.kind).toBe('choose');
    s = act(s, chooseOption(s, cups, `takeCup:${size}`));
    s = act(s, onGripUp(s, near('tray1'), null, 'guided')); // cup under group 1
    const shot = onTrigger(s, 'group1');
    expect(shot?.kind).toBe('choose');
    s = act(s, chooseOption(s, shot, `startShot:1:${style}`));
    s = runFor(s, 10);
    s = act(s, onGripDown(s, near('tray1'), null));
    const serve = onTrigger(s, 'pass');
    s = act(s, serve?.kind === 'choose' ? chooseOption(s, serve, `serve:${order.id}`) : serve);
    expect(s.records[0]).toMatchObject({ orderId: order.id, outcome: 'correct' });
    expect(s.stats.points).toBeGreaterThan(0);
  });
});

describe('Café Rush · VR helpers', () => {
  it('haptics are feature-detected and never throw', () => {
    const calls: Array<[number, number]> = [];
    expect(pulseGamepad({ hapticActuators: [{ pulse: (v, d) => (calls.push([v, d]), Promise.resolve(true)) }] }, 0.2, 30)).toBe(true);
    expect(calls).toEqual([[0.2, 30]]);
    expect(pulseGamepad({ hapticActuators: [{ pulse: () => Promise.reject(new Error('busy')) }] }, 0.2, 30)).toBe(true);
    expect(pulseGamepad({ hapticActuators: [] }, 0.2, 30)).toBe(false);
    expect(pulseGamepad({}, 0.2, 30)).toBe(false);
    expect(pulseGamepad(null, 0.2, 30)).toBe(false);
    expect(
      pulseGamepad(
        {
          hapticActuators: [
            {
              pulse: () => {
                throw new Error('no');
              },
            },
          ],
        },
        5,
        30,
      ),
    ).toBe(false);
  });

  it('in-headset tickets show patience and the "about to leave" cue (not in the independent tier)', () => {
    let s = createShift({ level: 1, seed: 21 });
    while (s.orders.length === 0) s = tick(s, 0.1);
    const o = s.orders[0]!;
    expect(vrTickets(s, 'guided')[0]).toMatchObject({ id: o.id, left: 1, leaving: false });
    s = { ...s, orders: [{ ...o, remainingMs: Math.round(o.patienceMs! * 0.2) }] };
    expect(vrTickets(s, 'guided')[0]!.leaving).toBe(true);
    expect(vrTickets(s, 'independent')[0]!.leaving).toBe(false);
    const relaxed = { ...s, orders: [{ ...o, patienceMs: null, remainingMs: null }] };
    expect(vrTickets(relaxed, 'guided')[0]).toMatchObject({ left: null, sec: null, leaving: false });
  });
});
