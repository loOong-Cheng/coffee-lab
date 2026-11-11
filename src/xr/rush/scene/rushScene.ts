/**
 * Café Rush 3D counter (Babylon, lazy chunk). Renders RushState; every click / tap / XR trigger on a
 * target is turned into the SAME reducer actions as the action list (via actionsForTarget).
 *
 * Layout: one counter 1.5 m wide (x −0.75…0.75), everything reachable from one seated or standing spot.
 * Static station parts are merged per station with mergeUnder() (one draw call each). Items are small
 * procedural meshes that move between slot anchors and the "hand" anchor. Low-poly on purpose.
 */
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { SceneInstrumentation } from '@babylonjs/core/Instrumentation/sceneInstrumentation';
import '@babylonjs/core/Culling/ray';
import { createMaterials, type MatName } from '../../scene/materials';
import { buildRoom } from '../../scene/props';
import { mergeUnder } from '../../scene/merge';
import { createPanel, createTag, clearStack, text, COLORS, type Panel } from '../../scene/panels';
import { COUNTER, COUNTER_HEIGHT } from '../../scene/layout';
import { CUP_CAPACITY_ML, type CupSize } from '../../../features/cafe/model';
import { summarize } from '../judge';
import { processProgress, type RushStore, type Target } from '../play';
import { SLOTS, type Item, type PlayerAction, type RushState, type SlotId } from '../sim';
import { TARGET_POS } from '../vr';
import type { LocalizedText } from '../../../domain/contracts';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { Color3 as C3 } from '@babylonjs/core/Maths/math.color';
import type { RushXr } from './rushXr';

type V3 = readonly [number, number, number];

export { TARGET_POS };
/** Where an item sits when held (in front of the counter edge, raised). */
const HAND_POS: V3 = [0, 0.2, -0.38];
const ITEM_Y: Partial<Record<SlotId, number>> = { grinder: 0.1, group1: -0.07, group2: -0.07, dripper: 0, phin: 0 };

export interface RushSceneOptions {
  canvas: HTMLCanvasElement;
  store: RushStore;
  reducedMotion: boolean;
  xrSupported: boolean;
  labels: Record<Target, string>;
  wall: { title: string; lines: string[] };
  highlight(): readonly Target[];
  selected(): Target | null;
  onPick(t: Target): void;
  onXrChange?(inXr: boolean): void;
  /** Immersive mode (hardware-unverified): text, the coach hint, and the same reducer actions. */
  tr(t: LocalizedText): string;
  targetText(t: Target): LocalizedText;
  hint(): LocalizedText | null;
  onAct(a: PlayerAction): void;
  onReplay(): void;
  onLobby(): void;
}

export interface RushSceneHandle {
  readonly xrReady: boolean;
  enterVR(): Promise<{ ok: boolean; error?: string }>;
  exitVR(): Promise<void>;
  inXR(): boolean;
  resetView(): void;
  setLabels(labels: Record<Target, string>, wall: { title: string; lines: string[] }): void;
  setSeated(seated: boolean): void;
  /** Test hook: client coordinates of a target's anchor. */
  project(t: Target): { x: number; y: number } | null;
  stats(): { meshes: number; drawCalls: number; fps: number };
  /** Test hook (e2e): emulated in-headset panels + the controllers' intent functions, no session. */
  vrTest(): (RushXr['debug'] & { emulate(on: boolean): void }) | null;
  dispose(): void;
}

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
const CUP_DIM: Record<CupSize, { d: number; h: number }> = {
  demitasse: { d: 0.06, h: 0.055 },
  small: { d: 0.07, h: 0.075 },
  medium: { d: 0.085, h: 0.085 },
  large: { d: 0.09, h: 0.13 },
};

export async function createRushScene(opts: RushSceneOptions): Promise<RushSceneHandle> {
  const { canvas, store } = opts;
  const engine = new Engine(canvas, true, { xrCompatible: opts.xrSupported, stencil: true, preserveDrawingBuffer: false, powerPreference: 'high-performance' }, true);
  engine.setHardwareScalingLevel(1 / Math.min(globalThis.devicePixelRatio || 1, 1.75));
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.16, 0.11, 0.08, 1);
  scene.ambientColor = new Color3(0.25, 0.2, 0.16);
  scene.skipPointerMovePicking = true;
  const instrumentation = new SceneInstrumentation(scene);
  instrumentation.captureFrameTime = false;
  const hemi = new HemisphericLight('hemi', v(0, 1, -0.3), scene);
  hemi.intensity = 0.6;
  hemi.diffuse = new Color3(1, 0.93, 0.84);
  hemi.groundColor = new Color3(0.3, 0.22, 0.17);
  const sun = new DirectionalLight('key', v(-0.35, -1, 0.45), scene);
  sun.intensity = 0.45;

  const mats = createMaterials(scene);
  const root = new TransformNode('rush', scene);
  let counterH: number = COUNTER_HEIGHT.standing;
  root.position.set(0, counterH, 0);

  const cw = 1.6;
  const top = MeshBuilder.CreateBox('rush-top', { width: cw, height: COUNTER.thickness, depth: 0.7 }, scene);
  top.parent = root;
  top.position.set(0, -COUNTER.thickness / 2, 0.06);
  top.material = mats.wood;
  top.isPickable = false;
  const cabinet = MeshBuilder.CreateBox('rush-cabinet', { width: cw - 0.04, height: 1, depth: 0.64 }, scene);
  cabinet.parent = root;
  cabinet.material = mats.cabinet;
  cabinet.isPickable = false;
  const fitCabinet = () => {
    cabinet.scaling.y = counterH - COUNTER.thickness;
    cabinet.position.set(0, -COUNTER.thickness - (counterH - COUNTER.thickness) / 2, 0.08);
  };
  fitCabinet();
  const room = buildRoom(scene, mats, root);
  // Raise the pendant lamp so it never hangs between the user's eyes and the recipe wall / order rail.
  for (const n of ['lamp-cord', 'lamp-shade', 'lamp-bulb']) {
    const m = scene.getMeshByName(n);
    if (m) m.position.y += 0.35;
  }

  // ── static stations (merged per station) ──
  const parts: Mesh[] = [];
  const box = (w: number, h: number, d: number, p: V3, mat: MatName) => {
    const m = MeshBuilder.CreateBox('p', { width: w, height: h, depth: d }, scene);
    m.position.set(p[0], p[1], p[2]);
    m.material = mats[mat];
    m.parent = root;
    return m;
  };
  const cyl = (d: number, h: number, p: V3, mat: MatName, dt?: number) => {
    const m = MeshBuilder.CreateCylinder('p', { diameterBottom: d, diameterTop: dt ?? d, height: h, tessellation: 16 }, scene);
    m.position.set(p[0], p[1], p[2]);
    m.material = mats[mat];
    m.parent = root;
    return m;
  };
  const station = (name: string, ms: Mesh[]) => {
    // MergeMeshes keeps one material only when all match; group by material.
    const byMat = new Map<string, Mesh[]>();
    for (const m of ms) {
      const k = m.material?.name ?? '';
      byMat.set(k, [...(byMat.get(k) ?? []), m]);
    }
    for (const [k, list] of byMat) {
      const merged = mergeUnder(`${name}-${k}`, list, root);
      merged.isPickable = false;
      parts.push(merged);
    }
  };
  // espresso machine with two groups, drip tray, wand and hot-water spout
  station('machine', [
    box(0.62, 0.42, 0.2, [-0.12, 0.21, 0.36], 'machine'),
    box(0.62, 0.05, 0.12, [-0.12, 0.395, 0.24], 'machine'),
  ]);
  station('machine-metal', [
    cyl(0.07, 0.05, [-0.34, 0.335, 0.25], 'darkSteel'),
    cyl(0.07, 0.05, [-0.12, 0.335, 0.25], 'darkSteel'),
    box(0.5, 0.015, 0.12, [-0.23, 0.008, 0.18], 'darkSteel'),
    cyl(0.012, 0.22, [0.1, 0.2, 0.2], 'steel'),
    cyl(0.018, 0.06, [0.26, 0.3, 0.2], 'steel'),
  ]);
  station('grinder', [box(0.12, 0.26, 0.14, [-0.62, 0.13, 0.3], 'machine'), cyl(0.1, 0.12, [-0.62, 0.32, 0.3], 'hopper', 0.12)]);
  station('kettle-base', [cyl(0.13, 0.02, [0.45, 0.01, 0.26], 'plastic')]);
  station('brewers', [
    box(0.14, 0.012, 0.14, [0.64, 0.17, 0.27], 'woodDark'),
    box(0.012, 0.17, 0.012, [0.58, 0.085, 0.33], 'woodDark'),
    cyl(0.1, 0.07, [0.64, 0.21, 0.27], 'ceramic', 0.14),
    cyl(0.07, 0.04, [0.64, 0.17, 0.06], 'steel'),
    box(0.12, 0.01, 0.1, [0.64, 0.145, 0.06], 'darkSteel'),
  ]);
  station('hand-stations', [
    cyl(0.05, 0.03, [-0.66, 0.015, -0.16], 'ceramic'),
    cyl(0.06, 0.06, [-0.66, 0.06, -0.16], 'ceramic'),
    box(0.1, 0.07, 0.1, [-0.64, 0.035, 0.0], 'rubber'),
    box(0.14, 0.06, 0.12, [0.32, 0.03, -0.18], 'steel'),
    box(0.16, 0.25, 0.14, [0.68, 0.125, -0.17], 'steel'),
    cyl(0.1, 0.14, [0.32, 0.07, -0.01], 'darkSteel'),
  ]);
  station('extras', [
    cyl(0.035, 0.11, [0.44, 0.055, -0.18], 'woodDark'),
    cyl(0.035, 0.09, [0.49, 0.045, -0.18], 'amber'),
    cyl(0.035, 0.1, [0.54, 0.05, -0.18], 'ceramic'),
    cyl(0.035, 0.08, [0.59, 0.04, -0.2], 'paper'),
  ]);
  station('pass', [box(0.18, 0.01, 0.12, [0.47, 0.005, 0.06], 'woodLight')]);
  station('ice', [box(0.12, 0.01, 0.1, [0.32, 0.062, -0.18], 'glass')]);

  // ── pick pads (one per target; ring shows state) ──
  const pads = new Map<Target, Mesh>();
  const tags = new Map<Target, ReturnType<typeof createTag>>();
  for (const t of Object.keys(TARGET_POS) as Target[]) {
    const p = TARGET_POS[t];
    const isGroup = t === 'group1' || t === 'group2';
    const ring = MeshBuilder.CreateTorus(`pad-${t}`, { diameter: 0.1, thickness: 0.006, tessellation: 24 }, scene);
    ring.parent = root;
    ring.position.set(p[0], (isGroup ? p[1] + 0.07 : p[1]) + 0.004, p[2]);
    ring.material = mats.ringIdle;
    ring.isPickable = false;
    pads.set(t, ring);
    const hit = MeshBuilder.CreateBox(`hit-${t}`, { width: 0.14, height: isGroup ? 0.12 : 0.22, depth: 0.14 }, scene);
    hit.parent = root;
    hit.position.set(p[0], isGroup ? p[1] + 0.02 : p[1] + 0.1, p[2]);
    hit.isVisible = false;
    hit.metadata = { target: t };
    if (!t.startsWith('counter') && !t.startsWith('tray')) {
      const tag = createTag(scene, `tag-${t}`, opts.labels[t], root);
      tag.mesh.position.set(p[0], (isGroup ? 0.48 : t === 'grinder' ? 0.42 : 0.3) + (t === 'hotwater' || t === 'wand' ? 0.12 : 0), p[2] + 0.01);
      tags.set(t, tag);
    }
  }

  // ── progress bars over running stations ──
  const bars = new Map<SlotId, Mesh>();
  for (const s of ['grinder', 'group1', 'group2', 'wand', 'hotwater', 'kettleBase', 'dripper', 'phin'] as SlotId[]) {
    const b = MeshBuilder.CreateBox(`bar-${s}`, { width: 0.12, height: 0.012, depth: 0.004 }, scene);
    b.parent = root;
    const p = TARGET_POS[s];
    b.position.set(p[0], s.startsWith('group') ? 0.12 : 0.3, p[2] - 0.08);
    b.material = mats.ringSnap;
    b.isPickable = false;
    b.setEnabled(false);
    bars.set(s, b);
  }

  // ── recipe wall (back wall panel) ──
  // Left of the room's shelf, just in front of the back wall (front face at z ≈ 0.595).
  const wallPanel: Panel = createPanel(scene, 'rush-wall', 0.72, 0.5, 1024, root);
  wallPanel.mesh.position.set(-0.36, 0.74, 0.585);
  const setWall = (w: { title: string; lines: string[] }) => {
    clearStack(wallPanel);
    wallPanel.stack.addControl(text(w.title, 34, COLORS.edge, true));
    for (const l of w.lines) wallPanel.stack.addControl(text(l, 24, COLORS.text));
  };
  setWall(opts.wall);

  // ── items ──
  interface Rig {
    node: TransformNode;
    fill?: Mesh;
    load?: Mesh;
    kind: Item['kind'];
  }
  const rigs = new Map<string, Rig>();
  const makeRig = (it: Item): Rig => {
    const node = new TransformNode(`item-${it.id}`, scene);
    node.parent = root;
    const own = (m: Mesh, mat: MatName) => {
      m.material = mats[mat];
      m.parent = node;
      m.isPickable = false;
      return m;
    };
    if (it.kind === 'cup') {
      const d = CUP_DIM[it.size];
      own(MeshBuilder.CreateCylinder('cup', { diameterBottom: d.d * 0.85, diameterTop: d.d, height: d.h, tessellation: 18 }, scene), it.size === 'large' ? 'glass' : 'ceramic').position.y = d.h / 2;
      const fill = own(MeshBuilder.CreateCylinder('fill', { diameter: d.d * 0.86, height: 1, tessellation: 18 }, scene), 'espresso');
      return { node, fill, kind: 'cup' };
    }
    if (it.kind === 'portafilter') {
      own(MeshBuilder.CreateCylinder('pf', { diameter: 0.07, height: 0.03, tessellation: 18 }, scene), 'steel').position.y = 0.015;
      const h = own(MeshBuilder.CreateBox('pfh', { width: 0.025, height: 0.02, depth: 0.12 }, scene), 'rubber');
      h.position.set(0, 0.015, -0.09);
      const load = own(MeshBuilder.CreateCylinder('pfl', { diameter: 0.058, height: 0.006, tessellation: 18 }, scene), 'grounds');
      load.position.y = 0.031;
      return { node, load, kind: 'portafilter' };
    }
    if (it.kind === 'pitcher') {
      own(MeshBuilder.CreateCylinder('pit', { diameterBottom: 0.075, diameterTop: 0.06, height: 0.1, tessellation: 18 }, scene), 'steel').position.y = 0.05;
      const load = own(MeshBuilder.CreateCylinder('milk', { diameter: 0.058, height: 0.004, tessellation: 18 }, scene), 'ceramic');
      load.position.y = 0.085;
      return { node, load, kind: 'pitcher' };
    }
    if (it.kind === 'kettle') {
      own(MeshBuilder.CreateCylinder('ket', { diameterBottom: 0.11, diameterTop: 0.08, height: 0.13, tessellation: 18 }, scene), 'kettle').position.y = 0.075;
      const spout = own(MeshBuilder.CreateCylinder('spout', { diameter: 0.012, height: 0.12, tessellation: 8 }, scene), 'kettle');
      spout.position.set(0, 0.11, -0.07);
      spout.rotation.x = -0.9;
      const load = own(MeshBuilder.CreateSphere('steam', { diameter: 0.03, segments: 6 }, scene), 'led');
      load.position.y = 0.16;
      return { node, load, kind: 'kettle' };
    }
    own(MeshBuilder.CreateCylinder('dos', { diameter: 0.055, height: 0.06, tessellation: 16 }, scene), 'steel').position.y = 0.03;
    const load = own(MeshBuilder.CreateCylinder('dosl', { diameter: 0.048, height: 0.005, tessellation: 16 }, scene), 'grounds');
    load.position.y = 0.058;
    return { node, load, kind: 'doser' };
  };

  const liquidMat = (s: ReturnType<typeof summarize>): StandardMaterial | null => {
    if (s.milk !== 'none' && s.milk !== 'cold') return mats.ceramic;
    if (s.milk === 'cold') return mats.paper;
    if (s.method) return mats.espresso;
    if (s.waterMl) return mats.water;
    return null;
  };

  let dirty = true;
  const unsub = store.subscribe(() => (dirty = true));
  let bob = 0;
  const sync = (s: RushState) => {
    const seen = new Set<string>();
    for (const it of Object.values(s.items)) {
      seen.add(it.id);
      let rig = rigs.get(it.id);
      if (!rig) {
        rig = makeRig(it);
        rigs.set(it.id, rig);
      }
      const slot = SLOTS.find((k) => s.slots[k] === it.id) ?? null;
      const p: V3 = slot ? TARGET_POS[slot] : HAND_POS;
      rig.node.position.set(p[0], p[1] + (slot ? (ITEM_Y[slot] ?? 0) : 0), slot === 'group1' || slot === 'group2' ? p[2] + 0.02 : p[2]);
      rig.node.rotation.y = slot === 'group1' || slot === 'group2' ? Math.PI : 0;
      if (it.kind === 'cup' && rig.fill) {
        const sum = summarize(it);
        const vol = it.adds.reduce((n, a) => n + (a.k === 'shot' ? 36 : a.k === 'brew' ? 200 : a.k === 'water' || a.k === 'milk' ? a.ml : a.k === 'ice' ? 80 : 20), 0);
        const frac = Math.min(1, vol / CUP_CAPACITY_ML[it.size]);
        const d = CUP_DIM[it.size];
        const mat = liquidMat(sum);
        rig.fill.setEnabled(!!mat && frac > 0);
        if (mat) rig.fill.material = mat;
        rig.fill.scaling.y = Math.max(0.002, d.h * 0.92 * frac);
        rig.fill.position.y = 0.004 + (d.h * 0.92 * frac) / 2;
      } else if (it.kind === 'portafilter' && rig.load) {
        rig.load.setEnabled(it.load !== 'empty');
        rig.load.material = it.load === 'puck' ? mats.spent : mats.grounds;
      } else if (it.kind === 'pitcher' && rig.load) {
        rig.load.setEnabled(!!it.milk);
        rig.load.material = it.milk?.overheated ? mats.amber : it.milk?.state === 'cold' ? mats.paper : mats.ceramic;
      } else if (it.kind === 'kettle' && rig.load) {
        rig.load.setEnabled(it.hot && it.pours > 0);
      } else if (it.kind === 'doser' && rig.load) {
        rig.load.setEnabled(it.filled);
      }
    }
    for (const [id, rig] of rigs) {
      if (seen.has(id)) continue;
      rig.node.dispose();
      rigs.delete(id);
    }
  };

  const hl = () => new Set(opts.highlight());
  let xrPads: ReadonlyMap<Target, 'hover' | 'snap'> = new Map();
  let xrPadKey = '';
  const paintPads = () => {
    const h = hl();
    const sel = opts.selected();
    for (const [t, ring] of pads) {
      const over = xrPads.get(t);
      ring.material = over || t === sel ? mats.ringNear : h.has(t) ? mats.ringSnap : mats.ringIdle;
      ring.scaling.setAll(over === 'snap' ? 1.45 : over === 'hover' ? 1.25 : 1);
    }
  };
  // hover outline on the item(s) at the pointed targets (XR)
  const outlined = new Set<AbstractMesh>();
  const outlineColor = new C3(0.94, 0.73, 0.23);
  const outline = (targets: readonly Target[]) => {
    const want = new Set<AbstractMesh>();
    const st = store.get();
    for (const t of targets) {
      const id = (st.slots as Record<string, string | null>)[t];
      const rig = id ? rigs.get(id) : undefined;
      for (const m of rig?.node.getChildMeshes() ?? []) want.add(m);
    }
    for (const m of outlined) if (!want.has(m)) m.renderOutline = false;
    for (const m of want) {
      m.renderOutline = true;
      m.outlineColor = outlineColor;
      m.outlineWidth = 0.004;
    }
    outlined.clear();
    for (const m of want) outlined.add(m);
  };

  // ── camera ──
  const camera = new ArcRotateCamera('rush-cam', -Math.PI / 2, 1.0, 1.6, v(0, counterH + 0.24, 0.1), scene);
  camera.minZ = 0.05;
  camera.lowerAlphaLimit = -Math.PI / 2 - 0.6;
  camera.upperAlphaLimit = -Math.PI / 2 + 0.6;
  camera.lowerBetaLimit = 0.55;
  camera.upperBetaLimit = 1.35;
  camera.lowerRadiusLimit = 0.9;
  camera.upperRadiusLimit = 2.8;
  camera.wheelDeltaPercentage = 0.01;
  camera.panningSensibility = 0;
  camera.attachControl(canvas, true);
  const resetView = () => {
    const aspect = engine.getAspectRatio(camera);
    camera.fovMode = aspect < 1 ? ArcRotateCamera.FOVMODE_HORIZONTAL_FIXED : ArcRotateCamera.FOVMODE_VERTICAL_FIXED;
    camera.fov = aspect < 1 ? 1.15 : 0.8;
    camera.alpha = -Math.PI / 2;
    camera.beta = aspect < 1 ? 0.95 : 1.12;
    camera.radius = aspect < 1 ? 1.9 : 1.75;
    camera.setTarget(v(0, counterH + 0.24, 0.1));
  };
  resetView();

  let xr: RushXr | null = null;
  let time = 0;
  let lastInputAt = 0;
  let frameNo = 0;

  // ── input: tap / click a target ──
  const pickAt = (x: number, y: number): Target | null => {
    const p = scene.pick(x, y, (m) => !!(m.metadata as { target?: Target } | null)?.target && m.isEnabled());
    return p?.hit ? ((p.pickedMesh?.metadata as { target: Target }).target ?? null) : null;
  };
  scene.onPointerObservable.add((pi) => {
    if (pi.type !== PointerEventTypes.POINTERTAP || xr?.inXR()) return;
    lastInputAt = time;
    const t = pickAt(scene.pointerX, scene.pointerY);
    if (t) opts.onPick(t);
  });

  // ── WebXR (only when the browser reports immersive-vr in a secure context; hardware-unverified) ──
  const setSeatedH = (seated: boolean) => {
    counterH = seated ? COUNTER_HEIGHT.seated : COUNTER_HEIGHT.standing;
    root.position.y = counterH;
    fitCabinet();
    if (!xr?.inXR()) resetView();
  };
  if (opts.xrSupported) {
    try {
      const { createRushXr } = await import('./rushXr');
      xr = await createRushXr({
        scene,
        camera,
        root,
        floor: room[0]!,
        store,
        hand: mats.hand,
        wall: wallPanel,
        tr: (t) => opts.tr(t),
        targetName: (t) => opts.targetText(t),
        hint: () => opts.hint(),
        onAct: (a) => opts.onAct(a),
        onReplay: () => opts.onReplay(),
        onLobby: () => opts.onLobby(),
        onXrChange: (now) => {
          if (!now) {
            root.rotation.y = 0;
            root.position.set(0, counterH, 0);
            dirty = true;
          }
          opts.onXrChange?.(now);
        },
        seated: () => counterH <= COUNTER_HEIGHT.seated + 0.001,
        setSeated: setSeatedH,
        counterH: () => counterH,
        rigNode: (id) => rigs.get(id)?.node,
        outline,
        setPads(p) {
          const key = [...p].map(([t, m]) => `${t}:${m}`).join();
          if (key === xrPadKey) return;
          xrPadKey = key;
          xrPads = p;
          paintPads();
        },
        restoreView: resetView,
      });
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[rush] WebXR unavailable', err);
      xr = null; // graceful: the 3D counter keeps working
    }
  }

  // Perf: when nobody touches the non-immersive scene, draw every other frame (as in the missions).
  // Input or camera motion restores full rate at once; the immersive session always draws every frame.
  camera.onViewMatrixChangedObservable.add(() => (lastInputAt = time));
  engine.runRenderLoop(() => {
    const dt = Math.min(engine.getDeltaTime() / 1000, 0.1);
    time += dt;
    const inXR = !!xr?.inXR();
    xr?.frame(dt);
    const s = store.get();
    if (dirty) {
      dirty = false;
      sync(s);
      paintPads();
      lastInputAt = time;
    }
    for (const [slot, bar] of bars) {
      const p = processProgress(s, slot);
      bar.setEnabled(p !== null);
      if (p !== null) bar.scaling.x = Math.max(0.05, p);
    }
    if (!inXR && !opts.reducedMotion && s.hand) {
      bob += dt;
      const r = rigs.get(s.hand);
      if (r) r.node.position.y = HAND_POS[1] + Math.sin(bob * 2) * 0.006;
    }
    frameNo += 1;
    if (inXR || time - lastInputAt < 1.5 || frameNo % 2 === 0) scene.render();
    if (frameNo % 30 === 0) canvas.dataset.drawCalls = String(instrumentation.drawCallsCounter.current);
  });
  const resize = () => engine.resize();
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
  ro?.observe(canvas);
  window.addEventListener('resize', resize);

  const handle: RushSceneHandle = {
    get xrReady() {
      return !!xr;
    },
    async enterVR() {
      if (!xr) return { ok: false, error: 'xr-unavailable' };
      return xr.enter();
    },
    async exitVR() {
      await xr?.exit();
    },
    inXR: () => !!xr?.inXR(),
    resetView,
    setLabels(labels, wall) {
      for (const [t, tag] of tags) tag.set(labels[t]);
      setWall(wall);
      xr?.invalidate();
    },
    setSeated: setSeatedH,
    project(t) {
      const p = TARGET_POS[t];
      const world = Vector3.TransformCoordinates(v(p[0], p[1] + 0.05, p[2]), root.computeWorldMatrix(true));
      const vp = camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
      const sp = Vector3.Project(world, Matrix.Identity(), scene.getTransformMatrix(), vp);
      const rect = canvas.getBoundingClientRect();
      const sx = rect.width / engine.getRenderWidth();
      const sy = rect.height / engine.getRenderHeight();
      return { x: rect.left + sp.x * sx, y: rect.top + sp.y * sy };
    },
    vrTest: () => (xr ? { ...xr.debug, emulate: (on: boolean) => xr?.emulate(on) } : null),
    stats: () => ({ meshes: scene.meshes.length, drawCalls: instrumentation.drawCallsCounter.current, fps: Math.round(engine.getFps()) }),
    dispose() {
      unsub();
      ro?.disconnect();
      window.removeEventListener('resize', resize);
      const x = xr;
      xr = null;
      const finish = () => {
        engine.stopRenderLoop();
        scene.dispose();
        engine.dispose();
      };
      // end an immersive session first, then tear the engine down
      if (x) void x.dispose().finally(finish);
      else finish();
    },
  };
  return handle;
}
