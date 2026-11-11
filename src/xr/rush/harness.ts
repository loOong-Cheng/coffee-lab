/**
 * Deterministic tuning harness: N seeded shifts per level × bot, aggregated into the table in
 * reports/GAME_TUNING.md. Pure (no fs); the vitest file writes the report when asked.
 */
import { BOT_PROFILES, FIXED_STEP_MS, INPUT_COST, LEVELS, RUSH_LEVELS, SCORING, TUNING, type BotProfile, type RushLevelNo } from './config';
import { botTurn, createBot, type BotInput } from './bots';
import { coachSuggest, createCoach, listKey } from './play';
import { rushResult } from './record';
import { makeStream, seedMix } from './rng';
import { createShift, listAct, reduce, tick, type RushMode, type RushState } from './sim';

export interface ShiftRun {
  level: RushLevelNo;
  bot: BotProfile['id'];
  input: BotInput;
  seed: number;
  stars: number;
  score: number;
  correct: number;
  partly: number;
  wrongServes: number;
  timeouts: number;
  unservedAtClose: number;
  avgWaitSec: number;
  idleShare: number;
  actions: number;
  rejected: number;
  durationSec: number;
}

/**
 * A person following the guided coach (the QA gate #2 real-speed script, in game time): whenever a step
 * is suggested they read it for their latency, then do whatever the coach suggests at that moment. The
 * coach is the UI's own (`createCoach` / `coachSuggest`, refreshed when the action list changes).
 */
function followCoach(level: RushLevelNo, profile: BotProfile, seed: number, mode: RushMode, input: BotInput) {
  let s: RushState = createShift({ level, seed, mode });
  const coach = createCoach(level);
  const rand = makeStream(seedMix(seed, 0xb07));
  const dt = FIXED_STEP_MS / 1000;
  let key: string | null = null;
  let sug: ReturnType<typeof coachSuggest> = null;
  let actAt: number | null = null;
  let idleMs = 0;
  let actions = 0;
  let rejected = 0;
  for (let guard = 0; s.status === 'playing' && guard < 200_000; guard++) {
    const k = listKey(s);
    if (k !== key) {
      key = k;
      sug = coachSuggest(coach, s);
    }
    if (!sug) {
      actAt = null;
      idleMs += FIXED_STEP_MS;
    } else if (actAt === null) actAt = s.tMs + Math.round(profile.latencySec * (1 + profile.latencyJitter * (2 * rand() - 1)) * 1000);
    if (sug && actAt !== null && s.tMs >= actAt) {
      s = input === 'list' ? listAct(s, sug) : reduce(s, sug);
      actions += 1;
      if (!s.lastResult.ok) rejected += 1;
      key = null;
      actAt = null;
    }
    s = tick(s, dt);
  }
  return { s, idleMs, actions, rejected };
}

/** One seeded shift. `input: 'list'` routes every bot action through `listAct` (pays the list cost). */
export function runShift(level: RushLevelNo, botId: BotProfile['id'], seed: number, mode: RushMode = 'standard', input: BotInput = 'direct'): ShiftRun {
  const profile = BOT_PROFILES[botId];
  let s: RushState;
  let tally: { idleMs: number; actions: number; rejected: number };
  if (profile.followsCoach) {
    const f = followCoach(level, profile, seed, mode, input);
    s = f.s;
    tally = f;
  } else {
    s = createShift({ level, seed, mode });
    const bot = createBot(profile, seedMix(seed, 0xb07), level);
    const dt = FIXED_STEP_MS / 1000;
    for (let guard = 0; s.status === 'playing' && guard < 200_000; guard++) {
      s = botTurn(bot, s, input);
      s = tick(s, dt);
    }
    tally = bot;
  }
  const r = rushResult(s);
  return {
    level,
    bot: botId,
    input,
    seed,
    stars: r.stars,
    score: r.potential ? r.points / r.potential : 0,
    correct: r.correct,
    partly: r.partly,
    wrongServes: r.wrongServes,
    timeouts: r.timeouts,
    unservedAtClose: r.unservedAtClose,
    avgWaitSec: r.avgWaitSec,
    idleShare: s.tMs ? tally.idleMs / s.tMs : 0,
    actions: tally.actions,
    rejected: tally.rejected,
    durationSec: r.durationSec,
  };
}

export interface TuningRow {
  level: RushLevelNo;
  bot: BotProfile['id'];
  input: BotInput;
  shifts: number;
  star1: number;
  star2: number;
  star3: number;
  avgScore: number;
  avgWaitSec: number;
  timeoutsPerShift: number;
  /** Worst shift: most customers who walked out. */
  maxTimeouts: number;
  servedPerShift: number;
  idleShare: number;
  rejectedPerShift: number;
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/** Direct input = 3D counter / XR (bot latency stands for reach time). */
export const DIRECT_BOTS = ['novice', 'average', 'expert'] as const;
/** Action list (keyboard / screen reader / phone): every action also pays the list cost. */
export const LIST_BOTS = ['novice', 'average', 'expert', 'human-list'] as const;

export function runTuning(shifts = TUNING.shiftsPerCell, seedBase = TUNING.seedBase): TuningRow[] {
  const rows: TuningRow[] = [];
  const cells: Array<[BotInput, readonly BotProfile['id'][]]> = [
    ['direct', DIRECT_BOTS],
    ['list', LIST_BOTS],
  ];
  for (const [input, bots] of cells) {
    for (const level of RUSH_LEVELS) {
      for (const bot of bots) {
        const runs: ShiftRun[] = [];
        for (let i = 0; i < shifts; i++) runs.push(runShift(level, bot, seedBase + level * 10_000 + i, 'standard', input));
        rows.push({
          level,
          bot,
          input,
          shifts,
          star1: runs.filter((r) => r.stars >= 1).length / shifts,
          star2: runs.filter((r) => r.stars >= 2).length / shifts,
          star3: runs.filter((r) => r.stars >= 3).length / shifts,
          avgScore: mean(runs.map((r) => r.score)),
          avgWaitSec: mean(runs.map((r) => r.avgWaitSec)),
          timeoutsPerShift: mean(runs.map((r) => r.timeouts)),
          maxTimeouts: Math.max(...runs.map((r) => r.timeouts)),
          servedPerShift: mean(runs.map((r) => r.correct + r.partly)),
          idleShare: mean(runs.map((r) => r.idleShare)),
          rejectedPerShift: mean(runs.map((r) => r.rejected)),
        });
      }
    }
  }
  return rows;
}

export interface TargetCheck {
  label: string;
  value: number;
  target: string;
  met: boolean;
  /** value is a count, not a share */
  count?: boolean;
}

export function checkTargets(rows: TuningRow[]): TargetCheck[] {
  const get = (level: RushLevelNo, bot: TuningRow['bot'], input: BotInput = 'direct') => rows.find((r) => r.level === level && r.bot === bot && r.input === input)!;
  const out: TargetCheck[] = [];
  const n1 = get(1, 'novice').star1;
  out.push({ label: 'novice L1 ≥1★', value: n1, target: '≥ 90%', met: n1 >= 0.9 });
  const n2 = get(2, 'novice').star1;
  out.push({ label: 'novice L2 ≥1★ (M2: gentle milk intro)', value: n2, target: '≥ 50%', met: n2 >= 0.5 });
  for (const l of RUSH_LEVELS) {
    const v = get(l, 'average').star1;
    out.push({ label: `average L${l} ≥1★`, value: v, target: '≥ 60%', met: v >= 0.6 });
  }
  const e5 = get(5, 'expert').star3;
  out.push({ label: 'expert L5 3★', value: e5, target: '≥ 40%', met: e5 >= 0.4 });
  const idle = Math.max(...RUSH_LEVELS.map((l) => get(l, 'average').idleShare));
  out.push({ label: 'average idle (worst level)', value: idle, target: '< 20%', met: idle < 0.2 });
  // Action list (QA gate #2, QA-R09): a guided first-timer at ~1.8 s per action plus the list cost.
  const h1 = get(1, 'human-list', 'list');
  out.push({ label: 'list: human-list L1 ≥2★', value: h1.star2, target: '≥ 80%', met: h1.star2 >= 0.8 });
  out.push({ label: 'list: human-list L1 walk-outs (worst shift)', value: h1.maxTimeouts, target: '0', met: h1.maxTimeouts === 0, count: true });
  const h2 = get(2, 'human-list', 'list');
  out.push({ label: 'list: human-list L2 ≥1★', value: h2.star1, target: '≥ 80%', met: h2.star1 >= 0.8 });
  return out;
}

const pct = (x: number) => `${Math.round(x * 100)}%`;
const one = (x: number) => (Math.round(x * 10) / 10).toFixed(1);

function rowTable(lines: string[], rows: TuningRow[]) {
  lines.push('| Level | Bot | ≥1★ | ≥2★ | 3★ | avg score | served/shift | timeouts/shift | worst-shift timeouts | avg wait (s) | idle | rejected actions/shift |');
  lines.push('|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const r of rows) {
    lines.push(
      `| L${r.level} ${LEVELS[r.level].title.en} | ${r.bot} | ${pct(r.star1)} | ${pct(r.star2)} | ${pct(r.star3)} | ${pct(r.avgScore)} | ${one(r.servedPerShift)} | ${one(r.timeoutsPerShift)} | ${r.maxTimeouts} | ${one(r.avgWaitSec)} | ${pct(r.idleShare)} | ${one(r.rejectedPerShift)} |`,
    );
  }
}

export function tuningMarkdown(rows: TuningRow[]): string {
  const lines: string[] = [];
  lines.push('# Café Rush — game tuning (simulated bots)');
  lines.push('');
  lines.push('Generated by `src/xr/rush/tuning.test.ts` (`RUSH_WRITE_REPORT=1 npx vitest run src/xr/rush/tuning.test.ts`).');
  lines.push(
    `Deterministic: ${rows[0]?.shifts ?? 0} seeded shifts per cell (seed base ${TUNING.seedBase}). Bots play through the same action API as a human; numbers are game-time simulation, not playtests.`,
  );
  lines.push('');
  lines.push(`Stars = points ÷ potential (Σ base points of every order that arrived): 1★ ≥ ${pct(SCORING.stars[0])}, 2★ ≥ ${pct(SCORING.stars[1])}, 3★ ≥ ${pct(SCORING.stars[2])}.`);
  lines.push('Idle = time the bot was free but had nothing useful to do (waiting on a process or for customers).');
  lines.push('');
  lines.push('## 3D counter / WebXR (direct input)');
  lines.push('');
  lines.push('Bot latency stands for reach + handling time; no list cost.');
  lines.push('');
  rowTable(lines, rows.filter((r) => r.input === 'direct'));
  lines.push('');
  lines.push('## Action list (keyboard / screen reader / phone)');
  lines.push('');
  lines.push(
    `Every bot action goes through \`listAct\`, so it also pays the list cost: ${RUSH_LEVELS.map((l) => `L${l} ${LEVELS[l].listCost ? `+${INPUT_COST.listActionCostSec} s` : '0 s'}`).join(', ')} per action (Standard mode). \`human-list\` is the QA gate #2 "guided first-timer": it does exactly what the guided coach suggests, never errs, and takes 1.4–2.2 s per action to read the list.`,
  );
  lines.push('');
  rowTable(lines, rows.filter((r) => r.input === 'list'));
  lines.push('');
  lines.push('## Targets');
  lines.push('');
  lines.push('| Target | Value | Goal | Met |');
  lines.push('|---|---|---|---|');
  for (const t of checkTargets(rows)) lines.push(`| ${t.label} | ${t.count ? t.value : pct(t.value)} | ${t.target} | ${t.met ? 'yes' : 'no'} |`);
  lines.push('');
  lines.push('## Notes on the tuning');
  lines.push('');
  lines.push('- **Queue cap is the main governor.** New customers enter only while fewer than *max open* orders wait, so a slower player meets fewer customers instead of an avalanche. Arrival gaps are short so a fast player is never starved (see the idle column).');
  lines.push('- **3★ needs speed tips**: 1★/2★ come from correct drinks, 3★ (≥ 110% of menu value) needs fast, correct serves. This separates the average bot from the expert.');
  lines.push('- **Triage matters.** Without skipping customers who are about to leave, even the expert collapsed on L5 (9.5 timeouts/shift); with triage it serves 14/shift. The HUD teaches it with patience bars and the "about to leave" cue.');
  lines.push('- **Novice = strictly serial** (never overlaps tasks). L2 (first milk level) holds only 2 customers at a time with extra patience so it still clears it most shifts; from L3 on, overlapping tasks is the skill the levels teach. Relaxed mode (no timers) is the path for players who want the recipes without the clock.');
  lines.push(
    '- **List cost and L2 (QA-R09).** Until QA gate #2 the bots never paid the list cost, so the list rows were missing and list-mode playability was overstated. `human-list` now models the QA real-speed script faithfully: it reacts to the guided coach’s suggestion (the UI’s own `coachSuggest`) after 1.4–2.2 s. With the old +0.5 s cost and L2 patience ×2.2 it reached ≥1★ on L2 in only 48% of shifts (avg 40% of menu value, 2.5 walk-outs), matching QA’s real runs (41% and 58%). Reading the list already takes longer than the average 3D reach (1.3 s), so on the learning levels the surcharge double-charged the phone / keyboard / screen-reader players: it is **waived on L1–L2** (→ 100% ≥1★, avg 86%) and kept from L3 on, where speed is the skill. **L2 patience ×2.2 → ×2.4** (about +6 s per milk drink) adds margin for real-world click time (the e2e real-speed run adds ~0.1–0.3 s per action; at +0.3 s, ≥1★ goes from 82% to 95%): avg 92%, 0.05 walk-outs. Its 3D / XR effect is small (novice L2 ≥1★ 83% → 88%, average L2 3★ 65% → 68%); every 3D / XR target is still met.',
  );
  lines.push(
    '- **Guided coach takes ready milk off the wand first** (`wandFirst`): a player at ~2 s per action otherwise often let the milk overheat while doing the coach’s other steps. The tuning bots (novice / average / expert) do not use it, so their rows are unchanged by it.',
  );
  lines.push(
    '- **Known gap:** with the +0.5 s cost, list-mode L3–L5 are hard for anyone slower than the expert (see the list rows). Relaxed mode has no clock; the lead may lower the cost further if real list players need it.',
  );
  lines.push('');
  lines.push('## Level knobs (from `src/xr/rush/config.ts`)');
  lines.push('');
  lines.push('| Level | shift (s) | arrival gap (s) | ramp → | patience × | slack (s) | patience ramp → | max open | list cost (s/action) |');
  lines.push('|---|---|---|---|---|---|---|---|---|');
  for (const l of RUSH_LEVELS) {
    const c = LEVELS[l];
    lines.push(`| L${l} | ${c.shiftSec} | ${c.arrivalSec} | ×${c.rampArrivalEnd} | ${c.patienceMult} | ${c.patienceSlackSec} | ×${c.rampPatienceEnd} | ${c.maxOpenOrders} | ${c.listCost ? INPUT_COST.listActionCostSec : 0} |`);
  }
  lines.push('');
  return lines.join('\n');
}
