/**
 * Dial-in chart model (pure, unit-tested): the learner's OWN logged attempts of one drink, time vs ratio,
 * in the order they were logged. The shaded "common starting zone" is an illustrative rule of thumb
 * taken from the curriculum (espresso "normal" ≈ 1:1.5–1:2.5 in ~25–35 s; pour-over 1:15–1:17 in
 * ~2:30–4:00 single cup) — never a target or a grade. No values are interpolated or invented: entries without both
 * a time and a ratio are listed as "not plotted".
 */
import type { BrewLogEntry, DrinkCategory, LocalizedText } from '../../domain/contracts';
import { entryRatio } from './model';

export interface DialInPoint {
  id: string;
  /** 1-based order among this drink's plotted attempts (oldest = 1). */
  n: number;
  timeSec: number;
  ratio: number;
  createdAt: string;
  doseG?: number;
  outG?: number;
  latest: boolean;
  /** The logged time came from an in-app timer (BrewLogEntry.timeSource). */
  timedInApp: boolean;
}

export interface DialInSeries {
  points: DialInPoint[];
  /** This drink's entries that lack a time or a dose/output pair (not plotted, never guessed). */
  unplotted: BrewLogEntry[];
}

const byOldest = (a: BrewLogEntry, b: BrewLogEntry) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0);

export function dialInSeries(entries: readonly BrewLogEntry[], drinkId: string): DialInSeries {
  const mine = entries.filter((e) => e.drinkId === drinkId).sort(byOldest);
  const points: DialInPoint[] = [];
  const unplotted: BrewLogEntry[] = [];
  for (const e of mine) {
    const ratio = entryRatio(e);
    if (ratio === null || ratio <= 0 || e.timeSec == null || !Number.isFinite(e.timeSec) || e.timeSec <= 0) {
      unplotted.push(e);
      continue;
    }
    points.push({ id: e.id, n: points.length + 1, timeSec: e.timeSec, ratio, createdAt: e.createdAt, doseG: e.doseG, outG: e.outG, latest: false, timedInApp: e.timeSource === 'app-timer' });
  }
  if (points.length) points[points.length - 1]!.latest = true;
  return { points, unplotted };
}

/** Fewer than two plotted attempts → show the empty state instead of a one-dot "path". */
export const MIN_POINTS = 2;

export interface DialInZone {
  timeSec: [number, number];
  ratio: [number, number];
  /** Where the numbers come from (shown with the chart). */
  basis: LocalizedText;
}

const L = (zh: string, en: string): LocalizedText => ({ zh, en });

/** Ratio bands for espresso styles (curriculum: ristretto ≈1:1–1:1.5, normal ≈1:2, lungo ≈1:2.5–1:3). */
const ESPRESSO_RATIO: Record<string, [number, number]> = {
  ristretto: [1, 1.5],
  lungo: [2.5, 3],
};

/** Time references authored in the Drink Atlas (timeNote) where they differ from the defaults. */
const ZONE_TIME: Record<string, [number, number]> = {
  ristretto: [20, 30],
  lungo: [30, 45],
  'pourover-cone': [150, 240],
  'chemex-brew': [240, 300],
};

export interface ZoneInput {
  drinkId: string;
  category?: DrinkCategory;
}

/** The illustrative "common starting zone" for a drink, or null when the curriculum gives none. */
export function zoneFor(z: ZoneInput): DialInZone | null {
  const timeOverride = ZONE_TIME[z.drinkId];
  if (z.category === 'espresso' || z.category === 'espresso-milk') {
    const ratio = ESPRESSO_RATIO[z.drinkId] ?? [1.5, 2.5];
    const time: [number, number] = timeOverride ?? [25, 35];
    return {
      timeSec: time,
      ratio,
      basis: L(
        `常见起点（示意）：约 1:${ratio[0]}–1:${ratio[1]}，${time[0]}–${time[1]} 秒。不是目标，也不是评分——味道说了算。`,
        `Common starting zone (illustrative): about 1:${ratio[0]}–1:${ratio[1]} in ${time[0]}–${time[1]} s. Not a target or a grade — taste decides.`,
      ),
    };
  }
  if (z.category === 'pourover') {
    const time: [number, number] = timeOverride ?? [150, 240];
    const mm = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    return {
      timeSec: time,
      ratio: [15, 17],
      basis: L(
        `常见起点（示意）：约 1:15–1:17，总时间 ${mm(time[0])}–${mm(time[1])}。不是目标，也不是评分——味道说了算。`,
        `Common starting zone (illustrative): about 1:15–1:17 in ${mm(time[0])}–${mm(time[1])} total. Not a target or a grade — taste decides.`,
      ),
    };
  }
  return null;
}

// ───────────────────────── scales ─────────────────────────

export interface ChartBox {
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface DialInScales {
  x(sec: number): number;
  y(ratio: number): number;
  xDomain: [number, number];
  yDomain: [number, number];
  xTicks: number[];
  yTicks: number[];
}

/** A "nice" step (1, 2, 2.5, 5 × 10^k) giving roughly `count` intervals over `span`. */
export function niceStep(span: number, count: number): number {
  if (!(span > 0) || !(count > 0)) return 1;
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const f = raw / mag;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nice * mag;
}

function niceDomain(lo: number, hi: number, count: number): { domain: [number, number]; ticks: number[] } {
  if (hi - lo < 1e-9) {
    const pad = Math.max(Math.abs(lo) * 0.1, 1);
    lo -= pad;
    hi += pad;
  }
  const step = niceStep(hi - lo, count);
  const d0 = Math.floor(lo / step) * step;
  const d1 = Math.ceil(hi / step) * step;
  const ticks: number[] = [];
  for (let v = d0; v <= d1 + step / 2; v += step) ticks.push(Math.round(v * 1000) / 1000);
  return { domain: [d0, d1], ticks };
}

/** Linear scales covering every point and the zone (nothing is clipped), with readable ticks. */
export function dialInScales(points: readonly Pick<DialInPoint, 'timeSec' | 'ratio'>[], zone: DialInZone | null, box: ChartBox): DialInScales {
  const xs = points.map((p) => p.timeSec);
  const ys = points.map((p) => p.ratio);
  if (zone) {
    xs.push(...zone.timeSec);
    ys.push(...zone.ratio);
  }
  const xMin = xs.length ? Math.min(...xs) : 0;
  const xMax = xs.length ? Math.max(...xs) : 60;
  const yMin = ys.length ? Math.min(...ys) : 0;
  const yMax = ys.length ? Math.max(...ys) : 3;
  const xPad = (xMax - xMin) * 0.08;
  const yPad = (yMax - yMin) * 0.08;
  const xd = niceDomain(Math.max(0, xMin - xPad), xMax + xPad, 5);
  const yd = niceDomain(Math.max(0, yMin - yPad), yMax + yPad, 4);
  const iw = box.width - box.left - box.right;
  const ih = box.height - box.top - box.bottom;
  const [x0, x1] = xd.domain;
  const [y0, y1] = yd.domain;
  return {
    x: (sec) => box.left + ((sec - x0) / (x1 - x0)) * iw,
    y: (r) => box.top + ih - ((r - y0) / (y1 - y0)) * ih,
    xDomain: xd.domain,
    yDomain: yd.domain,
    xTicks: xd.ticks,
    yTicks: yd.ticks,
  };
}

/** Is a point inside the illustrative zone? (Used only to describe the chart in words.) */
export function inZone(p: Pick<DialInPoint, 'timeSec' | 'ratio'>, zone: DialInZone | null): boolean {
  if (!zone) return false;
  return p.timeSec >= zone.timeSec[0] && p.timeSec <= zone.timeSec[1] && p.ratio >= zone.ratio[0] - 1e-9 && p.ratio <= zone.ratio[1] + 1e-9;
}

/** Default drink for the chart: the most plottable drink, espresso-family first. */
export function pickDialInDrink(entries: readonly BrewLogEntry[], isEspresso: (drinkId: string) => boolean): string | null {
  const counts = new Map<string, number>();
  for (const e of entries) {
    if (entryRatio(e) === null || e.timeSec == null) continue;
    counts.set(e.drinkId, (counts.get(e.drinkId) ?? 0) + 1);
  }
  // Drinks that can already draw a path first, then espresso-family, then the most attempts.
  const ranked = [...counts.entries()].sort(
    (a, b) =>
      Number(b[1] >= MIN_POINTS) - Number(a[1] >= MIN_POINTS) ||
      Number(isEspresso(b[0])) - Number(isEspresso(a[0])) ||
      b[1] - a[1] ||
      a[0].localeCompare(b[0]),
  );
  if (ranked.length) return ranked[0]![0];
  return entries.length ? entries[entries.length - 1]!.drinkId : null;
}
