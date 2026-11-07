/**
 * Local-only export/import of the learner's data. Nothing is uploaded anywhere: export builds a
 * Blob the browser downloads; import reads a file the learner picks and validates it through the
 * state migration (src/state migrateWithReport) before anything is replaced.
 */
import type { LearnerState } from '../../domain/contracts';
import { RESET_BACKUP_KEY, STORAGE_KEY, initLearnerStore, migrateWithReport } from '../../state';

export const EXPORT_FORMAT = 'coffee-lab-export';

export interface ExportEnvelope {
  format: typeof EXPORT_FORMAT;
  exportedAt: string;
  state: LearnerState;
}

export function buildExport(state: LearnerState, now: Date = new Date()): ExportEnvelope {
  return { format: EXPORT_FORMAT, exportedAt: now.toISOString(), state };
}

export function exportFileName(now: Date = new Date()): string {
  const d = now.toISOString().slice(0, 10);
  return `coffee-lab-${d}.json`;
}

export interface ImportSummary {
  hasProfile: boolean;
  journal: number;
  events: number;
  activePractice: boolean;
}

export type ImportResult =
  | { ok: true; state: LearnerState; lossy: boolean; summary: ImportSummary }
  | { ok: false; error: 'too-large' | 'not-json' | 'not-coffee-lab' };

const MAX_BYTES = 5 * 1024 * 1024;

function looksLikeState(v: unknown): v is Record<string, unknown> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
  const o = v as Record<string, unknown>;
  return 'version' in o && ('prefs' in o || 'journal' in o || 'events' in o || 'profile' in o);
}

/** Accepts our export envelope or a raw saved state. Never throws. */
export function parseImport(text: string): ImportResult {
  if (text.length > MAX_BYTES) return { ok: false, error: 'too-large' };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'not-json' };
  }
  let candidate: unknown = raw;
  if (raw && typeof raw === 'object' && (raw as Record<string, unknown>).format === EXPORT_FORMAT) {
    candidate = (raw as Record<string, unknown>).state;
  }
  if (!looksLikeState(candidate)) return { ok: false, error: 'not-coffee-lab' };
  const { state, lossy } = migrateWithReport(candidate);
  return {
    ok: true,
    state,
    lossy,
    summary: {
      hasProfile: !!state.profile,
      journal: state.journal.length,
      events: state.events.length,
      activePractice: !!state.activePractice,
    },
  };
}

/**
 * Replace the saved learner data with an imported (already validated) state. The current data is
 * copied to the pre-reset backup key first (manual recovery). Returns false when storage is
 * unavailable — the import is then not applied, so nothing is half-replaced.
 */
export function applyImportedState(next: LearnerState, current: LearnerState): boolean {
  try {
    const ls = globalThis.localStorage;
    if (!ls) return false;
    ls.setItem(RESET_BACKUP_KEY, JSON.stringify(current));
    ls.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    return false;
  }
  initLearnerStore();
  return true;
}
