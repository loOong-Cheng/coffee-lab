import { Link } from 'react-router';
import { useI18n } from '../i18n';
import { S } from './strings';
import { useDocumentTitle } from './useDocumentTitle';

export default function NotFound() {
  const { t } = useI18n();
  useDocumentTitle(S.notFoundTitle);
  return (
    <section className="shell-page" aria-labelledby="nf-title">
      <h1 id="nf-title">{t(S.notFoundTitle)}</h1>
      <p>{t(S.notFoundBody)}</p>
      <p>
        <Link to="/">{t(S.notFoundHome)}</Link>
      </p>
    </section>
  );
}
