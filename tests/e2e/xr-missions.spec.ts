/**
 * XR coffee lab missions (picker + station-tour + espresso-first-shot + pourover-bloom), on desktop and Pixel 7.
 *  - picker lists the three missions; every deep link (#/xr?mission=<id>) opens its brief
 *  - station-tour and pourover-bloom complete from the keyboard action list; the result is saved as `simulated`
 *    and survives a reload (picker status + the lesson's spatial-practice card)
 *  - the 3D scene of each mission loads (headless Chromium, software WebGL) and accepts a real mouse / touch input
 *  - WebXR is feature-gated: without navigator.xr nothing crashes; a browser that *reports* immersive-vr gets an
 *    honest "hardware-unverified" note and a clear alert when the session is denied. No headset was used.
 *  - QA-05: every link on the XR pages is at least 44 px tall
 * Screenshots: reports/screenshots/xr-*.png
 */
import { expect, test, type Locator, type Page } from '@playwright/test';
import { getLesson } from '../../src/content';
import { ERROR_BOUNDARY_TEXT, collectErrors, readState, seedProfile } from './qa-helpers';

test.use({ serviceWorkers: 'block' });

const MISSIONS = [
  { id: 'station-tour', title: 'Station tour: meet the espresso tools', activityId: 'esp-meet-the-machine-xr', lessonId: 'esp-meet-the-machine' },
  { id: 'espresso-first-shot', title: 'Espresso counter: your first shot', activityId: 'esp-workflow-xr', lessonId: 'esp-workflow' },
  { id: 'pourover-bloom', title: 'Pour-over: bloom and steady pours', activityId: 'po-ratio-bloom-xr', lessonId: 'po-ratio-bloom' },
] as const;
type MissionId = (typeof MISSIONS)[number]['id'];

const SHOTS = 'reports/screenshots';
/** Software-WebGL noise in headless Chromium, not app errors. */
const realErrors = (errors: string[]) => errors.filter((e) => !/WebGL|GPU stall|GL Driver/i.test(e));

type Ev = { activityId: string; lessonId: string; evidence: string; outcome: string; mode: string; guidance: string; score?: number };
type Hook = { project(target: string): { x: number; y: number } | null; stats(): { meshes: number; drawCalls: number } };

async function removeWebXR(page: Page) {
  await page.addInitScript(() => {
    try {
      delete (Navigator.prototype as unknown as { xr?: unknown }).xr;
    } catch {
      /* ignore */
    }
    Object.defineProperty(Navigator.prototype, 'xr', { get: () => undefined, configurable: true });
  });
}

/** Keyboard press on a button (focus + Enter), tolerant of the list re-rendering underneath. */
async function pressKey(page: Page, target: Locator): Promise<boolean> {
  try {
    await target.focus({ timeout: 1_000 });
    await page.keyboard.press('Enter');
    return true;
  } catch {
    return false;
  }
}

/** Plays a mission from the action list with the keyboard only: suggested action, else "Skip the wait". */
async function playActionListToEnd(page: Page) {
  const summary = page.getByTestId('xr-summary');
  for (let i = 0; i < 120; i++) {
    if (await summary.isVisible()) return i;
    const rec = page.locator('.xr-action[data-recommended]').first();
    const skip = page.locator('.xr-action[data-action-id="skip"]');
    if ((await rec.count()) > 0) await pressKey(page, rec);
    else if ((await skip.count()) > 0) await pressKey(page, skip);
    else await page.waitForTimeout(150);
  }
  throw new Error('mission did not finish from the action list');
}

async function openList(page: Page, id: MissionId) {
  await page.goto(`/#/xr?mission=${id}`);
  await expect(page.locator(`[data-mission="${id}"]`).first()).toBeVisible();
  await pressKey(page, page.getByTestId('xr-play-list'));
  await expect(page.getByTestId('xr-station-status')).toBeVisible();
  await expect(page.locator('.xr-player')).toHaveAttribute('data-mode', 'list');
}

async function open3d(page: Page, id: MissionId): Promise<void> {
  await page.goto(`/?xrtest#/xr?mission=${id}`);
  await page.getByTestId('xr-play-3d').click();
  await expect(page.getByTestId('xr-canvas')).toBeVisible();
  await page.waitForFunction(() => !!(window as unknown as { __coffeeLabXr?: unknown }).__coffeeLabXr, null, { timeout: 90_000 });
  await expect(page.locator('.xr-player')).toHaveAttribute('data-mode', '3d');
  await page.waitForTimeout(400); // first frames (camera fit) before projecting targets
}

async function project(page: Page, target: string, atLocalY?: number) {
  await page.getByTestId('xr-canvas').evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' })); // side-panel clicks may have scrolled it away
  const p = await page.evaluate(
    ([t, y]) => (window as unknown as { __coffeeLabXr: Hook & { project(t: string, y?: number): { x: number; y: number } | null } }).__coffeeLabXr.project(t as string, y as number | undefined),
    [target, atLocalY] as const,
  );
  expect(p, `${target} projects onto the canvas`).not.toBeNull();
  return p!;
}

/** Click (desktop) or tap (touch phone) a projected 3D target. */
async function hit(page: Page, isMobile: boolean, target: string) {
  const p = await project(page, target);
  if (isMobile) await page.touchscreen.tap(p.x, p.y);
  else await page.mouse.click(p.x, p.y);
}

/** One-finger drag on the canvas through CDP touch events (Playwright has no touch drag). */
async function touchDrag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
  const cdp = await page.context().newCDPSession(page);
  const pt = (p: { x: number; y: number }) => [{ x: Math.round(p.x), y: Math.round(p.y), id: 1, radiusX: 4, radiusY: 4, force: 1 }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(from) });
  for (let i = 1; i <= 12; i++) {
    const p = { x: from.x + ((to.x - from.x) * i) / 12, y: from.y + ((to.y - from.y) * i) / 12 };
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(p) });
    await page.waitForTimeout(30);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
}

async function mouseDrag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move((from.x + to.x) / 2, (from.y + to.y) / 2, { steps: 6 });
  await page.mouse.move(to.x, to.y, { steps: 6 });
}

/** Drag a tool onto a zone in the 3D scene; `planeY` = the station-local height the tool is dragged at. */
async function drag3d(page: Page, isMobile: boolean, item: string, zone: string, planeY: number) {
  const from = await project(page, item);
  const to = await project(page, zone, planeY);
  if (isMobile) await touchDrag(page, from, to);
  else {
    await mouseDrag(page, from, to);
    await page.mouse.up();
  }
}

test.describe('XR lab picker + deep links', () => {
  test('picker lists the three missions; each card and deep link opens its brief', async ({ page }) => {
    const errors = collectErrors(page);
    await removeWebXR(page);
    await seedProfile(page);
    await page.goto('/#/xr');
    await expect(page.getByTestId('xr-picker')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('XR coffee lab');
    await expect(page.locator('.xr-missions > li')).toHaveCount(3);
    for (const m of MISSIONS) {
      const card = page.getByTestId(`xr-mission-${m.id}`);
      await expect(card.getByRole('heading', { level: 3 })).toHaveText(m.title);
      await expect(card).toContainText('Not trained:');
      await expect(page.getByTestId(`xr-mission-status-${m.id}`)).toHaveText('Not tried yet');
    }
    // Card link → brief, then back via the eyebrow link.
    await page.getByTestId('xr-mission-pourover-bloom').getByRole('link', { name: 'Open mission' }).click();
    await expect(page).toHaveURL(/#\/xr\?mission=pourover-bloom$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(MISSIONS[2].title);
    await page.locator('.xr-eyebrow').getByRole('link', { name: 'All XR missions' }).click();
    await expect(page.getByTestId('xr-picker')).toBeVisible();
    // Every deep link opens its brief with an honest capability note and both no-headset ways to play.
    for (const m of MISSIONS) {
      await page.goto(`/#/xr?mission=${m.id}`);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(m.title);
      await expect(page.locator(`section[data-mission="${m.id}"]`)).toBeVisible();
      await expect(page.getByTestId('xr-capability')).toHaveAttribute('data-reason', 'no-webxr-api');
      await expect(page.getByTestId('xr-play-3d')).toBeVisible();
      await expect(page.getByTestId('xr-play-list')).toBeVisible();
      await expect(page.getByText('What it does NOT train')).toBeVisible();
      await expect(page.getByText(/Hardware-unverified/).first()).toBeVisible();
      await expect(page.getByRole('button', { name: /Enter VR/ })).toHaveCount(0);
    }
    await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('QA-05: every link and button on the XR pages is at least 44 px tall', async ({ page }) => {
    await seedProfile(page);
    for (const url of ['/#/xr', ...MISSIONS.map((m) => `/#/xr?mission=${m.id}`)]) {
      await page.goto(url);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const targets = page.locator('main .xr-route a, main .xr-route button');
      const n = await targets.count();
      expect(n).toBeGreaterThan(2);
      for (let i = 0; i < n; i++) {
        const t = targets.nth(i);
        if (!(await t.isVisible())) continue;
        const box = (await t.boundingBox())!;
        expect(box.height, `${url}: "${(await t.innerText()).trim()}" is ${box.height}px tall`).toBeGreaterThanOrEqual(44);
      }
    }
    // The two footer links QA-05 reported on a phone.
    await page.goto('/#/xr?mission=espresso-first-shot');
    for (const name of ['The matching 2D lesson', 'All XR missions']) {
      const box = (await page.locator('.xr-row').getByRole('link', { name }).boundingBox())!;
      expect(box.height, name).toBeGreaterThanOrEqual(44);
    }
  });

  test('picker, briefs and the action-list player are fully Chinese in zh', async ({ page }) => {
    const errors = collectErrors(page);
    await seedProfile(page, { locale: 'zh' });
    const ALLOW = /(Coffee Lab|WebXR|VR|TARE|https?:\/\/\S+)/g;
    const leftovers = async () => ((await page.getByRole('main').innerText()).replace(ALLOW, '').match(/\b[A-Za-z][A-Za-z'’]+(?:[ ,]+[A-Za-z][A-Za-z'’]+){3,}/g) ?? []).slice(0, 8);
    await page.goto('/#/xr');
    await expect(page.locator('.xr-missions > li')).toHaveCount(3);
    expect(await leftovers(), 'picker').toEqual([]);
    for (const m of MISSIONS) {
      await page.goto(`/#/xr?mission=${m.id}`);
      await expect(page.getByTestId('xr-play-list')).toBeVisible();
      expect(await leftovers(), `${m.id} brief`).toEqual([]);
      await page.getByTestId('xr-play-list').click();
      await expect(page.getByTestId('xr-station-status')).toBeVisible();
      await page.locator('.xr-action').first().click();
      expect(await leftovers(), `${m.id} player`).toEqual([]);
      await page.getByRole('button', { name: '退出' }).click();
    }
    expect(errors).toEqual([]);
  });
});

test.describe('missions via the keyboard action list (no headset, no navigator.xr)', () => {
  test('station-tour: completes from the action list; saved as simulated and still shown after reload', async ({ page, isMobile }) => {
    test.setTimeout(180_000);
    const errors = collectErrors(page);
    await removeWebXR(page);
    await seedProfile(page);
    await openList(page, 'station-tour');
    await expect(page.getByTestId('xr-progress')).toHaveText('Inspected 0 of 4 tools');
    await playActionListToEnd(page);
    const summary = page.getByTestId('xr-summary');
    await expect(summary).toHaveAttribute('data-mission', 'station-tour');
    await expect(summary.getByRole('heading', { level: 2 })).toBeFocused();
    await expect(summary).toContainText('Simulated');
    await expect(summary).toContainText('Saved to your progress (simulated).');
    await expect(summary.getByRole('heading', { name: 'Still needs real hands-on practice' })).toBeVisible();
    await expect(summary).toContainText('Grip, weight and feel of real tools');
    await expect(summary).toContainText('Found on first try');

    const ev = (await readState(page)).events.filter((e: Ev) => e.activityId === 'esp-meet-the-machine-xr');
    expect(ev).toHaveLength(1);
    expect(ev[0]).toMatchObject({ evidence: 'simulated', outcome: 'completed', lessonId: 'esp-meet-the-machine', guidance: 'guided', mode: isMobile ? 'mobile' : 'desktop' });

    await page.reload();
    await page.goto('/#/xr');
    await expect(page.getByTestId('xr-mission-station-tour')).toHaveAttribute('data-completed', 'true');
    await expect(page.getByTestId('xr-mission-status-station-tour')).toHaveText(/^Completed ×1 · last: Guided · \d+% \(simulated\)$/);
    await expect(page.getByTestId('xr-mission-status-pourover-bloom')).toHaveText('Not tried yet');
    // The lesson's spatial-practice card links the mission and shows the simulated completion.
    const idx = getLesson('esp-meet-the-machine')!.activityIds.indexOf('esp-meet-the-machine-xr');
    await page.goto(`/#/learn/esp-meet-the-machine?step=${idx + 1}&g=guided`);
    const card = page.getByTestId('activity-spatial-practice');
    await expect(card).toBeVisible();
    await expect(card.getByText('Completed in simulation')).toBeVisible();
    await expect(card.getByTestId('open-xr')).toHaveAttribute('href', '#/xr?mission=station-tour');
    await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('pourover-bloom: measured pours from the action list reach 15 g : 250 g; saved as simulated after reload', async ({ page, isMobile }) => {
    test.setTimeout(180_000);
    const errors = collectErrors(page);
    await removeWebXR(page);
    await seedProfile(page);
    await openList(page, 'pourover-bloom');
    await expect(page.getByTestId('xr-step-title')).toHaveText('Put a paper filter in the dripper');
    await playActionListToEnd(page);
    const summary = page.getByTestId('xr-summary');
    await expect(summary).toHaveAttribute('data-mission', 'pourover-bloom');
    await expect(summary).toContainText('Total water (target 250 g)');
    await expect(summary).toContainText('250 g');
    await expect(summary).toContainText('1:16.7');
    await expect(summary).toContainText('Illustrative flow model');
    await expect(summary).toContainText('n/a (action list)'); // no steadiness claim without a hand on the kettle
    await expect(summary).toContainText('Real pour control');

    const ev = (await readState(page)).events.filter((e: Ev) => e.activityId === 'po-ratio-bloom-xr');
    expect(ev).toHaveLength(1);
    expect(ev[0]).toMatchObject({ evidence: 'simulated', outcome: 'completed', lessonId: 'po-ratio-bloom', mode: isMobile ? 'mobile' : 'desktop' });

    await page.reload();
    await page.goto('/#/xr');
    await expect(page.getByTestId('xr-mission-status-pourover-bloom')).toHaveText(/^Completed ×1 · last: Guided · \d+% \(simulated\)$/);
    const idx = getLesson('po-ratio-bloom')!.activityIds.indexOf('po-ratio-bloom-xr');
    await page.goto(`/#/learn/po-ratio-bloom?step=${idx + 1}&g=guided`);
    await expect(page.getByTestId('activity-spatial-practice').getByText('Completed in simulation')).toBeVisible();
    await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('guidance tiers change the list: independent hides suggestions and step labels; pause and reset recover', async ({ page }) => {
    await removeWebXR(page);
    await seedProfile(page);
    await openList(page, 'pourover-bloom');
    await expect(page.locator('.xr-action[data-recommended]')).toHaveCount(1);
    await page.locator('.xr-side').getByRole('radio', { name: /Independent/ }).click();
    await expect(page.locator('.xr-action[data-recommended]')).toHaveCount(0);
    await expect(page.getByTestId('xr-step-title')).toHaveCount(0);
    await expect(page.getByText('Independent mode: step labels are hidden.')).toBeVisible();
    await page.getByRole('button', { name: /Hint/ }).click();
    await expect(page.locator('.xr-action[data-recommended]')).toHaveCount(1); // a hint shows cues for a while
    await page.keyboard.press('p');
    await expect(page.locator('.xr-stage__paused').getByRole('button', { name: 'Resume' })).toBeVisible();
    await page.locator('.xr-stage__paused').getByRole('button', { name: 'Resume' }).click();
    await page.locator('.xr-action[data-action-id="filter"]').click();
    await expect(page.getByTestId('xr-station-status')).toContainText('Filter: in place');
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await page.locator('.xr-confirm').getByRole('button', { name: 'Reset' }).click();
    await expect(page.getByTestId('xr-station-status')).toContainText('Filter: not yet');
  });
});

// Software-WebGL 3D pages are CPU-heavy: this spec opens them one at a time per project (serial) with generous
// timeouts, so the whole suite stays stable when it runs fully parallel.
test.describe('3D and WebXR (one 3D page at a time per project)', () => {
  test.describe.configure({ mode: 'serial', timeout: 240_000 });

  test.describe('3D scene (headless Chromium, mouse on desktop, touch on Pixel 7)', () => {

    test('station-tour 3D: the whole tour can be played in the scene (no action list) and is saved as simulated spatial practice', async ({ page, isMobile }) => {
      const errors = collectErrors(page);
      await removeWebXR(page);
      await seedProfile(page);
      await open3d(page, 'station-tour');
      const progress = page.getByTestId('xr-progress');
      const drag = (item: string, zone: string, planeY: number) => drag3d(page, isMobile, item, zone, planeY);
      // Explore: inspect four tools in the scene.
      await expect(progress).toHaveText('Inspected 0 of 4 tools');
      const parts = ['part:grinder', 'part:knock-box', 'part:scale'];
      for (let i = 0; i < parts.length; i++) {
        await hit(page, isMobile, parts[i]!);
        await expect(progress).toHaveText(`Inspected ${i + 1} of 4 tools`, { timeout: 10_000 });
        if (i === 0) await expect(page.getByTestId('xr-feedback')).toContainText(/grinder/i);
      }
      if (!isMobile) await page.screenshot({ path: `${SHOTS}/xr-tour-3d-desktop-1280.png` });
      const stats = await page.evaluate(() => (window as unknown as { __coffeeLabXr: Hook }).__coffeeLabXr.stats());
      expect(stats.meshes).toBeGreaterThan(20);
      await hit(page, isMobile, 'part:espresso-machine');
      await expect(progress).toHaveText('Challenge 1 of 6', { timeout: 10_000 });
      await expect(page.getByTestId('xr-step-title')).toHaveText('Point at the grinder');
      await hit(page, isMobile, 'part:grinder');
      await expect(page.getByTestId('xr-step-title')).toHaveText('Pick up the tamper', { timeout: 10_000 });
      await hit(page, isMobile, 'tamper'); // press = pick up; release = it goes back to its stand
      await expect(page.getByTestId('xr-step-title')).toHaveText('Put the portafilter on the grinder fork', { timeout: 10_000 });
      await page.waitForTimeout(600); // tamper settles home
      await drag('portafilter', 'grinder-fork', 0.17);
      await expect(page.getByTestId('xr-step-title')).toHaveText('Point at the group head', { timeout: 10_000 });
      await hit(page, isMobile, 'part:group-head');
      await expect(page.getByTestId('xr-step-title')).toHaveText('Put the cup on the scale', { timeout: 10_000 });
      await drag('cup', 'scale', 0.1);
      await expect(page.getByTestId('xr-step-title')).toHaveText('Point at the knock box', { timeout: 10_000 });
      await hit(page, isMobile, 'part:knock-box');
      const summary = page.getByTestId('xr-summary');
      await expect(summary).toBeVisible({ timeout: 10_000 });
      await expect(summary).toContainText('Picking up and placing tools (simulated)'); // spatial practice credited
      const ev = (await readState(page)).events.filter((e: Ev) => e.activityId === 'esp-meet-the-machine-xr');
      expect(ev[0]).toMatchObject({ evidence: 'simulated', outcome: 'completed', mode: isMobile ? 'mobile' : 'desktop' });
      expect(ev[0]).not.toMatchObject({ mode: 'xr' });
      await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
      expect(realErrors(errors)).toEqual([]);
    });

    test('espresso-first-shot 3D: clicking/tapping the machine completes the first step', async ({ page, isMobile }) => {
      const errors = collectErrors(page);
      await removeWebXR(page);
      await seedProfile(page);
      await open3d(page, 'espresso-first-shot');
      const first = (await page.getByTestId('xr-step-title').textContent()) ?? '';
      await hit(page, isMobile, 'espresso-machine');
      await expect(page.getByTestId('xr-step-title')).not.toHaveText(first, { timeout: 10_000 });
      await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
      expect(realErrors(errors)).toEqual([]);
    });

    test('pourover-bloom 3D: filter, rinse pour from the poised kettle, discard, grounds, tare, bloom, pour, drawdown', async ({ page, isMobile }) => {
      const errors = collectErrors(page);
      await removeWebXR(page);
      await seedProfile(page);
      await open3d(page, 'pourover-bloom');
      await expect(page.getByTestId('xr-step-title')).toHaveText('Put a paper filter in the dripper');
      // 1) drag a paper filter onto the dripper (mouse on desktop, one-finger touch drag on the phone)
      const filter = await project(page, 'filter');
      const dripper = await project(page, 'dripper', 0.3);
      if (isMobile) await touchDrag(page, filter, dripper);
      else {
        await mouseDrag(page, filter, dripper);
        await page.mouse.up();
      }
      await expect(page.getByTestId('xr-step-title')).toHaveText('Rinse the filter with hot water', { timeout: 10_000 });
      await expect(page.getByTestId('xr-station-status')).toHaveCount(0); // 3D mode: the scene is the status
      // 2) drag the kettle over the dripper and let go: it stays poised there
      const kettle = await project(page, 'kettle');
      const over = await project(page, 'dripper', 0.34);
      if (isMobile) await touchDrag(page, kettle, over);
      else {
        await mouseDrag(page, kettle, over);
        await page.mouse.up();
      }
      await expect(page.getByTestId('xr-pour-controls')).toBeVisible({ timeout: 10_000 });
      // 3) pour: scroll wheel over the canvas (desktop) or the touch "Hold to pour" button (phone)
      const readout = page.getByTestId('xr-readout');
      if (isMobile) {
        const hold = page.getByTestId('xr-hold-pour');
        await hold.scrollIntoViewIfNeeded();
        const b = (await hold.boundingBox())!;
        const cdp = await page.context().newCDPSession(page);
        const pt = [{ x: Math.round(b.x + b.width / 2), y: Math.round(b.y + b.height / 2), id: 2 }];
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt });
        await expect(readout).toContainText(/poured [1-9]\d* g/, { timeout: 15_000 });
        await expect(readout).toContainText('illustrative');
        await expect(page.getByTestId('xr-step-title')).toHaveText('Empty the rinse water', { timeout: 20_000 });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await cdp.detach();
      } else {
        const c = await project(page, 'dripper', 0.2);
        await page.mouse.move(c.x, c.y);
        for (let i = 0; i < 12; i++) await page.mouse.wheel(0, 120);
        await expect(readout).toContainText(/poured [1-9]\d* g/, { timeout: 15_000 });
        await expect(readout).toContainText('illustrative');
        await expect(page.getByTestId('xr-step-title')).toHaveText('Empty the rinse water', { timeout: 20_000 });
        for (let i = 0; i < 14; i++) await page.mouse.wheel(0, -120); // tip it back upright
      }
      await expect(page.locator('[data-testid="xr-pour-controls"] input[type="range"]')).toHaveValue('0', { timeout: 5_000 });
      if (!isMobile) await page.screenshot({ path: `${SHOTS}/xr-pourover-3d-desktop-1280.png` });
      // 4) the rest of the brew in the scene. Reaching for the carafe sets the poised kettle back on its base.
      const step = page.getByTestId('xr-step-title');
      await drag3d(page, isMobile, 'carafe', 'sink', 0.06);
      await expect(page.getByTestId('xr-feedback')).toHaveAttribute('data-code', 'discard-ok', { timeout: 10_000 });
      await drag3d(page, isMobile, 'carafe', 'scale', 0.06);
      await expect(step).toHaveText('Add 15 g of ground coffee', { timeout: 10_000 });
      await drag3d(page, isMobile, 'grounds', 'dripper', 0.3);
      await expect(step).toHaveText('Tare the scale', { timeout: 10_000 });
      await hit(page, isMobile, 'tare');
      await expect(step).toHaveText('Bloom: pour about 30 g', { timeout: 10_000 });
      await expect(readout).toContainText('0.0 g');
      await drag3d(page, isMobile, 'kettle', 'dripper', 0.34);
      await expect(page.getByTestId('xr-pour-controls')).toBeVisible({ timeout: 10_000 });
      // Bloom + main pour with the side panel's measured pours (kettle stays poised in the scene).
      await page.locator('.xr-action[data-action-id="to-target"]').click();
      await expect(step).toHaveText('Wait 30–45 s while it blooms', { timeout: 10_000 });
      await page.locator('.xr-action[data-action-id="skip"]').click();
      await expect(step).toHaveText('Pour in stages to 250 g', { timeout: 10_000 });
      await page.locator('.xr-action[data-action-id="to-target"]').click();
      await expect(step).toHaveText('Let it draw down', { timeout: 10_000 });
      await page.locator('.xr-action[data-action-id="skip"]').click();
      const summary = page.getByTestId('xr-summary');
      await expect(summary).toBeVisible({ timeout: 10_000 });
      await expect(summary).toContainText('1:16.7');
      await expect(summary).toContainText('Illustrative flow model');
      await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
      expect(realErrors(errors)).toEqual([]);
    });
  });

  test.describe('WebXR path is feature-gated (HARDWARE-UNVERIFIED: no headset used)', () => {
    // One mission per project keeps the number of parallel 3D pages down; qa-scenarios covers espresso-first-shot.
    test('a browser that reports immersive-vr but denies the session: honest note, clear alert, 3D keeps working', async ({ page, isMobile }) => {
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
      await seedProfile(page);
      const id = isMobile ? 'pourover-bloom' : 'station-tour';
      await page.goto(`/#/xr?mission=${id}`);
      await expect(page.getByTestId('xr-capability')).toHaveAttribute('data-reason', 'supported');
      await expect(page.getByTestId('xr-capability')).toContainText('Hardware-unverified');
      await page.getByTestId('xr-capability').getByRole('button', { name: /then Enter VR/ }).click();
      const enter = page.locator('.xr-stage__vr').getByRole('button', { name: 'Enter VR' });
      await expect(enter).toBeVisible({ timeout: 90_000 });
      await enter.click();
      await expect(page.getByRole('alert').filter({ hasText: 'The VR session could not start' })).toBeVisible();
      await expect(page.getByTestId('xr-canvas')).toBeVisible();
      await expect(page.locator('.xr-action').first()).toBeVisible(); // the action list still works
      await page.getByRole('button', { name: 'Exit', exact: true }).click();
      await expect(page.getByTestId('xr-play-list')).toBeVisible(); // back on the brief, nothing stuck
      await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
      expect(realErrors(errors)).toEqual([]);
    });
  });
});

test.describe('screenshots', () => {
  test('XR lab picker (desktop 1280 / mobile 390)', async ({ page, isMobile }) => {
    if (isMobile) await page.setViewportSize({ width: 390, height: 844 });
    await removeWebXR(page);
    await seedProfile(page);
    await page.goto('/#/xr');
    await expect(page.locator('.xr-missions > li')).toHaveCount(3);
    await page.screenshot({ path: `${SHOTS}/xr-picker-${isMobile ? 'mobile-390' : 'desktop-1280'}.png`, fullPage: true });
  });
});
