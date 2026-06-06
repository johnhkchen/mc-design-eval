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

import { formFidelityFromPair } from "./form-fidelity.mjs";

/** Schema tag for the form-target contract, so a caller/log can version-check the seam. */
export const FORM_TARGET_SCHEMA = "form-target/v1";

/** Thrown by the GLB adapter point — the seam exists this phase, the GLB does not. */
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

/**
 * THE DOCUMENTED GLB ADAPTER POINT (seam only this phase — NO GLB/TRELLIS code; that is deferred E-09).
 *
 * When the image→3D tool lands, a GLB target implements the SAME interface:
 *
 *     glbFormTarget({ glbPath, view = SCULPTURE_VIEW_3Q }) => {
 *       kind: "glb",
 *       async scoreRender(renderPath, R) {
 *         // 1. render the GLB mesh from `view`, masked to R's projected bounds → target silhouette
 *         // 2. extract the build render's silhouette (same metric pipeline as today)
 *         // 3. return iou(targetSilhouette, buildSilhouette)   // OR a true regionIoU, now well-defined
 *       }
 *     }
 *
 * Because the loop consults ONLY `scoreRender(renderPath, R)`, dropping this in needs NO change to
 * `observe`, `diagnose`, or the accept gate — the caller just passes `liveFormScore({ formTarget:
 * glbFormTarget({ glbPath }) })`. The flat-concept's whole-object-only limitation (no honest
 * region-vs-region signal) is exactly what a 3-D target resolves. Until then this throws.
 *
 * @param {object} [opts]  reserved for { glbPath, view }
 * @throws {FormTargetNotImplementedError}
 */
export function glbFormTarget(opts = {}) {
  void opts;
  throw new FormTargetNotImplementedError(
    "glbFormTarget: the GLB (image→3D / TRELLIS) form target is deferred (E-09) — this is the documented " +
      "adapter point only. A GLB target implements the same scoreRender(renderPath, R) interface; swapping " +
      "it in needs no change to observe/diagnose/accept. See src/form/form-target.mjs.",
  );
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
