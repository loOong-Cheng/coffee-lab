import { expect, test, type Page } from '@playwright/test';

/**
 * Foundation smoke tests (desktop 1280x800 + Pixel 7 mobile, Chromium, production build).
 * Assertions are deliberately generic about page CONTENT so feature work can replace placeholders
 * without breaking them; they pin the shell contract: routing, redirect, i18n toggle, no crashes.
 */

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

const ERROR_BOUNDARY_TEXT = /Something went wrong|出了点问题/;

test.describe('app shell smoke', () => {
  test('first visit redirects to onboarding; defaults lead to home; progress persists on reload', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/');
    await expect(page).toHaveURL(/#\/onboarding$/);
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    // Placeholder onboarding offers "start with defaults"; the real onboarding must keep a skip path.
    const defaults = page.getByTestId('onboarding-defaults');
    if (await defaults.count()) {
      await defaults.click();
      await expect(page).toHaveURL(/#\/$/);
      await page.reload();
      await expect(page).toHaveURL(/#\/$/); // profile persisted → no redirect
    }
    await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('language toggle switches visible text and <html lang>', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/#/settings');
    const nav = page.getByRole('navigation', { name: 'Primary' });
    await expect(nav.getByRole('link', { name: 'Learn' })).toBeVisible();

    await page.getByTestId('locale-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
    await expect(page.getByRole('navigation', { name: '主导航' }).getByRole('link', { name: '学习' })).toBeVisible();

    await page.reload(); // locale is persisted
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
    await page.getByTestId('locale-toggle').click();
    await expect(nav.getByRole('link', { name: 'Learn' })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('every primary nav destination renders without crashing', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/#/onboarding');
    for (const name of ['Practice', 'Atlas', 'Settings', 'XR Lab']) {
      await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name }).click();
      await expect(page.getByRole('main').getByRole('heading', { level: 1 }).first()).toBeVisible();
      await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    }
    expect(errors).toEqual([]);
  });

  test('/xr route renders (no headset) without a crash', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/#/xr');
    await expect(page.getByRole('main').getByRole('heading', { level: 1 }).first()).toBeVisible();
    await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('Babylon.js is not downloaded outside the /xr route', async ({ page }) => {
    const scripts: string[] = [];
    page.on('response', (res) => {
      if (res.request().resourceType() === 'script') scripts.push(res.url());
    });
    await page.goto('/#/settings');
    await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible();
    for (const url of scripts) {
      const body = await (await page.request.get(url)).text();
      expect(body, `${url} must not contain Babylon.js`).not.toMatch(/babylonjs@\d|Babylon\.js v\d/);
    }
  });

  test('unknown route shows 404 with a link home', async ({ page }) => {
    await page.goto('/#/no-such-page');
    await expect(page.getByRole('heading', { level: 1, name: "We couldn't find that page" })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to the course map' })).toBeVisible();
  });

  test('skip link moves focus to main content', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard skip link is a desktop concern');
    await page.goto('/#/settings');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main')).toBeFocused();
    await expect(page).toHaveURL(/#\/settings$/); // hash route untouched
  });

  test('mobile layout: bottom navigation with touch-sized targets', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile-only layout check');
    await page.goto('/#/settings');
    const nav = page.getByRole('navigation', { name: 'Primary' });
    const box = await nav.boundingBox();
    const viewport = page.viewportSize();
    expect(box && viewport).toBeTruthy();
    expect(box!.y + box!.height).toBeGreaterThan(viewport!.height - 4); // pinned to the bottom
    const link = await nav.getByRole('link', { name: 'Learn' }).boundingBox();
    expect(link!.height).toBeGreaterThanOrEqual(44);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
