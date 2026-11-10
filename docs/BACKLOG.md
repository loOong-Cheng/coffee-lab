# Prioritized delivery backlog

Mark each item only with linked evidence, not intuition. P0 first. Subagents may add subtasks but must not demote P0 without the lead documenting why.
Status: DONE / PARTIAL / TODO / BLOCKED.

## P0 — end-to-end product
- [x] DONE — Working Vite/TypeScript web app with build/typecheck/test commands — `b7eb4af`; lead re-ran typecheck/test/build/e2e green
- [x] DONE (pending QA) — Branded accessible responsive UI, onboarding and course map — `79c723e` + `c6ab8d4`; e2e learn.spec desktop+mobile
- [x] DONE (pending QA) — ≥3 complete beginner modules — 13 core lessons playable `c6ab8d4`
- [x] DONE (pending QA) — Complete Espresso path (machine → workflow → ratio lab → diagnosis → first real shot → milk) `c6ab8d4`
- [x] DONE (pending QA) — Desktop 2D: station diagrams w/ hotspots, sequence, ratio/extraction labs, diagnose `c6ab8d4`
- [x] DONE (pending QA) — Mobile kitchen mode + self-reported brew log + journal `c6ab8d4` (e2e practice.spec)
- [x] DONE (hardware-unverified) — XR espresso mission 13 steps, fallback 3D + action list `bcbd945` (46 tests)
- [x] DONE (pending QA) — Guidance tiers: sequence/quiz/identify/ratio lab, kitchen mode, XR
- [x] DONE (pending QA) — Shared local persistence, provenance (CONTRACTS §9), recovery, export/import/reset `c6ab8d4`
- [x] DONE — Unit 480 ✓, e2e 246 pass/0 fail (incl. independent QA suites), build ✓ @ `e6e7293`
- [x] DONE — Sources/safety docs, README, final `reports/DELIVERY.md`

## P1 — after P0 stable
- [x] DONE (pending QA) — Complete pour-over path — 4 lessons playable + kitchen guide `c6ab8d4`
- [x] DONE (pending QA) — Espresso fault diagnosis — 7 scenarios with best/reasonable/unhelpful feedback + caveats `c6ab8d4`
- [x] DONE — Tasting tags + attempts compare in journal `c6ab8d4`; sensory side-by-side guide in explore track
- [ ] PARTIAL — Animations/audio/comfort — SFX + music wired to prefs incl. mood `c6ab8d4` (unheard by a human)
- [ ] PARTIAL — Cross-mode recommendations: home is mode-conditioned (desktop map vs phone 'today', XR support shown honestly); no explicit cross-device suggestion engine
- [x] DONE — zh/en everywhere; offline PWA `36c5ab8`; axe WCAG A/AA on 17+ screens (screen readers not tested by a human)
- [x] DONE (pending QA) — **User-requested breadth (U3):** Drink Atlas UI (29 drinks, culture notes, gear owned/missing, make-it) + culture/explore tracks `c6ab8d4`
- [x] DONE — Café Counter: 19 drinks, 3 levels, tiers, explanatory feedback `647b24d`
- [x] DONE — Offline/PWA (hand-written SW, offline e2e) `36c5ab8`
- [x] DONE (unheard by a human) — Culture-inspired music moods bossa/kissa/bar + generative composer + render QA `e788750` (`reports/AUDIO_QA.md`)
- [ ] TODO (P2) — Even out quieter moods (focus/lab/kissa are 2–4 LU below others); human listening pass on phone speakers

## Unfinished (branch `wip/phase5-unfinished`, not verified)
- [ ] PARTIAL — XR mission picker + station-tour + pourover-bloom missions; QA-05 XR phone link size
- [ ] PARTIAL — Glossary page + inline term help (UI started; data file missing)
- [ ] PARTIAL — Content consistency report `docs/CONTENT_CONSISTENCY.md` (fixes merged `e6e7293`; report not written)
- [ ] TODO — Independent QA gate #2

## P2 — optional if time
- [ ] TODO — Data-only future skill schema validation and example generator prompt (apply `docs/GENERATOR_LESSONS.md`, e.g. L1 just-in-time profiling)
- [ ] TODO — Real device integration interface (no unsupported claimed hardware access)
- [ ] TODO — More elaborate coffee lab missions, content breadth and optional LLM adapter
- [ ] TODO — Human expert review of zh/en coffee content (cannot be done by agents)
