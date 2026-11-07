/** Pure logic for diagnosis scenarios ("what ONE thing would you change?"). */
import type { DiagnoseActivity } from '../../../domain/contracts';

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
