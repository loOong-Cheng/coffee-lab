/**
 * Map math for the Culture Explorer — pure, no DOM.
 *
 * Projection: plain equirectangular (plate carrée). 1 map unit = 1 degree.
 *   x = lon + 180        (0 … 360, west → east)
 *   y = LAT_TOP − lat    (0 … WORLD_H, north → south)
 * The map is cropped to LAT_TOP … LAT_BOTTOM (no Antarctica, no polar ice) — every coffee
 * place sits far inside that band.
 *
 * View: a rectangle of the world described by its centre (cx, cy) and width w; its height is
 * w / aspect, where aspect = the on-screen width:height of the map frame. The view never
 * leaves the world and never shows more than the whole world.
 */

export const LAT_TOP = 84;
export const LAT_BOTTOM = -58;
export const WORLD_W = 360;
export const WORLD_H = LAT_TOP - LAT_BOTTOM;
/** Coffee belt: commonly described as the band between the Tropics of Cancer and Capricorn. */
export const TROPIC_LAT = 23.44;
export const MAX_ZOOM = 8;
export const ZOOM_STEP = 2;
/** Aspect of the full world frame on wide screens (whole world visible at zoom 1). */
export const DESKTOP_ASPECT = WORLD_W / WORLD_H;
/** Taller frame on phones: shows ~60% of the world's width at zoom 1, pan for the rest. */
export const PHONE_ASPECT = 1.5;

export interface Point {
  x: number;
  y: number;
}

export interface View {
  cx: number;
  cy: number;
  /** Width of the visible area in map units (degrees of longitude). */
  w: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** lat/lon (degrees) → map units. Latitude is clamped to the cropped band. */
export function project(lat: number, lon: number): Point {
  const la = Number.isFinite(lat) ? clamp(lat, LAT_BOTTOM, LAT_TOP) : 0;
  const lo = Number.isFinite(lon) ? clamp(lon, -180, 180) : 0;
  return { x: lo + 180, y: LAT_TOP - la };
}

/** Map units → lat/lon (inverse of project, for tests and debugging). */
export function unproject(p: Point): { lat: number; lon: number } {
  return { lat: LAT_TOP - p.y, lon: p.x - 180 };
}

/** Widest view that still fits inside the world for this frame aspect. */
export function maxViewWidth(aspect: number): number {
  const a = aspect > 0 && Number.isFinite(aspect) ? aspect : DESKTOP_ASPECT;
  return Math.min(WORLD_W, WORLD_H * a);
}

export const viewHeight = (v: View, aspect: number) => v.w / aspect;

/** Keep the view's width within [max/MAX_ZOOM, max] and its rectangle inside the world. */
export function clampView(v: View, aspect: number): View {
  const maxW = maxViewWidth(aspect);
  const w = clamp(Number.isFinite(v.w) ? v.w : maxW, maxW / MAX_ZOOM, maxW);
  const h = w / aspect;
  const cx = clamp(Number.isFinite(v.cx) ? v.cx : WORLD_W / 2, w / 2, WORLD_W - w / 2);
  const cy = clamp(Number.isFinite(v.cy) ? v.cy : WORLD_H / 2, h / 2, WORLD_H - h / 2);
  return { cx, cy, w };
}

/**
 * Starting view. Wide frames see the whole world; narrow (phone) frames start on the coffee belt
 * between Central America and East Africa / Arabia, and pan for the rest.
 */
export function initialView(aspect: number): View {
  const w = maxViewWidth(aspect);
  const full = w >= WORLD_W - 1e-9;
  return clampView({ cx: full ? WORLD_W / 2 : 180 - 10, cy: LAT_TOP - 8, w }, aspect);
}

export function zoomLevel(v: View, aspect: number): number {
  return maxViewWidth(aspect) / v.w;
}

export function canZoomIn(v: View, aspect: number): boolean {
  return zoomLevel(v, aspect) < MAX_ZOOM - 1e-6;
}

export function canZoomOut(v: View, aspect: number): boolean {
  return zoomLevel(v, aspect) > 1 + 1e-6;
}

/** Zoom by `factor` (>1 = in) around an optional focus point (default: the view centre). */
export function zoomBy(v: View, factor: number, aspect: number, focus?: Point): View {
  if (!(factor > 0)) return clampView(v, aspect);
  const next = clampView({ ...v, w: v.w / factor }, aspect);
  if (!focus) return clampView({ ...next, cx: v.cx, cy: v.cy }, aspect);
  // Keep the focus point at the same relative screen position.
  const k = next.w / v.w;
  return clampView({ w: next.w, cx: focus.x + (v.cx - focus.x) * k, cy: focus.y + (v.cy - focus.y) * k }, aspect);
}

/** Pan by a fraction of the visible width/height (dx: +1 = one full view to the east). */
export function panBy(v: View, dx: number, dy: number, aspect: number): View {
  return clampView({ ...v, cx: v.cx + dx * v.w, cy: v.cy + dy * (v.w / aspect) }, aspect);
}

export function canPan(v: View, aspect: number): { west: boolean; east: boolean; north: boolean; south: boolean } {
  const h = v.w / aspect;
  const e = 1e-6;
  return {
    west: v.cx - v.w / 2 > e,
    east: v.cx + v.w / 2 < WORLD_W - e,
    north: v.cy - h / 2 > e,
    south: v.cy + h / 2 < WORLD_H - e,
  };
}

/** Centre on a point, optionally ensuring at least `minZoom`. */
export function centerOn(v: View, p: Point, aspect: number, minZoom = 1): View {
  const maxW = maxViewWidth(aspect);
  const w = Math.min(v.w, maxW / Math.max(1, minZoom));
  return clampView({ cx: p.x, cy: p.y, w }, aspect);
}

/** Smallest view (within zoom limits) that contains every point plus `padUnits` of margin. */
export function fitPoints(points: Point[], aspect: number, padUnits = 6): View {
  if (points.length === 0) return initialView(aspect);
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  const needW = Math.max(maxX - minX + padUnits * 2, (maxY - minY + padUnits * 2) * aspect);
  return clampView({ cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, w: needW }, aspect);
}

export function isInView(v: View, p: Point, aspect: number): boolean {
  const h = v.w / aspect;
  return p.x >= v.cx - v.w / 2 && p.x <= v.cx + v.w / 2 && p.y >= v.cy - h / 2 && p.y <= v.cy + h / 2;
}

/** Position of a point inside the frame, in percent of the frame's width/height. */
export function toPercent(v: View, p: Point, aspect: number): { left: number; top: number } {
  const h = v.w / aspect;
  return { left: ((p.x - (v.cx - v.w / 2)) / v.w) * 100, top: ((p.y - (v.cy - h / 2)) / h) * 100 };
}

/** SVG viewBox string for a view. */
export function viewBoxOf(v: View, aspect: number): string {
  const h = v.w / aspect;
  const r = (n: number) => Math.round(n * 1000) / 1000;
  return `${r(v.cx - v.w / 2)} ${r(v.cy - h / 2)} ${r(v.w)} ${r(h)}`;
}

// ───────────────────────── marker clustering ─────────────────────────

export interface Marker {
  id: string;
  x: number;
  y: number;
}

export interface Cluster {
  /** Stable key: the first member's id. */
  key: string;
  ids: string[];
  x: number;
  y: number;
}

/**
 * Greedy screen-space clustering so 44px hit areas never pile on top of each other.
 * `minDist` is in map units (= minimum pixel gap / pixels per unit). Markers are taken in the
 * given order; each joins the first existing cluster whose anchor is closer than `minDist`.
 * minDist ≤ 0 disables clustering (every marker is its own cluster).
 */
export function clusterMarkers(markers: Marker[], minDist: number): Cluster[] {
  const clusters: { anchor: Point; ids: string[]; sx: number; sy: number }[] = [];
  for (const m of markers) {
    let home: (typeof clusters)[number] | undefined;
    if (minDist > 0) {
      const d2 = minDist * minDist;
      home = clusters.find((c) => (c.anchor.x - m.x) ** 2 + (c.anchor.y - m.y) ** 2 < d2);
    }
    if (home) {
      home.ids.push(m.id);
      home.sx += m.x;
      home.sy += m.y;
    } else {
      clusters.push({ anchor: { x: m.x, y: m.y }, ids: [m.id], sx: m.x, sy: m.y });
    }
  }
  return clusters.map((c) => ({ key: c.ids[0]!, ids: c.ids, x: c.sx / c.ids.length, y: c.sy / c.ids.length }));
}
