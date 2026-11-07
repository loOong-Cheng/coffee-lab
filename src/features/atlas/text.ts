import type { Confidence, DrinkCategory, LocalizedText } from '../../domain/contracts';

export const CATEGORY_TEXT: Record<DrinkCategory, { label: LocalizedText; blurb: LocalizedText }> = {
  espresso: {
    label: { zh: '意式浓缩', en: 'Espresso' },
    blurb: { zh: '高压萃取的小杯浓缩，以及在它基础上加水的喝法。', en: 'Small, pressure-brewed shots — and the ways people stretch them with water.' },
  },
  'espresso-milk': {
    label: { zh: '浓缩 + 牛奶', en: 'Espresso & milk' },
    blurb: { zh: '从一点点奶沫到一大杯拿铁：比例不同，性格也不同。', en: 'From a dot of foam to a big latte — different proportions, different characters.' },
  },
  pourover: {
    label: { zh: '手冲', en: 'Pour-over' },
    blurb: { zh: '热水缓缓流过滤纸上的咖啡粉，清澈、细腻。', en: 'Hot water poured through coffee in a filter — clear and delicate.' },
  },
  immersion: {
    label: { zh: '浸泡式', en: 'Immersion' },
    blurb: { zh: '咖啡粉在水里泡一会儿再分离，简单又宽容。', en: 'Coffee steeps in water, then gets separated — simple and forgiving.' },
  },
  pressure: {
    label: { zh: '压力 / 蒸汽', en: 'Pressure & steam' },
    blurb: { zh: '摩卡壶、爱乐压这类用压力或蒸汽推动的器具。', en: 'Moka pots, AeroPress and other brewers that push water with pressure or steam.' },
  },
  cold: {
    label: { zh: '冰咖啡与冷萃', en: 'Cold & iced' },
    blurb: { zh: '冷萃、急冷和摇出来的冰咖啡。', en: 'Cold brew, flash-chilled and shaken iced coffees.' },
  },
  regional: {
    label: { zh: '世界各地的传统', en: 'World traditions' },
    blurb: { zh: '一杯咖啡背后的仪式、香料和待客之道。', en: 'Rituals, spices and hospitality from around the coffee world.' },
  },
};

export const DIFFICULTY_TEXT: Record<1 | 2 | 3, LocalizedText> = {
  1: { zh: '入门', en: 'Easy start' },
  2: { zh: '需要练习', en: 'Some practice' },
  3: { zh: '有挑战', en: 'Challenge' },
};

export const CONFIDENCE_TEXT: Record<Confidence, LocalizedText> = {
  verified: { zh: '有可靠来源', en: 'Well sourced' },
  'rule-of-thumb': { zh: '经验做法', en: 'Common practice' },
  'illustrative-model': { zh: '示意', en: 'Illustrative' },
};
