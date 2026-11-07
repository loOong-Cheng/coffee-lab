/**
 * Service-worker registration + update status (PWA). Production builds only — main.tsx calls
 * registerServiceWorker() when import.meta.env.PROD, and unregisterServiceWorkers() in dev.
 *
 * Service workers need a SECURE CONTEXT (HTTPS or localhost). Over plain-HTTP LAN testing
 * (`npm run preview:lan` opened on a phone) `supported` is false and the app simply runs online-only.
 *
 * UI wiring (lead): `usePwaStatus()` →
 *   - `offlineReadyNow`  → one-time toast "Ready to work offline" (first install in this page session)
 *   - `updateAvailable`  → "New version available" + button calling `applyUpdate()` (reloads once)
 */
import { useSyncExternalStore } from 'react';

export interface PwaStatus {
  /** Service workers usable here (API present + secure context). */
  supported: boolean;
  /** An active worker has precached the app: it works offline after this point. */
  offlineReady: boolean;
  /** offlineReady became true during THIS page session (first install) — show a one-time notice. */
  offlineReadyNow: boolean;
  /** A newer version is installed and waiting; call applyUpdate() to switch (reloads the page once). */
  updateAvailable: boolean;
  /** Registration error (message only), if any. */
  error: string | null;
}

interface WorkerLike extends EventTarget {
  state: string;
  postMessage(message: unknown): void;
}
interface RegistrationLike extends EventTarget {
  installing: WorkerLike | null;
  waiting: WorkerLike | null;
  active: WorkerLike | null;
  update(): Promise<unknown>;
}
interface ContainerLike extends EventTarget {
  controller: unknown;
  register(url: string, options?: RegistrationOptions): Promise<RegistrationLike>;
  getRegistrations?(): Promise<ReadonlyArray<{ unregister(): Promise<boolean> }>>;
}

export interface PwaEnv {
  serviceWorker?: ContainerLike;
  isSecureContext?: boolean;
  /** Called after applyUpdate() once the new worker takes control. Default: location.reload(). */
  reload?: () => void;
  /** Document whose visibility triggers periodic update checks. */
  document?: Pick<Document, 'visibilityState' | 'addEventListener'>;
}

const INITIAL: PwaStatus = { supported: false, offlineReady: false, offlineReadyNow: false, updateAvailable: false, error: null };
let status: PwaStatus = INITIAL;
const listeners = new Set<() => void>();
let registration: RegistrationLike | null = null;
let updateRequested = false;
let reloading = false;
let reloadFn: () => void = () => window.location.reload();

function set(patch: Partial<PwaStatus>) {
  const next = { ...status, ...patch };
  if (Object.keys(patch).every((k) => next[k as keyof PwaStatus] === status[k as keyof PwaStatus])) return;
  status = next;
  for (const l of [...listeners]) l();
}

function browserPwaEnv(): PwaEnv {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return {};
  return {
    serviceWorker: (navigator as Navigator & { serviceWorker?: ContainerLike }).serviceWorker,
    isSecureContext: window.isSecureContext,
    document: typeof document !== 'undefined' ? document : undefined,
  };
}

function watchWorker(worker: WorkerLike, container: ContainerLike) {
  const onState = () => {
    if (worker.state === 'installed') {
      if (container.controller) set({ updateAvailable: true });
      else set({ offlineReady: true, offlineReadyNow: true });
    } else if (worker.state === 'activated' && !status.offlineReady) {
      set({ offlineReady: true, offlineReadyNow: true });
    }
  };
  worker.addEventListener('statechange', onState);
  onState();
}

const UPDATE_CHECK_MS = 30 * 60 * 1000;

/** Registers ./sw.js (relative to the app, so sub-path hosting works). Never throws. */
export async function registerServiceWorker(url = './sw.js', env: PwaEnv = browserPwaEnv()): Promise<RegistrationLike | null> {
  const container = env.serviceWorker;
  if (!container || env.isSecureContext === false) {
    set({ supported: false });
    return null;
  }
  set({ supported: true });
  if (env.reload) reloadFn = env.reload;
  try {
    const reg = await container.register(url, { updateViaCache: 'none' });
    registration = reg;
    if (reg.active) set({ offlineReady: true });
    if (reg.waiting && container.controller) set({ updateAvailable: true });
    if (reg.installing) watchWorker(reg.installing, container);
    reg.addEventListener('updatefound', () => {
      if (reg.installing) watchWorker(reg.installing, container);
    });
    container.addEventListener('controllerchange', () => {
      // Only the update the learner asked for reloads; the first install just starts controlling quietly.
      if (!updateRequested || reloading) return;
      reloading = true;
      reloadFn();
    });
    // Check for a new version when the learner comes back to the tab (throttled).
    let lastCheck = Date.now();
    env.document?.addEventListener('visibilitychange', () => {
      if (env.document?.visibilityState !== 'visible' || Date.now() - lastCheck < UPDATE_CHECK_MS) return;
      lastCheck = Date.now();
      reg.update().catch(() => {});
    });
    return reg;
  } catch (e) {
    set({ error: e instanceof Error ? e.message : String(e) });
    return null;
  }
}

/** Activates the waiting version; the page reloads once the new worker takes control. */
export function applyUpdate(): void {
  updateRequested = true;
  const waiting = registration?.waiting;
  if (waiting) waiting.postMessage({ type: 'SKIP_WAITING' });
  else {
    reloading = true;
    reloadFn();
  }
}

/** Dev-only hygiene: remove a worker left on this origin by an earlier production preview. */
export async function unregisterServiceWorkers(env: PwaEnv = browserPwaEnv()): Promise<number> {
  try {
    const regs = (await env.serviceWorker?.getRegistrations?.()) ?? [];
    await Promise.all(regs.map((r) => r.unregister()));
    return regs.length;
  } catch {
    return 0;
  }
}

/** Clears the one-time offlineReadyNow flag after the UI has shown its notice. */
export function acknowledgeOfflineReady(): void {
  set({ offlineReadyNow: false });
}

export function getPwaStatus(): PwaStatus {
  return status;
}

export function subscribePwaStatus(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function usePwaStatus(): PwaStatus & { applyUpdate: () => void; acknowledgeOfflineReady: () => void } {
  const s = useSyncExternalStore(subscribePwaStatus, getPwaStatus, getPwaStatus);
  return { ...s, applyUpdate, acknowledgeOfflineReady };
}

/** Test helper. */
export function resetPwaForTests(): void {
  status = INITIAL;
  registration = null;
  updateRequested = false;
  reloading = false;
  reloadFn = () => window.location.reload();
  for (const l of [...listeners]) l();
}
