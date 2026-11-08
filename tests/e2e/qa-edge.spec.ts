/**
 * QA (quality-guardian) — misleading-feedback and edge-case probes:
 * skipping must never look like completion; abandoning a real-world guide must not record a completion;
 * invalid brew numbers are rejected; reset really resets; XR mid-mission exit/resume.
 */
import { expect, test } from '@playwright/test';
import { lessonActivities, readState, seedProfile, collectErrors, ERROR_BOUNDARY_TEXT } from './qa-helpers';

// Service workers blocked for determinism (PWA toast timing); PWA behaviour is tested in blocks that re-allow them.
test.use({ serviceWorkers: 'block' });

test('skipping every activity does not show "Lesson complete" or record progress', async ({ page }) => {
  const errors = collectErrors(page);
  await seedProfile(page);
  await page.goto('/#/learn/esp-ratio-lab');
  await page.getByTestId('lesson-start').click();
  for (let i = 0; i < lessonActivities('esp-ratio-lab').length; i++) {
    await expect(page.getByTestId('activity-title')).toBeVisible();
    await page.getByTestId('lesson-next').click();
  }
  const done = page.getByTestId('lesson-complete');
  await expect(done).toBeVisible();
  await expect(done).not.toHaveAttribute('data-status', 'completed');
  await expect(page.getByRole('heading', { name: /Lesson complete/ })).toHaveCount(0);
  const st = await readState(page);
  expect((st?.events ?? []).filter((e: { lessonId: string }) => e.lessonId === 'esp-ratio-lab')).toHaveLength(0);
  expect(errors).toEqual([]);
});

test('abandoning the kitchen guide part-way records no completion (self-report only on finish)', async ({ page }) => {
  await seedProfile(page);
  await page.goto('/#/practice/esp-first-real-shot-guide');
  await page.getByTestId('practice-start').click();
  await page.getByRole('group', { name: 'Step controls' }).getByRole('button', { name: /^Done/ }).click();
  await page.getByTestId('practice-exit').click();
  await page.getByTestId('exit-end').click();
  const st = await readState(page);
  expect(st.activePractice).toBeNull();
  expect(st.events.filter((e: { activityId: string; outcome: string }) => e.activityId === 'esp-first-real-shot-guide' && e.outcome === 'completed')).toHaveLength(0);
  expect(st.journal).toHaveLength(0);
});

test('brew log rejects impossible numbers instead of computing a fake ratio', async ({ page }) => {
  await seedProfile(page);
  await page.goto('/#/journal');
  await page.getByTestId('log-cup').click();
  await page.getByTestId('log-doseG').fill('0');
  await page.getByTestId('log-outG').fill('-5');
  await expect(page.getByTestId('log-ratio')).not.toHaveText(/Infinity|NaN|1:-|1:0\.0/);
  await page.getByTestId('log-save').click();
  await expect(page.getByRole('alert').first()).toBeVisible();
  expect((await readState(page)).journal).toHaveLength(0);
});

test('reset all → back to first-run onboarding, journal and progress empty', async ({ page }) => {
  await seedProfile(page);
  await page.goto('/#/settings');
  await page.getByTestId('reset-all').click();
  await page.getByTestId('confirm-reset').click();
  await expect(page.getByTestId('settings-message')).toContainText('Everything was reset');
  await page.goto('/#/');
  await expect(page).toHaveURL(/#\/onboarding/);
  const st = await readState(page);
  expect(st.events).toHaveLength(0);
  expect(st.journal).toHaveLength(0);
});

test('XR: exit mid-mission offers resume at the same step; nothing recorded until completion', async ({ page }) => {
  const errors = collectErrors(page);
  await seedProfile(page);
  await page.goto('/#/xr?mission=espresso-first-shot');
  await page.getByTestId('xr-play-list').click();
  for (let i = 0; i < 3; i++) {
    await page.locator('.xr-action[data-recommended]').first().click();
    await page.waitForTimeout(100);
  }
  const step = await page.getByTestId('xr-step-title').textContent();
  await page.locator('.xr-toolbar').getByRole('button', { name: /^Exit|Back/ }).click();
  await expect(page.getByRole('button', { name: /Resume|Continue/ })).toBeVisible();
  await page.getByRole('button', { name: /Resume|Continue/ }).click();
  await expect(page.getByTestId('xr-step-title')).toHaveText(step ?? '');
  const st = await readState(page);
  expect(st.events.filter((e: { evidence: string }) => e.evidence === 'simulated')).toHaveLength(0);
  await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
  expect(errors).toEqual([]);
});
