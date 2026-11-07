import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearPlanTimers, readStopwatchSeconds, speak, speechSupported, timerKey, useWakeLock } from './hooks';
import { createTimer, pauseTimer, startTimer } from './timer';

afterEach(() => {
  sessionStorage.clear();
  // remove any wakeLock stub
  delete (navigator as unknown as Record<string, unknown>).wakeLock;
});

describe('useWakeLock', () => {
  it('reports unsupported when the API is missing, and off when disabled', async () => {
    const { result, rerender } = renderHook(({ on }) => useWakeLock(on), { initialProps: { on: false } });
    expect(result.current).toBe('off');
    rerender({ on: true });
    await waitFor(() => expect(['unsupported', 'insecure']).toContain(result.current));
  });

  it('acquires and releases a screen wake lock', async () => {
    const release = vi.fn(() => Promise.resolve());
    const request = vi.fn(() => Promise.resolve({ release, addEventListener: vi.fn() }));
    Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true });
    const { result, rerender } = renderHook(({ on }) => useWakeLock(on), { initialProps: { on: true } });
    await waitFor(() => expect(result.current).toBe('active'));
    expect(request).toHaveBeenCalledWith('screen');
    rerender({ on: false });
    expect(release).toHaveBeenCalled();
    expect(result.current).toBe('off');
  });

  it('reports an error when the request is refused', async () => {
    Object.defineProperty(navigator, 'wakeLock', { value: { request: () => Promise.reject(new Error('denied')) }, configurable: true });
    const { result } = renderHook(() => useWakeLock(true));
    await waitFor(() => expect(result.current).toBe('error'));
  });
});

describe('speech fallback', () => {
  it('is unavailable in jsdom and speak() returns false instead of throwing', () => {
    expect(speechSupported()).toBe(false);
    expect(speak('hello', 'en')).toBe(false);
  });
});

describe('persisted stopwatch helpers', () => {
  it('reads elapsed seconds only when the learner ran the stopwatch, and clears per plan', () => {
    const key = timerKey('drink:x', 'stopwatch');
    expect(readStopwatchSeconds('drink:x')).toBeNull();
    sessionStorage.setItem(key, JSON.stringify(createTimer('stopwatch')));
    expect(readStopwatchSeconds('drink:x')).toBeNull(); // idle → nothing measured
    const t = pauseTimer(startTimer(createTimer('stopwatch'), 1_000), 29_400);
    sessionStorage.setItem(key, JSON.stringify(t));
    expect(readStopwatchSeconds('drink:x')).toBe(28);
    sessionStorage.setItem(timerKey('other', 'stopwatch'), JSON.stringify(t));
    act(() => clearPlanTimers('drink:x'));
    expect(sessionStorage.getItem(key)).toBeNull();
    expect(sessionStorage.getItem(timerKey('other', 'stopwatch'))).not.toBeNull();
  });
});
