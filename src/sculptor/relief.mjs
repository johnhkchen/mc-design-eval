// Staged-sculptor self-shadow relief pass — seed craft pass B (T-028-01, epic E-11 / story S-028).
//
// "Fake depth through Z." Over the LOCKED material skin (the textured-but-flat facade), assign each
// feature its legal-geometry Z move and write `relief`; lock it. Leaves the locked `occupied` (massing)
// and `material` (material-noise) untouched — the proof that a pass composes on a *prior pass's* locked
// output. This is the third and final link of the chain: massing → material → relief.
//
// THE THREE LEGAL MOVES (the ticket's vocabulary, encoded as a closed table, not free Z):
//   recess / window           → inset  -1  (self-shadow inside the opening)
//   trim / cornice / frame     → pop    +1  (cast shadow under the lip)
//   horizontal line (cornice / eave / base / lip) → +1 lip on the line course, overhanging the row
//                                                    beneath it so that course sits in shadow.
// Relief is a per-cell INTEGER in {-1, 0, +1} on the voxel lattice — there is no sub-voxel/curve here
// (curve is a separate future pass; the review critic keeps `ringing→curve` distinct from
// `flat→relief`). `inset`/`pop` are tunable on `intent.relief` for a deeper facade.
//
// CARVE RECESSES BY EXCLUSION (the memory rule, honored structurally). The compile emits EXACTLY ONE
// voxel per occupied cell at `[x, y, relief]`. A recess just sets that lone voxel's Z back to -1 —
// there is never a front block burying a back one. Relief NEVER adds a cell or a second placement; it
// only shifts Z. So "no buried blocks" is true by construction, not by convention.
//
// DETERMINISTIC, NO RANDOMNESS. Relief is a discrete classification (a cell is in a feature region or
// not; its Z is the feature's value), so — unlike material's continuous set pick — it needs no per-cell
// hash. Same state + same intent → same relief, cell for cell.
//
// BOUNDARIES: imports ONLY the spine (orchestrator, build-state, compile). Relief is geometry-only —
// no E-10 color engine, no block table, no SDK, no I/O, no render, no schema import. The AJV gate
// (src/artifact.mjs) validates the compiled output in tests (negative Z is schema-legal).

import { defineStage, runStages } from "./orchestrator.mjs";
import { occupiedCells } from "./build-state.mjs";
import { toDesignArtifact } from "./compile.mjs";

/** Tunables: the legal-move depths and the auto-detection toggles. `base` off by default (one clean
 *  cornice line is the minimal, predictable default; a plan opts the base course in). */
export const DEFAULTS = Object.freeze({ inset: -1, pop: 1, detect: true, base: false });

/** Feature type → relief KIND ("inset" pushes back, "pop" projects forward). Resolved to a number via
 *  DEFAULTS/intent at apply time. The ticket's three moves, as a closed vocabulary. */
export const FEATURE_RELIEF = Object.freeze({
  recess: "inset",
  window: "inset",
  trim: "pop",
  cornice: "pop",
  frame: "pop",
  lip: "pop",
  eave: "pop",
  base: "pop",
});

/** The style stamped on a compiled relief build. */
export const RELIEF_STYLE = Object.freeze({
  name: "relief",
  rationale:
    "Self-shadow relief — recess/trim/lip Z-depth over the locked material skin; the silhouette and " +
    "skin are unchanged, only the surface gains depth.",
});

const round2 = (n) => Math.round(n * 100) / 100;

// --- feature vocabulary guard + value resolution -----------------------------

/** Thrown when a feature carries a `type` outside the closed FEATURE_RELIEF vocabulary. */
export class FeatureTypeError extends Error {
  constructor(type) {
    super(`unknown relief feature type "${type}" (expected one of ${Object.keys(FEATURE_RELIEF).join(", ")})`);
    this.name = "FeatureTypeError";
    this.code = "feature_type";
    this.type = type;
  }
}

/** Assert `type` is in the vocabulary; returns it for chaining. Throws `FeatureTypeError` otherwise. */
export function assertFeatureType(type) {
  if (!Object.prototype.hasOwnProperty.call(FEATURE_RELIEF, type)) throw new FeatureTypeError(type);
  return type;
}

/**
 * The integer relief value for a feature type: "inset" → `inset` (default -1), "pop" → `pop` (+1).
 * @param {string} type @param {{inset?:number, pop?:number}} [depths]
 * @returns {number}
 */
export function reliefValueFor(type, depths = {}) {
  const kind = FEATURE_RELIEF[assertFeatureType(type)];
  const inset = depths.inset ?? DEFAULTS.inset;
  const pop = depths.pop ?? DEFAULTS.pop;
  return kind === "inset" ? inset : pop;
}

// --- regions + simple occupancy detection ------------------------------------

/** A region spec → predicate. Missing region claims all remaining cells; a `[[x,y],…]` list or a
 *  `(x,y)→bool` predicate claim explicitly. (Local mirror of material's helper — same intent shape.) */
function regionPredicate(region) {
  if (region == null) return () => true;
  if (typeof region === "function") return region;
  if (Array.isArray(region)) {
    const set = new Set(region.map(([x, y]) => `${x},${y}`));
    return (x, y) => set.has(`${x},${y}`);
  }
  return () => false;
}

/** The occupied-cell bounding box, or null if there are none. The `proportionsOf` idiom, local. */
function bbox(cells) {
  if (cells.length === 0) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const { x, y } of cells) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
}

/**
 * Simple geometry-only detection of horizontal lines over the occupancy: the topmost occupied row is a
 * cornice/eave lip; the bottom row a base course. Each returned as an explicit `[[x,y],…]` region so it
 * composes with explicit intent features. No material inspection (relief is geometry-only).
 * @param {Array<{x:number,y:number}>} cells  occupied cells
 * @param {{cornice?:boolean, base?:boolean}} opts
 * @returns {Array<{type:string, region:Array<[number,number]>}>}
 */
function detectFeatures(cells, opts) {
  const bb = bbox(cells);
  if (!bb) return [];
  const out = [];
  if (opts.cornice) {
    const top = cells.filter(({ y }) => y === bb.maxY).map(({ x, y }) => [x, y]);
    if (top.length) out.push({ type: "cornice", region: top });
  }
  if (opts.base) {
    const bottom = cells.filter(({ y }) => y === bb.minY).map(({ x, y }) => [x, y]);
    if (bottom.length) out.push({ type: "base", region: bottom });
  }
  return out;
}

/**
 * Partition the occupied cells into relief features, each with its resolved integer Z value. Explicit
 * `intent.relief.features` claim cells first (in order, first-claim wins), then appended auto-detected
 * horizontal lines claim whatever is still flat. A cell claimed by no feature stays flat (relief 0) and
 * is NOT returned — relief is sparse (most of a facade is flat wall).
 * @returns {Array<{cells:Array<{x:number,y:number}>, value:number}>}
 */
function resolveFeatures(state, intent) {
  const ri = (intent && intent.relief) || {};
  const inset = ri.inset ?? DEFAULTS.inset;
  const pop = ri.pop ?? DEFAULTS.pop;
  const detectOn = ri.detect ?? DEFAULTS.detect;
  const baseOn = ri.base ?? DEFAULTS.base;

  const all = occupiedCells(state).map(({ x, y }) => ({ x, y }));
  const explicit = Array.isArray(ri.features) ? ri.features : [];
  const detected = detectOn ? detectFeatures(all, { cornice: true, base: baseOn }) : [];
  const features = [...explicit, ...detected]; // explicit always claims before detection

  const claimed = new Set();
  const key = (x, y) => `${x},${y}`;
  const out = [];
  for (const f of features) {
    const pred = regionPredicate(f.region);
    const cells = all.filter(({ x, y }) => !claimed.has(key(x, y)) && pred(x, y));
    if (cells.length === 0) continue;
    cells.forEach(({ x, y }) => claimed.add(key(x, y)));
    out.push({ cells, value: reliefValueFor(f.type, { inset, pop }) });
  }
  return out;
}

// --- the stage + convenience -------------------------------------------------

/**
 * The relief Stage: write the resolved integer `relief` on each feature cell. Reads features from
 * `intent.relief` (explicit + detected). Touches ONLY `relief` on ONLY occupied cells — `occupied`
 * (locked) and `material` (locked) are never written (the stage's patch carries only `{relief}`).
 * @param {object} [intent]  closure intent; the runStages intent (if it carries `.relief`) wins
 * @returns {{name:string, apply:Function}}
 */
export function reliefStage(intent = {}) {
  return defineStage({
    name: "relief",
    run: (draft, intentArg, prev) => {
      const useIntent = intentArg && intentArg.relief ? intentArg : intent;
      for (const feat of resolveFeatures(prev, useIntent)) {
        for (const { x, y } of feat.cells) draft.set(x, y, { relief: feat.value });
      }
    },
  });
}

/**
 * Run the relief pass over a (material-locked) state, locking `relief` on accept.
 * @param {import("./build-state.mjs").BuildState} state  a material-locked state
 * @param {object} [intent]  `{ relief: { features?, inset?, pop?, detect?, base? } }`
 * @returns {import("./build-state.mjs").BuildState}
 */
export function relief(state, intent = {}) {
  return runStages(state, [reliefStage(intent)], intent);
}

// --- the "less flat" metric --------------------------------------------------

/**
 * A pure projection of a state's relief — the quantitative "flatness" signal (parallels `proportionsOf`;
 * never stored, so it cannot drift). An all-flat state (massing-only or material-only) is zero across
 * the board; after the relief pass both `coverage` and `variance` are > 0 ("measurably less flat").
 * @param {import("./build-state.mjs").BuildState} state
 * @returns {{occupied:number, relievedCount:number, coverage:number, variance:number,
 *            min:number, max:number, range:number}}
 */
export function reliefMetrics(state) {
  const cells = occupiedCells(state);
  const occupied = cells.length;
  if (occupied === 0) {
    return { occupied: 0, relievedCount: 0, coverage: 0, variance: 0, min: 0, max: 0, range: 0 };
  }
  let relievedCount = 0;
  let sum = 0;
  let min = Infinity;
  let max = -Infinity;
  for (const { cell } of cells) {
    const r = cell.relief ?? 0;
    if (r !== 0) relievedCount++;
    sum += r;
    if (r < min) min = r;
    if (r > max) max = r;
  }
  const mean = sum / occupied;
  let sq = 0;
  for (const { cell } of cells) {
    const d = (cell.relief ?? 0) - mean;
    sq += d * d;
  }
  return {
    occupied,
    relievedCount,
    coverage: round2(relievedCount / occupied),
    variance: round2(sq / occupied),
    min,
    max,
    range: max - min,
  };
}

// --- compile -----------------------------------------------------------------

/**
 * Compile a relief-sculpted state to a `DesignArtifact`. Thin wrapper over the spine's
 * `toDesignArtifact` that stamps the relief style; relief already flows to Z (`pos:[x,y,relief]`), so
 * there is no compile change — recessed cells emit their lone voxel at z=-1 (exclusion). The blocks are
 * the material pass's hue-family manifest; relief only moves their Z. Pure (callers validate via
 * src/artifact.mjs).
 * @param {import("./build-state.mjs").BuildState} state @param {Object} [opts]
 * @returns {import("../artifact.mjs").DesignArtifact}
 */
export function compileRelief(state, opts = {}) {
  return toDesignArtifact(state, { style: RELIEF_STYLE, ...opts });
}
