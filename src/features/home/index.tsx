/**
 * Home / course map. Mode-conditioned on purpose:
 *  - desktop: rich overview — recommended lesson + honest progress + the full course map + beyond-the-screen.
 *  - phone (≤640px or preferred mode mobile / kitchen): a short "today" focus — one next lesson,
 *    a big "make a real cup" button, compact track list.
 */
import { Link } from 'react-router';
import { PHONE_QUERY, useMediaQuery } from '../../app/useMediaQuery';
import { useDocumentTitle } from '../../app/useDocumentTitle';
import { getLessonActivities, getTrackLessons, isCoreTrack, lessons, tracks } from '../../content';
import type { Lesson, Track } from '../../domain/contracts';
import { useI18n } from '../../i18n';
import { useXrSupport } from '../../platform';
import { TRACK_PRIORITY, lessonProgress, lessonStatusMap, nextRecommendedLesson, useLearner, type LessonStatus } from '../../state';
import { Icon } from '../../ui/icons';
import { EvidenceBadge } from '../../ui/primitives/EvidenceBadge';
import { ProgressBar, ProgressRing } from '../../ui/primitives/Progress';
import { Tag } from '../../ui/primitives/Tag';
import { ActivityArt, coverArtKey } from '../activities';
import { CafeEntryCard } from '../cafe/CafeEntry';
import { CultureEntryLink } from '../culture/CultureEntry';
import { lessonAutonomy, type Autonomy } from '../lesson/autonomy';
import { orderTracks, pickPracticeActivity, progressSummary } from './summary';
import { S } from './strings';
import './home.css';

function useHomeData() {
  const profile = useLearner((s) => s.profile);
  const events = useLearner((s) => s.events);
  const journal = useLearner((s) => s.journal);
  const activePractice = useLearner((s) => s.activePractice);
  const goal = profile?.goal ?? 'espresso';
  const next = nextRecommendedLesson(lessons, events, goal);
  const status = lessonStatusMap(lessons, events);
  const summary = progressSummary(lessons, events, journal, isCoreTrack);
  const ordered = orderTracks(tracks, TRACK_PRIORITY[goal]);
  const practiceId = pickPracticeActivity(goal, profile?.equipment ?? []);
  return { profile, events, goal, next, status, summary, ordered, practiceId, activePractice };
}

function statusIcon(s: LessonStatus) {
  return s === 'completed' ? 'check' : s === 'in-progress' ? 'play' : 'book';
}

/** "Completed with guidance" vs "Mastered independently" (QA-08) — never "mastered" for hinted work. */
function statusLabel(s: LessonStatus, autonomy: Autonomy | null) {
  return s === 'completed' && autonomy ? S.autonomy[autonomy] : S.status[s];
}

// ───────────────────────── shared pieces ─────────────────────────

function NextLessonCard({ lesson, big }: { lesson: Lesson | null; big?: boolean }) {
  const { t } = useI18n();
  const progress = useLearner((s) => (lesson ? lessonProgress(lesson, s.events) : null));
  const allIndependent = useLearner(
    (s) => !lesson && lessons.every((l) => ['independent', 'untiered'].includes(lessonAutonomy(l, s.events) ?? '')),
  );
  if (!lesson || !progress) {
    return (
      <div className="home-next home-next--done">
        <Icon name="star" size={28} />
        <p>{t(allIndependent ? S.allMastered : S.allDone)}</p>
      </div>
    );
  }
  const started = progress.status === 'in-progress';
  const track = tracks.find((tr) => tr.id === lesson.track);
  return (
    <Link to={`/learn/${lesson.id}`} className={big ? 'home-next home-next--big' : 'home-next'} data-testid="home-next-lesson">
      <ActivityArt name={coverArtKey(getLessonActivities(lesson.id)) ?? 'beans'} className="home-next__art" />
      <span className="home-next__body">
        <span className="cl-eyebrow">{t(S.recommended)}</span>
        <span className="home-next__title">{t(lesson.title)}</span>
        <span className="home-next__meta">
          {track ? t(track.title) : ''} · {t(S.minutes(lesson.estimatedMinutes))}
        </span>
        <span className="home-next__goal">{t(lesson.goal)}</span>
        <span className="home-next__cta">
          {started ? t(S.continueLesson) : t(S.startLesson)} <Icon name="next" size={18} />
        </span>
      </span>
      <ProgressRing
        value={progress.fraction}
        size={big ? 64 : 52}
        label={t(lesson.title)}
        valueText={t(S.activityCount(progress.completedCount, progress.totalCount))}
        className="home-next__ring"
      />
    </Link>
  );
}

function SummaryPanel({ compact }: { compact?: boolean }) {
  const { t, locale } = useI18n();
  const { summary } = useHomeData();
  const nothing = summary.activitiesDone === 0 && summary.cupsLogged === 0;
  return (
    <section className={compact ? 'home-summary home-summary--compact' : 'home-summary'} aria-labelledby="home-progress">
      <h2 id="home-progress" className="home-h2">
        {t(S.progress)}
      </h2>
      <dl className="home-stats">
        <div>
          <dt>{t(S.completed)}</dt>
          <dd className="cl-num" data-testid="stat-mastered">
            {summary.coreCompleted}/{summary.coreTotal}
          </dd>
          {summary.coreCompleted > 0 && (
            <dd className="home-stats__sub" data-testid="stat-independent">
              {t(S.independentCount(summary.coreIndependent))}
            </dd>
          )}
          {!compact && summary.optionalCompleted > 0 && <dd className="home-stats__sub">{t(S.optionalCompleted(summary.optionalCompleted))}</dd>}
        </div>
        {!compact && (
          <div>
            <dt>{t(S.activities)}</dt>
            <dd className="cl-num" data-testid="stat-activities">
              {summary.activitiesDone}
            </dd>
          </div>
        )}
        <div>
          <dt>{t(S.cups)}</dt>
          <dd className="cl-num" data-testid="stat-cups">
            {summary.cupsLogged}
          </dd>
          <dd className="home-stats__sub">
            <EvidenceBadge kind="self_report" locale={locale} />
          </dd>
        </div>
        {!compact && summary.simulatedDone > 0 && (
          <div>
            <dt>{t(S.sims)}</dt>
            <dd className="cl-num">{summary.simulatedDone}</dd>
            <dd className="home-stats__sub">
              <EvidenceBadge kind="simulated" locale={locale} />
            </dd>
          </div>
        )}
      </dl>
      {!compact && (
        <ProgressBar
          value={summary.coreTotal ? summary.coreCompleted / summary.coreTotal : 0}
          label={t(S.completed)}
          hideLabel
          valueText={`${summary.coreCompleted}/${summary.coreTotal}`}
          tone="success"
          size="sm"
        />
      )}
      <p className="cl-muted home-small">{nothing ? t(S.noProgress) : t(S.completedNote)}</p>
    </section>
  );
}

function XrStatus() {
  const { t } = useI18n();
  const xr = useXrSupport();
  const text =
    xr === null ? S.xrChecking : xr.immersiveVR ? S.xrReady : xr.reason === 'insecure-context' ? S.xrInsecure : S.xrFallback;
  return (
    <p className="home-xr-status" role="status">
      <Icon name={xr?.immersiveVR ? 'check' : 'info'} size={16} /> {t(text)}
    </p>
  );
}

function BeyondScreen({ practiceId, resumeId }: { practiceId: string; resumeId?: string }) {
  const { t, locale } = useI18n();
  return (
    <section className="home-beyond" aria-labelledby="home-beyond">
      <h2 id="home-beyond" className="home-h2">
        {t(S.beyond)}
      </h2>
      <div className="home-beyond__grid">
        <article className="home-tile home-tile--real">
          <ActivityArt name="pourover" className="home-tile__art" />
          <h3 className="home-tile__title">{t(S.realCup)}</h3>
          <p>{t(S.realCupBody)}</p>
          <EvidenceBadge kind="self_report" locale={locale} />
          <div className="home-tile__actions">
            <Link className="cl-btn cl-btn--primary cl-btn--md" to={`/practice/${resumeId ?? practiceId}`} data-testid="home-real-cup">
              <Icon name="phone" size={20} />
              <span className="cl-btn__label">{resumeId ? t(S.resumeGuide) : t(S.openGuide)}</span>
            </Link>
            <Link className="cl-btn cl-btn--ghost cl-btn--md" to="/journal">
              <Icon name="journal" size={20} />
              <span className="cl-btn__label">{t(S.journal)}</span>
            </Link>
          </div>
        </article>
        <article className="home-tile home-tile--xr">
          <ActivityArt name="espresso-machine" className="home-tile__art" />
          <h3 className="home-tile__title">{t(S.xrTitle)}</h3>
          <p>{t(S.xrBody)}</p>
          <EvidenceBadge kind="simulated" locale={locale} />
          <XrStatus />
          <div className="home-tile__actions">
            <Link className="cl-btn cl-btn--secondary cl-btn--md" to="/xr" data-testid="home-xr">
              <Icon name="headset" size={20} />
              <span className="cl-btn__label">{t(S.openXr)}</span>
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}

// ───────────────────────── desktop course map ─────────────────────────

function TrackSection({ track, nextId, status }: { track: Track; nextId?: string; status: Map<string, LessonStatus> }) {
  const { t } = useI18n();
  const trackLessons = getTrackLessons(track.id);
  const completed = trackLessons.filter((l) => status.get(l.id) === 'completed').length;
  return (
    <section className="home-track" data-track={track.id} data-optional={!!track.optional} aria-labelledby={`track-${track.id}`}>
      <header className="home-track__head">
        <div>
          <h3 id={`track-${track.id}`} className="home-track__title">
            {t(track.title)}{' '}
            <Tag tone={track.optional ? 'culture' : 'accent'} size="sm">
              {track.optional ? t(S.optional) : t(S.core)}
            </Tag>
          </h3>
          <p className="home-track__summary">{t(track.summary)}</p>
          {track.id === 'culture' && <CultureEntryLink variant="inline" testId="home-culture-link" />}
        </div>
        <ProgressBar
          value={trackLessons.length ? completed / trackLessons.length : 0}
          label={t(track.title)}
          hideLabel
          valueText={t(S.lessonsDone(completed, trackLessons.length))}
          size="sm"
          className="home-track__bar"
        />
      </header>
      <ol className="home-lessons">
        {trackLessons.map((l, i) => (
          <li key={l.id}>
            <LessonCard lesson={l} n={i + 1} isNext={l.id === nextId} />
          </li>
        ))}
      </ol>
    </section>
  );
}

function LessonCard({ lesson, n, isNext }: { lesson: Lesson; n: number; isNext: boolean }) {
  const { t } = useI18n();
  const p = useLearner((s) => lessonProgress(lesson, s.events));
  const autonomy = useLearner((s) => lessonAutonomy(lesson, s.events));
  const label = statusLabel(p.status, autonomy);
  return (
    <Link
      to={`/learn/${lesson.id}`}
      className="home-lesson"
      data-status={p.status}
      data-autonomy={autonomy ?? undefined}
      data-next={isNext || undefined}
      data-lesson={lesson.id}
    >
      <ProgressRing
        value={p.fraction}
        size={44}
        label={t(lesson.title)}
        valueText={`${t(label)}, ${t(S.activityCount(p.completedCount, p.totalCount))}`}
        className="home-lesson__ring"
      >
        {p.status === 'completed' ? <Icon name="check" size={18} /> : n}
      </ProgressRing>
      <span className="home-lesson__body">
        <span className="home-lesson__title">{t(lesson.title)}</span>
        <span className="home-lesson__meta">
          <span className="home-lesson__status" data-status={p.status}>
            <Icon name={autonomy === 'independent' ? 'star' : statusIcon(p.status)} size={14} /> {t(label)}
          </span>
          <span>· {t(S.minutes(lesson.estimatedMinutes))}</span>
        </span>
      </span>
      {isNext && (
        <Tag tone="accent" size="sm" className="home-lesson__next">
          {t(S.nextBadge)}
        </Tag>
      )}
    </Link>
  );
}

function DesktopHome() {
  const { t } = useI18n();
  const { goal, next, status, ordered, practiceId, activePractice } = useHomeData();
  const core = ordered.filter((tr) => !tr.optional);
  const optional = ordered.filter((tr) => tr.optional);
  return (
    <div className="home home--desktop" data-layout="desktop">
      <header className="home-head">
        <div>
          <h1 className="home-title">{t(S.title)}</h1>
          <p className="home-subtitle">{t(S.subtitle[goal])}</p>
        </div>
        <Link to="/onboarding?edit=1" className="cl-btn cl-btn--ghost cl-btn--sm home-edit">
          <Icon name="sliders" size={16} />
          <span className="cl-btn__label">{t(S.editSetup)}</span>
        </Link>
      </header>

      <div className="home-hero">
        <NextLessonCard lesson={next} big />
        <SummaryPanel />
      </div>

      <CafeEntryCard />

      <section className="home-map" aria-labelledby="home-map">
        <h2 id="home-map" className="home-h2">
          {t(S.courseMap)}
        </h2>
        {core.map((tr) => (
          <TrackSection key={tr.id} track={tr} nextId={next?.id} status={status} />
        ))}
        {optional.length > 0 && (
          <>
            <p className="cl-muted home-optional-note">
              <Icon name="globe" size={16} /> {t(S.optionalNote)}
            </p>
            <div className="home-optional">
              {optional.map((tr) => (
                <TrackSection key={tr.id} track={tr} nextId={next?.id} status={status} />
              ))}
            </div>
          </>
        )}
      </section>

      <BeyondScreen practiceId={practiceId} resumeId={activePractice?.activityId} />
    </div>
  );
}

// ───────────────────────── phone "today" ─────────────────────────

function PhoneHome() {
  const { t } = useI18n();
  const { next, status, ordered, practiceId, activePractice, events } = useHomeData();
  return (
    <div className="home home--phone" data-layout="phone">
      <header className="home-head">
        <h1 className="home-title">{t(S.title)}</h1>
      </header>
      <section aria-labelledby="home-today" className="home-today">
        <h2 id="home-today" className="home-h2">
          {t(S.today)}
        </h2>
        <NextLessonCard lesson={next} />
      </section>

      <Link className="home-bigcta" to={`/practice/${activePractice?.activityId ?? practiceId}`} data-testid="home-real-cup">
        <Icon name="cup" size={32} />
        <span>
          <span className="home-bigcta__title">{activePractice ? t(S.resumeGuide) : t(S.realCup)}</span>
          <span className="home-bigcta__sub">{t(S.openGuide)}</span>
        </span>
        <Icon name="next" size={24} />
      </Link>

      <CafeEntryCard />

      <SummaryPanel compact />

      <section aria-labelledby="home-tracks" className="home-tracklist">
        <h2 id="home-tracks" className="home-h2">
          {t(S.tracks)}
        </h2>
        {ordered.map((tr) => {
          const ls = getTrackLessons(tr.id);
          const completed = ls.filter((l) => status.get(l.id) === 'completed').length;
          return (
            <details key={tr.id} className="home-acc" data-track={tr.id} open={ls.some((l) => l.id === next?.id) || undefined}>
              <summary>
                <span className="home-acc__title">{t(tr.title)}</span>
                {tr.optional && (
                  <Tag tone="culture" size="sm">
                    {t(S.optional)}
                  </Tag>
                )}
                <span className="home-acc__count cl-num">
                  {completed}/{ls.length}
                </span>
              </summary>
              {tr.id === 'culture' && <CultureEntryLink variant="inline" testId="home-culture-link" />}
              <ol className="home-acc__list">
                {ls.map((l) => {
                  const st = status.get(l.id) ?? 'not-started';
                  const autonomy = st === 'completed' ? lessonAutonomy(l, events) : null;
                  return (
                    <li key={l.id}>
                      <Link to={`/learn/${l.id}`} className="home-row" data-status={st} data-autonomy={autonomy ?? undefined}>
                        <Icon name={autonomy === 'independent' ? 'star' : statusIcon(st)} size={18} />
                        <span className="home-row__title">{t(l.title)}</span>
                        <span className="cl-visually-hidden">{t(statusLabel(st, autonomy))}</span>
                        <Icon name="next" size={16} />
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </details>
          );
        })}
      </section>

      <div className="home-phone-links">
        <Link className="cl-btn cl-btn--secondary cl-btn--md" to="/xr">
          <Icon name="headset" size={20} />
          <span className="cl-btn__label">{t(S.xrTitle)}</span>
        </Link>
        <Link className="cl-btn cl-btn--secondary cl-btn--md" to="/atlas">
          <Icon name="map" size={20} />
          <span className="cl-btn__label">{t(S.atlas)}</span>
        </Link>
      </div>
    </div>
  );
}

export default function HomePage() {
  useDocumentTitle(S.title);
  const phoneWidth = useMediaQuery(PHONE_QUERY);
  const preferred = useLearner((s) => s.profile?.preferredMode);
  const phone = phoneWidth || preferred === 'mobile' || preferred === 'real-world-guide';
  return phone ? <PhoneHome /> : <DesktopHome />;
}
