import { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { TransformNode } from '@babylonjs/core/Meshes/transformNode';

/**
 * Merge static parts into one mesh (one draw call) that lives under `parent`.
 *
 * Babylon's Mesh.MergeMeshes bakes each source's WORLD matrix into the vertices. If the sources are already parented
 * and the merged mesh is then parented again, the parent chain (e.g. the station's counter height) is applied twice and
 * the geometry is drawn far from where it belongs (bug: gooseneck kettle body ~0.9 m above its base). So: detach every
 * part first — its position/rotation/scaling are kept as values relative to `parent` — merge, then parent the result.
 */
export function mergeUnder(name: string, parts: Mesh[], parent: TransformNode | null): Mesh {
  for (const p of parts) p.parent = null;
  const merged = Mesh.MergeMeshes(parts, true, true)!;
  merged.name = name;
  merged.parent = parent;
  return merged;
}
