/**
 * Capability detection (CONTRACTS.md §5). Pure-ish: everything reads from an injectable `CapabilityEnv`
 * so tests can fake navigator/window. NEVER throws; WebXR is strictly optional.
 *
 * Honesty notes:
 *  - xrControllers / xrHandTracking are left undefined: they are only knowable inside a running session.
 *  - physicalEquipment is self-reported by the learner (profile), never detected — detection returns [].
 */
import type { CapabilityProfile, Mode } from '../domain/contracts';

type MediaQueryFn = (query: string) => { matches: boolean };

interface XrSystemLike {
  isSessionSupported(mode: string): Promise<boolean>;
}

export interface NavigatorLike {
  userAgent?: string;
  maxTouchPoints?: number;
  xr?: XrSystemLike;
  wakeLock?: unknown;
  userAgentData?: { mobile?: boolean };
}

export interface CapabilityEnv {
  navigator?: NavigatorLike;
  /** The global object to probe for speechSynthesis / SpeechRecognition / ontouchstart. */
  window?: Record<string, unknown>;
  matchMedia?: MediaQueryFn;
  isSecureContext?: boolean;
  /** Max wait for navigator.xr.isSessionSupported (some runtimes hang). Default 2500 ms. */
  xrTimeoutMs?: number;
}

export type XrSupportReason = 'supported' | 'no-webxr-api' | 'insecure-context' | 'not-supported' | 'error' | 'timeout';

export interface XrSupport {
  immersiveVR: boolean;
  reason: XrSupportReason;
}

export function browserEnv(): CapabilityEnv {
  const w = typeof window !== 'undefined' ? window : undefined;
  return {
    navigator: typeof navigator !== 'undefined' ? (navigator as unknown as NavigatorLike) : undefined,
    window: w as unknown as Record<string, unknown> | undefined,
    matchMedia: w && typeof w.matchMedia === 'function' ? (q) => w.matchMedia(q) : undefined,
    isSecureContext: w ? w.isSecureContext : undefined,
  };
}

function mq(env: CapabilityEnv, query: string): boolean {
  try {
    return !!env.matchMedia?.(query).matches;
  } catch {
    return false;
  }
}

function has(obj: Record<string, unknown> | undefined, key: string): boolean {
  try {
    return !!obj && key in obj && obj[key] != null;
  } catch {
    return false;
  }
}

/** Standalone-headset browsers (Meta Quest Browser, Pico, Wolvic, HTC VIVE). */
export function isHeadsetUserAgent(ua: string | undefined): boolean {
  if (!ua) return false;
  return /OculusBrowser|\bQuest\b|Pico ?Neo|PicoBrowser|\bPico\b.*VR|Wolvic|VIVE ?Focus|Mobile VR/i.test(ua);
}

export function isMobileUserAgent(ua: string | undefined): boolean {
  if (!ua) return false;
  return /Android|iPhone|iPad|iPod|Mobile|HarmonyOS/i.test(ua);
}

/** Never rejects. */
export async function detectXrSupport(env: CapabilityEnv = browserEnv()): Promise<XrSupport> {
  try {
    const xr = env.navigator?.xr;
    if (!xr || typeof xr.isSessionSupported !== 'function') {
      // Chrome hides navigator.xr on insecure origins (e.g. http://192.168.x.x LAN dev).
      return { immersiveVR: false, reason: env.isSecureContext === false ? 'insecure-context' : 'no-webxr-api' };
    }
    const timeoutMs = env.xrTimeoutMs ?? 2500;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<'timeout'>((resolve) => {
      timer = setTimeout(() => resolve('timeout'), timeoutMs);
    });
    try {
      const result = await Promise.race([Promise.resolve().then(() => xr.isSessionSupported('immersive-vr')), timeout]);
      if (result === 'timeout') return { immersiveVR: false, reason: 'timeout' };
      return result === true ? { immersiveVR: true, reason: 'supported' } : { immersiveVR: false, reason: 'not-supported' };
    } finally {
      if (timer !== undefined) clearTimeout(timer);
    }
  } catch {
    return { immersiveVR: false, reason: 'error' };
  }
}

/** Synchronous part of detection (everything except WebXR). Never throws. */
export function detectBasicCapabilities(env: CapabilityEnv = browserEnv()): Omit<CapabilityProfile, 'xrImmersiveVR'> {
  const nav = env.navigator;
  const ua = nav?.userAgent ?? '';
  const coarse = mq(env, '(pointer: coarse)');
  const noHover = mq(env, '(hover: none)');
  const maxTouch = typeof nav?.maxTouchPoints === 'number' ? nav.maxTouchPoints : 0;
  const touch = coarse || maxTouch > 0 || has(env.window, 'ontouchstart');

  let screen: CapabilityProfile['screen'] = 'desktop';
  if (isHeadsetUserAgent(ua)) screen = 'headset';
  else if (
    nav?.userAgentData?.mobile === true ||
    isMobileUserAgent(ua) ||
    (coarse && noHover) ||
    (/Macintosh/i.test(ua) && maxTouch > 1) // iPadOS reports a desktop UA
  ) {
    screen = 'mobile';
  }

  return {
    screen,
    touch,
    speechSynthesis: has(env.window, 'speechSynthesis'),
    speechRecognition: has(env.window, 'SpeechRecognition') || has(env.window, 'webkitSpeechRecognition'),
    wakeLock: !!nav && has(nav as Record<string, unknown>, 'wakeLock'),
    prefersReducedMotion: mq(env, '(prefers-reduced-motion: reduce)'),
    physicalEquipment: [],
  };
}

/** Full capability profile. Never throws/rejects; navigator.xr is optional. */
export async function detectCapabilities(env: CapabilityEnv = browserEnv()): Promise<CapabilityProfile> {
  let basic: Omit<CapabilityProfile, 'xrImmersiveVR'>;
  try {
    basic = detectBasicCapabilities(env);
  } catch {
    basic = {
      screen: 'desktop',
      touch: false,
      speechSynthesis: false,
      speechRecognition: false,
      wakeLock: false,
      prefersReducedMotion: false,
      physicalEquipment: [],
    };
  }
  const xr = await detectXrSupport(env);
  return { ...basic, xrImmersiveVR: xr.immersiveVR };
}

/**
 * Suggested default mode. The learner can always choose another; 'real-world-guide' is never
 * auto-suggested because only the learner knows they are standing at a coffee machine.
 */
export function suggestMode(c: CapabilityProfile): Mode {
  if (c.screen === 'headset' && c.xrImmersiveVR) return 'xr';
  if (c.screen === 'mobile') return 'mobile';
  return 'desktop';
}
