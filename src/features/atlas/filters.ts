/**
 * Drink Atlas pure helpers: gear readiness (from the learner's SELF-REPORTED equipment) and filters.
 */
import type { DrinkCategory, DrinkRecipe } from '../../domain/contracts';

export const CATEGORY_ORDER: readonly DrinkCategory[] = ['espresso', 'espresso-milk', 'pourover', 'immersion', 'pressure', 'cold', 'regional'];

/**
 * Everyday items most kitchens have (or the phone covers, like a timer). Listed on the drink,
 * but they never make a drink "need new gear".
 */
export const HOUSEHOLD_BASICS: ReadonlySet<string> = new Set([
  'cup',
  'mug',
  'espresso-cup',
  'towel',
  'timer',
  'saucepan',
  'fine-strainer',
  'shaker',
  'cleaning-brush',
  'knock-box',
  'distribution-tool',
  'thermometer',
  'water-filter',
  'tds-meter',
  'cupping-spoon',
]);

/**
 * Owned item(s) that can stand in for a required one. Portafilter and basket ship with espresso
 * machines; a gooseneck kettle covers "kettle"; any grinder covers "grinder".
 */
export const COVERED_BY: Readonly<Record<string, readonly string[]>> = {
  portafilter: ['espresso-machine'],
  basket: ['espresso-machine', 'portafilter'],
  kettle: ['gooseneck-kettle'],
  grinder: ['burr-grinder-hand'],
  'burr-grinder-hand': ['grinder'],
  'milk-frother': ['espresso-machine'],
  carafe: ['chemex'],
};

export type GearState = 'owned' | 'covered' | 'basic' | 'missing';

export interface GearItemStatus {
  id: string;
  state: GearState;
  /** For 'covered': which owned item covers it. */
  coveredBy?: string;
}

export interface GearStatus {
  items: GearItemStatus[];
  missing: string[];
  canMake: boolean;
}

export function gearStatus(equipment: readonly string[], owned: readonly string[]): GearStatus {
  const own = new Set(owned);
  const items: GearItemStatus[] = [];
  for (const id of new Set(equipment)) {
    if (own.has(id)) {
      items.push({ id, state: 'owned' });
      continue;
    }
    const cover = (COVERED_BY[id] ?? []).find((c) => own.has(c));
    if (cover) {
      items.push({ id, state: 'covered', coveredBy: cover });
      continue;
    }
    items.push({ id, state: HOUSEHOLD_BASICS.has(id) ? 'basic' : 'missing' });
  }
  const missing = items.filter((i) => i.state === 'missing').map((i) => i.id);
  return { items, missing, canMake: missing.length === 0 };
}

export type GearFilter = 'all' | 'can-make' | 'need-gear';
export type DifficultyFilter = 'all' | 1 | 2 | 3;

export interface AtlasFilters {
  category: DrinkCategory | 'all';
  gear: GearFilter;
  difficulty: DifficultyFilter;
  /** Free text matched against both languages' name/tagline/origin. */
  query: string;
}

export const DEFAULT_FILTERS: AtlasFilters = { category: 'all', gear: 'all', difficulty: 'all', query: '' };

export function filterDrinks(drinks: readonly DrinkRecipe[], f: AtlasFilters, owned: readonly string[]): DrinkRecipe[] {
  const q = f.query.trim().toLowerCase();
  return drinks.filter((d) => {
    if (f.category !== 'all' && d.category !== f.category) return false;
    if (f.difficulty !== 'all' && d.difficulty !== f.difficulty) return false;
    if (f.gear !== 'all') {
      const can = gearStatus(d.equipment, owned).canMake;
      if (f.gear === 'can-make' && !can) return false;
      if (f.gear === 'need-gear' && can) return false;
    }
    if (q) {
      const hay = [d.id, d.name.zh, d.name.en, d.tagline.zh, d.tagline.en, d.origin.zh, d.origin.en].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/** Group (already filtered) drinks by category in the canonical order, skipping empty groups. */
export function groupByCategory(drinks: readonly DrinkRecipe[]): Array<{ category: DrinkCategory; drinks: DrinkRecipe[] }> {
  return CATEGORY_ORDER.map((category) => ({ category, drinks: drinks.filter((d) => d.category === category) })).filter(
    (g) => g.drinks.length > 0,
  );
}

/** Culture text that reports a legend, story or disputed claim (the content flags these in words). */
export function mentionsLegend(text: { zh: string; en: string }): boolean {
  return /legend|story (?:says|goes)|said to|disputed|apocryphal|myth|folk ?tale|uncertain|unverified/i.test(text.en) || /传说|据说|相传|有争议|说法不一|未经证实|故事/.test(text.zh);
}

/** Deterministic "drink of the day" index (no randomness → stable for tests and reloads). */
export function featuredIndex(count: number, date: Date): number {
  if (count <= 0) return 0;
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const day = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - start) / 86_400_000);
  return ((day % count) + count) % count;
}
