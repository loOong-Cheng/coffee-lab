/** Pure helpers for onboarding (tested). */
import type { CapabilityProfile, DeviceKind, Equipment, EquipmentCategory, LearnerProfile, Mode } from '../../domain/contracts';

export const QUICK_PICKS = {
  espresso: ['espresso-machine', 'grinder', 'portafilter', 'basket', 'tamper'],
  pourover: ['dripper', 'paper-filter', 'gooseneck-kettle', 'carafe'],
} as const;

export const CATEGORY_ORDER: readonly EquipmentCategory[] = ['espresso', 'grinding', 'measuring', 'brewer', 'water', 'milk', 'serving', 'cleaning'];

export function deviceFromCaps(caps: CapabilityProfile | null): DeviceKind {
  return caps?.screen === 'mobile' ? 'phone' : caps?.screen === 'headset' ? 'headset' : 'pc';
}

export function suggestedModeFor(caps: CapabilityProfile | null, suggest: (c: CapabilityProfile) => Mode): Mode {
  return caps ? suggest(caps) : 'desktop';
}

/** The skip path: sensible beginner defaults (espresso goal, matches the user's stated interest). */
export function defaultProfile(caps: CapabilityProfile | null, mode: Mode, now = new Date()): LearnerProfile {
  return {
    goal: 'espresso',
    experience: 'new',
    devices: [deviceFromCaps(caps)],
    equipment: [],
    wishlist: [],
    preferredMode: mode,
    onboardedAt: now.toISOString(),
  };
}

/** Group catalog items by category in a friendly order; unknown categories go last. */
export function groupEquipment(items: readonly Equipment[]): Array<{ category: EquipmentCategory; items: Equipment[] }> {
  const groups = new Map<EquipmentCategory, Equipment[]>();
  for (const item of items) {
    const list = groups.get(item.category) ?? [];
    list.push(item);
    groups.set(item.category, list);
  }
  const rank = (c: EquipmentCategory) => {
    const i = CATEGORY_ORDER.indexOf(c);
    return i === -1 ? CATEGORY_ORDER.length : i;
  };
  return [...groups.entries()].sort((a, b) => rank(a[0]) - rank(b[0])).map(([category, list]) => ({ category, items: list }));
}

/** Toggle an id in a list (immutable). */
export function toggle(list: readonly string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

/** Add quick-pick ids that exist in the catalog; owning something removes it from the wishlist. */
export function applyQuickPick(
  owned: readonly string[],
  wishlist: readonly string[],
  ids: readonly string[],
  catalog: ReadonlySet<string>,
): { owned: string[]; wishlist: string[] } {
  const add = ids.filter((id) => catalog.has(id));
  const nextOwned = [...owned, ...add.filter((id) => !owned.includes(id))];
  return { owned: nextOwned, wishlist: wishlist.filter((id) => !nextOwned.includes(id)) };
}
