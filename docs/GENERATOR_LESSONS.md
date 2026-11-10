# Lessons for the future skill-app generation pipeline

These are rules for the **future "learn anything" generator** (its template brief, START_HERE prompt and agent definitions).
They do **not** change Coffee Lab: its brief (`COFFEE_LAB_HANDOFF.md`) stays immutable and the shipped app is unchanged.
Each lesson comes from user feedback on a generated app.

---

## L1 — Ask for a learner's details only when an activity needs them (2026-11-10)

**User feedback on Coffee Lab:** opening the app with "what equipment do you have?" is wrong. That question only matters when the learner goes to practice in real life, not at the start.

**What caused it in this pipeline:**
- `COFFEE_LAB_HANDOFF.md` §3, P0 gate: "First-use onboarding: goal, experience, available devices, **physical equipment**, preferred mode".
- The agents built exactly that. It was skippable and took about a minute, but it still asked about gear before the learner had learned anything.

**Two kinds of question that must not be mixed up:**
- **Build-time questions to the requester.** These are the lead's single clarification batch, for example "what gear do you own, what do you want to learn?". They are fine: the answers decide what content to build. In Coffee Lab, the answer "I want to learn all drink types" broadened the scope.
- **Run-time questions to the learner** inside the generated app. These follow the rule below.

**Rule for generated apps:**
1. **First launch asks at most one question:** the learner's goal ("What do you want to be able to do?"). Language can follow the browser locale. The first real interactive activity must be reachable in about 60 seconds.
2. **Detect, don't ask.** Device, input method, XR support and screen size come from capability detection. The suggested mode is inferred from those and can be changed later.
3. **Physical resources are asked for when an activity first needs them.** Equipment, instruments, materials, space and ingredients are asked about the first time the learner opens a real-world practice, recipe or kit-dependent activity.
   - Ask only about what that activity needs ("This uses a scale and a kettle. Which do you have?").
   - Offer substitutes or a version that works without the item.
   - Remember the answer and make it editable in Settings.
   - Never ask again for an item that was already answered.
4. **Experience level is inferred, not self-rated up front.** Use an optional, skippable placement check, or adapt from early answers. Guidance tier stays learner-selectable and can step down.
5. **Safety prerequisites are asked at the risky activity**, not at app start. Examples: "Is your machine on a stable surface?", "Hot water — ready?".
6. **Exception:** if the learner's stated goal centres on their own gear (for example "help me use my espresso machine"), the gear question comes straight after the goal. At that point it is the moment of need.

**Acceptance tests the generator must emit:**
- E2E: a fresh profile reaches its first interactive activity without any equipment, device or experience question, in ≤ 3 taps or clicks after choosing a goal.
- E2E: the first entry into a real-world practice that needs equipment shows a scoped equipment prompt. A second entry doesn't ask again. The answer is visible and editable in Settings.
- Unit: capability detection fills device and mode fields with no user input.

**Template changes to make when the generic brief is created:**
- Replace the P0 "First-use onboarding" bullet with rules 1–6 above.
- Add to the experience-designer and web-product-engineer agent definitions: "Progressive profiling: ask for a learner's details only when an activity needs them. Never front-load equipment, device or experience questions."
- Leave the lead's build-time clarification batch as is. It may still ask the requester about their equipment.

---

## L2 — Token budget and auto-resume (2026-11-10)

**User request for future generated apps:** a project gets a budget, for example **30% of the weekly usage limit**. When the 5-hour session limit is hit, the build should **resume automatically after the reset**.

### What Coffee Lab actually used (measured from local session transcripts)
- About **432M tokens** in 1,620 model calls, all on Claude Opus 5.5. At API list prices that is about **$191**. The user is on a subscription, so this is an equivalent figure, not a bill.
- The weekly percentage was not recorded. The build used up **one full 5-hour window** (about 23:18 to 04:00 Berlin) before the limit stopped it.
- Cost by token type:

  | Type | Tokens | Cost |
  |---|---|---|
  | Cache reads | 420M (97%) | $84 |
  | Output | 2.96M | $59 |
  | Cache writes | 9M | $47.5 |

- Cost by agent:
  - Subagents: **$171.5 (90%)**.
  - Lead planner: $18.3.
  - The XR engineer alone cost **$45.9 (24%)**, for a feature that is hardware-unverified and only half merged.
- The usage was produced by `usage2.mjs`, which deduplicates by `message.id` and takes the maximum of each usage field. That script was a scratch file and is not saved in this repo.

**Cost lessons:**
1. Long-running agents re-reading their growing context are the biggest cost. Give each agent a small, bounded task with a clear deliverable. Prefer a fresh agent per work package over one agent working for hours.
2. Cap spending on optional features until P0 is verified. For example, the XR/3D share of the budget is at most about 10% until the core loop passes QA.
3. The lead-as-planner pattern was cheap (about 10% of cost). Keep it.

### Verified Claude Code capabilities (code.claude.com docs, checked 2026-11-10; not yet tested on this machine)
- **Status line input** contains `rate_limits.five_hour.used_percentage`, `rate_limits.seven_day.used_percentage` and `resets_at` (epoch seconds).
  - Subscriptions only (Pro/Max/Ultra), and only after the first API response.
  - Each window may be missing.
  - **Hooks do not receive these fields.**
  - There is no documented non-interactive `/usage` command.
- **Auto-continue at usage limit:** interactive sessions on a subscription (v2.1.234+) wait for the reset and continue the task by default. The setting is `autoContinueAtUsageLimit`. It does **not** apply to `-p` runs or background sessions.
- **Headless:** `CLAUDE_CODE_RETRY_WATCHDOG=1` retries 429s until the reset. Related settings: `CLAUDE_CODE_RETRY_WATCHDOG_USAGE_LIMIT_RECHECK_MS` and `CLAUDE_CODE_RETRY_WATCHDOG_MAX_WAIT_MS`.
- **Subagents** stopped by a usage limit do **not** continue on their own. The lead must `SendMessage` each one after the reset. This is what happened in Coffee Lab.
- **`/schedule` routines** run in Anthropic's cloud and use the same subscription quota. They are not a local auto-resume mechanism.
- `--max-budget-usd` caps the **API-price estimate**, not the plan allowance. Use it only as a rough backstop.

### Pipeline design
1. **Budget file:** a status-line script writes `{five_hour, seven_day}` (used % and `resets_at`) to `.claude/usage.json` on each refresh.
2. **Baseline:** at kickoff the lead records the starting weekly % and the budget (for example +30 points) in `docs/EXECUTION_STATE.md`. If `seven_day.resets_at` changes mid-project, add the usage from before the reset to the total.
3. **Soft stop at about 25 points:** no new feature agents. Only finishing work is allowed: final tests, `reports/DELIVERY.md`, commits.
4. **Hard stop at 30 points:** a `PreToolUse` hook on `Agent` (and `Workflow`) reads `.claude/usage.json` and denies new spawns. Agents that are already running finish their current task.
5. **Auto-resume:**
   - Run the build in an **interactive** session, with `autoContinueAtUsageLimit` on.
   - Keep the PC awake.
   - Pre-approve the project's normal commands so no permission prompt blocks overnight.
6. **After each reset, the lead's first actions:**
   1. Read the budget file.
   2. If under the soft stop, `SendMessage` each interrupted subagent to continue.
   3. Otherwise go straight to wrap-up.
7. **Untested points:** run a short dummy session before relying on this overnight. It must confirm two things:
   - That `rate_limits` appears in the status-line input on Windows.
   - What happens to queued cron or loop prompts during a usage-limit wait. The docs do not say.

**Acceptance tests the generator must emit:**
- Unit: the budget-guard hook denies an `Agent` call when `seven_day.used_percentage ≥ baseline + budget`, and allows it otherwise.
- Unit: a missing or stale usage file fails open (does not block), and the hook prints a warning so the lead notices and records it in `docs/EXECUTION_STATE.md`.
- Manual: a dummy run hits the soft stop and wraps up.
