/**
 * QA (quality-guardian) — content honesty & safety audit over the SHIPPED content module (no browser).
 * Checks: hazardous real-world steps carry a safety note; simulated/model outputs carry an illustrative
 * label; diagnosis carries uncertainty; spatial practice states its limits; no copy claims the app senses
 * physical actions. Runs once (desktop project).
 */
import { expect, test } from '@playwright/test';
import { activities, drinks, lessons } from '../../src/content';
import type { Activity, GuidedPracticeActivity, LocalizedText } from '../../src/domain/contracts';

test.skip(({ isMobile }) => isMobile, 'content audit is viewport-independent');

const HAZARD_EN = /\b(boil|boiling|just off the boil|hot water|kettle|steam|steaming|steam wand|group ?head|portafilter.*hot|scald|burn|pressur|moka|ibrik|cezve|stove|flame|grinder|burrs?|blade)\b/i;
const HAZARD_ZH = /(沸|热水|烫|蒸汽|冲煮头|压力|炉|火|磨豆机|刀盘)/;

function text(t?: LocalizedText): string {
  return t ? `${t.en} ${t.zh}` : '';
}

const practices = activities.filter((a): a is GuidedPracticeActivity => a.kind === 'guided-practice');

test('every hazardous real-world guide step has a safety note (step-level or activity-level)', () => {
  const missing: string[] = [];
  for (const a of practices) {
    const activityLevel = (a.safetyNotes ?? []).length > 0;
    for (const st of a.steps) {
      const body = `${text(st.text)} ${text(st.detail)}`;
      if ((HAZARD_EN.test(body) || HAZARD_ZH.test(body)) && !st.safety && !activityLevel) missing.push(`${a.id}#${st.id}: ${st.text.en}`);
    }
  }
  expect(missing, 'hazardous steps without any safety note').toEqual([]);
});

test('hot-water / steam / pressure steps carry a STEP-level safety note (shown in kitchen mode at that step)', () => {
  const STRICT = /\b(boil|hot water|kettle|steam|steam wand|scald|moka|ibrik|cezve|stove|flame)\b|(沸|热水|蒸汽|炉|火)/i;
  const missing: string[] = [];
  for (const a of practices) {
    for (const st of a.steps) {
      const body = `${text(st.text)} ${text(st.detail)}`;
      if (STRICT.test(body) && !st.safety) missing.push(`${a.id}#${st.id}: ${st.text.en}`);
    }
  }
  test.info().annotations.push({ type: 'steps-without-step-safety', description: missing.join(' || ') || 'none' });
  expect(missing, 'hot-liquid steps relying only on an activity-level note').toEqual([]);
});

test('Drink Atlas: drinks needing hot water, steam, stovetop pressure or grinding have safety notes', () => {
  const missing = drinks
    .filter((d) => {
      const body = `${d.steps.map(text).join(' ')} ${text(d.recipe.summary)} ${text(d.recipe.waterTempNote)}`;
      return HAZARD_EN.test(body) || HAZARD_ZH.test(body) || ['espresso', 'espresso-milk', 'pressure', 'pourover', 'immersion'].includes(d.category);
    })
    .filter((d) => d.safetyNotes.length === 0)
    .map((d) => `${d.id} (${d.category})`);
  expect(missing).toEqual([]);
});

test('simulated / model outputs are labelled illustrative; diagnosis states uncertainty; XR states limits', () => {
  const problems: string[] = [];
  for (const a of activities as Activity[]) {
    if (a.kind === 'parameter-lab' && !a.illustrativeNote?.en) problems.push(`${a.id}: parameter-lab without illustrativeNote`);
    if (a.kind === 'diagnose') for (const s of a.scenarios) if (!s.caveat?.en) problems.push(`${a.id}/${s.id}: no caveat`);
    if (a.kind === 'spatial-practice' && !a.limits?.en) problems.push(`${a.id}: spatial-practice without limits`);
    if (a.kind === 'guided-practice' && a.recipe && !a.recipe.note?.en) problems.push(`${a.id}: recipe without note`);
  }
  expect(problems).toEqual([]);
});

test('no content claims the app observes, detects or verifies physical actions or real taste', () => {
  const CLAIM = /\b(the app (will )?(detects?|sees?|measures?|verif(y|ies)|confirms?|knows?)|we (can )?(detect|see|measure|verify) (your|that)|sensor(s)? (will|detect)|guaranteed (taste|flavou?r|result)|perfect (shot|cup) every time)\b/i;
  const hits: string[] = [];
  const NEGATED = /\b(never|not|no|doesn.t|can.t|cannot|isn.t)\b[^.]*$/i;
  const scan = (id: string, v: unknown) => {
    if (typeof v === 'string') {
      const m = v.match(CLAIM);
      if (m && !NEGATED.test(v.slice(0, m.index))) hits.push(`${id}: ${v.slice(0, 120)}`);
    } else if (Array.isArray(v)) v.forEach((x, i) => scan(`${id}[${i}]`, x));
    else if (v && typeof v === 'object' && 'correct' in v && (v as { correct: unknown }).correct === false) {
      // A wrong quiz option is SUPPOSED to state the misconception; only its feedback must be honest.
      scan(`${id}.feedback`, (v as { feedback?: unknown }).feedback);
    }
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) scan(`${id}.${k}`, x);
  };
  for (const a of activities) scan(a.id, a);
  for (const l of lessons) scan(l.id, l);
  for (const d of drinks) scan(d.id, d);
  expect(hits).toEqual([]);
});
