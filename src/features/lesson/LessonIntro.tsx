import { Link } from 'react-router';
import { getLesson, getSource } from '../../content';
import type { Activity, Guidance, Lesson } from '../../domain/contracts';
import { useI18n } from '../../i18n';
import { completedActivityIds, lessonStatus, useLearner } from '../../state';
import { Icon } from '../../ui/icons';
import { Button } from '../../ui/primitives/Button';
import { Callout } from '../../ui/primitives/Callout';
import { GuidanceSelector } from '../../ui/primitives/Guidance';
import { Tag } from '../../ui/primitives/Tag';
import { ELSEWHERE_KINDS, KIND_ICON } from './meta';
import { RelatedDrinks } from './RelatedDrinks';
import { S } from './strings';

export function LessonIntro({
  lesson,
  activities,
  guidance,
  savedIndex = null,
  onGuidance,
  onStart,
}: {
  lesson: Lesson;
  activities: Activity[];
  guidance: Guidance;
  /** Activity the learner was on last time in this lesson (from the saved location), if any. */
  savedIndex?: number | null;
  onGuidance(g: Guidance): void;
  onStart(index: number): void;
}) {
  const { t, locale } = useI18n();
  const done = useLearner((s) => completedActivityIds(s.events));
  const status = useLearner((s) => lessonStatus(lesson, s.events));
  const unmetPrereqs = useLearner((s) =>
    lesson.prerequisites
      .map((id) => getLesson(id))
      .filter((l): l is Lesson => !!l && lessonStatus(l, s.events) !== 'completed'),
  );
  const firstOpen = activities.findIndex((a) => !done.has(a.id) && !ELSEWHERE_KINDS.has(a.kind));
  // In-progress: go back to the exact activity they were on (survives reload / relaunch); else the first open one.
  const resumeSaved = status === 'in-progress' && savedIndex !== null && savedIndex < activities.length;
  const resumeAt = resumeSaved ? savedIndex : status === 'not-started' ? 0 : firstOpen === -1 ? 0 : firstOpen;
  const ctaLabel =
    status === 'completed'
      ? t(S.review)
      : status === 'in-progress' && resumeAt > 0
        ? t(resumeSaved ? S.resumeHere(resumeAt + 1) : S.resume(resumeAt + 1))
        : t(S.start);

  return (
    <div className="ls-intro">
      <div className="ls-intro__main">
        <section aria-labelledby="ls-goal" className="ls-section">
          <h2 id="ls-goal" className="ls-h2">
            {t(S.goal)}
          </h2>
          <p className="ls-goal">{t(lesson.goal)}</p>
        </section>

        {unmetPrereqs.length > 0 && (
          <Callout kind="info" locale={locale}>
            {t(S.recommendedFirst)}{' '}
            {unmetPrereqs.map((p, i) => (
              <span key={p.id}>
                {i > 0 && ', '}
                <Link to={`/learn/${p.id}`}>{t(p.title)}</Link>
              </span>
            ))}{' '}
            {t(S.notBlocking)}
          </Callout>
        )}

        <section aria-labelledby="ls-ideas" className="ls-section">
          <h2 id="ls-ideas" className="ls-h2">
            {t(S.keyIdeas)}
          </h2>
          <ul className="ls-concepts">
            {lesson.keyConcepts.map((c, i) => (
              <li key={i}>
                <Icon name="sparkle" size={16} /> <span>{t(c)}</span>
              </li>
            ))}
          </ul>
        </section>

        {lesson.safetyNotes.length > 0 && (
          <section aria-labelledby="ls-safety" className="ls-section">
            <h2 id="ls-safety" className="ls-h2">
              {t(S.safety)}
            </h2>
            {lesson.safetyNotes.map((n, i) => (
              <Callout key={i} kind="safety" locale={locale}>
                {t(n)}
              </Callout>
            ))}
          </section>
        )}
      </div>

      <aside className="ls-intro__side">
        <section aria-labelledby="ls-outline" className="ls-section ls-card">
          <h2 id="ls-outline" className="ls-h2">
            {t(S.inThisLesson)}
          </h2>
          <ol className="ls-outline">
            {activities.map((a, i) => {
              const isDone = done.has(a.id);
              const isCheck = lesson.checkForUnderstanding.includes(a.id);
              return (
                <li key={a.id}>
                  <button type="button" className="ls-outline__item" onClick={() => onStart(i)} data-done={isDone}>
                    <Icon name={isDone ? 'check' : KIND_ICON[a.kind]} size={18} />
                    <span className="ls-outline__text">
                      <span>{t(a.title)}</span>
                      <span className="ls-outline__kind">
                        {t(S.kind[a.kind])}
                        {isCheck ? ` · ${t(S.check)}` : ''}
                        {ELSEWHERE_KINDS.has(a.kind) ? ` · ${t(S.optional)}` : ''}
                      </span>
                    </span>
                    <span className="cl-visually-hidden">{isDone ? t(S.done) : t(S.open)}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>

        <section aria-labelledby="ls-support" className="ls-section ls-card">
          <h2 id="ls-support" className="ls-h2">
            {t(S.support)}
          </h2>
          <GuidanceSelector value={guidance} onChange={onGuidance} locale={locale} variant="full" />
          <p className="cl-muted ls-small">{t(S.supportNote)}</p>
        </section>

        <Button size="lg" block iconEnd="next" onClick={() => onStart(resumeAt)} data-testid="lesson-start">
          {ctaLabel}
        </Button>

        <RelatedDrinks lessonId={lesson.id} max={4} compact />
      </aside>

      <footer className="ls-intro__foot">
        <Tag tone={lesson.confidence === 'verified' ? 'success' : 'info'}>{t(S.confidence[lesson.confidence])}</Tag>
        {lesson.sources.length > 0 && (
          <details className="ls-sources">
            <summary>{t(S.sources)}</summary>
            <ul>
              {lesson.sources.map((id) => {
                const src = getSource(id);
                if (!src) return null;
                return (
                  <li key={id}>
                    {src.url ? (
                      <a href={src.url} target="_blank" rel="noreferrer noopener">
                        {src.title}
                      </a>
                    ) : (
                      src.title
                    )}
                    {src.note ? <span className="cl-muted"> — {src.note}</span> : null}
                  </li>
                );
              })}
            </ul>
          </details>
        )}
      </footer>
    </div>
  );
}
