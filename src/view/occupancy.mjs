// Occupancy adapter — the shared input for the E-23 view layer (T-078-01, story S-078).
//
// The view-layer substrate (the 2.5-D surface grid + the structural read) reads OCCUPANCY, not the raw
// artifact and not a GL world. This module is the one thin, PURE adapter from a (schema-valid) design
// artifact to a material-carrying occupancy: it reuses `expandArtifact` (src/expand.mjs — never refork
// the expansion) and exposes the same vocabulary the GLB voxelizer established (bounds, dims, occupied
// cells) EXTENDED with the per-cell block id, because the surface grid is a PAINT CANVAS and needs to
// know each surface cell's CURRENT material.
//
// PURE — no GL, no I/O, no Date/random — so it runs under the `src/**/*.test.mjs` glob. Coordinates stay
// in the artifact's OWN integer space (a building is centred near origin and uses negative coords); the
// `dims`/`bounds.min` pair lets a caller index a 0-based grid the way glb-voxelize.mjs does, without
// re-centering the build.

import { expandArtifact, voxelKey } from "../expand.mjs";

/** Strip a leading `minecraft:` namespace for material comparison. Storage keeps the id as written. */
export function bareBlock(id) {
  return typeof id === "string" ? id.replace(/^minecraft:/, "") : id;
}

/**
 * @typedef {Object} Occupancy
 * @property {{min:number[],max:number[]}|null} bounds inclusive integer AABB (null when empty)
 * @property {number[]} dims [nx,ny,nz] = max-min+1 per axis (0,0,0 when empty)
 * @property {number} size occupied-cell count
 * @property {Map<string,string>} cells voxelKey "x,y,z" → block id (as written)
 * @property {(x:number,y:number,z:number)=>boolean} has
 * @property {(x:number,y:number,z:number)=>(string|null)} block block id (as written) or null
 */

/** Build an {@link Occupancy} from a list of `{ pos:[x,y,z], block }` voxels. Last write wins. PURE. */
export function occupancyFromCells(cellList) {
  const cells = new Map();
  let min = null;
  let max = null;
  for (const c of cellList) {
    const [x, y, z] = c.pos;
    cells.set(voxelKey(c.pos), c.block);
    if (min === null) {
      min = [x, y, z];
      max = [x, y, z];
    } else {
      if (x < min[0]) min[0] = x;
      if (y < min[1]) min[1] = y;
      if (z < min[2]) min[2] = z;
      if (x > max[0]) max[0] = x;
      if (y > max[1]) max[1] = y;
      if (z > max[2]) max[2] = z;
    }
  }
  const bounds = min === null ? null : { min, max };
  const dims = bounds ? [max[0] - min[0] + 1, max[1] - min[1] + 1, max[2] - min[2] + 1] : [0, 0, 0];
  return {
    bounds,
    dims,
    size: cells.size,
    cells,
    has: (x, y, z) => cells.has(`${x},${y},${z}`),
    block: (x, y, z) => cells.get(`${x},${y},${z}`) ?? null,
  };
}

/**
 * Build an {@link Occupancy} from a (schema-valid) design artifact by expanding its placements. The one
 * place the view layer reads the artifact contract — via `expandArtifact`, not a re-implementation.
 * @param {{ placements: object[] }} artifact
 * @returns {Occupancy}
 */
export function artifactOccupancy(artifact) {
  const voxels = expandArtifact(artifact);
  return occupancyFromCells(voxels.map((v) => ({ pos: v.pos, block: v.block })));
}
