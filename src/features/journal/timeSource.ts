/**
 * Where a brew log's time came from (contract: BrewLogEntry.timeSource). A time carried over from an
 * in-app timer is the one value the app genuinely measured — the interval between the learner's own
 * Start/Stop taps (CONTRACTS §9 observed_by_app). The entry as a whole stays evidence 'self_report'.
 *
 * Also hosts the one-time migration of the interim per-device side key (used before the contract field
 * existed) into the entries themselves.
 */
import type { BrewLogEntry } from '../../domain/contracts';

export type TimeSource = NonNullable<BrewLogEntry['timeSource']>;

/** 'app-timer' only when the entry says so; any logged time without the flag is self-reported; null when no time. */
export function timeSourceOf(entry: Pick<BrewLogEntry, 'timeSec' | 'timeSource'>): TimeSource | null {
  if (entry.timeSec == null) return null;
  return entry.timeSource === 'app-timer' ? 'app-timer' : 'self_report';
}

/** The timeSource to store after a save: app-timed only when the form says the value is the untouched measurement. */
export function timeSourceForSave(timeSec: number | undefined, timedInApp: boolean): TimeSource | undefined {
  if (timeSec == null) return undefined;
  return timedInApp ? 'app-timer' : 'self_report';
}

// ───────────────────────── legacy side key (interim, pre-contract) ─────────────────────────

export const LEGACY_TIME_SOURCE_KEY = 'coffee-lab:journal:time-source:v1';

function readLegacy(): Record<string, number> | null {
  try {
    const raw = globalThis.localStorage?.getItem(LEGACY_TIME_SOURCE_KEY);
    if (raw == null) return null;
    const v: unknown = JSON.parse(raw);
    const out: Record<string, number> = {};
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      for (const [id, sec] of Object.entries(v as Record<string, unknown>)) {
        if (typeof sec === 'number' && Number.isFinite(sec) && sec > 0) out[id] = sec;
      }
    }
    return out;
  } catch {
    return {}; // corrupted → nothing to migrate, but still remove the key
  }
}

/**
 * Entries the legacy map marks as app-timed, ONLY where the entry still holds exactly the stored seconds
 * and has no timeSource of its own yet. Pure.
 */
export function legacyAppTimedIds(journal: readonly BrewLogEntry[], legacy: Record<string, number>): string[] {
  return journal.filter((e) => e.timeSource === undefined && e.timeSec != null && legacy[e.id] === e.timeSec).map((e) => e.id);
}

/**
 * One-time: move the interim side key into entries (via the store's update action), then delete the key.
 * Returns how many entries were marked. Safe without storage.
 */
export function migrateLegacyTimeSource(journal: readonly BrewLogEntry[], update: (id: string, patch: Pick<BrewLogEntry, 'timeSource'>) => void): number {
  const legacy = readLegacy();
  if (legacy === null) return 0;
  const ids = legacyAppTimedIds(journal, legacy);
  for (const id of ids) update(id, { timeSource: 'app-timer' });
  try {
    globalThis.localStorage?.removeItem(LEGACY_TIME_SOURCE_KEY);
  } catch {
    /* ignore */
  }
  return ids.length;
}
