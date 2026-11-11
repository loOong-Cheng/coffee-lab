/**
 * Serializable seeded RNG (mulberry32, same algorithm as the café `seededRandom`), but with its
 * state kept as a plain number so the whole simulation state stays a pure, cloneable value.
 */
export function rngNext(state: number): [value: number, next: number] {
  const a = (state + 0x6d2b79f5) >>> 0;
  let t = a;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, a];
}

/** Mix a seed with a salt so independent streams (sim, bot) don't correlate. */
export function seedMix(seed: number, salt: number): number {
  let h = (seed ^ Math.imul(salt, 0x9e3779b1)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

/** Tiny mutable stream for code that owns its RNG (bots). */
export function makeStream(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    const [v, n] = rngNext(s);
    s = n;
    return v;
  };
}
