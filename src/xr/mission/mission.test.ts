import { describe, expect, it } from 'vitest';
import type { MissionAction } from './types';
import { createMissionStore, type MissionStore } from './store';
import { createInitialState, currentStep, isAt, missionReducer, scaleReadingG, stepCue } from './reducer';
import { STEP_ORDER } from './content';
import { MODEL, RECIPE } from './extraction';
import { buildSummary } from './summary';
import { mulberry32, solve, ticks } from './testkit';

function setup(guidance: 'guided' | 'assisted' | 'independent' = 'guided') {
  const store = createMissionStore(guidance);
  const d = (a: MissionAction) => store.dispatch({ source: 'test', ...a } as MissionAction);
  return { store, d, s: () => store.getState() };
}

/** Drive the full mission like an XR user with two hands. */
function happyPath(store: MissionStore, d: (a: MissionAction) => unknown, stopAtG = RECIPE.targetYieldG - MODEL.postStopDripG) {
  const s = () => store.getState();
  d({ type: 'LOCATE', target: 'espresso-machine' });
  expect(currentStep(s())).toBe('grab-portafilter');

  d({ type: 'GRAB', item: 'portafilter', hand: 'right' });
  expect(currentStep(s())).toBe('dose');
  d({ type: 'RELEASE', hand: 'right', zone: 'grinder-fork', distanceM: 0.03 });
  expect(isAt(s(), 'portafilter', 'grinder-fork')).toBe(true);
  d({ type: 'PRESS', button: 'grinder' });
  expect(s().grinder.running).toBe(true);
  ticks(store, MODEL.grindSec + 0.2);
  expect(s().basket).toBe('dosed');
  expect(s().doseG).toBe(RECIPE.doseG);
  expect(currentStep(s())).toBe('tamp');

  d({ type: 'GRAB', item: 'portafilter', hand: 'right' });
  d({ type: 'RELEASE', hand: 'right', zone: 'tamp-mat', distanceM: 0.02 });
  d({ type: 'GRAB', item: 'tamper', hand: 'left' });
  d({ type: 'RELEASE', hand: 'left', zone: 'basket', distanceM: 0.01, tiltDeg: 3 });
  expect(s().basket).toBe('tamped');
  expect(isAt(s(), 'tamper', 'tamper-stand')).toBe(true);
  expect(currentStep(s())).toBe('attach');

  d({ type: 'GRAB', item: 'portafilter', hand: 'right' });
  d({ type: 'RELEASE', hand: 'right', zone: 'group-head', distanceM: 0.04, angleDeg: 12 });
  expect(isAt(s(), 'portafilter', 'group-head')).toBe(true);
  expect(currentStep(s())).toBe('place-cup');

  d({ type: 'GRAB', item: 'cup', hand: 'left' });
  d({ type: 'RELEASE', hand: 'left', zone: 'scale', distanceM: 0.03 });
  expect(scaleReadingG(s())).toBe(MODEL.cupMassG);
  expect(currentStep(s())).toBe('tare');
  d({ type: 'PRESS', button: 'tare' });
  expect(scaleReadingG(s())).toBe(0);
  expect(currentStep(s())).toBe('brew');

  d({ type: 'PRESS', button: 'brew' });
  expect(s().shot.status).toBe('running');
  expect(currentStep(s())).toBe('stop');
  while (s().shot.yieldG < stopAtG) store.dispatch({ type: 'TICK', dtSec: 0.1 });
  d({ type: 'PRESS', button: 'brew' });
  expect(s().shot.status).toBe('settling');
  ticks(store, MODEL.settleSec + 0.2);
  expect(s().shot.status).toBe('done');
  expect(s().basket).toBe('spent');
  expect(currentStep(s())).toBe('serve');

  d({ type: 'GRAB', item: 'cup', hand: 'left' });
  d({ type: 'RELEASE', hand: 'left', zone: 'serve', distanceM: 0.05 });
  expect(currentStep(s())).toBe('remove');
  d({ type: 'GRAB', item: 'portafilter', hand: 'right' });
  expect(currentStep(s())).toBe('knock-out');
  d({ type: 'RELEASE', hand: 'right', zone: 'knock-box', distanceM: 0.05 });
  expect(s().basket).toBe('empty');
  expect(currentStep(s())).toBe('flush');
  d({ type: 'PRESS', button: 'brew' });
  expect(s().flush.running).toBe(true);
  ticks(store, MODEL.flushSec + 0.2);
}

describe('espresso mission — happy path', () => {
  it('runs the full 13-step sequence to completion with no mistakes', () => {
    const { store, d, s } = setup('guided');
    happyPath(store, d);
    const st = s();
    expect(st.status).toBe('complete');
    expect(currentStep(st)).toBeNull();
    expect(Object.keys(st.metrics.stepTimes).sort()).toEqual([...STEP_ORDER].sort());
    expect(st.metrics.mistakes).toEqual([]);
    expect(st.feedback?.code).toBe('mission-complete');
    expect(st.effects.some((e) => e.type === 'mission-complete')).toBe(true);

    const sum = buildSummary(st);
    expect(sum.completed).toBe(true);
    expect(sum.sequenceAccuracy).toBe(1);
    expect(sum.stop?.band).toBe('on-target');
    expect(sum.score).toBeGreaterThanOrEqual(0.95);
    expect(sum.snaps).toBeGreaterThanOrEqual(7);
  });

  it('ignores further learner actions once complete (latched), but RESET still works', () => {
    const { store, d, s } = setup();
    happyPath(store, d);
    const done = s();
    expect(missionReducer(done, { type: 'PRESS', button: 'brew' })).toBe(done);
    expect(missionReducer(done, { type: 'TICK', dtSec: 1 })).toBe(done);
    d({ type: 'RESET' });
    expect(s().status).toBe('playing');
    expect(currentStep(s())).toBe('locate');
  });

  it('emits sound + snap effects that adapters can play', () => {
    const { store, d } = setup();
    const seen: string[] = [];
    store.onEffects((effects) => effects.forEach((e) => seen.push(e.type === 'sound' ? `sound:${e.name}` : e.type)));
    d({ type: 'LOCATE', target: 'espresso-machine' });
    d({ type: 'GRAB', item: 'portafilter', hand: 'right' });
    d({ type: 'RELEASE', hand: 'right', zone: 'grinder-fork', distanceM: 0 });
    expect(seen).toContain('sound:correct');
    expect(seen).toContain('grab');
    expect(seen).toContain('snap');
    expect(seen).toContain('sound:snap');
  });
});

describe('espresso mission — wrong-order actions give specific, gentle feedback', () => {
  it('brewing with no portafilter is a counted mistake and does not advance', () => {
    const { d, s } = setup();
    d({ type: 'PRESS', button: 'brew' });
    expect(s().feedback?.code).toBe('brew-no-portafilter');
    expect(s().feedback?.kind).toBe('mistake');
    expect(s().feedback?.text.en).toMatch(/portafilter/i);
    expect(s().feedback?.text.zh.length).toBeGreaterThan(0);
    expect(s().metrics.mistakes.map((m) => m.code)).toEqual(['brew-no-portafilter']);
    expect(s().shot.status).toBe('idle');
    expect(currentStep(s())).toBe('locate');
  });

  it('attaching an empty or untamped portafilter is rejected and it floats home', () => {
    const { store, d, s } = setup();
    d({ type: 'LOCATE', target: 'espresso-machine' });
    d({ type: 'GRAB', item: 'portafilter', hand: 'right' });
    d({ type: 'RELEASE', hand: 'right', zone: 'group-head', distanceM: 0 });
    expect(s().feedback?.code).toBe('attach-empty');
    expect(isAt(s(), 'portafilter', 'tamp-mat')).toBe(true);

    d({ type: 'GRAB', item: 'portafilter', hand: 'right' });
    d({ type: 'RELEASE', hand: 'right', zone: 'grinder-fork', distanceM: 0 });
    d({ type: 'PRESS', button: 'grinder' });
    ticks(store, 3.5);
    d({ type: 'GRAB', item: 'portafilter', hand: 'right' });
    d({ type: 'RELEASE', hand: 'right', zone: 'group-head', distanceM: 0 });
    expect(s().feedback?.code).toBe('attach-untamped');
    expect(s().feedback?.detail).toBeDefined();
    expect(isAt(s(), 'portafilter', 'tamp-mat')).toBe(true);
  });

  it('grinder, tamper and knock box rules', () => {
    const { store, d, s } = setup();
    d({ type: 'PRESS', button: 'grinder' });
    expect(s().feedback?.code).toBe('grind-no-portafilter');
    d({ type: 'GRAB', item: 'tamper', hand: 'left' });
    d({ type: 'RELEASE', hand: 'left', zone: 'basket', distanceM: 0 });
    expect(s().feedback?.code).toBe('tamp-empty');
    expect(isAt(s(), 'tamper', 'tamper-stand')).toBe(true);

    d({ type: 'GRAB', item: 'portafilter', hand: 'right' });
    d({ type: 'RELEASE', hand: 'right', zone: 'grinder-fork', distanceM: 0 });
    d({ type: 'PRESS', button: 'grinder' });
    d({ type: 'GRAB', item: 'portafilter', hand: 'right' });
    expect(s().feedback?.code).toBe('grinding-wait');
    ticks(store, 3.5);
    d({ type: 'PRESS', button: 'grinder' });
    expect(s().feedback?.code).toBe('grind-basket-full');
    d({ type: 'GRAB', item: 'portafilter', hand: 'right' });
    d({ type: 'RELEASE', hand: 'right', zone: 'knock-box', distanceM: 0 });
    expect(s().feedback?.code).toBe('knock-fresh-grounds');
    expect(s().basket).toBe('dosed');
    expect(s().metrics.mistakes.map((m) => m.code)).toEqual([
      'grind-no-portafilter',
      'tamp-empty',
      'grind-basket-full',
      'knock-fresh-grounds',
    ]);
  });

  it('brewing without a cup or without taring; touching things mid-shot; flushing onto the drink', () => {
    const { store, d, s } = setup();
    // Get to "attached" quickly via the solver-equivalent actions.
    d({ type: 'LOCATE', target: 'espresso-machine' });
    d({ type: 'GRAB', item: 'portafilter', hand: 'right' });
    d({ type: 'RELEASE', hand: 'right', zone: 'grinder-fork', distanceM: 0 });
    d({ type: 'PRESS', button: 'grinder' });
    ticks(store, 3.5);
    d({ type: 'GRAB', item: 'portafilter', hand: 'right' });
    d({ type: 'RELEASE', hand: 'right', zone: 'tamp-mat', distanceM: 0 });
    d({ type: 'GRAB', item: 'tamper', hand: 'left' });
    d({ type: 'RELEASE', hand: 'left', zone: 'basket', distanceM: 0 });
    d({ type: 'GRAB', item: 'portafilter', hand: 'right' });
    d({ type: 'RELEASE', hand: 'right', zone: 'group-head', distanceM: 0 });

    d({ type: 'PRESS', button: 'brew' });
    expect(s().feedback?.code).toBe('brew-no-cup');
    d({ type: 'GRAB', item: 'cup', hand: 'left' });
    d({ type: 'RELEASE', hand: 'left', zone: 'scale', distanceM: 0 });
    d({ type: 'PRESS', button: 'brew' });
    expect(s().feedback?.code).toBe('brew-not-tared');
    expect(s().feedback?.text.en).toContain(`${MODEL.cupMassG}.0`);
    d({ type: 'PRESS', button: 'tare' });
    d({ type: 'PRESS', button: 'brew' });
    expect(s().shot.status).toBe('running');

    d({ type: 'GRAB', item: 'portafilter', hand: 'right' });
    expect(s().feedback?.code).toBe('remove-during-shot');
    expect(isAt(s(), 'portafilter', 'group-head')).toBe(true);
    d({ type: 'GRAB', item: 'cup', hand: 'left' });
    expect(s().feedback?.code).toBe('cup-during-shot');
    expect(isAt(s(), 'cup', 'scale')).toBe(true);
    d({ type: 'PRESS', button: 'tare' });
    expect(s().feedback?.code).toBe('tare-during-shot');

    ticks(store, 28);
    d({ type: 'PRESS', button: 'brew' });
    ticks(store, 2);
    // Flush with the used puck still locked in, then with the cup still under the spouts.
    d({ type: 'PRESS', button: 'brew' });
    expect(s().feedback?.code).toBe('flush-spent-attached');
    d({ type: 'GRAB', item: 'portafilter', hand: 'right' });
    d({ type: 'RELEASE', hand: 'right', zone: 'knock-box', distanceM: 0 });
    d({ type: 'PRESS', button: 'brew' });
    expect(s().feedback?.code).toBe('flush-cup-in-place');
    expect(s().flush.running).toBe(false);

    // Never a dead end: the mission still completes after all of that.
    solve(store);
    const sum = buildSummary(s());
    expect(sum.completed).toBe(true);
    expect(sum.mistakes).toBe(6);
    expect(sum.sequenceAccuracy).toBeCloseTo(13 / 19, 2);
    expect(sum.score).toBeLessThan(0.9);
  });

  it('undoing a step moves guidance back instead of breaking', () => {
    const { store, d, s } = setup();
    d({ type: 'LOCATE', target: 'espresso-machine' });
    d({ type: 'GRAB', item: 'portafilter', hand: 'right' });
    d({ type: 'RELEASE', hand: 'right', zone: 'grinder-fork', distanceM: 0 });
    d({ type: 'PRESS', button: 'grinder' });
    ticks(store, 3.5);
    d({ type: 'GRAB', item: 'portafilter', hand: 'right' });
    d({ type: 'RELEASE', hand: 'right', zone: 'tamp-mat', distanceM: 0 });
    d({ type: 'GRAB', item: 'tamper', hand: 'left' });
    d({ type: 'RELEASE', hand: 'left', zone: 'basket', distanceM: 0 });
    d({ type: 'GRAB', item: 'portafilter', hand: 'right' });
    d({ type: 'RELEASE', hand: 'right', zone: 'group-head', distanceM: 0 });
    d({ type: 'GRAB', item: 'cup', hand: 'left' });
    d({ type: 'RELEASE', hand: 'left', zone: 'scale', distanceM: 0 });
    d({ type: 'PRESS', button: 'tare' });
    expect(currentStep(s())).toBe('brew');
    d({ type: 'GRAB', item: 'cup', hand: 'left' }); // lift cup again
    expect(currentStep(s())).toBe('place-cup');
    expect(stepCue(s())).toEqual({ kind: 'place', item: 'cup', zone: 'scale' });
    expect(s().metrics.mistakes).toHaveLength(0);
  });

  it('lets the learner choose another machine part first, explaining what it is', () => {
    const { d, s } = setup();
    d({ type: 'LOCATE', target: 'grinder' });
    expect(s().feedback?.code).toBe('located-other');
    expect(s().feedback?.text.en).toMatch(/Grinder/);
    expect(currentStep(s())).toBe('locate');
    d({ type: 'LOCATE', target: 'group-head' });
    expect(currentStep(s())).toBe('grab-portafilter');
    d({ type: 'LOCATE', target: 'scale' });
    expect(s().feedback?.code).toBe('inspect');
  });
});

describe('snap tolerance follows the guidance tier', () => {
  it('guided snaps at 10 cm; independent treats the same release as a near-miss', () => {
    for (const [tier, expectSnap] of [
      ['guided', true],
      ['assisted', false],
      ['independent', false],
    ] as const) {
      const { d, s } = setup(tier);
      d({ type: 'GRAB', item: 'portafilter', hand: 'right' });
      d({ type: 'RELEASE', hand: 'right', zone: 'grinder-fork', distanceM: 0.1 });
      expect(isAt(s(), 'portafilter', 'grinder-fork')).toBe(expectSnap);
      if (!expectSnap) {
        expect(s().metrics.nearMisses).toBe(1);
        expect(s().feedback?.code).toBe('near-miss');
        expect(isAt(s(), 'portafilter', 'tamp-mat')).toBe(true);
      }
    }
  });

  it('checks portafilter angle at the group head (generous in guided, strict in independent)', () => {
    const prep = (tier: 'guided' | 'independent') => {
      const { store, d, s } = setup(tier);
      d({ type: 'GRAB', item: 'portafilter', hand: 'right' });
      d({ type: 'RELEASE', hand: 'right', zone: 'grinder-fork', distanceM: 0 });
      d({ type: 'PRESS', button: 'grinder' });
      ticks(store, 3.5);
      d({ type: 'GRAB', item: 'portafilter', hand: 'right' });
      d({ type: 'RELEASE', hand: 'right', zone: 'tamp-mat', distanceM: 0 });
      d({ type: 'GRAB', item: 'tamper', hand: 'left' });
      d({ type: 'RELEASE', hand: 'left', zone: 'basket', distanceM: 0, tiltDeg: 12 });
      d({ type: 'GRAB', item: 'portafilter', hand: 'right' });
      d({ type: 'RELEASE', hand: 'right', zone: 'group-head', distanceM: 0.02, angleDeg: 45 });
      return s();
    };
    const g = prep('guided');
    expect(isAt(g, 'portafilter', 'group-head')).toBe(true);
    expect(g.flags.tampTiltDeg).toBe(12);
    const i = prep('independent');
    expect(isAt(i, 'portafilter', 'group-head')).toBe(false);
    expect(i.feedback?.code).toBe('near-miss-angle');
    // The 12° tamp tilt exceeded independent's 7° tolerance: tamp still counted, with a note.
    expect(i.metrics.mistakes).toHaveLength(0);
  });

  it('switching tier mid-run is recorded and the most supportive tier is reported', () => {
    const { d, s } = setup('independent');
    d({ type: 'SET_GUIDANCE', guidance: 'guided' });
    d({ type: 'SET_GUIDANCE', guidance: 'assisted' });
    expect(s().guidanceUsed).toEqual(['independent', 'guided', 'assisted']);
    expect(s().guidance).toBe('assisted');
    expect(buildSummary(s()).guidanceForRecord).toBe('guided');
  });
});

describe('reset, pause and hints', () => {
  it('RESET puts everything back, keeps the tier, counts the restart', () => {
    const { store, d, s } = setup('assisted');
    d({ type: 'LOCATE', target: 'espresso-machine' });
    d({ type: 'GRAB', item: 'portafilter', hand: 'right' });
    d({ type: 'PRESS', button: 'brew' });
    ticks(store, 5);
    d({ type: 'RESET' });
    const st = s();
    expect(st.guidance).toBe('assisted');
    expect(st.attempt).toBe(2);
    expect(st.metrics.resets).toBe(1);
    expect(st.metrics.mistakes).toEqual([]);
    expect(st.metrics.elapsedSec).toBe(0);
    expect(st.items.portafilter).toEqual({ zone: 'tamp-mat', heldBy: null });
    expect(currentStep(st)).toBe('locate');
    expect(st.feedback?.code).toBe('reset');
    expect(st.effects).toContainEqual({ type: 'reset' });
    const fresh = createInitialState('assisted');
    expect(st.items).toEqual(fresh.items);
  });

  it('PAUSE freezes time, the shot and learner actions; RESUME continues', () => {
    const { store, d, s } = setup();
    happyPathUntilBrew(store, d);
    ticks(store, 10);
    const y = s().shot.yieldG;
    const t = s().metrics.elapsedSec;
    d({ type: 'PAUSE' });
    expect(s().status).toBe('paused');
    ticks(store, 30);
    d({ type: 'PRESS', button: 'brew' });
    expect(s().shot.yieldG).toBe(y);
    expect(s().metrics.elapsedSec).toBe(t);
    expect(s().shot.status).toBe('running');
    d({ type: 'RESUME' });
    ticks(store, 1);
    expect(s().shot.yieldG).toBeGreaterThan(y);
  });

  it('hint requests are counted, show the next step and force cues on for a while', () => {
    const { store, d, s } = setup('independent');
    d({ type: 'REQUEST_HINT', source: 'xr' });
    expect(s().metrics.hintsUsed).toBe(1);
    expect(s().feedback?.code).toBe('hint');
    expect(s().feedback?.text.en).toMatch(/controller/i); // XR wording when asked from XR
    expect(s().hintUntilSec).toBeCloseTo(6);
    ticks(store, 7);
    expect(s().metrics.elapsedSec).toBeGreaterThan(s().hintUntilSec!);
  });
});

function happyPathUntilBrew(store: MissionStore, d: (a: MissionAction) => unknown) {
  d({ type: 'LOCATE', target: 'espresso-machine' });
  d({ type: 'GRAB', item: 'portafilter', hand: 'right' });
  d({ type: 'RELEASE', hand: 'right', zone: 'grinder-fork', distanceM: 0 });
  d({ type: 'PRESS', button: 'grinder' });
  ticks(store, 3.5);
  d({ type: 'GRAB', item: 'portafilter', hand: 'right' });
  d({ type: 'RELEASE', hand: 'right', zone: 'tamp-mat', distanceM: 0 });
  d({ type: 'GRAB', item: 'tamper', hand: 'left' });
  d({ type: 'RELEASE', hand: 'left', zone: 'basket', distanceM: 0 });
  d({ type: 'GRAB', item: 'portafilter', hand: 'right' });
  d({ type: 'RELEASE', hand: 'right', zone: 'group-head', distanceM: 0 });
  d({ type: 'GRAB', item: 'cup', hand: 'left' });
  d({ type: 'RELEASE', hand: 'left', zone: 'scale', distanceM: 0 });
  d({ type: 'PRESS', button: 'tare' });
  d({ type: 'PRESS', button: 'brew' });
}

describe('extraction stop', () => {
  it('auto-stops (simulated cut-off) if the learner never presses stop, with gentle feedback', () => {
    const { store, d, s } = setup();
    happyPathUntilBrew(store, d);
    ticks(store, 60);
    expect(s().shot.autoStopped).toBe(true);
    expect(s().shot.status).toBe('done');
    expect(s().metrics.mistakes).toHaveLength(0);
    const sum = buildSummary(s());
    expect(sum.stop?.band).toBe('far');
    expect(sum.stop?.direction).toBe('over');
    expect(sum.autoStopped).toBe(true);
  });

  it('stopping early is scored as under-target with a ratio explanation', () => {
    const { store, d, s } = setup();
    happyPathUntilBrew(store, d);
    while (s().shot.yieldG < 28) store.dispatch({ type: 'TICK', dtSec: 0.1 });
    d({ type: 'PRESS', button: 'brew' });
    ticks(store, 2);
    const sum = buildSummary(s());
    expect(sum.stop?.direction).toBe('under');
    expect(sum.stopFeedback?.en).toMatch(/short of 36 g/);
    expect(sum.stopFeedback?.en).toMatch(/ratio 1:1\.6/);
  });

  it('guided shows an "approaching" cue near the target; independent does not', () => {
    for (const [tier, expected] of [
      ['guided', true],
      ['independent', false],
    ] as const) {
      const { store, d, s } = setup(tier);
      happyPathUntilBrew(store, d);
      const codes: string[] = [];
      store.subscribe(() => {
        const f = s().feedback;
        if (f) codes.push(f.code);
      });
      while (s().shot.yieldG < 32) store.dispatch({ type: 'TICK', dtSec: 0.1 });
      expect(codes.includes('shot-approaching')).toBe(expected);
    }
  });
});

describe('never dead-ends (fuzz)', () => {
  const ACTIONS: MissionAction[] = [
    { type: 'LOCATE', target: 'espresso-machine' },
    { type: 'LOCATE', target: 'grinder' },
    { type: 'GRAB', item: 'portafilter', hand: 'pointer' },
    { type: 'GRAB', item: 'cup', hand: 'pointer' },
    { type: 'GRAB', item: 'tamper', hand: 'pointer' },
    { type: 'GRAB', item: 'cup', hand: 'left' },
    { type: 'RELEASE', hand: 'pointer' },
    { type: 'RELEASE', hand: 'left' },
    ...(['tamp-mat', 'grinder-fork', 'group-head', 'knock-box', 'scale', 'serve', 'cup-home', 'basket'] as const).map(
      (zone): MissionAction => ({ type: 'RELEASE', hand: 'pointer', zone, distanceM: 0 }),
    ),
    { type: 'PRESS', button: 'grinder' },
    { type: 'PRESS', button: 'tare' },
    { type: 'PRESS', button: 'brew' },
    { type: 'TICK', dtSec: 0.25 },
    { type: 'TICK', dtSec: 0.25 },
    { type: 'TICK', dtSec: 0.25 },
    { type: 'REQUEST_HINT' },
    { type: 'PAUSE' },
    { type: 'RESUME' },
  ];

  it('from 200 random action sequences, following the cues always completes the mission', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const rnd = mulberry32(seed);
      const store = createMissionStore((['guided', 'assisted', 'independent'] as const)[seed % 3]);
      const n = Math.floor(rnd() * 120);
      for (let i = 0; i < n; i++) store.dispatch(ACTIONS[Math.floor(rnd() * ACTIONS.length)]!);
      if (store.getState().status === 'complete') continue;
      // A stray item in the left hand: the solver uses the pointer hand, so drop it first.
      store.dispatch({ type: 'RELEASE', hand: 'left' });
      expect(() => solve(store), `seed ${seed}`).not.toThrow();
      expect(store.getState().status).toBe('complete');
    }
  });
});
