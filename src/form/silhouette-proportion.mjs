// Silhouette proportion metrics (T-135-01, story S-135, epic E-33) — the numbers the glance is
// grading. The T-127 cottage ledger proved the gap: the model's critique named the proportion
// defect in four of six rounds and every round passed conformance, because regularity is all the
// gate owned. This module owns the missing dimension: **ridge:eave ratio, roof share of the
// elevation, footprint aspect** — measured from silhouettes, compared against DECLARED targets
// derived from the concept (the contract) with the conditioned sketch as the recorded fallback.
//
// ONE METRIC, TWO SUBSTRATES. Masks are image-style binary grids ({w,h,data,bbox}, row 0 at the
// TOP — exactly extractSilhouette's shape), so the SAME eave/ridge detection runs on (a) the
// build's orthographic occupancy projections and (b) the concept image's silhouette (E-22
// machinery, form-fidelity.mjs). The build side never reads GL bytes: the projection is the
// silhouette the render depicts, derived from the voxels — deterministic, replayable (the
// E-24/E-28 principle; renders stay the model's eyes).
//
// DETECTION RULES (documented in packs/README.md, frozen op parameters — never subject-tuned):
//   eave  = the TOPMOST row whose horizontal extent is ≥ eaveWidthFrac × the max row extent —
//           "the eave stays the widest layer" (the generated-build chain contract). Extent, not
//           foreground count, so window holes never thin a wall row.
//   ridge = the TOPMOST row whose extent is ≥ ridgeMinWidthFrac × the max row extent — a thin
//           chimney or finial never reads as the ridge (the T-118 protrusion-polluted-apex
//           lesson).
//   eaveH counts rows STRICTLY BELOW the eave row (matching the program convention: eaveY wall
//   cells below the first roof course); totalH includes the ridge row. ridgeToEave = totalH/eaveH;
//   roofShare = (totalH − eaveH)/totalH — the same definitions as measured-program's
//   silhouetteRatios, so the program-side diagnostic rows and these gate rows line up.
//
// TOLERANCE is RELATIVE (|measured − target| / |target| ≤ tolerance) so one declared number
// spans the three ratio magnitudes; targets smaller than absoluteFloor switch to an absolute
// delta (a near-zero roofShare must not divide by itself). Degenerate masks return null
// constituents — the caller's recorded fallback trigger, never a silent default (E-33 Rule 1).
//
// PURE — no GL, no I/O, no Date/random — runs under the `src/**/*.test.mjs` glob.

import { sketchTargetRatios } from "../recognition/measured-program.mjs";

export const PROPORTION_SCHEMA = "silhouette-proportion/v1";

export const RATIO_NAMES = Object.freeze(["ridgeToEave", "roofShare", "aspect"]);

/** Frozen op parameters (the CONFORMANCE_DEFAULTS posture — declared, never subject-tuned). */
export const PROPORTION_DEFAULTS = Object.freeze({
  tolerance: 0.15, // relative acceptance band per ratio
  absoluteFloor: 0.05, // |target| below this → compare absolute delta against tolerance instead
  ridgeMinWidthFrac: 0.25, // a row narrower than this × maxExtent never reads as the ridge
  eaveWidthFrac: 0.98, // a row at least this × maxExtent is an eave-layer candidate (0.98, not
  // 1.0: antialiased concept masks put near-max rows a pixel or two apart)
});

const r4 = (x) => Math.round(x * 1e4) / 1e4;
const fail = (msg) => { throw new Error(`silhouette-proportion: ${msg}`); };

// --- occupancy → masks ------------------------------------------------------

const inBbox = (x, z, bbox) =>
  !bbox || (x >= bbox.x0 && x < bbox.x1 && z >= bbox.z0 && z < bbox.z1);

/**
 * Orthographic ELEVATION mask of an occupancy: project every cell along `axis` ("x" | "z" — the
 * viewing direction) onto the (u, y) plane, tight-cropped, row 0 at the TOP. `opts.bbox`
 * ({x0,x1,z0,z1}, half-open, block coords — the per-mass restriction) limits which columns
 * project. Empty selection → null.
 * @param {{cells:Map<string,string>}} occ
 * @returns {{w:number,h:number,data:Uint8Array,bbox:{x0:number,y0:number,x1:number,y1:number}}|null}
 */
export function elevationMask(occ, axis, opts = {}) {
  if (axis !== "x" && axis !== "z") fail(`elevationMask: axis must be "x"|"z", got ${axis}`);
  let uMin = Infinity, uMax = -Infinity, yMin = Infinity, yMax = -Infinity;
  const pts = [];
  for (const key of occ.cells.keys()) {
    const [x, y, z] = key.split(",").map(Number);
    if (!inBbox(x, z, opts.bbox ?? null)) continue;
    const u = axis === "x" ? z : x;
    pts.push([u, y]);
    if (u < uMin) uMin = u;
    if (u > uMax) uMax = u;
    if (y < yMin) yMin = y;
    if (y > yMax) yMax = y;
  }
  if (pts.length === 0) return null;
  const w = uMax - uMin + 1;
  const h = yMax - yMin + 1;
  const data = new Uint8Array(w * h);
  for (const [u, y] of pts) data[(yMax - y) * w + (u - uMin)] = 1; // row 0 = top
  return { w, h, data, bbox: { x0: 0, y0: 0, x1: w, y1: h } };
}

/**
 * PLAN mask (projection along y) → (x, z) grid, tight-cropped; rows are z (orientation is
 * irrelevant to the aspect ratio). Empty selection → null.
 */
export function planMask(occ, opts = {}) {
  let xMin = Infinity, xMax = -Infinity, zMin = Infinity, zMax = -Infinity;
  const pts = [];
  for (const key of occ.cells.keys()) {
    const [x, , z] = key.split(",").map(Number);
    if (!inBbox(x, z, opts.bbox ?? null)) continue;
    pts.push([x, z]);
    if (x < xMin) xMin = x;
    if (x > xMax) xMax = x;
    if (z < zMin) zMin = z;
    if (z > zMax) zMax = z;
  }
  if (pts.length === 0) return null;
  const w = xMax - xMin + 1;
  const h = zMax - zMin + 1;
  const data = new Uint8Array(w * h);
  for (const [x, z] of pts) data[(z - zMin) * w + (x - xMin)] = 1;
  return { w, h, data, bbox: { x0: 0, y0: 0, x1: w, y1: h } };
}

// --- mask metrics -----------------------------------------------------------

/**
 * Eave/ridge/ground lines of a silhouette mask (occupancy projection OR extractSilhouette
 * output). Row extent = rightmost−leftmost+1 foreground within the row (holes don't thin it).
 * Returns null when the mask is empty/degenerate (no foreground, or no row clears the ridge
 * threshold — cannot happen with a non-empty mask since the max-extent row always does).
 * @param {{w:number,h:number,data:Uint8Array,bbox:object|null}} mask
 * @param {{ridgeMinWidthFrac?:number, eaveWidthFrac?:number}} [opts]
 * @returns {{ridgeRow:number, eaveRow:number, groundRow:number, totalH:number, eaveH:number,
 *            maxExtent:number}|null}
 */
export function maskProportions(mask, opts = {}) {
  if (!mask || !mask.data || !mask.bbox) return null;
  const ridgeFrac = opts.ridgeMinWidthFrac ?? PROPORTION_DEFAULTS.ridgeMinWidthFrac;
  const eaveFrac = opts.eaveWidthFrac ?? PROPORTION_DEFAULTS.eaveWidthFrac;
  const { w } = mask;
  const { x0, y0, x1, y1 } = mask.bbox;
  const extents = [];
  let maxExtent = 0;
  for (let y = y0; y < y1; y++) {
    let lo = -1, hi = -1;
    const row = y * w;
    for (let x = x0; x < x1; x++) {
      if (!mask.data[row + x]) continue;
      if (lo < 0) lo = x;
      hi = x;
    }
    const extent = lo < 0 ? 0 : hi - lo + 1;
    extents.push(extent);
    if (extent > maxExtent) maxExtent = extent;
  }
  if (maxExtent === 0) return null;
  let ridgeRow = -1, eaveRow = -1, groundRow = -1;
  for (let i = 0; i < extents.length; i++) {
    const e = extents[i];
    if (e === 0) continue;
    const y = y0 + i;
    if (ridgeRow < 0 && e >= ridgeFrac * maxExtent) ridgeRow = y;
    if (eaveRow < 0 && e >= eaveFrac * maxExtent) eaveRow = y;
    groundRow = y;
  }
  if (ridgeRow < 0 || eaveRow < 0 || groundRow < 0) return null;
  return {
    ridgeRow, eaveRow, groundRow,
    totalH: groundRow - ridgeRow + 1,
    eaveH: groundRow - eaveRow, // rows STRICTLY below the eave layer (the program convention)
    maxExtent,
  };
}

/** ridgeToEave + roofShare from one mask; null constituents when unmeasurable. */
export function ratiosFromMask(mask, opts = {}) {
  const p = maskProportions(mask, opts);
  if (!p || p.eaveH < 1) return { ridgeToEave: null, roofShare: null };
  return {
    ridgeToEave: r4(p.totalH / p.eaveH),
    roofShare: r4((p.totalH - p.eaveH) / p.totalH),
  };
}

/** Alias with the concept-side name (the witness/derivation call site reads as its meaning). */
export const targetsFromConceptMask = ratiosFromMask;

// --- assembly over an occupancy ---------------------------------------------

/**
 * The build-side ratio row: both elevations projected; eaveH = the MIN across views (the taper
 * view sees the true widest-layer eave; the along-ridge view has no taper and reports its top),
 * totalH = the MAX (thresholded ridge agrees across views; max is the global read); aspect from
 * the plan bbox. `opts.masses` ([{id, bbox}]) adds the same row per named mass over the
 * restricted projection (the component/mass record seam).
 * @param {{cells:Map<string,string>}} occ
 * @returns {{ridgeToEave:number|null, roofShare:number|null, aspect:number|null,
 *            perMass?:object[]}}
 */
export function proportionRatios(occ, opts = {}) {
  const whole = ratiosOver(occ, null, opts);
  if (!Array.isArray(opts.masses) || opts.masses.length === 0) return whole;
  const perMass = opts.masses.map((m) => ({ id: m.id, ...ratiosOver(occ, m.bbox ?? null, opts) }));
  return { ...whole, perMass };
}

function ratiosOver(occ, bbox, opts) {
  const views = [elevationMask(occ, "x", { bbox }), elevationMask(occ, "z", { bbox })]
    .map((m) => maskProportions(m, opts))
    .filter(Boolean);
  const plan = planMask(occ, { bbox });
  let ridgeToEave = null;
  let roofShare = null;
  if (views.length > 0) {
    const eaveH = Math.min(...views.map((v) => v.eaveH));
    const totalH = Math.max(...views.map((v) => v.totalH));
    if (eaveH >= 1) {
      ridgeToEave = r4(totalH / eaveH);
      roofShare = r4((totalH - eaveH) / totalH);
    }
  }
  const aspect = plan
    ? r4(Math.max(plan.w, plan.h) / Math.min(plan.w, plan.h))
    : null;
  return { ridgeToEave, roofShare, aspect };
}

// --- declared targets --------------------------------------------------------

/**
 * Derive `declarations.proportions` — concept-first, sketch fallback, every source RECORDED.
 * `aspect` is ALWAYS sketch-sourced (a single perspective view cannot measure a plan ratio —
 * the AC's "concept view obscures a ratio" case, permanent for this ratio). A ratio neither
 * side can measure THROWS — an unmeasurable target would weaken the gate silently.
 * @param {{conceptMask?:object|null, sketch:object, tolerance?:number, masses?:object[]}} args
 *   conceptMask: an extractSilhouette result of the concept image (CONCEPT_BG); null/omitted →
 *   sketch supplies everything (recorded).
 * @returns {{schema:string, targets:object, sources:object, tolerance:number, masses?:object[]}}
 */
export function deriveProportionDeclarations({ conceptMask = null, sketch, tolerance, masses } = {}) {
  if (!sketch) fail("deriveProportionDeclarations: sketch is required (the recorded fallback reference)");
  const concept = conceptMask ? targetsFromConceptMask(conceptMask) : { ridgeToEave: null, roofShare: null };
  const fromSketch = sketchTargetRatios(sketch);
  const targets = {};
  const sources = {};
  for (const name of ["ridgeToEave", "roofShare"]) {
    if (concept[name] !== null && concept[name] !== undefined) {
      targets[name] = concept[name];
      sources[name] = "concept";
    } else if (fromSketch[name] !== null) {
      targets[name] = fromSketch[name];
      sources[name] = "sketch";
    } else {
      fail(`deriveProportionDeclarations: ${name} is unmeasurable on both the concept and the sketch`);
    }
  }
  if (fromSketch.aspect === null) {
    fail("deriveProportionDeclarations: aspect is unmeasurable on the sketch (its only source)");
  }
  targets.aspect = fromSketch.aspect;
  sources.aspect = "sketch";
  const decl = {
    schema: PROPORTION_SCHEMA,
    targets,
    sources,
    tolerance: tolerance ?? PROPORTION_DEFAULTS.tolerance,
  };
  if (Array.isArray(masses) && masses.length > 0) decl.masses = masses;
  return assertProportionDeclarations(decl);
}

/** Shape gate for `declarations.proportions`. Returns the input (for chaining); throws on any
 *  violation — a malformed declaration is a bug upstream, never a finding. */
export function assertProportionDeclarations(decl) {
  if (decl === null || typeof decl !== "object" || Array.isArray(decl)) {
    fail("declarations.proportions must be an object");
  }
  const t = decl.targets;
  if (t === null || typeof t !== "object" || Array.isArray(t)) fail("proportions.targets must be an object");
  const named = RATIO_NAMES.filter((n) => t[n] !== undefined && t[n] !== null);
  if (named.length === 0) fail(`proportions.targets must declare at least one of ${RATIO_NAMES.join(", ")}`);
  for (const n of named) {
    if (!Number.isFinite(t[n]) || t[n] <= 0) fail(`proportions.targets.${n} must be a finite positive number`);
    const src = decl.sources?.[n];
    if (src !== "concept" && src !== "sketch") fail(`proportions.sources.${n} must be "concept" | "sketch"`);
  }
  if (!Number.isFinite(decl.tolerance) || decl.tolerance <= 0) fail("proportions.tolerance must be a finite positive number");
  if (decl.masses !== undefined) {
    if (!Array.isArray(decl.masses)) fail("proportions.masses must be an array when present");
    for (const m of decl.masses) {
      if (typeof m?.id !== "string" || m.id.length === 0) fail("each proportions.masses entry needs a non-empty id");
      const b = m.bbox;
      if (!b || ![b.x0, b.x1, b.z0, b.z1].every(Number.isFinite) || b.x0 >= b.x1 || b.z0 >= b.z1) {
        fail(`proportions.masses "${m.id}" bbox must be {x0<x1, z0<z1}`);
      }
    }
  }
  return decl;
}

// --- comparison (the gate's arithmetic) --------------------------------------

/**
 * Compare measured ratios against declared targets. One row per declared ratio (plus per-mass
 * rows when a mass declares its own `targets`; measured-only mass rows are informational —
 * `withinTolerance: null`, never findings). `excess` is THE comparable magnitude (relDelta on
 * the relative arm, |delta| under the absoluteFloor) — the loop's no-regress predicate compares
 * it across rounds.
 * @param {{ridgeToEave,roofShare,aspect, perMass?}} measured  a proportionRatios result
 * @param {object} declared  validated declarations.proportions
 * @returns {{pass:boolean, tolerance:number, rows:object[]}}
 */
export function compareRatios(measured, declared) {
  const decl = assertProportionDeclarations(declared);
  const rows = [];
  const compareOne = (mass, name, m, target, source) => {
    if (target === undefined || target === null) {
      if (m !== null && m !== undefined) {
        rows.push({ ...(mass ? { mass } : {}), ratio: name, measured: m, target: null, source: null, delta: null, excess: null, basis: null, withinTolerance: null });
      }
      return;
    }
    if (m === null || m === undefined) {
      rows.push({ ...(mass ? { mass } : {}), ratio: name, measured: null, target, source, delta: null, excess: null, basis: "unmeasurable", withinTolerance: false });
      return;
    }
    const delta = r4(Math.abs(m - target));
    const absolute = Math.abs(target) < PROPORTION_DEFAULTS.absoluteFloor;
    const excess = absolute ? delta : r4(delta / Math.abs(target));
    rows.push({
      ...(mass ? { mass } : {}),
      ratio: name, measured: m, target, source, delta,
      excess, basis: absolute ? "absolute" : "relative",
      withinTolerance: excess <= decl.tolerance,
    });
  };
  for (const name of RATIO_NAMES) {
    compareOne(null, name, measured?.[name] ?? null, decl.targets[name] ?? null, decl.sources?.[name] ?? null);
  }
  for (const dm of decl.masses ?? []) {
    const mm = (measured?.perMass ?? []).find((x) => x.id === dm.id) ?? null;
    for (const name of RATIO_NAMES) {
      compareOne(dm.id, name, mm?.[name] ?? null, dm.targets?.[name] ?? null, dm.sources?.[name] ?? "sketch");
    }
  }
  return {
    pass: rows.every((r) => r.withinTolerance !== false),
    tolerance: decl.tolerance,
    rows,
  };
}
