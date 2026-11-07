import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Activity, DrinkRecipe, Equipment } from '../../domain/contracts';
import { ILLUSTRATION_ALIASES } from './aliases';
import { ILLUSTRATION_KEYS, Illustration, normalizeIllustrationKey, resolveIllustration } from './Illustration';

/**
 * Load whatever content modules exist right now. Tracks are authored in parallel, so a
 * missing file (e.g. tracks/culture.ts before the atlas worker lands it) must not break this test.
 */
const trackModules = import.meta.glob<{ activities?: Activity[] }>('../../content/tracks/*.ts', { eager: true });
const drinkModules = import.meta.glob<{ drinks?: DrinkRecipe[] }>('../../content/drinks.ts', { eager: true });
const equipmentModules = import.meta.glob<{ equipment?: Equipment[] }>('../../content/equipment.ts', { eager: true });

function contentIllustrationKeys(): Map<string, string> {
  const keys = new Map<string, string>(); // key -> where it is used
  for (const [file, mod] of Object.entries(trackModules)) {
    for (const a of mod.activities ?? []) {
      if (a.kind === 'explain') a.cards.forEach((c) => c.illustration && keys.set(c.illustration, `${file} ${a.id}`));
      if (a.kind === 'guided-practice') a.steps.forEach((s) => s.illustration && keys.set(s.illustration, `${file} ${a.id}`));
    }
  }
  return keys;
}

describe('Illustration coverage', () => {
  it('every illustration key used in content resolves to a drawn scene (not the fallback)', () => {
    const keys = contentIllustrationKeys();
    expect(keys.size).toBeGreaterThan(0);
    const missing = [...keys].filter(([k]) => resolveIllustration(k) === null).map(([k, where]) => `${k} (${where})`);
    expect(missing).toEqual([]);
  });

  it('drink ids, drink categories and equipment ids resolve to drawn scenes (atlas pages)', () => {
    const drinks = Object.values(drinkModules).flatMap((m) => m.drinks ?? []);
    const equipment = Object.values(equipmentModules).flatMap((m) => m.equipment ?? []);
    const ids = [...drinks.map((d) => d.id), ...drinks.map((d) => d.category), ...equipment.map((e) => e.id)];
    const missing = ids.filter((id) => resolveIllustration(id) === null);
    expect(missing).toEqual([]);
  });

  it('every alias targets a real scene', () => {
    const broken = Object.entries(ILLUSTRATION_ALIASES).filter(([, target]) => !ILLUSTRATION_KEYS.includes(target));
    expect(broken).toEqual([]);
  });

  it('hazard keys render clearly-marked safety scenes', () => {
    for (const k of ['hazard-heat', 'hazard-steam', 'hazard-grinder', 'safety-unplug']) {
      expect(resolveIllustration(k)).toMatch(/safety$/);
    }
  });

  it('normalises keys and falls back gracefully for unknown keys', () => {
    expect(normalizeIllustrationKey('  Roast_Levels ')).toBe('roast-levels');
    expect(resolveIllustration('Roast Levels')).toBe('roast-levels');
    const { container } = render(<Illustration name="definitely-not-a-key" />);
    const el = container.querySelector('[data-illustration]');
    expect(el?.getAttribute('data-illustration')).toBe('fallback');
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('renders every drawn scene without throwing; decorative unless alt given', () => {
    for (const key of ILLUSTRATION_KEYS) {
      const { container, unmount } = render(<Illustration name={key} />);
      const svg = container.querySelector('svg');
      expect(svg, key).toBeTruthy();
      expect(svg?.getAttribute('aria-hidden')).toBe('true');
      unmount();
    }
    const { getByRole } = render(<Illustration name="bloom" alt="Coffee bed blooming" />);
    expect(getByRole('img', { name: 'Coffee bed blooming' })).toBeInTheDocument();
  });
});
