# Delivery Report — Coffee Lab · 咖啡实验室

**Status (updated 2026-11-10):** working product on `main` @ `22c854b`, live at https://looong-cheng.github.io/coffee-lab/; P0 scope met in browser with automated evidence; XR Lab now has 3 missions, **hardware-unverified**. The glossary (UI only, no data) stays parked on local branch `wip/phase5-unfinished`.
**Canonical brief:** `COFFEE_LAB_HANDOFF.md` · decisions: `docs/DECISIONS.md` · state: `docs/EXECUTION_STATE.md` · QA: `reports/QA_LOG.md`.

## What a new user can do
1. **Onboard in ~1 minute** (or skip): goal (espresso / pour-over / explore), experience, devices, owned + wished-for gear, preferred mode, default guidance. Editable later (`Settings → Edit my setup`).
2. **Learn on desktop (2D-first):** a course map of 5 tracks / 24 lessons — 13 core beginner lessons (Coffee literacy, Espresso, Pour-over) and 11 optional (Explore: sensory, dialing-in, origin/processing, roast, water, care; Coffee Culture: origins & legends, coffeehouses, espresso bar, world traditions, waves & specialty). Nine activity kinds: illustrated concept cards, identify parts on original station diagrams, step ordering, misconception-aware quizzes, ratio labs (correct math), an *illustrative* extraction explorer, shot/brew diagnosis scenarios, reflection, plus links to real-world and XR practice. Guided / assisted / independent tiers change hints and feedback.
3. **Learn on a phone:** a different "today" home, touch-sized activities, and **kitchen mode** — a hands-busy real-cup coach with huge Done / Repeat / Help / Back, per-step safety, user-started timers (reference only — a timer never completes a step), optional speech and screen-wake (opt-in), resume after interruption. Everything physical is labeled **self-reported**.
4. **Log real cups:** dose / yield / time / grind / taste tags / own rating → correct ratio, a modest one-change suggestion with a caveat, "log another attempt", side-by-side attempt comparison in the **journal**.
5. **Explore all coffee types:** **Drink Atlas** of 29 drinks (espresso, milk drinks, pour-over, immersion, moka, cold, regional: Turkish, Vietnamese phin, yuenyeung, café de olla, qahwa, …) with origin/culture notes (legends flagged as legends), illustrative recipes, gear you own vs. need, related lessons, and "Make it now" in kitchen mode.
6. **Play Café Counter:** customers order; build 19 drinks from 7 stations; feedback explains *what differs and why* (and spots when you built a different textbook drink); 3 levels (espresso bar, milk classics, world café); tiers; drinks-mastered collection.
7. **Brew companions (phone, real gear):** espresso shot stopwatch (carries the measured seconds into the log as "Timed in app" — the only app-measured value; the rest is self-reported), pour-over pour-schedule companion ("a schedule, not a measurement"), and a dial-in chart (time vs ratio, illustrative zone, table alternative) in the journal.
8. **Coffee Culture Explorer (`/culture`):** original hand-drawn world map with 34 places (origins, producers, coffeehouse cities, drink cultures) and a 37-event history timeline; legends and disputed dates badged; colonial/enslaved-labour history stated factually; optional matching music mood.
9. **XR Lab (optional):** a mission picker with three missions:
   - **station-tour:** meet and place the tools at an espresso counter;
   - **espresso-first-shot:** 13 steps, from grabbing the portafilter to the final flush;
   - **pourover-bloom:** rinse, 15 g dose, tare, bloom, staged pours to 250 g ≈ 1:16.7, illustrative pour model.

   Each mission can be played three ways: in **WebXR** where supported, as a **3D scene with mouse/touch**, or via a **keyboard/screen-reader action list**. Guidance tiers (guided / assisted / independent) change the cues. Every result is recorded as evidence `simulated`, and each mission states what it does not train: grip, weight, heat, taste, real pour control. Deep links: `#/xr?mission=<id>`. Each mission is also linked from its lesson as an optional activity.
9b. **Coffee Brands (`#/brands`):** 35 major brands (café chains, roasters/capsule/instant, equipment makers; global + Chinese) with what each is known for, what a beginner can learn, menu decoders where well sourced, links to drinks, lessons and equipment, sources, an "as of" year, and a no-affiliation note. No logos.
9c. **Café Rush (XR Lab game, `#/xr?game=rush`):** an Overcooked-style coffee bar.
   - Serve customers different drinks from one counter.
   - The recipe wall shows real ratios from the curriculum. Brewing uses compressed, labelled game time.
   - Patience and arrival rate tighten over 5 levels. Relaxed mode has no timers.
   - Guidance tiers include "while that brews" hints. Results explain what differed.
   - Playable via the action list (keyboard/phone), the 3D counter (mouse/touch) and WebXR (**hardware-unverified**).
   - Difficulty is tuned with bot players: `reports/GAME_TUNING.md`.
10. **Sound & music:** original procedural SFX and a generative café-music composer (off by default) with 6 moods incl. culture-inspired bossa / kissa / espresso-bar; header music control; WAV previews in `reports/audio/` (`reports/AUDIO_QA.md`).
11. **Offline / install:** production build is a PWA; after the first load lessons, kitchen mode, journal, atlas and settings work offline.
12. **Your data stays on the device:** export / import / reset in Settings; no account, no network calls at runtime.

## How to launch
**Live (GitHub Pages, HTTPS):** https://looong-cheng.github.io/coffee-lab/ · source: https://github.com/loOong-Cheng/coffee-lab (MIT). Deployed from `main` by `.github/workflows/deploy-pages.yml` (unit tests + typecheck + build on every push).

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
| Typecheck (`npm run typecheck`) | PASS @ 22c854b | app + configs + e2e |
| Unit (`npm test`) | PASS 518/518 (53 files) @ 22c854b | domain math, migration/corruption, selectors, activities, practice, journal advice, café specs, XR state machine (incl. 200-seed fuzz), audio no-throw, UI a11y behaviors, content integrity |
| Production build | PASS | Babylon only in lazy `/xr` chunks (e2e-asserted) |
| E2E — all suites (`npx playwright test`) | **276 passed / 14 skipped / 0 failed** @ 22c854b (desktop 1280×800 + Pixel 7; skips are viewport-scoped tests) | smoke, shell, learn, practice, brew, cafe, culture, offline (PWA), onboarding-layout, xr-missions (picker, deep links, list + 3D playthroughs, WebXR gate, QA-05) + independent QA suites |
| Independent QA gate #1 (`tests/e2e/qa-*`) | 178 pass / 12 skip (2 identical runs); bugs QA-01…09 fixed except QA-05 | | phone-only + desktop-only scenarios, XR fallback, failure handling, axe WCAG A/AA on 17 screens × themes × viewports, zh pass, content honesty |
| **Real phone** | **User-reported: works** (2026-11-08, opened via Tailscale HTTPS `tailscale serve` → `vite preview`) | reported by the user, no detailed checklist; not tested by agents |
| **Live GitHub Pages site** | PASS (2026-11-10) — deploy workflow green; scripted smoke on desktop + Pixel 7 (Chromium): 7 routes render, service worker scope `/coffee-lab/`, offline reload works, 0 console errors, 0 HTTP errors | not re-run: full Playwright suite against the live URL (suite assumes root path); same build passes it locally |
| **XR headset** | **NOT TESTED — no headset available** | WebXR controller code, comfort, frame rate are hardware-unverified; 3D fallback verified in headless Chromium (software WebGL) |
| **Audio by ear** | **NOT HEARD by a human** | only no-throw/scheduling tests and (if present) `reports/AUDIO_QA.md` render metrics |
| Browsers | Chromium only automated | Firefox/Safari not tested |

## Known limitations / missing features
- XR is hardware-unverified; controllers render as simple spheres (no online controller models); hand tracking off.
- No human coffee-expert or native-speaker review of zh/en content; some figures are rules of thumb (labeled) and some history is disputed/legendary (labeled) — see `docs/CONTENT_SOURCES*.md`.
- Taste, extraction and pour models are **illustrative**, never predictions; real-world steps are self-reported, never sensed.
- Secure-context features (PWA, wake lock, WebXR) don't work over plain-HTTP LAN; see README for options (none set up).
- QA-05 is closed. All links and buttons on the `/xr` pages measure at least 44 px on Pixel 7, checked by `xr-missions.spec.ts`.
- **Parked on local branch `wip/phase5-unfinished` (NOT merged):** glossary page + inline term help (UI started; glossary data file not written), `docs/CONTENT_CONSISTENCY.md` report. This is not being continued without a user request.
- On touch screens the 3D pour-over uses the side-panel pour controls; there is no tilt gesture in the scene. 3D e2e runs on a software-rendered (CPU) WebGL and is run serially.
- Independent QA gate #2 on the final build was not run; the lead's final full e2e run is the last evidence.
- Music loudness: focus/lab/kissa moods are 2–4 LU quieter than others; mixes may sound dull on phone speakers (needs a human listen).
- A real phone, Safari/Firefox, and screen readers (NVDA/VoiceOver) were not tested.

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
- Ended 2026-11-08 ~04:00 local when the account's **5-hour usage limit** was hit (HTTP 429 on two running workers) and the user asked to conclude. Roughly 4.5 h of active work; not a continuous 8 h.
- Concurrent-agent Playwright runs collided on a shared port early on → fixed with `E2E_PORT/E2E_DIST/E2E_OUT` isolation.

## Next three improvements
1. **Headset test on the user's Quest 3** of all 3 XR missions via the live site; then fix what it finds. Then run an independent QA gate #2.
2. Real-world check on the user's phone with their espresso machine / pour-over kit (`npm run preview:lan`, or `adb reverse` for secure-context features) and a headset test of the XR controller code.
3. Human review: listen to `reports/audio/` WAVs and even out mood loudness; expert + native-speaker review of the zh/en curriculum and culture claims.
