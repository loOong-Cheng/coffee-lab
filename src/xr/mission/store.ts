/**
 * Espresso mission store — the generic framework store around the pure reducer.
 * Adapters (Babylon scene, React overlay, tests) share one instance; effects are
 * delivered once per dispatch so sounds/animations never depend on diffing.
 */
import type { Guidance } from '../../domain/contracts';
import type { MissionAction, MissionState } from './types';
import { createInitialState, missionReducer } from './reducer';
import { createStore, type Store } from './core';

export type MissionStore = Store<MissionState, MissionAction>;

export function createMissionStore(guidance: Guidance = 'guided', initial?: MissionState): MissionStore {
  return createStore(missionReducer, initial ?? createInitialState(guidance));
}
