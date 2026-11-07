/** Café lobby: how to play, shifts (levels), support tier, relaxed timer, drinks-mastered collection. */
import { Link } from 'react-router';
import { getDrink } from '../../content';
import type { Guidance } from '../../domain/contracts';
import { useI18n } from '../../i18n';
import { useLearner } from '../../state';
import { Button, Callout, GUIDANCE_TEXT, GuidanceBadge, GuidanceSelector, Icon, ProgressBar, Switch, Tag } from '../../ui';
import { CupView } from './CupView';
import { LEVEL_ORDER, cafeMastery, recommendedLevel, type CafeLevelId } from './model';
import { BUILD_SPECS, specsForLevel } from './specs';
import { GUIDANCE_DETAIL, LEVEL_TEXT, S } from './strings';

export interface LobbyProps {
  guidance: Guidance;
  onGuidance(g: Guidance): void;
  timerOn: boolean;
  onTimer(on: boolean): void;
  onStart(level: CafeLevelId): void;
}

const LEVEL_ICON: Record<CafeLevelId, 'cup' | 'milk' | 'globe'> = { bar: 'cup', milk: 'milk', world: 'globe' };

export function Lobby({ guidance, onGuidance, timerOn, onTimer, onStart }: LobbyProps) {
  const { t, locale } = useI18n();
  const events = useLearner((s) => s.events);
  const mastery = cafeMastery(events);
  const masteredIds = new Set(mastery.keys());
  const rec = recommendedLevel(BUILD_SPECS, masteredIds);
  const masteredCount = BUILD_SPECS.filter((s) => masteredIds.has(s.drinkId)).length;

  return (
    <div className="cafe-lobby">
      <header className="cafe-head">
        <h1 className="cafe-title">{t(S.title)}</h1>
        <p className="cafe-lead">{t(S.lead)}</p>
      </header>

      <Callout kind="info" locale={locale}>
        <p data-testid="cafe-versions">{t(S.versions)}</p>
      </Callout>

      <section className="cafe-support-panel" aria-labelledby="cafe-support-h">
        <h2 id="cafe-support-h" className="cafe-h2">
          {t(S.settings)}
        </h2>
        <GuidanceSelector value={guidance} onChange={onGuidance} locale={locale} />
        <p className="cafe-small" data-testid="cafe-guidance-detail">
          <strong>{t(GUIDANCE_TEXT[guidance].short)}</strong> · {t(GUIDANCE_DETAIL[guidance])}
        </p>
        {guidance === 'independent' ? (
          <Switch checked={timerOn} onChange={onTimer} label={t(S.timer)} description={t(S.timerDesc)} data-testid="cafe-timer-switch" />
        ) : (
          <p className="cafe-small cl-muted">{t(S.timerOnlyIndependent)}</p>
        )}
      </section>

      <section aria-labelledby="cafe-shifts-h">
        <h2 id="cafe-shifts-h" className="cafe-h2">
          {t(S.shifts)}
        </h2>
        <p className="cafe-small cl-muted">{t(S.shiftsNote)}</p>
        <ol className="cafe-levels">
          {LEVEL_ORDER.map((level, i) => {
            const specs = specsForLevel(level);
            const done = specs.filter((s) => masteredIds.has(s.drinkId)).length;
            return (
              <li key={level} className="cafe-level" data-level={level} data-recommended={rec === level || undefined}>
                <div className="cafe-level__head">
                  <span className="cafe-level__icon" aria-hidden="true">
                    <Icon name={LEVEL_ICON[level]} size={24} />
                  </span>
                  <h3 className="cafe-level__title">
                    <span className="cafe-level__n">{i + 1}.</span> {t(LEVEL_TEXT[level].title)}
                  </h3>
                  {rec === level && (
                    <Tag tone="accent" icon="star">
                      {t(S.recommended)}
                    </Tag>
                  )}
                </div>
                <p className="cafe-level__blurb">{t(LEVEL_TEXT[level].blurb)}</p>
                <p className="cafe-level__drinks cafe-small cl-muted">
                  {specs
                    .map((s) => getDrink(s.drinkId))
                    .filter(Boolean)
                    .map((d) => t(d!.name))
                    .join(t({ zh: '、', en: ' · ' }))}
                </p>
                <ProgressBar
                  value={specs.length ? done / specs.length : 0}
                  label={t(LEVEL_TEXT[level].title)}
                  hideLabel
                  valueText={t(S.masteredOf(done, specs.length))}
                  size="sm"
                  tone="success"
                />
                <Button
                  variant={rec === level ? 'primary' : 'secondary'}
                  iconEnd="next"
                  onClick={() => onStart(level)}
                  data-testid={`cafe-start-${level}`}
                  className="cafe-level__start"
                >
                  {t(S.startShift)}
                </Button>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="cafe-how" aria-labelledby="cafe-how-h">
        <h2 id="cafe-how-h" className="cafe-h2">
          {t(S.howToPlay)}
        </h2>
        <ol className="cafe-how__steps">
          {S.howSteps.map((step, i) => (
            <li key={i}>{t(step)}</li>
          ))}
        </ol>
        <p className="cafe-small cl-muted">{t(S.honesty)}</p>
      </section>

      <section aria-labelledby="cafe-collection-h" className="cafe-collection" data-testid="cafe-mastered" data-count={masteredCount}>
        <h2 id="cafe-collection-h" className="cafe-h2">
          {t(S.collection)}
        </h2>
        <p className="cafe-collection__count" data-testid="cafe-mastered-count">
          {t(S.collectionCount(masteredCount, BUILD_SPECS.length))}
        </p>
        <p className="cafe-small cl-muted">{masteredCount === 0 ? t(S.collectionEmpty) : t(S.collectionNote)}</p>
        <ul className="cafe-collection__grid">
          {BUILD_SPECS.map((s) => {
            const d = getDrink(s.drinkId);
            if (!d) return null;
            const m = mastery.get(s.drinkId);
            return (
              <li key={s.drinkId} className="cafe-collect" data-mastered={!!m} data-drink={s.drinkId}>
                <CupView build={s.canonical} locale={locale} size={64} className="cafe-collect__cup" />
                <span className="cafe-collect__body">
                  <Link to={`/atlas/${encodeURIComponent(s.drinkId)}`} className="cafe-collect__name">
                    {t(d.name)}
                  </Link>
                  {m ? (
                    <span className="cafe-collect__status">
                      <Tag tone="success" icon="check">
                        {t(S.mastered)}
                      </Tag>
                      <GuidanceBadge level={m.best} locale={locale} />
                    </span>
                  ) : (
                    <span className="cafe-collect__status cl-muted">{t(S.notYet)}</span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
        <Link to="/atlas" className="cl-btn cl-btn--ghost cl-btn--md">
          <Icon name="map" size={20} />
          <span className="cl-btn__label">{t(S.openAtlas)}</span>
        </Link>
      </section>
    </div>
  );
}
