import { describe, expect, it } from 'vitest';
import { formatBrewRatio } from '../../../domain/brew';
import { createStore, completionEvent, type Store } from '../../mission/core';
import { mulberry32 } from '../../mission/testkit';
import { POUR, FLOW_MODEL_NOTE, classifyStream, flowFromTilt, flowSummary, addFlow, pourThresholdDeg, targetAccuracy, tiltForFlow } from './model';
import { createPour, currentPourStep, freeWaterG, kettleFlow, pourReducer, scaleReading, type PourAction, type PourState } from './reducer';
import { pouroverMission, pourActions } from './def';
import { POUR_STEPS } from './content';

type PS = Store<PourState, PourAction>;
const mk = (g: 'guided' | 'assisted' | 'independent' = 'guided'): PS => createStore(pourReducer, createPour(g));
const ticks = (st: PS, sec: number) => {
  for (let i = 0; i < Math.round(sec / 0.1); i++) st.dispatch({ type: 'TICK', dtSec: 0.1 });
};
const tilt = (st: PS, gps: number) => st.dispatch({ type: 'KETTLE', tiltDeg: tiltForFlow(gps, st.getState().kettleG / POUR.kettleCapacityG), source: 'test' });
const held = (s: PourState) => (['filter', 'grounds', 'carafe', 'kettle'] as const).find((i) => s.items[i].heldBy === 'pointer') ?? null;

/** Pour with the kettle at a steady flow until `until(s)` is true, then stop and let the pour end. */
function pourUntil(st: PS, gps: number, until: (s: PourState) => boolean, offsetM: number | null = 0) {
  if (st.getState().items.kettle.heldBy !== 'pointer') st.dispatch({ type: 'GRAB', item: 'kettle', hand: 'pointer', source: 'test' });
  st.dispatch({ type: 'KETTLE', offsetM, source: 'test' });
  for (let i = 0; i < 2000 && !until(st.getState()); i++) {
    tilt(st, gps);
    st.dispatch({ type: 'TICK', dtSec: 0.1 });
  }
  st.dispatch({ type: 'KETTLE', tiltDeg: 0, source: 'test' });
  ticks(st, 0.6);
}

function move(st: PS, item: 'filter' | 'grounds' | 'carafe', zone: 'dripper' | 'sink' | 'scale') {
  const h = held(st.getState());
  if (h && h !== item) st.dispatch({ type: 'RELEASE', hand: 'pointer', source: 'test' });
  st.dispatch({ type: 'GRAB', item, hand: 'pointer', source: 'test' });
  st.dispatch({ type: 'RELEASE', hand: 'pointer', zone, distanceM: 0, source: 'test' });
}

/** Cue/state-following solver: proves the mission completes from any state. */
function solve(st: PS, max = 30000) {
  for (let i = 0; i < max; i++) {
    const s = st.getState();
    if (s.status === 'complete') return;
    if (s.status === 'paused') {
      st.dispatch({ type: 'RESUME' });
      continue;
    }
    const step = currentPourStep(s)!;
    const h = held(s);
    const needKettle = step === 'rinse' || step === 'bloom' || step === 'pour';
    if (h && h !== 'kettle') {
      st.dispatch({ type: 'RELEASE', hand: 'pointer', source: 'test' });
      continue;
    }
    if (h === 'kettle' && (!needKettle || s.kettleG <= 0)) {
      if (kettleFlow(s) > 0) st.dispatch({ type: 'KETTLE', tiltDeg: 0, source: 'test' });
      else st.dispatch({ type: 'RELEASE', hand: 'pointer', source: 'test' });
      st.dispatch({ type: 'TICK', dtSec: 0.1 });
      continue;
    }
    switch (step) {
      case 'place-filter':
        move(st, 'filter', 'dripper');
        break;
      case 'discard':
        if (freeWaterG(s) > 0.5) st.dispatch({ type: 'TICK', dtSec: 0.1 });
        else if (s.items.carafe.zone === 'sink') move(st, 'carafe', 'scale');
        else move(st, 'carafe', 'sink');
        break;
      case 'add-grounds':
        move(st, 'grounds', 'dripper');
        break;
      case 'tare':
        st.dispatch({ type: 'PRESS', button: 'tare', source: 'test' });
        st.dispatch({ type: 'TICK', dtSec: 0.1 });
        break;
      case 'bloom-wait':
      case 'drawdown':
        st.dispatch({ type: 'TICK', dtSec: 0.1 });
        break;
      default: {
        if (!h) st.dispatch({ type: 'GRAB', item: 'kettle', hand: 'pointer', source: 'test' });
        st.dispatch({ type: 'KETTLE', offsetM: 0, source: 'test' });
        const want = step === 'rinse' ? s.rinseG < POUR.rinseMinG + 4 : step === 'bloom' ? s.bloom.pouredG < POUR.bloomIdealG : s.brewG < POUR.targetWaterG - 1;
        if (want) tilt(st, 4);
        else st.dispatch({ type: 'KETTLE', tiltDeg: 0, source: 'test' });
        st.dispatch({ type: 'TICK', dtSec: 0.1 });
      }
    }
  }
  throw new Error(`pour solver stuck at ${currentPourStep(st.getState())}`);
}

describe('illustrative pour model', () => {
  it('flow is 0 upright, non-decreasing with tilt, and capped', () => {
    expect(flowFromTilt(0)).toBe(0);
    expect(flowFromTilt(pourThresholdDeg(1))).toBe(0);
    let prev = 0;
    for (let d = 0; d <= 120; d += 2) {
      const f = flowFromTilt(d, 0.8);
      expect(f).toBeGreaterThanOrEqual(prev);
      prev = f;
    }
    expect(flowFromTilt(90)).toBeCloseTo(POUR.maxFlowGps);
    expect(flowFromTilt(60, 0)).toBe(0); // empty kettle
    expect(pourThresholdDeg(0.2)).toBeGreaterThan(pourThresholdDeg(1)); // fuller pours sooner
    for (const g of [1, 3, 7]) expect(flowFromTilt(tiltForFlow(g, 0.7), 0.7)).toBeCloseTo(g, 5);
  });
  it('is explicitly labelled illustrative, bilingual', () => {
    expect(POUR.illustrative).toBe(true);
    expect(FLOW_MODEL_NOTE.en).toMatch(/Illustrative/);
    expect(FLOW_MODEL_NOTE.zh).toMatch(/示意/);
  });
  it('classifies stream position over the bed', () => {
    expect(classifyStream(0)).toBe('center');
    expect(classifyStream(0.03)).toBe('bed');
    expect(classifyStream(0.05)).toBe('wall');
    expect(classifyStream(0.1)).toBe('off');
    expect(classifyStream(null)).toBe('off');
  });
  it('steadiness and target accuracy', () => {
    let st = { w: 0, s1: 0, s2: 0 };
    for (let i = 0; i < 50; i++) st = addFlow(st, 4, 0.1);
    expect(flowSummary(st)).toEqual({ meanGps: 4, steadiness: 1 });
    let jerky = { w: 0, s1: 0, s2: 0 };
    for (let i = 0; i < 50; i++) jerky = addFlow(jerky, i % 2 ? 1 : 9, 0.1);
    expect(flowSummary(jerky).steadiness).toBeLessThan(0.5);
    expect(targetAccuracy(252)).toBe(1);
    expect(targetAccuracy(270)).toBeCloseTo(0.4);
    expect(targetAccuracy(300)).toBe(0);
  });
});

describe('pour-over mission — happy path', () => {
  it('rinse → discard → grounds → tare → bloom → wait → staged pours → drawdown', () => {
    const st = mk();
    move(st, 'filter', 'dripper');
    expect(currentPourStep(st.getState())).toBe('rinse');
    pourUntil(st, 5, (s) => s.rinseG >= 25);
    st.dispatch({ type: 'RELEASE', hand: 'pointer', source: 'test' }); // kettle back on its base
    ticks(st, 2); // rinse drains into the carafe
    expect(st.getState().carafeG).toBeGreaterThan(20);
    expect(currentPourStep(st.getState())).toBe('discard');
    move(st, 'carafe', 'sink');
    expect(st.getState().feedback?.code).toBe('discard-ok');
    move(st, 'carafe', 'scale');
    expect(currentPourStep(st.getState())).toBe('add-grounds');
    move(st, 'grounds', 'dripper');
    expect(st.getState().groundsIn).toBe(true);
    expect(currentPourStep(st.getState())).toBe('tare');
    st.dispatch({ type: 'PRESS', button: 'tare', source: 'test' });
    expect(scaleReading(st.getState())).toBe(0);
    pourUntil(st, 4, (s) => s.bloom.pouredG >= 30);
    expect(st.getState().bloom.endedAtSec).not.toBeNull();
    expect(currentPourStep(st.getState())).toBe('bloom-wait');
    ticks(st, 31);
    expect(currentPourStep(st.getState())).toBe('pour');
    pourUntil(st, 5, (s) => s.brewG >= 150);
    expect(st.getState().feedback?.code).toBe('keep-going');
    pourUntil(st, 5, (s) => s.brewG >= 249);
    ticks(st, 60);
    const s = st.getState();
    expect(s.status).toBe('complete');
    expect(s.metrics.mistakes).toEqual([]);
    expect(s.stagePours).toBe(2);
    const r = pouroverMission.result(s);
    expect(r.evidence).toBe('simulated');
    expect(r.illustrativeModel).toBe(true);
    expect(r.claims).toEqual({ realSkill: false, taste: false, gripForce: false, haptics: false });
    const ratio = formatBrewRatio(15, s.brewG);
    expect(r.stats.find((x) => x.label.en.startsWith('Ratio'))?.value.en).toBe(ratio);
    expect(r.note?.en).toMatch(/Illustrative flow model/);
    expect(r.notTrained.map((x) => x.en).join(' ')).toMatch(/taste/i);
    expect(r.score).toBeGreaterThan(0.9);
    const ev = completionEvent(pouroverMission, r, { immersive: false, touch: true });
    expect(ev).toMatchObject({ activityId: 'po-ratio-bloom-xr', lessonId: 'po-ratio-bloom', evidence: 'simulated', outcome: 'completed', mode: 'mobile' });
  });

  it('skip wait works for the bloom and the drawdown (recorded as skipped)', () => {
    const st = mk();
    move(st, 'filter', 'dripper');
    pourUntil(st, 6, (s) => s.rinseG >= 25);
    st.dispatch({ type: 'RELEASE', hand: 'pointer', source: 'test' });
    ticks(st, 2);
    move(st, 'carafe', 'sink');
    move(st, 'carafe', 'scale');
    move(st, 'grounds', 'dripper');
    st.dispatch({ type: 'PRESS', button: 'tare', source: 'test' });
    pourUntil(st, 4, (s) => s.bloom.pouredG >= 30);
    st.dispatch({ type: 'SKIP_WAIT', source: 'test' });
    expect(st.getState().bloom.skipped).toBe(true);
    pourUntil(st, 6, (s) => s.brewG >= 250);
    st.dispatch({ type: 'SKIP_WAIT', source: 'test' });
    ticks(st, 0.2);
    expect(st.getState().status).toBe('complete');
    expect(pouroverMission.result(st.getState()).stats.find((x) => x.label.en.startsWith('Bloom'))?.value.en).toMatch(/skipped/);
  });
});

describe('pour-over mission — wrong actions get specific feedback', () => {
  function toGrounds(st: PS) {
    move(st, 'filter', 'dripper');
    pourUntil(st, 6, (s) => s.rinseG >= 25);
    st.dispatch({ type: 'RELEASE', hand: 'pointer', source: 'test' });
    ticks(st, 2);
    move(st, 'carafe', 'sink');
    move(st, 'carafe', 'scale');
    move(st, 'grounds', 'dripper');
  }
  const codes = (st: PS) => st.getState().metrics.mistakes.map((m) => m.code);

  it('grounds before filter / rinse / discard are rejected; discarding coffee is blocked', () => {
    const st = mk();
    move(st, 'grounds', 'dripper');
    expect(st.getState().feedback?.code).toBe('grounds-no-filter');
    move(st, 'filter', 'dripper');
    move(st, 'grounds', 'dripper');
    expect(st.getState().feedback?.code).toBe('grounds-before-rinse');
    pourUntil(st, 6, (s) => s.rinseG >= 25);
    st.dispatch({ type: 'RELEASE', hand: 'pointer', source: 'test' });
    ticks(st, 2);
    move(st, 'grounds', 'dripper');
    expect(st.getState().feedback?.code).toBe('grounds-before-discard');
    expect(st.getState().groundsIn).toBe(false);
    move(st, 'carafe', 'sink');
    move(st, 'carafe', 'scale');
    move(st, 'grounds', 'dripper');
    move(st, 'carafe', 'sink');
    expect(st.getState().feedback?.code).toBe('discard-coffee');
    expect(st.getState().items.carafe.zone).toBe('scale');
    expect(codes(st)).toEqual(['grounds-no-filter', 'grounds-before-rinse', 'grounds-before-discard', 'discard-coffee']);
  });

  it('pouring before tare is flagged once; the scale then includes coffee + carafe', () => {
    const st = mk();
    toGrounds(st);
    pourUntil(st, 4, (s) => s.brewG >= 10);
    expect(codes(st)).toContain('pour-before-tare');
    expect(scaleReading(st.getState())).toBeGreaterThan(400);
    pourUntil(st, 4, (s) => s.brewG >= 30);
    expect(codes(st).filter((c) => c === 'pour-before-tare')).toHaveLength(1);
  });

  it('pouring on the filter wall or off the dripper is flagged, and wall water is tracked', () => {
    const st = mk();
    toGrounds(st);
    st.dispatch({ type: 'PRESS', button: 'tare', source: 'test' });
    pourUntil(st, 5, (s) => s.brewG >= 30, 0.052);
    expect(codes(st)).toContain('pour-wall');
    expect(st.getState().wallG).toBeGreaterThan(3);
    const before = st.getState().brewG;
    pourUntil(st, 5, (s) => s.spillG >= 5, 0.15);
    expect(codes(st)).toContain('spill');
    expect(st.getState().brewG).toBeCloseTo(before, 0); // spilled water never counts toward the brew
  });

  it('cutting the bloom short and overshooting are reported', () => {
    const st = mk();
    toGrounds(st);
    st.dispatch({ type: 'PRESS', button: 'tare', source: 'test' });
    pourUntil(st, 4, (s) => s.bloom.pouredG >= 30);
    ticks(st, 5);
    pourUntil(st, 8, (s) => s.brewG >= 290);
    const s = st.getState();
    expect(codes(st)).toContain('bloom-cut-short');
    expect(s.flags.overshoot).toBe(true);
    ticks(st, 60);
    const r = pouroverMission.result(st.getState());
    expect(r.completed).toBe(true);
    expect(Number.parseInt(r.stats.find((x) => x.label.en === 'Overshoot')!.value.en)).toBeGreaterThanOrEqual(39);
    expect(r.score).toBeLessThan(0.8);
  });

  it('an empty kettle says so and refills on its base', () => {
    const st = mk();
    move(st, 'filter', 'dripper');
    pourUntil(st, 12, (s) => s.kettleG <= 0, 0.15);
    st.dispatch({ type: 'KETTLE', tiltDeg: 80, source: 'test' });
    ticks(st, 0.3);
    expect(st.getState().feedback?.code).toBe('kettle-empty');
    st.dispatch({ type: 'RELEASE', hand: 'pointer', source: 'test' });
    expect(st.getState().kettleG).toBe(POUR.kettleCapacityG);
  });
});

describe('pour-over — tiers, action list, never dead-ends', () => {
  it('guided shows an approaching cue near 250 g; independent does not', () => {
    for (const [g, expected] of [
      ['guided', true],
      ['independent', false],
    ] as const) {
      const st = mk(g);
      const seen: string[] = [];
      st.subscribe(() => seen.push(st.getState().feedback?.code ?? ''));
      solve(st);
      expect(seen.includes('approaching')).toBe(expected);
    }
  });

  it('is completable from the action list alone (keyboard user) and reports no steadiness claim', () => {
    const st = mk('guided');
    for (let i = 0; i < 20000 && st.getState().status !== 'complete'; i++) {
      const s = st.getState();
      const rec = pourActions(s).find((a) => a.recommended);
      const step = currentPourStep(s);
      if (step === 'bloom-wait' || step === 'drawdown') {
        const skip = pourActions(s).find((a) => a.id === 'skip');
        if (skip) skip.actions.forEach((a) => st.dispatch(a));
        st.dispatch({ type: 'TICK', dtSec: 0.1 });
        continue;
      }
      if (rec) rec.actions.forEach((a) => st.dispatch(a));
      st.dispatch({ type: 'TICK', dtSec: 0.1 });
    }
    const s = st.getState();
    expect(s.status).toBe('complete');
    const r = pouroverMission.result(s);
    expect(r.primaryInput).toBe('panel');
    expect(r.spatialPractice).toBe(false);
    expect(r.stats.find((x) => x.label.en === 'Pour steadiness')?.value.en).toMatch(/n\/a/);
    expect(Math.abs(s.brewG - 250)).toBeLessThan(15);
  });

  it('from 150 random action sequences, the mission can still be completed', () => {
    const A: PourAction[] = [
      { type: 'GRAB', item: 'filter', hand: 'pointer' },
      { type: 'GRAB', item: 'grounds', hand: 'pointer' },
      { type: 'GRAB', item: 'carafe', hand: 'pointer' },
      { type: 'GRAB', item: 'kettle', hand: 'pointer' },
      { type: 'GRAB', item: 'kettle', hand: 'left' },
      ...(['dripper', 'sink', 'scale'] as const).map((zone): PourAction => ({ type: 'RELEASE', hand: 'pointer', zone, distanceM: 0 })),
      { type: 'RELEASE', hand: 'pointer' },
      { type: 'RELEASE', hand: 'left' },
      { type: 'KETTLE', tiltDeg: 55, offsetM: 0 },
      { type: 'KETTLE', tiltDeg: 70, offsetM: 0.05 },
      { type: 'KETTLE', tiltDeg: 0 },
      { type: 'KETTLE', offsetM: 0.2 },
      { type: 'PRESS', button: 'tare' },
      { type: 'SKIP_WAIT' },
      { type: 'TICK', dtSec: 0.25 },
      { type: 'TICK', dtSec: 0.25 },
      { type: 'TICK', dtSec: 0.25 },
      { type: 'REQUEST_HINT' },
      { type: 'PAUSE' },
      { type: 'RESUME' },
    ];
    for (let seed = 1; seed <= 150; seed++) {
      const rnd = mulberry32(seed);
      const st = mk((['guided', 'assisted', 'independent'] as const)[seed % 3]);
      const n = Math.floor(rnd() * 150);
      for (let i = 0; i < n; i++) st.dispatch(A[Math.floor(rnd() * A.length)]!);
      st.dispatch({ type: 'RELEASE', hand: 'left' });
      expect(() => solve(st), `seed ${seed}`).not.toThrow();
    }
  });

  it('every step has bilingual text', () => {
    expect(POUR_STEPS).toHaveLength(9);
    for (const id of POUR_STEPS) {
      const h = pouroverMission.stepTitles[POUR_STEPS.indexOf(id)]!;
      expect(h.en && h.zh).toBeTruthy();
    }
  });
});
