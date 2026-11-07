# Prioritized delivery backlog

Mark each item only with linked evidence, not intuition. P0 first. Subagents may add subtasks but must not demote P0 without the lead documenting why.
Status: DONE / PARTIAL / TODO / BLOCKED.

## P0 — end-to-end product
- [x] DONE — Working Vite/TypeScript web app with build/typecheck/test commands — `0928779`; lead re-ran typecheck/test/build/e2e green
- [ ] PARTIAL — Branded accessible responsive UI, onboarding and course map — tokens/primitives/diagrams `6e4ddbd`; screens in progress (web A)
- [ ] PARTIAL — At least three complete coffee beginner modules — content for 13 core lessons `16552d5` (31 integrity tests); needs UI (web A)
- [ ] PARTIAL — Complete Espresso beginner path with real interactive activities — content done; activity UI in progress (web A)
- [ ] TODO — Desktop-specific 2D/diagram/animation learning interactions — web A
- [ ] TODO — Mobile touch-specific real-world practice guide with self-report and notes — web B
- [ ] TODO — XR scene with meaningful grab/attach/progress sequence, fallback if unavailable — xr-engineer (state machine in progress)
- [ ] TODO — Guidance reduction in at least two contexts — web A (sequence/quiz), web B (kitchen mode), XR tiers
- [x] DONE (infra) — Shared local persistence, progress provenance, recovery — `src/state` migrate/corruption/storage-unavailable tests; UI wiring pending
- [ ] PARTIAL — Unit tests, desktop/mobile smoke, build green, no fatal core bugs — infra + shell smoke only
- [ ] PARTIAL — Sources/safety, README, honest delivery report — CONTENT_SOURCES(+_ATLAS).md done; README initial; DELIVERY TODO

## P1 — after P0 stable
- [ ] PARTIAL — Complete pour-over path — content done (4 lessons incl. real-cup guide + iterate diagnose)
- [ ] PARTIAL — Espresso fault diagnosis challenge with branches — content: 7 scenarios; UI pending
- [ ] TODO — Sensory/tasting journal and repeat attempts — web B (journal + attemptOf)
- [ ] PARTIAL — Satisfying animations/audio/comfort controls — procedural SFX + music engine `6e4ddbd` (unheard by a human); wiring pending
- [ ] TODO — Cross-mode recommendations based on user capability
- [ ] PARTIAL — Localization (zh/en done in content + shell), offline/PWA TODO, extended accessibility audit TODO
- [ ] PARTIAL — **User-requested breadth (U3):** Drink Atlas 29 drinks + 39 equipment + culture track content `16552d5`; Atlas UI in progress (web B)
- [ ] TODO — Culture-linked music moods (e.g. espresso bar / kissaten / ceremony) — idea for user's music+culture interest

## P2 — optional if time
- [ ] TODO — Data-only future skill schema validation and example generator prompt
- [ ] TODO — Real device integration interface (no unsupported claimed hardware access)
- [ ] TODO — More elaborate coffee lab missions, content breadth and optional LLM adapter
- [ ] TODO — Human expert review of zh/en coffee content (cannot be done by agents)
