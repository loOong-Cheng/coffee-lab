import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Brew companions at the real machine (desktop 1280×800 + Pixel 7):
 *  - espresso shot timer: the learner taps Start/Stop; the measured interval is carried into the brew log
 *    as "Timed in app" while everything else stays self-reported;
 *  - pour-over schedule: a user-started schedule of target scale readings, driven here by a fake clock;
 *  - journal dial-in chart with its table alternative.
 * Run isolated: E2E_PORT=4189 E2E_DIST=.e2e/dist-brew E2E_OUT=.e2e/out-brew npx playwright test tests/e2e/brew.spec.ts
 */

test.use({ serviceWorkers: 'block' });

const STATE_KEY = 'coffee-lab:state';
/** Interim per-device key used before BrewLogEntry.timeSource existed; the journal folds it in once and deletes it. */
const LEGACY_TIME_SOURCE_KEY = 'coffee-lab:journal:time-source:v1';
const PREFS = { locale: 'en', sfx: false, music: false, volume: 0.5, reducedMotion: 'on', theme: 'system', defaultGuidance: 'guided', speakSteps: false };
const PROFILE = {
  goal: 'espresso',
  experience: 'new',
  devices: ['phone', 'pc'],
  equipment: ['espresso-machine', 'grinder', 'tamper', 'scale', 'dripper', 'paper-filter', 'gooseneck-kettle'],
  wishlist: [],
  preferredMode: 'mobile',
  onboardedAt: '2026-11-07T08:00:00.000Z',
};

async function seed(page: Page, journal: unknown[] = [], legacyTimeSource: Record<string, number> | null = null) {
  const state = { version: 1, profile: PROFILE, prefs: PREFS, events: [], journal, activePractice: null };
  await page.addInitScript(
    ([key, value, tsKey, ts]) => {
      if (window.localStorage.getItem(key)) return;
      window.localStorage.setItem(key, value);
      if (ts) window.localStorage.setItem(tsKey, ts);
    },
    [STATE_KEY, JSON.stringify(state), LEGACY_TIME_SOURCE_KEY, legacyTimeSource ? JSON.stringify(legacyTimeSource) : ''] as const,
  );
}

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

const stepCard = (page: Page) => page.getByTestId('practice-step');
const doneButton = (page: Page) => page.getByRole('group', { name: 'Step controls' }).getByRole('button', { name: /^Done/ });

async function doneUntilStep(page: Page, stepId: string) {
  for (let i = 0; i < 20 && (await stepCard(page).getAttribute('data-step-id')) !== stepId; i++) await doneButton(page).click();
  await expect(stepCard(page)).toHaveAttribute('data-step-id', stepId);
}

async function doneUntilFinish(page: Page) {
  for (let i = 0; i < 30 && !(await page.getByTestId('practice-finish').isVisible()); i++) await doneButton(page).click();
  await expect(page.getByTestId('practice-finish')).toBeVisible();
}

/**
 * install() lets fake time keep flowing with real time; pausing makes runFor() the only thing that advances
 * it, so measured seconds are exact under load. Called after the axe scans (axe needs running timers).
 */
async function freezeClock(page: Page) {
  await page.clock.pauseAt(new Date('2026-11-08T09:00:00.000Z'));
}

async function expectKitchenSize(page: Page, testId: string) {
  const box = await page.getByTestId(testId).boundingBox();
  expect(box?.height ?? 0, `${testId} height`).toBeGreaterThanOrEqual(63.5);
}

async function axe(page: Page) {
  const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  return res.violations.map((v) => ({ id: v.id, n: v.nodes.length, targets: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) }));
}

test('espresso guide: shot timer start/stop → brew log shows "Timed in app" time, the rest self-reported', async ({ page }) => {
  const errors = collectErrors(page);
  await page.clock.install({ time: new Date('2026-11-08T08:00:00.000Z') });
  await seed(page);
  await page.goto('/#/practice/esp-first-real-shot-guide');
  await page.getByTestId('practice-start').click();
  await doneUntilStep(page, 'brew');

  const shot = page.getByTestId('shot-timer');
  await expect(shot).toBeVisible();
  await expect(shot).toContainText('≈ 36 g');
  await expect(shot).toContainText('25–35 s — stop by weight, not by the clock');
  await expect(shot).toContainText('Read your own scale');
  await expect(page.getByTestId('stopwatch')).toHaveCount(0);
  await expectKitchenSize(page, 'shot-start');
  expect(await axe(page), 'axe on the shot-timer step').toEqual([]);

  await freezeClock(page);
  await page.getByTestId('shot-start').click();
  await page.clock.runFor(27_000);
  await expect(page.getByTestId('shot-digits')).toHaveText('0:27');
  await expect(stepCard(page)).toHaveAttribute('data-step-id', 'brew'); // the timer never completes the step
  await expectKitchenSize(page, 'shot-stop');
  await page.getByTestId('shot-stop').click();
  const result = page.getByTestId('shot-result');
  await expect(result).toContainText('Shot time: 0:27');
  await expect(result).toContainText('Timed in app');
  await expect(result).toContainText('Within the 25–35 s reference');
  await page.getByTestId('shot-carry').click();
  await expect(page.getByTestId('shot-carried')).toContainText('0:27 will go in your brew log');

  // Interruption: reload → resume → the stopped shot and the carry are still there.
  await page.clock.resume(); // the shot is stopped (frozen in storage); let the app's own timers run for the reload
  await page.reload();
  await page.getByTestId('resume-continue').click();
  await expect(page.getByTestId('shot-result')).toContainText('0:27');
  await expect(page.getByTestId('shot-carried')).toBeVisible();

  await doneUntilFinish(page);
  await expect(page.getByTestId('log-timeSec')).toHaveValue('27');
  await expect(page.getByTestId('log-time-source')).toContainText('Timed in app');
  await expect(page.getByTestId('log-doseG')).toHaveValue('');
  await expect(page.getByTestId('log-outG')).toHaveValue('');
  await page.getByTestId('log-doseG').fill('18');
  await page.getByTestId('log-outG').fill('36');
  await page.getByTestId('taste-balanced').click();
  await page.getByTestId('log-save').click();

  await expect(page).toHaveURL(/#\/journal\?entry=/);
  await expect(page.getByTestId('entry-time-source')).toHaveText('Timed in app');
  await expect(page.getByTestId('journal-entry').getByText('Self-reported').first()).toBeVisible();
  await expect(page.getByTestId('journal-entry')).toContainText('measured by the app between your own Start and Stop taps');

  const saved = await page.evaluate((k) => JSON.parse(window.localStorage.getItem(k) ?? '{}'), STATE_KEY);
  // Only the time carries app provenance; the entry as a whole stays self-reported.
  expect(saved.journal[0]).toMatchObject({ evidence: 'self_report', drinkId: 'espresso-shot', doseG: 18, outG: 36, timeSec: 27, timeSource: 'app-timer' });
  expect(errors).toEqual([]);
});

test('pour-over guide: the schedule advances on its own clock, scales to the dose, pauses, and carries the total time', async ({ page }) => {
  const errors = collectErrors(page);
  await page.clock.install({ time: new Date('2026-11-08T08:00:00.000Z') });
  await seed(page);
  await page.goto('/#/practice/po-first-real-cup-guide');
  await page.getByTestId('practice-start').click();
  await doneUntilStep(page, 'bloom');

  const pour = page.getByTestId('pour-schedule');
  await expect(pour).toContainText('A schedule, not a measurement');
  await expect(pour).toContainText('read your own scale');
  await expect(page.getByTestId('countdown')).toHaveCount(0);
  await expect(page.getByTestId('pour-dose')).toHaveText('15 g');
  await page.getByTestId('pour-dose-more').click();
  await expect(page.getByTestId('pour-dose')).toHaveText('16 g');
  await expect(page.getByTestId('pour-total')).toContainText('267 g water in total');
  for (const id of ['pour-dose-more', 'pour-dose-less', 'pour-start']) await expectKitchenSize(page, id);
  expect(await axe(page), 'axe on the pour-schedule step').toEqual([]);

  await freezeClock(page);
  await page.getByTestId('pour-start').click();
  await expect(pour).toHaveAttribute('data-phase', 'bloom-pour');
  await expect(page.getByTestId('pour-phase')).toContainText('pour slowly to about 45 g');

  await page.clock.runFor(20_000);
  await expect(pour).toHaveAttribute('data-phase', 'bloom-wait');
  await expect(page.getByTestId('pour-detail')).toContainText('Next pour in 0:25 — up to 160 g');

  await page.clock.runFor(30_000); // 0:50
  await expect(pour).toHaveAttribute('data-phase', 'pour-1');
  await expect(page.getByTestId('pour-detail')).toContainText('Reach 160 g by 1:15');
  await expect(page.getByTestId('pour-timeline').locator('li[aria-current="step"]')).toContainText('First pour');

  await doneButton(page).click(); // the learner confirms the bloom; the schedule keeps running
  await expect(stepCard(page)).toHaveAttribute('data-step-id', 'pour-1');
  await expect(page.getByTestId('pour-clock')).toHaveText('0:50');

  await page.getByTestId('pour-pause').click();
  await page.clock.runFor(10_000);
  await expect(page.getByTestId('pour-clock')).toHaveText('0:50');
  await page.getByTestId('pour-resume').click();
  await page.clock.runFor(40_000); // 1:30
  await expect(pour).toHaveAttribute('data-phase', 'pour-2');
  await expect(page.getByTestId('pour-detail')).toContainText('Reach 267 g by 2:00');
  await page.clock.runFor(100_000); // 3:10 — past the drawdown reference
  await expect(pour).toHaveAttribute('data-phase', 'over');
  await page.getByTestId('pour-stop').click();
  await expect(page.getByTestId('pour-result')).toContainText('Total brew time: 3:10');
  await page.getByTestId('pour-carry').click();

  await doneUntilFinish(page);
  await expect(page.getByTestId('log-timeSec')).toHaveValue('3:10');
  await expect(page.getByTestId('log-time-source')).toBeVisible();
  await page.getByTestId('log-save').click();
  await expect(page.getByTestId('entry-time-source')).toBeVisible();
  const saved = await page.evaluate((k) => JSON.parse(window.localStorage.getItem(k) ?? '{}'), STATE_KEY);
  expect(saved.journal[0]).toMatchObject({ evidence: 'self_report', drinkId: 'pourover-cone', timeSec: 190, timeSource: 'app-timer' });
  expect(saved.journal[0].doseG).toBeUndefined(); // the scaled plan is never logged as a measurement
  expect(errors).toEqual([]);
});

test('journal dial-in chart: attempts in order, latest highlighted, table alternative, tap a point → entry', async ({ page, isMobile }) => {
  const errors = collectErrors(page);
  const cup = (id: string, day: number, p: Record<string, unknown>) => ({ id, evidence: 'self_report', drinkId: 'espresso-shot', createdAt: `2026-11-0${day}T08:00:00.000Z`, ...p });
  await seed(
    page,
    [
      cup('brew_a', 1, { doseG: 18, outG: 40, timeSec: 19, tasteTags: ['sour'] }),
      cup('brew_b', 2, { doseG: 18, outG: 36, timeSec: 26 }),
      cup('brew_c', 3, { doseG: 18, outG: 34, timeSec: 31, timeSource: 'app-timer' }),
      cup('brew_p', 4, { drinkId: 'pourover-cone', doseG: 15, outG: 250, timeSec: 185 }),
    ],
    // Legacy side key: brew_b still matches → migrated; brew_a was edited since (19 ≠ 99) → stays self-reported.
    { brew_b: 26, brew_a: 99 },
  );
  await page.goto('/#/journal');

  const chart = page.getByTestId('dialin');
  await expect(chart.getByRole('heading', { name: 'Dial-in path: Espresso' })).toBeVisible();
  await expect(page.getByTestId('dialin-svg')).toBeVisible();
  await expect(page.getByTestId('dialin-zone')).toHaveCount(1);
  await expect(chart).toContainText('Common starting zone (illustrative)');
  await expect(chart).toContainText('3 attempts plotted, joined oldest to newest. Latest: 31 s at 1:1.9.');
  await expect(page.getByTestId('dialin-point-3')).toHaveClass(/is-latest/);
  await expect(page.locator('[data-testid^="dialin-point-"]')).toHaveCount(3);
  const hit = await page.getByTestId('dialin-point-1').boundingBox();
  expect(hit?.width ?? 0).toBeGreaterThanOrEqual(isMobile ? 43.5 : 24);
  expect(hit?.height ?? 0).toBeGreaterThanOrEqual(isMobile ? 43.5 : 24);

  await page.getByTestId('dialin-table-toggle').click();
  const table = page.getByTestId('dialin-table');
  await expect(table.getByRole('row')).toHaveCount(4);
  await expect(table.getByRole('row', { name: /Attempt 3/ })).toContainText('Timed in app');
  await expect(table.getByRole('row', { name: /Attempt 2/ })).toContainText('1:2.0');
  await expect(table.getByRole('row', { name: /Attempt 2/ })).toContainText('Timed in app');
  await expect(table.getByRole('row', { name: /Attempt 1/ })).not.toContainText('Timed in app');
  const migrated = await page.evaluate(([k, lk]) => ({ s: JSON.parse(window.localStorage.getItem(k) ?? '{}'), legacy: window.localStorage.getItem(lk) }), [STATE_KEY, LEGACY_TIME_SOURCE_KEY] as const);
  expect(migrated.legacy).toBeNull();
  expect(Object.fromEntries(migrated.s.journal.map((j: { id: string; timeSource?: string }) => [j.id, j.timeSource ?? null]))).toEqual({ brew_a: null, brew_b: 'app-timer', brew_c: 'app-timer', brew_p: null });
  await expect(page.getByTestId('journal-list')).toContainText('timed in app');
  expect(await axe(page), 'axe on the journal with the chart + table').toEqual([]);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, 'horizontal overflow (px)').toBeLessThanOrEqual(0);

  await page.getByTestId('dialin-point-2').click();
  await expect(page).toHaveURL(/entry=brew_b/);
  await expect(page.getByTestId('journal-entry')).toBeVisible();

  // A drink with a single attempt shows the honest empty state instead of a one-dot "path".
  await page.goto('/#/journal?drink=pourover-cone');
  await expect(page.getByTestId('dialin-empty')).toContainText('Plottable so far: 1');
  expect(errors).toEqual([]);
});
