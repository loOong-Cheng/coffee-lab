/**
 * Regression: onboarding "How do you prefer to learn?" cards must keep their content inside the card.
 * Bug (user screenshot, 2026-11-10): the "Suggested for this device" badge ran past the card's right edge and the
 * description was clipped, because the stacked option's text column could not shrink below its no-wrap title row.
 */
import { expect, test, type Page } from '@playwright/test';
import { seedProfile } from './qa-helpers';

async function openModeStep(page: Page) {
  await page.goto('/#/onboarding?edit=1');
  for (let i = 0; i < 4; i++) await page.getByTestId('onboarding-next').click();
  await expect(page.getByTestId('onboarding-finish')).toBeVisible();
}

/** Every descendant of each stacked option card must sit inside the card (no horizontal overflow). */
async function overflowingParts(page: Page) {
  return page.evaluate(() => {
    const out: string[] = [];
    for (const card of document.querySelectorAll<HTMLElement>('.cl-seg--stacked .cl-seg__opt')) {
      const box = card.getBoundingClientRect();
      if (card.scrollWidth > card.clientWidth + 1) out.push(`${card.dataset.value}: scrollWidth ${card.scrollWidth} > ${card.clientWidth}`);
      for (const el of card.querySelectorAll<HTMLElement>('*')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0) continue;
        if (r.right > box.right + 1 || r.left < box.left - 1) {
          out.push(`${card.dataset.value}: <${el.tagName.toLowerCase()} class="${el.className}"> ${Math.round(r.left)}–${Math.round(r.right)} outside ${Math.round(box.left)}–${Math.round(box.right)}`);
        }
      }
    }
    return out;
  });
}

for (const locale of ['en', 'zh'] as const) {
  for (const width of [null, 320] as const) {
    test(`mode cards keep badge and description inside the card (${locale}${width ? `, ${width}px` : ''})`, async ({ page }) => {
      if (width) await page.setViewportSize({ width, height: 720 });
      await seedProfile(page, { locale });
      await openModeStep(page);
      const suggested = page.locator('.cl-seg--stacked .ob-suggested');
      await expect(suggested).toHaveCount(1);
      await expect(suggested).toBeVisible();
      expect(await overflowingParts(page)).toEqual([]);
    });
  }
}
