/**
 * Coffee Brands (/brands, /brands/:brandId) — desktop 1280×800 + Pixel 7, production build.
 * List → kind filter → detail, zh toggle, Atlas/Culture → brands entry points, not-found,
 * ≥44 px tap targets on phone, axe WCAG 2.1 A/AA (light + dark), no console errors / overflow.
 * Run isolated: E2E_PORT=4202 E2E_DIST=.e2e/dist-brands E2E_OUT=.e2e/out-brands npx playwright test tests/e2e/brands.spec.ts
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { brands, drinks } from '../../src/content';
import { collectErrors, seedProfile } from './qa-helpers';

test.use({ serviceWorkers: 'block' });

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const equipment = brands.filter((b) => b.kind === 'equipment');
const safetyBrand = equipment.find((b) => b.safetyNote)!;
const latteBrand = brands.find((b) => b.relatedDrinkIds.includes('caffe-latte'))!;

async function noOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, 'horizontal overflow (px)').toBeLessThanOrEqual(1);
}

/** Runs of 4+ Latin words in visible main text = un-localised UI copy (same heuristic as qa-ux). */
async function englishLeftovers(page: Page) {
  const main = await page.getByRole('main').innerText();
  return main.match(/\b[A-Za-z][A-Za-z'’]+(?:[ ,]+[A-Za-z][A-Za-z'’]+){3,}/g) ?? [];
}

test.beforeEach(async ({ page }) => {
  await seedProfile(page, { reducedMotion: 'on' });
});

test('list → kind filter → detail shows learn, safety, asOf, sources and disclaimer', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/#/brands');
  await expect(page.getByRole('heading', { level: 1, name: 'Coffee Brands' })).toBeVisible();
  await expect(page.getByTestId('brands-count')).toHaveText(`Showing ${brands.length} of ${brands.length} brands`);
  await expect(page).toHaveTitle(/Coffee Brands/);
  await noOverflow(page);

  await page.getByTestId('brands-kind-equipment').click();
  await expect(page).toHaveURL(/kind=equipment/);
  await expect(page.getByTestId('brands-count')).toHaveText(`Showing ${equipment.length} of ${brands.length} brands`);
  await expect(page.locator('[data-testid^="brand-card-"]')).toHaveCount(equipment.length);

  await page.getByTestId('brands-search').fill(safetyBrand.name.en);
  await expect(page.getByTestId(`brand-card-${safetyBrand.id}`)).toBeVisible();
  await page.getByTestId(`brand-card-${safetyBrand.id}`).getByRole('link').click();

  const detail = page.getByTestId('brand-detail');
  await expect(detail.getByRole('heading', { level: 1, name: safetyBrand.name.en })).toBeVisible();
  await expect(page).toHaveTitle(new RegExp(safetyBrand.name.en.replace(/[()]/g, '.')));
  await expect(detail.getByRole('heading', { name: 'What a beginner can learn' })).toBeVisible();
  await expect(page.getByTestId('brand-safety')).toContainText(safetyBrand.safetyNote!.en);
  await expect(page.getByTestId('brand-asof')).toHaveText(`Checked in ${safetyBrand.asOf}`);
  await expect(page.getByTestId('brand-disclaimer')).toContainText('not affiliated');
  await detail.locator('summary', { hasText: 'Sources' }).click();
  await expect(detail.locator('.br-sources li').first()).toBeVisible();
  await noOverflow(page);

  await page.getByRole('link', { name: '← All brands' }).click();
  await expect(page.getByTestId('brands-page')).toBeVisible();
  expect(errors).toEqual([]);
});

test('zh toggle localises list and detail', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/#/brands');
  await expect(page.getByTestId('brands-page')).toBeVisible();
  await page.getByTestId('locale-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.getByRole('heading', { level: 1, name: '咖啡品牌' })).toBeVisible();
  await expect(page.getByTestId('brands-count')).toHaveText(`显示 ${brands.length} / ${brands.length} 个品牌`);
  expect(await englishLeftovers(page), 'English leftovers on /brands (zh)').toEqual([]);

  await page.goto(`/#/brands/${safetyBrand.id}`);
  await expect(page.getByRole('heading', { level: 1, name: safetyBrand.name.zh })).toBeVisible();
  await expect(page.getByRole('heading', { name: '新手能从中学到什么' })).toBeVisible();
  await expect(page.getByTestId('brand-safety')).toContainText(safetyBrand.safetyNote!.zh);
  expect(await englishLeftovers(page), 'English leftovers on brand detail (zh)').toEqual([]);
  expect(errors).toEqual([]);
});

test('entry points: Atlas header, Culture header and drink detail reverse lookup', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/#/atlas');
  await page.getByTestId('atlas-brands-link').click();
  await expect(page.getByTestId('brands-page')).toBeVisible();

  await page.goto('/#/culture');
  await page.getByTestId('culture-brands-link').click();
  await expect(page.getByTestId('brands-page')).toBeVisible();

  await page.goto('/#/atlas/caffe-latte');
  const section = page.getByTestId('drink-brands');
  await expect(section.getByRole('heading', { name: 'Brands known for this' })).toBeVisible();
  await expect(section.getByRole('link')).toHaveCount(brands.filter((b) => b.relatedDrinkIds.includes('caffe-latte')).length);
  await section.getByTestId(`drink-brand-${latteBrand.id}`).click();
  await expect(page.getByRole('heading', { level: 1, name: latteBrand.name.en })).toBeVisible();
  // …and back to the drink from the brand.
  await page.getByTestId('brand-drink-caffe-latte').click();
  await expect(page.getByTestId('drink-detail')).toBeVisible();

  // A drink no brand lists has no section.
  const unlisted = drinks.find((d) => !brands.some((b) => b.relatedDrinkIds.includes(d.id)));
  if (unlisted) {
    await page.goto(`/#/atlas/${unlisted.id}`);
    await expect(page.getByTestId('drink-detail')).toBeVisible();
    await expect(page.getByTestId('drink-brands')).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});

test('unknown brand id → friendly not-found with a way back', async ({ page }) => {
  await page.goto('/#/brands/not-a-brand');
  await expect(page.getByTestId('brand-not-found')).toBeVisible();
  await expect(page.getByText('That brand isn’t here').first()).toBeVisible();
  await page.getByRole('link', { name: '← All brands' }).click();
  await expect(page.getByTestId('brands-page')).toBeVisible();
});

test('phone: interactive targets are at least 44 px', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone-only check');
  for (const url of ['/#/brands', `/#/brands/${safetyBrand.id}`]) {
    await page.goto(url);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const small = await page.evaluate(() => {
      const out: string[] = [];
      for (const el of Array.from(document.querySelectorAll<HTMLElement>('main a, main button, main input, main summary'))) {
        if (el.closest('.cl-visually-hidden') || !el.checkVisibility()) continue;
        // Stretched card link: the whole card is the target.
        const r = (el.classList.contains('br-card__link') ? el.closest('.br-card')! : el).getBoundingClientRect();
        if (r.width < 43.5 || r.height < 43.5) out.push(`${el.tagName} "${el.innerText.trim().slice(0, 24)}" ${Math.round(r.width)}×${Math.round(r.height)}`);
      }
      return out;
    });
    expect(small, `targets under 44 px on ${url}`).toEqual([]);
    await noOverflow(page);
  }
});

for (const scheme of ['light', 'dark'] as const) {
  test(`axe WCAG 2.1 A/AA — list and detail (${scheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
    for (const url of ['/#/brands', `/#/brands/${safetyBrand.id}`, '/#/brands?kind=cafe-chain']) {
      await page.goto(url);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const res = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      expect(
        res.violations.map((v) => `${v.id}: ${v.nodes.length}`),
        `axe ${url} (${scheme})`,
      ).toEqual([]);
    }
  });
}
