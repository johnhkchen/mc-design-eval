// The per-region MATERIAL TARGET the concept-refine loop's accept step consults (T-073-01, S-073, E-21).
//
// THE MATERIAL ANALOGUE OF form-target.mjs. E-15's surgical loop is target-agnostic: its accept gate is a
// pure numeric compare (`after > before + epsilon`); the only thing that knows WHAT is right lives behind
// the `score` seam. form-target.mjs answers "is this region the right SHAPE" with silhouette IoU; this
// module answers "is this region the right MATERIAL/COLOUR" with a deterministic colour-agreement metric.
// Same contract: `scoreRender(renderPath, R) => Promise<number>` in [0,1]. Swapping form→material is the
// E-16 seam move (concept→GLB) again — the loop body, observe, diagnose router, and accept gate are
// UNCHANGED; only which target the score seam resolves changes.
//
// WHY DETERMINISTIC, NOT AN LLM JUDGE (the E-15 lesson). A hill-climb accept gate cannot tolerate model
// variance — the form loop's gate is deterministic IoU; the model only PROPOSES edits. So the material
// gate is a deterministic colour-distribution agreement, NOT a per-iteration multimodal judgment. The
// semantic zoning intelligence enters via the PROPOSER (src/revise/material-edit.mjs), exactly as the
// form editor proposes shape edits the deterministic IoU then accepts or rolls back.
//
// HONESTY LEDGER. The R-framed build render's foreground colour distribution is compared (cluster to
// cluster) against the concept's. By default the concept is taken WHOLE (no 2-D region clip — mapping R's
// 3-D voxel bounds into the concept's 2-D frame needs a projection the form target also punted on), so the
// per-region signal is "do this region's colours appear in the concept" — a monotone nudge toward
// concept-present materials + a no-regression guard, NOT an independent re-discovery of the zoning. For
// NEAR-TONE materials (cobble vs stone_bricks) the ΔE is small, so the gate's signal there is weak by
// construction; the proposer supplies the semantics. (Same divergence E-16 documented: per-region gate ≠
// whole-object verdict.)
//
// PURITY. The colour kernel (`colorAgreement`, `regionColorClusters`) reuses the E-10 engine
// (aggregateForeground/medianCutLab/deltaE) — NO new colour math — and is unit-tested with zero PNG decode
// via injectable `_decode`. `liveMaterialScore` is the one GL leaf (lazy `observeRegion`), not unit-tested.

import { aggregateForeground, medianCutLab, DEFAULTS as EXTRACT_DEFAULTS } from "../color/palette-extract.mjs";
import { deltaE } from "../color/cielab.mjs";

/** Schema tag for the material-target contract, so a caller/log can version-check the seam. */
export const MATERIAL_TARGET_SCHEMA = "material-target/v1";

/** Defaults: k clusters per image; ΔEmax = the CIE76 distance at which agreement bottoms out at 0. */
export const MATERIAL_TARGET_DEFAULTS = Object.freeze({ k: 6, deltaEMax: 40 });

/**
 * Cluster a decoded RGBA image's FOREGROUND colours into `k` dominant clusters with coverage. Reuses the
 * E-10 foreground aggregation (drops sky/bg) + median-cut. An optional normalized 2-D `region` bbox
 * (`{x0,y0,x1,y1}` in [0,1]) clips the pixel set to that crop before aggregation. PURE.
 * @param {{width:number,height:number,data:Uint8Array|Buffer}} img  decoded RGBA
 * @param {{k?:number, region?:{x0:number,y0:number,x1:number,y1:number}, dropColor?:number[]|null,
 *          dropTolerance?:number, alphaThreshold?:number}} [opts]
 * @returns {{clusters:Array<{lab:number[], coverage:number}>, foregroundPx:number}}
 */
export function regionColorClusters(img, opts = {}) {
  const k = opts.k ?? MATERIAL_TARGET_DEFAULTS.k;
  const aggImg = opts.region ? clipImage(img, opts.region) : img;
  const aggOpts = {
    dropColor: opts.dropColor !== undefined ? opts.dropColor : EXTRACT_DEFAULTS.dropColor,
    dropTolerance: opts.dropTolerance !== undefined ? opts.dropTolerance : EXTRACT_DEFAULTS.dropTolerance,
    alphaThreshold: opts.alphaThreshold !== undefined ? opts.alphaThreshold : EXTRACT_DEFAULTS.alphaThreshold,
  };
  const { points, foregroundPx } = aggregateForeground(aggImg, aggOpts);
  if (foregroundPx === 0) return { clusters: [], foregroundPx: 0 };
  const clusters = medianCutLab(points, k).map((c) => ({ lab: c.lab, coverage: c.count / foregroundPx }));
  return { clusters, foregroundPx };
}

/** Crop a decoded RGBA image to a normalized [0,1] bbox, returning a fresh smaller RGBA image. PURE. */
function clipImage({ width, height, data }, { x0, y0, x1, y1 }) {
  const cx0 = Math.max(0, Math.min(width - 1, Math.floor(x0 * width)));
  const cy0 = Math.max(0, Math.min(height - 1, Math.floor(y0 * height)));
  const cx1 = Math.max(cx0 + 1, Math.min(width, Math.ceil(x1 * width)));
  const cy1 = Math.max(cy0 + 1, Math.min(height, Math.ceil(y1 * height)));
  const w = cx1 - cx0;
  const h = cy1 - cy0;
  const out = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const si = ((cy0 + y) * width + (cx0 + x)) << 2;
      const di = (y * w + x) << 2;
      out[di] = data[si];
      out[di + 1] = data[si + 1];
      out[di + 2] = data[si + 2];
      out[di + 3] = data[si + 3];
    }
  }
  return { width: w, height: h, data: out };
}

/**
 * THE ACCEPT-METRIC KERNEL: coverage-weighted colour agreement of a render's clusters against a target's
 * (the concept's). For each render cluster, find its NEAREST target cluster (CIE76 ΔE), turn the distance
 * into a similarity `1 − min(ΔE, deltaEMax)/deltaEMax` ∈ [0,1], and average weighted by render coverage
 * (Σcoverage ≈ 1). 1 = every render colour sits on a concept colour; 0 = all are ≥ deltaEMax away. PURE,
 * deterministic, GL-free — the hill-climbable signal. Empty render clusters → 0 (nothing to agree).
 * @param {{renderClusters:Array<{lab:number[],coverage:number}>,
 *          conceptClusters:Array<{lab:number[],coverage:number}>, deltaEMax?:number}} args
 * @returns {number}
 */
export function colorAgreement({ renderClusters, conceptClusters, deltaEMax = MATERIAL_TARGET_DEFAULTS.deltaEMax }) {
  if (!renderClusters?.length || !conceptClusters?.length) return 0;
  let sum = 0;
  let wsum = 0;
  for (const rc of renderClusters) {
    let best = Infinity;
    for (const cc of conceptClusters) {
      const d = deltaE(rc.lab, cc.lab);
      if (d < best) best = d;
    }
    const sim = 1 - Math.min(best, deltaEMax) / deltaEMax;
    sum += sim * rc.coverage;
    wsum += rc.coverage;
  }
  return wsum > 0 ? sum / wsum : 0;
}

/**
 * TODAY'S TARGET: the concept image + colour-distribution agreement. `scoreRender` decodes the (already
 * R-framed) build render and scores its colour clusters against the concept's. The concept is decoded ONCE
 * (memoized). Whole-concept by default; a normalized 2-D `region` clips it. `wholeObjectScore` is the AC
 * verdict signal (the whole render vs the whole concept). `_decode` is injectable for tests (zero PNG).
 * @param {{conceptPath?:string, k?:number, deltaEMax?:number, region?:object,
 *          _decode?:(path:string)=>Promise<object>}} cfg
 * @returns {{kind:string, conceptPath:string, scoreRender:Function, wholeObjectScore:Function}}
 */
export function conceptMaterialTarget(cfg = {}) {
  const { conceptPath, k, deltaEMax, region, _decode } = cfg;
  if (!conceptPath && !_decode) {
    throw new Error("conceptMaterialTarget: conceptPath (the concept reference PNG) is required");
  }
  const decode = async (path) => {
    if (_decode) return _decode(path);
    const { decodeImage } = await import("../color/palette-extract.mjs"); // lazy — isolate the PNG decode
    return decodeImage(path);
  };

  let conceptPromise = null;
  const conceptClustersFor = (reg) => {
    // Memoize ONLY the whole-concept clusters (the common case); a region clip recomputes (rare).
    if (reg) return decode(conceptPath).then((img) => regionColorClusters(img, { k, region: reg }).clusters);
    if (!conceptPromise) {
      conceptPromise = decode(conceptPath).then((img) => regionColorClusters(img, { k }).clusters);
    }
    return conceptPromise;
  };

  const score = async (renderPath, reg) => {
    const conceptClusters = await conceptClustersFor(reg);
    const renderImg = await decode(renderPath);
    const renderClusters = regionColorClusters(renderImg, { k }).clusters;
    return colorAgreement({ renderClusters, conceptClusters, deltaEMax });
  };

  return {
    kind: "concept",
    conceptPath,
    /** The loop's accept signal: the R-framed render's colour agreement with the concept (region or whole). */
    async scoreRender(renderPath /*, R */) {
      return score(renderPath, region);
    },
    /** The harness's verdict signal: whole render vs whole concept (no region clip). */
    async wholeObjectScore(renderPath) {
      return score(renderPath, undefined);
    },
  };
}

/**
 * Resolve the material target the accept step consults — the ONE place the default is chosen, mirroring
 * `resolveFormTarget`. `cfg.materialTarget` pass-through (any object with `scoreRender`); else
 * `cfg.conceptPath` → a `conceptMaterialTarget`; else throw.
 * @param {{materialTarget?:object, conceptPath?:string, k?:number, deltaEMax?:number, region?:object}} [cfg]
 * @returns {{kind:string, scoreRender:Function}}
 */
export function resolveMaterialTarget(cfg = {}) {
  if (cfg.materialTarget) return cfg.materialTarget;
  if (cfg.conceptPath) {
    return conceptMaterialTarget({ conceptPath: cfg.conceptPath, k: cfg.k, deltaEMax: cfg.deltaEMax, region: cfg.region });
  }
  throw new Error(
    "resolveMaterialTarget: no material target — pass cfg.materialTarget (a {scoreRender} object) or " +
      "cfg.conceptPath (a concept reference PNG for the default concept material target)",
  );
}

/**
 * THE LIVE MATERIAL SCORE (the GL seam — NOT unit-tested, pulls headless render). Returns an async
 * `score(artifact, R) => number` for the loop's `score` seam: render the artifact R-framed via
 * `observeRegion` (the same crop the loop revises) to a temp PNG, then score its colour agreement against
 * the resolved material target. LAZY-imports the render stack so importing this module for the pure tests
 * loads no GL. Mirrors `liveFormScore` exactly — the loop is unchanged.
 * @param {{conceptPath?:string, materialTarget?:object, k?:number, deltaEMax?:number, view?:object,
 *          width?:number, height?:number}} [cfg]
 * @returns {(artifact:object, R:object) => Promise<number>}
 */
export function liveMaterialScore(cfg = {}) {
  return async (artifact, R) => {
    const { observeRegion } = await import("../revise/region.mjs");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const target = resolveMaterialTarget(cfg);
    const outPath = join(tmpdir(), `material-loop-score-${R.subBounds.min.join("_")}.png`);
    await observeRegion(artifact, R, {
      outPath,
      view: cfg.view,
      width: cfg.width ?? 512,
      height: cfg.height ?? 512,
    });
    return target.scoreRender(outPath, R);
  };
}
