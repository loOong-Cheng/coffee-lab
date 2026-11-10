/** "pourover-bloom" framework definition. Ratio arithmetic via src/domain/brew. */
import { formatBrewRatio } from '../../../domain/brew';
import type { LocalizedText } from '../../../domain/contracts';
import type { MissionDef, MissionResult, PanelAction } from '../../mission/core';
import { baseResult, cuesOf } from '../../mission/core';
import { fmt } from '../../mission/content';
import { S } from '../../strings';
import { POUR, FLOW_MODEL_NOTE, flowSummary, targetAccuracy, tiltForFlow } from './model';
import { P, POUR_STEPS, pourInfo } from './content';
import {
  createPour,
  currentPourStep,
  freeWaterG,
  kettleFlow,
  pourCue,
  pourReducer,
  pourStepIndex,
  scaleReading,
  type PourAction,
  type PourState,
} from './reducer';

const t = (en: string, zh: string = en): LocalizedText => ({ en, zh });
const OFFSET = { center: 0, spiral: 0.03, wall: 0.052 };

/** Water still due for the current pour cue (whole grams), or null when no pour is due. */
export function pourRemaining(s: PourState): number | null {
  const cue = pourCue(s);
  if (cue?.kind !== 'pour') return null;
  const left = Math.round(cue.toG - (cue.rinse ? s.rinseG : s.brewG));
  return left >= 1 ? left : null;
}

export function pourActions(s: PourState): PanelAction<PourAction>[] {
  if (s.status !== 'playing') return [];
  const cue = pourCue(s);
  const show = cuesOf(s).cues;
  const out: PanelAction<PourAction>[] = [];
  const hand = 'pointer' as const;
  const kettleHeld = s.items.kettle.heldBy === hand;
  const fill = s.kettleG / POUR.kettleCapacityG;
  const add = (id: string, label: LocalizedText, actions: PourAction[], rec: boolean) => out.push({ id, label, actions, recommended: show && rec });
  const busyHand = !!(['filter', 'grounds', 'carafe'] as const).find((i) => s.items[i].heldBy === hand);
  const cueItem = cue && 'item' in cue ? cue.item : null;
  const cueZone = cue && 'zone' in cue ? cue.zone : null;
  if (!kettleHeld && !busyHand) {
    if (!s.filterIn)
      add('filter', P.actions.filter, [{ type: 'GRAB', item: 'filter', hand, source: 'panel' }, { type: 'RELEASE', hand, zone: 'dripper', distanceM: 0, source: 'panel' }], cueItem === 'filter');
    if (!s.groundsIn)
      add('grounds', P.actions.grounds, [{ type: 'GRAB', item: 'grounds', hand, source: 'panel' }, { type: 'RELEASE', hand, zone: 'dripper', distanceM: 0, source: 'panel' }], cueItem === 'grounds');
    if (s.items.carafe.zone === 'scale')
      add('to-sink', P.actions.toSink, [{ type: 'GRAB', item: 'carafe', hand, source: 'panel' }, { type: 'RELEASE', hand, zone: 'sink', distanceM: 0, source: 'panel' }], cueItem === 'carafe' && cueZone === 'sink');
    else
      add('to-scale', P.actions.toScale, [{ type: 'GRAB', item: 'carafe', hand, source: 'panel' }, { type: 'RELEASE', hand, zone: 'scale', distanceM: 0, source: 'panel' }], cueItem === 'carafe' && cueZone === 'scale');
    add('tare', P.actions.tare, [{ type: 'PRESS', button: 'tare', source: 'panel' }], cue?.kind === 'press');
    add('kettle', P.actions.pickKettle, [{ type: 'GRAB', item: 'kettle', hand, source: 'panel' }, { type: 'KETTLE', tiltDeg: 0, offsetM: OFFSET.center, source: 'panel' }], cue?.kind === 'pour');
  }
  if (busyHand) add('putback', t('Put it back', '放回原处'), [{ type: 'RELEASE', hand, source: 'panel' }], true);
  if (kettleHeld) {
    const pouring = kettleFlow(s) > 0;
    const wantPour = cue?.kind === 'pour' && (cue.rinse ? s.rinseG < cue.toG : s.brewG < cue.toG - 2);
    // Measured pours: no real-time reflexes needed (keyboard / screen-reader friendly).
    // Guided offers "pour the rest to the target"; assisted suggests a pulse size; independent suggests nothing.
    const left = pourRemaining(s);
    if (s.guidance === 'guided' && left !== null && cue?.kind === 'pour')
      add('to-target', fmt(P.actions.toTarget, { g: left, t: cue.toG }), [{ type: 'POUR_PULSE', grams: left, source: 'panel' }], wantPour && !pouring);
    const pulse = left !== null && left >= 50 ? 50 : 10;
    add('pulse-10', P.actions.pulse10, [{ type: 'POUR_PULSE', grams: 10, source: 'panel' }], s.guidance !== 'guided' && wantPour && !pouring && pulse === 10);
    add('pulse-50', P.actions.pulse50, [{ type: 'POUR_PULSE', grams: 50, source: 'panel' }], s.guidance !== 'guided' && wantPour && !pouring && pulse === 50);
    add('gentle', P.actions.gentle, [{ type: 'KETTLE', tiltDeg: tiltForFlow(3, fill), source: 'panel' }], false);
    add('faster', P.actions.faster, [{ type: 'KETTLE', tiltDeg: tiltForFlow(7, fill), source: 'panel' }], false);
    add('stop', P.actions.stop, [{ type: 'KETTLE', tiltDeg: 0, source: 'panel' }], pouring && !wantPour);
    add('center', P.actions.center, [{ type: 'KETTLE', offsetM: OFFSET.center, source: 'panel' }], s.offsetM === null || s.offsetM > POUR.bedR);
    add('spiral', P.actions.spiral, [{ type: 'KETTLE', offsetM: OFFSET.spiral, source: 'panel' }], false);
    add('wall', P.actions.wall, [{ type: 'KETTLE', offsetM: OFFSET.wall, source: 'panel' }], false);
    add('put-down', P.actions.putDown, [{ type: 'RELEASE', hand, source: 'panel' }], !wantPour && !pouring && cue?.kind !== 'wait' && cue?.kind !== 'pour');
  }
  const step = currentPourStep(s);
  if (step === 'bloom-wait' || step === 'drawdown' || (step === 'discard' && freeWaterG(s) > 0.5))
    add('skip', P.actions.skip, [{ type: 'SKIP_WAIT', source: 'panel' }], false);
  return out;
}

export const pouroverMission: MissionDef<PourState, PourAction> = {
  id: 'pourover-bloom',
  activityId: 'po-ratio-bloom-xr',
  lessonId: 'po-ratio-bloom',
  title: P.title,
  short: P.short,
  intro: P.intro,
  practices: P.practices,
  notTrains: P.notTrains,
  minutes: [3, 6],
  stepTitles: POUR_STEPS.map((id) => P.steps[id].title),
  realNext: { to: '/learn/po-first-real-cup', label: P.nextReal },
  controlsHelp: { pointer: P.controlsPointer, xr: P.controlsXr },
  create: (g) => createPour(g),
  reduce: pourReducer,
  hud(s) {
    const c = cuesOf(s);
    const idx = pourStepIndex(s);
    const step = POUR_STEPS[idx];
    const progress =
      step === 'rinse'
        ? fmt(P.progress.rinse, { g: Math.round(s.rinseG) })
        : step === 'bloom-wait'
          ? fmt(P.progress.bloom, { s: Math.floor(s.bloom.waitedSec) })
          : step === 'bloom' || step === 'pour' || step === 'drawdown'
            ? fmt(P.progress.water, { g: Math.round(s.brewG), target: step === 'bloom' ? POUR.bloomIdealG : POUR.targetWaterG })
            : null;
    return {
      status: s.status,
      guidance: s.guidance,
      stepIndex: idx,
      stepCount: POUR_STEPS.length,
      stepTitle: step ? P.steps[step].title : null,
      doXr: step ? P.steps[step].doXr : null,
      doScreen: step ? P.steps[step].doScreen : null,
      showStepLabel: c.stepLabel && !!step,
      showInstruction: c.nextStepText && !!step,
      progress,
      feedback: s.feedback,
    };
  },
  actions: pourActions,
  actionsKey: (s) =>
    [
      s.status,
      pourStepIndex(s),
      s.guidance,
      cuesOf(s).cues,
      s.filterIn,
      s.groundsIn,
      s.items.carafe.zone,
      ...(['filter', 'grounds', 'carafe', 'kettle'] as const).map((i) => s.items[i].heldBy),
      kettleFlow(s) > 0,
      s.offsetM === null || s.offsetM > POUR.bedR,
      freeWaterG(s) > 0.5,
      s.carafeG > 0.5,
      s.rinseG >= POUR.rinseMinG + 5,
      s.brewG >= POUR.bloomIdealG - 2,
      s.brewG >= POUR.targetWaterG - 2,
      s.items.kettle.heldBy ? pourRemaining(s) : '',
    ].join('|'),
  result(s): MissionResult {
    const b = baseResult(s, 'pourover-bloom');
    const flow = flowSummary(s.flowStats);
    const water = Math.round(s.brewG * 10) / 10;
    const ratio = formatBrewRatio(POUR.doseG, s.brewG);
    const seq = POUR_STEPS.length / (POUR_STEPS.length + b.mistakes);
    const acc = targetAccuracy(s.brewG);
    const score = Math.round((b.spatialPractice ? 0.4 * seq + 0.3 * flow.steadiness + 0.3 * acc : 0.55 * seq + 0.45 * acc) * 100) / 100;
    const brewTime = s.brewStartSec !== null && s.drawdownDoneSec !== null ? Math.round(s.drawdownDoneSec - s.brewStartSec) : null;
    return {
      ...b,
      illustrativeModel: true,
      stats: [
        { label: P.stats.water, value: t(`${water} g`, `${water} 克`) },
        { label: P.stats.ratio, value: t(ratio) },
        { label: P.stats.overshoot, value: t(`${Math.max(0, Math.round(s.brewG - POUR.targetWaterG))} g`, `${Math.max(0, Math.round(s.brewG - POUR.targetWaterG))} 克`) },
        { label: P.stats.steadiness, value: b.spatialPractice ? t(`${Math.round(flow.steadiness * 100)}%`) : P.steadyNa },
        { label: P.stats.flow, value: t(`${flow.meanGps} g/s`, `${flow.meanGps} 克/秒`) },
        {
          label: P.stats.bloom,
          value: t(
            `${Math.round(s.bloom.pouredG)} g / ${Math.round(s.bloom.waitedSec)} s${s.bloom.skipped ? ' (skipped)' : ''}`,
            `${Math.round(s.bloom.pouredG)} 克 / ${Math.round(s.bloom.waitedSec)} 秒${s.bloom.skipped ? '（已跳过）' : ''}`,
          ),
        },
        { label: P.stats.offTarget, value: t(`${Math.round(s.wallG)} g / ${Math.round(s.spillG)} g`, `${Math.round(s.wallG)} 克 / ${Math.round(s.spillG)} 克`) },
        { label: P.stats.pours, value: t(String(s.stagePours)) },
        { label: S.mistakes, value: t(String(b.mistakes)) },
        { label: S.hintsUsed, value: t(String(b.hintsUsed)) },
        { label: S.time, value: brewTime !== null ? t(`${brewTime} s`, `${brewTime} 秒`) : t(`${b.durationSec} s`, `${b.durationSec} 秒`) },
        { label: S.score, value: t(`${Math.round(score * 100)}%`) },
      ],
      note: {
        en: `${fmt(P.ratioNote, { w: Math.round(water), ratio }).en} ${FLOW_MODEL_NOTE.en}`,
        zh: `${fmt(P.ratioNote, { w: Math.round(water), ratio }).zh}${FLOW_MODEL_NOTE.zh}`,
      },
      practiced: b.spatialPractice ? [...P.practices] : [P.practices[0]!, P.practices[3]!],
      notTrained: P.notTrains,
      score,
      notes:
        `simulated pourover-bloom; water=${water}g ratio=${ratio} overshoot=${Math.max(0, Math.round(s.brewG - POUR.targetWaterG))}g ` +
        `steadiness=${b.spatialPractice ? flow.steadiness : 'n/a'} wall=${Math.round(s.wallG)}g bloom=${Math.round(s.bloom.pouredG)}g/${Math.round(s.bloom.waitedSec)}s ` +
        `hints=${b.hintsUsed} tiers=${b.guidanceUsed.join('>')} input=${b.primaryInput}`,
    };
  },
  readout(s) {
    const step = currentPourStep(s);
    if (!s.filterIn && s.rinseG === 0 && s.brewG === 0) return null;
    const target = step === 'bloom' ? POUR.bloomIdealG : step === 'rinse' ? POUR.rinseMinG + 5 : POUR.targetWaterG;
    const poured = s.groundsIn ? s.brewG : s.rinseG;
    const near = cuesOf(s).yieldCue && kettleFlow(s) > 0 && poured >= target - (target > 100 ? 15 : 6);
    return {
      big: `${scaleReading(s).toFixed(1)} g`,
      small: fmt(P.readout, { w: Math.round(poured), t: target, f: kettleFlow(s).toFixed(1) }),
      tone: near ? (poured >= target - 3 ? 'on' : 'near') : 'normal',
      bar: { value: poured, max: target > 100 ? 280 : target * 1.6, target },
    };
  },
  status(s) {
    const where: Record<string, LocalizedText> = {
      'filter-stack': t('filter stack', '滤纸堆'),
      'grounds-spot': t('its spot', '原位'),
      dripper: t('in the dripper', '在滤杯里'),
      scale: t('on the scale', '在秤上'),
      sink: t('in the sink', '在水槽'),
      'kettle-base': t('on its base', '在底座上'),
    };
    return [
      fmt(t('Filter: {f} · Grounds: {g}', '滤纸：{f} · 咖啡粉：{g}'), { f: s.filterIn ? t('in place', '已放好') : t('not yet', '未放'), g: s.groundsIn ? t('in (15 g)', '已加（15 克）') : t('not yet', '未加') }),
      fmt(t('Carafe: {w} · {c} g inside', '分享壶：{w} · 内有 {c} 克'), { w: s.items.carafe.heldBy ? S.holding : where[s.items.carafe.zone]!, c: Math.round(s.carafeG) }),
      fmt(t('Kettle: {w} · tilt {tilt}° · flow {f} g/s', '水壶：{w} · 倾斜 {tilt}° · 流量 {f} 克/秒'), {
        w: s.items.kettle.heldBy ? S.holding : where['kettle-base']!,
        tilt: Math.round(s.tiltDeg),
        f: kettleFlow(s).toFixed(1),
      }),
      fmt(t('Scale: {g} g · in the dripper: {b} g', '秤：{g} 克 · 滤杯中：{b} 克'), { g: scaleReading(s).toFixed(1), b: Math.round(s.bedG) }),
    ];
  },
  xrButtons(s) {
    const step = currentPourStep(s);
    return step === 'bloom-wait' || step === 'drawdown' ? [{ id: 'skip', label: P.actions.skip, action: { type: 'SKIP_WAIT' } }] : [];
  },
  loadScene: () => import('../../scene/pouroverStation').then((m) => m.pouroverStationFactory),
};

export { pourInfo };
