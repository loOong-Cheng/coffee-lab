# COFFEE LAB — Canonical Product & Engineering Handoff

**Version:** 1.0 • **Created:** 2026-11-07 • **Status:** AUTHORITATIVE / DO NOT SILENTLY REWRITE

> **Mission:** Build a genuinely usable, attractive, accessible, cross-device **coffee-learning game/product** in an approximately **eight-hour autonomous Claude Code development window**, while establishing the reusable foundation for a future AI system that generates different skill-learning experiences. Deliver running software, not only design documents or a conceptual prototype.

## 0. Read this first — non-negotiable operating contract

You are the **lead planning/orchestration agent**, not the sole feature implementer. You own alignment, prioritization, scheduling, dependency management, integration, quality gates, and delivery. Delegate specialist design/implementation to bounded subagents. Subagents own detailed choices in their respective domains. Do not prescribe every screen, animation, data structure, or CSS detail from the top; instead give workers goals, interfaces, constraints, acceptance tests, and file ownership.

**Read order on every startup, resume, and after compaction:** `CLAUDE.md` → this entire handoff (or the relevant sections plus non-negotiables) → `docs/DECISIONS.md` → `docs/EXECUTION_STATE.md` → `docs/BACKLOG.md` → `reports/QA_LOG.md`. The handoff is the immutable intention; state docs describe what has been done. Never substitute recent conversation summaries for this source.

The original mission cannot be modified by a subagent or by autonomous reinterpretation. A first-round user answer may refine a decision: record it in `docs/DECISIONS.md`, with the original assumption and replacement. Do **not** overwrite the mission. Record proposed material scope shifts as deferred options, not unapproved facts.

**No overnight guaranteed execution:** attempt to use the available autonomous workflow for up to an **8-hour *working window***, or stop earlier if acceptance gates are genuinely met and high-priority backlog is exhausted. Claude Code sessions, authentication, permission prompts, rate limits, user machine sleep, task duration, context size, and billing can interrupt execution. Do not claim to have worked eight hours if you have not. Never deliberately idle, spin, or burn tokens to fill time. If interrupted, persist a resumable state and report the blocker plainly. Avoid user questions after the single initial clarification round: make and document sensible defaults.

**Deliver an operable product:** architecture and refactoring do not replace a user-visible application. At each milestone, keep `npm run dev` usable and the last complete flow working.

### Invariants — never lose these after /compact

1. Product is **Coffee Lab**, a beginner-first coffee skills learning experience; coffee content has real depth and optional advanced branches, not merely one espresso animation.
2. **Web-first:** **one web codebase**, Desktop + Mobile, and immersive WebXR where supported. The app works without a headset. Do not require XR for core progression.
3. **Platform-conditioned design:** Do *not* force identical interfaces or 3D everywhere. Desktop may use excellent 2D exercises, explanations and interactive diagrams. Mobile prioritizes touch and *real-world hands-free guidance*. XR uses direct spatial interactions and presence. Each selected platform must deliver a coherent complete experience, not a crippled subset.
4. User can use only one selected platform, freely combine modes, or learn on a phone *while acting on real coffee tools*. Their actual capabilities and input methods dictate what feedback is possible.
5. XR practice is **purely virtual** unless an actual tracked/digitally connected physical object is used. A physical-object mode counts as MR in this product's internal terminology, even with a virtual background; actual physical device integration is an optional, explicitly bounded capability.
6. **Skills ≠ rendering mode:** Learning goals and shared learner progress are reusable; presentation, interaction and exercises can and should differ across devices. Avoid one-size-fits-all simulations.
7. **No fabricated sensing or learning claims.** User-confirmed physical steps are self-reports, not computer-verified successes. Simulated brew taste is an illustrative model, not a guaranteed real flavor prediction. No claim of genuine motor proficiency from VR alone.
8. **Main agent is planner/orchestrator**; specialist subagents carry domain decisions and implementation. Separate agent contexts prevent lead-context drift.
9. **Repository is the memory.** `COFFEE_LAB_HANDOFF.md` is canonical. Maintain decisions, state, backlog, QA, and delivery continuously, and re-anchor after compaction.
10. Favor a polished **end-to-end product loop**, reliable tests, accessible UI, and working code over speculative universal-generation architecture or flashy graphics.

## 1. First-round clarification protocol (one batch; then autonomous)

At most **one initial clarification message** containing no more than **six compact questions**, then proceed without further user questions. If the user's message already answers something, never re-ask. Suggested questions, in priority order:

1. Existing repo or empty directory? Safe to initialize a fresh Git repo here? Confirm working folder, and any files to avoid.
2. Target hardware/browsers for verification: Quest standalone browser, Windows PCVR, desktop browser(s), iPhone/Android? Is a headset physically available?
3. Preferred language(s) of the *product UI/content*? Default: Chinese-first with English-ready content architecture.
4. Any hard tech preference, hosting/deployment target, or available paid API keys? Default: TypeScript + Vite + React + PlayCanvas or Babylon.js after spike; local-first and no required external APIs.
5. Coffee equipment actually owned for physical practice? Default: none assumed; support generic espresso setup and pour-over, with manual step confirmation.
6. Is autonomous local editing/testing and installation of project dependencies permitted; may we create local commits? Default: within isolated project folder yes; no destructive commands, publication, purchases, or credentials use without explicit approval.

If no response arrives, proceed using defaults while respecting existing-file safety. **Never wait indefinitely for input.** If ambiguous enough to risk overwriting files, create a new subdirectory instead. No later spontaneous clarification rounds. If a feature depends on unavailable credentials/headsets, provide a working local fallback, mark unverified items, continue on another task.

## 2. Vision and audience

### User
- A complete beginner, perhaps curious about coffee, who wants to **understand and make an actual cup** of espresso or pour-over; may later explore sensory, recipes, dialing in, cleaning and simple café workflow.
- Often has just a phone or PC. Some have a VR headset, a real machine, a grinder, a scale, or both. They may choose only VR simply because they like immersion.
- Wants to feel learning progress and enjoy the process, not optimize abstract retention metrics or consume endless gamified points.

### Product promise
*“Understand coffee, practice meaningful steps, and make your next real cup better—with the devices you already have.”*

### Explicit non-goals for overnight build
- Not a universal ‘generate any skill app’ production service tonight. Architect for reuse but ship **one coffee vertical slice with meaningful depth**.
- Not photorealistic 3DGS creation, arbitrary machine tracking, general MR object detection, automatic physical-process validation, online multiplayer, social feeds, enterprise LMS, full barista certification, or app-store distribution.
- Not an academic platform comparison, paper, user study, speculative eight-hour refactor, or 100-hour game.
- Not a single generic 3D UI pasted across all platforms.

## 3. Success: functional product, not an empty scaffold

**P0 acceptance gate (must ship before major polish):**

- Launchable web application and documented `npm install`, `npm run dev`, `npm run build`, and test commands.
- Attractive, coherent identity/branding, responsive desktop and usable mobile layout, keyboard/touch accessibility.
- First-use onboarding: goal (espresso, pour-over, or explore coffee), experience (beginner/default), available devices (PC/mobile/headset), physical equipment, preferred mode; skip-friendly and editable.
- A navigable coffee course map with **at least 3 complete beginner modules** and a stable shared progress model.
- At least **three distinct learning activity families** implemented and genuinely interactive: e.g., explanatory visuals/cards, step ordering/diagnostic reasoning, ratio or parameter exploratory simulator, guided practice and reflection.
- A complete **espresso learning path**: intro → tools → preparation/workflow → explanation/practice → feedback/next adjustment. Include a distinct pour-over path by P1.
- Desktop interface intentionally designed for cognitive learning: no forced 3D scene for reading, steps, quiz, ratio exploration.
- Mobile **real-world practice assistant**, manual “done/need help/back”, clear limitations, visible state, interruption/resume; voice optional with button fallback. No fake physical sensing.
- An XR scene with **one complete functional action sequence**: orient, grab/position or select, manipulate, progress, on-action guidance and helpful reset. Use at least an espresso machine + portafilter + cup as recognizable training props; do not pass off a static room as VR gameplay.
- XR feature detection and graceful fallback, with no crash when `navigator.xr` is absent.
- Guided → assisted → independent practice mode (or equivalent fade-of-guidance) usable in at least two learning contexts; not simply badges without interaction differences.
- Real progress persists on device; an exercise result and a self-reported real cup can be recorded, resumed, and reflected on. Distinguish system-observed from self-reported.
- Unit tests for the core domain/state logic, at least one browser smoke test across a representative desktop/mobile viewport, and a production build test. Honest XR testing note if no headset.
- Functional README, current run instructions, and truthful `reports/DELIVERY.md` with tested/unverified features and known problems.

**P1 stretch once P0 is stable:** richer pour-over path, sensory vocabulary, extraction reasoning game, branching fault diagnosis, simple virtual coffee shop orders, XR haptics/audio/comfort, localization, animations, guided choice of next lesson, offline/PWA capability.

**P2 stretch:** hardware adapter interface (MIDI *example only*, not central to coffee), MR alignment prototype only if devices actually support it, generative skill authoring schema (data-only), more coffee curricula, deeper physical recipe journals, cloud sync only if pre-approved.

Each feature must be **usable** and testable, not a placeholder navigation item. Maintain `DONE / PARTIAL / TODO / BLOCKED` truthfully.

## 4. Coffee curriculum: breadth with deliberate progressive depth

Use reputable coffee references, e.g. [Specialty Coffee Association Coffee Skills Program](https://education.sca.coffee/coffee-skills-program) and its course catalog, and reputable device manuals if a specific machine is modeled. Document sources, dates and review status in `docs/CONTENT_SOURCES.md`; do not copy long source text or proprietary diagrams/assets. Separate **verified facts**, common rules of thumb, and model assumptions.

### Track A — Absolute beginner: coffee literacy
1. What coffee is: beans, roast, freshness, basic flavor vocabulary; no prerequisite jargon.
2. Tools and safety: hot water/steam, grinder, scales, equipment purpose; workflow and hygiene.
3. Brewing concepts: dose, yield, brew ratio, time, grind, extraction vs subjective flavor, why a recipe is a starting point.

### Track B — Espresso fundamentals (initial primary route)
1. Recognize machine, grinder, portafilter, basket, tamper, cup, scale.
2. Preparation workflow: check equipment safety → measure dose → grind → distribute/tamp → install portafilter → position cup → start extraction → measure result → clean appropriately.
3. Parameter exploration: interactive brew ratio with correct mathematical calculation, illustrative dose/yield pair (e.g. 18g : 36g = 1:2), adjustable by user, *not universal ideal*.
4. Beginner diagnosis: too little/much output, unexpectedly fast/slow extraction, taste impressions (if user actually tasted), one-change-at-a-time suggestions. A simulated extraction score must say it is illustrative.
5. Intro milk drinks only if time, with steam/burn warnings and hardware-specific instructions deferred to manuals.

### Track C — Pour-over fundamentals
1. Identify filter, dripper, kettle, carafe/cup, coffee, scale and grinder.
2. Explain proportion, bloom, pour stages, measurement, cleanup with a plausible *illustrative* recipe (e.g. 15 g coffee to 250 g water) and a reminder that many valid techniques exist.
3. Guided real-world workflow with timed *optional* reminders and manual step confirmation.
4. Tasting and iteration journal.

### Track D — Optional exploration/advanced route
- Sensory: acidity, sweetness, bitterness, body, aroma, individual preference and comparison.
- Dialing in espresso, grinder calibration concepts, extraction and recipes; real-world variables interact—avoid deterministic taste prediction.
- Coffee origin/processing, roast levels, water, machine maintenance safety; note that expert topics are not MVP prerequisites.

For each lesson define: `id`, `track`, `level`, `goal`, `prerequisites`, `keyConcepts`, `activityCandidates`, `checkForUnderstanding`, `safetyNotes`, `estimatedDuration`, `sources`, `confidence`, `next`. **Important:** these are domain-level targets; they do not prescribe one platform's UX.

## 5. Platform-specific experience — different designs for a shared skill

### Desktop (keyboard/mouse; Web 2D-first)
**Purpose:** efficient learning of concepts, decision-making, cause/effect, sequences and reflections.
- Beautiful 2D layout with modules, illustrated steps, short text, optional diagrams and media; do not assume a 3D scene is better than a good interactive chart.
- Activity samples: order espresso steps; identify machine components; click-to-reveal cross-section; adjust dose/yield and interpret ratio; choose what to try after a bad shot; guided dialogue/coach card; timed decision challenge.
- A short interactive lesson must have feedback tied to a misconception, “why”, and optional retry, not only red/green correctness.
- Mouse/keyboard quick path: next/back, show/hide hint, replay animation, optional keyboard shortcuts.
- A compact 3D viewer only when spatial understanding adds value. It must not block the core desktop curriculum.

### Mobile Web (touch + real-world copilot)
**Purpose:** short learning moments and real physical practice using a phone as the display.
- Mobile-first large controls, thumb reach, clear contrast, no tiny drag targets; optionally landscape-friendly diagrams.
- **Hands-busy / kitchen mode:** big “Done”, “Repeat”, “Help”, “Back”, timed and user-pausable step prompts, clear wake/readability options; use text and user-initiated speech where available, with text fallback and visible microphone permissions.
- User handles *real* kettle/espresso hardware outside the app. AI/web UI cannot infer whether physical action occurred absent signals; manual completion is labeled “self-reported”.
- Collect recipe notes and user's actual observations; never manufacture flavor scores or timestamps.
- Work offline where feasible after initial load; avoid requiring online AI or login to continue.

### XR Web (WebXR immersive-vr supported devices)
**Purpose:** active spatial practice, embodied exploration, and optional enjoyable simulated tasks.
- A recognizable coffee work area (espresso initially), with comfortable scale, reachable affordances, low clutter, readable spatial text, seated/standing comfort, recenter/reset, stable frame rate.
- Onboarding tutorial: indicate controller target, grab and release, grab distant objects only if the mechanic is explicit, reset, comfort guidance; hand tracking optional, do not depend on it.
- A real interaction sequence: locate portafilter → pick it up → align with machine → attach/snap with understandable tolerance → move cup → actuate virtual brew/start → watch illustrative output → finish and receive meaningful, non-punitive feedback. Add grind/tamp as subsequent tasks if stable.
- Skills in VR may include accurate spatial order, recognition, coordination and interaction, while **not claiming** grip force, authentic haptics or accurate espresso flavor. Visually suggest errors without pretending to sense real touch.
- Guidance tiers: (1) full ghost cues/arrows and forgiving snap, (2) contextual cues only with reduced assist, (3) no step labels, still generous accessibility/reset. Always allow user-selected guidance level.
- Make actions satisfying: responsive hover/outline, subtle audio, successful/unsuccessful effects, instant recovery, purposeful motion—not artificial daily streak compulsion.
- XR should be independently playable if user requests XR-only, including embedded foundational explanations, not a locked downstream stage.
- Detect `navigator.xr` / `isSessionSupported('immersive-vr')`; use appropriate HTTPS/localhost, browser security and user gesture. Unsupported devices see a clear explanation and functional 2D alternative.
- Treat physical props, passthrough, object tracking, and MR as **capability-gated future adapters**, not assumed features.

### Cross-mode continuity
- Shared learner goal, concept mastery evidence, self-reported journals, navigation state.
- Different activities need not be the same across devices. Never assume one desktop quiz success proves precise real-world movement ability.
- If user selects only mobile, cover knowledge + real-world manual guidance there; if only XR, offer enough learning content inside immersive experience.
- Persist a mode-specific transcript of what was practiced, plus a shared high-level course progress.

## 6. Game design / engagement requirements

Make a **learning game**, not a textbook with an XP counter. Core loop:
**see a concrete challenge → act/decide → receive timely explanatory feedback → retry or vary difficulty → apply to a real or simulated cup → reflect and unlock meaningful next challenge.**

- Challenge tiers: guided, assisted, independent; let users select and step down if struggling.
- Meaningful goals: “make your first espresso,” “fix a too-fast shot,” “fulfil a café order,” “identify tools” and “make a real cup”.
- Skill-congruent feedback: ratio calculations correct; choice outcomes reasoned; VR positions acknowledged only if collision/proximity/rules actually detect them; physical completion is confirmed by user.
- Reward mastery, increasingly autonomous completion, intentional practice and real-world creation. Avoid manipulative streak/retention design, push notifications or endless rewards unrelated to skill.
- Allow curiosity: low-stakes exploration, tooltips, small easter eggs, multiple paths. No forced VR, no forced social features.
- UX production quality: polished typography, restrained visual system, warm coffee palette, responsive spacing, consistent iconography, thoughtful loading/empty/error states, satisfying microinteractions, sounds optional/mutable.
- Accessibility: keyboard, focus management, readable text, reduced motion, color not sole feedback, captions for media, touch targets, XR seated option, audio mute.

## 7. System architecture and implementation choices

### Preferred stack, subject to quick architecture spike
- TypeScript monorepo or simple Vite workspace, React for shell/2D learning, a **single chosen WebXR 3D engine** (Babylon.js or PlayCanvas; choose with a short spike and document why), Vitest for unit tests, Playwright for browser smoke tests. Use package versions current and actually installable in environment.
- Product should run locally, without any AI provider key. AI features **optional and behind interfaces**; deterministic, authored content works offline. For true interactive LLM tutoring, implement a server-side adapter with no client-exposed secret, a local/offline fallback, and clear opt-in if time.
- Use an asset library with documented licenses or original generated/procedural primitives. No unlicensed third-party video, images, music or 3D models. Avoid dependency on unverified external asset generation services.
- Scene renderer may use WebGL 2 for broadly compatible immersive XR; WebGPU can be progressive enhancement, not assumed as immersive runtime everywhere.

### Architectural boundaries — intentional but not overengineered
1. **Learning Domain:** lessons, concepts, activity specs, outcomes, prerequisites, safety flags, content provenance.
2. **Activity Runtime:** sequence quiz, identify object, parameter explorer, task scenario, guide stepper, reflection journal, XR action sequence.
3. **Experience Adapters:** Desktop, Mobile, WebXR choose different renderings and inputs. Explicit `CapabilityProfile` and graceful fallback.
4. **Shared Learner State:** versioned persisted progress, results with evidence provenance (`observed_by_app`, `self_report`, `simulated`, `assessed_answer`), preferences, completed checkpoints, journal.
5. **Asset / 3D Interaction Library:** objects, state machines, animation and affordance contracts, perf budgets.
6. **Future Generator Seam:** schema-validated JSON learning goals/activity graph and per-platform manifests. Not a general prompt-to-arbitrary-code runtime tonight.

### Suggested minimal types (adjust details in worker implementation)
```ts
type Mode = 'desktop' | 'mobile' | 'xr' | 'real-world-guide';
type EvidenceKind = 'assessed_answer' | 'observed_by_app' | 'self_report' | 'simulated';
type Guidance = 'guided' | 'assisted' | 'independent';
interface CapabilityProfile {
  screen: 'desktop' | 'mobile' | 'headset';
  xrImmersiveVR: boolean;
  xrControllers?: boolean;
  xrHandTracking?: boolean;
  microphoneAvailable?: boolean;
  physicalEquipment: string[];
}
interface LearningActivity {
  id: string; lessonId: string; objectiveIds: string[];
  kind: 'explain'|'observe'|'sequence'|'quiz'|'parameter-lab'|'guided-practice'|'spatial-practice'|'reflect';
  supportedModes: Mode[]; assets?: string[]; safetyNotes?: string[];
}
interface LearningEvent {
  activityId: string; mode: Mode; guidance: Guidance;
  evidence: EvidenceKind; outcome: 'completed'|'retry'|'skipped';
  recordedAt: string; notes?: string;
}
```
Use typed schemas/validation at data boundaries. Prefer feature-driven directories and testable pure domain logic. Avoid publishing or executing arbitrary model-generated JavaScript, unsafe eval, client secrets, or code generation straight into end-user browsers.

### Non-negotiable quality/operability
- `npm run build` passes, type-check/lint where configured, UI smoke tested, no hidden fatal console errors on core flow.
- Persistent state migration/version field to avoid corrupted progress after changes.
- Error boundaries, missing asset fallback, XR feature detection, camera/mic opt-in.
- Real-world safety messages for boiling water, steam, grinders and electricity. Avoid dangerous machine-disassembly instructions; refer to manufacturer instructions for exact machines.
- Actual XR device testing only when headset/runtime access exists. Otherwise mark “hardware-unverified” and test XR logic through simulation/unit testing; never claim device verification that did not happen.

## 8. Main-agent + subagent operating model (critical)

### Main agent = PLANNER / INTEGRATOR / QUALITY OWNER
- Read the canonical brief and state, ask initial clarification *once*, create or adjust a milestone plan, prioritize against P0/P1/P2, assign clear tasks to subagents, review outputs, integrate, test and maintain reports.
- **Do not spend most tokens coding a subsystem**. Delegate coffee education, product/UX, frontend, XR mechanics, QA separately. Main may implement small glue fixes and unblock integration.
- Give subagents autonomy on local details. A good task specifies **user outcome, owned files/directories, constraints, dependency interfaces, and acceptance checks**, NOT a 200-line UI prescription.
- Budget contexts. Subagent responses must be short structured handoffs: files changed, commands/tests run, outcome, risks, next concrete action. Do not paste massive logs into the lead context; store logs in repository.
- Re-evaluate after every integration milestone. Always maintain working `main` and leave at least one usable product path even if XR fails.

### Specialized subagent roles (preconfigured in `.claude/agents/`)
- `coffee-curriculum`: domain accuracy and content structure; owns `src/content/`, `docs/CONTENT_SOURCES.md`, and content tests.
- `experience-designer`: learning activities, platform-conditioned UX, game feel, accessibility/design tokens; owns design specs and assigned isolated UI surfaces.
- `web-product-engineer`: Desktop/Mobile app shell, onboarding, 2D learning components, physical practice guide, persistence and relevant tests; owns `src/app/`, `src/features/` as assigned.
- `xr-interaction-engineer`: 3D scene, XR controller mechanics, object states, guidance tiers, fallback; owns `src/xr/` and XR tests.
- `quality-guardian`: independent QA, testing, reproducibility, accessibility, integration checks; owns `tests/`, `reports/QA_LOG.md`; fix scope only with explicit delegation.
- `platform-architect`: short architectural spike, shared contracts, capability detection, integration proposals; owns shared interfaces/config only when assigned.

The lead can use fewer concurrent workers depending on cost/tooling. A **single lead with project subagents** is the reliable default. Experimental agent teams are optional only if the installed Claude Code version supports them and coordination value outweighs cost; do not make them a blocker. Reuse separate subagent contexts; file boundaries or isolated worktrees prevent collisions. Avoid multiple workers simultaneously modifying `package.json`, routing and shared types.

### Mandatory task brief template for delegated work
```text
CANONICAL MISSION: Read COFFEE_LAB_HANDOFF.md §§0,3,5,6,8. Do not change mission.
WORK PACKAGE: <outcome, not merely a file to create>
OWNERSHIP: <explicit directory/files; cannot edit others without lead approval>
INPUT CONTRACTS: <types, APIs, established decisions>
ACCEPTANCE: <observable behavior + tests>
CONSTRAINTS: <no external secrets, no fake sensing, accessibility, fallback>
DELIVERABLE: changed files + test command/results + brief handoff + unresolved issues.
STOP: return when acceptance is met or blocked; do not expand scope or ask user.
```

### Concurrency and merges
- Early architecture decisions before broad parallel coding. Then parallelize **independent** content, visual/design, XR mechanics, test planning.
- If using worktrees: ensure project is a Git repository, subagent commits independently, lead integrates tested commits and resolves conflicts. If worktrees unavailable, assign non-overlapping file ownership and integrate sequentially.
- Never let agents create alternative full app scaffolds. One package manager, one renderer, one routing model, one design-token source.
- QA agent independently reviews at milestone gates; lead cannot accept “done” solely because worker claims it.

## 9. Context / compaction anti-drift architecture

**Source priority:** `COFFEE_LAB_HANDOFF.md` (intent) > `CLAUDE.md` (short persistent operational rules) > recorded approved user decisions > architecture contracts > `docs/EXECUTION_STATE.md` (facts) > subagent notes > conversational summary. If genuine conflicts exist, preserve intent and log the choice. Re-read the canonical document after any summary/compaction.

Files that MUST be maintained:
- `CLAUDE.md`: short, always-loaded durable rules and instruction to re-read canonical mission; never paste the entire long handoff here.
- `COFFEE_LAB_HANDOFF.md`: canonical original mission; avoid altering during autonomous build.
- `docs/DECISIONS.md`: approved first-round answers and recorded architectural tradeoffs (date, rationale, alternatives).
- `docs/EXECUTION_STATE.md`: **high-value compact current state**: mission summary, phase, working features, test status, next 3 tasks, blockers, unverified assumptions, running branches/worktrees.
- `docs/BACKLOG.md`: P0/P1/P2 acceptance checklist with actual evidence and owner.
- `reports/QA_LOG.md`: tests, failures, fixes, device/browser verification.
- `reports/DELIVERY.md`: final honest handoff, commands, features, limitations.

**Before handing work to an agent, after merging results, every major milestone, and after compaction**: reread mission invariants and update state. Subagents read relevant canonical sections themselves; do not rely only on the lead's paraphrase.

A project-level `PreCompact` hook can print **compaction-summary instructions** telling Claude to preserve the original mission and include project state. A `SessionStart` hook (including `compact` trigger) can re-inject the brief anchor and state. Hook stdout and project `CLAUDE.md` are aids, not guarantees of perfect memory or continuous runtime. The supplied hook is intentionally non-blocking, keeps output short, and must not depend on secrets or external services. Verify it works in the installed Claude Code version; if unsupported, use `CLAUDE.md` and explicit re-read.

**Anti-drift self-audit**, write a short report in `docs/EXECUTION_STATE.md` after each milestone:
1. Is there a usable beginner coffee learning loop right now?
2. Are Desktop/Mobile/XR treated as genuinely different designs?
3. Is physical practice guidance honest about observation limits?
4. Did we ship user-facing value, rather than spend the last hour on abstraction?
5. Are all “done” claims tested with evidence?
6. Is the next work package inside the original mission and eight-hour priorities?

## 10. Autonomous ~8-hour execution strategy (adapt to actual environment)

This is a **priority schedule**, not a claim the agent can guarantee 8h availability.

| Window (illustrative) | Lead responsibility | Delegated delivery | Gate |
|---|---|---|---|
| 0–0:30 | One clarification batch; inspect repo, verify toolchain; choose stack; initialize state | short architecture/UX/content spikes | repo builds or documented blocker |
| 0:30–2:00 | Set contracts and integrate first path | coffee curriculum + responsive Desktop 2D learning loop | runnable onboarding → interactive lesson → result |
| 2:00–3:15 | Validate product continuity | Mobile real-world assistant, persistence; content expansion | mobile guided practice works, resumed state |
| 3:15–5:00 | Integrate and QA XR independently | VR coffee scene and actual interaction sequence; graceful fallback | core XR action sequence implemented; desktop still works |
| 5:00–6:15 | Broaden without breaking | espresso fault diagnosis; pour-over route; game feedback/polish | 3+ complete modules, second track started or complete |
| 6:15–7:15 | Stabilize and adapt | independent QA, accessibility, smoke/unit tests, responsive bugs | build/test green, no blocker in core flow |
| 7:15–8:00 | User-view review; finalize | fill top user-visible gaps, sources/docs, release QA | delivery report, truthful scope and unverified hardware |

Adapt by actual test findings. If no headset, **do not block** XR implementation, but mark immersive path unverified and prioritize stable browser pathways. If a dependency breaks, pivot quickly to a smaller stable feature. Do not spend 90 minutes fighting one shader or library.

### Continuous prioritization, after P0 is met
When the app works, do not stop merely because the first demo renders. Repeatedly select the highest-value backlog task with a bounded work package; build → test → record → integrate. Possible order: lesson depth → scenario feedback → polish/audio → tutorialization → mobile usability → XR comfort → performance → richer asset interactions → automated tests. Stop when time/usage/environment constraint hits or high-value backlog is truly exhausted. Never leave repo intentionally broken.

### Checkpoint/commit policy
Commit coherent working milestones locally, if approved; no push/deploy unless user authorized. Before a risky change, checkpoint; after each feature, run relevant tests and preserve a working version. Never delete user assets or overwrite an existing repository without confirmation. Persist state after interruption even when tests fail.

## 11. Examples of detailed learning and interaction loops

### Espresso: Desktop decision lab
1. User sees a beautiful espresso preparation scene *as an illustration*, not forced 3D.
2. Learns dose vs beverage yield and varies two sliders: display correct ratio live.
3. Receives a hypothetical scenario: “18 g in, 54 g out, thin taste” (marked illustrative). Choose one candidate adjustment and explain rationale.
4. Feedback explains variables and uncertainty, optionally suggests measuring next real shot.
5. Results record understanding, not real-life skill; invite optional real-world/mobile practice.

### Espresso: XR coffee counter mission
1. Player enters compact workbench, receives optional guided mission “prepare a first shot”.
2. Orient toward machine and tools; grab portafilter using controller, place at attachment zone; make insertion feedback generous in guided mode.
3. Move cup, choose brew button, observe simplified illustrative extraction; inspect simple dashboard of sequence/accuracy (not real beverage taste).
4. Assisted round removes some cues; independent round removes most while keeping accessibility and reset.
5. At the end, show what was practiced (spatial tool use, task order) and what still requires real haptic practice.

### Mobile: real cup coach
1. User selects equipment / optional recipe; no assumption of specific machine.
2. Clear checklist and big step action. User must confirm actions; use timers only where helpful.
3. User enters dose, yield, time and tasting notes, or skips unknowns.
4. App calculates ratio and shows an appropriately modest adjustment suggestion with one-variable-at-a-time reasoning; asks whether to log a second attempt.
5. Allow interruption, resume, muted audio, no surprise microphone/camera use.

## 12. Testing matrix and honest verification

- **Automated:** TS type-check/build, domain tests (ratios, progression, activity steps, reset, evidence flags, fallback), a mobile-size E2E flow, desktop-size E2E flow, empty-state/network-failure behavior.
- **Manual desktop:** onboarding, curriculum, interactive ratio, quiz feedback, guided/assisted differences, progress persists, keyboard focus.
- **Manual mobile:** narrow viewport, touch targets, guided practice with hands-busy mode, pause/resume, self-report clarity.
- **XR compatibility:** feature detection, no-XR fallback; controller scene actions; clean session exit; framerate/perf on actual headset **only if hardware present**. If none, record NOT TESTED ON HEADSET, not PASS.
- **Content:** factual source review, safety note review, absence of deterministic taste claims, user-feedback clear origin.
- **Failure handling:** denied microphone, no headset, offline, missing asset, data migration, XR session denied, timer aborted.

Product-level smoke scenario: user with **only a phone** starts as a beginner, learns a concept, completes an exercise, opens real-world step guidance, logs a trial, sees a useful next step; a desktop-only user gets a complete lesson; a headset user can attempt a VR activity when available; all experiences persist progress.

## 13. Deliverables and exit report (must exist at end)

1. Runnable app source, lockfile, setup instructions, dev/build/test scripts.
2. Cohesive responsive UI and real beginner coffee lesson content, at least P0 scope or honest partial with working demo.
3. Functional mobile real practice assistant and real, tested mode fallback.
4. Immersive VR activity implemented and clearly labeled **hardware-verified** or **hardware-unverified**.
5. Versioned content schema / shared progress, simple components reusable in future skills.
6. Tests plus QA logs, screenshots/recordings if environment enables them, no fabricated evidence.
7. `docs/DECISIONS.md`, `docs/EXECUTION_STATE.md`, `docs/BACKLOG.md`, `docs/CONTENT_SOURCES.md`, `reports/DELIVERY.md`.
8. `reports/DELIVERY.md` describes: user-visible feature list, installation/launch, target browsers, tested evidence, **remaining bugs**, asset licenses, security/safety issues, usage/billing constraints encountered, exact next 3 improvements.

**Final user-facing update:** short feature walkthrough, exact commands, testing claims, honest missing pieces; do not present mocked or partial content as a complete production-ready product.

## 14. Security, budget, and autonomy constraints

- Restrict development to project repository. Do not operate on personal files, emails, calendars, browser profiles or credentials.
- May install ordinary open-source dependencies locally if allowed by first-round permission. Respect package license and security advisories.
- Do not deploy, expose ports to the public Internet, purchase services, register accounts, or invoke paid API calls without explicit authorization. No hardcoded secrets. No `--dangerously-skip-permissions` as a default recommendation.
- Never run broad destructive shell commands such as `rm -rf` against unknown directories. Keep git recovery checkpoints.
- No long artificial agent loops; stop or record a recoverable blocker when no meaningful progress is possible. Token/usage/financial limits are real; report them rather than silently exceeding expectations.
- User may permit uninterrupted work, but actual Claude Code permissions and session limits still govern execution.

## 15. Suggested reading for implementation decisions (not mandatory dependencies)

- SCA Coffee Skills Program: https://education.sca.coffee/coffee-skills-program
- SCA Coffee Skills Course Catalog: https://education.sca.coffee/s/SCA-CSP-Course-Catalog.pdf
- MDN WebXR overview: https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API
- PlayCanvas docs: https://developer.playcanvas.com/
- Babylon.js docs: https://doc.babylonjs.com/
- Claude Code custom subagents: https://code.claude.com/docs/en/sub-agents
- Claude Code project memory / CLAUDE.md: https://code.claude.com/docs/en/memory
- Claude Code hooks: https://code.claude.com/docs/en/hooks
- Claude Code permissions: https://code.claude.com/docs/en/permissions

---

### Mission checksum reminder for compact summaries
> **Build a playable and usable beginner-first coffee learning product on one Web stack; Desktop 2D learning, Mobile real-world copilot, and optional meaningful WebXR spatial game; shared skill progress, honest feedback, genuine learning/gameplay, polished UX, tests and truthful delivery; one planner lead delegates to specialist agents; preserve canonical brief and execution state across compaction; spend available up-to-eight-hour autonomous window improving real product value, never merely extending planning.**
