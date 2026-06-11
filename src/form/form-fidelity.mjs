// Silhouette form-fidelity metric (T-043-01, story S-043, epic E-15) — the FORM hill-climb number.
//
// E-14 gave the surgical-revision loop a COLOR number (the concept↔render Δvalue gate). This module gives
// it the missing FORM number. Every `vConcept` build leaves a matched 3/4 pair on disk: `render-3q.png`
// (the built voxels, on a flat sky) and `concept.png` (the Nano-Banana reference, on solid black). Both are
// background-segmentable, so the **silhouette IoU** of their two binary masks is a real, computable
// form-fidelity score — and a **per-region IoU** (over an arbitrary sub-bounding-box) gives the loop a
// LOCAL accept signal, not just a whole-object one. This is the measurement S-045's accept-gate hill-climbs.
//
// PIPELINE: decode → background-segment each image to a binary silhouette → crop to the foreground bbox and
// normalize both to a common G×G occupancy grid (translation+scale invariant; proportion preserved) →
// intersection-over-union. Whole-object and region-restricted.
//
// PURE, GL-FREE, NETWORK-FREE, RNG-FREE. Reuses E-10's `isBackground` (palette-extract.mjs) for the
// per-pixel background test and `decodeImage` for the (isolated, lazy) decode — ZERO new segmentation or
// color math. The pixel core (`extractSilhouette`/`normalizeSilhouette`/`iou`/`regionIoU`/`formFidelity`)
// runs on plain RGBA buffers and binary masks with nothing mocked, so it lives under `src/**/*.test.mjs`;
// decode is isolated to `formFidelityFromPair`. Inputs are never mutated; all floats are rounded so output
// is byte-stable (a hill-climb cannot tolerate jitter).
//
// HONESTY LEDGER (what this number can and cannot see — mirrors the E-14 gate's self-critique):
//   1. SINGLE 3/4 VIEW. One side only; the back is invisible. A view-bounded proxy, not a 3-D score —
//      the same single-view reconstruction limit E-13/E-14 already acknowledge.
//   2. CAMERA MISMATCH. The render is exactly SCULPTURE_VIEW_3Q (azimuth 45°, elevation 30°); the concept
//      is only APPROXIMATELY 3/4 (Nano-Banana). Absolute IoU is depressed by this misalignment — the
//      metric's worth is the RELATIVE Δ between revisions that the loop reads, not the absolute value.
//   3. ALIGNMENT. We bbox-crop + scale (translation+scale invariant) and, by default (`fit:'aspect'`),
//      PRESERVE proportion — a koi elongated in the concept but stubby in the render correctly scores
//      lower, because proportion IS form (the exact E-13 failure mode). Rotation differences are NOT
//      corrected — they are treated as real defects. `fit:'stretch'` discards proportion instead.
//   4. BACKGROUND COLLATERAL. `isBackground` drops foreground pixels within tolerance of the background
//      color (dark-subject-on-black, sky-blue-subject-on-sky). Inherited, documented E-10 caveat.
//   5. SILHOUETTE ≠ FORM. Two different shapes can share an outline; IoU is necessary, not sufficient. The
//      cheap honest number — paired in the loop with the color gate, not a complete form judge.

import { isBackground, decodeImage } from "../color/palette-extract.mjs";

/** Schema tag stamped on results so downstream (the baseline, the S-045 gate) can version-check it. */
export const FORM_FIDELITY_SCHEMA = "form-fidelity/v1";

/** Tunable defaults for the whole-object comparison. */
export const FORM_DEFAULTS = Object.freeze({
  grid: 128, // common normalization grid (G×G) both silhouettes are resampled into
  fit: "aspect", // "aspect" = letterbox, keep proportion (default) | "stretch" = fill, discard proportion
  coverageThreshold: 0.5, // a target cell is foreground iff ≥ this fraction of its source pixels were fg
});

/** Segmentation preset for `render-3q.png`: the measured flat sky `#ADD8E6` (173,216,230). */
export const RENDER_BG = Object.freeze({ dropColor: [173, 216, 230], dropTolerance: 24, alphaThreshold: 128 });

/** Segmentation preset for `concept.png`: near-black `#000000`; tolerance widened to 40 for JPEG noise. */
export const CONCEPT_BG = Object.freeze({ dropColor: [0, 0, 0], dropTolerance: 40, alphaThreshold: 128 });

const round2 = (n) => Math.round(n * 100) / 100;
const round3 = (n) => Math.round(n * 1000) / 1000;

// --- silhouette extraction -------------------------------------------------

/**
 * Tight foreground bounding box of a binary mask (half-open: `[x0,x1) × [y0,y1)`), or `null` if empty.
 * @returns {{x0:number,y0:number,x1:number,y1:number}|null}
 */
function bboxOf(data, w, h) {
  let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      if (data[row + x]) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return null;
  return { x0, y0, x1: x1 + 1, y1: y1 + 1 }; // half-open
}

/**
 * Segment a decoded RGBA image into a foreground binary mask, dropping background per `bgOpts` (reusing
 * E-10's `isBackground`). Pure — no I/O.
 * @param {{width:number,height:number,data:Uint8Array|Buffer}} img
 * @param {{dropColor:number[]|null, dropTolerance:number, alphaThreshold:number}} bgOpts
 * @returns {{w:number,h:number,data:Uint8Array,fgCount:number,bbox:object|null}}
 */
export function extractSilhouette(img, bgOpts) {
  if (!img || !img.data || !img.width || !img.height) {
    throw new Error("extractSilhouette: img must be a decoded {width,height,data} RGBA image");
  }
  const { width: w, height: h, data } = img;
  const mask = new Uint8Array(w * h);
  let fgCount = 0;
  for (let p = 0; p < w * h; p++) {
    const i = p << 2;
    if (!isBackground(data[i], data[i + 1], data[i + 2], data[i + 3], bgOpts)) {
      mask[p] = 1;
      fgCount++;
    }
  }
  return { w, h, data: mask, fgCount, bbox: bboxOf(mask, w, h) };
}

// --- normalization / alignment ---------------------------------------------

/**
 * Normalize a silhouette mask to a common `G×G` occupancy grid via bbox-crop + resample. Pure.
 * `opts.bbox` overrides the crop window (default: the mask's own bbox) — T-109-01's
 * silhouette-residual pass normalizes a sub-mass mask under the FULL build's crop so both sides
 * share one frame; with no override the behavior is byte-identical to before.
 * @param {{w:number,h:number,data:Uint8Array,bbox:object|null}} mask  an `extractSilhouette` result
 * @param {{grid?:number, fit?:string, coverageThreshold?:number,
 *          bbox?:{x0:number,y0:number,x1:number,y1:number}|null}} [opts]
 * @returns {{w:number,h:number,data:Uint8Array,fgCount:number}}
 */
export function normalizeSilhouette(mask, opts = {}) {
  const G = opts.grid ?? FORM_DEFAULTS.grid;
  const fit = opts.fit ?? FORM_DEFAULTS.fit;
  const covThresh = opts.coverageThreshold ?? FORM_DEFAULTS.coverageThreshold;
  if (!Number.isInteger(G) || G < 1) throw new Error(`normalizeSilhouette: grid must be a positive integer, got ${G}`);
  if (fit !== "aspect" && fit !== "stretch") throw new Error(`normalizeSilhouette: fit must be 'aspect'|'stretch', got ${fit}`);
  const data = resampleInto(mask, G, fit, covThresh, opts.bbox ?? null);
  let fgCount = 0;
  for (let i = 0; i < data.length; i++) if (data[i]) fgCount++;
  return { w: G, h: G, data, fgCount };
}

/**
 * Crop a silhouette to its bbox and resample into a `G×G` occupancy grid by INVERSE mapping: each target
 * cell pulls the source window it covers and is foreground iff coverage ≥ `covThresh` (echoes image-grid's
 * `aggregateCells`, but pull-style so it is correct under both down- and up-sampling — no resampling gaps).
 * `fit:'aspect'` scales so the bbox's longer side fills G and centers the shorter side (letterbox —
 * proportion preserved); `fit:'stretch'` scales each axis independently to fill G².
 * @returns {Uint8Array}  length G·G
 */
function resampleInto(mask, G, fit, covThresh, bboxOverride = null) {
  const out = new Uint8Array(G * G);
  const { w: mw, data } = mask;
  const bbox = bboxOverride ?? mask.bbox;
  if (!bbox) return out;
  const bw = bbox.x1 - bbox.x0;
  const bh = bbox.y1 - bbox.y0;
  let tw, th, ox, oy;
  if (fit === "stretch") {
    tw = G; th = G; ox = 0; oy = 0;
  } else if (bw >= bh) {
    tw = G; th = Math.max(1, Math.round((G * bh) / bw)); ox = 0; oy = Math.floor((G - th) / 2);
  } else {
    th = G; tw = Math.max(1, Math.round((G * bw) / bh)); ox = Math.floor((G - tw) / 2); oy = 0;
  }
  for (let ty = 0; ty < th; ty++) {
    let sy0 = bbox.y0 + Math.floor((ty * bh) / th);
    let sy1 = bbox.y0 + Math.floor(((ty + 1) * bh) / th);
    if (sy1 <= sy0) sy1 = sy0 + 1; // upsampling: cover ≥1 source row
    for (let tx = 0; tx < tw; tx++) {
      let sx0 = bbox.x0 + Math.floor((tx * bw) / tw);
      let sx1 = bbox.x0 + Math.floor(((tx + 1) * bw) / tw);
      if (sx1 <= sx0) sx1 = sx0 + 1; // upsampling: cover ≥1 source col
      let fg = 0;
      let tot = 0;
      for (let sy = sy0; sy < sy1; sy++) {
        const row = sy * mw;
        for (let sx = sx0; sx < sx1; sx++) {
          tot++;
          if (data[row + sx]) fg++;
        }
      }
      if (tot > 0 && fg / tot >= covThresh) out[(oy + ty) * G + (ox + tx)] = 1;
    }
  }
  return out;
}

// --- IoU primitives --------------------------------------------------------

/**
 * Intersection-over-union of two binary masks of IDENTICAL dimensions. Identical masks → 1; disjoint
 * non-empty → 0; both-empty → 1 (vacuously identical — never NaN). Throws on dimension mismatch.
 * @param {{w:number,h:number,data:Uint8Array}} a
 * @param {{w:number,h:number,data:Uint8Array}} b
 * @returns {number}
 */
export function iou(a, b) {
  if (a.w !== b.w || a.h !== b.h) {
    throw new Error(`iou: masks must share dimensions (${a.w}×${a.h} vs ${b.w}×${b.h})`);
  }
  let inter = 0;
  let union = 0;
  const n = a.w * a.h;
  for (let i = 0; i < n; i++) {
    const ai = a.data[i] ? 1 : 0;
    const bi = b.data[i] ? 1 : 0;
    if (ai & bi) inter++;
    if (ai | bi) union++;
  }
  return union === 0 ? 1 : inter / union;
}

/**
 * IoU restricted to a region — a sub-bounding-box given as NORMALIZED `[0,1]` fractions of the grid
 * (`{x0,y0,x1,y1}`), so it is resolution-independent. Counts only cells whose CENTER lies inside the rect.
 * A box that contains all the overlap reproduces the whole `iou`; a box over a disjoint corner → 0; a
 * degenerate (zero-area or inverted) region → 0.
 * @returns {number}
 */
export function regionIoU(a, b, region) {
  if (a.w !== b.w || a.h !== b.h) {
    throw new Error(`regionIoU: masks must share dimensions (${a.w}×${a.h} vs ${b.w}×${b.h})`);
  }
  if (!region) throw new Error("regionIoU: region {x0,y0,x1,y1} (normalized 0..1) is required");
  const { x0, y0, x1, y1 } = region;
  if (!(x1 > x0) || !(y1 > y0)) return 0; // degenerate / inverted
  const { w, h } = a;
  const cx0 = x0 * w, cx1 = x1 * w, cy0 = y0 * h, cy1 = y1 * h;
  let inter = 0;
  let union = 0;
  for (let y = 0; y < h; y++) {
    const yc = y + 0.5;
    if (yc < cy0 || yc >= cy1) continue;
    const row = y * w;
    for (let x = 0; x < w; x++) {
      const xc = x + 0.5;
      if (xc < cx0 || xc >= cx1) continue;
      const ai = a.data[row + x] ? 1 : 0;
      const bi = b.data[row + x] ? 1 : 0;
      if (ai & bi) inter++;
      if (ai | bi) union++;
    }
  }
  return union === 0 ? 1 : inter / union;
}

// --- the orchestrator ------------------------------------------------------

const aspectOf = (bbox) => (bbox ? round3((bbox.x1 - bbox.x0) / (bbox.y1 - bbox.y0)) : null);

/**
 * THE FORM-FIDELITY SCORE. Segment the render (sky bg) and concept (black bg) into silhouettes, normalize
 * both to a common `G×G` grid, and compute whole-object IoU — plus a region IoU when `opts.region` is
 * given. Pure: operates on two already-decoded RGBA images; never mutates them; output is rounded/stable.
 *
 * @param {object} renderImg   decoded `{width,height,data}` of `render-3q.png`
 * @param {object} conceptImg  decoded `{width,height,data}` of `concept.png`
 * @param {{grid?:number, fit?:string, coverageThreshold?:number, renderBg?:object, conceptBg?:object,
 *          region?:object}} [opts]
 * @returns {{schema:string, grid:number, fit:string, iou:number, regionIoU?:number, region?:object,
 *   render:object, concept:object}}
 */
export function formFidelity(renderImg, conceptImg, opts = {}) {
  const grid = opts.grid ?? FORM_DEFAULTS.grid;
  const fit = opts.fit ?? FORM_DEFAULTS.fit;
  const coverageThreshold = opts.coverageThreshold ?? FORM_DEFAULTS.coverageThreshold;
  const renderBg = opts.renderBg ?? RENDER_BG;
  const conceptBg = opts.conceptBg ?? CONCEPT_BG;

  const rSil = extractSilhouette(renderImg, renderBg);
  const cSil = extractSilhouette(conceptImg, conceptBg);
  const rNorm = normalizeSilhouette(rSil, { grid, fit, coverageThreshold });
  const cNorm = normalizeSilhouette(cSil, { grid, fit, coverageThreshold });

  const result = {
    schema: FORM_FIDELITY_SCHEMA,
    grid,
    fit,
    iou: round3(iou(rNorm, cNorm)),
    render: sideStats(rSil),
    concept: sideStats(cSil),
  };
  if (opts.region) {
    result.region = opts.region;
    result.regionIoU = round3(regionIoU(rNorm, cNorm, opts.region));
  }
  return result;
}

/** Per-side reporting: foreground count, frame coverage, tight bbox, and proportion (aspect = w/h). */
function sideStats(sil) {
  return {
    fgCount: sil.fgCount,
    coverage: round3(sil.fgCount / (sil.w * sil.h)),
    bbox: sil.bbox,
    aspect: aspectOf(sil.bbox),
  };
}

// --- isolated decode shell (the only place decodeImage is used) ------------

/**
 * Decode a `render-3q.png` / `concept.png` pair and score their form fidelity. The only async, the only
 * `decodeImage` caller — keeps the pure core off the decode path.
 * @param {string} renderPath
 * @param {string} conceptPath
 * @param {object} [opts]  forwarded to {@link formFidelity}
 */
export async function formFidelityFromPair(renderPath, conceptPath, opts = {}) {
  const [renderImg, conceptImg] = await Promise.all([decodeImage(renderPath), decodeImage(conceptPath)]);
  return formFidelity(renderImg, conceptImg, opts);
}
