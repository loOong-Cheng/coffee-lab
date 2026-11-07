/** Platform API (CONTRACTS.md §5) + React hooks. */
import { useEffect, useMemo, useState } from 'react';
import type { CapabilityProfile } from '../domain/contracts';
import { useLearner } from '../state';
import { detectBasicCapabilities, detectXrSupport, type XrSupport } from './capabilities';

export {
  detectCapabilities,
  detectBasicCapabilities,
  detectXrSupport,
  suggestMode,
  isHeadsetUserAgent,
  isMobileUserAgent,
  browserEnv,
  type CapabilityEnv,
  type NavigatorLike,
  type XrSupport,
  type XrSupportReason,
} from './capabilities';
export {
  registerServiceWorker,
  unregisterServiceWorkers,
  applyUpdate,
  acknowledgeOfflineReady,
  usePwaStatus,
  getPwaStatus,
  subscribePwaStatus,
  type PwaStatus,
} from './pwa';

let capabilitiesPromise: Promise<CapabilityProfile> | null = null;
let capabilitiesCache: CapabilityProfile | null = null;
let xrPromise: Promise<XrSupport> | null = null;
let xrCache: XrSupport | null = null;

/** Memoised browser detection (runs once per page load). */
export function getCapabilities(): Promise<CapabilityProfile> {
  // Same result as detectCapabilities(), but shares the memoised WebXR probe with getXrSupport().
  capabilitiesPromise ??= getXrSupport().then((xr) => (capabilitiesCache = { ...detectBasicCapabilities(), xrImmersiveVR: xr.immersiveVR }));
  return capabilitiesPromise;
}

/** Memoised WebXR support check with a reason (for the XR route's fallback explanation). */
export function getXrSupport(): Promise<XrSupport> {
  xrPromise ??= detectXrSupport().then((x) => (xrCache = x));
  return xrPromise;
}

/** Test helper: forget memoised detection results. */
export function resetCapabilityCache(): void {
  capabilitiesPromise = null;
  capabilitiesCache = null;
  xrPromise = null;
  xrCache = null;
}

/**
 * Detected capabilities, or null while detection runs (first render). `physicalEquipment` is filled
 * from the learner's self-reported profile equipment.
 */
export function useCapabilities(): CapabilityProfile | null {
  const [caps, setCaps] = useState<CapabilityProfile | null>(capabilitiesCache);
  const equipment = useLearner((s) => s.profile?.equipment);
  useEffect(() => {
    let alive = true;
    if (!capabilitiesCache) {
      getCapabilities().then((c) => {
        if (alive) setCaps(c);
      });
    }
    return () => {
      alive = false;
    };
  }, []);
  return useMemo(() => (caps && equipment ? { ...caps, physicalEquipment: equipment } : caps), [caps, equipment]);
}

/** WebXR support + reason, or null while checking. */
export function useXrSupport(): XrSupport | null {
  const [xr, setXr] = useState<XrSupport | null>(xrCache);
  useEffect(() => {
    let alive = true;
    if (!xrCache) {
      getXrSupport().then((x) => {
        if (alive) setXr(x);
      });
    }
    return () => {
      alive = false;
    };
  }, []);
  return xr;
}
