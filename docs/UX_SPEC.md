# Coffee Lab — UX spec (experience-designer)

Source of truth for look, feel, sound and interaction rules. Build screens from `src/ui` (barrel `src/ui/index.ts`) and tokens in `src/styles/tokens.css`. Don't add your own colours, shadows or font sizes. To see everything at once, mount `src/ui/Gallery.tsx` (dev only).

## 1. Identity and tone
- **Warm café notebook.** Paper, milk, crema and roast colours. Café-menu serif headings (`--font-display`, with Songti/Noto Serif for CJK and YaHei instead of SimSun) over a system sans body. Generous whitespace, 18px card radius, soft warm shadows. Focus rings use a deliberately off-palette blue so they are always visible. The light theme is the default; dark is a "roastery at night" palette. Every text token passes WCAG AA (≥4.5:1) in both themes, and control borders and focus rings pass 3:1.
- **Illustrations** are original flat SVGs (70 scenes + 2 interactive station diagrams). They follow the theme and contain no external assets. More than 150 content, drink, equipment and category keys resolve through `ILLUSTRATION_ALIASES`. Add new keys there instead of drawing a new picture.
- **Voice:** a friendly barista who is precise and honest about uncertainty. Use short imperative verbs and always say what to do next. Give numbers with units ("18 g → 36 g, 1:2"). Wrong answers get "Not quite — here's why", never "Wrong!". Never promise a "perfect shot". Recipes are always "a starting point". zh and en are written as peers, not translations; zh body text uses line-height 1.75.

## 2. Platform-conditioned UX (not one UI for all)
| | Desktop: study desk | Mobile: kitchen mode (real-world guide) | XR: workbench (sim) |
|---|---|---|---|
| Purpose | Concepts, cause and effect, decisions | Hands-busy coaching while using real gear | Spatial order and tool handling |
| Layout | Reading column (`--measure` 68ch) + side rail (ProgressRing, GuidanceSelector, key concepts). Diagrams inline at ≥560px | One step per screen at `--text-kitchen`. `KitchenActionBar` is sticky at the bottom: **Done** is the largest button and sits lowest (thumb zone); Back / Repeat / Help are 64px tiles | Compact counter at seated height. Panels sit 1–1.5 m away; targets are within arm's reach |
| Input | Mouse + keyboard: ←/→ step, H hint, R retry, 1–4 pick (show with `<Kbd>`) | Big taps only, no drag targets. Help opens a `Sheet` (no navigation). Timers start only when the user taps them. Speaking steps aloud is opt-in | Controller ray/grab; hand tracking optional. Recenter + Reset always reachable |
| Honesty | Results = `assessed_answer` | Every step and log = **self-reported** (always-visible note + `EvidenceBadge`). No invented values | Results = `simulated`. The end screen lists what was *not* trained (touch, force, taste) |
| Comfort | — | Optional wake-lock + resume banner ("Continue at step 4 of 9?") | No locomotion, camera never auto-moves, seated default, high-contrast text panels (cap height ≥ ~1.4° visual angle), snap zones glow + `snap` sound |

## 3. Guidance tiers: what actually changes
The support pips show the tier: 3 filled = guided, 1 = independent. Learners can switch tiers at any time. After 2 misses in a row the app *suggests* "Want more support?" and never forces it.

| Activity | Guided | Assisted | Independent |
|---|---|---|---|
| sequence | Steps arrive one at a time with their "why" visible; each placement is checked immediately | All steps shuffled; checked on submit; misconception feedback for the first wrong pair; hint button | Checked on submit only; feedback comes as a summary at the end |
| quiz | Hint shown; a wrong pick shows that option's feedback, then retry | Hint behind a button | Answers locked until the end, then a review with explanations |
| identify | Explore diagram first, then the target is `highlighted` + hint text | Numbered quiz pins; hint after a wrong pick | No highlight; name revealed after 2 misses |
| parameter-lab | Target band drawn on the slider + live ratio narration | Target shown as numbers only | No target shown; set the values, then press Check |
| diagnose | Observations annotated ("fast for this recipe") | Raw observations | Must choose one variable *and* a reason before feedback |
| guided-practice | Every detail, safety note and picture shown; timers suggested | Details folded; help on request | Checklist of step titles + recipe card; log at the end |
| XR mission | Ghost tool + arrow + forgiving snap | Glow on the target only | No labels; reset still available |

## 4. Feedback pattern (one pattern everywhere: `FeedbackPanel`)
Each panel has a status icon, the status in **words**, a "why" tied to the misconception, and a next action (Try again / Next / Show answer, offered after one attempt). Colour is only a secondary cue. Correct answers still get one line on *why* it works. The panel is announced to screen readers (`announce()`), and on desktop focus moves to it after submit. On diagrams, a wrong pick shows ✕ with a dashed ring and the name stays hidden. A right pick reveals the name with a ✓. Illustrative or simulated outputs always carry `Callout kind="illustrative"`. Safety is a separate, thicker-edged red `Callout` with a shield icon. It is never a toast.

## 5. Game loop and honest rewards
Loop: see a concrete challenge → act → get explanatory feedback → retry or change tier → apply to a real or simulated cup → reflect → the next challenge opens. Rewards:
- **Mastery per lesson**: a ProgressRing showing the share of checks-for-understanding passed.
- **Autonomy**: the highest tier completed ("Completed · Independent" GuidanceBadge).
- **Cups made**: a count of journal entries, *labelled self-reported*.
- **Unlocks**: suggested next challenges. Optional tracks never gate the core path.

No streaks, daily goals, push notifications, XP, loss-aversion copy or meaningless badges. Every empty state explains why it is empty and offers a next step.

## 6. Motion and sound
- **Motion** only explains a change: state change, cause and effect, a hint pulse on a pin. Use the `--dur-*` tokens. The only loops are the hint pulse and the spinner. Reduced motion (OS setting or `[data-reduced-motion="on"]`) collapses all durations to 1ms and stops the pulses. `="off"` lets a user override the OS setting.
- **Sound** is all procedural Web Audio (`src/audio`); there are no audio files. SFX are on by default but can only play after the first gesture (`unlock()`). **Music is off by default** and is never auto-played. One master volume. Put `MusicControl` (compact) in the header; use the `panel` variant in a drawer or in Settings. No sound carries meaning on its own: every sound has visible feedback. `incorrect` is a soft "hmm", never a buzzer. In kitchen mode the timer ding comes with a visual change.
- **Music is a generative score, not a loop.**
  - Song form: intro → A A B A, plus a sparse "breather" section every 2 cycles.
  - Each section has 2–3 progression variants, with light reharmonisation and occasional key and tempo drift.
  - Chords are voice-led; melodies are built from motifs (call → rest → varied call → resolve) and never sit a minor 9th above a chord tone.
  - Dynamics come from section energy plus a phrase swell.
  - Moods: `focus` (no drums) for lessons and quizzes; `lab` for labs and XR; `cafe` for home, atlas and journal.
  - Culture moods (`bossa` for Brazil, `kissa` for Japan's jazz-listening cafés, `bar` for the Italian espresso-bar morning) suit the Atlas and the culture track.
  - Culture moods take their *harmony and rhythm* from the tradition (bossa syncopation, piano-trio ballads, bright two-feel). They avoid caricature instruments (no accordion or mandolin clichés) and never quote real songs. Each mood carries a bilingual description and an "inspired by" line (`MUSIC_MOODS`).
- **SFX palette (23):** UI (`tap select snap reset whoosh`) ≈ −22 LUFS; feedback (`correct incorrect complete levelUp timer orderBell`) ≈ −19; coffee (`grind pour steam drip espresso serve ice milkSteam milkPour tamp knock bloom`) ≈ −20. Loudness is calibrated with `SFX_TRIM`; music sits ≥4 LU below the median SFX.
- **Audio QA:** `node src/audio/__render__/run-audio-qa.mjs` renders everything offline in headless Chromium through the live mixing graph. It writes `reports/AUDIO_QA.md` with pass/fail checks and WAV previews to `reports/audio/`. Re-run it after any audio change.

## 7. Accessibility checklist (apply to every screen)
- [ ] Every control is reachable by keyboard; focus is visible (`:focus-visible` ring); no keyboard traps outside modals.
- [ ] Touch targets are ≥44px (`--tap-min`), and ≥64px in kitchen mode (`--tap-kitchen`). Small buttons grow on `pointer: coarse`.
- [ ] Colour is never the only signal: icon + words (FeedbackPanel, Callout, EvidenceBadge, Chip ✓, Switch ✓, diagram ✓/✕).
- [ ] Text is ≥4.5:1 and UI borders ≥3:1 in both themes. Use `--color-crema` and `--color-border` only for decoration.
- [ ] Dialogs and Sheets: labelled, focus moves in, Tab is trapped, Esc closes, focus returns to the opener.
- [ ] Single choice uses `SegmentedControl` (radio semantics, arrow keys); on/off uses `Switch`; progress uses labelled progressbars.
- [ ] Results are announced with `announce()` or FeedbackPanel; toasts are announced and pause on hover/focus.
- [ ] In quiz mode, diagram hotspots use "Part N" as the accessible name, so the answer never leaks.
- [ ] Reduced motion and mute are respected; nothing auto-plays.
- [ ] `lang` is set per locale; zh line-height is 1.75; no text is baked into images (only digits/units in SVGs).
