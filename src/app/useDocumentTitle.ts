import { useEffect } from 'react';
import type { LocalizedText } from '../domain/contracts';
import { useI18n } from '../i18n';

const BRAND = 'Coffee Lab · 咖啡实验室';

/** Sets document.title to "<page> — Coffee Lab · 咖啡实验室" in the current locale. */
export function useDocumentTitle(title: LocalizedText | string | null | undefined): void {
  const { t } = useI18n();
  const text = typeof title === 'string' ? title : t(title);
  useEffect(() => {
    document.title = text ? `${text} — ${BRAND}` : BRAND;
  }, [text]);
}
