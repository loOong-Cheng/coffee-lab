import { describe, expect, it } from 'vitest';
import { places, timeline } from './culture-map';
import { drinks, getPlace, lessons, places as exportedPlaces, sources, timeline as exportedTimeline } from './index';

const drinkIds = new Set(drinks.map((d) => d.id));
const lessonIds = new Set(lessons.map((l) => l.id));
const sourceIds = new Set(sources.map((s) => s.id));
const placeIds = new Set(places.map((p) => p.id));
const CONFIDENCE = new Set(['verified', 'rule-of-thumb', 'illustrative-model']);

/** Recursively collect every {zh, en} object. */
function collectLocalized(node: unknown, path: string, out: Array<{ path: string; zh: unknown; en: unknown }>): void {
  if (Array.isArray(node)) {
    node.forEach((n, i) => collectLocalized(n, `${path}[${i}]`, out));
  } else if (node && typeof node === 'object') {
    const o = node as Record<string, unknown>;
    if ('zh' in o || 'en' in o) out.push({ path, zh: o.zh, en: o.en });
    for (const [k, v] of Object.entries(o)) collectLocalized(v, `${path}.${k}`, out);
  }
}

describe('culture map: places', () => {
  it('has a meaningful number of places with unique ids', () => {
    expect(places.length).toBeGreaterThanOrEqual(25);
    expect(places.length).toBeLessThanOrEqual(40);
    expect(placeIds.size).toBe(places.length);
  });

  it('coordinates are valid and producing places sit roughly in the coffee belt', () => {
    for (const p of places) {
      expect(p.lat, p.id).toBeGreaterThanOrEqual(-90);
      expect(p.lat, p.id).toBeLessThanOrEqual(90);
      expect(p.lon, p.id).toBeGreaterThanOrEqual(-180);
      expect(p.lon, p.id).toBeLessThanOrEqual(180);
      if (p.producing) expect(Math.abs(p.lat), `${p.id} outside coffee belt`).toBeLessThanOrEqual(30);
      if (p.kind === 'producer' || p.kind === 'origin') expect(p.producing, `${p.id} should be producing`).toBe(true);
    }
  });

  it('covers every kind of place', () => {
    const kinds = new Set(places.map((p) => p.kind));
    expect([...kinds].sort()).toEqual(['coffeehouse', 'drink-culture', 'origin', 'producer']);
  });

  it('references resolve (drinks, lessons, sources) and confidence is valid', () => {
    for (const p of places) {
      p.relatedDrinkIds.forEach((d) => expect(drinkIds.has(d), `${p.id} → drink ${d}`).toBe(true));
      p.relatedLessonIds.forEach((l) => expect(lessonIds.has(l), `${p.id} → lesson ${l}`).toBe(true));
      expect(p.sources.length, `${p.id} needs a source`).toBeGreaterThan(0);
      p.sources.forEach((s) => expect(sourceIds.has(s), `${p.id} → source ${s}`).toBe(true));
      expect(CONFIDENCE.has(p.confidence), p.id).toBe(true);
    }
  });
});

describe('culture map: timeline', () => {
  it('has a meaningful number of events with unique ids not colliding with places', () => {
    expect(timeline.length).toBeGreaterThanOrEqual(25);
    expect(timeline.length).toBeLessThanOrEqual(40);
    const ids = new Set(timeline.map((e) => e.id));
    expect(ids.size).toBe(timeline.length);
    timeline.forEach((e) => expect(placeIds.has(e.id), `${e.id} collides with a place id`).toBe(false));
  });

  it('is sortable: integer years, authored in ascending order', () => {
    for (const e of timeline) expect(Number.isInteger(e.year), e.id).toBe(true);
    const years = timeline.map((e) => e.year);
    expect(years).toEqual([...years].sort((a, b) => a - b));
  });

  it('legends are kind "legend" and their yearLabel says so in both languages', () => {
    const legends = timeline.filter((e) => e.kind === 'legend');
    expect(legends.length).toBeGreaterThanOrEqual(2);
    for (const e of legends) {
      expect(e.yearLabel.en, e.id).toMatch(/legend/i);
      expect(e.yearLabel.zh, e.id).toContain('传说');
    }
    // The Kaldi story must be a legend that cites its 1671 first written record.
    const kaldi = timeline.find((e) => e.id === 'tl-kaldi-legend');
    expect(kaldi?.kind).toBe('legend');
    expect(kaldi?.yearLabel.en).toContain('1671');
    // Conversely, anything labelled as a legend must be kind 'legend'.
    for (const e of timeline) {
      if (/^legend/i.test(e.yearLabel.en)) expect(e.kind, e.id).toBe('legend');
    }
  });

  it('known disputed dates are flagged', () => {
    for (const id of ['tl-istanbul', 'tl-venice', 'tl-england', 'tl-procope', 'tl-martinique', 'tl-yunnan', 'tl-flat-white', 'tl-vietnam-arrival']) {
      expect(timeline.find((e) => e.id === id)?.disputed, id).toBe(true);
    }
  });

  it('colonial / enslaved-labour history is stated, not omitted', () => {
    const text = timeline.map((e) => e.body.en).join(' ');
    expect(text).toMatch(/enslaved/i);
  });

  it('references resolve (place, drinks, lessons, sources) and confidence is valid', () => {
    for (const e of timeline) {
      if (e.placeId !== undefined) expect(placeIds.has(e.placeId), `${e.id} → place ${e.placeId}`).toBe(true);
      e.relatedDrinkIds.forEach((d) => expect(drinkIds.has(d), `${e.id} → drink ${d}`).toBe(true));
      e.relatedLessonIds.forEach((l) => expect(lessonIds.has(l), `${e.id} → lesson ${l}`).toBe(true));
      expect(e.sources.length, `${e.id} needs a source`).toBeGreaterThan(0);
      e.sources.forEach((s) => expect(sourceIds.has(s), `${e.id} → source ${s}`).toBe(true));
      expect(CONFIDENCE.has(e.confidence), e.id).toBe(true);
    }
  });
});

describe('culture map: bilingual + aggregator', () => {
  it('every {zh, en} has non-empty text in both languages', () => {
    const found: Array<{ path: string; zh: unknown; en: unknown }> = [];
    collectLocalized(places, 'places', found);
    collectLocalized(timeline, 'timeline', found);
    expect(found.length).toBeGreaterThan(100);
    for (const t of found) {
      expect(typeof t.zh === 'string' && t.zh.trim().length > 0, `${t.path}.zh`).toBe(true);
      expect(typeof t.en === 'string' && t.en.trim().length > 0, `${t.path}.en`).toBe(true);
    }
  });

  it('content index exports places, timeline and getPlace', () => {
    expect(exportedPlaces).toBe(places);
    expect(exportedTimeline).toBe(timeline);
    expect(getPlace('istanbul')?.kind).toBe('coffeehouse');
    expect(getPlace('nope')).toBeUndefined();
  });
});

describe('culture map honesty (lead)', () => {
  it('items backed only by the general reference are never marked verified', () => {
    const flagged = [...places, ...timeline].filter(
      (x) => x.sources.includes('atlas-general-reference') && x.confidence === 'verified',
    );
    expect(flagged.map((x) => x.id)).toEqual([]);
  });
  it('legends are never marked verified', () => {
    expect(timeline.filter((e) => e.kind === 'legend' && e.confidence === 'verified')).toEqual([]);
  });
});
