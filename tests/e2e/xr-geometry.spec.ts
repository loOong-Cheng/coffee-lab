/**
 * 3D geometry sanity: merged props must be drawn where their parts belong.
 * Regression (user report 2026-11-10, "gooseneck kettle has no body"): Babylon's Mesh.MergeMeshes bakes each part's
 * WORLD transform into the vertices; re-parenting the merged mesh applied the station transform a second time, so the
 * kettle body, dripper, portafilter basket, machine trim, grinder fork and shelf jars were drawn ~1 m away.
 * project() only checks pivots, so this spec checks the actual geometry via the bounds() test hook.
 */
import { expect, test, type Page } from '@playwright/test';

type Box = { min: [number, number, number]; max: [number, number, number] };

test.describe('XR 3D props are drawn where they belong', () => {
  test.describe.configure({ mode: 'serial', timeout: 240_000 });
  test.skip(({ isMobile }) => isMobile, 'geometry does not depend on the viewport; one software-WebGL scene per run is enough');

  async function open3d(page: Page, id: string) {
    await page.goto(`/?xrtest#/xr?mission=${id}`);
    await page.getByTestId('xr-play-3d').click();
    await expect(page.getByTestId('xr-canvas')).toBeVisible();
    await page.waitForFunction(() => !!(window as unknown as { __coffeeLabXr?: unknown }).__coffeeLabXr, null, { timeout: 90_000 });
  }

  /** Bounds of the first mesh name that exists (names differ before/after the fix). */
  async function bounds(page: Page, ...names: string[]): Promise<Box> {
    const b = await page.evaluate((ns) => {
      const hook = (window as unknown as { __coffeeLabXr: { bounds(n: string): Box | null } }).__coffeeLabXr;
      for (const n of ns) {
        const r = hook.bounds(n);
        if (r) return r;
      }
      return null;
    }, names);
    expect(b, `mesh ${names.join(' | ')} exists`).not.toBeNull();
    return b!;
  }
  const centre = (b: Box) => b.min.map((v, i) => (v + b.max[i]!) / 2) as [number, number, number];

  test('pour-over: kettle body sits on its base between spout and handle; dripper sits on the carafe', async ({ page }) => {
    await open3d(page, 'pourover-bloom');
    const base = await bounds(page, 'kettle-base');
    const body = await bounds(page, 'kettle-body', 'kettle-body_merged');
    const handle = await bounds(page, 'kettle-handle', 'kettle-handle-a_merged');
    const spout = await bounds(page, 'kettle-spout');
    expect(Math.abs(centre(body)[0] - centre(base)[0]), 'kettle body centred on its base (x)').toBeLessThan(0.05);
    expect(Math.abs(centre(body)[2] - centre(base)[2]), 'kettle body centred on its base (z)').toBeLessThan(0.05);
    expect(Math.abs(body.min[1] - base.max[1]), 'kettle body rests on its base (y)').toBeLessThan(0.03);
    expect(body.min[0], 'body is right of the spout start').toBeGreaterThan(spout.min[0]);
    expect(body.max[0], 'body is left of the handle').toBeLessThan(handle.max[0]);

    const glass = await bounds(page, 'carafe-glass');
    const dripper = await bounds(page, 'dripper-body', 'dripper-ring_merged');
    expect(Math.abs(centre(dripper)[0] - centre(glass)[0]), 'dripper centred on carafe (x)').toBeLessThan(0.03);
    expect(Math.abs(centre(dripper)[2] - centre(glass)[2]), 'dripper centred on carafe (z)').toBeLessThan(0.03);
    expect(Math.abs(dripper.min[1] - glass.max[1]), 'dripper sits on the carafe rim (y)').toBeLessThan(0.03);
  });

  test('espresso: machine trim, grinder fork, portafilter basket and shelf jars sit on their parts', async ({ page }) => {
    await open3d(page, 'espresso-first-shot');
    const machine = await bounds(page, 'machine-body');
    const trim = await bounds(page, 'machine-steel');
    expect(Math.abs(trim.max[1] - machine.max[1]), 'machine top tray sits on the machine').toBeLessThan(0.03);
    expect(trim.min[1], 'machine steel starts above the counter').toBeGreaterThan(-0.01);

    const grinder = await bounds(page, 'grinder-body');
    const fork = await bounds(page, 'grinder-steel');
    expect(Math.abs(centre(fork)[0] - centre(grinder)[0]), 'grinder fork under the grinder (x)').toBeLessThan(0.1);
    expect(fork.max[1], 'grinder fork below the grinder top').toBeLessThan(grinder.max[1]);

    const pfHandle = await bounds(page, 'pf-handle');
    const pfSteel = await bounds(page, 'pf-steel');
    const d = Math.hypot(...centre(pfSteel).map((v, i) => v - centre(pfHandle)[i]!));
    expect(d, 'portafilter basket is attached to its handle').toBeLessThan(0.15);

    const shelf = await bounds(page, 'shelf');
    const jars = await bounds(page, 'shelf-jars', 'jar-0_merged');
    expect(Math.abs(jars.min[1] - shelf.max[1]), 'jars stand on the shelf').toBeLessThan(0.03);
  });
});
