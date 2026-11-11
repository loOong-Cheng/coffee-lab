/**
 * Café Rush VR input → reducer actions (pure, no Babylon; unit-tested headless).
 *
 * Controller map (HARDWARE-UNVERIFIED — no headset was used to build or test this):
 *  - trigger on a target   → actionsForTarget(): one option acts at once, several open an in-world choice panel
 *  - grip near / on an item → grab{slot} (shelf: choose a cup size)
 *  - grip release near a free slot → place{slot}; the snap radius depends on the guidance tier
 * Everything ends in the SAME reduce() actions as the action list and the mouse / touch counter.
 * Haptics are an optional affordance buzz (feature-detected); they never claim real touch or force.
 */
import type { Guidance } from '../../domain/contracts';
import { actionsForTarget, type ListAction, type Target } from './play';
import { SLOTS, reduce, type PlayerAction, type RushState, type SlotId } from './sim';

export type V3 = readonly [number, number, number];

/** Station-local anchor of every target (y 0 = counter top; the user stands at −z). Every one is within ±0.75 m. */
export const TARGET_POS: Record<Target, V3> = {
  grinder: [-0.62, 0, 0.22],
  group1: [-0.34, 0.25, 0.25],
  group2: [-0.12, 0.25, 0.25],
  tray1: [-0.34, 0, 0.17],
  tray2: [-0.12, 0, 0.17],
  wand: [0.1, 0, 0.17],
  hotwater: [0.26, 0, 0.17],
  kettleBase: [0.45, 0, 0.26],
  dripper: [0.64, 0, 0.27],
  phin: [0.64, 0, 0.06],
  counter1: [-0.42, 0, -0.17],
  counter2: [-0.24, 0, -0.17],
  counter3: [-0.06, 0, -0.17],
  counter4: [0.12, 0, -0.17],
  counter5: [-0.42, 0, -0.01],
  counter6: [-0.24, 0, -0.01],
  counter7: [-0.06, 0, -0.01],
  counter8: [0.12, 0, -0.01],
  shelf: [-0.66, 0, -0.16],
  knock: [-0.64, 0, 0.0],
  ice: [0.32, 0, -0.18],
  extras: [0.5, 0, -0.18],
  fridge: [0.68, 0, -0.17],
  bin: [0.32, 0, -0.01],
  pass: [0.47, 0, 0.06],
};

/** Where a held item's centre sits at a slot (portafilters hang under the group head). */
export function grabPoint(t: Target): V3 {
  const p = TARGET_POS[t];
  return t === 'group1' || t === 'group2' ? [p[0], p[1] - 0.06, p[2]] : [p[0], p[1] + 0.06, p[2]];
}

/** Release snap radius (m) by guidance tier: guided is generous, independent asks for a precise drop. */
export const SNAP_M: Record<Guidance, number> = { guided: 0.2, assisted: 0.14, independent: 0.1 };
/** How close the grip must be to an item to grab it without pointing at it. */
export const GRAB_REACH_M = 0.16;

const dist = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const isSlot = (t: Target | null): t is SlotId => !!t && (SLOTS as readonly string[]).includes(t);

export type VrIntent =
  | { kind: 'act'; action: PlayerAction; target: Target }
  | { kind: 'choose'; target: Target; options: ListAction[] }
  | { kind: 'none'; target: Target };

/**
 * Trigger on the target under the controller ray: the options of a mouse click (actionsForTarget), except
 * that "trigger = use, grip = grab": when a station verb exists (grind, pull a shot…) the grab option is left
 * to the grip. With nothing else to do, the trigger still picks the item up (mouse parity).
 */
export function onTrigger(s: RushState, target: Target | null): VrIntent | null {
  if (!target || s.status !== 'playing') return null;
  const all = actionsForTarget(s, target);
  const use = all.filter((a) => a.action.type !== 'grab');
  const list = use.length ? use : all;
  if (list.length === 1) return { kind: 'act', action: list[0]!.action, target };
  if (list.length > 1) return { kind: 'choose', target, options: list };
  return { kind: 'none', target };
}

/** Picking an option on the in-world choice panel; re-validated against the current state. */
export function chooseOption(s: RushState, intent: VrIntent | null, optionId: string): PlayerAction | null {
  if (!intent || intent.kind !== 'choose' || s.status !== 'playing') return null;
  if (!intent.options.some((o) => o.id === optionId)) return null;
  const now = actionsForTarget(s, intent.target).find((a) => a.id === optionId);
  return now ? now.action : null;
}

/**
 * Grip pressed. Grabs the item nearest the grip (within GRAB_REACH_M) or, failing that, the item under
 * the ray. Gripping the cup shelf offers the cup sizes. Holding something already → nothing.
 */
export function onGripDown(s: RushState, gripLocal: V3 | null, rayTarget: Target | null): VrIntent | null {
  if (s.status !== 'playing' || s.hand) return null;
  const ok = (slot: SlotId) => !!s.slots[slot] && reduce(s, { type: 'grab', slot }).lastResult.ok;
  if (gripLocal) {
    let best: { slot: SlotId; d: number } | null = null;
    for (const slot of SLOTS) {
      if (!s.slots[slot]) continue;
      const d = dist(gripLocal, grabPoint(slot));
      if (d <= GRAB_REACH_M && (!best || d < best.d) && ok(slot)) best = { slot, d };
    }
    if (best) return { kind: 'act', action: { type: 'grab', slot: best.slot }, target: best.slot };
    if (dist(gripLocal, grabPoint('shelf')) <= GRAB_REACH_M) return onTrigger(s, 'shelf');
  }
  if (isSlot(rayTarget) && ok(rayTarget)) return { kind: 'act', action: { type: 'grab', slot: rayTarget }, target: rayTarget };
  if (rayTarget === 'shelf') return onTrigger(s, 'shelf');
  return null;
}

/**
 * Where a held item would land if released now: the nearest slot that accepts it within the tier's snap
 * radius, else the slot under the ray (point-and-release). Null = keep carrying it.
 */
export function snapTarget(s: RushState, gripLocal: V3 | null, rayTarget: Target | null, guidance: Guidance): SlotId | null {
  if (s.status !== 'playing' || !s.hand) return null;
  const ok = (slot: SlotId) => !s.slots[slot] && reduce(s, { type: 'place', slot }).lastResult.ok;
  if (gripLocal) {
    const r = SNAP_M[guidance];
    let best: { slot: SlotId; d: number } | null = null;
    for (const slot of SLOTS) {
      if (s.slots[slot]) continue;
      const d = dist(gripLocal, grabPoint(slot));
      if (d <= r && (!best || d < best.d) && ok(slot)) best = { slot, d };
    }
    if (best) return best.slot;
  }
  return isSlot(rayTarget) && ok(rayTarget) ? rayTarget : null;
}

/** Grip released: place the held item at the snap target, or keep carrying it (null). */
export function onGripUp(s: RushState, gripLocal: V3 | null, rayTarget: Target | null, guidance: Guidance): PlayerAction | null {
  const slot = snapTarget(s, gripLocal, rayTarget, guidance);
  return slot ? { type: 'place', slot } : null;
}

// ───────────────────────────── haptics (optional) ─────────────────────────────
export interface HapticActuatorLike {
  pulse?: (value: number, duration: number) => unknown;
}
export interface GamepadLike {
  hapticActuators?: ReadonlyArray<HapticActuatorLike | null | undefined> | null;
}
/** Strength (0..1) and duration (ms) of the affordance buzzes. Subtle on purpose. */
export const HAPTIC = { hover: [0.08, 12], snap: [0.15, 18], act: [0.22, 28], reject: [0.3, 45] } as const satisfies Record<string, readonly [number, number]>;

/** Feature-detected pulse via gamepad.hapticActuators. Returns false (and never throws) when unsupported. */
export function pulseGamepad(gamepad: GamepadLike | null | undefined, strength: number, ms: number): boolean {
  try {
    const act = gamepad?.hapticActuators?.[0];
    if (!act || typeof act.pulse !== 'function') return false;
    const r = act.pulse(Math.max(0, Math.min(1, strength)), ms) as { catch?: (f: () => void) => void } | undefined;
    r?.catch?.(() => {});
    return true;
  } catch {
    return false;
  }
}

// ───────────────────────────── in-headset ticket model ─────────────────────────────
export interface VrTicket {
  id: string;
  drinkId: string;
  customerId: string;
  /** 0..1 patience left; null in Relaxed mode. */
  left: number | null;
  sec: number | null;
  /** "About to leave" cue (≤ 30% patience); hidden in the independent tier, like the 2D tickets. */
  leaving: boolean;
}
export function vrTickets(s: RushState, guidance: Guidance): VrTicket[] {
  return s.orders.map((o) => {
    const left = o.remainingMs === null || !o.patienceMs ? null : Math.max(0, Math.min(1, o.remainingMs / o.patienceMs));
    return {
      id: o.id,
      drinkId: o.drinkId,
      customerId: o.customerId,
      left: left === null ? null : Math.round(left * 20) / 20,
      sec: o.remainingMs === null ? null : Math.ceil(o.remainingMs / 1000),
      leaving: left !== null && left <= 0.3 && guidance !== 'independent',
    };
  });
}
