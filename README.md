# Coffee Lab · 咖啡实验室

A beginner-first coffee learning game built as **one web app** with intentionally different experiences:

- **Desktop** — 2D concept learning: illustrated lessons, step ordering, ratio lab, diagnosis.
- **Mobile** — touch-first lessons plus a hands-busy **real-cup coach** for your own espresso machine / pour-over kit (completion is always *self-reported*).
- **WebXR (optional)** — an immersive espresso-station practice scene for headsets that support `immersive-vr`. Never required; every device without XR gets a working 2D alternative.

Bilingual UI (中文 / English toggle). Progress is stored locally in your browser (no account, no server, no network calls at runtime). Canonical product brief: `COFFEE_LAB_HANDOFF.md`.

## Requirements

- **Node.js ≥ 22.22** (developed and tested on Node 24.19, npm 11.17, Windows 11)
- npm (the only package manager used)
- For end-to-end tests: Playwright's Chromium (`npx playwright install chromium`, one-time)

## Commands

| Command | What it does |
|---|---|
| `npm install` | Install dependencies (one-time) |
| `npm run dev` | Dev server at <http://localhost:5173> |
| `npm run dev:lan` | Dev server reachable from your phone on the same Wi-Fi (`http://<your-PC-IP>:5173`) |
| `npm run typecheck` | TypeScript type-check (app + configs + e2e) |
| `npm test` | Unit tests (Vitest + jsdom) |
| `npm run build` | Type-check + production build into `dist/` |
| `npm run preview` | Serve the production build at <http://localhost:4173> |
| `npm run test:e2e` | Browser smoke tests (Playwright Chromium, desktop 1280×800 + Pixel 7 mobile) against a fresh production build on port 4173 |
| `npm run check` | typecheck + unit tests + production build |

First-time setup:

```sh
npm install
npx playwright install chromium   # only needed for npm run test:e2e
npm run dev
```

`npm run test:e2e` builds and serves the app itself. Locally it reuses a server already running on port 4173 — stop any stale `npm run preview` first so you test the current build.

### Phone & headset notes

- `npm run dev:lan` serves plain HTTP. Lessons and the real-cup coach work fine over HTTP, but browsers only expose **WebXR on secure origins** (HTTPS or `localhost`), so the XR Lab will show its "not available here" explanation when opened via a LAN IP. Wake-lock and speech features may also be limited on insecure origins.
- No headset was available during development: XR is **hardware-unverified** (see `reports/DELIVERY.md`).

## Project layout

```
src/
  main.tsx            entry: styles, <html> attributes, React root
  app/                shell: header/nav, routes (hash router), ErrorBoundary, 404, placeholders
  domain/             contracts.ts (shared types, lead-owned), brew math, progress selectors
  state/              versioned learner state (localStorage `coffee-lab:state`), migration, actions
  i18n/               useI18n(), locale detection, LocalizedText helpers
  platform/           capability detection (touch, speech, wake lock, WebXR), suggestMode()
  content/            curriculum, equipment, drinks (data only)
  features/           route pages (home, onboarding, lesson, practice, journal, atlas, settings)
  ui/ styles/ audio/  design system, tokens, procedural sound
  xr/                 WebXR route (Babylon.js, lazy-loaded only on /xr)
tests/e2e/            Playwright smoke tests
```

Key architecture decisions and integration contracts: `docs/DECISIONS.md`, `docs/CONTRACTS.md`.

## Architecture in brief

- **Vite + React + TypeScript**, one hash-routed SPA (`#/learn/...`) so `dist/` works on any static host or sub-path without server rewrites. Every page is a lazily loaded chunk.
- **Babylon.js** (`@babylonjs/core`, `@babylonjs/gui`, WebGL 2) is imported **only** by the `/xr` route chunk; an e2e test guards that it is not downloaded elsewhere.
- **Learner state** is a single versioned object persisted synchronously to `localStorage`. Corrupted saves are backed up (`coffee-lab:state:corrupt-backup`) and repaired, never silently dropped; if storage is unavailable (private mode) the app keeps working in memory and tells the user progress won't be saved. Lesson progress is *derived* from an append-only event log with evidence provenance (`assessed_answer`, `observed_by_app`, `self_report`, `simulated`).
- **Capability detection** never throws: missing `navigator.xr`, rejected/hanging `isSessionSupported`, and insecure origins all resolve to "no XR" with a reason.
- **Hash routing caveat for contributors:** don't use in-page `href="#id"` anchors (they would change the route); move focus programmatically instead (see the skip link in `src/app/AppShell.tsx`).
