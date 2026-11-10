/**
 * Shared Babylon runtime for every XR-lab mission: engine, warm lighting,
 * orbit camera (non-immersive fallback), counter + room, WebXR (controllers
 * only — hand tracking disabled), comfort controls (seated/standing, height,
 * recenter), the generic in-headset instruction/summary panel, tool-info panel,
 * readout monitor, render loop and disposal. Each mission plugs in a Station.
 * HARDWARE-UNVERIFIED: the WebXR paths have never run on a real headset.
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
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { PointerInfo } from '@babylonjs/core/Events/pointerEvents';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
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
import type { HandId } from '../mission/types';
import type { AnyMission, AnyStore, CoreState, SceneHandle, SceneOptions } from '../mission/core';
import { GUIDANCE_ORDER } from '../mission/tiers';
import { GUIDANCE_LABEL } from '../mission/content';
import { S } from '../strings';
import { createMaterials, type Materials } from './materials';
import { buildRoom } from './props';
import { COLORS, button, clearStack, createPanel, row, text } from './panels';
import { COUNTER, COUNTER_HEIGHT, USER_DISTANCE } from './layout';

export interface Hand {
  ctrl: WebXRInputSource;
  hand: HandId;
  proxy: Mesh;
  pokeCooldown: number;
}

/** What a mission's station plugs into the runtime. */
export interface Station {
  /** Height above the counter the fallback camera looks at (default 0.14 m). */
  cameraTargetY?: number;
  /** Fallback-camera distance (m) for landscape / portrait screens (default 1.3 / 1.25). */
  cameraRadius?: { landscape: number; portrait: number };
  frame(s: CoreState, dt: number): void;
  onPointer(pi: PointerInfo): void;
  onPointerCancel(): void;
  onXrPointer(pi: PointerInfo, ctrl: WebXRInputSource): void;
  onSqueeze(ctrl: WebXRInputSource, down: boolean): void;
  /** Called when an XR session starts/ends (drop held items on exit). */
  onXrChange(inXr: boolean): void;
  onEffects(effects: CoreState['effects'], s: CoreState): void;
  /** Station-local position of a named target (test hook). */
  project(target: string): Vector3 | null;
  onLocale(): void;
}

export interface Rt {
  scene: Scene;
  engine: Engine;
  camera: ArcRotateCamera;
  root: TransformNode;
  mats: Materials;
  store: AnyStore;
  def: AnyMission;
  reducedMotion: boolean;
  tr(t: LocalizedText): string;
  inXR(): boolean;
  xr(): WebXRDefaultExperience | null;
  hands(): Iterable<Hand>;
  localOf(world: Vector3): Vector3;
  handOf(ctrl: WebXRInputSource): HandId;
  gripNode(ctrl: WebXRInputSource): TransformNode;
  pulse(ctrl: WebXRInputSource | undefined, strength?: number, ms?: number): void;
  /** Show tool info: in-headset panel above `localPos`, and the DOM HUD via onHover. */
  showInfo(info: { name: LocalizedText; purpose: LocalizedText } | null, localPos?: Vector3): void;
  time(): number;
}

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
/** Seconds without input before the non-immersive fallback halves its draw rate. */
const IDLE_AFTER_SEC = 1.5;

export async function createRuntime(opts: SceneOptions, buildStation: (rt: Rt) => Station): Promise<SceneHandle> {
  const { canvas, store, def } = opts;
  let locale: Locale = opts.locale;
  const tr = (t: LocalizedText) => t[locale] || t.en;

  const engine = new Engine(canvas, true, { xrCompatible: opts.xrSupported, stencil: true, preserveDrawingBuffer: false, powerPreference: 'high-performance' }, true);
  engine.setHardwareScalingLevel(1 / Math.min(globalThis.devicePixelRatio || 1, 1.75));
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.16, 0.11, 0.08, 1);
  scene.ambientColor = new Color3(0.25, 0.2, 0.16);
  scene.skipPointerMovePicking = true; // stations pick explicitly with predicates
  const instrumentation = new SceneInstrumentation(scene);

  const hemi = new HemisphericLight('hemi', v(0, 1, -0.3), scene);
  hemi.intensity = 0.5;
  hemi.diffuse = new Color3(1, 0.93, 0.84);
  hemi.groundColor = new Color3(0.3, 0.22, 0.17);
  const sun = new DirectionalLight('key', v(-0.35, -1, 0.45), scene);
  sun.intensity = 0.42;
  sun.diffuse = new Color3(1, 0.9, 0.78);
  const lamp = new PointLight('lamp', v(0, 1.7, 0.2), scene);
  lamp.intensity = 0.35;
  lamp.diffuse = new Color3(1, 0.78, 0.52);
  lamp.range = 2.6;

  const mats = createMaterials(scene);
  const root = new TransformNode('station', scene);
  let counterH: number = COUNTER_HEIGHT.standing;
  root.position.set(0, counterH, 0);
  // Counter + cabinet (cabinet height follows the counter height).
  const cw = COUNTER.maxX - COUNTER.minX;
  const cd = COUNTER.maxZ - COUNTER.minZ;
  const cz = (COUNTER.maxZ + COUNTER.minZ) / 2;
  const top = MeshBuilder.CreateBox('counter-top', { width: cw, height: COUNTER.thickness, depth: cd }, scene);
  top.parent = root;
  top.position.set(0, -COUNTER.thickness / 2, cz);
  top.material = mats.wood;
  top.isPickable = false;
  const cabinet = MeshBuilder.CreateBox('cabinet', { width: cw - 0.04, height: 1, depth: cd - 0.06 }, scene);
  cabinet.parent = root;
  cabinet.position.set(0, -0.5 - COUNTER.thickness, cz + 0.02);
  cabinet.material = mats.cabinet;
  cabinet.isPickable = false;
  const room = buildRoom(scene, mats, root);

  // ── camera (non-immersive fallback) with orbit limits ──
  const camera = new ArcRotateCamera('cam', -Math.PI / 2, 1.08, 1.3, v(0, counterH + 0.14, 0.06), scene);
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
    camera.radius = portrait ? camRadius.portrait : camRadius.landscape;
    camera.setTarget(v(root.position.x, root.position.y + targetY, root.position.z + 0.06));
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

  // ── panels ──
  const mainPanel = createPanel(scene, 'xr-main', 0.64, 0.56, 1024, root);
  mainPanel.mesh.position.set(-0.68, 0.64, 0.26);
  mainPanel.mesh.rotation.y = -0.6;
  mainPanel.mesh.setEnabled(false);
  const infoPanel = createPanel(scene, 'xr-info', 0.36, 0.16, 640, root);
  infoPanel.mesh.billboardMode = TransformNode.BILLBOARDMODE_ALL;
  infoPanel.mesh.isPickable = false;
  infoPanel.mesh.setEnabled(false);
  const monitor = createMonitor(scene, root);

  let targetY = 0.14;
  let camRadius = { landscape: 1.3, portrait: 1.25 };
  let xr: WebXRDefaultExperience | null = null;
  let inXR = false;
  let disposed = false;
  let time = 0;
  const hands = new Map<string, Hand>();
  const invRoot = new Matrix();

  const handOf = (ctrl: WebXRInputSource): HandId => (ctrl.inputSource.handedness === 'left' ? 'left' : 'right');
  const gripNode = (ctrl: WebXRInputSource) => (ctrl.grip ?? ctrl.pointer) as TransformNode;
  const pulse = (ctrl: WebXRInputSource | undefined, strength = 0.3, ms = 40) => {
    try {
      void ctrl?.motionController?.pulse(strength, ms)?.catch?.(() => {});
    } catch {
      /* haptics optional — an affordance buzz, never a force claim */
    }
  };
  let infoKey = '';
  const rt: Rt = {
    scene,
    engine,
    camera,
    root,
    mats,
    store,
    def,
    reducedMotion: opts.reducedMotion,
    tr,
    inXR: () => inXR,
    xr: () => xr,
    hands: () => hands.values(),
    localOf(world) {
      root.computeWorldMatrix(true).invertToRef(invRoot);
      return Vector3.TransformCoordinates(world, invRoot);
    },
    handOf,
    gripNode,
    pulse,
    showInfo(info, localPos) {
      opts.onHover?.(info);
      if (!info || !inXR) {
        infoPanel.mesh.setEnabled(false);
        infoKey = '';
        return;
      }
      const key = `${info.name.en}|${locale}`;
      if (key !== infoKey) {
        infoKey = key;
        clearStack(infoPanel);
        infoPanel.stack.addControl(text(tr(info.name), 40, COLORS.text, true));
        infoPanel.stack.addControl(text(tr(info.purpose), 30, COLORS.muted));
      }
      if (localPos) infoPanel.mesh.position.copyFrom(localPos);
      infoPanel.mesh.setEnabled(true);
    },
    time: () => time,
  };

  const station = buildStation(rt);
  targetY = station.cameraTargetY ?? 0.14;
  if (station.cameraRadius) camRadius = station.cameraRadius;

  // ── pointer routing (mouse/touch vs XR controller rays) ──
  const xrControllerFor = (pi: PointerInfo): WebXRInputSource | null => {
    if (!xr) return null;
    try {
      return xr.pointerSelection.getXRControllerByPointerId((pi.event as PointerEvent).pointerId) ?? null;
    } catch {
      return null;
    }
  };
  // Perf (phones, software WebGL): when nobody is touching the non-immersive scene, draw every other
  // frame (~30 fps). Input or camera motion restores full rate at once; the simulation still ticks every frame.
  let lastInputAt = 0;
  let frameNo = 0;
  camera.onViewMatrixChangedObservable.add(() => {
    lastInputAt = time;
  });
  scene.onPointerObservable.add((pi) => {
    if (disposed) return;
    lastInputAt = time;
    const ctrl = xrControllerFor(pi);
    if (ctrl) station.onXrPointer(pi, ctrl);
    else station.onPointer(pi);
  });
  const onCancel = () => station.onPointerCancel();
  window.addEventListener('pointerup', onCancel);
  window.addEventListener('blur', onCancel);

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
    cabinet.scaling.y = counterH - COUNTER.thickness;
    cabinet.position.y = -COUNTER.thickness - (counterH - COUNTER.thickness) / 2;
    mainPanel.key = '';
    if (!inXR) resetView();
  }
  setCounterHeight('standing');

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
        station.onSqueeze(ctrl, false);
        hands.get(ctrl.uniqueId)?.proxy.dispose();
        hands.delete(ctrl.uniqueId);
      });
      xr.baseExperience.sessionManager.onXRSessionInit.add((session) => {
        const find = (src: XRInputSource) => [...hands.values()].find((h) => h.ctrl.inputSource === src)?.ctrl;
        session.addEventListener('squeezestart', (ev) => {
          const c = find((ev as XRInputSourceEvent).inputSource);
          if (c) station.onSqueeze(c, true);
        });
        session.addEventListener('squeezeend', (ev) => {
          const c = find((ev as XRInputSourceEvent).inputSource);
          if (c) station.onSqueeze(c, false);
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
        station.onXrChange(inXR);
        if (inXR) setTimeout(() => !disposed && recenter(), 250);
        else {
          infoPanel.mesh.setEnabled(false);
          root.rotation.y = 0;
          root.position.set(0, counterH, 0);
          resetView();
        }
        mainPanel.key = '';
        opts.onXrChange?.(inXR);
      });
    } catch {
      xr = null; // graceful: the 3D fallback keeps working
    }
  }

  // ── generic in-headset panel: instructions, feedback (+why), summary, comfort controls ──
  function renderMainPanel(s: CoreState) {
    if (!inXR) return;
    const hud = def.hud(s);
    const key = [locale, s.status, hud.stepIndex, hud.showStepLabel, hud.showInstruction, hud.progress?.en, s.feedback?.seq, s.guidance, counterH, def.xrButtons(s).map((b) => b.id).join()].join('|');
    if (key === mainPanel.key) return;
    mainPanel.key = key;
    clearStack(mainPanel);
    const add = (c: Control) => mainPanel.stack.addControl(c);
    const exit = button('exit', tr(S.exitVR), () => void handle.exitVR(), true);
    const lang = button('lang', tr(S.language), () => opts.onLocaleToggle?.());
    if (s.status === 'complete') {
      const r = def.result(s);
      add(text(`${tr(S.summaryTitle)} · ${tr(def.short)} · ${tr(GUIDANCE_LABEL[s.guidance])}`, 40, COLORS.success, true));
      add(text(tr(S.summaryEvidence), 26, COLORS.muted));
      add(text(r.stats.slice(0, 4).map((x) => `${tr(x.label)}: ${tr(x.value)}`).join('   '), 30));
      if (r.note) add(text(tr(r.note), 28));
      add(text(`${tr(S.stillNeedsHeading)}: ${tr(r.notTrained[0]!)}`, 26, COLORS.muted));
      add(row([button('again', tr(S.again), () => store.dispatch({ type: 'RESET' }), true), lang, exit]));
      return;
    }
    const header = hud.showStepLabel
      ? `${tr(S.step)} ${hud.stepIndex + 1}${tr(S.of)}${hud.stepCount} · ${tr(GUIDANCE_LABEL[s.guidance])}`
      : `${tr(def.short)} · ${tr(GUIDANCE_LABEL[s.guidance])}`;
    add(text(header, 28, COLORS.muted));
    if (hud.showStepLabel && hud.stepTitle) add(text(tr(hud.stepTitle), 44, COLORS.text, true));
    else add(text(tr(S.hiddenStep), 30, COLORS.muted));
    if (hud.showInstruction && hud.doXr) add(text(tr(hud.doXr), 30));
    if (hud.progress) add(text(tr(hud.progress), 28, COLORS.info));
    if (s.status === 'paused') add(text(tr(S.pausedOverlay), 40, COLORS.warn, true));
    else if (s.feedback) {
      const color = { success: COLORS.success, info: COLORS.info, warn: COLORS.warn, mistake: COLORS.mistake }[s.feedback.kind];
      add(text(tr(s.feedback.text), 30, color));
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
    const extra = def.xrButtons(s).map((b) => button(b.id, tr(b.label), () => store.dispatch({ ...b.action, source: 'xr' } as never), true));
    add(
      row([
        button('posture', counterH <= COUNTER_HEIGHT.seated + 0.001 ? tr(S.standing) : tr(S.seated), () =>
          setCounterHeight(counterH <= COUNTER_HEIGHT.seated + 0.001 ? 'standing' : 'seated'),
        ),
        button('up', tr(S.higher), () => setCounterHeight('up')),
        button('down', tr(S.lower), () => setCounterHeight('down')),
        button('recenter', tr(S.recenter), () => recenter()),
        lang,
      ]),
    );
    add(row([...extra, exit]));
  }

  function renderMonitor(s: CoreState) {
    const r = inXR ? def.readout(s) : null;
    monitor.mesh.setEnabled(!!r);
    if (!r) return;
    const key = `${r.big}|${r.small.en}|${r.tone}|${locale}|${r.bar?.value.toFixed(1)}`;
    if (key === monitor.key) return;
    monitor.key = key;
    monitor.big.text = r.big;
    monitor.small.text = tr(r.small);
    const color = r.tone === 'on' ? COLORS.success : r.tone === 'near' ? COLORS.warn : '#c98a3b';
    monitor.bar.background = color;
    monitor.barBg.isVisible = !!r.bar;
    if (r.bar) {
      monitor.bar.width = `${Math.round(Math.min(1, Math.max(0, r.bar.value) / r.bar.max) * 560)}px`;
      monitor.tick.left = `${Math.round((r.bar.target / r.bar.max) * 560)}px`;
    }
  }

  const unsubEffects = store.onEffects((effects, s) => {
    for (const e of effects) {
      if (e.type === 'snap' || e.type === 'step-complete') for (const h of hands.values()) pulse(h.ctrl, 0.2, 25);
    }
    station.onEffects(effects, s);
  });

  let statTimer = 0;
  engine.runRenderLoop(() => {
    if (disposed) return;
    const dt = Math.min(engine.getDeltaTime() / 1000, 0.1);
    time += dt;
    for (const h of hands.values()) h.pokeCooldown = Math.max(0, h.pokeCooldown - dt);
    if (dt > 0) store.dispatch({ type: 'TICK', dtSec: dt });
    const s = store.getState();
    station.frame(s, dt);
    renderMainPanel(s);
    renderMonitor(s);
    frameNo += 1;
    const idle = !inXR && time - lastInputAt > IDLE_AFTER_SEC;
    if (!idle || frameNo % 2 === 0) scene.render();
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

  const handle: SceneHandle = {
    get xrReady() {
      return !!xr;
    },
    async enterVR() {
      if (!xr) return { ok: false, error: 'xr-unavailable' };
      try {
        camera.setPosition(v(0, counterH + 0.6, -USER_DISTANCE));
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
      infoKey = '';
      monitor.key = '';
      station.onLocale();
    },
    setCounterHeight,
    recenter,
    resetView,
    project(target, atLocalY) {
      const local = station.project(target);
      if (!local) return null;
      if (atLocalY !== undefined) local.y = atLocalY;
      const world = Vector3.TransformCoordinates(local, root.computeWorldMatrix(true));
      const w = engine.getRenderWidth();
      const h = engine.getRenderHeight();
      const p = Vector3.Project(world, Matrix.Identity(), scene.getTransformMatrix(), camera.viewport.toGlobal(w, h));
      const rect = canvas.getBoundingClientRect();
      return { x: rect.left + (p.x / w) * rect.width, y: rect.top + (p.y / h) * rect.height };
    },
    bounds(meshName) {
      const mesh = scene.getMeshByName(meshName);
      if (!mesh) return null;
      mesh.computeWorldMatrix(true);
      const inv = root.computeWorldMatrix(true).clone().invert();
      const min = [Infinity, Infinity, Infinity] as [number, number, number];
      const max = [-Infinity, -Infinity, -Infinity] as [number, number, number];
      for (const corner of mesh.getBoundingInfo().boundingBox.vectorsWorld) {
        const l = Vector3.TransformCoordinates(corner, inv);
        [l.x, l.y, l.z].forEach((c, i) => {
          min[i] = Math.min(min[i], c);
          max[i] = Math.max(max[i], c);
        });
      }
      return { min, max };
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
      window.removeEventListener('pointerup', onCancel);
      window.removeEventListener('blur', onCancel);
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
  resetView();
  return handle;
}

function createMonitor(scene: Scene, root: TransformNode) {
  const mesh = MeshBuilder.CreatePlane('monitor', { width: 0.28, height: 0.13 }, scene);
  mesh.parent = root;
  mesh.position.set(0, 0.58, 0.1);
  mesh.billboardMode = TransformNode.BILLBOARDMODE_Y;
  mesh.isPickable = false;
  mesh.setEnabled(false);
  const adt = AdvancedDynamicTexture.CreateForMesh(mesh, 640, 296, false);
  const card = new Rectangle();
  card.background = COLORS.card;
  card.color = COLORS.edge;
  card.thickness = 3;
  card.cornerRadius = 22;
  adt.addControl(card);
  const big = new TextBlock();
  big.fontSize = 92;
  big.fontWeight = '700';
  big.color = COLORS.text;
  big.top = '-44px';
  card.addControl(big);
  const small = new TextBlock();
  small.fontSize = 30;
  small.color = COLORS.muted;
  small.top = '40px';
  small.textWrapping = 1;
  small.width = '600px';
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
  barBg.addControl(tick);
  return { mesh, big, small, bar, barBg, tick, key: '' };
}

/** Shared pick predicate: visible, enabled meshes that carry interaction metadata. */
export const pickable = (m: AbstractMesh) => m.isPickable && m.isEnabled() && m.isVisible && !!m.metadata;
