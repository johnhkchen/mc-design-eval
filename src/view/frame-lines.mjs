// Frame-line read — the structural feature INSTANCES of a building's walls (T-098-01, story S-098,
// epic E-26).
//
// The E-21 map's placement vocabulary is 4 coarse zone-wide rules, which is exactly how stone and
// plaster both claimed `walls` and one ate the other. The concept's framing rhythm is STRUCTURAL —
// the frame follows floor lines, corner posts, and the wall crown under the roof (eave beams on the
// flat sides, gable rakes on the gable ends); panels fill the bounded fields BETWEEN the frame lines.
// This module derives those instances from GEOMETRY alone (no materials, no zones policy): the
// binding of kit entries to instances is src/form/placement-grammar.mjs's job.
//
// WALL is defined exactly like the fill's wall zones (zonesFromBands' complement): an occupied,
// side-exposed cell that is NOT roof — roof = `y >= upperTop || roofKeys` membership (structuralZones'
// rule). Using the SAME roof predicate as the fill means the grammar refines what the fill paints and
// never classifies a cell the fill calls roof (it cannot fight the pipeline, AC #2).
//
// PURE — no GL, no I/O, no Date/random. Operates on the SOLID view (fixtures are never frame cells).

import { solidOccupancy } from "./occupancy.mjs";
import { projectSurface } from "./surface-grid.mjs";
import { airComponents } from "./structural-read.mjs";

/** Frame-line kinds, in CLASSIFICATION PRECEDENCE order — a cell takes its first matching kind. */
export const FRAME_KINDS = Object.freeze(["cornerPost", "roofline", "floorLine"]);

const SIDE_DIRS = Object.freeze(["+x", "-x", "+z", "-z"]);
const SIDE_NEIGHBORS = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]];
const NEIGHBORS_6 = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];

/** The one roof predicate, shared with the fill's zone geometry (structuralZones / zonesFromBands). */
function isRoof(key, y, upperTop, roofKeys) {
  return y >= upperTop || roofKeys.has(key);
}

/**
 * Iterate the WALL cells of the solid view: occupied, side-exposed (any ±x/±z neighbour is air), and
 * not roof (`y >= upperTop || roofKeys`). Deterministic in occupancy insertion order.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {{upperTop:number, roofKeys:Set<string>}} geom
 * @yields {{key:string, voxel:number[], block:string}}
 */
export function* wallCells(occ, { upperTop, roofKeys }) {
  const solid = solidOccupancy(occ);
  for (const [key, block] of solid.cells) {
    const [x, y, z] = key.split(",").map(Number);
    if (isRoof(key, y, upperTop, roofKeys)) continue;
    for (const [dx, , dz] of SIDE_NEIGHBORS) {
      if (!solid.has(x + dx, y, z + dz)) {
        yield { key, voxel: [x, y, z], block };
        break;
      }
    }
  }
}

/**
 * Convex corner columns of the WALL footprint: the (x,z) columns holding at least one wall cell whose
 * outline exposure includes two perpendicular horizontal air directions. Computed on the wall-only
 * footprint (not the full occupancy footprint) so roof-overhang eave columns — which contain no wall
 * cells — never masquerade as building corners. A protruding chimney's columns DO qualify; the
 * grammar's preserve-respecting paint rule (placement-grammar) keeps declared features intact there.
 * @returns {Set<string>} "x,z" column keys
 */
export function cornerColumns(occ, { upperTop, roofKeys }) {
  const cols = new Set();
  for (const { voxel } of wallCells(occ, { upperTop, roofKeys })) {
    cols.add(`${voxel[0]},${voxel[2]}`);
  }
  const corners = new Set();
  for (const k of cols) {
    const [x, z] = k.split(",").map(Number);
    const e = cols.has(`${x + 1},${z}`), w = cols.has(`${x - 1},${z}`);
    const s = cols.has(`${x},${z + 1}`), n = cols.has(`${x},${z - 1}`);
    if ((!e && !s) || (!e && !n) || (!w && !s) || (!w && !n)) corners.add(k);
  }
  return corners;
}

/**
 * Classify the frame-line cells of the wall skin. Precedence cornerPost > roofline > floorLine
 * ({@link FRAME_KINDS}); a cell gets ONE kind.
 *   • cornerPost — wall cell in a convex corner column; spans the column's full wall height, so the
 *     framing rhythm shows on every storey by construction.
 *   • roofline — the wall CROWN: the topmost wall cell of its (x,z) column, where the crown actually
 *     meets the roof — `y >= upperTop - 1` (the eave rows) OR 6-adjacent to a roofKeys cell (the
 *     gable-rake cells under the slope, which sit below the eave line mid-rake). A low free-standing
 *     top (a porch, a garden wall) matches neither and is not a frame line.
 *   • floorLine — wall cell at an INTERIOR floor line: `floorLines` strictly above the ground layer
 *     and strictly below `upperTop` (the storey boundaries; the ground slab is the plinth's business
 *     and the eave line is the roofline's).
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {{floorLines:number[], upperTop:number, roofKeys:Set<string>}} geom
 * @returns {{cells:Map<string,string>, byKind:Record<string,string[]>,
 *            counts:{wall:number, cornerPost:number, roofline:number, floorLine:number}}}
 */
export function frameLines(occ, { floorLines = [], upperTop, roofKeys }) {
  const solid = solidOccupancy(occ);
  const byKind = { cornerPost: [], roofline: [], floorLine: [] };
  const cells = new Map();
  const counts = { wall: 0, cornerPost: 0, roofline: 0, floorLine: 0 };
  if (!solid.bounds) return { cells, byKind, counts };

  const corners = cornerColumns(solid, { upperTop, roofKeys });
  const groundY = solid.bounds.min[1];
  const interiorFloors = new Set(floorLines.filter((y) => y > groundY && y < upperTop));

  // one pass for the wall cells + the per-column topmost WALL y (the crown candidates)
  const walls = [];
  const colTop = new Map(); // "x,z" → max wall y
  for (const entry of wallCells(solid, { upperTop, roofKeys })) {
    walls.push(entry);
    counts.wall++;
    const [x, y, z] = entry.voxel;
    const ck = `${x},${z}`;
    if (y > (colTop.get(ck) ?? -Infinity)) colTop.set(ck, y);
  }

  const adjacentToRoof = (x, y, z) => {
    for (const [dx, dy, dz] of NEIGHBORS_6) {
      if (roofKeys.has(`${x + dx},${y + dy},${z + dz}`)) return true;
    }
    return false;
  };

  for (const { key, voxel } of walls) {
    const [x, y, z] = voxel;
    let kind = null;
    if (corners.has(`${x},${z}`)) {
      kind = "cornerPost";
    } else if (y === colTop.get(`${x},${z}`) && (y >= upperTop - 1 || adjacentToRoof(x, y, z))) {
      kind = "roofline";
    } else if (interiorFloors.has(y)) {
      kind = "floorLine";
    }
    if (kind) {
      cells.set(key, kind);
      byKind[kind].push(key);
      counts[kind]++;
    }
  }
  return { cells, byKind, counts };
}

/**
 * The bounded FIELDS between the frame lines, per orthographic side elevation: project the solid view,
 * mask out air + frame cells + roof cells, and take the 4-connected components of what remains (via
 * structural-read's `airComponents` — the one component definition). Instances are IDENTITY + stats
 * (per-face rhythm evidence); the grammar's field placements come from the world-cell predicate
 * (wall minus frame), because projection under-covers oblique shells (T-090).
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {{cells:Map<string,string>}} frame  frameLines() result
 * @param {{upperTop:number, roofKeys:Set<string>, dirs?:string[]}} geom
 * @returns {{dir:string, instances:{bbox:object, cells:number, voxels:number[][]}[]}[]}
 */
export function fieldInstances(occ, frame, { upperTop, roofKeys, dirs = SIDE_DIRS }) {
  const solid = solidOccupancy(occ);
  const out = [];
  for (const dir of dirs) {
    if (!solid.bounds) { out.push({ dir, instances: [] }); continue; }
    const grid = projectSurface(solid, dir);
    const w = grid.n, h = grid.m;
    const data = new Uint8Array(w * h);
    for (let v = 0; v < h; v++) {
      for (let u = 0; u < w; u++) {
        const c = grid.cells[v][u];
        if (!c) { data[v * w + u] = 1; continue; } // air bounds a field
        const key = c.voxel.join(",");
        const y = c.voxel[1];
        if (frame.cells.has(key) || isRoof(key, y, upperTop, roofKeys)) data[v * w + u] = 1;
      }
    }
    const instances = airComponents({ w, h, data }).map((comp) => ({
      bbox: comp.bbox,
      cells: comp.cellsUV.length,
      voxels: comp.cellsUV.map(([u, v]) => [...grid.cells[v][u].voxel]),
    }));
    out.push({ dir, instances });
  }
  return out;
}
