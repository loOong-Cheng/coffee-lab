import { useEffect } from 'react';
import type { LocalizedText } from '../domain/contracts';
import { useI18n } from '../i18n';
import { S } from './strings';

/** Sets document.title to "<page> — <brand>" in the current locale only (one language at a time). */
export function useDocumentTitle(title: LocalizedText | string | null | undefined): void {
  const { t } = useI18n();
  const text = typeof title === 'string' ? title : t(title);
  const brand = t(S.brand);
  useEffect(() => {
    document.title = text ? `${text} — ${brand}` : brand;
  }, [text, brand]);
}
