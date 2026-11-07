/**
 * Coffee Lab — shared domain contract (LEAD-OWNED).
 *
 * Every worker codes against these types. Do not edit without lead approval;
 * propose additions in your handback instead. Pure types + tiny constants only.
 *
 * Canonical intent: COFFEE_LAB_HANDOFF.md §4 (lesson fields), §5 (modes), §7 (types).
 * Skills ≠ rendering mode: content describes WHAT is learned; each platform
 * adapter decides HOW to present/interact.
 */

// ───────────────────────────── i18n ─────────────────────────────
export type Locale = 'zh' | 'en';
/** Every user-visible string is bilingual (user decision U1). */
export interface LocalizedText {
  zh: string;
  en: string;
}

// ─────────────────────── modes & capabilities ───────────────────────
export type Mode = 'desktop' | 'mobile' | 'xr' | 'real-world-guide';
export type EvidenceKind = 'assessed_answer' | 'observed_by_app' | 'self_report' | 'simulated';
export type Guidance = 'guided' | 'assisted' | 'independent';

export interface CapabilityProfile {
  screen: 'desktop' | 'mobile' | 'headset';
  touch: boolean;
  xrImmersiveVR: boolean;
  xrControllers?: boolean;
  xrHandTracking?: boolean;
  speechSynthesis: boolean;
  speechRecognition: boolean;
  wakeLock: boolean;
  prefersReducedMotion: boolean;
  /** Equipment ids the learner says they own (self-reported). */
  physicalEquipment: string[];
}

// ─────────────────────────── content ───────────────────────────
/** Confidence/provenance of a factual claim (brief §4: separate facts, rules of thumb, models). */
export type Confidence = 'verified' | 'rule-of-thumb' | 'illustrative-model';

export interface SourceRef {
  id: string;
  title: string;
  url?: string;
  /** ISO date accessed/reviewed. */
  accessed?: string;
  note?: string;
}

export type TrackId = 'literacy' | 'espresso' | 'pourover' | 'explore' | 'culture';
export type Level = 'beginner' | 'intermediate' | 'advanced';

export interface Track {
  id: TrackId;
  order: number;
  title: LocalizedText;
  summary: LocalizedText;
  /** Ordered lesson ids. */
  lessonIds: string[];
  /** Optional tracks are never prerequisites for the core path. */
  optional?: boolean;
}

export interface Lesson {
  id: string;
  track: TrackId;
  level: Level;
  title: LocalizedText;
  goal: LocalizedText;
  prerequisites: string[];
  keyConcepts: LocalizedText[];
  /** Ordered activity ids composing the lesson. */
  activityIds: string[];
  /** Subset of activityIds that count as checks for understanding. */
  checkForUnderstanding: string[];
  safetyNotes: LocalizedText[];
  estimatedMinutes: number;
  /** SourceRef ids. */
  sources: string[];
  confidence: Confidence;
  /** Suggested next lesson ids. */
  next: string[];
}

export type ActivityKind =
  | 'explain'
  | 'identify'
  | 'sequence'
  | 'quiz'
  | 'parameter-lab'
  | 'diagnose'
  | 'guided-practice'
  | 'spatial-practice'
  | 'reflect';

interface ActivityBase {
  id: string;
  lessonId: string;
  kind: ActivityKind;
  title: LocalizedText;
  /** Short framing shown before the activity starts. */
  intro?: LocalizedText;
  objectiveIds?: string[];
  supportedModes: Mode[];
  safetyNotes?: LocalizedText[];
}

/** Illustrated concept cards. `illustration` is a key the UI maps to an original SVG/procedural drawing; unknown keys fall back gracefully. */
export interface ExplainActivity extends ActivityBase {
  kind: 'explain';
  cards: Array<{
    heading: LocalizedText;
    body: LocalizedText;
    illustration?: string;
    callout?: { kind: 'tip' | 'safety' | 'myth' | 'culture' | 'illustrative'; text: LocalizedText };
  }>;
}

/** Diagrams the UI knows how to draw, and the part ids each one exposes as hotspots. */
export const DIAGRAM_PARTS = {
  'espresso-station': [
    'espresso-machine',
    'group-head',
    'portafilter',
    'basket',
    'tamper',
    'grinder',
    'scale',
    'cup',
    'steam-wand',
    'drip-tray',
  ],
  'pourover-station': [
    'gooseneck-kettle',
    'dripper',
    'paper-filter',
    'carafe',
    'scale',
    'grinder',
    'coffee-beans',
    'timer',
  ],
} as const;
export type DiagramId = keyof typeof DIAGRAM_PARTS;
export type DiagramPartId<D extends DiagramId = DiagramId> = (typeof DIAGRAM_PARTS)[D][number];

/** Identify parts on a diagram (click/tap hotspots; XR may use real 3D props instead). */
export interface IdentifyActivity extends ActivityBase {
  kind: 'identify';
  diagram: DiagramId;
  prompt: LocalizedText;
  targets: Array<{
    partId: DiagramPartId;
    label: LocalizedText;
    /** What it is for — shown after correct identification. */
    description: LocalizedText;
    hint: LocalizedText;
  }>;
}

/** Put steps in order. `steps` is listed in the CORRECT order; the UI shuffles. */
export interface SequenceActivity extends ActivityBase {
  kind: 'sequence';
  prompt: LocalizedText;
  steps: Array<{ id: string; text: LocalizedText; why: LocalizedText }>;
  hint: LocalizedText;
  /** Targeted feedback shown when the learner places `laterStep` ahead of `earlierStep`. */
  misconceptions?: Array<{ earlierStep: string; laterStep: string; feedback: LocalizedText }>;
}

/** Single-answer questions with feedback tied to the misconception behind each wrong option. */
export interface QuizActivity extends ActivityBase {
  kind: 'quiz';
  questions: Array<{
    id: string;
    prompt: LocalizedText;
    options: Array<{ id: string; text: LocalizedText; correct: boolean; feedback: LocalizedText }>;
    explanation: LocalizedText;
    hint?: LocalizedText;
  }>;
}

export type ParameterLabType = 'espresso-ratio' | 'pourover-ratio' | 'extraction-explorer';

/**
 * Interactive parameter exploration. Math is computed by domain functions, not content.
 * Ratio convention: espresso → yield/dose ("1:2"); pour-over → water/dose ("1:16"); extraction-explorer → out/dose like espresso.
 */
export interface ParameterLabActivity extends ActivityBase {
  kind: 'parameter-lab';
  lab: ParameterLabType;
  /** Starting values, e.g. { doseG: 18, outG: 36 } or { doseG: 15, outG: 250 }. */
  defaults: { doseG: number; outG: number; timeSec?: number; grind?: number };
  ranges: { doseG: [number, number]; outG: [number, number]; timeSec?: [number, number]; grind?: [number, number] };
  /** Always-visible disclaimer that values are illustrative starting points, not universal ideals. */
  illustrativeNote: LocalizedText;
  /** Small goals inside the lab, checked by ratio range (and optional dose range). */
  challenges: Array<{
    id: string;
    prompt: LocalizedText;
    target: { ratioMin: number; ratioMax: number; doseG?: [number, number] };
    success: LocalizedText;
  }>;
}

/** Scenario-based reasoning ("this shot ran fast and tasted sour — what ONE thing would you change?"). Always illustrative. */
export interface DiagnoseActivity extends ActivityBase {
  kind: 'diagnose';
  scenarios: Array<{
    id: string;
    situation: LocalizedText;
    /** Hypothetical observations (illustrative). taste words are what the imaginary drinker reported. */
    observations: { doseG?: number; outG?: number; timeSec?: number; taste?: LocalizedText };
    choices: Array<{
      id: string;
      text: LocalizedText;
      quality: 'best' | 'reasonable' | 'unhelpful';
      feedback: LocalizedText;
    }>;
    /** Uncertainty reminder: real results depend on beans, grinder, machine, taste. */
    caveat: LocalizedText;
  }>;
}

/** Real-world step-by-step coaching (mobile kitchen mode). Completion is ALWAYS self-reported. */
export interface GuidedPracticeActivity extends ActivityBase {
  kind: 'guided-practice';
  /** Equipment ids required (see equipment catalog). */
  equipment: string[];
  /** Illustrative starting recipe — never "the correct" recipe. */
  recipe?: {
    doseG: number;
    outG: number;
    ratioLabel: LocalizedText;
    note: LocalizedText;
    targetTimeSec?: [number, number];
  };
  steps: Array<{
    id: string;
    text: LocalizedText;
    detail?: LocalizedText;
    /**
     * REFERENCE duration in seconds (not auto-advance). UI offers a user-started stopwatch showing this
     * reference (countdown only for waits like bloom). A timer never completes a step; completion is a self-reported tap.
     */
    timerSec?: number;
    safety?: LocalizedText;
    /** Shown when the user taps "Need help". */
    help: LocalizedText;
    /** Key of a small inline illustration (optional). */
    illustration?: string;
  }>;
  /** Which fields the brew log asks for after the practice (all optional to fill). */
  logFields: Array<'doseG' | 'outG' | 'timeSec' | 'grind' | 'taste' | 'rating' | 'notes'>;
}

/** XR spatial mission reference; mechanics live in src/xr. */
export interface SpatialPracticeActivity extends ActivityBase {
  kind: 'spatial-practice';
  missionId: string;
  summary: LocalizedText;
  /** What the mission does NOT train (honesty: haptics, grip force, real taste...). */
  limits: LocalizedText;
}

export interface ReflectActivity extends ActivityBase {
  kind: 'reflect';
  prompts: LocalizedText[];
}

export type Activity =
  | ExplainActivity
  | IdentifyActivity
  | SequenceActivity
  | QuizActivity
  | ParameterLabActivity
  | DiagnoseActivity
  | GuidedPracticeActivity
  | SpatialPracticeActivity
  | ReflectActivity;

// ───────────────────── equipment, drinks, culture ─────────────────────
export type EquipmentCategory = 'espresso' | 'brewer' | 'grinding' | 'measuring' | 'water' | 'milk' | 'serving' | 'cleaning';

export interface Equipment {
  id: string;
  category: EquipmentCategory;
  name: LocalizedText;
  description: LocalizedText;
  safety?: LocalizedText;
  /** Rough beginner relevance: essential for the core paths, or optional upgrade. */
  essentialFor?: string[];
}

export type DrinkCategory = 'espresso' | 'espresso-milk' | 'pourover' | 'immersion' | 'pressure' | 'cold' | 'regional';

export interface DrinkRecipe {
  id: string;
  category: DrinkCategory;
  name: LocalizedText;
  /** One-line sensory/character description (no deterministic taste claims). */
  tagline: LocalizedText;
  origin: LocalizedText;
  cultureNote: LocalizedText;
  equipment: string[];
  /** Illustrative starting recipe; units stated in text. */
  recipe: {
    summary: LocalizedText;
    doseG?: number;
    outG?: number;
    milkMl?: number;
    waterTempNote?: LocalizedText;
    timeNote?: LocalizedText;
  };
  steps: LocalizedText[];
  difficulty: 1 | 2 | 3;
  safetyNotes: LocalizedText[];
  relatedLessonIds: string[];
  sources: string[];
  confidence: Confidence;
}

// ─────────────────────────── learner state ───────────────────────────
export type Goal = 'espresso' | 'pourover' | 'explore';
export type Experience = 'new' | 'some' | 'experienced';
export type DeviceKind = 'pc' | 'phone' | 'headset';

export interface LearnerProfile {
  goal: Goal;
  experience: Experience;
  devices: DeviceKind[];
  /** Equipment ids owned (self-reported). */
  equipment: string[];
  /** Equipment ids the learner is interested in getting. */
  wishlist: string[];
  preferredMode: Mode;
  onboardedAt: string;
}

export interface Preferences {
  locale: Locale;
  sfx: boolean;
  music: boolean;
  /** Generative music mood (matches audio MusicMood). */
  musicMood: 'cafe' | 'focus' | 'lab';
  /** 0..1 */
  volume: number;
  reducedMotion: 'system' | 'on' | 'off';
  /** Color theme; 'system' follows prefers-color-scheme. */
  theme: 'system' | 'light' | 'dark';
  defaultGuidance: Guidance;
  /** Mobile kitchen mode: speak step text aloud when user enables it. */
  speakSteps: boolean;
}

export interface LearningEvent {
  id: string;
  activityId: string;
  lessonId: string;
  mode: Mode;
  guidance: Guidance;
  evidence: EvidenceKind;
  outcome: 'completed' | 'retry' | 'skipped';
  /** 0..1 for assessed answers / simulated tasks; omitted for self-reports. */
  score?: number;
  recordedAt: string;
  notes?: string;
}

/** A real cup the learner made — entirely self-reported. Never auto-filled with invented values. */
export interface BrewLogEntry {
  id: string;
  evidence: 'self_report';
  /** Drink/recipe id or 'espresso' | 'pourover' | free text. */
  drinkId: string;
  activityId?: string;
  createdAt: string;
  doseG?: number;
  outG?: number;
  timeSec?: number;
  grind?: string;
  tasteTags?: string[];
  /** Learner's own 1–5 enjoyment rating. */
  rating?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  /** What the learner plans to change next time (one variable). */
  nextChange?: string;
  /** Previous attempt id if this is an iteration. */
  attemptOf?: string;
}

/** Resumable state of an in-progress real-world guide. */
export interface PracticeSession {
  activityId: string;
  stepIndex: number;
  stepStatus: Record<string, 'done' | 'skipped' | 'help'>;
  guidance: Guidance;
  startedAt: string;
  updatedAt: string;
}

export const LEARNER_STATE_VERSION = 1 as const;

export interface LearnerState {
  version: typeof LEARNER_STATE_VERSION;
  profile: LearnerProfile | null;
  prefs: Preferences;
  /** Append-only transcript (mode-specific); lesson progress is DERIVED from it. */
  events: LearningEvent[];
  journal: BrewLogEntry[];
  activePractice: PracticeSession | null;
  /** Last place the learner was, for "continue". */
  lastLocation?: { route: string; at: string };
}
