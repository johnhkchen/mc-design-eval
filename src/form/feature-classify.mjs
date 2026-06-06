// GEOMETRIC FEATURE CLASSIFY + FEATURE-AWARE ASSIGN (E-21 / S-072 / T-072-01) — the "place style" step.
//
// WHY THIS EXISTS: mean-color CIE-Lab matching COLLAPSES near-tone-distinct materials (stone_bricks vs
// cobblestone — a deliberate concept distinction merged into one grey). T-071-01 named the materials by
// intent + region (the material map). This module puts them WHERE the artist meant: it classifies every
// voxel by a pure GEOMETRIC FEATURE (flat-face / edge-corner / top-roof / base / opening-recess) and
// places the map's block for that feature's region — so cobble lands on corners and brick on walls, a
// distinction mean color can NEVER make (their colours are ~identical; their geometry is not).
//
// "Most architectural material zoning follows form, so a pure geometric classifier suffices" (the ticket).
// The colorimetric matcher (E-14 nearestLab) is KEPT, demoted to two jobs: within-material value, and the
// fallback when the map is SILENT for a cell's feature (e.g. a base band the map never named).
//
// PURITY (the project idiom — runs under `node --test "src/**/*.test.mjs"`): no GL, no GLB, no I/O, no
// texture decode, no Date/random. Geometry is read from {dims, occupied, count}; the per-cell COLOURS for
// the fallback are INJECTED (sampled in the runner, never here). Deterministic: a fixed feature priority
// breaks every tie, so the same occupancy always yields the same map.
//
// REUSE, NOT REIMPLEMENTATION: face-adjacency mirrors voxel-components (DIRS6); the map contract +
// paletteFromMap are material-map.mjs; the ΔE engine is E-14 (nearestLab/srgbToLab); block→Lab is the E-10
// table (block-table.mjs); the namespace boundary is material.mjs (tableKey/blockId). No new colour/coord
// math. The artifact build stays in keysToArtifact — this module only produces the per-cell block KEYS.

import { occupiedCells } from "./glb-voxelize.mjs";
import { paletteFromMap } from "./material-map.mjs";
import { nearestLab, srgbToLab } from "../color/cielab.mjs";
import { loadBlockTable } from "../color/block-table.mjs";
import { tableKey } from "../sculptor/material.mjs";

/** The CLOSED geometric-feature vocabulary the AC names. The classifier maps every cell to exactly one. */
export const FEATURES = Object.freeze([
  "flat-face",
  "edge-corner",
  "top-roof",
  "base",
  "opening-recess",
]);

/** Feature → the T-071 material-map placementRule whose block fills that feature's region. The single
 *  place feature↔region is wired. `trim` has NO geometric feature (a 1-block voussoir ring is below the
 *  resolution of form-based zoning) — a known, documented gap; trim blocks are not placed geometrically. */
export const FEATURE_RULE = Object.freeze({
  "flat-face": "walls",
  "edge-corner": "corners-edges",
  "top-roof": "roof",
  base: "base",
  "opening-recess": "openings",
});

/** Tunables (design.md Decision 2). baseBand: lowest-j layers → base. upperFrac: roof lives in the top
 *  (1−upperFrac) of the height. recessFlank: an exterior empty cell flanked by ≥ this many occupied
 *  in-plane walls marks an inset/opening. Defaults tuned for a prism + a gable; runner-overridable. */
export const CLASSIFY_DEFAULTS = Object.freeze({ baseBand: 1, upperFrac: 0.6, recessFlank: 2 });

/** The 6 face-adjacent offsets (mirrors voxel-components — kept local to avoid importing internals). */
const DIRS6 = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];
/** Horizontal face offsets (±x, ±z) — the "how many sides are open" axes for corner/face/recess. */
const HORIZ = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 0, 1],
  [0, 0, -1],
];

const ckey = (i, j, k) => `${i},${j},${k}`;

/** Build the membership Set of occupied "i,j,k" keys + the j range. */
function occupiedKeySet(occupancy) {
  const set = new Set();
  let jMin = Infinity;
  let jMax = -Infinity;
  for (const [i, j, k] of occupiedCells(occupancy)) {
    set.add(ckey(i, j, k));
    if (j < jMin) jMin = j;
    if (j > jMax) jMax = j;
  }
  return { set, jMin, jMax };
}

/** Count occupied face-neighbours of (x,y,z) whose offset is PERPENDICULAR to `axis` (0=x,1=y,2=z).
 *  For an exterior empty cell just outside a wall in direction `axis`, this counts the opening's jambs /
 *  sill / lintel — ≥ recessFlank ⇒ that empty cell is enclosed ⇒ the wall cell behind it is recessed. */
function inPlaneOccupied(set, x, y, z, axis) {
  let n = 0;
  for (const [dx, dy, dz] of DIRS6) {
    if ((axis === 0 && dx) || (axis === 1 && dy) || (axis === 2 && dz)) continue; // skip the axis itself
    if (set.has(ckey(x + dx, y + dy, z + dz))) n++;
  }
  return n;
}

/**
 * Classify every occupied voxel into one geometric FEATURE. PURE, deterministic, GL-free.
 * Priority (first match wins): base → top-roof → opening-recess → edge-corner → flat-face. Band features
 * (base/roof) dominate the extremes so a corner's top/bottom cell reads roof/base while its mid-run reads
 * edge-corner — matching the AC's synthetic expectations.
 * @param {{dims:number[], occupied:Int32Array, count:number}} occupancy
 * @param {{baseBand?:number, upperFrac?:number, recessFlank?:number}} [opts]
 * @returns {Map<string, string>}  "i,j,k" → feature
 */
export function classifyFeatures(occupancy, opts = {}) {
  const { baseBand, upperFrac, recessFlank } = { ...CLASSIFY_DEFAULTS, ...opts };
  const { set, jMin, jMax } = occupiedKeySet(occupancy);
  const features = new Map();
  if (set.size === 0) return features;

  const baseTop = jMin + baseBand; // base iff j < baseTop
  const upperFloor = jMin + Math.ceil(upperFrac * (jMax - jMin)); // roof region iff j >= upperFloor

  for (const [i, j, k] of occupiedCells(occupancy)) {
    // 1. base — the lowest band, regardless of exposure.
    if (j < baseTop) {
      features.set(ckey(i, j, k), "base");
      continue;
    }
    // exposure flags
    let surface = false;
    let upwardFacing = false;
    let horizExposed = 0;
    let recessed = false;
    for (const [dx, dy, dz] of DIRS6) {
      const occ = set.has(ckey(i + dx, j + dy, k + dz));
      if (!occ) surface = true;
      if (!occ && dy === 1) upwardFacing = true;
    }
    for (const [dx, , dz] of HORIZ) {
      if (!set.has(ckey(i + dx, j, k + dz))) {
        horizExposed++;
        const axis = dx ? 0 : 2;
        if (inPlaneOccupied(set, i + dx, j, k + dz, axis) >= recessFlank) recessed = true;
      }
    }
    // 2. top-roof — upward-facing surface in the upper region.
    if (surface && upwardFacing && j >= upperFloor) {
      features.set(ckey(i, j, k), "top-roof");
      continue;
    }
    // 3. opening-recess — an inset/reveal (exterior empty cell enclosed by wall).
    if (surface && recessed) {
      features.set(ckey(i, j, k), "opening-recess");
      continue;
    }
    // 4. edge-corner — convex vertical edge / corner (exposed on ≥2 horizontal sides).
    if (surface && horizExposed >= 2) {
      features.set(ckey(i, j, k), "edge-corner");
      continue;
    }
    // 5. flat-face — broad single-face wall, or hidden interior body (default).
    features.set(ckey(i, j, k), "flat-face");
  }
  return features;
}

/** First-wins map placementRule → namespaced block. The map is small; later duplicates ignored. PURE. */
export function mapByRule(map) {
  const byRule = new Map();
  for (const e of map ?? []) {
    if (e?.placementRule && e?.block && !byRule.has(e.placementRule)) byRule.set(e.placementRule, e.block);
  }
  return byRule;
}

/** The map's palette as nearestLab entries `[{key:bareBlock, lab}]` (block-table Lab). Blocks absent from
 *  the table are skipped (no Lab to match on). `table` injectable for tests. PURE. */
export function fallbackPalette(map, table = loadBlockTable()) {
  const index = new Map(table.blocks.map((b) => [b.block, b]));
  const out = [];
  for (const block of paletteFromMap(map)) {
    const row = index.get(tableKey(block));
    if (row) out.push({ key: row.block, lab: row.lab });
  }
  return out;
}

/**
 * Assign a BLOCK KEY to every voxel from its geometric feature + the T-071 material map. PURE.
 * PRIMARY: feature → placementRule → the map's block for that rule — chosen by WHERE the cell is, never by
 * its colour (this is what restores brick≠cobble). FALLBACK: when the map is silent for the cell's rule,
 * the colorimetric matcher (E-14) picks the nearest map block to the cell's injected colour; with no
 * colours it falls to `defaultBlock` (the walls block, else the first map block).
 * @param {{dims:number[], occupied:Int32Array, count:number}} occupancy
 * @param {Map<string,string>} features  from {@link classifyFeatures}
 * @param {Array<{block,placementRule}>} map  the T-071 material map
 * @param {{colors?:number[], palette?:Array<{key,lab}>, defaultBlock?:string,
 *          metric?:Function}} [opts]
 * @returns {string[]}  BARE block keys (no namespace), length === count, occupiedCells order
 */
export function assignFeatureBlocks(occupancy, features, map, opts = {}) {
  const byRule = mapByRule(map);
  const palette = opts.palette ?? fallbackPalette(map);
  const colors = opts.colors;
  const wallsBlock = byRule.get("walls");
  const firstBlock = (paletteFromMap(map)[0]) ?? null;
  const defaultBlock = opts.defaultBlock ?? wallsBlock ?? firstBlock;

  const keys = new Array(occupancy.count);
  let n = 0;
  for (const [i, j, k] of occupiedCells(occupancy)) {
    const feature = features.get(ckey(i, j, k)) ?? "flat-face";
    const rule = FEATURE_RULE[feature];
    const mapped = rule ? byRule.get(rule) : null;
    let block;
    if (mapped) {
      block = mapped; // PRIMARY — by feature, not colour
    } else if (colors && palette.length) {
      const rgb = [colors[n * 3], colors[n * 3 + 1], colors[n * 3 + 2]]; // SILENT-MAP fallback (colour)
      block = nearestLab(srgbToLab(rgb), palette, { metric: opts.metric }).key;
    } else {
      block = defaultBlock; // no colours → deterministic default
    }
    if (!block) throw new Error(`assignFeatureBlocks: no block for feature "${feature}" and no fallback`);
    keys[n] = tableKey(block); // bare, for keysToArtifact
    n++;
  }
  return keys;
}

/** Tally feature → cell count over a classify result. PURE. */
export function featureCounts(features) {
  const out = Object.fromEntries(FEATURES.map((f) => [f, 0]));
  for (const f of features.values()) out[f] = (out[f] ?? 0) + 1;
  return out;
}

/**
 * Block × feature count matrix — the AC#4 proof that materials are placed BY FEATURE, not colour.
 * `keys` are the assigner's bare keys (occupiedCells order). Returns `{ [block]: { [feature]:count } }`. PURE.
 * @param {{occupied:Int32Array, count:number}} occupancy
 * @param {Map<string,string>} features
 * @param {string[]} keys  bare keys, occupiedCells order
 */
export function featureBlockMatrix(occupancy, features, keys) {
  const matrix = {};
  let n = 0;
  for (const [i, j, k] of occupiedCells(occupancy)) {
    const block = keys[n];
    const feature = features.get(ckey(i, j, k)) ?? "flat-face";
    (matrix[block] ??= Object.fromEntries(FEATURES.map((f) => [f, 0])))[feature]++;
    n++;
  }
  return matrix;
}
