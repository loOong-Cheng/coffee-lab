import { describe, expect, it } from 'vitest';
import { getDrink, getLesson, getPlace, places, timeline } from '../../content';
import type { CulturePlace, CultureTimelineEvent } from '../../domain/contracts';
import { CULTURE_MUSIC_MOODS } from '../../audio';
import {
  EVENT_KINDS,
  PLACE_KINDS,
  centuryLabel,
  centuryOf,
  countByKind,
  eventsAtPlace,
  filterEvents,
  filterPlaces,
  groupByCentury,
  groupPlacesByKind,
  moodForPlace,
  parseEventKinds,
  parsePlaceKinds,
  resolveIds,
  serializeKinds,
  sortEvents,
  toggleKind,
} from './model';

const L = (en: string, zh = en) => ({ en, zh });
const place = (id: string, kind: CulturePlace['kind'], name: string, lat = 0, lon = 0, zh = name): CulturePlace => ({
  id,
  name: L(name, zh),
  kind,
  lat,
  lon,
  summary: L('s'),
  relatedDrinkIds: [],
  relatedLessonIds: [],
  sources: [],
  confidence: 'verified',
});
const ev = (id: string, year: number, kind: CultureTimelineEvent['kind'], placeId?: string): CultureTimelineEvent => ({
  id,
  year,
  yearLabel: L(String(year)),
  title: L(id),
  body: L('b'),
  kind,
  placeId,
  relatedDrinkIds: [],
  relatedLessonIds: [],
  sources: [],
  confidence: kind === 'legend' ? 'rule-of-thumb' : 'verified',
});

const FIX_PLACES = [
  place('vienna', 'coffeehouse', 'Vienna', 48.2, 16.4, '维也纳'),
  place('brazil', 'producer', 'Brazil', -21.5, -45.4, '巴西'),
  place('kaffa', 'origin', 'Kaffa', 7.3, 36.2, '卡法'),
  place('alpha', 'producer', 'Alpha', 1, 1, '阿尔法'),
  place('tokyo', 'coffeehouse', 'Tokyo', 35.7, 139.8, '东京'),
];
const FIX_EVENTS = [ev('b', 1554, 'culture', 'vienna'), ev('a', 850, 'legend', 'kaffa'), ev('c', 1554, 'history'), ev('d', 1908, 'innovation')];

describe('filter params', () => {
  it('parses kinds from the URL; missing, empty or garbage → all kinds', () => {
    expect(parsePlaceKinds(null)).toEqual([...PLACE_KINDS]);
    expect(parsePlaceKinds('')).toEqual([...PLACE_KINDS]);
    expect(parsePlaceKinds('nope,,x')).toEqual([...PLACE_KINDS]);
    expect(parsePlaceKinds('coffeehouse,origin,origin')).toEqual(['origin', 'coffeehouse']);
    expect(parseEventKinds('legend')).toEqual(['legend']);
  });

  it('serializes to null when everything is on, otherwise in canonical order', () => {
    expect(serializeKinds([...EVENT_KINDS], EVENT_KINDS)).toBeNull();
    expect(serializeKinds(['culture', 'legend'], EVENT_KINDS)).toBe('legend,culture');
  });

  it('toggling never leaves an empty filter (no dead ends)', () => {
    expect(toggleKind(['origin', 'producer'], 'origin', PLACE_KINDS)).toEqual(['producer']);
    expect(toggleKind(['producer'], 'producer', PLACE_KINDS)).toEqual(['producer']);
    expect(toggleKind(['producer'], 'origin', PLACE_KINDS)).toEqual(['origin', 'producer']);
  });
});

describe('places', () => {
  it('filters by kind and sorts by kind order, then localized name', () => {
    expect(filterPlaces(FIX_PLACES, ['producer', 'coffeehouse'], 'en').map((p) => p.id)).toEqual(['alpha', 'brazil', 'tokyo', 'vienna']);
    expect(filterPlaces(FIX_PLACES, PLACE_KINDS, 'en')[0]!.id).toBe('kaffa');
    const zh = filterPlaces(FIX_PLACES, ['coffeehouse'], 'zh').map((p) => p.id);
    expect(zh).toHaveLength(2);
    expect(new Set(zh)).toEqual(new Set(['tokyo', 'vienna']));
  });

  it('groups by kind (empty groups dropped) and counts per kind', () => {
    expect(groupPlacesByKind(FIX_PLACES.filter((p) => p.kind !== 'origin')).map((g) => g.kind)).toEqual(['producer', 'coffeehouse']);
    expect(countByKind(FIX_PLACES, PLACE_KINDS)).toEqual({ origin: 1, producer: 2, 'drink-culture': 0, coffeehouse: 2 });
  });

  it('resolves related ids, dropping unknown ones and duplicates', () => {
    const got = resolveIds(['espresso-shot', 'nope', 'espresso-shot', 'turkish-coffee'], getDrink);
    expect(got.map((d) => d.id)).toEqual(['espresso-shot', 'turkish-coffee']);
    expect(resolveIds(['cul-coffeehouses', 'missing'], getLesson).map((l) => l.id)).toEqual(['cul-coffeehouses']);
    expect(resolveIds([], getDrink)).toEqual([]);
  });

  it('matches culture music moods by region only (no mood invented elsewhere)', () => {
    expect(moodForPlace({ lat: -21.5, lon: -45.4 })).toBe('bossa');
    expect(moodForPlace({ lat: 35.71, lon: 139.77 })).toBe('kissa');
    expect(moodForPlace({ lat: 45.46, lon: 9.19 })).toBe('bar');
    expect(moodForPlace({ lat: 48.21, lon: 16.37 })).toBeNull(); // Vienna
    expect(moodForPlace({ lat: 5.07, lon: -75.52 })).toBeNull(); // Colombia
  });
});

describe('timeline', () => {
  it('sorts chronologically with a stable tie-break and filters by kind', () => {
    expect(sortEvents(FIX_EVENTS).map((e) => e.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(filterEvents(FIX_EVENTS, ['legend', 'innovation']).map((e) => e.id)).toEqual(['a', 'd']);
    expect(eventsAtPlace(FIX_EVENTS, 'vienna').map((e) => e.id)).toEqual(['b']);
  });

  it('groups by century with readable labels (incl. BCE)', () => {
    expect(centuryOf(850)).toBe(9);
    expect(centuryOf(1500)).toBe(15);
    expect(centuryOf(1501)).toBe(16);
    expect(centuryOf(2001)).toBe(21);
    expect(centuryOf(-50)).toBe(-1);
    expect(groupByCentury(sortEvents(FIX_EVENTS)).map((g) => [g.century, g.events.length])).toEqual([
      [9, 1],
      [16, 2],
      [20, 1],
    ]);
    expect(centuryLabel(16)).toEqual({ zh: '16 世纪', en: '16th century' });
    expect(centuryLabel(21).en).toBe('21st century');
    expect(centuryLabel(12).en).toBe('12th century');
    expect(centuryLabel(-1).en).toBe('1st century BCE');
  });
});

describe('real culture content works with the explorer', () => {
  it('every place has finite coordinates inside the drawn band and a known kind', () => {
    expect(places.length).toBeGreaterThan(10);
    for (const p of places) {
      expect(PLACE_KINDS).toContain(p.kind);
      expect(Number.isFinite(p.lat) && Number.isFinite(p.lon)).toBe(true);
      expect(p.lat).toBeLessThan(84);
      expect(p.lat).toBeGreaterThan(-58);
    }
  });

  it('timeline place links resolve (events without a place are allowed)', () => {
    for (const e of timeline) if (e.placeId) expect(getPlace(e.placeId), e.id).toBeDefined();
    expect(timeline.some((e) => !e.placeId)).toBe(true);
  });

  it('legends are kind "legend" and never claim to be verified', () => {
    const legends = timeline.filter((e) => e.kind === 'legend');
    expect(legends.length).toBeGreaterThan(0);
    for (const e of legends) expect(e.confidence).not.toBe('verified');
  });

  it('the culture moods the explorer can pick exist in the audio engine', () => {
    for (const p of places) {
      const m = moodForPlace(p);
      if (m) expect(CULTURE_MUSIC_MOODS).toContain(m);
    }
    expect(places.some((p) => moodForPlace(p) === 'bossa')).toBe(true);
  });
});
