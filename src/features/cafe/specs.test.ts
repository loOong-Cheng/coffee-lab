import { describe, expect, it } from 'vitest';
import { drinks, getDrink, getLesson } from '../../content';
import {
  CUPS,
  CUP_CAPACITY_ML,
  LEVEL_ORDER,
  ROUND_SIZE,
  buildVolumeMl,
  evaluate,
  type Component,
} from './model';
import { BUILD_SPECS, CUSTOMERS, ORDER_LINES, getBuildSpec, specsForLevel } from './specs';
import { COMPONENT_TEXT, LEVEL_TEXT, STATION_TEXT } from './strings';

const filled = (t: { zh: string; en: string }) => t.zh.trim().length > 0 && t.en.trim().length > 0;

describe('café build specs', () => {
  it('covers at least 12 drinks, each a real Drink Atlas id, no duplicates', () => {
    expect(BUILD_SPECS.length).toBeGreaterThanOrEqual(12);
    const ids = BUILD_SPECS.map((s) => s.drinkId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(getDrink(id), `drink ${id} exists in src/content/drinks.ts`).toBeDefined();
    expect(drinks.length).toBeGreaterThan(BUILD_SPECS.length - 1);
  });

  it('includes the espresso classics and a world-café set', () => {
    for (const id of ['espresso-shot', 'ristretto', 'lungo', 'americano', 'long-black', 'espresso-macchiato', 'cortado', 'flat-white', 'cappuccino', 'caffe-latte', 'mocha', 'affogato', 'iced-latte']) {
      expect(getBuildSpec(id), id).toBeDefined();
    }
    for (const id of ['vietnamese-phin', 'yuenyeung', 'cafe-de-olla', 'turkish-coffee']) expect(getBuildSpec(id)?.level).toBe('world');
  });

  it('every canonical build is judged perfect by its own spec and fits its cup', () => {
    for (const s of BUILD_SPECS) {
      const e = evaluate(s.canonical, s);
      expect(e.diffs, `${s.drinkId}: ${JSON.stringify(e.diffs)}`).toEqual([]);
      expect(e.score).toBe(1);
      expect(buildVolumeMl(s.canonical), s.drinkId).toBeLessThanOrEqual(CUP_CAPACITY_ML[s.canonical.cup]);
    }
  });

  it('drinks are structurally distinct: no canonical build passes another drink’s spec', () => {
    for (const a of BUILD_SPECS) {
      for (const b of BUILD_SPECS) {
        if (a === b) continue;
        expect(evaluate(a.canonical, b).correct, `${a.drinkId} canonical must not pass as ${b.drinkId}`).toBe(false);
      }
    }
  });

  it('accept lists are non-empty and only use known values', () => {
    for (const s of BUILD_SPECS) {
      expect(s.accept.method.length, s.drinkId).toBeGreaterThan(0);
      expect(s.accept.water.length).toBeGreaterThan(0);
      expect(s.accept.milk.length).toBeGreaterThan(0);
      expect(s.accept.ice.length).toBeGreaterThan(0);
      expect(s.accept.cup.length).toBeGreaterThan(0);
      for (const c of s.accept.cup) expect(CUPS).toContain(c);
      // espresso-based orders say how many shots / how long
      if (s.accept.method.includes('espresso')) {
        expect(s.accept.shots?.length, `${s.drinkId} shots`).toBeGreaterThan(0);
        expect(s.accept.shotStyle?.length, `${s.drinkId} style`).toBeGreaterThan(0);
      }
      if (s.accept.milk.some((m) => m !== 'none') && !s.accept.milk.includes('none')) {
        expect(s.accept.milkMl?.length, `${s.drinkId} milkMl`).toBeGreaterThan(0);
      }
    }
  });

  it('all teaching text is bilingual and non-empty', () => {
    for (const s of BUILD_SPECS) {
      expect(filled(s.keyPoint), s.drinkId).toBe(true);
      for (const [c, w] of Object.entries(s.why)) expect(filled(w!), `${s.drinkId}.${c}`).toBe(true);
      if (s.orderNote) expect(filled(s.orderNote)).toBe(true);
    }
    for (const c of Object.keys(COMPONENT_TEXT) as Component[]) expect(filled(COMPONENT_TEXT[c])).toBe(true);
    for (const st of Object.values(STATION_TEXT)) expect(filled(st.name) && filled(st.tip)).toBe(true);
    for (const c of CUSTOMERS) expect(filled(c.name)).toBe(true);
    for (const line of ORDER_LINES) expect(filled(line({ zh: '拿铁', en: 'latte' }))).toBe(true);
  });

  it('level composition: three playable levels with enough drinks for a full shift', () => {
    expect(LEVEL_ORDER).toEqual(['bar', 'milk', 'world']);
    for (const level of LEVEL_ORDER) {
      expect(filled(LEVEL_TEXT[level].title)).toBe(true);
      expect(specsForLevel(level).length, level).toBeGreaterThanOrEqual(ROUND_SIZE);
    }
    expect(specsForLevel('milk').every((s) => s.accept.milk.some((m) => m !== 'none'))).toBe(true);
    expect(specsForLevel('bar').every((s) => s.accept.method.includes('espresso'))).toBe(true);
  });

  it('related lessons used by the summary exist', () => {
    for (const s of BUILD_SPECS) {
      const d = getDrink(s.drinkId)!;
      expect(d.relatedLessonIds.some((id) => getLesson(id)), s.drinkId).toBe(true);
    }
  });
});
