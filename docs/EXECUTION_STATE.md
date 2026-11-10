# Execution State — update at EVERY milestone and after compaction

**Mission:** beginner-first Coffee Lab Web app, intentionally different Desktop 2D / Mobile physical copilot / WebXR embodied training experiences, shared learning progress, honest feedback, game feel, real tests.
**Canonical brief:** `COFFEE_LAB_HANDOFF.md` (do not silently modify). **Contracts:** `docs/CONTRACTS.md` + `src/domain/contracts.ts` (lead-owned).
**User answers (2026-11-07):** bilingual zh/en toggle · desktop + phone available, **no headset** · owns espresso machine+grinder & pour-over kit, wants to learn *all* drink types · **music, SFX, coffee culture important** · deps + local commits approved. See `docs/DECISIONS.md`.

## Current phase
**Post-session (2026-11-10):** published with user approval — public repo https://github.com/loOong-Cheng/coffee-lab (`main` only; `wip/phase5-unfinished` local only) and live app https://looong-cheng.github.io/coffee-lab/ (Pages workflow green, live smoke PASS). History rewritten to noreply email before first push; commit IDs in docs remapped. Generator-pipeline lessons recorded in `docs/GENERATOR_LESSONS.md` (L1 just-in-time profiling, L2 budget/auto-resume). No app code changes.

**SESSION ENDED (2026-11-08 ~04:00)** — account 5-hour usage limit hit (HTTP 429 on workers) and user asked to conclude. `main` @ `bb6dc59` is green and runnable.
Final lead verification @ bb6dc59: typecheck ✓ · unit 480/480 ✓ · build ✓ · **e2e 246 passed / 14 viewport-scoped skips / 0 failed** (desktop 1280×800 + Pixel 7).
**Unfinished work saved on branch `wip/phase5-unfinished` (`b29f0c8`, NOT verified, NOT merged):** XR mission picker + station-tour + pourover-bloom (XR scene refactor in progress; includes QA-05 fix attempt and edits to offline/qa-scenarios specs), glossary UI (`src/features/glossary`, route + ExplainView/LessonIntro wiring) — glossary DATA (`src/content/glossary.ts`) never written. Content-consistency fixes from that branch were verified and merged to main (`bb6dc59`).

## Working user-visible flows (evidence = lead re-run at 5aaacfd)
- [x] Onboarding (skip/edit) and course navigation; desktop course map vs phone "today" home — e2e learn.spec (desktop+mobile)
- [x] Desktop lesson loop: 9 activity kinds, misconception feedback, guidance tiers in sequence/quiz/identify/ratio lab — unit + e2e (wrong→right quiz → completion persists)
- [x] Mobile real-world kitchen guide + brew log + one-change advice + journal (self-reported) — e2e practice.spec (desktop+mobile)
- [~] XR espresso mission: playable via 3D mouse/touch + accessible action list (worker headless-Chromium run); **WebXR VR hardware-unverified**
- [x] Persisted shared progress (reload, resume practice) — e2e
- [x] Drink Atlas (29 drinks, culture notes, gear owned/missing, "Make it now") + culture track via lesson player
- [~] Music + SFX: engine wired to prefs (sfx/music/volume/mood); **never listened to by a human**

## Verification (lead, 5aaacfd)
- Typecheck: PASS · Unit: PASS 309/309 (31 files) · Build: PASS · E2E: 30 PASS / 2 intentional skips (desktop 1280×800 + Pixel 7, isolated port 4180)
- Actual headset: **NOT TESTED — no headset available (U2)** · Real phone: NOT TESTED by agents (user can via `npm run dev:lan`)

## Next 3 tasks (on resume)
1. `git checkout wip/phase5-unfinished`; resume/finish XR phase 3 (picker + 2 missions + QA-05) and make full suite green; write `src/content/glossary.ts`, finish glossary UI; merge to main only after typecheck/unit/build/full e2e pass.
2. Independent QA gate #2 (quality-guardian) on the merged build; refresh `reports/screenshots/`.
3. Human-in-the-loop items: real phone kitchen test, headset test, listen to `reports/audio/`, expert/native review.

## Blockers / unverified assumptions
- No headset → XR hardware-unverified by design.
- Phone testing by user requires `npm run dev:lan` on the same LAN (not run by agents).

## Last anti-drift check (2026-11-08 ~03:10)
1. Usable beginner loop now? **Yes** — onboarding → lessons (9 activity kinds, tiers) → kitchen mode real cup → journal → next step; Café Counter, Atlas, Culture Explorer.
2. Platforms genuinely different? **Yes** — desktop course map/2D labs; phone "today" home + kitchen mode + timers; XR spatial missions (hardware-unverified).
3. Honest physical guidance? **Yes** — self-report everywhere; only app-timed seconds are `observed_by_app`; models labeled illustrative; legends flagged.
4. User-facing value vs abstraction? Last 2 hours shipped user features (Café, culture, companions, audio); no generator abstraction work.
5. Done claims evidenced? Lead re-runs typecheck/unit/targeted e2e before each commit; full QA gate #2 pending.
6. Next work in mission? Yes — XR missions (brief §5 XR-only learner), consistency + glossary (beginner jargon, §4), then QA gate #2 + delivery.

## Commits / worktrees
- `main`: `e259d34` (user: handoff package), `0e8ab25` (lead: .gitignore). Single working tree, ownership-separated; no worktrees.
