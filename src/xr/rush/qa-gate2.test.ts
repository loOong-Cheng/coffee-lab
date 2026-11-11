/**
 * QA gate #2 fixes, headless: screen-reader announcements (QA-R01), recipe-wall component labels
 * (QA-R03), real-time references (QA-R04) and the ticket facts (QA-R07).
 */
import { describe, expect, it } from 'vitest';
import { INPUT_COST, PROCESS, listCostSec } from './config';
import { basePoints, processTimings, recipeWall, wallEntry, wallFacts } from './drinks';
import { announceCursor, coachSuggest, createAnnounceQueue, createCoach, processReal, rushAnnouncements } from './play';
import { createShift, listAct, reduce, tick, type PlayerAction, type RushState } from './sim';

const quietL3 = (): RushState => ({ ...createShift({ level: 3, seed: 3 }), nextArrivalMs: Number.MAX_SAFE_INTEGER });
const order = (s: RushState, drinkId: string, patienceMs = 60_000): RushState => ({
  ...s,
  orders: [...s.orders, { id: `o-${s.orders.length}`, drinkId, customerId: 'mei', arrivedMs: s.tMs, patienceMs, remainingMs: patienceMs, points: basePoints(drinkId) }],
});
const list = (s: RushState, a: PlayerAction): RushState => {
  const n = listAct(s, a);
  expect(n.lastResult.ok, `${a.type} → ${n.lastResult.code}`).toBe(true);
  return n;
};

/** An espresso through the ACTION LIST (each action pays the L3 list cost), ending with the serve. */
function serveEspressoByList(s0: RushState): RushState {
  let s = list(s0, { type: 'takeCup', size: 'demitasse' });
  s = list(s, { type: 'place', slot: 'tray1' });
  s = list(s, { type: 'grab', slot: 'group1' });
  s = list(s, { type: 'place', slot: 'grinder' });
  s = list(s, { type: 'grind' });
  s = tick(s, PROCESS.grind.sec);
  s = list(s, { type: 'grab', slot: 'grinder' });
  s = list(s, { type: 'place', slot: 'group1' });
  s = list(s, { type: 'startShot', group: 1, style: 'normal' });
  s = tick(s, PROCESS.shot.normal.sec);
  s = list(s, { type: 'grab', slot: 'tray1' });
  return list(s, { type: 'serve', orderId: s.orders[0]!.id });
}

describe('QA-R01 · screen-reader announcements', () => {
  it('a serve made through the action list is announced even though the list cost ticks after it', () => {
    expect(listCostSec(3)).toBe(INPUT_COST.listActionCostSec); // the case the old atMs guard missed
    const s0 = order(quietL3(), 'espresso-shot');
    const cur = announceCursor(s0);
    const s = serveEspressoByList(s0);
    const f = s.feedback.findLast((x) => x.code === 'serve-correct')!;
    expect(f.atMs).not.toBe(s.tMs);
    const r = rushAnnouncements(s, cur, true);
    expect(r.items.filter((i) => i.urgent).map((i) => i.text.en)).toContain(f.text.en);
    // nothing twice
    expect(rushAnnouncements(s, r.cursor, true).items).toEqual([]);
    // a reset shift (VR "Play again") restarts the feedback log; its arrivals are still announced
    const again = tick(reduce(s, { type: 'reset' }), 3);
    expect(rushAnnouncements(again, r.cursor, true).items.map((i) => i.text.en).join()).toMatch(/: one /);
  });

  it('new orders are announced politely; the leave cue once per order and only where the tier shows it', () => {
    let s = createShift({ level: 1, seed: 11 });
    let cur = announceCursor(s);
    s = tick(s, 3); // first customer arrives at 2 s
    let r = rushAnnouncements(s, cur, true);
    expect(r.items.length).toBeGreaterThan(0);
    expect(r.items.every((i) => !i.urgent)).toBe(true);
    expect(r.items[0]!.text.en).toMatch(/: one /);
    cur = r.cursor;
    const o = s.orders[0]!;
    s = tick(s, (o.remainingMs! - o.patienceMs! * 0.25) / 1000); // into the last 30 %
    r = rushAnnouncements(s, cur, true);
    const leave = r.items.filter((i) => /about to leave/.test(i.text.en));
    expect(leave).toHaveLength(1);
    expect(leave[0]!.text.zh).toMatch(/快要走了/);
    expect(rushAnnouncements(tick(s, 0.5), r.cursor, true).items.filter((i) => /about to leave/.test(i.text.en))).toEqual([]);
    expect(rushAnnouncements(s, cur, false).items.filter((i) => /about to leave/.test(i.text.en))).toEqual([]); // independent
  });

  it('the queue says urgent results at once and batches / de-duplicates arrivals without flooding', () => {
    let t = 0;
    const timers: Array<{ at: number; fn: () => void }> = [];
    const said: string[] = [];
    const q = createAnnounceQueue((x) => said.push(x), {
      gapMs: 1500,
      now: () => t,
      setTimer: (fn, ms) => {
        const h = { at: t + ms, fn };
        timers.push(h);
        return h;
      },
      clearTimer: (h) => timers.splice(timers.indexOf(h as (typeof timers)[number]), 1),
    });
    const run = (to: number) => {
      t = to;
      for (const h of [...timers].sort((a, b) => a.at - b.at)) if (h.at <= t) (timers.splice(timers.indexOf(h), 1), h.fn());
    };
    q.push([{ text: 'Mei: one Espresso.', urgent: false }]);
    run(0);
    expect(said).toEqual(['Mei: one Espresso.']);
    q.push([{ text: 'Kai: one Lungo.', urgent: false }, { text: 'Kai: one Lungo.', urgent: false }]);
    q.push([{ text: 'A textbook Espresso! +45', urgent: true }]);
    expect(said.at(-1)).toBe('A textbook Espresso! +45'); // urgent: not held back by the gap
    run(1000);
    expect(said).toHaveLength(2); // the arrival waits for the gap
    run(2600);
    expect(said.at(-1)).toBe('Kai: one Lungo.'); // once, not twice
    q.dispose();
  });
});

describe('QA-R03 / QA-R07 · wall facts', () => {
  it('names the real milk component when the build takes no pitcher milk; numbers stay the Atlas ones', () => {
    const yy = wallEntry('yuenyeung')!;
    const phin = wallEntry('vietnamese-phin')!;
    for (const w of [yy, phin]) {
      expect(w.pitcherMark).toBeUndefined();
      const line = wallFacts(w).map((f) => f.en).join(' · ');
      expect(line).not.toMatch(/(^|· )milk ≈/);
      expect(line).toContain(`≈${w.milkMl} ml`);
    }
    expect(wallFacts(yy).map((f) => f.en).join()).toMatch(/evaporated milk ≈50 ml \(in the HK milk tea\)/);
    expect(wallFacts(phin).map((f) => f.en).join()).toMatch(/condensed milk ≈25 ml/);
    expect(wallFacts(wallEntry('cappuccino')!).map((f) => f.en)).toEqual(['18 g → 36 g (1:2)', 'milk ≈110 ml → pitcher mark 120']);
    expect(wallFacts(wallEntry('americano')!).map((f) => f.en)).toContain('hot water 150 ml after');
  });

  it('every roster drink has at least one key number for its ticket', () => {
    for (const w of recipeWall(5)) expect(wallFacts(w).length, w.drinkId).toBeGreaterThan(0);
  });
});

describe('QA-R04 · real-time reference for every compressed process', () => {
  it('the wall legend covers the level’s processes with PROCESS.*.real', () => {
    const l4 = processTimings(4).map((r) => `${r.what.en}: ${r.gameSec} s · ${r.real.en}`).join('\n');
    for (const p of [PROCESS.shot.normal, PROCESS.steam, PROCESS.bloom.pourover, PROCESS.drawdown.pourover, PROCESS.bloom.phin, PROCESS.drawdown.phin, PROCESS.kettle])
      expect(l4).toContain(p.real.en);
    expect(l4).toMatch(/2:30–4:00/);
    expect(l4).toMatch(/4–5 min/);
    expect(processTimings(1).map((r) => r.real.en)).toEqual([PROCESS.shot.ristretto.real.en, PROCESS.shot.normal.real.en, PROCESS.shot.lungo.real.en]);
  });

  it('a running process shows its real reference on the bench', () => {
    let s = createShift({ level: 4, seed: 2 });
    expect(processReal(s, 'kettleBase')).toBeNull();
    s = listAct(s, { type: 'heatKettle' });
    expect(processReal(s, 'kettleBase')).toEqual(PROCESS.kettle.real);
  });
});

describe('QA-R09 · guided coach for a human-paced player', () => {
  it('suggests taking ready milk off the wand before it overheats', () => {
    let s: RushState = { ...createShift({ level: 2, seed: 5 }), nextArrivalMs: Number.MAX_SAFE_INTEGER };
    s = order(s, 'cappuccino');
    s = list(s, { type: 'grab', slot: 'counter1' });
    s = list(s, { type: 'fillMilk', ml: 120 });
    s = list(s, { type: 'place', slot: 'wand' });
    s = list(s, { type: 'steam', texture: 'foam' });
    s = tick(s, 10); // steamed, now waiting on the wand
    expect(coachSuggest(createCoach(2), s)).toEqual({ type: 'grab', slot: 'wand' });
  });
});
