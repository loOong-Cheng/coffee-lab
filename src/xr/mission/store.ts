/**
 * Tiny framework-free store around the pure reducer. Adapters (Babylon scene,
 * React overlay, tests) share one instance; effects are delivered once per
 * dispatch so sounds/animations never depend on diffing.
 */
import type { Guidance } from '../../domain/contracts';
import type { MissionAction, MissionEffect, MissionState } from './types';
import { createInitialState, missionReducer } from './reducer';

export type EffectListener = (effects: readonly MissionEffect[], state: MissionState, action: MissionAction) => void;

export interface MissionStore {
  getState(): MissionState;
  dispatch(action: MissionAction): MissionState;
  /** Called after every state change. Returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;
  onEffects(listener: EffectListener): () => void;
}

export function createMissionStore(guidance: Guidance = 'guided', initial?: MissionState): MissionStore {
  let state = initial ?? createInitialState(guidance);
  const listeners = new Set<() => void>();
  const effectListeners = new Set<EffectListener>();
  return {
    getState: () => state,
    dispatch(action) {
      const next = missionReducer(state, action);
      if (next === state) return state;
      state = next;
      if (next.effects.length > 0) for (const l of [...effectListeners]) l(next.effects, next, action);
      for (const l of [...listeners]) l();
      return state;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    onEffects(listener) {
      effectListeners.add(listener);
      return () => effectListeners.delete(listener);
    },
  };
}
