/**
 * i18n API (CONTRACTS.md §4). The locale lives in learner prefs (persisted); UI strings are
 * colocated LocalizedText constants in each feature: `const S = { start: { zh: '开始', en: 'Start' } }` → t(S.start).
 */
import { useCallback, useMemo } from 'react';
import type { Locale, LocalizedText } from '../domain/contracts';
import { learnerActions, useLearner } from '../state';
import { translate } from './locale';

export { LOCALES, detectDefaultLocale, htmlLang, isLocale, otherLocale, translate } from './locale';

export interface I18n {
  locale: Locale;
  setLocale(l: Locale): void;
  t(text: LocalizedText | null | undefined): string;
}

const setLocale = (l: Locale) => learnerActions.updatePrefs({ locale: l });

export function useI18n(): I18n {
  const locale = useLearner((s) => s.prefs.locale);
  const t = useCallback((text: LocalizedText | null | undefined) => translate(text, locale), [locale]);
  return useMemo(() => ({ locale, setLocale, t }), [locale, t]);
}
