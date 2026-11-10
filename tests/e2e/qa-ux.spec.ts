/**
 * QA (quality-guardian) — zh locale pass, layout sanity (390×844 phone / 1280×800 desktop),
 * touch-target audit, and evidence screenshots saved to reports/screenshots/.
 * Run isolated: E2E_PORT=4181 E2E_DIST=.e2e/dist-qa E2E_OUT=.e2e/out-qa npx playwright test qa-ux
 */
import { expect, test, type Page } from '@playwright/test';
import { getLesson } from '../../src/content';
import { ERROR_BOUNDARY_TEXT, collectErrors, seedProfile } from './qa-helpers';

// Service workers blocked for determinism (PWA toast timing); PWA behaviour is tested in blocks that re-allow them.
test.use({ serviceWorkers: 'block' });

const idx = (lesson: string, activity: string) => getLesson(lesson)!.activityIds.indexOf(activity) + 1;

interface Screen {
  name: string;
  url: string;
  ready: (p: Page) => Promise<void>;
}

const SCREENS: Screen[] = [
  { name: 'home', url: '/#/', ready: (p) => expect(p.getByTestId('home-next-lesson')).toBeVisible() },
  { name: 'onboarding', url: '/#/onboarding?edit=1', ready: (p) => expect(p.getByTestId('onboarding-next')).toBeVisible() },
  { name: 'lesson-quiz', url: `/#/learn/esp-workflow?step=${idx('esp-workflow', 'esp-workflow-quiz')}&g=guided`, ready: (p) => expect(p.getByTestId('activity-quiz')).toBeVisible() },
  { name: 'lesson-ratio-lab', url: `/#/learn/esp-ratio-lab?step=${idx('esp-ratio-lab', 'esp-ratio-lab-sim')}&g=guided`, ready: (p) => expect(p.getByTestId('activity-lab')).toBeVisible() },
  {
    name: 'kitchen-step',
    url: '/#/practice/esp-first-real-shot-guide',
    ready: async (p) => {
      await p.getByTestId('practice-start').click();
      await expect(p.getByTestId('practice-step')).toBeVisible();
    },
  },
  { name: 'journal', url: '/#/journal', ready: (p) => expect(p.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible() },
  { name: 'atlas', url: '/#/atlas', ready: (p) => expect(p.getByTestId('atlas-count')).toBeVisible() },
  { name: 'atlas-detail', url: '/#/atlas/caffe-latte', ready: (p) => expect(p.getByTestId('drink-detail')).toBeVisible() },
  { name: 'settings', url: '/#/settings', ready: (p) => expect(p.getByTestId('reset-all')).toBeVisible() },
  { name: 'xr-intro', url: '/#/xr?mission=espresso-first-shot', ready: (p) => expect(p.getByTestId('xr-play-list')).toBeVisible() },
];

async function sizeFor(page: Page, isMobile: boolean) {
  if (isMobile) await page.setViewportSize({ width: 390, height: 844 });
}

test.describe('zh locale pass', () => {
  for (const s of SCREENS) {
    test(`${s.name} renders in Chinese without English leftovers`, async ({ page, isMobile }) => {
      const errors = collectErrors(page);
      await sizeFor(page, isMobile);
      await seedProfile(page, { locale: 'zh' });
      await page.goto(s.url);
      await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
      // Readiness via test ids only (labels differ per locale).
      if (s.name === 'kitchen-step') {
        await page.getByTestId('practice-start').click();
        await expect(page.getByTestId('practice-step')).toBeVisible();
      } else if (s.name === 'journal') {
        await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible();
      } else {
        await s.ready(page).catch(async () => {
          await expect(page.getByRole('main').getByRole('heading', { level: 1 }).first()).toBeVisible();
        });
      }
      const h1 = (await page.getByRole('main').getByRole('heading', { level: 1 }).first().textContent()) ?? '';
      expect(h1, 'h1 is Chinese').toMatch(/[一-鿿]/);
      const main = await page.getByRole('main').innerText();
      // Runs of 4+ Latin words are UI copy that was not localised (brand names, units and sources excluded).
      const ALLOW = /(Coffee Lab|WebXR|SCA|World Coffee Research|Specialty Coffee Association|James Hoffmann|Scientific Reports|Journal of Food Science|https?:\/\/\S+)/g;
      const leftovers = (main.replace(ALLOW, '').match(/\b[A-Za-z][A-Za-z'’]+(?:[ ,]+[A-Za-z][A-Za-z'’]+){3,}/g) ?? []).slice(0, 8);
      expect(leftovers, `English leftovers on ${s.name} (zh)`).toEqual([]);
      await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
      expect(errors).toEqual([]);
    });
  }
});

test.describe('layout sanity + evidence screenshots', () => {
  for (const s of SCREENS) {
    test(`${s.name}: no horizontal overflow, no tiny targets`, async ({ page, isMobile }, info) => {
      const errors = collectErrors(page);
      await sizeFor(page, isMobile);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await seedProfile(page);
      await page.goto(s.url);
      await s.ready(page);
      await page.waitForTimeout(150);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, 'horizontal overflow (px)').toBeLessThanOrEqual(0);

      // Touch targets: hard floor 24×24 (WCAG 2.2 AA); on the phone also report anything under 44 px.
      const small = await page.evaluate((mobile) => {
        const out: Array<{ el: string; w: number; h: number }> = [];
        const els = document.querySelectorAll<HTMLElement>('main a[href], main button, main input:not([type=hidden]), main select, main summary, main [role=radio], main [role=switch], nav a[href], header button');
        for (const el of els) {
          let r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          const cs = getComputedStyle(el);
          if (cs.visibility === 'hidden') continue;
          // Visually-hidden inputs operated through a visible button/label are not targets themselves.
          if (el.classList.contains('cl-visually-hidden') || (r.width <= 1 && r.height <= 1)) continue;
          // Stretched-link pattern: an absolutely positioned ::after makes the whole card clickable.
          const after = getComputedStyle(el, '::after');
          if (after.position === 'absolute' && after.content !== 'none') {
            let host: HTMLElement | null = el.parentElement;
            while (host && getComputedStyle(host).position === 'static') host = host.parentElement;
            if (host) r = host.getBoundingClientRect();
          }
          // Inline links inside running text are exempt (WCAG 2.5.8 inline exception).
          if (el.tagName === 'A' && cs.display === 'inline' && el.closest('p, li') && !el.className) continue;
          const min = mobile ? 44 : 24;
          if (r.width < min - 0.5 || r.height < min - 0.5) {
            out.push({ el: `${el.tagName.toLowerCase()}${el.getAttribute('data-testid') ? `[${el.getAttribute('data-testid')}]` : ''}.${String(el.className).split(' ')[0]} "${(el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 30)}"`, w: Math.round(r.width), h: Math.round(r.height) });
          }
        }
        return out;
      }, isMobile);
      const under24 = small.filter((x) => x.w < 24 || x.h < 24);
      info.annotations.push({ type: `targets-under-${isMobile ? 44 : 24}px`, description: JSON.stringify(small.slice(0, 12)) });
      if (small.length) console.log(`[targets ${info.project.name}] ${s.name}: ${JSON.stringify(small.slice(0, 12))}`);
      expect(under24, 'targets below the 24×24 WCAG 2.2 floor').toEqual([]);

      const shotNames: Record<string, string> = {
        home: 'home',
        'lesson-quiz': 'lesson-activity-quiz',
        'lesson-ratio-lab': 'lesson-activity-ratio-lab',
        'kitchen-step': 'kitchen-mode-step',
        'atlas-detail': 'atlas-detail',
        'xr-intro': 'xr-intro',
      };
      if (shotNames[s.name]) {
        await page.screenshot({ path: `reports/screenshots/${shotNames[s.name]}-${isMobile ? 'mobile-390' : 'desktop-1280'}.png`, fullPage: false });
      }
      await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
      expect(errors).toEqual([]);
    });
  }
});

test.describe('PWA notices (commit 36c5ab8/204e096; fixed in a9eb479)', () => {
  test.use({ serviceWorkers: 'allow' });
  /** First load → wait until the service worker is active and controls the page (= offline-ready). */
  async function waitOfflineReady(page: Page) {
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 30_000 });
  }

  test('QA-04 (P2): offline readiness is never shown as duplicate toasts — it is a status line in Settings', async ({ page }) => {
    test.setTimeout(60_000);
    await seedProfile(page);
    await page.goto('/#/');
    await expect(page.getByTestId('home-next-lesson')).toBeVisible();
    await waitOfflineReady(page);
    await page.waitForTimeout(1_500); // a notice reacting to the install would be on screen by now
    await expect(page.locator('.cl-toast__title', { hasText: 'Ready to work offline' })).toHaveCount(0);
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Settings' }).click();
    await expect(page.getByTestId('settings-offline-status')).toHaveText(/Offline: ready/);
  });

  test('QA-02 (P1): on a phone no offline notice ever covers the bottom navigation', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'bottom navigation is the phone layout');
    test.setTimeout(60_000);
    await seedProfile(page, { devices: ['phone'], preferredMode: 'mobile' });
    await page.goto('/#/journal');
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Learn' }).click(); // thumb rests on the nav
    await waitOfflineReady(page);
    await page.waitForTimeout(1_500);
    // No toast overlaps the bottom bar (phone toasts sit at the top, and the offline-ready toast is gone).
    const overlap = await page.evaluate(() => {
      const nav = document.querySelector('.shell-nav')?.getBoundingClientRect();
      if (!nav) return 'no nav';
      return [...document.querySelectorAll('.cl-toast')].some((t) => {
        const r = t.getBoundingClientRect();
        return r.bottom > nav.top && r.top < nav.bottom;
      });
    });
    expect(overlap).toBe(false);
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Atlas' }).click({ timeout: 3_000 });
    await expect(page.getByRole('heading', { level: 1, name: 'Drink Atlas' })).toBeVisible();
  });
});
