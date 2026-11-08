/**
 * "Timed in app" carry-over (pure). The ONLY value Coffee Lab measures itself is the interval between
 * the learner's own Start and Stop taps on an in-app timer (CONTRACTS §9: observed_by_app). Everything
 * else in a brew log is self-reported. This module decides which measured interval the brew log offers.
 */
import { elapsedMs, type TimerState } from './timer';

export type MeasuredSource = 'shot' | 'schedule' | 'stopwatch';

export interface MeasuredTime {
  sec: number;
  source: MeasuredSource;
  /** The learner tapped "use in my brew log" → the time field starts filled (and marked "timed in app"). */
  prefill: boolean;
}

/** Persisted when the learner taps "Use this time in my brew log" on a stopped timer. */
export interface CarryRecord {
  sec: number;
  source: MeasuredSource;
  /** Timer slot it came from (so resetting that timer withdraws the offer). */
  slot: string;
}

export function isCarryRecord(v: unknown): v is CarryRecord {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.sec === 'number' &&
    Number.isInteger(o.sec) &&
    o.sec > 0 &&
    o.sec <= 48 * 3600 &&
    (o.source === 'shot' || o.source === 'schedule' || o.source === 'stopwatch') &&
    typeof o.slot === 'string'
  );
}

/** Whole seconds a timer measured, or null when it never ran (idle) or measured nothing. */
export function measuredSeconds(t: TimerState | null | undefined, now: number): number | null {
  if (!t || t.mode !== 'stopwatch' || t.status === 'idle') return null;
  const sec = Math.round(elapsedMs(t, now) / 1000);
  return sec > 0 ? sec : null;
}

export interface TimerCandidate {
  source: MeasuredSource;
  timer: TimerState | null;
}

/**
 * What the brew log should offer for its time field:
 *  1. a time the learner explicitly carried over (prefilled);
 *  2. otherwise the first STOPPED companion timer (shot/schedule), then any stopwatch reading — offered
 *     as a button, never auto-filled.
 */
export function pickMeasuredTime(carry: CarryRecord | null, candidates: readonly TimerCandidate[], now: number): MeasuredTime | null {
  if (carry && isCarryRecord(carry)) return { sec: carry.sec, source: carry.source, prefill: true };
  for (const c of candidates) {
    if (c.source !== 'stopwatch' && c.timer?.status !== 'finished') continue;
    const sec = measuredSeconds(c.timer, now);
    if (sec) return { sec, source: c.source, prefill: false };
  }
  return null;
}
