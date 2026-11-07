import type { ReactNode } from 'react';
import type { LocalizedText } from '../domain/contracts';
import { useI18n } from '../i18n';
import { useDocumentTitle } from './useDocumentTitle';

const BADGE: LocalizedText = { zh: '临时占位页 · 第二阶段替换', en: 'Temporary placeholder · replaced in Phase 2' };

/**
 * TEMPORARY frame for placeholder route modules (src/features/*). Delete once every feature
 * ships its real page. Never presents itself as a finished feature.
 */
export function Placeholder({ title, children }: { title: LocalizedText; children?: ReactNode }) {
  const { t } = useI18n();
  useDocumentTitle(title);
  return (
    <section className="shell-page" aria-labelledby="page-title" data-placeholder="true">
      <h1 id="page-title">{t(title)}</h1>
      <p className="shell-placeholder-badge">{t(BADGE)}</p>
      {children}
    </section>
  );
}
