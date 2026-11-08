/**
 * Pure step-timer model (countdown or stopwatch). Time is derived from wall-clock timestamps,
 * not from counting ticks, so it stays correct when the tab is throttled, the phone sleeps,
 * or the page reloads (the state is serialisable).
 */
export type TimerMode = 'countdown' | 'stopwatch';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface TimerState {
  mode: TimerMode;
  /** Countdown length in ms (ignored by the stopwatch). */
  durationMs: number;
  status: TimerStatus;
  /** Epoch ms when the current running span began (null unless running). */
  startedAt: number | null;
  /** Elapsed ms from previous running spans. */
  accumulatedMs: number;
}

export function createTimer(mode: TimerMode, durationSec = 0): TimerState {
  const d = Number.isFinite(durationSec) && durationSec > 0 ? Math.round(durationSec * 1000) : 0;
  return { mode, durationMs: d, status: 'idle', startedAt: null, accumulatedMs: 0 };
}

export function elapsedMs(t: TimerState, now: number): number {
  const running = t.status === 'running' && t.startedAt !== null ? Math.max(0, now - t.startedAt) : 0;
  const e = t.accumulatedMs + running;
  return t.mode === 'countdown' ? Math.min(e, t.durationMs) : e;
}

export function remainingMs(t: TimerState, now: number): number {
  if (t.mode !== 'countdown') return 0;
  return Math.max(0, t.durationMs - elapsedMs(t, now));
}

/** 0..1 progress for a countdown (0 for a stopwatch). */
export function timerFraction(t: TimerState, now: number): number {
  if (t.mode !== 'countdown' || t.durationMs <= 0) return 0;
  return elapsedMs(t, now) / t.durationMs;
}

export function startTimer(t: TimerState, now: number): TimerState {
  if (t.status === 'running') return t;
  if (t.status === 'finished') return { ...t, status: 'running', startedAt: now, accumulatedMs: 0 };
  return { ...t, status: 'running', startedAt: now };
}

export function pauseTimer(t: TimerState, now: number): TimerState {
  if (t.status !== 'running') return t;
  return { ...t, status: 'paused', startedAt: null, accumulatedMs: elapsedMs(t, now) };
}

/**
 * Stop a stopwatch for good (status 'finished', elapsed frozen). Used by the shot timer and the pour
 * schedule: "finished" means the learner tapped Stop, so the frozen value is the interval between their
 * own Start and Stop taps — the one thing the app genuinely measured. Starting again restarts from 0.
 */
export function stopTimer(t: TimerState, now: number): TimerState {
  if (t.status === 'idle' || t.status === 'finished') return t;
  return { ...t, status: 'finished', startedAt: null, accumulatedMs: elapsedMs(t, now) };
}

export function resetTimer(t: TimerState): TimerState {
  return { ...t, status: 'idle', startedAt: null, accumulatedMs: 0 };
}

/** Advance: a countdown that has run out becomes 'finished' (exactly once). */
export function tickTimer(t: TimerState, now: number): TimerState {
  if (t.status !== 'running' || t.mode !== 'countdown') return t;
  if (elapsedMs(t, now) >= t.durationMs) return { ...t, status: 'finished', startedAt: null, accumulatedMs: t.durationMs };
  return t;
}

/** "m:ss" (or "h:mm:ss"), always ASCII digits. Rounds UP for countdowns so 0:00 means done. */
export function formatClock(ms: number, roundUp = false): string {
  const safe = Number.isFinite(ms) && ms > 0 ? ms : 0;
  const total = roundUp ? Math.ceil(safe / 1000) : Math.floor(safe / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/** Validates a parsed (e.g. sessionStorage) value; returns null when unusable. */
export function reviveTimer(v: unknown): TimerState | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const modeOk = o.mode === 'countdown' || o.mode === 'stopwatch';
  const statusOk = o.status === 'idle' || o.status === 'running' || o.status === 'paused' || o.status === 'finished';
  const num = (x: unknown) => typeof x === 'number' && Number.isFinite(x) && x >= 0;
  if (!modeOk || !statusOk || !num(o.durationMs) || !num(o.accumulatedMs)) return null;
  if (o.status === 'running' && !num(o.startedAt)) return null;
  return {
    mode: o.mode as TimerMode,
    status: o.status as TimerStatus,
    durationMs: o.durationMs as number,
    accumulatedMs: o.accumulatedMs as number,
    startedAt: o.status === 'running' ? (o.startedAt as number) : null,
  };
}
