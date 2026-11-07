import { useCallback, useEffect, useRef, useState } from 'react';
import { useMediaQuery } from '../../app/useMediaQuery';
import { audio } from '../../audio';
import type { Activity, Guidance, Lesson } from '../../domain/contracts';
import { useI18n } from '../../i18n';
import { useCapabilities } from '../../platform';
import { completedActivityIds, getLearnerState, learnerActions, lessonStatus, useLearner } from '../../state';
import { Icon } from '../../ui/icons';
import { Button } from '../../ui/primitives/Button';
import { Callout } from '../../ui/primitives/Callout';
import { GuidanceSelector, guidanceLabel } from '../../ui/primitives/Guidance';
import { StepProgress } from '../../ui/primitives/Progress';
import { Tag } from '../../ui/primitives/Tag';
import { announce } from '../../ui/primitives/announcer';
import { Kbd } from '../../ui/primitives/misc';
import { ActivityRenderer, isGuidanceSensitive, type ActivityResult } from '../activities';
import { KIND_ICON, isTypingTarget } from './meta';
import { buildLessonEvent, lessonMode } from './record';
import { S } from './strings';

function play(name: Parameters<typeof audio.play>[0]) {
  try {
    audio.play(name);
  } catch {
    /* optional */
  }
}

export function LessonPlay({
  lesson,
  activities,
  index,
  guidance,
  onGuidance,
  onGo,
  onFinish,
}: {
  lesson: Lesson;
  activities: Activity[];
  index: number;
  guidance: Guidance;
  onGuidance(g: Guidance): void;
  onGo(index: number): void;
  onFinish(): void;
}) {
  const { t, locale } = useI18n();
  const caps = useCapabilities();
  const narrow = useMediaQuery('(max-width: 900px)');
  const profile = useLearner((s) => s.profile);
  const done = useLearner((s) => completedActivityIds(s.events));
  const activity = activities[index]!;
  const [hintSignal, setHintSignal] = useState(0);
  const [restart, setRestart] = useState(0);
  const keyNavRef = useRef<((dir: 1 | -1) => boolean) | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const isLast = index >= activities.length - 1;
  const completedCount = activities.filter((a) => done.has(a.id)).length;

  // Move focus to the activity title when the step changes (keyboard / screen-reader users).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      headingRef.current?.focus({ preventScroll: true });
      return;
    }
    headingRef.current?.focus();
    window.scrollTo?.({ top: 0, behavior: 'smooth' });
  }, [index]);

  const goNext = useCallback(() => {
    if (isLast) onFinish();
    else onGo(index + 1);
  }, [isLast, onFinish, onGo, index]);
  const goBack = useCallback(() => {
    if (index > 0) onGo(index - 1);
  }, [index, onGo]);

  const handleComplete = (result: ActivityResult) => {
    const before = lessonStatus(lesson, getLearnerState().events);
    const draft = buildLessonEvent(activity, result, { mode: lessonMode(caps, profile), guidance });
    if (draft) learnerActions.recordEvent(draft);
    const after = lessonStatus(lesson, getLearnerState().events);
    if (before !== 'completed' && after === 'completed') play('levelUp');
    else if (draft && result.outcome === 'completed') play('complete');
    goNext();
  };

  // ← / → move between activities (the activity may consume them first), H toggles the hint.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || isTypingTarget(e.target)) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const dir = e.key === 'ArrowRight' ? 1 : -1;
        e.preventDefault();
        if (keyNavRef.current?.(dir)) return;
        if (dir === 1) goNext();
        else goBack();
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setHintSignal((n) => n + 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goBack]);

  const changeGuidance = (g: Guidance) => {
    onGuidance(g);
    setRestart((n) => n + 1);
    announce(t(S.supportRestart(guidanceLabel(g, locale))));
  };

  const isCheck = lesson.checkForUnderstanding.includes(activity.id);
  const activityDone = done.has(activity.id);

  return (
    <div className="ls-play">
      <aside className="ls-play__side" aria-label={t(S.activities)}>
        <details className="ls-play__outline" open={!narrow} key={narrow ? 'narrow' : 'wide'}>
          <summary>{t(S.allActivities(completedCount, activities.length))}</summary>
          <ol className="ls-outline">
            {activities.map((a, i) => (
              <li key={a.id}>
                <button
                  type="button"
                  className="ls-outline__item"
                  aria-current={i === index ? 'step' : undefined}
                  data-done={done.has(a.id)}
                  onClick={() => onGo(i)}
                >
                  <Icon name={done.has(a.id) ? 'check' : KIND_ICON[a.kind]} size={18} />
                  <span className="ls-outline__text">
                    <span>{t(a.title)}</span>
                    <span className="ls-outline__kind">{t(S.kind[a.kind])}</span>
                  </span>
                  <span className="cl-visually-hidden">{done.has(a.id) ? t(S.done) : t(S.open)}</span>
                </button>
              </li>
            ))}
          </ol>
        </details>
      </aside>

      <section className="ls-play__main" aria-labelledby="ls-activity-title">
        <div className="ls-play__top">
          <StepProgress current={index} total={activities.length} locale={locale} />
          <div className="ls-play__tags">
            <Tag icon={KIND_ICON[activity.kind]}>{t(S.kind[activity.kind])}</Tag>
            {isCheck && <Tag tone="accent">{t(S.check)}</Tag>}
            {activityDone && (
              <Tag tone="success" icon="check">
                {t(S.done)}
              </Tag>
            )}
          </div>
        </div>
        <h2 id="ls-activity-title" ref={headingRef} tabIndex={-1} className="ls-activity-title" data-testid="activity-title">
          {t(activity.title)}
        </h2>
        {isGuidanceSensitive(activity.kind) && (
          <div className="ls-play__guidance">
            <GuidanceSelector value={guidance} onChange={changeGuidance} locale={locale} />
          </div>
        )}
        {activity.intro && <p className="ls-activity-intro">{t(activity.intro)}</p>}
        {activity.kind !== 'guided-practice' &&
          activity.kind !== 'spatial-practice' &&
          (activity.safetyNotes ?? []).map((n, i) => (
            <Callout key={i} kind="safety" locale={locale}>
              {t(n)}
            </Callout>
          ))}

        <div className="ls-activity" data-kind={activity.kind} data-activity={activity.id}>
          <ActivityRenderer
            key={`${activity.id}:${guidance}:${restart}`}
            activity={activity}
            guidance={guidance}
            onComplete={handleComplete}
            hintSignal={hintSignal}
            keyNavRef={keyNavRef}
            onStepDown={guidance === 'guided' ? undefined : () => changeGuidance(guidance === 'independent' ? 'assisted' : 'guided')}
          />
        </div>

        <nav className="ls-play__nav" aria-label={locale === 'zh' ? '练习导航' : 'Activity navigation'}>
          <Button variant="ghost" icon="back" onClick={goBack} disabled={index === 0} data-testid="lesson-back">
            {t(S.back)}
          </Button>
          <p className="ls-shortcuts" aria-hidden="true">
            <Kbd>←</Kbd> <Kbd>→</Kbd> {t(S.shortcutNav)} · <Kbd>H</Kbd> {t(S.shortcutHint)}
            {activity.kind === 'quiz' && (
              <>
                {' · '}
                <Kbd>1</Kbd>–<Kbd>4</Kbd> {t(S.shortcutPick)}
              </>
            )}
          </p>
          <Button variant={activityDone ? 'secondary' : 'ghost'} iconEnd="next" onClick={goNext} data-testid="lesson-next">
            {isLast ? t(S.finish) : activityDone ? t(S.next) : t(S.skip)}
          </Button>
        </nav>
      </section>
    </div>
  );
}
