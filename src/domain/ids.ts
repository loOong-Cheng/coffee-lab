/** Collision-resistant local ids (no network, no server). */
export function createId(prefix: string): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  let core: string;
  if (c && typeof c.randomUUID === 'function') {
    core = c.randomUUID();
  } else {
    core = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`;
  }
  return `${prefix}_${core}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
