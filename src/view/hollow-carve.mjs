// Hollow-the-mass carve ops — the program path (T-080-01, story S-080, epic E-23). DEPENDS ON the
// watertight shell from T-084-01 and the hollowable-mass detector from T-082-01.
//
// A voxelized mass is SOLID; the milestone needs a HOLLOW shell (skin + structure) to put rooms in.
// Carving is a deterministic program; WHAT is safely hollowable is the scoped light-tier detector
// (hollowable-mass.mjs). This module is the carve + its exterior-held proof:
//   • markHollowable  — the removable set: ENCLOSED mass (reuses surface-coherence.enclosedMassKeys, the
//                       ONE definition) minus protected STRUCTURE, optionally eroded to keep thicker walls
//                       and restricted to the detector's regions.
//   • carveArtifact   — FLATTEN-BY-EXCLUSION: there is NO air op (`facade-recess-by-exclusion`); a voxel is
//                       removed by NOT placing it. Expand → drop the carved keys → re-emit kept cells as
//                       {op:"voxel"}. expandArtifact is full-replace + order-independent, so the kept cells
//                       re-expand BYTE-IDENTICALLY. Only existing block ids are copied → stays AJV-valid.
//   • exteriorHeld    — the AC-#3 proof: removable ⊆ enclosed ⊆ NON-skin, so no front-most ortho surface
//                       voxel can change. exteriorSurfaceDigest over the 6 ortho views, equal before/after.
//
// PURE — no GL, no I/O, no model, no Date/random — runs under the `src/**/*.test.mjs` glob. The GL renders
// + the metered detector call live in the runner (benchmarks/sculpture/hollow-cottage.mjs).

import { enclosedMassKeys } from "./surface-coherence.mjs";
import { footprint } from "./structural-read.mjs";
import { projectSurface, ORTHO_DIRS } from "./surface-grid.mjs";
import { occupancyFromCells } from "./occupancy.mjs";
import { expandArtifact, voxelKey } from "../expand.mjs";

/** Schema tag for the carve report. */
export const HOLLOW_SCHEMA = "hollow-carve/v1";

/** 6-connected orthogonal neighbour offsets (the same rule enclosedMassKeys / the watertight flood use). */
const NEIGH6 = Object.freeze([
  [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1],
]);

/** Per-(x,z) column min/max occupied y over the occupancy. Shared by tallColumnKeys + the structure read.
 *  Returns a Map "x,z" → {minY, maxY, keys:string[]} (keys = every voxel key in the column). PURE. */
function columnExtents(occ) {
  const cols = new Map();
  for (const key of occ.cells.keys()) {
    const [x, y, z] = key.split(",").map(Number);
    const ck = `${x},${z}`;
    let c = cols.get(ck);
    if (!c) { c = { minY: y, maxY: y, keys: [] }; cols.set(ck, c); }
    if (y < c.minY) c.minY = y;
    if (y > c.maxY) c.maxY = y;
    c.keys.push(key);
  }
  return cols;
}

/**
 * Every voxel key in the 4 footprint-bbox-corner (x,z) columns — the CORNER POSTS the skin hangs on. A
 * minimal, always-safe structural keep set (AC #2 "keeping … corner posts"). PURE.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @returns {Set<string>}
 */
export function cornerPostKeys(occ) {
  const keep = new Set();
  if (!occ.bounds) return keep;
  const fp = footprint(occ);
  if (!fp.bbox) return keep;
  const { minX, maxX, minZ, maxZ } = fp.bbox;
  const corners = new Set([`${minX},${minZ}`, `${minX},${maxZ}`, `${maxX},${minZ}`, `${maxX},${maxZ}`]);
  for (const key of occ.cells.keys()) {
    const [x, , z] = key.split(",").map(Number);
    if (corners.has(`${x},${z}`)) keep.add(key);
  }
  return keep;
}

/**
 * Every voxel key in columns whose occupied y-extent ≥ `minSpanFrac` of the build height — the CHIMNEY
 * SHAFT + any floor-to-roof POST ("anything the skin needs"). Geometric: a full-height column is
 * load-bearing. Intended for an ARTICULATED build (open interior); a fully-solid mass has every column
 * full-height, so the caller uses corner posts (or detector regions) there instead — see design.md. PURE.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {{minSpanFrac?:number}} [opts]
 * @returns {Set<string>}
 */
export function tallColumnKeys(occ, { minSpanFrac = 0.9 } = {}) {
  const keep = new Set();
  if (!occ.bounds) return keep;
  const height = occ.dims[1]; // ny = max-min+1
  const threshold = minSpanFrac * height;
  for (const c of columnExtents(occ).values()) {
    const span = c.maxY - c.minY + 1;
    if (span >= threshold) for (const k of c.keys) keep.add(k);
  }
  return keep;
}

/** Erode a key set `steps` times by the 6-neighbour rule: a cell survives a step only if all six of its
 *  ortho neighbours are also in the set (so an `inset`-thick wall is left when steps = inset-1). PURE. */
function erodeKeys(keys, steps) {
  let cur = keys;
  for (let s = 0; s < steps; s++) {
    const next = new Set();
    for (const key of cur) {
      const [x, y, z] = key.split(",").map(Number);
      let interior = true;
      for (const [dx, dy, dz] of NEIGH6) {
        if (!cur.has(`${x + dx},${y + dy},${z + dz}`)) { interior = false; break; }
      }
      if (interior) next.add(key);
    }
    cur = next;
    if (cur.size === 0) break;
  }
  return cur;
}

/**
 * Mark the removable interior mass (AC #1). Base = the ENCLOSED mass (reuses
 * `surface-coherence.enclosedMassKeys` — the single definition), eroded `inset-1` times to keep an
 * `inset`-thick wall, optionally restricted to the detector's `regions` y-bands, then minus the protected
 * `keep` structure. Every key in `remove` is by construction enclosed → NOT on the exterior skin, so
 * carving them cannot change the exterior. PURE.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {{keep?:Set<string>|Iterable<string>, regions?:{yStart:number,yEnd:number}[], inset?:number}} [opts]
 * @returns {{remove:Set<string>, removeCount:number, enclosed:number, protectedCount:number,
 *   perBand:{yStart:number,yEnd:number,removed:number}[]}}
 */
export function markHollowable(occ, { keep, regions, inset = 1 } = {}) {
  if (!occ || !occ.bounds) return { remove: new Set(), removeCount: 0, enclosed: 0, protectedCount: 0, perBand: [] };
  const enclosedKeys = enclosedMassKeys(occ);
  const enclosed = enclosedKeys.size;
  const eroded = inset > 1 ? erodeKeys(enclosedKeys, inset - 1) : enclosedKeys;
  const keepSet = keep ? (keep instanceof Set ? keep : new Set(keep)) : null;

  const inRegion = (y) => !regions || regions.length === 0 || regions.some((r) => y >= r.yStart && y <= r.yEnd);

  const remove = new Set();
  let protectedCount = 0;
  for (const key of eroded) {
    if (keepSet && keepSet.has(key)) { protectedCount++; continue; }
    const y = Number(key.split(",")[1]);
    if (!inRegion(y)) continue;
    remove.add(key);
  }

  // bin removed by region band (or one band over the build's y-range when no regions given)
  const { min, max } = occ.bounds;
  const bands = regions && regions.length ? regions : [{ yStart: min[1], yEnd: max[1] }];
  const perBand = bands.map((b) => {
    let n = 0;
    for (const key of remove) {
      const y = Number(key.split(",")[1]);
      if (y >= b.yStart && y <= b.yEnd) n++;
    }
    return { yStart: b.yStart, yEnd: b.yEnd, removed: n };
  });

  return { remove, removeCount: remove.size, enclosed, protectedCount, perBand };
}

/** A {op:"voxel"} placement carrying the voxel's block (+ state when present). PURE. */
function toVoxelPlacement(voxel) {
  return voxel.state === undefined
    ? { op: "voxel", pos: [...voxel.pos], block: voxel.block }
    : { op: "voxel", pos: [...voxel.pos], block: voxel.block, state: voxel.state };
}

/**
 * Carve the marked mass by FLATTEN-BY-EXCLUSION (AC #2). Expand the artifact to its final explicit voxels,
 * DROP the keys in `remove`, and re-emit the KEPT cells as `{op:"voxel"}` placements. No air op, no
 * delete: a voxel is gone because it is not placed. Because `expandArtifact` is full-replace +
 * order-independent, the kept cells re-expand byte-identically (same block + state per pos) — the exterior
 * is provably untouched. Only existing block ids are copied, so the manifest stays valid. PURE.
 * @param {object} artifact a schema-valid artifact
 * @param {Set<string>|Iterable<string>} remove keys to omit
 * @returns {object} cloned artifact with placements replaced by the kept explicit voxels
 */
export function carveArtifact(artifact, remove) {
  const removeSet = remove instanceof Set ? remove : new Set(remove);
  const kept = expandArtifact(artifact).filter((v) => !removeSet.has(voxelKey(v.pos)));
  return { ...artifact, placements: kept.map(toVoxelPlacement) };
}

/**
 * Occupancy of the carved build (occ minus `remove`) — for measurement without a re-expand. Uses
 * `occupancyFromCells` (last-write-wins) over the kept cells. PURE.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {Set<string>|Iterable<string>} remove
 * @returns {import("./occupancy.mjs").Occupancy}
 */
export function carveOccupancy(occ, remove) {
  const removeSet = remove instanceof Set ? remove : new Set(remove);
  const cells = [];
  for (const [k, b] of occ.cells) if (!removeSet.has(k)) cells.push({ pos: k.split(",").map(Number), block: b });
  return occupancyFromCells(cells);
}

/**
 * Block-count record (AC #4): voxels before, removed (the cavity size), and after. PURE.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {Set<string>|Iterable<string>} remove
 * @returns {{before:number, removed:number, after:number}}
 */
export function cavityReport(occ, remove) {
  const removeSet = remove instanceof Set ? remove : new Set(remove);
  let removed = 0;
  for (const k of removeSet) if (occ.cells.has(k)) removed++;
  return { before: occ.size, removed, after: occ.size - removed };
}

/**
 * Stable digest of the EXTERIOR — the front-most surface voxel of every cell over the 6 ortho views,
 * as sorted `"dir|x,y,z=block"` lines. The exterior render is a deterministic function of these voxels, so
 * digest equality before/after a carve PROVES the render is unchanged (AC #3/#4 exterior-held proof). PURE.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @returns {string}
 */
export function exteriorSurfaceDigest(occ) {
  const lines = [];
  if (!occ.bounds) return "";
  for (const d of ORTHO_DIRS) {
    const grid = projectSurface(occ, d.name);
    for (const row of grid.cells) {
      for (const c of row) {
        if (c) lines.push(`${d.name}|${c.voxel[0]},${c.voxel[1]},${c.voxel[2]}=${c.block}`);
      }
    }
  }
  lines.sort();
  return lines.join("\n");
}

/**
 * The exterior-held verdict: the 6-ortho surface digest is identical before and after the carve, so the
 * exterior render — and any resemblance verdict computed from it — does not change (AC #3). PURE.
 * @param {import("./occupancy.mjs").Occupancy} beforeOcc
 * @param {import("./occupancy.mjs").Occupancy} afterOcc
 * @returns {{held:boolean, digestBefore:string, digestAfter:string}}
 */
export function exteriorHeld(beforeOcc, afterOcc) {
  const digestBefore = exteriorSurfaceDigest(beforeOcc);
  const digestAfter = exteriorSurfaceDigest(afterOcc);
  return { held: digestBefore === digestAfter, digestBefore, digestAfter };
}
