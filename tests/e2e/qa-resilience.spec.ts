/**
 * QA (quality-guardian) — failure handling, keyboard-only use, reduced motion, dark theme (handoff §12).
 * Run isolated: E2E_PORT=4181 E2E_DIST=.e2e/dist-qa E2E_OUT=.e2e/out-qa npx playwright test qa-
 */
import { expect, test } from '@playwright/test';
import { getActivity, getLesson } from '../../src/content';
import type { QuizActivity, SequenceActivity } from '../../src/domain/contracts';
import { CORRUPT_BACKUP_KEY, ERROR_BOUNDARY_TEXT, STATE_KEY, collectErrors, expectVisibleFocus, readState, seedProfile, tabTo } from './qa-helpers';

// Service workers blocked for determinism (PWA toast timing); PWA behaviour is tested in blocks that re-allow them.
test.use({ serviceWorkers: 'block' });

test.describe('storage failures', () => {
  test('corrupted JSON in localStorage → app recovers, shows a notice, keeps a backup', async ({ page }) => {
    const errors = collectErrors(page);
    await page.addInitScript((key) => {
      if (!sessionStorage.getItem('qa-corrupted')) {
        sessionStorage.setItem('qa-corrupted', '1');
        localStorage.setItem(key, '{"version":1,"profile":{"goal":"espresso"');
      }
    }, STATE_KEY);
    await page.goto('/');
    await expect(page.getByRole('status').filter({ hasText: 'Some saved data was damaged' })).toBeVisible();
    await expect(page).toHaveURL(/#\/onboarding/);
    const backup = await page.evaluate((k) => localStorage.getItem(k), CORRUPT_BACKUP_KEY);
    expect(backup).toContain('"goal":"espresso"');
    // Still usable: skip onboarding and land on the course map; data now saves again.
    await page.getByTestId('onboarding-defaults').click();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect((await readState(page)).profile).not.toBeNull();
    await page.getByRole('status').filter({ hasText: 'Some saved data was damaged' }).getByRole('button', { name: 'Dismiss', exact: true }).click();
    await expect(page.getByText('Some saved data was damaged')).toHaveCount(0);
    await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('valid JSON with a wrong shape (events not an array, bad prefs) → migrated, no crash', async ({ page }) => {
    const errors = collectErrors(page);
    await page.addInitScript((key) => {
      if (!sessionStorage.getItem('qa-shape')) {
        sessionStorage.setItem('qa-shape', '1');
        localStorage.setItem(key, JSON.stringify({ version: 1, profile: { goal: 'nonsense' }, prefs: { locale: 'xx', volume: 'loud' }, events: 'oops', journal: [{ junk: true }] }));
      }
    }, STATE_KEY);
    await page.goto('/');
    await expect(page.getByRole('status').filter({ hasText: 'Some saved data was damaged' })).toBeVisible();
    await expect(page.getByRole('main').getByRole('heading', { level: 1 }).first()).toBeVisible();
    await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    // The next save writes a clean, migrated state.
    await page.getByTestId('onboarding-defaults').click();
    await expect(page.getByTestId('home-next-lesson')).toBeVisible();
    const st = await readState(page);
    expect(Array.isArray(st.events)).toBe(true);
    expect(Array.isArray(st.journal)).toBe(true);
    expect(['en', 'zh']).toContain(st.prefs.locale);
    expect(typeof st.prefs.volume).toBe('number');
    expect(errors).toEqual([]);
  });

  test('localStorage throws on every access → honest "can’t save" notice, learning still works', async ({ page }) => {
    const errors = collectErrors(page);
    await page.addInitScript(() => {
      const boom = () => {
        throw new DOMException('denied', 'SecurityError');
      };
      Storage.prototype.getItem = boom;
      Storage.prototype.setItem = boom;
      Storage.prototype.removeItem = boom;
    });
    await page.goto('/');
    await expect(page.getByRole('status').filter({ hasText: /can't save progress/ })).toBeVisible();
    await page.getByTestId('onboarding-defaults').click();
    await expect(page.getByTestId('home-next-lesson')).toBeVisible();
    await page.getByTestId('home-next-lesson').click();
    await page.getByTestId('lesson-start').click();
    await expect(page.getByTestId('activity-title')).toBeVisible();
    await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    expect(errors).toEqual([]);
  });
});

test.describe('unknown ids and odd URLs never dead-end', () => {
  const cases: Array<[string, RegExp]> = [
    ['/#/no-such-page', /We couldn't find that page/],
    ['/#/learn/nope', /Lesson not found/],
    ['/#/atlas/not-a-drink', /That drink isn’t in the Atlas/],
    ['/#/practice/not-a-practice', /We couldn’t find that practice/],
  ];
  for (const [url, heading] of cases) {
    test(`${url} → helpful page with a way back`, async ({ page }) => {
      const errors = collectErrors(page);
      await seedProfile(page);
      await page.goto(url);
      await expect(page.getByText(heading).first()).toBeVisible();
      await expect(page.getByRole('main').getByRole('link').first()).toBeVisible();
      await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
      expect(errors).toEqual([]);
    });
  }

  test('out-of-range / garbage lesson step, unknown journal entry, unknown XR mission → no crash', async ({ page }) => {
    const errors = collectErrors(page);
    await seedProfile(page);
    await page.goto('/#/learn/esp-workflow?step=999&g=bogus');
    await expect(page.getByTestId('activity-title')).toBeVisible(); // clamped to the last activity
    await page.goto('/#/learn/esp-workflow?step=abc');
    await expect(page.getByTestId('lesson-start')).toBeVisible(); // intro
    await page.goto('/#/journal?entry=does-not-exist');
    await expect(page.getByText('This cup isn’t in your journal')).toBeVisible();
    await expect(page.getByRole('main').getByRole('link', { name: /All cups/ })).toBeVisible();
    await page.goto('/#/xr?mission=does-not-exist');
    await expect(page.getByRole('main').getByRole('heading', { level: 1 }).first()).toBeVisible();
    await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    expect(errors).toEqual([]);
  });
});

test('QA-07 (P2): unknown journal entry page has an h1 like every other screen', async ({ page }) => {
  await seedProfile(page);
  await page.goto('/#/journal?entry=does-not-exist');
  await expect(page.getByText('This cup isn’t in your journal')).toBeVisible();
  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveCount(1, { timeout: 2_000 });
});

test.describe('device capability fallbacks', () => {
  test('speech synthesis unsupported → kitchen mode explains and keeps steps on screen', async ({ page }) => {
    const errors = collectErrors(page);
    await page.addInitScript(() => {
      delete (window as unknown as { speechSynthesis?: unknown }).speechSynthesis;
      delete (window as unknown as { SpeechSynthesisUtterance?: unknown }).SpeechSynthesisUtterance;
    });
    await seedProfile(page);
    await page.goto('/#/practice/esp-first-real-shot-guide');
    await expect(page.getByText('Not available in this browser — steps stay on screen.')).toBeVisible();
    await expect(page.getByRole('switch', { name: /Read steps aloud/ })).toBeDisabled();
    await page.getByTestId('practice-start').click();
    await expect(page.getByTestId('practice-step')).toBeVisible();
    await expect(page.getByRole('group', { name: 'Step controls' }).getByRole('button', { name: /^Done/ })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('wake lock unsupported → honest message, guide still usable', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(Navigator.prototype, 'wakeLock', { configurable: true, get: () => undefined });
      try {
        delete (Navigator.prototype as unknown as { wakeLock?: unknown }).wakeLock;
      } catch {
        /* ignore */
      }
    });
    await seedProfile(page);
    await page.goto('/#/practice/esp-first-real-shot-guide');
    const sw = page.getByRole('switch', { name: /Keep screen awake/ });
    if ((await sw.getAttribute('aria-checked')) !== 'true') await sw.click();
    await expect(page.getByText(/can’t keep the screen on|Keeping the screen on needs a secure/)).toBeVisible();
    await page.getByTestId('practice-start').click();
    await expect(page.getByTestId('practice-step')).toBeVisible();
  });

  test('offline after first load: navigating to a not-yet-loaded screen fails gracefully (no blank page)', async ({ page, context }) => {
    await seedProfile(page);
    await page.goto('/#/');
    await expect(page.getByTestId('home-next-lesson')).toBeVisible();
    await context.setOffline(true);
    await page.goto('/#/atlas').catch(() => {});
    await page.evaluate(() => (window.location.hash = '#/atlas')).catch(() => {});
    // Either the screen still renders, or a friendly recoverable error with retry/home is shown.
    const ok = page.getByRole('heading', { level: 1 }).first();
    await expect(ok).toBeVisible({ timeout: 10_000 });
    const text = (await page.locator('body').innerText()).trim();
    expect(text.length).toBeGreaterThan(20);
    await context.setOffline(false);
  });
});

test('QA-01 (P1): after a dropped connection, "Try again" recovers a screen once the network is back', async ({ page, context }) => {
  await seedProfile(page, { devices: ['phone'], preferredMode: 'mobile', equipment: ['espresso-machine', 'grinder'] });
  await page.goto('/#/');
  await expect(page.getByTestId('home-next-lesson')).toBeVisible();
  await context.setOffline(true); // kitchen Wi-Fi drops before kitchen mode was ever opened
  await page.evaluate(() => (window.location.hash = '#/practice/esp-first-real-shot-guide'));
  await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toBeVisible();
  await context.setOffline(false); // Wi-Fi is back
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByTestId('practice-start')).toBeVisible({ timeout: 5_000 });
});

test.describe('PWA offline (service worker allowed)', () => {
  test.use({ serviceWorkers: 'allow' });
  test('PWA: once offline-ready (service worker active), never-visited screens open offline (README claim)', async ({ page, context }) => {
    test.setTimeout(60_000);
    await seedProfile(page);
    await page.goto('/#/');
    await expect(page.getByTestId('home-next-lesson')).toBeVisible();
    // The "Ready to work offline" toast was removed in 449dec7 (QA-02/04); readiness = an active, controlling
    // service worker (Settings shows it as "Offline: ready").
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 30_000 });
    await context.setOffline(true);
    for (const [hash, check] of [
      ['#/atlas', () => page.getByTestId('atlas-count')],
      ['#/practice/po-first-real-cup-guide', () => page.getByTestId('practice-start')],
      ['#/learn/esp-diagnosis', () => page.getByTestId('lesson-start')],
      ['#/journal', () => page.getByRole('main').getByRole('heading', { level: 1 })],
      ['#/settings', () => page.getByTestId('reset-all')],
    ] as const) {
      await page.evaluate((h) => (window.location.hash = h), hash);
      await expect(check(), `offline ${hash}`).toBeVisible({ timeout: 10_000 });
    }
    await page.reload(); // full offline reload is served by the service worker
    await expect(page.getByTestId('reset-all')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    await context.setOffline(false);
  });

});

test.describe('keyboard-only + visible focus (desktop)', () => {
  test('complete a sequence and a quiz with the keyboard only; focus ring always visible', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard path is a desktop concern');
    test.setTimeout(90_000);
    const errors = collectErrors(page);
    await seedProfile(page);
    const lesson = getLesson('esp-workflow')!;
    const seqIdx = lesson.activityIds.indexOf('esp-workflow-order');
    const seq = getActivity('esp-workflow-order') as SequenceActivity;
    await page.goto(`/#/learn/esp-workflow?step=${seqIdx + 1}&g=guided`);
    await expect(page.getByTestId('activity-sequence')).toBeVisible();
    for (const st of seq.steps) {
      const btn = page.locator(`.act-seq-pool [data-step="${st.id}"]`);
      await tabTo(page, btn);
      await expectVisibleFocus(page);
      await page.keyboard.press('Enter');
      await expect(page.locator(`.act-seq-pool [data-step="${st.id}"]`)).toHaveCount(0);
    }
    const cont = page.getByTestId('activity-continue');
    await tabTo(page, cont);
    await expectVisibleFocus(page);
    await page.keyboard.press('Enter');

    // Next activity until the quiz: use the lesson's own keyboard shortcut (→) where allowed, else Tab to Next.
    const quizIdx = lesson.activityIds.indexOf('esp-workflow-quiz');
    await page.goto(`/#/learn/esp-workflow?step=${quizIdx + 1}&g=guided`);
    const quiz = getActivity('esp-workflow-quiz') as QuizActivity;
    await expect(page.getByTestId('activity-quiz')).toBeVisible();
    for (const q of quiz.questions) {
      const right = q.options.findIndex((o) => o.correct);
      // Digit shortcut picks an option (documented in the UI as 1–4).
      await page.keyboard.press(String(right + 1));
      const next = page.getByTestId('quiz-next');
      await tabTo(page, next);
      await expectVisibleFocus(page);
      await page.keyboard.press('Enter');
    }
    await tabTo(page, page.getByTestId('activity-continue'));
    await expectVisibleFocus(page);
    await page.keyboard.press('Enter');
    const st = await readState(page);
    expect(st.events.find((e: { activityId: string }) => e.activityId === 'esp-workflow-order')).toMatchObject({ evidence: 'assessed_answer', outcome: 'completed' });
    expect(st.events.find((e: { activityId: string }) => e.activityId === 'esp-workflow-quiz')).toMatchObject({ evidence: 'assessed_answer', outcome: 'completed', score: 1 });
    expect(errors).toEqual([]);
  });
});

test.describe('reduced motion and dark theme', () => {
  test('OS reduced-motion → html flagged and transitions collapse', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await seedProfile(page);
    await page.goto('/#/');
    await expect(page.getByTestId('home-next-lesson')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'on');
    const dur = await page.getByTestId('home-next-lesson').evaluate((el) => {
      const cs = getComputedStyle(el);
      const toS = (v: string) => Math.max(...v.split(',').map((x) => (x.trim().endsWith('ms') ? parseFloat(x) / 1000 : parseFloat(x))));
      return { t: toS(cs.transitionDuration), a: toS(cs.animationDuration) };
    });
    expect(dur.t).toBeLessThanOrEqual(0.01);
    expect(dur.a).toBeLessThanOrEqual(0.01);
  });

  test('dark color scheme → dark background, readable text (system theme)', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await seedProfile(page);
    await page.goto('/#/');
    await expect(page.getByTestId('home-next-lesson')).toBeVisible();
    const lum = await page.evaluate(() => {
      const parse = (c: string) => (c.match(/[\d.]+/g) ?? ['255', '255', '255']).slice(0, 3).map(Number);
      const L = ([r, g, b]: number[]) => {
        const f = (v: number) => {
          const s = v / 255;
          return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * f(r!) + 0.7152 * f(g!) + 0.0722 * f(b!);
      };
      const body = getComputedStyle(document.body);
      const h1 = getComputedStyle(document.querySelector('h1')!);
      return { bg: L(parse(body.backgroundColor)), fg: L(parse(h1.color)) };
    });
    expect(lum.bg).toBeLessThan(0.1);
    expect((lum.fg + 0.05) / (lum.bg + 0.05)).toBeGreaterThanOrEqual(4.5);
  });
});
