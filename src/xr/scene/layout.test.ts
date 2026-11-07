import { describe, expect, it } from 'vitest';
import { TIERS } from '../mission/tiers';
import { ZONE_ACCEPTS } from '../mission/reducer';
import type { ItemId, ZoneId } from '../mission/types';
import { BUTTON_POS, COUNTER, USER_DISTANCE, ZONE_POS, dist3, distXZ, nearestZone } from './layout';

const user: readonly [number, number, number] = [0, 0, -USER_DISTANCE];
const REACH_M = 0.8; // comfortable lean-and-reach radius from where the learner stands

describe('station layout (comfort + unambiguous snapping)', () => {
  it('every zone and button is within reach without locomotion', () => {
    for (const [zone, p] of Object.entries(ZONE_POS)) expect(distXZ(p, user), zone).toBeLessThanOrEqual(REACH_M);
    for (const [b, p] of Object.entries(BUTTON_POS)) expect(distXZ(p, user), b).toBeLessThanOrEqual(REACH_M);
  });

  it('every zone sits on the counter', () => {
    for (const [zone, [x, , z]] of Object.entries(ZONE_POS)) {
      expect(x, zone).toBeGreaterThan(COUNTER.minX);
      expect(x, zone).toBeLessThan(COUNTER.maxX);
      expect(z, zone).toBeGreaterThan(COUNTER.minZ);
      expect(z, zone).toBeLessThan(COUNTER.maxZ);
    }
  });

  it('zones accepting the same item never overlap even at the most forgiving (guided) snap radius', () => {
    const items: ItemId[] = ['portafilter', 'cup', 'tamper'];
    for (const item of items) {
      const zones = (Object.keys(ZONE_POS) as Array<keyof typeof ZONE_POS>).filter((z) => ZONE_ACCEPTS[z as ZoneId].includes(item));
      for (let i = 0; i < zones.length; i++)
        for (let j = i + 1; j < zones.length; j++) {
          const a = ZONE_POS[zones[i]!];
          const b = ZONE_POS[zones[j]!];
          expect(dist3(a, b), `${zones[i]}↔${zones[j]}`).toBeGreaterThan(2 * TIERS.guided.snapRadiusM);
          // Mouse/touch use planar distance: zones must at least be farther apart than one snap radius.
          expect(distXZ(a, b), `${zones[i]}↔${zones[j]} planar`).toBeGreaterThan(TIERS.guided.snapRadiusM);
        }
    }
  });

  it('nearestZone picks the closest, planar or 3D', () => {
    const zones = [
      { zone: 'group-head' as const, pos: ZONE_POS['group-head'] },
      { zone: 'grinder-fork' as const, pos: ZONE_POS['grinder-fork'] },
    ];
    expect(nearestZone([0.02, 0.5, 0], zones, true)).toMatchObject({ zone: 'group-head' });
    expect(nearestZone([0.02, 0.5, 0], zones, true)!.distanceM).toBeCloseTo(0.02);
    expect(nearestZone([0.02, 0.5, 0], zones, false)!.distanceM).toBeGreaterThan(0.25);
    expect(nearestZone([0, 0, 0], [], true)).toBeNull();
  });
});
