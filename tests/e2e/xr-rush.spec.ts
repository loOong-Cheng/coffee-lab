/**
 * Café Rush (XR Lab game) on desktop and Pixel 7:
 *  - from the picker: lobby → play Level 1 with the keyboard action list (guided suggestions) → results;
 *    the run is saved as `simulated` and Level 2 unlocks, still unlocked after a reload
 *  - a Relaxed shift never times out
 *  - zh, ≥ 44 px targets on phone, axe on the lobby and results
 * A test-only fast clock (window.__coffeeLabRushSpeed) compresses the shift; the game logic is unchanged.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { ERROR_BOUNDARY_TEXT, collectErrors, readState, seedProfile } from './qa-helpers';

test.use({ serviceWorkers: 'block' });

const realErrors = (errors: string[]) => errors.filter((e) => !/WebGL|GPU stall|GL Driver/i.test(e));

async function fastClock(page: Page, speed = 8) {
  await page.addInitScript((s) => {
    (window as unknown as { __coffeeLabRushSpeed: number }).__coffeeLabRushSpeed = s;
  }, speed);
}

async function openLobbyFromPicker(page: Page) {
  await page.goto('/#/xr');
  await page.getByTestId('xr-game-rush').getByRole('link', { name: /Open Café Rush|打开咖啡快跑/ }).click();
  await expect(page.getByTestId('rush-lobby')).toBeVisible();
}

/** Keyboard-only: press the suggested action (focus + Enter) until the results screen shows. */
async function playToResults(page: Page, maxMs = 120_000) {
  const results = page.getByTestId('rush-results');
  const t0 = Date.now();
  while (Date.now() - t0 < maxMs) {
    if (await results.isVisible()) return;
    const rec = page.locator('.xr-action[data-recommended]').first();
    try {
      await rec.focus({ timeout: 300 });
      await page.keyboard.press('Enter');
    } catch {
      await page.waitForTimeout(100);
    }
  }
  throw new Error('shift did not finish');
}

test.describe('Café Rush', () => {
  test('Level 1 from the picker via the action list → results; saved as simulated; Level 2 unlocks and survives reload', async ({ page }) => {
    test.setTimeout(180_000);
    const errors = collectErrors(page);
    await fastClock(page);
    await seedProfile(page);
    await openLobbyFromPicker(page);
    await expect(page.getByTestId('rush-level-2')).toBeDisabled();
    const axeLobby = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(axeLobby.violations.map((v) => v.id), 'axe lobby').toEqual([]);

    await page.getByTestId('rush-play-list').click();
    await expect(page.getByTestId('rush-hud')).toContainText('Simulated');
    await expect(page.getByTestId('rush-hud')).toContainText('game time — real shot ≈ 25–35 s');
    await expect(page.getByTestId('rush-ticket').first()).toBeVisible();
    await expect(page.locator('.rush-patience').first()).toBeVisible();
    await playToResults(page);

    const results = page.getByTestId('rush-results');
    const stars = Number(await results.getAttribute('data-stars'));
    expect(stars).toBeGreaterThanOrEqual(1);
    await expect(results).toContainText('Order by order');
    await expect(results.locator('[data-outcome="correct"]').first()).toBeVisible();
    const axeResults = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(axeResults.violations.map((v) => v.id), 'axe results').toEqual([]);

    const st = await readState(page);
    const ev = (st.events as Array<{ activityId: string; evidence: string; score?: number }>).filter((e) => e.activityId === 'rush:1');
    expect(ev).toHaveLength(1);
    expect(ev[0]).toMatchObject({ evidence: 'simulated' });

    await page.getByTestId('rush-lobby-back').click();
    await expect(page.getByTestId('rush-level-2')).toBeEnabled();
    await page.reload();
    await expect(page.getByTestId('rush-level-2')).toBeEnabled();
    await expect(page.getByTestId('rush-level-3')).toBeDisabled();
    await page.goto('/#/xr');
    await expect(page.getByTestId('xr-game-rush-stars')).toContainText('L1 ★');
    await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    expect(realErrors(errors)).toEqual([]);
  });

  test('a Relaxed shift never times out; pause freezes it', async ({ page }) => {
    await fastClock(page, 12);
    await seedProfile(page);
    await page.goto('/#/xr?game=rush');
    await page.getByTestId('rush-relaxed').check();
    await page.getByTestId('rush-play-list').click();
    await expect(page.getByTestId('rush-ticket')).toHaveCount(2, { timeout: 15_000 });
    await page.waitForTimeout(8_000); // ≈ 96 s of game time, no actions
    await expect(page.getByTestId('rush-ticket')).toHaveCount(2);
    await expect(page.getByTestId('rush-tickets')).toContainText('No rush');
    await expect(page.getByTestId('rush-player')).toHaveAttribute('data-status', 'playing');
    await expect(page.locator('.rush-feedback')).not.toContainText('had to go');
    await page.getByTestId('rush-pause').click();
    await expect(page.getByTestId('rush-player')).toHaveAttribute('data-status', 'paused');
    await page.getByRole('dialog', { name: 'Paused' }).getByRole('button', { name: 'Resume' }).click();
    await expect(page.getByTestId('rush-player')).toHaveAttribute('data-status', 'playing');
  });

  test('3D counter loads and a click / tap on the group head picks up the portafilter (same reducer)', async ({ page, isMobile }) => {
    test.setTimeout(120_000);
    const errors = collectErrors(page);
    await fastClock(page, 1);
    await seedProfile(page);
    await page.goto('/#/xr?game=rush');
    await page.getByTestId('rush-play-3d').click();
    await expect(page.getByTestId('rush-canvas')).toBeVisible();
    await page.waitForFunction(() => !!(window as unknown as { __coffeeLabRush?: unknown }).__coffeeLabRush, null, { timeout: 90_000 });
    await page.getByTestId('rush-canvas').scrollIntoViewIfNeeded();
    const pt = await page.evaluate(() => (window as unknown as { __coffeeLabRush: { project(t: string): { x: number; y: number } } }).__coffeeLabRush.project('group1'));
    if (isMobile) await page.touchscreen.tap(pt.x, pt.y);
    else await page.mouse.click(pt.x, pt.y);
    await expect(page.getByTestId('rush-hands')).toContainText('Portafilter', { timeout: 10_000 });
    const stats = await page.evaluate(() => (window as unknown as { __coffeeLabRush: { stats(): { drawCalls: number } } }).__coffeeLabRush.stats());
    expect(stats.drawCalls).toBeLessThan(150);
    await page.screenshot({ path: `reports/screenshots/xr-rush-3d-${isMobile ? 'mobile' : 'desktop'}.png` });
    await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    expect(realErrors(errors)).toEqual([]);
  });

  test('WebXR gate: no navigator.xr → no VR offer and the game still works; a reported headset only adds an honest note', async ({ page }) => {
    test.setTimeout(120_000);
    const errors = collectErrors(page);
    await page.addInitScript(() => {
      Object.defineProperty(Navigator.prototype, 'xr', { get: () => undefined, configurable: true });
    });
    await fastClock(page, 1);
    await seedProfile(page);
    await page.goto('/#/xr?game=rush');
    // the 3D counter loads, but nothing offers VR
    await page.getByTestId('rush-play-3d').click();
    await page.waitForFunction(() => !!(window as unknown as { __coffeeLabRush?: unknown }).__coffeeLabRush, null, { timeout: 90_000 });
    await expect(page.getByTestId('rush-player')).not.toHaveAttribute('data-vr', /.*/);
    await expect(page.getByRole('button', { name: 'Enter VR' })).toHaveCount(0);
    await expect(page.getByTestId('rush-vr-note')).toHaveCount(0);
    await page.getByRole('button', { name: 'Back to lobby' }).click();
    await page.goto('/#/xr?game=rush');
    await expect(page.getByTestId('rush-lobby')).toContainText('hardware-unverified');
    await page.getByTestId('rush-play-list').click();
    await expect(page.getByRole('button', { name: 'Enter VR' })).toHaveCount(0);
    await expect(page.locator('.xr-action').first()).toBeVisible();
    await page.getByRole('button', { name: 'Back to lobby' }).click();
    await expect(page.getByTestId('rush-lobby')).toBeVisible();
    await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    expect(realErrors(errors)).toEqual([]);
  });

  test('WebXR gate (HARDWARE-UNVERIFIED, fake immersive-vr): Enter VR is offered with an honest note; a denied session alerts and the 3D counter keeps working', async ({ page, isMobile }) => {
    test.setTimeout(120_000);
    const errors = collectErrors(page);
    await page.addInitScript(() => {
      const fake = {
        isSessionSupported: async (m: string) => m === 'immersive-vr',
        requestSession: async () => {
          throw new DOMException('No headset in this test', 'NotAllowedError');
        },
        addEventListener() {},
        removeEventListener() {},
      };
      Object.defineProperty(Navigator.prototype, 'xr', { configurable: true, get: () => fake });
    });
    await fastClock(page, 1);
    await seedProfile(page);
    await page.goto('/#/xr?game=rush');
    await expect(page.getByTestId('rush-lobby')).toContainText('hardware-unverified');
    await page.getByTestId('rush-play-3d').click();
    await expect(page.getByTestId('rush-player')).toHaveAttribute('data-vr', 'true');
    const enter = page.getByTestId('rush-player').getByRole('button', { name: 'Enter VR' });
    await expect(enter).toBeVisible({ timeout: 90_000 });
    await expect(page.getByTestId('rush-vr-note')).toContainText('hardware-unverified');
    await expect(page.getByTestId('rush-vr-note')).toContainText('trigger');
    await enter.click();
    await expect(page.getByRole('alert').filter({ hasText: 'The VR session could not start' })).toBeVisible();
    // the 3D counter still works through the same reducer
    await page.waitForFunction(() => !!(window as unknown as { __coffeeLabRush?: unknown }).__coffeeLabRush, null, { timeout: 30_000 });
    await page.getByTestId('rush-canvas').scrollIntoViewIfNeeded();
    const pt = await page.evaluate(() => (window as unknown as { __coffeeLabRush: { project(t: string): { x: number; y: number } } }).__coffeeLabRush.project('group1'));
    if (isMobile) await page.touchscreen.tap(pt.x, pt.y);
    else await page.mouse.click(pt.x, pt.y);
    await expect(page.getByTestId('rush-hands')).toContainText('Portafilter', { timeout: 10_000 });
    await expect(page.locator('.xr-action').first()).toBeVisible();

    // TEST-ONLY emulation (no session, no headset): the in-headset panels render and the controllers'
    // intent functions (grip release / trigger / choice panel) drive the same reducer; results stay in-scene.
    type VtState = { choice: string[]; hud: boolean; orders: boolean; results: boolean; note: string | null };
    const vt = <T = unknown,>(method: 'emulate' | 'trigger' | 'choose' | 'release' | 'replay' | 'state', arg?: string | boolean) =>
      page.evaluate(
        ([m, x]) => {
          const v = (window as unknown as { __coffeeLabRush: { vrTest(): Record<string, (a?: unknown) => unknown> } }).__coffeeLabRush.vrTest();
          return v[m as string]!(x);
        },
        [method, arg] as const,
      ) as Promise<T>;
    await vt('emulate', true);
    expect(await vt<VtState>('state')).toMatchObject({ hud: true, orders: true, results: false });
    await vt('release', 'grinder'); // grip released near the grinder → place
    await expect(page.getByTestId('rush-hands')).toContainText('nothing');
    await vt('trigger', 'grinder'); // trigger = use → grind
    await expect(page.locator('.rush-bench__list')).toContainText('working');
    await vt('trigger', 'shelf');
    expect((await vt<VtState>('state')).choice).toEqual(['takeCup:demitasse', 'takeCup:small', 'takeCup:medium', 'takeCup:large']);
    expect(await vt('choose', 'takeCup:small')).toBe(true);
    await expect(page.getByTestId('rush-hands')).not.toContainText('nothing');
    await vt('trigger', 'knock'); // nothing to do there → a note, no state change
    expect((await vt<VtState>('state')).note).toContain('knock box');
    await page.getByTestId('rush-canvas').screenshot({ path: test.info().outputPath('vr-emulated.png') });
    await page.getByTestId('rush-end').click();
    await expect(page.getByTestId('rush-player')).toHaveAttribute('data-status', 'over');
    await expect(page.getByTestId('rush-results')).toHaveCount(0); // in "VR" the results are a panel
    expect(await vt<VtState>('state')).toMatchObject({ results: true, orders: false });
    await vt('replay');
    await expect(page.getByTestId('rush-player')).toHaveAttribute('data-status', 'playing');
    await vt('emulate', false);
    await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    expect(realErrors(errors)).toEqual([]);
  });

  test('zh: lobby and player are Chinese; phone targets are ≥ 44 px', async ({ page, isMobile }) => {
    await seedProfile(page, { locale: 'zh' });
    const leftovers = async () =>
      ((await page.getByRole('main').innerText()).replace(/(Coffee Lab|WebXR|VR|XR Lab|L\d)/g, '').match(/\b[A-Za-z][A-Za-z'’]+(?:[ ,]+[A-Za-z][A-Za-z'’]+){3,}/g) ?? []).slice(0, 8);
    await page.goto('/#/xr?game=rush');
    await expect(page.getByRole('heading', { name: '咖啡快跑' })).toBeVisible();
    expect(await leftovers(), 'lobby').toEqual([]);
    await page.getByTestId('rush-play-list').click();
    await expect(page.getByTestId('rush-hud')).toContainText('模拟');
    await expect(page.locator('.xr-action').first()).toBeVisible();
    expect(await leftovers(), 'player').toEqual([]);
    if (isMobile) {
      for (const el of await page.locator('.rush button, .rush summary, .rush-lobby button').all()) {
        if (!(await el.isVisible())) continue;
        const box = await el.boundingBox();
        expect(box!.height, await el.innerText()).toBeGreaterThanOrEqual(44);
      }
    }
  });
});
