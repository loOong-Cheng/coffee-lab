import { describe, expect, it } from 'vitest';
import type { CapabilityProfile } from '../domain/contracts';
import {
  detectBasicCapabilities,
  detectCapabilities,
  detectXrSupport,
  isHeadsetUserAgent,
  suggestMode,
  type CapabilityEnv,
} from './capabilities';

const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';
const QUEST_UA =
  'Mozilla/5.0 (X11; Linux x86_64; Quest 3) AppleWebKit/537.36 (KHTML, like Gecko) OculusBrowser/37.0 SamsungBrowser/4.0 Chrome/138.0 VR Safari/537.36';
const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

function media(matching: string[]) {
  return (q: string) => ({ matches: matching.includes(q) });
}

function env(partial: Partial<CapabilityEnv> = {}): CapabilityEnv {
  return { navigator: { userAgent: DESKTOP_UA, maxTouchPoints: 0 }, window: {}, matchMedia: media([]), isSecureContext: true, ...partial };
}

describe('detectXrSupport', () => {
  it('no navigator.xr → not supported, no throw', async () => {
    await expect(detectXrSupport(env())).resolves.toEqual({ immersiveVR: false, reason: 'no-webxr-api' });
    await expect(detectXrSupport({})).resolves.toEqual({ immersiveVR: false, reason: 'no-webxr-api' });
  });

  it('reports insecure context when navigator.xr is hidden on http', async () => {
    await expect(detectXrSupport(env({ isSecureContext: false }))).resolves.toEqual({ immersiveVR: false, reason: 'insecure-context' });
  });

  it('isSessionSupported rejecting → error, never throws', async () => {
    const e = env({ navigator: { userAgent: DESKTOP_UA, xr: { isSessionSupported: () => Promise.reject(new Error('SecurityError')) } } });
    await expect(detectXrSupport(e)).resolves.toEqual({ immersiveVR: false, reason: 'error' });
  });

  it('isSessionSupported throwing synchronously → error', async () => {
    const e = env({
      navigator: {
        xr: {
          isSessionSupported: () => {
            throw new Error('boom');
          },
        },
      },
    });
    await expect(detectXrSupport(e)).resolves.toMatchObject({ immersiveVR: false });
  });

  it('isSessionSupported hanging → timeout', async () => {
    const e = env({ navigator: { xr: { isSessionSupported: () => new Promise<boolean>(() => {}) } }, xrTimeoutMs: 20 });
    await expect(detectXrSupport(e)).resolves.toEqual({ immersiveVR: false, reason: 'timeout' });
  });

  it('supported / not supported', async () => {
    const yes = env({ navigator: { xr: { isSessionSupported: async (m) => m === 'immersive-vr' } } });
    await expect(detectXrSupport(yes)).resolves.toEqual({ immersiveVR: true, reason: 'supported' });
    const no = env({ navigator: { xr: { isSessionSupported: async () => false } } });
    await expect(detectXrSupport(no)).resolves.toEqual({ immersiveVR: false, reason: 'not-supported' });
  });
});

describe('detectCapabilities', () => {
  it('plain desktop', async () => {
    const c = await detectCapabilities(env());
    expect(c).toEqual<CapabilityProfile>({
      screen: 'desktop',
      touch: false,
      xrImmersiveVR: false,
      speechSynthesis: false,
      speechRecognition: false,
      wakeLock: false,
      prefersReducedMotion: false,
      physicalEquipment: [],
    });
    expect(suggestMode(c)).toBe('desktop');
  });

  it('phone: coarse pointer + touch + speech + wake lock + reduced motion', async () => {
    const c = await detectCapabilities(
      env({
        navigator: { userAgent: IPHONE_UA, maxTouchPoints: 5, wakeLock: {} },
        window: { ontouchstart: () => {}, speechSynthesis: {}, webkitSpeechRecognition: function () {} },
        matchMedia: media(['(pointer: coarse)', '(hover: none)', '(prefers-reduced-motion: reduce)']),
      }),
    );
    expect(c.screen).toBe('mobile');
    expect(c.touch).toBe(true);
    expect(c.speechSynthesis).toBe(true);
    expect(c.speechRecognition).toBe(true);
    expect(c.wakeLock).toBe(true);
    expect(c.prefersReducedMotion).toBe(true);
    expect(suggestMode(c)).toBe('mobile');
  });

  it('touch-screen laptop (fine pointer) stays desktop but reports touch', () => {
    const c = detectBasicCapabilities(env({ navigator: { userAgent: DESKTOP_UA, maxTouchPoints: 10 } }));
    expect(c.screen).toBe('desktop');
    expect(c.touch).toBe(true);
  });

  it('iPadOS desktop-class UA with touch points → mobile', () => {
    const c = detectBasicCapabilities(
      env({ navigator: { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Version/18.0 Safari/605.1.15', maxTouchPoints: 5 } }),
    );
    expect(c.screen).toBe('mobile');
  });

  it('Quest browser → headset; suggests xr only when immersive-vr is supported', async () => {
    expect(isHeadsetUserAgent(QUEST_UA)).toBe(true);
    expect(isHeadsetUserAgent(DESKTOP_UA)).toBe(false);
    const withXr = await detectCapabilities(env({ navigator: { userAgent: QUEST_UA, xr: { isSessionSupported: async () => true } } }));
    expect(withXr.screen).toBe('headset');
    expect(withXr.xrImmersiveVR).toBe(true);
    expect(suggestMode(withXr)).toBe('xr');
    const noXr = await detectCapabilities(env({ navigator: { userAgent: QUEST_UA } }));
    expect(suggestMode(noXr)).toBe('desktop');
  });

  it('never throws even when matchMedia and property access explode', async () => {
    const hostile = new Proxy({}, { has: () => { throw new Error('nope'); }, get: () => { throw new Error('nope'); } });
    const c = await detectCapabilities({
      navigator: hostile as never,
      window: hostile as never,
      matchMedia: () => {
        throw new Error('nope');
      },
    });
    expect(c.xrImmersiveVR).toBe(false);
    expect(c.screen).toBe('desktop');
  });

  it('runs in the jsdom browser env without navigator.xr', async () => {
    const c = await detectCapabilities();
    expect(c.xrImmersiveVR).toBe(false);
  });
});
