# Delivery Report — Coffee Lab · 咖啡实验室

**Status:** working product, P0 scope met in browser (see evidence); XR **hardware-unverified**. This report is updated at each milestone — *last full verification: see "Tests" below.*
**Canonical brief:** `COFFEE_LAB_HANDOFF.md` · decisions: `docs/DECISIONS.md` · state: `docs/EXECUTION_STATE.md` · QA: `reports/QA_LOG.md`.

## What a new user can do
1. **Onboard in ~1 minute** (or skip): goal (espresso / pour-over / explore), experience, devices, owned + wished-for gear, preferred mode, default guidance. Editable later (`Settings → Edit my setup`).
2. **Learn on desktop (2D-first):** a course map of 5 tracks / 24 lessons — 13 core beginner lessons (Coffee literacy, Espresso, Pour-over) and 11 optional (Explore: sensory, dialing-in, origin/processing, roast, water, care; Coffee Culture: origins & legends, coffeehouses, espresso bar, world traditions, waves & specialty). Nine activity kinds: illustrated concept cards, identify parts on original station diagrams, step ordering, misconception-aware quizzes, ratio labs (correct math), an *illustrative* extraction explorer, shot/brew diagnosis scenarios, reflection, plus links to real-world and XR practice. Guided / assisted / independent tiers change hints and feedback.
3. **Learn on a phone:** a different "today" home, touch-sized activities, and **kitchen mode** — a hands-busy real-cup coach with huge Done / Repeat / Help / Back, per-step safety, user-started timers (reference only — a timer never completes a step), optional speech and screen-wake (opt-in), resume after interruption. Everything physical is labeled **self-reported**.
4. **Log real cups:** dose / yield / time / grind / taste tags / own rating → correct ratio, a modest one-change suggestion with a caveat, "log another attempt", side-by-side attempt comparison in the **journal**.
5. **Explore all coffee types:** **Drink Atlas** of 29 drinks (espresso, milk drinks, pour-over, immersion, moka, cold, regional: Turkish, Vietnamese phin, yuenyeung, café de olla, qahwa, …) with origin/culture notes (legends flagged as legends), illustrative recipes, gear you own vs. need, related lessons, and "Make it now" in kitchen mode.
6. **Play Café Counter:** customers order; build 19 drinks from 7 stations; feedback explains *what differs and why* (and spots when you built a different textbook drink); 3 levels (espresso bar, milk classics, world café); tiers; drinks-mastered collection.
7. **XR Lab (optional):** the *espresso-first-shot* mission (13 steps: grab portafilter, dose, tamp, lock in, cup, tare, brew, stop near target yield, serve, knock out, flush) playable in **WebXR** where supported, as a **3D scene with mouse/touch**, or via a **keyboard/screen-reader action list**. Records evidence `simulated` and states what it does not train (grip force, haptics, heat, taste). More missions: see "Known limitations".
8. **Sound & music:** original procedural SFX and generative café music (off by default; mood + volume in Settings).
9. **Offline / install:** production build is a PWA; after the first load lessons, kitchen mode, journal, atlas and settings work offline.
10. **Your data stays on the device:** export / import / reset in Settings; no account, no network calls at runtime.

## How to launch
```sh
npm install
npx playwright install chromium   # only for e2e tests
npm run dev                        # http://localhost:5173
npm run build && npm run preview   # production/PWA at http://localhost:4173
npm run dev:lan                    # phone on same Wi-Fi: http://<PC-IP>:5173 (plain HTTP: no PWA/wake lock/WebXR)
npm test                           # unit tests
npm run test:e2e                   # Playwright desktop 1280×800 + Pixel 7 against a fresh production build
```
Requires Node ≥ 22.22 (built on Node 24.19 / npm 11.17 / Windows 11).

## Tests and supported devices
| Kind | Result | Notes |
|---|---|---|
| Typecheck (`npm run typecheck`) | PASS | app + configs + e2e |
| Unit (`npm test`) | PASS — see EXECUTION_STATE for latest count | domain math, migration/corruption, selectors, activities, practice, journal advice, café specs, XR state machine (incl. 200-seed fuzz), audio no-throw, UI a11y behaviors, content integrity |
| Production build | PASS | Babylon only in lazy `/xr` chunks (e2e-asserted) |
| E2E product suites | PASS on desktop + mobile Chromium | smoke, learn, practice, cafe, offline (PWA) |
| Independent QA gate #1 (`tests/e2e/qa-*`) | 178 pass / 12 skip (2 identical runs) | phone-only + desktop-only scenarios, XR fallback, failure handling, axe WCAG A/AA on 17 screens × themes × viewports, zh pass, content honesty |
| **Real phone** | **NOT TESTED by agents** | user can test via `npm run dev:lan` |
| **XR headset** | **NOT TESTED — no headset available** | WebXR controller code, comfort, frame rate are hardware-unverified; 3D fallback verified in headless Chromium (software WebGL) |
| **Audio by ear** | **NOT HEARD by a human** | only no-throw/scheduling tests and (if present) `reports/AUDIO_QA.md` render metrics |
| Browsers | Chromium only automated | Firefox/Safari not tested |

## Known limitations / missing features
- XR is hardware-unverified; controllers render as simple spheres (no online controller models); hand tracking off.
- No human coffee-expert or native-speaker review of zh/en content; some figures are rules of thumb (labeled) and some history is disputed/legendary (labeled) — see `docs/CONTENT_SOURCES*.md`.
- Taste, extraction and pour models are **illustrative**, never predictions; real-world steps are self-reported, never sensed.
- Secure-context features (PWA, wake lock, WebXR) don't work over plain-HTTP LAN; see README for options (none set up).
- Open QA items: see `reports/QA_LOG.md` (P2s being fixed at time of writing).

## Assets, licensing, content sources
- All illustrations, icons, app icons, 3D props and audio are **original** (hand-written SVG / procedural Babylon meshes / Web Audio synthesis). No third-party images, models, fonts or audio files.
- Dependencies: open-source npm packages (React, react-router, Vite, Babylon.js, Vitest, Playwright, axe-core) under their respective licenses.
- Coffee content written for this project, grounded in sources listed with confidence levels in `docs/CONTENT_SOURCES.md` and `docs/CONTENT_SOURCES_ATLAS.md` (SCA, NCA, ICO, manufacturer and reputable history sources). No long text copied.

## Security / safety
- No secrets, no accounts, no external API calls, no analytics; service worker caches same-origin GETs only.
- Safety notes for hot water, steam, grinders, pressurized brewers and electricity; machine-specific maintenance always deferred to manufacturer manuals; no disassembly/repair instructions.
- No camera/microphone use. Speech output and wake lock are opt-in.

## Run limits / interruptions / time worked
- Single session started 2026-11-07 ~23:25 local, orchestrated by a lead planner with specialist subagents (architect, 2 curriculum, designer, XR, 3 web engineers, QA). No deploys, pushes, purchases or paid APIs.
- Interruptions: none blocking so far. Concurrent-agent Playwright runs collided on a shared port early on → fixed with `E2E_PORT/E2E_DIST/E2E_OUT` isolation.

## Next three improvements
1. Test on the user's real phone (kitchen mode with their espresso machine / pour-over kit) and fix what the real kitchen reveals.
2. Headset verification of the XR controller interactions, comfort and frame rate.
3. Expert + native-speaker review of the zh/en curriculum; then expand dial-in and milk-texture practice.
