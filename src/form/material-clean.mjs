// GLB-voxel MATERIAL-CLEAN pass — E-17 rung R2 (T-055-01, story S-055, epic E-17).
//
// R1 (glb-voxel-build.mjs) wins on FORM but its color is SPECKLED: every occupied cell sampled the TRELLIS
// texture independently and snapped to the nearest of the FULL 305-block table, so two adjacent cells whose
// texels differ by a few units land on DIFFERENT blocks — the right shape, a busy/dirty skin (koi 71 / heart
// 91 distinct blocks). Silhouette IoU can't see it. This pass grounds the materials in a SMALL canonical
// palette so the surface reads clean:
//   1. EXTRACT a canonical block palette FROM THE GLB's baseColor TEXTURE with the E-10 CIE-Lab technique
//      (extractPaletteFromPixels → value-true blocks) — NOT by clustering the noisy per-voxel samples.
//   2. SNAP each voxel (its nearest-vertex texel) to the nearest block WITHIN that canonical palette, so the
//      whole build draws from one coherent value-true material set instead of per-voxel noise.
//   3. SPATIAL-DENOISE: each voxel takes its neighbourhood's dominant block (salt-and-pepper removal).
//   4. OPTIONAL E-11 material texture: same-hue, height-varied set per surface so it reads as deliberate
//      texture, not noise (default OFF — it ADDS blocks, which opposes the noise-drop measurement).
//
// PURITY (same split as glb-voxel-build.mjs). materialCleanVoxel takes an ALREADY-DECODED texture and is
// FULLY PURE (no GL, no WebP, no GLB, no network) — unit-tested offline on synthetic noisy color (AC #3).
// materialCleanGlb ties parse + voxelize + sample + clean, IMPURE only through an INJECTED decodeTexture.
// REUSE, NOT REIMPLEMENTATION: the texture-palette is E-10 (extractPaletteFromPixels), the per-voxel sample
// is E-16 (sampleSurfaceColors), the artifact build is the shared keysToArtifact, the snap is the portable
// engine (nearestLab), the optional texture is E-11 (hueFamilySet/pickMaterial/cellHash). No new color math.
//
// The core does NOT validate — the AJV gate (src/artifact.mjs) is a consumer-side assert (round-trip).

import { extractPaletteFromPixels } from "../color/palette-extract.mjs";
import { srgbToLab, nearestLab } from "../color/cielab.mjs";
import { sampleSurfaceColors, keysToArtifact } from "./glb-voxel-build.mjs";
import { voxelizeGlb, occupiedCells } from "./glb-voxelize.mjs";
import { parseGlbColoredSurface } from "./glb-mesh.mjs";
import { hueFamilySet, pickMaterial, cellHash, tableKey } from "../sculptor/material.mjs";
import { DEFAULT_SCALE } from "../sculpture.mjs";

/** Default canonical palette size and denoise neighbourhood (design.md Decisions 1 & 5). */
export const CLEAN_DEFAULTS = Object.freeze({ k: 8, denoise: Object.freeze({ radius: 1, passes: 1 }) });

/** The style stamped on a material-clean build (distinct from R1's "glb-voxel"). */
export const MATERIAL_CLEAN_STYLE = Object.freeze({
  name: "glb-voxel-clean",
  rationale:
    "Voxelized from a 3-D GLB mesh; cells snapped to a small value-true palette extracted from the GLB's " +
    "own surface texture (E-10), then spatially denoised — a coherent material set, not per-voxel noise.",
});

/**
 * Extract the canonical material palette FROM a decoded baseColor texture atlas via the E-10 CIE-Lab
 * technique, and shape it for `nearestLab`. PURE. The snap target uses each entry's BLOCK Lab
 * (`blockColor.lab`), not the cluster's representative colour — value-true, the way E-14 snaps (Decision 4).
 * @param {{width:number,height:number,data:Uint8Array|Buffer}} texture decoded RGBA/RGB atlas
 * @param {{k?:number, dropColor?:number[]|null, dropTolerance?:number, alphaThreshold?:number}} [opts]
 * @returns {{ snapPalette:{key:string,lab:number[]}[], entries:object[], description:string }}
 */
export function extractTexturePalette(texture, opts = {}) {
  const { k = CLEAN_DEFAULTS.k, dropColor, dropTolerance, alphaThreshold } = opts;
  const extractOpts = { k };
  if (dropColor !== undefined) extractOpts.dropColor = dropColor;
  if (dropTolerance !== undefined) extractOpts.dropTolerance = dropTolerance;
  if (alphaThreshold !== undefined) extractOpts.alphaThreshold = alphaThreshold;
  const result = extractPaletteFromPixels(texture, extractOpts);
  const snapPalette = result.palette.map((e) => ({ key: e.block, lab: e.blockColor.lab }));
  if (snapPalette.length === 0) throw new Error("extractTexturePalette: texture yielded no palette blocks");
  return { snapPalette, entries: result.palette, description: result.description };
}

/**
 * Snap each per-cell sampled colour to the nearest block within a canonical palette. PURE.
 * @param {Uint8Array|number[]} colors flat rgb, 3 per cell (occupiedCells order)
 * @param {{key:string,lab:number[]}[]} snapPalette
 * @returns {string[]} bare block keys, occupiedCells order
 */
export function snapColorsToPalette(colors, snapPalette) {
  const count = colors.length / 3;
  const keys = new Array(count);
  for (let n = 0; n < count; n++) {
    const rgb = [colors[n * 3], colors[n * 3 + 1], colors[n * 3 + 2]];
    keys[n] = nearestLab(srgbToLab(rgb), snapPalette).key;
  }
  return keys;
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

/**
 * Spatial denoise: each occupied cell takes the most frequent block among occupied cells in its
 * Chebyshev-`radius` box (the cell included). Ties KEEP the cell's current block — only a genuine
 * neighbourhood majority flips it. Read-old / write-new per pass, so the result is independent of
 * iteration order and fully deterministic (Decision 5). PURE; never touches occupancy.
 * @param {{occupied:Int32Array, count:number}} occupancy
 * @param {string[]} keys bare keys, occupiedCells order, length === count
 * @param {{radius?:number, passes?:number}} [opts]
 * @returns {string[]} denoised bare keys, same order/length
 */
export function denoiseVoxelKeys(occupancy, keys, opts = {}) {
  const radius = opts.radius ?? CLEAN_DEFAULTS.denoise.radius;
  const passes = opts.passes ?? CLEAN_DEFAULTS.denoise.passes;
  if (keys.length !== occupancy.count) {
    throw new Error(`denoiseVoxelKeys: keys length ${keys.length} !== occupancy.count ${occupancy.count}`);
  }
  if (radius < 1 || passes < 1) return keys.slice();
  const index = indexCells(occupancy);
  const cells = [...occupiedCells(occupancy)];

  let cur = keys.slice();
  for (let p = 0; p < passes; p++) {
    const next = new Array(cur.length);
    for (let n = 0; n < cells.length; n++) {
      const [ci, cj, ck] = cells[n];
      const tally = new Map();
      for (let di = -radius; di <= radius; di++) {
        for (let dj = -radius; dj <= radius; dj++) {
          for (let dk = -radius; dk <= radius; dk++) {
            const m = index.get(`${ci + di},${cj + dj},${ck + dk}`);
            if (m === undefined) continue;
            const key = cur[m];
            tally.set(key, (tally.get(key) || 0) + 1);
          }
        }
      }
      // most frequent; ties keep the current block (only outvoting flips a cell).
      let bestKey = cur[n];
      let bestCount = tally.get(bestKey) || 0;
      for (const [key, c] of tally) {
        if (c > bestCount) {
          bestCount = c;
          bestKey = key;
        }
      }
      next[n] = bestKey;
    }
    cur = next;
  }
  return cur;
}

/**
 * Spatial speckle score: the fraction of FACE-ADJACENT (6-neighbour) occupied cell pairs whose blocks
 * differ. 0 = perfectly clean (every neighbour shares a block); higher = speckled. Counts each pair once
 * (only the +i/+j/+k neighbour). PURE — the truest measure of the surface noise this pass removes.
 * @param {{occupied:Int32Array, count:number}} occupancy
 * @param {string[]} keys bare keys, occupiedCells order
 * @returns {number} in [0,1]
 */
export function speckleScore(occupancy, keys) {
  const index = indexCells(occupancy);
  const cells = [...occupiedCells(occupancy)];
  let pairs = 0;
  let differ = 0;
  const dirs = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
  for (let n = 0; n < cells.length; n++) {
    const [i, j, k] = cells[n];
    for (const [di, dj, dk] of dirs) {
      const m = index.get(`${i + di},${j + dj},${k + dk}`);
      if (m === undefined) continue;
      pairs++;
      if (keys[n] !== keys[m]) differ++;
    }
  }
  return pairs === 0 ? 0 : differ / pairs;
}

/**
 * OPTIONAL E-11 material texture (Decision 6, default OFF). Expand each cell's canonical block into a
 * same-hue set (hueFamilySet) and repick by height + a deterministic per-(i,k) hash, so a flat surface
 * gains a light-break without changing the silhouette. Reuses the pure E-11 helpers. PURE; returns BARE
 * keys (hueFamilySet returns namespaced ids — stripped back to table keys).
 * @param {{occupied:Int32Array, count:number}} occupancy
 * @param {string[]} keys bare keys, occupiedCells order
 * @param {{size?:number, radius?:number, spread?:number}} [opts]
 * @returns {string[]} bare keys, same order/length
 */
export function applyMaterialTexture(occupancy, keys, opts = {}) {
  const { size, radius, spread = 0.7 } = opts;
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
      set = hueFamilySet(keys[n], { size, radius });
      setCache.set(keys[n], set);
    }
    const t = span === 0 ? 0 : (j - minY) / span;
    out[n] = tableKey(pickMaterial(set, t, cellHash(i, k), spread));
  }
  return out;
}

/**
 * The material-clean pass: a decoded `build` → a clean, value-true DesignArtifact. PURE; does NOT validate.
 * Pipeline (design.md): extract texture palette → sample per-cell surface colours → snap to the canonical
 * palette → spatial-denoise → (optional E-11 texture) → keysToArtifact.
 * @param {{ occupancy:object, surface:{vertices:Float64Array,uvs:Float64Array},
 *           texture:{width:number,height:number,data:Uint8Array|Buffer} }} build
 * @param {{ k?:number, dropColor?:number[]|null, denoise?:{radius?:number,passes?:number},
 *           materialTexture?:boolean|object, metadata?:object, style?:object, paletteId?:string }} [opts]
 * @returns {import("../artifact.mjs").DesignArtifact}
 */
export function materialCleanVoxel(build, opts = {}) {
  const { occupancy, surface, texture } = build;
  // Palette provenance (the description) is surfaced by the runner's summary, not stamped on the artifact
  // (the schema's `style` is additionalProperties:false). The runner re-derives it via extractTexturePalette.
  const { snapPalette } = extractTexturePalette(texture, { k: opts.k, dropColor: opts.dropColor });
  const colors = sampleSurfaceColors({ occupancy, surface, texture });
  const snapped = snapColorsToPalette(colors, snapPalette);
  let keys = denoiseVoxelKeys(occupancy, snapped, opts.denoise ?? {});
  if (opts.materialTexture) {
    keys = applyMaterialTexture(occupancy, keys, typeof opts.materialTexture === "object" ? opts.materialTexture : {});
  }
  return keysToArtifact(occupancy, keys, {
    metadata: opts.metadata,
    style: opts.style ?? { ...MATERIAL_CLEAN_STYLE },
    paletteId: opts.paletteId,
  });
}

/**
 * Build a clean DesignArtifact from raw .glb bytes. Voxelize → parse colour surface → decode the baseColor
 * texture (INJECTED `decodeTexture`, the only impurity) → materialCleanVoxel. Mirrors glbVoxelBuild's shape.
 * @param {Uint8Array|ArrayBuffer|Buffer} glb
 * @param {{ scale?:number,
 *           decodeTexture:(img:{data:Uint8Array,mimeType:string})=>Promise<{width:number,height:number,data:Uint8Array}>,
 *           k?:number, dropColor?:number[]|null, denoise?:object, materialTexture?:boolean|object,
 *           metadata?:object, style?:object, paletteId?:string }} opts
 * @returns {Promise<import("../artifact.mjs").DesignArtifact>}
 */
export async function materialCleanGlb(glb, { scale = DEFAULT_SCALE, decodeTexture, ...cleanOpts } = {}) {
  if (typeof decodeTexture !== "function") {
    throw new Error("materialCleanGlb: a decodeTexture(img) function is required (WebP decode stays out of src/CI)");
  }
  const occupancy = voxelizeGlb(glb, { scale });
  const surface = parseGlbColoredSurface(glb);
  if (!surface.baseColor) {
    throw new Error("materialCleanGlb: GLB has no baseColor texture (no surface color to sample)");
  }
  const texture = await decodeTexture(surface.baseColor);
  return materialCleanVoxel({ occupancy, surface, texture }, cleanOpts);
}
