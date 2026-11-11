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
| Patience × / slack (s) | 2.4 / 12 | 2.1 / 10 | 1.9 / 10 | 1.9 / 10 | 1.8 / 10 |
| End-of-shift ramp (arrival / patience) | .80 / .90 | .80 / .88 | .78 / .86 | .78 / .85 | .75 / .82 |
| Max open orders | 2 | 3 | 3 | 3 | 3 |

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
