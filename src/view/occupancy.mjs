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
import { derivedFormClass } from "../form/kit.mjs";

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
 * @property {Map<string,"fixture"|"rail">} forms SPARSE: entries only for non-cube cells (T-097-01's
 *   third class — empty for every cube-only build, so all pre-fixture semantics are untouched)
 * @property {Map<string,Record<string,string>>} states SPARSE: block-state map per cell that carried one
 * @property {(x:number,y:number,z:number)=>boolean} has occupied by ANYTHING (cube or fixture)
 * @property {(x:number,y:number,z:number)=>(string|null)} block block id (as written) or null
 * @property {(x:number,y:number,z:number)=>("cube"|"fixture"|"rail"|null)} formOf null when empty
 * @property {(x:number,y:number,z:number)=>boolean} solid occupied by a FULL CUBE (the skin/mass
 *   predicate — a fence-dressed window cell is occupied but not solid)
 */

/**
 * Build an {@link Occupancy} from a list of `{ pos:[x,y,z], block, form?, state? }` voxels. Last
 * write wins WHOLE (block, form, and state replace together — the expandArtifact rule). `form` is
 * stored only when non-cube ("fixture"|"rail"); omitted form means cube, so existing
 * `{pos, block}` call sites are unchanged. PURE.
 */
export function occupancyFromCells(cellList) {
  const cells = new Map();
  const forms = new Map();
  const states = new Map();
  let min = null;
  let max = null;
  for (const c of cellList) {
    const [x, y, z] = c.pos;
    const key = voxelKey(c.pos);
    cells.set(key, c.block);
    if (c.form === "fixture" || c.form === "rail") forms.set(key, c.form);
    else forms.delete(key); // a later cube write un-fixtures the cell (last write wins whole)
    if (c.state !== undefined && c.state !== null) states.set(key, c.state);
    else states.delete(key);
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
    forms,
    states,
    has: (x, y, z) => cells.has(`${x},${y},${z}`),
    block: (x, y, z) => cells.get(`${x},${y},${z}`) ?? null,
    formOf: (x, y, z) => {
      const key = `${x},${y},${z}`;
      return cells.has(key) ? (forms.get(key) ?? "cube") : null;
    },
    solid: (x, y, z) => {
      const key = `${x},${y},${z}`;
      return cells.has(key) && !forms.has(key);
    },
  };
}

/**
 * Build an {@link Occupancy} from a (schema-valid) design artifact by expanding its placements. The one
 * place the view layer reads the artifact contract — via `expandArtifact`, not a re-implementation.
 * Each voxel's `state` is carried, and its form class is derived via `opts.formOf` (default: the kit
 * ground-truth classifier, src/form/kit.mjs — cube iff in the full-cube block→Lab table) so fixture
 * cells land in the third class.
 * @param {{ placements: object[] }} artifact
 * @param {{ formOf?: (block:string)=>("cube"|"fixture"|"rail") }} [opts] injectable for tests/exotics
 * @returns {Occupancy}
 */
export function artifactOccupancy(artifact, opts = {}) {
  const classify = opts.formOf ?? derivedFormClass;
  const voxels = expandArtifact(artifact);
  return occupancyFromCells(
    voxels.map((v) => ({ pos: v.pos, block: v.block, form: classify(v.block), state: v.state }))
  );
}

/**
 * Derived SOLID view: cube cells only — what the watertightness/skin ops read, so a fixture never
 * fakes shell mass and a dressed aperture still projects as air (T-097-01 AC #4/#5). Returns `occ`
 * ITSELF when there are no fixture cells (zero cost — and identity is the back-compat witness for
 * every existing cube-only build). PURE.
 * @param {Occupancy} occ
 * @returns {Occupancy}
 */
export function solidOccupancy(occ) {
  if (occ.forms.size === 0) return occ;
  const cells = [];
  for (const [key, block] of occ.cells) {
    if (occ.forms.has(key)) continue;
    const pos = key.split(",").map(Number);
    const state = occ.states.get(key);
    cells.push(state === undefined ? { pos, block } : { pos, block, state });
  }
  return occupancyFromCells(cells);
}
