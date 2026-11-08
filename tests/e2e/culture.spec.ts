/**
 * Coffee Culture Explorer (/culture) — desktop 1280×800 + Pixel 7, production build.
 * Pick a place via the list and via a map marker (clusters are zoomed into with the cluster
 * button, like a user would), open a related drink, filter the timeline, zh locale, music opt-in,
 * no console errors, no horizontal overflow, axe WCAG 2.1 A/AA clean (light + dark).
 * Run isolated: E2E_PORT=4188 E2E_DIST=.e2e/dist-culture E2E_OUT=.e2e/out-culture npx playwright test tests/e2e/culture.spec.ts
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { places, timeline } from '../../src/content';

test.use({ serviceWorkers: 'block' });

const STATE_KEY = 'coffee-lab:state';
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function seed(page: Page, locale: 'en' | 'zh' = 'en') {
  const state = {
    version: 1,
    profile: {
      goal: 'explore',
      experience: 'new',
      devices: ['pc', 'phone'],
      equipment: ['espresso-machine', 'grinder'],
      wishlist: [],
      preferredMode: 'desktop',
      onboardedAt: '2026-11-07T08:00:00.000Z',
    },
    prefs: { locale, sfx: false, music: false, musicMood: 'cafe', volume: 0.5, reducedMotion: 'on', theme: 'system', defaultGuidance: 'guided', speakSteps: false },
    events: [],
    journal: [],
    activePractice: null,
  };
  await page.addInitScript(
    ([key, value]) => {
      if (!window.localStorage.getItem(key)) window.localStorage.setItem(key, value);
    },
    [STATE_KEY, JSON.stringify(state)] as const,
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

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, 'horizontal overflow (px)').toBeLessThanOrEqual(1);
}

/** Find a place's marker the way a user would: zoom into the cluster that holds it until it appears. */
async function selectOnMap(page: Page, placeId: string) {
  const map = page.getByTestId('culture-map');
  for (let i = 0; i < 6; i++) {
    const pin = map.getByTestId(`map-pin-${placeId}`);
    if (await pin.count()) {
      await pin.click();
      return;
    }
    const cluster = map.locator(`.cu-cluster[data-cluster~="${placeId}"]`);
    await expect(cluster, `cluster holding ${placeId}`).toHaveCount(1);
    await cluster.click();
    const chooser = page.getByTestId('culture-chooser');
    if (await chooser.count()) {
      await chooser.getByRole('button', { name: new RegExp(places.find((p) => p.id === placeId)!.name.en.split(' (')[0]!) }).click();
      return;
    }
  }
  throw new Error(`could not reach marker ${placeId}`);
}

test.describe('Coffee Culture Explorer', () => {
  test('list → place detail → related drink; map marker → detail; timeline filter; no errors/overflow', async ({ page }) => {
    const errors = collectErrors(page);
    await seed(page);
    await page.goto('/#/culture');
    await expect(page.getByRole('heading', { level: 1, name: 'Coffee Culture Explorer' })).toBeVisible();
    await expect(page.getByTestId('culture-map')).toBeVisible();
    await expectNoHorizontalOverflow(page);

    // 1) via the list
    await page.getByRole('radio', { name: 'List' }).click();
    const list = page.getByTestId('culture-list');
    await expect(list.getByRole('button')).toHaveCount(places.length);
    await list.getByTestId('list-place-istanbul').click();
    const detail = page.getByTestId('culture-detail');
    await expect(detail.getByRole('heading', { level: 3 })).toHaveText(/Istanbul/);
    await expect(detail.getByRole('heading', { level: 3 })).toBeFocused();
    await expect(detail.getByText('Well documented')).toBeVisible();
    await expectNoHorizontalOverflow(page);
    // related drink → Drink Atlas
    await detail.getByTestId('detail-drink-turkish-coffee').click();
    await expect(page).toHaveURL(/#\/atlas\/turkish-coffee$/);
    await expect(page.getByTestId('drink-detail')).toBeVisible();
    // the Atlas links back to the explorer
    await page.goto('/#/atlas');
    await page.getByTestId('atlas-culture-link').click();
    await expect(page).toHaveURL(/#\/culture$/);

    // 2) via a map marker (buttons only — zoom into clusters)
    await expect(page.getByTestId('culture-map')).toBeVisible();
    await selectOnMap(page, 'kenya');
    await expect(page.getByTestId('culture-detail').getByRole('heading', { level: 3 })).toHaveText(/Kenya/);
    await expect(page.getByTestId('map-pin-kenya')).toHaveAttribute('aria-pressed', 'true');
    await expectNoHorizontalOverflow(page);
    // zoom / pan / reset controls
    await page.getByTestId('map-reset').click();
    await page.getByTestId('map-zoom-in').click();
    await expect(page.getByText(/Zoom 2×/)).toBeVisible();
    await page.getByTestId('map-pan-e').click();
    await page.getByTestId('map-reset').click();
    await expect(page.getByTestId('map-zoom-out')).toHaveAttribute('aria-disabled', 'true');

    // 3) timeline: badges + kind filter + show on map
    const tl = page.getByTestId('culture-timeline');
    await expect(tl.getByRole('article')).toHaveCount(timeline.length);
    const legends = timeline.filter((e) => e.kind === 'legend').length;
    const disputed = timeline.filter((e) => e.disputed).length;
    await expect(tl.getByTestId('legend-badge')).toHaveCount(legends);
    await expect(tl.getByTestId('legend-badge').first()).toHaveText('Legend');
    await expect(tl.getByTestId('disputed-badge')).toHaveCount(disputed);
    await expect(tl.getByTestId('disputed-badge').first()).toHaveText('Dates disputed');
    await page.getByTestId('tl-kind-legend').click();
    await expect(page.getByTestId('tl-count')).toHaveText(`Showing ${timeline.length - legends} of ${timeline.length} events`);
    await expect(tl.getByTestId('legend-badge')).toHaveCount(0);
    await page.getByTestId('tl-kind-legend').click();
    await expect(tl.getByRole('article')).toHaveCount(timeline.length);
    await page.getByTestId('tl-show-tl-istanbul').click();
    await expect(page.getByTestId('culture-detail').getByRole('heading', { level: 3 })).toHaveText(/Istanbul/);
    await expect(page.getByTestId('culture-detail').getByRole('heading', { level: 3 })).toBeFocused();
    await expectNoHorizontalOverflow(page);

    expect(errors).toEqual([]);
  });

  test('music is opt-in: “Listen while you explore” sets the culture mood only on click', async ({ page }) => {
    const errors = collectErrors(page);
    await seed(page);
    await page.goto('/#/culture?place=brazil');
    const detail = page.getByTestId('culture-detail');
    await expect(detail.getByText('Brazil · Bossa')).toBeVisible();
    const before = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '{}').prefs, STATE_KEY);
    expect(before.music).toBe(false);
    await page.getByTestId('culture-listen').click();
    await expect(page.getByTestId('culture-listen')).toHaveText('Stop the music');
    const after = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '{}').prefs, STATE_KEY);
    expect(after).toMatchObject({ music: true, musicMood: 'bossa' });
    await page.getByTestId('culture-listen').click();
    await expect(page.getByTestId('culture-listen')).toHaveText('Play this music');
    expect(errors).toEqual([]);
  });

  test('zh locale + home entry link', async ({ page }) => {
    const errors = collectErrors(page);
    await seed(page, 'zh');
    await page.goto('/#/');
    const track = page.locator('[data-track="culture"]');
    await expect(track).toBeVisible();
    const entry = page.getByTestId('home-culture-link');
    // Phone home: the culture track is a collapsed accordion — open it first.
    if (!(await entry.isVisible())) await track.locator('summary').click();
    await entry.click();
    await expect(page).toHaveURL(/#\/culture$/);
    await expect(page.getByRole('heading', { level: 1, name: '咖啡文化探索' })).toBeVisible();
    await expect(page.getByTestId('culture-timeline').getByTestId('legend-badge').first()).toHaveText('传说');
    await expect(page.getByTestId('culture-timeline').getByTestId('disputed-badge').first()).toHaveText('年代有争议');
    await page.getByRole('radio', { name: '列表' }).click();
    await page.getByTestId('list-place-tokyo').click();
    await expect(page.getByTestId('culture-detail').getByRole('heading', { level: 3 })).toHaveText(/东京/);
    await expectNoHorizontalOverflow(page);
    expect(errors).toEqual([]);
  });

  for (const scheme of ['light', 'dark'] as const) {
    test(`axe WCAG 2.1 A/AA clean (${scheme}): map + detail, list`, async ({ page }, info) => {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
      await seed(page);
      for (const url of ['/#/culture?place=kaffa', '/#/culture?view=list&place=istanbul']) {
        await page.goto(url);
        await expect(page.getByTestId('culture-detail')).toBeVisible();
        await page.waitForTimeout(150);
        const res = await new AxeBuilder({ page }).withTags(TAGS).analyze();
        const summary = res.violations.map((v) => ({
          id: v.id,
          n: v.nodes.length,
          targets: v.nodes.slice(0, 4).map((n) => n.target.join(' ')),
          msg: v.nodes[0]?.failureSummary?.split('\n').slice(0, 3).join(' | '),
        }));
        if (summary.length) console.log(`[axe ${scheme} ${info.project.name}] ${url}: ${JSON.stringify(summary)}`);
        expect(summary, `axe on ${url} (${scheme})`).toEqual([]);
      }
      await page.screenshot({ path: info.outputPath(`culture-${scheme}.png`), fullPage: false });
    });
  }
});
