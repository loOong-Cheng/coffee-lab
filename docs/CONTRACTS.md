# Coffee Lab — integration contracts (lead-owned)

Workers code against these. Propose changes in your handback; the lead merges. Types live in `src/domain/contracts.ts`.

## 1. File ownership (Phase 1)

| Owner | Paths |
|---|---|
| lead | `src/domain/contracts.ts`, `docs/CONTRACTS.md`, `docs/DECISIONS.md`, `docs/EXECUTION_STATE.md`, `docs/BACKLOG.md` |
| platform-architect | `package.json`, lockfile, root configs, `index.html`, `src/main.tsx`, `src/app/**` (shell/router/layout/ErrorBoundary), `src/state/**`, `src/platform/**`, `src/i18n/**`, `src/domain/**` except contracts.ts, `src/features/*/index.tsx` placeholders, `tests/e2e/**`, `README.md` |
| coffee-curriculum (core) | `src/content/index.ts`, `src/content/sources.ts`, `src/content/tracks/{literacy,espresso,pourover}.ts`, `src/content/content.test.ts`, `docs/CONTENT_SOURCES.md` |
| coffee-curriculum (atlas) | `src/content/equipment.ts`, `src/content/drinks.ts`, `src/content/tracks/{explore,culture}.ts`, `src/content/sources.atlas.ts`, `docs/CONTENT_SOURCES_ATLAS.md` |
| experience-designer | `docs/UX_SPEC.md`, `src/styles/**`, `src/ui/**` (primitives, icons, illustrations), `src/audio/**` |
| xr-interaction-engineer | `src/xr/**` |
| web-product-engineer (Phase 2) | `src/features/**`, `src/app/**` after architect hands over |

Nobody but the architect edits `package.json`. Need a dependency? Ask the lead in your handback.

## 2. Content module shape
Each track file `src/content/tracks/<id>.ts` exports:
```ts
export const track: Track;
export const lessons: Lesson[];
export const activities: Activity[];
```
`src/content/sources.ts` and `src/content/sources.atlas.ts` export `sources: SourceRef[]`.
`src/content/equipment.ts` exports `equipment: Equipment[]`; `src/content/drinks.ts` exports `drinks: DrinkRecipe[]`.
`src/content/index.ts` aggregates and exports `tracks, lessons, activities, sources, equipment, drinks` plus `getLesson(id)`, `getActivity(id)`, `getDrink(id)`, `getEquipment(id)`.
Use **relative imports** inside `src/content` (e.g. `../../domain/contracts`).

### Lesson ids (fixed so tracks can cross-reference)
- literacy: `lit-what-is-coffee`, `lit-tools-safety`, `lit-brewing-concepts`
- espresso: `esp-meet-the-machine`, `esp-workflow`, `esp-ratio-lab`, `esp-diagnosis`, `esp-first-real-shot`, `esp-milk-basics`
- pourover: `po-meet-the-gear`, `po-ratio-bloom`, `po-first-real-cup`, `po-taste-iterate`
- explore (optional): `exp-sensory-basics`, `exp-dialing-in`, `exp-origin-processing`, `exp-roast-levels`, `exp-water`, `exp-cleaning-care`
- culture (optional): `cul-origins-legends`, `cul-coffeehouses`, `cul-espresso-bar`, `cul-world-traditions`, `cul-waves-specialty`

Activity ids: `<lessonId>-<slug>`, globally unique.
**XR mission activity (fixed):** id `esp-workflow-xr`, lessonId `esp-workflow`, kind `spatial-practice`, `missionId: 'espresso-first-shot'`, supportedModes `['xr','desktop','mobile']`.

### Equipment id baseline (atlas worker must define ALL of these in the catalog; others may only reference these unless the lead adds more)
`espresso-machine, grinder, burr-grinder-hand, portafilter, basket, tamper, distribution-tool, scale, timer, cup, espresso-cup, mug, milk-pitcher, thermometer, knock-box, towel, kettle, gooseneck-kettle, dripper, paper-filter, carafe, chemex, french-press, aeropress, moka-pot, cold-brew-jar, ibrik, phin, siphon, milk-frother, water-filter`

## 3. State API (`src/state/index.ts`, architect)
```ts
export function useLearner<T>(selector: (s: LearnerState) => T): T;
export function getLearnerState(): LearnerState;
export const learnerActions: {
  setProfile(p: LearnerProfile): void;
  updatePrefs(patch: Partial<Preferences>): void;
  recordEvent(e: Omit<LearningEvent, 'id' | 'recordedAt'>): LearningEvent;
  addJournalEntry(e: Omit<BrewLogEntry, 'id' | 'createdAt' | 'evidence'>): BrewLogEntry;
  updateJournalEntry(id: string, patch: Partial<Omit<BrewLogEntry, 'id' | 'evidence'>>): void;
  deleteJournalEntry(id: string): void;
  startPractice(activityId: string, guidance: Guidance): void;
  updatePractice(patch: Partial<PracticeSession>): void;
  endPractice(): void;
  setLastLocation(route: string): void;
  resetAll(): void;
};
```
Persistence: localStorage key `coffee-lab:state`, versioned (`version`), migration + corrupted-data recovery, works when storage is unavailable.
Derived selectors (pure, in `src/state` or `src/domain/progress.ts`): lesson status from events, completed activity ids, next recommended lesson.

## 4. i18n API (`src/i18n/index.ts`, architect)
```ts
export function useI18n(): { locale: Locale; setLocale(l: Locale): void; t(text: LocalizedText): string };
```
UI strings are **colocated** `LocalizedText` constants in each feature (no shared dictionary file → no merge collisions): `const S = { start: { zh: '开始', en: 'Start' } }` → `t(S.start)`.

## 5. Platform API (`src/platform/index.ts`, architect)
```ts
export function detectCapabilities(): Promise<CapabilityProfile>; // never throws; navigator.xr optional
export function useCapabilities(): CapabilityProfile | null;
export function suggestMode(c: CapabilityProfile): Mode;
```

## 6. Audio API (`src/audio/index.ts`, experience-designer)
See the exported `AudioEngine` interface in that file (stub committed by lead). Consumers call `audio.play('correct')` etc. The app shell syncs `prefs.sfx/music/volume` → engine and calls `audio.unlock()` on first user gesture. Music is **off by default**.

## 7. Design tokens (`src/styles/tokens.css`, experience-designer)
CSS custom properties consumers may rely on:
`--color-bg, --color-surface, --color-surface-2, --color-text, --color-text-muted, --color-border, --color-accent, --color-accent-contrast, --color-crema, --color-success, --color-warning, --color-danger, --color-info, --color-focus`,
`--font-body, --font-display, --font-mono`, `--text-xs … --text-3xl`, `--space-1 … --space-8`, `--radius-sm, --radius-md, --radius-lg, --radius-pill`, `--shadow-1, --shadow-2`, `--dur-fast, --dur-med, --ease-out`, `--tap-min` (44px), `--tap-kitchen` (64px).
Theme: light default + dark via `prefers-color-scheme` and `[data-theme]` on `<html>`. Reduced motion via `@media (prefers-reduced-motion)` and `[data-reduced-motion="on"]` on `<html>`.

## 8. Routes (one router, architect)
`/` home (course map; redirects to onboarding if no profile) · `/onboarding` · `/learn/:lessonId` lesson player · `/practice/:activityId` real-world guide (kitchen mode) · `/journal` · `/atlas` and `/atlas/:drinkId` · `/xr` (lazy, `src/xr/XrRoute.tsx` default export) · `/settings` · 404.

## 9. Evidence honesty rules (everyone)
- Quiz/sequence/identify/diagnose/parameter-lab answers → `assessed_answer`.
- Explain/reading cards paged through → `observed_by_app` (UI says "viewed" — it is NOT evidence of understanding). Reflections → `self_report`.
- Real-world guide: ONE `completed` event per finished session (`evidence: 'self_report'`, `mode: 'real-world-guide'`), not one per step. Atlas drink practice uses `activityId: 'drink:<drinkId>'`, `lessonId: ''`.
- Brew log `drinkId`: real drink id (e.g. `espresso-shot`) when known; display resolves drink → activity title → raw text.
- XR or 3D task completion detected by the app's own collision/rules → `simulated` (it's a simulation) — never "real skill".
- Real-world guide steps and brew logs → `self_report`; UI labels them "self-reported".
- `observed_by_app` only for things the app truly measured (e.g. a timer the user ran in-app).
- Any simulated extraction/taste output carries an "illustrative model" label.
