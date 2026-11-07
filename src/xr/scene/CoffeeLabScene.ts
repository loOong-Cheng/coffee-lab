/**
 * Babylon adapter for the espresso mission. It renders state and turns input
 * into the SAME pure actions the tests and the 2D action list use:
 *  - mouse/touch: drag items on a counter-height plane (planar snap distance), click buttons/parts;
 *  - WebXR controllers: grip (squeeze) to grab near or along the ray, trigger to press/point-grab,
 *    release near a ring to place (true 3D distance + portafilter angle), poke buttons.
 * Hand tracking is NOT enabled (not relied on). Hardware-unverified: never run on a real headset.
 */
import '@babylonjs/core/Culling/ray';
import '@babylonjs/core/Rendering/outlineRenderer';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { PointerEventTypes, type PointerInfo } from '@babylonjs/core/Events/pointerEvents';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { SceneInstrumentation } from '@babylonjs/core/Instrumentation/sceneInstrumentation';
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture';
import { TextBlock } from '@babylonjs/gui/2D/controls/textBlock';
import { Rectangle } from '@babylonjs/gui/2D/controls/rectangle';
import { Control } from '@babylonjs/gui/2D/controls/control';
import type { WebXRDefaultExperience } from '@babylonjs/core/XR/webXRDefaultExperience';
import type { WebXRInputSource } from '@babylonjs/core/XR/webXRInputSource';
import type { Locale, LocalizedText } from '../../domain/contracts';
import type { HandId, InspectableId, ItemId, MissionState, ZoneId } from '../mission/types';
import type { MissionStore } from '../mission/store';
import { GUIDANCE_ORDER, TIERS } from '../mission/tiers';
import { MODEL, RECIPE } from '../mission/extraction';
import { GUIDANCE_LABEL, NOT_TRAINED, STEPS, STEP_ORDER, TOOL_INFO } from '../mission/content';
import { cuesFor, currentStepIndex, heldItem, isAt, scaleReadingG, stepCue, zonesFor } from '../mission/reducer';
import { buildSummary } from '../mission/summary';
import { S } from '../strings';
import { createMaterials, type Materials } from './materials';
import { buildRoom, buildStation, type PickMeta, type Station } from './props';
import { COLORS, button, clearStack, createPanel, createTag, row, text } from './panels';
import {
  BASKET_TOP_OFFSET,
  BUTTON_POS,
  COUNTER_HEIGHT,
  PART_TAG_POS,
  USER_DISTANCE,
  ZONE_POS,
  ZONE_YAW,
  nearestZone,
  type Vec3,
} from './layout';

export interface CoffeeLabOptions {
  canvas: HTMLCanvasElement;
  store: MissionStore;
  locale: Locale;
  reducedMotion: boolean;
  /** Only set up WebXR when the capability check said immersive-vr is supported. */
  xrSupported: boolean;
  onXrChange?(inXr: boolean): void;
  onHover?(id: InspectableId | null): void;
  onLocaleToggle?(): void;
}

export interface CoffeeLabStats {
  meshes: number;
  activeMeshes: number;
  drawCalls: number;
  fps: number;
}

export interface CoffeeLabHandle {
  readonly xrReady: boolean;
  enterVR(): Promise<{ ok: boolean; error?: string }>;
  exitVR(): Promise<void>;
  inXR(): boolean;
  setLocale(l: Locale): void;
  setCounterHeight(mode: 'standing' | 'seated' | 'up' | 'down'): void;
  recenter(): void;
  resetView(): void;
  stats(): CoffeeLabStats;
  /**
   * Test/diagnostic hook: client (CSS px) coordinates of an item, zone, button or the machine,
   * so browser tests can perform real mouse drags. Not used by the app itself.
   */
  project(target: ItemId | ZoneId | 'brew' | 'grinder' | 'tare' | 'espresso-machine', atLocalY?: number): { x: number; y: number } | null;
  dispose(): void;
}

const DRAG_Y: Record<ItemId, number> = { portafilter: 0.17, cup: 0.1, tamper: 0.1 };
const LERP_RATE = 14;
const NEAR_GRAB_M = 0.13;
const POKE_M = 0.03;

const v3 = (p: Vec3) => new Vector3(p[0], p[1], p[2]);

export async function createCoffeeLab(opts: CoffeeLabOptions): Promise<CoffeeLabHandle> {
  const { canvas, store } = opts;
  let locale = opts.locale;
  const tr = (t: LocalizedText) => t[locale] || t.en;

  const engine = new Engine(
    canvas,
    true,
    { xrCompatible: opts.xrSupported, stencil: true, preserveDrawingBuffer: false, powerPreference: 'high-performance' },
    true,
  );
  engine.setHardwareScalingLevel(1 / Math.min(globalThis.devicePixelRatio || 1, 1.75));
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.16, 0.11, 0.08, 1);
  scene.ambientColor = new Color3(0.25, 0.2, 0.16);
  scene.skipPointerMovePicking = true; // we pick explicitly with a predicate
  const instrumentation = new SceneInstrumentation(scene);

  // ── lights: warm café ──
  const hemi = new HemisphericLight('hemi', new Vector3(0, 1, -0.3), scene);
  hemi.intensity = 0.5;
  hemi.diffuse = new Color3(1, 0.93, 0.84);
  hemi.groundColor = new Color3(0.3, 0.22, 0.17);
  const sun = new DirectionalLight('key', new Vector3(-0.35, -1, 0.45), scene);
  sun.intensity = 0.42;
  sun.diffuse = new Color3(1, 0.9, 0.78);
  const lamp = new PointLight('lamp', new Vector3(0, 1.7, 0.2), scene);
  lamp.intensity = 0.35;
  lamp.diffuse = new Color3(1, 0.78, 0.52);
  lamp.range = 2.6;

  const mats = createMaterials(scene);
  const station = buildStation(scene, mats);
  const room = buildRoom(scene, mats, station.root);
  const root = station.root;
  let counterH: number = COUNTER_HEIGHT.standing;
  root.position.set(0, counterH, 0);

  // ── camera (non-immersive fallback) with orbit limits ──
  const camera = new ArcRotateCamera('cam', -Math.PI / 2, 1.08, 1.3, new Vector3(0, counterH + 0.14, 0.06), scene);
  /** Portrait screens keep the whole counter in frame by fixing the horizontal FOV. */
  const fitFov = () => {
    const aspect = engine.getAspectRatio(camera);
    camera.fovMode = aspect < 1 ? ArcRotateCamera.FOVMODE_HORIZONTAL_FIXED : ArcRotateCamera.FOVMODE_VERTICAL_FIXED;
    camera.fov = aspect < 1 ? 1.0 : 0.8;
  };
  const resetView = () => {
    fitFov();
    const portrait = engine.getAspectRatio(camera) < 1;
    camera.alpha = -Math.PI / 2;
    camera.beta = portrait ? 0.92 : 1.08;
    camera.radius = portrait ? 1.25 : 1.3;
    camera.setTarget(new Vector3(root.position.x, root.position.y + 0.14, root.position.z + 0.06));
  };
  camera.lowerAlphaLimit = -Math.PI / 2 - 0.75;
  camera.upperAlphaLimit = -Math.PI / 2 + 0.75;
  camera.lowerBetaLimit = 0.45;
  camera.upperBetaLimit = 1.42;
  camera.lowerRadiusLimit = 0.6;
  camera.upperRadiusLimit = 2.2;
  camera.panningSensibility = 0;
  camera.wheelDeltaPercentage = 0.01;
  camera.pinchDeltaPercentage = 0.004;
  camera.minZ = 0.02;
  camera.attachControl(true);

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
  const arrow = (() => {
    const cone = MeshBuilder.CreateCylinder('arrow-head', { diameterTop: 0, diameterBottom: 0.04, height: 0.045, tessellation: 12 }, scene);
    cone.rotation.x = Math.PI;
    const shaft = MeshBuilder.CreateCylinder('arrow-shaft', { diameter: 0.012, height: 0.05, tessellation: 8 }, scene);
    shaft.position.y = 0.045;
    const m = Mesh.MergeMeshes([cone, shaft], true, true)!;
    m.name = 'arrow';
    m.parent = root;
    m.material = mats.arrow;
    m.isPickable = false;
    m.isVisible = false;
    return m;
  })();
  const ghosts = {} as Record<ItemId, TransformNode>;
  for (const item of ['portafilter', 'cup', 'tamper'] as const) {
    const g = new TransformNode(`ghost-${item}`, scene);
    g.parent = root;
    for (const m of station.items[item].meshes) {
      if (m === station.coffee.mound || m === station.coffee.bed || m === station.cupLiquid) continue;
      const c = m.clone(`ghost-${m.name}`, g)!;
      c.material = mats.ghost;
      c.isPickable = false;
      c.metadata = null;
      c.isVisible = true;
    }
    g.setEnabled(false);
    ghosts[item] = g;
  }

  // ── panels ──
  const mainPanel = createPanel(scene, 'xr-main', 0.64, 0.52, 1024, root);
  mainPanel.mesh.position.set(-0.66, 0.62, 0.26);
  mainPanel.mesh.rotation.y = -0.6;
  mainPanel.mesh.setEnabled(false);
  const infoPanel = createPanel(scene, 'xr-info', 0.34, 0.13, 640, root);
  infoPanel.mesh.billboardMode = TransformNode.BILLBOARDMODE_ALL;
  infoPanel.mesh.isPickable = false;
  infoPanel.mesh.setEnabled(false);

  const monitor = (() => {
    const mesh = MeshBuilder.CreatePlane('monitor', { width: 0.26, height: 0.12 }, scene);
    mesh.parent = root;
    mesh.position.set(0, 0.56, 0.1);
    mesh.billboardMode = TransformNode.BILLBOARDMODE_Y;
    mesh.isPickable = false;
    const adt = AdvancedDynamicTexture.CreateForMesh(mesh, 640, 296, false);
    const card = new Rectangle();
    card.background = COLORS.card;
    card.color = COLORS.edge;
    card.thickness = 3;
    card.cornerRadius = 22;
    adt.addControl(card);
    const big = new TextBlock();
    big.fontSize = 96;
    big.fontWeight = '700';
    big.color = COLORS.text;
    big.top = '-40px';
    card.addControl(big);
    const small = new TextBlock();
    small.fontSize = 34;
    small.color = COLORS.muted;
    small.top = '46px';
    card.addControl(small);
    const barBg = new Rectangle();
    barBg.width = '560px';
    barBg.height = '20px';
    barBg.top = '104px';
    barBg.background = '#4a3426';
    barBg.thickness = 0;
    barBg.cornerRadius = 10;
    card.addControl(barBg);
    const bar = new Rectangle();
    bar.height = '20px';
    bar.thickness = 0;
    bar.cornerRadius = 10;
    bar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    barBg.addControl(bar);
    const tick = new Rectangle();
    tick.width = '4px';
    tick.height = '30px';
    tick.background = COLORS.text;
    tick.thickness = 0;
    tick.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    tick.left = `${Math.round((RECIPE.targetYieldG / 48) * 560)}px`;
    barBg.addControl(tick);
    return { mesh, big, small, bar, key: '' };
  })();

  const scaleText = (() => {
    const adt = AdvancedDynamicTexture.CreateForMesh(station.scaleDisplay, 256, 82, false);
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

  // Tool tags (guided tier). Items' tags ride along with the item.
  const tags: Array<{ id: InspectableId; tag: ReturnType<typeof createTag> }> = [];
  for (const [id, pos] of Object.entries(PART_TAG_POS) as Array<[InspectableId, Vec3]>) {
    const t = createTag(scene, `tag-${id}`, tr(TOOL_INFO[id].name), root);
    t.mesh.position.copyFrom(v3(pos));
    tags.push({ id, tag: t });
  }
  for (const item of ['portafilter', 'cup', 'tamper'] as const) {
    const t = createTag(scene, `tag-${item}`, tr(TOOL_INFO[item].name), station.items[item].root);
    t.mesh.position.set(0, item === 'tamper' ? 0.14 : 0.1, 0);
    tags.push({ id: item, tag: t });
  }

  // ── item placement helpers ──
  const quatYaw = (yaw: number) => Quaternion.FromEulerAngles(0, yaw, 0);
  for (const item of ['portafilter', 'cup', 'tamper'] as const) {
    const r = station.items[item].root;
    const zone = store.getState().items[item].zone;
    r.position.copyFrom(zoneAnchor(zone));
    r.rotationQuaternion = quatYaw(ZONE_YAW[zone] ?? 0);
  }

  function zoneAnchor(zone: ZoneId): Vector3 {
    if (zone === 'basket') {
      const pf = station.items.portafilter.root;
      const local = localOf(pf.getAbsolutePosition());
      return local.add(new Vector3(0, BASKET_TOP_OFFSET, 0));
    }
    return v3(ZONE_POS[zone]);
  }

  const invRoot = new Matrix();
  function localOf(world: Vector3): Vector3 {
    root.computeWorldMatrix(true).invertToRef(invRoot);
    return Vector3.TransformCoordinates(world, invRoot);
  }

  function zoneCandidates(s: MissionState, item: ItemId, hand: HandId): Array<{ zone: ZoneId; pos: Vec3 }> {
    return zonesFor(item)
      .filter((z) => {
        if (z !== 'basket') return true;
        // The tamper's target only exists while there are fresh grounds and the portafilter is steady.
        const pf = s.items.portafilter;
        return s.basket === 'dosed' && (isAt(s, 'portafilter', 'tamp-mat') || (pf.heldBy !== null && pf.heldBy !== hand));
      })
      .map((z) => {
        const p = zoneAnchor(z);
        return { zone: z, pos: [p.x, p.y, p.z] as Vec3 };
      });
  }

  // ── interaction state ──
  type Drag = { item: ItemId };
  let drag: Drag | null = null;
  let hoverMeta: PickMeta | null = null;
  let hoverMeshes: AbstractMesh[] = [];
  const twist: Partial<Record<ItemId, number>> = {};
  const pressAnim: Partial<Record<'brew' | 'grinder' | 'tare', number>> = {};
  /** Per-hand live distance to the nearest zone while holding (drives rings). */
  const holdInfo: Partial<Record<HandId, { item: ItemId; zone: ZoneId | null; distanceM: number }>> = {};
  let disposed = false;

  const pickPredicate = (m: AbstractMesh) => m.isPickable && m.isEnabled() && m.isVisible && !!m.metadata;

  function metaOf(m: AbstractMesh | null | undefined): PickMeta | null {
    return (m?.metadata as PickMeta | null) ?? null;
  }

  function meshesFor(meta: PickMeta | null): AbstractMesh[] {
    if (!meta) return [];
    if (meta.kind === 'item') return station.items[meta.id].meshes.filter((m) => m.isVisible);
    if (meta.kind === 'button') return [station.buttons[meta.id]];
    return station.parts[meta.id] ?? [];
  }

  function setHover(meta: PickMeta | null) {
    const same = JSON.stringify(meta) === JSON.stringify(hoverMeta);
    if (same) return;
    hoverMeta = meta;
    hoverMeshes = meshesFor(meta);
    const id: InspectableId | null =
      meta === null ? null : meta.kind === 'button' ? (meta.id === 'brew' ? 'brew-button' : meta.id === 'tare' ? 'scale' : 'grinder') : meta.id;
    opts.onHover?.(id);
    renderInfo(id);
  }

  function renderInfo(id: InspectableId | null) {
    if (!id || !inXR) {
      infoPanel.mesh.setEnabled(false);
      return;
    }
    const key = `${id}|${locale}`;
    if (infoPanel.key !== key) {
      infoPanel.key = key;
      clearStack(infoPanel);
      infoPanel.stack.addControl(text(tr(TOOL_INFO[id].name), 40, COLORS.text, true));
      infoPanel.stack.addControl(text(tr(TOOL_INFO[id].purpose), 32, COLORS.muted));
    }
    const FIXED: Partial<Record<InspectableId, Vec3>> = {
      'brew-button': [0.11, 0.45, 0.02],
      'group-head': [0, 0.4, -0.04],
      'drip-tray': [0, 0.2, -0.12],
    };
    const fixed = FIXED[id] ?? (id in PART_TAG_POS ? PART_TAG_POS[id as keyof typeof PART_TAG_POS] : null);
    const pos = fixed
      ? v3(fixed).add(new Vector3(0, 0.08, 0))
      : localOf(station.items[id as ItemId].root.getAbsolutePosition()).add(new Vector3(0, 0.2, 0));
    infoPanel.mesh.position.copyFrom(pos);
    infoPanel.mesh.setEnabled(true);
  }

  // ── pointer (mouse / touch / XR ray via pointer selection) ──
  let xr: WebXRDefaultExperience | null = null;
  let inXR = false;
  const rayGrab = new Map<number, ItemId>();

  function xrControllerFor(pi: PointerInfo): WebXRInputSource | null {
    if (!xr) return null;
    try {
      return xr.pointerSelection.getXRControllerByPointerId((pi.event as PointerEvent).pointerId) ?? null;
    } catch {
      return null;
    }
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
  function resolvePick(meta: PickMeta | null, pickedPoint: Vector3 | null | undefined): PickMeta | null {
    if (!meta || meta.kind !== 'part') return meta;
    const zone = PART_ZONE[meta.id];
    if (!zone) return meta;
    const s = store.getState();
    for (const item of ['portafilter', 'cup', 'tamper'] as const) {
      if (!isAt(s, item, zone)) continue;
      const close = !pickedPoint || Vector3.Distance(pickedPoint, station.items[item].root.getAbsolutePosition()) < 0.09;
      if (close) return { kind: 'item', id: item };
    }
    return meta;
  }

  function pickAtPointer(): PickMeta | null {
    const pick = scene.pick(scene.pointerX, scene.pointerY, pickPredicate);
    return pick?.hit ? resolvePick(metaOf(pick.pickedMesh), pick.pickedPoint) : null;
  }

  function dragTo(item: ItemId): void {
    const ray = scene.createPickingRay(scene.pointerX, scene.pointerY, Matrix.Identity(), camera);
    const planeY = root.position.y + DRAG_Y[item];
    if (Math.abs(ray.direction.y) < 1e-4) return;
    const t = (planeY - ray.origin.y) / ray.direction.y;
    if (t <= 0) return;
    const hit = ray.origin.add(ray.direction.scale(t));
    const local = localOf(hit);
    local.x = Math.max(-0.78, Math.min(0.78, local.x));
    local.z = Math.max(-0.32, Math.min(0.46, local.z));
    const s = store.getState();
    const near = nearestZone([local.x, local.y, local.z], zoneCandidates(s, item, 'pointer'), true);
    const tier = TIERS[s.guidance];
    holdInfo.pointer = { item, zone: near?.zone ?? null, distanceM: near?.distanceM ?? Infinity };
    if (near && near.distanceM <= tier.nearRadiusM) {
      // Magnet preview: settle toward the slot height as it gets close.
      const zp = zoneAnchor(near.zone);
      const k = 1 - Math.min(1, near.distanceM / tier.nearRadiusM);
      local.y = local.y + (zp.y + 0.012 - local.y) * k;
    }
    const r = station.items[item].root;
    r.position.copyFrom(local);
  }

  function endDrag(): void {
    if (!drag) return;
    drag = null;
    camera.attachControl(true);
    const info = holdInfo.pointer;
    delete holdInfo.pointer;
    store.dispatch({
      type: 'RELEASE',
      hand: 'pointer',
      zone: info?.zone ?? undefined,
      distanceM: info?.zone ? info.distanceM : undefined,
      angleDeg: 0,
      tiltDeg: 0,
      source: 'pointer',
    });
  }

  scene.onPointerObservable.add((pi) => {
    if (disposed) return;
    const s = store.getState();
    const ctrl = xrControllerFor(pi);
    if (ctrl) {
      handleXrPointer(pi, ctrl);
      return;
    }
    if (pi.type === PointerEventTypes.POINTERMOVE) {
      if (drag) dragTo(drag.item);
      else setHover(pickAtPointer());
      return;
    }
    if (pi.type === PointerEventTypes.POINTERDOWN) {
      if (s.status !== 'playing') return;
      const meta = pickAtPointer();
      if (!meta) return;
      if (meta.kind === 'item') {
        store.dispatch({ type: 'GRAB', item: meta.id, hand: 'pointer', source: 'pointer' });
        if (store.getState().items[meta.id].heldBy === 'pointer') {
          drag = { item: meta.id };
          camera.detachControl();
          dragTo(meta.id);
        }
      } else if (meta.kind === 'button') {
        press(meta.id, 'pointer');
      } else {
        store.dispatch({ type: 'LOCATE', target: meta.id, source: 'pointer' });
      }
      return;
    }
    if (pi.type === PointerEventTypes.POINTERUP) endDrag();
  });
  const onWindowUp = () => endDrag();
  window.addEventListener('pointerup', onWindowUp);
  window.addEventListener('blur', onWindowUp);

  function press(b: 'brew' | 'grinder' | 'tare', source: 'pointer' | 'xr') {
    pressAnim[b] = 0.18;
    store.dispatch({ type: 'PRESS', button: b, source });
  }

  // ── WebXR (only when the browser says immersive-vr is supported) ──
  const hands = new Map<string, { ctrl: WebXRInputSource; hand: HandId; proxy: Mesh; pokeCooldown: number }>();

  function handOf(ctrl: WebXRInputSource): HandId {
    return ctrl.inputSource.handedness === 'left' ? 'left' : 'right';
  }
  function gripNode(ctrl: WebXRInputSource): TransformNode {
    return (ctrl.grip ?? ctrl.pointer) as TransformNode;
  }
  function pulse(ctrl: WebXRInputSource | undefined, strength = 0.3, ms = 40) {
    try {
      void ctrl?.motionController?.pulse(strength, ms)?.catch?.(() => {});
    } catch {
      /* haptics optional */
    }
  }

  function xrGrab(ctrl: WebXRInputSource, picked?: ItemId): boolean {
    const hand = handOf(ctrl);
    const s = store.getState();
    if (heldItem(s, hand)) return false;
    const grip = gripNode(ctrl).getAbsolutePosition();
    let item: ItemId | undefined = picked;
    if (!item) {
      let best = NEAR_GRAB_M;
      for (const id of ['portafilter', 'cup', 'tamper'] as const) {
        const d = Vector3.Distance(grip, station.items[id].root.getAbsolutePosition());
        if (d < best) {
          best = d;
          item = id;
        }
      }
    }
    if (!item) {
      const under = xr?.pointerSelection.getMeshUnderPointer(ctrl.uniqueId);
      const meta = metaOf(under);
      if (meta?.kind === 'item') item = meta.id;
    }
    if (!item) return false;
    store.dispatch({ type: 'GRAB', item, hand, source: 'xr' });
    if (store.getState().items[item].heldBy !== hand) return false;
    const r = station.items[item].root;
    const far = Vector3.Distance(grip, r.getAbsolutePosition()) > NEAR_GRAB_M;
    r.setParent(gripNode(ctrl));
    if (far) {
      // Explicit distance grab: the item flies to the hand.
      r.position.set(0, -0.01, 0.06);
      r.rotationQuaternion = Quaternion.Identity();
    }
    pulse(ctrl, 0.25, 30);
    return true;
  }

  function xrRelease(ctrl: WebXRInputSource): void {
    const hand = handOf(ctrl);
    const s = store.getState();
    const item = heldItem(s, hand);
    if (!item) return;
    const r = station.items[item].root;
    r.setParent(root);
    const anchor = r.position;
    const near = nearestZone([anchor.x, anchor.y, anchor.z], zoneCandidates(s, item, hand), false);
    let angleDeg: number | undefined;
    let tiltDeg: number | undefined;
    const q = r.rotationQuaternion ?? Quaternion.FromEulerVector(r.rotation);
    const up = Vector3.Up().applyRotationQuaternion(q);
    const tilt = (Math.acos(Math.max(-1, Math.min(1, up.y))) * 180) / Math.PI;
    if (item === 'portafilter' && near?.zone === 'group-head') {
      const handleDir = new Vector3(0, 0, -1).applyRotationQuaternion(q);
      const yawErr = (Math.abs(Math.atan2(handleDir.x, -handleDir.z)) * 180) / Math.PI;
      angleDeg = Math.max(yawErr, tilt);
    }
    if (item === 'tamper') tiltDeg = tilt;
    delete holdInfo[hand];
    store.dispatch({ type: 'RELEASE', hand, zone: near?.zone, distanceM: near?.distanceM, angleDeg, tiltDeg, source: 'xr' });
  }

  function handleXrPointer(pi: PointerInfo, ctrl: WebXRInputSource) {
    const pid = (pi.event as PointerEvent).pointerId;
    const meta = resolvePick(
      metaOf(pi.pickInfo?.pickedMesh ?? xr?.pointerSelection.getMeshUnderPointer(ctrl.uniqueId)),
      pi.pickInfo?.pickedPoint,
    );
    if (pi.type === PointerEventTypes.POINTERMOVE) {
      setHover(meta);
      return;
    }
    if (store.getState().status !== 'playing') return;
    if (pi.type === PointerEventTypes.POINTERDOWN) {
      if (meta?.kind === 'item') {
        if (xrGrab(ctrl, meta.id)) rayGrab.set(pid, meta.id);
      } else if (meta?.kind === 'button') {
        press(meta.id, 'xr');
        pulse(ctrl, 0.2, 25);
      } else if (meta?.kind === 'part') {
        store.dispatch({ type: 'LOCATE', target: meta.id, source: 'xr' });
      }
    } else if (pi.type === PointerEventTypes.POINTERUP && rayGrab.has(pid)) {
      rayGrab.delete(pid);
      xrRelease(ctrl);
    }
  }

  if (opts.xrSupported) {
    try {
      const [{ WebXRDefaultExperience }, { WebXRState }] = await Promise.all([
        import('@babylonjs/core/XR/webXRDefaultExperience'),
        import('@babylonjs/core/XR/webXRTypes'),
        import('@babylonjs/core/XR/motionController/index'),
      ]);
      xr = await WebXRDefaultExperience.CreateAsync(scene, {
        disableDefaultUI: true,
        disableTeleportation: true,
        disableNearInteraction: true,
        disableHandTracking: true,
        floorMeshes: [room[0]!],
        inputOptions: { doNotLoadControllerMeshes: true, disableOnlineControllerRepository: true },
        pointerSelectionOptions: { enablePointerSelectionOnAllControllers: true },
      });
      xr.input.onControllerAddedObservable.add((ctrl) => {
        const proxy = MeshBuilder.CreateSphere(`hand-${ctrl.uniqueId}`, { diameter: 0.045, segments: 8 }, scene);
        proxy.material = mats.hand;
        proxy.isPickable = false;
        proxy.parent = gripNode(ctrl);
        hands.set(ctrl.uniqueId, { ctrl, hand: handOf(ctrl), proxy, pokeCooldown: 0 });
      });
      xr.input.onControllerRemovedObservable.add((ctrl) => {
        const h = hands.get(ctrl.uniqueId);
        if (h && heldItem(store.getState(), h.hand)) xrRelease(ctrl);
        h?.proxy.dispose();
        hands.delete(ctrl.uniqueId);
      });
      xr.baseExperience.sessionManager.onXRSessionInit.add((session) => {
        const find = (src: XRInputSource) => [...hands.values()].find((h) => h.ctrl.inputSource === src)?.ctrl;
        session.addEventListener('squeezestart', (ev) => {
          const c = find((ev as XRInputSourceEvent).inputSource);
          if (c) xrGrab(c);
        });
        session.addEventListener('squeezeend', (ev) => {
          const c = find((ev as XRInputSourceEvent).inputSource);
          if (c) xrRelease(c);
        });
        session.addEventListener('visibilitychange', () => {
          if (session.visibilityState !== 'visible' && store.getState().status === 'playing') store.dispatch({ type: 'PAUSE' });
        });
      });
      xr.baseExperience.onStateChangedObservable.add((state) => {
        const now = state === WebXRState.IN_XR;
        if (now === inXR) return;
        inXR = now;
        mainPanel.mesh.setEnabled(inXR);
        if (inXR) {
          setTimeout(() => !disposed && recenter(), 250);
        } else {
          // Session ended (button, system menu or headset removed): drop anything held, keep progress.
          for (const h of hands.values()) if (heldItem(store.getState(), h.hand)) xrRelease(h.ctrl);
          infoPanel.mesh.setEnabled(false);
          root.rotation.y = 0;
          root.position.set(0, counterH, 0);
          resetView();
        }
        mainPanel.key = '';
        opts.onXrChange?.(inXR);
      });
    } catch {
      xr = null; // graceful: 3D fallback keeps working
    }
  }

  function recenter(): void {
    if (inXR && xr) {
      const cam = xr.baseExperience.camera;
      const fwd = cam.getDirection(Vector3.Forward());
      const yaw = Math.atan2(fwd.x, fwd.z);
      root.rotation.y = yaw;
      root.position.set(cam.position.x + Math.sin(yaw) * USER_DISTANCE, counterH, cam.position.z + Math.cos(yaw) * USER_DISTANCE);
    } else {
      root.rotation.y = 0;
      root.position.set(0, counterH, 0);
      resetView();
    }
  }

  function setCounterHeight(mode: 'standing' | 'seated' | 'up' | 'down') {
    if (mode === 'standing') counterH = COUNTER_HEIGHT.standing;
    else if (mode === 'seated') counterH = COUNTER_HEIGHT.seated;
    else counterH = Math.min(COUNTER_HEIGHT.max, Math.max(COUNTER_HEIGHT.min, counterH + (mode === 'up' ? 1 : -1) * COUNTER_HEIGHT.step));
    root.position.y = counterH;
    station.cabinet.scaling.y = counterH - 0.045;
    station.cabinet.position.y = -0.045 - (counterH - 0.045) / 2;
    mainPanel.key = '';
    if (!inXR) resetView();
  }
  setCounterHeight('standing');

  // ── main XR panel (instructions / feedback / summary + comfort controls) ──
  function renderMainPanel(s: MissionState) {
    if (!inXR) return;
    const cues = cuesFor(s);
    const idx = currentStepIndex(s);
    const key = [locale, s.status, idx, cues.stepLabel, cues.nextStepText, s.feedback?.seq, s.guidance, counterH].join('|');
    if (key === mainPanel.key) return;
    mainPanel.key = key;
    clearStack(mainPanel);
    const add = (c: Control) => mainPanel.stack.addControl(c);
    const step = STEP_ORDER[idx];
    if (s.status === 'complete') {
      const sum = buildSummary(s);
      add(text(`${tr(S.summaryTitle)} · ${tr(GUIDANCE_LABEL[s.guidance])}`, 46, COLORS.success, true));
      add(text(tr(S.summaryEvidence), 28, COLORS.muted));
      add(text(`${tr(S.sequence)}: ${Math.round(sum.sequenceAccuracy * 100)}%   ${tr(S.hintsUsed)}: ${sum.hintsUsed}   ${tr(S.time)}: ${sum.durationSec}${tr(S.seconds)}`, 32));
      if (sum.stopFeedback) add(text(`${tr(S.stopAccuracy)}: ${tr(sum.stopFeedback)}`, 30));
      add(text(`${tr(S.stillNeedsHeading)}: ${tr(NOT_TRAINED[0]!)}`, 28, COLORS.muted));
      add(row([button('again', tr(S.again), () => store.dispatch({ type: 'RESET' }), true), button('lang', tr(S.language), () => opts.onLocaleToggle?.()), button('exit', tr(S.exitVR), () => void handle.exitVR())]));
      return;
    }
    const header = cues.stepLabel && step ? `${tr(S.step)} ${idx + 1}${tr(S.of)}${STEP_ORDER.length} · ${tr(GUIDANCE_LABEL[s.guidance])}` : `${tr(S.missionShort)} · ${tr(GUIDANCE_LABEL[s.guidance])}`;
    add(text(header, 28, COLORS.muted));
    if (step && cues.stepLabel) add(text(tr(STEPS[step].title), 44, COLORS.text, true));
    else add(text(tr(S.hiddenStep), 30, COLORS.muted));
    if (step && cues.nextStepText) add(text(tr(STEPS[step].doXr), 32));
    if (s.status === 'paused') add(text(tr(S.pausedOverlay), 40, COLORS.warn, true));
    else if (s.feedback) {
      const color = { success: COLORS.success, info: COLORS.info, warn: COLORS.warn, mistake: COLORS.mistake }[s.feedback.kind];
      add(text(tr(s.feedback.text), 30, color));
      // XR-only learners get the "why" here (step explanations, mistake reasons).
      if (s.feedback.detail) add(text(tr(s.feedback.detail), 26, COLORS.muted));
    }
    const nextTier = GUIDANCE_ORDER[(GUIDANCE_ORDER.indexOf(s.guidance) + 1) % GUIDANCE_ORDER.length]!;
    add(
      row([
        button('hint', tr(S.hint), () => store.dispatch({ type: 'REQUEST_HINT', source: 'xr' })),
        s.status === 'paused'
          ? button('resume', tr(S.resume), () => store.dispatch({ type: 'RESUME' }))
          : button('pause', tr(S.pause), () => store.dispatch({ type: 'PAUSE' })),
        button('reset', tr(S.reset), () => store.dispatch({ type: 'RESET' })),
        button('tier', `${tr(S.guidance)}: ${tr(GUIDANCE_LABEL[nextTier])}`, () => store.dispatch({ type: 'SET_GUIDANCE', guidance: nextTier }), true),
      ]),
    );
    add(
      row([
        button('posture', counterH <= COUNTER_HEIGHT.seated + 0.001 ? tr(S.standing) : tr(S.seated), () =>
          setCounterHeight(counterH <= COUNTER_HEIGHT.seated + 0.001 ? 'standing' : 'seated'),
        ),
        button('up', tr(S.higher), () => setCounterHeight('up')),
        button('down', tr(S.lower), () => setCounterHeight('down')),
        button('recenter', tr(S.recenter), () => recenter()),
        button('lang', tr(S.language), () => opts.onLocaleToggle?.()),
      ]),
    );
    add(row([button('exit', tr(S.exitVR), () => void handle.exitVR(), true)]));
  }

  // ── per-frame sync: state → visuals ──
  const outlineCue = new Color3(0.94, 0.73, 0.23);
  const outlineHover = new Color3(1, 1, 1);
  let outlined: AbstractMesh[] = [];
  let lastTagKey = '';
  let time = 0;

  function syncItems(s: MissionState, dt: number) {
    const k = opts.reducedMotion ? 1 : 1 - Math.exp(-LERP_RATE * dt);
    for (const item of ['portafilter', 'cup', 'tamper'] as const) {
      const st = s.items[item];
      const r = station.items[item].root;
      if (st.heldBy && st.heldBy !== 'pointer' && r.parent !== root) continue; // riding a controller
      if (st.heldBy === 'pointer' && drag?.item === item) continue; // following the mouse
      if (r.parent !== root) r.setParent(root);
      const target = zoneAnchor(st.zone);
      if (st.heldBy) target.y += 0.12; // held via action list / other hand without a controller: float above
      Vector3.LerpToRef(r.position, target, k, r.position);
      const yaw = (ZONE_YAW[st.zone] ?? 0) + (twist[item] ?? 0);
      if (twist[item]) twist[item] = Math.abs(twist[item]!) < 0.01 ? 0 : twist[item]! * (1 - k);
      const q = r.rotationQuaternion ?? Quaternion.Identity();
      Quaternion.SlerpToRef(q, quatYaw(yaw), k, q);
      r.rotationQuaternion = q;
    }
  }

  function syncProps(s: MissionState) {
    const { mound, bed } = station.coffee;
    mound.isVisible = s.basket === 'dosed' || s.grinder.running;
    mound.scaling.y = s.grinder.running ? Math.max(0.05, s.grinder.elapsedSec / MODEL.grindSec) : 1;
    bed.isVisible = s.basket === 'tamped' || s.basket === 'spent';
    bed.material = s.basket === 'spent' ? mats.spent : mats.tamped;

    const y = s.shot.yieldG;
    const liquid = station.cupLiquid;
    liquid.isVisible = y > 0.2;
    const level = 0.011 + Math.min(1, y / 48) * 0.048;
    liquid.position.y = level;
    liquid.scaling.x = liquid.scaling.z = 0.78 + 0.22 * Math.min(1, y / 48);

    const esp = station.streams.espresso;
    const flowing = (s.shot.status === 'running' && s.shot.elapsedSec > MODEL.firstDropsSec - 0.4) || s.shot.status === 'settling';
    esp.isVisible = flowing && (s.shot.status !== 'settling' || Math.sin(time * 40) > 0.3);
    if (esp.isVisible) {
      const top = ZONE_POS['group-head'][1] - 0.037;
      const bottom = ZONE_POS.scale[1] + level;
      esp.scaling.y = Math.max(0.01, top - bottom);
      esp.position.set(0, (top + bottom) / 2, 0);
      const wob = opts.reducedMotion ? 1 : 0.85 + 0.3 * Math.abs(Math.sin(time * 23));
      esp.scaling.x = esp.scaling.z = s.shot.status === 'settling' ? 0.5 : wob;
    }
    const flush = station.streams.flush;
    flush.isVisible = s.flush.running;
    if (flush.isVisible) {
      const top = 0.24;
      const bottom = 0.026;
      flush.scaling.y = top - bottom;
      flush.position.set(0, (top + bottom) / 2, 0);
    }
    const grind = station.streams.grind;
    grind.isVisible = s.grinder.running;
    if (grind.isVisible) {
      const [gx, gy, gz] = ZONE_POS['grinder-fork'];
      const top = 0.2;
      const bottom = gy + 0.02;
      grind.scaling.y = top - bottom;
      grind.position.set(gx, (top + bottom) / 2, gz + 0.02);
    }
    station.knockPile.isVisible = s.flags.knocked;

    // Machine reacts: brew button glows while water flows; grinder hums.
    mats.amber.emissiveColor.set(s.shot.status === 'running' || s.flush.running ? 0.55 : 0.24, s.shot.status === 'running' || s.flush.running ? 0.36 : 0.16, 0.02);
    const gBody = station.parts.grinder?.[0];
    if (gBody && !opts.reducedMotion) gBody.position.x = ZONE_POS['grinder-fork'][0] + (s.grinder.running ? Math.sin(time * 90) * 0.0012 : 0);

    for (const b of ['brew', 'grinder', 'tare'] as const) {
      const m = station.buttons[b];
      const base = BUTTON_POS[b];
      const t = pressAnim[b] ?? 0;
      if (t > 0) pressAnim[b] = Math.max(0, t - 1 / 60);
      const depth = t > 0 ? 0.004 : 0;
      m.position.set(base[0], base[1], base[2] + depth);
    }

    const reading = scaleReadingG(s);
    const scaleStr = isAt(s, 'cup', 'scale') || Math.abs(reading) > 0.05 ? `${reading.toFixed(1)}g` : '0.0g';
    if (scaleText.text !== scaleStr) scaleText.text = scaleStr;

    const showMonitor = inXR && (s.shot.status !== 'idle' ? !(s.shot.status === 'done' && !isAt(s, 'cup', 'scale')) : isAt(s, 'cup', 'scale'));
    monitor.mesh.setEnabled(showMonitor);
    if (showMonitor) {
      const cues = cuesFor(s);
      const big = `${reading.toFixed(1)} ${tr(S.grams)}`;
      const small = `${tr(S.target)} ${RECIPE.targetYieldG} ${tr(S.grams)} · ${tr(S.shotTime)} ${s.shot.elapsedSec.toFixed(0)}${tr(S.seconds)} · ${tr(S.illustrative)}`;
      const near = cues.yieldCue && s.shot.status === 'running' && y >= RECIPE.targetYieldG - MODEL.approachWindowG;
      const color = near ? (y >= RECIPE.targetYieldG - 1.5 ? COLORS.success : COLORS.warn) : '#c98a3b';
      const key = `${big}|${small}|${color}|${Math.round(y * 2)}`;
      if (key !== monitor.key) {
        monitor.key = key;
        monitor.big.text = big;
        monitor.small.text = small;
        monitor.bar.background = color;
        monitor.bar.width = `${Math.round(Math.min(1, Math.max(0, reading) / 48) * 560)}px`;
      }
    }
  }

  function syncCues(s: MissionState) {
    const cues = cuesFor(s);
    const cue = s.status === 'playing' ? stepCue(s) : null;
    const tier = TIERS[s.guidance];

    // Zone rings: size = this tier's real snap radius.
    for (const r of ringOf.values()) r.isVisible = false;
    for (const [hand, info] of Object.entries(holdInfo) as Array<[HandId, { item: ItemId; zone: ZoneId | null; distanceM: number }]>) {
      if (s.items[info.item].heldBy !== hand) continue;
      for (const c of zoneCandidates(s, info.item, hand)) {
        const ring = ringOf.get(c.zone)!;
        const isNearest = info.zone === c.zone;
        const d = isNearest ? info.distanceM : Infinity;
        const state = d <= tier.snapRadiusM ? 'snap' : d <= tier.nearRadiusM ? 'near' : 'idle';
        const show =
          tier.zoneRings === 'all-compatible' || (tier.zoneRings === 'near' && state !== 'idle') || (tier.zoneRings === 'snap-only' && state === 'snap') || (cues.cues && cue?.kind === 'place' && cue.zone === c.zone);
        if (!show) continue;
        ring.isVisible = true;
        ring.material = state === 'snap' ? mats.ringSnap : state === 'near' ? mats.ringNear : mats.ringIdle;
        ring.position.set(c.pos[0], c.pos[1] + (c.zone === 'group-head' ? 0.016 : 0.004), c.pos[2]);
        const dia = tier.snapRadiusM * 2;
        ring.scaling.set(dia, dia, dia);
      }
    }

    // Ghost + arrow + target outline (only when this tier shows cues right now).
    for (const g of Object.values(ghosts)) g.setEnabled(false);
    arrow.isVisible = false;
    let cueMeshes: AbstractMesh[] = [];
    if (cues.cues && cue) {
      let arrowAt: Vector3 | null = null;
      if (cue.kind === 'look') {
        arrowAt = v3(PART_TAG_POS['espresso-machine']).add(new Vector3(0, -0.02, -0.14));
        cueMeshes = station.parts['espresso-machine'] ?? [];
      } else if (cue.kind === 'press') {
        arrowAt = v3(BUTTON_POS[cue.button]).add(new Vector3(0, 0.07, -0.02));
        cueMeshes = [station.buttons[cue.button]];
      } else if (cue.kind === 'grab' || cue.kind === 'place') {
        const r = station.items[cue.item].root;
        if (cue.kind === 'grab') {
          arrowAt = localOf(r.getAbsolutePosition()).add(new Vector3(0, 0.12, 0));
          cueMeshes = station.items[cue.item].meshes.filter((m) => m.isVisible);
        }
        if (cue.zone) {
          const g = ghosts[cue.item];
          const p = zoneAnchor(cue.zone);
          g.position.copyFrom(p);
          g.rotationQuaternion = quatYaw(ZONE_YAW[cue.zone] ?? 0);
          g.setEnabled(true);
          if (cue.kind === 'place') arrowAt = p.add(new Vector3(0, 0.15, 0));
        }
      }
      if (arrowAt) {
        arrow.isVisible = true;
        arrow.position.copyFrom(arrowAt);
        if (!opts.reducedMotion) arrow.position.y += Math.sin(time * 4) * 0.012;
      }
    }

    // Outline: hover beats cue.
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

    // Tool tags (guided tier) + locale.
    const tagKey = `${cues.toolTags}|${locale}`;
    if (tagKey !== lastTagKey) {
      lastTagKey = tagKey;
      for (const { id, tag } of tags) {
        tag.mesh.setEnabled(cues.toolTags);
        tag.set(tr(TOOL_INFO[id].name));
      }
    }
  }

  function syncXrHands(s: MissionState, dt: number) {
    if (!inXR) return;
    const tier = TIERS[s.guidance];
    for (const h of hands.values()) {
      h.pokeCooldown = Math.max(0, h.pokeCooldown - dt);
      const held = heldItem(s, h.hand);
      const grip = gripNode(h.ctrl);
      if (held) {
        const r = station.items[held].root;
        const anchor = localOf(r.getAbsolutePosition());
        const near = nearestZone([anchor.x, anchor.y, anchor.z], zoneCandidates(s, held, h.hand), false);
        holdInfo[h.hand] = { item: held, zone: near?.zone ?? null, distanceM: near?.distanceM ?? Infinity };
        // Pressing the held tamper into the steady basket tamps on contact.
        if (held === 'tamper' && near?.zone === 'basket' && near.distanceM < Math.min(0.035, tier.snapRadiusM)) {
          const q = r.absoluteRotationQuaternion;
          const up = Vector3.Up().applyRotationQuaternion(q);
          const tilt = (Math.acos(Math.max(-1, Math.min(1, up.y))) * 180) / Math.PI;
          store.dispatch({ type: 'USE_TAMPER', tiltDeg: tilt, source: 'xr' });
          pulse(h.ctrl, 0.5, 60);
        }
      } else {
        delete holdInfo[h.hand];
        // Poke buttons with the controller tip.
        if (h.pokeCooldown === 0 && s.status === 'playing') {
          const tip = localOf(grip.getAbsolutePosition().add(grip.getDirection(Vector3.Forward()).scale(0.06)));
          for (const b of ['brew', 'grinder', 'tare'] as const) {
            if (Vector3.Distance(tip, v3(BUTTON_POS[b])) < POKE_M) {
              press(b, 'xr');
              pulse(h.ctrl, 0.3, 30);
              h.pokeCooldown = 0.8;
              break;
            }
          }
        }
      }
    }
  }

  const unsubEffects = store.onEffects((effects, s) => {
    for (const e of effects) {
      if (e.type === 'snap' && e.item === 'portafilter' && e.zone === 'group-head') twist.portafilter = -0.7;
      if (e.type === 'snap' || e.type === 'step-complete') {
        for (const h of hands.values()) if (heldItem(s, h.hand) === null) pulse(h.ctrl, 0.2, 25);
      }
      if (e.type === 'reset') {
        drag = null;
        camera.attachControl(true);
        for (const k of Object.keys(holdInfo) as HandId[]) delete holdInfo[k];
        for (const item of ['portafilter', 'cup', 'tamper'] as const) {
          const r = station.items[item].root;
          if (r.parent !== root) r.setParent(root);
        }
      }
    }
  });

  let statTimer = 0;
  engine.runRenderLoop(() => {
    if (disposed) return;
    const dt = Math.min(engine.getDeltaTime() / 1000, 0.1);
    time += dt;
    if (dt > 0) store.dispatch({ type: 'TICK', dtSec: dt });
    const s = store.getState();
    syncXrHands(s, dt);
    syncItems(s, dt);
    syncProps(s);
    syncCues(s);
    renderMainPanel(s);
    scene.render();
    statTimer += dt;
    if (statTimer > 1) {
      statTimer = 0;
      canvas.dataset.drawCalls = String(instrumentation.drawCallsCounter.current);
      canvas.dataset.fps = String(Math.round(engine.getFps()));
    }
  });

  const resize = () => {
    engine.resize();
    if (!inXR) fitFov();
  };
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
  ro?.observe(canvas);
  window.addEventListener('resize', resize);

  const handle: CoffeeLabHandle = {
    get xrReady() {
      return !!xr;
    },
    async enterVR() {
      if (!xr) return { ok: false, error: 'xr-unavailable' };
      try {
        // Start from the learner's standing eye point so the counter appears in front.
        camera.setPosition(new Vector3(0, counterH + 0.6, -USER_DISTANCE));
        await xr.baseExperience.enterXRAsync('immersive-vr', 'local-floor');
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
      }
    },
    async exitVR() {
      try {
        if (xr && inXR) await xr.baseExperience.exitXRAsync();
      } catch {
        /* already ended */
      }
    },
    inXR: () => inXR,
    setLocale(l) {
      locale = l;
      mainPanel.key = '';
      infoPanel.key = '';
      monitor.key = '';
      lastTagKey = '';
    },
    setCounterHeight,
    recenter,
    resetView,
    project(target, atLocalY) {
      let local: Vector3;
      if (target === 'portafilter' || target === 'cup' || target === 'tamper') local = localOf(station.items[target].root.getAbsolutePosition());
      else if (target === 'brew' || target === 'grinder' || target === 'tare') local = v3(BUTTON_POS[target]);
      else if (target === 'espresso-machine') local = new Vector3(0, 0.2, 0.09);
      else local = zoneAnchor(target);
      if (atLocalY !== undefined) local.y = atLocalY;
      const world = Vector3.TransformCoordinates(local, root.computeWorldMatrix(true));
      const w = engine.getRenderWidth();
      const h = engine.getRenderHeight();
      const p = Vector3.Project(world, Matrix.Identity(), scene.getTransformMatrix(), camera.viewport.toGlobal(w, h));
      const rect = canvas.getBoundingClientRect();
      return { x: rect.left + (p.x / w) * rect.width, y: rect.top + (p.y / h) * rect.height };
    },
    stats: () => ({
      meshes: scene.meshes.length,
      activeMeshes: scene.getActiveMeshes().length,
      drawCalls: instrumentation.drawCallsCounter.current,
      fps: Math.round(engine.getFps()),
    }),
    dispose() {
      if (disposed) return;
      disposed = true;
      unsubEffects();
      window.removeEventListener('pointerup', onWindowUp);
      window.removeEventListener('blur', onWindowUp);
      window.removeEventListener('resize', resize);
      ro?.disconnect();
      engine.stopRenderLoop();
      const x = xr;
      const finish = () => {
        try {
          x?.dispose();
        } catch {
          /* ignore */
        }
        instrumentation.dispose();
        scene.dispose();
        engine.dispose();
      };
      if (x && inXR) x.baseExperience.exitXRAsync().catch(() => {}).finally(finish);
      else finish();
    },
  };
  return handle;
}

/** Re-exported so callers can type the lazy module. */
export type { Materials, Station };
