import { useI18n } from '../i18n';
import { S } from './strings';

/** Suspense fallback while a lazy route chunk loads. */
export function RouteFallback() {
  const { t } = useI18n();
  return (
    <div className="shell-loading" role="status" aria-live="polite">
      <span className="shell-loading__dot" aria-hidden="true" />
      {t(S.loading)}
    </div>
  );
}
