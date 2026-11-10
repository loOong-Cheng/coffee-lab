import { describe, expect, it } from 'vitest';
import { createStore, completionEvent, type Store } from '../../mission/core';
import type { MissionAction } from '../../mission/types';
import { mulberry32 } from '../../mission/testkit';
import { CHALLENGES, EXPLORE_TARGET, INSPECTABLE, tourInfo } from './content';
import { createTour, currentChallenge, promptOf, tourCue, tourReducer, type TourState } from './reducer';
import { tourMission, tourView } from './def';

type TS = Store<TourState, MissionAction>;
const mk = (g: 'guided' | 'assisted' | 'independent' = 'guided'): TS => createStore(tourReducer, createTour(g));
const heldBy = (s: TourState) => (['portafilter', 'cup', 'tamper'] as const).find((i) => s.items[i].heldBy === 'pointer') ?? null;

/** Follow the mission like a learner who knows the answer. */
function solve(st: TS, max = 500) {
  for (let i = 0; i < max; i++) {
    const s = st.getState();
    if (s.status === 'complete') return;
    if (s.status === 'paused') {
      st.dispatch({ type: 'RESUME' });
      continue;
    }
    if (s.phase === 'explore') {
      const next = INSPECTABLE.find((id) => !s.inspected.includes(id))!;
      st.dispatch({ type: 'LOCATE', target: next, source: 'test' });
      continue;
    }
    const c = currentChallenge(s)!;
    const h = heldBy(s);
    if (c.kind === 'locate') st.dispatch({ type: 'LOCATE', target: c.target, source: 'test' });
    else if (h && h !== c.item) st.dispatch({ type: 'RELEASE', hand: 'pointer', source: 'test' });
    else if (c.kind === 'grab') st.dispatch({ type: 'GRAB', item: c.item, hand: 'pointer', source: 'test' });
    else if (!h) st.dispatch({ type: 'GRAB', item: c.item, hand: 'pointer', source: 'test' });
    else st.dispatch({ type: 'RELEASE', hand: 'pointer', zone: c.zone, distanceM: 0, source: 'test' });
  }
  throw new Error('tour solver stuck');
}

describe('station tour', () => {
  it('explore → 6 challenges → complete, recording first-try accuracy', () => {
    const st = mk();
    st.dispatch({ type: 'LOCATE', target: 'grinder', source: 'test' });
    expect(st.getState().feedback?.code).toBe('inspect');
    // Equipment descriptions come from the shared content catalog.
    expect(st.getState().feedback?.text.en).toContain(tourInfo('grinder').purpose.en);
    st.dispatch({ type: 'LOCATE', target: 'grinder', source: 'test' }); // repeats don't count twice
    expect(st.getState().inspected).toHaveLength(1);
    for (const id of ['scale', 'tamper', 'cup'] as const) st.dispatch({ type: 'LOCATE', target: id, source: 'test' });
    expect(st.getState().phase).toBe('challenge');
    expect(st.getState().inspected).toHaveLength(EXPLORE_TARGET);
    solve(st);
    const s = st.getState();
    expect(s.status).toBe('complete');
    const r = tourMission.result(s);
    expect(r.evidence).toBe('simulated');
    expect(r.illustrativeModel).toBe(false);
    expect(r.stats.find((x) => x.label.en === 'Found on first try')?.value.en).toBe(`${CHALLENGES.length} / ${CHALLENGES.length}`);
    expect(r.score).toBe(1);
    expect(completionEvent(tourMission, r, { immersive: true, touch: false })).toMatchObject({
      activityId: 'esp-meet-the-machine-xr',
      lessonId: 'esp-meet-the-machine',
      mode: 'xr',
      evidence: 'simulated',
      outcome: 'completed',
    });
  });

  it('wrong picks are gentle, specific, counted — and never dead-end', () => {
    const st = mk();
    for (const id of INSPECTABLE.slice(0, EXPLORE_TARGET)) st.dispatch({ type: 'LOCATE', target: id, source: 'test' });
    expect(currentChallenge(st.getState())?.id).toBe('find-grinder');
    st.dispatch({ type: 'LOCATE', target: 'scale', source: 'test' });
    const fb = st.getState().feedback!;
    expect(fb.kind).toBe('mistake');
    expect(fb.text.en).toMatch(/That is the Scale/);
    expect(fb.text.en).toMatch(/bean hopper/); // the hint tells them how to find the grinder
    st.dispatch({ type: 'LOCATE', target: 'grinder', source: 'test' });
    expect(currentChallenge(st.getState())?.id).toBe('grab-tamper');
    st.dispatch({ type: 'GRAB', item: 'cup', hand: 'pointer', source: 'test' });
    expect(st.getState().feedback?.code).toBe('tour-wrong-grab');
    st.dispatch({ type: 'RELEASE', hand: 'pointer', source: 'test' });
    st.dispatch({ type: 'GRAB', item: 'tamper', hand: 'pointer', source: 'test' });
    expect(currentChallenge(st.getState())?.id).toBe('pf-to-fork');
    st.dispatch({ type: 'RELEASE', hand: 'pointer', source: 'test' });
    st.dispatch({ type: 'GRAB', item: 'portafilter', hand: 'pointer', source: 'test' });
    st.dispatch({ type: 'RELEASE', hand: 'pointer', zone: 'knock-box', distanceM: 0, source: 'test' });
    expect(st.getState().feedback?.code).toBe('tour-wrong-place');
    solve(st);
    const r = tourMission.result(st.getState());
    expect(r.mistakes).toBe(3);
    expect(r.stats.find((x) => x.label.en === 'Found on first try')?.value.en).toBe(`3 / ${CHALLENGES.length}`);
  });

  it('tiers change wording and cues: independent asks by function, cues only on hint', () => {
    const g = mk('guided');
    const i = mk('independent');
    for (const st of [g, i]) for (const id of INSPECTABLE.slice(0, EXPLORE_TARGET)) st.dispatch({ type: 'LOCATE', target: id, source: 'test' });
    const c = currentChallenge(g.getState())!;
    expect(tourMission.hud(g.getState()).stepTitle).toEqual(c.named);
    expect(tourMission.hud(i.getState()).stepTitle).toEqual(c.functional);
    expect(promptOf(c, 'independent').en).toMatch(/grinds beans/);
    expect(tourView(g.getState()).cues.cues).toBe(true);
    expect(tourView(g.getState()).cues.toolTags).toBe(true);
    expect(tourView(i.getState()).cues.cues).toBe(false);
    expect(tourView(i.getState()).cues.toolTags).toBe(false);
    i.dispatch({ type: 'REQUEST_HINT', source: 'test' });
    expect(tourView(i.getState()).cues.cues).toBe(true);
    expect(i.getState().feedback?.text.en).toMatch(/Point at the grinder/);
    expect(tourCue(i.getState())).toEqual({ kind: 'look', part: 'grinder' });
  });

  it('snap tolerance follows the tier', () => {
    for (const [tier, snaps] of [
      ['guided', true],
      ['independent', false],
    ] as const) {
      const st = mk(tier);
      st.dispatch({ type: 'GRAB', item: 'cup', hand: 'pointer', source: 'test' });
      st.dispatch({ type: 'RELEASE', hand: 'pointer', zone: 'scale', distanceM: 0.08, source: 'test' });
      expect(st.getState().items.cup.zone === 'scale').toBe(snaps);
    }
  });

  it('reset, and the action list alone can finish it (no spatial claim)', () => {
    const st = mk();
    st.dispatch({ type: 'LOCATE', target: 'grinder', source: 'test' });
    st.dispatch({ type: 'RESET' });
    expect(st.getState().inspected).toEqual([]);
    expect(st.getState().metrics.resets).toBe(1);
    for (let n = 0; n < 200 && st.getState().status !== 'complete'; n++) {
      const s = st.getState();
      const list = tourMission.actions(s);
      const rec = list.find((a) => a.recommended);
      const pick = rec ?? (s.phase === 'explore' ? list.find((a) => a.id.startsWith('inspect-') && !s.inspected.includes(a.id.slice(8) as never)) : list.find((a) => a.id.startsWith('putback')));
      pick!.actions.forEach((a) => st.dispatch(a));
    }
    const r = tourMission.result(st.getState());
    expect(r.completed).toBe(true);
    expect(r.spatialPractice).toBe(false);
    expect(r.practiced.map((x) => x.en).join()).toMatch(/action list/);
  });

  it('fuzz: from 200 random sequences the tour can always be completed', () => {
    const A: MissionAction[] = [
      ...INSPECTABLE.map((id): MissionAction => ({ type: 'LOCATE', target: id })),
      { type: 'GRAB', item: 'portafilter', hand: 'pointer' },
      { type: 'GRAB', item: 'cup', hand: 'pointer' },
      { type: 'GRAB', item: 'tamper', hand: 'left' },
      { type: 'RELEASE', hand: 'pointer' },
      { type: 'RELEASE', hand: 'left' },
      ...(['scale', 'grinder-fork', 'knock-box', 'group-head', 'serve'] as const).map((zone): MissionAction => ({ type: 'RELEASE', hand: 'pointer', zone, distanceM: 0 })),
      { type: 'PRESS', button: 'brew' },
      { type: 'TICK', dtSec: 0.25 },
      { type: 'REQUEST_HINT' },
      { type: 'PAUSE' },
      { type: 'RESUME' },
      { type: 'SET_GUIDANCE', guidance: 'independent' },
    ];
    for (let seed = 1; seed <= 200; seed++) {
      const rnd = mulberry32(seed);
      const st = mk();
      const n = Math.floor(rnd() * 80);
      for (let k = 0; k < n; k++) st.dispatch(A[Math.floor(rnd() * A.length)]!);
      st.dispatch({ type: 'RELEASE', hand: 'left' });
      expect(() => solve(st), `seed ${seed}`).not.toThrow();
    }
  });
});

describe('station tour — action list recommendations stay fresh', () => {
  it('following only the recommended action completes the guided tour (no stale or missing suggestion)', () => {
    const st = mk('guided');
    let picks = 0;
    for (let n = 0; n < 100 && st.getState().status !== 'complete'; n++) {
      const rec = tourMission.actions(st.getState()).find((a) => a.recommended);
      expect(rec, `step ${tourMission.hud(st.getState()).stepIndex}`).toBeDefined();
      rec!.actions.forEach((a) => st.dispatch(a));
      picks++;
    }
    expect(st.getState().status).toBe('complete');
    expect(st.getState().metrics.mistakes).toHaveLength(0);
    expect(picks).toBeLessThan(20);
  });

  it('holding the wrong item recommends putting it back', () => {
    const st = mk('guided');
    for (const id of INSPECTABLE.slice(0, EXPLORE_TARGET)) st.dispatch({ type: 'LOCATE', target: id, source: 'test' });
    st.dispatch({ type: 'LOCATE', target: 'grinder', source: 'test' }); // → grab the tamper
    st.dispatch({ type: 'GRAB', item: 'tamper', hand: 'pointer', source: 'test' }); // → put the portafilter on the fork
    expect(tourMission.actions(st.getState()).find((a) => a.recommended)?.id).toBe('putback-tamper');
  });

  it('the actions key changes whenever the recommendation would', () => {
    const st = mk('guided');
    const k0 = tourMission.actionsKey(st.getState());
    st.dispatch({ type: 'LOCATE', target: 'espresso-machine', source: 'test' });
    expect(tourMission.actionsKey(st.getState())).not.toBe(k0);
  });
});
