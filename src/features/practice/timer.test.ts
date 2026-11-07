import { describe, expect, it } from 'vitest';
import {
  createTimer,
  elapsedMs,
  formatClock,
  pauseTimer,
  remainingMs,
  resetTimer,
  reviveTimer,
  startTimer,
  tickTimer,
  timerFraction,
} from './timer';

describe('countdown', () => {
  it('counts down from wall-clock time, pauses and resumes', () => {
    let t = createTimer('countdown', 30);
    expect(t).toMatchObject({ status: 'idle', durationMs: 30_000 });
    t = startTimer(t, 1_000);
    expect(remainingMs(t, 11_000)).toBe(20_000);
    expect(timerFraction(t, 11_000)).toBeCloseTo(1 / 3);
    t = pauseTimer(t, 11_000);
    expect(t.status).toBe('paused');
    // paused time does not count
    expect(remainingMs(t, 500_000)).toBe(20_000);
    t = startTimer(t, 600_000);
    expect(remainingMs(t, 605_000)).toBe(15_000);
  });

  it('finishes exactly once and clamps elapsed to the duration', () => {
    let t = startTimer(createTimer('countdown', 5), 0);
    expect(tickTimer(t, 4_999).status).toBe('running');
    t = tickTimer(t, 7_000);
    expect(t.status).toBe('finished');
    expect(remainingMs(t, 9_000)).toBe(0);
    expect(elapsedMs(t, 9_000)).toBe(5_000);
    expect(tickTimer(t, 10_000)).toBe(t);
    // starting a finished timer restarts it
    expect(startTimer(t, 20_000)).toMatchObject({ status: 'running', accumulatedMs: 0, startedAt: 20_000 });
  });

  it('reset returns to idle', () => {
    const t = resetTimer(startTimer(createTimer('countdown', 10), 0));
    expect(t).toMatchObject({ status: 'idle', accumulatedMs: 0, startedAt: null });
  });
});

describe('stopwatch', () => {
  it('counts up without an upper bound and never finishes on tick', () => {
    let t = startTimer(createTimer('stopwatch'), 0);
    expect(elapsedMs(t, 42_000)).toBe(42_000);
    expect(tickTimer(t, 1e9).status).toBe('running');
    t = pauseTimer(t, 28_400);
    expect(elapsedMs(t, 99_999)).toBe(28_400);
    expect(remainingMs(t, 0)).toBe(0);
  });
  it('ignores invalid durations and double starts', () => {
    expect(createTimer('countdown', -3).durationMs).toBe(0);
    expect(createTimer('countdown', Number.NaN).durationMs).toBe(0);
    const t = startTimer(createTimer('stopwatch'), 5);
    expect(startTimer(t, 99)).toBe(t);
    expect(pauseTimer(createTimer('stopwatch'), 5).status).toBe('idle');
  });
});

describe('formatClock', () => {
  it('formats m:ss and h:mm:ss with optional round-up', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(28_400)).toBe('0:28');
    expect(formatClock(28_400, true)).toBe('0:29');
    expect(formatClock(240_000)).toBe('4:00');
    expect(formatClock(3_725_000)).toBe('1:02:05');
    expect(formatClock(Number.NaN)).toBe('0:00');
    expect(formatClock(-5)).toBe('0:00');
  });
});

describe('reviveTimer', () => {
  it('accepts a serialised timer and rejects junk', () => {
    const t = startTimer(createTimer('countdown', 30), 1234);
    expect(reviveTimer(JSON.parse(JSON.stringify(t)))).toEqual(t);
    expect(reviveTimer(null)).toBeNull();
    expect(reviveTimer({ mode: 'egg', status: 'idle', durationMs: 1, accumulatedMs: 0 })).toBeNull();
    expect(reviveTimer({ mode: 'stopwatch', status: 'running', durationMs: 0, accumulatedMs: 0, startedAt: null })).toBeNull();
  });
});
