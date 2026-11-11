# Café Rush — design (M1)

The XR Lab coffee bar game requested in U6 (see `docs/DECISIONS.md`, 2026-11-11). It is an Overcooked-style counter: every tool and ingredient is in reach, customers order different coffees, and you make and serve them against the clock. It aims to be "playable, rewarding, and also learning (real ratios on the wall)". The waits are tuned as a time-management skill that gets "progressively tighter".

M1 is the design, a pure deterministic simulation (`src/xr/rush/`) and bot tuning (`reports/GAME_TUNING.md`). M2 adds the 3D/XR scene and the accessible action list. Both drive the same action API.

## 1. Core loop and stations

**See the order → plan → act on stations → fill the waits → serve → read the feedback → next customer.**

| Station (slot) | Holds | Verb(s) | Process (game time) |
|---|---|---|---|
| Grinder | portafilter or dosing cup | `grind` | 2.5 s |
| Espresso machine, 2 groups (`group1/2`) + drip trays (`tray1/2`) | portafilter / cup | `startShot{group, style}` | ristretto 6 s · espresso 7 s · lungo 9 s |
| Knock box | (held portafilter) | `knock` | — |
| Fridge | (held pitcher) | `fillMilk{ml}`, using the café pitcher marks 15/50/120/200 | — |
| Steam wand (2 pitchers) | pitcher | `steam{texture}`: steamed / microfoam / foam | 3 s + 2.5 s per 100 ml; overheats 6 s after "ready" |
| Hot-water spout | cup | `dispenseWater{ml}`: 60/100/150/200 | about 1.2 s per 100 ml |
| Kettle base | kettle | `heatKettle` | 12 s, then 4 main pours |
| Dripper (pour-over), phin | cup under the brewer | `pour` dosing cup → grounds; `pour` kettle → bloom, then the main pour | bloom 5 s / 4 s · drawdown 9 s / 12 s |
| Ice bin, extras bar | (held cup) | `addIce`, `addExtra{chocolate, ice-cream, sugar, condensed-milk, milk-tea}` | — |
| Cup shelf | — | `takeCup{demitasse, small, medium, large}` | — |
| Counter ×8 | anything | `grab{slot}` / `place{slot}` | — |
| Pass, bin | (held cup / vessel) | `serve{orderId}`, `trash` | — |

**Action API:** `reduce(state, action)` is the only entry point. Player actions are the verbs above. The meta actions are `pause`, `resume`, `reset` and `endShift`. Time advances only through `tick{dtSec}`, which runs fixed 100 ms steps and carries the remainder. A rejected action never changes the world. It returns `lastResult {ok:false, code}` and gives a one-line reason, e.g. "The basket is empty — grind first." Items being processed are locked in place.

Rush always pulls doubles (18 g → 36 g, as on the wall). Every café spec in the roster accepts a double.

## 2. Drink roster by level

The café drinks are a subset of `BUILD_SPECS`, judged by the café's own `evaluate()`. Pour-over has no café spec yet, so it uses two Rush-local `FILTER_SPECS` (see section 11).

| Level | New drinks (`unlocks`) | Also ordered |
|---|---|---|
| 1 Espresso bar | espresso, ristretto, lungo (shot length = ratio) | — |
| 2 Milk classics | macchiato, cortado, cappuccino, flat white, latte, mocha | espresso |
| 3 Black, iced & world | americano, long black (water order), iced latte, affogato, café cubano, yuenyeung | cappuccino, flat white, latte |
| 4 Pour-over & drip | pour-over cone, Japanese iced pour-over, Vietnamese phin | americano, latte, espresso, cappuccino |
| 5 Rush hour | — (all 18, weighted) | everything |

Moka, ibrik and pot drinks stay in the 2D Café Counter. Cubano and yuenyeung use the espresso route, which their café specs accept.

## 3. Recipe wall (derived, never typed in)

`recipeWall(level)` lists every drink unlocked so far and flags the new ones. Each entry carries:

- `doseG` / `outG` / `milkMl`, the recipe summary and the time note, all read from `src/content/drinks.ts`;
- `ratio`, computed from those numbers (1:2, 1:1.3, 1:3, 1:16.7 …);
- the game's marks (pitcher ml, water ml, cup, shot style), taken from the canonical café build;
- the café spec `keyPoint` as the one-line "what makes it this drink".

When the Atlas and a game mark differ, the wall shows both, e.g. "latte: milk ≈ 220 ml → fill to the 200 mark". Every entry is labelled *illustrative starting point*. Tests assert that the wall numbers equal the Atlas, and that every real-time reference on a label is quoted from it.

## 4. Time model

All clocks are **compressed game time**. Every process label carries its real reference:

| Process | Game | Real reference on the label (source) |
|---|---|---|
| Espresso / ristretto / lungo | 7 / 6 / 9 s | 25–35 s / 20–30 s / 30–45 s (Atlas timeNote) |
| Steam milk | 3–8 s | depends on wand and volume; many stop at 55–65 °C (Atlas / espresso track) |
| Overheat | after 6 s | around 70 °C and above, milk tastes cooked (espresso track) |
| Bloom / pour-over total | 5 s / 14 s | bloom 30–45 s; total about 2:30–4:00 (Atlas) |
| Phin | 4 + 12 s | about 4–5 min (Atlas) |
| Kettle, grind, hot water | 12 / 2.5 / ~2 s | "a few minutes" / "a few seconds" (qualitative; no sourced number) |

**Short, purposeful waits.** No single wait is longer than about 12 s. The two groups, two pitchers, the kettle and the drip brewers run in parallel, so the good play is to fill a shot with steaming, the next cup or the dripper. Bots measure this as idle time: under 20% for the average bot is the target, and the result is 1–12% (`reports/GAME_TUNING.md`).

## 5. Customers, patience and arrivals

- Orders are drawn from the level `mix` (weighted, no immediate repeats) using a seeded RNG.
- New customers enter only while fewer than `maxOpenOrders` are waiting. This queue cap self-regulates: a slower player meets fewer customers rather than an avalanche. No new customers arrive in the last `lastCallSec`.
- **Patience** = (drink work estimate × `patienceMult` + `patienceSlackSec`) × in-shift ramp.
  - The work estimate is the critical path of the drink's processes, with milk running in parallel with the shot, plus 1.3 s per required action. Complex drinks therefore get proportionally more time.
  - Ramp: arrival gaps shrink to `rampArrivalEnd` and patience to `rampPatienceEnd` by the end of the shift.
- A **timeout** costs no points. The customer leaves with a gentle tip ("while a shot runs, prep milk or the next cup") and the streak resets.

## 6. Scoring and rewards

| Event | Effect |
|---|---|
| Correct ("textbook") | base = 20 + 10 × make steps (coffee, milk, water, ice, each extra) + speed tip (up to 50% of base × patience left) + streak bonus (+2 per consecutive perfect serve, cap +10) |
| One thing differs | accepted at 50% of base, no tip, streak resets. The feedback names the difference and why it matters |
| Two or more differ / no coffee | not accepted: the cup comes back to your hands to fix or bin. The order stays open; no points are lost |
| Shift stars | points ÷ menu value of every order that arrived: 1★ ≥ 40%, 2★ ≥ 75%, 3★ ≥ 110% (needs tips) |

**Unlocks:** one star on a level opens the next (`unlockedLevels`), and each level adds a drink family to the wall.

**No manipulative mechanics:** no daily streaks, no loot, no energy, no penalties that compound. The streak lives inside one shift only. The result screen shows what was practised, not a login reward.

## 7. Difficulty progression (final tuning, `config.ts`)

| | L1 | L2 | L3 | L4 | L5 |
|---|---|---|---|---|---|
| Shift / arrival gap (s) | 150 / 12 | 180 / 12 | 180 / 11 | 210 / 11 | 240 / 11 |
| Patience × / slack (s) | 2.4 / 12 | 2.2 / 12 | 1.9 / 10 | 1.9 / 10 | 1.8 / 10 |
| End-of-shift ramp (arrival / patience) | .80 / .90 | .80 / .88 | .78 / .86 | .78 / .85 | .75 / .82 |
| Max open orders | 2 | 2 | 3 | 3 | 3 |

Bot results (40 seeds per cell):

- average bot ≥1★: 100 / 100 / 98 / 98 / 80%;
- expert bot 3★: 100 / 93 / 98 / 80 / 73%;
- novice bot ≥1★ on L1: 100%.

Full table and notes: `reports/GAME_TUNING.md`.

## 8. Feedback on mistakes

Feedback states **what differs and why**:

- "Milk: you gave Microfoam — this order wants Foam" plus the café spec reason ("A cappuccino is defined by its thick, airy foam…");
- when the cup is a textbook version of another drink: "That is a textbook flat white — the order was a cappuccino";
- process mistakes get their own explanations: a shot with no cup, a bloom cut short, overheated milk, two shots in one cup, an empty cup.

## 9. Accessibility

- **Relaxed mode:**
  - no countdowns, no overheating, no tips;
  - customers wait indefinitely (2 at a time);
  - the shift ends after 8 serves;
  - stars come from the share of textbook serves (50 / 75 / 95%).
- **Guidance tiers** (M2): guided shows the wall entry and next-step ghost cues on the ticket; assisted shows the wall only; independent shows neither. The tier is recorded in the event.
- The same actions are available from a keyboard/screen-reader action list (M2). Pause works at any time; reset starts a fresh attempt.
- The game never relies on colour alone, keeps a seated counter height, mutes all sound, and honours reduced motion (M2 scene rules from the XR Lab).

## 10. Honesty labels

- Evidence is `simulated` (`rushCompletionEvent`, activity `xr-cafe-rush-l<level>`). The claims block is all false: realSkill, taste, gripForce, haptics, realTiming.
- Every timer shows "game time", next to its real reference.
- The wall says "illustrative starting point; recipes vary by café".
- Results list what was practised and what was not.

## 11. What it does NOT teach

- Real timing: the clocks are compressed.
- Grind size, dose weighing, distribution, tamping.
- Steaming technique or milk temperature by feel.
- Latte art.
- Taste: the game never claims a drink would taste good.
- Safe handling of hot equipment. The Atlas safety notes apply in real life.

## 12. Open items for M2

1. **Café refactor (not done; outside M1 ownership):** add `'pourover'` to café `METHODS` and move the two `FILTER_SPECS` into `BUILD_SPECS`, so the 2D counter can serve pour-over too and Rush has one source of truth.
2. **Handling time:** the action list is instant, while XR has real reach time. Should list mode add a small per-action cost?
3. **Show patience bars and an "about to leave" cue.** Triage is the skill that separates experts at L5.
4. **Station layout and reach** for a seated counter; whether both groups stay in reach.
5. **Wire into the XR picker:** extend `MissionId` or add a game entry, and decide where Relaxed mode and the tier choice live in the lobby.

## 13. M2 status (2026-11-11)

- **M2a, done:** XR Lab picker "Games" entry → `#/xr?game=rush`.
  - Lobby: level select; Relaxed toggle; guidance tier.
  - Level unlocks are derived from `simulated` events (`rush:<level>`, score = stars ÷ 3).
  - HUD: patience bars, an "about to leave" cue, score/tips/streak, pause, and the honest labels.
  - The action list costs +0.5 s of game time per action (`INPUT_COST`, not in Relaxed mode).
  - Guided coach: the expert planner with no errors gives the next step and a "while that brews…" hint.
  - 2D wall, results with per-order what/why, and SFX.
  - The pour-over specs now live in `src/xr/rush/filterSpecs.ts`, with a TODO to move them into `BUILD_SPECS`.
- **M2b, done:** lazy Babylon counter.
  - Layout: every target within ±0.75 m of one spot.
  - A click or tap goes through `actionsForTarget()` to the same reducer. A target with several valid actions opens a choice bar.
  - Progress bars, a guided target ring, the wall on the back wall, seated height, and reset view.
- **M2c, done (HARDWARE-UNVERIFIED — built and tested without a headset):** WebXR mode on the 3D counter. See section 14.

- **Tuning change:** L2 holds 2 open orders, with patience × 2.2. The novice bot reaches ≥1★ in 83% of shifts, and L3–L5 config is unchanged.

## 14. VR mode (M2c) — controls, HUD, comfort, testing

**Status: hardware-unverified.** No headset was used to build or test it. CI covers the gate, the pure controller mapping and a test-only emulation of the panels. Nothing else is claimed.

**Gate:**
- "Enter VR" appears on the 3D counter only when `navigator.xr.isSessionSupported('immersive-vr')` is true in a secure context (`useXrSupport` → `xrEntryState`), WebGL works, and Babylon's WebXR helper initialised.
- A denied or failed session shows an alert ("The VR session could not start"), and the 3D counter and the action list keep working.
- Without `navigator.xr` there is no offer and no crash.
- The session uses `immersive-vr` with a `local-floor` reference space and controllers only: no hand tracking, no teleport, no locomotion.

**Controller map.** Every input goes through `src/xr/rush/vr.ts`, which is pure and unit-tested, and ends in the same `reduce()` actions as the action list and the mouse.

| Input | What happens |
|---|---|
| **Trigger** on the target under the ray | `onTrigger` → `actionsForTarget`. One option acts at once; several open a small in-world **choice panel** next to the target, picked with ray + trigger (✕ closes it). "Trigger = use, grip = grab": when a station verb exists (grind, pull a shot…), the grab option is left to the grip. With nothing else to do, the trigger picks the item up (mouse parity). |
| **Grip** near an item (≤ 16 cm) or on the item under the ray | `grab{slot}`. The item rides on that controller. Gripping the cup shelf offers the cup sizes. |
| **Grip release** near a free slot that accepts the item | `place{slot}`. The snap radius depends on the tier: guided 20 cm, assisted 14 cm, independent 10 cm. Pointing the ray at a free slot also works. Released elsewhere, you keep carrying the item, and the HUD says how to put it down. |
| **Hover** | The target ring grows and the item gets an outline. While you carry an item, the ring of the snap target grows bigger. |
| **Haptics** | Optional subtle pulses via `gamepad.hapticActuators[0].pulse`, feature-detected; nothing happens where they are unsupported. They mark hover, snap, a successful action or a rejected one. They are an affordance only and never claim real touch, weight or force. |

**In-headset HUD.** The panels are world-anchored to the counter, so Recenter moves them too. They are all ray-operated, so nothing needs a physical reach past the ±0.75 m counter.
- **Left, angled, about 1 m away:**
  - Café Rush · level;
  - the "Simulated · game time — real shot ≈ 25–35 s" labels;
  - score, tips and streak; time left (game time) or "served n/8" in Relaxed mode;
  - what is in your hands;
  - the guided "suggested next step";
  - the last feedback with what/why.
  - Buttons: Pause/Resume, End shift, Recenter, Seated/Standing, Exit VR.
  - A footer gives the controller hint and "hardware-unverified".
- **Order rail above the back right:** up to 3 tickets, each with drink, customer and a patience bar coloured green/amber/red. The ticket also shows either the "⚠ About to leave!" cue (≤ 30% patience; hidden in the independent tier, as in 2D) or the seconds left.
- **Recipe wall:** scaled ×1.3 in VR. Line text is about 2.2 cm, read at about 1.2–1.3 m, roughly 1° — hardware-unverified readability.
- **Results panel (centre) at the end of the shift:**
  - stars, points, counts, and the last 3 orders with the first "what differs";
  - "Saved as simulated practice";
  - Play again (a fresh shift in the same session), Back to lobby, Exit VR.
  - The DOM results screen shows when you leave VR.

**Comfort:**
- No forced camera motion, no locomotion, nothing moves the user. Recenter places the counter 0.62 m in front of where you look.
- Seated/Standing switches the counter between 0.74 m and 0.92 m.
- The pendant lamp is raised in Rush so it never hangs between your eyes and the wall or the order rail.
- The session pauses the shift when it loses focus, e.g. the system menu.
- In VR the session's frame loop drives the game clock at 10 Hz (the sim runs fixed 100 ms steps), and the page timer stands down. The flat 3D fallback halves its draw rate after 1.5 s without input, as the missions do; the immersive session always draws every frame.

**Performance caveats (unmeasured on device):**
- 4 GUI textures: HUD 1024², orders, results and choice. They only re-render when their content key changes; the order rail re-renders about once a second per ticket.
- The scene is the same low-poly, merged counter as M2b (draw calls < 150 on desktop).
- No foveation or framebuffer-scale tuning yet.

**How to test on Quest 3:**
1. Open the live HTTPS site in the Quest Browser → XR Lab → Café Rush → choose a level → "Play on the 3D counter".
2. Wait for "Enter VR" (under the canvas) and press it. Allow the immersive prompt.
3. Stand or sit about where you want the counter, look forward, and press **Recenter** on the left panel. Use **Seated** if you are sitting.
4. Try the sequence:
   - grip the portafilter on group 1, carry it to the grinder and let go;
   - trigger the grinder;
   - grip it back onto group 1;
   - trigger the cup shelf → choose a cup → grip-release it under group 1;
   - trigger group 1 → choose the shot;
   - grip the cup → trigger the pass to serve.
5. Check:
   - the laser stops on targets;
   - the hover ring and outline;
   - the haptic tick (if any);
   - the ticket bars and the about-to-leave cue;
   - the wall and HUD readable without leaning;
   - choice panels reachable;
   - Pause, End shift → results panel → Play again;
   - Exit VR returns to the page.
6. Report anything off, e.g. the panel distance or text size, the snap radius, the grip/trigger mapping, or frame drops. Until then, VR stays **hardware-unverified**.

