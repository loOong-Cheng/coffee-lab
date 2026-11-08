import { describe, expect, it } from 'vitest';
import { ringsToPath, worldPaths } from './geo/paths';
import { LAND } from './geo/worldOutline';
import {
  DESKTOP_ASPECT,
  LAT_TOP,
  MAX_ZOOM,
  PHONE_ASPECT,
  WORLD_H,
  WORLD_W,
  canPan,
  canZoomIn,
  canZoomOut,
  centerOn,
  clampView,
  clusterMarkers,
  fitPoints,
  initialView,
  isInView,
  maxViewWidth,
  panBy,
  project,
  toPercent,
  unproject,
  viewBoxOf,
  zoomBy,
  zoomLevel,
} from './projection';

describe('equirectangular projection', () => {
  it('maps lon/lat linearly: 1 unit = 1 degree, north up, west left', () => {
    expect(project(0, 0)).toEqual({ x: 180, y: LAT_TOP });
    expect(project(LAT_TOP, -180)).toEqual({ x: 0, y: 0 });
    expect(project(-58, 180)).toEqual({ x: 360, y: WORLD_H });
    // Addis Ababa (9.03 N, 38.74 E) is east of and north of (0,0)
    const addis = project(9.03, 38.74);
    expect(addis.x).toBeCloseTo(218.74);
    expect(addis.y).toBeCloseTo(LAT_TOP - 9.03);
  });

  it('round-trips and clamps out-of-band / invalid input', () => {
    const back = unproject(project(-21.5, -45.4));
    expect(back.lat).toBeCloseTo(-21.5, 9);
    expect(back.lon).toBeCloseTo(-45.4, 9);
    expect(project(89, 0).y).toBe(0); // clamped to LAT_TOP
    expect(project(-80, 0).y).toBe(WORLD_H); // clamped to LAT_BOTTOM
    expect(project(Number.NaN, 400)).toEqual({ x: 360, y: LAT_TOP });
  });
});

describe('view math', () => {
  it('desktop frame shows the whole world at zoom 1; phone frame shows part of it', () => {
    expect(maxViewWidth(DESKTOP_ASPECT)).toBeCloseTo(WORLD_W);
    const v = initialView(DESKTOP_ASPECT);
    expect(v).toEqual({ cx: 180, cy: WORLD_H / 2, w: WORLD_W });
    expect(zoomLevel(v, DESKTOP_ASPECT)).toBeCloseTo(1);
    expect(canZoomOut(v, DESKTOP_ASPECT)).toBe(false);
    expect(canPan(v, DESKTOP_ASPECT)).toEqual({ west: false, east: false, north: false, south: false });

    const p = initialView(PHONE_ASPECT);
    expect(p.w).toBeCloseTo(WORLD_H * PHONE_ASPECT);
    expect(p.w / PHONE_ASPECT).toBeCloseTo(WORLD_H); // full height visible
    const pan = canPan(p, PHONE_ASPECT);
    expect(pan.west || pan.east).toBe(true);
    // Starts on the coffee belt between the Americas and East Africa
    expect(isInView(p, project(5.07, -75.52), PHONE_ASPECT)).toBe(true); // Colombia
    expect(isInView(p, project(9.03, 38.74), PHONE_ASPECT)).toBe(true); // Addis Ababa
  });

  it('clamps zoom to [1, MAX_ZOOM] and keeps the view inside the world', () => {
    const a = DESKTOP_ASPECT;
    let v = initialView(a);
    for (let i = 0; i < 10; i++) v = zoomBy(v, 2, a);
    expect(zoomLevel(v, a)).toBeCloseTo(MAX_ZOOM);
    expect(canZoomIn(v, a)).toBe(false);
    v = panBy(v, -100, -100, a); // far north-west
    expect(v.cx - v.w / 2).toBeCloseTo(0);
    expect(v.cy - v.w / a / 2).toBeCloseTo(0);
    const wild = clampView({ cx: Number.NaN, cy: 9999, w: -5 }, a);
    expect(wild.w).toBeCloseTo(WORLD_W / MAX_ZOOM);
    expect(wild.cy + wild.w / a / 2).toBeCloseTo(WORLD_H);
  });

  it('zooming around a focus point keeps that point under the same screen position', () => {
    const a = DESKTOP_ASPECT;
    const v = initialView(a);
    const focus = project(13.32, 43.25); // Mocha
    const before = toPercent(v, focus, a);
    const z = zoomBy(v, 2, a, focus);
    const after = toPercent(z, focus, a);
    expect(after.left).toBeCloseTo(before.left, 5);
    expect(after.top).toBeCloseTo(before.top, 5);
  });

  it('centerOn / fitPoints / toPercent / viewBox agree', () => {
    const a = DESKTOP_ASPECT;
    const addis = project(9.03, 38.74);
    const c = centerOn(initialView(a), addis, a, 4);
    expect(zoomLevel(c, a)).toBeCloseTo(4);
    expect(toPercent(c, addis, a).left).toBeCloseTo(50);
    expect(toPercent(c, addis, a).top).toBeCloseTo(50);
    // Near the edge the view is clamped inside the world instead of centring
    const tokyo = project(35.71, 139.77);
    const edge = centerOn(initialView(a), tokyo, a, 4);
    expect(edge.cx + edge.w / 2).toBeCloseTo(WORLD_W);
    expect(isInView(edge, tokyo, a)).toBe(true);
    const pts = [project(48.21, 16.37), project(45.43, 12.34), project(48.85, 2.34)];
    const f = fitPoints(pts, a, 2);
    for (const p of pts) expect(isInView(f, p, a)).toBe(true);
    expect(zoomLevel(f, a)).toBeGreaterThan(4);
    const [x, y, w, h] = viewBoxOf(f, a).split(' ').map(Number);
    expect(w).toBeCloseTo(f.w, 2);
    expect(h).toBeCloseTo(f.w / a, 2);
    expect(x).toBeCloseTo(f.cx - f.w / 2, 2);
    expect(y).toBeCloseTo(f.cy - f.w / a / 2, 2);
    expect(fitPoints([], a)).toEqual(initialView(a));
  });
});

describe('marker clustering', () => {
  const m = (id: string, x: number, y: number) => ({ id, x, y });

  it('merges markers closer than minDist and averages their position', () => {
    const out = clusterMarkers([m('a', 0, 0), m('b', 3, 0), m('c', 50, 50)], 5);
    expect(out).toHaveLength(2);
    expect(out[0]).toEqual({ key: 'a', ids: ['a', 'b'], x: 1.5, y: 0 });
    expect(out[1]!.ids).toEqual(['c']);
  });

  it('minDist ≤ 0 disables clustering', () => {
    expect(clusterMarkers([m('a', 0, 0), m('b', 0, 0)], 0)).toHaveLength(2);
  });
});

describe('world outline (original data)', () => {
  it('builds closed SVG paths in map units from every ring', () => {
    const d = ringsToPath(LAND);
    expect(d.match(/M/g)).toHaveLength(LAND.length);
    expect(d.match(/Z/g)).toHaveLength(LAND.length);
    const nums = d.replace(/[MLZ]/g, ' ').trim().split(/\s+/).map(Number);
    expect(nums.every((n) => Number.isFinite(n) && n >= 0 && n <= WORLD_W)).toBe(true);
    expect(worldPaths().land).toBe(d);
    expect(worldPaths().seas.length).toBeGreaterThan(0);
  });
});
