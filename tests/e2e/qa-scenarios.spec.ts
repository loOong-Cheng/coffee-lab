/**
 * QA (quality-guardian) — product smoke scenario from handoff §12, run against the production build.
 *  (a) phone-only beginner: onboard → concept → exercise → real-world guide → log a trial → next step → journal
 *  (b) desktop-only learner: full espresso ratio-lab + diagnosis lessons
 *  (c) XR fallback without navigator.xr: explanation + 3D/action list; mission via action list → simulated
 *      event shown on the lesson's spatial card; 3D scene drives the same state machine (?xrtest hook)
 *  (d) persistence across reload is asserted inside each scenario.
 * Run isolated: E2E_PORT=4181 E2E_DIST=.e2e/dist-qa E2E_OUT=.e2e/out-qa npx playwright test qa-
 */
import { expect, test, type Page } from '@playwright/test';
import { getLesson } from '../../src/content';
import {
  ERROR_BOUNDARY_TEXT,
  collectErrors,
  completeXrMissionViaActionList,
  lessonActivities,
  playWholeLesson,
  readState,
  seedProfile,
  solveActivity,
} from './qa-helpers';

// Service workers blocked for determinism (PWA toast timing); PWA behaviour is tested in blocks that re-allow them.
test.use({ serviceWorkers: 'block' });

type Ev = { activityId: string; evidence: string; outcome: string; mode: string; score?: number; lessonId: string };

async function removeWebXR(page: Page) {
  await page.addInitScript(() => {
    // Simulate a browser with no WebXR Device API at all.
    try {
      delete (Navigator.prototype as unknown as { xr?: unknown }).xr;
    } catch {
      /* ignore */
    }
    Object.defineProperty(Navigator.prototype, 'xr', { get: () => undefined, configurable: true });
  });
}

test.describe('QA §12 scenario (a): phone-only beginner', () => {
  test('onboard → concept → exercise → kitchen guide → log trial → next step → journal (self-reported) → reload', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'phone-only scenario runs on the Pixel 7 project');
    test.setTimeout(120_000);
    const errors = collectErrors(page);
    await page.goto('/');
    await expect(page).toHaveURL(/#\/onboarding$/);

    // Onboarding: espresso goal, brand new, phone ONLY (no headset), espresso machine + grinder.
    await page.getByRole('radio', { name: /Espresso/ }).click();
    await page.getByTestId('onboarding-next').click();
    await page.getByRole('radio', { name: /Brand new/ }).click();
    await page.getByTestId('onboarding-next').click();
    const phone = page.locator('[data-device="phone"]');
    if ((await phone.getAttribute('aria-pressed')) !== 'true') await phone.click();
    for (const other of ['pc', 'headset']) {
      const d = page.locator(`[data-device="${other}"]`);
      if ((await d.getAttribute('aria-pressed')) === 'true') await d.click();
    }
    await expect(phone).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-device="headset"]')).toHaveAttribute('aria-pressed', 'false');
    await page.getByTestId('onboarding-next').click();
    await page.getByTestId('quick-espresso').click();
    await expect(page.locator('[data-equipment="espresso-machine"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-equipment="grinder"]')).toHaveAttribute('aria-pressed', 'true');
    await page.getByTestId('onboarding-next').click();
    await page.getByRole('radio', { name: /On my phone/ }).click();
    await page.getByTestId('onboarding-finish').click();
    await expect(page).toHaveURL(/#\/$/);
    await expect(page.locator('[data-layout]')).toHaveAttribute('data-layout', 'phone');

    const profile = (await readState(page)).profile;
    expect(profile).toMatchObject({ goal: 'espresso', devices: ['phone'], preferredMode: 'mobile' });
    expect(profile.equipment).toEqual(expect.arrayContaining(['espresso-machine', 'grinder']));

    // Learn a concept + complete an exercise in the first recommended lesson.
    await page.getByTestId('home-next-lesson').click();
    await expect(page).toHaveURL(/#\/learn\//);
    const lessonId = decodeURIComponent(page.url().split('#/learn/')[1]!.split('?')[0]!);
    await page.getByTestId('lesson-start').click();
    const acts = lessonActivities(lessonId);
    const firstExerciseIdx = acts.findIndex((a) => ['sequence', 'quiz', 'identify', 'parameter-lab', 'diagnose'].includes(a.kind));
    expect(firstExerciseIdx, 'first lesson has an exercise').toBeGreaterThan(0);
    for (let i = 0; i <= firstExerciseIdx; i++) await solveActivity(page, acts[i]!);
    const st1 = await readState(page);
    const assessed = st1.events.filter((e: Ev) => e.evidence === 'assessed_answer');
    expect(assessed).toHaveLength(1);
    expect(assessed[0]).toMatchObject({ activityId: acts[firstExerciseIdx]!.id, outcome: 'completed', mode: 'mobile' });
    expect(st1.events.find((e: Ev) => e.activityId === acts[0]!.id)).toMatchObject({ evidence: 'observed_by_app' });

    // Back to home → open the real-world guide (big thumb-zone CTA).
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Learn' }).click();
    const cta = page.getByTestId('home-real-cup');
    await expect(cta).toBeVisible();
    expect((await cta.boundingBox())!.height).toBeGreaterThanOrEqual(64);
    await cta.click();
    await expect(page).toHaveURL(/#\/practice\/esp-first-real-shot-guide/);
    await expect(page.getByText(/can’t see your kitchen/).first()).toBeVisible();
    await page.getByTestId('practice-start').click();

    // Mark steps; every confirmation is labelled self-reported. Safety callouts shown on hot steps.
    const done = page.getByRole('group', { name: 'Step controls' }).getByRole('button', { name: /^Done/ });
    let sawSafety = false;
    for (let i = 0; i < 40 && !(await page.getByTestId('practice-finish').isVisible()); i++) {
      await expect(page.getByTestId('practice-step')).toBeVisible();
      if (await page.getByTestId('practice-step').getByText(/hot|burn|steam|烫/i).count()) sawSafety = true;
      await done.click();
    }
    expect(sawSafety, 'espresso guide shows at least one hot-water/steam safety note').toBe(true);
    await expect(page.getByTestId('practice-finish')).toBeVisible();

    // Log the trial (fast + sour) → useful, uncertain next step.
    await page.getByTestId('log-doseG').fill('18');
    await page.getByTestId('log-outG').fill('40');
    await page.getByTestId('log-timeSec').fill('17');
    await page.getByTestId('taste-sour').click();
    await page.getByTestId('log-save').click();
    await expect(page).toHaveURL(/#\/journal\?entry=/);
    await expect(page.getByTestId('advice')).toContainText('One thing to try next');
    await expect(page.getByTestId('journal-entry').getByText('Self-reported').first()).toBeVisible();

    // Persistence across reload: entry, journal list, home counters, lesson progress.
    await page.reload();
    await expect(page.getByTestId('entry-ratio')).toHaveText('1:2.2');
    await page.goto('/#/journal');
    await expect(page.getByTestId('journal-list').getByRole('listitem')).toHaveCount(1);
    await expect(page.getByTestId('journal-list').getByText('Self-reported')).toBeVisible();
    await page.goto('/#/');
    await expect(page.getByTestId('stat-cups')).toHaveText('1');
    await expect(page.getByTestId('home-next-lesson')).toContainText(/Continue|Start/);

    const saved = await readState(page);
    expect(saved.activePractice).toBeNull();
    expect(saved.journal[0]).toMatchObject({ evidence: 'self_report', doseG: 18, outG: 40, timeSec: 17 });
    const guide = saved.events.filter((e: Ev) => e.activityId === 'esp-first-real-shot-guide');
    expect(guide).toHaveLength(1);
    expect(guide[0]).toMatchObject({ evidence: 'self_report', mode: 'real-world-guide' });
    // Nothing on a phone-only path may claim simulated or app-observed physical work.
    expect(saved.events.filter((e: Ev) => e.evidence === 'simulated')).toHaveLength(0);
    await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    expect(errors).toEqual([]);
  });
});

test.describe('QA §12 scenario (b): desktop-only learner', () => {
  test('completes the espresso ratio-lab and diagnosis lessons; progress survives reload', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop-only scenario');
    test.setTimeout(120_000);
    const errors = collectErrors(page);
    await seedProfile(page, { devices: ['pc'], preferredMode: 'desktop' });

    // Ratio lab — 2D, no forced 3D scene.
    await page.goto('/#/learn/esp-ratio-lab');
    await expect(page.locator('canvas')).toHaveCount(0);
    await playWholeLesson(page, 'esp-ratio-lab', { reflection: 'Same ratio, smaller basket.' });
    await expect(page.getByTestId('lesson-complete')).toHaveAttribute('data-status', 'completed');
    await expect(page.getByRole('main').getByText('Assessed answer').first()).toBeVisible();

    // Diagnosis — hypothetical scenarios, one change at a time.
    await page.goto('/#/learn/esp-diagnosis?step=2&g=guided');
    await expect(page.getByTestId('activity-diagnose')).toBeVisible();
    await expect(page.getByTestId('activity-diagnose').getByText(/Hypothetical/i).first()).toBeVisible();
    await playWholeLesson(page, 'esp-diagnosis');
    await expect(page.getByTestId('lesson-complete')).toHaveAttribute('data-status', 'completed');

    const st = await readState(page);
    const byId = (id: string) => st.events.filter((e: Ev) => e.activityId === id);
    expect(byId('esp-ratio-lab-sim')[0]).toMatchObject({ evidence: 'assessed_answer', outcome: 'completed', score: 1, mode: 'desktop' });
    expect(byId('esp-ratio-lab-quiz')[0]).toMatchObject({ evidence: 'assessed_answer', outcome: 'completed', score: 1 });
    expect(byId('esp-diagnosis-scenarios')[0]).toMatchObject({ evidence: 'assessed_answer', outcome: 'completed', score: 1 });
    expect(byId('esp-ratio-lab-reflect')[0]).toMatchObject({ evidence: 'self_report' });
    expect(byId('esp-diagnosis-reflect')).toHaveLength(0); // skipped reflection is not recorded
    expect(byId('esp-ratio-lab-cards')[0]).toMatchObject({ evidence: 'observed_by_app' });

    await page.reload();
    await expect(page.getByTestId('lesson-complete')).toHaveAttribute('data-status', 'completed');
    await page.goto('/#/');
    await expect(page.getByTestId('stat-mastered')).toHaveText(/^2\//);
    await expect(page.locator('[data-lesson="esp-ratio-lab"]')).toHaveAttribute('data-status', 'completed');
    await expect(page.locator('[data-lesson="esp-diagnosis"]')).toHaveAttribute('data-status', 'completed');
    await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    expect(errors).toEqual([]);
  });
});

test.describe('QA §12 scenario (c): XR without a headset', () => {
  test('no navigator.xr → honest explanation + 3D and action-list alternatives; mission via action list is recorded as simulated', async ({ page }) => {
    test.setTimeout(200_000);
    const errors = collectErrors(page);
    await removeWebXR(page);
    await seedProfile(page);
    await page.goto('/#/xr?mission=espresso-first-shot');
    await expect(page.evaluate(() => 'xr' in navigator && !!(navigator as unknown as { xr?: unknown }).xr)).resolves.toBe(false);
    const cap = page.getByTestId('xr-capability');
    await expect(cap).toHaveAttribute('data-reason', 'no-webxr-api');
    await expect(cap.getByRole('status')).toContainText('This browser has no WebXR');
    await expect(page.getByRole('button', { name: /Enter VR|Start for VR/i })).toHaveCount(0);
    await expect(page.getByTestId('xr-play-3d')).toBeVisible();
    await expect(page.getByTestId('xr-play-list')).toBeVisible();
    await expect(page.getByText(/Hardware-unverified|not yet been tested on a real headset|hardware/i).first()).toBeVisible();

    await page.getByTestId('xr-play-list').click();
    await expect(page.getByTestId('xr-station-status')).toBeVisible();
    await completeXrMissionViaActionList(page);
    const summary = page.getByTestId('xr-summary');
    await expect(summary).toBeVisible();
    // The end screen must say what was NOT trained (touch, force, taste) — honesty rule.
    await expect(summary).toContainText(/not|didn’t|did not/i);

    const st = await readState(page);
    const xrEvents = st.events.filter((e: Ev) => e.activityId === 'esp-workflow-xr');
    expect(xrEvents.length).toBeGreaterThanOrEqual(1);
    expect(xrEvents[0]).toMatchObject({ evidence: 'simulated', outcome: 'completed', lessonId: 'esp-workflow' });
    expect(xrEvents[0].mode).not.toBe('xr'); // not immersive — no headset

    // The lesson's spatial card reflects the simulated completion, labelled as simulation.
    const idx = getLesson('esp-workflow')!.activityIds.indexOf('esp-workflow-xr');
    await page.goto(`/#/learn/esp-workflow?step=${idx + 1}&g=guided`);
    const card = page.getByTestId('activity-spatial-practice');
    await expect(card).toBeVisible();
    await expect(card.getByText('Completed in simulation')).toBeVisible();
    await expect(card.getByText(/simulat/i).first()).toBeVisible();
    await expect(card.getByText(/No immersive VR detected/)).toBeVisible();

    // Persistence across reload.
    await page.reload();
    await expect(page.getByTestId('activity-spatial-practice').getByText('Completed in simulation')).toBeVisible();
    await page.goto('/#/');
    await expect(page.locator('[data-layout]')).toBeVisible();
    if ((await page.locator('[data-layout]').getAttribute('data-layout')) === 'desktop') {
      await expect(page.getByRole('main').getByText('Simulated').first()).toBeVisible();
    }
    await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('navigator.xr whose isSessionSupported rejects → no crash, 3D/list still offered', async ({ page }) => {
    const errors = collectErrors(page);
    await page.addInitScript(() => {
      Object.defineProperty(Navigator.prototype, 'xr', {
        configurable: true,
        get: () => ({ isSessionSupported: () => Promise.reject(new Error('SecurityError: denied')), addEventListener() {}, removeEventListener() {} }),
      });
    });
    await seedProfile(page);
    await page.goto('/#/xr?mission=espresso-first-shot');
    await expect(page.getByTestId('xr-capability')).toHaveAttribute('data-reason', /error|not-supported/);
    await expect(page.getByTestId('xr-play-list')).toBeVisible();
    await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('browser reports immersive-vr but the session is denied → clear alert, keep playing in 3D', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop check');
    test.setTimeout(120_000); // 3D scene compiles shaders in software WebGL; slow under 10 parallel workers
    const errors = collectErrors(page);
    await page.addInitScript(() => {
      const fake = {
        isSessionSupported: async (m: string) => m === 'immersive-vr',
        requestSession: async () => {
          throw new DOMException('User denied', 'NotAllowedError');
        },
        addEventListener() {},
        removeEventListener() {},
      };
      Object.defineProperty(Navigator.prototype, 'xr', { configurable: true, get: () => fake });
    });
    await seedProfile(page);
    await page.goto('/#/xr?mission=espresso-first-shot');
    await expect(page.getByTestId('xr-capability')).toHaveAttribute('data-reason', 'supported');
    // Even when VR is reported, the copy stays honest about hardware verification.
    await expect(page.getByTestId('xr-capability')).toContainText('Hardware-unverified');
    await page.getByTestId('xr-capability').getByRole('button', { name: /Enter VR/ }).click();
    const enter = page.locator('.xr-stage__vr').getByRole('button', { name: /Enter VR/ });
    await expect(enter).toBeVisible({ timeout: 75_000 });
    await enter.click();
    await expect(page.getByRole('alert').filter({ hasText: 'The VR session could not start' })).toBeVisible();
    await expect(page.getByTestId('xr-canvas')).toBeVisible();
    await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    expect(errors.filter((e) => !/WebGL|GPU stall|GL Driver/i.test(e))).toEqual([]);
  });

  test('3D fallback scene drives the same mission state machine (?xrtest hook, real mouse click)', async ({ page, isMobile }) => {
    test.skip(isMobile, 'mouse-driven 3D check on desktop');
    test.setTimeout(120_000);
    const errors = collectErrors(page);
    await removeWebXR(page);
    await seedProfile(page);
    await page.goto('/?xrtest#/xr');
    await page.getByTestId('xr-play-3d').click();
    await expect(page.getByTestId('xr-canvas')).toBeVisible();
    await page.waitForFunction(() => !!(window as unknown as { __coffeeLabXr?: unknown }).__coffeeLabXr, null, { timeout: 75_000 });
    const firstTitle = await page.getByTestId('xr-step-title').textContent();
    const pt = await page.evaluate(() => (window as unknown as { __coffeeLabXr: { project(t: string): { x: number; y: number } | null } }).__coffeeLabXr.project('espresso-machine'));
    expect(pt, 'machine projects onto the canvas').not.toBeNull();
    await page.mouse.click(pt!.x, pt!.y);
    await expect(page.getByTestId('xr-step-title')).not.toHaveText(firstTitle ?? '', { timeout: 10_000 });
    // The keyboard action list reflects the same store (locate is no longer offered).
    await expect(page.locator('.xr-action[data-action-id="locate"]')).toHaveCount(0);
    const stats = await page.evaluate(() => (window as unknown as { __coffeeLabXr: { stats(): unknown } }).__coffeeLabXr.stats());
    expect(stats).toBeTruthy();
    await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    expect(errors.filter((e) => !/WebGL|GPU stall|GL Driver/i.test(e))).toEqual([]);
  });
});
