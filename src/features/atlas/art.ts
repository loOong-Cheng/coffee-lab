import type { DrinkCategory, DrinkRecipe } from '../../domain/contracts';
import { resolveIllustration } from '../../ui';

/** Brewer-ish equipment that makes a good picture, in preference order. */
const BREWER_PRIORITY = ['siphon', 'chemex', 'moka-pot', 'french-press', 'aeropress', 'phin', 'ibrik', 'jebena', 'dallah', 'cold-brew-jar', 'dripper'];

const CATEGORY_ART: Record<DrinkCategory, string> = {
  espresso: 'crema',
  'espresso-milk': 'latte',
  pourover: 'pourover',
  immersion: 'french-press',
  pressure: 'moka',
  cold: 'cold-brew',
  regional: 'world-map',
};

/** Illustration key for a drink: its own id → its signature brewer → its category scene. */
export function drinkIllustration(d: Pick<DrinkRecipe, 'id' | 'category' | 'equipment'>): string {
  const own = resolveIllustration(d.id);
  if (own) return own;
  for (const id of BREWER_PRIORITY) {
    if (d.equipment.includes(id)) {
      const k = resolveIllustration(id);
      if (k) return k;
    }
  }
  if (d.category === 'espresso-milk' || d.category === 'espresso') return CATEGORY_ART[d.category];
  if (d.equipment.includes('milk-pitcher') || d.equipment.includes('milk-frother')) return 'latte';
  return CATEGORY_ART[d.category];
}
