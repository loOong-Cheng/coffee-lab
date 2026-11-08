/**
 * Shared helpers for the independent QA specs (tests/e2e/qa-*.spec.ts).
 * Owned by quality-guardian. Activity answers are read from the SAME content module the app ships,
 * so the solver follows content changes instead of hard-coding answers.
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { activities as allActivities, getLesson } from '../../src/content';
import type { Activity, DiagnoseActivity, IdentifyActivity, ParameterLabActivity, QuizActivity, SequenceActivity } from '../../src/domain/contracts';

export const STATE_KEY = 'coffee-lab:state';
export const CORRUPT_BACKUP_KEY = 'coffee-lab:state:corrupt-backup';
export const ERROR_BOUNDARY_TEXT = /Something went wrong|出了点问题/;

export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

export function lessonActivities(lessonId: string): Activity[] {
  const lesson = getLesson(lessonId);
  if (!lesson) throw new Error(`no lesson ${lessonId}`);
  return lesson.activityIds.map((id) => {
    const a = allActivities.find((x) => x.id === id);
    if (!a) throw new Error(`no activity ${id}`);
    return a;
  });
}

export async function readState(page: Page) {
  return page.evaluate((k) => JSON.parse(window.localStorage.getItem(k) ?? 'null'), STATE_KEY);
}

/** Seed a profile once (only when storage is empty, so reloads keep what the app saved). */
export async function seedProfile(
  page: Page,
  opts: { locale?: 'en' | 'zh'; devices?: string[]; preferredMode?: string; equipment?: string[]; theme?: string; reducedMotion?: string } = {},
) {
  const seed = {
    version: 1,
    profile: {
      goal: 'espresso',
      experience: 'new',
      devices: opts.devices ?? ['pc', 'phone'],
      equipment: opts.equipment ?? ['espresso-machine', 'grinder', 'tamper', 'scale', 'dripper', 'paper-filter', 'gooseneck-kettle'],
      wishlist: [],
      preferredMode: opts.preferredMode ?? 'desktop',
      onboardedAt: '2026-11-07T08:00:00.000Z',
    },
    prefs: {
      locale: opts.locale ?? 'en',
      sfx: false,
      music: false,
      volume: 0.5,
      reducedMotion: opts.reducedMotion ?? 'system',
      theme: opts.theme ?? 'system',
      defaultGuidance: 'guided',
      speakSteps: false,
    },
    events: [],
    journal: [],
    activePractice: null,
  };
  await page.addInitScript(
    ([key, value]) => {
      try {
        if (!window.localStorage.getItem(key)) window.localStorage.setItem(key, value);
      } catch {
        /* storage blocked in this test */
      }
    },
    [STATE_KEY, JSON.stringify(seed)] as const,
  );
}

/** Press Tab until `target` has focus (keyboard-only reachability). Returns the number of presses. */
export async function tabTo(page: Page, target: Locator, max = 120, reverse = false): Promise<number> {
  for (let i = 0; i < max; i++) {
    if (await target.evaluate((el) => el === document.activeElement).catch(() => false)) return i;
    await page.keyboard.press(reverse ? 'Shift+Tab' : 'Tab');
  }
  throw new Error(`tabTo: target not reached within ${max} Tab presses`);
}

/** The focused element shows a visible focus indicator (outline or box-shadow) and matches :focus-visible. */
export async function expectVisibleFocus(page: Page) {
  const info = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return { ok: false, why: 'no focused element' };
    const cs = getComputedStyle(el);
    const outline = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0;
    const shadow = cs.boxShadow && cs.boxShadow !== 'none';
    return { ok: el.matches(':focus-visible') && (outline || !!shadow), why: `${el.tagName}.${el.className} outline=${cs.outlineStyle}/${cs.outlineWidth} shadow=${cs.boxShadow}` };
  });
  expect(info.ok, `visible focus indicator: ${info.why}`).toBe(true);
}

// ───────────────────────── activity solver (guided tier) ─────────────────────────

async function clickContinue(page: Page) {
  await page.getByTestId('activity-continue').click();
}

/** Plays one activity correctly at the GUIDED tier and presses Continue (advances the lesson). */
export async function solveActivity(page: Page, a: Activity, opts: { reflection?: string } = {}) {
  await expect(page.getByTestId('activity-title')).toBeVisible();
  switch (a.kind) {
    case 'explain': {
      await expect(page.getByTestId('activity-explain')).toBeVisible();
      for (let i = 0; i < 20 && (await page.getByTestId('explain-next').isVisible()); i++) await page.getByTestId('explain-next').click();
      await clickContinue(page);
      return;
    }
    case 'sequence': {
      const seq = a as SequenceActivity;
      await expect(page.getByTestId('activity-sequence')).toHaveAttribute('data-mode', 'build');
      for (const st of seq.steps) await page.locator(`.act-seq-pool [data-step="${st.id}"]`).click();
      await clickContinue(page);
      return;
    }
    case 'quiz': {
      const quiz = a as QuizActivity;
      for (const q of quiz.questions) {
        const right = q.options.find((o) => o.correct)!;
        await page.locator(`[data-option="${right.id}"]`).click();
        await page.getByTestId('quiz-next').click();
      }
      await clickContinue(page);
      return;
    }
    case 'parameter-lab': {
      const lab = a as ParameterLabActivity;
      for (const ch of lab.challenges) {
        const dose = ch.target.doseG ? (ch.target.doseG[0] + ch.target.doseG[1]) / 2 : lab.defaults.doseG;
        const out = Math.round(dose * ((ch.target.ratioMin + ch.target.ratioMax) / 2));
        const doseIn = page.getByTestId('lab-dose').getByRole('spinbutton');
        await doseIn.fill(String(dose));
        await doseIn.press('Enter');
        const outIn = page.getByTestId('lab-out').getByRole('spinbutton');
        await outIn.fill(String(out));
        await outIn.press('Enter');
        await page.getByTestId('lab-check').click();
        await page.getByTestId('lab-next').click();
      }
      await clickContinue(page);
      return;
    }
    case 'diagnose': {
      const dx = a as DiagnoseActivity;
      for (const s of dx.scenarios) {
        const best = s.choices.find((c) => c.quality === 'best')!;
        await page.locator(`[data-choice="${best.id}"]`).click();
        await page.getByTestId('diagnose-next').click();
      }
      await clickContinue(page);
      return;
    }
    case 'identify': {
      const idf = a as IdentifyActivity;
      await page.getByTestId('identify-start').click();
      for (const target of idf.targets) {
        await page.locator(`.cl-diagram__pins button[data-part="${target.partId}"]`).click();
        await page.getByTestId('identify-next').click();
      }
      await clickContinue(page);
      return;
    }
    case 'reflect': {
      if (opts.reflection) {
        await page.getByRole('main').locator('textarea').first().fill(opts.reflection);
        await page.getByTestId('reflect-save').click();
      } else {
        await page.getByTestId('reflect-skip').click();
      }
      return;
    }
    case 'guided-practice':
    case 'spatial-practice':
      await clickContinue(page);
      return;
    default:
      throw new Error(`solver: unsupported activity ${JSON.stringify((a as { id?: string }).id)}`);
  }
}

/** Opens a lesson from its intro and plays every activity at the guided tier. */
export async function playWholeLesson(page: Page, lessonId: string, opts: { reflection?: string } = {}) {
  await page.goto(`/#/learn/${lessonId}`);
  await page.getByTestId('lesson-start').click();
  for (const a of lessonActivities(lessonId)) {
    await expect(page.getByTestId('activity-title'), `activity ${a.id}`).toBeVisible();
    await expect(page.locator(`.ls-activity[data-activity="${a.id}"]`)).toBeVisible();
    await solveActivity(page, a, opts);
  }
  await expect(page.getByTestId('lesson-complete')).toBeVisible();
}

/**
 * Completes the XR espresso mission through the keyboard-operable action list by always choosing
 * the recommended action (guided tier), waiting on simulated timers when nothing is recommended.
 */
export async function completeXrMissionViaActionList(page: Page, maxMs = 150_000) {
  const deadline = Date.now() + maxMs;
  const summary = page.getByTestId('xr-summary');
  let brewStarted = false;
  while (Date.now() < deadline) {
    if (await summary.isVisible()) return;
    const rec = page.locator('.xr-action[data-recommended]').first();
    if (await rec.isVisible().catch(() => false)) {
      const id = await rec.getAttribute('data-action-id').catch(() => null);
      if (id === 'press-brew' && brewStarted) {
        // Shot is running: stop near the 36 g target like a learner watching the scale.
        const text = (await page.getByTestId('xr-readout').textContent().catch(() => '')) ?? '';
        const grams = Number((text.match(/([\d.]+)\s*g/) ?? [])[1] ?? 0);
        if (grams < 35) {
          await page.waitForTimeout(150);
          continue;
        }
      }
      if (id === 'press-brew') brewStarted = !brewStarted;
      await rec.click({ timeout: 2_000 }).catch(() => {});
      await page.waitForTimeout(60);
    } else {
      await page.waitForTimeout(200);
    }
  }
  throw new Error('XR mission did not complete via the action list in time');
}
