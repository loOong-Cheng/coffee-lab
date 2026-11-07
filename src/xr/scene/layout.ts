/**
 * Station layout in metres, station-local space (pure data — unit-tested).
 * Origin: counter-top surface, centre of the machine's front edge line.
 * +x = learner's right, +y = up, +z = away from the learner (Babylon left-handed).
 * The learner stands at z = -USER_DISTANCE facing +z, so everything is within
 * arm's reach (no artificial locomotion needed).
 */
import type { ButtonId, ItemId, ZoneId } from '../mission/types';

export type Vec3 = readonly [number, number, number];

export const USER_DISTANCE = 0.62;

export const COUNTER_HEIGHT = { standing: 0.92, seated: 0.74, min: 0.6, max: 1.12, step: 0.04 } as const;

export const COUNTER = { minX: -0.8, maxX: 0.8, minZ: -0.33, maxZ: 0.48, thickness: 0.045 } as const;

/** Resting pose of an item's anchor in each zone (anchor = basket centre / cup bottom / tamper base). */
export const ZONE_POS: Record<Exclude<ZoneId, 'basket'>, Vec3> = {
  'group-head': [0, 0.225, 0.0],
  scale: [0, 0.047, 0.0],
  'grinder-fork': [-0.36, 0.145, -0.02],
  'tamp-mat': [0.22, 0.042, -0.14],
  'knock-box': [0.44, 0.165, 0.02],
  'cup-home': [-0.2, 0.006, -0.18],
  serve: [-0.52, 0.012, -0.12],
  'tamper-stand': [0.47, 0.01, -0.18],
};

/** Yaw (radians) of an item resting in a zone. Portafilter handle points at the learner (−z) at yaw 0. */
export const ZONE_YAW: Partial<Record<ZoneId, number>> = {
  'tamp-mat': -0.35,
  'knock-box': 0.5,
  serve: 0,
  'cup-home': 0.4,
};

/** Tamper "basket" target sits this far above the portafilter anchor. */
export const BASKET_TOP_OFFSET = 0.02;

export const BUTTON_POS: Record<ButtonId, Vec3> = {
  brew: [0.11, 0.33, 0.071],
  grinder: [-0.36, 0.29, 0.073],
  tare: [0.038, 0.036, -0.066],
};

/** Where to hover cue arrows / tags for station parts. */
export const PART_TAG_POS = {
  'espresso-machine': [0, 0.47, 0.25],
  grinder: [-0.36, 0.6, 0.17],
  scale: [0, 0.16, -0.08],
  'knock-box': [0.44, 0.24, 0.02],
  'tamp-mat': [0.22, 0.12, -0.2],
  serve: [-0.52, 0.1, -0.12],
} as const satisfies Record<string, Vec3>;

export const ITEM_HOME_POS: Record<ItemId, Vec3> = {
  portafilter: ZONE_POS['tamp-mat'],
  cup: ZONE_POS['cup-home'],
  tamper: ZONE_POS['tamper-stand'],
};

/** Learner's eye position in station space for a given counter height. */
export function userEye(counterHeight: number, eyeHeight: number): Vec3 {
  return [0, eyeHeight - counterHeight, -USER_DISTANCE];
}

export function dist3(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

export function distXZ(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[2] - b[2]);
}

/**
 * Nearest compatible zone to an anchor. `planar` (mouse/touch dragging on a
 * plane) ignores height; XR uses true 3D distance.
 */
export function nearestZone(
  anchor: Vec3,
  zones: ReadonlyArray<{ zone: ZoneId; pos: Vec3 }>,
  planar: boolean,
): { zone: ZoneId; distanceM: number } | null {
  let best: { zone: ZoneId; distanceM: number } | null = null;
  for (const z of zones) {
    const d = planar ? distXZ(anchor, z.pos) : dist3(anchor, z.pos);
    if (!best || d < best.distanceM) best = { zone: z.zone, distanceM: d };
  }
  return best;
}
