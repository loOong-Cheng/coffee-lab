/**
 * What the espresso-counter scene needs to render, independent of which
 * mission drives it (espresso workflow or the station tour). Pure.
 */
import type { Guidance, LocalizedText } from '../../domain/contracts';
import type { BasketState, HandId, InspectableId, ItemId, ItemState, MissionState, MissionStatus, ShotStatus } from './types';
import type { CueVisibility } from './tiers';
import { TOOL_INFO } from './content';
import { cuesFor, isAt, scaleReadingG, stepCue, type CueTarget } from './reducer';

export interface StationView {
  status: MissionStatus;
  guidance: Guidance;
  items: Record<ItemId, ItemState>;
  basket: BasketState;
  grinder: { running: boolean; elapsedSec: number };
  shot: { status: ShotStatus; elapsedSec: number; yieldG: number };
  flushRunning: boolean;
  knocked: boolean;
  scaleReadingG: number;
  cupOnScale: boolean;
  cue: CueTarget | null;
  cues: CueVisibility;
  /** Whether the tamper's "basket" target exists for a tamper held in `hand`. */
  basketOpen(hand: HandId): boolean;
}

export type InfoLookup = (id: InspectableId) => { name: LocalizedText; purpose: LocalizedText };

export function espressoView(s: MissionState): StationView {
  return {
    status: s.status,
    guidance: s.guidance,
    items: s.items,
    basket: s.basket,
    grinder: s.grinder,
    shot: s.shot,
    flushRunning: s.flush.running,
    knocked: s.flags.knocked,
    scaleReadingG: scaleReadingG(s),
    cupOnScale: isAt(s, 'cup', 'scale'),
    cue: s.status === 'playing' ? stepCue(s) : null,
    cues: cuesFor(s),
    basketOpen(hand) {
      const pf = s.items.portafilter;
      return s.basket === 'dosed' && (isAt(s, 'portafilter', 'tamp-mat') || (pf.heldBy !== null && pf.heldBy !== hand));
    },
  };
}

export const espressoInfo: InfoLookup = (id) => TOOL_INFO[id];
