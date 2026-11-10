/**
 * Espresso-counter station (used by "espresso-first-shot" and "station-tour").
 * Renders a StationView and turns input into the shared pure actions:
 *  - mouse/touch: drag items on a counter-height plane (planar snap), click buttons/parts;
 *  - XR: grip (squeeze) grabs near or along the ray, trigger presses / point-grabs,
 *    release near a ring to place (3D distance + portafilter angle), poke buttons, tamp on contact.
 * HARDWARE-UNVERIFIED (XR paths).
 */
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture';
import { TextBlock } from '@babylonjs/gui/2D/controls/textBlock';
import { Rectangle } from '@babylonjs/gui/2D/controls/rectangle';
import type { WebXRInputSource } from '@babylonjs/core/XR/webXRInputSource';
import type { HandId, InspectableId, ItemId, ZoneId } from '../mission/types';
import type { CoreState, SceneFactory } from '../mission/core';
import { TIERS } from '../mission/tiers';
import { MODEL } from '../mission/extraction';
import { ITEM_HOME, zonesFor } from '../mission/reducer';
import type { InfoLookup, StationView } from '../mission/stationView';
import { buildEspressoProps, type PickMeta } from './props';
import { createTag } from './panels';
import { createRuntime, pickable, type Rt, type Station } from './runtime';
import { BASKET_TOP_OFFSET, BUTTON_POS, PART_TAG_POS, ZONE_POS, ZONE_YAW, nearestZone, type Vec3 } from './layout';

const DRAG_Y: Record<ItemId, number> = { portafilter: 0.17, cup: 0.1, tamper: 0.1 };
const LERP_RATE = 14;
const NEAR_GRAB_M = 0.13;
const POKE_M = 0.03;
const ITEMS = ['portafilter', 'cup', 'tamper'] as const;
const v3 = (p: Vec3) => new Vector3(p[0], p[1], p[2]);
const quatYaw = (yaw: number) => Quaternion.FromEulerAngles(0, yaw, 0);

export function espressoStationFactory(viewOf: (s: CoreState) => StationView, info: InfoLookup): SceneFactory {
  return (opts) => createRuntime(opts, (rt) => buildEspressoStation(rt, viewOf, info));
}

function buildEspressoStation(rt: Rt, viewOf: (s: CoreState) => StationView, info: InfoLookup): Station {
  const { scene, mats, root, store, camera } = rt;
  const P = buildEspressoProps(scene, mats, root);
  const view = () => viewOf(store.getState());

  // ── cue visuals ──
  const ringOf = new Map<ZoneId, Mesh>();
  for (const zone of [...(Object.keys(ZONE_POS) as ZoneId[]), 'basket' as const]) {
    const r = MeshBuilder.CreateTorus(`ring-${zone}`, { diameter: 1, thickness: 0.06, tessellation: 32 }, scene);
    r.parent = root;
    r.isPickable = false;
    r.isVisible = false;
    r.material = mats.ringIdle;
    ringOf.set(zone, r);
  }
  const arrow = makeArrow(rt);
  const ghosts = {} as Record<ItemId, TransformNode>;
  for (const item of ITEMS) {
    const g = new TransformNode(`ghost-${item}`, scene);
    g.parent = root;
    for (const m of P.items[item].meshes) {
      if (m === P.coffee.mound || m === P.coffee.bed || m === P.cupLiquid) continue;
      const c = m.clone(`ghost-${m.name}`, g)!;
      c.material = mats.ghost;
      c.isPickable = false;
      c.metadata = null;
      c.isVisible = true;
    }
    g.setEnabled(false);
    ghosts[item] = g;
  }
  const scaleText = (() => {
    const adt = AdvancedDynamicTexture.CreateForMesh(P.scaleDisplay, 256, 82, false);
    const bg = new Rectangle();
    bg.background = '#1d2a22';
    bg.thickness = 0;
    adt.addControl(bg);
    const tb = new TextBlock();
    tb.color = '#9ff0b0';
    tb.fontSize = 54;
    tb.fontFamily = 'ui-monospace, Consolas, monospace';
    bg.addControl(tb);
    return tb;
  })();
  const tags: Array<{ id: InspectableId; tag: ReturnType<typeof createTag> }> = [];
  for (const [id, pos] of Object.entries(PART_TAG_POS) as Array<[InspectableId, Vec3]>) {
    const t = createTag(scene, `tag-${id}`, rt.tr(info(id).name), root);
    t.mesh.position.copyFrom(v3(pos));
    tags.push({ id, tag: t });
  }
  for (const item of ITEMS) {
    const t = createTag(scene, `tag-${item}`, rt.tr(info(item).name), P.items[item].root);
    t.mesh.position.set(0, item === 'tamper' ? 0.14 : 0.1, 0);
    tags.push({ id: item, tag: t });
  }

  // ── placement helpers ──
  const v0 = view();
  for (const item of ITEMS) {
    const r = P.items[item].root;
    const zone = v0.items[item].zone;
    r.position.copyFrom(zoneAnchor(zone));
    r.rotationQuaternion = quatYaw(ZONE_YAW[zone] ?? 0);
  }
  function zoneAnchor(zone: ZoneId): Vector3 {
    if (zone === 'basket') return rt.localOf(P.items.portafilter.root.getAbsolutePosition()).add(new Vector3(0, BASKET_TOP_OFFSET, 0));
    return v3(ZONE_POS[zone]);
  }
  function zoneCandidates(v: StationView, item: ItemId, hand: HandId): Array<{ zone: ZoneId; pos: Vec3 }> {
    return zonesFor(item)
      .filter((z) => z !== 'basket' || v.basketOpen(hand))
      .map((z) => {
        const p = zoneAnchor(z);
        return { zone: z, pos: [p.x, p.y, p.z] as Vec3 };
      });
  }
  function anchorOf(id: InspectableId): Vector3 {
    const FIXED: Partial<Record<InspectableId, Vec3>> = {
      'brew-button': [0.11, 0.45, 0.02],
      'group-head': [0, 0.4, -0.04],
      'drip-tray': [0, 0.2, -0.12],
    };
    const fixed = FIXED[id] ?? (id in PART_TAG_POS ? PART_TAG_POS[id as keyof typeof PART_TAG_POS] : null);
    if (fixed) return v3(fixed);
    return rt.localOf(P.items[id as ItemId].root.getAbsolutePosition()).add(new Vector3(0, 0.12, 0));
  }

  // ── interaction state ──
  let drag: { item: ItemId; from: ZoneId } | null = null;
  let hoverMeta: PickMeta | null = null;
  let hoverMeshes: AbstractMesh[] = [];
  const twist: Partial<Record<ItemId, number>> = {};
  const pressAnim: Partial<Record<'brew' | 'grinder' | 'tare', number>> = {};
  const holdInfo: Partial<Record<HandId, { item: ItemId; zone: ZoneId | null; distanceM: number }>> = {};
  const rayGrab = new Map<number, ItemId>();

  const metaOf = (m: AbstractMesh | null | undefined): PickMeta | null => (m?.metadata as PickMeta | null) ?? null;
  function meshesFor(meta: PickMeta | null): AbstractMesh[] {
    if (!meta) return [];
    if (meta.kind === 'item') return P.items[meta.id].meshes.filter((m) => m.isVisible);
    if (meta.kind === 'button') return [P.buttons[meta.id]];
    return P.parts[meta.id] ?? [];
  }
  const inspectId = (meta: PickMeta): InspectableId =>
    meta.kind === 'button' ? (meta.id === 'brew' ? 'brew-button' : meta.id === 'tare' ? 'scale' : 'grinder') : meta.id;

  function setHover(meta: PickMeta | null) {
    if (JSON.stringify(meta) === JSON.stringify(hoverMeta)) return;
    hoverMeta = meta;
    hoverMeshes = meshesFor(meta);
    if (!meta) return rt.showInfo(null);
    const id = inspectId(meta);
    rt.showInfo(info(id), anchorOf(id).add(new Vector3(0, 0.1, 0)));
  }

  /** Parts that hold an item: clicking the part right where the item sits means the item. */
  const PART_ZONE: Partial<Record<InspectableId, ZoneId>> = {
    'group-head': 'group-head',
    grinder: 'grinder-fork',
    'tamp-mat': 'tamp-mat',
    'knock-box': 'knock-box',
    scale: 'scale',
    serve: 'serve',
    'drip-tray': 'scale',
  };
  function resolvePick(meta: PickMeta | null, point: Vector3 | null | undefined): PickMeta | null {
    if (!meta || meta.kind !== 'part') return meta;
    const zone = PART_ZONE[meta.id];
    if (!zone) return meta;
    const v = view();
    for (const item of ITEMS) {
      const it = v.items[item];
      if (it.heldBy !== null || it.zone !== zone) continue;
      if (!point || Vector3.Distance(point, P.items[item].root.getAbsolutePosition()) < 0.09) return { kind: 'item', id: item };
    }
    return meta;
  }
  function pickAtPointer(): PickMeta | null {
    const pick = scene.pick(scene.pointerX, scene.pointerY, pickable);
    return pick?.hit ? resolvePick(metaOf(pick.pickedMesh), pick.pickedPoint) : null;
  }

  function press(b: 'brew' | 'grinder' | 'tare', source: 'pointer' | 'xr') {
    pressAnim[b] = 0.18;
    store.dispatch({ type: 'PRESS', button: b, source } as never);
  }

  function dragTo(item: ItemId): void {
    const ray = scene.createPickingRay(scene.pointerX, scene.pointerY, Matrix.Identity(), camera);
    const planeY = root.position.y + DRAG_Y[item];
    if (Math.abs(ray.direction.y) < 1e-4) return;
    const t = (planeY - ray.origin.y) / ray.direction.y;
    if (t <= 0) return;
    const local = rt.localOf(ray.origin.add(ray.direction.scale(t)));
    local.x = Math.max(-0.78, Math.min(0.78, local.x));
    local.z = Math.max(-0.32, Math.min(0.46, local.z));
    const v = view();
    const near = nearestZone([local.x, local.y, local.z], zoneCandidates(v, item, 'pointer'), true);
    const tier = TIERS[v.guidance];
    holdInfo.pointer = { item, zone: near?.zone ?? null, distanceM: near?.distanceM ?? Infinity };
    if (near && near.distanceM <= tier.nearRadiusM) {
      const zp = zoneAnchor(near.zone);
      const k = 1 - Math.min(1, near.distanceM / tier.nearRadiusM);
      local.y = local.y + (zp.y + 0.012 - local.y) * k; // magnet preview
    }
    P.items[item].root.position.copyFrom(local);
  }
  function endDrag(): void {
    if (!drag) return;
    const from = drag.from;
    drag = null;
    camera.attachControl(true);
    const h = holdInfo.pointer;
    delete holdInfo.pointer;
    // Dropped back near where it came from = "put it back", not a near-miss.
    const putBack = !!h && h.zone === from && h.distanceM <= TIERS[view().guidance].nearRadiusM;
    store.dispatch({
      type: 'RELEASE',
      hand: 'pointer',
      zone: h?.zone ?? undefined,
      distanceM: h?.zone ? (putBack ? 0 : h.distanceM) : undefined,
      angleDeg: 0,
      tiltDeg: 0,
      source: 'pointer',
    } as never);
  }

  // ── XR grab / release ──
  const heldBy = (hand: HandId): ItemId | null => ITEMS.find((i) => view().items[i].heldBy === hand) ?? null;
  function xrGrab(ctrl: WebXRInputSource, picked?: ItemId): boolean {
    const hand = rt.handOf(ctrl);
    if (heldBy(hand)) return false;
    const grip = rt.gripNode(ctrl).getAbsolutePosition();
    let item: ItemId | undefined = picked;
    if (!item) {
      let best = NEAR_GRAB_M;
      for (const id of ITEMS) {
        const d = Vector3.Distance(grip, P.items[id].root.getAbsolutePosition());
        if (d < best) {
          best = d;
          item = id;
        }
      }
    }
    if (!item) {
      const meta = metaOf(rt.xr()?.pointerSelection.getMeshUnderPointer(ctrl.uniqueId));
      if (meta?.kind === 'item') item = meta.id;
    }
    if (!item) return false;
    store.dispatch({ type: 'GRAB', item, hand, source: 'xr' } as never);
    if (view().items[item].heldBy !== hand) return false;
    const r = P.items[item].root;
    const far = Vector3.Distance(grip, r.getAbsolutePosition()) > NEAR_GRAB_M;
    r.setParent(rt.gripNode(ctrl));
    if (far) {
      r.position.set(0, -0.01, 0.06); // explicit distance grab: flies to the hand
      r.rotationQuaternion = Quaternion.Identity();
    }
    rt.pulse(ctrl, 0.25, 30);
    return true;
  }
  function tiltOf(q: Quaternion): number {
    const up = Vector3.Up().applyRotationQuaternion(q);
    return (Math.acos(Math.max(-1, Math.min(1, up.y))) * 180) / Math.PI;
  }
  function xrRelease(ctrl: WebXRInputSource): void {
    const hand = rt.handOf(ctrl);
    const item = heldBy(hand);
    if (!item) return;
    const r = P.items[item].root;
    r.setParent(root);
    const a = r.position;
    const near = nearestZone([a.x, a.y, a.z], zoneCandidates(view(), item, hand), false);
    const q = r.rotationQuaternion ?? Quaternion.FromEulerVector(r.rotation);
    let angleDeg: number | undefined;
    if (item === 'portafilter' && near?.zone === 'group-head') {
      const handle = new Vector3(0, 0, -1).applyRotationQuaternion(q);
      angleDeg = Math.max((Math.abs(Math.atan2(handle.x, -handle.z)) * 180) / Math.PI, tiltOf(q));
    }
    delete holdInfo[hand];
    store.dispatch({
      type: 'RELEASE',
      hand,
      zone: near?.zone,
      distanceM: near?.distanceM,
      angleDeg,
      tiltDeg: item === 'tamper' ? tiltOf(q) : undefined,
      source: 'xr',
    } as never);
  }

  // ── per-frame sync ──
  const outlineCue = new Color3(0.94, 0.73, 0.23);
  const outlineHover = new Color3(1, 1, 1);
  let outlined: AbstractMesh[] = [];
  let lastTagKey = '';

  function syncXrHands(v: StationView) {
    if (!rt.inXR()) return;
    const tier = TIERS[v.guidance];
    for (const h of rt.hands()) {
      const held = heldBy(h.hand);
      if (held) {
        const r = P.items[held].root;
        const a = rt.localOf(r.getAbsolutePosition());
        const near = nearestZone([a.x, a.y, a.z], zoneCandidates(v, held, h.hand), false);
        holdInfo[h.hand] = { item: held, zone: near?.zone ?? null, distanceM: near?.distanceM ?? Infinity };
        if (held === 'tamper' && near?.zone === 'basket' && near.distanceM < Math.min(0.035, tier.snapRadiusM)) {
          store.dispatch({ type: 'USE_TAMPER', tiltDeg: tiltOf(r.absoluteRotationQuaternion), source: 'xr' } as never);
          rt.pulse(h.ctrl, 0.5, 60);
        }
      } else {
        delete holdInfo[h.hand];
        if (h.pokeCooldown === 0 && v.status === 'playing') {
          const grip = rt.gripNode(h.ctrl);
          const tip = rt.localOf(grip.getAbsolutePosition().add(grip.getDirection(Vector3.Forward()).scale(0.06)));
          for (const b of ['brew', 'grinder', 'tare'] as const) {
            if (Vector3.Distance(tip, v3(BUTTON_POS[b])) < POKE_M) {
              press(b, 'xr');
              rt.pulse(h.ctrl, 0.3, 30);
              h.pokeCooldown = 0.8;
              break;
            }
          }
        }
      }
    }
  }

  function syncItems(v: StationView, dt: number) {
    const k = rt.reducedMotion ? 1 : 1 - Math.exp(-LERP_RATE * dt);
    for (const item of ITEMS) {
      const st = v.items[item];
      const r = P.items[item].root;
      if (st.heldBy && st.heldBy !== 'pointer' && r.parent !== root) continue; // riding a controller
      if (st.heldBy === 'pointer' && drag?.item === item) continue; // following the mouse
      if (r.parent !== root) r.setParent(root);
      const target = zoneAnchor(st.zone);
      if (st.heldBy) target.y += 0.12; // held via the action list: float above its spot
      Vector3.LerpToRef(r.position, target, k, r.position);
      const yaw = (ZONE_YAW[st.zone] ?? 0) + (twist[item] ?? 0);
      if (twist[item]) twist[item] = Math.abs(twist[item]!) < 0.01 ? 0 : twist[item]! * (1 - k);
      const q = r.rotationQuaternion ?? Quaternion.Identity();
      Quaternion.SlerpToRef(q, quatYaw(yaw), k, q);
      r.rotationQuaternion = q;
    }
  }

  function syncProps(v: StationView) {
    const t = rt.time();
    const { mound, bed } = P.coffee;
    mound.isVisible = v.basket === 'dosed' || v.grinder.running;
    mound.scaling.y = v.grinder.running ? Math.max(0.05, v.grinder.elapsedSec / MODEL.grindSec) : 1;
    bed.isVisible = v.basket === 'tamped' || v.basket === 'spent';
    bed.material = v.basket === 'spent' ? mats.spent : mats.tamped;
    const y = v.shot.yieldG;
    const liquid = P.cupLiquid;
    liquid.isVisible = y > 0.2;
    const level = 0.011 + Math.min(1, y / 48) * 0.048;
    liquid.position.y = level;
    liquid.scaling.x = liquid.scaling.z = 0.78 + 0.22 * Math.min(1, y / 48);
    const esp = P.streams.espresso;
    const flowing = (v.shot.status === 'running' && v.shot.elapsedSec > MODEL.firstDropsSec - 0.4) || v.shot.status === 'settling';
    esp.isVisible = flowing && (v.shot.status !== 'settling' || Math.sin(t * 40) > 0.3);
    if (esp.isVisible) {
      const top = ZONE_POS['group-head'][1] - 0.037;
      const bottom = ZONE_POS.scale[1] + level;
      esp.scaling.y = Math.max(0.01, top - bottom);
      esp.position.set(0, (top + bottom) / 2, 0);
      const wob = rt.reducedMotion ? 1 : 0.85 + 0.3 * Math.abs(Math.sin(t * 23));
      esp.scaling.x = esp.scaling.z = v.shot.status === 'settling' ? 0.5 : wob;
    }
    const flush = P.streams.flush;
    flush.isVisible = v.flushRunning;
    if (flush.isVisible) {
      flush.scaling.y = 0.24 - 0.026;
      flush.position.set(0, (0.24 + 0.026) / 2, 0);
    }
    const grind = P.streams.grind;
    grind.isVisible = v.grinder.running;
    if (grind.isVisible) {
      const [gx, gy, gz] = ZONE_POS['grinder-fork'];
      grind.scaling.y = 0.2 - (gy + 0.02);
      grind.position.set(gx, (0.2 + gy + 0.02) / 2, gz + 0.02);
    }
    P.knockPile.isVisible = v.knocked;
    const busy = v.shot.status === 'running' || v.flushRunning;
    mats.amber.emissiveColor.set(busy ? 0.55 : 0.24, busy ? 0.36 : 0.16, 0.02);
    const gBody = P.parts.grinder?.[0];
    if (gBody && !rt.reducedMotion) gBody.position.x = ZONE_POS['grinder-fork'][0] + (v.grinder.running ? Math.sin(t * 90) * 0.0012 : 0);
    for (const b of ['brew', 'grinder', 'tare'] as const) {
      const m = P.buttons[b];
      const base = BUTTON_POS[b];
      const left = pressAnim[b] ?? 0;
      if (left > 0) pressAnim[b] = Math.max(0, left - 1 / 60);
      m.position.set(base[0], base[1], base[2] + (left > 0 ? 0.004 : 0));
    }
    const scaleStr = v.cupOnScale || Math.abs(v.scaleReadingG) > 0.05 ? `${v.scaleReadingG.toFixed(1)}g` : '0.0g';
    if (scaleText.text !== scaleStr) scaleText.text = scaleStr;
  }

  function syncCues(v: StationView) {
    const cue = v.cue;
    const tier = TIERS[v.guidance];
    for (const r of ringOf.values()) r.isVisible = false;
    for (const [hand, h] of Object.entries(holdInfo) as Array<[HandId, { item: ItemId; zone: ZoneId | null; distanceM: number }]>) {
      if (v.items[h.item].heldBy !== hand) continue;
      for (const c of zoneCandidates(v, h.item, hand)) {
        const ring = ringOf.get(c.zone)!;
        const d = h.zone === c.zone ? h.distanceM : Infinity;
        const state = d <= tier.snapRadiusM ? 'snap' : d <= tier.nearRadiusM ? 'near' : 'idle';
        const show =
          tier.zoneRings === 'all-compatible' ||
          (tier.zoneRings === 'near' && state !== 'idle') ||
          (tier.zoneRings === 'snap-only' && state === 'snap') ||
          (v.cues.cues && cue?.kind === 'place' && cue.zone === c.zone);
        if (!show) continue;
        ring.isVisible = true;
        ring.material = state === 'snap' ? mats.ringSnap : state === 'near' ? mats.ringNear : mats.ringIdle;
        ring.position.set(c.pos[0], c.pos[1] + (c.zone === 'group-head' ? 0.016 : 0.004), c.pos[2]);
        const dia = tier.snapRadiusM * 2;
        ring.scaling.set(dia, dia, dia);
      }
    }
    for (const g of Object.values(ghosts)) g.setEnabled(false);
    arrow.isVisible = false;
    let cueMeshes: AbstractMesh[] = [];
    if (v.cues.cues && cue) {
      let at: Vector3 | null = null;
      if (cue.kind === 'look') {
        at = anchorOf(cue.part).add(new Vector3(0, -0.02, cue.part === 'espresso-machine' ? -0.14 : 0));
        cueMeshes =
          cue.part === 'portafilter' || cue.part === 'cup' || cue.part === 'tamper' ? P.items[cue.part].meshes.filter((m) => m.isVisible) : (P.parts[cue.part] ?? []);
      } else if (cue.kind === 'press') {
        at = v3(BUTTON_POS[cue.button]).add(new Vector3(0, 0.07, -0.02));
        cueMeshes = [P.buttons[cue.button]];
      } else if (cue.kind === 'grab' || cue.kind === 'place') {
        if (cue.kind === 'grab') {
          at = rt.localOf(P.items[cue.item].root.getAbsolutePosition()).add(new Vector3(0, 0.12, 0));
          cueMeshes = P.items[cue.item].meshes.filter((m) => m.isVisible);
        }
        if (cue.zone) {
          const g = ghosts[cue.item];
          const p = zoneAnchor(cue.zone);
          g.position.copyFrom(p);
          g.rotationQuaternion = quatYaw(ZONE_YAW[cue.zone] ?? 0);
          g.setEnabled(true);
          if (cue.kind === 'place') at = p.add(new Vector3(0, 0.15, 0));
        }
      }
      if (at) {
        arrow.isVisible = true;
        arrow.position.copyFrom(at);
        if (!rt.reducedMotion) arrow.position.y += Math.sin(rt.time() * 4) * 0.012;
      }
    }
    for (const m of outlined) m.renderOutline = false;
    outlined = [];
    const apply = (ms: AbstractMesh[], color: Color3) => {
      for (const m of ms) {
        if (!m.isVisible) continue;
        m.renderOutline = true;
        m.outlineColor = color;
        m.outlineWidth = 0.0022;
        outlined.push(m);
      }
    };
    apply(cueMeshes, outlineCue);
    apply(hoverMeshes, outlineHover);
    const tagKey = `${v.cues.toolTags}|${rt.tr({ en: 'en', zh: 'zh' })}`;
    if (tagKey !== lastTagKey) {
      lastTagKey = tagKey;
      for (const { id, tag } of tags) {
        tag.mesh.setEnabled(v.cues.toolTags);
        tag.set(rt.tr(info(id).name));
      }
    }
  }

  return {
    frame(s, dt) {
      const v = viewOf(s);
      syncXrHands(v);
      syncItems(v, dt);
      syncProps(v);
      syncCues(v);
    },
    onPointer(pi) {
      if (pi.type === PointerEventTypes.POINTERMOVE) {
        if (drag) dragTo(drag.item);
        else setHover(pickAtPointer());
        return;
      }
      if (pi.type === PointerEventTypes.POINTERDOWN) {
        if (view().status !== 'playing') return;
        const meta = pickAtPointer();
        if (!meta) return;
        if (meta.kind === 'item') {
          store.dispatch({ type: 'GRAB', item: meta.id, hand: 'pointer', source: 'pointer' } as never);
          if (view().items[meta.id].heldBy === 'pointer') {
            drag = { item: meta.id, from: view().items[meta.id].zone };
            camera.detachControl();
            dragTo(meta.id);
          }
        } else if (meta.kind === 'button') press(meta.id, 'pointer');
        else store.dispatch({ type: 'LOCATE', target: meta.id, source: 'pointer' } as never);
        return;
      }
      if (pi.type === PointerEventTypes.POINTERUP) endDrag();
    },
    onPointerCancel: endDrag,
    onXrPointer(pi, ctrl) {
      const pid = (pi.event as PointerEvent).pointerId;
      const meta = resolvePick(metaOf(pi.pickInfo?.pickedMesh ?? rt.xr()?.pointerSelection.getMeshUnderPointer(ctrl.uniqueId)), pi.pickInfo?.pickedPoint);
      if (pi.type === PointerEventTypes.POINTERMOVE) return setHover(meta);
      if (view().status !== 'playing') return;
      if (pi.type === PointerEventTypes.POINTERDOWN) {
        if (meta?.kind === 'item') {
          if (xrGrab(ctrl, meta.id)) rayGrab.set(pid, meta.id);
        } else if (meta?.kind === 'button') {
          press(meta.id, 'xr');
          rt.pulse(ctrl, 0.2, 25);
        } else if (meta?.kind === 'part') store.dispatch({ type: 'LOCATE', target: meta.id, source: 'xr' } as never);
      } else if (pi.type === PointerEventTypes.POINTERUP && rayGrab.has(pid)) {
        rayGrab.delete(pid);
        xrRelease(ctrl);
      }
    },
    onSqueeze(ctrl, down) {
      if (down) xrGrab(ctrl);
      else xrRelease(ctrl);
    },
    onXrChange(inXr) {
      if (!inXr) for (const h of rt.hands()) xrRelease(h.ctrl);
    },
    onEffects(effects) {
      for (const e of effects as ReadonlyArray<{ type: string; item?: ItemId; zone?: ZoneId }>) {
        if (e.type === 'snap' && e.item === 'portafilter' && e.zone === 'group-head') twist.portafilter = -0.7;
        if (e.type === 'reset') {
          drag = null;
          camera.attachControl(true);
          for (const k of Object.keys(holdInfo) as HandId[]) delete holdInfo[k];
          for (const item of ITEMS) {
            const r = P.items[item].root;
            if (r.parent !== root) r.setParent(root);
          }
        }
      }
    },
    project(target) {
      // Front-surface click points for station parts (test hook), e.g. "part:grinder".
      const PART_CLICK: Record<string, Vec3> = {
        'part:espresso-machine': [0, 0.2, 0.079],
        'part:group-head': [0, 0.265, -0.04],
        'part:grinder': [-0.36, 0.2, 0.079],
        'part:scale': [-0.045, 0.028, -0.064],
        'part:knock-box': [0.44, 0.05, -0.044],
        'part:tamp-mat': [0.16, 0.012, -0.2],
        'part:serve': [-0.58, 0.012, -0.17],
        'part:drip-tray': [0.1, 0.02, -0.07],
      };
      if (target in PART_CLICK) return v3(PART_CLICK[target]!);
      if ((ITEMS as readonly string[]).includes(target)) return rt.localOf(P.items[target as ItemId].root.getAbsolutePosition());
      if (target === 'brew' || target === 'grinder' || target === 'tare') return v3(BUTTON_POS[target]);
      if (target === 'espresso-machine') return new Vector3(0, 0.2, 0.09);
      if (target in ZONE_POS || target === 'basket') return zoneAnchor(target as ZoneId);
      if (target in PART_TAG_POS || target === 'group-head') return anchorOf(target as InspectableId).add(new Vector3(0, -0.06, 0));
      return null;
    },
    onLocale() {
      lastTagKey = '';
    },
  };
}

export function makeArrow(rt: Rt): Mesh {
  const cone = MeshBuilder.CreateCylinder('arrow-head', { diameterTop: 0, diameterBottom: 0.04, height: 0.045, tessellation: 12 }, rt.scene);
  cone.rotation.x = Math.PI;
  const shaft = MeshBuilder.CreateCylinder('arrow-shaft', { diameter: 0.012, height: 0.05, tessellation: 8 }, rt.scene);
  shaft.position.y = 0.045;
  const m = Mesh.MergeMeshes([cone, shaft], true, true)!;
  m.name = 'arrow';
  m.parent = rt.root;
  m.material = rt.mats.arrow;
  m.isPickable = false;
  m.isVisible = false;
  return m;
}

/** Items' home zones (re-exported for the tour reducer's world). */
export { ITEM_HOME };
