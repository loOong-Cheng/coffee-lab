/**
 * QA gate #2 (quality-guardian) — Café Rush, independent of the feature's own xr-rush.spec.ts.
 *
 *  - REAL-SPEED playtests (no fast clock): L1 desktop en, L2 desktop en, L1 Pixel 7 zh. A scripted
 *    "guided first-timer" reacts to the suggested next step after ~1.4–2.2 s (between the novice and
 *    average bots) and clicks / taps it. An in-page probe samples the HUD every 250 ms and records
 *    screen-reader announcements. Metrics → .e2e/qa2-logs/playtest-*.json (git-ignored).
 *  - Honesty: labels, recipe wall numbers vs src/content/drinks.ts, no real-skill claims.
 *  - Relaxed mode has no timers; unlock + best stars survive reload (Relaxed run).
 *  - Keyboard / focus / announcements / axe on HUD + pause / ≥ 44 px on phone.
 *  - WebXR gate with a throwing isSessionSupported.
 * Run: E2E_PORT=4209 E2E_DIST=.e2e/dist-qa E2E_OUT=.e2e/out-qa npx playwright test qa-rush --workers=6
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { drinks } from '../../src/content/drinks';
import { LEVELS } from '../../src/xr/rush/config';
import { ERROR_BOUNDARY_TEXT, STATE_KEY, collectErrors, readState } from './qa-helpers';

test.use({ serviceWorkers: 'block' });

const LOG_DIR = path.resolve('.e2e/qa2-logs');
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const realErrors = (errors: string[]) => errors.filter((e) => !/WebGL|GPU stall|GL Driver/i.test(e));

/** Profile with optional Rush best stars per level (as `simulated` events, the app's own record). */
async function seedRush(page: Page, opts: { locale?: 'en' | 'zh'; stars?: Partial<Record<1 | 2 | 3 | 4 | 5, number>>; guidance?: string } = {}) {
  const events = Object.entries(opts.stars ?? {}).map(([lvl, n], i) => ({
    id: `qa-seed-${lvl}-${i}`,
    activityId: `rush:${lvl}`,
    lessonId: '',
    mode: 'desktop',
    guidance: 'guided',
    evidence: 'simulated',
    outcome: (n ?? 0) >= 1 ? 'completed' : 'retry',
    score: Math.round(((n ?? 0) / 3) * 1000) / 1000,
    recordedAt: '2026-11-11T10:00:00.000Z',
    notes: 'qa seed',
  }));
  const seed = {
    version: 1,
    profile: { goal: 'espresso', experience: 'new', devices: ['pc', 'phone'], equipment: [], wishlist: [], preferredMode: 'desktop', onboardedAt: '2026-11-07T08:00:00.000Z' },
    prefs: { locale: opts.locale ?? 'en', sfx: false, music: false, volume: 0.5, reducedMotion: 'system', theme: 'system', defaultGuidance: opts.guidance ?? 'guided', speakSteps: false },
    events,
    journal: [],
    activePractice: null,
  };
  await page.addInitScript(
    ([key, value]) => {
      try {
        if (!window.localStorage.getItem(key)) window.localStorage.setItem(key, value);
      } catch {
        /* blocked */
      }
    },
    [STATE_KEY, JSON.stringify(seed)] as const,
  );
}

/** In-page probe: HUD samples every 250 ms + every live-region announcement. */
async function installProbe(page: Page) {
  await page.addInitScript(() => {
    type W = Window & { __qa?: { samples: unknown[]; ann: Array<{ t: number; kind: string | null; text: string }> } };
    const w = window as W;
    w.__qa = { samples: [], ann: [] };
    const q = w.__qa;
    setInterval(() => {
      const player = document.querySelector('[data-testid="rush-player"]');
      if (!player) return;
      const rec = document.querySelector<HTMLElement>('.xr-action[data-recommended]');
      let recInView: boolean | null = null;
      if (rec) {
        const r = rec.getBoundingClientRect();
        recInView = r.top >= 0 && r.bottom <= window.innerHeight;
      }
      const tickets = [...document.querySelectorAll<HTMLElement>('[data-testid="rush-ticket"]')].map((li) => ({
        drink: li.querySelector('strong')?.textContent ?? '',
        leaving: li.hasAttribute('data-leaving'),
        p: (li.querySelector('progress') as HTMLProgressElement | null)?.value ?? null,
        text: li.innerText.replace(/\s+/g, ' '),
      }));
      const inView = (el: Element | null) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const nav = document.querySelector('nav[aria-label="Primary"]');
        const bottom = nav && getComputedStyle(nav).position === 'fixed' ? nav.getBoundingClientRect().top : window.innerHeight;
        return r.top >= 0 && r.bottom <= bottom;
      };
      q.samples.push({
        t: performance.now(),
        ticketInView: inView(document.querySelector('[data-testid="rush-ticket"]')),
        hudInView: inView(document.querySelector('[data-testid="rush-time"]')),
        status: player.getAttribute('data-status'),
        rec: rec ? rec.innerText.replace(/\s+/g, ' ') : null,
        recInView,
        nActions: document.querySelectorAll('.xr-action').length,
        hint: document.querySelector('[data-testid="rush-hint"]')?.textContent ?? null,
        tickets,
        score: Number(document.querySelector('[data-testid="rush-score"]')?.textContent ?? 'NaN'),
        time: document.querySelector('[data-testid="rush-time"]')?.textContent ?? null,
        hands: document.querySelector('[data-testid="rush-hands"]')?.textContent ?? null,
        fb: document.querySelector('.rush-feedback > ul > li')?.textContent ?? null,
      });
    }, 250);
    const mo = new MutationObserver((muts) => {
      for (const m of muts) {
        const el = (m.target.nodeType === 1 ? (m.target as Element) : m.target.parentElement)?.closest('[data-cl-announcer]');
        if (el && el.textContent) q.ann.push({ t: performance.now(), kind: el.getAttribute('data-cl-announcer'), text: el.textContent });
      }
    });
    const start = () => mo.observe(document.body, { subtree: true, childList: true, characterData: true });
    if (document.body) start();
    else document.addEventListener('DOMContentLoaded', start);
  });
}

type Sample = {
  t: number;
  status: string;
  rec: string | null;
  recInView: boolean | null;
  ticketInView: boolean | null;
  hudInView: boolean | null;
  nActions: number;
  hint: string | null;
  tickets: Array<{ drink: string; leaving: boolean; p: number | null; text: string }>;
  score: number;
  time: string | null;
  hands: string | null;
  fb: string | null;
};

/** Deterministic "guided first-timer": waits a human reaction time after each new suggestion, then acts. */
async function realSpeedPlay(page: Page, opts: { isMobile: boolean; maxMs: number; seed?: number }) {
  let x = opts.seed ?? 7;
  const rnd = () => ((x = (x * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const results = page.getByTestId('rush-results');
  const t0 = Date.now();
  let actions = 0;
  let offscreenClicks = 0;
  while (Date.now() - t0 < opts.maxMs) {
    if (await results.isVisible().catch(() => false)) break;
    const rec = page.locator('.xr-action[data-recommended]').first();
    if (!(await rec.count())) {
      await page.waitForTimeout(200);
      continue;
    }
    await page.waitForTimeout(1400 + Math.round(rnd() * 800)); // read + find + reach
    const now = page.locator('.xr-action[data-recommended]').first();
    if (!(await now.count())) continue;
    try {
      const box = await now.boundingBox();
      const vh = page.viewportSize()!.height;
      if (box && (box.y < 0 || box.y + box.height > vh)) offscreenClicks++;
      if (opts.isMobile) await now.tap({ timeout: 2000 });
      else await now.click({ timeout: 2000 });
      actions++;
    } catch {
      /* list re-rendered under the pointer; try again */
    }
  }
  return { actions, offscreenClicks, wallMs: Date.now() - t0 };
}

function summarize(samples: Sample[], ann: Array<{ t: number; kind: string | null; text: string }>) {
  const playing = samples.filter((s) => s.status === 'playing');
  const t0 = playing[0]?.t ?? 0;
  const sec = (t: number) => Math.round((t - t0) / 100) / 10;
  const firstTicket = playing.find((s) => s.tickets.length > 0);
  const firstRec = playing.find((s) => s.rec);
  const firstServe = playing.find((s) => s.score > 0);
  const noRec = playing.filter((s) => !s.rec);
  const noRecWithOrders = noRec.filter((s) => s.tickets.length > 0);
  const noRecNoOrders = noRec.filter((s) => s.tickets.length === 0);
  const leavingSamples = playing.filter((s) => s.tickets.some((k) => k.leaving));
  // leaving episodes = transitions into "some ticket leaving"
  let leavingEpisodes = 0;
  for (let i = 1; i < playing.length; i++) if (playing[i]!.tickets.some((k) => k.leaving) && !playing[i - 1]!.tickets.some((k) => k.leaving)) leavingEpisodes++;
  const hints = [...new Set(playing.map((s) => s.hint).filter(Boolean))] as string[];
  const hintShare = playing.filter((s) => s.hint).length / Math.max(1, playing.length);
  const minPatience = Math.min(...playing.flatMap((s) => s.tickets.map((k) => k.p ?? 1)));
  const recOff = playing.filter((s) => s.rec && s.recInView === false).length / Math.max(1, playing.filter((s) => s.rec).length);
  const withRec = playing.filter((s) => s.rec && s.recInView);
  const ticketsHiddenWhileActing = withRec.filter((s) => s.tickets.length && s.ticketInView === false).length / Math.max(1, withRec.filter((s) => s.tickets.length).length);
  const hudHidden = playing.filter((s) => s.hudInView === false).length / Math.max(1, playing.length);
  const maxActions = Math.max(...playing.map((s) => s.nActions));
  const avgActions = playing.reduce((n, s) => n + s.nActions, 0) / Math.max(1, playing.length);
  const orderIns = new Set(playing.flatMap((s) => s.tickets.map((k) => k.drink + '@')));
  return {
    playingSec: sec(playing.at(-1)?.t ?? t0),
    firstTicketSec: firstTicket ? sec(firstTicket.t) : null,
    firstSuggestionSec: firstRec ? sec(firstRec.t) : null,
    firstServeSec: firstServe ? sec(firstServe.t) : null,
    idleNoSuggestionSharePct: Math.round((noRec.length / Math.max(1, playing.length)) * 100),
    idleWithOrdersWaitingSec: Math.round(noRecWithOrders.length * 2.5) / 10,
    idleNoCustomersSec: Math.round(noRecNoOrders.length * 2.5) / 10,
    leavingCueVisibleSec: Math.round(leavingSamples.length * 2.5) / 10,
    leavingEpisodes,
    minPatienceSeen: Number.isFinite(minPatience) ? minPatience : null,
    whileBrewsHintSharePct: Math.round(hintShare * 100),
    distinctHints: hints.length,
    hintExamples: hints.slice(0, 8),
    suggestedStepOffscreenPct: Math.round(recOff * 100),
    ticketOffscreenWhileSuggestedStepOnscreenPct: Math.round(ticketsHiddenWhileActing * 100),
    hudTimerOffscreenPct: Math.round(hudHidden * 100),
    actionListSize: { max: maxActions, avg: Math.round(avgActions * 10) / 10 },
    distinctDrinkTickets: orderIns.size,
    announcements: ann.map((a) => `${a.kind}: ${a.text}`),
  };
}

type Ann = { t: number; kind: string | null; text: string };

/** Open the recipe wall if it is closed (it is open by default on desktop since the QA-R07 fix). */
async function openWall(page: Page) {
  const wall = page.getByTestId('rush-wall');
  if (!(await wall.evaluate((d) => (d as HTMLDetailsElement).open))) await wall.locator('summary').click();
}
async function harvest(page: Page): Promise<{ samples: unknown[]; ann: Ann[] }> {
  return page.evaluate(() => {
    const q = (window as unknown as { __qa: { samples: unknown[]; ann: Array<{ t: number; kind: string | null; text: string }> } }).__qa;
    return { samples: q.samples, ann: q.ann };
  });
}

// ─────────────────────────── real-speed playtests ───────────────────────────
const REAL: Array<{ name: string; level: 1 | 2; locale: 'en' | 'zh'; mobile: boolean }> = [
  { name: 'L1-desktop-en', level: 1, locale: 'en', mobile: false },
  { name: 'L2-desktop-en', level: 2, locale: 'en', mobile: false },
  { name: 'L1-pixel7-zh', level: 1, locale: 'zh', mobile: true },
];

for (const cfg of REAL) {
  test(`@realspeed ${cfg.name}: guided first-timer plays a whole shift at real speed through the action list`, async ({ page, isMobile }) => {
    test.skip(isMobile !== cfg.mobile, 'viewport-scoped');
    test.setTimeout(330_000);
    const errors = collectErrors(page);
    await seedRush(page, { locale: cfg.locale, stars: cfg.level === 2 ? { 1: 1 } : {} });
    await installProbe(page);
    await page.goto('/#/xr?game=rush');
    await expect(page.getByTestId('rush-lobby')).toBeVisible();
    await page.getByTestId(`rush-level-${cfg.level}`).click();
    await page.getByTestId('rush-play-list').click();
    await expect(page.getByTestId('rush-player')).toBeVisible();
    await page.waitForTimeout(6000);
    await page.screenshot({ path: path.join(LOG_DIR, `playtest-${cfg.name}-t6.png`), fullPage: false });
    const play = await realSpeedPlay(page, { isMobile: cfg.mobile, maxMs: LEVELS[cfg.level].shiftSec * 1000 + 20_000 });
    const { samples, ann } = await harvest(page);
    const results = page.getByTestId('rush-results');
    await expect(results).toBeVisible({ timeout: 15_000 });
    const resultsText = (await results.innerText()).replace(/\n+/g, ' | ');
    const stars = Number(await results.getAttribute('data-stars'));
    await page.screenshot({ path: path.join(LOG_DIR, `playtest-${cfg.name}-results.png`), fullPage: true });
    const summary = { cfg, play, stars, ...summarize(samples as Sample[], ann), resultsText };
    fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.writeFileSync(path.join(LOG_DIR, `playtest-${cfg.name}.json`), JSON.stringify({ summary, samples }, null, 1));
    // gate assertions (soft): the run must finish, serve someone, and leave no error boundary
    expect.soft(summary.firstServeSec, 'first serve happened').not.toBeNull();
    expect.soft(stars, 'stars').toBeGreaterThanOrEqual(1);
    await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    expect(realErrors(errors)).toEqual([]);
  });
}

// ─────────────────────────── first-time read (screenshots, honest labels) ───────────────────────────
for (const locale of ['en', 'zh'] as const) {
  test(`first-time read (${locale}): lobby + first seconds of L1 assisted show honest labels; screenshots`, async ({ page, isMobile }) => {
    const tag = `${isMobile ? 'pixel7' : 'desktop'}-${locale}`;
    await seedRush(page, { locale, guidance: 'assisted' });
    await page.goto('/#/xr?game=rush');
    await expect(page.getByTestId('rush-lobby')).toBeVisible();
    await page.screenshot({ path: path.join(LOG_DIR, `first-lobby-${tag}.png`), fullPage: true });
    const lobbyText = await page.getByTestId('rush-lobby').innerText();
    if (locale === 'en') {
      expect(lobbyText).toMatch(/Simulated practice/);
      expect(lobbyText).toMatch(/hardware-unverified/);
    } else {
      expect(lobbyText).toMatch(/模拟练习/);
      expect(lobbyText).toMatch(/硬件未验证/);
    }
    await page.getByTestId('rush-play-list').click();
    await page.waitForTimeout(5000);
    await page.screenshot({ path: path.join(LOG_DIR, `first-hud-assisted-${tag}.png`), fullPage: true });
    const hud = page.getByTestId('rush-hud');
    await expect(hud).toContainText(locale === 'en' ? 'Simulated' : '模拟');
    await expect(hud).toContainText(locale === 'en' ? 'game time — real shot ≈ 25–35 s' : '游戏时间——真实浓缩约 25–35 秒');
    await expect(hud).toContainText(locale === 'en' ? 'Time left (game time)' : '剩余（游戏时间）');
    // assisted tier: no suggested step
    await expect(page.locator('.xr-action[data-recommended]')).toHaveCount(0);
    // record what a first-timer sees in the action list
    const labels = await page.locator('.xr-action').allInnerTexts();
    fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.writeFileSync(path.join(LOG_DIR, `first-actions-${tag}.txt`), labels.join('\n'));
    // one language at a time: en screen has no CJK; zh HUD has no long English runs
    const all = await page.getByTestId('rush-player').innerText();
    if (locale === 'en') expect(all.match(/[\u4e00-\u9fff]+/g) ?? [], 'CJK on en screen').toEqual([]);
    else expect(all.match(/\b[A-Za-z][A-Za-z'’]+(?:[ ,]+[A-Za-z][A-Za-z'’]+){2,}/g) ?? [], 'English runs on zh screen').toEqual([]);
  });
}

// ─────────────────────────── recipe wall = drinks.ts ───────────────────────────
test('recipe wall numbers equal src/content/drinks.ts at every level; flags the misleading "milk" lines', async ({ page, isMobile }) => {
  test.skip(isMobile, 'content check once');
  await seedRush(page, { stars: { 1: 1, 2: 1, 3: 1, 4: 1 } });
  await page.goto('/#/xr?game=rush');
  await page.getByTestId('rush-level-5').click();
  await page.getByTestId('rush-play-list').click();
  const wall = page.getByTestId('rush-wall');
  await openWall(page);
  await page.getByTestId('rush-pause').click();
  await expect(wall).toContainText('Numbers come from the Drink Atlas');
  const items = await wall.locator('li').allInnerTexts();
  const byName = new Map(drinks.map((d) => [d.name.en, d]));
  const problems: string[] = [];
  for (const raw of items) {
    const line = raw.replace(/\s+/g, ' ');
    const name = line.split(' · ')[0]!.split('\n')[0]!.trim();
    const d = byName.get(name) ?? [...byName.values()].find((x) => line.startsWith(x.name.en));
    if (!d) {
      problems.push(`no atlas drink for wall line "${line.slice(0, 60)}"`);
      continue;
    }
    const m = /(\d+(?:\.\d+)?) g → (\d+(?:\.\d+)?) g \(1:(\d+(?:\.\d+)?)\)/.exec(line);
    if (d.recipe.doseG && d.recipe.outG) {
      if (!m) problems.push(`${d.id}: ratio missing`);
      else {
        if (Number(m[1]) !== d.recipe.doseG || Number(m[2]) !== d.recipe.outG) problems.push(`${d.id}: wall ${m[1]}→${m[2]} vs atlas ${d.recipe.doseG}→${d.recipe.outG}`);
        const r = Math.round((d.recipe.outG / d.recipe.doseG) * 10) / 10;
        if (Number(m[3]) !== r) problems.push(`${d.id}: ratio 1:${m[3]} vs computed 1:${r}`);
      }
    }
    const milk = /milk ≈(\d+) ml/.exec(line);
    if (d.recipe.milkMl && (!milk || Number(milk[1]) !== d.recipe.milkMl)) problems.push(`${d.id}: milk ${milk?.[1]} vs atlas ${d.recipe.milkMl}`);
  }
  expect(problems).toEqual([]);
  expect(items.length).toBe(18);
  fs.writeFileSync(path.join(LOG_DIR, 'wall-L5.txt'), items.join('\n---\n'));
});

// ─────────────────────────── no real-skill / taste claims ───────────────────────────
test('no real-skill, taste or sensing claims across lobby, HUD, wall and results', async ({ page, isMobile }) => {
  test.skip(isMobile, 'content check once');
  test.setTimeout(120_000);
  await page.addInitScript(() => ((window as unknown as { __coffeeLabRushSpeed: number }).__coffeeLabRushSpeed = 12));
  await seedRush(page);
  await page.goto('/#/xr?game=rush');
  const texts: string[] = [await page.getByTestId('rush-lobby').innerText()];
  await page.getByTestId('rush-play-list').click();
  await openWall(page);
  for (let i = 0; i < 400 && !(await page.getByTestId('rush-results').isVisible()); i++) {
    const rec = page.locator('.xr-action[data-recommended]').first();
    if (await rec.count()) await rec.click({ timeout: 1000 }).catch(() => {});
    else await page.waitForTimeout(100);
    if (i === 20) texts.push(await page.getByTestId('rush-player').innerText());
  }
  await expect(page.getByTestId('rush-results')).toBeVisible({ timeout: 60_000 });
  texts.push(await page.getByTestId('rush-results').innerText());
  const all = texts.join('\n');
  const bad = all.match(/\b(you(?:'re| are) (?:now )?(?:a )?(?:barista|ready to)|mastered|certified|proficien\w+|tastes? (?:great|good|perfect|delicious)|perfect (?:taste|flavou?r)|guarantee\w*|we (?:can )?(?:see|detect|sense))\b/gi) ?? [];
  expect(bad).toEqual([]);
  expect(all).toMatch(/does not judge taste/);
  expect(all).toMatch(/What this does not train/);
});

// ─────────────────────────── relaxed + unlock + persistence ───────────────────────────
test('Relaxed: no countdowns / patience bars / tips; finishing unlocks L2; best stars and unlock survive reload', async ({ page, isMobile }) => {
  test.setTimeout(180_000);
  await page.addInitScript(() => ((window as unknown as { __coffeeLabRushSpeed: number }).__coffeeLabRushSpeed = 12));
  await seedRush(page);
  await page.goto('/#/xr?game=rush');
  await expect(page.getByTestId('rush-level-2')).toBeDisabled();
  await page.getByTestId('rush-relaxed').check();
  await page.getByTestId('rush-play-list').click();
  await expect(page.getByTestId('rush-ticket').first()).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('.rush-patience')).toHaveCount(0);
  await expect(page.getByTestId('rush-time')).toContainText(/Served 0\/8/);
  await expect(page.getByTestId('rush-hud')).not.toContainText(/\d:\d\d/);
  for (let i = 0; i < 600 && !(await page.getByTestId('rush-results').isVisible()); i++) {
    const rec = page.locator('.xr-action[data-recommended]').first();
    if (await rec.count()) {
      if (isMobile) await rec.tap({ timeout: 1000 }).catch(() => {});
      else await rec.click({ timeout: 1000 }).catch(() => {});
    } else await page.waitForTimeout(100);
    // tips must stay 0 and no ticket may ever show seconds
    if (i % 25 === 0) {
      await expect(page.locator('.rush-stats div').nth(1).locator('dd')).toHaveText('0');
      await expect(page.getByTestId('rush-tickets')).not.toContainText(/\d+ s\b/);
    }
  }
  const results = page.getByTestId('rush-results');
  await expect(results).toBeVisible({ timeout: 60_000 });
  await expect(results).toContainText('Relaxed: stars from the share of textbook drinks');
  await expect(results).not.toContainText(/customers left [1-9]/);
  const stars = Number(await results.getAttribute('data-stars'));
  expect(stars).toBeGreaterThanOrEqual(1);
  await page.getByTestId('rush-lobby-back').click();
  await expect(page.getByTestId('rush-level-2')).toBeEnabled();
  await page.reload();
  await expect(page.getByTestId('rush-level-2')).toBeEnabled();
  await expect(page.getByTestId('rush-level-1')).toContainText(`Best: ${stars} ★`);
  await expect(page.getByTestId('rush-level-3')).toBeDisabled();
  const st = await readState(page);
  const ev = (st.events as Array<{ activityId: string; evidence: string }>).filter((e) => e.activityId === 'rush:1');
  expect(ev.map((e) => e.evidence)).toEqual(['simulated']);
});

// ─────────────────────────── keyboard, focus, announcements ───────────────────────────
test('keyboard-only: lobby → start → act → pause → resume; focus is managed; arrivals are announced', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard on desktop');
  test.setTimeout(90_000);
  await seedRush(page);
  await installProbe(page);
  await page.goto('/#/xr?game=rush');
  await expect(page.getByTestId('rush-lobby')).toBeVisible();
  // reach the list-mode start button by Tab only
  let reached = false;
  for (let i = 0; i < 60 && !reached; i++) {
    await page.keyboard.press('Tab');
    reached = await page.getByTestId('rush-play-list').evaluate((el) => el === document.activeElement);
  }
  expect(reached, 'Play-with-list reachable by Tab').toBe(true);
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('rush-player')).toBeVisible();
  const afterStart = await page.evaluate(() => {
    const a = document.activeElement as HTMLElement | null;
    return a ? `${a.tagName}#${a.id}.${a.className} "${(a.textContent ?? '').trim().slice(0, 40)}"` : 'null';
  });
  fs.writeFileSync(path.join(LOG_DIR, 'kb-focus-after-start.txt'), afterStart);
  // act 6 times with Tab + Enter only (find the suggested step by tabbing)
  let acted = 0;
  for (let k = 0; k < 6; k++) {
    const rec = page.locator('.xr-action[data-recommended]').first();
    await expect(rec).toBeVisible({ timeout: 20_000 });
    let on = false;
    for (let i = 0; i < 80 && !on; i++) {
      on = await rec.evaluate((el) => el === document.activeElement).catch(() => false);
      if (!on) await page.keyboard.press('Tab');
    }
    if (!on) break;
    await page.keyboard.press('Enter');
    acted++;
    await page.waitForTimeout(300);
  }
  expect(acted).toBe(6);
  // P pauses; the pause dialog should take focus (Resume) so a keyboard user can continue
  await page.keyboard.press('Escape');
  await page.locator('body').press('p');
  await expect(page.getByTestId('rush-player')).toHaveAttribute('data-status', 'paused');
  const dialog = page.getByRole('dialog', { name: 'Paused' });
  await expect(dialog).toBeVisible();
  const focusInDialog = await dialog.evaluate((d) => d.contains(document.activeElement));
  fs.appendFileSync(path.join(LOG_DIR, 'kb-focus-after-start.txt'), `\npause dialog has focus: ${focusInDialog}`);
  await page.locator('body').press('p');
  await expect(page.getByTestId('rush-player')).toHaveAttribute('data-status', 'playing');
  // announcements: a new order arriving should reach the screen reader
  await page.waitForTimeout(15_000);
  const { samples, ann } = await harvest(page);
  const tickets = new Set((samples as Sample[]).flatMap((s) => s.tickets.map((k) => k.drink)));
  const orderAnn = ann.filter((a) => /: one |一杯/.test(a.text));
  fs.writeFileSync(path.join(LOG_DIR, 'kb-announcements.json'), JSON.stringify({ tickets: [...tickets], ann }, null, 1));
  expect(tickets.size).toBeGreaterThan(0);
  fs.appendFileSync(path.join(LOG_DIR, 'kb-focus-after-start.txt'), `\norder announcements: ${orderAnn.length}`);
});

// ─────────────────────────── axe on HUD / wall / pause ───────────────────────────
for (const locale of ['en', 'zh'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    test(`axe: HUD mid-shift + open wall + pause dialog (${locale}, ${theme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await seedRush(page, { locale, stars: { 1: 1 } });
      await page.goto('/#/xr?game=rush');
      await page.getByTestId('rush-level-2').click();
      await page.getByTestId('rush-play-list').click();
      await expect(page.getByTestId('rush-ticket').first()).toBeVisible({ timeout: 15_000 });
      // take a couple of steps so the bench, hint and feedback render
      for (let i = 0; i < 4; i++) {
        const rec = page.locator('.xr-action[data-recommended]').first();
        await rec.click({ timeout: 10_000 });
        await page.waitForTimeout(400);
      }
      await openWall(page);
      const a1 = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      await page.getByTestId('rush-pause').click();
      const a2 = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      const v = [...a1.violations, ...a2.violations].map((x) => `${x.id} (${x.nodes.length}): ${x.nodes[0]?.target.join(' ')}`);
      expect(v).toEqual([]);
    });
  }
}

// ─────────────────────────── phone targets ───────────────────────────
test('phone: every control in lobby, HUD, wall and results is ≥ 44 px', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone only');
  test.setTimeout(120_000);
  await page.addInitScript(() => ((window as unknown as { __coffeeLabRushSpeed: number }).__coffeeLabRushSpeed = 12));
  await seedRush(page);
  const small = async (where: string) =>
    (
      await page.evaluate(() => {
        const out: string[] = [];
        for (const el of document.querySelectorAll<HTMLElement>('main a[href], main button, main summary, main input, main select, main label')) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          if (el.tagName === 'INPUT' && el.closest('label')) continue; // the label is the target
          if (r.height < 44 || r.width < 44) out.push(`${el.tagName} "${(el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 30)}" ${Math.round(r.width)}×${Math.round(r.height)}`);
        }
        return out;
      })
    ).map((s) => `${where}: ${s}`);
  await page.goto('/#/xr?game=rush');
  const issues: string[] = [...(await small('lobby'))];
  await page.getByTestId('rush-play-list').click();
  await expect(page.getByTestId('rush-ticket').first()).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('rush-wall').locator('summary').tap();
  issues.push(...(await small('hud')));
  await page.getByTestId('rush-end').tap();
  await expect(page.getByTestId('rush-results')).toBeVisible();
  issues.push(...(await small('results')));
  fs.writeFileSync(path.join(LOG_DIR, 'phone-targets.txt'), issues.join('\n'));
  expect(issues).toEqual([]);
});

// ─────────────────────────── 3D on phone + XR gate variants ───────────────────────────
test('3D counter on Pixel 7: tap works; screenshot for readability', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone only');
  test.setTimeout(150_000);
  const errors = collectErrors(page);
  await page.addInitScript(() => ((window as unknown as { __coffeeLabRushSpeed: number }).__coffeeLabRushSpeed = 1)); // exposes the 3D test hook; real speed
  await seedRush(page);
  await page.goto('/#/xr?game=rush');
  await page.getByTestId('rush-play-3d').tap();
  await page.waitForFunction(() => !!(window as unknown as { __coffeeLabRush?: unknown }).__coffeeLabRush, null, { timeout: 120_000 });
  const canvas = page.getByTestId('rush-canvas');
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  await page.screenshot({ path: path.join(LOG_DIR, '3d-pixel7.png') });
  const pt = await page.evaluate(() => (window as unknown as { __coffeeLabRush: { project(t: string): { x: number; y: number } } }).__coffeeLabRush.project('shelf'));
  await page.touchscreen.tap(pt.x, pt.y);
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(LOG_DIR, '3d-pixel7-after-shelf-tap.png') });
  fs.writeFileSync(path.join(LOG_DIR, '3d-pixel7.json'), JSON.stringify({ canvas: box, shelf: pt }, null, 1));
  await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
  expect(realErrors(errors)).toEqual([]);
});

test('WebXR gate: navigator.xr present but isSessionSupported throws → no VR offer, game still playable', async ({ page, isMobile }) => {
  test.skip(isMobile, 'once');
  test.setTimeout(120_000);
  const errors = collectErrors(page);
  await page.addInitScript(() => {
    const xr = { isSessionSupported: () => Promise.reject(new Error('SecurityError')), requestSession: () => Promise.reject(new Error('NotSupported')), addEventListener() {}, removeEventListener() {} };
    Object.defineProperty(Navigator.prototype, 'xr', { get: () => xr, configurable: true });
  });
  await page.addInitScript(() => ((window as unknown as { __coffeeLabRushSpeed: number }).__coffeeLabRushSpeed = 1)); // exposes the 3D test hook; real speed
  await seedRush(page);
  await page.goto('/#/xr?game=rush');
  await page.getByTestId('rush-play-3d').click();
  await page.waitForFunction(() => !!(window as unknown as { __coffeeLabRush?: unknown }).__coffeeLabRush, null, { timeout: 90_000 });
  await expect(page.getByRole('button', { name: 'Enter VR' })).toHaveCount(0);
  const rec = page.locator('.xr-action[data-recommended]').first();
  await rec.click({ timeout: 20_000 });
  await expect(page.getByTestId('rush-hands')).not.toContainText('nothing');
  await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
  expect(realErrors(errors).filter((e) => !/SecurityError|NotSupported/.test(e))).toEqual([]);
});

// ─────────────────────────── gate #2 bugs (QA-R01–R07 fixed → normal assertions; QA-R08 still an expected-fail marker) ───────────────────────────
async function fast(page: Page, speed: number) {
  await page.addInitScript((s) => ((window as unknown as { __coffeeLabRushSpeed: number }).__coffeeLabRushSpeed = s), speed);
}
async function stepSuggested(page: Page, isMobile: boolean) {
  const rec = page.locator('.xr-action[data-recommended]').first();
  if (!(await rec.count())) return page.waitForTimeout(100);
  if (isMobile) return rec.tap({ timeout: 1000 }).catch(() => {});
  return rec.click({ timeout: 1000 }).catch(() => {});
}
async function playUntilServed(page: Page, isMobile = false) {
  for (let i = 0; i < 400; i++) {
    if (Number(await page.getByTestId('rush-score').textContent()) > 0) return;
    if (await page.getByTestId('rush-results').isVisible()) return;
    await stepSuggested(page, isMobile);
  }
  throw new Error('no serve');
}

test('control: in Relaxed mode a serve IS announced (isolates QA-R01 to the Standard list-action tick)', async ({ page, isMobile }) => {
  test.skip(isMobile, 'once');
  test.setTimeout(90_000);
  await fast(page, 8);
  await seedRush(page);
  await installProbe(page);
  await page.goto('/#/xr?game=rush');
  await page.getByTestId('rush-relaxed').check();
  await page.getByTestId('rush-play-list').click();
  for (let i = 0; i < 400 && !(await page.getByTestId('rush-time').innerText()).match(/Served [1-8]/); i++) await stepSuggested(page, false);
  await page.waitForTimeout(300);
  const { ann } = await harvest(page);
  expect(ann.filter((a) => !/: one /.test(a.text)).length).toBeGreaterThan(0);
});

for (const level of [1, 3] as const) {
  test(`QA-R01 [fixed, P1] Standard action-list mode L${level}: a serve result and new orders are announced to screen readers`, async ({ page, isMobile }) => {
    test.skip(isMobile, 'once');
    test.setTimeout(90_000);
    await fast(page, 8);
    // L3 still charges the list cost after each action (the case the old atMs guard missed)
    await seedRush(page, { stars: level === 3 ? { 1: 1, 2: 1 } : {} });
    await installProbe(page);
    await page.goto('/#/xr?game=rush');
    await page.getByTestId(`rush-level-${level}`).click();
    await page.getByTestId('rush-play-list').click();
    await playUntilServed(page);
    await page.waitForTimeout(300);
    const { ann } = await harvest(page);
    expect(ann.filter((a) => !/: one /.test(a.text)).map((a) => a.text)).not.toEqual([]);
    expect(ann.filter((a) => /: one /.test(a.text)).length, 'new orders announced').toBeGreaterThan(0);
    expect(new Set(ann.map((a) => a.kind)), 'one polite region').toEqual(new Set(['polite']));
  });
}

test('QA-R02 [fixed, P1] phone: the order ticket (patience bar / leave cue) is on screen while you act on the suggested step', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone only');
  test.setTimeout(90_000);
  await seedRush(page);
  await page.goto('/#/xr?game=rush');
  await page.getByTestId('rush-play-list').tap();
  await expect(page.getByTestId('rush-ticket').first()).toBeVisible({ timeout: 10_000 });
  const both: boolean[] = [];
  for (let k = 0; k < 6; k++) {
    const rec = page.locator('.xr-action[data-recommended]').first();
    await expect(rec).toBeVisible({ timeout: 15_000 });
    await rec.scrollIntoViewIfNeeded();
    both.push(
      await page.evaluate(() => {
        const nav = document.querySelector('nav[aria-label="Primary"]')!.getBoundingClientRect().top;
        const ok = (el: Element | null) => !!el && el.getBoundingClientRect().top >= 0 && el.getBoundingClientRect().bottom <= nav;
        return ok(document.querySelector('.xr-action[data-recommended]')) && ok(document.querySelector('[data-testid="rush-ticket"]'));
      }),
    );
    await rec.tap();
    await page.waitForTimeout(1500);
  }
  expect(both).toEqual(both.map(() => true));
});

test('QA-R03 [fixed, P1] recipe wall: yuenyeung / phin name the real milk component (no bare "milk ≈ N ml") when the build takes no pitcher milk', async ({ page, isMobile }) => {
  test.skip(isMobile, 'once');
  await seedRush(page, { stars: { 1: 1, 2: 1, 3: 1, 4: 1 } });
  await page.goto('/#/xr?game=rush');
  await page.getByTestId('rush-level-5').click();
  await page.getByTestId('rush-play-list').click();
  const wall = page.getByTestId('rush-wall');
  await openWall(page);
  const items = (await wall.locator('li').allInnerTexts()).map((l) => l.replace(/\s+/g, ' '));
  const names = ['yuenyeung', 'vietnamese-phin'].map((id) => drinks.find((d) => d.id === id)!.name.en);
  const lines = items.filter((l) => names.some((n) => l.startsWith(n)));
  expect(lines).toHaveLength(2);
  const suspect = lines.filter((l) => /· milk ≈\d+ ml(?! → pitcher)/.test(l));
  expect(suspect).toEqual([]);
  for (const l of lines) expect(l).toMatch(/(condensed|evaporated) milk ≈\d+ ml/);
});

test('QA-R04 [fixed, P1] real-time references beyond the espresso shot are shown (phin 4–5 min, pour-over 2:30–4:00)', async ({ page, isMobile }) => {
  test.skip(isMobile, 'once');
  await seedRush(page, { stars: { 1: 1, 2: 1, 3: 1 } });
  await page.goto('/#/xr?game=rush');
  await page.getByTestId('rush-level-4').click();
  await page.getByTestId('rush-play-list').click();
  await openWall(page);
  const text = await page.getByTestId('rush-player').innerText();
  expect(text).toMatch(/4–5 min/);
  expect(text).toMatch(/2:30–4:00/);
  expect(text).toMatch(/real bloom 30–45 s/);
  expect(text).toMatch(/depends on wand power/);
});

test('QA-R05 [fixed, P2] desktop: starting a shift shows the HUD timer and moves focus into the game', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop');
  await seedRush(page);
  await page.goto('/#/xr?game=rush');
  await page.getByTestId('rush-play-list').scrollIntoViewIfNeeded();
  await page.getByTestId('rush-play-list').click();
  await expect(page.getByTestId('rush-hud')).toBeVisible();
  const st = await page.evaluate(() => {
    const r = document.querySelector('[data-testid="rush-time"]')!.getBoundingClientRect();
    return { timerInView: r.top >= 0 && r.bottom <= window.innerHeight, focusOnBody: document.activeElement === document.body };
  });
  expect(st).toEqual({ timerInView: true, focusOnBody: false });
});

test('QA-R06 [fixed, P2] pause: the dialog takes focus and the recipe wall can still be read while paused', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop');
  await seedRush(page);
  await page.goto('/#/xr?game=rush');
  await page.getByTestId('rush-play-list').click();
  await page.getByTestId('rush-pause').click();
  await expect(page.getByTestId('rush-player')).toHaveAttribute('data-status', 'paused');
  const resumeFocused = await page
    .getByRole('dialog', { name: 'Paused' })
    .getByRole('button', { name: 'Resume' })
    .evaluate((b) => b === document.activeElement);
  expect(resumeFocused).toBe(true);
  // the wall is open by default on desktop (QA-R07): it must still toggle (not be covered) and be readable while paused
  const wall = page.getByTestId('rush-wall');
  const wasOpen = await wall.evaluate((d) => (d as HTMLDetailsElement).open);
  await wall.locator('summary').click({ timeout: 3000 });
  expect(await wall.evaluate((d) => (d as HTMLDetailsElement).open)).toBe(!wasOpen);
  if (wasOpen) await wall.locator('summary').click({ timeout: 3000 });
  await expect(wall).toHaveAttribute('open', '');
  const li = wall.locator('li').first();
  await li.scrollIntoViewIfNeeded();
  const uncovered = await li.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + Math.min(20, r.width / 2), r.top + r.height / 2);
    return !!hit && el.contains(hit);
  });
  expect(uncovered, 'wall line is not covered by the pause UI').toBe(true);
});

test('QA-R07 [fixed, P1] guided tier: the ratio for the current order is visible without opening the collapsed wall', async ({ page, isMobile }) => {
  test.skip(isMobile, 'once');
  await seedRush(page);
  await page.goto('/#/xr?game=rush');
  await page.getByTestId('rush-play-list').click();
  await expect(page.getByTestId('rush-ticket').first()).toBeVisible({ timeout: 10_000 });
  const visible = await page.getByTestId('rush-player').innerText(); // closed <details> content is not rendered
  expect(visible).toMatch(/1:\d/);
  // on the ticket itself, not only on the (desktop-open) wall
  await expect(page.getByTestId('rush-ticket').first()).toContainText(/1:\d/);
});

test('QA-R08 [fixed] zh: Rush tickets and wall use one language (no Latin glosses in drink names)', async ({ page, isMobile }) => {
  test.skip(isMobile, 'once');
  await seedRush(page, { locale: 'zh' });
  await page.goto('/#/xr?game=rush');
  await page.getByTestId('rush-play-list').click();
  await expect(page.getByTestId('rush-ticket').first()).toBeVisible({ timeout: 10_000 });
  await openWall(page);
  const names = await page.locator('[data-testid="rush-ticket"] strong').allInnerTexts();
  const wall = await page.getByTestId('rush-wall').locator('li strong').allInnerTexts();
  expect([...names, ...wall].filter((n) => /[A-Za-z]/.test(n))).toEqual([]);
});
