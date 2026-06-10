// Shell regularization + the cage (T-102-01, story S-102, epic E-27). The voxelized TRELLIS mesh
// arrives RAGGED — attached spikes/fins (the fake "rafters" in every render) and cliffed columns —
// and nothing downstream fixes it: the T-091 component strip removes only DISCONNECTED debris,
// void repair fills holes (not bumps), and the full-shell zone-fill then paints the noise
// convincingly. Governing lesson (E-15): free-form voxel edits regress without a 3-D target, so
// every smoothing step here is CAGED against the GLB — accepted only if (a) per-azimuth silhouette
// IoU vs the GLB stays within a declared tolerance at all four gate azimuths, (b) six-direction
// closure still passes, (c) protected sub-regions are untouched. A failing step rolls back and is
// RECORDED — never silently kept (the revise-loop trace precedent).
//
//   • protrusionCensus / raggedColumnRate — the pure metrics. Definitions are pinned by exact
//     reproduction of the ticket baselines (cottage 276 spikes ≥4/6 exposed faces; 23.9% columns
//     with a ≥3 height cliff vs a 4-neighbor): plain-emptiness face test, heightmap-top cliffs.
//   • openShell — morphological open (erode→dilate, 26-CUBE element, ground-solid erosion) with a
//     SELECTIVE RESTORE: removed-set components of size ≥ minKeep are legitimate thin features
//     (a chimney, a spire) and are put back; crumbs below it are the voxelization noise. The
//     restore is the "protected: thin features" of the AC, computed rather than enumerated — and
//     declared (restored component sizes in the report, the S-091 rule).
//     WHY THE CUBE, NOT THE 6-CROSS: opening = the union of all structuring-ball translates that
//     fit inside the mass. An L1 ball (the cross) FITS with a 1-cell roof spike at its north pole
//     (center on the surface cell beneath it — all six neighbors solid), so cross-opening provably
//     keeps every 1-cell bump at ANY radius. The L∞ ball (3×3×3 cube) cannot fit a spike or a
//     1-thick fin, so cube-opening shaves exactly the witnessed noise — and it FITS into right-angle
//     box edges/corners, so Minecraft-native massing survives untouched (the cross shaved corners).
//   • closeShell — morphological close (dilate→erode): fills pits/notches ≤ 2·radius wide; added
//     cells take the majority block of their solid 6-neighbors (lexicographic tie-break,
//     build-dominant fallback) — deterministic by construction.
//   • exposedFaceMesh / voxelSilhouettes / silhouetteIoUs — the cage's measuring stick, GL-free
//     (reproducibility excludes GL from decisions): the occupancy's exposed faces become a
//     tri-soup fed to the SAME rasterizeSilhouette + camera the GLB reference goes through, then
//     normalize-then-IoU (the formScores precedent) cancels mesh-vs-voxel framing.
//   • regularizeShell — the caged step sequence (default: open, close). IoU floors are anchored
//     to the INPUT shell (not the previous step), so cumulative drift is bounded by the tolerance.
//
// Policy is data: radii/thresholds are op parameters (like fillVoids' minDepth); protect regions
// and closure regions come from the caller; gate azimuths come from MULTI_ANGLE_GATE — nothing
// subject-specific lives here (E-25 Rule 3 / this ticket's AC).
//
// PURE — no GL, no I/O, no model, no Date/random — runs under the `src/**/*.test.mjs` glob. GLB
// loading, renders, and the durable record live in the runners (benchmarks/sculpture/
// regularize-shell.mjs and the challenge/styled chain's shell stage).

import { componentLabels } from "../form/voxel-components.mjs";
import { rasterizeSilhouette } from "../form/glb-silhouette.mjs";
import { normalizeSilhouette, iou } from "../form/form-fidelity.mjs";
import { MULTI_ANGLE_GATE } from "../config.mjs";
import { occupancyFromCells, bareBlock } from "./occupancy.mjs";
import { closureCheck, plugClosure } from "./shell-integrity.mjs";
import { resolveAngle } from "./multi-angle.mjs";

export const REGULARIZE_SCHEMA = "shell-regularize/v1";

/** Op-parameter defaults — declared by callers in their durable records, never subject-tuned. */
export const REGULARIZE_DEFAULTS = Object.freeze({
  radius: 1,        // structuring iterations for both open and close (6-cross element)
  minKeep: 9,       // open's restore floor: a removed component this big is a feature, not noise
  iouTolerance: 0.02, // per-azimuth silhouette IoU may drop at most this far below the input shell's
  grid: 128,        // normalizeSilhouette grid (the formScores precedent)
  spikeFaces: 4,    // protrusion census threshold: ≥ this many of 6 faces exposed
  cliff: 3,         // ragged-column threshold: ≥ this height step vs a 4-neighbor column
});

const NEIGH6 = Object.freeze([[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]);

// --- pure metrics (definitions pinned by the ticket baselines) -----------------------------------

/**
 * PROTRUSION CENSUS: per-cell exposed-face count over the full occupancy, plain emptiness test
 * (no ground rule — the definition that reproduces the cottage 276 exactly). `spikes` = cells with
 * ≥ spikeFaces of 6 faces exposed: an attached spike (5–6), fin edge (4), or freestanding crumb.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @returns {{byExposure:number[], spikes:number}} byExposure[k] = cells with exactly k empty faces
 */
export function protrusionCensus(occ, { spikeFaces = REGULARIZE_DEFAULTS.spikeFaces } = {}) {
  const byExposure = [0, 0, 0, 0, 0, 0, 0];
  let spikes = 0;
  for (const key of occ.cells.keys()) {
    const [x, y, z] = key.split(",").map(Number);
    let e = 0;
    for (const [dx, dy, dz] of NEIGH6) if (!occ.cells.has(`${x + dx},${y + dy},${z + dz}`)) e++;
    byExposure[e]++;
    if (e >= spikeFaces) spikes++;
  }
  return { byExposure, spikes };
}

/**
 * RAGGED-COLUMN RATE: heightmap = max y per occupied (x,z) column; a column is RAGGED when its top
 * differs by ≥ `cliff` from any PRESENT 4-neighbor column (absent neighbors — the footprint edge —
 * never count: a wall meeting ground is form, not noise). Reproduces the cottage 23.9% exactly.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @returns {{ragged:number, total:number, rate:number}}
 */
export function raggedColumnRate(occ, { cliff = REGULARIZE_DEFAULTS.cliff } = {}) {
  const top = new Map();
  for (const key of occ.cells.keys()) {
    const [x, y, z] = key.split(",").map(Number);
    const k = `${x},${z}`;
    if (!top.has(k) || top.get(k) < y) top.set(k, y);
  }
  let ragged = 0;
  for (const [k, y] of top) {
    const [x, z] = k.split(",").map(Number);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = top.get(`${x + dx},${z + dz}`);
      if (n !== undefined && Math.abs(y - n) >= cliff) { ragged++; break; }
    }
  }
  return { ragged, total: top.size, rate: top.size ? ragged / top.size : 0 };
}

/**
 * The DECLARED chimney sub-region, derived from GEOMETRY (no subject constants) — lifted verbatim
 * from spray-paint.mjs (T-090-01), now shared: a protruding stack = the columns rising ABOVE the
 * highest roof PLANE. ridgeY = the highest column-top shared by an 8-connected plateau of
 * ≥ minPlateau equal-top columns (a roof plane / gable top is at least a small plane; a chimney or
 * finial footprint is smaller). Region = cells above ridgeY in columns whose top exceeds it. A
 * build with no protrusion gets an empty region. PURE.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @returns {{contains:(pos:number[])=>boolean, columns:Set<string>, ridgeY:number|null}}
 */
export function protrudingStackRegion(occ, { minPlateau = 4 } = {}) {
  const topY = new Map(); // "x,z" → max y
  for (const key of occ.cells.keys()) {
    const [x, y, z] = key.split(",").map(Number);
    const k = `${x},${z}`;
    if (!(topY.has(k)) || topY.get(k) < y) topY.set(k, y);
  }
  // largest-y plateau: 8-connected components of equal-top columns, sized >= minPlateau
  let ridgeY = -Infinity;
  const seen = new Set();
  for (const [start, y0] of topY) {
    if (seen.has(start) || y0 <= ridgeY) continue;
    const comp = [start];
    seen.add(start);
    const stack = [start];
    while (stack.length) {
      const [x, z] = stack.pop().split(",").map(Number);
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
        if (!dx && !dz) continue;
        const nk = `${x + dx},${z + dz}`;
        if (seen.has(nk) || topY.get(nk) !== y0) continue;
        seen.add(nk); stack.push(nk); comp.push(nk);
      }
    }
    if (comp.length >= minPlateau && y0 > ridgeY) ridgeY = y0;
  }
  if (!Number.isFinite(ridgeY)) return { contains: () => false, columns: new Set(), ridgeY: null };
  const columns = new Set([...topY].filter(([, y]) => y > ridgeY).map(([k]) => k));
  return { contains: ([x, y, z]) => y > ridgeY && columns.has(`${x},${z}`), columns, ridgeY };
}

// --- morphology (key-set level; 26-cube element; ground-solid) -----------------------------------

/** The 26-neighborhood (L∞ ball of radius 1) — the structuring element (see header for why). */
const NEIGH26 = (() => {
  const out = [];
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
    if (dx || dy || dz) out.push([dx, dy, dz]);
  }
  return Object.freeze(out);
})();

const keyPos = (k) => k.split(",").map(Number);
const inProtect = (pos, protect) => protect.some((r) => r.contains(pos));

/** One erosion pass: a cell survives iff all 26 neighbors are solid (y < groundY counts as terrain
 *  and is solid — a building must not be peeled from beneath) or the cell is protected. */
function erodeOnce(set, groundY, protect) {
  const out = new Set();
  for (const k of set) {
    const [x, y, z] = keyPos(k);
    if (protect.length && inProtect([x, y, z], protect)) { out.add(k); continue; }
    let keep = true;
    for (const [dx, dy, dz] of NEIGH26) {
      const ny = y + dy;
      if (ny < groundY) continue; // terrain is solid
      if (!set.has(`${x + dx},${ny},${z + dz}`)) { keep = false; break; }
    }
    if (keep) out.add(k);
  }
  return out;
}

/** One dilation pass: every empty 26-neighbor of a solid cell becomes solid — never below groundY
 *  (terrain), never inside a protect region (protect = no add AND no remove). */
function dilateOnce(set, groundY, protect) {
  const out = new Set(set);
  for (const k of set) {
    const [x, y, z] = keyPos(k);
    for (const [dx, dy, dz] of NEIGH26) {
      const ny = y + dy;
      if (ny < groundY) continue;
      const nk = `${x + dx},${ny},${z + dz}`;
      if (out.has(nk)) continue;
      if (protect.length && inProtect([x + dx, ny, z + dz], protect)) continue;
      out.add(nk);
    }
  }
  return out;
}

/** componentLabels adapter for a key-set (the componentStrip int32Shape precedent, on a Set). */
function int32OfKeys(keys) {
  const flat = new Int32Array(keys.length * 3);
  let n = 0;
  for (const k of keys) {
    const [x, y, z] = keyPos(k);
    flat[n] = x; flat[n + 1] = y; flat[n + 2] = z;
    n += 3;
  }
  return { occupied: flat, count: keys.length };
}

/** Rebuild an Occupancy from a kept-key set + add list, carrying blocks/forms/states of survivors
 *  from `occ` and assigning `blockOf(pos)` to additions. Fixture cells (non-solid) pass through
 *  untouched — morphology operates on shell MASS only. */
function rebuildOccupancy(occ, keptSolid, added, blockOf) {
  const cells = [];
  for (const [key, block] of occ.cells) {
    const form = occ.forms?.get(key);
    if (form !== undefined || keptSolid.has(key)) {
      cells.push({ pos: keyPos(key), block, form, state: occ.states?.get(key) });
    }
  }
  for (const key of added) cells.push({ pos: keyPos(key), block: blockOf(keyPos(key)) });
  return occupancyFromCells(cells);
}

/** Most common block over the cells map — close's total fallback (mirrors plugClosure's). */
function dominantBlock(cells) {
  const counts = new Map();
  for (const b of cells.values()) counts.set(b, (counts.get(b) || 0) + 1);
  let dom = null, best = -1;
  for (const [b, c] of [...counts].sort(([a], [b2]) => (a < b2 ? -1 : 1))) {
    if (c > best) { best = c; dom = b; }
  }
  return dom;
}

/** Majority block among solid 6-neighbors (as written, namespaced like its siblings); ties break
 *  lexicographically on the BARE id; no solid neighbor → the build dominant. Deterministic. */
function majorityNeighborBlock(pos, occ, fallback) {
  const counts = new Map();
  const [x, y, z] = pos;
  for (const [dx, dy, dz] of NEIGH6) {
    const k = `${x + dx},${y + dy},${z + dz}`;
    if (occ.forms?.has(k)) continue; // fixtures are not mass
    const b = occ.cells.get(k);
    if (b !== undefined) counts.set(b, (counts.get(b) || 0) + 1);
  }
  let dom = null, best = -1;
  for (const [b, c] of [...counts].sort(([a], [b2]) => (bareBlock(a) < bareBlock(b2) ? -1 : 1))) {
    if (c > best) { best = c; dom = b; }
  }
  return dom ?? fallback;
}

/** The solid-cell key set (fixtures excluded — they are dressing, not shell mass). */
function solidKeys(occ) {
  const s = new Set();
  for (const key of occ.cells.keys()) if (!occ.forms?.has(key)) s.add(key);
  return s;
}

/**
 * MORPHOLOGICAL OPEN with selective restore: erode→dilate (radius iterations each, 26-cube,
 * ground-solid), clamped to the original mass (opening ⊆ input); then label the removed set's
 * 26-connected components and RESTORE every component of size ≥ minKeep — a coherent removed mass
 * is a thin FEATURE (chimney, spire), not noise; crumbs below the floor are the voxelization
 * spikes/fins this op exists to shave. Protected cells are never removed. Every decision is
 * declared: removed and restored component sizes in the report. PURE.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {{radius?:number, minKeep?:number, protect?:{name:string,contains:Function}[]}} [opts]
 * @returns {{occ:import("./occupancy.mjs").Occupancy, removedCells:number,
 *            removed:{size:number,minY:number}[], restored:{size:number,minY:number}[]}}
 */
export function openShell(occ, {
  radius = REGULARIZE_DEFAULTS.radius, minKeep = REGULARIZE_DEFAULTS.minKeep, protect = [],
} = {}) {
  if (!occ.size) return { occ, removedCells: 0, removed: [], restored: [] };
  const groundY = occ.bounds.min[1];
  const solid = solidKeys(occ);
  let cur = solid;
  for (let i = 0; i < radius; i++) cur = erodeOnce(cur, groundY, protect);
  for (let i = 0; i < radius; i++) cur = dilateOnce(cur, groundY, []);
  const opened = new Set([...cur].filter((k) => solid.has(k))); // opening ⊆ input
  const removedKeys = [...solid].filter((k) => !opened.has(k));
  if (!removedKeys.length) return { occ, removedCells: 0, removed: [], restored: [] };

  const { labels, sizes } = componentLabels(int32OfKeys(removedKeys), { connectivity: 26 });
  const minY = new Array(sizes.length).fill(Infinity);
  removedKeys.forEach((k, i) => { const y = keyPos(k)[1]; if (y < minY[labels[i]]) minY[labels[i]] = y; });
  const restoreLabel = sizes.map((s) => s >= minKeep);
  const removed = [], restored = [];
  for (let l = 0; l < sizes.length; l++) {
    (restoreLabel[l] ? restored : removed).push({ size: sizes[l], minY: minY[l] });
  }
  const bySize = (a, b) => b.size - a.size || a.minY - b.minY;
  removed.sort(bySize); restored.sort(bySize);

  const kept = new Set(opened);
  removedKeys.forEach((k, i) => { if (restoreLabel[labels[i]]) kept.add(k); });
  const removedCells = solid.size - kept.size;
  if (!removedCells) return { occ, removedCells: 0, removed: [], restored };
  return { occ: rebuildOccupancy(occ, kept, [], null), removedCells, removed, restored };
}

/**
 * MORPHOLOGICAL CLOSE: dilate→erode (radius iterations each, 26-cube, ground-solid) — fills pits,
 * notches and slots ≤ 2·radius wide; the result is a superset of the input (closing ⊇ input).
 * Added cells take the majority block of their solid 6-neighbors in the INPUT occupancy
 * (lexicographic tie-break on the bare id; build-dominant fallback). Protected regions receive no
 * additions (a declared window slit must not be sealed by smoothing). ADD-only — geometry of
 * existing voxels untouched. PURE.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {{radius?:number, protect?:{name:string,contains:Function}[]}} [opts]
 * @returns {{occ:import("./occupancy.mjs").Occupancy, addedCells:number,
 *            added:{pos:number[],block:string}[]}}
 */
export function closeShell(occ, {
  radius = REGULARIZE_DEFAULTS.radius, protect = [],
} = {}) {
  if (!occ.size) return { occ, addedCells: 0, added: [] };
  const groundY = occ.bounds.min[1];
  const solid = solidKeys(occ);
  let cur = solid;
  for (let i = 0; i < radius; i++) cur = dilateOnce(cur, groundY, protect);
  for (let i = 0; i < radius; i++) cur = erodeOnce(cur, groundY, []);
  const addedKeys = [...cur].filter((k) =>
    !solid.has(k) && !occ.cells.has(k) && !(protect.length && inProtect(keyPos(k), protect)));
  if (!addedKeys.length) return { occ, addedCells: 0, added: [] };
  addedKeys.sort();
  const fallback = dominantBlock(occ.cells);
  const added = addedKeys.map((k) => {
    const pos = keyPos(k);
    return { pos, block: majorityNeighborBlock(pos, occ, fallback) };
  });
  const blockByKey = new Map(addedKeys.map((k, i) => [k, added[i].block]));
  const out = rebuildOccupancy(occ, new Set(solid), addedKeys, (pos) => blockByKey.get(pos.join(",")));
  return { occ: out, addedCells: added.length, added };
}

// --- the GL-free silhouette path (the cage's measuring stick) ------------------------------------

/**
 * Tri-soup of the occupancy's EXPOSED faces (2 triangles / 4 vertices per face, unit cubes, float
 * bounds [min, max+1]) — the adapter that lets the SAME rasterizeSilhouette + camera that measures
 * the GLB measure the voxel build. Solid cells only (fixtures are dressing, not silhouette mass).
 * PURE.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @returns {{positions:Float64Array, indices:Uint32Array, bounds:{min:number[],max:number[]}, triCount:number}}
 */
export function exposedFaceMesh(occ) {
  if (!occ.size) throw new Error("exposedFaceMesh: empty occupancy has no silhouette");
  const solid = solidKeys(occ);
  const positions = [];
  const indices = [];
  // face corner tables: for each NEIGH6 direction, the 4 cube corners (offsets) of the face it exposes
  const FACES = [
    [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]], // +x
    [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], // -x
    [[0, 1, 0], [0, 1, 1], [1, 1, 1], [1, 1, 0]], // +y
    [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], // -y
    [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], // +z
    [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]], // -z
  ];
  for (const k of solid) {
    const [x, y, z] = keyPos(k);
    for (let f = 0; f < 6; f++) {
      const [dx, dy, dz] = NEIGH6[f];
      if (solid.has(`${x + dx},${y + dy},${z + dz}`)) continue;
      const base = positions.length / 3;
      for (const [cx, cy, cz] of FACES[f]) positions.push(x + cx, y + cy, z + cz);
      indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }
  const { min, max } = occ.bounds;
  return {
    positions: Float64Array.from(positions),
    indices: Uint32Array.from(indices),
    bounds: { min: min.slice(), max: max.map((v) => v + 1) },
    triCount: indices.length / 3,
  };
}

/**
 * Rasterize the occupancy's silhouette at named gate azimuths — exposedFaceMesh through the same
 * rasterizeSilhouette/resolveAngle the multi-angle gate uses for the GLB (no GL, no fork). PURE.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {string[]} azimuths e.g. MULTI_ANGLE_GATE.azimuths
 * @returns {Record<string, {w:number,h:number,data:Uint8Array,bbox:object|null}>}
 */
export function voxelSilhouettes(occ, azimuths) {
  const mesh = exposedFaceMesh(occ);
  const out = {};
  for (const a of azimuths) out[a] = rasterizeSilhouette(mesh, { view: resolveAngle(a) });
  return out;
}

/**
 * Per-azimuth IoU of the occupancy's silhouette vs reference silhouettes (e.g. the GLB's), both
 * sides normalized to a common grid first (bbox-crop + aspect-fit — the formScores precedent that
 * cancels mesh-coords vs voxel-coords framing). PURE.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {Record<string, {w,h,data,bbox}>} refSils azimuth → rasterizeSilhouette result
 * @returns {Record<string, number>}
 */
export function silhouetteIoUs(occ, refSils, { grid = REGULARIZE_DEFAULTS.grid } = {}) {
  const azimuths = Object.keys(refSils);
  const sils = voxelSilhouettes(occ, azimuths);
  const out = {};
  for (const a of azimuths) {
    out[a] = iou(
      normalizeSilhouette(sils[a], { grid, fit: "aspect" }),
      normalizeSilhouette(refSils[a], { grid, fit: "aspect" }),
    );
  }
  return out;
}

// --- the cage -------------------------------------------------------------------------------------

/** Cells differing inside any protect region between two occupancies (presence OR block). */
function protectViolations(before, after, protect) {
  if (!protect.length) return 0;
  let n = 0;
  const keys = new Set([...before.cells.keys(), ...after.cells.keys()]);
  for (const k of keys) {
    const pos = keyPos(k);
    if (!inProtect(pos, protect)) continue;
    if (before.cells.get(k) !== after.cells.get(k)) n++;
  }
  return n;
}

const round4 = (x) => Math.round(x * 1e4) / 1e4;

/**
 * THE REGULARIZATION CAGE: run a declared sequence of candidate morphology steps (default:
 * open-with-restore, then close), accepting each only if
 *   (a) at EVERY gate azimuth, candidate-vs-GLB silhouette IoU ≥ the INPUT shell's IoU at that
 *       azimuth − iouTolerance (anchored to the input, so cumulative drift is bounded — the E-15
 *       "no 3-D target → regression" lesson as an invariant);
 *   (b) six-direction closure (T-091, with the caller's declared-opening regions) does NOT
 *       REGRESS: candidate exterior-reachable interior cells ≤ the input shell's. (No-regress,
 *       not "closed": opening regions re-derived on a repaired shell can differ from the ones its
 *       own chain run plugged against — the witnessed church shell reads 213 reachable with its
 *       re-derived openings — and a cage must be runnable on the shells that exist.) When the
 *       input IS closed and a step creates new contained air (a close can roof a recess), ONE
 *       plug remediation is attempted — plugClosure with the build dominant — and the plugged
 *       candidate is re-judged by ALL three checks; the plug count is recorded.
 *       Known limit of the open-input fallback: a step that POKES a hole reclassifies the cells
 *       beneath it as non-interior, so the reached COUNT can stay flat — only the closed-input
 *       strict mode (the chain path, where regularize runs right after plugClosure) catches every
 *       new hole; on an open input the silhouette floors are the backstop. Named, not hidden.
 *   (c) protected sub-regions (declared predicates: chimney, openings, …) are untouched —
 *       verified independently of the ops honoring them (defense in depth).
 * A failing step ROLLS BACK automatically (the previous occupancy stands) and its StepRecord
 * carries `accepted:false` + the reasons — never silently kept. Throws only on malformed input
 * (refSils missing a gate azimuth, unknown step op): a rejected step is an outcome, not an error.
 * @param {import("./occupancy.mjs").Occupancy} occ the closed, shell-integrity-repaired build
 * @param {{refSils:Record<string,object>, regions?:object[], protect?:object[], radius?:number,
 *          minKeep?:number, iouTolerance?:number, grid?:number,
 *          steps?:{op:string, radius?:number, minKeep?:number, fn?:Function}[]}} opts
 *   `regions` = closureCheck allow-list (world AABBs); `protect` = {name, contains(pos)} list;
 *   `steps[].fn` is an injectable seam for tests (occ, params) → {occ, ...report}.
 * @returns {{occ:import("./occupancy.mjs").Occupancy, trace:object[], accepted:number,
 *            rejected:number, census:{before:object, after:object},
 *            iou:{baseline:Record<string,number>, final:Record<string,number>}}}
 */
export function regularizeShell(occ, {
  refSils,
  regions = [],
  protect = [],
  radius = REGULARIZE_DEFAULTS.radius,
  minKeep = REGULARIZE_DEFAULTS.minKeep,
  iouTolerance = REGULARIZE_DEFAULTS.iouTolerance,
  grid = REGULARIZE_DEFAULTS.grid,
  steps,
} = {}) {
  if (!refSils || typeof refSils !== "object") {
    throw new Error("regularizeShell: opts.refSils (azimuth → GLB silhouette mask) is required — every step is caged against the GLB");
  }
  for (const a of MULTI_ANGLE_GATE.azimuths) {
    if (!refSils[a]) throw new Error(`regularizeShell: refSils missing gate azimuth "${a}" — the cage gates ALL four`);
  }
  const plan = steps ?? [
    { op: "open", radius, minKeep },
    { op: "close", radius },
  ];
  const censusOf = (o) => {
    const p = protrusionCensus(o);
    const r = raggedColumnRate(o);
    return { cells: o.size, spikes: p.spikes, byExposure: p.byExposure,
      ragged: r.ragged, columns: r.total, raggedRate: round4(r.rate) };
  };
  const before = censusOf(occ);
  const baseline = silhouetteIoUs(occ, refSils, { grid });
  const floors = Object.fromEntries(
    Object.entries(baseline).map(([a, v]) => [a, v - iouTolerance]));
  const inputClosure = closureCheck(occ, { regions });

  // judge a candidate against all three checks; returns the reasons + per-check evidence
  const judge = (prev, candidate) => {
    const reasons = [];
    const candIoU = silhouetteIoUs(candidate, refSils, { grid });
    const iouByAzimuth = {};
    for (const a of Object.keys(refSils)) {
      iouByAzimuth[a] = { baseline: round4(baseline[a]), candidate: round4(candIoU[a]), floor: round4(floors[a]) };
      if (candIoU[a] < floors[a]) reasons.push(`iou:${a} ${round4(candIoU[a])} < ${round4(floors[a])}`);
    }
    const closure = closureCheck(candidate, { regions });
    if (closure.reached > inputClosure.reached) {
      reasons.push(`closure: ${closure.reached} interior cells exterior-reachable (input had ${inputClosure.reached})`);
    }
    const violations = protectViolations(prev, candidate, protect);
    if (violations) reasons.push(`protect: ${violations} cells changed inside protected regions`);
    return { reasons, iouByAzimuth, closure, violations };
  };

  let current = occ;
  const trace = [];
  let accepted = 0, rejected = 0;
  for (const step of plan) {
    const params = { radius: step.radius ?? radius, ...(step.op === "open" ? { minKeep: step.minKeep ?? minKeep } : {}) };
    let result;
    if (typeof step.fn === "function") result = step.fn(current, { ...params, protect });
    else if (step.op === "open") result = openShell(current, { ...params, protect });
    else if (step.op === "close") result = closeShell(current, { ...params, protect });
    else throw new Error(`regularizeShell: unknown step op "${step.op}"`);

    let candidate = result.occ;
    let verdict = judge(current, candidate);
    let plugged = 0;
    // ONE plug remediation: only when the input is closed and the step's sole closure failure is
    // NEW contained air (a close can roof a recess) — plug with the build dominant, re-judge all.
    if (inputClosure.closed && verdict.closure.reached > 0) {
      try {
        const plug = plugClosure(candidate, { zoneOf: () => "_", zones: {}, regions });
        plugged = plug.placements.length;
        candidate = plug.occ;
        verdict = judge(current, candidate);
      } catch {
        plugged = 0; // did not converge — the unplugged verdict stands
      }
    }

    const ok = verdict.reasons.length === 0;
    trace.push({
      step: step.op, params,
      accepted: ok, reasons: verdict.reasons,
      iouByAzimuth: verdict.iouByAzimuth,
      closure: { closed: verdict.closure.closed, reached: verdict.closure.reached, inputReached: inputClosure.reached },
      protect: { violations: verdict.violations },
      census: censusOf(candidate),
      cells: {
        ...(result.removedCells !== undefined ? { removed: result.removedCells } : {}),
        ...(result.restored !== undefined ? { restoredComponents: result.restored } : {}),
        ...(result.addedCells !== undefined ? { added: result.addedCells } : {}),
        ...(plugged ? { plugged } : {}),
      },
    });
    if (ok) { current = candidate; accepted++; } else rejected++;
  }

  return {
    occ: current,
    trace,
    accepted,
    rejected,
    census: { before, after: censusOf(current) },
    iou: { baseline: Object.fromEntries(Object.entries(baseline).map(([a, v]) => [a, round4(v)])),
      final: Object.fromEntries(Object.entries(silhouetteIoUs(current, refSils, { grid })).map(([a, v]) => [a, round4(v)])) },
  };
}
