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
