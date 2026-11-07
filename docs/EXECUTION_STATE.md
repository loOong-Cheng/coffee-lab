# Execution State — update at EVERY milestone and after compaction

**Mission:** beginner-first Coffee Lab Web app, intentionally different Desktop 2D / Mobile physical copilot / WebXR embodied training experiences, shared learning progress, honest feedback, game feel, real tests.
**Canonical brief:** `COFFEE_LAB_HANDOFF.md` (do not silently modify). **Contracts:** `docs/CONTRACTS.md` + `src/domain/contracts.ts` (lead-owned).
**User answers (2026-11-07):** bilingual zh/en toggle · desktop + phone available, **no headset** · owns espresso machine+grinder & pour-over kit, wants to learn *all* drink types · **music, SFX, coffee culture important** · deps + local commits approved. See `docs/DECISIONS.md`.

## Current phase
**Phase 1→2 (2026-11-07 ~23:50).** Foundation DONE + committed `0928779` (typecheck ✓, 74 unit ✓, build ✓, e2e 14 pass/2 intentional skips — lead re-ran). Running: curriculum core, curriculum atlas, experience-designer, xr-engineer, web-engineer A (learning loop), web-engineer B (kitchen/journal/atlas/settings).

## Working user-visible flows
- [ ] Onboarding and course navigation
- [ ] Desktop lesson and interaction loop
- [ ] Mobile real-world step guide + journal
- [ ] XR scene with meaningful controller interaction
- [ ] Persisted shared progress
- [ ] Drink Atlas + culture track
- [ ] Music + SFX

## Verification
- Build: PASS (foundation, 23:47)
- Unit tests: PASS 74/74 (foundation)
- Desktop browser smoke: PASS (shell only — placeholders)
- Mobile viewport smoke: PASS (shell only — placeholders)
- Actual headset: **NOT TESTED — no headset available (U2)**

## Current tasks / assigned owners (Phase 1, running in parallel)
1. Scaffold, state/persistence, i18n, capabilities, router, shell, test infra — platform-architect.
2. Core curriculum: literacy, espresso, pour-over (13 lessons) + content tests — coffee-curriculum (core).
3. Equipment catalog, Drink Atlas (≥22), explore + culture tracks (11 lessons) — coffee-curriculum (atlas).
4. UX spec, tokens, UI primitives, icons, original SVG diagrams, procedural music/SFX — experience-designer.
5. WebXR espresso mission (state machine + Babylon scene + 3D fallback + tests) — xr-interaction-engineer.

## Next (Phase 2, after scaffold + UI kit land)
- web-product-engineer A: onboarding, course map/home, lesson player + all 2D activity components with guidance tiers (desktop-first).
- web-product-engineer B: mobile kitchen-mode real-world guide, brew journal (self-report, ratio, one-change suggestion), Drink Atlas + culture views, settings.
- quality-guardian: first independent QA gate after Phase 2 integration.

## Blockers / unverified assumptions
- No headset → XR hardware-unverified by design.
- Phone testing by user requires `npm run dev:lan` on the same LAN (not run by agents).

## Last anti-drift check (Phase 1 start)
1. Usable loop? Not yet (no code). 2. Platform differences? Planned in briefs (desktop 2D, mobile kitchen copilot, XR spatial). 3. Honest physical guidance? Encoded in contracts §9. 4. User-facing value? Phase 1 is foundation + real content in parallel. 5. Done claims? None made. 6. In mission? Yes; breadth expansion (atlas/culture/music) is user-approved (U3).

## Commits / worktrees
- `main`: `1adf53e` (user: handoff package), `d54a7cd` (lead: .gitignore). Single working tree, ownership-separated; no worktrees.
