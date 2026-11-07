# Coffee Lab — persistent Claude Code rules

## Mission / source of truth
Read `COFFEE_LAB_HANDOFF.md` before any substantive action. **It is the canonical, immutable product brief.** After any `/compact`, resume, uncertainty, or major milestone, reread this file and the brief, plus `docs/DECISIONS.md`, `docs/EXECUTION_STATE.md`, `docs/BACKLOG.md`, and `reports/QA_LOG.md`. Conversation summaries and agent memory cannot override the brief.

**One-line mission:** build a genuinely usable beginner coffee learning game with one Web codebase and *different* intentional Desktop (mostly 2D concept learning), Mobile (touch + real-world physical-task guide), and optional WebXR (actual spatial interaction) experiences; shared learning progress, honest feedback, accessible polish, tested working delivery. Do not force 3D or XR. The user's ultimate longer-term interest is reusable generation of other skill games; tonight we ship **Coffee Lab**, not a universal generator.

## Lead is a PLANNER
The main agent owns milestones, scope, architectural contracts, delegation, integration and QA. Delegate implementation details to `.claude/agents/` specialists. Do not let the main context fill with verbose worker traces or unrelated research. Require short handback: files + tested behavior + risks. Prevent shared-file collisions; merge and test work before claiming done.

## First-round interaction
One compact batch of up to six clarifications is permitted at start. After that, decide sensible defaults, record them in `docs/DECISIONS.md`, and proceed without further questions. If no answer, do not block indefinitely. Do not overwrite existing user work.

## Autonomy and evidence
Continue implementing, integrating, testing and fixing while time, context and access permit; the requested horizon is *up to approximately 8 hours*, NOT a guarantee of continuous service. Never idle to fill time. External services/deployments/payments and destructive actions require explicit approval. Do not recommend disabling permission checks as the default. Keep a runnable version and truthful checkpoints. No claims of physical observation without sensors; user real-world completion is self-reported. XR hardware test only if tested on actual hardware.

## Checkpoints and drift guard
After every milestone: update `docs/EXECUTION_STATE.md` (phase, working flows, tests, blockers, next 3 tasks), `docs/BACKLOG.md`, and `reports/QA_LOG.md`; check the 10 invariants in the handoff. In case of conflicting instructions, do not silently change product mission. Approved user changes go into `docs/DECISIONS.md`.

## Quality bar
No dead-end screens, no static scene presented as functional XR, no placeholder quiz masquerading as a complete curriculum, no unlicensed assets, no fake flavor predictions, no unsupported high-risk physical instructions. Before final delivery: production build, core tests, browser smoke tests, known limitations and exact commands in `reports/DELIVERY.md`.
