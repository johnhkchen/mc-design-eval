// Scoped procedural passes for the deterministic revision loop (T-045-01, story S-045, epic E-15).
//
// THE TWEAK PRIMITIVE OF THE CAGE. The revision loop (loop.mjs) needs a deterministic, model-free edit
// to drive — the AC's "scoped procedural pass bounded to the region." E-11's relief/material passes
// (src/sculptor/{relief,material}.mjs) carry the right IDEAS but operate on a 2-D BuildState; the loop
// lives one level down, on a compiled DesignArtifact + a region R (src/revise/region.mjs). So this
// module expresses the SAME two ideas as PLACEMENT-LEVEL editors — `(inRegionPlacements) => newPlacements`,
// exactly the shape `applyRegionEdit`'s function-form `edit` consumes:
//
//   relief   = a Z (depth) move of in-region voxels (E-11's pop/inset, +1/-1), clamped to R so it
//              never asks the lock to throw; under the 3/4 camera a depth move shifts the silhouette.
//   material = a block swap of in-region voxels — positions untouched, so geometry (and thus a
//              silhouette score) is unchanged: the gate's honest no-op, always rolled back.
//
// Plus the loop's two model-free helpers: `proceduralDiagnose` (a geometric stand-in for the E-11
// model critic — names a defect+route from R's geometry, no SDK call) and `boxesIntersect` (the
// spatial-lock overlap test). All PURE, RNG-FREE, GL-FREE: inputs are never mutated and the same
// inputs yield the same output, cell for cell — a hill-climb cannot tolerate jitter.
//
// BOUNDARIES: imports ONLY ../expand.mjs (integer geometry, for clamp/voxel awareness) and the PURE
// route vocabulary from ../sculptor/review.mjs (ROUTING_TABLE/ROUTE_TARGETS — no GL, no model). NO
// render, NO world, NO SDK. The route vocabulary is shared so the E-11 model critic is a drop-in for
// `proceduralDiagnose` in T-046-01 with zero loop changes.

import { expandPlacement } from "../expand.mjs";
import { ROUTING_TABLE, ROUTE_TARGETS } from "../sculptor/review.mjs";

/** Schema tag stamped on tweak provenance so downstream (the loop trace) can version-check it. */
export const TWEAK_SCHEMA = "revise-tweak/v1";

/** Tunable defaults for the two passes. */
export const TWEAK_DEFAULTS = Object.freeze({
  reliefDelta: 1, // base |Z| step; `scopedTweakFor` alternates sign and grows it per attempt
  materialBlocks: Object.freeze(["minecraft:stone", "minecraft:smooth_stone", "minecraft:deepslate"]),
});

// --- box geometry (shared with the loop's spatial lock) --------------------

/**
 * Inclusive 3-D integer box overlap. Two `{min:[x,y,z], max:[x,y,z]}` boxes intersect iff they
 * overlap on every axis (touching faces count — the lock is conservative). PURE.
 * @param {{min:number[],max:number[]}} a
 * @param {{min:number[],max:number[]}} b
 * @returns {boolean}
 */
export function boxesIntersect(a, b) {
  for (let ax = 0; ax < 3; ax++) {
    if (a.max[ax] < b.min[ax] || b.max[ax] < a.min[ax]) return false;
  }
  return true;
}

// --- placement-level passes ------------------------------------------------

const clampZ = (z, lo, hi) => Math.max(lo, Math.min(hi, z));

/**
 * A placement with its Z coordinate(s) shifted by `delta` and clamped to `[lo,hi]`. `voxel` moves
 * `pos[2]`; `fill/box/line` move both `from[2]` and `to[2]`. Clamping each endpoint into the Z range
 * keeps every expanded voxel inside `[lo,hi]` (expansion stays within the endpoints' span), so the
 * region-lock can never throw on our own pass. PURE — a fresh placement; the input is untouched.
 * @returns {object}
 */
function shiftPlacementZ(p, delta, lo, hi) {
  if (p.op === "voxel") {
    return { ...p, pos: [p.pos[0], p.pos[1], clampZ(p.pos[2] + delta, lo, hi)] };
  }
  return {
    ...p,
    from: [p.from[0], p.from[1], clampZ(p.from[2] + delta, lo, hi)],
    to: [p.to[0], p.to[1], clampZ(p.to[2] + delta, lo, hi)],
  };
}

/**
 * RELIEF PASS — the Z (depth) move bounded to R. Shift every in-region placement's Z by `delta`,
 * clamped to `subBounds.z` so no voxel escapes R. The placement-level analogue of E-11's relief
 * (pop +1 / inset −1). PURE; deterministic; inputs unmutated.
 * @param {object[]} inRegion  R.placements
 * @param {{min:number[],max:number[]}} subBounds  R.subBounds
 * @param {{delta?:number}} [opts]
 * @returns {object[]} new in-region placements
 */
export function reliefPass(inRegion, subBounds, opts = {}) {
  const delta = opts.delta ?? TWEAK_DEFAULTS.reliefDelta;
  const lo = subBounds.min[2];
  const hi = subBounds.max[2];
  return inRegion.map((p) => shiftPlacementZ(p, delta, lo, hi));
}

/**
 * MATERIAL PASS — the block swap bounded to R. Remap every in-region placement's `block` to `block`;
 * positions are byte-identical, so every edited voxel stays exactly where it was (always in-region).
 * The placement-level analogue of E-11's material pass. PURE; deterministic; inputs unmutated.
 * @param {object[]} inRegion  R.placements
 * @param {{block?:string}} [opts]
 * @returns {object[]} new in-region placements
 */
export function materialPass(inRegion, opts = {}) {
  const block = opts.block ?? TWEAK_DEFAULTS.materialBlocks[0];
  return inRegion.map((p) => ({ ...p, block }));
}

// --- route -> editor selector ----------------------------------------------

/** A stable, readable trace label for a (route, attempt) tweak — pure, no behavior. */
export function tweakLabel(route, attempt) {
  if (route === "relief") {
    const d = reliefDeltaFor(attempt);
    return `relief${d >= 0 ? "+" : ""}${d}`;
  }
  if (route === "material") return `material#${attempt}`;
  return "noop";
}

/** Attempt → signed Z step: +1, −1, +2, −2, … (alternating sign, growing magnitude). PURE. */
function reliefDeltaFor(attempt, base = TWEAK_DEFAULTS.reliefDelta) {
  const mag = base * (Math.floor(attempt / 2) + 1);
  return attempt % 2 === 0 ? mag : -mag;
}

/**
 * Select the scoped procedural editor for a routed defect. Returns a function
 * `(inRegion) => newPlacements` ready for `applyRegionEdit`. `relief` alternates the Z step by
 * `attempt`; `material` steps through `intent.material.blocks` (cycled); ANY OTHER route → identity
 * (a safe no-op the accept-gate rolls back). `subBounds` is needed only by relief (to clamp) and is
 * read off R inside the returned closure via the bound `R`. PURE selection.
 * @param {string} route  one of ROUTE_TARGETS (relief/material handled; others → no-op)
 * @param {number} attempt  0-based attempt index within the region
 * @param {{relief?:object, material?:{block?:string, blocks?:string[]}}} [intent]
 * @returns {(inRegion:object[], subBounds:{min:number[],max:number[]}) => object[]}
 */
export function scopedTweakFor(route, attempt, intent = {}) {
  if (route === "relief") {
    const base = intent.relief?.delta ?? TWEAK_DEFAULTS.reliefDelta;
    const delta = reliefDeltaFor(attempt, base);
    return (inRegion, subBounds) => reliefPass(inRegion, subBounds, { delta });
  }
  if (route === "material") {
    const blocks = intent.material?.blocks ?? TWEAK_DEFAULTS.materialBlocks;
    const block = intent.material?.block ?? blocks[attempt % blocks.length];
    return (inRegion) => materialPass(inRegion, { block });
  }
  return (inRegion) => inRegion; // identity — unknown/un-handled route is a no-op (rolled back)
}

// --- model-free geometric diagnosis (default `diagnose`) -------------------

/** Min/max Z over the expanded voxels of an in-region placement set (or null if empty). PURE. */
function zSpanOf(inRegion) {
  let min = Infinity;
  let max = -Infinity;
  for (const p of inRegion) {
    for (const v of expandPlacement(p)) {
      if (v.pos[2] < min) min = v.pos[2];
      if (v.pos[2] > max) max = v.pos[2];
    }
  }
  return max < min ? null : { min, max };
}

/** The set of distinct block ids over an in-region placement set. PURE. */
function uniqueBlocks(inRegion) {
  return new Set(inRegion.map((p) => p.block));
}

/**
 * MODEL-FREE GEOMETRIC DIAGNOSIS — the default `diagnose` for the deterministic loop (AC #3: no
 * model/SDK call). Inspects R's in-region voxels and names a defect + E-11 route from geometry alone:
 *   - zero Z-variance (the section is flat in depth)           → {defect:"flat", route:"relief"}
 *   - else a single uniform block (flat depth is varied, but   → {defect:"flat", route:"material"}
 *     the skin is monotone)
 *   - else                                                     → []  (clean — nothing to route)
 * Routes are drawn from the shared E-11 vocabulary (`ROUTING_TABLE`/`ROUTE_TARGETS`), so the metered
 * model critic (T-046-01) is a drop-in replacement with no loop change. `where` echoes the spec.
 * @param {object} _artifact  unused (geometry comes from R) — kept for the (artifact, R) signature
 * @param {ReturnType<import("./region.mjs").selectRegion>} R
 * @returns {Array<{defect:string, where:string, route:string}>}
 */
export function proceduralDiagnose(_artifact, R) {
  const inRegion = R.placements;
  const where = typeof R.spec === "string" ? R.spec : JSON.stringify(R.spec);
  const span = zSpanOf(inRegion);
  if (!span) return []; // empty region — nothing to do
  if (span.max === span.min) {
    return [{ defect: "flat", where, route: pickRoute("relief") }];
  }
  if (uniqueBlocks(inRegion).size <= 1) {
    return [{ defect: "flat", where, route: pickRoute("material") }];
  }
  return [];
}

/** Return `route` if it is a known E-11 route target, else the table's `flat` head — keeps routes valid. */
function pickRoute(route) {
  return ROUTE_TARGETS.includes(route) ? route : ROUTING_TABLE.flat[0];
}
