import { describe, expect, it } from 'vitest';
import { detectXrSupport } from '../platform';
import { detectWebGL, xrEntryState } from './entry';

describe('XR entry: capability fallback (headless — no headset involved)', () => {
  it('navigator.xr absent → no Enter VR, 3D + action list still offered', async () => {
    const support = await detectXrSupport({ navigator: {}, isSecureContext: true });
    const e = xrEntryState(support, true);
    expect(e).toMatchObject({ reason: 'no-webxr-api', canEnterVR: false, canPlay3D: true, canPlayActionList: true });
    expect(e.message.en).toMatch(/no WebXR/i);
    expect(e.message.zh.length).toBeGreaterThan(0);
  });

  it('isSessionSupported rejecting → handled as error, never throws', async () => {
    const navigator = { xr: { isSessionSupported: () => Promise.reject(new DOMException('blocked', 'SecurityError')) } };
    const support = await detectXrSupport({ navigator, isSecureContext: true });
    expect(xrEntryState(support, true)).toMatchObject({ reason: 'error', canEnterVR: false, canPlay3D: true });
  });

  it('isSessionSupported throwing synchronously or hanging is handled', async () => {
    const throwing = {
      xr: {
        isSessionSupported: () => {
          throw new Error('boom');
        },
      },
    };
    expect((await detectXrSupport({ navigator: throwing })).immersiveVR).toBe(false);
    const hanging = { xr: { isSessionSupported: () => new Promise<boolean>(() => {}) } };
    const support = await detectXrSupport({ navigator: hanging, xrTimeoutMs: 20 });
    expect(xrEntryState(support, true)).toMatchObject({ reason: 'timeout', canEnterVR: false });
  });

  it('insecure context explains HTTPS; immersive-vr false → not supported', async () => {
    expect(xrEntryState(await detectXrSupport({ navigator: {}, isSecureContext: false }), true).message.en).toMatch(/https/i);
    const no = { xr: { isSessionSupported: async () => false } };
    expect(xrEntryState(await detectXrSupport({ navigator: no }), true)).toMatchObject({ reason: 'not-supported', canEnterVR: false });
  });

  it('immersive-vr supported → Enter VR offered, labelled hardware-unverified', async () => {
    const yes = { xr: { isSessionSupported: async (m: string) => m === 'immersive-vr' } };
    const e = xrEntryState(await detectXrSupport({ navigator: yes }), true);
    expect(e).toMatchObject({ reason: 'supported', canEnterVR: true, canPlay3D: true });
    expect(e.message.en).toMatch(/hardware-unverified/i);
  });

  it('no WebGL → neither VR nor 3D, but the action list still completes the mission', async () => {
    const yes = { xr: { isSessionSupported: async () => true } };
    const e = xrEntryState(await detectXrSupport({ navigator: yes }), false);
    expect(e).toMatchObject({ canEnterVR: false, canPlay3D: false, canPlayActionList: true });
    expect(e.message.en).toMatch(/WebGL/);
  });

  it('while checking: no Enter VR yet', () => {
    expect(xrEntryState(null, true)).toMatchObject({ checking: true, canEnterVR: false, canPlay3D: true });
  });

  it('detectWebGL never throws', () => {
    const noGl = { createElement: () => ({ getContext: () => null }) } as unknown as Document;
    expect(detectWebGL(noGl)).toBe(false);
    const gl2 = { createElement: () => ({ getContext: (k: string) => (k === 'webgl2' ? { getExtension: () => null } : null) }) } as unknown as Document;
    expect(detectWebGL(gl2)).toBe(true);
    expect(detectWebGL(undefined)).toBe(false);
    expect(
      detectWebGL({
        createElement: () => {
          throw new Error('nope');
        },
      } as unknown as Document),
    ).toBe(false);
  });
});
