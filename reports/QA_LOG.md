# QA Log

Owner: quality-guardian (independent verification). Add timestamp, environment, commands, result, specific error, fix commit and retest outcome.
**Never mark XR hardware verification PASS unless an actual compatible headset was tested.** No headset is available (DECISIONS U2): **XR = NOT TESTED ON HEADSET.**

## Environment (2026-11-08 QA gate #1)
- Windows 11 Pro 10.0.26200, Node v24.19.0, TypeScript 7.0.2, Vite 8.3.6, Playwright 1.65.0 (bundled Chromium, headless, software WebGL), @axe-core/playwright 4.14.
- Projects: `desktop-chromium` 1280×800, `mobile-chromium` Pixel 7 (touch, isMobile); UX/zh specs force 390×844 on the mobile project.
- Target under test: **clean `git archive` snapshot of HEAD** (the shared working tree was mid-edit by other workers and did not build at 00:26 — `buildStation` missing export in `src/xr/scene/props.ts`; transient, not a HEAD defect). Gate #1 first ran on `a3d5ac6`, then **re-ran everything on `1afc723`** (PWA commits `5910ff9`, `1afc723` landed during QA). Results below are for `1afc723` unless noted.
- Isolated e2e: snapshot built into `.e2e/dist-qa`, served by `vite preview` on **127.0.0.1:4181**; `E2E_PORT=4181 E2E_DIST=.e2e/dist-qa E2E_OUT=.e2e/out-qa npx playwright test qa-` (Playwright reuses the running server). Raw logs: `.e2e/qa-logs/*.log` (git-ignored).

## Runs

| Timestamp (local) | Target | Command / scope | Result | Evidence / notes |
|---|---|---|---|---|
| 2026-11-08 00:26 | working tree @a3d5ac6 | `npm run typecheck` | PASS | 0 errors |
| 00:26 | working tree @a3d5ac6 | `npx vitest run` | PASS 309/309 (31 files) | jsdom canvas warning only |
| 00:26 | working tree @a3d5ac6 | `npm run build -- --outDir .e2e/dist-qa-build` | PASS | largest chunks: Babylon (XR-only), content 431 kB |
| 00:30 | working tree | Playwright webServer build | **FAIL (transient)** | other worker mid-edit: `MISSING_EXPORT buildStation` (`src/xr/scene/CoffeeLabScene.ts:35`) → switched to HEAD snapshot |
| 00:31–00:45 | snapshot a3d5ac6 | new `qa-*` specs (scenarios, resilience, a11y, content, ux, guidance, edge) | PASS after test-side fixes | product bugs logged below as QA-01, QA-03, QA-05..08 |
| 00:46 | snapshot 1afc723 | `tsc` (both configs) | PASS | |
| 00:46 | snapshot 1afc723 | `vitest run` | PASS 323/323 (33 files) | |
| 00:46 | snapshot 1afc723 | `vite build` | PASS | now emits `sw.js`, `manifest.webmanifest`, `icons/` |
| 00:47 | snapshot 1afc723 | **full** e2e suite (existing + qa) run 1 | 208 pass / 2 fail / 12 skip | `smoke.spec.ts:58` mobile fails → **QA-02**; 1 own-test locator fix |
| 00:50 | snapshot 1afc723 | full e2e run 2 | 212 pass / 5 fail / 13 skip | `smoke.spec.ts:58` mobile again (QA-02, 2/2 runs). `cafe.spec.ts` ×4 = another worker's uncommitted `/cafe` spec vs a HEAD build without that route (not a HEAD bug) |
| 00:52 / 00:54 | snapshot 1afc723 | `qa-` specs ×2 (determinism) | 175 pass / 11 skip, both runs | |
| 00:56 | working tree | `npm run typecheck` after lead report of 4 TS errors in my in-progress QA files | PASS | fixed unused import / type narrowing in `qa-a11y`, `qa-curriculum`, `qa-helpers` |
| 00:57 | snapshot 1afc723 | `qa-` specs (SW blocked except PWA tests) run C / D | 178 pass / run D 1 flake | flake = 3D scene still "Setting up" after 20 s under 10 parallel software-WebGL workers → budget raised to 75 s (assertion unchanged) |
| 01:01 | snapshot 1afc723 | `qa-` specs run E / F (determinism) | **178 pass / 12 skip, both runs** | 12 skips = viewport-scoped tests |
| 01:01 | working tree | `npm run typecheck` | PASS | QA files compile |

Expected-fail markers (`test.fail`) document open bugs; when a bug is fixed the test turns red until the marker is removed: QA-01, QA-02, QA-03, QA-04, QA-07.

## QA test files (owned by quality-guardian)
- `tests/e2e/qa-helpers.ts` — guided-tier solver driven by the shipped content module (explain/sequence/quiz/identify/parameter-lab/diagnose/reflect), keyboard `tabTo` + visible-focus check, XR action-list driver.
- `tests/e2e/qa-scenarios.spec.ts` — §12 smoke scenario: (a) phone-only beginner onboarding → concept → exercise → kitchen guide → log → advice → journal self-reported → reload; (b) desktop-only ratio-lab + diagnosis lessons; (c) XR without `navigator.xr` / rejecting `isSessionSupported` / VR reported but session denied / 3D scene driven by real mouse click via `?xrtest`; mission via action list → `simulated` event → lesson spatial card "Completed in simulation" → reload.
- `tests/e2e/qa-curriculum.spec.ts` — all 13 core lessons (literacy, espresso, pour-over) completed end-to-end in 2D at the guided tier → `13/13` mastered, no real-world step required.
- `tests/e2e/qa-resilience.spec.ts` — corrupted JSON, wrong-shape JSON, throwing localStorage, unknown routes/ids/steps, speech unsupported, wake-lock unsupported, offline (pre-SW and with SW), keyboard-only sequence + quiz with visible focus, reduced motion, dark scheme contrast.
- `tests/e2e/qa-guidance.spec.ts` — tiers change behaviour in quiz, sequence, kitchen mode, XR action list.
- `tests/e2e/qa-edge.spec.ts` — skipping ≠ completion; abandoned guide records nothing; impossible brew numbers rejected; reset; XR exit/resume.
- `tests/e2e/qa-a11y.spec.ts` — axe wcag2a/2aa/21a/21aa on 17 screens × light/dark × desktop/mobile.
- `tests/e2e/qa-content.spec.ts` — safety notes on hazardous guide steps/drinks, illustrative labels, diagnosis caveats, XR limits, no sensing/taste-guarantee claims.
- `tests/e2e/qa-ux.spec.ts` — zh pass (10 screens × 2 viewports), overflow + touch-target audit, evidence screenshots, PWA toast bugs.

## Verified behaviour (automated, 1afc723)
- Onboarding: goal/experience/devices (phone only, no headset)/equipment quick-pick/mode; skip; edit later.
- Learning: 13/13 core lessons completable; events carry correct evidence (`assessed_answer` for checks, `observed_by_app` for viewed cards, `self_report` for reflections; skipped reflection not recorded); progress derived from events survives reload.
- Kitchen mode: big Back/Repeat/Help/Done, "the app can't see your kitchen (self-reported)" always visible, step-level safety callouts at every guidance tier, resume after reload, abandon records nothing, one `self_report` completion per finished session, brew log validation, advice with uncertainty, journal labelled Self-reported.
- XR: no-WebXR / rejecting check / session denied all explained, no crash; mission completable through the keyboard action list on desktop and Pixel 7; completion stored as `simulated`, not `xr` mode; summary lists what was not trained; "Hardware-unverified" copy shown even when VR is reported. **Real headset: NOT TESTED.**
- PWA (1afc723): after "Ready to work offline", never-visited atlas / kitchen guide / lesson / journal / settings open offline and a full offline reload works (desktop + Pixel 7 emulation).
- Accessibility: axe clean except QA-03 on all 17 screens, both themes, both viewports; keyboard-only completion with visible `:focus-visible` ring; reduced motion collapses transitions; dark scheme body/h1 contrast ≥ 4.5:1; no horizontal overflow at 390×844 or 1280×800.
- zh: all 10 key screens render `lang=zh-CN`, Chinese h1, no untranslated English runs.
- Content honesty: taste/"perfect"/"guarantee" claims appear only as wrong quiz options or negated caveats; parameter labs, extraction model ("Illustrative model — not a taste prediction"), diagnosis caveats, XR limits all present; no copy claims the app senses physical actions.

## Open bugs

| ID | Sev | Summary | Exact repro | Environment | Suspected file / owner | Status |
|---|---|---|---|---|---|---|
| QA-02 | **P1** | On phones the PWA "Ready to work offline" toast covers the bottom tab bar and does **not** auto-dismiss after a tap, swallowing navigation taps (regression from `5910ff9`/`1afc723`; breaks existing `smoke.spec.ts:58` on mobile 2/2 runs) | Fresh profile → open `/#/journal` on a phone → tap **Learn** in the bottom bar → within ~5 s the toast appears over the bar at the tap point → wait 20 s: still there (pauses on `mouseenter`, and the emulated pointer rests where you tapped) → tap **Atlas**: intercepted by the toast | Pixel 7 emulation, Chromium (PW 1.65), prod build 1afc723 | `src/ui/primitives/Toast.tsx` (pause on mouseenter for touch), `src/ui/primitives/primitives.css` `.cl-toasts` bottom inset ignores bottom nav; `src/app/PwaNotices.tsx` (lead glue) / experience-designer | OPEN (designer fixing per lead). Evidence: `reports/screenshots/bug-QA-02-offline-toast-covers-bottom-nav-mobile.png`, `bug-QA-02-QA-04-double-offline-toast-home-mobile.png`; `qa-ux.spec.ts` QA-02 |
| QA-04 | P2 | "Ready to work offline" toast is shown **twice** at the same time on first load | Fresh context → open `/` → wait ≤ 5 s → two identical toasts stacked | desktop 1280×800 and Pixel 7, 1afc723 | `src/app/PwaNotices.tsx` (effect re-runs before `acknowledgeOfflineReady` lands; deps include `t`/`toast`) or `usePwaStatus` in `src/platform` / lead + architect | OPEN; `qa-ux.spec.ts` QA-04 |
| QA-01 | P2 (P1 before PWA) | A failed lazy-chunk load is sticky: "Try again" and "Go to home" never recover once the network is back; only a full reload does. Error copy doesn't mention connectivity | Open `/` → go offline **before** the service worker is ready (or any chunk fetch fails, e.g. after a deploy) → open kitchen mode → "Something went wrong" → go online → **Try again** → still error; navigate home → kitchen again → still error | desktop + Pixel 7, 1afc723 (SW blocked to reproduce the pre-SW window) | `src/app/routes.tsx` (`lazy()` caches the rejected import; needs retry wrapper), `src/app/ErrorBoundary.tsx` / platform-architect | OPEN; `qa-resilience.spec.ts` QA-01 |
| QA-03 | P2 | WCAG 2.5.3 Label in Name (axe `label-content-name-mismatch`, on every screen): locale toggle shows "中文"/"EN" but is named "Switch to Chinese"; identify-diagram pins show a number but are named by part (explore mode) | Run axe with `label-content-name-mismatch` on `/#/` and `/#/learn/esp-meet-the-machine?step=2&g=guided` | all viewports/themes | `src/app/AppShell.tsx` ~L120-128 (include visible text in name, e.g. "中文 — Switch to Chinese"); `src/ui/illustrations/StationDiagram.tsx` ~L169-172 / experience-designer | OPEN; `qa-a11y.spec.ts` QA-03 |
| QA-05 | P2 | XR intro footer links are 25 px tall on a phone (spec: ≥ 44 px): "Espresso workflow lesson (2D)", "Back to the espresso lessons" | `/#/xr` at 390×844 → measure the two links under the Callout | Pixel 7 @390×844 | `src/xr/XrRoute.tsx` `.xr-row` links / `src/xr/xr.css` / xr-engineer | CLOSED @ `22c854b` (`xr-missions.spec.ts` measures every link and button on `/xr` pages ≥ 44 px) |
| QA-06 | P2 | UX_SPEC §3 promises diagnose tier behaviour (guided: annotated observations; independent: choose variable **and** reason) — `DiagnoseView` ignores guidance. Not misleading (no tier selector is shown for diagnose), but a spec gap | `/#/learn/esp-diagnosis?step=2&g=independent` vs `g=guided` → identical UI | any | `src/features/activities/DiagnoseView.tsx` / web-product-engineer (or amend UX_SPEC) | OPEN |
| QA-07 | P2 | Unknown journal entry page has no h1 (only an h3 "This cup isn't in your journal") | `/#/journal?entry=does-not-exist` | any | `src/features/journal/EntryDetail.tsx` / web-product-engineer | OPEN; `qa-resilience.spec.ts` QA-07 |
| QA-08 | P2 (copy) | "Core lessons mastered" / "Every lesson is mastered!" counts guided-tier completion with hints shown; an explanatory note exists, but "mastered" overstates. Suggest "completed" (or reserve "mastered" for assisted/independent) | Complete any lesson at guided tier → home | any | `src/features/home/strings.ts` / experience-designer | SUGGESTION |
| QA-09 | **P1 (gate)** | `reports/DELIVERY.md` is still the "NOT YET IMPLEMENTED" template — P0 bullet "truthful DELIVERY.md" not met | open file | — | lead | OPEN |

Not bugs (checked): kitchen-mode stopwatch under the sticky action bar is reachable by scrolling; Atlas cards use a stretched-link overlay (full-card target); `cafe.spec.ts` failures are against a HEAD build without `/cafe`.

## P0 gate verdict (handoff §3) — snapshot 1afc723

| P0 bullet | Verdict | Evidence |
|---|---|---|
| Launchable app + documented install/dev/build/test | PASS | typecheck, 323 unit, build green; README command table |
| Branding, responsive, keyboard/touch accessible | **PARTIAL** | axe clean except QA-03; keyboard path + focus ring; no overflow; **QA-02 blocks phone navigation** |
| Onboarding (goal, experience, devices, equipment, mode; skip; editable) | PASS | `qa-scenarios` (a), `learn.spec` |
| Course map, ≥ 3 complete beginner modules, stable progress | PASS | `qa-curriculum`: 13/13 core lessons, 3 tracks, reload-safe |
| ≥ 3 interactive activity families | PASS | explain, sequence, quiz, identify, parameter-lab, diagnose, reflect |
| Complete espresso path (+ distinct pour-over) | PASS | espresso intro→tools→workflow→ratio→diagnosis→real shot; pour-over track completes |
| Desktop 2D-first | PASS | no canvas on lesson pages; ratio lab/diagnose 2D |
| Mobile real-world assistant (done/help/back, limits, state, resume, optional voice) | PASS | `qa-scenarios` (a), `practice.spec`, speech/wake-lock fallbacks, abandon/resume probes |
| XR scene with one complete action sequence | PASS (simulated, 3D fallback + action list) / **NOT TESTED ON HEADSET** | `qa-scenarios` (c) |
| XR feature detection + graceful fallback, no crash | PASS | absent / rejecting / session-denied cases |
| Guided → assisted → independent in ≥ 2 contexts | PASS | `qa-guidance` (4 contexts) |
| Progress persists; exercise + self-reported cup recorded/resumed/reflected; observed vs self-reported | PASS | `qa-scenarios` (a)(b)(c) storage assertions |
| Unit tests, desktop/mobile smoke, production-build test, honest XR note | **PARTIAL** | all present; existing `smoke.spec.ts` mobile is red at HEAD because of QA-02 |
| README + truthful DELIVERY.md | **FAIL** | QA-09 |

**Gate #1 result: NOT YET MET** — blocked by QA-02 (P1 regression) and QA-09 (DELIVERY.md). Everything else in P0 passes with automated evidence; XR remains hardware-unverified by design.

## Evidence screenshots (`reports/screenshots/`, 1afc723, service workers blocked so no toast)
`home-{desktop-1280,mobile-390}.png`, `lesson-activity-quiz-*.png`, `lesson-activity-ratio-lab-*.png`, `kitchen-mode-step-*.png`, `atlas-detail-*.png`, `xr-intro-*.png`; bug evidence: `bug-QA-02-offline-toast-covers-bottom-nav-mobile.png`, `bug-QA-02-QA-04-double-offline-toast-home-mobile.png`.

## Lead integration — fixes for QA gate #1 (2026-11-08 ~02:20)

| Bug | Severity | Fix commit | Verification |
|---|---|---|---|
| QA-02 offline toast covered mobile nav | P1 | `8509fdf` (toasts top on mobile; offline toast removed; Settings shows offline status) | fixed-behaviour assertions replace `test.fail` in `qa-ux`/`qa-resilience` (`b16810b`); lead re-ran smoke mobile nav ✓ |
| QA-04 double offline toast | P2 | `1afc723`→`8509fdf` | as above |
| QA-09 DELIVERY.md template | P1 | `90306c4` draft; final numbers at end | — |
| QA-01 chunk-load failure no recovery | P2 | `b16810b` `lazyRoute()` retry | `lazyRoute.test.tsx` (5) + QA-01 e2e (marker removed) |
| QA-03 label-in-name (locale toggle, diagram pins) | P2 | `b16810b` | axe rule re-enabled on 17 screens ✓; diagrams.test |
| QA-05 XR intro links 25px on phone | P2 | assigned to xr-engineer (in progress) | pending |
| QA-06 diagnose ignores tiers | P2 | `b16810b` | activities tests (3 new) |
| QA-07 journal unknown entry no h1 | P2 | `b16810b` | QA-07 e2e (marker removed) |
| QA-08 "mastered" overstated | P2 | `b16810b` (mastered = independent-tier checks only) | home/lesson tests |

Lead verification at `b16810b`: typecheck ✓, unit 414/414 ✓, shell + smoke e2e 24 pass / 2 viewport skips ✓. Fixer reported full e2e 230 pass / 14 skip / 0 fail (desktop + mobile) on the integrated tree.

## Final lead verification (2026-11-08 ~04:00) — `main` @ `bb6dc59`

| Check | Result |
|---|---|
| `npm run typecheck` | PASS |
| `npx vitest run` | PASS 480/480 (50 files) |
| `npm run build` | PASS |
| `npx playwright test` (all suites, isolated `E2E_PORT=4199`) | **246 passed, 14 skipped (viewport-scoped), 0 failed** — desktop 1280×800 + Pixel 7 Chromium |
| XR on headset | **NOT TESTED — no headset** |
| Real phone | NOT TESTED by agents |

Open: QA-05 (P2, XR intro links ~25 px on phone) — fix only exists on unverified branch `wip/phase5-unfinished`. QA gate #2 not run (session ended at usage limit).

## User device check (2026-11-08)
| Platform | Result | Evidence | Notes |
|---|---|---|---|
| User's phone via Tailscale HTTPS (`tailscale serve` → `vite preview` @ `c7e9f55` build) | **User-reported: works** | user message "I started the app and it works okay now" | Self-reported by the user; no detailed checklist (kitchen mode, wake lock, offline install, audio) was reported. |

## Publish + live deployment check (2026-11-10)
- User approved: public repo `loOong-Cheng/coffee-lab`, GitHub Pages, MIT, history email rewritten to GitHub noreply (commit IDs in docs remapped).
- Pre-push: typecheck ✓, unit 480/480 ✓, build ✓; history scanned for personal email / tailnet hostname: 0 hits.
- Sub-path smoke (`vite preview --base /coffee-lab/`, desktop 1280×800 + Pixel 7): home, atlas, lesson, culture, café, settings, XR intro render; SW scope `/coffee-lab/`; offline reload of atlas works; 0 console errors; 0 HTTP ≥400.
- Live: GitHub Actions run 42787047434 green; same smoke against https://looong-cheng.github.io/coffee-lab/ — identical PASS on both viewports.
- Notes: Actions warns that checkout/setup-node/configure-pages/deploy-pages v4/v5 target Node 20 (forced to Node 24) — works; bump action majors later. Full Playwright suite was not run against the live URL (tests navigate root-relative).

## Brand language + onboarding card fix, live re-check (2026-11-10)
- `fead40b` brand/title one language at a time; `7a8b1aa` onboarding stacked cards (badge/description overflow, user screenshot). Lead re-check on merged main: typecheck ✓, unit 480/480 ✓, e2e onboarding-layout + learn + shell + qa-a11y + qa-scenarios 102 pass / 4 viewport skips / 0 fail. (One earlier unit run had 4 timeouts under parallel load; all passed on rerun.)
- Force-push of alias-rewritten history (user-approved) → deploy run 42794156327 green.
- Live checks on https://looong-cheng.github.io/coffee-lab/: header brand `Coffee Lab` (en) / `咖啡实验室` (zh), tab title in one language; onboarding mode cards 0 overflow at 1280 and 320 px in en and zh; smoke (routes, SW scope, offline, 0 console/HTTP errors) PASS on desktop + Pixel 7.

## XR missions integration (2026-11-10)
- xr-interaction-engineer finished the picker + station-tour + pourover-bloom + QA-05 on branch `xr-missions` (handback: unit 518/518, e2e 268/14 skip/0 fail on its branch).
- The lead merged `main` into it (one binary screenshot conflict, resolved to the XR version, then regenerated) and re-ran on the merged tree: typecheck ✓ · unit **518/518** (53 files) · build ✓ · full e2e **276 passed / 14 viewport skips / 0 failed** (desktop + Pixel 7, isolated port 4196).
- Lead spot-check: XR events are `simulated`; each new spatial activity has a `limits` text (no grip/weight/heat/taste); pour-over 15 g → 250 g ≈ 1:16.7 matches `po-ratio-bloom`; the new XR activities are not in `checkForUnderstanding`.
- **Not tested:** real headset (WebXR controllers, wrist-tilt pour, in-headset panel, recenter/seated, frame rate) and real phones. The user plans a Quest 3 test via the live site.

## XR merged-mesh fix + cold-run unit flake (2026-11-10)
- User-reported: in 3D the gooseneck kettle had no body. A debugging fork found the cause: `Mesh.MergeMeshes` baked world matrices of already-parented parts, so the station transform was applied twice and the geometry was drawn ~0.9 m off. Affected: kettle body, dripper, portafilter basket, machine trim/steam wand, grinder fork, shelf jars. Fixed in `77bbe0d` (`src/xr/scene/merge.ts` `mergeUnder`), with a new `tests/e2e/xr-geometry.spec.ts` (desktop) that failed before and passes after.
- Lead re-run on that commit: typecheck ✓ · unit 518/518 · full e2e **278 passed / 16 viewport skips / 0 failed**.
- Cold-run flake: App/home/lesson/cafe unit tests timed out only on a cold first `vitest run`. Mitigation: RTL `asyncUtilTimeout` 5 s and vitest `testTimeout` 20 s. After clearing the vite/vitest caches, two consecutive runs were 518/518. The original failure could not be reproduced on demand, so this stays a mitigation, not a proven fix.
- Still hardware-unverified: the fixed meshes have only been seen in headless Chromium (software WebGL), not on a headset.

## Music mood switch fix (2026-11-11)
- User report: "the music does not switch correctly." A debugging fork fixed it in `47425cc` (`src/audio/music.ts`). The old deferred `pendingMood` caused three problems:
  - switching away and straight back played the wrong mood;
  - a stale choice survived `stop()`;
  - the switch waited up to ~5 s for already-scheduled bars to finish.
- Now notes go through per-mood voice gains. A switch fades the old voices out (~0.4 s), and the new mood starts ~0.12 s later. The last choice always wins.
- New `src/audio/music.test.ts` (7 tests, fake AudioContext): 6 of 7 failed before the fix.
- Lead re-run on `47425cc`: typecheck ✓ · unit **525/525** (54 files) · full e2e **278 passed / 16 viewport skips / 0 failed**.
- Lead code review: `setMood` while stopped only records the choice; retired voices are disconnected after 2.5 s; nothing throws from the music path.
- Not verified: audible behavior by a human ear. The fork's headless Web Audio probe measured the new mood at 0.13 s and the old voices at ~1/70 of their level by 0.6 s.

## Music off is instant (2026-11-11)
- User report: "turning off the music takes some time." A debugging fork fixed it in `7985395`. Before, "off" faded the music bus with tc 0.35 s (still audible after a second) and stopped the scheduler only 2 s later. Notes already scheduled ahead kept playing and could come back after a quick off→on.
- Now "off" ramps with `STOP_TC` 0.012 s (about −60 dB in under 0.1 s; the ramp only avoids a click) and calls `music.stop()` at once. `stop()` retires the already-scheduled voices. The fade-in when turning music on is unchanged.
- 2 new unit tests (failed before the fix). The fork's headless Web Audio probe: −165 dB by 100–300 ms after off (was −37 dB).
- Lead review: on → `setMood` + `start()` + fade-in, so a stopped generator restarts.
- Lead re-run on `7985395`: typecheck ✓ · unit **527/527** · full e2e **278 passed / 16 viewport skips / 0 failed**.
- Not verified by a human ear.

## U6 · Coffee brands + Café Rush M1 (2026-11-11)
- **Brands content** (coffee-curriculum, `36490ac`): 35 brands (12 chains, 10 roasters, 13 equipment), sources doc `docs/CONTENT_SOURCES_BRANDS.md`; 20 `verified` / 15 `rule-of-thumb`. Open: some zh brand names need a native check; Cotti HQ reported differently (text says so).
- **Brands UI** (web-product-engineer, `e3f2dd8`): `#/brands`, `#/brands/:id`, links from Atlas + Culture, "Brands known for this" on drink detail. Lead re-run on merged main: typecheck ✓ · unit 551/551 · full e2e **291 passed / 17 viewport skips / 0 failed** (`--workers=6`). Note: 2 unrelated specs (offline setup, learn:112) flaked once each at 12 workers under concurrent agent load and passed when run alone. Treat as load flakiness; watch.
- **Café Rush M1** (xr-interaction-engineer, `c5339b7`): design doc `docs/RUSH_DESIGN.md`, deterministic sim `src/xr/rush/` (shared action API, judging reuses café `evaluate()`/`BUILD_SPECS`, recipe wall derived from `drinks.ts`, compressed game time labelled with real references, evidence `simulated`), 3 bot profiles + tuning harness → `reports/GAME_TUNING.md` (all lead targets met; novice cliff at L2 noted for M2). Lead re-run on merged main: typecheck ✓ · unit **580/580**. No UI yet.
- **Café Rush M2a+M2b** (xr-interaction-engineer, `264f7e9`, `c71b313`): lobby (unlock at ≥1★, Relaxed, tiers), action list (0.5 s per action, not in Relaxed), HUD with patience bars and honest labels, results with per-order why, SFX; 3D counter with mouse/touch through the same reducer. L2 softened: novice ≥1★ 28% → 83%. Lead re-run on merged main `d58fcaf`: typecheck ✓ · unit **590/590** · full e2e **301 passed / 17 viewport skips / 0 failed**. Known: 3D labels are small on phones (the list is the main phone mode). The e2e uses a test-only fast clock (`?xrtest&speed=N`). VR (M2c) in progress.
- **Café Rush M2c VR mode** (xr-interaction-engineer, `5e40946`, **hardware-unverified**): Enter VR only when `immersive-vr` is supported in a secure context (local-floor, controllers only). Trigger acts on the ray target via `actionsForTarget`; grip grabs or carries; release snaps (20/14/10 cm by tier). Headset HUD: left panel, order rail, recipe wall ×1.3, results with Play again. 10 headless mapping tests, including a full espresso via VR inputs. Lead re-run on merged main `57253dd`: typecheck ✓ · unit **600/600** · full e2e **303 passed / 17 viewport skips / 0 failed**. Quest 3 checklist: `docs/RUSH_DESIGN.md` §14.
