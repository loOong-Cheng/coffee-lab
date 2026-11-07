/** Café Counter UI strings (colocated, bilingual peers). */
import type { LocalizedText } from '../../domain/contracts';
import type { CafeLevelId, Component, CupSize, Diff, Extra, Method, MilkMl, MilkTexture, ShotStyle, Shots, StationId, Value, WaterMl, WaterOrder } from './model';
import { CUP_CAPACITY_ML } from './model';

const L = (zh: string, en: string): LocalizedText => ({ zh, en });

export const S = {
  title: L('咖啡馆吧台', 'Café Counter'),
  lead: L(
    '客人点单，你在吧台上把饮品做出来。弄清楚可塔朵、澳白和卡布奇诺到底差在哪儿——几份浓缩、多少奶、多厚的奶泡、用什么杯。',
    'Customers order; you build the drink at the counter. Learn what really separates a cortado, a flat white and a cappuccino — shots, how much milk, how much foam, which cup.',
  ),
  versions: L(
    '各地、各家咖啡馆的定义并不一样——这个游戏采用一种常见版本，与饮品图鉴里的示例配方一致。',
    'Definitions vary by café and region — this game uses one common version, matching the illustrative recipes in the Drink Atlas.',
  ),
  versionsShort: L('定义因店因地而异——这里是一种常见版本。', 'Definitions vary by café/region — this is one common version.'),
  honesty: L(
    '这里评估的是你对饮品结构的理解（答题评估），不是真实的手法或味道。',
    'This checks your understanding of drink structure (assessed answer) — not real-world technique or taste.',
  ),
  shifts: L('选择班次', 'Choose a shift'),
  shiftsNote: L('建议按顺序玩，但所有班次随时都能开始。每个班次 5 位客人。', 'Recommended in order, but every shift is open. Five customers per shift.'),
  recommended: L('推荐', 'Recommended'),
  startShift: L('开始这个班次', 'Start shift'),
  masteredOf: (n: number, m: number) => L(`已掌握 ${n}/${m}`, `${n}/${m} mastered`),
  howToPlay: L('怎么玩', 'How to play'),
  howSteps: [
    L('读点单小票：客人、饮品，还有一点咖啡文化。', 'Read the ticket: the customer, the drink and a bit of coffee culture.'),
    L('在各个工作站做选择：冲煮方式、浓缩、热水、牛奶、冰、配料、杯子。', 'Make choices at each station: brewer, shots, water, milk, ice, extras, cup.'),
    L('出杯！你会看到哪里不同，以及为什么。', 'Serve! You’ll see exactly what differs and why.'),
  ],
  settings: L('难度与提示', 'Support'),
  timer: L('轻松计时', 'Relaxed timer'),
  timerDesc: L('只是给吧台节奏感：超时不扣分，随时可以关。', 'Just for a sense of counter rhythm: running over never costs points. Turn it off any time.'),
  timerOnlyIndependent: L('选择“独立”模式后可开启轻松计时。', 'The relaxed timer is available in Independent mode.'),
  collection: L('已掌握的饮品', 'Drinks mastered'),
  collectionNote: L(
    '一款饮品至少有一次完全做对就算掌握；标签显示你做对时的最高独立程度。数据来自你在本设备上的记录。',
    'A drink counts as mastered after one perfect serve; the badge shows the most independent tier you’ve done it at. Derived from your records on this device.',
  ),
  collectionCount: (n: number, m: number) => L(`${m} 款中已掌握 ${n} 款`, `${n} of ${m} drinks mastered`),
  collectionEmpty: L('还没有掌握的饮品。完成第一单后，这里会出现你的收藏。', 'Nothing mastered yet. Serve your first perfect order and it will appear here.'),
  notYet: L('还没做对', 'Not yet'),
  mastered: L('已掌握', 'Mastered'),
  atlasLink: L('在饮品图鉴里查看', 'See it in the Drink Atlas'),
  openAtlas: L('打开饮品图鉴', 'Open the Drink Atlas'),
  // round
  shiftOf: (n: number, m: number) => L(`第 ${n} 位客人，共 ${m} 位`, `Customer ${n} of ${m}`),
  leave: L('结束班次', 'Leave shift'),
  ticket: L('点单', 'Order ticket'),
  says: L('说', 'says'),
  cultureLine: L('咖啡文化', 'Coffee culture'),
  recipeCard: L('配方卡', 'Recipe card'),
  showRecipe: L('查看配方卡', 'Show recipe card'),
  hideRecipe: L('收起配方卡', 'Hide recipe card'),
  memoryMode: L('独立模式：凭记忆制作，没有配方卡。想看提示可以随时切换到“辅助”。', 'Independent mode: build from memory, no recipe card. Switch to Assisted any time for a peek.'),
  counter: L('吧台', 'The counter'),
  yourCup: L('你的杯子', 'Your cup'),
  theOrder: L('点单的标准做法', 'The order'),
  serve: L('出杯', 'Serve'),
  serving: L('出杯中…', 'Serving…'),
  pickFirst: (names: string) => L(`出杯前请先选择：${names}。`, `Before serving, choose: ${names}.`),
  shotsHidden: L('选择意式咖啡机后才需要设置浓缩。', 'Shots apply only at the espresso machine.'),
  extrasNone: L('不加配料', 'No extras'),
  summaryAria: L('当前饮品', 'Current drink'),
  // feedback
  fbCorrect: L('完全正确，客人很满意！', 'Spot on — happy customer!'),
  fbPartly: L('很接近——只有一处不同', 'Close — one thing differs'),
  fbIncorrect: L('还不对——看看哪里不同、为什么', 'Not quite — here’s what differs and why'),
  you: L('你做的', 'You'),
  order: L('点单要', 'Order'),
  why: L('为什么', 'Why'),
  showAnswer: L('显示标准做法', 'Show the answer'),
  answerHidden: L('独立模式下先隐藏答案——先想一想，再点“显示标准做法”。', 'Independent mode hides the answer at first — think it over, then press “Show the answer”.'),
  lookalike: (other: string, ordered: string) =>
    L(`你做的是一杯标准的${other}——但客人点的是${ordered}。`, `You built a textbook ${other} — but the customer ordered ${ordered}.`),
  tryAgain: L('再做一次', 'Try again'),
  nextOrder: L('下一位客人', 'Next customer'),
  finishShift: L('完成班次', 'Finish shift'),
  moreSupport: L('连续两次没做对——要不要多一点提示？', 'Two misses in a row — want more support?'),
  switchGuided: L('切换到“引导”', 'Switch to Guided'),
  scoreLine: (n: number, m: number) => L(`${m} 项中对了 ${n} 项`, `${n} of ${m} parts right`),
  keyPoint: L('要点', 'Key point'),
  overflowNote: (ml: number, cap: number) => L(`约 ${ml} 毫升，装不进约 ${cap} 毫升的杯子。`, `About ${ml} ml won’t fit a ~${cap} ml cup.`),
  overflowWhy: L(
    '杯子本身选对了，但杯里的东西太多——看看上面其他的不同点（水量、奶量、配料）。',
    'The cup itself is right, but there’s too much in it — check the other differences (water, milk, extras).',
  ),
  timeLeft: (s: number) => L(`轻松计时：${s} 秒`, `Relaxed timer: ${s}s`),
  timeOver: L('慢慢来——客人很乐意等。', 'Take your time — the customer is happy to wait.'),
  // summary
  shiftDone: L('班次完成！', 'Shift complete!'),
  firstTry: L('一次做对', 'Right first time'),
  fixed: L('重做后做对', 'Fixed after a retry'),
  notFixed: L('还要复习', 'To review'),
  inPace: L('在轻松计时内出杯', 'Served within the relaxed timer'),
  newlyMastered: L('新收藏', 'New in your collection'),
  review: L('值得复习的不同点', 'Differences to review'),
  noReview: L('这个班次没有需要复习的地方——试试更独立的模式？', 'Nothing to review this shift — try a more independent tier?'),
  relatedLessons: L('相关课程', 'Related lessons'),
  anotherShift: L('再来一个班次', 'Another shift'),
  nextShift: (name: string) => L(`下一个班次：${name}`, `Next shift: ${name}`),
  backToCounter: L('回到咖啡馆', 'Back to the café'),
  resultCorrect: L('做对了', 'Correct'),
  resultFixed: L('重做后做对', 'Correct after retry'),
  resultMissed: L('还没做对', 'Not yet right'),
  attempts: (n: number) => L(`尝试 ${n} 次`, `${n} attempt${n === 1 ? '' : 's'}`),
  // keyboard
  shortcuts: L('键盘快捷键', 'Keyboard shortcuts'),
  kStations: L('跳到工作站', 'Jump to station'),
  kServe: L('出杯', 'Serve'),
  kRecipe: L('配方卡', 'Recipe card'),
  kRetry: L('再做一次', 'Try again'),
  kNext: L('下一位', 'Next'),
  // errors
  missingDrink: L('这款饮品的资料暂时缺失，已跳过。', 'This drink’s details are missing, so it was skipped.'),
};

/** What each support tier actually changes at the café counter. */
export const GUIDANCE_DETAIL: Record<'guided' | 'assisted' | 'independent', LocalizedText> = {
  guided: L('配方卡一直显示，每个工作站都有提示；出杯后显示标准做法。', 'Recipe card always visible and a hint at every station; the answer cup is shown after serving.'),
  assisted: L('配方卡收起，需要时按按钮（或 H）查看；工作站没有提示。', 'Recipe card folded — open it when you need it (button or H); no station hints.'),
  independent: L(
    '凭记忆制作：没有配方卡和提示；出杯后先告诉你哪里不对和原因，答案要你主动点开。可开启轻松计时。',
    'From memory: no recipe card or hints; after serving you see what’s off and why, and reveal the answer only if you ask. Optional relaxed timer.',
  ),
};

export const LEVEL_TEXT: Record<CafeLevelId, { title: LocalizedText; blurb: LocalizedText }> = {
  bar: {
    title: L('意式吧台基础', 'Espresso bar basics'),
    blurb: L('浓缩的长短、加水的顺序、选对杯子。', 'Shot length, when water goes in, and the right cup.'),
  },
  milk: {
    title: L('经典奶咖', 'Milk classics'),
    blurb: L('多少奶、多厚的奶泡：从玛奇朵到拿铁。', 'How much milk, how much foam: from macchiato to latte.'),
  },
  world: {
    title: L('世界咖啡馆', 'World café'),
    blurb: L('选对冲煮器具和关键配料：越南、香港、墨西哥、土耳其、古巴、阿拉伯半岛。', 'Pick the brewer and key ingredients: Vietnam, Hong Kong, Mexico, Türkiye, Cuba, Arabia.'),
  },
};

export const STATION_TEXT: Record<StationId, { name: LocalizedText; tip: LocalizedText }> = {
  method: {
    name: L('冲煮方式', 'Brewer'),
    tip: L('大多数咖啡馆饮品从意式咖啡机开始；世界各地的传统有各自的器具。', 'Most café drinks start at the espresso machine; world traditions use their own brewers.'),
  },
  shots: {
    name: L('浓缩', 'Espresso shots'),
    tip: L('短萃更短更浓，长萃更长——但水都是流过咖啡粉的。', 'Ristretto is shorter and denser, lungo longer — either way all the water goes through the coffee.'),
  },
  water: {
    name: L('热水', 'Hot water'),
    tip: L('美式：浓缩后加水。长黑：先放水，浓缩在上，保留油脂。', 'Americano: water after the shot. Long black: water first, shot on top, keeping the crema.'),
  },
  milk: {
    name: L('牛奶', 'Milk'),
    tip: L('奶泡越多越轻盈。卡布奇诺：厚奶泡；澳白：薄而细的奶泡。', 'More foam = airier and lighter. Cappuccino: thick foam; flat white: thin microfoam.'),
  },
  ice: {
    name: L('冰', 'Ice'),
    tip: L('冰饮在冰块上制作，用冷牛奶而不是蒸奶。', 'Iced drinks are built over ice, with cold milk rather than steamed.'),
  },
  extras: {
    name: L('配料', 'Extras'),
    tip: L('只加点单需要的东西。', 'Add only what the order calls for.'),
  },
  cup: {
    name: L('杯子', 'Cup'),
    tip: L('杯子要装得下整杯饮品——容量本身就是饮品身份的一部分。', 'The cup must hold the whole drink — volume is a big part of a drink’s identity.'),
  },
};

export const COMPONENT_TEXT: Record<Component, LocalizedText> = {
  method: L('冲煮方式', 'Brewer'),
  shots: L('浓缩份数', 'Number of shots'),
  shotStyle: L('萃取长短', 'Shot length'),
  water: L('加水方式', 'Water'),
  waterMl: L('水量', 'Water amount'),
  milk: L('牛奶质地', 'Milk texture'),
  milkMl: L('奶量', 'Milk amount'),
  ice: L('冰', 'Ice'),
  extras: L('配料', 'Extras'),
  cup: L('杯子', 'Cup'),
};

export const METHOD_TEXT: Record<Method, LocalizedText> = {
  espresso: L('意式咖啡机', 'Espresso machine'),
  moka: L('摩卡壶', 'Moka pot'),
  phin: L('越南滴滤壶（Phin）', 'Vietnamese phin'),
  ibrik: L('土耳其壶（Cezve）', 'Cezve / ibrik'),
  pot: L('小锅煮泡', 'Saucepan / pot'),
};
export const SHOTS_TEXT: Record<Shots, LocalizedText> = { 1: L('单份', 'Single'), 2: L('双份', 'Double') };
export const SHOT_STYLE_TEXT: Record<ShotStyle, { label: LocalizedText; sub: LocalizedText }> = {
  ristretto: { label: L('短萃 Ristretto', 'Ristretto'), sub: L('约 1:1.3 · 更短', '≈1:1.3 · short') },
  normal: { label: L('标准', 'Normal'), sub: L('约 1:2', '≈1:2') },
  lungo: { label: L('长萃 Lungo', 'Lungo'), sub: L('约 1:3 · 更长', '≈1:3 · long') },
};
export const WATER_TEXT: Record<WaterOrder, LocalizedText> = {
  none: L('不加水', 'No water'),
  before: L('先放水，浓缩在上', 'Water first, shot on top'),
  after: L('先浓缩，再加水', 'Shot first, then water'),
};
export const waterMlText = (ml: WaterMl): LocalizedText => L(`约 ${ml} 毫升`, `~${ml} ml`);
export const MILK_TEXT: Record<MilkTexture, { label: LocalizedText; sub?: LocalizedText }> = {
  none: { label: L('不加奶', 'No milk') },
  cold: { label: L('冷牛奶', 'Cold milk'), sub: L('不打发', 'not steamed') },
  steamed: { label: L('蒸奶', 'Steamed'), sub: L('几乎无奶泡', 'almost no foam') },
  microfoam: { label: L('细奶泡', 'Microfoam'), sub: L('薄而丝滑', 'thin, silky') },
  foam: { label: L('厚奶泡', 'Foam'), sub: L('厚而蓬松', 'thick, airy') },
};
export const milkMlText = (ml: MilkMl): LocalizedText => (ml === 15 ? L('一勺（约 15 毫升）', 'A spoonful (~15 ml)') : L(`约 ${ml} 毫升`, `~${ml} ml`));
export const ICE_TEXT = { no: L('不加冰', 'No ice'), yes: L('加冰', 'Over ice') };
export const EXTRA_TEXT: Record<Extra, LocalizedText> = {
  chocolate: L('巧克力酱', 'Chocolate sauce'),
  'condensed-milk': L('炼乳', 'Condensed milk'),
  'ice-cream': L('香草冰淇淋', 'Vanilla ice cream'),
  'milk-tea': L('港式奶茶', 'HK milk tea'),
  'cinnamon-piloncillo': L('肉桂 + 粗糖', 'Cinnamon + piloncillo'),
  sugar: L('糖', 'Sugar'),
  cardamom: L('小豆蔻', 'Cardamom'),
};
export const EXTRA_SUB: Partial<Record<Extra, LocalizedText>> = {
  'milk-tea': L('红茶 + 淡奶', 'black tea + evaporated milk'),
  'cinnamon-piloncillo': L('未精制蔗糖', 'unrefined cane sugar'),
};
export const CUP_TEXT: Record<CupSize, LocalizedText> = {
  demitasse: L('浓缩小杯', 'Demitasse'),
  small: L('小杯 / 小玻璃杯', 'Small cup / glass'),
  medium: L('中杯', 'Cup'),
  large: L('马克杯 / 高玻璃杯', 'Mug / tall glass'),
};
export const CUP_SUB: Record<CupSize, LocalizedText> = {
  demitasse: L('约 60–90 毫升', '~60–90 ml'),
  small: L('约 120–150 毫升', '~120–150 ml'),
  medium: L('约 160–200 毫升', '~160–200 ml'),
  large: L('约 250–350 毫升', '~250–350 ml'),
};

/** Human label for one judged value. */
export function valueText(component: Component, v: Value): LocalizedText {
  switch (component) {
    case 'method':
      return METHOD_TEXT[v as Method] ?? L(String(v), String(v));
    case 'shots':
      return SHOTS_TEXT[v as Shots] ?? L(String(v), String(v));
    case 'shotStyle':
      return SHOT_STYLE_TEXT[v as ShotStyle]?.label ?? L(String(v), String(v));
    case 'water':
      return WATER_TEXT[v as WaterOrder] ?? L(String(v), String(v));
    case 'waterMl':
      return waterMlText(v as WaterMl);
    case 'milk':
      return MILK_TEXT[v as MilkTexture]?.label ?? L(String(v), String(v));
    case 'milkMl':
      return milkMlText(v as MilkMl);
    case 'ice':
      return v ? ICE_TEXT.yes : ICE_TEXT.no;
    case 'extras':
      return extrasText(String(v).split(',').filter(Boolean) as Extra[]);
    case 'cup':
      return CUP_TEXT[v as CupSize] ?? L(String(v), String(v));
    default:
      return L(String(v), String(v));
  }
}

export function extrasText(list: readonly Extra[]): LocalizedText {
  if (!list.length) return S.extrasNone;
  return L(list.map((e) => EXTRA_TEXT[e].zh).join('、'), list.map((e) => EXTRA_TEXT[e].en).join(', '));
}

export function joinValues(component: Component, values: readonly Value[]): LocalizedText {
  const parts = values.map((v) => valueText(component, v));
  return L(parts.map((p) => p.zh).join(' 或 '), parts.map((p) => p.en).join(' or '));
}

/** Generic "why" when a spec has no drink-specific reason for this component. */
export function genericWhy(d: Diff): LocalizedText {
  const first = d.expected[0];
  switch (d.component) {
    case 'method':
      return L(`这款饮品用${joinValues('method', d.expected).zh}制作。`, `This drink is made with: ${joinValues('method', d.expected).en}.`);
    case 'shots':
      return L(`这单用${joinValues('shots', d.expected).zh}浓缩。`, `This order uses a ${joinValues('shots', d.expected).en.toLowerCase()} shot.`);
    case 'shotStyle':
      return L(`这单需要${joinValues('shotStyle', d.expected).zh}的萃取。`, `This order calls for a ${joinValues('shotStyle', d.expected).en.toLowerCase()} shot.`);
    case 'water':
      if (first === 'none') return L('这款不额外加水——咖啡按冲煮出来的样子上桌。', 'No added water — the coffee is served as brewed.');
      if (first === 'before') return L('先在杯里放热水，再把浓缩萃在上面。', 'Hot water goes in first, then the shot on top.');
      return L('先萃浓缩，再加热水。', 'The shot goes first, then hot water.');
    case 'waterMl':
      return L(`这款大约加${joinValues('waterMl', d.expected).zh}水。`, `About ${joinValues('waterMl', d.expected).en} of water for this one.`);
    case 'milk':
      if (first === 'none') return L('这款不加奶。', 'No milk in this one.');
      if (first === 'cold') return L('用冷牛奶——不需要蒸奶。', 'Cold milk — nothing steamed.');
      return L(`需要：${joinValues('milk', d.expected).zh}。`, `It needs: ${joinValues('milk', d.expected).en}.`);
    case 'milkMl':
      return L(`奶量大约是${joinValues('milkMl', d.expected).zh}。`, `Milk: about ${joinValues('milkMl', d.expected).en}.`);
    case 'ice':
      return first ? L('这款是加冰的。', 'It’s served over ice.') : L('这款是热饮，不加冰。', 'It’s served hot, without ice.');
    case 'extras': {
      const parts: LocalizedText[] = [];
      if (d.missing?.length) parts.push(L(`缺少：${extrasText(d.missing).zh}。`, `Missing: ${extrasText(d.missing).en}.`));
      if (d.unexpected?.length) parts.push(L(`这单不需要：${extrasText(d.unexpected).zh}。`, `Not part of this order: ${extrasText(d.unexpected).en}.`));
      return L(parts.map((p) => p.zh).join(''), parts.map((p) => p.en).join(' '));
    }
    case 'cup':
      return L(`${joinValues('cup', d.expected).zh}适合这款饮品的容量。`, `${joinValues('cup', d.expected).en} suits this drink’s volume.`);
    default:
      return L('', '');
  }
}

export const cupCapacityText = (c: CupSize) => L(`约 ${CUP_CAPACITY_ML[c]} 毫升`, `~${CUP_CAPACITY_ML[c]} ml`);
