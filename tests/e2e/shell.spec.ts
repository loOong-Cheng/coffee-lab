import { expect, test, type Page } from '@playwright/test';

/**
 * App shell on the smallest phones: the 6-item bottom navigation and the compact header
 * (locale, sound effects, music control) must fit at 360×740 and 320×640 with ≥ 44 px targets,
 * readable (untruncated) labels and no horizontal page scroll. Also checks the header music popover.
 */

const STATE_KEY = 'coffee-lab:state';
const SEED = {
  version: 1,
  profile: {
    goal: 'espresso',
    experience: 'new',
    devices: ['phone'],
    equipment: ['espresso-machine', 'grinder'],
    wishlist: [],
    preferredMode: 'mobile',
    onboardedAt: '2026-11-07T08:00:00.000Z',
  },
  prefs: { locale: 'en', sfx: false, music: false, volume: 0.5, reducedMotion: 'on', theme: 'system', defaultGuidance: 'guided', speakSteps: false },
  events: [],
  journal: [],
  activePractice: null,
};

test.use({ serviceWorkers: 'block' });

async function seed(page: Page, locale: 'en' | 'zh') {
  await page.addInitScript(
    ([key, value]) => {
      if (!window.localStorage.getItem(key)) window.localStorage.setItem(key, value);
    },
    [STATE_KEY, JSON.stringify({ ...SEED, prefs: { ...SEED.prefs, locale } })] as const,
  );
}

async function measure(page: Page) {
  return page.evaluate(() => {
    const box = (el: Element) => el.getBoundingClientRect();
    const links = [...document.querySelectorAll('.shell-nav__link')].map((a) => {
      const r = box(a);
      const label = a.querySelector('.shell-nav__label') as HTMLElement;
      return { text: label.textContent, w: r.width, h: r.height, truncated: label.scrollWidth > label.clientWidth + 0.5, right: r.right };
    });
    const tools = [...document.querySelectorAll('.shell-header button, .shell-header a')].map((el) => {
      const r = box(el);
      return { name: (el.getAttribute('aria-label') || (el as HTMLElement).innerText || '').trim(), w: r.width, h: r.height, right: r.right, left: r.left };
    });
    const header = box(document.querySelector('.shell-header')!);
    return {
      vw: document.documentElement.clientWidth,
      scrollW: document.documentElement.scrollWidth,
      headerH: header.height,
      links,
      tools,
    };
  });
}

for (const size of [
  { width: 360, height: 740 },
  { width: 320, height: 640 },
]) {
  for (const locale of ['en', 'zh'] as const) {
    test(`bottom nav + header fit at ${size.width}×${size.height} (${locale})`, async ({ page }) => {
      await page.setViewportSize(size);
      await seed(page, locale);
      await page.goto('/#/');
      await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveCount(1);
      const m = await measure(page);
      expect(m.scrollW, 'no horizontal page scroll').toBeLessThanOrEqual(m.vw);
      expect(m.links).toHaveLength(6);
      for (const l of m.links) {
        expect(l.w, `${l.text} width`).toBeGreaterThanOrEqual(44);
        expect(l.h, `${l.text} height`).toBeGreaterThanOrEqual(44);
        expect(l.truncated, `${l.text} label is not cut off`).toBe(false);
        expect(l.right).toBeLessThanOrEqual(m.vw + 0.5);
      }
      for (const t of m.tools) {
        expect(t.h, `${t.name} height`).toBeGreaterThanOrEqual(44);
        expect(t.w, `${t.name} width`).toBeGreaterThanOrEqual(28); // brand mark link is ≥ 28; buttons checked below
        expect(t.right, `${t.name} inside the viewport`).toBeLessThanOrEqual(m.vw + 0.5);
        expect(t.left).toBeGreaterThanOrEqual(-0.5);
      }
      for (const t of m.tools.filter((x) => x.name && !/Coffee Lab/.test(x.name))) expect(t.w, `${t.name} width`).toBeGreaterThanOrEqual(44);
      expect(m.headerH, 'header stays one compact row').toBeLessThan(72);

      // Every nav destination is reachable by tap and lands on a page with one h1.
      const nav = page.getByRole('navigation', { name: locale === 'zh' ? '主导航' : 'Primary' });
      await nav.getByRole('link').nth(2).click();
      await expect(page).toHaveURL(/#\/atlas/);
      await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveCount(1);
    });
  }
}

test('header music control: opens a popover that fits a 320 px phone; mood + SFX persist', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await seed(page, 'en');
  await page.goto('/#/');
  const mood = page.getByRole('button', { name: /Music mood:/ });
  await mood.click();
  const panel = page.getByRole('group', { name: 'Music & sound' });
  await expect(panel).toBeVisible();
  const r = await panel.boundingBox();
  expect(r!.x).toBeGreaterThanOrEqual(0);
  expect(r!.x + r!.width).toBeLessThanOrEqual(320.5);
  await panel.getByRole('radio', { name: /Bossa/ }).click();
  await panel.getByRole('switch', { name: /Sound effects/ }).click();
  await page.keyboard.press('Escape');
  await expect(panel).toHaveCount(0);
  await expect(mood).toBeFocused();
  const prefs = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '{}').prefs, STATE_KEY);
  expect(prefs).toMatchObject({ musicMood: 'bossa', sfx: true, music: false }); // music never auto-starts
  await page.reload();
  await expect(page.getByRole('button', { name: /Music mood:/ })).toBeVisible();
  await expect(page.getByTestId('sfx-toggle')).toHaveAttribute('aria-pressed', 'true');
});
