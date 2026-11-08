/**
 * Lesson player (/learn/:lessonId): intro → activity stepper → completion.
 * Phase + position live in the URL (?step=N&g=<guidance>, ?done=1) so reload/back keep the learner's place.
 * Progress is derived from recorded LearningEvents (never stored separately).
 */
import { useCallback, useEffect, useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { useDocumentTitle } from '../../app/useDocumentTitle';
import { getLesson, getLessonActivities, lessons as allLessons } from '../../content';
import type { Guidance, Lesson } from '../../domain/contracts';
import { useI18n } from '../../i18n';
import { learnerActions, useLearner } from '../../state';
import { EmptyState } from '../../ui/primitives/misc';
import { LessonComplete } from './LessonComplete';
import { LessonHeader } from './LessonHeader';
import { LessonIntro } from './LessonIntro';
import { LessonPlay } from './LessonPlay';
import { lessonDoneRoute, lessonPositionRoute, parseLessonPosition } from './position';
import { S } from './strings';
import './lesson.css';

const GUIDANCE: readonly Guidance[] = ['guided', 'assisted', 'independent'];

function LessonNotFound({ id }: { id: string }) {
  const { t } = useI18n();
  useDocumentTitle(S.notFoundTitle);
  const starters = allLessons.filter((l) => l.prerequisites.length === 0).slice(0, 3);
  return (
    <section className="ls-page" aria-labelledby="ls-nf-title">
      <h1 id="ls-nf-title">{t(S.notFoundTitle)}</h1>
      <p>{t(S.notFoundBody(id))}</p>
      {starters.length > 0 && (
        <>
          <p>{t(S.tryThese)}</p>
          <ul>
            {starters.map((l) => (
              <li key={l.id}>
                <Link to={`/learn/${l.id}`}>{t(l.title)}</Link>
              </li>
            ))}
          </ul>
        </>
      )}
      <p>
        <Link to="/">{t(S.backToMap)}</Link>
      </p>
    </section>
  );
}

function LessonView({ lesson }: { lesson: Lesson }) {
  const { t } = useI18n();
  useDocumentTitle(lesson.title);
  const activities = useMemo(() => getLessonActivities(lesson.id), [lesson.id]);
  const [params, setParams] = useSearchParams();
  const defaultGuidance = useLearner((s) => s.prefs.defaultGuidance);
  const savedRoute = useLearner((s) => s.lastLocation?.route ?? null);
  const saved = parseLessonPosition(savedRoute, lesson.id, activities.length);
  const g = params.get('g');
  // URL first; else the tier the learner last used in THIS lesson; else their default.
  const guidance: Guidance = GUIDANCE.includes(g as Guidance) ? (g as Guidance) : (saved?.guidance ?? defaultGuidance);
  const stepParam = Number.parseInt(params.get('step') ?? '', 10);
  const done = params.get('done') === '1';
  const step = Number.isFinite(stepParam) ? Math.min(Math.max(stepParam, 1), Math.max(activities.length, 1)) - 1 : null;
  const phase: 'intro' | 'play' | 'done' = done ? 'done' : step !== null && activities.length > 0 ? 'play' : 'intro';

  // Remember the exact place (activity + tier) so "continue" returns here after a reload or relaunch.
  useEffect(() => {
    if (phase === 'play' && step !== null) learnerActions.setLastLocation(lessonPositionRoute(lesson.id, step, guidance));
    else if (phase === 'done') learnerActions.setLastLocation(lessonDoneRoute(lesson.id, guidance));
  }, [lesson.id, phase, step, guidance]);

  const goTo = useCallback(
    (index: number, opts: { replace?: boolean; guidance?: Guidance } = {}) => {
      setParams({ step: String(index + 1), g: opts.guidance ?? guidance }, { replace: opts.replace ?? false });
    },
    [setParams, guidance],
  );
  const finish = useCallback(() => setParams({ done: '1', g: guidance }, { replace: false }), [setParams, guidance]);
  const setGuidance = useCallback(
    (next: Guidance) => {
      const p = new URLSearchParams(params);
      p.set('g', next);
      setParams(p, { replace: true });
    },
    [params, setParams],
  );

  return (
    <article className="ls-page" data-phase={phase} data-track={lesson.track} data-testid="lesson-page">
      <LessonHeader lesson={lesson} compact={phase === 'play'} />
      {activities.length === 0 ? (
        <EmptyState title={t(S.noActivities)} action={<Link to="/">{t(S.backToMap)}</Link>} />
      ) : phase === 'intro' ? (
        <LessonIntro
          lesson={lesson}
          activities={activities}
          guidance={guidance}
          savedIndex={saved?.index ?? null}
          onGuidance={setGuidance}
          onStart={(i) => goTo(i)}
        />
      ) : phase === 'play' && step !== null ? (
        <LessonPlay
          lesson={lesson}
          activities={activities}
          index={step}
          guidance={guidance}
          onGuidance={setGuidance}
          onGo={(i) => goTo(i, { replace: true })}
          onFinish={finish}
        />
      ) : (
        <LessonComplete
          lesson={lesson}
          activities={activities}
          onReview={(i) => goTo(i)}
          onTryIndependent={() => {
            const first = activities.findIndex((a) => lesson.checkForUnderstanding.includes(a.id));
            goTo(Math.max(first, 0), { guidance: 'independent' });
          }}
        />
      )}
    </article>
  );
}

export default function LessonPage() {
  const { lessonId = '' } = useParams();
  const lesson = getLesson(lessonId);
  if (!lesson) return <LessonNotFound id={lessonId} />;
  return <LessonView key={lesson.id} lesson={lesson} />;
}
