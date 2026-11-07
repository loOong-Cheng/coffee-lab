import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyUpdate, getPwaStatus, registerServiceWorker, resetPwaForTests, unregisterServiceWorkers, type PwaEnv } from './pwa';

class FakeWorker extends EventTarget {
  posted: unknown[] = [];
  constructor(public state: string) {
    super();
  }
  postMessage(m: unknown) {
    this.posted.push(m);
  }
  setState(s: string) {
    this.state = s;
    this.dispatchEvent(new Event('statechange'));
  }
}

class FakeRegistration extends EventTarget {
  installing: FakeWorker | null = null;
  waiting: FakeWorker | null = null;
  active: FakeWorker | null = null;
  update = vi.fn(async () => undefined);
}

class FakeContainer extends EventTarget {
  controller: unknown = null;
  constructor(public reg: FakeRegistration) {
    super();
  }
  register = vi.fn(async () => this.reg);
}

function env(reg = new FakeRegistration(), extra: Partial<PwaEnv> = {}) {
  const container = new FakeContainer(reg);
  const reload = vi.fn();
  return { container, reload, env: { serviceWorker: container, isSecureContext: true, reload, ...extra } satisfies PwaEnv };
}

afterEach(() => resetPwaForTests());

describe('registerServiceWorker', () => {
  it('is a no-op without the API or outside a secure context (LAN http)', async () => {
    expect(await registerServiceWorker('./sw.js', {})).toBeNull();
    expect(getPwaStatus().supported).toBe(false);
    const { container, env: e } = env();
    expect(await registerServiceWorker('./sw.js', { ...e, isSecureContext: false })).toBeNull();
    expect(container.register).not.toHaveBeenCalled();
  });

  it('first install → offlineReady (+ offlineReadyNow), no reload when it starts controlling', async () => {
    const reg = new FakeRegistration();
    const { container, reload, env: e } = env(reg);
    await registerServiceWorker('./sw.js', e);
    expect(container.register).toHaveBeenCalledWith('./sw.js', { updateViaCache: 'none' });
    const worker = new FakeWorker('installing');
    reg.installing = worker;
    reg.dispatchEvent(new Event('updatefound'));
    worker.setState('installed');
    expect(getPwaStatus()).toMatchObject({ supported: true, offlineReady: true, offlineReadyNow: true, updateAvailable: false });
    container.dispatchEvent(new Event('controllerchange')); // clients.claim()
    expect(reload).not.toHaveBeenCalled();
  });

  it('returning visit with an active worker is offlineReady but not "now"', async () => {
    const reg = new FakeRegistration();
    reg.active = new FakeWorker('activated');
    await registerServiceWorker('./sw.js', env(reg).env);
    expect(getPwaStatus()).toMatchObject({ offlineReady: true, offlineReadyNow: false });
  });

  it('a new version waits; applyUpdate sends SKIP_WAITING and reloads once on controllerchange', async () => {
    const reg = new FakeRegistration();
    reg.active = new FakeWorker('activated');
    const { container, reload, env: e } = env(reg);
    container.controller = {};
    await registerServiceWorker('./sw.js', e);
    const next = new FakeWorker('installing');
    reg.installing = next;
    reg.dispatchEvent(new Event('updatefound'));
    next.setState('installed');
    reg.waiting = next;
    expect(getPwaStatus().updateAvailable).toBe(true);

    applyUpdate();
    expect(next.posted).toEqual([{ type: 'SKIP_WAITING' }]);
    container.dispatchEvent(new Event('controllerchange'));
    container.dispatchEvent(new Event('controllerchange'));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('reports registration errors instead of throwing', async () => {
    const { container, env: e } = env();
    container.register.mockRejectedValueOnce(new Error('SecurityError'));
    expect(await registerServiceWorker('./sw.js', e)).toBeNull();
    expect(getPwaStatus().error).toBe('SecurityError');
  });
});

describe('unregisterServiceWorkers', () => {
  it('unregisters everything and never throws', async () => {
    const unregister = vi.fn(async () => true);
    const container = Object.assign(new FakeContainer(new FakeRegistration()), {
      getRegistrations: async () => [{ unregister }, { unregister }],
    });
    expect(await unregisterServiceWorkers({ serviceWorker: container })).toBe(2);
    expect(unregister).toHaveBeenCalledTimes(2);
    expect(await unregisterServiceWorkers({})).toBe(0);
  });
});
