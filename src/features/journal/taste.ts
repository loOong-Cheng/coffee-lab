/**
 * Bilingual beginner taste vocabulary for the brew log. Stored as ids in BrewLogEntry.tasteTags.
 * `signal` is only used by the one-change suggestion (advice.ts) as a rule-of-thumb hint;
 * descriptors (fruity, chocolatey…) carry no signal. Unknown/free-text tags are shown as written.
 */
import type { LocalizedText } from '../../domain/contracts';

export type TasteSignal = 'under' | 'over' | 'weak' | 'strong' | 'good' | 'neutral';

export interface TasteTag {
  id: string;
  label: LocalizedText;
  hint: LocalizedText;
  signal: TasteSignal;
  group: 'balance' | 'body' | 'flavor';
}

const L = (zh: string, en: string): LocalizedText => ({ zh, en });

export const TASTE_TAGS: readonly TasteTag[] = [
  { id: 'sour', group: 'balance', signal: 'under', label: L('酸涩 / 尖酸', 'Sour / sharp'), hint: L('像没熟的水果，酸得刺口', 'Like unripe fruit; puckering') },
  { id: 'bright', group: 'balance', signal: 'neutral', label: L('明亮 / 清爽', 'Bright / lively'), hint: L('令人愉悦的酸，像柑橘或苹果', 'Pleasant acidity, like citrus or apple') },
  { id: 'sweet', group: 'balance', signal: 'good', label: L('甜感', 'Sweet'), hint: L('像焦糖、蜂蜜或熟水果的甜', 'Caramel, honey or ripe-fruit sweetness') },
  { id: 'balanced', group: 'balance', signal: 'good', label: L('平衡', 'Balanced'), hint: L('酸、甜、苦都不突出，喝着舒服', 'Nothing sticks out; easy to drink') },
  { id: 'bitter', group: 'balance', signal: 'over', label: L('苦', 'Bitter'), hint: L('苦味盖过其他味道，回味发苦', 'Bitterness dominates and lingers') },
  { id: 'harsh', group: 'balance', signal: 'over', label: L('粗糙 / 发干', 'Harsh / drying'), hint: L('口腔发干、涩，像浓茶', 'Dry, astringent mouthfeel, like stewed tea') },
  { id: 'watery', group: 'body', signal: 'weak', label: L('水感 / 寡淡', 'Watery / thin'), hint: L('味道淡、口感稀', 'Weak flavour, thin texture') },
  { id: 'heavy', group: 'body', signal: 'strong', label: L('厚重 / 浓稠', 'Heavy / syrupy'), hint: L('非常浓、口感厚，可能有点腻', 'Very strong and thick; maybe too intense') },
  { id: 'flat', group: 'body', signal: 'neutral', label: L('平淡 / 没特点', 'Flat / dull'), hint: L('说不出什么味道', 'Hard to pick out any flavour') },
  { id: 'fruity', group: 'flavor', signal: 'neutral', label: L('果香', 'Fruity'), hint: L('莓果、柑橘、核果……', 'Berries, citrus, stone fruit…') },
  { id: 'chocolatey', group: 'flavor', signal: 'neutral', label: L('巧克力 / 可可', 'Chocolatey'), hint: L('可可、黑巧克力', 'Cocoa, dark chocolate') },
  { id: 'nutty', group: 'flavor', signal: 'neutral', label: L('坚果', 'Nutty'), hint: L('烤坚果、花生', 'Roasted nuts, peanut') },
  { id: 'floral', group: 'flavor', signal: 'neutral', label: L('花香', 'Floral'), hint: L('茉莉、红茶般的香气', 'Jasmine, black-tea-like aroma') },
  { id: 'roasty', group: 'flavor', signal: 'neutral', label: L('烘烤 / 烟熏', 'Roasty / smoky'), hint: L('深烘的烤面包、烟熏感', 'Dark toast, smoky notes') },
];

const BY_ID = new Map(TASTE_TAGS.map((t) => [t.id, t]));

export function getTasteTag(id: string): TasteTag | undefined {
  return BY_ID.get(id);
}

export function tasteLabel(id: string, locale: 'zh' | 'en'): string {
  const t = BY_ID.get(id);
  return t ? t.label[locale] : id;
}

export function signalsOf(tags: readonly string[] | undefined): Set<TasteSignal> {
  const s = new Set<TasteSignal>();
  for (const id of tags ?? []) {
    const t = BY_ID.get(id);
    if (t) s.add(t.signal);
  }
  return s;
}
