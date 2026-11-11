/** Coffee Brands pure helpers: kind filter, bilingual name search, grouping and drink → brand reverse lookup. */
import type { Brand, BrandKind } from '../../content';

export const KIND_ORDER: readonly BrandKind[] = ['cafe-chain', 'roaster', 'equipment'];

export type KindFilter = BrandKind | 'all';

export const isBrandKind = (v: string | null | undefined): v is BrandKind => !!v && (KIND_ORDER as readonly string[]).includes(v);

export interface BrandFilters {
  kind: KindFilter;
  /** Matched (case-insensitive) against the zh and en names and the id. */
  query: string;
}

export function filterBrands(list: readonly Brand[], f: BrandFilters): Brand[] {
  const q = f.query.trim().toLowerCase();
  return list.filter((b) => {
    if (f.kind !== 'all' && b.kind !== f.kind) return false;
    if (q && ![b.id, b.name.zh, b.name.en].join(' ').toLowerCase().includes(q)) return false;
    return true;
  });
}

/** Group (already filtered) brands by kind in canonical order, skipping empty groups. */
export function groupByKind(list: readonly Brand[]): Array<{ kind: BrandKind; brands: Brand[] }> {
  return KIND_ORDER.map((kind) => ({ kind, brands: list.filter((b) => b.kind === kind) })).filter((g) => g.brands.length > 0);
}

/** Brands whose `relatedDrinkIds` include this drink (content order). */
export function brandsForDrink(list: readonly Brand[], drinkId: string): Brand[] {
  return list.filter((b) => b.relatedDrinkIds.includes(drinkId));
}
