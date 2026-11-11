/**
 * QA gate #2 (quality-guardian) — Coffee Brands, independent of brands.spec.ts.
 *  - every brand detail (35) in en and zh: "Checked in <year>", disclaimer, equipment safety notes
 *  - one language at a time: no CJK on en pages; Latin runs on zh pages INCLUDING the (collapsed) sources
 *  - link round trips: Atlas drink → brand → drink / lesson; brand lesson links resolve to a real lesson h1
 * Run: E2E_PORT=4209 E2E_DIST=.e2e/dist-qa E2E_OUT=.e2e/out-qa npx playwright test qa-brands --workers=6
 */
import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { brands } from '../../src/content';
import { ERROR_BOUNDARY_TEXT, collectErrors, seedProfile } from './qa-helpers';

test.use({ serviceWorkers: 'block' });
const LOG_DIR = path.resolve('.e2e/qa2-logs');

async function openAllDetails(page: Page) {
  await page.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true)));
}

for (const locale of ['en', 'zh'] as const) {
  test(`all ${brands.length} brand pages (${locale}): asOf, disclaimer, safety on hazardous gear, one language`, async ({ page, isMobile }) => {
    test.skip(isMobile, 'content sweep once');
    test.setTimeout(180_000);
    const errors = collectErrors(page);
    await seedProfile(page, { locale, reducedMotion: 'on' });
    const latin: Record<string, string[]> = {};
    const problems: string[] = [];
    for (const b of brands) {
      await page.goto(`/#/brands/${b.id}`);
      const detail = page.getByTestId('brand-detail');
      await expect(detail).toBeVisible();
      await expect(page.getByTestId('brand-asof')).toHaveText(locale === 'en' ? `Checked in ${b.asOf}` : `信息核对于 ${b.asOf} 年`);
      await expect(page.getByTestId('brand-disclaimer')).toContainText(locale === 'en' ? 'not affiliated' : '没有任何关联');
      if (b.kind === 'equipment' && !b.safetyNote) problems.push(`equipment brand without safety note: ${b.id}`);
      if (b.safetyNote) await expect(page.getByTestId('brand-safety')).toBeVisible();
      // body text = everything except the collapsed Sources list (reported separately as QA-B01)
      const text = await detail.evaluate((el) => {
        const c = el.cloneNode(true) as HTMLElement;
        c.querySelectorAll('details.br-sources').forEach((d) => d.remove());
        document.body.appendChild(c);
        const t = c.innerText;
        c.remove();
        return t;
      });
      if (locale === 'en') {
        const cjk = text.match(/[぀-ヿ一-鿿]+/g);
        if (cjk) problems.push(`${b.id}: CJK on en page: ${cjk.join(' ')}`);
      } else {
        const runs = text.match(/[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'’.\-]*(?:[ ,]+[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'’.\-]*)*/g) ?? [];
        const long = runs.filter((r) => r.split(/\s+/).length >= 3);
        if (long.length) latin[b.id] = long;
      }
    }
    fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.writeFileSync(path.join(LOG_DIR, `brands-${locale}-sweep.json`), JSON.stringify({ problems, latinRunsOnZh: latin }, null, 1));
    // equipment without a safety note is reported (QA-B03), not asserted here
    expect(problems.filter((p) => !p.startsWith('equipment brand without'))).toEqual([]);
    await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test('links: Atlas drink → brand → drink and → lesson (real lesson page); not-found → back to list', async ({ page, isMobile }) => {
  const errors = collectErrors(page);
  await seedProfile(page, { reducedMotion: 'on' });
  await page.goto('/#/atlas/caffe-latte');
  const section = page.getByTestId('drink-brands');
  await expect(section).toBeVisible();
  const link = section.getByTestId('drink-brand-starbucks');
  if (isMobile) await link.tap();
  else await link.click();
  await expect(page).toHaveURL(/#\/brands\/starbucks$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Starbucks' })).toBeVisible();
  // brand → drink
  await page.getByTestId('brand-drink-cappuccino').click();
  await expect(page).toHaveURL(/#\/atlas\/cappuccino$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Cappuccino');
  await page.goBack();
  // brand → every lesson link opens a real lesson (h1, no error boundary)
  const hrefs = await page.locator('a[href*="#/learn/"]').evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute('href')!));
  expect(hrefs.length).toBeGreaterThan(0);
  for (const h of hrefs) {
    await page.goto(h);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    await expect(page.getByText(/lesson isn.t here|没有找到这节课/i)).toHaveCount(0);
  }
  // not found
  await page.goto('/#/brands/no-such-brand');
  await expect(page.getByTestId('brand-not-found')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('That brand isn’t here');
  await page.getByRole('link', { name: '← All brands' }).last().click();
  await expect(page.getByTestId('brands-page')).toBeVisible();
  // Culture → brands
  await page.goto('/#/culture');
  await page.getByTestId('culture-brands-link').click();
  await expect(page.getByTestId('brands-page')).toBeVisible();
  expect(errors).toEqual([]);
});

test('every brand → lesson link across all brands resolves to an existing lesson', async ({ page, isMobile }) => {
  test.skip(isMobile, 'once');
  test.setTimeout(120_000);
  await seedProfile(page, { reducedMotion: 'on' });
  const lessonIds = [...new Set(brands.flatMap((b) => b.relatedLessonIds))];
  const bad: string[] = [];
  for (const id of lessonIds) {
    await page.goto(`/#/learn/${id}`);
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();
    if (await page.getByText(ERROR_BOUNDARY_TEXT).count()) bad.push(id);
  }
  expect(bad).toEqual([]);
});

test('QA-B01 [open, P2] zh brand pages: Sources list is one language (no English author notes such as "5 yuan in several reports")', async ({ page, isMobile }) => {
  test.skip(isMobile, 'once');
  test.fail(true, 'QA-B01: SourceRef.title/note are plain English strings rendered as-is in zh; notes include internal remarks and the Manner discount amount the content doc says is deliberately omitted');
  await seedProfile(page, { locale: 'zh', reducedMotion: 'on' });
  await page.goto('/#/brands/manner');
  await expect(page.getByTestId('brand-detail')).toBeVisible();
  await openAllDetails(page);
  const src = await page.locator('details.br-sources').innerText();
  expect(src).not.toMatch(/[A-Za-z]{3,}(?:\s+[A-Za-z]{2,}){3,}/);
});

test('QA-B02 [open, P2] every equipment brand that handles hot water or burrs carries a safety note (Melitta, Comandante, Timemore lack one)', async ({ page, isMobile }) => {
  test.skip(isMobile, 'once');
  test.fail(true, 'QA-B02: melitta (pour-over with hot water), comandante + timemore (hand grinders; Timemore kettles/scales) have no safetyNote while kalita/hario/baratza do');
  await seedProfile(page, { reducedMotion: 'on' });
  const missing: string[] = [];
  for (const id of ['melitta', 'comandante', 'timemore']) {
    await page.goto(`/#/brands/${id}`);
    await expect(page.getByTestId('brand-detail')).toBeVisible();
    if (!(await page.getByTestId('brand-safety').count())) missing.push(id);
  }
  expect(missing).toEqual([]);
});
