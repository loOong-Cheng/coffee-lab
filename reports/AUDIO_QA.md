# Audio QA report (objective, offline renders)

Generated 2026-11-08T00:07:52.649Z by `node src/audio/__render__/run-audio-qa.mjs` in headless HeadlessChrome/158.0.8127.18.

No one on the build team can listen, so these numbers are the evidence: each mood and each SFX is rendered with `OfflineAudioContext` through the **same mixing graph as the app** (buses → master → glue compressor → −3 dBFS limiter) at **master volume 1** (the worst case for clipping; the app defaults to 0.7 ≈ −6 dB). Loudness is K-weighted, BS.1770-style (400 ms gated blocks, 3 s short-term for LRA). These checks prove the audio is clean, balanced and varied. They cannot prove it *sounds nice*: that still needs a human ear. WAV previews are in `reports/audio/`.

## Music moods

Render: 45 s per mood, seed 7. “Body” excludes the first 6 s (fade-in/intro).

| Mood | Peak dBFS | Integrated LUFS (body) | LRA LU (body) | Silent share (body) | Energy <150 Hz / mid / >4 kHz | NaN | Sections heard | Result |
|---|---|---|---|---|---|---|---|---|
| cafe | -12.9 | -25.3 | 5.5 | 0% | 40% / 60% / 0.0% | 0 | intro, A | PASS |
| focus | -17.6 | -29.4 | 3.1 | 0% | 38% / 62% / 0.0% | 0 | intro, A | PASS |
| lab | -13.6 | -28.3 | 2.9 | 1% | 56% / 44% / 0.0% | 0 | intro, A | PASS |
| bossa | -13.4 | -25.1 | 2.1 | 0% | 54% / 46% / 0.0% | 0 | intro, A, B | PASS |
| kissa | -14.8 | -27.5 | 4.8 | 0% | 53% / 47% / 0.0% | 0 | intro, A | PASS |
| bar | -12.7 | -25.3 | 1.7 | 0% | 55% / 45% / 0.0% | 0 | intro, A | PASS |

Thresholds: peak ≤ -1 dBFS; integrated -30…-18 LUFS (background level); LRA 0.5…12 LU; silent share ≤ 10%; energy above 4 kHz ≤ 8% and below 150 Hz ≤ 60% (fatigue/boom); no NaN.

## Variety over 10 minutes (generative score, seed 11)

| Mood | Bars | Cycles | Sections (count) | Distinct progressions | Exact section repeats | Distinct chords | Keys used | Tempo range | Melody notes/min | Events/bar (mean / max) | Energy range | Result |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| cafe | 201 | 6 | intro×1 A×18 B×6 break×2 | 24 | 0/27 | 45 | F Ab Bb | 79–82 | 34 | 20 / 25 | 0.44–0.95 | PASS |
| focus | 151 | 5 | intro×1 A×13 B×5 break×2 | 17 | 0/21 | 17 | D G | 60–61 | 12 | 4 / 8 | 0.39–0.73 | PASS |
| lab | 226 | 7 | intro×1 A×20 B×7 break×3 | 18 | 0/31 | 19 | C | 88–92 | 42 | 27 / 33 | 0.46–0.92 | PASS |
| bossa | 321 | 10 | intro×1 A×29 B×9 break×4 | 29 | 0/43 | 33 | C D | 125–131 | 36 | 29 / 32 | 0.44–0.88 | PASS |
| kissa | 165 | 5 | intro×1 A×15 B×5 break×2 | 23 | 0/23 | 32 | Eb Ab | 64–67 | 25 | 17 / 22 | 0.40–0.80 | PASS |
| bar | 261 | 8 | intro×1 A×23 B×8 break×3 | 25 | 0/35 | 34 | F G | 102–106 | 48 | 26 / 32 | 0.48–0.92 | PASS |

Thresholds: ≥ 6 distinct section progressions in 10 min; 0 exact whole-section repeats; ≤ 140 note events per bar (CPU).

## Sound effects

| SFX | Peak dBFS | Loudness LUFS (max 100 ms) | Max momentary LUFS (400 ms) | Audible length s | NaN | Result |
|---|---|---|---|---|---|---|
| tap | -8.7 | -22.3 | -28.3 | 0.11 | 0 | PASS |
| select | -12.8 | -22.0 | -27.7 | 0.23 | 0 | PASS |
| correct | -13.1 | -18.9 | -22.3 | 1.47 | 0 | PASS |
| incorrect | -13.1 | -21.0 | -25.2 | 0.44 | 0 | PASS |
| complete | -11.3 | -18.9 | -20.6 | 1.69 | 0 | PASS |
| levelUp | -10.0 | -17.7 | -19.5 | 1.78 | 0 | PASS |
| grind | -11.7 | -20.0 | -20.9 | 1.75 | 0 | PASS |
| pour | -9.0 | -20.0 | -21.0 | 1.61 | 0 | PASS |
| steam | -16.2 | -20.0 | -22.9 | 1.32 | 0 | PASS |
| drip | -8.8 | -20.1 | -23.1 | 1.58 | 0 | PASS |
| timer | -16.8 | -19.0 | -22.3 | 1.42 | 0 | PASS |
| snap | -9.2 | -22.2 | -28.2 | 0.13 | 0 | PASS |
| whoosh | -13.1 | -22.0 | -27.5 | 0.40 | 0 | PASS |
| reset | -8.5 | -22.1 | -27.3 | 0.38 | 0 | PASS |
| espresso | -16.0 | -20.0 | -22.5 | 2.28 | 0 | PASS |
| serve | -11.4 | -20.0 | -25.8 | 0.89 | 0 | PASS |
| ice | -10.2 | -20.0 | -21.7 | 0.55 | 0 | PASS |
| milkSteam | -15.5 | -20.0 | -22.4 | 2.19 | 0 | PASS |
| milkPour | -9.6 | -20.0 | -20.7 | 1.42 | 0 | PASS |
| tamp | -10.1 | -20.3 | -26.3 | 0.22 | 0 | PASS |
| knock | -10.2 | -20.1 | -26.1 | 0.21 | 0 | PASS |
| orderBell | -18.2 | -19.0 | -22.5 | 1.38 | 0 | PASS |
| bloom | -12.0 | -21.0 | -24.0 | 1.27 | 0 | PASS |

- Loudness spread across all SFX: **4.6 LU** (max 8) → PASS
- Median SFX loudness -20.0 LUFS vs loudest music mood -25.1 LUFS: **5.1 LU** headroom (min 4) → PASS
- Thresholds: peak ≤ -1 dBFS; loudness (max 100 ms, K-weighted) -27…-15 LUFS; no NaN.

## Verdict

**All objective checks pass.** Subjective listening is still pending (no human has heard these renders yet).
