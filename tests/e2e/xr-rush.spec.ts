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
