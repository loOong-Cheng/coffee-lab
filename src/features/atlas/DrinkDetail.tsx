/** /atlas/:drinkId — one drink: culture first, then recipe, steps, gear (owned vs. missing), safety, lessons, "Make it now". */
import { Link } from 'react-router';
import { useDocumentTitle } from '../../app/useDocumentTitle';
import { audio } from '../../audio';
import { getLesson, getSource } from '../../content';
import { formatBrewRatio } from '../../domain/brew';
import { useI18n } from '../../i18n';
import { learnerActions, useLearner } from '../../state';
import { Button, Callout, EmptyState, Illustration, Tag } from '../../ui';
import { drinkPracticeId, brewKindForDrink } from '../practice/plan';
import { equipmentName, getDrink } from '../practice/catalog';
import { DrinkBrands } from '../brands/DrinkBrands';
import { drinkIllustration } from './art';
import { gearStatus, mentionsLegend } from './filters';
import { CATEGORY_TEXT, CONFIDENCE_TEXT, DIFFICULTY_TEXT } from './text';

const S = {
  back: { zh: '← 全部饮品', en: '← All drinks' },
  notFound: { zh: '图鉴里没有这款饮品', en: 'That drink isn’t in the Atlas' },
  notFoundBody: { zh: '链接可能有误。看看完整的图鉴吧。', en: 'The link may be wrong. Have a look at the full Atlas.' },
  make: { zh: '现在就做（厨房模式）', en: 'Make it now (kitchen mode)' },
  makeNote: { zh: '一步一步跟着做，每一步由你自己确认。', en: 'Step by step on your phone; you confirm each step yourself.' },
  makeMissing: (list: string) => ({ zh: `你的器具里还没有：${list}。仍然可以先看一遍步骤，或者用替代品。`, en: `Not in your setup yet: ${list}. You can still read through the steps or use a substitute.` }),
  originH: { zh: '起源与文化', en: 'Origin & culture' },
  origin: { zh: '起源', en: 'Origin' },
  legend: { zh: '含有传说或有争议的说法', en: 'Includes a legend or disputed story' },
  legendNote: { zh: '咖啡史里有很多好故事，但不是每个都能被证实——我们会标出来。', en: 'Coffee history is full of good stories; not all of them can be verified — we flag those.' },
  recipeH: { zh: '示例配方', en: 'Illustrative recipe' },
  recipeNote: { zh: '这是一个起点，不是“正确答案”。同一个名字在不同咖啡馆、地区和年代可能指不同的饮品。', en: 'A starting point, not “the correct” recipe. The same name can mean different drinks in different cafés, regions and eras.' },
  dose: { zh: '咖啡粉', en: 'Coffee' },
  out: { zh: '出液', en: 'Out' },
  water: { zh: '水', en: 'Water' },
  milk: { zh: '牛奶', en: 'Milk' },
  ratio: { zh: '比例', en: 'Ratio' },
  temp: { zh: '水温', en: 'Water' },
  timeL: { zh: '时间', en: 'Time' },
  stepsH: { zh: '步骤', en: 'Steps' },
  gearH: { zh: '需要的器具', en: 'Gear' },
  own: { zh: '你有', en: 'You have it' },
  covered: (x: string) => ({ zh: `由你的${x}覆盖`, en: `Covered by your ${x}` }),
  basic: { zh: '家用常备', en: 'Household basic' },
  missing: { zh: '还没有', en: 'Not yet' },
  iHave: { zh: '我有这个', en: 'I have this' },
  wish: { zh: '加入心愿单', en: 'Add to wishlist' },
  wished: { zh: '在心愿单里', en: 'On wishlist' },
  unwish: { zh: '从心愿单移除', en: 'Remove from wishlist' },
  noProfile: { zh: '告诉我们你有哪些器具，就能看到哪些已经齐了。', en: 'Tell us your gear to see what you already have.' },
  setup: { zh: '设置我的器具', en: 'Set up my gear' },
  safetyH: { zh: '安全', en: 'Safety' },
  lessonsH: { zh: '相关课程', en: 'Related lessons' },
  sourcesH: { zh: '资料来源', en: 'Sources' },
  journal: (n: number) => ({ zh: `你已经记录过 ${n} 杯`, en: `You’ve logged this ${n} time${n === 1 ? '' : 's'}` }),
  seeLogs: { zh: '查看记录', en: 'See my cups' },
};

export function DrinkDetail({ drinkId }: { drinkId: string }) {
  const { t, locale } = useI18n();
  const drink = getDrink(drinkId);
  const profile = useLearner((s) => s.profile);
  const logged = useLearner((s) => s.journal.filter((e) => e.drinkId === drinkId).length);
  useDocumentTitle(drink ? drink.name : S.notFound);

  if (!drink) {
    return (
      <section className="at-page" aria-labelledby="page-title">
        <h1 id="page-title" className="cl-visually-hidden">
          {t(S.notFound)}
        </h1>
        <EmptyState
          art={<Illustration name="world-map" />}
          title={t(S.notFound)}
          action={
            <Link className="cl-btn cl-btn--primary cl-btn--md" to="/atlas">
              {t(S.back)}
            </Link>
          }
        >
          <p>{t(S.notFoundBody)}</p>
        </EmptyState>
      </section>
    );
  }

  const owned = profile?.equipment ?? null;
  const gs = gearStatus(drink.equipment, owned ?? []);
  const legend = mentionsLegend(drink.origin) || mentionsLegend(drink.cultureNote);
  const r = drink.recipe;
  const outWord = brewKindForDrink(drink) === 'espresso' ? S.out : S.water;
  const lessons = drink.relatedLessonIds.map((id) => getLesson(id)).filter((l) => !!l);
  const sources = drink.sources.map((id) => getSource(id)).filter((s) => !!s);

  const toggleWish = (id: string) => {
    if (!profile) return;
    const on = profile.wishlist.includes(id);
    learnerActions.setProfile({ ...profile, wishlist: on ? profile.wishlist.filter((x) => x !== id) : [...profile.wishlist, id] });
    audio.play('select');
  };
  const markOwned = (id: string) => {
    if (!profile) return;
    learnerActions.setProfile({
      ...profile,
      equipment: profile.equipment.includes(id) ? profile.equipment : [...profile.equipment, id],
      wishlist: profile.wishlist.filter((x) => x !== id),
    });
    audio.play('correct');
  };

  return (
    <article className="at-detail" aria-labelledby="page-title" data-testid="drink-detail">
      <Link to="/atlas" className="at-back">
        {t(S.back)}
      </Link>

      <header className="at-hero">
        <div className="at-hero__art">
          <Illustration name={drinkIllustration(drink)} alt={t(drink.name)} />
        </div>
        <div className="at-hero__body">
          <p className="cl-eyebrow">{t(CATEGORY_TEXT[drink.category].label)}</p>
          <h1 id="page-title" className="at-title">
            {t(drink.name)}
          </h1>
          <p className="at-lead">{t(drink.tagline)}</p>
          <div className="at-card__tags">
            <Tag>{t(DIFFICULTY_TEXT[drink.difficulty])}</Tag>
            <Tag tone="info">{t(CONFIDENCE_TEXT[drink.confidence])}</Tag>
            {owned && (
              <Tag tone={gs.canMake ? 'success' : 'warning'} icon={gs.canMake ? 'check' : 'plus'}>
                {gs.canMake ? t({ zh: '器具齐了', en: 'You have the gear' }) : t({ zh: `还缺 ${gs.missing.length} 件`, en: `Needs ${gs.missing.length} more` })}
              </Tag>
            )}
          </div>
          <div className="at-make">
            <Link className="cl-btn cl-btn--primary cl-btn--lg" to={`/practice/${encodeURIComponent(drinkPracticeId(drink.id))}`} data-testid="make-it">
              {t(S.make)}
            </Link>
            <p className="at-small cl-muted">{t(S.makeNote)}</p>
            {owned && gs.missing.length > 0 && <p className="at-small">{t(S.makeMissing(gs.missing.map((id) => t(equipmentName(id))).join(locale === 'zh' ? '、' : ', ')))}</p>}
            {logged > 0 && (
              <p className="at-small">
                {t(S.journal(logged))} · <Link to={`/journal?drink=${encodeURIComponent(drink.id)}`}>{t(S.seeLogs)}</Link>
              </p>
            )}
          </div>
        </div>
      </header>

      <section className="at-section at-culture" aria-labelledby="at-origin-h">
        <h2 id="at-origin-h" className="at-h2">
          {t(S.originH)}
        </h2>
        <p className="at-origin">
          <strong>{t(S.origin)}:</strong> {t(drink.origin)}
        </p>
        <Callout kind="culture" locale={locale}>
          {t(drink.cultureNote)}
        </Callout>
        {legend && (
          <p className="at-small">
            <Tag tone="culture" icon="myth">
              {t(S.legend)}
            </Tag>{' '}
            {t(S.legendNote)}
          </p>
        )}
      </section>

      <section className="at-section" aria-labelledby="at-recipe-h">
        <h2 id="at-recipe-h" className="at-h2">
          {t(S.recipeH)}
        </h2>
        <p>{t(r.summary)}</p>
        {(r.doseG != null || r.outG != null || r.milkMl != null) && (
          <dl className="at-recipe">
            {r.doseG != null && (
              <div>
                <dt>{t(S.dose)}</dt>
                <dd className="cl-num">{r.doseG} g</dd>
              </div>
            )}
            {r.outG != null && (
              <div>
                <dt>{t(outWord)}</dt>
                <dd className="cl-num">{r.outG} g</dd>
              </div>
            )}
            {r.doseG != null && r.outG != null && (
              <div>
                <dt>{t(S.ratio)}</dt>
                <dd className="cl-num">{formatBrewRatio(r.doseG, r.outG)}</dd>
              </div>
            )}
            {r.milkMl != null && (
              <div>
                <dt>{t(S.milk)}</dt>
                <dd className="cl-num">{r.milkMl} ml</dd>
              </div>
            )}
          </dl>
        )}
        {r.waterTempNote && (
          <p className="at-small">
            <strong>{t(S.temp)}:</strong> {t(r.waterTempNote)}
          </p>
        )}
        {r.timeNote && (
          <p className="at-small">
            <strong>{t(S.timeL)}:</strong> {t(r.timeNote)}
          </p>
        )}
        <Callout kind="illustrative" locale={locale}>
          {t(S.recipeNote)}
        </Callout>
      </section>

      <section className="at-section" aria-labelledby="at-steps-h">
        <h2 id="at-steps-h" className="at-h2">
          {t(S.stepsH)}
        </h2>
        <ol className="at-steps">
          {drink.steps.map((s, i) => (
            <li key={i}>{t(s)}</li>
          ))}
        </ol>
      </section>

      <section className="at-section" aria-labelledby="at-gear-h">
        <h2 id="at-gear-h" className="at-h2">
          {t(S.gearH)}
        </h2>
        {!owned && (
          <p className="at-small">
            {t(S.noProfile)} <Link to="/onboarding?edit=1">{t(S.setup)}</Link>
          </p>
        )}
        <ul className="at-gear" data-testid="drink-gear">
          {gs.items.map((it) => {
            const name = t(equipmentName(it.id));
            const wished = !!profile?.wishlist.includes(it.id);
            return (
              <li key={it.id} className="at-gear__item" data-state={owned ? it.state : 'unknown'}>
                <span className="at-gear__name">{name}</span>
                {owned && (
                  <Tag tone={it.state === 'missing' ? 'warning' : it.state === 'basic' ? 'neutral' : 'success'} icon={it.state === 'missing' ? 'plus' : 'check'}>
                    {it.state === 'owned'
                      ? t(S.own)
                      : it.state === 'covered'
                        ? t(S.covered(t(equipmentName(it.coveredBy ?? ''))))
                        : it.state === 'basic'
                          ? t(S.basic)
                          : t(S.missing)}
                  </Tag>
                )}
                {profile && it.state === 'missing' && (
                  <span className="at-gear__actions">
                    <Button variant="ghost" size="sm" icon="check" onClick={() => markOwned(it.id)}>
                      {t(S.iHave)}
                      <span className="cl-visually-hidden">: {name}</span>
                    </Button>
                    <Button
                      variant={wished ? 'secondary' : 'ghost'}
                      size="sm"
                      icon={wished ? 'star' : 'plus'}
                      aria-pressed={wished}
                      onClick={() => toggleWish(it.id)}
                      title={wished ? t(S.unwish) : t(S.wish)}
                      data-testid={`wish-${it.id}`}
                    >
                      {wished ? t(S.wished) : t(S.wish)}
                      <span className="cl-visually-hidden">: {name}</span>
                    </Button>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {drink.safetyNotes.length > 0 && (
        <Callout kind="safety" locale={locale} title={t(S.safetyH)}>
          <ul className="at-list">
            {drink.safetyNotes.map((n, i) => (
              <li key={i}>{t(n)}</li>
            ))}
          </ul>
        </Callout>
      )}

      {lessons.length > 0 && (
        <section className="at-section" aria-labelledby="at-lessons-h">
          <h2 id="at-lessons-h" className="at-h2">
            {t(S.lessonsH)}
          </h2>
          <ul className="at-links">
            {lessons.map((l) => (
              <li key={l!.id}>
                <Link to={`/learn/${encodeURIComponent(l!.id)}`}>{t(l!.title)}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <DrinkBrands drinkId={drink.id} />

      {sources.length > 0 && (
        <details className="at-sources">
          <summary>{t(S.sourcesH)}</summary>
          <ul className="at-links">
            {sources.map((s) => (
              <li key={s!.id}>
                {s!.url ? (
                  <a href={s!.url} target="_blank" rel="noopener noreferrer">
                    {s!.title}
                  </a>
                ) : (
                  s!.title
                )}
                {s!.note ? <span className="cl-muted"> — {s!.note}</span> : null}
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}
