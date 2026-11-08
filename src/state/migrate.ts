/**
 * Versioned persistence: defaults, validation/migration and safe loading.
 *
 * `migrate(raw)` accepts ANY parsed value and always returns a valid LearnerState:
 *  - known current version → validated field-by-field (invalid entries dropped, prefs defaulted per field)
 *  - missing version (pre-release saves) → best-effort salvage
 *  - newer/unknown version → best-effort salvage (and the loader backs up the raw value)
 * Add future migrations to MIGRATIONS (from version N to N+1) and bump LEARNER_STATE_VERSION in contracts.
 */
import {
  LEARNER_STATE_VERSION,
  type BrewLogEntry,
  type DeviceKind,
  type EvidenceKind,
  type Experience,
  type Goal,
  type Guidance,
  type LearnerProfile,
  type LearnerState,
  type LearningEvent,
  type Locale,
  type Mode,
  type PracticeSession,
  type Preferences,
} from '../domain/contracts';
import { detectDefaultLocale, isLocale } from '../i18n/locale';
import { CORRUPT_BACKUP_KEY, STORAGE_KEY, safeSet, type StorageLike } from './storage';

// ───────────────────────── defaults ─────────────────────────

export function createDefaultPrefs(locale: Locale = detectDefaultLocale()): Preferences {
  return {
    locale,
    sfx: true, // audible only after the first user gesture unlocks audio
    music: false, // music is OFF by default (CONTRACTS §6)
    musicMood: 'cafe',
    volume: 0.7,
    reducedMotion: 'system',
    theme: 'system',
    defaultGuidance: 'guided',
    speakSteps: false,
  };
}

export function createDefaultState(locale?: Locale): LearnerState {
  return {
    version: LEARNER_STATE_VERSION,
    profile: null,
    prefs: createDefaultPrefs(locale),
    events: [],
    journal: [],
    activePractice: null,
  };
}

// ───────────────────────── validators ─────────────────────────

const MODES: readonly Mode[] = ['desktop', 'mobile', 'xr', 'real-world-guide'];
const EVIDENCE: readonly EvidenceKind[] = ['assessed_answer', 'observed_by_app', 'self_report', 'simulated'];
const GUIDANCE: readonly Guidance[] = ['guided', 'assisted', 'independent'];
const GOALS: readonly Goal[] = ['espresso', 'pourover', 'explore'];
const EXPERIENCE: readonly Experience[] = ['new', 'some', 'experienced'];
const DEVICES: readonly DeviceKind[] = ['pc', 'phone', 'headset'];
const OUTCOMES: readonly LearningEvent['outcome'][] = ['completed', 'retry', 'skipped'];
const STEP_STATUS = ['done', 'skipped', 'help'] as const;
const REDUCED_MOTION: readonly Preferences['reducedMotion'][] = ['system', 'on', 'off'];
const THEMES: readonly Preferences['theme'][] = ['system', 'light', 'dark'];
const MOODS: readonly Preferences['musicMood'][] = ['cafe', 'focus', 'lab', 'bossa', 'kissa', 'bar'];

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isNonEmptyStr = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isBool = (v: unknown): v is boolean => typeof v === 'boolean';
const oneOf = <T>(list: readonly T[], v: unknown): v is T => (list as readonly unknown[]).includes(v);
const strArray = (v: unknown): string[] => (Array.isArray(v) ? v.filter(isStr) : []);
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** Tracks whether validation had to drop or repair anything (→ loader keeps a backup). */
interface Report {
  lossy: boolean;
}

function validateProfile(v: unknown, r: Report): LearnerProfile | null {
  if (v === null || v === undefined) return null;
  if (!isObj(v) || !oneOf(GOALS, v.goal)) {
    r.lossy = true;
    return null;
  }
  return {
    goal: v.goal,
    experience: oneOf(EXPERIENCE, v.experience) ? v.experience : 'new',
    devices: Array.isArray(v.devices) ? v.devices.filter((d): d is DeviceKind => oneOf(DEVICES, d)) : [],
    equipment: strArray(v.equipment),
    wishlist: strArray(v.wishlist),
    preferredMode: oneOf(MODES, v.preferredMode) ? v.preferredMode : 'desktop',
    onboardedAt: isStr(v.onboardedAt) ? v.onboardedAt : new Date(0).toISOString(),
  };
}

function validatePrefs(v: unknown, r: Report): Preferences {
  const d = createDefaultPrefs();
  if (v === undefined) return d;
  if (!isObj(v)) {
    r.lossy = true;
    return d;
  }
  return {
    locale: isLocale(v.locale) ? v.locale : d.locale,
    sfx: isBool(v.sfx) ? v.sfx : d.sfx,
    music: isBool(v.music) ? v.music : d.music,
    musicMood: oneOf(MOODS, v.musicMood) ? v.musicMood : d.musicMood,
    volume: isNum(v.volume) ? clamp01(v.volume) : d.volume,
    reducedMotion: oneOf(REDUCED_MOTION, v.reducedMotion) ? v.reducedMotion : d.reducedMotion,
    theme: oneOf(THEMES, v.theme) ? v.theme : d.theme,
    defaultGuidance: oneOf(GUIDANCE, v.defaultGuidance) ? v.defaultGuidance : d.defaultGuidance,
    speakSteps: isBool(v.speakSteps) ? v.speakSteps : d.speakSteps,
  };
}

export function validateEvent(v: unknown): LearningEvent | null {
  if (!isObj(v)) return null;
  if (!isNonEmptyStr(v.id) || !isNonEmptyStr(v.activityId) || !isStr(v.lessonId) || !isStr(v.recordedAt)) return null;
  if (!oneOf(MODES, v.mode) || !oneOf(GUIDANCE, v.guidance) || !oneOf(EVIDENCE, v.evidence) || !oneOf(OUTCOMES, v.outcome)) {
    return null;
  }
  const e: LearningEvent = {
    id: v.id,
    activityId: v.activityId,
    lessonId: v.lessonId,
    mode: v.mode,
    guidance: v.guidance,
    evidence: v.evidence,
    outcome: v.outcome,
    recordedAt: v.recordedAt,
  };
  if (isNum(v.score)) e.score = clamp01(v.score);
  if (isStr(v.notes)) e.notes = v.notes;
  return e;
}

const optNum = (v: unknown): number | undefined => (isNum(v) ? v : undefined);
const optStr = (v: unknown): string | undefined => (isStr(v) ? v : undefined);

export function validateJournalEntry(v: unknown): BrewLogEntry | null {
  if (!isObj(v) || !isNonEmptyStr(v.id) || !isStr(v.drinkId) || !isStr(v.createdAt)) return null;
  const entry: BrewLogEntry = {
    id: v.id,
    evidence: 'self_report', // journal entries are always self-reported, whatever was stored
    drinkId: v.drinkId,
    createdAt: v.createdAt,
  };
  const activityId = optStr(v.activityId);
  if (activityId !== undefined) entry.activityId = activityId;
  const doseG = optNum(v.doseG);
  if (doseG !== undefined) entry.doseG = doseG;
  const outG = optNum(v.outG);
  if (outG !== undefined) entry.outG = outG;
  const timeSec = optNum(v.timeSec);
  if (timeSec !== undefined) entry.timeSec = timeSec;
  const grind = optStr(v.grind);
  if (grind !== undefined) entry.grind = grind;
  if (Array.isArray(v.tasteTags)) entry.tasteTags = strArray(v.tasteTags);
  if (v.rating === 1 || v.rating === 2 || v.rating === 3 || v.rating === 4 || v.rating === 5) entry.rating = v.rating;
  const notes = optStr(v.notes);
  if (notes !== undefined) entry.notes = notes;
  const nextChange = optStr(v.nextChange);
  if (nextChange !== undefined) entry.nextChange = nextChange;
  const attemptOf = optStr(v.attemptOf);
  if (attemptOf !== undefined) entry.attemptOf = attemptOf;
  if (v.timeSource === 'app-timer' || v.timeSource === 'self_report') entry.timeSource = v.timeSource;
  return entry;
}

function validatePractice(v: unknown, r: Report): PracticeSession | null {
  if (v === null || v === undefined) return null;
  if (!isObj(v) || !isNonEmptyStr(v.activityId) || !isStr(v.startedAt)) {
    r.lossy = true;
    return null;
  }
  const stepStatus: PracticeSession['stepStatus'] = {};
  if (isObj(v.stepStatus)) {
    for (const [k, s] of Object.entries(v.stepStatus)) if (oneOf(STEP_STATUS, s)) stepStatus[k] = s;
  }
  return {
    activityId: v.activityId,
    stepIndex: isNum(v.stepIndex) && v.stepIndex >= 0 ? Math.floor(v.stepIndex) : 0,
    stepStatus,
    guidance: oneOf(GUIDANCE, v.guidance) ? v.guidance : 'guided',
    startedAt: v.startedAt,
    updatedAt: isStr(v.updatedAt) ? v.updatedAt : v.startedAt,
  };
}

function validateList<T>(v: unknown, validate: (x: unknown) => T | null, r: Report): T[] {
  if (v === undefined) return [];
  if (!Array.isArray(v)) {
    r.lossy = true;
    return [];
  }
  const out: T[] = [];
  for (const item of v) {
    const ok = validate(item);
    if (ok) out.push(ok);
    else r.lossy = true;
  }
  return out;
}

// ───────────────────────── migration ─────────────────────────

/** Step migrations keyed by the version they upgrade FROM. None yet (v1 is the first). */
const MIGRATIONS: Record<number, (raw: Obj) => Obj> = {};

export interface MigrationResult {
  state: LearnerState;
  /** true when anything was dropped/repaired or the version was unknown → caller should back up the raw input. */
  lossy: boolean;
  fromVersion: number | null;
}

export function migrateWithReport(raw: unknown): MigrationResult {
  const r: Report = { lossy: false };
  if (!isObj(raw)) {
    return { state: createDefaultState(), lossy: raw !== null && raw !== undefined, fromVersion: null };
  }
  const fromVersion = isNum(raw.version) ? raw.version : null;
  let obj: Obj = raw;
  if (fromVersion === null) {
    // Pre-versioned save: salvage what validates.
  } else if (fromVersion > LEARNER_STATE_VERSION || !Number.isInteger(fromVersion) || fromVersion < 0) {
    r.lossy = true; // written by a newer/unknown app version — keep a backup, salvage known fields
  } else {
    for (let v = fromVersion; v < LEARNER_STATE_VERSION; v++) {
      const step = MIGRATIONS[v];
      if (step) obj = step(obj);
    }
  }

  const prefs = validatePrefs(obj.prefs, r);
  const state: LearnerState = {
    version: LEARNER_STATE_VERSION,
    profile: validateProfile(obj.profile, r),
    prefs,
    events: validateList(obj.events, validateEvent, r),
    journal: validateList(obj.journal, validateJournalEntry, r),
    activePractice: validatePractice(obj.activePractice, r),
  };
  const loc = obj.lastLocation;
  if (isObj(loc) && isStr(loc.route) && isStr(loc.at)) state.lastLocation = { route: loc.route, at: loc.at };
  else if (loc !== undefined) r.lossy = true;

  return { state, lossy: r.lossy, fromVersion };
}

/** Contract API: any input → valid current-version LearnerState. Never throws. */
export function migrate(raw: unknown): LearnerState {
  try {
    return migrateWithReport(raw).state;
  } catch {
    return createDefaultState();
  }
}

// ───────────────────────── loading ─────────────────────────

/**
 * - 'fresh'       nothing saved yet
 * - 'loaded'      saved state read cleanly
 * - 'recovered'   saved data was corrupted/partially invalid; raw copy kept under CORRUPT_BACKUP_KEY
 * - 'unavailable' storage cannot be used; progress lives in memory for this tab only
 */
export type LoadStatus = 'fresh' | 'loaded' | 'recovered' | 'unavailable';

export interface LoadResult {
  state: LearnerState;
  status: LoadStatus;
}

export function loadState(storage: StorageLike | null): LoadResult {
  if (!storage) return { state: createDefaultState(), status: 'unavailable' };
  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return { state: createDefaultState(), status: 'unavailable' };
  }
  if (raw === null || raw === '') return { state: createDefaultState(), status: 'fresh' };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    safeSet(storage, CORRUPT_BACKUP_KEY, raw);
    return { state: createDefaultState(), status: 'recovered' };
  }
  let result: MigrationResult;
  try {
    result = migrateWithReport(parsed);
  } catch {
    safeSet(storage, CORRUPT_BACKUP_KEY, raw);
    return { state: createDefaultState(), status: 'recovered' };
  }
  if (result.lossy) {
    safeSet(storage, CORRUPT_BACKUP_KEY, raw);
    return { state: result.state, status: 'recovered' };
  }
  return { state: result.state, status: 'loaded' };
}
