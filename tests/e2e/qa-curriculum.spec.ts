/**
 * QA (quality-guardian) — P0 "≥3 complete beginner modules": every CORE lesson (literacy, espresso,
 * pour-over) is playable end-to-end at the guided tier in the 2D lesson player and reaches
 * "completed" from its own checks — no real-world or XR step is required (single-platform rule).
 */
import { expect, test } from '@playwright/test';
import { lessons, isCoreTrack } from '../../src/content';
import { collectErrors, playWholeLesson, readState, seedProfile } from './qa-helpers';

// Service workers blocked for determinism (PWA toast timing); PWA behaviour is tested in blocks that re-allow them.
test.use({ serviceWorkers: 'block' });

const core = lessons.filter((l) => isCoreTrack(l.track));

test.describe('every core lesson is completable in 2D', () => {
  test.skip(({ isMobile }) => isMobile, 'curriculum sweep runs once (desktop); mobile layout covered elsewhere');
  test(`${core.length} core lessons across ${new Set(core.map((l) => l.track)).size} tracks`, async ({ page }) => {
    test.setTimeout(300_000);
    const errors = collectErrors(page);
    await seedProfile(page, { devices: ['pc'] });
    expect(new Set(core.map((l) => l.track)).size).toBeGreaterThanOrEqual(3);
    for (const l of core) {
      await playWholeLesson(page, l.id);
      await expect(page.getByTestId('lesson-complete'), l.id).toHaveAttribute('data-status', 'completed');
    }
    await page.goto('/#/');
    await expect(page.getByTestId('stat-mastered')).toHaveText(`${core.length}/${core.length}`);
    const st = await readState(page);
    expect(st.events.filter((e: { evidence: string; mode: string }) => e.evidence === 'self_report' && e.mode === 'real-world-guide')).toHaveLength(0);
    expect(errors).toEqual([]);
  });
});
