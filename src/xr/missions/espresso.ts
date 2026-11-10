/** "espresso-first-shot" as a framework mission (adapter over src/xr/mission/*). */
import type { MissionDef, MissionResult } from '../mission/core';
import type { MissionAction, MissionState } from '../mission/types';
import { ITEM_NAME, STEPS, STEP_ORDER, ZONE_NAME, fmt } from '../mission/content';
import { createInitialState, cuesFor, currentStepIndex, isAt, missionReducer, scaleReadingG } from '../mission/reducer';
import { availableActions } from '../mission/actions';
import { buildCompletionEvent, buildSummary } from '../mission/summary';
import { MODEL, RECIPE } from '../mission/extraction';
import { espressoInfo, espressoView } from '../mission/stationView';
import { S } from '../strings';

const pct = (n: number) => ({ en: `${Math.round(n * 100)}%`, zh: `${Math.round(n * 100)}%` });
const plain = (x: string | number) => ({ en: String(x), zh: String(x) });

const BASKET = {
  empty: { en: 'empty', zh: '空' },
  dosed: { en: 'loose grounds (not tamped)', zh: '松散的粉（未压粉）' },
  tamped: { en: 'tamped grounds', zh: '已压好的粉' },
  spent: { en: 'used puck', zh: '用过的粉饼' },
} as const;

export function espressoActionsKey(s: MissionState): string {
  const it = s.items;
  return [
    s.status,
    s.flags.located,
    it.portafilter.zone,
    it.portafilter.heldBy,
    it.cup.zone,
    it.cup.heldBy,
    it.tamper.zone,
    it.tamper.heldBy,
    s.basket,
    s.shot.status,
    s.grinder.running,
    s.flush.running,
    s.flags.knocked,
    s.flags.flushed,
    s.tareG,
    s.guidance,
    cuesFor(s).cues,
  ].join('|');
}

export const espressoMission: MissionDef<MissionState, MissionAction> = {
  id: 'espresso-first-shot',
  activityId: 'esp-workflow-xr',
  lessonId: 'esp-workflow',
  title: S.missionTitle,
  short: S.missionShort,
  intro: S.intro,
  practices: S.trains,
  notTrains: S.notTrains,
  minutes: [4, 7],
  stepTitles: STEP_ORDER.map((id) => STEPS[id].title),
  realNext: { to: '/learn/esp-first-real-shot', label: S.realShotLesson },
  controlsHelp: { pointer: S.controlsHelpPointer, xr: S.controlsHelpXr },
  create: (g) => createInitialState(g),
  reduce: missionReducer,
  hud(s) {
    const c = cuesFor(s);
    const idx = currentStepIndex(s);
    const step = STEP_ORDER[idx];
    return {
      status: s.status,
      guidance: s.guidance,
      stepIndex: idx,
      stepCount: STEP_ORDER.length,
      stepTitle: step ? STEPS[step].title : null,
      doXr: step ? STEPS[step].doXr : null,
      doScreen: step ? STEPS[step].doScreen : null,
      showStepLabel: c.stepLabel && !!step,
      showInstruction: c.nextStepText && !!step,
      progress: null,
      feedback: s.feedback,
    };
  },
  actions: availableActions,
  actionsKey: espressoActionsKey,
  result(s): MissionResult {
    const sum = buildSummary(s);
    const notes = buildCompletionEvent(sum, { immersive: false, touch: false }).notes ?? '';
    return {
      missionId: 'espresso-first-shot',
      completed: sum.completed,
      evidence: 'simulated',
      illustrativeModel: true,
      claims: sum.claims,
      durationSec: sum.durationSec,
      hintsUsed: sum.hintsUsed,
      mistakes: sum.mistakes,
      stats: [
        { label: S.sequence, value: pct(sum.sequenceAccuracy) },
        { label: S.stopAccuracy, value: plain(sum.stop ? `${sum.stop.finalYieldG} g / ${sum.stop.targetG} g` : '—') },
        { label: S.time, value: { en: `${sum.durationSec} s`, zh: `${sum.durationSec} 秒` } },
        { label: S.hintsUsed, value: plain(sum.hintsUsed) },
        { label: S.mistakes, value: plain(sum.mistakes) },
        { label: S.nearMisses, value: plain(sum.nearMisses) },
        { label: S.score, value: pct(sum.score) },
      ],
      note: sum.stopFeedback
        ? sum.autoStopped
          ? { en: `${sum.stopFeedback.en} ${S.autoStopped.en}`, zh: `${sum.stopFeedback.zh}${S.autoStopped.zh}` }
          : sum.stopFeedback
        : null,
      practiced: sum.practiced,
      notTrained: sum.notTrained,
      score: sum.score,
      guidanceUsed: sum.guidanceUsed,
      guidanceForRecord: sum.guidanceForRecord,
      guidanceFinal: sum.guidanceFinal,
      primaryInput: sum.primaryInput,
      spatialPractice: sum.spatialPractice,
      notes,
    };
  },
  readout(s) {
    const show = s.shot.status !== 'idle' || isAt(s, 'cup', 'scale');
    if (!show) return null;
    const reading = scaleReadingG(s);
    const y = s.shot.yieldG;
    const near = cuesFor(s).yieldCue && s.shot.status === 'running' && y >= RECIPE.targetYieldG - MODEL.approachWindowG;
    return {
      big: `${reading.toFixed(1)} g`,
      small: fmt(
        { en: 'target {t} g · shot time {sec} s · illustrative model', zh: '目标 {t} 克 · 萃取时间 {sec} 秒 · 示意模型' },
        { t: RECIPE.targetYieldG, sec: Math.floor(s.shot.elapsedSec) },
      ),
      tone: near ? (y >= RECIPE.targetYieldG - 1.5 ? 'on' : 'near') : 'normal',
      bar: { value: reading, max: 48, target: RECIPE.targetYieldG },
    };
  },
  status(s) {
    const where = (item: 'portafilter' | 'cup' | 'tamper') => (s.items[item].heldBy ? S.holding : ZONE_NAME[s.items[item].zone]);
    return [
      fmt({ en: '{item}: {where} · {basket}', zh: '{item}：{where} · {basket}' }, { item: ITEM_NAME.portafilter, where: where('portafilter'), basket: BASKET[s.basket] }),
      fmt({ en: '{item}: {where}', zh: '{item}：{where}' }, { item: ITEM_NAME.cup, where: where('cup') }),
      fmt({ en: '{item}: {where}', zh: '{item}：{where}' }, { item: ITEM_NAME.tamper, where: where('tamper') }),
      fmt({ en: 'Scale: {g} g', zh: '秤：{g} 克' }, { g: scaleReadingG(s).toFixed(1) }),
    ];
  },
  xrButtons: () => [],
  loadScene: () =>
    import('../scene/espressoStation').then((m) => m.espressoStationFactory((s) => espressoView(s as MissionState), espressoInfo)),
};
