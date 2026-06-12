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
//   eave  = the TOPMOST row whose horizontal extent is ≥ eaveWidthFrac × the EAVE-REFERENCE extent
//           — "the eave stays the widest layer" (the generated-build chain contract). Extent, not
//           foreground count, so window holes never thin a wall row. The reference is the dominant
//           WALL band, not the global max: a plinth/water-table course in the bottom skirtBandFrac
//           of the silhouette that juts out past the body above it is a skirt, never the eave
//           (T-139-01) — else the latched plinth inverts the loop's gradient, the bent-ruler
//           lesson. The protrusion threshold reuses eaveWidthFrac (a skirt pokes beyond the body's
//           own eave-tolerance band); skirtBandFrac 0 recovers the legacy global-max ruler exactly.
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

import { sketchTargetRatios, snapPitch } from "../recognition/measured-program.mjs";

export const PROPORTION_SCHEMA = "silhouette-proportion/v1";
export const PITCH_TARGET_SCHEMA = "pitch-target/v1";

export const RATIO_NAMES = Object.freeze(["ridgeToEave", "roofShare", "aspect"]);

/**
 * The two proportion RULERS (T-140-01, S-140) — orthogonal to a target's `source` (concept|sketch).
 * `lens` names WHICH SUBSTRATE a number was measured on, so a 3× program-vs-occupancy gap reads as
 * two instruments, not a contradiction (T-138-02 review concern 6):
 *   PROGRAM   — ratios from program PARAMETERS (silhouetteRatios / sketchTargetRatios — clean
 *               eaveY/ridgeY/footprint, the intended numbers).
 *   OCCUPANCY — ratios over REALIZED VOXELS (proportionRatios / maskProportions — what the build
 *               actually is; sees skirt bands, taper, every realization artifact).
 * Labels are ADDITIVE and OPT-IN so committed records stay byte-identical (AC4): a producer NAMES
 * its lens by wrapping its bundle in `tagLens`, and `compareRatios` stamps rows only when handed
 * `opts.lens`. New records (ruler-calibration) carry the label; retro-stamping the committed
 * witness/measured/milestone pins is a rotation owned by T-142/T-143.
 */
export const PROPORTION_LENS = Object.freeze({ PROGRAM: "program", OCCUPANCY: "occupancy" });

/** Name a ratio bundle's lens — returns a labeled COPY (the producer's opt-in stamp). */
export function tagLens(ratios, lens) {
  if (lens !== PROPORTION_LENS.PROGRAM && lens !== PROPORTION_LENS.OCCUPANCY) {
    fail(`tagLens: lens must be "${PROPORTION_LENS.PROGRAM}" | "${PROPORTION_LENS.OCCUPANCY}", got ${lens}`);
  }
  if (ratios === null || typeof ratios !== "object" || Array.isArray(ratios)) fail("tagLens: ratios must be an object");
  return { ...ratios, lens };
}

/** Frozen op parameters (the CONFORMANCE_DEFAULTS posture — declared, never subject-tuned). */
export const PROPORTION_DEFAULTS = Object.freeze({
  tolerance: 0.15, // relative acceptance band per ratio
  absoluteFloor: 0.05, // |target| below this → compare absolute delta against tolerance instead
  ridgeMinWidthFrac: 0.25, // a row narrower than this × maxExtent never reads as the ridge
  eaveWidthFrac: 0.98, // a row at least this × the eave-reference extent is an eave-layer candidate
  // (0.98, not 1.0: antialiased concept masks put near-max rows a pixel or two apart)
  skirtBandFrac: 0.2, // a bottom-anchored band within this fraction of the silhouette height that
  // is wider than the body above it is a plinth/water-table skirt, not the eave (T-139-01); the
  // eave anchors on the dominant wall band, never on the skirt. The protrusion threshold reuses
  // eaveWidthFrac (a skirt pokes beyond the body's own eave band); 0 ⇒ the legacy global-max ruler
  conceptMaxCoverage: 0.5, // a concept "silhouette" covering more of its frame than this did not
  // background-segment (a full illustrated scene, not a subject on black) — unusable, fall back
});

/**
 * Calibration evidence for `tolerance` (T-140-01, S-140) — NOT a per-building knob; the single
 * frozen value above explained against the committed E-33 cross-subject record. The methodology is
 * in docs/active/work/T-140-01/design.md; the cross-subject table is reproduced in the
 * ruler-calibration record. Conclusion: 0.15 SURVIVES — it is the tightest value consistent with
 * (i) passing the achieved post-loop barn ratios (~0.03) and (ii) flagging the barn seed ridge:eave
 * excess 0.164 that the loop itself chased as a real defect across all six rounds. The committed
 * evidence is bimodal (in-cluster ≤0.164, out-cluster ≥1.65) so it under-determines the exact
 * value: any threshold in [0.165, 1.65] partitions it identically — 0.164 is the sole boundary
 * point. The cottage 1.65/2.18 are OCCUPANCY-lens, plinth-confounded (T-139-01), so they corroborate
 * only the out-cluster. `value` is asserted equal to PROPORTION_DEFAULTS.tolerance by a test.
 */
export const TOLERANCE_CALIBRATION = Object.freeze({
  value: 0.15,
  derivedFrom: "E-33 committed proportion-witness records (barn, barn--saltcrag, cottage)",
  evidence: Object.freeze([
    Object.freeze({ subject: "barn", stage: "seed", ratio: "ridgeToEave", excess: 0.164, within: false, note: "the loop chased this as a real defect — the sole boundary point" }),
    Object.freeze({ subject: "barn", stage: "seed", ratio: "roofShare", excess: 0.1281, within: true }),
    Object.freeze({ subject: "barn", stage: "post-loop", ratio: "ridgeToEave", excess: 0.03, within: true, note: "T-138-01 landed ratios into tolerance (review finding 2)" }),
    Object.freeze({ subject: "cottage", stage: "final", ratio: "ridgeToEave", excess: 2.1813, within: false, note: "OCCUPANCY-lens, plinth-confounded (T-139-01) — out-cluster only" }),
    Object.freeze({ subject: "cottage", stage: "final", ratio: "roofShare", excess: 1.6546, within: false, note: "OCCUPANCY-lens, plinth-confounded" }),
  ]),
  conclusion: "survives — tightest value consistent with passing post-loop ~0.03 and flagging the barn seed 0.164 the loop chased; bimodal evidence under-determines it, 0.15 is not contradicted",
  ticket: "T-140-01",
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
 * Skirt-aware EAVE reference (T-139-01). The eave anchors on the dominant WALL band, not the global
 * max — a plinth/water-table course in the bottom `skirtBandFrac` of the silhouette that juts out
 * past the body above it must not become the eave line. Pure index arithmetic over the per-row
 * `extents`. `refExtent === maxExtent` whenever no skirt qualifies (every skirt-free mask) — so the
 * eave line is byte-identical there; `skirtBandFrac 0` collapses the bottom region → no skirt → the
 * legacy global-max ruler. Ridge keeps the global max (the T-118 protrusion guard is out of scope).
 * @returns {{refExtent:number, isSkirt:(i:number)=>boolean}}
 */
function eaveReference(extents, maxExtent, firstFg, lastFg, eaveFrac, skirtBandFrac) {
  const H = lastFg - firstFg + 1;
  const bandRows = Math.floor(skirtBandFrac * H);
  const bottomStart = lastFg - bandRows + 1; // first index of the bottom region (inclusive)
  // the body above the bottom region — must have at least one row to compare against
  let bodyMax = 0;
  for (let i = firstFg; i < bottomStart; i++) if (extents[i] > bodyMax) bodyMax = extents[i];
  const skirtThresh = bodyMax / eaveFrac; // beyond the body's own eave-tolerance band (AA guard)
  const isSkirt = (i) =>
    bottomStart > firstFg && i >= bottomStart && extents[i] > bodyMax && extents[i] >= skirtThresh;
  let anySkirt = false;
  for (let i = bottomStart; i <= lastFg; i++) if (isSkirt(i)) { anySkirt = true; break; }
  return { refExtent: anySkirt ? bodyMax : maxExtent, isSkirt };
}

/**
 * Eave/ridge/ground lines of a silhouette mask (occupancy projection OR extractSilhouette
 * output). Row extent = rightmost−leftmost+1 foreground within the row (holes don't thin it).
 * Returns null when the mask is empty/degenerate (no foreground, or no row clears the ridge
 * threshold — cannot happen with a non-empty mask since the max-extent row always does).
 * @param {{w:number,h:number,data:Uint8Array,bbox:object|null}} mask
 * @param {{ridgeMinWidthFrac?:number, eaveWidthFrac?:number, skirtBandFrac?:number}} [opts]
 * @returns {{ridgeRow:number, eaveRow:number, groundRow:number, totalH:number, eaveH:number,
 *            maxExtent:number}|null}
 */
export function maskProportions(mask, opts = {}) {
  if (!mask || !mask.data || !mask.bbox) return null;
  const ridgeFrac = opts.ridgeMinWidthFrac ?? PROPORTION_DEFAULTS.ridgeMinWidthFrac;
  const eaveFrac = opts.eaveWidthFrac ?? PROPORTION_DEFAULTS.eaveWidthFrac;
  const skirtBandFrac = opts.skirtBandFrac ?? PROPORTION_DEFAULTS.skirtBandFrac;
  const { w } = mask;
  const { x0, y0, x1, y1 } = mask.bbox;
  const extents = [];
  let maxExtent = 0;
  let firstFg = -1, lastFg = -1;
  for (let y = y0; y < y1; y++) {
    let lo = -1, hi = -1;
    const row = y * w;
    for (let x = x0; x < x1; x++) {
      if (!mask.data[row + x]) continue;
      if (lo < 0) lo = x;
      hi = x;
    }
    const extent = lo < 0 ? 0 : hi - lo + 1;
    const i = extents.push(extent) - 1;
    if (extent > maxExtent) maxExtent = extent;
    if (extent > 0) { if (firstFg < 0) firstFg = i; lastFg = i; }
  }
  if (maxExtent === 0) return null;
  // the eave anchors on the dominant wall band; a bottom plinth/skirt never reads as the eave
  const { refExtent, isSkirt } = eaveReference(extents, maxExtent, firstFg, lastFg, eaveFrac, skirtBandFrac);
  let ridgeRow = -1, eaveRow = -1, groundRow = -1;
  for (let i = 0; i < extents.length; i++) {
    const e = extents[i];
    if (e === 0) continue;
    const y = y0 + i;
    if (ridgeRow < 0 && e >= ridgeFrac * maxExtent) ridgeRow = y;
    if (eaveRow < 0 && !isSkirt(i) && e >= eaveFrac * refExtent) eaveRow = y;
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

/** Foreground fraction of the WHOLE frame (uses fgCount when the mask carries one). */
export function maskCoverage(mask) {
  if (!mask || !mask.data) return 0;
  let fg = mask.fgCount;
  if (!Number.isFinite(fg)) {
    fg = 0;
    for (let i = 0; i < mask.data.length; i++) if (mask.data[i]) fg++;
  }
  return fg / (mask.w * mask.h);
}

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
  // a mask that covers most of its frame is a failed background segmentation (the T-127 cottage
  // concept is a full illustrated scene, not a subject on black) — deterministic guard, recorded
  // through the per-ratio sources, never a silent bad number
  const usable = conceptMask && maskCoverage(conceptMask) <= PROPORTION_DEFAULTS.conceptMaxCoverage;
  const concept = usable ? targetsFromConceptMask(conceptMask) : { ridgeToEave: null, roofShare: null };
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

// --- pitch target (concept precedence, T-140-01) -----------------------------

const ratioToDeg = (ratio) => (Number.isFinite(ratio) ? r4((Math.atan(ratio) * 180) / Math.PI) : null);

/**
 * Concept-silhouette roof PITCH as a rise/run ratio (T-140-01), gated by the SAME segmentability
 * guard as the concept ridge:eave / roofShare targets (a full illustrated scene can't measure a
 * clean roofline). rise = the rows from the ridge line down to the eave line; run = half the widest
 * span (the eave half-width). Null when the mask is unusable, over-coverage, or degenerate — the
 * caller's recorded fallback trigger (never a silent default, E-33 Rule 1).
 */
export function conceptPitchRatio(conceptMask, opts = {}) {
  if (!conceptMask) return null;
  const maxCov = opts.conceptMaxCoverage ?? PROPORTION_DEFAULTS.conceptMaxCoverage;
  if (maskCoverage(conceptMask) > maxCov) return null; // failed background-segmentation
  const p = maskProportions(conceptMask, opts);
  if (!p) return null;
  const rise = p.eaveRow - p.ridgeRow; // rows are top-down: ridgeRow < eaveRow → positive roof height
  const run = p.maxExtent / 2;
  if (!(rise > 0) || !(run > 0)) return null;
  return r4(rise / run);
}

/**
 * The DECLARED pitch target with its source cited (T-140-01, AC3). The E-33 honesty rule ranks the
 * concept as the contract and the sketch as the fallback for ridge:eave/roofShare;
 * `deriveProportionDeclarations` already records that for those ratios — pitch now follows it:
 * when the concept silhouette is MEASURABLE its pitch wins; otherwise the sketch (which inherits
 * TRELLIS stair-step flattening). `steepDoor` is whether the snapped class would open the T-134
 * steep gable (`pitchClass > 1`, the compile.mjs roofIdiomForPitch boundary) — the headline number
 * for S-141/S-143. RECORDING ONLY: the realized build still snaps pitch from the sketch in
 * applyMeasuredProportions; since every committed subject's concept is unsegmentable the precedence
 * resolves to the sketch there anyway, so build replays stay byte-identical (AC4).
 * @param {{conceptMask?:object|null, sketch:object, pack:object}} args
 * @returns {{schema:string, source:string, ratio:number, deg:number, conceptRatio:number|null,
 *   sketchRatio:number|null, divergence:number|null, snapped:object, steepDoor:boolean,
 *   conceptSegmentable:boolean}}
 */
export function derivePitchTarget({ conceptMask = null, sketch, pack } = {}) {
  if (!sketch) fail("derivePitchTarget: sketch is required (the recorded fallback reference)");
  const classes = pack?.proportions?.pitchClasses;
  if (!Array.isArray(classes) || classes.length === 0) {
    fail("derivePitchTarget: pack.proportions.pitchClasses is required to snap the pitch target");
  }
  const conceptRatio = conceptMask ? conceptPitchRatio(conceptMask) : null;
  const tilt = sketch.pitch?.dominantTiltDeg;
  const sketchRatio = Number.isFinite(tilt) ? r4(Math.tan((tilt * Math.PI) / 180)) : null;
  const segmentable = conceptRatio !== null;
  let ratio, source;
  if (segmentable) { ratio = conceptRatio; source = "concept"; }
  else if (sketchRatio !== null) { ratio = sketchRatio; source = "sketch-fallback"; }
  else fail("derivePitchTarget: pitch is unmeasurable on both the concept and the sketch");
  const snapped = snapPitch(ratio, classes);
  return {
    schema: PITCH_TARGET_SCHEMA,
    source,
    ratio,
    deg: ratioToDeg(ratio),
    conceptRatio,
    conceptDeg: ratioToDeg(conceptRatio),
    sketchRatio,
    sketchDeg: ratioToDeg(sketchRatio),
    divergence: conceptRatio !== null && sketchRatio !== null ? r4(Math.abs(conceptRatio - sketchRatio)) : null,
    snapped,
    steepDoor: snapped.pitchClass > 1,
    conceptSegmentable: segmentable,
  };
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
 * @param {{lens?:"program"|"occupancy"}} [opts]  when `lens` is given, the result and every row are
 *   stamped with it (the OCCUPANCY ruler for a build-vs-target gate); OMITTED ⇒ byte-identical to
 *   the legacy shape, so committed records/replays are unchanged (T-140-01 AC4).
 * @returns {{pass:boolean, tolerance:number, lens?:string, rows:object[]}}
 */
export function compareRatios(measured, declared, opts = {}) {
  const decl = assertProportionDeclarations(declared);
  const lens = opts.lens;
  if (lens !== undefined && lens !== PROPORTION_LENS.PROGRAM && lens !== PROPORTION_LENS.OCCUPANCY) {
    fail(`compareRatios: opts.lens must be a PROPORTION_LENS value when given, got ${lens}`);
  }
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
  const result = {
    pass: rows.every((r) => r.withinTolerance !== false),
    tolerance: decl.tolerance,
    rows,
  };
  if (lens === undefined) return result; // legacy shape — committed records stay byte-identical
  return { pass: result.pass, tolerance: result.tolerance, lens, rows: rows.map((r) => ({ ...r, lens })) };
}
