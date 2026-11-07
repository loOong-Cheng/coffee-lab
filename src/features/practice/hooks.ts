/**
 * Browser-capability hooks for kitchen mode. Every one degrades gracefully: unsupported APIs
 * report a status the UI explains, and nothing here ever throws into React.
 * No microphone, camera or other sensor is ever requested.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Locale } from '../../domain/contracts';
import { createTimer, reviveTimer, tickTimer, type TimerMode, type TimerState } from './timer';

// ───────────────────────── speech (opt-in, output only) ─────────────────────────

export function speechSupported(): boolean {
  try {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';
  } catch {
    return false;
  }
}

export function stopSpeaking(): void {
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* ignore */
  }
}

/** Speaks text aloud (cancelling anything in progress). Returns false when unavailable. */
export function speak(text: string, locale: Locale): boolean {
  if (!text || !speechSupported()) return false;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new window.SpeechSynthesisUtterance(text);
    u.lang = locale === 'zh' ? 'zh-CN' : 'en-US';
    u.rate = 0.95;
    synth.speak(u);
    return true;
  } catch {
    return false;
  }
}

// ───────────────────────── screen wake lock (opt-in) ─────────────────────────

export type WakeLockStatus = 'off' | 'requesting' | 'active' | 'released' | 'unsupported' | 'insecure' | 'error';

interface SentinelLike {
  release(): Promise<void>;
  addEventListener?(type: 'release', cb: () => void): void;
}

/**
 * Keeps the screen on while `enabled` (re-acquired when the tab becomes visible again, since the
 * browser releases it on hide). Needs a secure context (HTTPS or localhost).
 */
export function useWakeLock(enabled: boolean): WakeLockStatus {
  const [status, setStatus] = useState<WakeLockStatus>('off');
  useEffect(() => {
    if (!enabled) {
      setStatus('off');
      return;
    }
    const nav = (typeof navigator !== 'undefined' ? navigator : undefined) as
      | (Navigator & { wakeLock?: { request(type: 'screen'): Promise<SentinelLike> } })
      | undefined;
    if (!nav?.wakeLock || typeof nav.wakeLock.request !== 'function') {
      setStatus(typeof window !== 'undefined' && window.isSecureContext === false ? 'insecure' : 'unsupported');
      return;
    }
    let cancelled = false;
    let sentinel: SentinelLike | null = null;
    const acquire = async () => {
      if (cancelled || sentinel) return;
      setStatus('requesting');
      try {
        const s = await nav.wakeLock!.request('screen');
        if (cancelled) {
          s.release().catch(() => {});
          return;
        }
        sentinel = s;
        setStatus('active');
        s.addEventListener?.('release', () => {
          sentinel = null;
          if (!cancelled) setStatus('released');
        });
      } catch {
        if (!cancelled) setStatus('error');
      }
    };
    void acquire();
    const onVisible = () => {
      if (document.visibilityState === 'visible') void acquire();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      sentinel?.release().catch(() => {});
      sentinel = null;
    };
  }, [enabled]);
  return status;
}

// ───────────────────────── small per-device preferences ─────────────────────────

const WAKE_PREF_KEY = 'coffee-lab:kitchen:keep-awake';

export function readKeepAwakePref(): boolean {
  try {
    return globalThis.localStorage?.getItem(WAKE_PREF_KEY) === '1';
  } catch {
    return false;
  }
}

export function writeKeepAwakePref(on: boolean): void {
  try {
    globalThis.localStorage?.setItem(WAKE_PREF_KEY, on ? '1' : '0');
  } catch {
    /* per-device convenience only */
  }
}

// ───────────────────────── persisted timers ─────────────────────────

const TIMER_PREFIX = 'coffee-lab:timer:';

export function timerKey(planId: string, slot: string): string {
  return `${TIMER_PREFIX}${planId}:${slot}`;
}

function session(): Storage | null {
  try {
    return globalThis.sessionStorage ?? null;
  } catch {
    return null;
  }
}

function loadTimer(key: string): TimerState | null {
  try {
    const raw = session()?.getItem(key);
    return raw ? reviveTimer(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function saveTimer(key: string, t: TimerState): void {
  try {
    session()?.setItem(key, JSON.stringify(t));
  } catch {
    /* timers still work in memory */
  }
}

/** Removes every saved timer of a plan (called when the practice ends). */
export function clearPlanTimers(planId: string): void {
  const s = session();
  if (!s) return;
  try {
    const prefix = `${TIMER_PREFIX}${planId}:`;
    const keys: string[] = [];
    for (let i = 0; i < s.length; i++) {
      const k = s.key(i);
      if (k && k.startsWith(prefix)) keys.push(k);
    }
    for (const k of keys) s.removeItem(k);
  } catch {
    /* ignore */
  }
}

/** Elapsed whole seconds of a plan's stopwatch, if the learner ran it (for the brew log's time field). */
export function readStopwatchSeconds(planId: string, now = Date.now()): number | null {
  const t = loadTimer(timerKey(planId, 'stopwatch'));
  if (!t || t.mode !== 'stopwatch' || t.status === 'idle') return null;
  const ms = t.accumulatedMs + (t.status === 'running' && t.startedAt !== null ? Math.max(0, now - t.startedAt) : 0);
  const sec = Math.round(ms / 1000);
  return sec > 0 ? sec : null;
}

/**
 * Timer state persisted in sessionStorage (survives reload / interruption in the same tab).
 * Re-renders ~4×/s only while running. `onFinish` fires once when a countdown reaches zero.
 */
export function usePersistentTimer(key: string, mode: TimerMode, durationSec: number, onFinish?: () => void) {
  const [timer, setTimer] = useState<TimerState>(() => {
    const saved = loadTimer(key);
    return saved && saved.mode === mode ? saved : createTimer(mode, durationSec);
  });
  const [now, setNow] = useState(() => Date.now());
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const update = useCallback(
    (fn: (t: TimerState, now: number) => TimerState) => {
      const at = Date.now();
      setNow(at);
      setTimer((t) => {
        const next = fn(t, at);
        if (next !== t) saveTimer(key, next);
        return next;
      });
    },
    [key],
  );

  useEffect(() => {
    if (timer.status !== 'running') return;
    const id = setInterval(() => {
      const at = Date.now();
      setNow(at);
      setTimer((t) => {
        const next = tickTimer(t, at);
        if (next !== t) {
          saveTimer(key, next);
          if (next.status === 'finished') queueMicrotask(() => onFinishRef.current?.());
        }
        return next;
      });
    }, 250);
    return () => clearInterval(id);
  }, [timer.status, key]);

  return { timer, now, update };
}
