/** Pure logic for diagnosis scenarios ("what ONE thing would you change?"). */
import type { DiagnoseActivity, LocalizedText } from '../../../domain/contracts';

export type Scenario = DiagnoseActivity['scenarios'][number];
export type ChoiceQuality = Scenario['choices'][number]['quality'];

/** best = 1, reasonable = 0.5 (it can help, but isn't the first lever), unhelpful = 0. */
export const QUALITY_SCORE: Record<ChoiceQuality, number> = { best: 1, reasonable: 0.5, unhelpful: 0 };

/** Picks per scenario, in order. */
export type DiagnosePicks = Record<string, string[]>;

export function choiceOf(s: Scenario, choiceId: string) {
  return s.choices.find((c) => c.id === choiceId);
}

export function scenarioResolved(s: Scenario, picks: DiagnosePicks): boolean {
  return (picks[s.id] ?? []).some((id) => choiceOf(s, id)?.quality === 'best');
}

/** Average first-pick quality across scenarios (0..1). */
export function diagnoseScore(scenarios: readonly Scenario[], picks: DiagnosePicks): number {
  if (scenarios.length === 0) return 0;
  const total = scenarios.reduce((sum, s) => {
    const first = picks[s.id]?.[0];
    const q = first ? choiceOf(s, first)?.quality : undefined;
    return sum + (q ? QUALITY_SCORE[q] : 0);
  }, 0);
  return total / scenarios.length;
}

// ───────────── guided-tier annotations (UX_SPEC §3: "fast for this recipe") ─────────────

export type Observations = Scenario['observations'];
export type BrewFamily = 'espresso' | 'filter';
export type NoteVerdict = 'low' | 'in' | 'high';

export interface ObservationNote {
  verdict: NoteVerdict;
  text: LocalizedText;
}

/**
 * Common beginner reference ranges (rules of thumb — the same numbers the lessons teach), NOT targets
 * or taste predictions: espresso ~1:1.5–1:2.5 in ~25–35 s; pour-over ~1:15–1:17 in ~2:30–4:00.
 */
export const REFERENCE_RANGES: Record<BrewFamily, { ratio: readonly [number, number]; timeSec: readonly [number, number] }> = {
  espresso: { ratio: [1.5, 2.5], timeSec: [25, 35] },
  filter: { ratio: [15, 17], timeSec: [150, 240] },
};

const L = (zh: string, en: string): LocalizedText => ({ zh, en });
const valid = (v: number | undefined): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/** Espresso-like (≤ 1:4) or filter-like (≥ 1:8) from the ratio; null when it can't be told. */
export function brewFamily(o: Observations): BrewFamily | null {
  if (!valid(o.doseG) || !valid(o.outG)) return null;
  const r = o.outG / o.doseG;
  if (r <= 4) return 'espresso';
  if (r >= 8) return 'filter';
  return null;
}

function verdict(v: number, [lo, hi]: readonly [number, number]): NoteVerdict {
  return v < lo ? 'low' : v > hi ? 'high' : 'in';
}

/** Plain-language notes on how each number compares with the common reference range (guided tier only). */
export function annotateObservations(o: Observations): { ratio?: ObservationNote; time?: ObservationNote } {
  const fam = brewFamily(o);
  if (!fam) return {};
  const ref = REFERENCE_RANGES[fam];
  const out: { ratio?: ObservationNote; time?: ObservationNote } = {};
  const r = o.outG! / o.doseG!;
  const rv = verdict(r, ref.ratio);
  const band = `1:${ref.ratio[0]}–1:${ref.ratio[1]}`;
  out.ratio = {
    verdict: rv,
    text:
      fam === 'espresso'
        ? rv === 'low'
          ? L(`比常见的 ${band} 更短：液体更少，更浓`, `Shorter than the common ${band}: less liquid, more concentrated`)
          : rv === 'high'
            ? L(`比常见的 ${band} 更长：液体更多，更淡`, `Longer than the common ${band}: more liquid, lighter`)
            : L(`在常见的 ${band} 范围内`, `Within the common ${band} range`)
        : rv === 'low'
          ? L(`比常见的 ${band} 更浓：同样的水用了更多咖啡`, `Tighter than the common ${band}: more coffee for the water`)
          : rv === 'high'
            ? L(`比常见的 ${band} 更淡：同样的咖啡用了更多水`, `Looser than the common ${band}: more water for the coffee`)
            : L(`在常见的 ${band} 范围内`, `Within the common ${band} range`),
  };
  if (valid(o.timeSec)) {
    const tv = verdict(o.timeSec, ref.timeSec);
    const window =
      fam === 'espresso' ? `${ref.timeSec[0]}–${ref.timeSec[1]}` : `${mmss(ref.timeSec[0])}–${mmss(ref.timeSec[1])}`;
    const unitZh = fam === 'espresso' ? ' 秒' : '';
    const unitEn = fam === 'espresso' ? ' s' : '';
    out.time = {
      verdict: tv,
      text:
        tv === 'low'
          ? L(`偏快：快于常见参考 ${window}${unitZh}`, `Fast: quicker than the common ${window}${unitEn}`)
          : tv === 'high'
            ? L(`偏慢：慢于常见参考 ${window}${unitZh}`, `Slow: longer than the common ${window}${unitEn}`)
            : L(`在常见参考 ${window}${unitZh} 内`, `Within the common ${window}${unitEn}`),
    };
  }
  return out;
}

/** Independent tier: a committed pick needs a short reason (self-explanation). Not graded — just required. */
export const MIN_REASON_LENGTH = 2;
export function reasonGiven(reason: string): boolean {
  return reason.trim().length >= MIN_REASON_LENGTH;
}
