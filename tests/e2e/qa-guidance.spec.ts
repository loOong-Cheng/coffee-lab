/**
 * QA (quality-guardian) — P0 "guided → assisted → independent" must change INTERACTION, not just a badge,
 * in at least two contexts. Verified here in four: quiz, sequence, kitchen mode, XR action list.
 */
import { expect, test } from '@playwright/test';
import { getActivity, getLesson } from '../../src/content';
import type { QuizActivity } from '../../src/domain/contracts';
import { collectErrors, seedProfile } from './qa-helpers';

// Service workers blocked for determinism (PWA toast timing); PWA behaviour is tested in blocks that re-allow them.
test.use({ serviceWorkers: 'block' });

const quizStep = getLesson('esp-workflow')!.activityIds.indexOf('esp-workflow-quiz') + 1;
const seqStep = getLesson('esp-workflow')!.activityIds.indexOf('esp-workflow-order') + 1;
const quiz = getActivity('esp-workflow-quiz') as QuizActivity;
const q0 = quiz.questions[0]!;
const wrong = q0.options.find((o) => !o.correct)!;

test.describe('guidance tiers change behaviour', () => {
  test('quiz: guided = instant feedback + visible hint; assisted = check button; independent = feedback deferred to a review', async ({ page }) => {
    const errors = collectErrors(page);
    await seedProfile(page);

    await page.goto(`/#/learn/esp-workflow?step=${quizStep}&g=guided`);
    await page.locator(`[data-option="${wrong.id}"]`).click();
    await expect(page.locator(`[data-option="${wrong.id}"]`)).toHaveAttribute('data-state', 'incorrect');
    await expect(page.getByTestId('quiz-check')).toHaveCount(0);
    await expect(page.getByRole('main').getByText(wrong.feedback.en)).toBeVisible();

    await page.goto(`/#/learn/esp-workflow?step=${quizStep}&g=assisted`);
    await page.locator(`[data-option="${wrong.id}"]`).click();
    await expect(page.locator(`[data-option="${wrong.id}"]`)).toHaveAttribute('data-state', 'selected');
    await expect(page.getByRole('main').getByText(wrong.feedback.en)).toHaveCount(0);
    await page.getByTestId('quiz-check').click();
    await expect(page.getByRole('main').getByText(wrong.feedback.en)).toBeVisible();

    await page.goto(`/#/learn/esp-workflow?step=${quizStep}&g=independent`);
    for (const q of quiz.questions) {
      const w = q.options.find((o) => !o.correct)!;
      await page.locator(`[data-option="${w.id}"]`).click();
      await expect(page.getByRole('main').getByText(w.feedback.en)).toHaveCount(0); // nothing revealed yet
      await page.getByTestId('quiz-check').click();
    }
    // Review lists every answer with an explanation; nothing is marked complete.
    await expect(page.getByRole('main').getByText(q0.explanation.en)).toBeVisible();
    await expect(page.getByTestId('support-nudge')).toBeVisible(); // offers (never forces) more support
    expect(errors).toEqual([]);
  });

  test('sequence: guided = build one step at a time; assisted/independent = reorder then check', async ({ page }) => {
    await seedProfile(page);
    await page.goto(`/#/learn/esp-workflow?step=${seqStep}&g=guided`);
    await expect(page.getByTestId('activity-sequence')).toHaveAttribute('data-mode', 'build');
    await page.goto(`/#/learn/esp-workflow?step=${seqStep}&g=assisted`);
    await expect(page.getByTestId('activity-sequence')).toHaveAttribute('data-mode', 'reorder');
    await expect(page.getByTestId('sequence-check')).toBeVisible();
    await page.goto(`/#/learn/esp-workflow?step=${seqStep}&g=independent`);
    await expect(page.getByTestId('activity-sequence')).toHaveAttribute('data-mode', 'reorder');
  });

  test('kitchen mode: guided shows detail + tip; independent shows a checklist; safety stays at every tier', async ({ page }) => {
    await seedProfile(page);
    await page.goto('/#/practice/esp-first-real-shot-guide');
    await page.getByTestId('practice-start').click();
    const run = page.locator('.kp-run');
    await expect(run).toHaveAttribute('data-guidance', 'guided');
    await expect(page.getByTestId('practice-step').getByText('Tip').first()).toBeVisible();
    await page.getByTestId('kitchen-settings').click();
    await page.getByRole('dialog').getByRole('radio', { name: /Independent/ }).click();
    await page.keyboard.press('Escape');
    await expect(run).toHaveAttribute('data-guidance', 'independent');
    await expect(page.locator('.kp-checklist')).toBeVisible();
    await expect(page.getByTestId('practice-step').getByText('Tip')).toHaveCount(0);
  });

  test('XR action list: guided marks the recommended action; independent shows none (actions still available)', async ({ page }) => {
    await seedProfile(page);
    await page.goto('/#/xr?mission=espresso-first-shot');
    await page.getByTestId('xr-play-list').click();
    await expect(page.locator('.xr-action[data-recommended]').first()).toBeVisible();
    await page.locator('.xr-side').getByRole('radio', { name: /Independent/ }).click();
    await expect(page.locator('.xr-action[data-recommended]')).toHaveCount(0);
    await expect(page.locator('.xr-action').first()).toBeVisible();
  });
});
