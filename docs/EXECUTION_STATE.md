# Execution State — update at EVERY milestone and after compaction

**Mission:** beginner-first Coffee Lab Web app, intentionally different Desktop 2D / Mobile physical copilot / WebXR embodied training experiences, shared learning progress, honest feedback, game feel, real tests.
**Canonical brief:** `COFFEE_LAB_HANDOFF.md` (do not silently modify). **Contracts:** `docs/CONTRACTS.md` + `src/domain/contracts.ts` (lead-owned).
**User answers (2026-11-07):** bilingual zh/en toggle · desktop + phone available, **no headset** · owns espresso machine+grinder & pour-over kit, wants to learn *all* drink types · **music, SFX, coffee culture important** · deps + local commits approved. See `docs/DECISIONS.md`.

## Current phase
**Phase 2 (2026-11-08 ~00:25).** Committed: foundation `0928779`, content `16552d5` (24 lessons/100 activities, 29 drinks, 39 equipment; 31 content tests), design system + audio `6e4ddbd` (36 tests), XR espresso mission `3952165` (46 tests; browser fallback verified by worker via headless Chromium drags; WebXR HARDWARE-UNVERIFIED).
Running: web-engineer A (onboarding/home/lesson player/activities/shell), web-engineer B (kitchen mode/journal/atlas/settings), xr-engineer phase 3 (mission picker + station-tour + pourover-bloom).

## Working user-visible flows
- [ ] Onboarding and course navigation
- [ ] Desktop lesson and interaction loop
- [ ] Mobile real-world step guide + journal
- [~] XR scene with meaningful interaction — espresso mission playable in 3D fallback (mouse/touch/action list); VR controllers hardware-unverified
- [ ] Persisted shared progress
- [ ] Drink Atlas + culture track
- [ ] Music + SFX

## Verification
- Build: PASS (foundation, 23:47)
- Unit tests: PASS 74/74 (foundation)
- Desktop browser smoke: PASS (shell only — placeholders)
- Mobile viewport smoke: PASS (shell only — placeholders)
- Actual headset: **NOT TESTED — no headset available (U2)**

## Next 3 tasks
1. Integrate web A + web B handbacks → run full typecheck/test/build/e2e → commit.
2. quality-guardian independent QA gate (P0 acceptance, product smoke scenario §12, a11y, honesty) + XR e2e via `?xrtest`.
3. Lead: add spatial-practice activities `esp-meet-the-machine-xr` / `po-ratio-bloom-xr` to content when XR phase 3 lands; fix QA P0/P1 bugs via owners.

## Blockers / unverified assumptions
- No headset → XR hardware-unverified by design.
- Phone testing by user requires `npm run dev:lan` on the same LAN (not run by agents).

## Last anti-drift check (Phase 1 start)
1. Usable loop? Not yet (no code). 2. Platform differences? Planned in briefs (desktop 2D, mobile kitchen copilot, XR spatial). 3. Honest physical guidance? Encoded in contracts §9. 4. User-facing value? Phase 1 is foundation + real content in parallel. 5. Done claims? None made. 6. In mission? Yes; breadth expansion (atlas/culture/music) is user-approved (U3).

## Commits / worktrees
- `main`: `1adf53e` (user: handoff package), `d54a7cd` (lead: .gitignore). Single working tree, ownership-separated; no worktrees.
