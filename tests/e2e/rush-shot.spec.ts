/**
 * Café Rush: controllable espresso shots and a big desktop 3D view (user report 2026-11-14:
 * "extraction is uncontrolled", "I don't see how much water comes from the machine and when to stop",
 * "on desktop the screen is too small").
 */
import { expect, test, type Page } from '@playwright/test';

async function startShift(page: Page, mode: 'list' | '3d', tier: 'Guided' | 'Assisted') {
  await page.goto(`/${mode === '3d' ? '?xrtest' : ''}#/xr?game=rush`);
  await page.getByRole('radio', { name: new RegExp(tier, 'i') }).first().click();
  await page.getByTestId(mode === '3d' ? 'rush-play-3d' : 'rush-play-list').click();
  if (mode === '3d') await page.waitForFunction(() => !!(window as unknown as { __coffeeLabRush?: unknown }).__coffeeLabRush, null, { timeout: 90_000 });
}
async function act(page: Page, id: string) {
  await page.locator(`[data-action-id="${id}"]`).first().click();
}
/** Grind, lock in, cup under group 1, start an espresso (target 36 g). */
async function pullEspresso(page: Page) {
  await act(page, 'grab:group1');
  await act(page, 'place:grinder');
  await act(page, 'grind');
  await expect(page.locator('[data-action-id="grab:grinder"]')).toBeVisible({ timeout: 10_000 });
  await act(page, 'grab:grinder');
  await act(page, 'place:group1');
  await act(page, 'takeCup:demitasse');
  await act(page, 'place:tray1');
  await act(page, 'startShot:1:normal');
}
const grams = async (page: Page) => Number(await page.getByTestId('rush-shot-1').getAttribute('data-yield'));

test.describe('Café Rush · controllable shots', () => {
  test.describe.configure({ timeout: 120_000 });

  test('the meter shows grams rising with a target and the player stops the shot (Assisted, list)', async ({ page }) => {
    await startShift(page, 'list', 'Assisted');
    await pullEspresso(page);
    const meter = page.getByTestId('rush-shots');
    await expect(meter).toBeVisible();
    await expect(meter).toContainText(/target 36 g/);
    await expect(page.locator('[data-action-id="stopShot:1"]')).toBeVisible(); // Stop is in the action list too
    await expect.poll(() => grams(page), { timeout: 15_000 }).toBeGreaterThan(5);
    const a = await grams(page);
    await expect.poll(() => grams(page), { timeout: 5_000 }).toBeGreaterThan(a); // still flowing
    await expect.poll(() => grams(page), { timeout: 15_000 }).toBeGreaterThanOrEqual(31);
    await page.getByTestId('rush-stop-1').click();
    await expect(meter).toHaveCount(0);
    // the counter list records what reached the cup: a normal shot of 31–45 g
    await expect(page.locator('.rush-bench')).toContainText(/shot \(Normal, (3[1-9]|4[0-4])(\.\d)? g\)/);
  });

  test('Guided: Stop is highlighted near the target and the machine stops just past it', async ({ page }) => {
    await startShift(page, 'list', 'Guided');
    await pullEspresso(page);
    await expect.poll(() => grams(page), { timeout: 20_000 }).toBeGreaterThanOrEqual(33.5);
    await expect(page.locator('.xr-action[data-recommended][data-action-id="stopShot:1"]')).toHaveCount(1);
    await expect(page.getByTestId('rush-shots')).toHaveCount(0, { timeout: 10_000 }); // grace stop at 40 g
  });
});

test.describe('Café Rush · desktop 3D view', () => {
  test.describe.configure({ mode: 'serial', timeout: 240_000 });
  test.skip(({ isMobile }) => isMobile, 'desktop layout');

  test('at 1280 × 800 the counter view is large, everything fits and acting never scrolls it away', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await startShift(page, '3d', 'Assisted');
    const stage = await page.getByTestId('rush-stage').boundingBox();
    expect(stage!.width).toBeGreaterThanOrEqual(780); // was 617 px
    await pullEspresso(page);
    await expect(page.getByTestId('rush-shots')).toBeVisible();
    // the 3D counter and the meter are both fully on screen, below the sticky ticket strip
    const live = await page.getByTestId('rush-live').boundingBox();
    const s2 = await page.getByTestId('rush-stage').boundingBox();
    const meter = await page.getByTestId('rush-shots').boundingBox();
    for (const b of [s2!, meter!]) {
      expect(b.y).toBeGreaterThanOrEqual(live!.y + live!.height - 1);
      expect(b.y + b.height).toBeLessThanOrEqual(800 + 1);
    }
    await page.getByTestId('rush-stop-1').click();
    await expect(page.getByTestId('rush-shots')).toHaveCount(0);
  });
});
