/** "station-tour" framework definition. */
import type { MissionDef, MissionResult, PanelAction } from '../../mission/core';
import { baseResult, cuesOf } from '../../mission/core';
import type { HandId, ItemId, MissionAction } from '../../mission/types';
import { ACTION_LABEL, ITEM_NAME, ZONE_NAME, fmt } from '../../mission/content';
import { zonesFor } from '../../mission/reducer';
import type { StationView } from '../../mission/stationView';
import { MODEL } from '../../mission/extraction';
import { S } from '../../strings';
import { CHALLENGES, EXPLORE_TARGET, INSPECTABLE, T, tourInfo } from './content';
import { createTour, currentChallenge, promptOf, tourCue, tourReducer, type TourState } from './reducer';

export function tourView(s: TourState): StationView {
  return {
    status: s.status,
    guidance: s.guidance,
    items: s.items,
    basket: 'empty',
    grinder: { running: false, elapsedSec: 0 },
    shot: { status: 'idle', elapsedSec: 0, yieldG: 0 },
    flushRunning: false,
    knocked: false,
    scaleReadingG: s.items.cup.heldBy === null && s.items.cup.zone === 'scale' ? MODEL.cupMassG : 0,
    cupOnScale: s.items.cup.heldBy === null && s.items.cup.zone === 'scale',
    cue: tourCue(s),
    cues: cuesOf(s),
    basketOpen: () => false,
  };
}

function tourActions(s: TourState): PanelAction<MissionAction>[] {
  if (s.status !== 'playing') return [];
  const cue = tourCue(s);
  const show = cuesOf(s).cues;
  const out: PanelAction<MissionAction>[] = [];
  for (const id of INSPECTABLE) {
    out.push({
      id: `inspect-${id}`,
      label: fmt(T.inspectAction, { tool: tourInfo(id).name }),
      actions: [{ type: 'LOCATE', target: id, source: 'panel' }],
      recommended: show && cue?.kind === 'look' && cue.part === id,
    });
  }
  const hand: HandId = 'pointer';
  const held = (['portafilter', 'cup', 'tamper'] as const).find((i) => s.items[i].heldBy === hand);
  if (held) {
    for (const zone of zonesFor(held)) {
      if (zone === 'basket' || zone === s.items[held].zone) continue;
      out.push({
        id: `place-${held}-${zone}`,
        label: fmt(ACTION_LABEL.place, { item: ITEM_NAME[held], zone: ZONE_NAME[zone] }),
        actions: [{ type: 'RELEASE', hand, zone, distanceM: 0, source: 'panel' }],
        recommended: show && cue?.kind === 'place' && cue.item === held && cue.zone === zone,
      });
    }
    // Holding the wrong thing for the current task → suggest putting it back.
    const wrongItem = !!cue && (cue.kind === 'grab' || cue.kind === 'place') && cue.item !== held;
    out.push({ id: `putback-${held}`, label: fmt(ACTION_LABEL.putBack, { item: ITEM_NAME[held] }), actions: [{ type: 'RELEASE', hand, source: 'panel' }], recommended: show && wrongItem });
  } else {
    for (const item of ['portafilter', 'tamper', 'cup'] as ItemId[]) {
      out.push({
        id: `grab-${item}`,
        label: fmt(ACTION_LABEL.grab, { item: ITEM_NAME[item] }),
        actions: [{ type: 'GRAB', item, hand, source: 'panel' }],
        recommended: show && cue?.kind === 'grab' && cue.item === item,
      });
    }
  }
  return out;
}

export const tourMission: MissionDef<TourState, MissionAction> = {
  id: 'station-tour',
  activityId: 'esp-meet-the-machine-xr',
  lessonId: 'esp-meet-the-machine',
  title: T.title,
  short: T.short,
  intro: T.intro,
  practices: T.practices,
  notTrains: T.notTrains,
  minutes: [2, 4],
  stepTitles: [T.exploreTitle, ...CHALLENGES.map((c) => c.named)],
  realNext: { to: '/xr?mission=espresso-first-shot', label: T.nextReal },
  controlsHelp: { pointer: S.controlsHelpPointer, xr: S.controlsHelpXr },
  create: (g) => createTour(g),
  reduce: tourReducer,
  hud(s) {
    const c = currentChallenge(s);
    const cues = cuesOf(s);
    const idx = s.phase === 'explore' ? 0 : 1 + s.challengeIndex;
    const how = !c
      ? { xr: T.exploreXr, screen: T.exploreScreen }
      : c.kind === 'locate'
        ? { xr: T.doLocateXr, screen: T.doLocateScreen }
        : c.kind === 'grab'
          ? { xr: T.doGrabXr, screen: T.doGrabScreen }
          : { xr: T.doPlaceXr, screen: T.doPlaceScreen };
    return {
      status: s.status,
      guidance: s.guidance,
      stepIndex: Math.min(idx, CHALLENGES.length),
      stepCount: CHALLENGES.length + 1,
      // The task itself is always shown; independent words it by function instead of name.
      stepTitle: s.status === 'complete' ? null : c ? promptOf(c, s.guidance) : T.exploreTitle,
      doXr: how.xr,
      doScreen: how.screen,
      showStepLabel: s.status !== 'complete',
      showInstruction: s.phase === 'explore' || cues.nextStepText,
      progress:
        s.phase === 'explore'
          ? fmt(T.explored, { n: s.inspected.length, total: EXPLORE_TARGET })
          : fmt(T.challengeProgress, { n: Math.min(s.challengeIndex + 1, CHALLENGES.length), total: CHALLENGES.length }),
      feedback: s.feedback,
    };
  },
  actions: tourActions,
  actionsKey: (s) =>
    [s.status, s.phase, s.challengeIndex, s.inspected.length, s.guidance, cuesOf(s).cues, ...(['portafilter', 'cup', 'tamper'] as const).map((i) => `${s.items[i].zone}:${s.items[i].heldBy}`)].join('|'),
  result(s): MissionResult {
    const b = baseResult(s, 'station-tour');
    const firstTry = s.misses.filter((m, i) => m === 0 && i < s.challengeIndex).length;
    const done = Math.min(s.challengeIndex, CHALLENGES.length);
    const firstTryRate = done ? firstTry / done : 0;
    const score = Math.round((0.8 * firstTryRate + 0.2 * Math.min(1, s.inspected.length / EXPLORE_TARGET)) * 100) / 100;
    return {
      ...b,
      illustrativeModel: false,
      stats: [
        { label: T.toolsInspected, value: { en: String(s.inspected.length), zh: String(s.inspected.length) } },
        { label: T.firstTry, value: { en: `${firstTry} / ${done}`, zh: `${firstTry} / ${done}` } },
        { label: T.wrongPicks, value: { en: String(b.mistakes), zh: String(b.mistakes) } },
        { label: S.hintsUsed, value: { en: String(b.hintsUsed), zh: String(b.hintsUsed) } },
        { label: S.time, value: { en: `${b.durationSec} s`, zh: `${b.durationSec} 秒` } },
        { label: S.score, value: { en: `${Math.round(score * 100)}%`, zh: `${Math.round(score * 100)}%` } },
      ],
      note: null,
      practiced: b.spatialPractice ? T.practices : [T.practices[0]!, { en: 'Tool names and jobs via the action list (no spatial practice this time)', zh: '通过操作列表认识工具名称和用途（本次没有空间练习）' }],
      notTrained: T.notTrains,
      score,
      notes: `simulated station-tour; firstTry=${firstTry}/${done} inspected=${s.inspected.length} hints=${b.hintsUsed} tiers=${b.guidanceUsed.join('>')} input=${b.primaryInput}`,
    };
  },
  readout: () => null,
  status(s) {
    const c = currentChallenge(s);
    return [
      s.phase === 'explore' ? fmt(T.explored, { n: s.inspected.length, total: EXPLORE_TARGET }) : fmt(T.challengeProgress, { n: s.challengeIndex + 1, total: CHALLENGES.length }),
      ...(['portafilter', 'cup', 'tamper'] as const).map((i) =>
        fmt({ en: '{item}: {where}', zh: '{item}：{where}' }, { item: ITEM_NAME[i], where: s.items[i].heldBy ? S.holding : ZONE_NAME[s.items[i].zone] }),
      ),
      ...(c ? [promptOf(c, s.guidance)] : []),
    ];
  },
  xrButtons: () => [],
  loadScene: () => import('../../scene/espressoStation').then((m) => m.espressoStationFactory((s) => tourView(s as TourState), tourInfo)),
};
