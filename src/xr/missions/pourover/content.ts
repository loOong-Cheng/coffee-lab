/** Pour-over bloom mission — bilingual content (tool descriptions from src/content equipment). */
import type { LocalizedText } from '../../../domain/contracts';
import { getEquipment } from '../../../content';
import { POUR } from './model';

export type PourItem = 'filter' | 'grounds' | 'carafe' | 'kettle';
export type PourZone = 'filter-stack' | 'grounds-spot' | 'dripper' | 'scale' | 'sink' | 'kettle-base';
export type PourPart = PourItem | 'dripper' | 'scale' | 'sink';
export type PourStep = 'place-filter' | 'rinse' | 'discard' | 'add-grounds' | 'tare' | 'bloom' | 'bloom-wait' | 'pour' | 'drawdown';

export const POUR_STEPS: readonly PourStep[] = ['place-filter', 'rinse', 'discard', 'add-grounds', 'tare', 'bloom', 'bloom-wait', 'pour', 'drawdown'];

const EQUIP: Partial<Record<PourPart, string>> = {
  kettle: 'gooseneck-kettle',
  dripper: 'dripper',
  filter: 'paper-filter',
  carafe: 'carafe',
  scale: 'scale',
};
const LOCAL_INFO: Record<'grounds' | 'sink', { name: LocalizedText; purpose: LocalizedText }> = {
  grounds: {
    name: { en: 'Ground coffee (15 g)', zh: '咖啡粉（15 克）' },
    purpose: { en: 'Medium-fine grounds, weighed out for one cup (illustrative dose).', zh: '中细研磨的咖啡粉，按一杯的量称好（示意粉量）。' },
  },
  sink: {
    name: { en: 'Sink', zh: '水槽' },
    purpose: { en: 'Where the filter-rinse water goes — never into your cup.', zh: '冲洗滤纸的水倒在这里——别倒进杯子里。' },
  },
};

export function pourInfo(id: PourPart): { name: LocalizedText; purpose: LocalizedText } {
  if (id === 'grounds' || id === 'sink') return LOCAL_INFO[id];
  const e = getEquipment(EQUIP[id]!);
  return e ? { name: e.name, purpose: e.description } : { name: { en: id, zh: id }, purpose: { en: '', zh: '' } };
}

export const P = {
  title: { en: 'Pour-over: bloom and steady pours', zh: '手冲：闷蒸与稳定注水' },
  short: { en: 'Pour-over bloom', zh: '手冲闷蒸' },
  intro: {
    en: 'Set up a dripper, rinse the filter, bloom 15 g of coffee and pour in stages to 250 g. Your kettle tilt sets the flow and your aim sets where the water lands.',
    zh: '装好滤杯、冲洗滤纸、给 15 克咖啡粉闷蒸，再分段注水到 250 克。水壶倾斜决定水流大小，瞄准位置决定水落在哪里。',
  },
  practices: [
    { en: 'Pour-over order: rinse, dose, tare, bloom, staged pours', zh: '手冲顺序：冲洗、放粉、去皮、闷蒸、分段注水' },
    { en: 'Controlling flow with kettle tilt (simulated)', zh: '用水壶倾斜控制水流（模拟）' },
    { en: 'Aiming the stream at the coffee bed, not the filter wall', zh: '把水流对准粉层，而不是滤纸壁' },
    { en: 'Pouring to a target weight on the scale', zh: '看着秤注水到目标重量' },
  ],
  notTrains: [
    {
      en: 'Real pour control: a hot, full kettle’s weight, balance and feel in your hand, and water temperature',
      zh: '真实的注水控制：一壶热水在手里的重量、平衡和手感，以及水温',
    },
    { en: 'Grind size and taste — the flow here is an illustrative model, not a flavour prediction', zh: '研磨度和味道——这里的流量只是示意模型，不能预测风味' },
    { en: 'How your own dripper and filter actually drain', zh: '你自己的滤杯和滤纸实际的滴滤速度' },
  ],
  steps: {
    'place-filter': {
      title: { en: 'Put a paper filter in the dripper', zh: '把滤纸放进滤杯' },
      doXr: { en: 'Grab a filter from the stack and let go over the dripper.', zh: '从纸堆上拿一张滤纸，在滤杯上方松手。' },
      doScreen: { en: 'Drag a paper filter from the stack onto the dripper.', zh: '把一张滤纸从纸堆拖到滤杯上。' },
      why: { en: 'The filter holds back the grounds for a clean cup.', zh: '滤纸挡住咖啡粉，让咖啡更干净。' },
    },
    rinse: {
      title: { en: 'Rinse the filter with hot water', zh: '用热水冲洗滤纸' },
      doXr: { en: 'Pick up the kettle by its handle, hold it over the dripper and tip it until water flows (about 25 g).', zh: '握住水壶把手，移到滤杯上方，倾斜到出水（约 25 克）。' },
      doScreen: {
        en: 'Drag the kettle over the dripper and let go; pour about 25 g with the scroll wheel, ↑/↓ or the pour buttons.',
        zh: '把水壶拖到滤杯上方松手；用滚轮、↑/↓ 键或注水按钮倒约 25 克。',
      },
      why: { en: 'Rinsing reduces papery taste and warms the gear.', zh: '冲洗能减少纸味，同时预热器具。' },
    },
    discard: {
      title: { en: 'Empty the rinse water', zh: '倒掉冲洗水' },
      doXr: { en: 'Carry the carafe (the dripper rides along) to the sink, let go, then set it back on the scale.', zh: '把分享壶（滤杯跟着一起）拿到水槽松手，再放回秤上。' },
      doScreen: { en: 'Drag the carafe to the sink, then back onto the scale.', zh: '把分享壶拖到水槽，再拖回秤上。' },
      why: { en: 'Rinse water would dilute your coffee.', zh: '冲洗水会冲淡你的咖啡。' },
    },
    'add-grounds': {
      title: { en: 'Add 15 g of ground coffee', zh: '加入 15 克咖啡粉' },
      doXr: { en: 'Grab the small cup of grounds and tip it over the dripper.', zh: '拿起装咖啡粉的小杯，倒进滤杯。' },
      doScreen: { en: 'Drag the cup of grounds onto the dripper.', zh: '把装咖啡粉的小杯拖到滤杯上。' },
      why: { en: `${POUR.doseG} g with ${POUR.targetWaterG} g of water is an illustrative 1:16.7 starting point.`, zh: `${POUR.doseG} 克粉配 ${POUR.targetWaterG} 克水，是 1:16.7 的示意起点。` },
    },
    tare: {
      title: { en: 'Tare the scale', zh: '秤归零（去皮）' },
      doXr: { en: "Point at the scale's TARE button and pull the trigger.", zh: '用射线指向秤的「去皮」键并扣动扳机。' },
      doScreen: { en: "Click the scale's TARE button.", zh: '点击秤的「去皮」键。' },
      why: { en: 'Now the scale shows only the water you pour.', zh: '这样秤上显示的就只是你倒入的水。' },
    },
    bloom: {
      title: { en: `Bloom: pour about ${POUR.bloomIdealG} g`, zh: `闷蒸：倒约 ${POUR.bloomIdealG} 克` },
      doXr: { en: 'Pour gently over the centre until the scale nears 30 g, then tip the kettle back.', zh: '对准中心轻轻倒水，秤接近 30 克时把水壶放平。' },
      doScreen: { en: 'Hold the kettle over the centre and pour gently to about 30 g, then stop.', zh: '把水壶停在中心上方，轻轻倒到约 30 克后停止。' },
      why: { en: 'A little water (≈2–3× the coffee) wets every ground and lets gas escape.', zh: '少量的水（约粉量的 2–3 倍）润湿所有咖啡粉，让气体排出。' },
    },
    'bloom-wait': {
      title: { en: 'Wait 30–45 s while it blooms', zh: '等待 30–45 秒闷蒸' },
      doXr: { en: 'Watch the bed puff up. You can skip the wait from the panel.', zh: '看粉层鼓起来。也可以在面板上跳过等待。' },
      doScreen: { en: 'Watch the bed puff up, or use “Skip the wait”.', zh: '看粉层鼓起来，或使用“跳过等待”。' },
      why: { en: 'Letting the gas escape helps later water reach the coffee evenly.', zh: '让气体排出，之后的水才能更均匀地接触咖啡。' },
    },
    pour: {
      title: { en: `Pour in stages to ${POUR.targetWaterG} g`, zh: `分段注水到 ${POUR.targetWaterG} 克` },
      doXr: { en: 'Pour slowly in small circles over the middle — e.g. to 150 g, pause, then to 250 g. Avoid the filter wall.', zh: '在中间小圈慢慢注水——比如先到 150 克，停一下，再到 250 克。避开滤纸壁。' },
      doScreen: { en: 'Pour steadily over the middle in 2–3 pours to 250 g. Keep the stream off the filter wall.', zh: '在中间分 2–3 次稳定注水到 250 克，别冲到滤纸壁上。' },
      why: { en: 'Steady, centred pours keep the bed even; water on the wall can bypass the coffee.', zh: '稳定、居中的注水让粉层均匀；冲到滤纸壁上的水可能绕过咖啡。' },
    },
    drawdown: {
      title: { en: 'Let it draw down', zh: '等待滴滤完成' },
      doXr: { en: 'Wait for the water to drain through (or skip from the panel).', zh: '等水全部滴完（或在面板上跳过）。' },
      doScreen: { en: 'Wait for the water to drain through, or use “Skip the wait”.', zh: '等水全部滴完，或使用“跳过等待”。' },
      why: { en: 'The brew is done when the bed stops dripping.', zh: '粉层不再滴水时，冲煮就完成了。' },
    },
  } satisfies Record<PourStep, { title: LocalizedText; doXr: LocalizedText; doScreen: LocalizedText; why: LocalizedText }>,
  fb: {
    'step-complete': { en: 'Done: {title}', zh: '完成：{title}' },
    complete: { en: 'Brew complete — a simulated pour-over from rinse to drawdown.', zh: '冲煮完成——从冲洗到滴滤完成的一次模拟手冲。' },
    'pour-before-tare': {
      en: 'Tare first! The scale still counts the carafe and coffee, so you cannot see how much water you poured.',
      zh: '先去皮！秤上还算着分享壶和咖啡粉，你看不出倒了多少水。',
    },
    'pour-no-filter': { en: 'No filter in the dripper — the water runs straight through. Put a paper filter in first.', zh: '滤杯里没有滤纸——水会直接流下去。先放滤纸。' },
    'pour-wall': {
      en: 'The stream is hitting the filter wall — that water can bypass the coffee. Aim for the middle in small circles.',
      zh: '水流冲到滤纸壁上了——这部分水可能绕过咖啡。对准中间小圈注水。',
    },
    spill: { en: 'Water is missing the dripper and spilling. Move the spout over the coffee.', zh: '水没有倒进滤杯，洒出来了。把壶嘴移到咖啡上方。' },
    'grounds-no-filter': { en: 'Put a paper filter in first, or the grounds end up in the cup.', zh: '先放滤纸，不然咖啡粉会掉进杯里。' },
    'grounds-before-rinse': { en: 'Rinse the filter first — it reduces papery taste and preheats.', zh: '先冲洗滤纸——能减少纸味并预热。' },
    'grounds-before-discard': { en: 'Empty the rinse water from the carafe first, or it ends up in your coffee.', zh: '先倒掉分享壶里的冲洗水，不然它会混进咖啡。' },
    'discard-coffee': { en: 'That is your coffee in there — keep the carafe on the scale.', zh: '里面是你的咖啡——让分享壶留在秤上。' },
    'discard-ok': { en: 'Rinse water poured away. Now put the carafe back on the scale.', zh: '冲洗水已倒掉。现在把分享壶放回秤上。' },
    'discard-empty': { en: 'The carafe is already empty.', zh: '分享壶已经是空的。' },
    'tare-early': { en: 'Scale zeroed. Add the grounds, then tare again so it shows only water.', zh: '秤已归零。加入咖啡粉后再去皮一次，读数才只是水。' },
    'tare-ok': { en: 'Scale reads 0.0 g.', zh: '秤显示 0.0 克。' },
    'tare-during-pour': { en: 'Do not re-zero while pouring — you would lose count of the water.', zh: '注水时不要归零——会算不清倒了多少水。' },
    'bloom-more': { en: 'That is {g} g — pour a little more (about 30 g) so every ground gets wet.', zh: '目前 {g} 克——再倒一点（约 30 克），让所有粉都湿透。' },
    'bloom-ok': { en: 'Bloom pour: {g} g. Now wait while it bubbles.', zh: '闷蒸注水：{g} 克。现在等它冒泡。' },
    'bloom-big': { en: 'Bloom pour: {g} g — more than a bloom needs (≈2–3× the coffee). Fine, carry on.', zh: '闷蒸注水：{g} 克——比闷蒸需要的多（约粉量 2–3 倍）。没关系，继续。' },
    'bloom-cut-short': { en: 'You started pouring after only {s} s of bloom. Next time wait about 30–45 s.', zh: '闷蒸才 {s} 秒就开始注水了。下次等约 30–45 秒。' },
    'bloom-waited': { en: 'Bloom done ({s} s). Now pour in stages to 250 g.', zh: '闷蒸完成（{s} 秒）。现在分段注水到 250 克。' },
    'keep-going': { en: 'Paused at {g} g — keep going to 250 g when ready.', zh: '暂停在 {g} 克——准备好后继续注水到 250 克。' },
    approaching: { en: 'Almost there — {g} g. Slow down near 250 g.', zh: '快到了——{g} 克。接近 250 克时放慢。' },
    overshoot: { en: 'Past 250 g ({g} g) — stop pouring.', zh: '超过 250 克了（{g} 克）——停止注水。' },
    skipped: { en: 'Skipped ahead (simulated time).', zh: '已跳过（模拟时间）。' },
    'nothing-to-skip': { en: 'Nothing to wait for right now.', zh: '现在没有需要等待的。' },
    'kettle-empty': { en: 'The kettle is empty — put it back on its base to refill.', zh: '水壶空了——放回底座补水。' },
    'filter-in': { en: 'The filter is already in the dripper.', zh: '滤纸已经在滤杯里了。' },
    'grounds-in': { en: 'The grounds are already in.', zh: '咖啡粉已经加好了。' },
    inspect: { en: '{name}: {purpose}', zh: '{name}：{purpose}' },
  },
  actions: {
    filter: { en: 'Put a paper filter in the dripper', zh: '把滤纸放进滤杯' },
    grounds: { en: 'Add the 15 g of grounds', zh: '加入 15 克咖啡粉' },
    toSink: { en: 'Empty the carafe into the sink', zh: '把分享壶里的水倒进水槽' },
    toScale: { en: 'Put the carafe back on the scale', zh: '把分享壶放回秤上' },
    tare: { en: 'Press TARE on the scale', zh: '按秤上的「去皮」键' },
    pickKettle: { en: 'Pick up the kettle (over the dripper centre)', zh: '拿起水壶（移到滤杯中心上方）' },
    toTarget: { en: 'Pour {g} g more, then stop (to {t} g)', zh: '再倒 {g} 克后停（到 {t} 克）' },
    pulse10: { en: 'Pour a measured 10 g, then stop', zh: '定量倒 10 克后停' },
    pulse50: { en: 'Pour a measured 50 g, then stop', zh: '定量倒 50 克后停' },
    gentle: { en: 'Pour gently (≈3 g/s) — keeps flowing until you stop', zh: '轻柔注水（约 3 克/秒）——直到你按停止' },
    faster: { en: 'Pour faster (≈7 g/s)', zh: '加快注水（约 7 克/秒）' },
    stop: { en: 'Stop pouring (tip kettle back)', zh: '停止注水（把水壶放平）' },
    center: { en: 'Aim at the centre', zh: '对准中心' },
    spiral: { en: 'Aim in small circles over the bed', zh: '在粉层上方小圈注水' },
    wall: { en: 'Aim at the filter wall', zh: '对准滤纸壁' },
    putDown: { en: 'Put the kettle down (refills)', zh: '放下水壶（补水）' },
    skip: { en: 'Skip the wait', zh: '跳过等待' },
  },
  progress: {
    water: { en: 'Water poured: {g} g of {target} g', zh: '已注水：{g} / {target} 克' },
    bloom: { en: 'Bloom: {s} s (aim 30–45 s)', zh: '闷蒸：{s} 秒（目标 30–45 秒）' },
    rinse: { en: 'Rinse water: {g} g', zh: '冲洗水：{g} 克' },
  },
  readout: { en: 'poured {w} g · target {t} g · flow {f} g/s · illustrative', zh: '已注 {w} 克 · 目标 {t} 克 · 流量 {f} 克/秒 · 示意' },
  stats: {
    bloom: { en: 'Bloom water / wait', zh: '闷蒸水量 / 时间' },
    water: { en: 'Total water (target 250 g)', zh: '总注水（目标 250 克）' },
    overshoot: { en: 'Overshoot', zh: '超出' },
    ratio: { en: 'Ratio (water ÷ coffee)', zh: '粉水比（水 ÷ 粉）' },
    flow: { en: 'Average flow', zh: '平均流量' },
    steadiness: { en: 'Pour steadiness', zh: '注水稳定度' },
    offTarget: { en: 'On the wall / spilled', zh: '冲壁 / 洒出' },
    pours: { en: 'Pours after bloom', zh: '闷蒸后注水次数' },
  },
  ratioNote: {
    en: '{w} g water ÷ 15 g coffee ≈ {ratio}. Ratio arithmetic is exact; flow and timing come from an illustrative model — taste decides real recipes.',
    zh: '{w} 克水 ÷ 15 克粉 ≈ {ratio}。比例计算是准确的；流量和时间来自示意模型——真实配方以味道为准。',
  },
  steadyNa: { en: 'n/a (action list)', zh: '不适用（操作列表）' },
  nextReal: { en: 'Brew a real pour-over', zh: '冲一杯真实的手冲' },
  tiltLabel: { en: 'Kettle tilt', zh: '水壶倾斜' },
  holdPour: { en: 'Hold to pour', zh: '按住注水' },
  controlsPointer: {
    en: 'Drag tools with mouse or finger. Let go of the kettle over the dripper and it stays there: tip it with the scroll wheel, ↑/↓, or the pour controls in the side panel. Drag it away to put it down.',
    zh: '用鼠标或手指拖动工具。把水壶拖到滤杯上方松手，它会停在那里：用滚轮、↑/↓ 键或侧栏的注水控件来倾斜。把它拖开即可放下。',
  },
  controlsXr: {
    en: 'Grip to hold the kettle; tip your wrist to pour (simulated flow). Trigger presses buttons.',
    zh: '按握持键拿住水壶，转动手腕倾斜即可注水（模拟水流）。扳机键用来按按钮。',
  },
} as const;
