import { Link } from 'react-router';
import { getTrack } from '../../content';
import type { Lesson } from '../../domain/contracts';
import { useI18n } from '../../i18n';
import { lessonProgress, useLearner } from '../../state';
import { Icon } from '../../ui/icons';
import { ProgressRing } from '../../ui/primitives/Progress';
import { Tag } from '../../ui/primitives/Tag';
import { S } from './strings';

/** Breadcrumb + the page's single <h1> + derived progress ring. */
export function LessonHeader({ lesson, compact }: { lesson: Lesson; compact?: boolean }) {
  const { t, locale } = useI18n();
  const track = getTrack(lesson.track);
  const progress = useLearner((s) => lessonProgress(lesson, s.events));
  const statusText =
    progress.status === 'completed'
      ? t(S.done)
      : locale === 'zh'
        ? `已完成 ${progress.completedCount}/${progress.totalCount}`
        : `${progress.completedCount} of ${progress.totalCount} done`;

  return (
    <header className={compact ? 'ls-header ls-header--compact' : 'ls-header'}>
      <nav aria-label={t(S.breadcrumb)} className="ls-crumbs">
        <Link to="/">
          <Icon name="map" size={16} /> {t(S.courseMap)}
        </Link>
        {track && (
          <>
            <span aria-hidden="true">›</span>
            <span>{t(track.title)}</span>
          </>
        )}
      </nav>
      <div className="ls-header__row">
        <div className="ls-header__titles">
          <div className="ls-header__meta">
            <Tag tone="accent">{t(S.level[lesson.level])}</Tag>
            <Tag icon="clock">{t(S.minutes(lesson.estimatedMinutes))}</Tag>
            {track?.optional && <Tag tone="culture">{t(S.optional)}</Tag>}
          </div>
          <h1 className="ls-title">{t(lesson.title)}</h1>
        </div>
        <ProgressRing
          value={progress.fraction}
          size={compact ? 48 : 64}
          label={t(lesson.title)}
          valueText={statusText}
          className="ls-header__ring"
        />
      </div>
    </header>
  );
}
