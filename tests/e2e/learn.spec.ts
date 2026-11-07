import { expect, test, type Page } from '@playwright/test';

/**
 * Core learning loop (desktop 1280×800 + Pixel 7), production build:
 * onboarding → home → first lesson → cards, ordering, quiz (wrong → right), reflection → completion
 * → reload → progress persisted (derived from saved events).
 */

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

async function completeOnboarding(page: Page) {
  await expect(page).toHaveURL(/#\/onboarding$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Welcome to Coffee Lab' })).toBeVisible();
  // 1 goal
  await page.getByRole('radio', { name: /Espresso/ }).click();
  await page.getByTestId('onboarding-next').click();
  // 2 experience
  await page.getByRole('radio', { name: /Brand new/ }).click();
  await page.getByTestId('onboarding-next').click();
  // 3 devices (keep the detected one)
  await page.getByTestId('onboarding-next').click();
  // 4 equipment: quick pick
  await page.getByTestId('quick-espresso').click();
  await expect(page.locator('[data-equipment="espresso-machine"]')).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('onboarding-next').click();
  // 5 mode + guidance
  await expect(page.getByRole('radio', { name: /Guided/ })).toHaveAttribute('aria-checked', 'true');
  await page.getByTestId('onboarding-finish').click();
  await expect(page).toHaveURL(/#\/$/);
}

async function playFirstLesson(page: Page) {
  await page.getByTestId('home-next-lesson').click();
  await expect(page).toHaveURL(/#\/learn\/lit-what-is-coffee$/);
  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveText('What Is Coffee?');
  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveCount(1);
  await page.getByTestId('lesson-start').click();

  // 1 · concept cards
  await expect(page.getByTestId('activity-explain')).toBeVisible();
  while (await page.getByTestId('explain-next').isVisible()) await page.getByTestId('explain-next').click();
  await page.getByTestId('activity-continue').click();

  // 2 · order the journey (guided: one step at a time, instant feedback)
  await expect(page.getByTestId('activity-sequence')).toHaveAttribute('data-mode', 'build');
  await page.locator('.act-seq-pool [data-step="grind"]').click(); // deliberate jump-ahead
  await expect(page.getByRole('main').getByText('Not this one yet')).toBeVisible();
  for (const id of ['harvest', 'process', 'ship', 'roast', 'rest', 'grind', 'brew']) {
    await page.locator(`.act-seq-pool [data-step="${id}"]`).click();
  }
  await expect(page.getByRole('main').getByText(/right on the first try/)).toBeVisible();
  await page.getByTestId('activity-continue').click();

  // 3 · quiz: wrong, explained, then right
  await expect(page.getByTestId('activity-quiz')).toBeVisible();
  await page.locator('[data-option="legume"]').click();
  await expect(page.getByRole('main').getByText(/not a legume/)).toBeVisible();
  await expect(page.locator('[data-option="legume"]')).toBeDisabled();
  for (const id of ['seed', 'a', 'flavor', 'acidity']) {
    await page.locator(`[data-option="${id}"]`).click();
    await page.getByTestId('quiz-next').click();
  }
  await expect(page.getByRole('main').getByText('3 of 4 right on the first try')).toBeVisible();
  await page.getByTestId('activity-continue').click();

  // 4 · reflection (optional, saved as a note)
  await page.getByRole('main').locator('textarea').first().fill('Coffee beans are seeds!');
  await page.getByTestId('reflect-save').click();

  // completion
  await expect(page.getByTestId('lesson-complete')).toHaveAttribute('data-status', 'completed');
  await expect(page.getByRole('heading', { name: /Lesson complete/ })).toBeVisible();
  await expect(page.getByRole('main').getByText('Assessed answer').first()).toBeVisible();
  await expect(page.getByTestId('next-lesson')).toHaveAttribute('href', /lit-tools-safety/);
}

test.describe('learning loop', () => {
  test('onboarding → first lesson with a wrong-then-right quiz → completion persists across reload', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/');
    await completeOnboarding(page);
    await expect(page.getByRole('heading', { level: 1, name: 'Your coffee course' })).toBeVisible();

    await playFirstLesson(page);

    await page.reload();
    await expect(page.getByTestId('lesson-complete')).toHaveAttribute('data-status', 'completed');

    await page.getByTestId('back-to-map').click();
    await expect(page.getByRole('heading', { level: 1, name: 'Your coffee course' })).toBeVisible();
    await expect(page.getByTestId('stat-mastered')).toHaveText(/^1\//);
    // The recommendation moved on to the next lesson.
    await expect(page.getByTestId('home-next-lesson')).toHaveAttribute('href', /lit-tools-safety/);

    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('coffee-lab:state') ?? '{}'));
    const quiz = saved.events.find((e: { activityId: string }) => e.activityId === 'lit-what-is-coffee-quiz');
    expect(quiz).toMatchObject({ evidence: 'assessed_answer', outcome: 'completed', score: 0.75 });
    expect(saved.events.find((e: { activityId: string }) => e.activityId === 'lit-what-is-coffee-reflect')).toMatchObject({
      evidence: 'self_report',
      notes: expect.stringContaining('Coffee beans are seeds!'),
    });
    expect(errors).toEqual([]);
  });

  test('skip path, layout per device, editable setup and ratio lab', async ({ page, isMobile }) => {
    const errors = collectErrors(page);
    await page.goto('/');
    await page.getByTestId('onboarding-defaults').click();
    await expect(page).toHaveURL(/#\/$/);
    const layout = page.locator('[data-layout]');
    await expect(layout).toHaveAttribute('data-layout', isMobile ? 'phone' : 'desktop');
    if (isMobile) {
      await expect(page.getByTestId('home-real-cup')).toBeVisible();
      const box = await page.getByTestId('home-real-cup').boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(64);
    } else {
      await expect(page.getByRole('region', { name: 'Course map' })).toBeVisible();
      await expect(page.getByTestId('home-xr')).toBeVisible();
    }

    // Setup is editable later and prefilled.
    await page.goto('/#/onboarding?edit=1');
    await expect(page.getByRole('heading', { level: 1, name: 'Update your setup' })).toBeVisible();
    await expect(page.getByRole('radio', { name: /Espresso/ })).toHaveAttribute('aria-checked', 'true');

    // Ratio lab: live maths + a challenge, keyboard/touch friendly controls.
    await page.goto('/#/learn/esp-ratio-lab?step=2&g=guided');
    await expect(page.getByTestId('activity-lab')).toBeVisible();
    await expect(page.getByTestId('lab-ratio')).toContainText('1:2.0');
    await expect(page.getByRole('main').getByText(/illustrative starting point/).first()).toBeVisible();
    const dose = page.getByRole('spinbutton', { name: /Dose/ });
    await dose.fill('16');
    await dose.press('Enter');
    const out = page.getByRole('spinbutton', { name: /Yield/ });
    await out.fill('32');
    await out.press('Enter');
    await expect(page.getByTestId('lab-ratio')).toContainText('1:2.0');
    await page.getByTestId('lab-check').click();
    await expect(page.getByRole('main').getByText(/Same ratio, smaller drink/)).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    expect(errors).toEqual([]);
  });

  test('unknown lesson is a friendly dead-end-free page', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('onboarding-defaults').click();
    await page.goto('/#/learn/nope');
    await expect(page.getByRole('heading', { level: 1, name: 'Lesson not found' })).toBeVisible();
    await page.getByRole('main').getByRole('link', { name: 'Back to the course map' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Your coffee course' })).toBeVisible();
  });
});
