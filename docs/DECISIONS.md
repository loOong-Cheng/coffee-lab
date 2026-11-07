# Decisions — Coffee Lab

**The canonical user request is `COFFEE_LAB_HANDOFF.md`.** Record first-round answers and implementation decisions here, without rewriting the brief.

## First-round user answers (2026-11-07, single clarification batch)

| # | Question | User answer (verbatim intent) | Replaces default |
|---|---|---|---|
| U1 | UI/content language | **Bilingual zh + en with a toggle** | Default was Chinese-first, English-ready |
| U2 | Devices available for testing | **Desktop browser (Chrome/Edge) + phone (iPhone/Android). No headset.** | — XR therefore stays **hardware-unverified** |
| U3 | Equipment owned | **Espresso machine + grinder, pour-over kit.** "I want to learn how to make all different types of coffees… devices I don't have yet is fine, I can buy them. **Music and sound effects and coffee culture are important.**" | Default was none/generic |
| U4 | Permissions | **Yes:** install open-source npm deps locally; local git commits. No push/deploy/paid APIs. | — |

## Decisions log

| Date/time | Decision | Rationale / evidence | Alternatives considered | User-approved? |
|---|---|---|---|---|
| 2026-11-07 | All user-facing text is `LocalizedText {zh, en}`; UI has a zh/en toggle; default locale = browser language (zh if `zh*`, else en) | U1 | Chinese-only with English later | **Yes (U1)** |
| 2026-11-07 | Curriculum breadth expanded: besides espresso + pour-over core paths, add a **Drink Atlas** (espresso drinks, milk drinks, immersion/pressure/cold/regional methods) with equipment ownership marks ("I own / not yet"), plus a **Coffee Culture** track | U3 ("learn all different types of coffees", "coffee culture important") | Only espresso + pour-over | **Yes (U3)** — scope interpretation by lead |
| 2026-11-07 | **Music + SFX are first-class:** original procedural Web Audio (no third-party audio files → no licensing risk): ambient café music generator + interaction SFX; mutable, volume controls, off by default until a user gesture, respects reduced-motion/quiet prefs | U3 + brief §6/§7 asset licensing | Licensed audio packs (license risk, size) | **Yes (U3)**; implementation choice by lead |
| 2026-11-07 | Physical practice defaults to the user's owned gear (espresso machine + grinder, pour-over kit); other methods show "you'll need: …" equipment notes; all physical completion is `self_report` | U3 + invariant 7 | — | Yes (U3) |
| 2026-11-07 | Stack: **TypeScript + Vite + React**, **Babylon.js** (`@babylonjs/core`, lazy-loaded only on the XR route) for WebXR, **Vitest** unit tests, **Playwright** (Chromium) smoke tests, npm | Babylon: TS-native npm package, mature `WebXRDefaultExperience` (controllers, pointer selection, near interaction), same scene drivable by mouse for a non-headset fallback & automated test; PlayCanvas's main strength (cloud editor) is unusable here. One renderer only. | PlayCanvas engine; three.js + custom XR glue | Lead decision (stack default in brief) |
| 2026-11-07 | Lead owns the shared domain contract `src/domain/contracts.ts`; workers propose changes, lead merges | Prevents parallel workers forking types | Each worker defines own types | Lead decision |
| 2026-11-07 | No headset available → XR implemented and tested via headless state-machine tests + mouse/non-immersive fallback in desktop browser; labeled **hardware-unverified** | U2 + brief §7/§12 | — | Yes (U2) |
| 2026-11-07 | Local commits on `main` at each integrated, tested milestone; no remote push | U4 | — | **Yes (U4)** |
| 2026-11-07 | AI/LLM tutoring: not in scope tonight; deterministic authored content works offline | Brief §7, no keys | Optional server adapter | Provisional default |
| 2026-11-07 | Versions (architect-verified installable): TypeScript 7.0.2 (native tsc), Vite 8.3.6, React 19.3, react-router 8.5.1 (**HashRouter**, lazy routes), Vitest 5.1, jsdom 31, Playwright 1.65 (Chromium desktop 1280×800 + Pixel 7 projects), Babylon.js 9.35 (deep imports, `/xr` chunk only). Node ≥ 22.22. No state library (`useSyncExternalStore` store). Fallback: react-router@7.18.5 has same APIs | Latest stable at build time; e2e asserts Babylon not downloaded outside `/xr` | zustand; BrowserRouter (needs server rewrites) | Lead decision |
| 2026-11-07 | Lesson **completion** = every `checkForUnderstanding` activity has a `completed` event (empty list → all). `checkForUnderstanding` may only list screen-completable activities, never `guided-practice`/`spatial-practice`, so single-platform learners can finish lessons | Architect contract proposal; invariant 4 (any single platform must be complete) | Require real-world practice for completion | Lead decision |
| 2026-11-07 | Added `Preferences.theme: 'system'|'light'|'dark'` (contract + migration validator + `<html data-theme>`) | Architect proposal; dark kitchen/night use | — | Lead decision |

Add decisions as implementation proceeds. Never describe an unasked default as explicit user approval.
