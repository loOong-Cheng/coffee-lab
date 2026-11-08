/** Detail panel for one place: story, honesty badges, timeline moments, related drinks/lessons, sources, music. */
import { forwardRef } from 'react';
import { Link } from 'react-router';
import { audio, MUSIC_MOODS } from '../../audio';
import { getDrink, getLesson, getSource } from '../../content';
import type { CulturePlace, CultureTimelineEvent } from '../../domain/contracts';
import { useI18n } from '../../i18n';
import { learnerActions, useLearner } from '../../state';
import { Button, IconButton, Tag } from '../../ui';
import { KindMark } from './KindMark';
import { eventsAtPlace, moodForPlace, resolveIds } from './model';
import { CONFIDENCE_TEXT, EVENT_KIND_TEXT, PLACE_KIND_TEXT, S } from './strings';

export interface PlaceDetailProps {
  place: CulturePlace;
  timeline: readonly CultureTimelineEvent[];
  backLabel: string;
  onBack(): void;
  onClose(): void;
  onShowEvent(eventId: string): void;
}

export const DETAIL_HEADING_ID = 'cu-detail-h';

export const PlaceDetail = forwardRef<HTMLHeadingElement, PlaceDetailProps>(function PlaceDetail(
  { place, timeline, backLabel, onBack, onClose, onShowEvent },
  headingRef,
) {
  const { t } = useI18n();
  const drinks = resolveIds(place.relatedDrinkIds, getDrink);
  const lessons = resolveIds(place.relatedLessonIds, getLesson);
  const sources = resolveIds(place.sources, getSource);
  const moments = eventsAtPlace(timeline, place.id);
  const conf = CONFIDENCE_TEXT[place.confidence];

  return (
    <article className="cu-detail" aria-labelledby={DETAIL_HEADING_ID} data-testid="culture-detail" data-place={place.id}>
      <div className="cu-detail__top">
        <p className="cl-eyebrow cu-detail__kind">
          <KindMark kind={place.kind} size={16} /> {t(PLACE_KIND_TEXT[place.kind].one)}
        </p>
        <IconButton icon="x" label={t(S.clear)} size="sm" onClick={onClose} data-testid="culture-detail-close" />
      </div>
      <h3 id={DETAIL_HEADING_ID} className="cu-detail__title" tabIndex={-1} ref={headingRef}>
        {t(place.name)}
      </h3>
      <div className="cu-tags">
        <Tag tone="info" icon="shield" title={t(conf.detail)}>
          <span className="cl-visually-hidden">{t(S.confidence)}: </span>
          {t(conf.label)}
        </Tag>
        {place.producing && (
          <Tag tone="success" icon="leaf">
            {t(S.grows)}
          </Tag>
        )}
      </div>
      <p className="cu-detail__summary">{t(place.summary)}</p>
      <p className="cu-small cl-muted">{t(conf.detail)}</p>

      {moments.length > 0 && (
        <section className="cu-detail__sec" aria-labelledby="cu-detail-tl">
          <h4 id="cu-detail-tl" className="cu-h4">
            {t(S.onTimeline)}
          </h4>
          <ul className="cu-moments">
            {moments.map((e) => (
              <li key={e.id}>
                <button type="button" className="cu-moment" onClick={() => onShowEvent(e.id)} data-testid={`detail-event-${e.id}`}>
                  <span className="cu-moment__year">{t(e.yearLabel)}</span>
                  <span className="cu-moment__title">{t(e.title)}</span>
                  <span className="cu-moment__tags">
                    {e.kind === 'legend' ? (
                      <span className="cu-badge cu-badge--legend">{t(S.legendBadge)}</span>
                    ) : (
                      <span className="cu-badge">{t(EVENT_KIND_TEXT[e.kind].one)}</span>
                    )}
                    {e.disputed && <span className="cu-badge cu-badge--disputed">{t(S.disputed)}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {drinks.length > 0 && (
        <section className="cu-detail__sec" aria-labelledby="cu-detail-drinks">
          <h4 id="cu-detail-drinks" className="cu-h4">
            {t(S.drinksH)}
          </h4>
          <ul className="cu-links">
            {drinks.map((d) => (
              <li key={d.id}>
                <Link to={`/atlas/${encodeURIComponent(d.id)}`} data-testid={`detail-drink-${d.id}`}>
                  {t(d.name)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {lessons.length > 0 && (
        <section className="cu-detail__sec" aria-labelledby="cu-detail-lessons">
          <h4 id="cu-detail-lessons" className="cu-h4">
            {t(S.lessonsH)}
          </h4>
          <ul className="cu-links">
            {lessons.map((l) => (
              <li key={l.id}>
                <Link to={`/learn/${encodeURIComponent(l.id)}`}>{t(l.title)}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ListenButton place={place} />

      {sources.length > 0 ? (
        <details className="cu-sources">
          <summary>{t(S.sourcesH(sources.length))}</summary>
          <ul className="cu-links">
            {sources.map((s) => (
              <li key={s.id}>
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.title}
                  </a>
                ) : (
                  s.title
                )}
                {s.note ? <span className="cl-muted"> — {s.note}</span> : null}
              </li>
            ))}
          </ul>
        </details>
      ) : (
        <p className="cu-small cl-muted">{t(S.noSources)}</p>
      )}

      <Button variant="ghost" size="sm" icon="back" onClick={onBack} className="cu-detail__back">
        {backLabel}
      </Button>
    </article>
  );
});

/**
 * "Listen while you explore": sets the culture-inspired music mood for this place and turns music
 * on — ONLY on this explicit click (never auto-plays). Places without a matching mood offer the
 * general café mood and say so.
 */
function ListenButton({ place }: { place: CulturePlace }) {
  const { t } = useI18n();
  const music = useLearner((s) => s.prefs.music);
  const current = useLearner((s) => s.prefs.musicMood);
  const cultureMood = moodForPlace(place);
  const mood = cultureMood ?? 'cafe';
  const info = MUSIC_MOODS[mood];
  const playingThis = music && current === mood;

  const toggle = () => {
    if (playingThis) {
      learnerActions.updatePrefs({ music: false });
      return;
    }
    try {
      void audio.unlock();
    } catch {
      /* audio is optional */
    }
    learnerActions.updatePrefs({ musicMood: mood, music: true });
  };

  return (
    <section className="cu-listen" aria-labelledby="cu-listen-h">
      <h4 id="cu-listen-h" className="cu-h4">
        {t(S.listenH)}
      </h4>
      <p className="cu-listen__mood">
        {playingThis && <span className="cu-listen__now">{t(S.playing)}: </span>}
        <strong>{t(info.label)}</strong>
      </p>
      <p className="cu-small">{cultureMood && info.inspiration ? t(info.inspiration) : t(S.noMood)}</p>
      <p className="cu-small cl-muted">{t(S.original)}</p>
      <Button variant={playingThis ? 'ghost' : 'secondary'} size="sm" icon={playingThis ? 'sound-off' : 'music'} onClick={toggle} data-testid="culture-listen">
        {playingThis ? t(S.stop) : t(S.listen)}
      </Button>
    </section>
  );
}
