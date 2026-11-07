/**
 * One-change-at-a-time brew suggestion (pure, deterministic, unit-tested).
 *
 * Honesty rules:
 *  - Uses ONLY what the learner reported (dose, output, time, taste words, rating). Missing values
 *    are never guessed; with too little data the advice is "log more next time".
 *  - Suggests exactly ONE variable to change, framed as a common rule of thumb, never as a
 *    prediction of how the next cup will taste. Every result carries an uncertainty caveat.
 *  - Concrete numbers are arithmetic on the learner's own numbers (e.g. 10% more yield), labelled "about".
 */
import type { LocalizedText } from '../../domain/contracts';
import { formatRatio, tryBrewRatio } from '../../domain/brew';
import type { BrewKind } from '../practice/plan';
import { signalsOf } from './taste';

export type AdviceChange =
  | 'grind-finer'
  | 'grind-coarser'
  | 'longer-ratio'
  | 'shorter-ratio'
  | 'more-coffee'
  | 'more-water'
  | 'even-extraction'
  | 'keep'
  | 'check-numbers'
  | 'log-more';

export interface AdviceInput {
  kind: BrewKind;
  doseG?: number;
  outG?: number;
  timeSec?: number;
  tasteTags?: readonly string[];
  rating?: number;
  /** Authored target window (e.g. activity recipe [25, 35]); for espresso a common beginner window is used otherwise. */
  targetTimeSec?: readonly [number, number];
}

export interface Advice {
  change: AdviceChange;
  headline: LocalizedText;
  /** Why — referencing what the learner reported. */
  reason: LocalizedText;
  /** Optional concrete number derived from the learner's own numbers. */
  target?: LocalizedText;
  /** Always present: rule of thumb, not a prediction. */
  caveat: LocalizedText;
  /** Which inputs drove the suggestion (for tests / transparency). */
  basis: string[];
}

/** Common beginner reference for espresso shot time (rule of thumb, used only when no window is authored). */
export const ESPRESSO_REFERENCE_WINDOW: readonly [number, number] = [25, 35];

const L = (zh: string, en: string): LocalizedText => ({ zh, en });

const CAVEAT = L(
  '这是常见的经验法则，不是对味道的预测。每次只改这一处，再冲一杯、再尝一尝——豆子、磨豆机和你的口味都会影响结果。',
  'A common rule of thumb, not a taste prediction. Change only this one thing, brew again, then taste again — beans, grinder and your own preference all matter.',
);

const num = (v: number | undefined): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const round = (v: number, step: number) => Math.round(v / step) * step;
const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

function timeVsWindow(time: number | undefined, w: readonly [number, number] | undefined): 'fast' | 'slow' | 'in' | null {
  if (!num(time) || !w) return null;
  if (time < w[0]) return 'fast';
  if (time > w[1]) return 'slow';
  return 'in';
}

const TASTE_WORD: Record<string, LocalizedText> = {
  under: L('偏酸', 'sour'),
  over: L('偏苦或发干', 'bitter or harsh'),
  weak: L('偏淡、水感', 'watery or thin'),
  strong: L('太浓太重', 'too heavy'),
};

function timePhrase(time: number, w: readonly [number, number], verdict: 'fast' | 'slow' | 'in', authored: boolean): LocalizedText {
  const ref = authored ? L('这份配方的参考', 'this recipe’s reference') : L('常见的新手参考', 'a common beginner reference');
  const where =
    verdict === 'fast' ? L('快于', 'faster than') : verdict === 'slow' ? L('慢于', 'slower than') : L('落在', 'within');
  return L(
    `用时 ${time} 秒，${where.zh}${ref.zh}（${w[0]}–${w[1]} 秒）`,
    `it took ${time} s, ${where.en} ${ref.en} (${w[0]}–${w[1]} s)`,
  );
}

function join(parts: LocalizedText[]): LocalizedText {
  return L(parts.map((p) => p.zh).join('，'), parts.map((p) => p.en).join(', and '));
}

function make(change: AdviceChange, basisParts: LocalizedText[], basis: string[], target?: LocalizedText): Advice {
  const reasonLead = basisParts.length ? join(basisParts) : null;
  const H: Record<AdviceChange, LocalizedText> = {
    'grind-finer': L('下次把研磨调细一点点', 'Next time, grind a little finer'),
    'grind-coarser': L('下次把研磨调粗一点点', 'Next time, grind a little coarser'),
    'longer-ratio': L('同样的粉量，多萃取一点液体', 'Same dose, let a little more liquid through'),
    'shorter-ratio': L('同样的粉量，少萃取一点液体', 'Same dose, stop a little earlier'),
    'more-coffee': L('同样的水量，多用一点咖啡粉', 'Same water, a little more coffee'),
    'more-water': L('同样的粉量，多用一点水', 'Same coffee, a little more water'),
    'even-extraction': L('配方先不变，专注把布粉和压粉做均匀', 'Keep the recipe; focus on even distribution and a level tamp'),
    keep: L('保持这个配方，再做一次看看是否稳定', 'Keep this recipe and repeat it to see if it’s consistent'),
    'check-numbers': L('先核对一下记录的克数', 'Double-check the weights you logged'),
    'log-more': L('下次多记一点：粉量、出液/水量、时间和一个味道词', 'Next time, log a bit more: dose, output, time and one taste word'),
  };
  const WHY: Record<AdviceChange, LocalizedText> = {
    'grind-finer': L('更细的研磨通常让水流变慢、萃取更多，常用来改善偏酸、偏淡。', 'A finer grind usually slows the flow and extracts more — the usual first move for sour or thin cups.'),
    'grind-coarser': L('更粗的研磨通常让水流变快、萃取更少，常用来缓和苦涩。', 'A coarser grind usually speeds the flow and extracts less — the usual first move for bitter or harsh cups.'),
    'longer-ratio': L('多一点液体通常会萃取更多、味道更柔和。', 'A bit more output usually extracts more and softens the cup.'),
    'shorter-ratio': L('少一点液体通常更浓、萃取更少的后段苦味。', 'A bit less output is usually stronger and leaves out more of the late, bitter part.'),
    'more-coffee': L('提高咖啡占比（更“浓”的粉水比）通常让味道更饱满。', 'More coffee for the same water (a tighter ratio) usually tastes fuller.'),
    'more-water': L('降低咖啡占比（更“淡”的粉水比）通常让味道更柔和。', 'More water for the same coffee (a looser ratio) usually tastes lighter.'),
    'even-extraction': L('同时又酸又苦，常见原因是水从粉饼的薄弱处“走捷径”（通道效应），而不是配方本身。', 'Sour AND bitter at once often means water found a shortcut through the puck (channelling) — technique, not the recipe.'),
    keep: L('你给出的反馈是正面的。重复同一配方能告诉你结果是否可靠。', 'Your notes are positive. Repeating the same recipe tells you whether the result is reliable.'),
    'check-numbers': L('这个比例很不寻常，可能是输错了数（例如把克数填反）。', 'This ratio is very unusual — it may be a typo (for example dose and output swapped).'),
    'log-more': L('信息太少，没法给出有意义的单一调整建议。', 'There isn’t enough to go on for a meaningful one-change suggestion.'),
  };
  const reason = reasonLead
    ? L(`你记录的是：${reasonLead.zh}。${WHY[change].zh}`, `You noted ${reasonLead.en}. ${WHY[change].en}`)
    : WHY[change];
  return { change, headline: H[change], reason, caveat: CAVEAT, basis, ...(target ? { target } : {}) };
}

/** Suggest ONE change for the next attempt, or null when the practice isn't a brew (e.g. milk steaming). */
export function suggestNextChange(input: AdviceInput): Advice | null {
  if (input.kind === 'none') return null;
  const espresso = input.kind === 'espresso';
  const { doseG, outG, timeSec } = input;
  const ratio = num(doseG) && num(outG) ? tryBrewRatio(doseG, outG) : null;
  const sig = signalsOf(input.tasteTags);
  const rating = typeof input.rating === 'number' ? input.rating : undefined;

  const authored = !!input.targetTimeSec;
  const window = input.targetTimeSec ?? (espresso ? ESPRESSO_REFERENCE_WINDOW : undefined);
  const tv = timeVsWindow(timeSec, window);
  const timeP = tv && num(timeSec) && window ? timePhrase(timeSec, window, tv, authored) : null;

  const basis: string[] = [];
  const parts: LocalizedText[] = [];
  const addTaste = (s: 'under' | 'over' | 'weak' | 'strong') => {
    basis.push(`taste:${s}`);
    parts.push(L(`味道${TASTE_WORD[s].zh}`, `it tasted ${TASTE_WORD[s].en}`));
  };
  const addTime = () => {
    if (timeP) {
      basis.push(`time:${tv}`);
      parts.push(timeP);
    }
  };
  const addRatio = () => {
    if (ratio !== null) {
      basis.push('ratio');
      parts.push(L(`比例约 ${formatRatio(ratio)}`, `a ratio of about ${formatRatio(ratio)}`));
    }
  };

  // Targets from the learner's own numbers.
  const longer = (): LocalizedText | undefined => {
    if (!num(doseG) || !num(outG) || doseG <= 0) return undefined;
    const next = Math.max(outG + 2, round(outG * 1.1, 1));
    return L(`约 ${fmt(next)} 克出液，粉量仍是 ${fmt(doseG)} 克（约 ${formatRatio(next / doseG)}）`, `about ${fmt(next)} g out from the same ${fmt(doseG)} g (≈${formatRatio(next / doseG)})`);
  };
  const shorter = (): LocalizedText | undefined => {
    if (!num(doseG) || !num(outG) || doseG <= 0 || outG <= 2) return undefined;
    const next = Math.min(outG - 2, round(outG * 0.9, 1));
    return L(`约 ${fmt(next)} 克出液，粉量仍是 ${fmt(doseG)} 克（约 ${formatRatio(next / doseG)}）`, `about ${fmt(next)} g out from the same ${fmt(doseG)} g (≈${formatRatio(next / doseG)})`);
  };
  const moreCoffee = (): LocalizedText | undefined => {
    if (ratio === null || !num(outG) || !num(doseG) || ratio <= 6) return undefined;
    const next = Math.max(doseG + 0.5, round(outG / (ratio - 1), 0.5));
    return L(`约 ${fmt(next)} 克咖啡粉配同样的 ${fmt(outG)} 克水（约 ${formatRatio(outG / next)}）`, `about ${fmt(next)} g coffee for the same ${fmt(outG)} g water (≈${formatRatio(outG / next)})`);
  };
  const moreWater = (): LocalizedText | undefined => {
    if (ratio === null || !num(doseG)) return undefined;
    const next = round(doseG * (ratio + 1), 5);
    return L(`约 ${fmt(next)} 克水配同样的 ${fmt(doseG)} 克咖啡粉（约 ${formatRatio(next / doseG)}）`, `about ${fmt(next)} g water for the same ${fmt(doseG)} g coffee (≈${formatRatio(next / doseG)})`);
  };

  // 0) Too little to go on.
  if (sig.size === 0 && !timeP && ratio === null && rating === undefined) return make('log-more', [], ['none']);

  // 1) Implausible numbers → check first (only the learner knows what they typed).
  if (ratio !== null && (espresso ? ratio < 0.8 || ratio > 5 : ratio < 4 || ratio > 25)) {
    addRatio();
    return make('check-numbers', parts, basis);
  }

  const under = sig.has('under');
  const over = sig.has('over');

  // 2) Sour and bitter together → technique (even extraction), recipe unchanged.
  if (under && over) {
    addTaste('under');
    addTaste('over');
    return make('even-extraction', parts, basis);
  }

  if (under) {
    addTaste('under');
    if (espresso) {
      if (tv === 'fast') {
        addTime();
        return make('grind-finer', parts, basis);
      }
      addTime();
      const t = longer();
      return t ? make('longer-ratio', parts, basis, t) : make('grind-finer', parts, basis);
    }
    addTime();
    return make('grind-finer', parts, basis);
  }

  if (over) {
    addTaste('over');
    if (tv === 'slow') {
      addTime();
      return make('grind-coarser', parts, basis);
    }
    addTime();
    if (espresso) {
      const t = shorter();
      return t ? make('shorter-ratio', parts, basis, t) : make('grind-coarser', parts, basis);
    }
    return make('grind-coarser', parts, basis);
  }

  if (sig.has('weak')) {
    addTaste('weak');
    if (tv === 'fast') {
      addTime();
      return make('grind-finer', parts, basis);
    }
    if (espresso) {
      if (ratio !== null && ratio > 2.2) {
        addRatio();
        const t = shorter();
        if (t) return make('shorter-ratio', parts, basis, t);
      }
      return make('grind-finer', parts, basis);
    }
    addRatio();
    const t = moreCoffee();
    return t ? make('more-coffee', parts, basis, t) : make('grind-finer', parts, basis);
  }

  if (sig.has('strong') && !(rating !== undefined && rating >= 4)) {
    addTaste('strong');
    addRatio();
    if (espresso) {
      const t = longer();
      return t ? make('longer-ratio', parts, basis, t) : make('grind-coarser', parts, basis);
    }
    const t = moreWater();
    return t ? make('more-water', parts, basis, t) : make('grind-coarser', parts, basis);
  }

  if (sig.has('good') || sig.has('strong') || (rating !== undefined && rating >= 4)) {
    if (sig.has('good')) {
      basis.push('taste:good');
      parts.push(L('味道不错（甜或平衡）', 'it tasted good (sweet or balanced)'));
    }
    if (rating !== undefined && rating >= 4) {
      basis.push('rating');
      parts.push(L(`你打了 ${rating} 分`, `you rated it ${rating}/5`));
    }
    return make('keep', parts, basis);
  }

  // 3) No usable taste words: time is only a clue — taste decides.
  if (timeP && tv) {
    addTime();
    if (tv === 'fast') return make('grind-finer', parts, basis);
    if (tv === 'slow') return make('grind-coarser', parts, basis);
    return make('log-more', parts, basis); // time looks typical, but only taste can say whether to change anything
  }

  addRatio();
  return make('log-more', parts, basis.length ? basis : ['none']);
}
