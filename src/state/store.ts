/**
 * Shared learner store: one in-memory LearnerState, persisted synchronously to localStorage on
 * every change, exposed to React through useSyncExternalStore. No external state library.
 *
 * - Works when localStorage is missing or throws (memory-only for the tab; status 'unavailable').
 * - Corrupted saves are backed up, never silently discarded (status 'recovered').
 * - Other tabs' writes are picked up via the 'storage' event.
 */
import { useSyncExternalStore } from 'react';
import type {
  BrewLogEntry,
  Guidance,
  LearnerProfile,
  LearnerState,
  LearningEvent,
  PracticeSession,
  Preferences,
} from '../domain/contracts';
import { createId, nowIso } from '../domain/ids';
import { createDefaultState, loadState, migrate, type LoadStatus } from './migrate';
import { RESET_BACKUP_KEY, STORAGE_KEY, resolveBrowserStorage, safeSet, type StorageLike } from './storage';

export type PersistenceStatus = LoadStatus | 'write-failed';

let storage: StorageLike | null = null;
let state: LearnerState = createDefaultState();
let persistence: PersistenceStatus = 'fresh';
const listeners = new Set<() => void>();
const statusListeners = new Set<() => void>();
let detachStorageListener: (() => void) | null = null;

function emit() {
  for (const l of [...listeners]) l();
}

function setPersistence(next: PersistenceStatus) {
  if (next === persistence) return;
  persistence = next;
  for (const l of [...statusListeners]) l();
}

function persist() {
  if (!storage) return;
  if (!safeSet(storage, STORAGE_KEY, JSON.stringify(state))) setPersistence('write-failed');
  else if (persistence === 'write-failed') setPersistence('loaded');
}

function commit(next: LearnerState) {
  if (next === state) return;
  state = next;
  persist();
  emit();
}

function attachCrossTabSync() {
  detachStorageListener?.();
  detachStorageListener = null;
  if (typeof window === 'undefined' || !storage) return;
  const onStorage = (ev: StorageEvent) => {
    if (ev.key !== STORAGE_KEY) return;
    if (ev.newValue === null) {
      state = createDefaultState(state.prefs.locale);
    } else {
      try {
        state = migrate(JSON.parse(ev.newValue));
      } catch {
        return; // another tab wrote garbage; keep ours
      }
    }
    emit();
  };
  window.addEventListener('storage', onStorage);
  detachStorageListener = () => window.removeEventListener('storage', onStorage);
}

/**
 * (Re)initialise the store. Called automatically on import with the browser's localStorage.
 * Tests pass a fake StorageLike, or `null` to simulate unavailable storage.
 */
export function initLearnerStore(customStorage?: StorageLike | null): LoadStatus {
  storage = customStorage === undefined ? resolveBrowserStorage() : customStorage;
  const result = loadState(storage);
  state = result.state;
  setPersistence(result.status);
  attachCrossTabSync();
  emit();
  return result.status;
}

initLearnerStore();

// ───────────────────────── read API ─────────────────────────

export function getLearnerState(): LearnerState {
  return state;
}

export function subscribeLearner(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * React hook. The selector runs on every render against the current snapshot, so it may return
 * derived arrays/objects freely (no memoisation pitfalls). Components re-render on any state change.
 */
export function useLearner<T>(selector: (s: LearnerState) => T): T {
  const snapshot = useSyncExternalStore(subscribeLearner, getLearnerState, getLearnerState);
  return selector(snapshot);
}

export function getPersistenceStatus(): PersistenceStatus {
  return persistence;
}

/** 'unavailable' / 'write-failed' → progress is not being saved; 'recovered' → a corrupted save was backed up. */
export function usePersistenceStatus(): PersistenceStatus {
  return useSyncExternalStore(
    (l) => {
      statusListeners.add(l);
      return () => statusListeners.delete(l);
    },
    getPersistenceStatus,
    getPersistenceStatus,
  );
}

// ───────────────────────── actions ─────────────────────────

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export const learnerActions = {
  setProfile(p: LearnerProfile): void {
    commit({ ...state, profile: { ...p, devices: [...p.devices], equipment: [...p.equipment], wishlist: [...p.wishlist] } });
  },

  updatePrefs(patch: Partial<Preferences>): void {
    const defined = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)) as Partial<Preferences>;
    const next: Preferences = { ...state.prefs, ...defined };
    if (typeof next.volume !== 'number' || !Number.isFinite(next.volume)) next.volume = state.prefs.volume;
    next.volume = clamp01(next.volume);
    commit({ ...state, prefs: next });
  },

  recordEvent(e: Omit<LearningEvent, 'id' | 'recordedAt'>): LearningEvent {
    const event: LearningEvent = { ...e, id: createId('evt'), recordedAt: nowIso() };
    if (event.score !== undefined) {
      if (Number.isFinite(event.score)) event.score = clamp01(event.score);
      else delete event.score;
    }
    commit({ ...state, events: [...state.events, event] });
    return event;
  },

  addJournalEntry(e: Omit<BrewLogEntry, 'id' | 'createdAt' | 'evidence'>): BrewLogEntry {
    const entry: BrewLogEntry = { ...e, id: createId('brew'), createdAt: nowIso(), evidence: 'self_report' };
    commit({ ...state, journal: [...state.journal, entry] });
    return entry;
  },

  updateJournalEntry(id: string, patch: Partial<Omit<BrewLogEntry, 'id' | 'evidence'>>): void {
    let found = false;
    const journal = state.journal.map((j) => {
      if (j.id !== id) return j;
      found = true;
      return { ...j, ...patch, id: j.id, evidence: 'self_report' as const };
    });
    if (found) commit({ ...state, journal });
  },

  deleteJournalEntry(id: string): void {
    const journal = state.journal.filter((j) => j.id !== id);
    if (journal.length !== state.journal.length) commit({ ...state, journal });
  },

  /** Starts a NEW session (replacing any active one). To resume, read state.activePractice first. */
  startPractice(activityId: string, guidance: Guidance): void {
    const at = nowIso();
    const session: PracticeSession = { activityId, stepIndex: 0, stepStatus: {}, guidance, startedAt: at, updatedAt: at };
    commit({ ...state, activePractice: session });
  },

  /** Merges into the active session (no-op when none). `updatedAt` is always refreshed. */
  updatePractice(patch: Partial<PracticeSession>): void {
    if (!state.activePractice) return;
    const cur = state.activePractice;
    const next: PracticeSession = {
      ...cur,
      ...patch,
      stepStatus: patch.stepStatus ? { ...patch.stepStatus } : cur.stepStatus,
      updatedAt: nowIso(),
    };
    if (!Number.isFinite(next.stepIndex) || next.stepIndex < 0) next.stepIndex = 0;
    commit({ ...state, activePractice: next });
  },

  endPractice(): void {
    if (state.activePractice) commit({ ...state, activePractice: null });
  },

  setLastLocation(route: string): void {
    if (state.lastLocation?.route === route) return;
    commit({ ...state, lastLocation: { route, at: nowIso() } });
  },

  /**
   * Clears profile, progress, journal and practice. Keeps the UI language.
   * The previous state is copied to RESET_BACKUP_KEY first (manual recovery only).
   */
  resetAll(): void {
    safeSet(storage, RESET_BACKUP_KEY, JSON.stringify(state));
    commit(createDefaultState(state.prefs.locale));
  },
};

export type LearnerActions = typeof learnerActions;
