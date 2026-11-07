import { expect, test, type BrowserContext, type Page } from '@playwright/test';

/**
 * PWA offline behaviour against the production build (service worker is production-only).
 * Desktop 1280×800 + Pixel 7. Run isolated when other suites run concurrently, e.g.
 *   E2E_PORT=4182 E2E_DIST=.e2e/dist-pwa E2E_OUT=.e2e/out-pwa npx playwright test offline
 */

const STATE_KEY = 'coffee-lab:state';
const SEED = {
  version: 1,
  profile: {
    goal: 'espresso',
    experience: 'new',
    devices: ['phone', 'pc'],
    equipment: ['espresso-machine', 'grinder', 'tamper', 'scale'],
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
  await page.addInitScript(
    ([key, value]) => {
      if (!window.localStorage.getItem(key)) window.localStorage.setItem(key, value);
    },
    [STATE_KEY, JSON.stringify(SEED)] as const,
  );
}

/** Network failures are expected while offline (e.g. the 3D chunk that was never cached); app errors are not. */
const EXPECTED_OFFLINE_NOISE = /ERR_INTERNET_DISCONNECTED|Failed to load resource|Failed to fetch dynamically imported module|error loading dynamically imported module/i;

function collectErrors(page: Page, { allowNetworkNoise = false } = {}): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    if (allowNetworkNoise && EXPECTED_OFFLINE_NOISE.test(msg.text())) return;
    errors.push(`console.error: ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

const ERROR_BOUNDARY_TEXT = /Something went wrong|出了点问题/;
const h1 = (page: Page) => page.getByRole('main').getByRole('heading', { level: 1 }).first();

/** First (online) load → wait until the service worker has precached the app and controls the page. */
async function loadOnlineAndWaitForServiceWorker(page: Page) {
  await page.goto('/');
  await expect(h1(page)).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
}

async function goOffline(context: BrowserContext, page: Page) {
  await context.setOffline(true);
  expect(await page.evaluate(() => navigator.onLine)).toBe(false);
}

test.describe('offline after first load (PWA)', () => {
  test('manifest + service worker are served by the production build', async ({ page, request }) => {
    await page.goto('/');
    const href = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(href).toBeTruthy();
    const manifest = await (await request.get(new URL(href!, page.url()).href)).json();
    expect(manifest.name).toBe('Coffee Lab · 咖啡实验室');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons.some((i: { purpose?: string }) => i.purpose === 'maskable')).toBe(true);
    for (const icon of manifest.icons as Array<{ src: string }>) {
      expect((await request.get(new URL(icon.src, new URL(href!, page.url())).href)).ok(), icon.src).toBe(true);
    }
    const sw = await (await request.get('sw.js')).text();
    expect(sw).toContain('coffee-lab:');
    // Precache list = app shell + route/content chunks; Babylon (~2 MB) is deliberately NOT precached.
    const list: string[] = JSON.parse(/const PRECACHE_PATHS = (\[.*?\]);/s.exec(sw)![1]);
    expect(list).toContain('index.html');
    expect(list).toContain('manifest.webmanifest');
    for (const path of list.filter((p) => p.endsWith('.js'))) {
      const body = await (await request.get(path)).text();
      expect(body, `${path} must not contain Babylon.js`).not.toMatch(/babylonjs@\d|Babylon\.js v\d/);
    }
  });

  test('home, lesson, kitchen mode, atlas detail, journal and settings work offline after reload', async ({ page, context }) => {
    const errors = collectErrors(page);
    await seed(page);
    await loadOnlineAndWaitForServiceWorker(page);

    await goOffline(context, page);
    await page.reload();
    await expect(page).toHaveURL(/\/(#\/)?$/); // HashRouter leaves an empty hash as-is
    await expect(h1(page)).toBeVisible();
    await expect(page.getByTestId('home-next-lesson')).toBeVisible();

    // Lesson player (lazy chunk + curriculum content served by the service worker).
    await page.goto('/#/learn/esp-meet-the-machine');
    await expect(h1(page)).toBeVisible();
    await expect(page.getByTestId('lesson-start')).toBeVisible();

    // Kitchen mode (real-world guide).
    await page.goto('/#/practice/esp-first-real-shot-guide');
    await expect(h1(page)).toBeVisible();
    await page.getByTestId('practice-start').click();
    await expect(page.getByTestId('practice-step')).toBeVisible();

    // Drink Atlas detail.
    await page.goto('/#/atlas/espresso-shot');
    await expect(page.getByTestId('drink-detail')).toBeVisible();

    for (const route of ['/#/journal', '/#/settings', '/#/atlas']) {
      await page.goto(route);
      await expect(h1(page)).toBeVisible();
    }
    await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('/xr offline (3D never loaded) degrades to the action-list fallback without crashing', async ({ page, context }) => {
    const errors = collectErrors(page, { allowNetworkNoise: true });
    await seed(page);
    await loadOnlineAndWaitForServiceWorker(page);
    await goOffline(context, page);
    await page.reload();

    await page.goto('/#/xr');
    await expect(h1(page)).toBeVisible();
    await page.getByTestId('xr-play-3d').click();
    await expect(page.getByRole('alert').filter({ hasText: /3D scene could not start/ })).toBeVisible();
    await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('3D chunks are runtime-cached after one online /xr visit (cross-origin never cached)', async ({ page }) => {
    await seed(page);
    await loadOnlineAndWaitForServiceWorker(page);
    await page.goto('/#/xr');
    await page.getByTestId('xr-play-3d').click();
    // Wait until the lazy 3D module settled (ready or WebGL-unavailable fallback) — either way it was fetched.
    await expect(page.getByText('Setting up the coffee counter…')).toHaveCount(0, { timeout: 30_000 });

    const cacheContents = await page.evaluate(async () => {
      const out: Record<string, string[]> = {};
      for (const name of await caches.keys()) {
        out[name] = (await (await caches.open(name)).keys()).map((r) => r.url);
      }
      return out;
    });
    const names = Object.keys(cacheContents);
    expect(names.some((n) => n.includes(':precache:'))).toBe(true);
    const runtime = names.find((n) => n.includes(':runtime:'));
    expect(runtime, 'runtime cache created by the /xr visit').toBeTruthy();
    expect(cacheContents[runtime!].length).toBeGreaterThan(0);
    const origin = new URL(page.url()).origin;
    for (const url of Object.values(cacheContents).flat()) expect(url.startsWith(origin), url).toBe(true);
  });
});
