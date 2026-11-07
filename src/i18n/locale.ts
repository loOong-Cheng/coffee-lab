/** Pure locale helpers (no React, no state) — safe to import from anywhere, including src/state. */
import type { Locale, LocalizedText } from '../domain/contracts';

export const LOCALES: readonly Locale[] = ['zh', 'en'] as const;

export function isLocale(v: unknown): v is Locale {
  return v === 'zh' || v === 'en';
}

/** zh* → 'zh', anything else → 'en'. Uses the first preferred language. */
export function detectDefaultLocale(languages?: readonly (string | null | undefined)[]): Locale {
  let langs = languages;
  if (!langs) {
    const nav = (globalThis as { navigator?: Navigator }).navigator;
    langs = nav ? [...(nav.languages ?? []), nav.language] : [];
  }
  const first = langs.find((l): l is string => typeof l === 'string' && l.length > 0);
  return first && /^zh\b/i.test(first) ? 'zh' : 'en';
}

/** BCP-47 tag for <html lang> (zh → zh-CN so browsers pick Simplified-Chinese CJK fonts). */
export function htmlLang(locale: Locale): string {
  return locale === 'zh' ? 'zh-CN' : 'en';
}

/** Pick the locale's string; fall back to the other language rather than showing nothing. */
export function translate(text: LocalizedText | null | undefined, locale: Locale): string {
  if (!text) return '';
  const primary = text[locale];
  if (typeof primary === 'string' && primary.length > 0) return primary;
  const other = text[locale === 'zh' ? 'en' : 'zh'];
  return typeof other === 'string' ? other : '';
}

export function otherLocale(locale: Locale): Locale {
  return locale === 'zh' ? 'en' : 'zh';
}
