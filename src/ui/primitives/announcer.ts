/**
 * Screen-reader announcer. Framework-agnostic: two visually hidden live regions are
 * created lazily in document.body, so `announce()` works from anywhere (activities,
 * XR fallback, audio-free feedback) with or without a React provider.
 */
export type Politeness = 'polite' | 'assertive';

const regions: Partial<Record<Politeness, HTMLElement>> = {};
const timers: Partial<Record<Politeness, ReturnType<typeof setTimeout>>> = {};

function ensureRegion(p: Politeness): HTMLElement | null {
  if (typeof document === 'undefined' || !document.body) return null;
  const existing = regions[p];
  if (existing && existing.isConnected) return existing;
  const el = document.createElement('div');
  el.setAttribute('data-cl-announcer', p);
  el.setAttribute('aria-live', p);
  el.setAttribute('aria-atomic', 'true');
  el.setAttribute('role', p === 'assertive' ? 'alert' : 'status');
  el.className = 'cl-visually-hidden';
  // Inline fallback in case base.css is not loaded (tests, embeds).
  el.style.cssText =
    'position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;';
  document.body.appendChild(el);
  regions[p] = el;
  return el;
}

/** Announce a message. Clearing first makes repeated identical messages re-announce. */
export function announce(message: string, politeness: Politeness = 'polite'): void {
  const el = ensureRegion(politeness);
  if (!el || !message) return;
  el.textContent = '';
  const t = timers[politeness];
  if (t) clearTimeout(t);
  timers[politeness] = setTimeout(() => {
    el.textContent = message;
  }, 40);
}

/** Test helper: current text of a live region. */
export function getAnnouncerText(politeness: Politeness = 'polite'): string {
  return regions[politeness]?.textContent ?? '';
}
