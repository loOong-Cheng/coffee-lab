/** /brands/:brandId — one brand: known for, signature items, what a beginner can learn, menu decoder, safety, links, sources. */
import { Link } from 'react-router';
import { useDocumentTitle } from '../../app/useDocumentTitle';
import { BRAND_DISCLAIMER, getBrand, getDrink, getEquipment, getLesson, getSource } from '../../content';
import { useI18n } from '../../i18n';
import { Callout, EmptyState, Icon, Illustration, Tag } from '../../ui';
import { CONFIDENCE_TEXT } from '../atlas/text';
import { KindBadge } from './KindBadge';
import { KIND_TEXT, S } from './strings';

const present = <T,>(x: T | undefined): x is T => x !== undefined;
const CJK = /[぀-ヿ一-鿿]/;

export function BrandDetail({ brandId }: { brandId: string }) {
  const { t, locale } = useI18n();
  const brand = getBrand(brandId);
  useDocumentTitle(brand ? brand.name : S.notFound);

  if (!brand) {
    return (
      <section className="br-page" aria-labelledby="page-title" data-testid="brand-not-found">
        <h1 id="page-title" className="cl-visually-hidden">
          {t(S.notFound)}
        </h1>
        <EmptyState
          art={<Illustration name="cup" />}
          title={t(S.notFound)}
          action={
            <Link className="cl-btn cl-btn--primary cl-btn--md" to="/brands">
              {t(S.back)}
            </Link>
          }
        >
          <p>{t(S.notFoundBody)}</p>
        </EmptyState>
      </section>
    );
  }

  const drinks = brand.relatedDrinkIds.map(getDrink).filter(present);
  const lessons = brand.relatedLessonIds.map(getLesson).filter(present);
  const gear = brand.relatedEquipmentIds.map(getEquipment).filter(present);
  const sources = brand.sources.map(getSource).filter(present);

  return (
    <article className="br-detail" aria-labelledby="page-title" data-testid="brand-detail">
      <Link to="/brands" className="br-back">
        {t(S.back)}
      </Link>

      <header className="br-hero">
        <KindBadge brand={brand} size={32} />
        <div className="br-hero__body">
          <p className="cl-eyebrow">{t(KIND_TEXT[brand.kind].one)}</p>
          <h1 id="page-title" className="br-title">
            {t(brand.name)}
          </h1>
          <p className="br-meta">
            {t(brand.country)}
            {brand.founded ? ` · ${t(S.founded(brand.founded))}` : ''}
          </p>
          <div className="br-tags">
            <Tag tone="info">{t(CONFIDENCE_TEXT[brand.confidence])}</Tag>
            <Tag icon="clock" data-testid="brand-asof">
              {t(S.checked(brand.asOf))}
            </Tag>
          </div>
        </div>
      </header>

      <section className="br-section" aria-labelledby="br-known-h">
        <h2 id="br-known-h" className="br-h2">
          {t(S.knownForH)}
        </h2>
        <p>{t(brand.knownFor)}</p>
      </section>

      {brand.signature.length > 0 && (
        <section className="br-section" aria-labelledby="br-sig-h">
          <h2 id="br-sig-h" className="br-h2">
            {t(S.signatureH)}
          </h2>
          <ul className="br-list">
            {brand.signature.map((s, i) => (
              <li key={i}>{t(s)}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="br-section" aria-labelledby="br-learn-h" data-testid="brand-learn">
        <h2 id="br-learn-h" className="br-h2">
          {t(S.learnH)}
        </h2>
        <Callout kind="tip" locale={locale}>
          {t(brand.learnFromIt)}
        </Callout>
      </section>

      {brand.menuDecoder && brand.menuDecoder.length > 0 && (
        <section className="br-section" aria-labelledby="br-menu-h" data-testid="brand-menu">
          <h2 id="br-menu-h" className="br-h2">
            {t(S.menuH)}
          </h2>
          <ul className="br-list">
            {brand.menuDecoder.map((m, i) => (
              <li key={i}>{t(m)}</li>
            ))}
          </ul>
          <p className="br-small cl-muted">{t(S.menuNote)}</p>
        </section>
      )}

      {brand.safetyNote && (
        <div data-testid="brand-safety">
          <Callout kind="safety" locale={locale} title={t(S.safetyH)}>
            {t(brand.safetyNote)}
          </Callout>
        </div>
      )}

      {drinks.length > 0 && (
        <section className="br-section" aria-labelledby="br-drinks-h">
          <h2 id="br-drinks-h" className="br-h2">
            {t(S.drinksH)}
          </h2>
          <ul className="br-pills">
            {drinks.map((d) => (
              <li key={d.id}>
                <Link className="br-pill" to={`/atlas/${encodeURIComponent(d.id)}`} data-testid={`brand-drink-${d.id}`}>
                  <Icon name="cup" size={16} /> {t(d.name)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {lessons.length > 0 && (
        <section className="br-section" aria-labelledby="br-lessons-h">
          <h2 id="br-lessons-h" className="br-h2">
            {t(S.lessonsH)}
          </h2>
          <ul className="br-pills">
            {lessons.map((l) => (
              <li key={l.id}>
                <Link className="br-pill" to={`/learn/${encodeURIComponent(l.id)}`}>
                  <Icon name="book" size={16} /> {t(l.title)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {gear.length > 0 && (
        <section className="br-section" aria-labelledby="br-gear-h">
          <h2 id="br-gear-h" className="br-h2">
            {t(S.gearH)}
          </h2>
          <ul className="br-pills">
            {gear.map((g) => (
              <li key={g.id}>
                <span className="br-chip">{t(g.name)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {sources.length > 0 && (
        <details className="br-sources">
          <summary>{t(S.sourcesH)}</summary>
          <ul className="br-list">
            {sources.map((s) => {
              // Citation titles keep the source's own language; mark it for screen readers.
              const lang = CJK.test(s.title) ? 'zh' : 'en';
              return (
                <li key={s.id} data-testid="brand-source">
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noopener noreferrer" lang={lang}>
                      {s.title}
                    </a>
                  ) : (
                    <span lang={lang}>{s.title}</span>
                  )}
                  {/* SourceRef.note is English-only author text: shown in en, left out in zh (one language at a time). */}
                  {s.note && locale === 'en' ? <span className="cl-muted"> — {s.note}</span> : null}
                </li>
              );
            })}
          </ul>
        </details>
      )}

      <div data-testid="brand-disclaimer">
        <Callout kind="info" locale={locale} title={t(S.aboutH)}>
          {t(BRAND_DISCLAIMER)}
        </Callout>
      </div>
    </article>
  );
}
