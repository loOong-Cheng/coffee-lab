import { beforeEach, describe, expect, it } from 'vitest';
import { clearPlanTimers, readCarry, readMeasuredTime, timerKey, writeCarry } from './hooks';
import { isCarryRecord, measuredSeconds, pickMeasuredTime } from './measured';
import type { PracticePlan } from './plan';
import { createTimer, pauseTimer, startTimer, stopTimer } from './timer';

const stopped = (ms: number) => stopTimer(startTimer(createTimer('stopwatch'), 1_000), 1_000 + ms);

describe('stopTimer', () => {
  it('freezes a running stopwatch as finished; idle/finished are unchanged; start restarts from 0', () => {
    const s = stopped(28_400);
    expect(s).toMatchObject({ status: 'finished', startedAt: null, accumulatedMs: 28_400 });
    expect(stopTimer(s, 99_000)).toBe(s);
    const idle = createTimer('stopwatch');
    expect(stopTimer(idle, 5)).toBe(idle);
    expect(stopTimer(pauseTimer(startTimer(idle, 0), 3_000), 9_000)).toMatchObject({ status: 'finished', accumulatedMs: 3_000 });
    expect(startTimer(s, 50_000)).toMatchObject({ status: 'running', accumulatedMs: 0, startedAt: 50_000 });
  });
});

describe('measuredSeconds / pickMeasuredTime (timer → log carry-over)', () => {
  it('rounds to whole seconds and ignores idle or zero timers', () => {
    expect(measuredSeconds(stopped(28_400), 0)).toBe(28);
    expect(measuredSeconds(stopped(28_600), 0)).toBe(29);
    expect(measuredSeconds(createTimer('stopwatch'), 0)).toBeNull();
    expect(measuredSeconds(stopped(200), 0)).toBeNull();
    expect(measuredSeconds(null, 0)).toBeNull();
  });

  it('a carried time wins and is prefilled', () => {
    const got = pickMeasuredTime({ sec: 27, source: 'shot', slot: 'shot:brew' }, [{ source: 'shot', timer: stopped(31_000) }], 0);
    expect(got).toEqual({ sec: 27, source: 'shot', prefill: true });
  });

  it('without a carry, a STOPPED companion timer is offered (not prefilled); a running one is not', () => {
    const running = startTimer(createTimer('stopwatch'), 0);
    expect(pickMeasuredTime(null, [{ source: 'shot', timer: running }], 10_000)).toBeNull();
    expect(pickMeasuredTime(null, [{ source: 'schedule', timer: stopped(185_000) }], 0)).toEqual({ sec: 185, source: 'schedule', prefill: false });
  });

  it('the generic stopwatch counts even when paused (still measured between taps)', () => {
    const paused = pauseTimer(startTimer(createTimer('stopwatch'), 0), 42_000);
    expect(pickMeasuredTime(null, [{ source: 'shot', timer: null }, { source: 'stopwatch', timer: paused }], 0)).toEqual({ sec: 42, source: 'stopwatch', prefill: false });
  });

  it('validates carry records', () => {
    expect(isCarryRecord({ sec: 28, source: 'shot', slot: 'x' })).toBe(true);
    expect(isCarryRecord({ sec: 0, source: 'shot', slot: 'x' })).toBe(false);
    expect(isCarryRecord({ sec: 2.5, source: 'shot', slot: 'x' })).toBe(false);
    expect(isCarryRecord({ sec: 28, source: 'scale', slot: 'x' })).toBe(false);
    expect(isCarryRecord(null)).toBe(false);
  });
});

describe('readMeasuredTime (sessionStorage)', () => {
  const plan = { id: 'esp-first-real-shot-guide', companion: { kind: 'shot-timer', groups: [['brew', 'stop']], referenceSec: [25, 35], referenceFrom: 'recipe' } } as Pick<PracticePlan, 'id' | 'companion'>;
  beforeEach(() => sessionStorage.clear());

  it('reads the stopped shot timer, then the carry; clearPlanTimers removes both', () => {
    expect(readMeasuredTime(plan)).toBeNull();
    sessionStorage.setItem(timerKey(plan.id, 'shot:brew'), JSON.stringify(stopped(26_000)));
    expect(readMeasuredTime(plan)).toEqual({ sec: 26, source: 'shot', prefill: false });
    writeCarry(plan.id, { sec: 26, source: 'shot', slot: 'shot:brew' });
    expect(readCarry(plan.id)).toEqual({ sec: 26, source: 'shot', slot: 'shot:brew' });
    expect(readMeasuredTime(plan)).toEqual({ sec: 26, source: 'shot', prefill: true });
    clearPlanTimers(plan.id);
    expect(readCarry(plan.id)).toBeNull();
    expect(readMeasuredTime(plan)).toBeNull();
  });

  it('ignores corrupted carry data', () => {
    sessionStorage.setItem(timerKey(plan.id, 'carry'), '{not json');
    expect(readCarry(plan.id)).toBeNull();
    sessionStorage.setItem(timerKey(plan.id, 'carry'), JSON.stringify({ sec: -1, source: 'shot', slot: 'x' }));
    expect(readMeasuredTime(plan)).toBeNull();
  });
});
