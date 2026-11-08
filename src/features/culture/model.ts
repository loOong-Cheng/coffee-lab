/**
 * Culture Explorer data logic — pure functions over CulturePlace / CultureTimelineEvent.
 * The page passes real content in; tests pass fixtures. No React, no content imports.
 */
import type { CulturePlace, CultureTimelineEvent, Locale, LocalizedText } from '../../domain/contracts';
import type { CultureMusicMood } from '../../audio/moods';

export type PlaceKind = CulturePlace['kind'];
export type EventKind = CultureTimelineEvent['kind'];

export const PLACE_KINDS: readonly PlaceKind[] = ['origin', 'producer', 'drink-culture', 'coffeehouse'];
export const EVENT_KINDS: readonly EventKind[] = ['legend', 'history', 'innovation', 'culture'];

const isPlaceKind = (s: string): s is PlaceKind => (PLACE_KINDS as readonly string[]).includes(s);
const isEventKind = (s: string): s is EventKind => (EVENT_KINDS as readonly string[]).includes(s);

const textOf = (t: LocalizedText, locale: Locale) => t[locale] || t[locale === 'zh' ? 'en' : 'zh'] || '';

// ───────────────────────── URL ⇄ filter sets ─────────────────────────

/** "origin,producer" → those kinds; missing/empty/garbage → all kinds (never an empty filter from the URL). */
export function parseKinds<K extends string>(raw: string | null, all: readonly K[], guard: (s: string) => s is K): K[] {
  if (!raw) return [...all];
  const picked = raw
    .split(',')
    .map((s) => s.trim())
    .filter(guard);
  const unique = all.filter((k) => picked.includes(k));
  return unique.length ? unique : [...all];
}

export const parsePlaceKinds = (raw: string | null) => parseKinds(raw, PLACE_KINDS, isPlaceKind);
export const parseEventKinds = (raw: string | null) => parseKinds(raw, EVENT_KINDS, isEventKind);

/** Kinds → URL value; null when every kind is on (keep URLs clean). */
export function serializeKinds<K extends string>(kinds: readonly K[], all: readonly K[]): string | null {
  const ordered = all.filter((k) => kinds.includes(k));
  return ordered.length === all.length || ordered.length === 0 ? null : ordered.join(',');
}

/** Toggle one kind. Turning off the last kind is refused (an empty map is a dead end). */
export function toggleKind<K extends string>(kinds: readonly K[], kind: K, all: readonly K[]): K[] {
  const has = kinds.includes(kind);
  if (has && kinds.length === 1) return [...kinds];
  const next = has ? kinds.filter((k) => k !== kind) : [...kinds, kind];
  return all.filter((k) => next.includes(k));
}

// ───────────────────────── places ─────────────────────────

/** Places whose kind is selected, sorted by kind order then localized name. */
export function filterPlaces(places: readonly CulturePlace[], kinds: readonly PlaceKind[], locale: Locale): CulturePlace[] {
  return sortPlaces(
    places.filter((p) => kinds.includes(p.kind)),
    locale,
  );
}

export function sortPlaces(places: readonly CulturePlace[], locale: Locale): CulturePlace[] {
  const coll = new Intl.Collator(locale === 'zh' ? 'zh-Hans-CN' : 'en', { sensitivity: 'base' });
  return [...places].sort(
    (a, b) => PLACE_KINDS.indexOf(a.kind) - PLACE_KINDS.indexOf(b.kind) || coll.compare(textOf(a.name, locale), textOf(b.name, locale)) || a.id.localeCompare(b.id),
  );
}

export function groupPlacesByKind(places: readonly CulturePlace[]): { kind: PlaceKind; places: CulturePlace[] }[] {
  return PLACE_KINDS.map((kind) => ({ kind, places: places.filter((p) => p.kind === kind) })).filter((g) => g.places.length > 0);
}

export function countByKind<T extends { kind: K }, K extends string>(items: readonly T[], all: readonly K[]): Record<K, number> {
  const out = Object.fromEntries(all.map((k) => [k, 0])) as Record<K, number>;
  for (const it of items) if (it.kind in out) out[it.kind] += 1;
  return out;
}

/** Ids that point at nothing are dropped; order and duplicates are cleaned up. */
export function resolveIds<T>(ids: readonly string[], get: (id: string) => T | undefined): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    const item = get(id);
    if (item !== undefined) out.push(item);
  }
  return out;
}

// ───────────────────────── timeline ─────────────────────────

/** Chronological (year asc), ties keep a stable order by id. */
export function sortEvents(events: readonly CultureTimelineEvent[]): CultureTimelineEvent[] {
  return [...events].sort((a, b) => a.year - b.year || a.id.localeCompare(b.id));
}

export function filterEvents(events: readonly CultureTimelineEvent[], kinds: readonly EventKind[]): CultureTimelineEvent[] {
  return sortEvents(events.filter((e) => kinds.includes(e.kind)));
}

/** Timeline events that happened at a place (for the place detail panel). */
export function eventsAtPlace(events: readonly CultureTimelineEvent[], placeId: string): CultureTimelineEvent[] {
  return sortEvents(events.filter((e) => e.placeId === placeId));
}

/** 1-based century number; negative for BCE (year 0 is treated as 1 BCE → century -1). */
export function centuryOf(year: number): number {
  return year > 0 ? Math.floor((year - 1) / 100) + 1 : -(Math.floor(-year / 100) + 1);
}

export function centuryLabel(c: number): LocalizedText {
  if (c < 0) return { zh: `公元前 ${-c} 世纪`, en: `${ordinal(-c)} century BCE` };
  return { zh: `${c} 世纪`, en: `${ordinal(c)} century` };
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

/** Group already-sorted events by century, preserving order. */
export function groupByCentury(events: readonly CultureTimelineEvent[]): { century: number; events: CultureTimelineEvent[] }[] {
  const out: { century: number; events: CultureTimelineEvent[] }[] = [];
  for (const e of events) {
    const c = centuryOf(e.year);
    const last = out[out.length - 1];
    if (last && last.century === c) last.events.push(e);
    else out.push({ century: c, events: [e] });
  }
  return out;
}

// ───────────────────────── music ─────────────────────────

interface Box {
  mood: CultureMusicMood;
  lat: [number, number];
  lon: [number, number];
}

/** Rough country boxes for the three culture-inspired moods (see src/audio/moods.ts). */
const MOOD_BOXES: readonly Box[] = [
  { mood: 'bossa', lat: [-34, 4], lon: [-60, -34] }, // Brazil (Rio, Minas Gerais, São Paulo/Santos…)
  { mood: 'kissa', lat: [30, 46], lon: [128, 146] }, // Japan
  { mood: 'bar', lat: [36.5, 47.1], lon: [6.5, 18.6] }, // Italy (Turin, Milan, Venice, Trieste, Naples…)
];

/**
 * The culture-inspired mood that fits a place, or null when no mood is tied to that region.
 * (Callers fall back to the general café mood and say so — never pretend it is local music.)
 */
export function moodForPlace(p: Pick<CulturePlace, 'lat' | 'lon'>): CultureMusicMood | null {
  for (const b of MOOD_BOXES) {
    if (p.lat >= b.lat[0] && p.lat <= b.lat[1] && p.lon >= b.lon[0] && p.lon <= b.lon[1]) return b.mood;
  }
  return null;
}
