/**
 * Pour-over station (mission "pourover-bloom"): scale → carafe → dripper, paper
 * filters, a dose cup of grounds, gooseneck kettle, sink. Procedural/original.
 * Input → the same pure actions as tests and the action list:
 *  - mouse/touch: drag tools; drag the kettle over the dripper and scroll / ↑↓ / the Tilt control to tip it;
 *  - XR: grip holds the kettle — real wrist tilt and spout position drive the (illustrative) flow.
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
import type { HandId } from '../mission/types';
import { cuesOf, type SceneFactory } from '../mission/core';
import { TIERS } from '../mission/tiers';
import { POUR, classifyStream } from '../missions/pourover/model';
import { pourInfo, type PourItem, type PourPart, type PourZone } from '../missions/pourover/content';
import { freeWaterG, kettleFlow, pourCue, scaleReading, type PourState } from '../missions/pourover/reducer';
import { createTag } from './panels';
import { createRuntime, pickable, type Rt, type Station } from './runtime';
import { makeArrow } from './espressoStation';
import { nearestZone, type Vec3 } from './layout';
import { mergeUnder } from './merge';

type Meta = { kind: 'item'; id: PourItem } | { kind: 'button'; id: 'tare' } | { kind: 'part'; id: PourPart };

const ITEMS: readonly PourItem[] = ['filter', 'grounds', 'carafe', 'kettle'];
const ZONE_POS: Record<Exclude<PourZone, 'dripper'>, Vec3> = {
  scale: [0, 0.024, 0.02],
  sink: [-0.5, 0.012, 0.17],
  'filter-stack': [-0.33, 0.03, -0.14],
  'grounds-spot': [-0.17, 0.0, -0.2],
  'kettle-base': [0.2, 0.157, -0.06],
};
const DRIPPER_FROM_CARAFE = 0.148; // filter/grounds anchor above the carafe root
const DRIPPER_TOP = 0.225;
const TARE_POS: Vec3 = [0.045, 0.012, -0.066];
const DRAG_Y: Record<PourItem, number> = { filter: 0.3, grounds: 0.3, carafe: 0.06, kettle: 0.34 };
const KETTLE_BODY = new Vector3(0.17, -0.09, 0);
/** Letting go of the kettle with its spout within this distance of the dripper centre keeps it poised there. */
const POISE_MAX_OFFSET_M = 0.1;
const v3 = (p: Vec3) => new Vector3(p[0], p[1], p[2]);

export const pouroverStationFactory: SceneFactory = (opts) => createRuntime(opts, buildPouroverStation);

function buildPouroverStation(rt: Rt): Station {
  const { scene, mats, root, store, camera } = rt;
  const st = () => store.getState() as unknown as PourState;
  const meshesOf: Record<string, AbstractMesh[]> = {};
  const tag = (m: AbstractMesh, meta: Meta | null) => {
    m.metadata = meta;
    m.isPickable = !!meta;
    if (meta) (meshesOf[`${meta.kind}:${meta.id}`] ??= []).push(m);
    return m;
  };
  const node = (name: string, parent: TransformNode) => {
    const n = new TransformNode(name, scene);
    n.parent = parent;
    return n;
  };
  const cyl = (name: string, o: { d?: number; dt?: number; db?: number; h: number; t?: number; cap?: number; double?: boolean }, parent: TransformNode, y: number) => {
    const m = MeshBuilder.CreateCylinder(
      name,
      { height: o.h, diameterTop: o.dt ?? o.d, diameterBottom: o.db ?? o.d, tessellation: o.t ?? 22, cap: o.cap, sideOrientation: o.double ? Mesh.DOUBLESIDE : undefined },
      scene,
    );
    m.parent = parent;
    m.position.y = y;
    return m;
  };

  // ── scale ──
  const scaleBody = MeshBuilder.CreateBox('p-scale', { width: 0.17, height: 0.022, depth: 0.17 }, scene);
  scaleBody.parent = root;
  scaleBody.position.set(0, 0.011, 0.02);
  scaleBody.material = mats.plastic;
  tag(scaleBody, { kind: 'part', id: 'scale' });
  const display = MeshBuilder.CreatePlane('p-scale-display', { width: 0.06, height: 0.016 }, scene);
  display.parent = root;
  display.position.set(-0.035, 0.012, -0.0655);
  display.isPickable = false;
  const scaleText = (() => {
    const adt = AdvancedDynamicTexture.CreateForMesh(display, 256, 68, false);
    const bg = new Rectangle();
    bg.background = '#1d2a22';
    bg.thickness = 0;
    adt.addControl(bg);
    const tb = new TextBlock();
    tb.color = '#9ff0b0';
    tb.fontSize = 48;
    tb.fontFamily = 'ui-monospace, Consolas, monospace';
    bg.addControl(tb);
    return tb;
  })();
  const tare = MeshBuilder.CreateBox('p-tare', { width: 0.026, height: 0.01, depth: 0.006 }, scene);
  tare.parent = root;
  tare.position.copyFrom(v3(TARE_POS));
  tare.material = mats.amber;
  tag(tare, { kind: 'button', id: 'tare' });

  // ── carafe (+ dripper riding on top) ──
  const carafe = node('carafe', root);
  const profile = [
    [0.045, 0],
    [0.056, 0.02],
    [0.057, 0.08],
    [0.045, 0.125],
    [0.04, 0.14],
  ].map(([x, y]) => new Vector3(x, y, 0));
  const glass = MeshBuilder.CreateLathe('carafe-glass', { shape: profile, tessellation: 24, sideOrientation: Mesh.DOUBLESIDE }, scene);
  glass.parent = carafe;
  glass.material = mats.glass;
  tag(glass, { kind: 'item', id: 'carafe' });
  const carafeBase = cyl('carafe-base', { d: 0.09, h: 0.004 }, carafe, 0.002);
  carafeBase.material = mats.glass;
  tag(carafeBase, { kind: 'item', id: 'carafe' });
  const coffee = cyl('carafe-coffee', { d: 0.104, h: 1, t: 20 }, carafe, 0.02);
  coffee.material = mats.espresso;
  coffee.isPickable = false;
  coffee.isVisible = false;
  const dripper = node('dripper', carafe);
  dripper.position.y = 0.14;
  const ring = cyl('dripper-ring', { d: 0.085, h: 0.008, double: true }, dripper, 0.004);
  const cone = cyl('dripper-cone', { dt: 0.124, db: 0.056, h: 0.085, cap: Mesh.CAP_START, double: true }, dripper, 0.05);
  const handleBox = MeshBuilder.CreateBox('dripper-handle', { width: 0.012, height: 0.05, depth: 0.03, sideOrientation: Mesh.DOUBLESIDE }, scene);
  handleBox.parent = dripper;
  handleBox.position.set(0.07, 0.05, 0);
  const dripperMesh = mergeUnder('dripper-body', [ring, cone, handleBox], dripper);
  dripperMesh.material = mats.ceramic;
  tag(dripperMesh, { kind: 'item', id: 'carafe' });
  const bed = cyl('grounds-bed', { dt: 0.075, db: 0.038, h: 0.032 }, dripper, 0.03);
  bed.material = mats.grounds;
  bed.isVisible = false;
  bed.isPickable = false;
  const slurry = cyl('slurry', { d: 0.08, h: 0.002 }, dripper, 0.04);
  slurry.material = mats.water;
  slurry.isVisible = false;
  slurry.isPickable = false;

  // ── filter item (paper cone) + stack ──
  const filter = node('filter', root);
  const paper = cyl('filter-paper', { dt: 0.112, db: 0.045, h: 0.08, cap: Mesh.CAP_START, double: true }, filter, 0.04);
  paper.material = mats.paper;
  tag(paper, { kind: 'item', id: 'filter' });
  const stack = cyl('filter-stack', { dt: 0.112, db: 0.045, h: 0.06 }, root, 0.03);
  stack.position.x = ZONE_POS['filter-stack'][0];
  stack.position.z = ZONE_POS['filter-stack'][2];
  stack.material = mats.paper;
  tag(stack, null);

  // ── dose cup with grounds ──
  const grounds = node('grounds', root);
  const doseCup = cyl('dose-cup', { dt: 0.07, db: 0.06, h: 0.05 }, grounds, 0.025);
  doseCup.material = mats.steel;
  tag(doseCup, { kind: 'item', id: 'grounds' });
  const doseTop = cyl('dose-grounds', { d: 0.064, h: 0.004 }, grounds, 0.046);
  doseTop.material = mats.grounds;
  tag(doseTop, { kind: 'item', id: 'grounds' });

  // ── kettle (root = spout tip) ──
  const kettle = node('kettle', root);
  const body = cyl('kettle-body', { d: 0.12, h: 0.11 }, kettle, KETTLE_BODY.y);
  body.position.x = KETTLE_BODY.x;
  const lid = cyl('kettle-lid', { d: 0.09, h: 0.012 }, kettle, -0.03);
  lid.position.x = KETTLE_BODY.x;
  const kettleBody = mergeUnder('kettle-body', [body, lid], kettle);
  kettleBody.material = mats.kettle;
  tag(kettleBody, { kind: 'item', id: 'kettle' });
  const spout = MeshBuilder.CreateTube(
    'kettle-spout',
    {
      path: [
        new Vector3(0.115, -0.125, 0),
        new Vector3(0.075, -0.11, 0),
        new Vector3(0.04, -0.06, 0),
        new Vector3(0.015, -0.015, 0),
        new Vector3(0, 0, 0),
      ],
      radius: 0.0055,
      tessellation: 8,
    },
    scene,
  );
  spout.parent = kettle;
  spout.material = mats.steel;
  tag(spout, { kind: 'item', id: 'kettle' });
  const hA = MeshBuilder.CreateBox('kettle-handle-a', { width: 0.018, height: 0.085, depth: 0.022 }, scene);
  hA.position.set(0.25, -0.085, 0);
  const hB = MeshBuilder.CreateBox('kettle-handle-b', { width: 0.05, height: 0.014, depth: 0.02 }, scene);
  hB.position.set(0.228, -0.04, 0);
  const handle = mergeUnder('kettle-handle', [hA, hB], kettle);
  handle.material = mats.woodDark;
  tag(handle, { kind: 'item', id: 'kettle' });
  const base = cyl('kettle-base', { d: 0.14, h: 0.012 }, root, 0.006);
  base.position.x = 0.37;
  base.position.z = -0.06;
  base.material = mats.plastic;
  tag(base, null);

  // ── sink ──
  const sinkRim = MeshBuilder.CreateBox('sink-rim', { width: 0.22, height: 0.012, depth: 0.18 }, scene);
  sinkRim.parent = root;
  sinkRim.position.set(-0.5, 0.006, 0.17);
  sinkRim.material = mats.darkSteel;
  tag(sinkRim, { kind: 'part', id: 'sink' });

  // ── stream + cues ──
  const stream = MeshBuilder.CreateCylinder('pour-stream', { diameter: 0.005, height: 1, tessellation: 8 }, scene);
  stream.parent = root;
  stream.material = mats.water;
  stream.isPickable = false;
  stream.isVisible = false;
  const aimRing = MeshBuilder.CreateTorus('aim-ring', { diameter: POUR.bedR * 2, thickness: 0.004, tessellation: 40 }, scene);
  aimRing.parent = root;
  aimRing.isPickable = false;
  aimRing.isVisible = false;
  const wallRing = MeshBuilder.CreateTorus('wall-ring', { diameter: POUR.wallR * 2, thickness: 0.003, tessellation: 40 }, scene);
  wallRing.parent = root;
  wallRing.isPickable = false;
  wallRing.isVisible = false;
  wallRing.material = mats.ringNear;
  const arrow = makeArrow(rt);
  const ghostFilter = paper.clone('ghost-filter', null)!;
  ghostFilter.parent = root;
  ghostFilter.material = mats.ghost;
  ghostFilter.isPickable = false;
  ghostFilter.metadata = null;
  ghostFilter.isVisible = false;

  const tags: Array<{ id: PourPart; tag: ReturnType<typeof createTag>; at: () => Vector3 }> = [];
  const addTag = (id: PourPart, at: () => Vector3) => tags.push({ id, tag: createTag(scene, `ptag-${id}`, rt.tr(pourInfo(id).name), root), at });

  // ── anchors ──
  const rootNodes: Record<PourItem, TransformNode> = { filter, grounds, carafe, kettle };
  const dripperAnchor = () => rt.localOf(carafe.getAbsolutePosition()).add(new Vector3(0, DRIPPER_FROM_CARAFE, 0));
  const zoneAnchor = (z: PourZone): Vector3 => (z === 'dripper' ? dripperAnchor() : v3(ZONE_POS[z]));
  addTag('kettle', () => rt.localOf(kettle.getAbsolutePosition()).add(new Vector3(0.17, 0.0, 0)));
  addTag('dripper', () => dripperAnchor().add(new Vector3(0, 0.13, 0)));
  addTag('filter', () => v3(ZONE_POS['filter-stack']).add(new Vector3(0, 0.1, 0)));
  addTag('grounds', () => v3(ZONE_POS['grounds-spot']).add(new Vector3(0, 0.1, 0)));
  addTag('carafe', () => rt.localOf(carafe.getAbsolutePosition()).add(new Vector3(0.11, 0.06, 0)));
  addTag('scale', () => new Vector3(0.12, 0.03, -0.05));
  addTag('sink', () => v3(ZONE_POS.sink).add(new Vector3(0, 0.07, 0)));

  for (const item of ITEMS) rootNodes[item].position.copyFrom(zoneAnchor(st().items[item].zone));

  // ── interaction ──
  let drag: { item: PourItem; from: PourZone } | null = null;
  let hoverMeta: Meta | null = null;
  let hoverMeshes: AbstractMesh[] = [];
  const holdNear: Partial<Record<HandId, { zone: PourZone | null; d: number }>> = {};
  const rayGrab = new Map<number, PourItem>();
  const metaOf = (m: AbstractMesh | null | undefined): Meta | null => (m?.metadata as Meta | null) ?? null;
  const candidates = (item: PourItem): Array<{ zone: PourZone; pos: Vec3 }> =>
    (item === 'filter' || item === 'grounds' ? (['dripper'] as const) : item === 'carafe' ? (['scale', 'sink'] as const) : []).map((z) => {
      const p = zoneAnchor(z);
      return { zone: z, pos: [p.x, p.y, p.z] as Vec3 };
    });

  function setHover(meta: Meta | null) {
    if (JSON.stringify(meta) === JSON.stringify(hoverMeta)) return;
    hoverMeta = meta;
    hoverMeshes = meta ? (meshesOf[`${meta.kind}:${meta.id}`] ?? []) : [];
    if (!meta) return rt.showInfo(null);
    const id: PourPart = meta.kind === 'button' ? 'scale' : meta.id;
    const t = tags.find((x) => x.id === id);
    rt.showInfo(pourInfo(id), (t?.at() ?? new Vector3(0, 0.3, 0)).add(new Vector3(0, 0.08, 0)));
  }

  /** Stream offset from the dripper centre (m), or null when the spout isn't above it. */
  function spoutOffset(tipLocal?: Vector3): number | null {
    const tip = tipLocal ?? rt.localOf(kettle.computeWorldMatrix(true).getTranslation());
    const c = dripperAnchor();
    if (tip.y < c.y + (DRIPPER_TOP - DRIPPER_FROM_CARAFE) - 0.03) return null;
    const d = Math.hypot(tip.x - c.x, tip.z - c.z);
    return d > 0.2 ? null : d;
  }

  function dragTo(item: PourItem) {
    const ray = scene.createPickingRay(scene.pointerX, scene.pointerY, Matrix.Identity(), camera);
    const planeY = root.position.y + DRAG_Y[item];
    if (Math.abs(ray.direction.y) < 1e-4) return;
    const t = (planeY - ray.origin.y) / ray.direction.y;
    if (t <= 0) return;
    const local = rt.localOf(ray.origin.add(ray.direction.scale(t)));
    local.x = Math.max(-0.78, Math.min(0.78, local.x));
    local.z = Math.max(-0.32, Math.min(0.46, local.z));
    if (item === 'kettle') {
      // Body sits behind the spout tip, so the cursor marks where water lands.
      rootNodes.kettle.position.copyFrom(local);
      store.dispatch({ type: 'KETTLE', offsetM: spoutOffset(local), source: 'pointer' } as never);
      return;
    }
    const near = nearestZone([local.x, local.y, local.z], candidates(item), true);
    holdNear.pointer = { zone: near?.zone ?? null, d: near?.distanceM ?? Infinity };
    rootNodes[item].position.copyFrom(local);
  }
  function endDrag() {
    if (!drag) return;
    const { item, from } = drag;
    drag = null;
    camera.attachControl(true);
    if (item === 'kettle' && st().status === 'playing') {
      // Let go over the dripper → the kettle stays poised there, upright (touch-friendly):
      // pour with the wheel, ↑/↓, or the side-panel pour controls; drag it away to put it down.
      const off = spoutOffset(rt.localOf(rootNodes.kettle.computeWorldMatrix(true).getTranslation()));
      if (off !== null && off <= POISE_MAX_OFFSET_M) {
        delete holdNear.pointer;
        store.dispatch({ type: 'KETTLE', tiltDeg: 0, offsetM: off, source: 'pointer' } as never);
        return;
      }
    }
    const h = holdNear.pointer;
    delete holdNear.pointer;
    const putBack = !!h && h.zone === from && h.d <= TIERS[st().guidance].nearRadiusM;
    store.dispatch({ type: 'RELEASE', hand: 'pointer', zone: item === 'kettle' ? undefined : (h?.zone ?? undefined), distanceM: h?.zone ? (putBack ? 0 : h.d) : undefined, source: 'pointer' } as never);
  }
  const canvas = rt.engine.getRenderingCanvas();
  const kettleInPointer = () => st().items.kettle.heldBy === 'pointer';
  // Capture phase + stopImmediatePropagation: while the kettle is in hand the wheel tilts it instead of zooming.
  const onWheel = (e: WheelEvent) => {
    if (!kettleInPointer()) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    const s = st();
    store.dispatch({ type: 'KETTLE', tiltDeg: Math.max(0, Math.min(90, s.tiltDeg + (e.deltaY > 0 ? 4 : -4))), source: 'pointer' } as never);
  };
  const onKey = (e: KeyboardEvent) => {
    if ((e.key !== 'ArrowUp' && e.key !== 'ArrowDown') || !kettleInPointer()) return;
    const target = e.target as HTMLElement | null;
    if (!drag && target && target !== canvas && target !== document.body) return; // never steal arrows from sliders/lists
    e.preventDefault();
    store.dispatch({ type: 'KETTLE', tiltDeg: Math.max(0, Math.min(90, st().tiltDeg + (e.key === 'ArrowUp' ? 4 : -4))), source: 'pointer' } as never);
  };
  canvas?.addEventListener('wheel', onWheel, { passive: false, capture: true });
  window.addEventListener('keydown', onKey);
  scene.onDisposeObservable.add(() => {
    canvas?.removeEventListener('wheel', onWheel, { capture: true });
    window.removeEventListener('keydown', onKey);
  });

  // XR
  const heldIn = (hand: HandId): PourItem | null => ITEMS.find((i) => st().items[i].heldBy === hand) ?? null;
  function xrGrab(ctrl: WebXRInputSource, picked?: PourItem) {
    const hand = rt.handOf(ctrl);
    if (heldIn(hand)) return false;
    const grip = rt.gripNode(ctrl).getAbsolutePosition();
    let item = picked;
    if (!item) {
      let best = 0.14;
      for (const id of ITEMS) {
        const p = id === 'kettle' ? kettleBody.getAbsolutePosition() : rootNodes[id].getAbsolutePosition();
        const d = Vector3.Distance(grip, p);
        if (d < best) {
          best = d;
          item = id;
        }
      }
    }
    if (!item) {
      const m = metaOf(rt.xr()?.pointerSelection.getMeshUnderPointer(ctrl.uniqueId));
      if (m?.kind === 'item') item = m.id;
    }
    if (!item) return false;
    store.dispatch({ type: 'GRAB', item, hand, source: 'xr' } as never);
    if (st().items[item].heldBy !== hand) return false;
    rootNodes[item].setParent(rt.gripNode(ctrl));
    rt.pulse(ctrl, 0.25, 30);
    return true;
  }
  function xrRelease(ctrl: WebXRInputSource) {
    const hand = rt.handOf(ctrl);
    const item = heldIn(hand);
    if (!item) return;
    const r = rootNodes[item];
    r.setParent(root);
    const near = nearestZone([r.position.x, r.position.y, r.position.z], candidates(item), false);
    delete holdNear[hand];
    store.dispatch({ type: 'RELEASE', hand, zone: near?.zone, distanceM: near?.distanceM, source: 'xr' } as never);
  }
  /** Kettle tilt from its real pose: how far the spout direction dips below horizontal. */
  function kettleTilt(): number {
    const q = kettle.absoluteRotationQuaternion;
    const spoutDir = new Vector3(-1, 0, 0).applyRotationQuaternion(q);
    return Math.max(0, (Math.asin(Math.max(-1, Math.min(1, -spoutDir.y))) * 180) / Math.PI);
  }

  // ── per-frame sync ──
  const outlineCue = new Color3(0.94, 0.73, 0.23);
  const outlineHover = new Color3(1, 1, 1);
  let outlined: AbstractMesh[] = [];
  let tagKey = '';

  function frame(s: PourState, dt: number) {
    const k = rt.reducedMotion ? 1 : 1 - Math.exp(-14 * dt);
    const time = rt.time();
    // XR hands
    if (rt.inXR()) {
      for (const h of rt.hands()) {
        const held = heldIn(h.hand);
        if (held === 'kettle') store.dispatch({ type: 'KETTLE', tiltDeg: kettleTilt(), offsetM: spoutOffset(), source: 'xr' } as never);
        else if (held) {
          const p = rootNodes[held].getAbsolutePosition();
          const l = rt.localOf(p);
          const near = nearestZone([l.x, l.y, l.z], candidates(held), false);
          holdNear[h.hand] = { zone: near?.zone ?? null, d: near?.distanceM ?? Infinity };
        }
      }
    }
    // items
    for (const item of ITEMS) {
      const it = s.items[item];
      const r = rootNodes[item];
      if (it.heldBy && it.heldBy !== 'pointer' && r.parent !== root) continue;
      if (drag?.item === item) {
        if (item === 'kettle') r.rotationQuaternion = Quaternion.FromEulerAngles(0, 0, (s.tiltDeg * Math.PI) / 180);
        continue;
      }
      if (r.parent !== root) r.setParent(root);
      let target = zoneAnchor(it.zone);
      let rotZ = 0;
      if (item === 'kettle' && it.heldBy === 'pointer') {
        // Held via the action list: hover over the dripper at the chosen offset.
        const c = dripperAnchor();
        target = new Vector3(c.x + (s.offsetM ?? 0.15), DRAG_Y.kettle, c.z);
        rotZ = (s.tiltDeg * Math.PI) / 180;
      } else if (it.heldBy) target.y += 0.12;
      Vector3.LerpToRef(r.position, target, k, r.position);
      const q = r.rotationQuaternion ?? Quaternion.Identity();
      Quaternion.SlerpToRef(q, Quaternion.FromEulerAngles(0, 0, rotZ), k, q);
      r.rotationQuaternion = q;
    }
    filter.setEnabled(true);
    doseTop.isVisible = !s.groundsIn;
    // dripper contents
    bed.isVisible = s.groundsIn;
    const blooming = s.bloom.endedAtSec !== null && s.bloom.waitedSec < POUR.bloomWaitMaxSec && !s.bloom.skipped && !s.bloom.cutShort;
    bed.scaling.y = blooming ? 1.25 + (rt.reducedMotion ? 0 : 0.05 * Math.sin(time * 3)) : 1;
    bed.material = s.brewG > 0 ? mats.tamped : mats.grounds;
    const free = freeWaterG(s);
    slurry.isVisible = free > 1 || (s.groundsIn && s.bedG > 1 && kettleFlow(s) > 0);
    if (slurry.isVisible) {
      const y = 0.035 + Math.min(1, free / 120) * 0.045;
      slurry.position.y = y;
      const dia = 0.056 + ((y - 0.008) / 0.085) * 0.068;
      slurry.scaling.x = slurry.scaling.z = dia / 0.08;
      slurry.material = s.groundsIn ? mats.crema : mats.water;
    }
    coffee.isVisible = s.carafeG > 0.5;
    if (coffee.isVisible) {
      const h = Math.min(0.11, s.carafeG * 0.00018);
      coffee.scaling.y = h;
      coffee.position.y = 0.004 + h / 2;
      coffee.material = s.groundsIn ? mats.espresso : mats.water;
    }
    // stream
    const flow = kettleFlow(s);
    stream.isVisible = flow > 0;
    if (stream.isVisible) {
      const tip = rt.localOf(kettle.getAbsolutePosition());
      const spot = classifyStream(s.offsetM);
      const landing = spot === 'off' ? 0.02 : dripperAnchor().y + (s.groundsIn ? 0.05 : 0.0);
      const len = Math.max(0.01, tip.y - landing);
      stream.position.set(tip.x, tip.y - len / 2, tip.z);
      stream.scaling.y = len;
      const w = Math.sqrt(flow / 4) * (rt.reducedMotion ? 1 : 0.9 + 0.2 * Math.abs(Math.sin(time * 19)));
      stream.scaling.x = stream.scaling.z = Math.max(0.4, Math.min(2.2, w));
    }
    const reading = scaleReading(s);
    const str = `${reading.toFixed(1)}g`;
    if (scaleText.text !== str) scaleText.text = str;
    const busy = flow > 0;
    mats.amber.emissiveColor.set(busy ? 0.4 : 0.24, busy ? 0.27 : 0.16, 0.02);

    // cues
    const tier = TIERS[s.guidance];
    const cueVis = cuesOf(s);
    const cue = pourCue(s);
    const kettleHeld = s.items.kettle.heldBy !== null;
    const spot = classifyStream(s.offsetM);
    const c = dripperAnchor();
    const ringY = c.y + (DRIPPER_TOP - DRIPPER_FROM_CARAFE) + 0.004;
    const showAim = kettleHeld && (tier.zoneRings === 'all-compatible' || cueVis.cues || (tier.zoneRings === 'near' && (spot === 'wall' || spot === 'off')));
    aimRing.isVisible = showAim;
    wallRing.isVisible = showAim && tier.zoneRings !== 'snap-only';
    aimRing.position.set(c.x, ringY, c.z);
    wallRing.position.set(c.x, ringY, c.z);
    aimRing.material = spot === 'center' || spot === 'bed' ? mats.ringSnap : mats.ringIdle;
    ghostFilter.isVisible = false;
    arrow.isVisible = false;
    let cueMeshes: AbstractMesh[] = [];
    if (cueVis.cues && cue) {
      let at: Vector3 | null = null;
      if (cue.kind === 'grab') {
        at = rt.localOf(rootNodes[cue.item].getAbsolutePosition()).add(new Vector3(cue.item === 'kettle' ? 0.17 : 0, 0.13, 0));
        cueMeshes = meshesOf[`item:${cue.item}`] ?? [];
        if (cue.item === 'filter') {
          ghostFilter.isVisible = true;
          ghostFilter.position.copyFrom(dripperAnchor().add(new Vector3(0, 0.04, 0)));
        }
      } else if (cue.kind === 'place') at = zoneAnchor(cue.zone).add(new Vector3(0, 0.2, 0));
      else if (cue.kind === 'press') {
        at = v3(TARE_POS).add(new Vector3(0, 0.07, -0.02));
        cueMeshes = [tare];
      } else if (cue.kind === 'pour' && !kettleHeld) {
        at = rt.localOf(kettle.getAbsolutePosition()).add(new Vector3(0.17, 0.05, 0));
        cueMeshes = meshesOf['item:kettle'] ?? [];
      }
      if (at) {
        arrow.isVisible = true;
        arrow.position.copyFrom(at);
        if (!rt.reducedMotion) arrow.position.y += Math.sin(time * 4) * 0.012;
      }
    }
    for (const m of outlined) m.renderOutline = false;
    outlined = [];
    const apply = (ms: AbstractMesh[], color: Color3) => {
      for (const m of ms) {
        if (!m.isVisible) continue;
        m.renderOutline = true;
        m.outlineColor = color;
        m.outlineWidth = 0.002;
        outlined.push(m);
      }
    };
    apply(cueMeshes, outlineCue);
    apply(hoverMeshes, outlineHover);
    const key = `${cueVis.toolTags}|${rt.tr({ en: 'en', zh: 'zh' })}`;
    for (const x of tags) {
      x.tag.mesh.setEnabled(cueVis.toolTags);
      if (cueVis.toolTags) x.tag.mesh.position.copyFrom(x.at());
    }
    if (key !== tagKey) {
      tagKey = key;
      for (const x of tags) x.tag.set(rt.tr(pourInfo(x.id).name));
    }
  }

  return {
    cameraTargetY: 0.24,
    cameraRadius: { landscape: 1.12, portrait: 1.0 },
    frame: (s, dt) => frame(s as unknown as PourState, dt),
    onPointer(pi) {
      if (pi.type === PointerEventTypes.POINTERMOVE) {
        if (drag) dragTo(drag.item);
        else {
          const p = scene.pick(scene.pointerX, scene.pointerY, pickable);
          setHover(p?.hit ? metaOf(p.pickedMesh) : null);
        }
        return;
      }
      if (pi.type === PointerEventTypes.POINTERDOWN) {
        if (st().status !== 'playing') return;
        const p = scene.pick(scene.pointerX, scene.pointerY, pickable);
        const meta = p?.hit ? metaOf(p.pickedMesh) : null;
        if (!meta) return;
        if (meta.kind === 'item') {
          // One pointer "hand": reaching for another tool sets the poised kettle back on its base first.
          if (meta.id !== 'kettle' && kettleInPointer()) store.dispatch({ type: 'RELEASE', hand: 'pointer', source: 'pointer' } as never);
          store.dispatch({ type: 'GRAB', item: meta.id, hand: 'pointer', source: 'pointer' } as never);
          if (st().items[meta.id].heldBy === 'pointer') {
            drag = { item: meta.id, from: st().items[meta.id].zone };
            camera.detachControl();
            dragTo(meta.id);
          }
        } else if (meta.kind === 'button') store.dispatch({ type: 'PRESS', button: 'tare', source: 'pointer' } as never);
        else store.dispatch({ type: 'LOCATE', target: meta.id, source: 'pointer' } as never);
        return;
      }
      if (pi.type === PointerEventTypes.POINTERUP) endDrag();
    },
    onPointerCancel: endDrag,
    onXrPointer(pi, ctrl) {
      const pid = (pi.event as PointerEvent).pointerId;
      const meta = metaOf(pi.pickInfo?.pickedMesh ?? rt.xr()?.pointerSelection.getMeshUnderPointer(ctrl.uniqueId));
      if (pi.type === PointerEventTypes.POINTERMOVE) return setHover(meta);
      if (st().status !== 'playing') return;
      if (pi.type === PointerEventTypes.POINTERDOWN) {
        if (meta?.kind === 'item') {
          if (xrGrab(ctrl, meta.id)) rayGrab.set(pid, meta.id);
        } else if (meta?.kind === 'button') {
          store.dispatch({ type: 'PRESS', button: 'tare', source: 'xr' } as never);
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
      if (effects.some((e) => e.type === 'reset')) {
        drag = null;
        camera.attachControl(true);
        for (const item of ITEMS) if (rootNodes[item].parent !== root) rootNodes[item].setParent(root);
      }
    },
    project(target) {
      if (target === 'kettle') return rt.localOf(kettleBody.getAbsolutePosition());
      if (target === 'carafe') return rt.localOf(carafe.getAbsolutePosition()).add(new Vector3(0, 0.07, 0));
      if (target === 'filter' || target === 'grounds') return rt.localOf(rootNodes[target].getAbsolutePosition()).add(new Vector3(0, 0.03, 0));
      if (target === 'tare') return v3(TARE_POS);
      if (target === 'dripper') return dripperAnchor().add(new Vector3(0, 0.06, 0));
      if (target in ZONE_POS) return v3(ZONE_POS[target as keyof typeof ZONE_POS]);
      return null;
    },
    onLocale() {
      tagKey = '';
    },
  };
}

