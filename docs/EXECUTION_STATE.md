# Execution State — update at EVERY milestone and after compaction

**Mission:** beginner-first Coffee Lab Web app, intentionally different Desktop 2D / Mobile physical copilot / WebXR embodied training experiences, shared learning progress, honest feedback, game feel, real tests.
**Canonical brief:** `COFFEE_LAB_HANDOFF.md` (do not silently modify). **Contracts:** `docs/CONTRACTS.md` + `src/domain/contracts.ts` (lead-owned).
**User answers (2026-11-07):** bilingual zh/en toggle · desktop + phone available, **no headset** · owns espresso machine+grinder & pour-over kit, wants to learn *all* drink types · **music, SFX, coffee culture important** · deps + local commits approved. See `docs/DECISIONS.md`.

## Current phase
**Phase 3 — QA fixes + P1 breadth (2026-11-08 ~01:45).** Commits since af54ea0: `411315b` PWA, `a18b5f2`/`449dec7` PWA notices + mobile toast fix (QA-02/04), `ec1dcad` Café Counter, `eb276e7` QA gate #1 suites (178 pass/12 skip ×2), DELIVERY.md draft (QA-09).
QA gate #1 verdict: P0 met except QA-02 (fixed 449dec7) + QA-09 (draft written). Open P2s QA-01/03/05/06/07/08 assigned.
Running: web fixer (QA-01/03/06/07/08 + lesson resume + small-phone nav), xr-engineer (mission picker + station-tour + pourover-bloom + QA-05 + keep offline/smoke XR steps green), experience-designer (music variety/culture moods, MusicControl, audio render QA).

## Working user-visible flows (evidence = lead re-run at af54ea0)
- [x] Onboarding (skip/edit) and course navigation; desktop course map vs phone "today" home — e2e learn.spec (desktop+mobile)
- [x] Desktop lesson loop: 9 activity kinds, misconception feedback, guidance tiers in sequence/quiz/identify/ratio lab — unit + e2e (wrong→right quiz → completion persists)
- [x] Mobile real-world kitchen guide + brew log + one-change advice + journal (self-reported) — e2e practice.spec (desktop+mobile)
- [~] XR espresso mission: playable via 3D mouse/touch + accessible action list (worker headless-Chromium run); **WebXR VR hardware-unverified**
- [x] Persisted shared progress (reload, resume practice) — e2e
- [x] Drink Atlas (29 drinks, culture notes, gear owned/missing, "Make it now") + culture track via lesson player
- [~] Music + SFX: engine wired to prefs (sfx/music/volume/mood); **never listened to by a human**

## Verification (lead, af54ea0)
- Typecheck: PASS · Unit: PASS 309/309 (31 files) · Build: PASS · E2E: 30 PASS / 2 intentional skips (desktop 1280×800 + Pixel 7, isolated port 4180)
- Actual headset: **NOT TESTED — no headset available (U2)** · Real phone: NOT TESTED by agents (user can via `npm run dev:lan`)

## Next 3 tasks
1. Integrate fixer + XR + audio handbacks → full suite (unit + all e2e incl. qa-*) → commit.
2. Lead: add spatial-practice activities `esp-meet-the-machine-xr` / `po-ratio-bloom-xr` to content; mount MusicControl; extend `musicMood` union if designer adds moods.
3. QA gate #2 on the integrated build; finalize DELIVERY.md numbers.

## Blockers / unverified assumptions
- No headset → XR hardware-unverified by design.
- Phone testing by user requires `npm run dev:lan` on the same LAN (not run by agents).

## Last anti-drift check (Phase 1 start)
1. Usable loop? Not yet (no code). 2. Platform differences? Planned in briefs (desktop 2D, mobile kitchen copilot, XR spatial). 3. Honest physical guidance? Encoded in contracts §9. 4. User-facing value? Phase 1 is foundation + real content in parallel. 5. Done claims? None made. 6. In mission? Yes; breadth expansion (atlas/culture/music) is user-approved (U3).

## Commits / worktrees
- `main`: `1adf53e` (user: handoff package), `d54a7cd` (lead: .gitignore). Single working tree, ownership-separated; no worktrees.
