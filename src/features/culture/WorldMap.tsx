/**
 * Stylized world map: decorative SVG backdrop (aria-hidden) + real HTML <button> markers on top,
 * so every place is keyboard/touch reachable with a ≥44px hit area and a visible focus ring.
 * Zoom/pan with buttons (and +/−/arrow keys inside the map group) — no gesture-only controls.
 * Nearby markers merge into a numbered cluster button that zooms in, so hit areas never pile up.
 */
import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, RefObject } from 'react';
import type { CulturePlace } from '../../domain/contracts';
import { useI18n } from '../../i18n';
import { IconButton } from '../../ui';
import { worldPaths } from './geo/paths';
import { KindMark } from './KindMark';
import {
  LAT_TOP,
  TROPIC_LAT,
  WORLD_H,
  WORLD_W,
  canPan,
  canZoomIn,
  canZoomOut,
  clusterMarkers,
  fitPoints,
  initialView,
  isInView,
  project,
  toPercent,
  viewBoxOf,
  zoomBy,
  zoomLevel,
  panBy,
  ZOOM_STEP,
  type View,
} from './projection';
import { PLACE_KIND_TEXT, S } from './strings';

/** Minimum distance between marker centres, in CSS px (hit areas are 44px). */
const MIN_GAP_PX = 40;

function useElementWidth<T extends HTMLElement>(): [RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(el.getBoundingClientRect().width);
    measure();
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => ro.disconnect();
    }
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);
  return [ref, width];
}

export interface WorldMapProps {
  places: CulturePlace[];
  totalPlaces: number;
  selectedId: string | null;
  view: View;
  aspect: number;
  onView(next: View): void;
  onSelect(id: string): void;
  /** Markers that cannot be separated even at max zoom. */
  onChooser(ids: string[]): void;
}

export function WorldMap({ places, totalPlaces, selectedId, view, aspect, onView, onSelect, onChooser }: WorldMapProps) {
  const { t } = useI18n();
  const hintId = useId();
  const clipId = useId().replace(/:/g, '');
  const [frameRef, frameWidth] = useElementWidth<HTMLDivElement>();
  const paths = worldPaths();

  const projected = useMemo(() => places.map((p) => ({ place: p, pt: project(p.lat, p.lon) })), [places]);
  // West → east, then north → south: spatial Tab order and deterministic clustering.
  const visible = projected.filter((m) => isInView(view, m.pt, aspect)).sort((a, b) => a.pt.x - b.pt.x || a.pt.y - b.pt.y);
  const pxPerUnit = frameWidth > 0 ? frameWidth / view.w : 0;
  const minDist = pxPerUnit > 0 ? MIN_GAP_PX / pxPerUnit : 0;
  const clusters = clusterMarkers(
    visible.filter((m) => m.place.id !== selectedId).map((m) => ({ id: m.place.id, x: m.pt.x, y: m.pt.y })),
    minDist,
  );
  const byId = new Map(projected.map((m) => [m.place.id, m]));
  const selected = selectedId ? byId.get(selectedId) : undefined;
  const selectedVisible = selected && isInView(view, selected.pt, aspect) ? selected : undefined;

  const zoom = zoomLevel(view, aspect);
  const pan = canPan(view, aspect);
  const beltTop = LAT_TOP - TROPIC_LAT;
  const beltBottom = LAT_TOP + TROPIC_LAT;
  const equator = LAT_TOP;

  const zoomIn = () => onView(zoomBy(view, ZOOM_STEP, aspect, selectedVisible?.pt));
  const zoomOut = () => onView(zoomBy(view, 1 / ZOOM_STEP, aspect));
  const move = (dx: number, dy: number) => onView(panBy(view, dx, dy, aspect));

  const openCluster = (ids: string[]) => {
    const pts = ids.map((id) => byId.get(id)!.pt);
    if (!canZoomIn(view, aspect)) {
      onChooser(ids);
      return;
    }
    let next = fitPoints(pts, aspect, 3);
    if (next.w >= view.w * 0.75) {
      const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
      const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
      next = zoomBy({ ...view, cx, cy }, ZOOM_STEP, aspect);
    }
    onView(next);
  };

  /** aria-disabled (not `disabled`) so a button that just hit its limit keeps keyboard focus. */
  const act = (enabled: boolean, fn: () => void) => ({ 'aria-disabled': enabled ? undefined : true, onClick: enabled ? fn : undefined });

  // Keyboard zoom/pan only on the controls: panning while a marker has focus could remove it from view.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const k = e.key;
    let handled = true;
    if (k === '+' || k === '=') {
      if (canZoomIn(view, aspect)) zoomIn();
    } else if (k === '-' || k === '_') {
      if (canZoomOut(view, aspect)) zoomOut();
    }
    else if (k === 'ArrowLeft') move(-0.25, 0);
    else if (k === 'ArrowRight') move(0.25, 0);
    else if (k === 'ArrowUp') move(0, -0.25);
    else if (k === 'ArrowDown') move(0, 0.25);
    else handled = false;
    if (handled) e.preventDefault();
  };

  const nameOf = (id: string) => t(byId.get(id)!.place.name);
  const pinCount = clusters.length + (selectedVisible ? 1 : 0);

  return (
    <div className="cu-map" role="group" aria-label={t(S.mapLabel)} aria-describedby={hintId} data-testid="culture-map">
      <div className="cu-map__frame" ref={frameRef} style={{ aspectRatio: `${aspect}` }}>
        <svg className="cu-map__svg" viewBox={viewBoxOf(view, aspect)} preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <defs>
            <clipPath id={`${clipId}-belt`}>
              <rect x={0} y={beltTop} width={WORLD_W} height={beltBottom - beltTop} />
            </clipPath>
          </defs>
          <rect className="cu-ocean" x={0} y={0} width={WORLD_W} height={WORLD_H} />
          <rect className="cu-belt" x={0} y={beltTop} width={WORLD_W} height={beltBottom - beltTop} />
          <path className="cu-land" d={paths.land} />
          <path className="cu-land cu-land--belt" d={paths.land} clipPath={`url(#${clipId}-belt)`} />
          <path className="cu-sea" d={paths.seas} />
          <line className="cu-tropic" x1={0} x2={WORLD_W} y1={beltTop} y2={beltTop} />
          <line className="cu-tropic" x1={0} x2={WORLD_W} y1={beltBottom} y2={beltBottom} />
          <line className="cu-equator" x1={0} x2={WORLD_W} y1={equator} y2={equator} />
        </svg>

        <ul className="cu-pins" aria-label={t(S.inView(visible.length, totalPlaces))}>
          {clusters.map((c) => {
            const pos = toPercent(view, c, aspect);
            if (c.ids.length === 1) {
              const m = byId.get(c.ids[0]!)!;
              return (
                <li key={c.key} className="cu-pin-li" style={{ left: `${pos.left}%`, top: `${pos.top}%` }}>
                  <Pin place={m.place} selected={false} flip={pos.left > 70} onSelect={onSelect} />
                </li>
              );
            }
            const names = c.ids.map(nameOf);
            return (
              <li key={c.key} className="cu-pin-li" style={{ left: `${pos.left}%`, top: `${pos.top}%` }}>
                <button
                  type="button"
                  className="cu-cluster"
                  aria-label={t(S.cluster(c.ids.length, names.join(', ')))}
                  title={names.join(' · ')}
                  data-cluster={c.ids.join(' ')}
                  onClick={() => openCluster(c.ids)}
                >
                  <span className="cu-cluster__dot" aria-hidden="true">
                    {c.ids.length}
                  </span>
                </button>
              </li>
            );
          })}
          {selectedVisible && (
            <li
              key={`sel-${selectedVisible.place.id}`}
              className="cu-pin-li cu-pin-li--selected"
              style={{ left: `${toPercent(view, selectedVisible.pt, aspect).left}%`, top: `${toPercent(view, selectedVisible.pt, aspect).top}%` }}
            >
              <Pin place={selectedVisible.place} selected flip={toPercent(view, selectedVisible.pt, aspect).left > 70} onSelect={onSelect} />
            </li>
          )}
        </ul>
        {pinCount === 0 && places.length > 0 && (
          <p className="cu-map__empty" role="status">
            {t(S.noneInView)}
          </p>
        )}
      </div>

      <div className="cu-map__bar">
        <div className="cu-map__controls" role="group" aria-label={t(S.controls)} onKeyDown={onKeyDown}>
          <IconButton icon="plus" label={t(S.zoomIn)} variant="secondary" {...act(canZoomIn(view, aspect), zoomIn)} data-testid="map-zoom-in" />
          <IconButton icon="minus" label={t(S.zoomOut)} variant="secondary" {...act(canZoomOut(view, aspect), zoomOut)} data-testid="map-zoom-out" />
          <span className="cu-map__sep" aria-hidden="true" />
          <IconButton icon="back" label={t(S.panW)} variant="secondary" {...act(pan.west, () => move(-0.25, 0))} data-testid="map-pan-w" />
          <IconButton icon="chevron-up" label={t(S.panN)} variant="secondary" {...act(pan.north, () => move(0, -0.25))} />
          <IconButton icon="chevron-down" label={t(S.panS)} variant="secondary" {...act(pan.south, () => move(0, 0.25))} />
          <IconButton icon="next" label={t(S.panE)} variant="secondary" {...act(pan.east, () => move(0.25, 0))} data-testid="map-pan-e" />
          <span className="cu-map__sep" aria-hidden="true" />
          <IconButton icon="globe" label={t(S.reset)} variant="ghost" onClick={() => onView(initialView(aspect))} data-testid="map-reset" />
        </div>
        <p className="cu-map__status" aria-live="polite">
          <span className="cl-num">{t(S.zoomStatus(Math.round(zoom * 10) / 10))}</span> · {t(S.inView(visible.length, totalPlaces))}
        </p>
      </div>
      <p id={hintId} className="cu-small cl-muted">
        {t(S.mapHint)} <span className="cu-desktop-only">{t(S.mapKeys)}</span>
      </p>
    </div>
  );
}

function Pin({ place, selected, flip, onSelect }: { place: CulturePlace; selected: boolean; flip: boolean; onSelect(id: string): void }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      className={`cu-pin${flip ? ' cu-pin--flip' : ''}`}
      aria-pressed={selected}
      data-place-id={place.id}
      data-kind={place.kind}
      data-testid={`map-pin-${place.id}`}
      onClick={() => onSelect(place.id)}
    >
      <KindMark kind={place.kind} size={selected ? 24 : 18} className="cu-pin__mark" />
      <span className="cu-pin__label">
        {t(place.name)}
        <span className="cl-visually-hidden">, {t(PLACE_KIND_TEXT[place.kind].one)}</span>
      </span>
    </button>
  );
}
