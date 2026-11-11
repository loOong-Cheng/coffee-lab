/**
 * Tuning bots. They play through the SAME public action API as a human (reduce/tick), with a
 * per-action latency, an error rate (one wrong component, fixed after the customer's feedback)
 * and a planning style:
 *   serial    – one order, one step at a time; waits idle while a process runs (novice)
 *   pipelined – up to 2 orders; fills a wait with the other sub-task / the next order (average)
 *   parallel  – up to 3 orders, plus prep (pre-grind, pre-heat kettle) when nothing is urgent (expert)
 */
import type { Extra } from '../../features/cafe/model';
import { CUP_CAPACITY_ML, CUPS, MILK_ML, SHOT_STYLES } from '../../features/cafe/model';
import { FIXED_STEP_MS, LEVELS, PATIENCE, type BotProfile, type RushInput, type RushLevelNo } from './config';
import { needsFor, workEstimateSec, type Needs } from './drinks';
import { makeStream } from './rng';
import {
  COUNTERS,
  groupOfSlot,
  held,
  itemIn,
  listAct,
  reduce,
  slotLocked,
  slotOf,
  slotOfBrewer,
  type CupItem,
  type GroupNo,
  type Item,
  type PitcherItem,
  type PlayerAction,
  type RushAction,
  type RushState,
  type SlotId,
} from './sim';

interface Job {
  orderId: string;
  drinkId: string;
  needs: Needs;
  correct: Needs;
  cupId: string | null;
  pitcherId: string | null;
  rushBloom: boolean;
  redo: boolean;
}

export interface Bot {
  profile: BotProfile;
  rand: () => number;
  busyUntilMs: number;
  jobs: Job[];
  idleMs: number;
  actions: number;
  rejected: number;
  usesKettle: boolean;
  pendingJob: Job | null;
}

export function createBot(profile: BotProfile, seed: number, level: RushLevelNo): Bot {
  return {
    profile,
    rand: makeStream(seed),
    busyUntilMs: 0,
    jobs: [],
    idleMs: 0,
    actions: 0,
    rejected: 0,
    usesKettle: LEVELS[level].mix.some((m) => needsFor(m.drinkId).brewer !== null),
    pendingJob: null,
  };
}

type Step = RushAction | 'wait' | 'done';
const grab = (slot: SlotId): RushAction => ({ type: 'grab', slot });
const place = (slot: SlotId): RushAction => ({ type: 'place', slot });
const groupSlot = (g: GroupNo): SlotId => (g === 1 ? 'group1' : 'group2');
const traySlot = (g: GroupNo): SlotId => (g === 1 ? 'tray1' : 'tray2');

interface Prog {
  shot: boolean;
  brew: boolean;
  water: boolean;
  milk: boolean;
  ice: boolean;
  extras: Set<Extra>;
}
function prog(c: CupItem): Prog {
  const p: Prog = { shot: false, brew: false, water: false, milk: false, ice: false, extras: new Set() };
  for (const a of c.adds) {
    if (a.k === 'shot') p.shot = true;
    else if (a.k === 'brew') p.brew = true;
    else if (a.k === 'water') p.water = true;
    else if (a.k === 'milk') p.milk = true;
    else if (a.k === 'ice') p.ice = true;
    else p.extras.add(a.extra);
  }
  return p;
}
const coffeeDone = (p: Prog, n: Needs) => (n.shot ? p.shot : n.brewer ? p.brew : true);

/** Can this cup still become the drink? (Used to adopt a cup a human took, and to bin a wrong one.) */
export function compatible(c: CupItem, n: Needs, allowRushedBloom = false): boolean {
  if (c.size !== n.cup) return false;
  let coffee = false;
  for (const a of c.adds) {
    if (a.k === 'shot') {
      if (!n.shot || a.style !== n.shot || coffee) return false;
      coffee = true;
    } else if (a.k === 'brew') {
      if (a.brewer !== n.brewer || (!a.bloomed && !allowRushedBloom) || coffee) return false;
      coffee = true;
    } else if (a.k === 'water') {
      if (n.water === 'none' || a.ml !== n.waterMl || (n.water === 'after') !== coffee) return false;
    } else if (a.k === 'milk') {
      if (a.texture !== n.milk || a.ml !== n.milkMl || a.overheated) return false;
    } else if (a.k === 'ice') {
      if (!n.ice) return false;
    } else if (!n.extras.includes(a.extra)) return false;
  }
  if (n.water === 'before' && coffee && !c.adds.some((a) => a.k === 'water')) return false;
  return true;
}
const complete = (p: Prog, n: Needs) =>
  coffeeDone(p, n) && (n.water === 'none' || p.water) && (n.milk === 'none' || p.milk) && (!n.ice || p.ice) && n.extras.every((e) => p.extras.has(e));

function placeCounter(s: RushState): RushAction | null {
  const c = COUNTERS.find((k) => !s.slots[k]);
  return c ? place(c) : null;
}
const placeOr = (s: RushState, slot: SlotId, free: boolean) => (free && !s.slots[slot] ? place(slot) : placeCounter(s));

/** Best tray for a cup that needs a shot: free tray, idle group, ground portafilter preferred. */
function pickTray(s: RushState): SlotId | null {
  let best: SlotId | null = null;
  let bestScore = -1;
  for (const g of [1, 2] as const) {
    if (s.slots[traySlot(g)] || s.m.groups[g - 1]) continue;
    const pf = itemIn(s, groupSlot(g));
    const score = pf?.kind === 'portafilter' && pf.load === 'ground' ? 2 : pf ? 1 : 0;
    if (score > bestScore) {
      best = traySlot(g);
      bestScore = score;
    }
  }
  return best;
}

/** Use the grinder for something else: grind what's waiting or clear a finished item. null = free. */
function grinderStep(s: RushState): Step | null {
  const it = itemIn(s, 'grinder');
  if (!it) return null;
  if (s.m.grinderMs > 0) return 'wait';
  if ((it.kind === 'portafilter' && it.load === 'empty') || (it.kind === 'doser' && !it.filled)) return { type: 'grind' };
  return grab('grinder');
}

function fetchPf(s: RushState): Step {
  for (const id of ['pf1', 'pf2']) {
    const loc = slotOf(s, id);
    if (!loc || loc === 'group1' || loc === 'group2') continue;
    const pf = s.items[id]!;
    if (pf.kind !== 'portafilter') continue;
    if (loc === 'grinder') {
      if (s.m.grinderMs > 0) return 'wait';
      return pf.load === 'empty' ? { type: 'grind' } : grab('grinder');
    }
    if (pf.load === 'empty' && s.slots.grinder) {
      const g = grinderStep(s);
      return g && g !== 'done' ? g : 'wait';
    }
    return grab(loc);
  }
  return 'wait';
}

function kettleStep(s: RushState): Step {
  const kl = slotOf(s, 'kettle');
  const k = s.items.kettle!;
  if (k.kind !== 'kettle' || !kl) return 'wait';
  if (k.hot && k.pours > 0) return slotLocked(s, kl) ? 'wait' : grab(kl);
  if (kl === 'kettleBase') return s.m.kettleMs > 0 ? 'wait' : { type: 'heatKettle' };
  return s.slots.kettleBase ? 'wait' : grab(kl);
}

function groundsStep(s: RushState): Step {
  const dl = slotOf(s, 'doser');
  const d = s.items.doser!;
  if (d.kind !== 'doser' || !dl) return 'wait';
  if (d.filled) return slotLocked(s, dl) ? 'wait' : grab(dl);
  if (dl === 'grinder') return s.m.grinderMs > 0 ? 'wait' : { type: 'grind' };
  const g = grinderStep(s);
  if (g) return g;
  return grab(dl);
}

function jobOfCup(bot: Bot, id: string) {
  return bot.jobs.find((j) => j.cupId === id);
}

function cupNeedsShotNotOnTray(bot: Bot, s: RushState, except: Job): boolean {
  return bot.jobs.some((j) => {
    if (j === except || !j.needs.shot) return false;
    if (!j.cupId) return true;
    const c = s.items[j.cupId];
    if (!c || c.kind !== 'cup' || prog(c).shot) return false;
    const loc = slotOf(s, c.id);
    return loc !== 'tray1' && loc !== 'tray2';
  });
}

function adoptPitcher(bot: Bot, s: RushState, job: Job): PitcherItem | null {
  const owned = new Set(bot.jobs.map((j) => j.pitcherId));
  let empty: PitcherItem | null = null;
  for (const id of ['pitcher1', 'pitcher2']) {
    const p = s.items[id];
    if (!p || p.kind !== 'pitcher' || owned.has(id) || s.hand === id) continue;
    const m = p.milk;
    if (!m) {
      empty ??= p;
      continue;
    }
    const n = job.needs;
    const steamTo = m.state === 'steaming' ? s.m.wand?.texture : m.state;
    if (!m.overheated && m.ml === n.milkMl && (steamTo === n.milk || (m.state === 'cold' && n.milk !== 'cold'))) {
      job.pitcherId = id;
      return p;
    }
  }
  if (empty) job.pitcherId = empty.id;
  return empty;
}

function jobAction(bot: Bot, s: RushState, job: Job): RushAction | null {
  const serial = bot.profile.planning === 'serial';
  const n = job.needs;
  const cup = job.cupId ? s.items[job.cupId] : undefined;
  if (!cup || cup.kind !== 'cup') {
    job.cupId = null;
    bot.pendingJob = job;
    return { type: 'takeCup', size: n.cup };
  }
  const loc = slotOf(s, cup.id);
  if (!loc) return null;
  const locked = slotLocked(s, loc);
  const p = prog(cup);
  if (!compatible(cup, n, job.rushBloom)) job.redo = true;
  const needsHeld = job.redo || (n.ice && !p.ice) || n.extras.some((e) => !p.extras.has(e)) || complete(p, n);
  if (needsHeld) return locked ? null : grab(loc);
  const onTray = loc === 'tray1' || loc === 'tray2';

  const tasks: Array<() => Step> = [
    // water first (long black)
    () => {
      if (n.water !== 'before' || p.water) return 'done';
      if (loc === 'hotwater') return s.m.hotwater ? 'wait' : { type: 'dispenseWater', ml: n.waterMl };
      return !locked && !s.slots.hotwater ? grab(loc) : 'wait';
    },
    // coffee
    () => {
      if (coffeeDone(p, n)) return 'done';
      if (n.water === 'before' && !p.water) return 'wait';
      if (n.shot) {
        const g = onTray ? groupOfSlot(loc)! : null;
        if (!g) return !locked && pickTray(s) ? grab(loc) : 'wait';
        if (s.m.groups[g - 1]) return 'wait';
        const pf = itemIn(s, groupSlot(g));
        if (pf?.kind === 'portafilter' && pf.load === 'ground') return { type: 'startShot', group: g, style: n.shot };
        const o = (3 - g) as GroupNo;
        const opf = itemIn(s, groupSlot(o));
        if (opf?.kind === 'portafilter' && opf.load === 'ground' && !s.m.groups[o - 1] && !s.slots[traySlot(o)]) return grab(loc);
        if (pf?.kind === 'portafilter') {
          if (pf.load === 'empty' && s.slots.grinder) return grinderStep(s) ?? 'wait';
          return grab(groupSlot(g));
        }
        return fetchPf(s);
      }
      const b = n.brewer!;
      const bs = slotOfBrewer(b);
      if (loc !== bs) return !locked && !s.slots[bs] ? grab(loc) : 'wait';
      const br = s.m.brewers[b];
      if (br.stage === 'drawdown') return 'wait';
      if (br.stage === 'bloom') return job.rushBloom ? kettleStep(s) : 'wait';
      if (!br.grounds) return groundsStep(s);
      return kettleStep(s);
    },
    // milk
    () => {
      if (n.milk === 'none' || p.milk) {
        job.pitcherId = null;
        return 'done';
      }
      const hot = n.milk !== 'cold';
      const pit = (job.pitcherId ? (s.items[job.pitcherId] as PitcherItem) : null) ?? adoptPitcher(bot, s, job);
      if (!pit) return 'wait';
      const pl = slotOf(s, pit.id);
      if (!pl) return 'wait';
      const m = pit.milk;
      if (!m || m.overheated) return slotLocked(s, pl) ? 'wait' : grab(pl);
      if (m.state === 'steaming') return 'wait';
      if (m.state === 'cold' && hot) {
        if (pl === 'wand') return s.m.wand ? 'wait' : { type: 'steam', texture: n.milk as 'steamed' | 'microfoam' | 'foam' };
        return s.slots.wand ? 'wait' : grab(pl);
      }
      if (pl === 'wand') return grab(pl);
      return !hot || coffeeDone(p, n) ? grab(pl) : 'wait';
    },
    // water after (americano)
    () => {
      if (n.water !== 'after' || p.water) return 'done';
      if (!coffeeDone(p, n)) return 'wait';
      if (loc === 'hotwater') return s.m.hotwater ? 'wait' : { type: 'dispenseWater', ml: n.waterMl };
      return !locked && !s.slots.hotwater ? grab(loc) : 'wait';
    },
    // free the tray for the next shot
    () => (!serial && onTray && !locked && coffeeDone(p, n) && cupNeedsShotNotOnTray(bot, s, job) ? grab(loc) : 'done'),
  ];
  for (const t of tasks) {
    const r = t();
    if (r === 'done') continue;
    if (r === 'wait') {
      if (serial) return null;
      continue;
    }
    return r;
  }
  return null;
}

function handleHeld(bot: Bot, s: RushState, h: Item): RushAction | null {
  switch (h.kind) {
    case 'cup': {
      const job = jobOfCup(bot, h.id);
      if (!job || job.redo || !compatible(h, job.needs, job.rushBloom)) {
        if (job) {
          job.redo = false;
          job.cupId = null;
        }
        return { type: 'trash' };
      }
      const n = job.needs;
      const p = prog(h);
      if (n.ice && !p.ice) return { type: 'addIce' };
      const ex = n.extras.find((e) => !p.extras.has(e));
      if (ex) return { type: 'addExtra', extra: ex };
      if (complete(p, n)) return { type: 'serve', orderId: job.orderId };
      if (n.water === 'before' && !p.water) return placeOr(s, 'hotwater', !s.m.hotwater);
      if (n.shot && !p.shot) {
        const t = pickTray(s);
        return t ? place(t) : placeCounter(s);
      }
      if (n.brewer && !p.brew) return placeOr(s, slotOfBrewer(n.brewer), true);
      if (n.water === 'after' && !p.water) return placeOr(s, 'hotwater', !s.m.hotwater);
      return placeCounter(s);
    }
    case 'portafilter': {
      if (h.load === 'puck') return { type: 'knock' };
      if (h.load === 'empty') return placeOr(s, 'grinder', true);
      let target: SlotId | null = null;
      for (const g of [1, 2] as const) {
        if (s.slots[groupSlot(g)] || s.m.groups[g - 1]) continue;
        const cup = itemIn(s, traySlot(g));
        const wants = cup?.kind === 'cup' && !prog(cup).shot;
        if (!target || wants) target = groupSlot(g);
      }
      return target ? place(target) : placeCounter(s);
    }
    case 'pitcher': {
      const job = bot.jobs.find((j) => j.pitcherId === h.id);
      const m = h.milk;
      if (!job) return m ? { type: 'trash' } : placeCounter(s);
      const cup = job.cupId ? s.items[job.cupId] : undefined;
      if (cup?.kind === 'cup' && prog(cup).milk) {
        job.pitcherId = null;
        return m ? { type: 'trash' } : placeCounter(s);
      }
      if (m?.overheated) return { type: 'trash' };
      if (!m) return { type: 'fillMilk', ml: job.needs.milkMl };
      const hot = job.needs.milk !== 'cold';
      if (m.state === 'cold' && hot) return placeOr(s, 'wand', !s.m.wand);
      const cl = cup ? slotOf(s, cup.id) : null;
      if (cup?.kind === 'cup' && cl && (!hot || coffeeDone(prog(cup), job.needs))) return { type: 'pour', slot: cl };
      return placeCounter(s);
    }
    case 'doser': {
      if (!h.filled) return placeOr(s, 'grinder', true);
      for (const b of ['pourover', 'phin'] as const) {
        const br = s.m.brewers[b];
        if (br.grounds || br.stage !== 'idle') continue;
        if (bot.jobs.some((j) => j.needs.brewer === b)) return { type: 'pour', slot: slotOfBrewer(b) };
      }
      return placeCounter(s);
    }
    case 'kettle': {
      if (h.hot && h.pours > 0) {
        for (const b of ['pourover', 'phin'] as const) {
          const br = s.m.brewers[b];
          const bs = slotOfBrewer(b);
          const cup = itemIn(s, bs);
          if (!br.grounds || cup?.kind !== 'cup') continue;
          const job = jobOfCup(bot, cup.id);
          if (br.stage === 'idle' || br.stage === 'bloomed' || (br.stage === 'bloom' && job?.rushBloom)) return { type: 'pour', slot: bs };
        }
      }
      return placeOr(s, 'kettleBase', true);
    }
  }
}

/** Housekeeping and (non-serial) prep when no order needs a hand right now. */
function spareAction(bot: Bot, s: RushState): RushAction | null {
  for (const id in s.items) {
    const it = s.items[id]!;
    const loc = slotOf(s, id);
    if (!loc || slotLocked(s, loc)) continue;
    if (it.kind === 'cup' && !jobOfCup(bot, id)) return grab(loc);
    if (it.kind === 'pitcher' && it.milk && it.milk.state !== 'steaming' && !bot.jobs.some((j) => j.pitcherId === id)) return grab(loc);
  }
  const plan = bot.profile.planning;
  if (plan === 'serial') return null;
  if (bot.usesKettle) {
    const k = s.items.kettle!;
    if (k.kind === 'kettle' && !(k.hot && k.pours > 0) && s.slots.kettleBase === 'kettle' && s.m.kettleMs === 0) return { type: 'heatKettle' };
  }
  if (plan !== 'parallel') return null;
  const g = grinderStep(s);
  if (g && g !== 'wait' && g !== 'done') {
    const it = itemIn(s, 'grinder');
    const groupFree = !s.slots.group1 || !s.slots.group2;
    if (g.type === 'grind' || (it?.kind === 'portafilter' && groupFree)) return g;
  }
  if (!s.slots.grinder) {
    for (const id of ['pf1', 'pf2']) {
      const pf = s.items[id]!;
      const loc = slotOf(s, id);
      if (pf.kind === 'portafilter' && pf.load !== 'ground' && loc && !slotLocked(s, loc)) return grab(loc);
    }
  }
  return null;
}

function syncJobs(bot: Bot, s: RushState) {
  const open = new Set(s.orders.map((o) => o.id));
  bot.jobs = bot.jobs.filter((j) => open.has(j.orderId));
  const p = bot.profile;
  for (const o of s.orders) {
    if (bot.jobs.length >= p.maxJobs) break;
    if (bot.jobs.some((j) => j.orderId === o.id)) continue;
    // Triage: a customer about to leave is not worth starting (their order still counts as missed).
    if (p.triage && o.remainingMs !== null && o.remainingMs < workEstimateSec(o.drinkId) * (p.latencySec / PATIENCE.perActionSec) * 1000) continue;
    bot.jobs.push(newJob(bot, o.id, o.drinkId));
  }
  // Adopt cups started by someone else (a human, when this bot is the guided-tier coach).
  for (const j of bot.jobs) {
    if (j.cupId && s.items[j.cupId]) continue;
    j.cupId = null;
    for (const id in s.items) {
      const it = s.items[id]!;
      if (it.kind === 'cup' && !jobOfCup(bot, id) && compatible(it, j.needs, j.rushBloom)) {
        j.cupId = id;
        break;
      }
    }
  }
}

const cloneNeeds = (n: Needs): Needs => ({ ...n, extras: [...n.extras] });

function newJob(bot: Bot, orderId: string, drinkId: string): Job {
  const correct = needsFor(drinkId);
  const job: Job = { orderId, drinkId, needs: cloneNeeds(correct), correct, cupId: null, pitcherId: null, rushBloom: false, redo: false };
  if (bot.rand() < bot.profile.errorRate) {
    const n = job.needs;
    const other = <T>(list: readonly T[], v: T): T => {
      const rest = list.filter((x) => x !== v);
      return rest[Math.floor(bot.rand() * rest.length)]!;
    };
    const opts: Array<() => void> = [() => (n.cup = other(CUPS.filter((c) => CUP_CAPACITY_ML[c] > 0), n.cup))];
    if (n.shot) opts.push(() => (n.shot = other(SHOT_STYLES, n.shot!)));
    if (n.milk !== 'none' && n.milk !== 'cold') opts.push(() => (n.milk = other(['steamed', 'microfoam', 'foam'] as const, n.milk as 'steamed')));
    if (n.milk !== 'none') opts.push(() => (n.milkMl = other(MILK_ML, n.milkMl)));
    if (n.extras.length) opts.push(() => (n.extras = n.extras.slice(1)));
    if (n.water !== 'none') opts.push(() => (n.water = n.water === 'before' ? 'after' : 'before'));
    if (n.ice) opts.push(() => (n.ice = false));
    if (n.brewer) opts.push(() => (job.rushBloom = true));
    opts[Math.floor(bot.rand() * opts.length)]!();
  }
  return job;
}

export function decide(bot: Bot, s: RushState): RushAction | null {
  syncJobs(bot, s);
  bot.pendingJob = null;
  const h = held(s);
  if (h) return handleHeld(bot, s, h);
  // Ready milk overheats on the wand within seconds: a slower (human-paced) plan takes it off first.
  if (bot.profile.wandFirst && s.m.wand && s.m.wand.remainingMs <= 0) {
    const p = itemIn(s, 'wand');
    if (p?.kind === 'pitcher' && p.milk && !p.milk.overheated && p.milk.state !== 'cold' && p.milk.state !== 'steaming') return grab('wand');
  }
  const limit = bot.profile.planning === 'serial' ? Math.min(1, bot.jobs.length) : bot.jobs.length;
  for (let i = 0; i < limit; i++) {
    const a = jobAction(bot, s, bot.jobs[i]!);
    if (a) return a;
  }
  return spareAction(bot, s);
}

const META = new Set<RushAction['type']>(['pause', 'resume', 'endShift', 'reset', 'setInput', 'tick']);
const isPlayerAction = (a: RushAction): a is PlayerAction => !META.has(a.type);

/** How the bot's actions reach the sim: direct (3D / XR reach; latency = reach time) or the action list (+ list cost). */
export type BotInput = RushInput;

/** One bot opportunity at the current instant (call once per fixed step, before tick). */
export function botTurn(bot: Bot, s: RushState, input: BotInput = 'direct'): RushState {
  if (s.status !== 'playing' || s.tMs < bot.busyUntilMs) return s;
  const a = decide(bot, s);
  if (!a) {
    bot.idleMs += FIXED_STEP_MS;
    return s;
  }
  const next = input === 'list' && isPlayerAction(a) ? listAct(s, a) : reduce(s, a);
  bot.actions += 1;
  if (!next.lastResult.ok) bot.rejected += 1;
  if (a.type === 'takeCup' && next.lastResult.ok && bot.pendingJob) bot.pendingJob.cupId = next.hand;
  if (a.type === 'serve' && next.lastResult.code === 'serve-wrong') {
    const j = bot.jobs.find((x) => x.orderId === a.orderId);
    if (j) {
      j.redo = true;
      j.needs = cloneNeeds(j.correct);
      j.rushBloom = false;
    }
  }
  const p = bot.profile;
  const lat = p.latencySec * (1 + p.latencyJitter * (2 * bot.rand() - 1));
  bot.busyUntilMs = next.tMs + Math.round(lat * 1000);
  return next;
}
