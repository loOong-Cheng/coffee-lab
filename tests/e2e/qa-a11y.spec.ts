/**
 * QA (quality-guardian) — axe-core WCAG 2.0/2.1 A+AA scan of key screens, desktop + Pixel 7,
 * light and dark. Known real violations are tracked as bug IDs in reports/QA_LOG.md and asserted
 * with test.fail() so the suite stays green until they are fixed (then the marker must be removed).
 * Run isolated: E2E_PORT=4181 E2E_DIST=.e2e/dist-qa E2E_OUT=.e2e/out-qa npx playwright test qa-a11y
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { getLesson } from '../../src/content';
import { STATE_KEY } from './qa-helpers';

// Service workers blocked for determinism (PWA toast timing); PWA behaviour is tested in blocks that re-allow them.
test.use({ serviceWorkers: 'block' });

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const ENTRY = {
  id: 'brew_qa1',
  evidence: 'self_report',
  drinkId: 'espresso-shot',
  createdAt: '2026-11-07T10:00:00.000Z',
  doseG: 18,
  outG: 36,
  timeSec: 27,
  taste: ['balanced'],
  notes: 'QA seeded cup',
};

async function seedWithJournal(page: Page) {
  await page.addInitScript(
    ([key, entry]) => {
      if (window.localStorage.getItem(key)) return;
      window.localStorage.setItem(
        key,
        JSON.stringify({
          version: 1,
          profile: {
            goal: 'espresso',
            experience: 'new',
            devices: ['pc', 'phone'],
            equipment: ['espresso-machine', 'grinder', 'tamper', 'scale'],
            wishlist: [],
            preferredMode: 'desktop',
            onboardedAt: '2026-11-07T08:00:00.000Z',
          },
          prefs: { locale: 'en', sfx: false, music: false, volume: 0.5, reducedMotion: 'on', theme: 'system', defaultGuidance: 'guided', speakSteps: false },
          events: [],
          journal: [JSON.parse(entry)],
          activePractice: null,
        }),
      );
    },
    [STATE_KEY, JSON.stringify(ENTRY)] as const,
  );
}

const idx = (lesson: string, activity: string) => getLesson(lesson)!.activityIds.indexOf(activity) + 1;

interface Screen {
  name: string;
  url: string;
  ready: (p: Page) => Promise<void>;
  /** Bug ID if this screen currently has a known, logged violation. */
  knownBug?: string;
}

const SCREENS: Screen[] = [
  { name: 'home', url: '/#/', ready: (p) => expect(p.getByTestId('home-next-lesson')).toBeVisible() },
  { name: 'onboarding', url: '/#/onboarding?edit=1', ready: (p) => expect(p.getByTestId('onboarding-next')).toBeVisible() },
  { name: 'lesson intro', url: '/#/learn/esp-ratio-lab', ready: (p) => expect(p.getByTestId('lesson-start')).toBeVisible() },
  { name: 'lesson quiz', url: `/#/learn/esp-workflow?step=${idx('esp-workflow', 'esp-workflow-quiz')}&g=guided`, ready: (p) => expect(p.getByTestId('activity-quiz')).toBeVisible() },
  { name: 'lesson sequence', url: `/#/learn/esp-workflow?step=${idx('esp-workflow', 'esp-workflow-order')}&g=assisted`, ready: (p) => expect(p.getByTestId('activity-sequence')).toBeVisible() },
  { name: 'lesson ratio lab', url: `/#/learn/esp-ratio-lab?step=${idx('esp-ratio-lab', 'esp-ratio-lab-sim')}&g=guided`, ready: (p) => expect(p.getByTestId('activity-lab')).toBeVisible() },
  { name: 'lesson identify', url: `/#/learn/esp-meet-the-machine?step=${idx('esp-meet-the-machine', 'esp-meet-the-machine-identify')}&g=guided`, ready: (p) => expect(p.getByTestId('activity-identify')).toBeVisible() },
  { name: 'lesson diagnose', url: `/#/learn/esp-diagnosis?step=${idx('esp-diagnosis', 'esp-diagnosis-scenarios')}&g=guided`, ready: (p) => expect(p.getByTestId('activity-diagnose')).toBeVisible() },
  { name: 'kitchen preflight', url: '/#/practice/esp-first-real-shot-guide', ready: (p) => expect(p.getByTestId('practice-start')).toBeVisible() },
  {
    name: 'kitchen step',
    url: '/#/practice/esp-first-real-shot-guide',
    ready: async (p) => {
      await p.getByTestId('practice-start').click();
      await expect(p.getByTestId('practice-step')).toBeVisible();
    },
  },
  { name: 'journal list', url: '/#/journal', ready: (p) => expect(p.getByTestId('journal-list')).toBeVisible() },
  { name: 'journal entry', url: `/#/journal?entry=${ENTRY.id}`, ready: (p) => expect(p.getByTestId('journal-entry')).toBeVisible() },
  { name: 'atlas list', url: '/#/atlas', ready: (p) => expect(p.getByTestId('atlas-count')).toBeVisible() },
  { name: 'atlas detail', url: '/#/atlas/caffe-latte', ready: (p) => expect(p.getByTestId('drink-detail')).toBeVisible() },
  { name: 'settings', url: '/#/settings', ready: (p) => expect(p.getByTestId('reset-all')).toBeVisible() },
  { name: 'xr intro', url: '/#/xr?mission=espresso-first-shot', ready: (p) => expect(p.getByTestId('xr-play-list')).toBeVisible() },
  {
    name: 'xr action-list player',
    url: '/#/xr?mission=espresso-first-shot',
    ready: async (p) => {
      await p.getByTestId('xr-play-list').click();
      await expect(p.getByTestId('xr-station-status')).toBeVisible();
    },
  },
];

/** QA-03 (label-content-name-mismatch) is fixed, so no rule is exempted any more. */
const KNOWN_RULES = new Set<string>([]);

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`axe ${scheme}`, () => {
    for (const s of SCREENS) {
      test(`${s.name}`, async ({ page }, info) => {
        await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
        await seedWithJournal(page);
        await page.goto(s.url);
        await s.ready(page);
        await page.waitForTimeout(150);
        const res = await new AxeBuilder({ page }).withTags(TAGS).analyze();
        const summary = res.violations.filter((v) => !KNOWN_RULES.has(v.id)).map((v) => ({
          id: v.id,
          impact: v.impact,
          n: v.nodes.length,
          targets: v.nodes.slice(0, 4).map((n) => n.target.join(' ')),
          msg: v.nodes[0]?.failureSummary?.split('\n').slice(0, 3).join(' | '),
        }));
        await info.attach('axe-violations.json', { body: JSON.stringify(summary, null, 2), contentType: 'application/json' });
        if (summary.length) console.log(`[axe ${scheme} ${info.project.name}] ${s.name}: ${JSON.stringify(summary)}`);
        expect(summary, `axe violations on ${s.name} (${scheme})`).toEqual([]);
      });
    }
  });
}

test.describe('fixed a11y bugs (regression)', () => {
  test('QA-03 (P2): visible label is part of the accessible name (WCAG 2.5.3) — locale toggle + identify pins', async ({ page }) => {
    await seedWithJournal(page);
    for (const url of ['/#/', `/#/learn/esp-meet-the-machine?step=${idx('esp-meet-the-machine', 'esp-meet-the-machine-identify')}&g=guided`]) {
      await page.goto(url);
      await expect(page.getByRole('main').getByRole('heading', { level: 1 }).first()).toBeVisible();
      const res = await new AxeBuilder({ page }).withRules(['label-content-name-mismatch']).analyze();
      expect(res.violations.map((v) => v.id), url).toEqual([]);
    }
    // Quiz mode: pins show only a number and are named "Part N" — still label-in-name, answer not leaked.
    await page.getByTestId('identify-start').click();
    const pin = page.locator('.cl-diagram__pins button').first();
    await expect(pin).toHaveAccessibleName(/^(Part|部件) 1$/);
    const res = await new AxeBuilder({ page }).withRules(['label-content-name-mismatch']).analyze();
    expect(res.violations.map((v) => v.id), 'identify quiz mode').toEqual([]);
  });
});
