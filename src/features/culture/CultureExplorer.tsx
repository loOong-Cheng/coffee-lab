/**
 * Culture Explorer composition: map/list + place detail + timeline. Data comes in as props
 * (the route passes real content; tests pass fixtures). Shareable state lives in the URL:
 *   ?place=<id> · view=list · kinds=origin,producer · tk=legend,history
 * The map's zoom/pan is local UI state.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { PHONE_QUERY, useMediaQuery } from '../../app/useMediaQuery';
import { audio } from '../../audio';
import type { CulturePlace, CultureTimelineEvent } from '../../domain/contracts';
import { useI18n } from '../../i18n';
import { announce, Button, Callout, Chip, EmptyState, Illustration, SegmentedControl } from '../../ui';
import { KindMark } from './KindMark';
import {
  PLACE_KINDS,
  countByKind,
  filterPlaces,
  parseEventKinds,
  parsePlaceKinds,
  serializeKinds,
  toggleKind,
  EVENT_KINDS,
  type EventKind,
  type PlaceKind,
} from './model';
import { PlaceDetail } from './PlaceDetail';
import { PlaceList } from './PlaceList';
import { DESKTOP_ASPECT, PHONE_ASPECT, centerOn, initialView, project, type View } from './projection';
import { PLACE_KIND_TEXT, S } from './strings';
import { Timeline } from './Timeline';
import { WorldMap } from './WorldMap';

type Source = 'map' | 'list' | 'timeline';

export interface CultureExplorerProps {
  places: readonly CulturePlace[];
  timeline: readonly CultureTimelineEvent[];
  /** Rendered between the map section and the timeline (e.g. links to lessons). */
  afterMap?: ReactNode;
}

function prefersReducedMotion(): boolean {
  const attr = document.documentElement.getAttribute('data-reduced-motion');
  if (attr === 'on') return true;
  if (attr === 'off') return false;
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function CultureExplorer({ places, timeline, afterMap }: CultureExplorerProps) {
  const { t, locale } = useI18n();
  const [params, setParams] = useSearchParams();
  const phone = useMediaQuery(PHONE_QUERY);
  const aspect = phone ? PHONE_ASPECT : DESKTOP_ASPECT;

  const placeKinds = parsePlaceKinds(params.get('kinds'));
  const eventKinds = parseEventKinds(params.get('tk'));
  const viewMode: 'map' | 'list' = params.get('view') === 'list' ? 'list' : 'map';
  const placeParam = params.get('place');
  const placeIndex = useMemo(() => new Map(places.map((p) => [p.id, p])), [places]);
  const selected = placeParam ? placeIndex.get(placeParam) : undefined;
  const unknownPlace = !!placeParam && !selected;
  const getPlace = useCallback((id: string) => placeIndex.get(id), [placeIndex]);

  const shownPlaces = filterPlaces(places, placeKinds, locale);
  const kindCounts = countByKind(places, PLACE_KINDS);

  // Map view (local). Re-derived when the frame aspect changes (phone ⇄ desktop).
  const [mapState, setMapState] = useState<{ aspect: number; view: View }>(() => ({ aspect, view: initialView(aspect) }));
  const view = mapState.aspect === aspect ? mapState.view : initialView(aspect);
  const setView = (next: View) => setMapState({ aspect, view: next });

  const [chooser, setChooser] = useState<string[] | null>(null);
  const [focusEventId, setFocusEventId] = useState<string | null>(null);
  const clearFocusEvent = useCallback(() => setFocusEventId(null), []);
  const pendingFocus = useRef<Source | null>(null);
  const [selTick, setSelTick] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const exploreRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) next.delete(k);
      else next.set(k, v);
    }
    setParams(next, { replace: true });
  };

  const select = (id: string, source: Source) => {
    const p = placeIndex.get(id);
    if (!p) return;
    audio.play('select');
    setChooser(null);
    pendingFocus.current = source;
    setSelTick((n) => n + 1);
    const patch: Record<string, string | null> = { place: id };
    if (!placeKinds.includes(p.kind)) patch.kinds = serializeKinds([...placeKinds, p.kind], PLACE_KINDS);
    if (source === 'timeline' && viewMode === 'list') patch.view = null;
    if (source !== 'map') setView(centerOn(view, project(p.lat, p.lon), aspect, 2));
    update(patch);
    announce(`${t(p.name)} — ${t(PLACE_KIND_TEXT[p.kind].one)}`);
  };

  // After a user selection, move focus to the detail heading (and scroll where needed).
  useEffect(() => {
    const source = pendingFocus.current;
    if (!source || !selected) return;
    pendingFocus.current = null;
    const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth';
    if (source === 'timeline') exploreRef.current?.scrollIntoView?.({ block: 'start', behavior });
    else if (phone) detailRef.current?.scrollIntoView?.({ block: 'start', behavior });
    headingRef.current?.focus({ preventScroll: true });
  }, [selTick, selected, phone]);

  const backToBrowse = () => {
    const id = selected?.id;
    const root = exploreRef.current;
    const target = (id && root?.querySelector<HTMLElement>(`[data-place-id="${id}"]`)) || root?.querySelector<HTMLElement>('[data-browse-root]');
    target?.scrollIntoView?.({ block: 'center' });
    target?.focus({ preventScroll: true });
  };

  const close = () => {
    const id = selected?.id;
    update({ place: null });
    setChooser(null);
    // Return focus to where the user came from.
    requestAnimationFrame(() => {
      const el = id ? exploreRef.current?.querySelector<HTMLElement>(`[data-place-id="${id}"]`) : null;
      (el ?? exploreRef.current?.querySelector<HTMLElement>('[data-browse-root]'))?.focus({ preventScroll: true });
    });
  };

  const showEvent = (eventId: string) => {
    const ev = timeline.find((e) => e.id === eventId);
    if (ev && !eventKinds.includes(ev.kind)) update({ tk: serializeKinds([...eventKinds, ev.kind], EVENT_KINDS) });
    setFocusEventId(eventId);
  };

  const setPlaceKinds = (kinds: PlaceKind[]) => update({ kinds: serializeKinds(kinds, PLACE_KINDS) });
  const setEventKinds = (kinds: EventKind[]) => update({ tk: serializeKinds(kinds, EVENT_KINDS) });

  const starter = places.find((p) => p.kind === 'origin') ?? places[0];

  if (places.length === 0 && timeline.length === 0) {
    return (
      <EmptyState art={<Illustration name="world-map" />} title={t(S.noData)} action={
          <Link className="cl-btn cl-btn--primary cl-btn--md" to="/atlas">
            {t(S.atlasLink)}
          </Link>
        }>
        <p>{t(S.noDataBody)}</p>
      </EmptyState>
    );
  }

  return (
    <>
      {places.length > 0 && (
        <section className="cu-section" aria-labelledby="cu-map-h">
          <header className="cu-section__head cu-section__head--row">
            <h2 id="cu-map-h" className="cu-h2">
              {t(S.mapH)}
            </h2>
            <div className="cu-viewtoggle">
              <span className="cl-eyebrow" id="cu-view-l">
                {t(S.viewLabel)}
              </span>
              <SegmentedControl<'map' | 'list'>
                labelledBy="cu-view-l"
                id="cu-view"
                value={viewMode}
                onChange={(v) => {
                  audio.play('tap');
                  update({ view: v === 'list' ? 'list' : null });
                }}
                options={[
                  { value: 'map', label: t(S.viewMap) },
                  { value: 'list', label: t(S.viewList) },
                ]}
              />
            </div>
          </header>

          <fieldset className="cu-fieldset">
            <legend className="cl-eyebrow">{t(S.kindsLegend)}</legend>
            <div className="cu-chips">
              {PLACE_KINDS.map((k) => (
                <Chip
                  key={k}
                  selected={placeKinds.includes(k)}
                  onChange={() => {
                    audio.play('select');
                    setPlaceKinds(toggleKind(placeKinds, k, PLACE_KINDS));
                  }}
                  data-testid={`place-kind-${k}`}
                  className="cu-chip"
                >
                  <KindMark kind={k} size={16} /> {t(PLACE_KIND_TEXT[k].many)} <span className="cu-count">({kindCounts[k]})</span>
                </Chip>
              ))}
            </div>
            <p className="cu-small cu-belt-legend">
              <span className="cu-belt-swatch" aria-hidden="true" /> <strong>{t(S.beltName)}:</strong> {t(S.beltNote)}
            </p>
          </fieldset>
          <p className="cu-small cl-visually-hidden" role="status">
            {t(S.showing(shownPlaces.length, places.length))}
          </p>

          <div className="cu-explore" ref={exploreRef}>
            <div className="cu-browse" data-browse-root tabIndex={-1}>
              {viewMode === 'map' ? (
                <>
                  <WorldMap
                    places={shownPlaces}
                    totalPlaces={shownPlaces.length}
                    selectedId={selected?.id ?? null}
                    view={view}
                    aspect={aspect}
                    onView={(v) => {
                      audio.play('tap');
                      setView(v);
                    }}
                    onSelect={(id) => select(id, 'map')}
                    onChooser={(ids) => {
                      setChooser(ids);
                      requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }));
                    }}
                  />
                  <p className="cu-small cl-muted">{t(S.mapArtNote)}</p>
                </>
              ) : shownPlaces.length === 0 ? (
                <EmptyState
                  title={t(S.noPlaces)}
                  action={
                    <Button variant="secondary" onClick={() => setPlaceKinds([...PLACE_KINDS])}>
                      {t(S.showAllKinds)}
                    </Button>
                  }
                />
              ) : (
                <PlaceList places={shownPlaces} selectedId={selected?.id ?? null} onSelect={(id) => select(id, 'list')} />
              )}
            </div>

            <div className="cu-aside" ref={detailRef}>
              {unknownPlace && (
                <Callout kind="info" locale={locale}>
                  {t(S.unknownPlace)}{' '}
                  <Button variant="ghost" size="sm" onClick={() => update({ place: null })}>
                    {t(S.clear)}
                  </Button>
                </Callout>
              )}
              {chooser ? (
                <section className="cu-detail" aria-labelledby="cu-detail-h" data-testid="culture-chooser">
                  <h3 id="cu-detail-h" className="cu-detail__title" tabIndex={-1} ref={headingRef}>
                    {t(S.chooserH)}
                  </h3>
                  <p>{t(S.chooserBody)}</p>
                  <ul className="cu-links">
                    {chooser.map((id) => {
                      const p = placeIndex.get(id);
                      return p ? (
                        <li key={id}>
                          <button type="button" className="cu-list__item" onClick={() => select(id, 'map')}>
                            <KindMark kind={p.kind} size={16} /> <span className="cu-list__name">{t(p.name)}</span>
                          </button>
                        </li>
                      ) : null;
                    })}
                  </ul>
                </section>
              ) : selected ? (
                <PlaceDetail
                  ref={headingRef}
                  place={selected}
                  timeline={timeline}
                  backLabel={viewMode === 'list' ? t(S.backToList) : t(S.backToMap)}
                  onBack={backToBrowse}
                  onClose={close}
                  onShowEvent={showEvent}
                />
              ) : (
                <section className="cu-detail cu-detail--intro" aria-labelledby="cu-detail-h">
                  <h3 id="cu-detail-h" className="cu-detail__title" tabIndex={-1} ref={headingRef}>
                    {t(S.pickH)}
                  </h3>
                  <p>{t(S.pickBody)}</p>
                  {starter && (
                    <Button variant="secondary" icon="map" onClick={() => select(starter.id, 'list')} data-testid="culture-start">
                      {t(S.startWith(t(starter.name)))}
                    </Button>
                  )}
                </section>
              )}
            </div>
          </div>
        </section>
      )}

      {afterMap}

      {timeline.length > 0 && (
        <Timeline
          events={timeline}
          kinds={eventKinds}
          onKinds={setEventKinds}
          getPlace={getPlace}
          onShowPlace={(id) => select(id, 'timeline')}
          focusEventId={focusEventId}
          onFocused={clearFocusEvent}
        />
      )}
    </>
  );
}
