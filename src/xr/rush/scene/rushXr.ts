/**
 * Café Rush WebXR layer (lazy, part of the 3D chunk). HARDWARE-UNVERIFIED: written and tested without a headset.
 *
 * - immersive-vr, local-floor, controllers only (no hand tracking, no teleport, no locomotion, no forced motion)
 * - trigger = use: the target under the ray → onTrigger() → actionsForTarget() → the SAME reducer actions;
 *   several options open an in-world choice panel next to the target (ray + trigger on its buttons)
 * - grip = grab / carry / release near a slot to place (snap radius by guidance tier, see vr.ts)
 * - hover: ring + outline on the target, optional subtle haptic pulse (feature-detected)
 * - world-anchored panels: HUD + controls (left), orders with patience bars (back right), results (centre)
 * - recenter and seated / standing counter height; the session pauses the shift when it loses focus
 */
import '@babylonjs/core/Rendering/outlineRenderer';
import type { Scene } from '@babylonjs/core/scene';
import type { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { Material } from '@babylonjs/core/Materials/material';
import { Rectangle } from '@babylonjs/gui/2D/controls/rectangle';
import { Control } from '@babylonjs/gui/2D/controls/control';
import type { Button } from '@babylonjs/gui/2D/controls/button';
import type { WebXRDefaultExperience } from '@babylonjs/core/XR/webXRDefaultExperience';
import type { WebXRInputSource } from '@babylonjs/core/XR/webXRInputSource';
import type { LocalizedText } from '../../../domain/contracts';
import { COLORS, button, clearStack, createPanel, row, text, type Panel } from '../../scene/panels';
import { USER_DISTANCE } from '../../scene/layout';
import { RELAXED } from '../config';
import { drinkName } from '../drinks';
import { explain } from '../judge';
import { rushResult } from '../record';
import { R, customerName, fmtR, itemText } from '../strings';
import { reduce, tick, type PlayerAction, type RushState } from '../sim';
import { listKey, type RushStore, type Target } from '../play';
import { HAPTIC, TARGET_POS, chooseOption, grabPoint, onGripDown, onGripUp, onTrigger, pulseGamepad, snapTarget, vrTickets, type V3, type VrIntent } from '../vr';

const L = (zh: string, en: string): LocalizedText => ({ zh, en });
const XR_TEXT = {
  hint: L('扳机 = 使用；握把 = 拿起 / 靠近位置松开放下', 'Trigger = use · Grip = grab, release near a spot to put down'),
  holdHint: L('靠近一个空位松开握把即可放下，或用扳机指向工位使用。', 'Release the grip near a free spot to put it down, or point the trigger at a station.'),
  choose: L('{t}：选择', 'At the {t}: choose'),
  nothing: L('{t}：现在没有可做的操作。', 'Nothing to do at the {t} right now.'),
  exitVR: L('退出 VR', 'Exit VR'),
  standing: L('站姿高度', 'Standing'),
  seated: L('坐姿高度', 'Seated'),
  unverified: L('VR：未在真实头显上测试（硬件未验证）。', 'VR: not tested on a real headset (hardware-unverified).'),
  next: L('建议下一步', 'Suggested next step'),
};

export interface RushXrCtx {
  scene: Scene;
  camera: ArcRotateCamera;
  root: TransformNode;
  floor: AbstractMesh;
  store: RushStore;
  hand: Material;
  wall: Panel;
  tr(t: LocalizedText): string;
  targetName(t: Target): LocalizedText;
  hint(): LocalizedText | null;
  onAct(a: PlayerAction): void;
  onReplay(): void;
  onLobby(): void;
  onXrChange(inXr: boolean): void;
  seated(): boolean;
  setSeated(seated: boolean): void;
  counterH(): number;
  rigNode(itemId: string): TransformNode | undefined;
  /** Outline the item(s) at these targets (hover affordance). */
  outline(targets: readonly Target[]): void;
  /** Ring overrides for hover / snap; the scene repaints when the key changes. */
  setPads(pads: ReadonlyMap<Target, 'hover' | 'snap'>): void;
  restoreView(): void;
}

export interface RushXr {
  inXR(): boolean;
  enter(): Promise<{ ok: boolean; error?: string }>;
  /**
   * TEST-ONLY emulation (e2e, ?xrtest): runs the in-headset panels, clock hand-off and results flow on the
   * flat canvas without a session, so that code is exercised in CI. It is NOT a VR test and claims nothing
   * about headsets; the input below calls the same pure intent functions the controllers use.
   */
  emulate(on: boolean): void;
  debug: {
    trigger(t: Target): void;
    choose(optionId: string): boolean;
    grip(t: Target): void;
    release(t: Target): void;
    replay(): void;
    state(): { choice: string[]; hud: boolean; orders: boolean; results: boolean; note: string | null };
  };
  exit(): Promise<void>;
  frame(dt: number): void;
  invalidate(): void;
  dispose(): Promise<void>;
}

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
const toV3 = (p: Vector3): V3 => [p.x, p.y, p.z];
const fmtTime = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
const KIND_COLOR = { success: COLORS.success, info: COLORS.info, warn: COLORS.warn, mistake: COLORS.mistake } as Record<string, string>;

export async function createRushXr(ctx: RushXrCtx): Promise<RushXr | null> {
  const { scene, root, store, tr } = ctx;
  const [{ WebXRDefaultExperience }, { WebXRState }] = await Promise.all([
    import('@babylonjs/core/XR/webXRDefaultExperience'),
    import('@babylonjs/core/XR/webXRTypes'),
    import('@babylonjs/core/XR/motionController/index'),
  ]);
  const xr: WebXRDefaultExperience = await WebXRDefaultExperience.CreateAsync(scene, {
    disableDefaultUI: true,
    disableTeleportation: true,
    disableNearInteraction: true,
    disableHandTracking: true,
    floorMeshes: [ctx.floor],
    inputOptions: { doNotLoadControllerMeshes: true, disableOnlineControllerRepository: true },
    pointerSelectionOptions: { enablePointerSelectionOnAllControllers: true },
  });
  // The laser also stops on the invisible target boxes, so the ray shows what the trigger will act on.
  xr.pointerSelection.raySelectionPredicate = (m) => m.isEnabled() && m.isPickable && (m.isVisible || !!(m.metadata as { target?: Target } | null)?.target);

  let inXR = false;
  let emulated = false;
  const active = () => inXR || emulated;
  let disposed = false;
  const invRoot = new Matrix();
  const localOf = (world: Vector3): V3 => {
    root.computeWorldMatrix(true).invertToRef(invRoot);
    return toV3(Vector3.TransformCoordinates(world, invRoot));
  };
  const gripNode = (c: WebXRInputSource) => (c.grip ?? c.pointer) as TransformNode;
  const gripLocal = (c: WebXRInputSource) => localOf(gripNode(c).getAbsolutePosition());
  const rayTarget = (c: WebXRInputSource): Target | null => {
    try {
      return ((xr.pointerSelection.getMeshUnderPointer(c.uniqueId)?.metadata as { target?: Target } | null)?.target ?? null) as Target | null;
    } catch {
      return null;
    }
  };
  const pulse = (c: WebXRInputSource | null | undefined, h: readonly [number, number]) => {
    if (c) pulseGamepad(c.inputSource.gamepad as unknown as Parameters<typeof pulseGamepad>[0], h[0], h[1]);
  };

  // ── controllers: a small proxy sphere at the grip (no downloaded controller models) ──
  const proxies = new Map<string, Mesh>();
  xr.input.onControllerAddedObservable.add((c) => {
    const p = MeshBuilder.CreateSphere(`rush-hand-${c.uniqueId}`, { diameter: 0.04, segments: 8 }, scene);
    p.material = ctx.hand;
    p.isPickable = false;
    p.parent = gripNode(c);
    proxies.set(c.uniqueId, p);
  });
  xr.input.onControllerRemovedObservable.add((c) => {
    proxies.get(c.uniqueId)?.dispose();
    proxies.delete(c.uniqueId);
    if (carrier === c) carrier = null;
  });

  // ── acting ──
  let carrier: WebXRInputSource | null = null;
  let note: LocalizedText | null = null;
  const act = (a: PlayerAction, c: WebXRInputSource | null) => {
    ctx.onAct(a);
    const s = store.get();
    pulse(c, s.lastResult.ok ? HAPTIC.act : HAPTIC.reject);
    if (s.lastResult.ok) {
      note = null;
      if (s.hand && (a.type === 'grab' || a.type === 'takeCup')) carrier = c;
    }
    hud.key = '';
  };
  const handle = (i: VrIntent | null, c: WebXRInputSource | null) => {
    if (!i) return;
    if (i.kind === 'act') {
      closeChoice();
      act(i.action, c);
    } else if (i.kind === 'choose') openChoice(i, c);
    else {
      closeChoice();
      note = fmtL(XR_TEXT.nothing, { t: ctx.targetName(i.target) });
      pulse(c, HAPTIC.reject);
      hud.key = '';
    }
  };
  const fmtL = (t: LocalizedText, vals: Record<string, LocalizedText>): LocalizedText =>
    L(t.zh.replace(/\{(\w+)\}/g, (_, k) => vals[k]?.zh ?? ''), t.en.replace(/\{(\w+)\}/g, (_, k) => vals[k]?.en ?? ''));

  // trigger: Babylon's pointer selection turns it into a scene pointer-down carrying the picked mesh
  const pointerObs = scene.onPointerObservable.add((pi) => {
    if (!inXR || pi.type !== PointerEventTypes.POINTERDOWN) return;
    let c: WebXRInputSource | null = null;
    try {
      c = xr.pointerSelection.getXRControllerByPointerId((pi.event as PointerEvent).pointerId) ?? null;
    } catch {
      c = null;
    }
    const t = (pi.pickInfo?.pickedMesh?.metadata as { target?: Target } | null)?.target;
    if (c && t) handle(onTrigger(store.get(), t), c);
  });

  // grip: squeeze events on the session
  xr.baseExperience.sessionManager.onXRSessionInit.add((session) => {
    const find = (src: XRInputSource) => xr.input.controllers.find((c) => c.inputSource === src);
    session.addEventListener('squeezestart', (ev) => {
      const c = find((ev as XRInputSourceEvent).inputSource);
      if (!c) return;
      const s = store.get();
      if (s.hand) {
        carrier = c; // re-take the carried item into this hand
        return;
      }
      handle(onGripDown(s, gripLocal(c), rayTarget(c)), c);
    });
    session.addEventListener('squeezeend', (ev) => {
      const c = find((ev as XRInputSourceEvent).inputSource);
      if (!c || c !== carrier) return;
      const s = store.get();
      const a = onGripUp(s, gripLocal(c), rayTarget(c), s.guidance);
      if (a) act(a, c);
      else {
        note = XR_TEXT.holdHint;
        hud.key = '';
      }
    });
    session.addEventListener('visibilitychange', () => {
      const s = store.get();
      if (session.visibilityState !== 'visible' && s.status === 'playing') store.set(reduce(s, { type: 'pause' }));
    });
  });

  // ── panels ──
  const hud = createPanel(scene, 'rush-vr-hud', 0.56, 0.52, 1024, root);
  hud.mesh.position.set(-0.86, 0.44, -0.2);
  hud.mesh.rotation.y = -1.12;
  const orders = createPanel(scene, 'rush-vr-orders', 0.62, 0.32, 1024, root);
  orders.mesh.position.set(0.42, 0.6, 0.42);
  orders.mesh.isPickable = false;
  const results = createPanel(scene, 'rush-vr-results', 0.84, 0.62, 1024, root);
  results.mesh.position.set(0, 0.48, 0.12);
  const choice = createPanel(scene, 'rush-vr-choice', 0.46, 0.36, 768, root);
  const panels = [hud, orders, results, choice];
  for (const p of panels) p.mesh.setEnabled(false);
  let choiceIntent: VrIntent | null = null;
  let choiceCtrl: WebXRInputSource | null = null;

  function openChoice(i: Extract<VrIntent, { kind: 'choose' }>, c: WebXRInputSource | null) {
    choiceIntent = i;
    choiceCtrl = c;
    choiceKey = listKey(store.get());
    // next to the target, a little towards the user, turned to face the head (no billboard: stable picking)
    const p = TARGET_POS[i.target];
    const x = p[0];
    const y = p[1] + (i.target === 'group1' || i.target === 'group2' ? 0.12 : 0.3);
    const z = p[2] - 0.14;
    choice.mesh.position.set(x, y, z);
    const cam = inXR ? localOf(xr.baseExperience.camera.position) : ([0, 0.6, -USER_DISTANCE] as V3);
    choice.mesh.rotation.y = Math.atan2(-(cam[0] - x), -(cam[2] - z));
    renderChoice();
    choice.mesh.setEnabled(true);
  }
  function closeChoice() {
    choiceIntent = null;
    choiceCtrl = null;
    choice.mesh.setEnabled(false);
  }
  function renderChoice() {
    const i = choiceIntent;
    if (!i || i.kind !== 'choose') return;
    clearStack(choice);
    choice.stack.addControl(text(tr(fmtL(XR_TEXT.choose, { t: ctx.targetName(i.target) })), 34, COLORS.edge, true));
    const btns: Button[] = i.options.map((o) => {
      const b = button(`opt-${o.id}`, tr(o.label), () => {
        const a = chooseOption(store.get(), choiceIntent, o.id);
        const c = choiceCtrl;
        closeChoice();
        if (a) act(a, c);
      });
      b.width = '340px';
      b.height = '84px';
      b.fontSize = 26;
      if (b.textBlock) {
        b.textBlock.textWrapping = 1;
      }
      if (o.recommended) b.background = COLORS.buttonHi;
      return b;
    });
    for (let k = 0; k < btns.length; k += 2) choice.stack.addControl(row(btns.slice(k, k + 2), 92));
    choice.stack.addControl(row([button('opt-cancel', '✕', closeChoice)], 92));
  }

  // choices go stale when the world changes (listKey ignores pure time passing)
  let choiceKey = '';

  function renderHud(s: RushState) {
    const left = Math.max(0, Math.ceil((s.shiftMs - s.tMs) / 1000));
    const fb = s.feedback.at(-1);
    const hint = s.guidance === 'guided' ? ctx.hint() : null;
    const key = [
      tr(R.title),
      s.status,
      s.stats.points,
      s.stats.tips,
      s.stats.streak,
      s.mode === 'relaxed' ? s.stats.correct + s.stats.partly : left,
      s.hand,
      s.hand ? JSON.stringify(s.items[s.hand]) : '',
      fb?.seq,
      note?.en,
      hint?.en,
      ctx.seated(),
    ].join('|');
    if (key === hud.key) return;
    hud.key = key;
    clearStack(hud);
    const add = (c: Control) => hud.stack.addControl(c);
    add(text(`${tr(R.title)} · ${tr(fmtR(R.level, { n: s.level }))}`, 40, COLORS.text, true));
    add(text(`${tr(R.simulated)} · ${tr(R.gameTimeShot)}`, 28, COLORS.warn));
    add(text(`${tr(R.score)} ${s.stats.points} · ${tr(R.tips)} ${s.stats.tips} · ${tr(R.streak)} ${s.stats.streak}`, 36));
    add(text(s.mode === 'relaxed' ? tr(fmtR(R.served, { n: s.stats.correct + s.stats.partly, m: RELAXED.orders })) : `${tr(R.timeLeft)}: ${fmtTime(left)}`, 32, COLORS.info));
    add(text(`${tr(R.hands)}: ${s.hand ? tr(itemText(s.items[s.hand]!)) : tr(R.handsEmpty)}`, 30));
    if (s.status === 'paused') add(text(tr(R.paused), 44, COLORS.warn, true));
    else if (note) add(text(tr(note), 28, COLORS.muted));
    else if (hint) add(text(`${tr(XR_TEXT.next)}: ${tr(hint)}`, 28, COLORS.info));
    if (fb && s.status !== 'paused') {
      add(text(tr(fb.text), 28, KIND_COLOR[fb.kind] ?? COLORS.text));
      const d = fb.details?.[0];
      if (d) add(text(`${tr(d.what)} ${tr(d.why)}`, 24, COLORS.muted));
    }
    const paused = s.status === 'paused';
    add(
      row([
        button('vr-pause', paused ? tr(R.resume) : tr(R.pause), () => {
          const cur = store.get();
          store.set(reduce(cur, { type: cur.status === 'paused' ? 'resume' : 'pause' }));
        }),
        button('vr-end', tr(R.endShift), () => store.set(reduce(store.get(), { type: 'endShift' })), true),
        button('vr-recenter', tr(R.recenter), recenter, true),
      ]),
    );
    add(
      row([
        button('vr-height', ctx.seated() ? tr(XR_TEXT.standing) : tr(XR_TEXT.seated), () => {
          ctx.setSeated(!ctx.seated());
          hud.key = '';
        }, true),
        button('vr-exit', tr(XR_TEXT.exitVR), () => void exit(), true),
      ]),
    );
    add(text(`${tr(XR_TEXT.hint)} · ${tr(XR_TEXT.unverified)}`, 22, COLORS.muted));
  }

  function renderOrders(s: RushState) {
    const tickets = vrTickets(s, s.guidance);
    const key = [tr(R.orders), JSON.stringify(tickets)].join('|');
    if (key === orders.key) return;
    orders.key = key;
    clearStack(orders);
    orders.stack.addControl(text(tr(R.orders), 34, COLORS.edge, true));
    if (!tickets.length) orders.stack.addControl(text(tr(R.noOrders), 30, COLORS.muted));
    for (const o of tickets.slice(0, 3)) {
      orders.stack.addControl(text(`${tr(drinkName(o.drinkId))} — ${tr(customerName(o.customerId))}`, 38, COLORS.text, true));
      if (o.left === null) {
        orders.stack.addControl(text(tr(R.waitsForever), 26, COLORS.muted));
        continue;
      }
      const bg = new Rectangle();
      bg.width = '900px';
      bg.height = '20px';
      bg.thickness = 0;
      bg.cornerRadius = 10;
      bg.background = '#4a3426';
      bg.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      const bar = new Rectangle();
      bar.width = `${Math.max(8, Math.round(o.left * 900))}px`;
      bar.height = '20px';
      bar.thickness = 0;
      bar.cornerRadius = 10;
      bar.background = o.left <= 0.3 ? COLORS.mistake : o.left <= 0.6 ? COLORS.warn : COLORS.success;
      bar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      bg.addControl(bar);
      orders.stack.addControl(bg);
      orders.stack.addControl(o.leaving ? text(`⚠ ${tr(R.leaving)}`, 30, COLORS.mistake, true) : text(`${tr(R.patience)}: ${o.sec} s`, 26, COLORS.muted));
    }
  }

  function renderResults(s: RushState) {
    const key = [tr(R.results), s.status, s.records.length, s.stats.points].join('|');
    if (key === results.key) return;
    results.key = key;
    clearStack(results);
    const r = rushResult(s);
    const add = (c: Control) => results.stack.addControl(c);
    add(text(`${tr(R.results)} · ${tr(fmtR(R.level, { n: r.level }))}`, 44, COLORS.text, true));
    add(text(`${'★'.repeat(r.stars)}${'☆'.repeat(3 - r.stars)}  ${tr(fmtR(R.stars, { n: r.stars }))}`, 40, COLORS.warn, true));
    add(text(`${tr(fmtR(R.points, { p: r.points, m: r.potential }))} · ${tr(fmtR(R.counts, { c: r.correct, p: r.partly, w: r.wrongServes, t: r.timeouts }))}`, 28));
    for (const rec of s.records.slice(-3)) {
      const d = rec.diffs[0];
      add(text(`${tr(drinkName(rec.drinkId))}: ${tr(R.outcome[rec.outcome])}${d ? ` — ${tr(explain(rec.drinkId, d).what)}` : ''}`, 26, rec.outcome === 'correct' ? COLORS.success : COLORS.muted));
    }
    add(text(`${tr(R.savedNote)} ${tr(R.honesty)}`, 22, COLORS.muted));
    add(
      row([
        button('vr-again', tr(R.again), () => ctx.onReplay(), true),
        button('vr-lobby', tr(R.exit), () => ctx.onLobby(), true),
        button('vr-exit2', tr(XR_TEXT.exitVR), () => void exit(), true),
      ]),
    );
  }

  // ── comfort ──
  function recenter() {
    if (!inXR) return;
    const cam = xr.baseExperience.camera;
    const fwd = cam.getDirection(Vector3.Forward());
    const yaw = Math.atan2(fwd.x, fwd.z);
    root.rotation.y = yaw;
    root.position.set(cam.position.x + Math.sin(yaw) * USER_DISTANCE, ctx.counterH(), cam.position.z + Math.cos(yaw) * USER_DISTANCE);
  }
  const wallHome = ctx.wall.mesh.position.clone();
  xr.baseExperience.onStateChangedObservable.add((state) => {
    const now = state === WebXRState.IN_XR;
    if (now === inXR || disposed) return;
    inXR = now;
    emulated = false;
    setActive(inXR);
    if (inXR) setTimeout(() => !disposed && recenter(), 250);
  });
  function setActive(on: boolean) {
    for (const p of [hud, orders]) {
      p.mesh.setEnabled(on);
      p.key = '';
    }
    results.key = '';
    if (on) {
      // larger wall text in the headset (readable at ~1.2–1.5 m)
      ctx.wall.mesh.scaling.setAll(1.3);
      ctx.wall.mesh.position.set(wallHome.x, wallHome.y + 0.05, wallHome.z);
    } else {
      results.mesh.setEnabled(false);
      closeChoice();
      carrier = null;
      note = null;
      ctx.wall.mesh.scaling.setAll(1);
      ctx.wall.mesh.position.copyFrom(wallHome);
      ctx.setPads(new Map());
      ctx.outline([]);
      ctx.restoreView();
    }
    ctx.onXrChange(on);
  }

  // ── per frame (XR only) ──
  const hovered = new Map<string, Target | null>();
  let clockAcc = 0;
  let lastSnap: string | null = null;
  function frame(dt: number) {
    if (!active() || disposed) return;
    // The XR session drives the game clock; the sim runs fixed 100 ms steps, so tick at that rate.
    clockAcc += Math.min(dt, 0.1);
    if (clockAcc >= 0.1) {
      store.set(tick(store.get(), clockAcc));
      clockAcc = 0;
    }
    const s = store.get();
    const pads = new Map<Target, 'hover' | 'snap'>();
    const hov: Target[] = [];
    for (const c of xr.input.controllers) {
      const t = rayTarget(c);
      if (t !== (hovered.get(c.uniqueId) ?? null)) {
        hovered.set(c.uniqueId, t);
        if (t) pulse(c, HAPTIC.hover);
      }
      if (t) {
        pads.set(t, 'hover');
        hov.push(t);
      }
    }
    if (!s.hand) carrier = null;
    if (s.hand && carrier) {
      const node = ctx.rigNode(s.hand);
      const g = gripLocal(carrier);
      if (node) node.position.set(g[0], g[1] - 0.05, g[2]);
      const snap = snapTarget(s, g, rayTarget(carrier), s.guidance);
      if (snap) pads.set(snap, 'snap');
      if (snap !== lastSnap) {
        lastSnap = snap;
        if (snap && s.guidance !== 'independent') pulse(carrier, HAPTIC.snap);
      }
    }
    ctx.setPads(pads);
    ctx.outline(hov);
    if (choiceIntent) {
      const k = listKey(s);
      if (k !== choiceKey) {
        const i = onTrigger(s, choiceIntent.target);
        if (i?.kind === 'choose') {
          choiceIntent = i;
          renderChoice();
        } else closeChoice();
        choiceKey = k;
      }
    }
    const over = s.status === 'over';
    results.mesh.setEnabled(over);
    orders.mesh.setEnabled(!over);
    if (over) {
      closeChoice();
      renderResults(s);
    } else renderOrders(s);
    renderHud(s);
  }

  async function exit() {
    try {
      if (inXR) await xr.baseExperience.exitXRAsync();
    } catch {
      /* already ended */
    }
  }

  return {
    inXR: () => inXR,
    emulate(on) {
      if (inXR || disposed || on === emulated) return;
      emulated = on;
      setActive(on);
      if (on) {
        // roughly the standing user's view, wide like a headset, so a screenshot shows the panels
        const cam = ctx.camera;
        cam.lowerRadiusLimit = 0.5;
        cam.setTarget(v(0, ctx.counterH() + 0.42, 0.15));
        cam.alpha = -Math.PI / 2;
        cam.beta = 1.38;
        cam.radius = 0.8;
        cam.fov = 1.55;
      }
    },
    debug: {
      trigger: (t) => handle(onTrigger(store.get(), t), null),
      choose(id) {
        const a = chooseOption(store.get(), choiceIntent, id);
        closeChoice();
        if (a) act(a, null);
        return !!a;
      },
      grip: (t) => handle(onGripDown(store.get(), grabPoint(t), null), null),
      release(t) {
        const s = store.get();
        const a = onGripUp(s, grabPoint(t), null, s.guidance);
        if (a) act(a, null);
      },
      replay: () => ctx.onReplay(),
      state: () => ({
        choice: choiceIntent?.kind === 'choose' ? choiceIntent.options.map((o) => o.id) : [],
        hud: hud.mesh.isEnabled(),
        orders: orders.mesh.isEnabled(),
        results: results.mesh.isEnabled(),
        note: note?.en ?? null,
      }),
    },
    async enter() {
      try {
        ctx.camera.setPosition(v(0, ctx.counterH() + 0.6, -USER_DISTANCE));
        await xr.baseExperience.enterXRAsync('immersive-vr', 'local-floor');
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
      }
    },
    exit,
    frame,
    invalidate() {
      for (const p of panels) p.key = '';
      if (choiceIntent) renderChoice();
    },
    async dispose() {
      if (disposed) return;
      disposed = true;
      scene.onPointerObservable.remove(pointerObs);
      try {
        if (inXR) await xr.baseExperience.exitXRAsync();
      } catch {
        /* ignore */
      }
      try {
        xr.dispose();
      } catch {
        /* ignore */
      }
    },
  };
}
