// GLB-voxel MATERIAL-REGION SEGMENTATION — E-18 rung R-seg (T-058-01, story S-058, epic E-18).
//
// R2 (material-clean.mjs) NARROWED the speckle but did not kill it: a per-voxel snap to a small palette
// plus a radius-1 majority denoise is purely LOCAL — an isolated off-colour voxel whose neighbourhood is
// split survives as a speck, and a smooth texture gradient still scatters into near-duplicate blocks. This
// pass replaces "per-voxel snap + weak smoother" with REGIONAL coherence, under a TIGHT FIXED PALETTE.
// It targets the two named symptoms (the directives) head-on:
//   • PALETTE LEAKAGE — extract a SMALL fixed palette from the GLB's own texture (E-10) and NEVER place a
//     block outside it. Region fill ⇒ distinct-block ≈ palette size, off-palette = 0 by construction.
//   • GRADIENTS — a smooth gradient grows into ONE region with a large Lab spread; instead of one flat
//     block (kills the shading) or per-voxel snap (the speckle), it is BANDED: an ordered (Bayer) dither
//     between ADJACENT palette steps along the region's gradient axis — ≤2 blocks across any transition,
//     monotonic, not random.
// Pipeline: tight palette → per-cell Lab → grow regions (connected components by ΔE) → absorb specks →
// per-region fill (flat → one block; gradient → band) → optional in-palette E-11 texture → keysToArtifact.
//
// PURITY (the load-bearing split, same as material-clean.mjs / glb-voxel-build.mjs). segmentMaterials takes
// an ALREADY-DECODED texture and is FULLY PURE (no GL, no WebP, no GLB, no network, NO Math.random — all
// per-cell variation is the deterministic cellHash / ordered Bayer matrix). Unit-tested offline on
// synthetic occupancy + atlas. segmentMaterialsGlb ties parse + voxelize + sample + segment, IMPURE only
// through an INJECTED decodeTexture.
// REUSE, NOT REIMPLEMENTATION: the tight palette is E-10 (extractTexturePalette), the per-voxel sample is
// E-16 (sampleSurfaceColors), the ΔE engine is E-10 (deltaE/nearestLab/srgbToLab), the artifact build is
// the shared keysToArtifact, the speckle metric is R2's speckleScore (re-exported), the optional texture is
// E-11 (hueFamilySet/pickMaterial/cellHash). No new colour math.
//
// The core does NOT validate — the AJV gate (src/artifact.mjs) is a consumer-side assert (round-trip).

import { extractTexturePalette, speckleScore } from "./material-clean.mjs";
import { sampleSurfaceColors, keysToArtifact } from "./glb-voxel-build.mjs";
import { augmentPalette } from "./palette-augment.mjs";
import { voxelizeGlb, occupiedCells } from "./glb-voxelize.mjs";
import { parseGlbColoredSurface } from "./glb-mesh.mjs";
import { srgbToLab, deltaE, nearestLab, nearestFlat } from "../color/cielab.mjs";
import { hueFamilySet, pickMaterial, cellHash, tableKey } from "../sculptor/material.mjs";
import { DEFAULT_SCALE } from "../sculpture.mjs";

export { speckleScore }; // one import site for the runner (the before/after metric lives in R2's module)

/** Tunables (design.md; tuned on the sweep, plan.md Step 5). growDE < gradDE: a material's internal noise
 *  grows together while a smooth gradient stays one region yet trips the gradient test. growDE is generous
 *  (20) and minRegion absorbs specks up to 8 cells — both cut surface FRAGMENTATION, the dominant speckle
 *  source on organic subjects (fewer regions → fewer inter-region boundaries). All ΔE in the CIE76 space
 *  the whole stack uses. */
export const SEG_DEFAULTS = Object.freeze({ k: 6, growDE: 22, gradDE: 25, minRegion: 12, neighbourhood: 6 });

/** The style stamped on a segmented build (distinct from R1 "glb-voxel" and R2 "glb-voxel-clean"). */
export const MATERIAL_SEG_STYLE = Object.freeze({
  name: "glb-voxel-seg",
  rationale:
    "Voxelized from a 3-D GLB mesh; cells grouped into contiguous same-material regions (connected " +
    "components by CIE-Lab ΔE) under a tight fixed palette extracted from the GLB's own texture (E-10), " +
    "each region filled with one palette block and gradients banded — regional coherence, not per-voxel noise.",
});

// --- small internals --------------------------------------------------------

const DIRS6 = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const DIRS26 = (() => {
  const d = [];
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) if (i || j || k) d.push([i, j, k]);
  return d;
})();

/** 4×4 ordered (Bayer) dither matrix, normalised into (0,1). Deterministic, structured — not random. */
const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
function bayer(a, b) {
  return (BAYER4[((a % 4) + 4) % 4][((b % 4) + 4) % 4] + 0.5) / 16;
}

/** Build a "i,j,k" → cell-index map over the occupied cells (occupiedCells order). */
function indexCells(occupancy) {
  const index = new Map();
  let n = 0;
  for (const [i, j, k] of occupiedCells(occupancy)) {
    index.set(`${i},${j},${k}`, n);
    n++;
  }
  return index;
}

/** The Lab triple of cell index `ci` from a flat labs array. */
function labAt(labs, ci) {
  return [labs[ci * 3], labs[ci * 3 + 1], labs[ci * 3 + 2]];
}

/** A Set of the palette's bare keys (membership checks for the palette-discipline metric). */
function paletteKeySet(palette) {
  return new Set(palette.map((e) => e.key));
}

// --- per-cell Lab -----------------------------------------------------------

/**
 * Convert flat per-cell rgb (occupiedCells order) to flat per-cell Lab. PURE.
 * @param {Uint8Array|number[]} colors flat rgb, 3 per cell
 * @returns {Float64Array} flat Lab, 3 per cell
 */
export function cellLabs(colors) {
  const count = colors.length / 3;
  const out = new Float64Array(count * 3);
  for (let n = 0; n < count; n++) {
    const lab = srgbToLab([colors[n * 3], colors[n * 3 + 1], colors[n * 3 + 2]]);
    out[n * 3] = lab[0];
    out[n * 3 + 1] = lab[1];
    out[n * 3 + 2] = lab[2];
  }
  return out;
}

// --- region growth (connected components by Lab ΔE) -------------------------

/**
 * Group occupied cells into contiguous same-material regions: a 6- (or 26-) neighbour flood fill where two
 * adjacent occupied cells join the same region iff `deltaE(labA, labB) ≤ growDE`. A smooth gradient (small
 * adjacent ΔE) grows into ONE region with a large total spread; a flat-but-noisy patch grows into one
 * region with small spread — the two symptoms separate naturally (design.md Decision 3). PURE; deterministic
 * (cells within a region are returned in ascending cell-index order). Never touches occupancy.
 * @param {{occupied:Int32Array, count:number}} occupancy
 * @param {Float64Array} labs flat Lab, 3 per cell, occupiedCells order
 * @param {{growDE?:number, neighbourhood?:6|26}} [opts]
 * @returns {{ labelOf:Int32Array, regions:{label:number, cells:number[]}[] }}
 */
export function growRegions(occupancy, labs, { growDE = SEG_DEFAULTS.growDE, neighbourhood = SEG_DEFAULTS.neighbourhood } = {}) {
  const cellCoords = [...occupiedCells(occupancy)];
  const count = cellCoords.length;
  const index = indexCells(occupancy);
  const dirs = neighbourhood === 26 ? DIRS26 : DIRS6;
  const labelOf = new Int32Array(count).fill(-1);
  const regions = [];
  for (let start = 0; start < count; start++) {
    if (labelOf[start] !== -1) continue;
    const label = regions.length;
    const cells = [];
    const queue = [start];
    labelOf[start] = label;
    while (queue.length) {
      const ci = queue.pop();
      cells.push(ci);
      const [i, j, k] = cellCoords[ci];
      const la = labAt(labs, ci);
      for (const [di, dj, dk] of dirs) {
        const m = index.get(`${i + di},${j + dj},${k + dk}`);
        if (m === undefined || labelOf[m] !== -1) continue;
        if (deltaE(la, labAt(labs, m)) <= growDE) {
          labelOf[m] = label;
          queue.push(m);
        }
      }
    }
    cells.sort((a, b) => a - b);
    regions.push({ label, cells });
  }
  return { labelOf, regions };
}

/** Lab bounding box + count-weighted-free mean over a region's cells; `spread` = the bbox diagonal. PURE. */
export function regionStats(region, labs) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  const sum = [0, 0, 0];
  for (const ci of region.cells) {
    for (let d = 0; d < 3; d++) {
      const v = labs[ci * 3 + d];
      if (v < min[d]) min[d] = v;
      if (v > max[d]) max[d] = v;
      sum[d] += v;
    }
  }
  const n = region.cells.length || 1;
  const mean = [sum[0] / n, sum[1] / n, sum[2] / n];
  const spread = Math.sqrt((max[0] - min[0]) ** 2 + (max[1] - min[1]) ** 2 + (max[2] - min[2]) ** 2);
  return { min, max, mean, spread };
}

/** Rebuild the regions list (with sorted cells) from a labelOf array. */
function regionsFromLabels(labelOf) {
  const byLabel = new Map();
  for (let ci = 0; ci < labelOf.length; ci++) {
    const l = labelOf[ci];
    let cells = byLabel.get(l);
    if (!cells) byLabel.set(l, (cells = []));
    cells.push(ci);
  }
  const regions = [];
  for (const [label, cells] of byLabel) regions.push({ label, cells });
  regions.sort((a, b) => a.cells[0] - b.cells[0]);
  return regions;
}

/**
 * Absorb each region smaller than `minRegion` into the 6-adjacent region whose MEAN Lab is nearest — the
 * "off-colour singleton absorbed" cure (design.md Decision 4). Smallest-first, deterministic tie-break
 * (first-cell index); iterates until stable so a chain of specks resolves. PURE; relabels only, never
 * touches occupancy. A speck with no differently-labelled neighbour keeps its own region (then its own
 * nearest-palette fill).
 * @param {{labelOf:Int32Array, regions:object[]}} state from {@link growRegions}
 * @param {{occupied:Int32Array, count:number}} occupancy
 * @param {Float64Array} labs
 * @param {{minRegion?:number}} [opts]
 * @returns {{labelOf:Int32Array, regions:{label:number, cells:number[]}[]}}
 */
export function absorbSmallRegions(state, occupancy, labs, { minRegion = SEG_DEFAULTS.minRegion } = {}) {
  const labelOf = state.labelOf.slice();
  const cellCoords = [...occupiedCells(occupancy)];
  const index = indexCells(occupancy);
  let guard = 0;
  let changed = true;
  while (changed && guard++ <= cellCoords.length) {
    changed = false;
    const regions = regionsFromLabels(labelOf);
    const means = new Map();
    for (const r of regions) means.set(r.label, regionStats(r, labs).mean);
    const small = regions
      .filter((r) => r.cells.length < minRegion)
      .sort((a, b) => a.cells.length - b.cells.length || a.cells[0] - b.cells[0]);
    for (const r of small) {
      const myLabel = labelOf[r.cells[0]];
      const adj = new Set();
      for (const ci of r.cells) {
        const [i, j, k] = cellCoords[ci];
        for (const [di, dj, dk] of DIRS6) {
          const m = index.get(`${i + di},${j + dj},${k + dk}`);
          if (m === undefined) continue;
          const lm = labelOf[m];
          if (lm !== myLabel) adj.add(lm);
        }
      }
      if (adj.size === 0) continue;
      let best = -1;
      let bestD = Infinity;
      const myMean = means.get(myLabel) ?? regionStats(r, labs).mean;
      for (const lab of adj) {
        const d = deltaE(myMean, means.get(lab));
        if (d < bestD) {
          bestD = d;
          best = lab;
        }
      }
      if (best === -1) continue;
      for (const ci of r.cells) labelOf[ci] = best;
      changed = true;
    }
  }
  return { labelOf, regions: regionsFromLabels(labelOf) };
}

// --- gradient detection + banding -------------------------------------------

/** Pearson correlation between a region's cell coordinate on `axis` and its L*. 0 if either is constant. */
function axisCorrelation(region, cellCoords, labs, axis) {
  const n = region.cells.length;
  if (n < 2) return 0;
  let sx = 0;
  let sy = 0;
  for (const ci of region.cells) {
    sx += cellCoords[ci][axis];
    sy += labs[ci * 3];
  }
  const mx = sx / n;
  const my = sy / n;
  let cov = 0;
  let vx = 0;
  let vy = 0;
  for (const ci of region.cells) {
    const dx = cellCoords[ci][axis] - mx;
    const dy = labs[ci * 3] - my;
    cov += dx * dy;
    vx += dx * dx;
    vy += dy * dy;
  }
  if (vx <= 0 || vy <= 0) return 0;
  return cov / Math.sqrt(vx * vy);
}

/**
 * The spatial axis (0=i, 1=j, 2=k) the region's colour changes along: argmax |Pearson(coord, L*)|. A
 * degenerate region (no spatial colour trend) falls back to 1 (j / height). PURE.
 */
export function gradientAxis(region, cellCoords, labs) {
  let best = 1;
  let bestAbs = -1;
  for (let axis = 0; axis < 3; axis++) {
    const r = Math.abs(axisCorrelation(region, cellCoords, labs, axis));
    if (r > bestAbs) {
      bestAbs = r;
      best = axis;
    }
  }
  return best;
}

/**
 * Ordered (Bayer) dither between two adjacent steps: returns 0 (the LOW step) or 1 (the HIGH step). The
 * fraction `frac` of cells assigned the high step is `frac` on average, placed by a fixed 4×4 pattern over
 * the two perpendicular coords (a,b) — deterministic, structured. frac=0 ⇒ always low; frac→1 ⇒ always high.
 */
export function orderedDither(a, b, frac) {
  return bayer(a, b) >= frac ? 0 : 1;
}

/**
 * BAND a gradient region between ADJACENT palette steps along its gradient axis. Derive the ordered steps
 * (the distinct palette blocks the region's voxels snap to, sorted dark→light by L*), cap them to the
 * axis extent (so adjacent cells never jump >1 step — the ≤2-blocks-across-a-transition AC holds even on a
 * thin region), then per cell map its normalised position → a continuous step.
 *
 * DEFAULT is a HARD band: each cell takes the NEAREST step (round) → solid colour bands with one-cell-wide
 * transitions, the minimum within-region adjacent variation (so the speckle metric drops, not rises — a
 * dither would scatter two blocks across the whole region and inflate face-adjacent differences). `dither`
 * opts into the softened ordered-Bayer boundary instead (structured, not random) when a smoother gradient
 * read is wanted at the cost of more speckle. Monotonic non-decreasing along the axis either way. PURE.
 * @returns {Map<number,string>} cellIndex → bare block key
 */
export function bandRegion(region, cellCoords, labs, palette, { dither = false } = {}) {
  const out = new Map();
  // ordered, deduped steps by L*
  const seen = new Map();
  for (const ci of region.cells) {
    const m = nearestFlat(labAt(labs, ci), palette); // flat-preferring snap (T-064-01)
    if (!seen.has(m.key)) seen.set(m.key, m.lab[0]);
  }
  let steps = [...seen.entries()].sort((p, q) => p[1] - q[1]).map(([key]) => key);
  if (steps.length <= 1) {
    for (const ci of region.cells) out.set(ci, steps[0]);
    return out;
  }
  const axis = gradientAxis(region, cellCoords, labs);
  const sign = axisCorrelation(region, cellCoords, labs, axis) < 0 ? -1 : 1;
  const perp = [0, 1, 2].filter((d) => d !== axis);
  let lo = Infinity;
  let hi = -Infinity;
  for (const ci of region.cells) {
    const c = cellCoords[ci][axis];
    if (c < lo) lo = c;
    if (c > hi) hi = c;
  }
  const extent = hi - lo;
  // cap steps so (#steps - 1) ≤ extent → at most a 1-step change per adjacent cell.
  if (extent >= 0 && steps.length - 1 > extent) {
    const m = Math.max(1, extent + 1);
    const sub = [];
    for (let t = 0; t < m; t++) {
      const idx = m === 1 ? 0 : Math.round((t * (steps.length - 1)) / (m - 1));
      const key = steps[idx];
      if (sub[sub.length - 1] !== key) sub.push(key);
    }
    steps = sub;
  }
  const K = steps.length;
  if (K <= 1) {
    for (const ci of region.cells) out.set(ci, steps[0]);
    return out;
  }
  for (const ci of region.cells) {
    let p = extent === 0 ? 0 : (cellCoords[ci][axis] - lo) / extent;
    if (sign < 0) p = 1 - p;
    const s = p * (K - 1);
    if (!dither) {
      out.set(ci, steps[Math.min(Math.round(s), K - 1)]); // hard band: nearest step
      continue;
    }
    const base = Math.floor(s);
    const frac = s - base;
    if (base >= K - 1) {
      out.set(ci, steps[K - 1]);
      continue;
    }
    const d = orderedDither(cellCoords[ci][perp[0]], cellCoords[ci][perp[1]], frac);
    out.set(ci, steps[base + d]);
  }
  return out;
}

/**
 * Fill ONE region: flat (Lab spread ≤ gradDE) → a single palette block (nearest to the region mean);
 * gradient (spread > gradDE) → {@link bandRegion}. PURE.
 * @returns {Map<number,string>} cellIndex → bare block key
 */
export function fillRegion(region, cellCoords, labs, palette, { gradDE = SEG_DEFAULTS.gradDE, dither = false } = {}) {
  const stats = regionStats(region, labs);
  if (stats.spread <= gradDE) {
    const key = nearestFlat(stats.mean, palette).key; // flat-preferring snap (T-064-01)
    const out = new Map();
    for (const ci of region.cells) out.set(ci, key);
    return out;
  }
  return bandRegion(region, cellCoords, labs, palette, { dither });
}

// --- optional E-11 texture, filtered to the fixed palette --------------------

/**
 * OPTIONAL (Decision 6, default OFF): expand each cell's region block into a same-hue set (E-11
 * hueFamilySet) INTERSECTED with the fixed palette, then repick by height + a per-(i,k) hash. Keeps the
 * surface in-palette (off-palette stays 0) while adding a deliberate light-break. If a block has no
 * in-palette hue family the cell keeps its block. PURE; returns BARE keys.
 */
export function applyPaletteTexture(occupancy, keys, palette, opts = {}) {
  const { size, radius, spread = 0.7 } = opts;
  const allowed = paletteKeySet(palette);
  const cells = [...occupiedCells(occupancy)];
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [, j] of cells) {
    if (j < minY) minY = j;
    if (j > maxY) maxY = j;
  }
  const span = maxY - minY;
  const setCache = new Map();
  const out = new Array(keys.length);
  for (let n = 0; n < cells.length; n++) {
    const [i, j, k] = cells[n];
    let set = setCache.get(keys[n]);
    if (!set) {
      set = hueFamilySet(keys[n], { size, radius }).map(tableKey).filter((key) => allowed.has(key));
      if (set.length === 0) set = [keys[n]];
      setCache.set(keys[n], set);
    }
    const t = span === 0 ? 0 : (j - minY) / span;
    out[n] = pickMaterial(set, t, cellHash(i, k), spread);
  }
  return out;
}

/** Count placed keys (bare) that are NOT in the fixed palette — the palette-leakage directive metric. */
export function offPaletteCount(keys, palette) {
  const allowed = paletteKeySet(palette);
  let off = 0;
  for (const key of keys) if (!allowed.has(key)) off++;
  return off;
}

// --- the pass ---------------------------------------------------------------

/**
 * The material-region segmentation pass: a decoded `build` → a clean, value-true, region-coherent
 * DesignArtifact. PURE; does NOT validate. Pipeline (design.md): tight fixed palette → per-cell Lab →
 * grow regions → absorb specks → per-region fill (flat/band) → optional in-palette E-11 texture →
 * keysToArtifact.
 * @param {{ occupancy:object, surface:{vertices:Float64Array,uvs:Float64Array},
 *           texture:{width:number,height:number,data:Uint8Array|Buffer} }} build
 * @param {{ palette?:{key:string,lab:number[]}[], k?:number, growDE?:number, gradDE?:number,
 *           minRegion?:number, neighbourhood?:6|26, dither?:boolean, dropColor?:number[]|null,
 *           augment?:boolean|object, materialTexture?:boolean|object, metadata?:object, style?:object,
 *           paletteId?:string }} [opts]
 *           `palette` (the fix): the DESIGN-DOC palette `[{key,lab}]` to snap within — the deliberate few
 *           blocks the model chose. When omitted, a palette is median-cut from the GLB texture (looser).
 *           `augment` (E-18 T-058-03, default off): add ≤K gated secondary table blocks (design-doc ∪
 *           super-great-fit blocks for underserved texture colours). `true` = defaults, or `{table?,…,K?}`.
 *           `dither` (default false) softens gradient boundaries with an ordered Bayer dither at the cost
 *           of more speckle; the default hard band minimises speckle.
 * @returns {import("../artifact.mjs").DesignArtifact}
 */
export function segmentMaterials(build, opts = {}) {
  const { occupancy, surface, texture } = build;
  const k = opts.k ?? SEG_DEFAULTS.k;
  const growDE = opts.growDE ?? SEG_DEFAULTS.growDE;
  const gradDE = opts.gradDE ?? SEG_DEFAULTS.gradDE;
  const minRegion = opts.minRegion ?? SEG_DEFAULTS.minRegion;
  const neighbourhood = opts.neighbourhood ?? SEG_DEFAULTS.neighbourhood;

  // Candidate set: the DESIGN-DOC palette when supplied (the fix — the model's deliberate few blocks),
  // else fall back to extracting one from the GLB texture. opts.palette is `[{key,lab}]`.
  let snapPalette = opts.palette ?? extractTexturePalette(texture, { k, dropColor: opts.dropColor }).snapPalette;
  // E-18 T-058-03 (opt-in): augment with ≤K gated secondary table blocks for genuine texture colours the
  // tight palette represents poorly (high snap drift). `opts.augment` = true (defaults) or {table?,…,K?}.
  if (opts.augment) {
    const a = opts.augment === true ? {} : opts.augment;
    snapPalette = augmentPalette(snapPalette, texture, a.table, a);
  }
  const colors = sampleSurfaceColors({ occupancy, surface, texture });
  const labs = cellLabs(colors);
  const cellCoords = [...occupiedCells(occupancy)];

  let state = growRegions(occupancy, labs, { growDE, neighbourhood });
  state = absorbSmallRegions(state, occupancy, labs, { minRegion });

  const keys = new Array(occupancy.count);
  for (const region of state.regions) {
    const filled = fillRegion(region, cellCoords, labs, snapPalette, { gradDE, dither: opts.dither ?? false });
    for (const [ci, key] of filled) keys[ci] = key;
  }

  let finalKeys = keys;
  if (opts.materialTexture) {
    finalKeys = applyPaletteTexture(occupancy, keys, snapPalette, typeof opts.materialTexture === "object" ? opts.materialTexture : {});
  }
  return keysToArtifact(occupancy, finalKeys, {
    metadata: opts.metadata,
    style: opts.style ?? { ...MATERIAL_SEG_STYLE },
    paletteId: opts.paletteId,
  });
}

/**
 * Build a segmented DesignArtifact from raw .glb bytes. Voxelize → parse colour surface → decode the
 * baseColor texture (INJECTED `decodeTexture`, the only impurity) → segmentMaterials. Mirrors
 * materialCleanGlb / glbVoxelBuild.
 * @param {Uint8Array|ArrayBuffer|Buffer} glb
 * @param {{ scale?:number,
 *           decodeTexture:(img:{data:Uint8Array,mimeType:string})=>Promise<{width:number,height:number,data:Uint8Array}>,
 *           ...segOpts }} opts
 * @returns {Promise<import("../artifact.mjs").DesignArtifact>}
 */
export async function segmentMaterialsGlb(glb, { scale = DEFAULT_SCALE, decodeTexture, ...segOpts } = {}) {
  if (typeof decodeTexture !== "function") {
    throw new Error("segmentMaterialsGlb: a decodeTexture(img) function is required (WebP decode stays out of src/CI)");
  }
  const occupancy = voxelizeGlb(glb, { scale });
  const surface = parseGlbColoredSurface(glb);
  if (!surface.baseColor) {
    throw new Error("segmentMaterialsGlb: GLB has no baseColor texture (no surface color to sample)");
  }
  const texture = await decodeTexture(surface.baseColor);
  return segmentMaterials({ occupancy, surface, texture }, segOpts);
}
