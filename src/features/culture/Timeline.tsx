/**
 * Vertical, chronological coffee timeline (all screen sizes — reads well and keeps a natural Tab order).
 * Legends get a dashed frame + a "Legend" badge; disputed dates get a "Dates disputed" badge.
 * Each event can jump to its place on the map and links to related drinks and lessons.
 */
import { useEffect } from 'react';
import { Link } from 'react-router';
import { audio } from '../../audio';
import { getDrink, getLesson } from '../../content';
import type { CulturePlace, CultureTimelineEvent } from '../../domain/contracts';
import { useI18n } from '../../i18n';
import { Button, Chip, EmptyState, Icon, Illustration, Tag } from '../../ui';
import { EVENT_KINDS, centuryLabel, countByKind, filterEvents, groupByCentury, resolveIds, toggleKind, type EventKind } from './model';
import { CONFIDENCE_TEXT, EVENT_KIND_TEXT, S } from './strings';

export interface TimelineProps {
  events: readonly CultureTimelineEvent[];
  kinds: EventKind[];
  onKinds(kinds: EventKind[]): void;
  getPlace(id: string): CulturePlace | undefined;
  onShowPlace(placeId: string): void;
  /** Event to scroll to and focus (set by the place panel); cleared via onFocused. */
  focusEventId: string | null;
  onFocused(): void;
}

export const eventDomId = (id: string) => `tl-${id}`;
const centuryDomId = (c: number) => `tl-c${c < 0 ? `m${-c}` : c}`;

export function Timeline({ events, kinds, onKinds, getPlace, onShowPlace, focusEventId, onFocused }: TimelineProps) {
  const { t } = useI18n();
  const shown = filterEvents(events, kinds);
  const groups = groupByCentury(shown);
  const counts = countByKind(events, EVENT_KINDS);

  // Focus a requested event once it is rendered (its kind may be re-enabled in the same click).
  const shownKey = shown.map((e) => e.id).join(',');
  useEffect(() => {
    if (!focusEventId) return;
    const el = document.getElementById(eventDomId(focusEventId));
    if (!el) {
      if (!events.some((e) => e.id === focusEventId)) onFocused();
      return;
    }
    el.scrollIntoView?.({ block: 'center' });
    el.focus({ preventScroll: true });
    onFocused();
  }, [focusEventId, onFocused, shownKey, events]);

  const jump = (c: number) => {
    const el = document.getElementById(centuryDomId(c));
    el?.scrollIntoView?.({ block: 'start' });
    el?.focus({ preventScroll: true });
  };

  return (
    <section className="cu-section cu-timeline" aria-labelledby="cu-tl-h" id="cu-timeline">
      <header className="cu-section__head">
        <h2 id="cu-tl-h" className="cu-h2" tabIndex={-1}>
          {t(S.tlH)}
        </h2>
        <p className="cu-small cl-muted cu-measure">{t(S.tlLead)}</p>
      </header>

      <fieldset className="cu-fieldset">
        <legend className="cl-eyebrow">{t(S.tlKinds)}</legend>
        <div className="cu-chips">
          {EVENT_KINDS.map((k) => (
            <Chip
              key={k}
              selected={kinds.includes(k)}
              onChange={() => {
                audio.play('select');
                onKinds(toggleKind(kinds, k, EVENT_KINDS));
              }}
              data-testid={`tl-kind-${k}`}
              className={`cu-chip cu-chip--${k}`}
            >
              {t(EVENT_KIND_TEXT[k].many)} <span className="cu-count">({counts[k]})</span>
            </Chip>
          ))}
        </div>
      </fieldset>
      <p className="cu-small" role="status" data-testid="tl-count">
        {t(S.tlShowing(shown.length, events.length))}
      </p>

      {groups.length > 1 && (
        <nav className="cu-jump" aria-label={t(S.tlJump)}>
          <span className="cl-eyebrow" aria-hidden="true">
            {t(S.tlJump)}
          </span>
          <ul>
            {groups.map((g) => (
              <li key={g.century}>
                <button type="button" className="cu-jump__btn" onClick={() => jump(g.century)}>
                  {t(centuryLabel(g.century))}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {shown.length === 0 ? (
        <EmptyState
          art={<Illustration name="world-map" />}
          title={t(S.tlNone)}
          action={
            <Button variant="secondary" onClick={() => onKinds([...EVENT_KINDS])}>
              {t(S.tlAll)}
            </Button>
          }
        />
      ) : (
        <ol className="cu-tl" data-testid="culture-timeline">
          {groups.map((g) => (
            <li key={g.century} className="cu-tl__century">
              <h3 id={centuryDomId(g.century)} className="cu-tl__ch" tabIndex={-1}>
                {t(centuryLabel(g.century))}
              </h3>
              <ol className="cu-tl__events">
                {g.events.map((e) => (
                  <li key={e.id}>
                    <EventCard event={e} place={e.placeId ? getPlace(e.placeId) : undefined} onShowPlace={onShowPlace} />
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function EventCard({ event: e, place, onShowPlace }: { event: CultureTimelineEvent; place: CulturePlace | undefined; onShowPlace(id: string): void }) {
  const { t } = useI18n();
  const drinks = resolveIds(e.relatedDrinkIds, getDrink);
  const lessons = resolveIds(e.relatedLessonIds, getLesson);
  const legend = e.kind === 'legend';
  const conf = CONFIDENCE_TEXT[e.confidence];
  const titleId = `${eventDomId(e.id)}-h`;
  return (
    <article
      id={eventDomId(e.id)}
      className={`cu-ev cu-ev--${e.kind}${e.disputed ? ' cu-ev--disputed' : ''}`}
      aria-labelledby={titleId}
      tabIndex={-1}
      data-testid={`tl-event-${e.id}`}
      data-kind={e.kind}
    >
      <p className="cu-ev__year">{t(e.yearLabel)}</p>
      <h4 id={titleId} className="cu-ev__title">
        {t(e.title)}
      </h4>
      <div className="cu-tags">
        {legend ? (
          <span className="cu-badge cu-badge--legend" data-testid="legend-badge">
            <Icon name="myth" size={14} /> {t(S.legendBadge)}
          </span>
        ) : (
          <Tag tone={e.kind === 'innovation' ? 'accent' : e.kind === 'culture' ? 'culture' : 'neutral'}>{t(EVENT_KIND_TEXT[e.kind].one)}</Tag>
        )}
        {e.disputed && (
          <span className="cu-badge cu-badge--disputed" title={t(S.disputedNote)} data-testid="disputed-badge">
            <Icon name="warning" size={14} /> {t(S.disputed)}
          </span>
        )}
        <Tag tone="info" icon="shield" title={t(conf.detail)}>
          {t(conf.label)}
        </Tag>
      </div>
      {legend && <p className="cu-ev__legendnote">{t(S.legendNote)}</p>}
      <p className="cu-ev__body">{t(e.body)}</p>
      {(place || drinks.length > 0 || lessons.length > 0) && (
        <div className="cu-ev__links">
          {place && (
            <Button variant="ghost" size="sm" icon="map" onClick={() => onShowPlace(place.id)} data-testid={`tl-show-${e.id}`}>
              {t(S.showOnMap(t(place.name)))}
            </Button>
          )}
          {drinks.map((d) => (
            <Link key={d.id} className="cu-pill" to={`/atlas/${encodeURIComponent(d.id)}`}>
              <Icon name="cup" size={14} /> {t(d.name)}
            </Link>
          ))}
          {lessons.map((l) => (
            <Link key={l.id} className="cu-pill" to={`/learn/${encodeURIComponent(l.id)}`}>
              <Icon name="book" size={14} /> {t(l.title)}
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
