/** Turn lon/lat rings into SVG path data in projected map units (memoized: built once per session). */
import { project } from '../projection';
import { LAND, SEAS, type Ring } from './worldOutline';

const r2 = (n: number) => Math.round(n * 100) / 100;

export function ringsToPath(rings: readonly Ring[]): string {
  return rings
    .filter((ring) => ring.length >= 3)
    .map((ring) => {
      const pts = ring.map(([lon, lat]) => project(lat, lon));
      return `M${pts.map((p) => `${r2(p.x)} ${r2(p.y)}`).join('L')}Z`;
    })
    .join('');
}

let cache: { land: string; seas: string } | null = null;

export function worldPaths(): { land: string; seas: string } {
  if (!cache) cache = { land: ringsToPath(LAND), seas: ringsToPath(SEAS) };
  return cache;
}
