import { describe, expect, it } from 'vitest';
import type { BrewLogEntry } from '../../domain/contracts';
import { dialInScales, dialInSeries, inZone, niceStep, pickDialInDrink, zoneFor, type ChartBox } from './dialIn';

const e = (id: string, createdAt: string, p: Partial<BrewLogEntry> = {}): BrewLogEntry => ({
  id,
  evidence: 'self_report',
  drinkId: 'espresso-shot',
  createdAt,
  ...p,
});

const J: BrewLogEntry[] = [
  e('c', '2026-11-03T08:00:00.000Z', { doseG: 18, outG: 36, timeSec: 27 }),
  e('a', '2026-11-01T08:00:00.000Z', { doseG: 18, outG: 40, timeSec: 19 }),
  e('b', '2026-11-02T08:00:00.000Z', { doseG: 18, outG: 38 }), // no time → not plotted
  e('p', '2026-11-02T09:00:00.000Z', { drinkId: 'pourover-cone', doseG: 15, outG: 250, timeSec: 185 }),
  e('d', '2026-11-04T08:00:00.000Z', { doseG: 18, outG: 34, timeSec: 31 }),
];

describe('dialInSeries', () => {
  it('orders a drink’s attempts oldest → newest, numbers them, marks only the latest; never guesses missing values', () => {
    const s = dialInSeries(J, 'espresso-shot');
    expect(s.points.map((p) => [p.id, p.n, p.timeSec, Math.round(p.ratio * 100) / 100, p.latest])).toEqual([
      ['a', 1, 19, 2.22, false],
      ['c', 2, 27, 2, false],
      ['d', 3, 31, 1.89, true],
    ]);
    expect(s.unplotted.map((x) => x.id)).toEqual(['b']);
    expect(dialInSeries(J, 'nothing').points).toEqual([]);
  });
});

describe('zoneFor (illustrative common starting zone from the curriculum)', () => {
  it('espresso family: ~1:1.5–1:2.5 in 25–35 s; ristretto/lungo use their own style band and time note', () => {
    expect(zoneFor({ drinkId: 'espresso-shot', category: 'espresso' })).toMatchObject({ timeSec: [25, 35], ratio: [1.5, 2.5] });
    expect(zoneFor({ drinkId: 'caffe-latte', category: 'espresso-milk' })).toMatchObject({ timeSec: [25, 35], ratio: [1.5, 2.5] });
    expect(zoneFor({ drinkId: 'ristretto', category: 'espresso' })).toMatchObject({ timeSec: [20, 30], ratio: [1, 1.5] });
    expect(zoneFor({ drinkId: 'lungo', category: 'espresso' })).toMatchObject({ timeSec: [30, 45], ratio: [2.5, 3] });
  });

  it('pour-over: 1:15–1:17, cone 2:30–3:30, Chemex 4–5 min; labelled illustrative; none for other drinks', () => {
    const z = zoneFor({ drinkId: 'pourover-cone', category: 'pourover' });
    expect(z).toMatchObject({ timeSec: [150, 210], ratio: [15, 17] });
    expect(z?.basis.en).toMatch(/illustrative/i);
    expect(z?.basis.en).toContain('2:30–3:30');
    expect(zoneFor({ drinkId: 'chemex-brew', category: 'pourover' })).toMatchObject({ timeSec: [240, 300] });
    expect(zoneFor({ drinkId: 'french-press-coffee', category: 'immersion' })).toBeNull();
    expect(zoneFor({ drinkId: 'my own thing' })).toBeNull();
  });

  it('inZone describes membership only', () => {
    const z = zoneFor({ drinkId: 'espresso-shot', category: 'espresso' });
    expect(inZone({ timeSec: 27, ratio: 2 }, z)).toBe(true);
    expect(inZone({ timeSec: 19, ratio: 2 }, z)).toBe(false);
    expect(inZone({ timeSec: 27, ratio: 2 }, null)).toBe(false);
  });
});

describe('dialInScales', () => {
  const box: ChartBox = { width: 360, height: 240, left: 54, right: 16, top: 18, bottom: 40 };

  it('covers every point AND the zone inside the plot area, with increasing nice ticks', () => {
    const pts = dialInSeries(J, 'espresso-shot').points;
    const zone = zoneFor({ drinkId: 'espresso-shot', category: 'espresso' });
    const sc = dialInScales(pts, zone, box);
    const inside = (x: number, y: number) => x >= box.left - 1e-6 && x <= box.width - box.right + 1e-6 && y >= box.top - 1e-6 && y <= box.height - box.bottom + 1e-6;
    for (const p of pts) expect(inside(sc.x(p.timeSec), sc.y(p.ratio))).toBe(true);
    expect(inside(sc.x(zone!.timeSec[0]), sc.y(zone!.ratio[0]))).toBe(true);
    expect(inside(sc.x(zone!.timeSec[1]), sc.y(zone!.ratio[1]))).toBe(true);
    expect(sc.xDomain[0]).toBeLessThanOrEqual(19);
    expect(sc.xDomain[1]).toBeGreaterThanOrEqual(35);
    expect(sc.yDomain[0]).toBeLessThanOrEqual(1.5);
    expect(sc.yDomain[1]).toBeGreaterThanOrEqual(2.5);
    // y grows upward: a bigger ratio is drawn higher (smaller svg y).
    expect(sc.y(2.5)).toBeLessThan(sc.y(1.5));
    expect(sc.x(35)).toBeGreaterThan(sc.x(25));
    for (const ticks of [sc.xTicks, sc.yTicks]) {
      expect(ticks.length).toBeGreaterThanOrEqual(3);
      ticks.forEach((v, i) => i && expect(v).toBeGreaterThan(ticks[i - 1]!));
    }
    expect(sc.xTicks[0]).toBe(sc.xDomain[0]);
    expect(sc.xTicks[sc.xTicks.length - 1]).toBe(sc.xDomain[1]);
  });

  it('survives identical points and no zone', () => {
    const sc = dialInScales([{ timeSec: 28, ratio: 2 }, { timeSec: 28, ratio: 2 }], null, box);
    expect(Number.isFinite(sc.x(28))).toBe(true);
    expect(Number.isFinite(sc.y(2))).toBe(true);
    expect(sc.xDomain[1]).toBeGreaterThan(sc.xDomain[0]);
  });

  it('niceStep picks 1/2/2.5/5 × 10^k', () => {
    expect(niceStep(20, 5)).toBe(5);
    expect(niceStep(1.2, 4)).toBe(0.5);
    expect(niceStep(100, 5)).toBe(20);
    expect(niceStep(0, 5)).toBe(1);
  });
});

describe('pickDialInDrink', () => {
  const isEsp = (id: string) => id === 'espresso-shot';
  it('prefers a drink that can already draw a path, espresso first', () => {
    expect(pickDialInDrink(J, isEsp)).toBe('espresso-shot');
    const pour = [e('1', '2026-11-01T00:00:00Z', { drinkId: 'pourover-cone', doseG: 15, outG: 250, timeSec: 180 }), e('2', '2026-11-02T00:00:00Z', { drinkId: 'pourover-cone', doseG: 15, outG: 240, timeSec: 170 }), e('3', '2026-11-03T00:00:00Z', { doseG: 18, outG: 36, timeSec: 28 })];
    expect(pickDialInDrink(pour, isEsp)).toBe('pourover-cone'); // espresso has only one plottable attempt
    expect(pickDialInDrink([e('x', '2026-11-01T00:00:00Z', { drinkId: 'cortado' })], isEsp)).toBe('cortado');
    expect(pickDialInDrink([], isEsp)).toBeNull();
  });
});
