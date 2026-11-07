/**
 * Headless helpers shared by the mission tests: a cue-following "solver" that
 * proves guidance always leads to completion (no dead ends) from any state.
 */
import type { MissionAction, MissionState } from './types';
import type { MissionStore } from './store';
import { RECIPE } from './extraction';
import { heldItem, stepCue } from './reducer';

export function ticks(store: MissionStore, seconds: number, dt = 0.1): void {
  const n = Math.round(seconds / dt);
  for (let i = 0; i < n; i++) store.dispatch({ type: 'TICK', dtSec: dt });
}

/** The single next action a perfect learner would take, derived only from the public cue. */
export function nextSolverAction(s: MissionState, stopAtG = RECIPE.targetYieldG - 0.8): MissionAction | 'tick' | null {
  if (s.status === 'paused') return { type: 'RESUME' };
  if (s.status === 'complete') return null;
  const cue = stepCue(s);
  if (!cue) return null;
  const hand = 'pointer' as const;
  const held = heldItem(s, hand);
  switch (cue.kind) {
    case 'wait':
      return 'tick';
    case 'look':
      return { type: 'LOCATE', target: cue.part, source: 'test' };
    case 'grab':
      if (held && held !== cue.item) return { type: 'RELEASE', hand, source: 'test' };
      return { type: 'GRAB', item: cue.item, hand, source: 'test' };
    case 'place':
      if (held !== cue.item) {
        if (held) return { type: 'RELEASE', hand, source: 'test' };
        return { type: 'GRAB', item: cue.item, hand, source: 'test' };
      }
      return { type: 'RELEASE', hand, zone: cue.zone, distanceM: 0, angleDeg: 0, tiltDeg: 0, source: 'test' };
    case 'press':
      if (cue.button === 'brew' && s.shot.status === 'running' && s.shot.yieldG < stopAtG) return 'tick';
      // Hands must be free-ish for some steps; drop anything irrelevant first.
      if (held && cue.button !== 'brew') return { type: 'RELEASE', hand, source: 'test' };
      return { type: 'PRESS', button: cue.button, source: 'test' };
  }
}

/** Follow cues until complete. Returns number of dispatched learner actions. Throws if stuck. */
export function solve(store: MissionStore, maxSteps = 2000): number {
  let actions = 0;
  for (let i = 0; i < maxSteps; i++) {
    const s = store.getState();
    if (s.status === 'complete') return actions;
    const next = nextSolverAction(s);
    if (next === null) throw new Error(`solver: no action at step ${String(stepCue(s)?.kind)}`);
    if (next === 'tick') store.dispatch({ type: 'TICK', dtSec: 0.1 });
    else {
      store.dispatch(next);
      actions++;
    }
  }
  throw new Error('solver: did not complete within maxSteps');
}

/** Small deterministic PRNG for fuzz tests. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
