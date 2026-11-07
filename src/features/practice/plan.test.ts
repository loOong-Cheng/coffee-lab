import { describe, expect, it } from 'vitest';
import type { DrinkRecipe, GuidedPracticeActivity, QuizActivity } from '../../domain/contracts';
import {
  brewKindForActivity,
  drinkIdForActivity,
  drinkPracticeId,
  parsePracticeId,
  parseStepDurationSec,
  planFromActivity,
  planFromDrink,
  resolvePracticePlan,
  safetyForStep,
  timerModeForStep,
} from './plan';

const L = (zh: string, en: string) => ({ zh, en });

const STEAM = L('蒸汽可瞬间烫伤。', 'Steam burns instantly: purge the wand first.');
const HOT = L('热水会烫伤。', 'Hot and boiling water scald.');
const GRIND = L('清理前先拔插头。', 'Unplug the grinder before clearing a jam.');

const frenchPress: DrinkRecipe = {
  id: 'french-press-coffee',
  category: 'immersion',
  name: L('法压壶咖啡', 'French press'),
  tagline: L('醇厚', 'Full-bodied'),
  origin: L('法国/意大利', 'France/Italy'),
  cultureNote: L('据说……', 'The story goes…'),
  equipment: ['french-press', 'kettle', 'grinder', 'scale'],
  recipe: { summary: L('30 克粉 → 500 克水', '30 g coffee → 500 g water'), doseG: 30, outG: 500, timeNote: L('约 4 分钟', 'About 4 min') },
  steps: [
    L('称 30 克豆子，研磨成粗粉。', 'Weigh 30 g of beans and grind coarse.'),
    L('倒入 500 克热水。', 'Pour in 500 g of hot water from the kettle.'),
    L('浸泡 4 分钟。', 'Steep for 4 minutes.'),
    L('慢慢压下滤网，倒出。', 'Press the plunger slowly and pour.'),
  ],
  difficulty: 1,
  safetyNotes: [HOT, GRIND],
  relatedLessonIds: [],
  sources: [],
  confidence: 'rule-of-thumb',
};

const latte: DrinkRecipe = {
  ...frenchPress,
  id: 'caffe-latte',
  category: 'espresso-milk',
  equipment: ['espresso-machine', 'grinder', 'milk-pitcher'],
  recipe: { summary: L('双份浓缩 + 牛奶', 'Double shot + milk'), doseG: 18, outG: 36, milkMl: 200 },
  steps: [L('打奶：蒸汽棒没入奶面', 'Steam the milk with the wand just under the surface'), L('倒入', 'Pour')],
  safetyNotes: [STEAM, HOT],
};

const guided: GuidedPracticeActivity = {
  id: 'esp-first-real-shot-guide',
  lessonId: 'esp-first-real-shot',
  kind: 'guided-practice',
  title: L('第一杯', 'First shot'),
  supportedModes: ['mobile', 'real-world-guide'],
  equipment: ['espresso-machine', 'grinder', 'portafilter', 'scale'],
  recipe: { doseG: 18, outG: 36, ratioLabel: L('1:2', '1:2'), note: L('起点', 'A start'), targetTimeSec: [25, 35] },
  steps: [
    { id: 'heat', text: L('预热', 'Heat up'), help: L('看说明书', 'Check the manual'), safety: HOT },
    { id: 'pull', text: L('萃取', 'Pull the shot'), help: L('计时', 'Time it'), timerSec: 30 },
  ],
  logFields: ['doseG', 'outG', 'timeSec', 'taste', 'rating', 'notes'],
};

describe('practice ids', () => {
  it('round-trips drink ids and leaves activity ids alone', () => {
    expect(drinkPracticeId('cortado')).toBe('drink:cortado');
    expect(parsePracticeId('drink:cortado')).toEqual({ kind: 'drink', drinkId: 'cortado' });
    expect(parsePracticeId('po-first-real-cup-guide')).toEqual({ kind: 'activity', activityId: 'po-first-real-cup-guide' });
  });
});

describe('parseStepDurationSec', () => {
  it('reads minutes and seconds from English text, using the lower bound of a range', () => {
    expect(parseStepDurationSec(L('', 'Steep for 4 minutes.'))).toBe(240);
    expect(parseStepDurationSec(L('', 'Wait 30 s, then stir.'))).toBe(30);
    expect(parseStepDurationSec(L('', 'Let it bloom 30–45 seconds.'))).toBe(30);
    expect(parseStepDurationSec(L('', 'Steep 3-4 min'))).toBe(180);
  });
  it('falls back to Chinese text', () => {
    expect(parseStepDurationSec(L('浸泡 4 分钟', 'Steep, then press'))).toBe(240);
    expect(parseStepDurationSec(L('闷蒸 30 秒', 'Bloom'))).toBe(30);
  });
  it('ignores grams, temperatures and very long or tiny spans', () => {
    expect(parseStepDurationSec(L('', 'Weigh 18 g of beans'))).toBeUndefined();
    expect(parseStepDurationSec(L('', 'Heat to 93 °C'))).toBeUndefined();
    expect(parseStepDurationSec(L('', 'Steep 12–24 hours in the fridge'))).toBeUndefined();
    expect(parseStepDurationSec(L('冷藏 720 分钟', 'Leave overnight'))).toBeUndefined();
    expect(parseStepDurationSec(L('', 'Purge for 2 s'))).toBeUndefined();
  });
});

describe('timerModeForStep (timerSec is a reference, countdown only for waits)', () => {
  it('uses a countdown for waits like bloom, steep and cooling', () => {
    expect(timerModeForStep(L('', 'Start the timer; slowly pour about 40 g of water, then wait'))).toBe('countdown');
    expect(timerModeForStep(L('', 'Steep for 4 minutes.'))).toBe('countdown');
    expect(timerModeForStep(L('', 'Let both cups cool for about 5 minutes'))).toBe('countdown');
    expect(timerModeForStep(L('闷蒸 30 秒', 'Bloom'))).toBe('countdown');
  });
  it('uses a reference stopwatch for actions judged by weight or taste', () => {
    expect(timerModeForStep(L('', 'Press brew and start the timer together; watch the scale'))).toBe('reference');
    expect(timerModeForStep(L('', 'Stretch: keep a gentle hiss for a few seconds while the surface rises'))).toBe('reference');
  });
});

describe('safetyForStep', () => {
  it('attaches only the drink’s own matching notes', () => {
    expect(safetyForStep(L('', 'Steam the milk with the wand'), [STEAM, HOT])).toEqual([STEAM]);
    expect(safetyForStep(L('', 'Pour in hot water from the kettle'), [STEAM, HOT])).toEqual([HOT]);
    expect(safetyForStep(L('', 'Grind coarse'), [HOT, GRIND])).toEqual([GRIND]);
    expect(safetyForStep(L('', 'Serve and enjoy'), [STEAM, HOT, GRIND])).toEqual([]);
  });
});

describe('planFromDrink (drink → kitchen-mode practice)', () => {
  it('builds ordered steps with ids, help, derived timers and step safety', () => {
    const p = planFromDrink(frenchPress);
    expect(p.id).toBe('drink:french-press-coffee');
    expect(p.source).toBe('drink');
    expect(p.drinkId).toBe('french-press-coffee');
    expect(p.lessonId).toBe('');
    expect(p.brewKind).toBe('brew');
    expect(p.steps.map((s) => s.id)).toEqual(['s1', 's2', 's3', 's4']);
    expect(p.steps.every((s) => s.help.en.length > 0 && s.help.zh.length > 0)).toBe(true);
    expect(p.steps[2]).toMatchObject({ timerSec: 240, timerMode: 'countdown', timerFromText: true });
    expect(p.steps[0].timerSec).toBeUndefined();
    expect(p.steps[0].safety).toEqual([GRIND]);
    expect(p.steps[1].safety).toEqual([HOT]);
    expect(p.safetyNotes).toEqual([HOT, GRIND]);
    expect(p.recipe).toMatchObject({ doseG: 30, outG: 500 });
    expect(p.logFields).toEqual(expect.arrayContaining(['doseG', 'outG', 'timeSec', 'taste', 'rating']));
  });
  it('treats espresso-based drinks with the espresso ratio convention', () => {
    expect(planFromDrink(latte).brewKind).toBe('espresso');
    expect(planFromDrink(latte).steps[0].safety).toEqual([STEAM]);
  });
  it('does not ask for output grams when the recipe has no output', () => {
    const p = planFromDrink({ ...frenchPress, recipe: { summary: L('', '') } });
    expect(p.logFields).not.toContain('outG');
  });
});

describe('planFromActivity', () => {
  it('maps a guided-practice activity, keeping authored safety, timers and target time', () => {
    const p = planFromActivity(guided, new Set(['espresso-shot']));
    expect(p.id).toBe(guided.id);
    expect(p.lessonId).toBe('esp-first-real-shot');
    expect(p.drinkId).toBe('espresso-shot');
    expect(p.brewKind).toBe('espresso');
    expect(p.recipe?.targetTimeSec).toEqual([25, 35]);
    expect(p.steps[0].safety).toEqual([HOT]);
    expect(p.steps[1]).toMatchObject({ timerSec: 30, timerMode: 'reference' });
    expect(p.steps[1].timerFromText).toBeUndefined();
    expect(p.steps[0].timerMode).toBeUndefined();
  });
  it('infers brew kind and drink id from gear and log fields', () => {
    expect(brewKindForActivity({ equipment: ['espresso-machine', 'milk-pitcher'], logFields: ['taste', 'rating'] })).toBe('none');
    expect(brewKindForActivity({ equipment: ['dripper', 'kettle'], logFields: ['doseG', 'outG'] })).toBe('brew');
    expect(drinkIdForActivity({ id: 'po-x', equipment: ['dripper'], logFields: ['doseG', 'outG'] }, new Set(['pourover-cone']))).toBe('pourover-cone');
    expect(drinkIdForActivity({ id: 'milk-x', equipment: ['milk-pitcher'], logFields: ['taste'] }, new Set())).toBe('milk-x');
  });
});

describe('resolvePracticePlan', () => {
  const quiz = { id: 'q', lessonId: 'l', kind: 'quiz', title: L('', ''), supportedModes: ['desktop'], questions: [] } as QuizActivity;
  const src = {
    getActivity: (id: string) => (id === guided.id ? guided : id === 'q' ? quiz : undefined),
    getDrink: (id: string) => (id === frenchPress.id ? frenchPress : undefined),
  };
  it('resolves activities and drinks', () => {
    expect(resolvePracticePlan(guided.id, src)).toMatchObject({ ok: true, plan: { id: guided.id } });
    expect(resolvePracticePlan('drink:french-press-coffee', src)).toMatchObject({ ok: true, plan: { source: 'drink' } });
  });
  it('reports unknown ids and non-practice activities instead of throwing', () => {
    expect(resolvePracticePlan('nope', src)).toEqual({ ok: false, reason: 'not-found', id: 'nope' });
    expect(resolvePracticePlan('drink:nope', src)).toEqual({ ok: false, reason: 'not-found', id: 'drink:nope' });
    expect(resolvePracticePlan('q', src)).toEqual({ ok: false, reason: 'not-practice', id: 'q' });
    const throwing = { getActivity: () => { throw new Error('x'); }, getDrink: () => undefined };
    expect(resolvePracticePlan('a', throwing)).toMatchObject({ ok: false });
  });
});
