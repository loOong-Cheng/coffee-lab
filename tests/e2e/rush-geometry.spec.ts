/**
 * Café Rush 3D geometry: no two different objects interpenetrate.
 * Regression (user report 2026-11-14, "mesh overlap"): the portafilter handle sat inside the machine during a shot,
 * the 4th extras bottle stood inside the fridge, portafilters on the back counter row went through items on the front
 * row, cups sank into the drip tray and the kettle into its base. The audit checks every static part (recorded before
 * merging) and every item kind at every slot it can occupy — the drawn geometry, not just anchor points.
 */
import { expect, test } from '@playwright/test';

test.describe('Café Rush 3D geometry', () => {
  test.describe.configure({ timeout: 180_000 });
  test.skip(({ isMobile }) => isMobile, 'geometry does not depend on the viewport; one software-WebGL scene is enough');

  test('no interpenetrating meshes anywhere on the counter', async ({ page }) => {
    await page.goto('/?xrtest#/xr?game=rush');
    await page.getByTestId('rush-play-3d').click();
    await page.waitForFunction(() => !!(window as unknown as { __coffeeLabRush?: unknown }).__coffeeLabRush, null, { timeout: 90_000 });
    const overlaps = await page.evaluate(() =>
      (window as unknown as { __coffeeLabRush: { audit(): Array<{ a: string; b: string; depthMm: number }> } }).__coffeeLabRush.audit(),
    );
    expect(overlaps).toEqual([]);
  });
});
