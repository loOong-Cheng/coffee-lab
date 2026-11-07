/**
 * Content aggregate (CONTRACTS.md §2). Pure data + lookups; no UI.
 * Core tracks: literacy, espresso, pour-over. Optional tracks: explore, culture.
 */
import type { Activity, DrinkRecipe, Equipment, Lesson, SourceRef, Track, TrackId } from '../domain/contracts';

import * as literacy from './tracks/literacy';
import * as espresso from './tracks/espresso';
import * as pourover from './tracks/pourover';
import * as explore from './tracks/explore';
import * as culture from './tracks/culture';
import { sources as coreSources } from './sources';
import { sources as atlasSources } from './sources.atlas';
import { equipment as equipmentCatalog } from './equipment';
import { drinks as drinkCatalog } from './drinks';

const modules = [literacy, espresso, pourover, explore, culture];

/** Core tracks are the beginner path; they must never depend on optional tracks. */
export const CORE_TRACK_IDS: readonly TrackId[] = ['literacy', 'espresso', 'pourover'];

export const tracks: Track[] = modules.map((m) => m.track).sort((a, b) => a.order - b.order);
export const lessons: Lesson[] = modules.flatMap((m) => m.lessons);
export const activities: Activity[] = modules.flatMap((m) => m.activities);
export const sources: SourceRef[] = [...coreSources, ...atlasSources];
export const equipment: Equipment[] = [...equipmentCatalog];
export const drinks: DrinkRecipe[] = [...drinkCatalog];

const byId = <T extends { id: string }>(items: T[]): Map<string, T> => new Map(items.map((x) => [x.id, x]));

const trackIndex = byId(tracks);
const lessonIndex = byId(lessons);
const activityIndex = byId(activities);
const sourceIndex = byId(sources);
const equipmentIndex = byId(equipment);
const drinkIndex = byId(drinks);

export const getTrack = (id: string): Track | undefined => trackIndex.get(id);
export const getLesson = (id: string): Lesson | undefined => lessonIndex.get(id);
export const getActivity = (id: string): Activity | undefined => activityIndex.get(id);
export const getSource = (id: string): SourceRef | undefined => sourceIndex.get(id);
export const getEquipment = (id: string): Equipment | undefined => equipmentIndex.get(id);
export const getDrink = (id: string): DrinkRecipe | undefined => drinkIndex.get(id);

/** Lessons of a track in the track's declared order. */
export function getTrackLessons(trackId: string): Lesson[] {
  const t = trackIndex.get(trackId);
  if (!t) return [];
  return t.lessonIds.map((id) => lessonIndex.get(id)).filter((l): l is Lesson => l !== undefined);
}

/** Activities of a lesson in the lesson's declared order. */
export function getLessonActivities(lessonId: string): Activity[] {
  const l = lessonIndex.get(lessonId);
  if (!l) return [];
  return l.activityIds.map((id) => activityIndex.get(id)).filter((a): a is Activity => a !== undefined);
}

export const isCoreTrack = (trackId: string): boolean => (CORE_TRACK_IDS as readonly string[]).includes(trackId);
