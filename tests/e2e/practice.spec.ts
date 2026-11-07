import { expect, test, type Page } from '@playwright/test';

/**
 * Real-world copilot flows (kitchen mode → brew log → journal; Drink Atlas → make it).
 * Runs on desktop 1280×800 and Pixel 7 (touch) against the production build.
 * State is seeded once per test (a learner who owns an espresso machine + grinder and a pour-over kit).
 */

const STATE_KEY = 'coffee-lab:state';
const SEED = {
  version: 1,
  profile: {
    goal: 'espresso',
    experience: 'new',
    devices: ['phone', 'pc'],
    equipment: ['espresso-machine', 'grinder', 'tamper', 'scale', 'dripper', 'paper-filter', 'gooseneck-kettle'],
    wishlist: [],
    preferredMode: 'mobile',
    onboardedAt: '2026-11-07T08:00:00.000Z',
  },
  prefs: { locale: 'en', sfx: false, music: false, volume: 0.5, reducedMotion: 'on', theme: 'system', defaultGuidance: 'guided', speakSteps: false },
  events: [],
  journal: [],
  activePractice: null,
};

async function seed(page: Page) {
  // Only seeds when empty, so reloads keep whatever the app saved.
  await page.addInitScript(
    ([key, value]) => {
      if (!window.localStorage.getItem(key)) window.localStorage.setItem(key, value);
    },
    [STATE_KEY, JSON.stringify(SEED)] as const,
  );
}

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

const stepCard = (page: Page) => page.getByTestId('practice-step');
const doneButton = (page: Page) => page.getByRole('group', { name: 'Step controls' }).getByRole('button', { name: /^Done/ });

test.describe('kitchen mode → brew log → journal', () => {
  test('guided practice: steps, reload resume, finish, log, ratio + suggestion, journal entry', async ({ page }) => {
    const errors = collectErrors(page);
    await seed(page);
    await page.goto('/#/practice/esp-first-real-shot-guide');

    // Pre-flight: honest framing, gear from the profile, illustrative recipe.
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/First Shot/i);
    await expect(page.getByText(/can’t see your kitchen/).first()).toBeVisible();
    await expect(page.getByTestId('gear-checklist')).toContainText('You have it');
    await expect(page.getByText('Illustrative recipe')).toBeVisible();
    await page.getByTestId('practice-start').click();

    // One big step at a time; kitchen controls are large.
    await expect(stepCard(page)).toHaveAttribute('data-step-id', 'manual');
    await expect(page.getByText('Step 1 of', { exact: false }).first()).toBeVisible();
    for (const name of [/^Back/, /^Repeat/, /^Help/, /^Done/]) {
      const box = await page.getByRole('group', { name: 'Step controls' }).getByRole('button', { name }).boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(63.5);
    }
    await expect(page.getByText(/self-reported/i).first()).toBeVisible();

    // Help sheet records help and closes back to the same step.
    await page.getByRole('group', { name: 'Step controls' }).getByRole('button', { name: /^Help/ }).click();
    await expect(page.getByRole('dialog', { name: 'Need help?' })).toBeVisible();
    await page.getByTestId('help-close').click();
    await expect(stepCard(page)).toHaveAttribute('data-step-id', 'manual');

    await doneButton(page).click();
    await doneButton(page).click();
    await expect(stepCard(page)).toHaveAttribute('data-step-id', 'flush');

    // Interruption: reload → resume prompt → same step.
    await page.reload();
    await expect(page.getByTestId('resume-prompt')).toBeVisible();
    await expect(page.getByTestId('resume-prompt')).toContainText('step 3');
    await page.getByTestId('resume-continue').click();
    await expect(stepCard(page)).toHaveAttribute('data-step-id', 'flush');

    // Back works, then confirm every remaining step.
    await page.getByRole('group', { name: 'Step controls' }).getByRole('button', { name: /^Back/ }).click();
    await expect(stepCard(page)).toHaveAttribute('data-step-id', 'heat');
    for (let i = 0; i < 30 && !(await page.getByTestId('practice-finish').isVisible()); i++) {
      await doneButton(page).click();
    }
    await expect(page.getByTestId('practice-finish')).toBeVisible();

    // Brew log with a live ratio.
    await page.getByTestId('log-doseG').fill('18');
    await page.getByTestId('log-outG').fill('36');
    await page.getByTestId('log-timeSec').fill('19');
    await expect(page.getByTestId('log-ratio')).toHaveText('1:2.0');
    await page.getByTestId('taste-sour').click();
    await page.getByTestId('log-save').click();

    // Entry detail: ratio, self-report label, one-change suggestion with uncertainty.
    await expect(page).toHaveURL(/#\/journal\?entry=/);
    await expect(page.getByTestId('entry-ratio')).toHaveText('1:2.0');
    await expect(page.getByTestId('journal-entry').getByText('Self-reported').first()).toBeVisible();
    const advice = page.getByTestId('advice');
    await expect(advice).toContainText('One thing to try next');
    await expect(advice).toContainText('grind a little finer');
    await expect(advice).toContainText(/rule of thumb/i);

    // Journal list shows the cup, labelled self-reported.
    await page.goto('/#/journal');
    await expect(page.getByTestId('cups-count')).toContainText('1 cup logged');
    const list = page.getByTestId('journal-list');
    await expect(list.getByRole('listitem')).toHaveCount(1);
    await expect(list).toContainText('Espresso');
    await expect(list).toContainText('1:2.0');
    await expect(list.getByText('Self-reported')).toBeVisible();

    // The session was recorded honestly and the guide is no longer active.
    const saved = await page.evaluate((k) => JSON.parse(window.localStorage.getItem(k) ?? '{}'), STATE_KEY);
    expect(saved.activePractice).toBeNull();
    const ev = saved.events.filter((e: { activityId: string }) => e.activityId === 'esp-first-real-shot-guide');
    expect(ev).toHaveLength(1);
    expect(ev[0]).toMatchObject({ evidence: 'self_report', mode: 'real-world-guide', outcome: 'completed' });
    expect(saved.journal[0]).toMatchObject({ evidence: 'self_report', drinkId: 'espresso-shot', doseG: 18, outG: 36, timeSec: 19 });

    expect(errors).toEqual([]);
  });

  test('log another attempt → comparison with the previous cup; delete with confirmation', async ({ page }) => {
    const errors = collectErrors(page);
    await seed(page);
    await page.goto('/#/journal');
    await expect(page.getByRole('heading', { name: /No cups yet/ })).toBeVisible();

    await page.getByTestId('log-cup').click();
    await page.getByTestId('log-drink').selectOption('pourover-cone');
    await page.getByTestId('log-doseG').fill('15');
    await page.getByTestId('log-outG').fill('255');
    await page.getByTestId('taste-watery').click();
    await page.getByTestId('log-save').click();
    await expect(page.getByTestId('entry-ratio')).toHaveText('1:17.0');
    await expect(page.getByTestId('advice')).toContainText('a little more coffee');

    await page.getByTestId('log-another').click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Log another attempt');
    await page.getByRole('button', { name: /Copy dose, output and grind/ }).click();
    await page.getByTestId('log-doseG').fill('16');
    await page.getByTestId('taste-balanced').click();
    await page.getByTestId('log-save').click();

    const compare = page.getByTestId('compare');
    await expect(compare).toBeVisible();
    await expect(compare).toContainText('You changed one recipe variable');
    await expect(page.getByText('Attempt 2')).toBeVisible();

    await page.getByTestId('entry-delete').click();
    await expect(page.getByRole('alertdialog', { name: 'Delete this cup?' })).toBeVisible();
    await page.getByTestId('confirm-delete').click();
    await expect(page).toHaveURL(/#\/journal$/);
    await expect(page.getByTestId('cups-count')).toContainText('1 cup logged');
    expect(errors).toEqual([]);
  });
});

test.describe('Drink Atlas', () => {
  test('filter by my gear, open a drink, make it in kitchen mode', async ({ page }) => {
    const errors = collectErrors(page);
    await seed(page);
    await page.goto('/#/atlas');
    await expect(page.getByRole('heading', { level: 1, name: 'Drink Atlas' })).toBeVisible();
    const before = await page.getByTestId('atlas-count').textContent();

    await page.getByRole('radio', { name: 'Can make with my gear' }).click();
    await expect(page.getByTestId('atlas-count')).not.toHaveText(before ?? '');
    await expect(page.getByTestId('drink-card-espresso-shot')).toBeVisible();
    await expect(page.getByTestId('drink-card-caffe-latte')).toHaveCount(0); // needs a milk pitcher
    await expect(page).toHaveURL(/gear=can-make/);

    await page.getByRole('radio', { name: 'Needs new gear' }).click();
    await expect(page.getByTestId('drink-card-caffe-latte')).toBeVisible();

    await page.getByTestId('drink-card-caffe-latte').getByRole('link').click();
    await expect(page.getByTestId('drink-detail')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Origin & culture' })).toBeVisible();
    await expect(page.getByTestId('drink-gear')).toContainText('Not yet');
    await page.getByTestId('wish-milk-pitcher').click();
    await expect(page.getByTestId('wish-milk-pitcher')).toHaveAttribute('aria-pressed', 'true');

    await page.getByTestId('make-it').click();
    await expect(page).toHaveURL(/#\/practice\/drink(:|%3A)caffe-latte/);
    await expect(page.getByTestId('gear-checklist')).toBeVisible();
    await page.getByTestId('practice-start').click();
    await expect(stepCard(page)).toHaveAttribute('data-step-id', 's1');
    expect(errors).toEqual([]);
  });

  test('unknown drink and unknown practice show helpful empty states', async ({ page }) => {
    const errors = collectErrors(page);
    await seed(page);
    await page.goto('/#/atlas/not-a-drink');
    await expect(page.getByText('That drink isn’t in the Atlas').first()).toBeVisible();
    await page.goto('/#/practice/not-a-practice');
    await expect(page.getByText('We couldn’t find that practice').first()).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe('Settings', () => {
  test('theme, import (validated) and reset with confirmation', async ({ page }) => {
    const errors = collectErrors(page);
    await seed(page);
    await page.goto('/#/settings');
    await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible();
    await expect(page.getByText(/nothing is uploaded anywhere/)).toBeVisible();
    await page.getByRole('radio', { name: 'Dark' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    // Import (validated locally): a file with one cup replaces the current data after confirmation.
    const imported = { format: 'coffee-lab-export', exportedAt: '2026-11-07T12:00:00.000Z', state: { ...SEED, journal: [{ id: 'brew_imp', evidence: 'self_report', drinkId: 'cortado', createdAt: '2026-11-07T10:00:00.000Z', doseG: 18 }] } };
    await page.getByTestId('import-file').setInputFiles({ name: 'coffee-lab.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(imported)) });
    await expect(page.getByRole('alertdialog', { name: /Replace your current data/ })).toContainText('1 brew log entry');
    await page.getByTestId('confirm-import').click();
    await expect(page.getByTestId('settings-message')).toContainText('Import complete');
    // A non-Coffee-Lab file is rejected with a clear message.
    await page.getByTestId('import-file').setInputFiles({ name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"hello":1}') });
    await expect(page.getByTestId('settings-message')).toContainText('doesn’t look like a Coffee Lab export');
    const afterImport = await page.evaluate((k) => JSON.parse(window.localStorage.getItem(k) ?? '{}'), STATE_KEY);
    expect(afterImport.journal.map((j: { id: string }) => j.id)).toEqual(['brew_imp']);

    await page.getByTestId('reset-all').click();
    await expect(page.getByRole('alertdialog', { name: 'Reset all progress?' })).toBeVisible();
    await page.getByTestId('confirm-reset').click();
    await expect(page.getByTestId('settings-message')).toContainText('Everything was reset');
    const saved = await page.evaluate((k) => JSON.parse(window.localStorage.getItem(k) ?? '{}'), STATE_KEY);
    expect(saved.profile).toBeNull();
    expect(errors).toEqual([]);
  });
});
