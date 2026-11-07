/** Pure logic for "put the steps in order" (SequenceActivity). */
import type { SequenceActivity } from '../../../domain/contracts';

export type Misconception = NonNullable<SequenceActivity['misconceptions']>[number];

/** Small deterministic PRNG (mulberry32) so a shuffle is reproducible in tests and stable across re-renders. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fisher–Yates shuffle. With 2+ distinct items the result is never the already-correct order
 * (otherwise the exercise would be solved before it starts).
 */
export function shuffleSteps<T>(items: readonly T[], seed: number): T[] {
  const out = [...items];
  if (out.length < 2) return out;
  const rand = seededRandom(seed);
  for (let attempt = 0; attempt < 8; attempt++) {
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [out[i], out[j]] = [out[j]!, out[i]!];
    }
    if (out.some((x, i) => x !== items[i])) return out;
  }
  // Fallback: rotate by one (always different for 2+ distinct items).
  return [...items.slice(1), items[0]!];
}

/** Misconceptions triggered by an order: `laterStep` was placed ahead of `earlierStep`. */
export function detectMisconceptions(order: readonly string[], misconceptions: readonly Misconception[] = []): Misconception[] {
  const pos = new Map(order.map((id, i) => [id, i]));
  return misconceptions.filter((m) => {
    const e = pos.get(m.earlierStep);
    const l = pos.get(m.laterStep);
    return e !== undefined && l !== undefined && l < e;
  });
}

export interface SequenceCheck {
  /** Per position of the submitted order: is the right step in this slot? */
  correctPositions: boolean[];
  correctCount: number;
  total: number;
  /** correctCount / total (0..1). */
  score: number;
  allCorrect: boolean;
  /** Index of the first misplaced slot, or -1. */
  firstWrongIndex: number;
  misconceptions: Misconception[];
}

/** Compare a full submitted order with the correct order (content lists steps in the correct order). */
export function checkSequence(
  order: readonly string[],
  correct: readonly string[],
  misconceptions: readonly Misconception[] = [],
): SequenceCheck {
  const total = correct.length;
  const correctPositions = correct.map((id, i) => order[i] === id);
  const correctCount = correctPositions.filter(Boolean).length;
  const firstWrongIndex = correctPositions.indexOf(false);
  return {
    correctPositions,
    correctCount,
    total,
    score: total === 0 ? 0 : correctCount / total,
    allCorrect: total > 0 && correctCount === total && order.length === total,
    firstWrongIndex,
    misconceptions: detectMisconceptions(order, misconceptions),
  };
}

export interface NextStepCheck {
  ok: boolean;
  /** The step that belongs next. */
  expected: string | undefined;
  /** A targeted explanation when the candidate jumps ahead of a step it depends on. */
  misconception?: Misconception;
}

/**
 * Guided mode: the learner builds the order one step at a time; each pick is checked immediately.
 * A misconception fires when the candidate is a `laterStep` whose `earlierStep` has not been placed yet.
 */
export function checkNextStep(
  placed: readonly string[],
  candidate: string,
  correct: readonly string[],
  misconceptions: readonly Misconception[] = [],
): NextStepCheck {
  const expected = correct[placed.length];
  if (candidate === expected) return { ok: true, expected };
  const placedSet = new Set(placed);
  const misconception = misconceptions.find((m) => m.laterStep === candidate && !placedSet.has(m.earlierStep));
  return { ok: false, expected, misconception };
}

/** Move one item up (-1) or down (+1); returns a new array (unchanged when out of bounds). */
export function moveItem<T>(list: readonly T[], index: number, delta: -1 | 1): T[] {
  const target = index + delta;
  if (index < 0 || index >= list.length || target < 0 || target >= list.length) return [...list];
  const out = [...list];
  [out[index], out[target]] = [out[target]!, out[index]!];
  return out;
}

/** Move an item from one index to another (drag & drop / tap-to-place). */
export function relocate<T>(list: readonly T[], from: number, to: number): T[] {
  if (from < 0 || from >= list.length) return [...list];
  const out = [...list];
  const [item] = out.splice(from, 1);
  const clamped = Math.max(0, Math.min(out.length, to));
  out.splice(clamped, 0, item!);
  return out;
}
