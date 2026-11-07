/**
 * /atlas and /atlas/:drinkId — the Drink Atlas: every coffee type with its origin and culture,
 * an illustrative recipe, steps, gear you own vs. need (self-reported profile), safety, related
 * lessons, and "Make it now" → kitchen mode (/practice/drink:<id>).
 */
import { useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { useDocumentTitle } from '../../app/useDocumentTitle';
import { audio } from '../../audio';
import type { DrinkCategory, DrinkRecipe } from '../../domain/contracts';
import { useI18n } from '../../i18n';
import { useLearner } from '../../state';
import { Button, Chip, EmptyState, Illustration, SegmentedControl, Tag } from '../../ui';
import { drinks } from '../practice/catalog';
import { drinkIllustration } from './art';
import { DrinkDetail } from './DrinkDetail';
import {
  CATEGORY_ORDER,
  featuredIndex,
  filterDrinks,
  gearStatus,
  groupByCategory,
  type AtlasFilters,
  type DifficultyFilter,
  type GearFilter,
} from './filters';
import { CATEGORY_TEXT, DIFFICULTY_TEXT } from './text';
import './atlas.css';

const S = {
  title: { zh: '咖啡饮品图鉴', en: 'Drink Atlas' },
  lead: (n: number, c: number) => ({
    zh: `${n} 款咖啡，来自 ${c} 个类别和世界各地的传统。每个配方都是示例起点，不是唯一正确答案。`,
    en: `${n} coffees across ${c} families and traditions from around the world. Every recipe is an illustrative starting point, not the one right answer.`,
  }),
  today: { zh: '今日咖啡故事', en: 'Today’s coffee story' },
  readMore: { zh: '了解这款饮品', en: 'Explore this drink' },
  filters: { zh: '筛选饮品', en: 'Filter drinks' },
  search: { zh: '搜索名称、产地……', en: 'Search name, origin…' },
  searchLabel: { zh: '搜索', en: 'Search' },
  category: { zh: '类别', en: 'Category' },
  allCats: { zh: '全部', en: 'All' },
  gear: { zh: '器具', en: 'Gear' },
  gearAll: { zh: '全部', en: 'All' },
  gearCan: { zh: '我的器具就能做', en: 'Can make with my gear' },
  gearNeed: { zh: '需要新器具', en: 'Needs new gear' },
  gearNoProfile: { zh: '告诉我们你有哪些器具，就能按“能不能做”筛选。', en: 'Tell us your gear to filter by what you can make.' },
  setup: { zh: '设置我的器具', en: 'Set up my gear' },
  difficulty: { zh: '难度', en: 'Difficulty' },
  any: { zh: '不限', en: 'Any' },
  reset: { zh: '清除筛选', en: 'Clear filters' },
  showing: (n: number, m: number) => ({ zh: `显示 ${n} / ${m} 款`, en: `Showing ${n} of ${m} drinks` }),
  none: { zh: '没有符合条件的饮品', en: 'No drinks match these filters' },
  noneBody: { zh: '试试放宽一个条件。', en: 'Try loosening one filter.' },
  canMake: { zh: '器具齐了', en: 'You have the gear' },
  needs: (n: number) => ({ zh: `还缺 ${n} 件`, en: `Needs ${n} more` }),
};

const isCategory = (v: string | null): v is DrinkCategory => !!v && (CATEGORY_ORDER as readonly string[]).includes(v);

function readFilters(p: URLSearchParams): AtlasFilters {
  const cat = p.get('cat');
  const gear = p.get('gear');
  const diff = Number(p.get('diff'));
  return {
    category: isCategory(cat) ? cat : 'all',
    gear: gear === 'can-make' || gear === 'need-gear' ? gear : 'all',
    difficulty: diff === 1 || diff === 2 || diff === 3 ? diff : 'all',
    query: p.get('q') ?? '',
  };
}

function writeFilters(f: AtlasFilters): Record<string, string> {
  const out: Record<string, string> = {};
  if (f.category !== 'all') out.cat = f.category;
  if (f.gear !== 'all') out.gear = f.gear;
  if (f.difficulty !== 'all') out.diff = String(f.difficulty);
  if (f.query) out.q = f.query;
  return out;
}

export default function AtlasPage() {
  const { drinkId } = useParams();
  if (drinkId) return <DrinkDetail key={drinkId} drinkId={drinkId} />;
  return <AtlasHome />;
}

function AtlasHome() {
  const { t } = useI18n();
  useDocumentTitle(S.title);
  const [params, setParams] = useSearchParams();
  const filters = readFilters(params);
  const owned = useLearner((s) => s.profile?.equipment ?? null);
  const hasProfile = owned !== null;
  const effective: AtlasFilters = hasProfile ? filters : { ...filters, gear: 'all' };
  const results = useMemo(() => filterDrinks(drinks, effective, owned ?? []), [effective.category, effective.gear, effective.difficulty, effective.query, owned]);
  const groups = groupByCategory(results);
  const featured = drinks[featuredIndex(drinks.length, new Date())];
  const anyFilter = JSON.stringify(writeFilters(filters)) !== '{}';

  const set = (patch: Partial<AtlasFilters>) => {
    setParams(writeFilters({ ...filters, ...patch }), { replace: true });
  };
  const choose = (patch: Partial<AtlasFilters>) => {
    audio.play('select');
    set(patch);
  };

  const categoryCount = new Set(drinks.map((d) => d.category)).size;

  return (
    <section className="at-page" aria-labelledby="page-title">
      <header className="at-head">
        <h1 id="page-title" className="at-title">
          {t(S.title)}
        </h1>
        <p className="at-lead">{t(S.lead(drinks.length, categoryCount))}</p>
      </header>

      {featured && !anyFilter && (
        <article className="at-featured" aria-labelledby="at-featured-h">
          <div className="at-featured__art">
            <Illustration name={drinkIllustration(featured)} />
          </div>
          <div className="at-featured__body">
            <p className="cl-eyebrow">{t(S.today)}</p>
            <h2 id="at-featured-h" className="at-h2">
              {t(featured.name)}
            </h2>
            <p className="at-featured__origin">{t(featured.origin)}</p>
            <p className="at-featured__note">{t(featured.cultureNote)}</p>
            <Link className="cl-btn cl-btn--secondary cl-btn--md" to={`/atlas/${encodeURIComponent(featured.id)}`}>
              {t(S.readMore)}
            </Link>
          </div>
        </article>
      )}

      <form className="at-filters" role="search" aria-label={t(S.filters)} onSubmit={(e) => e.preventDefault()}>
        <div className="at-filters__search">
          <label htmlFor="at-q" className="cl-visually-hidden">
            {t(S.searchLabel)}
          </label>
          <input
            id="at-q"
            type="search"
            className="at-input"
            placeholder={t(S.search)}
            value={filters.query}
            onChange={(e) => set({ query: e.target.value })}
            autoComplete="off"
            data-testid="atlas-search"
          />
        </div>

        <fieldset className="at-fieldset">
          <legend className="cl-eyebrow">{t(S.category)}</legend>
          <div className="at-chips">
            <Chip selected={filters.category === 'all'} onChange={() => choose({ category: 'all' })}>
              {t(S.allCats)}
            </Chip>
            {CATEGORY_ORDER.map((c) => (
              <Chip key={c} selected={filters.category === c} onChange={(sel) => choose({ category: sel ? c : 'all' })} data-testid={`atlas-cat-${c}`}>
                {t(CATEGORY_TEXT[c].label)}
              </Chip>
            ))}
          </div>
        </fieldset>

        <div className="at-filters__row">
          <div className="at-fieldset">
            <span className="cl-eyebrow" id="at-gear-l">
              {t(S.gear)}
            </span>
            <SegmentedControl<GearFilter>
              labelledBy="at-gear-l"
              value={effective.gear}
              onChange={(g) => choose({ gear: g })}
              options={[
                { value: 'all', label: t(S.gearAll) },
                { value: 'can-make', label: t(S.gearCan), disabled: !hasProfile },
                { value: 'need-gear', label: t(S.gearNeed), disabled: !hasProfile },
              ]}
              id="at-gear"
            />
            {!hasProfile && (
              <p className="at-small">
                {t(S.gearNoProfile)} <Link to="/onboarding?edit=1">{t(S.setup)}</Link>
              </p>
            )}
          </div>
          <div className="at-fieldset">
            <span className="cl-eyebrow" id="at-diff-l">
              {t(S.difficulty)}
            </span>
            <SegmentedControl<string>
              labelledBy="at-diff-l"
              value={String(filters.difficulty)}
              onChange={(v) => choose({ difficulty: v === 'all' ? 'all' : (Number(v) as DifficultyFilter) })}
              options={[
                { value: 'all', label: t(S.any) },
                { value: '1', label: t(DIFFICULTY_TEXT[1]) },
                { value: '2', label: t(DIFFICULTY_TEXT[2]) },
                { value: '3', label: t(DIFFICULTY_TEXT[3]) },
              ]}
              id="at-diff"
            />
          </div>
        </div>
        <div className="at-filters__foot">
          <p className="at-small" role="status" data-testid="atlas-count">
            {t(S.showing(results.length, drinks.length))}
          </p>
          {anyFilter && (
            <Button variant="ghost" size="sm" icon="x" onClick={() => setParams({}, { replace: true })}>
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
            <Button variant="secondary" onClick={() => setParams({}, { replace: true })}>
              {t(S.reset)}
            </Button>
          }
        >
          <p>{t(S.noneBody)}</p>
        </EmptyState>
      ) : (
        groups.map((g) => (
          <section key={g.category} className="at-group" aria-labelledby={`at-g-${g.category}`}>
            <header className="at-group__head">
              <h2 id={`at-g-${g.category}`} className="at-h2">
                {t(CATEGORY_TEXT[g.category].label)} <span className="at-group__count">({g.drinks.length})</span>
              </h2>
              <p className="at-small cl-muted">{t(CATEGORY_TEXT[g.category].blurb)}</p>
            </header>
            <ul className="at-grid">
              {g.drinks.map((d) => (
                <li key={d.id}>
                  <DrinkCard drink={d} owned={owned} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </section>
  );
}

function DrinkCard({ drink, owned }: { drink: DrinkRecipe; owned: string[] | null }) {
  const { t } = useI18n();
  const gs = owned ? gearStatus(drink.equipment, owned) : null;
  return (
    <article className="at-card" data-testid={`drink-card-${drink.id}`}>
      <div className="at-card__art" aria-hidden="true">
        <Illustration name={drinkIllustration(drink)} />
      </div>
      <div className="at-card__body">
        <h3 className="at-card__title">
          <Link to={`/atlas/${encodeURIComponent(drink.id)}`} className="at-card__link">
            {t(drink.name)}
          </Link>
        </h3>
        <p className="at-card__tagline">{t(drink.tagline)}</p>
        <div className="at-card__tags">
          <Tag>{t(DIFFICULTY_TEXT[drink.difficulty])}</Tag>
          {gs && (
            <Tag tone={gs.canMake ? 'success' : 'warning'} icon={gs.canMake ? 'check' : 'plus'}>
              {gs.canMake ? t(S.canMake) : t(S.needs(gs.missing.length))}
            </Tag>
          )}
        </div>
      </div>
    </article>
  );
}
