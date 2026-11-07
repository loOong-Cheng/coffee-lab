/** Minimal storage surface (subset of Web Storage) so tests can inject fakes. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const STORAGE_KEY = 'coffee-lab:state';
/** Last unreadable/invalid raw value, kept so a corrupted save is never silently destroyed. */
export const CORRUPT_BACKUP_KEY = 'coffee-lab:state:corrupt-backup';
/** Snapshot taken right before resetAll(), so an accidental reset is recoverable by hand. */
export const RESET_BACKUP_KEY = 'coffee-lab:state:pre-reset-backup';

/**
 * Returns window.localStorage if it is present AND writable, otherwise null.
 * (Safari private mode, disabled cookies, sandboxed iframes and some WebViews throw on access/write.)
 */
export function resolveBrowserStorage(): StorageLike | null {
  try {
    const s = (globalThis as { localStorage?: Storage }).localStorage;
    if (!s) return null;
    const probe = 'coffee-lab:probe';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

/** In-memory StorageLike (tests, or a stand-in when real storage is unavailable). */
export function createMemoryStorage(initial: Record<string, string> = {}): StorageLike & { dump(): Record<string, string> } {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k) => (data.has(k) ? (data.get(k) as string) : null),
    setItem: (k, v) => {
      data.set(k, String(v));
    },
    removeItem: (k) => {
      data.delete(k);
    },
    dump: () => Object.fromEntries(data),
  };
}

export function safeSet(storage: StorageLike | null, key: string, value: string): boolean {
  if (!storage) return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
