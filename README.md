# Coffee Lab · 咖啡实验室

A beginner-first coffee learning game built as **one web app** with intentionally different experiences:

- **Desktop** — 2D concept learning: illustrated lessons, step ordering, ratio lab, diagnosis.
- **Mobile** — touch-first lessons plus a hands-busy **real-cup coach** for your own espresso machine / pour-over kit (completion is always *self-reported*).
- **Also:** a Drink Atlas of 29 drinks, a Café Counter order game, a Coffee Culture Explorer (map + timeline), a brew journal, and original generative café music + sound effects (off by default).
- **WebXR (optional)** — an immersive espresso-station practice scene for headsets that support `immersive-vr`. Never required; every device without XR gets a working 2D alternative.

Bilingual UI (中文 / English toggle). Progress is stored locally in your browser (no account, no server, no network calls at runtime). Canonical product brief: `COFFEE_LAB_HANDOFF.md`.

**Try it:** https://loong-cheng.github.io/coffee-lab/ (GitHub Pages, HTTPS — works on phones, installable, offline after first load). Deployed from `main` by `.github/workflows/deploy-pages.yml`.

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
| `npm run preview` | Serve the production build at <http://localhost:4173> (offline-capable PWA) |
| `npm run preview:lan` | Build, then serve the production build to your phone on the same Wi-Fi (`http://<your-PC-IP>:4173`) |
| `npm run test:e2e` | Browser smoke tests (Playwright Chromium, desktop 1280×800 + Pixel 7 mobile) against a fresh production build on port 4173 |
| `npm run check` | typecheck + unit tests + production build |

First-time setup:

```sh
npm install
npx playwright install chromium   # only needed for npm run test:e2e
npm run dev
```

`npm run test:e2e` builds and serves the app itself. Locally it reuses a server already running on port 4173 — stop any stale `npm run preview` first so you test the current build. To run beside other test runs, isolate port and folders: `E2E_PORT=4182 E2E_DIST=.e2e/dist-pwa E2E_OUT=.e2e/out-pwa npx playwright test`.

### Offline / install (PWA)

Production builds (`npm run build`, `npm run preview`, any static host) register a service worker (`dist/sw.js`) and a web app manifest, so Coffee Lab can be **installed** ("Add to Home Screen" / "Install app") and keeps working **offline after the first load**: course map, lessons, kitchen mode, journal, Drink Atlas and settings. Progress was already stored on the device.

- `npm run dev` never uses a service worker (and removes one left on that origin by an earlier preview), so development is never served stale files.
- The 3D/XR engine (Babylon.js, ~2 MB) is **not** downloaded up front. It is cached the first time you open the XR Lab's 3D scene while online; offline before that, the XR Lab still opens and offers its action-list version of the mission.
- New versions install in the background and wait; the page reloads only when you accept the update (the app surfaces this when wired; otherwise closing all Coffee Lab tabs also switches versions). After rebuilding locally, expect the previous build until then.
- Only Coffee Lab's own files are cached; nothing cross-origin is intercepted or cached. Old caches are deleted when a new version activates.
- Service workers need a **secure context** (HTTPS or `localhost`), see below.

### Phone & headset notes (LAN, HTTP vs HTTPS)

- `npm run dev:lan` / `npm run preview:lan` serve **plain HTTP** on your LAN IP. Lessons, the real-cup coach and the journal work fine there, but browsers disable **secure-context** features on `http://192.168.x.x`: **no offline/PWA install** (no service worker), **no screen wake lock** in kitchen mode, and **no WebXR** (the XR Lab explains this and offers 3D / action-list play). Speech features may be limited too.
- **Easiest HTTPS on a phone:** open the GitHub Pages site above.
- To test those features on a phone you need HTTPS or `localhost`. Options — **none are set up by this project; use them only with your own approval**:
  - **Android + USB (local, no third party):** enable USB debugging, then `adb reverse tcp:4173 tcp:4173` and open `http://localhost:4173` on the phone — it counts as `localhost`, so secure-context features work.
  - **Chrome flag (local testing only):** `chrome://flags/#unsafely-treat-insecure-origin-as-secure` on the phone, add `http://<your-PC-IP>:4173`. Remove it afterwards.
  - **Tailscale (tailnet-only HTTPS, used during development):** enable *HTTPS Certificates* in the Tailscale admin DNS page, run `npx vite preview --host 127.0.0.1 --port 4173` and `tailscale serve --bg 4173`, then open `https://<machine>.<tailnet>.ts.net/` on the phone. `*.ts.net` is already allowed in `vite.config.ts`. Turn off with `tailscale serve reset`.
  - **Public HTTPS tunnels** (e.g. Cloudflare Tunnel, ngrok) expose your dev machine to the internet and need your own account; not recommended unless you understand and accept that.
  - **Self-signed HTTPS** via a local certificate requires installing/trusting that certificate on the phone.
- No headset was available during development: XR is **hardware-unverified** (see `reports/DELIVERY.md`).

## Project layout

```
src/
  main.tsx            entry: styles, <html> attributes, React root
  app/                shell: header/nav, routes (hash router), ErrorBoundary, 404, placeholders
  domain/             contracts.ts (shared types, lead-owned), brew math, progress selectors
  state/              versioned learner state (localStorage `coffee-lab:state`), migration, actions
  i18n/               useI18n(), locale detection, LocalizedText helpers
  platform/           capability detection (touch, speech, wake lock, WebXR), suggestMode(), PWA/service worker
  content/            curriculum, equipment, drinks (data only)
  features/           route pages: home, onboarding, lesson (+ activities), practice (kitchen mode),
                      journal, atlas (Drink Atlas), cafe (Café Counter game), culture (map + timeline), settings
  ui/ styles/ audio/  design system, tokens, procedural sound
  xr/                 WebXR route (Babylon.js, lazy-loaded only on /xr)
public/               web app manifest + original app icons (SVG sources, PNG renders)
tests/e2e/            Playwright suites: smoke, shell, learn, practice, cafe, culture, offline + independent QA (qa-*)
reports/              QA log, delivery report, screenshots, audio QA (+ WAV previews in reports/audio/)
```

Key architecture decisions and integration contracts: `docs/DECISIONS.md`, `docs/CONTRACTS.md`.

## Architecture in brief

- **Vite + React + TypeScript**, one hash-routed SPA (`#/learn/...`) so `dist/` works on any static host or sub-path without server rewrites. Every page is a lazily loaded chunk.
- **Babylon.js** (`@babylonjs/core`, `@babylonjs/gui`, WebGL 2) is imported **only** by the `/xr` route chunk; an e2e test guards that it is not downloaded elsewhere.
- **Learner state** is a single versioned object persisted synchronously to `localStorage`. Corrupted saves are backed up (`coffee-lab:state:corrupt-backup`) and repaired, never silently dropped; if storage is unavailable (private mode) the app keeps working in memory and tells the user progress won't be saved. Lesson progress is *derived* from an append-only event log with evidence provenance (`assessed_answer`, `observed_by_app`, `self_report`, `simulated`).
- **Offline:** a dependency-free service worker generated at build time (`src/platform/sw/sw.template.js` + the `coffee-lab:service-worker` plugin in `vite.config.ts`) precaches the app shell and every non-Babylon chunk with a content-hash version; registration/update status lives in `src/platform/pwa.ts` (`usePwaStatus()`).
- **Capability detection** never throws: missing `navigator.xr`, rejected/hanging `isSessionSupported`, and insecure origins all resolve to "no XR" with a reason.
- **Hash routing caveat for contributors:** don't use in-page `href="#id"` anchors (they would change the route); move focus programmatically instead (see the skip link in `src/app/AppShell.tsx`).

## License

MIT — see `LICENSE`. All illustrations, icons, 3D props and audio are original to this project (hand-written SVG, procedural Babylon.js meshes, Web Audio synthesis); third-party npm dependencies keep their own licenses.
