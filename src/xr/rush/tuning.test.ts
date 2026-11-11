/**
 * Café Rush tuning harness as a test: deterministic, < 60 s, and the difficulty curve meets its targets.
 * Regenerate the report:  RUSH_WRITE_REPORT=1 npx vitest run src/xr/rush/tuning.test.ts
 */
import { describe, expect, it } from 'vitest';
import { checkTargets, runShift, runTuning, tuningMarkdown } from './harness';

const proc = (globalThis as { process?: { env: Record<string, string | undefined>; cwd(): string } }).process;
const env = proc?.env ?? {};

describe('Café Rush tuning harness', () => {
  it('is deterministic: the same seed replays the same shift', () => {
    for (const bot of ['novice', 'average', 'expert'] as const) {
      expect(runShift(4, bot, 77)).toEqual(runShift(4, bot, 77));
    }
    expect(runShift(2, 'average', 1)).not.toEqual(runShift(2, 'average', 2));
  });

  it('runs every level × bot fast and meets the difficulty targets', async () => {
    const t0 = performance.now();
    const rows = runTuning();
    const ms = performance.now() - t0;
    const md = tuningMarkdown(rows);
    if (env.RUSH_PRINT) console.log(`${md}\nharness ${Math.round(ms)} ms`);
    if (env.RUSH_WRITE_REPORT) {
      const spec = 'node:fs';
      const fs = (await import(/* @vite-ignore */ spec)) as { writeFileSync(p: string, d: string): void };
      fs.writeFileSync(`${proc!.cwd()}/reports/GAME_TUNING.md`, md);
    }
    expect(ms).toBeLessThan(60_000);
    for (const r of rows) {
      // Bots use the public API; a rejected action means a bot bug or an unclear rule.
      expect(r.rejectedPerShift, `L${r.level} ${r.bot} rejected`).toBeLessThan(1);
    }
    // Monotone: within a level the better bot never does worse.
    for (const l of [1, 2, 3, 4, 5]) {
      const [n, a, e] = (['novice', 'average', 'expert'] as const).map((b) => rows.find((r) => r.level === l && r.bot === b)!);
      expect(a!.avgScore).toBeGreaterThanOrEqual(n!.avgScore);
      expect(e!.avgScore).toBeGreaterThanOrEqual(a!.avgScore);
    }
    for (const t of checkTargets(rows)) expect(t.met, `${t.label} = ${Math.round(t.value * 100)}% (goal ${t.target})`).toBe(true);
  }, 120_000);
});
