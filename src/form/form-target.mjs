// The per-region FORM TARGET the revision loop's accept step consults (T-047-01, story S-047, epic E-15).
//
// THE SEAM E-15 LEFT FOR THE IMAGE→3D TOOL. The loop's accept gate is a pure numeric compare
// (loop.mjs: `after > before + epsilon`); the only thing that knows WHAT the right shape is lives inside
// the `score` seam. Today that knowledge is a flat Nano-Banana CONCEPT image + the silhouette-IoU metric
// (T-043-01): "is this region the right shape" == "does the R-framed render's silhouette overlap the
// concept's." Down the line an image→3D tool (TRELLIS → GLB mesh, deferred in E-09) supplies a BETTER
// target — a real 3-D form the loop can project per-region instead of a single flat 3/4 silhouette.
//
// A FormTarget makes that swap a one-liner. It answers the accept step's one question:
//
//     scoreRender(renderPath, R, opts?) => Promise<number>   // [0,1] form-fidelity of the render vs the
//                                                            // target, framed on region R
//     kind: string                                           // provenance: "concept" | "glb" | …
//
// The loop consults ONLY `scoreRender`. Swapping concept→GLB changes which silhouette the metric compares
// against — NOT observe, NOT diagnose, NOT the accept gate. That invariant is the whole point of this
// module: `liveFormScore(cfg)` resolves a target from `cfg` and calls `scoreRender`; everything upstream
// is untouched.
//
// PURITY. Imports only the pure form metric (no GL, no model). `conceptFormTarget` takes an injectable
// `_fidelity` so the interface is unit-tested with zero PNG decode.

import {
  formFidelityFromPair,
  extractSilhouette,
  normalizeSilhouette,
  iou,
  RENDER_BG,
  FORM_DEFAULTS,
} from "./form-fidelity.mjs";
import { loadMeshFromGlb, rasterizeSilhouette } from "./glb-silhouette.mjs";
import { SCULPTURE_VIEW_3Q } from "../sculpture.mjs";

/** Schema tag for the form-target contract, so a caller/log can version-check the seam. */
export const FORM_TARGET_SCHEMA = "form-target/v1";

/** Was thrown by the GLB adapter stub before T-049-01 implemented it; retained for back-compat (no longer
 *  thrown — `glbFormTarget` is now live). Kept exported so any importer/test referencing it still resolves. */
export class FormTargetNotImplementedError extends Error {
  constructor(message) {
    super(message);
    this.name = "FormTargetNotImplementedError";
  }
}

/**
 * TODAY'S TARGET: the concept image + silhouette IoU (the heuristic form target). `scoreRender` renders
 * nothing itself — the caller (`liveFormScore`) has already produced the R-framed render PNG; this scores
 * that PNG's silhouette against the concept. Whole-object IoU by default; per-region 2-D IoU if `region`
 * is given (a normalized bbox — a true region-vs-region IoU needs a 3-D target, which is the GLB payoff).
 *
 * @param {object} cfg
 * @param {string} cfg.conceptPath  the concept reference PNG (the target silhouette source)
 * @param {number} [cfg.grid]       form-metric grid (forwarded to the metric)
 * @param {string} [cfg.fit]        "aspect" | "stretch" (forwarded)
 * @param {object} [cfg.region]     optional normalized 2-D bbox → regionIoU instead of whole-object iou
 * @param {Function} [cfg._fidelity] seam for tests; defaults to formFidelityFromPair
 * @returns {{kind:string, conceptPath:string, scoreRender:(renderPath:string, R:object)=>Promise<number>}}
 */
export function conceptFormTarget({ conceptPath, grid, fit, region, _fidelity = formFidelityFromPair } = {}) {
  if (!conceptPath) {
    throw new Error("conceptFormTarget: conceptPath (the concept reference PNG) is required");
  }
  return {
    kind: "concept",
    conceptPath,
    async scoreRender(renderPath /*, R */) {
      const opts = { grid, fit };
      if (region) opts.region = region;
      const result = await _fidelity(renderPath, conceptPath, opts);
      return region ? result.regionIoU : result.iou;
    },
  };
}

// --- the GLB form target (T-049-01, epic E-16) -----------------------------

/**
 * Map a build-VOXEL region AABB into the GLB's MESH coordinate space by the per-axis whole-AABB FRACTION
 * (the only honest bridge between a text→JSON voxel build and a TRELLIS mesh that share no origin/scale).
 * "R is the front-lower third of the build" ⇒ the front-lower third of the GLB. This makes EXPLICIT the
 * normalization the silhouette metric already assumes (per-object AABB correspondence): it corrects
 * translation + per-axis scale and leaves rotation/axis mismatch UNcorrected (a real, documented residual).
 *
 * A degenerate build axis (max==min) maps to the full mesh extent on that axis (no divide-by-zero); the
 * output is normalized so min ≤ max per axis. Pure — no I/O.
 *
 * @param {{min:number[],max:number[]}} subBounds   the voxel region (R.subBounds)
 * @param {{min:number[],max:number[]}} buildBounds the whole-build voxel AABB (artifactBounds)
 * @param {{min:number[],max:number[]}} meshBounds  the GLB's float AABB (mesh.bounds)
 * @returns {{min:number[],max:number[]}}  a 3-D AABB in mesh coords (rasterizeSilhouette's `region`)
 */
export function mapVoxelRegionToMesh(subBounds, buildBounds, meshBounds) {
  const min = [0, 0, 0];
  const max = [0, 0, 0];
  for (let a = 0; a < 3; a++) {
    const bspan = buildBounds.max[a] - buildBounds.min[a];
    const mspan = meshBounds.max[a] - meshBounds.min[a];
    // fraction of the build AABB this region spans (degenerate axis → whole [0,1] span)
    const f0 = bspan > 0 ? (subBounds.min[a] - buildBounds.min[a]) / bspan : 0;
    const f1 = bspan > 0 ? (subBounds.max[a] - buildBounds.min[a]) / bspan : 1;
    let lo = meshBounds.min[a] + f0 * mspan;
    let hi = meshBounds.min[a] + f1 * mspan;
    if (hi < lo) [lo, hi] = [hi, lo]; // keep min ≤ max under any inversion
    min[a] = lo;
    max[a] = hi;
  }
  return { min, max };
}

/**
 * The pure two-mask IoU kernel shared by `scoreRender` (region-clipped target) and `wholeObjectScore`
 * (whole target). Extract the build render's silhouette (sky bg), normalize BOTH it and the GLB target
 * mask to a common G×G grid (translation+scale invariant), and return their IoU. No fs, no GL, no decode —
 * `renderImg` is an already-decoded RGBA image; `targetMask` is an `extractSilhouette`-shaped mask.
 *
 * @param {object} cfg
 * @param {{w:number,h:number,data:Uint8Array,bbox:object|null}} cfg.targetMask  the GLB silhouette mask
 * @param {{width:number,height:number,data:Uint8Array|Buffer}} cfg.renderImg    decoded build render RGBA
 * @param {number} [cfg.grid]  normalization grid (default FORM_DEFAULTS.grid)
 * @param {string} [cfg.fit]   "aspect" | "stretch" (default FORM_DEFAULTS.fit)
 * @param {Function} [cfg._extract] seam for tests; defaults to extractSilhouette
 * @returns {number}  [0,1] silhouette IoU
 */
export function glbSilhouetteScore({ targetMask, renderImg, grid, fit, _extract = extractSilhouette }) {
  const g = grid ?? FORM_DEFAULTS.grid;
  const f = fit ?? FORM_DEFAULTS.fit;
  const renderSil = _extract(renderImg, RENDER_BG);
  const tNorm = normalizeSilhouette(targetMask, { grid: g, fit: f });
  const rNorm = normalizeSilhouette(renderSil, { grid: g, fit: f });
  return iou(tNorm, rNorm);
}

/**
 * THE GLB (image→3D / TRELLIS) FORM TARGET — Arm A of E-16, the implementation of the seam the concept
 * target left documented. Same `scoreRender(renderPath, R)` interface as `conceptFormTarget`, so it is a
 * DROP-IN: `liveFormScore({ formTarget: glbFormTarget({ glbPath, buildBounds }) })` needs ZERO change to
 * the loop body, observe, diagnose, or the accept gate (the seam invariant — proven by the swap test).
 *
 * What it answers, and why it is better than the flat concept:
 *   - `scoreRender(renderPath, R)` → the **true per-region IoU**: map R (a voxel AABB) into mesh space
 *     ({@link mapVoxelRegionToMesh}), clip the GLB silhouette to that 3-D region (T-048-01
 *     `rasterizeSilhouette(mesh,{region})`), and IoU it against the R-framed build render's silhouette.
 *     This is region-vs-region in 3-D — the signal the flat single-view concept silhouette could not give.
 *     If `buildBounds` is omitted there is no region to map → it falls back to the whole-object IoU.
 *   - `wholeObjectScore(renderPath)` → the whole-object IoU (no region clip), for the A/B harness's
 *     before/after verdict against the E-13 baseline (the analogue of the concept run's `wholeObjectIoU`).
 *
 * HONESTY LEDGER: single 3/4 view; the GLB and build share no origin/scale (normalization removes
 * translation + uniform scale) and rotation/axis mismatch is NOT corrected (a genuinely mis-oriented GLB
 * scores low — a real, possibly confounding residual); silhouette ≠ form. The loop reads the relative Δ.
 *
 * PURITY: the 5 MB GLB is lazy-read + memoized; the pure kernel ({@link mapVoxelRegionToMesh},
 * {@link glbSilhouetteScore}) is unit-tested with zero I/O, and `_loadMesh`/`_rasterize`/`_decode` are
 * injectable so the adapter itself is exercised without the asset, GL, or a PNG decode.
 *
 * @param {object} cfg
 * @param {string} cfg.glbPath                       the .glb on disk (read once, lazily)
 * @param {object} [cfg.buildBounds]                 the whole-build voxel AABB (artifactBounds) — enables
 *                                                   the per-region map; omit for whole-object-only scoring
 * @param {object} [cfg.view]                        view partial (default SCULPTURE_VIEW_3Q)
 * @param {number} [cfg.grid]                        normalization grid (default FORM_DEFAULTS.grid)
 * @param {string} [cfg.fit]                         "aspect" | "stretch" (default FORM_DEFAULTS.fit)
 * @param {Function} [cfg._loadMesh]                 seam: glbPath → mesh (default fs read + loadMeshFromGlb)
 * @param {Function} [cfg._rasterize]                seam: (mesh,opts) → mask (default rasterizeSilhouette)
 * @param {Function} [cfg._decode]                   seam: path → decoded RGBA (default decodeImage)
 * @returns {{kind:string, glbPath:string, scoreRender:Function, wholeObjectScore:Function}}
 */
export function glbFormTarget({
  glbPath,
  buildBounds,
  view = SCULPTURE_VIEW_3Q,
  grid,
  fit,
  _loadMesh,
  _rasterize = rasterizeSilhouette,
  _decode,
} = {}) {
  if (!glbPath && !_loadMesh) {
    throw new Error("glbFormTarget: glbPath (the TRELLIS .glb) is required");
  }

  let meshPromise = null;
  const loadMesh = () => {
    if (!meshPromise) {
      meshPromise = (async () => {
        if (_loadMesh) return _loadMesh(glbPath);
        const { readFileSync } = await import("node:fs"); // lazy — keeps the module top level fs/GL-free
        return loadMeshFromGlb(readFileSync(glbPath));
      })();
    }
    return meshPromise;
  };

  const decode = async (path) => {
    if (_decode) return _decode(path);
    const { decodeImage } = await import("../color/palette-extract.mjs"); // lazy — isolate the decode
    return decodeImage(path);
  };

  const score = async (renderPath, region) => {
    const mesh = await loadMesh();
    const targetMask = _rasterize(mesh, region ? { view, region } : { view });
    const renderImg = await decode(renderPath);
    return glbSilhouetteScore({ targetMask, renderImg, grid, fit });
  };

  return {
    kind: "glb",
    glbPath,
    /** The loop's accept signal: the true per-region IoU (whole-object if buildBounds is absent). */
    async scoreRender(renderPath, R) {
      const mesh = await loadMesh();
      const region =
        buildBounds && R && R.subBounds ? mapVoxelRegionToMesh(R.subBounds, buildBounds, mesh.bounds) : undefined;
      return score(renderPath, region);
    },
    /** The harness's verdict signal: whole-object IoU (no region clip). */
    async wholeObjectScore(renderPath) {
      return score(renderPath, undefined);
    },
  };
}

/**
 * Resolve the form target the accept step consults — the ONE place the default is chosen, so a future
 * caller passes `{ formTarget: glbFormTarget(…) }` and nothing else in the loop moves.
 *   - `cfg.formTarget` present → returned as-is (duck-typed pass-through; any object with `scoreRender`).
 *   - else `cfg.conceptPath`   → a `conceptFormTarget` (today's default).
 *   - else                     → throw (the loop has no target to score against).
 *
 * @param {{formTarget?:object, conceptPath?:string, grid?:number, fit?:string, region?:object}} [cfg]
 * @returns {{kind:string, scoreRender:Function}}
 */
export function resolveFormTarget(cfg = {}) {
  if (cfg.formTarget) return cfg.formTarget;
  if (cfg.conceptPath) {
    return conceptFormTarget({ conceptPath: cfg.conceptPath, grid: cfg.grid, fit: cfg.fit, region: cfg.region });
  }
  throw new Error(
    "resolveFormTarget: no form target — pass cfg.formTarget (a {scoreRender} object) or cfg.conceptPath " +
      "(a concept reference PNG for the default concept target)",
  );
}
