/**
 * Pure journal helpers: parsing form input, sorting/filtering, attempt chains and comparison.
 * No invented values: empty input stays undefined; nothing is defaulted on the learner's behalf.
 */
import type { BrewLogEntry } from '../../domain/contracts';
import { tryBrewRatio } from '../../domain/brew';

export type NumField = 'doseG' | 'outG' | 'timeSec';

export const FIELD_LIMITS: Record<NumField, { min: number; max: number }> = {
  doseG: { min: 0.1, max: 500 },
  outG: { min: 0, max: 5000 },
  timeSec: { min: 0, max: 48 * 3600 },
};

export type ParseResult = { ok: true; value: number | undefined } | { ok: false; error: 'nan' | 'range' };

/** "18", "18.5", "18,5" → number; "" → undefined (skipped is fine). */
export function parseGrams(raw: string, field: 'doseG' | 'outG'): ParseResult {
  const s = raw.trim().replace(',', '.');
  if (s === '') return { ok: true, value: undefined };
  if (!/^\d+(\.\d+)?$/.test(s)) return { ok: false, error: 'nan' };
  const v = Number(s);
  const { min, max } = FIELD_LIMITS[field];
  if (!Number.isFinite(v) || v < min || v > max) return { ok: false, error: 'range' };
  return { ok: true, value: Math.round(v * 10) / 10 };
}

/** "28" (seconds), "3:30" (m:ss), "1:02:00" (h:mm:ss) → seconds; "" → undefined. */
export function parseDuration(raw: string): ParseResult {
  const s = raw.trim();
  if (s === '') return { ok: true, value: undefined };
  let v: number;
  if (/^\d+(\.\d+)?$/.test(s)) v = Number(s);
  else if (/^\d+:[0-5]\d$/.test(s)) {
    const [m, sec] = s.split(':').map(Number);
    v = m * 60 + sec;
  } else if (/^\d+:[0-5]\d:[0-5]\d$/.test(s)) {
    const [h, m, sec] = s.split(':').map(Number);
    v = h * 3600 + m * 60 + sec;
  } else return { ok: false, error: 'nan' };
  const { min, max } = FIELD_LIMITS.timeSec;
  if (!Number.isFinite(v) || v < min || v > max) return { ok: false, error: 'range' };
  return { ok: true, value: Math.round(v) };
}

/** Seconds → "28 s" / "3:30" style string for display and for editing. */
export function formatDurationInput(sec: number | undefined): string {
  if (sec == null || !Number.isFinite(sec)) return '';
  if (sec < 60) return String(sec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}

export function entryRatio(e: Pick<BrewLogEntry, 'doseG' | 'outG'>): number | null {
  return tryBrewRatio(e.doseG, e.outG);
}

/** Newest first; ties keep insertion order reversed (stable). */
export function sortNewestFirst(entries: readonly BrewLogEntry[]): BrewLogEntry[] {
  return entries
    .map((e, i) => ({ e, i }))
    .sort((a, b) => (a.e.createdAt < b.e.createdAt ? 1 : a.e.createdAt > b.e.createdAt ? -1 : b.i - a.i))
    .map((x) => x.e);
}

export function filterByDrink(entries: readonly BrewLogEntry[], drinkId: string | null): BrewLogEntry[] {
  return drinkId ? entries.filter((e) => e.drinkId === drinkId) : [...entries];
}

/** Distinct drink ids in the journal, most-logged first then alphabetical. */
export function drinkIdsInJournal(entries: readonly BrewLogEntry[]): Array<{ drinkId: string; count: number }> {
  const counts = new Map<string, number>();
  for (const e of entries) counts.set(e.drinkId, (counts.get(e.drinkId) ?? 0) + 1);
  return [...counts.entries()]
    .map(([drinkId, count]) => ({ drinkId, count }))
    .sort((a, b) => b.count - a.count || a.drinkId.localeCompare(b.drinkId));
}

export function findEntry(entries: readonly BrewLogEntry[], id: string | null | undefined): BrewLogEntry | undefined {
  return id ? entries.find((e) => e.id === id) : undefined;
}

export function previousAttempt(entry: BrewLogEntry, entries: readonly BrewLogEntry[]): BrewLogEntry | undefined {
  return entry.attemptOf ? entries.find((e) => e.id === entry.attemptOf) : undefined;
}

export function laterAttempts(entry: BrewLogEntry, entries: readonly BrewLogEntry[]): BrewLogEntry[] {
  return entries.filter((e) => e.attemptOf === entry.id);
}

/** 1-based position in its attempt chain (follows attemptOf links; cycle-safe). */
export function attemptNumber(entry: BrewLogEntry, entries: readonly BrewLogEntry[]): number {
  let n = 1;
  const seen = new Set<string>([entry.id]);
  let cur: BrewLogEntry | undefined = entry;
  while (cur?.attemptOf) {
    const prev = entries.find((e) => e.id === cur!.attemptOf);
    if (!prev || seen.has(prev.id)) break;
    seen.add(prev.id);
    n++;
    cur = prev;
  }
  return n;
}

export type CompareField = 'doseG' | 'outG' | 'ratio' | 'timeSec' | 'grind' | 'rating' | 'tasteTags';

export interface CompareRow {
  field: CompareField;
  before: string | number | string[] | null;
  after: string | number | string[] | null;
  changed: boolean;
}

/** Field-by-field comparison of two attempts (only fields at least one of them recorded). */
export function compareAttempts(prev: BrewLogEntry, cur: BrewLogEntry): CompareRow[] {
  const rows: CompareRow[] = [];
  const push = (field: CompareField, a: CompareRow['before'], b: CompareRow['after']) => {
    const empty = (x: CompareRow['before']) => x === null || x === undefined || (Array.isArray(x) && x.length === 0) || x === '';
    if (empty(a) && empty(b)) return;
    const same = Array.isArray(a) && Array.isArray(b) ? [...a].sort().join('|') === [...b].sort().join('|') : a === b;
    rows.push({ field, before: empty(a) ? null : a, after: empty(b) ? null : b, changed: !same });
  };
  push('doseG', prev.doseG ?? null, cur.doseG ?? null);
  push('outG', prev.outG ?? null, cur.outG ?? null);
  const r1 = entryRatio(prev);
  const r2 = entryRatio(cur);
  push('ratio', r1 === null ? null : Math.round(r1 * 10) / 10, r2 === null ? null : Math.round(r2 * 10) / 10);
  push('timeSec', prev.timeSec ?? null, cur.timeSec ?? null);
  push('grind', prev.grind ?? null, cur.grind ?? null);
  push('rating', prev.rating ?? null, cur.rating ?? null);
  push('tasteTags', prev.tasteTags ?? [], cur.tasteTags ?? []);
  return rows;
}

/**
 * How many recipe inputs changed between attempts (dose, output target, grind). Time, taste and
 * rating are results, and the ratio is derived — none of them count as "a change you made".
 */
export function changedVariableCount(rows: readonly CompareRow[]): number {
  return rows.filter((r) => r.changed && r.before !== null && r.after !== null && (r.field === 'doseG' || r.field === 'outG' || r.field === 'grind')).length;
}

/** Recipe inputs (dose, output, grind) logged in only ONE of the two attempts → the comparison is partial. */
export function partiallyLoggedCount(rows: readonly CompareRow[]): number {
  return rows.filter((r) => (r.before === null) !== (r.after === null) && (r.field === 'doseG' || r.field === 'outG' || r.field === 'grind')).length;
}
