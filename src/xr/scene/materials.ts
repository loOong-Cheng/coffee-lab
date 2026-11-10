/** Shared, cheap StandardMaterials (no textures) — warm café palette matching src/styles tokens. */
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { Scene } from '@babylonjs/core/scene';

export type MatName =
  | 'machine'
  | 'steel'
  | 'darkSteel'
  | 'plastic'
  | 'wood'
  | 'woodDark'
  | 'woodLight'
  | 'rubber'
  | 'ceramic'
  | 'grounds'
  | 'tamped'
  | 'spent'
  | 'espresso'
  | 'crema'
  | 'water'
  | 'wall'
  | 'floor'
  | 'cabinet'
  | 'hopper'
  | 'beans'
  | 'amber'
  | 'green'
  | 'gauge'
  | 'led'
  | 'bulb'
  | 'shade'
  | 'ringIdle'
  | 'ringNear'
  | 'ringSnap'
  | 'ghost'
  | 'arrow'
  | 'hand'
  | 'glass'
  | 'paper'
  | 'kettle';

const hex = (h: string) => Color3.FromHexString(h);

interface Spec {
  d: string;
  s?: number;
  p?: number;
  e?: string;
  a?: number;
  unlit?: boolean;
}

const SPECS: Record<MatName, Spec> = {
  machine: { d: '#b8452f', s: 0.35, p: 48 },
  steel: { d: '#c9cdd2', s: 0.9, p: 96 },
  darkSteel: { d: '#5d636b', s: 0.6, p: 64 },
  plastic: { d: '#2b2622', s: 0.25, p: 32 },
  wood: { d: '#9c6b45', s: 0.12, p: 24 },
  woodDark: { d: '#6b4226', s: 0.2, p: 24 },
  woodLight: { d: '#c49a6c', s: 0.1, p: 16 },
  rubber: { d: '#3a2a22', s: 0.05, p: 8 },
  ceramic: { d: '#fffaf2', s: 0.5, p: 64 },
  grounds: { d: '#6a4128', s: 0.02 },
  tamped: { d: '#4a2c1a', s: 0.05 },
  spent: { d: '#2e1b10', s: 0.02 },
  espresso: { d: '#3b1f10', s: 0.4, p: 64 },
  crema: { d: '#c98a3b', s: 0.3, p: 48, e: '#2a1608' },
  water: { d: '#cfe6f3', s: 0.8, p: 96, a: 0.55 },
  wall: { d: '#eadcca', s: 0.02 },
  floor: { d: '#5e3f2b', s: 0.1, p: 16 },
  cabinet: { d: '#5e3c24', s: 0.1, p: 16 },
  hopper: { d: '#d9b48a', s: 0.9, p: 96, a: 0.35 },
  beans: { d: '#4b2a17', s: 0.3, p: 32 },
  amber: { d: '#f0b93a', s: 0.5, p: 48, e: '#3d2a05' },
  green: { d: '#5f9a4a', s: 0.5, p: 48, e: '#132510' },
  gauge: { d: '#fbf3e4', s: 0.4, p: 48, e: '#2a2620' },
  led: { d: '#7ee08a', e: '#4fbf5d', unlit: true },
  bulb: { d: '#ffd9a0', e: '#ffcf8a', unlit: true },
  shade: { d: '#2f3a33', s: 0.4, p: 32 },
  ringIdle: { d: '#ffffff', e: '#f3e7d6', a: 0.55, unlit: true },
  ringNear: { d: '#f0b93a', e: '#f0b93a', a: 0.85, unlit: true },
  ringSnap: { d: '#58c46b', e: '#58c46b', a: 0.95, unlit: true },
  ghost: { d: '#8ec5e6', e: '#5fa8d8', a: 0.35, unlit: true },
  arrow: { d: '#f0b93a', e: '#f0b93a', unlit: true },
  hand: { d: '#e8d7c3', s: 0.2, p: 16, a: 0.9 },
  glass: { d: '#dfeef2', s: 0.9, p: 96, a: 0.3 },
  paper: { d: '#f3ead9', s: 0.05, p: 8 },
  kettle: { d: '#34343a', s: 0.5, p: 48 },
};

export type Materials = Record<MatName, StandardMaterial>;

export function createMaterials(scene: Scene): Materials {
  const out = {} as Materials;
  for (const [name, spec] of Object.entries(SPECS) as Array<[MatName, Spec]>) {
    const m = new StandardMaterial(`mat-${name}`, scene);
    m.diffuseColor = hex(spec.d);
    m.specularColor = new Color3(spec.s ?? 0.1, spec.s ?? 0.1, spec.s ?? 0.1);
    m.specularPower = spec.p ?? 16;
    if (spec.e) m.emissiveColor = hex(spec.e);
    if (spec.unlit) m.disableLighting = true;
    if (spec.a !== undefined) {
      m.alpha = spec.a;
      m.backFaceCulling = false;
    }
    out[name] = m;
  }
  return out;
}
