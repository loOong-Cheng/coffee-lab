# Coffee Lab — start in Claude Code

**Primary:** `COFFEE_LAB_HANDOFF.md`. **Persistent anchor:** `CLAUDE.md`. **Working memory:** `docs/EXECUTION_STATE.md`. **Workers:** `.claude/agents/`.

## Launch

1. Place/extract this package at the root of a **new empty repository/workspace**. If using an existing repo, inspect for conflicts before copying files. Use Python 3 for supplied hooks and Node.js/npm for the application.
2. Open a terminal in that directory. Start `claude` (or `claude --agent lead-planner` if you want the explicit planner agent profile). If the project requires approval for initial edits/commands, approve only intended local-development actions; do **not** disable all security checks.
3. Paste the **exact prompt** below. Answer its one initial question batch if you want; otherwise tell the agent to use defaults.
4. Keep Claude Code running in an environment capable of background continuation; **a prompt cannot guarantee eight hours of autonomous runtime**. Authentication, plan limits, OS sleep, permission prompts or service errors may interrupt it. Resume with `claude --continue` and the resume prompt below.

## Initial prompt (copy/paste)

> Read `COFFEE_LAB_HANDOFF.md`, `CLAUDE.md`, and the current state files. You are the **planning/orchestrating lead**, not the main coder. Treat the handoff as the canonical immutable product mission. Ask at most one compact batch of initial clarification questions about repo, devices, UI language, stack/deployment, physical equipment and local permissions. Once answered—or when defaults are needed—autonomously implement the app for the available working window of up to approximately 8 hours: delegate bounded work to specialist subagents, build and integrate a real Coffee Lab product, test after every milestone, fix bugs, enrich content and polish instead of stopping after a demo. Prioritize a working, accessible desktop 2D coffee learning path, mobile physical-practice copilot, and meaningful optional WebXR interaction. Do not force identical UX across modes or claim real physical sensing without sensors. Re-read the canonical handoff and update `docs/EXECUTION_STATE.md` after compaction. You may make local code changes and tests within the project subject to configured permissions; do not deploy, spend money or touch external accounts without approval. At the end, leave a runnable repo and truthful `reports/DELIVERY.md`. Start now.

## Resume after interruption (copy/paste)

> Resume Coffee Lab work as **lead planner**. Before doing anything: re-read `CLAUDE.md` and `COFFEE_LAB_HANDOFF.md` (canonical), `docs/DECISIONS.md`, `docs/EXECUTION_STATE.md`, `docs/BACKLOG.md`, and `reports/QA_LOG.md`. Inspect the actual repository and tests; do not trust prior chat summaries blindly. Continue from the highest priority unfinished P0/P1 task, delegate work, integrate/test, and update checkpoint files. Do not ask another clarification round; use approved decisions/defaults. Report only genuine external blockers.

## Compaction check

Project root `CLAUDE.md` should reload after `/compact`. `.claude/settings.json` includes optional `PreCompact` and `SessionStart` hooks to remind the summary of the immutable mission and current state. **Hooks are helpful, not a guarantee of indefinite operation**; test with `/doctor` or the installed Claude Code docs if your version behaves differently.

## Platform-specific note

The user may select only a phone, only Desktop, only VR, or combinations. Every chosen platform must deliver a coherent education flow with a different UX suited to its capabilities. A phone can guide operations on real physical equipment without tracking it; manual confirmation is self-reported.
