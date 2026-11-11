/**
 * /brands and /brands/:brandId — Coffee Brands (U6): brands a beginner will meet, used as hooks to learn
 * something real. Names only identify (no logos/brand art); every entry carries asOf, confidence and sources.
 */
import { useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { useDocumentTitle } from '../../app/useDocumentTitle';
import { audio } from '../../audio';
import { brands, type Brand } from '../../content';
import { useI18n } from '../../i18n';
import { Button, Chip, EmptyState, Illustration } from '../../ui';
import { BrandDetail } from './BrandDetail';
import { KindBadge } from './KindBadge';
import { filterBrands, groupByKind, isBrandKind, KIND_ORDER, type BrandFilters } from './model';
import { KIND_TEXT, S } from './strings';
import './brands.css';

function readFilters(p: URLSearchParams): BrandFilters {
  const kind = p.get('kind');
  return { kind: isBrandKind(kind) ? kind : 'all', query: p.get('q') ?? '' };
}

function writeFilters(f: BrandFilters): Record<string, string> {
  const out: Record<string, string> = {};
  if (f.kind !== 'all') out.kind = f.kind;
  if (f.query) out.q = f.query;
  return out;
}

export default function BrandsPage() {
  const { brandId } = useParams();
  if (brandId) return <BrandDetail key={brandId} brandId={brandId} />;
  return <BrandsHome />;
}

function BrandsHome() {
  const { t } = useI18n();
  useDocumentTitle(S.title);
  const [params, setParams] = useSearchParams();
  const filters = readFilters(params);
  const results = useMemo(() => filterBrands(brands, filters), [filters.kind, filters.query]);
  const groups = groupByKind(results);
  const anyFilter = filters.kind !== 'all' || filters.query !== '';

  const set = (patch: Partial<BrandFilters>) => setParams(writeFilters({ ...filters, ...patch }), { replace: true });
  const clear = () => setParams({}, { replace: true });
  const choose = (kind: BrandFilters['kind']) => {
    audio.play('select');
    set({ kind });
  };

  return (
    <section className="br-page" aria-labelledby="page-title" data-testid="brands-page">
      <header className="br-head">
        <h1 id="page-title" className="br-title">
          {t(S.title)}
        </h1>
        <p className="br-lead">{t(S.lead(brands.length))}</p>
      </header>

      <form className="br-filters" role="search" aria-label={t(S.filters)} onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="br-q" className="cl-visually-hidden">
          {t(S.searchLabel)}
        </label>
        <input
          id="br-q"
          type="search"
          className="br-input"
          placeholder={t(S.search)}
          value={filters.query}
          onChange={(e) => set({ query: e.target.value })}
          autoComplete="off"
          data-testid="brands-search"
        />
        <fieldset className="br-fieldset">
          <legend className="cl-eyebrow">{t(S.kind)}</legend>
          <div className="br-chips">
            <Chip selected={filters.kind === 'all'} onChange={() => choose('all')} data-testid="brands-kind-all">
              {t(S.all)}
            </Chip>
            {KIND_ORDER.map((k) => (
              <Chip
                key={k}
                selected={filters.kind === k}
                icon={KIND_TEXT[k].icon}
                onChange={(sel) => choose(sel ? k : 'all')}
                data-testid={`brands-kind-${k}`}
              >
                {t(KIND_TEXT[k].group)}
              </Chip>
            ))}
          </div>
        </fieldset>
        <div className="br-filters__foot">
          <p className="br-small" role="status" data-testid="brands-count">
            {t(S.showing(results.length, brands.length))}
          </p>
          {anyFilter && (
            <Button variant="ghost" size="sm" icon="x" onClick={clear}>
              {t(S.reset)}
            </Button>
          )}
        </div>
      </form>

      {results.length === 0 ? (
        <EmptyState
          art={<Illustration name="cup" />}
          title={t(S.none)}
          action={
            <Button variant="secondary" onClick={clear}>
              {t(S.reset)}
            </Button>
          }
        >
          <p>{t(S.noneBody)}</p>
        </EmptyState>
      ) : (
        groups.map((g) => (
          <section key={g.kind} className="br-group" aria-labelledby={`br-g-${g.kind}`}>
            <h2 id={`br-g-${g.kind}`} className="br-h2">
              {t(KIND_TEXT[g.kind].group)} <span className="br-count">({g.brands.length})</span>
            </h2>
            <ul className="br-grid">
              {g.brands.map((b) => (
                <li key={b.id}>
                  <BrandCard brand={b} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </section>
  );
}

function BrandCard({ brand }: { brand: Brand }) {
  const { t } = useI18n();
  return (
    <article className="br-card" data-testid={`brand-card-${brand.id}`}>
      <KindBadge brand={brand} />
      <div className="br-card__body">
        <h3 className="br-card__title">
          <Link to={`/brands/${encodeURIComponent(brand.id)}`} className="br-card__link">
            {t(brand.name)}
          </Link>
        </h3>
        <p className="br-meta">
          {t(brand.country)}
          {brand.founded ? ` · ${t(S.founded(brand.founded))}` : ''}
        </p>
        <p className="br-card__known">{t(brand.knownFor)}</p>
      </div>
    </article>
  );
}
