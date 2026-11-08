import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { getLesson } from '../../content';
import type { Activity, EvidenceKind, Lesson } from '../../domain/contracts';
import { useI18n } from '../../i18n';
import { completedActivityIds, lastEventFor, lessonStatus, useLearner } from '../../state';
import { Icon } from '../../ui/icons';
import { Button } from '../../ui/primitives/Button';
import { EvidenceBadge } from '../../ui/primitives/EvidenceBadge';
import { GuidanceBadge } from '../../ui/primitives/Guidance';
import { ActivityArt } from '../activities';
import { lessonAutonomy } from './autonomy';
import { RelatedDrinks } from './RelatedDrinks';
import { S } from './strings';

const EVIDENCE_ORDER: EvidenceKind[] = ['assessed_answer', 'self_report', 'simulated', 'observed_by_app'];

export function LessonComplete({
  lesson,
  activities,
  onReview,
  onTryIndependent,
}: {
  lesson: Lesson;
  activities: Activity[];
  onReview(index: number): void;
  /** Replays the lesson's checks at the Independent tier (the only tier that counts as "mastered"). */
  onTryIndependent?(): void;
}) {
  const { t, locale } = useI18n();
  const status = useLearner((s) => lessonStatus(lesson, s.events));
  const autonomy = useLearner((s) => lessonAutonomy(lesson, s.events));
  const done = useLearner((s) => completedActivityIds(s.events));
  const kinds = useLearner((s) => new Set(s.events.filter((e) => e.lessonId === lesson.id).map((e) => e.evidence)));
  const checkScores = useLearner((s) =>
    lesson.checkForUnderstanding.map((id) => ({ id, event: lastEventFor(s.events.filter((e) => e.outcome === 'completed'), id) })),
  );
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), []);

  const complete = status === 'completed';
  const openChecks = lesson.checkForUnderstanding.filter((id) => !done.has(id));
  const next = lesson.next.map((id) => getLesson(id)).find((l): l is Lesson => !!l);
  const practice = activities.find((a) => a.kind === 'guided-practice');
  const byId = new Map(activities.map((a, i) => [a.id, { a, i }]));

  return (
    <div className="ls-complete" data-testid="lesson-complete" data-status={status}>
      <section className="ls-complete__hero" aria-labelledby="ls-complete-title">
        <ActivityArt name={complete ? 'tasting' : 'scale'} className="ls-complete__art" />
        <div>
          <h2 id="ls-complete-title" ref={headingRef} tabIndex={-1} className="ls-complete__title">
            {complete ? (
              <>
                <Icon name="star" size={28} /> {t(S.completeTitle)}
              </>
            ) : (
              t(S.almostTitle)
            )}
          </h2>
          {complete && autonomy && (
            <div className="ls-autonomy" data-testid="lesson-autonomy" data-autonomy={autonomy}>
              {autonomy !== 'untiered' && <GuidanceBadge level={autonomy} locale={locale} />}
              <p>{t(S.autonomyResult[autonomy])}</p>
              {(autonomy === 'guided' || autonomy === 'assisted') && onTryIndependent && (
                <Button variant="secondary" size="sm" icon="star" onClick={onTryIndependent} data-testid="try-independent">
                  {t(S.tryIndependent)}
                </Button>
              )}
            </div>
          )}
          {!complete && openChecks.length > 0 && (
            <>
              <p>{t(S.openChecks(openChecks.length))}</p>
              <ul className="ls-open-checks">
                {openChecks.map((id) => {
                  const hit = byId.get(id);
                  if (!hit) return null;
                  return (
                    <li key={id}>
                      <span>{t(hit.a.title)}</span>
                      <Button size="sm" variant="secondary" onClick={() => onReview(hit.i)}>
                        {t(S.goTo)}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </section>

      <div className="ls-complete__grid">
        <section aria-labelledby="ls-learned" className="ls-card">
          <h2 id="ls-learned" className="ls-h2">
            {t(S.learned)}
          </h2>
          <ul className="ls-concepts">
            {lesson.keyConcepts.map((c, i) => (
              <li key={i}>
                <Icon name="check" size={16} /> <span>{t(c)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="ls-evidence" className="ls-card">
          <h2 id="ls-evidence" className="ls-h2">
            {t(S.evidence)}
          </h2>
          {kinds.size === 0 ? (
            <p className="cl-muted">{t(S.noEvidence)}</p>
          ) : (
            <ul className="ls-evidence">
              {EVIDENCE_ORDER.filter((k) => kinds.has(k)).map((k) =>
                k === 'observed_by_app' ? (
                  <li key={k} className="ls-evidence__item">
                    <EvidenceBadge kind={k} locale={locale} />
                    <span className="cl-muted ls-small">{t(S.viewedNote)}</span>
                  </li>
                ) : (
                  <li key={k}>
                    <EvidenceBadge kind={k} locale={locale} showDetail />
                  </li>
                ),
              )}
            </ul>
          )}
          {checkScores.some((c) => typeof c.event?.score === 'number') && (
            <dl className="ls-scores">
              {checkScores.map(({ id, event }) =>
                event && typeof event.score === 'number' ? (
                  <div key={id}>
                    <dt>{t(byId.get(id)?.a.title)}</dt>
                    <dd className="cl-num">
                      {t(S.firstTryScore)}: {Math.round(event.score * 100)}%
                    </dd>
                  </div>
                ) : null,
              )}
            </dl>
          )}
          <p className="cl-muted ls-small">{t(S.evidenceNote)}</p>
        </section>
      </div>

      <RelatedDrinks lessonId={lesson.id} />

      <nav className="ls-complete__next" aria-label={t(S.nextLesson)}>
        {next ? (
          <Link className="ls-next-card" to={`/learn/${next.id}`} data-testid="next-lesson">
            <span className="cl-eyebrow">{t(S.nextLesson)}</span>
            <span className="ls-next-card__title">{t(next.title)}</span>
            <span className="ls-next-card__cta">
              {t(S.startNext)} <Icon name="next" size={18} />
            </span>
          </Link>
        ) : (
          <p>{t(S.trackEnd)}</p>
        )}
        <div className="ls-complete__links">
          {practice && (
            <Link className="cl-btn cl-btn--secondary cl-btn--md" to={`/practice/${practice.id}`} data-testid="practice-real">
              <Icon name="phone" size={20} />
              <span className="cl-btn__label">{t(S.practiceReal)}</span>
            </Link>
          )}
          <Button variant="ghost" icon="repeat" onClick={() => onReview(0)}>
            {t(S.reviewAgain)}
          </Button>
          <Link className="cl-btn cl-btn--ghost cl-btn--md" to="/" data-testid="back-to-map">
            <Icon name="map" size={20} />
            <span className="cl-btn__label">{t(S.backToMap)}</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
