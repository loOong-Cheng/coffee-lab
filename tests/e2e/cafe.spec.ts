import { expect, test, type Page } from '@playwright/test';

/**
 * Café Counter (desktop 1280×800 + mobile at 390×844 on the Pixel 7 touch profile), production build:
 * lobby → shift → one deliberately wrong serve (explained) → retry → perfect serves → summary →
 * reload → mastered collection persists (derived from saved events).
 */

const STATE_KEY = 'coffee-lab:state';
const SEED = {
  version: 1,
  profile: {
    goal: 'explore',
    experience: 'new',
    devices: ['phone', 'pc'],
    equipment: ['espresso-machine', 'grinder'],
    wishlist: [],
    preferredMode: 'desktop',
    onboardedAt: '2026-11-07T08:00:00.000Z',
  },
  prefs: { locale: 'en', sfx: false, music: false, volume: 0.5, reducedMotion: 'on', theme: 'system', defaultGuidance: 'guided', speakSteps: false },
  events: [],
  journal: [],
  activePractice: null,
};

/** Independent oracle for level 1 (espresso bar basics) — one common version of each drink. */
type B = { shots?: string; style?: string; water?: string; waterMl?: string; extras?: string[]; cup: string };
const BAR: Record<string, B> = {
  'espresso-shot': { cup: 'demitasse' },
  ristretto: { style: 'ristretto', cup: 'demitasse' },
  lungo: { style: 'lungo', cup: 'small' },
  americano: { water: 'after', waterMl: '150', cup: 'large' },
  'long-black': { water: 'before', waterMl: '100', cup: 'medium' },
  affogato: { extras: ['ice-cream'], cup: 'small' },
};
const WRONG_CUP: Record<string, string> = {
  'espresso-shot': 'large',
  ristretto: 'large',
  lungo: 'large',
  americano: 'demitasse',
  'long-black': 'demitasse',
  affogato: 'large',
};

async function seed(page: Page) {
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

const station = (page: Page, id: string) => page.getByTestId(`station-${id}`);

async function pick(page: Page, id: string, value: string) {
  const el = station(page, id).locator(`[data-value="${value}"]`).first();
  if ((await el.getAttribute('aria-checked')) !== 'true') await el.click();
  await expect(el).toHaveAttribute('aria-checked', 'true');
}

async function build(page: Page, b: B) {
  await pick(page, 'shots', b.shots ?? '2');
  await pick(page, 'shots', b.style ?? 'normal');
  await pick(page, 'water', b.water ?? 'none');
  if (b.waterMl) await pick(page, 'water', b.waterMl);
  for (const e of b.extras ?? []) {
    const chip = station(page, 'extras').locator(`[data-extra="${e}"]`);
    if ((await chip.getAttribute('aria-pressed')) !== 'true') await chip.click();
  }
  await pick(page, 'cup', b.cup);
}

const drinkOnTicket = (page: Page) => page.getByTestId('cafe-ticket').getAttribute('data-drink');

test.describe('Café Counter', () => {
  // The PWA 'ready offline' toast is not part of this feature and can cover the mobile serve bar.
  test.use({ serviceWorkers: 'block' });

  test('serve a wrong and a right order, see why, finish a shift, mastered collection persists', async ({ page, isMobile }) => {
    if (isMobile) await page.setViewportSize({ width: 390, height: 844 });
    const errors = collectErrors(page);
    await seed(page);
    await page.goto('/#/cafe?seed=3');

    await expect(page.getByRole('heading', { level: 1, name: 'Café Counter' })).toBeVisible();
    await expect(page.getByTestId('cafe-versions')).toContainText('Definitions vary by café and region');
    await expect(page.getByTestId('cafe-mastered-count')).toHaveText('0 of 19 drinks mastered');

    await page.getByTestId('cafe-start-bar').click();
    await expect(page.getByTestId('cafe-ticket')).toBeVisible();
    await expect(page.getByTestId('cafe-recipe')).toBeVisible(); // guided

    // Order 1: wrong cup on purpose → specific, explained difference.
    const first = (await drinkOnTicket(page))!;
    expect(Object.keys(BAR)).toContain(first);
    await build(page, { ...BAR[first]!, cup: WRONG_CUP[first]! });
    await page.getByTestId('cafe-serve').click();
    const fb = page.getByTestId('cafe-feedback');
    await expect(fb).toHaveAttribute('data-status', /partly|incorrect/);
    const cupDiff = fb.locator('li[data-component="cup"]');
    await expect(cupDiff).toBeVisible();
    await expect(cupDiff).toContainText('Why:');
    await expect(cupDiff).toContainText('Order:');
    await expect(page.getByTestId('cafe-cup-order')).toBeVisible();

    // Retry, fix, serve → correct.
    await page.getByTestId('cafe-retry').click();
    await expect(station(page, 'cup')).toHaveAttribute('data-flagged', 'true');
    await pick(page, 'cup', BAR[first]!.cup);
    await page.getByTestId('cafe-serve').click();
    await expect(fb).toHaveAttribute('data-status', 'correct');
    await expect(fb).toContainText('Key point');
    await page.getByTestId('cafe-next').click();

    // Orders 2–5: perfect.
    for (let i = 2; i <= 5; i++) {
      await expect(page.getByTestId('cafe-ticket')).toContainText(`Customer ${i} of 5`);
      const id = (await drinkOnTicket(page))!;
      expect(Object.keys(BAR)).toContain(id);
      await build(page, BAR[id]!);
      if (!isMobile && i === 2) {
        await page.keyboard.press('s'); // desktop quick path
      } else {
        await page.getByTestId('cafe-serve').click();
      }
      await expect(page.getByTestId('cafe-feedback')).toHaveAttribute('data-status', 'correct');
      await page.getByTestId('cafe-next').click();
    }

    const summary = page.getByTestId('cafe-summary');
    await expect(summary.getByRole('heading', { name: 'Shift complete!' })).toBeVisible();
    await expect(page.getByTestId('cafe-first-try')).toHaveText('4/5');
    await expect(page.getByTestId('cafe-newly-mastered')).toBeVisible();
    await expect(summary.getByRole('link', { name: /See it in the Drink Atlas/ }).first()).toHaveAttribute('href', /#\/atlas\//);

    await page.getByTestId('cafe-back').click();
    await expect(page.getByTestId('cafe-mastered-count')).toHaveText('5 of 19 drinks mastered');

    await page.reload();
    await expect(page.getByTestId('cafe-mastered-count')).toHaveText('5 of 19 drinks mastered');
    await expect(page.locator('.cafe-collect[data-mastered="true"]')).toHaveCount(5);

    // No horizontal scrolling at this width; tap targets on the counter are ≥44px.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    if (isMobile) {
      await page.getByTestId('cafe-start-milk').click();
      const opts = page.getByTestId('station-milk').locator('[role="radio"]');
      const n = await opts.count();
      for (let i = 0; i < n; i++) {
        const box = await opts.nth(i).boundingBox();
        expect(box!.height).toBeGreaterThanOrEqual(44);
      }
      const serve = await page.getByTestId('cafe-serve').boundingBox();
      expect(serve!.height).toBeGreaterThanOrEqual(44);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    }

    expect(errors).toEqual([]);
  });

  test('home entry card and nav lead to the café; zh is complete', async ({ page, isMobile }) => {
    const errors = collectErrors(page);
    await seed(page);
    await page.goto('/#/');
    await page.getByTestId('home-cafe').click();
    await expect(page).toHaveURL(/#\/cafe$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Café Counter' })).toBeVisible();
    const nav = page.getByRole('navigation', { name: 'Primary' });
    await expect(nav.getByRole('link', { name: 'Café' })).toHaveAttribute('aria-current', 'page');
    if (isMobile) {
      const box = await nav.getByRole('link', { name: 'Café' }).boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }

    await page.getByTestId('locale-toggle').click();
    await expect(page.getByRole('heading', { level: 1, name: '咖啡馆吧台' })).toBeVisible();
    await page.getByTestId('cafe-start-world').click();
    await expect(page.getByTestId('cafe-ticket')).toContainText('第 1 位客人');
    await expect(page.getByTestId('station-method')).toContainText('冲煮方式');
    expect(errors).toEqual([]);
  });
});
