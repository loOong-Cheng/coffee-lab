// @vitest-environment node
/**
 * Exercises the real service-worker template (src/platform/sw/sw.template.js) with fake
 * `self` / `caches` / `fetch`, the same way the build plugin instantiates it.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import template from './sw.template.js?raw';

const SCOPE = 'https://coffee.example/app/';
const PREFIX = 'coffee-lab:/app/:';

type Handler = (event: Record<string, unknown>) => void;

/** Minimal Cache Storage fake that, like browsers, honours the response's Vary header unless ignoreVary is set. */
class FakeCaches {
  stores = new Map<string, Map<string, { req: Request; res: Response }>>();
  async open(name: string) {
    if (!this.stores.has(name)) this.stores.set(name, new Map());
    const store = this.stores.get(name)!;
    return {
      addAll: async (reqs: Request[]) => {
        // Like `vite preview` (cors middleware): responses carry `Vary: Origin`; the SW's own requests have no Origin.
        for (const r of reqs) store.set(r.url, { req: r, res: new Response(`precached ${r.url}`, { headers: { Vary: 'Origin' } }) });
      },
      put: async (req: Request, res: Response) => {
        store.set(req.url, { req, res });
      },
    };
  }
  async keys() {
    return [...this.stores.keys()];
  }
  async delete(name: string) {
    return this.stores.delete(name);
  }
  async match(input: Request | string, opts: { cacheName?: string; ignoreVary?: boolean } = {}) {
    const req = typeof input === 'string' ? new Request(input) : input;
    for (const [name, store] of this.stores) {
      if (opts.cacheName && name !== opts.cacheName) continue;
      const hit = store.get(req.url);
      if (!hit) continue;
      const vary = (hit.res.headers.get('vary') ?? '').split(',').map((h) => h.trim()).filter(Boolean);
      if (!opts.ignoreVary && vary.some((h) => hit.req.headers.get(h) !== req.headers.get(h))) continue;
      return hit.res.clone();
    }
    return undefined;
  }
}

function boot(precache = ['index.html', 'assets/index-abc.js', 'manifest.webmanifest']) {
  const handlers: Record<string, Handler> = {};
  const caches = new FakeCaches();
  const fetchMock = vi.fn(async (req: Request) => new Response(`network ${req.url}`, { status: 200 }));
  const self = {
    registration: { scope: SCOPE },
    clients: { claim: vi.fn(async () => undefined) },
    skipWaiting: vi.fn(),
    addEventListener: (type: string, h: Handler) => {
      handlers[type] = h;
    },
  };
  const src = template
    .replace('__CL_VERSION__', JSON.stringify('v2'))
    .replace('__CL_PRECACHE__', JSON.stringify(precache))
    .replace('__CL_RUNTIME_PREFIXES__', JSON.stringify(['assets/']));
  new Function('self', 'caches', 'fetch', src)(self, caches, fetchMock);
  return { handlers, caches, fetchMock, self };
}

async function dispatch(h: Handler, extra: Record<string, unknown>) {
  const waits: Promise<unknown>[] = [];
  let response: Promise<Response> | undefined;
  h({ ...extra, waitUntil: (p: Promise<unknown>) => waits.push(p), respondWith: (p: Promise<Response>) => (response = p) });
  await Promise.all(waits);
  return { response, waits };
}

/** Response objects in Node expose `type: 'default'`; the SW only runtime-caches same-origin 'basic' ones. */
function basic(body: string) {
  const r = new Response(body, { status: 200 });
  Object.defineProperty(r, 'type', { value: 'basic' });
  return r;
}

function req(url: string, { mode, ...init }: Omit<RequestInit, 'mode'> & { mode?: string } = {}) {
  const r = new Request(url, init);
  if (mode === 'navigate') Object.defineProperty(r, 'mode', { value: 'navigate' }); // not constructible in Node
  return r;
}

let sw: ReturnType<typeof boot>;
beforeEach(async () => {
  sw = boot();
  await dispatch(sw.handlers.install, {});
});

describe('service worker template', () => {
  it('install precaches every listed path, resolved against the scope, bypassing the HTTP cache', () => {
    const store = sw.caches.stores.get(`${PREFIX}precache:v2`)!;
    expect([...store.values()].every((e) => e.req.cache === 'reload')).toBe(true);
    expect([...store.keys()]).toEqual([`${SCOPE}index.html`, `${SCOPE}assets/index-abc.js`, `${SCOPE}manifest.webmanifest`]);
  });

  it('activate deletes older caches for this scope only, then claims clients', async () => {
    await sw.caches.open(`${PREFIX}precache:v1`);
    await sw.caches.open(`${PREFIX}runtime:v1`);
    await sw.caches.open(`${PREFIX}runtime:v2`);
    await sw.caches.open('coffee-lab:/other-app/:precache:v1');
    await sw.caches.open('someone-elses-cache');
    await dispatch(sw.handlers.activate, {});
    expect((await sw.caches.keys()).sort()).toEqual(
      [`${PREFIX}precache:v2`, `${PREFIX}runtime:v2`, 'coffee-lab:/other-app/:precache:v1', 'someone-elses-cache'].sort(),
    );
    expect(sw.self.clients.claim).toHaveBeenCalled();
  });

  it('never intercepts cross-origin, out-of-scope or non-GET requests', async () => {
    for (const r of [
      req('https://cdn.example/lib.js'),
      req('https://coffee.example/elsewhere/x.js'),
      req(`${SCOPE}assets/index-abc.js`, { method: 'POST', body: 'x' }),
    ]) {
      const { response } = await dispatch(sw.handlers.fetch, { request: r });
      expect(response).toBeUndefined();
    }
    expect(sw.fetchMock).not.toHaveBeenCalled();
  });

  it('navigations to the app root get the precached shell, even offline', async () => {
    sw.fetchMock.mockRejectedValue(new TypeError('offline'));
    for (const url of [SCOPE, `${SCOPE}index.html`, `${SCOPE}?xrtest`]) {
      const { response } = await dispatch(sw.handlers.fetch, { request: req(url, { mode: 'navigate' }) });
      expect(await (await response!).text()).toBe(`precached ${SCOPE}index.html`);
    }
    const other = await dispatch(sw.handlers.fetch, { request: req(`${SCOPE}sw.js`, { mode: 'navigate' }) });
    expect(other.response).toBeUndefined();
  });

  it('serves precached assets from cache without touching the network (even with Vary: Origin)', async () => {
    // A crossorigin <script type="module"> request carries an Origin header the precache request did not have.
    const request = req(`${SCOPE}assets/index-abc.js`, { headers: { Origin: 'https://coffee.example' } });
    const { response } = await dispatch(sw.handlers.fetch, { request });
    expect(await (await response!).text()).toBe(`precached ${SCOPE}assets/index-abc.js`);
    expect(sw.fetchMock).not.toHaveBeenCalled();
  });

  it('runtime-caches un-precached hashed assets (Babylon chunks) on first use, then serves them offline', async () => {
    const url = `${SCOPE}assets/CoffeeLabScene-xyz.js`;
    sw.fetchMock.mockImplementationOnce(async () => basic('babylon code'));
    const first = await dispatch(sw.handlers.fetch, { request: req(url) });
    expect(await (await first.response!).text()).toBe('babylon code');
    await Promise.all(first.waits);
    expect(sw.caches.stores.get(`${PREFIX}runtime:v2`)?.has(url)).toBe(true);

    sw.fetchMock.mockRejectedValue(new TypeError('offline'));
    const second = await dispatch(sw.handlers.fetch, { request: req(url) });
    expect(await (await second.response!).text()).toBe('babylon code');
  });

  it('does not runtime-cache files outside assets/, sourcemaps, or failed responses; offline misses reject', async () => {
    sw.fetchMock.mockImplementation(async (r: Request) => (r.url.includes('missing') ? new Response('', { status: 404 }) : basic('x')));
    for (const url of [`${SCOPE}random.txt`, `${SCOPE}assets/a.js.map`, `${SCOPE}assets/missing.js`]) {
      const { response, waits } = await dispatch(sw.handlers.fetch, { request: req(url) });
      await response;
      await Promise.all(waits);
    }
    expect(sw.caches.stores.get(`${PREFIX}runtime:v2`)).toBeUndefined();

    sw.fetchMock.mockRejectedValue(new TypeError('offline'));
    const { response } = await dispatch(sw.handlers.fetch, { request: req(`${SCOPE}assets/never-seen.js`) });
    await expect(response).rejects.toThrow('offline');
  });

  it('SKIP_WAITING message activates a waiting update', async () => {
    await dispatch(sw.handlers.message, { data: { type: 'SKIP_WAITING' } });
    expect(sw.self.skipWaiting).toHaveBeenCalled();
    await dispatch(sw.handlers.message, { data: 'other' });
    expect(sw.self.skipWaiting).toHaveBeenCalledTimes(1);
  });
});
