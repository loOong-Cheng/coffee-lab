/** Café Rush UI text (zh + en). Drink/option names come from the Café Counter strings. */
import type { LocalizedText } from '../../domain/contracts';
import { CUP_TEXT, EXTRA_TEXT, MILK_TEXT, SHOT_STYLE_TEXT, milkMlText, waterMlText } from '../../features/cafe/strings';
import type { MilkMl, WaterMl } from '../../features/cafe/model';
import type { Item, PlayerAction, RushState, SlotId } from './sim';
import { drinkName } from './drinks';
import { CUSTOMERS } from '../../features/cafe/specs';

const L = (zh: string, en: string): LocalizedText => ({ zh, en });
const cat = (...p: LocalizedText[]): LocalizedText => L(p.map((x) => x.zh).join(''), p.map((x) => x.en).join(''));

export const R = {
  title: L('咖啡快跑', 'Café Rush'),
  tagline: L('一张吧台、所有工具、一个接一个的客人——在时间压力下做对每一杯。', 'One counter, every tool, a line of customers — make each drink right, against the clock.'),
  gameCard: L('游戏', 'Game'),
  gamesHeading: L('游戏', 'Games'),
  openGame: L('打开咖啡快跑', 'Open Café Rush'),
  levelsHeading: L('关卡', 'Levels'),
  level: L('第 {n} 关', 'Level {n}'),
  locked: L('未解锁：上一关拿到 1 颗星即可解锁', 'Locked: earn 1 star on the level before'),
  best: L('最佳：{n} 星', 'Best: {n} ★'),
  notPlayed: L('还没玩过', 'Not played yet'),
  newDrinks: L('新饮品', 'New drinks'),
  options: L('玩法', 'How to play'),
  howTo: [
    L('看订单票：饮品、客人，还有一条耐心条。', 'Read the order tickets: the drink, the customer and a patience bar.'),
    L('在吧台上做这杯：拿杯子，磨豆、上冲煮头、萃取，再按需要加奶、水、冰或配料，最后出品给对应的客人。', 'Build the drink at the stations: take a cup; grind, lock in and pull the shot; add milk, water, ice or extras as needed; then serve that customer.'),
    L('萃取或打奶在进行时，先去做下一件事——同时安排几件事就是这个游戏要练的。', 'While a shot or the milk runs, start the next task — overlapping work is the skill this game trains.'),
    L('在耐心条用完前出品。做错的杯子会退回来，并告诉你哪里不同、为什么。', 'Serve before the bar runs out. A wrong drink comes back with what differs and why.'),
  ],
  settings: L('设置', 'Settings'),
  tierHeading: L('提示程度', 'Guidance level'),
  tierNotes: {
    guided: L('引导：高亮“下一步建议”，给出“趁萃取的时候…”提示；订单票上有配方数字和“快要走了”提醒。', 'Guided: the suggested next step is highlighted, with "while it brews…" hints; tickets show the recipe numbers and the "About to leave!" cue.'),
    assisted: L('辅助：没有下一步建议和提示；订单票上仍有配方数字和“快要走了”提醒。', 'Assisted: no suggested step and no hints; tickets still show the recipe numbers and the "About to leave!" cue.'),
    independent: L('独立：没有建议、提示和“快要走了”提醒，订单票上也没有配方数字——看配方墙。每次出品后仍会给反馈。', 'Independent: no suggestions, hints or leave cue, and no recipe numbers on tickets — use the recipe wall. You still get feedback after every serve.'),
  } as Record<'guided' | 'assisted' | 'independent', LocalizedText>,
  relaxed: L('轻松模式：不计时，客人一直等', 'Relaxed mode: no timers, customers wait'),
  relaxedNote: L('轻松模式没有倒计时、奶不会过热，做完 {n} 杯结束；星级看做对的比例。', 'No countdowns and no overheating; the shift ends after {n} drinks; stars come from how many were textbook.'),
  play3d: L('在 3D 吧台中玩', 'Play on the 3D counter'),
  playList: L('用操作列表玩（键盘 / 读屏）', 'Play with the action list (keyboard / screen reader)'),
  honesty: L(
    '模拟练习：时间是压缩的“游戏时间”，墙上的配方是示例起点。游戏不判断味道，也不代表真实操作技能。',
    'Simulated practice: clocks run in compressed “game time” and the wall shows illustrative starting recipes. The game does not judge taste or real hands-on skill.',
  ),
  simulated: L('模拟', 'Simulated'),
  gameTimeShot: L('游戏时间——真实浓缩约 25–35 秒', 'game time — real shot ≈ 25–35 s'),
  hardware: L('VR 模式未在真实头显上测试（硬件未验证）。', 'VR mode has not been tested on a real headset (hardware-unverified).'),
  // HUD
  orders: L('订单', 'Orders'),
  noOrders: L('暂时没有客人——准备一下吧台。', 'No customers right now — get the bar ready.'),
  leaving: L('快要走了！', 'About to leave!'),
  leavingAnn: L('{c}（{d}）快要走了！', '{c} ({d}) is about to leave!'),
  clock: L('剩余', 'Left'),
  patience: L('耐心', 'Patience'),
  waitsForever: L('不着急', 'No rush'),
  score: L('得分', 'Score'),
  tips: L('小费', 'Tips'),
  streak: L('连续完美', 'Streak'),
  timeLeft: L('剩余（游戏时间）', 'Time left (game time)'),
  served: L('已出品 {n}/{m}', 'Served {n}/{m}'),
  pause: L('暂停', 'Pause'),
  resume: L('继续', 'Resume'),
  paused: L('已暂停', 'Paused'),
  endShift: L('结束这一班', 'End shift'),
  exit: L('返回大厅', 'Back to lobby'),
  hands: L('你手里', 'In your hands'),
  handsEmpty: L('空着', 'nothing'),
  stations: L('吧台', 'Counter'),
  working: L('进行中…', 'working…'),
  ready: L('好了', 'ready'),
  actions: L('操作', 'Actions'),
  actionsNote: L('列表里只有现在能做的操作；每个操作花 {n} 秒游戏时间（轻松模式除外）。', 'Only actions you can do right now are listed; each costs {n} s of game time (not in Relaxed mode).'),
  actionsNoteFree: L('列表里只有现在能做的操作。', 'Only actions you can do right now are listed.'),
  nextStep: L('下一步建议', 'Suggested next step'),
  whileBrews: L('趁{p}的时候：{a}', 'While {p}: {a}'),
  wall: L('配方墙（示例起点）', 'Recipe wall (illustrative starting points)'),
  wallNote: L('数字来自饮品图鉴；不同咖啡馆做法不同。', 'Numbers come from the Drink Atlas; cafés vary.'),
  timingHeading: L('游戏时间与真实时间', 'Game time vs real time'),
  gameTimeShort: L('游戏时间', 'game time'),
  timingRow: L('{w}：游戏 {g} 秒 · {r}', '{w}: {g} s game time · {r}'),
  pausedNote: L('计时已停。配方墙可以继续看。', 'The clock is stopped. The recipe wall stays readable.'),
  feedback: L('最近的反馈', 'Latest feedback'),
  // results
  results: L('这一班的总结', 'Shift summary'),
  stars: L('{n} 颗星（共 3 颗）', '{n} of 3 stars'),
  points: L('得分 {p} / 菜单价值 {m}（{pct}%）', '{p} points of {m} menu value ({pct}%)'),
  leftWhy: L('等太久了：这单在队列里等了 {s} 秒（游戏时间）。下次先做耐心条最短的，或者放弃来不及做的那单。', 'Waited too long: their order was in the queue for {s} s (game time). Next time start the one with the shortest bar, or skip one you cannot finish in time.'),
  starRule: L('1 星 ≥ 40%，2 星 ≥ 75%，3 星需要快速出品的小费（≥ 110%）。', '1★ ≥ 40%, 2★ ≥ 75%, 3★ needs speed tips (≥ 110%).'),
  starRuleRelaxed: L('轻松模式：星级看完美出品的比例（50% / 75% / 95%）。', 'Relaxed: stars from the share of textbook drinks (50% / 75% / 95%).'),
  counts: L('完美 {c} · 差一处 {p} · 被退回 {w} · 客人离开 {t}', 'Textbook {c} · one thing off {p} · handed back {w} · customers left {t}'),
  perOrder: L('每一单', 'Order by order'),
  outcome: {
    correct: L('完美', 'Textbook'),
    partly: L('差一处', 'One thing off'),
    timeout: L('客人离开了', 'Customer left'),
    open: L('打烊时未完成', 'Open at closing'),
  } as Record<'correct' | 'partly' | 'timeout' | 'open', LocalizedText>,
  practised: L('练到了', 'What you practised'),
  notPractised: L('没有练到', 'What this does not train'),
  savedNote: L('已记录为“模拟”练习。', 'Saved as simulated practice.'),
  again: L('再来一班', 'Play again'),
  nextLevel: L('下一关', 'Next level'),
  unlockedNext: L('第 {n} 关已解锁！', 'Level {n} unlocked!'),
  // 3D
  loading3d: L('正在加载 3D 吧台…', 'Loading the 3D counter…'),
  sceneFailed: L('3D 吧台无法加载——用操作列表继续玩。', 'The 3D counter could not load — keep playing with the action list.'),
  sceneHelp: L('点按台面上的工位或物品：拿起、放下、倒入。工位的更多操作在右侧列表里。', 'Click or tap a station or item to pick up, put down or pour. More station actions are in the list.'),
  selected: L('已选：{s}', 'Selected: {s}'),
  enterVR: L('进入 VR', 'Enter VR'),
  vrControls: L('VR 中：扳机 = 使用指向的工位；握把 = 拿起，靠近空位松开即放下。', 'In VR: trigger = use what the ray points at; grip = grab, release near a free spot to put it down.'),
  vrFailed: L('VR 会话无法启动——继续在屏幕上玩。', 'The VR session could not start — keep playing on screen.'),
  recenter: L('重新居中', 'Recenter'),
  seated: L('坐姿高度', 'Seated height'),
};

export const fmtR = (t: LocalizedText, v: Record<string, string | number>): LocalizedText =>
  L(t.zh.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? '')), t.en.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? '')));

export const SLOT_TEXT: Record<SlotId, LocalizedText> = {
  grinder: L('磨豆机', 'grinder'),
  group1: L('1 号冲煮头', 'group 1'),
  group2: L('2 号冲煮头', 'group 2'),
  tray1: L('1 号冲煮头下', 'under group 1'),
  tray2: L('2 号冲煮头下', 'under group 2'),
  wand: L('蒸汽棒', 'steam wand'),
  hotwater: L('热水口', 'hot-water spout'),
  kettleBase: L('水壶底座', 'kettle base'),
  dripper: L('手冲滤杯下', 'under the dripper'),
  phin: L('越南滴滤壶下', 'under the phin'),
  counter1: L('台面 1', 'counter spot 1'),
  counter2: L('台面 2', 'counter spot 2'),
  counter3: L('台面 3', 'counter spot 3'),
  counter4: L('台面 4', 'counter spot 4'),
  counter5: L('台面 5', 'counter spot 5'),
  counter6: L('台面 6', 'counter spot 6'),
  counter7: L('台面 7', 'counter spot 7'),
  counter8: L('台面 8', 'counter spot 8'),
};

export const customerName = (id: string): LocalizedText => CUSTOMERS.find((c) => c.id === id)?.name ?? L(id, id);

/** "Mug / tall glass: shot (Normal), Microfoam ~200 ml" */
export function itemText(it: Item): LocalizedText {
  switch (it.kind) {
    case 'cup': {
      const parts: LocalizedText[] = it.adds.map((a) => {
        switch (a.k) {
          case 'shot':
            return cat(L('浓缩（', 'shot ('), SHOT_STYLE_TEXT[a.style].label, L('）', ')'));
          case 'brew':
            return a.brewer === 'pourover' ? L('手冲咖啡', 'pour-over coffee') : L('滴滤咖啡', 'phin coffee');
          case 'water':
            return L(`热水 ${a.ml} 毫升`, `hot water ${a.ml} ml`);
          case 'milk':
            return cat(MILK_TEXT[a.texture].label, L(` ${a.ml} 毫升`, ` ${a.ml} ml`), a.overheated ? L('（过热）', ' (overheated)') : L('', ''));
          case 'ice':
            return L('冰', 'ice');
          case 'extra':
            return EXTRA_TEXT[a.extra];
        }
      });
      const body = parts.length ? L(parts.map((p) => p.zh).join('、'), parts.map((p) => p.en).join(', ')) : L('空', 'empty');
      return cat(L('杯子（', 'Cup ('), CUP_TEXT[it.size], L('）：', '): '), body);
    }
    case 'portafilter':
      return it.load === 'empty' ? L('手柄（空）', 'Portafilter (empty)') : it.load === 'ground' ? L('手柄（有咖啡粉）', 'Portafilter (ground coffee)') : L('手柄（用过的粉饼）', 'Portafilter (used puck)');
    case 'pitcher': {
      const m = it.milk;
      if (!m) return L('奶缸（空）', 'Milk pitcher (empty)');
      const st = m.state === 'cold' ? L('冷牛奶', 'cold milk') : m.state === 'steaming' ? L('正在打奶', 'steaming') : MILK_TEXT[m.state].label;
      return cat(L('奶缸（', 'Milk pitcher ('), st, L(` ${m.ml} 毫升`, ` ${m.ml} ml`), m.overheated ? L('，过热', ', overheated') : L('', ''), L('）', ')'));
    }
    case 'kettle':
      return it.hot && it.pours > 0 ? L(`水壶（热，还能冲 ${it.pours} 次）`, `Kettle (hot, ${it.pours} pours left)`) : L('水壶（冷）', 'Kettle (cold)');
    case 'doser':
      return it.filled ? L('粉杯（有咖啡粉）', 'Dosing cup (ground coffee)') : L('粉杯（空）', 'Dosing cup (empty)');
  }
}

export function actionText(s: RushState, a: PlayerAction): LocalizedText {
  const at = (slot: SlotId) => {
    const id = s.slots[slot];
    return id ? itemText(s.items[id]!) : L('', '');
  };
  const h = s.hand ? itemText(s.items[s.hand]!) : L('', '');
  switch (a.type) {
    case 'takeCup':
      return cat(L('拿一个杯子：', 'Take a cup: '), CUP_TEXT[a.size]);
    case 'grab':
      return cat(L('拿起', 'Pick up '), at(a.slot), L('（', ' ('), SLOT_TEXT[a.slot], L('）', ')'));
    case 'place':
      return a.slot.startsWith('counter') ? L('放到台面上', 'Put it on the counter') : cat(L('放到：', 'Put it at: '), SLOT_TEXT[a.slot]);
    case 'grind':
      return cat(L('磨豆：', 'Grind into: '), at('grinder'));
    case 'knock':
      return L('敲掉用过的粉饼', 'Knock out the used puck');
    case 'startShot':
      return cat(L(`${a.group} 号冲煮头开始萃取：`, `Start a shot on group ${a.group}: `), SHOT_STYLE_TEXT[a.style].label, L('（', ' ('), SHOT_STYLE_TEXT[a.style].sub, L('）', ')'));
    case 'fillMilk':
      return cat(L('倒冷牛奶到', 'Fill with cold milk to '), milkMlText(a.ml as MilkMl));
    case 'steam':
      return cat(L('打奶：', 'Steam the milk: '), MILK_TEXT[a.texture].label);
    case 'dispenseWater':
      return cat(L('加热水：', 'Add hot water: '), waterMlText(a.ml as WaterMl));
    case 'heatKettle':
      return L('烧水壶', 'Heat the kettle');
    case 'addIce':
      return L('加冰', 'Add ice');
    case 'addExtra':
      return cat(L('加', 'Add '), EXTRA_TEXT[a.extra]);
    case 'pour': {
      const hh = s.hand ? s.items[s.hand] : undefined;
      const brewer = a.slot === 'dripper' ? L('手冲滤杯', 'the dripper') : a.slot === 'phin' ? L('越南滴滤壶', 'the phin') : null;
      if (hh?.kind === 'pitcher') return cat(L('把奶倒进', 'Pour the milk into '), at(a.slot));
      if (hh?.kind === 'doser' && brewer) return cat(L('把咖啡粉倒进', 'Add the grounds to '), brewer);
      if (hh?.kind === 'kettle' && brewer) {
        const stage = s.m.brewers[a.slot === 'dripper' ? 'pourover' : 'phin'].stage;
        return cat(stage === 'idle' ? L('闷蒸：少量热水倒进', 'Bloom: a little hot water into ') : L('注水：剩下的热水倒进', 'Main pour: the rest of the water into '), brewer);
      }
      return cat(L('倒进', 'Pour into '), SLOT_TEXT[a.slot]);
    }
    case 'serve': {
      const o = s.orders.find((x) => x.id === a.orderId);
      return o ? cat(L('出品给', 'Serve '), customerName(o.customerId), L('：', ': '), drinkName(o.drinkId)) : L('出品', 'Serve');
    }
    case 'trash':
      return cat(L('倒掉 / 扔掉：', 'Bin / empty: '), h);
  }
}
