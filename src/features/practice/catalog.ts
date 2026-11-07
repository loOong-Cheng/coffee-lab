/**
 * Content adapter shared by the practice, journal and atlas features (one place that touches
 * src/content, so a content shape change is fixed once).
 */
import { activities, drinks, getActivity, getDrink, getEquipment, getLesson } from '../../content';
import type { BrewLogEntry, DrinkRecipe, GuidedPracticeActivity, LocalizedText } from '../../domain/contracts';
import { brewKindForActivity, brewKindForDrink, isGuidedPractice, parsePracticeId, resolvePracticePlan, type BrewKind, type PlanResolution } from './plan';

export const DRINK_IDS: ReadonlySet<string> = new Set(drinks.map((d) => d.id));

export const PLAN_SOURCES = { getActivity, getDrink, drinkIds: DRINK_IDS };

export function resolvePlan(id: string): PlanResolution {
  return resolvePracticePlan(id, PLAN_SOURCES);
}

export const guidedPractices: GuidedPracticeActivity[] = activities.filter(isGuidedPractice);

export function equipmentName(id: string): LocalizedText {
  return getEquipment(id)?.name ?? { zh: id, en: id };
}

export function lessonTitle(id: string): LocalizedText | null {
  return getLesson(id)?.title ?? null;
}

/** Human label for a journal entry's drink: atlas name → practice title → the raw id. */
export function entryDrinkLabel(e: Pick<BrewLogEntry, 'drinkId' | 'activityId'>): LocalizedText {
  const d = getDrink(e.drinkId);
  if (d) return d.name;
  if (e.activityId) {
    const parsed = parsePracticeId(e.activityId);
    if (parsed.kind === 'drink') {
      const dd = getDrink(parsed.drinkId);
      if (dd) return dd.name;
    } else {
      const a = getActivity(parsed.activityId);
      if (a) return a.title;
    }
  }
  const a = getActivity(e.drinkId);
  if (a) return a.title;
  return { zh: e.drinkId, en: e.drinkId };
}

export interface EntryContext {
  brewKind: BrewKind;
  targetTimeSec?: [number, number];
  drink?: DrinkRecipe;
  activity?: GuidedPracticeActivity;
}

/** Ratio convention + any authored target time for an entry (activity first, then drink). */
export function entryContext(e: Pick<BrewLogEntry, 'drinkId' | 'activityId'>): EntryContext {
  let activity: GuidedPracticeActivity | undefined;
  let drink: DrinkRecipe | undefined = getDrink(e.drinkId);
  if (e.activityId) {
    const parsed = parsePracticeId(e.activityId);
    if (parsed.kind === 'activity') {
      const a = getActivity(parsed.activityId);
      if (isGuidedPractice(a)) activity = a;
    } else drink = drink ?? getDrink(parsed.drinkId);
  }
  if (activity) return { brewKind: brewKindForActivity(activity), targetTimeSec: activity.recipe?.targetTimeSec, activity, drink };
  if (drink) return { brewKind: brewKindForDrink(drink), drink };
  return { brewKind: 'none' };
}

export { drinks, getDrink };
