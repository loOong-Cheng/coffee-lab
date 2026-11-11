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

## QA gate #2 (2026-11-11) — Coffee Brands + Café Rush, `main` @ `d465b99`

Owner: quality-guardian (independent). Scope: the U6 features only, i.e. brands and the Café Rush lobby, action list, 3D counter and WebXR gate. This is a bounded gate, not an exhaustive audit.

### Environment
- Windows 11 Pro 10.0.26200, Node v24.19.0, Playwright 1.65 (bundled Chromium, headless, software WebGL), @axe-core/playwright 4.14.
- Projects: `desktop-chromium` 1280×800 and `mobile-chromium` Pixel 7 (touch, isMobile). Locales: en and zh.
- Production build in `.e2e/dist-qa`, served by `vite preview` on 127.0.0.1:4209: `E2E_PORT=4209 E2E_DIST=.e2e/dist-qa E2E_OUT=.e2e/out-qa npx playwright test --workers=6`. Raw logs, playtest JSON and screenshots are in `.e2e/qa2-logs/` (git-ignored).
- **No headset, no real phone, no human first-time player, no screen-reader software.** Live regions were observed in the DOM only.

### Runs

| Check | Result | Evidence |
|---|---|---|
| `npm run typecheck` | PASS, also after adding the QA specs | `.e2e/qa2-logs/typecheck.log` |
| `npx vitest run` | PASS 600/600 (60 files) | `.e2e/qa2-logs/unit.log` |
| `vite build` | PASS | `.e2e/qa2-logs/build.log` |
| New `qa-rush` + `qa-brands`, both viewports | PASS, including 10 expected-fail bug markers | `.e2e/qa2-logs/run4.log` |
| **Full e2e suite**, existing + new | **342 passed / 40 viewport skips / 0 failed** (4.4 min) | `.e2e/qa2-logs/full.log` |
| WebXR on a headset | **NOT TESTED — no headset** | — |

Expected-fail markers (`test.fail`) document the open bugs below. A fix turns a marker red until it is removed. The markers are QA-R01 to QA-R08, QA-B01 and QA-B02. QA-R09 to QA-R12 and QA-B03 have no marker. `reports/screenshots` was restored after the runs.

### Real-speed playtests (no fast clock)

A scripted "guided first-timer" played whole shifts through the action list at real speed:
- It reacts to each new "Suggested next step" after 1.4–2.2 s, which is between the novice bot (1.9 s) and the average bot (1.3 s).
- It never misreads or misclicks, so a real first-timer will do worse.
- An in-page probe sampled the HUD every 250 ms (about 500–580 samples per shift) and recorded every live-region announcement.

There were two passes per configuration (run 1 · run 4):

| Shift | Stars | Points / menu value | Served (textbook) / left / open at close | First serve (real s) | Idle with no suggestion | Leave cue on screen | While-brews hint shown | Ticket off-screen while acting | Live-region announcements |
|---|---|---|---|---|---|---|---|---|---|
| L1 desktop en | 2★ · 2★ | 184/180 · 188/180 | 5/0/1 · 5/0/1 | 33.0 · 34.7 | 0% · 2% | 34.8 s (4×) · 24.0 s (4×) | 30% · 31% | n/a · 40% | 0 · 1 |
| L2 desktop en | **1★ · 1★** | 99/240 (41%) · 144/250 (58%) | 2/**2**/2 · 3/**2**/1 | 42.0 · 41.7 | 0% · 0% | 44.8 s (3×) · 50.0 s (3×) | 24% · 24% | n/a · 28% | 2 · 2 |
| L1 Pixel 7 zh | 1★ · 2★ | 109/180 · 187/180 | 3/1/2 · 5/0/1 | 36.8 · 33.5 | 1% · 2% | 31.3 s (4×) · 27.3 s (4×) | 31% · 31% | n/a · **100%** | 2 · 1 |

Notes on the table:
- Each shift took about 120 s (L1) or 143 s (L2) of real play. The rest of the game time, 30–37 s, is the +0.5 s list cost on 60–74 actions.
- The hints had 8–21 distinct texts per shift.
- "Ticket off-screen while acting" was only measured in run 4.

What the playtests show:
- **Waiting is controlled.** The coach always has a next step (idle 0–2%). The hints teach overlapping concretely, for example "While the shot runs: Pick up Portafilter (empty) (group 2)".
- **The first serve comes after about 33–42 s.** In the guided tier the highlighted step is visible at t = 0, so a first-timer can start within seconds.
- **L1 is fine. L2 is tight at a human pace.** Both L2 passes ended at 1★ with 2 walk-outs, and the leave cue was on screen for 45–50 s of about 143 s (QA-R09).
- **Patience bars and the leave cue are clear only when visible.** They were never on screen while acting on the phone (QA-R02), and off screen 28–40% of the time on desktop (QA-R05).
- **Results explain wrong builds (what and why) and the star rule, but not walk-outs** (QA-R11).
- **Screen-reader feedback is nearly silent:** 0–2 announcements for 3–5 serves (QA-R01).

### Verified (PASS)

**Honesty**
- The lobby honesty callout, the HUD "Simulated" badge, "game time — real shot ≈ 25–35 s" and "Time left (game time)" show in en and zh on both viewports.
- The results show "Saved as simulated practice" and "What this does not train".
- A regex scan found no skill, taste or sensing claims in the lobby, HUD, wall or results.
- Events are recorded as `simulated`.

**Recipe wall vs `src/content/drinks.ts`**
- All 18 L5 wall entries match the Atlas: dose, out and milk are equal, and the ratio equals the rounded out ÷ dose.
- See QA-R03 and QA-R04 for what the wall says and what it leaves out.

**Relaxed mode**
- There is no countdown, no patience bar and no seconds, and tips stay at 0. The shift ends after 8 serves.
- Finishing L1 unlocks L2. "Best: n ★" and the unlock survive a reload on both viewports, and L3 stays locked.

**Keyboard**
- Tab reaches "Play with the action list".
- Six actions in a row can be done with Tab and Enter only.
- P pauses and resumes.

**axe (wcag2a/aa, 21a/aa)**
- 0 violations on the HUD mid-shift with the wall open and the pause dialog showing, in en and zh, light and dark, desktop and Pixel 7.
- The lobby and results are covered by `xr-rush.spec`.

**Phone targets**
- Every control in the lobby, the HUD, the open wall and the results is at least 44 px on Pixel 7.

**3D counter**
- On Pixel 7, a tap on the cup shelf opens the cup choices.
- On desktop, a click on group 1 picks up the portafilter (`xr-rush.spec`).

**WebXR gate**
- Without `navigator.xr`: no VR offer (`xr-rush.spec`).
- With `navigator.xr` present but `isSessionSupported` rejecting (new test): no "Enter VR", the game plays on, and nothing crashes.

**Brands**
- All 35 detail pages, in en and zh, show "Checked in 2026" / "信息核对于 2026 年" and the no-affiliation disclaimer.
- Every `safetyNote` is rendered.
- There is no CJK in the body of en pages.
- Links work:
  - Atlas latte → Starbucks → Cappuccino;
  - every brand → lesson link opens a real lesson;
  - an unknown brand id shows not-found with a way back;
  - Culture → Brands.

**Brand fact spot-check against `docs/CONTENT_SOURCES_BRANDS.md`**
- No overclaim was found. "Firsts" are attributed to the company, and there are no store counts or rankings.
- Starbucks: founded 1971 in Seattle, Pike Place; Short / Tall / Grande / Venti are 8 / 12 / 16 / 20 oz (iced Venti 24 oz); a Caramel Macchiato is a vanilla latte marked with espresso.
- Luckin: founded 2017, based in Xiamen; the 2023 Moutai latte is described as "contains a little liquor".
- Cotti: founded 2022; the Fuzhou first store is marked "reportedly", and the headquarters is given as "reports differ".
- Manner: started 2015 in a window of about 2 m² on Nanyang Road; the discount amount is left out of the body text.
- UCC: founded 1933 in Kobe; the 1969 can is called "the company's claim".
- Bialetti: workshop 1919, Moka Express 1933, with a pressure safety note.
- Timemore: founded July 2012; "most sources" place it in Shanghai.

### Open bugs (gate #2)

| ID | Sev | Summary | Exact repro | Environment | Suspected file / owner | Status |
|---|---|---|---|---|---|---|
| QA-R01 | **P1** | The action list is labelled "keyboard / screen reader", but in Standard mode a serve result is **not announced**. A whole L1 shift with 5 textbook serves gave 0–1 live-region messages. New orders, the "About to leave!" cue and overheated milk are never announced in any mode. | Fresh profile → `#/xr?game=rush` → Play with the action list → serve one espresso → watch `[data-cl-announcer]`: nothing. Control: the same in Relaxed announces the serve. | desktop + Pixel 7, prod `d465b99` | `src/xr/rush/sim.ts` `listAct()` (L884–889) runs `tick(INPUT_COST)` after the serve, so the guard `f.atMs === s.tMs` in `src/xr/rush/ui/RushGame.tsx` L231–243 never matches. `order-in` and `warn` feedback is not passed to `announce()`. Owner: xr-engineer | OPEN; `qa-rush` QA-R01 + Relaxed control |
| QA-R09 | **P1** | **Tuning gap.** Action-list play adds +0.5 s of game time per action, but the tuning bots never pay it (`harness.ts` and `bots.ts` never call `listAct`). `GAME_TUNING.md` therefore overstates list-mode playability by about 20% of a shift, and the list is the phone and keyboard/screen-reader mode. At real speed, a flawless guided player at about 1.8 s per action got L2 1★ twice (41% and 58%), with 2 walk-outs each time. | Real-speed L2 through the action list (table above), or rerun the harness with `listAct` | desktop 1280×800, prod | `src/xr/rush/config.ts` `INPUT_COST`; `src/xr/rush/harness.ts`, `bots.ts`. Tune with the list cost, or drop or halve it at L1–L2. Owner: xr-engineer | OPEN; data in `.e2e/qa2-logs/playtest-L2-desktop-en.json` |
| QA-R02 | **P1** | On a phone, the order tickets (patience bar, "About to leave!") and the HUD timer are **off-screen 100% of the time while you act**. The tickets sit about 500 px above the action list, so triage needs constant scrolling. | Pixel 7 → L1 → Play with the action list → scroll to the suggested step → the ticket is not in the viewport | Pixel 7, en + zh | `src/xr/rush/ui/RushGame.tsx`: single-column order Tickets → Bench → Feedback → Actions → Wall; `rush.css` `@media (max-width: 760px)`. A sticky compact ticket strip would fix it. Owner: experience-designer + xr-engineer | OPEN; `qa-rush` QA-R02 |
| QA-R07 | **P1** | The user's goal "real ratios on the wall" is invisible in normal 2D play. The wall is a **closed `<details>`** at the bottom of the right column: below the fold on desktop, about 1,400 px down on a phone. Tickets show only the drink and the customer, although `RUSH_DESIGN.md` §9 says the guided tier shows the wall entry on the ticket. A guided player can finish a shift without ever seeing a ratio. | L1 guided → play following the suggestions → "1:2" is never rendered unless "Recipe wall" is opened | all | `RushGame.tsx` `Tickets` (L388–422) and `Wall` (L548–568). Owner: xr-engineer | OPEN; `qa-rush` QA-R07 |
| QA-R03 | **P1** | The recipe wall misleads on two drinks. It shows "Yuenyeung · milk ≈50 ml" and "Vietnamese iced coffee · milk ≈25 ml" with no pitcher mark, while the textbook Rush build takes **no milk**: milk tea or condensed milk are extras, and the café spec accepts only `milk: none`. A learner who follows the wall adds milk and loses points. | Seed L1–L4 stars → L5 → open the wall → read those two lines | all | `RushGame.tsx` `Wall` L560 prints the Atlas `milkMl` whenever it exists. Fix: name it evaporated or condensed milk, or hide it when the build has `milk === 'none'` (`src/xr/rush/drinks.ts` `recipeWall`). Owner: xr-engineer + coffee-curriculum | OPEN; `qa-rush` QA-R03 |
| QA-R04 | **P1** | The game-time labels give a real reference **only for the espresso shot**. `PROCESS.*.real` is never rendered: steaming, kettle, bloom, pour-over 2:30–4:00, phin 4–5 min, ristretto and lungo. Only `overheatReal` appears, inside a feedback message. The wall also leaves out `timeNote`. At L4 a phin brews in 16 s with no real reference. This contradicts `RUSH_DESIGN.md` §4 and §10. | L4 → Play with the action list → open the wall → search the page for "4–5 min" or "2:30–4:00": not there | all | `RushGame.tsx` `Bench` (process rows) and `Wall`; the wall lines in `RushScene.tsx`. Owner: xr-engineer | OPEN; `qa-rush` QA-R04 |
| QA-R08 | **P1** (user rule) | **One language at a time** is broken in zh Rush. Drink names carry Latin glosses in the lobby, tickets, wall, results and action labels, e.g. 意式浓缩（Espresso）, 朗戈（Lungo，长萃浓缩）, 浓缩（长萃 Lungo）. There are 27 such zh names in `drinks.ts`, so the problem is Atlas-wide. The lobby eyebrow is also hard-coded as "XR Lab". | zh → `#/xr?game=rush` → read the level cards and the tickets | zh, all viewports | `src/content/drinks.ts` `name.zh`; `RushGame.tsx` L128; `SHOT_STYLE_TEXT` in `features/cafe/strings`. Owner: coffee-curriculum; the lead should confirm that the rule covers drink names | OPEN; `qa-rush` QA-R08 |
| QA-R05 | P2 | Desktop: a new shift keeps the lobby's scroll position. The Play buttons are at y ≈ 1,146 px on an 800 px viewport, so the HUD timer and the tickets start off-screen; the timer was off-screen 37–42% of the shift. Focus also drops to `<body>`. | 1280×800 → `#/xr?game=rush` → scroll down → Play with the action list → the timer is above the viewport, and `activeElement` is `body` | desktop | `RushGame.tsx` `RushPlayer` mount: no `scrollTo` and no focus move. Owner: xr-engineer | OPEN; `qa-rush` QA-R05 |
| QA-R06 | P2 | When paused, focus stays on the HUD Pause button and does not move into the pause dialog. The full-screen overlay also covers the recipe wall, so a paused learner cannot study the recipes. | Play → Pause → focus stays on the HUD Pause button; a click on "Recipe wall" is intercepted by the overlay | desktop | `RushGame.tsx` L316–323; `.rush-paused` in `rush.css`. Owner: xr-engineer | OPEN; `qa-rush` QA-R06 |
| QA-R10 | P2 | Lobby copy does not match the game. The "How to play" card (`R.options`) holds only settings and no instructions. The shared tier texts promise features Rush lacks: Assisted says "Hints stay folded until you ask", but Rush has no hint button; Independent says "feedback comes at the end", but Rush shows feedback live. | Open `#/xr?game=rush` and read the card | all | `src/xr/rush/strings.ts` `R.options`; `RushGame.tsx` L172–179 (generic `GuidanceSelector` copy). Owner: experience-designer | OPEN |
| QA-R11 | P2 | Results: "Customer left" rows have no why and no tip, unlike wrong builds. The points line ("144 points of 250 menu value") leaves out the % that the star rule uses ("1★ ≥ 40% …"). | Let a customer time out → results → "Order by order" | all | `RushGame.tsx` `Results` L593 and L615–631. Owner: xr-engineer | OPEN |
| QA-R12 | P2 | 3D counter on a phone: the canvas is 356×200 CSS px, and the station labels and the 3D recipe wall are only a few pixels tall, so they cannot be read. A tap on a target with no valid action shows only its name, not why nothing happened. Taps do work. This is already known, and the list is the phone mode. | Pixel 7 → Play on the 3D counter (screenshot `.e2e/qa2-logs/3d-pixel7.png`) | Pixel 7 | `src/xr/rush/ui/RushScene.tsx` (the empty-target note); `scene/rushScene.ts` labels. Owner: xr-engineer | OPEN (known) |
| QA-B01 | P2 | The brand "Sources" lists (collapsed) show raw `SourceRef` strings. 34 of 35 zh pages show English titles and author notes, such as "Not fetched … Needs verification." and "The app never gives …". The en pages for saturnbird and yongpu show Chinese titles. The Manner note shows "5 yuan in several reports", the amount `CONTENT_SOURCES_BRANDS.md` says the app deliberately omits. | zh → `#/brands/manner` → open "资料来源" | all | `src/content/sources.brands.ts` notes; `src/features/brands/BrandDetail.tsx` L170–188. Owner: coffee-curriculum | OPEN; `qa-brands` QA-B01 |
| QA-B02 | P2 | Safety notes are inconsistent. Melitta (drippers, hot water), Comandante and Timemore (hand grinders, burrs) have no `safetyNote`, while Kalita and HARIO (hot water, glass) and Baratza (burrs) do. | `#/brands/melitta` vs `#/brands/kalita` | all | `src/content/brands.ts`. Owner: coffee-curriculum | OPEN; `qa-brands` QA-B02 |
| QA-B03 | P2 | zh brand text mixes scripts. The zh `BRAND_DISCLAIMER` says "Coffee Lab", but the zh app name is 咖啡实验室. Latin names also appear inside zh prose: "Alfonso Bialetti 的金属作坊", and "Short：…" in the Starbucks menu decoder. | zh → any brand → disclaimer | zh | `src/content/brands.ts` L52–55 and the bialetti and starbucks entries. Owner: coffee-curriculum | OPEN |

Not bugs (checked):
- There are no dead ends: Back to lobby, Play again and Next level are always available.
- The action list offers only valid actions, so list mode has no confusing rejections.
- Stars from Relaxed and Standard both count for unlocks, by design (`record.ts`).
- End shift records a 0★ `retry` event and does not lower the best score.

### New test files (quality-guardian)
- `tests/e2e/qa-rush.spec.ts`:
  - real-speed playtests (`@realspeed`, about 2.5 min each), with probe JSON written to `.e2e/qa2-logs/playtest-*.json`;
  - first-time read in en and zh;
  - recipe wall = `drinks.ts`;
  - no-claims scan;
  - Relaxed mode, unlock and reload;
  - keyboard play;
  - axe on HUD and pause in en/zh × light/dark;
  - phone targets;
  - 3D on a phone;
  - WebXR gate with a throwing `isSessionSupported`;
  - a Relaxed announcement control;
  - markers QA-R01 to QA-R08.
- `tests/e2e/qa-brands.spec.ts`:
  - sweep of all 35 brand pages in en and zh (asOf, disclaimer, safety, language);
  - link round trips;
  - lesson links;
  - markers QA-B01 and QA-B02.

### Not tested
- **Real headset: NOT TESTED ON HEADSET.** This covers the immersive session, controllers, grip and trigger, haptics, readability of the in-headset HUD and wall, recenter and seated mode, and frame rate.
- Real phones, a human first-time player (a scripted guided player stands in), real screen-reader software, and audio/SFX.

### QA gate #2 fixes (2026-11-11)
- Content (`4e54ea9`, `c745a0c`, `7168206`): QA-R08 fixed, 29 zh names now one language, plus ~30 teaching-text glosses reworded; content test guards zh names and titles. QA-B01/B02/B03 fixed: brand safety notes on all equipment brands, zh sources without English notes, zh disclaimer 咖啡实验室, en source titles in English.
- Café Rush (`273e740`): QA-R01 to R07 and R10, R11 fixed: polite announcements; list cost waived L1–L2 and L2 patience ×2.4; `human-list` bot; sticky ticket strip on phone; key ratios on tickets and the wall open on desktop; correct component labels (evaporated/condensed milk); a game-vs-real time legend for every process; focus, inline pause, accurate lobby copy, walk-out reasons.
- Lead re-run on merged main `bcde8ed`: typecheck ✓ · unit **612/612** · full e2e **344 passed / 42 viewport skips / 0 failed**.
- Open (follow-up): list mode L3–L5 still hard at human pace (human-list ≥1★ 28/20/3%); real-speed L2 e2e uses a random seed; desktop tickets scroll away during long action lists.
