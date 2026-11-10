/**
 * Procedural, original low-poly espresso station (no external assets → no
 * licensing risk). Static parts are merged per material to keep draw calls low.
 */
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Scene } from '@babylonjs/core/scene';
import type { ButtonId, InspectableId, ItemId } from '../mission/types';
import type { Materials, MatName } from './materials';
import { BUTTON_POS, ZONE_POS, type Vec3 } from './layout';
import { mergeUnder } from './merge';

export type PickMeta =
  | { kind: 'item'; id: ItemId }
  | { kind: 'button'; id: ButtonId }
  | { kind: 'part'; id: InspectableId };

export interface ItemRig {
  root: TransformNode;
  meshes: Mesh[];
}

export interface EspressoProps {
  root: TransformNode;
  items: Record<ItemId, ItemRig>;
  buttons: Record<ButtonId, Mesh>;
  /** Meshes that can be inspected/located (for hover highlight). */
  parts: Partial<Record<InspectableId, Mesh[]>>;
  coffee: { mound: Mesh; bed: Mesh };
  cupLiquid: Mesh;
  streams: { espresso: Mesh; flush: Mesh; grind: Mesh };
  knockPile: Mesh;
  scaleDisplay: Mesh;
  /** Every mesh we created (for draw-call accounting / disposal). */
  all: AbstractMesh[];
}

type Parent = TransformNode;

export function buildEspressoProps(scene: Scene, mats: Materials, root: TransformNode): EspressoProps {
  const all: AbstractMesh[] = [];

  const track = <T extends AbstractMesh>(m: T, meta?: PickMeta): T => {
    all.push(m);
    if (meta) m.metadata = meta;
    m.isPickable = !!meta;
    return m;
  };
  const at = (m: Mesh, p: Vec3, parent: Parent, mat: MatName): Mesh => {
    m.position.set(p[0], p[1], p[2]);
    m.parent = parent;
    m.material = mats[mat];
    return m;
  };
  const box = (name: string, w: number, h: number, d: number, p: Vec3, parent: Parent, mat: MatName) =>
    at(MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, scene), p, parent, mat);
  const cyl = (
    name: string,
    o: { d?: number; dt?: number; db?: number; h: number; t?: number },
    p: Vec3,
    parent: Parent,
    mat: MatName,
  ) =>
    at(
      MeshBuilder.CreateCylinder(
        name,
        { height: o.h, diameter: o.d, diameterTop: o.dt ?? o.d, diameterBottom: o.db ?? o.d, tessellation: o.t ?? 20 },
        scene,
      ),
      p,
      parent,
      mat,
    );
  /** Merge same-material static meshes into one draw call. */
  const merge = (name: string, meshes: Mesh[], meta?: PickMeta): Mesh => {
    const merged = mergeUnder(name, meshes, meshes[0]!.parent as TransformNode | null);
    return track(merged, meta);
  };

  // ── espresso machine ──
  const machineBody = track(box('machine-body', 0.42, 0.4, 0.34, [0, 0.2, 0.25], root, 'machine'), {
    kind: 'part',
    id: 'espresso-machine',
  });
  const steelParts = [
    box('top-tray', 0.4, 0.012, 0.32, [0, 0.406, 0.25], root, 'steel'),
    box('gh-neck', 0.09, 0.06, 0.09, [0, 0.278, 0.04], root, 'steel'),
    cyl('steam-knob', { d: 0.03, h: 0.02 }, [0.185, 0.33, 0.085], root, 'steel'),
  ];
  const wand = cyl('steam-wand', { d: 0.01, h: 0.2 }, [0.2, 0.2, 0.05], root, 'steel');
  wand.rotation.z = 0.18;
  steelParts.push(wand);
  merge('machine-steel', steelParts, { kind: 'part', id: 'espresso-machine' });
  const groupHead = track(cyl('group-head', { d: 0.085, h: 0.05 }, [0, 0.265, 0.0], root, 'steel'), { kind: 'part', id: 'group-head' });
  track(box('front-panel', 0.36, 0.11, 0.004, [0, 0.33, 0.079], root, 'darkSteel'), {
    kind: 'part',
    id: 'espresso-machine',
  });
  const gauge = cyl('gauge', { d: 0.05, h: 0.006 }, [-0.11, 0.33, 0.075], root, 'gauge');
  gauge.rotation.x = Math.PI / 2;
  track(gauge, { kind: 'part', id: 'espresso-machine' });
  const led = MeshBuilder.CreateSphere('power-led', { diameter: 0.008, segments: 6 }, scene);
  track(at(led, [0.17, 0.37, 0.076], root, 'led'));
  const brew = cyl('brew-button', { d: 0.034, h: 0.014 }, BUTTON_POS.brew, root, 'amber');
  brew.rotation.x = Math.PI / 2;
  track(brew, { kind: 'button', id: 'brew' });
  const tray = track(box('drip-tray', 0.26, 0.025, 0.15, [0, 0.0125, 0.005], root, 'darkSteel'), { kind: 'part', id: 'drip-tray' });

  // ── scale (on the drip tray, under the group head) ──
  const scaleBody = track(box('scale-body', 0.13, 0.02, 0.13, [0, 0.035, 0], root, 'plastic'), { kind: 'part', id: 'scale' });
  const scalePlate = track(box('scale-plate', 0.12, 0.002, 0.12, [0, 0.046, 0], root, 'steel'), { kind: 'part', id: 'scale' });
  const scaleDisplay = MeshBuilder.CreatePlane('scale-display', { width: 0.05, height: 0.016 }, scene);
  scaleDisplay.position.set(-0.025, 0.035, -0.0655);
  scaleDisplay.parent = root;
  track(scaleDisplay, { kind: 'part', id: 'scale' });
  const tare = track(box('tare-button', 0.024, 0.01, 0.006, BUTTON_POS.tare, root, 'amber'), { kind: 'button', id: 'tare' });

  // ── grinder ──
  const gx = ZONE_POS['grinder-fork'][0];
  const grinderBody = track(box('grinder-body', 0.15, 0.34, 0.18, [gx, 0.17, 0.17], root, 'plastic'), { kind: 'part', id: 'grinder' });
  const hopper = track(cyl('hopper', { dt: 0.15, db: 0.07, h: 0.17 }, [gx, 0.425, 0.17], root, 'hopper'), { kind: 'part', id: 'grinder' });
  const beans = cyl('beans', { dt: 0.11, db: 0.065, h: 0.09 }, [gx, 0.385, 0.17], root, 'beans');
  track(beans);
  merge('grinder-steel', [
    box('fork-l', 0.012, 0.012, 0.14, [gx - 0.034, 0.122, 0.01], root, 'steel'),
    box('fork-r', 0.012, 0.012, 0.14, [gx + 0.034, 0.122, 0.01], root, 'steel'),
    box('chute', 0.04, 0.03, 0.05, [gx, 0.215, 0.055], root, 'steel'),
  ], { kind: 'part', id: 'grinder' });
  const grindBtn = cyl('grinder-button', { d: 0.032, h: 0.012 }, BUTTON_POS.grinder, root, 'green');
  grindBtn.rotation.x = Math.PI / 2;
  track(grindBtn, { kind: 'button', id: 'grinder' });

  // ── knock box, mats, boards ──
  const [kx, , kz] = ZONE_POS['knock-box'];
  const knockBody = track(box('knock-box', 0.13, 0.11, 0.13, [kx, 0.055, kz], root, 'rubber'), { kind: 'part', id: 'knock-box' });
  const bar = cyl('knock-bar', { d: 0.016, h: 0.13 }, [kx, 0.105, kz], root, 'steel');
  bar.rotation.z = Math.PI / 2;
  track(bar, { kind: 'part', id: 'knock-box' });
  const knockPile = track(cyl('knock-pile', { d: 0.1, h: 0.012 }, [kx, 0.112, kz], root, 'spent'));
  knockPile.isVisible = false;
  const [tx, , tz] = ZONE_POS['tamp-mat'];
  const mat = track(box('tamp-mat', 0.17, 0.012, 0.13, [tx, 0.006, tz], root, 'rubber'), { kind: 'part', id: 'tamp-mat' });
  const [sx, , sz] = ZONE_POS.serve;
  const board = track(box('serve-board', 0.18, 0.012, 0.14, [sx, 0.006, sz], root, 'woodLight'), { kind: 'part', id: 'serve' });
  const [hx, , hz] = ZONE_POS['cup-home'];
  track(cyl('saucer', { d: 0.1, db: 0.08, h: 0.006 }, [hx, 0.003, hz], root, 'ceramic'));
  const [px, , pz] = ZONE_POS['tamper-stand'];
  track(cyl('tamper-stand', { d: 0.075, h: 0.01 }, [px, 0.005, pz], root, 'rubber'));

  // ── streams (shown while grinding / brewing / flushing) ──
  const streamEspresso = track(cyl('stream-espresso', { d: 0.0045, h: 1, t: 8 }, [0, 0.15, 0], root, 'espresso'));
  const streamFlush = track(cyl('stream-flush', { d: 0.03, h: 1, t: 12 }, [0, 0.13, 0], root, 'water'));
  const streamGrind = track(cyl('stream-grind', { d: 0.008, h: 1, t: 8 }, [gx, 0.18, -0.02], root, 'grounds'));
  for (const s of [streamEspresso, streamFlush, streamGrind]) s.isVisible = false;

  // ── movable items (root = snap anchor) ──
  const pf = buildPortafilter(scene, mats, root, track);
  const tamper = buildTamper(scene, mats, root, track);
  const cup = buildCup(scene, mats, root, track);

  return {
    root,
    items: { portafilter: pf.rig, tamper, cup: cup.rig },
    buttons: { brew, grinder: grindBtn, tare },
    parts: {
      'espresso-machine': [machineBody],
      'group-head': [groupHead],
      'drip-tray': [tray],
      scale: [scaleBody, scalePlate],
      grinder: [grinderBody, hopper],
      'knock-box': [knockBody],
      'tamp-mat': [mat],
      serve: [board],
    },
    coffee: pf.coffee,
    cupLiquid: cup.liquid,
    streams: { espresso: streamEspresso, flush: streamFlush, grind: streamGrind },
    knockPile,
    scaleDisplay,
    all,
  };
}

type Track = <T extends AbstractMesh>(m: T, meta?: PickMeta) => T;

function buildPortafilter(scene: Scene, mats: Materials, parent: TransformNode, track: Track) {
  const root = new TransformNode('portafilter', scene);
  root.parent = parent;
  const meta: PickMeta = { kind: 'item', id: 'portafilter' };
  const mk = (m: Mesh, x: number, y: number, z: number) => {
    m.position.set(x, y, z);
    m.parent = root;
    return m;
  };
  const holder = mk(MeshBuilder.CreateCylinder('pf-holder', { diameter: 0.072, height: 0.03, tessellation: 24 }, scene), 0, 0, 0);
  const neck = mk(MeshBuilder.CreateCylinder('pf-neck', { diameter: 0.02, height: 0.035, tessellation: 10 }, scene), 0, -0.004, -0.05);
  neck.rotation.x = Math.PI / 2;
  const spout = mk(MeshBuilder.CreateCylinder('pf-spout', { diameterTop: 0.024, diameterBottom: 0.014, height: 0.022, tessellation: 12 }, scene), 0, -0.026, 0);
  const lugs = mk(MeshBuilder.CreateBox('pf-lugs', { width: 0.094, height: 0.008, depth: 0.014 }, scene), 0, 0.011, 0);
  const steel = mergeUnder('pf-steel', [holder, neck, spout, lugs], root);
  steel.material = mats.steel;
  const handle = mk(MeshBuilder.CreateCylinder('pf-handle', { diameterTop: 0.024, diameterBottom: 0.03, height: 0.12, tessellation: 12 }, scene), 0, -0.006, -0.125);
  handle.rotation.x = Math.PI / 2;
  handle.material = mats.woodDark;
  const mound = mk(MeshBuilder.CreateCylinder('pf-mound', { diameterTop: 0.034, diameterBottom: 0.062, height: 0.014, tessellation: 18 }, scene), 0, 0.019, 0);
  mound.material = mats.grounds;
  const bed = mk(MeshBuilder.CreateCylinder('pf-bed', { diameter: 0.062, height: 0.003, tessellation: 18 }, scene), 0, 0.0135, 0);
  bed.material = mats.tamped;
  mound.isVisible = false;
  bed.isVisible = false;
  for (const m of [steel, handle, mound, bed]) track(m, meta);
  return { rig: { root, meshes: [steel, handle, mound, bed] }, coffee: { mound, bed } };
}

function buildTamper(scene: Scene, mats: Materials, parent: TransformNode, track: Track): ItemRig {
  const root = new TransformNode('tamper', scene);
  root.parent = parent;
  const meta: PickMeta = { kind: 'item', id: 'tamper' };
  const base = MeshBuilder.CreateCylinder('tamper-base', { diameter: 0.058, height: 0.016, tessellation: 24 }, scene);
  base.position.y = 0.008;
  base.parent = root;
  base.material = mats.steel;
  const stem = MeshBuilder.CreateCylinder('tamper-stem', { diameterBottom: 0.022, diameterTop: 0.03, height: 0.06, tessellation: 14 }, scene);
  stem.position.y = 0.046;
  const knob = MeshBuilder.CreateSphere('tamper-knob', { diameter: 0.04, segments: 10 }, scene);
  knob.position.y = 0.082;
  const handle = mergeUnder('tamper-handle', [stem, knob], root);
  handle.material = mats.woodDark;
  for (const m of [base, handle]) track(m, meta);
  return { root, meshes: [base, handle] };
}

function buildCup(scene: Scene, mats: Materials, parent: TransformNode, track: Track) {
  const root = new TransformNode('cup', scene);
  root.parent = parent;
  const meta: PickMeta = { kind: 'item', id: 'cup' };
  const profile = [
    [0, 0],
    [0.024, 0],
    [0.028, 0.004],
    [0.031, 0.02],
    [0.034, 0.045],
    [0.036, 0.064],
    [0.033, 0.065],
    [0.031, 0.046],
    [0.028, 0.022],
    [0.022, 0.011],
    [0, 0.01],
  ].map(([x, y]) => new Vector3(x, y, 0));
  const body = MeshBuilder.CreateLathe('cup-body', { shape: profile, tessellation: 24, sideOrientation: Mesh.DOUBLESIDE }, scene);
  body.parent = root;
  body.material = mats.ceramic;
  const handle = MeshBuilder.CreateTorus('cup-handle', { diameter: 0.03, thickness: 0.007, tessellation: 14 }, scene);
  handle.rotation.x = Math.PI / 2;
  handle.position.set(0.042, 0.036, 0);
  handle.parent = root;
  handle.material = mats.ceramic;
  const liquid = MeshBuilder.CreateCylinder('cup-liquid', { diameter: 0.056, height: 0.002, tessellation: 20 }, scene);
  liquid.parent = root;
  liquid.position.y = 0.012;
  liquid.material = mats.crema;
  liquid.isVisible = false;
  for (const m of [body, handle, liquid]) track(m, meta);
  return { rig: { root, meshes: [body, handle, liquid] }, liquid };
}

/** Room dressing outside the station (floor is world-space so it stays on the real floor in XR). */
export function buildRoom(scene: Scene, mats: Materials, station: TransformNode): AbstractMesh[] {
  const out: AbstractMesh[] = [];
  const floor = MeshBuilder.CreateGround('floor', { width: 8, height: 8 }, scene);
  floor.material = mats.floor;
  floor.isPickable = false;
  out.push(floor);

  const wall = MeshBuilder.CreateBox('back-wall', { width: 3.2, height: 2.8, depth: 0.05 }, scene);
  wall.parent = station;
  wall.position.set(0, 0.4, 0.62);
  wall.material = mats.wall;
  const shelf = MeshBuilder.CreateBox('shelf', { width: 0.9, height: 0.025, depth: 0.16 }, scene);
  shelf.parent = station;
  shelf.position.set(0.35, 0.78, 0.52);
  shelf.material = mats.woodDark;
  const jars: Mesh[] = [0.1, 0.3, 0.5].map((x, i) => {
    const j = MeshBuilder.CreateCylinder(`jar-${i}`, { diameter: 0.09, height: 0.13 + i * 0.02, tessellation: 14 }, scene);
    j.position.set(x, 0.86 + i * 0.01, 0.52);
    j.parent = station;
    return j;
  });
  const jarMesh = mergeUnder('shelf-jars', jars, station);
  jarMesh.material = mats.beans;

  const cord = MeshBuilder.CreateCylinder('lamp-cord', { diameter: 0.006, height: 0.9, tessellation: 6 }, scene);
  cord.parent = station;
  cord.position.set(-0.05, 1.4, 0.2);
  cord.material = mats.plastic;
  const shade = MeshBuilder.CreateCylinder('lamp-shade', { diameterTop: 0.05, diameterBottom: 0.26, height: 0.16, tessellation: 20 }, scene);
  shade.parent = station;
  shade.position.set(-0.05, 0.9, 0.2);
  shade.material = mats.shade;
  const bulb = MeshBuilder.CreateSphere('lamp-bulb', { diameter: 0.07, segments: 8 }, scene);
  bulb.parent = station;
  bulb.position.set(-0.05, 0.82, 0.2);
  bulb.material = mats.bulb;
  for (const m of [wall, shelf, jarMesh, cord, shade, bulb]) {
    m.isPickable = false;
    out.push(m);
  }
  return out;
}
