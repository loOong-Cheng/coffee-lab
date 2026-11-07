import { describe, expect, it } from 'vitest';
import type { DrinkRecipe } from '../../domain/contracts';
import { DEFAULT_FILTERS, featuredIndex, filterDrinks, gearStatus, groupByCategory, mentionsLegend } from './filters';

const L = (zh: string, en: string) => ({ zh, en });
const drink = (id: string, x: Partial<DrinkRecipe>): DrinkRecipe => ({
  id,
  category: 'espresso',
  name: L(id, id),
  tagline: L('', ''),
  origin: L('', ''),
  cultureNote: L('', ''),
  equipment: [],
  recipe: { summary: L('', '') },
  steps: [],
  difficulty: 1,
  safetyNotes: [],
  relatedLessonIds: [],
  sources: [],
  confidence: 'rule-of-thumb',
  ...x,
});

const espresso = drink('espresso-shot', { equipment: ['espresso-machine', 'grinder', 'portafilter', 'basket', 'tamper', 'scale', 'espresso-cup', 'towel'], difficulty: 2 });
const latte = drink('caffe-latte', { category: 'espresso-milk', equipment: ['espresso-machine', 'grinder', 'milk-pitcher', 'cup'], difficulty: 3 });
const v60 = drink('pourover-cone', { category: 'pourover', equipment: ['dripper', 'paper-filter', 'gooseneck-kettle', 'grinder', 'scale', 'mug'], difficulty: 2, name: L('手冲', 'Pour-over') });
const moka = drink('moka-pot-coffee', { category: 'pressure', equipment: ['moka-pot', 'burr-grinder-hand', 'saucepan'], difficulty: 1, origin: L('意大利', 'Italy') });
const ALL = [espresso, latte, v60, moka];

// The user's real setup (decision U3): espresso machine + grinder, pour-over kit.
const OWNED = ['espresso-machine', 'grinder', 'tamper', 'scale', 'dripper', 'paper-filter', 'gooseneck-kettle'];

describe('gearStatus', () => {
  it('marks owned, covered (portafilter ships with the machine), household basics and missing', () => {
    const s = gearStatus(espresso.equipment, OWNED);
    const st = Object.fromEntries(s.items.map((i) => [i.id, i.state]));
    expect(st).toMatchObject({
      'espresso-machine': 'owned',
      portafilter: 'covered',
      basket: 'covered',
      'espresso-cup': 'basic',
      towel: 'basic',
    });
    expect(s.items.find((i) => i.id === 'portafilter')?.coveredBy).toBe('espresso-machine');
    expect(s.canMake).toBe(true);
  });
  it('lists real missing gear', () => {
    expect(gearStatus(latte.equipment, OWNED)).toMatchObject({ missing: ['milk-pitcher'], canMake: false });
    expect(gearStatus(moka.equipment, OWNED).missing).toEqual(['moka-pot']); // any grinder covers the hand grinder
    expect(gearStatus(espresso.equipment, []).canMake).toBe(false);
  });
  it('dedupes equipment ids', () => {
    expect(gearStatus(['scale', 'scale'], []).items).toHaveLength(1);
  });
});

describe('filterDrinks', () => {
  it('returns everything with default filters', () => {
    expect(filterDrinks(ALL, DEFAULT_FILTERS, OWNED)).toHaveLength(4);
  });
  it('filters by "can make with my gear" and "need new gear"', () => {
    expect(filterDrinks(ALL, { ...DEFAULT_FILTERS, gear: 'can-make' }, OWNED).map((d) => d.id)).toEqual(['espresso-shot', 'pourover-cone']);
    expect(filterDrinks(ALL, { ...DEFAULT_FILTERS, gear: 'need-gear' }, OWNED).map((d) => d.id)).toEqual(['caffe-latte', 'moka-pot-coffee']);
  });
  it('filters by category, difficulty and bilingual text query', () => {
    expect(filterDrinks(ALL, { ...DEFAULT_FILTERS, category: 'pourover' }, OWNED).map((d) => d.id)).toEqual(['pourover-cone']);
    expect(filterDrinks(ALL, { ...DEFAULT_FILTERS, difficulty: 3 }, OWNED).map((d) => d.id)).toEqual(['caffe-latte']);
    expect(filterDrinks(ALL, { ...DEFAULT_FILTERS, query: '手冲' }, OWNED).map((d) => d.id)).toEqual(['pourover-cone']);
    expect(filterDrinks(ALL, { ...DEFAULT_FILTERS, query: 'italy' }, OWNED).map((d) => d.id)).toEqual(['moka-pot-coffee']);
    expect(filterDrinks(ALL, { ...DEFAULT_FILTERS, query: 'zzz' }, OWNED)).toEqual([]);
  });
  it('combines filters', () => {
    expect(filterDrinks(ALL, { category: 'espresso', gear: 'can-make', difficulty: 2, query: '' }, OWNED).map((d) => d.id)).toEqual(['espresso-shot']);
  });
});

describe('groupByCategory / legend detection / featured', () => {
  it('groups in canonical order, skipping empty categories', () => {
    expect(groupByCategory([moka, espresso, v60]).map((g) => g.category)).toEqual(['espresso', 'pourover', 'pressure']);
  });
  it('detects legend / disputed wording in either language', () => {
    expect(mentionsLegend(L('', 'The story goes that a goat herder…'))).toBe(true);
    expect(mentionsLegend(L('据说是……', ''))).toBe(true);
    expect(mentionsLegend(L('起源有争议', ''))).toBe(true);
    expect(mentionsLegend(L('意大利', 'Italy, early 20th century'))).toBe(false);
  });
  it('picks a stable featured index per day', () => {
    const d = new Date(2026, 10, 7);
    expect(featuredIndex(29, d)).toBe(featuredIndex(29, new Date(2026, 10, 7, 23, 59)));
    expect(featuredIndex(29, d)).toBeGreaterThanOrEqual(0);
    expect(featuredIndex(29, d)).toBeLessThan(29);
    expect(featuredIndex(0, d)).toBe(0);
  });
});
