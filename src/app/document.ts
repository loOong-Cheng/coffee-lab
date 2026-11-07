/** Keeps <html> attributes in sync with learner prefs (lang, data-reduced-motion, data-theme). */
import type { Preferences } from '../domain/contracts';
import { htmlLang } from '../i18n/locale';

export type ThemePref = 'system' | 'light' | 'dark';

export function systemPrefersReducedMotion(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** Effective reduced-motion: explicit pref wins, 'system' follows the OS setting. */
export function effectiveReducedMotion(pref: Preferences['reducedMotion'], systemReduce = systemPrefersReducedMotion()): boolean {
  return pref === 'on' || (pref === 'system' && systemReduce);
}

/**
 * - lang: 'zh-CN' | 'en'
 * - data-reduced-motion: 'on' | 'off' (always the EFFECTIVE value)
 * - data-theme: only set for an explicit light/dark choice; absent → CSS follows prefers-color-scheme.
 */
export function applyDocumentAttributes(
  prefs: Pick<Preferences, 'locale' | 'reducedMotion'>,
  theme: ThemePref = 'system',
  root: HTMLElement | undefined = typeof document !== 'undefined' ? document.documentElement : undefined,
): void {
  if (!root) return;
  root.lang = htmlLang(prefs.locale);
  root.dataset.reducedMotion = effectiveReducedMotion(prefs.reducedMotion) ? 'on' : 'off';
  if (theme === 'light' || theme === 'dark') root.dataset.theme = theme;
  else delete root.dataset.theme;
}
