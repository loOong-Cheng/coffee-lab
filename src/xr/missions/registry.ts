/** XR-lab mission registry + deep-link parsing (#/xr?mission=<id>). */
import type { AnyMission, MissionId } from '../mission/core';
import { espressoMission } from './espresso';
import { tourMission } from './tour/def';
import { pouroverMission } from './pourover/def';

export const MISSIONS: readonly AnyMission[] = [
  tourMission as unknown as AnyMission,
  espressoMission as unknown as AnyMission,
  pouroverMission as unknown as AnyMission,
];

export const MISSION_IDS: readonly MissionId[] = MISSIONS.map((m) => m.id);

export function getMission(id: string | null | undefined): AnyMission | null {
  return MISSIONS.find((m) => m.id === id) ?? null;
}

/** Parse `?mission=<id>` from a search string (with or without the leading "?"). Unknown ids → null. */
export function parseMissionParam(search: string | null | undefined): MissionId | null {
  if (!search) return null;
  try {
    const v = new URLSearchParams(search.startsWith('?') ? search : `?${search}`).get('mission');
    return v && (MISSION_IDS as readonly string[]).includes(v) ? (v as MissionId) : null;
  } catch {
    return null;
  }
}

export function missionHref(id: MissionId): string {
  return `/xr?mission=${encodeURIComponent(id)}`;
}
