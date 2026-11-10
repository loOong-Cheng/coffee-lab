/** Station tour — bilingual content. Tool descriptions come from src/content equipment where available. */
import type { LocalizedText } from '../../../domain/contracts';
import { getEquipment } from '../../../content';
import type { InspectableId, ItemId, ZoneId } from '../../mission/types';
import { TOOL_INFO } from '../../mission/content';
import type { InfoLookup } from '../../mission/stationView';

const EQUIPMENT_ID: Partial<Record<InspectableId, string>> = {
  'espresso-machine': 'espresso-machine',
  portafilter: 'portafilter',
  tamper: 'tamper',
  grinder: 'grinder',
  scale: 'scale',
  'knock-box': 'knock-box',
  cup: 'espresso-cup',
};

/** Richer descriptions from the shared equipment catalog (falls back to the short XR text). */
export const tourInfo: InfoLookup = (id) => {
  const eqId = EQUIPMENT_ID[id];
  const e = eqId ? getEquipment(eqId) : undefined;
  return e ? { name: e.name, purpose: e.description } : TOOL_INFO[id];
};

export function tourSafety(id: InspectableId): LocalizedText | undefined {
  const eqId = EQUIPMENT_ID[id];
  return eqId ? getEquipment(eqId)?.safety : undefined;
}

/** Tools the learner can inspect in explore mode (and via the action list). */
export const INSPECTABLE: readonly InspectableId[] = [
  'espresso-machine',
  'group-head',
  'grinder',
  'scale',
  'knock-box',
  'tamp-mat',
  'portafilter',
  'tamper',
  'cup',
];

export const EXPLORE_TARGET = 4;

export type Challenge =
  | { id: string; kind: 'locate'; target: InspectableId; named: LocalizedText; functional: LocalizedText; hint: LocalizedText }
  | { id: string; kind: 'grab'; item: ItemId; named: LocalizedText; functional: LocalizedText; hint: LocalizedText }
  | { id: string; kind: 'place'; item: ItemId; zone: ZoneId; named: LocalizedText; functional: LocalizedText; hint: LocalizedText };

export const CHALLENGES: readonly Challenge[] = [
  {
    id: 'find-grinder',
    kind: 'locate',
    target: 'grinder',
    named: { en: 'Point at the grinder', zh: '指向磨豆机' },
    functional: { en: 'Find the tool that grinds beans fresh', zh: '找到现磨咖啡豆的工具' },
    hint: { en: 'It is the tall black box with the bean hopper on top, left of the machine.', zh: '机器左边那个高高的黑色机器，顶上有装豆子的豆仓。' },
  },
  {
    id: 'grab-tamper',
    kind: 'grab',
    item: 'tamper',
    named: { en: 'Pick up the tamper', zh: '拿起压粉器' },
    functional: { en: 'Pick up the tool that presses the coffee bed level', zh: '拿起把咖啡粉压平的工具' },
    hint: { en: 'A wooden knob on a flat steel base, at the right front of the counter.', zh: '木柄配平底钢座，在台面右前方。' },
  },
  {
    id: 'pf-to-fork',
    kind: 'place',
    item: 'portafilter',
    zone: 'grinder-fork',
    named: { en: 'Put the portafilter on the grinder fork', zh: '把手柄放到磨豆机支架上' },
    functional: { en: 'Rest the handle-with-basket where fresh grounds fall into it', zh: '把带粉碗的把手放到新鲜咖啡粉会落进去的位置' },
    hint: { en: 'The two short prongs under the grinder chute hold the portafilter.', zh: '磨豆机出粉口下方的两根短支架用来托住手柄。' },
  },
  {
    id: 'find-group-head',
    kind: 'locate',
    target: 'group-head',
    named: { en: 'Point at the group head', zh: '指向冲煮头' },
    functional: { en: 'Find where the hot water comes out of the machine', zh: '找到咖啡机出热水的地方' },
    hint: { en: 'The round steel part under the front of the machine, above the drip tray.', zh: '机器前方下侧、滴水盘上方那个圆形钢件。' },
  },
  {
    id: 'cup-to-scale',
    kind: 'place',
    item: 'cup',
    zone: 'scale',
    named: { en: 'Put the cup on the scale', zh: '把杯子放到秤上' },
    functional: { en: 'Put the cup where you could weigh the espresso as it pours', zh: '把杯子放到可以边萃取边称重的位置' },
    hint: { en: 'The scale sits on the drip tray, right under the group head.', zh: '秤放在滴水盘上，就在冲煮头正下方。' },
  },
  {
    id: 'find-knock-box',
    kind: 'locate',
    target: 'knock-box',
    named: { en: 'Point at the knock box', zh: '指向敲渣桶' },
    functional: { en: 'Find where used coffee pucks go', zh: '找到用过的咖啡粉饼该放的地方' },
    hint: { en: 'The dark box with a bar across the top, right of the machine.', zh: '机器右边那个顶上有横杆的深色盒子。' },
  },
];

export const T = {
  title: { en: 'Station tour: meet the espresso tools', zh: '工作台导览：认识意式工具' },
  short: { en: 'Station tour', zh: '工作台导览' },
  intro: {
    en: 'Walk up to an espresso counter, point at each tool to learn what it is for, then take a few quick find-and-place challenges.',
    zh: '走到意式吧台前，指向每样工具了解它的用途，然后完成几个“找一找、放一放”的小挑战。',
  },
  practices: [
    { en: 'Recognising espresso tools and their jobs', zh: '认识意式工具及其用途' },
    { en: 'Where each tool lives on a working counter', zh: '每样工具在吧台上的位置' },
    { en: 'Picking up and placing tools (simulated)', zh: '拿起和摆放工具（模拟）' },
  ],
  notTrains: [
    { en: 'Operating a real machine — controls differ; follow your manual', zh: '操作真实咖啡机——各机型操作不同，请按说明书' },
    { en: 'Heat and safety: real group heads and steam are hot', zh: '温度与安全：真实冲煮头和蒸汽很烫' },
    { en: 'Grip, weight and feel of real tools', zh: '真实工具的握感、重量和手感' },
  ],
  exploreTitle: { en: 'Explore: inspect the tools', zh: '探索：了解每样工具' },
  exploreXr: {
    en: 'Point your controller ray at a tool and pull the trigger to read what it is for.',
    zh: '用手柄射线指向工具并扣动扳机，查看它的用途。',
  },
  exploreScreen: { en: 'Click or tap a tool to read what it is for.', zh: '点击工具，查看它的用途。' },
  explored: { en: 'Inspected {n} of {total} tools', zh: '已了解 {n}/{total} 样工具' },
  challengeProgress: { en: 'Challenge {n} of {total}', zh: '挑战 {n}/{total}' },
  doLocateXr: { en: 'Point at it and pull the trigger.', zh: '用射线指向它并扣动扳机。' },
  doLocateScreen: { en: 'Click or tap it.', zh: '点击它。' },
  doGrabXr: { en: 'Reach it and hold the grip button (or point and squeeze).', zh: '伸手按住握持键（或指向后按握持键）。' },
  doGrabScreen: { en: 'Press on it and start dragging.', zh: '按住它并开始拖动。' },
  doPlaceXr: { en: 'Carry it there and let go when the ring turns green.', zh: '把它拿过去，圆环变绿时松手。' },
  doPlaceScreen: { en: 'Drag it there and release.', zh: '把它拖过去再松开。' },
  inspectAction: { en: 'Inspect the {tool}', zh: '查看{tool}' },
  // feedback
  inspected: { en: '{name}: {purpose}', zh: '{name}：{purpose}' },
  exploreDone: { en: 'Nice look around! Now a few quick challenges.', zh: '看得很仔细！接下来是几个小挑战。' },
  correct: { en: 'Yes — {name}.', zh: '对了——{name}。' },
  wrongLocate: { en: 'That is the {name}. {hint}', zh: '这是{name}。{hint}' },
  wrongGrab: { en: 'That is the {name}. {hint}', zh: '这是{name}。{hint}' },
  wrongPlace: { en: 'That spot is {zone}. {hint}', zh: '那是{zone}。{hint}' },
  machineOff: { en: 'The machine is off during the tour — that button is the {name}.', zh: '导览时机器是关着的——那个按钮是{name}。' },
  hint: { en: 'Hint: {named} — {hint}', zh: '提示：{named}——{hint}' },
  complete: { en: 'Tour complete — you know your way around this counter (simulated).', zh: '导览完成——你已经熟悉这个吧台了（模拟）。' },
  // summary
  firstTry: { en: 'Found on first try', zh: '一次找对' },
  toolsInspected: { en: 'Tools inspected', zh: '了解的工具' },
  wrongPicks: { en: 'Wrong picks', zh: '选错次数' },
  nextReal: { en: 'Espresso workflow mission', zh: '意式流程任务' },
} satisfies Record<string, LocalizedText | LocalizedText[]>;
