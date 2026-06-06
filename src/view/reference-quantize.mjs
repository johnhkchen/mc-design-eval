// Same-angle reference quantize — the cell-aligned material TARGET (T-078-01, story S-078, epic E-23).
//
// AC: render the textured GLB (or any reference) at the SAME angle as a projected face and grid-quantize
// it to that face's cell grid, producing the cell-aligned material target the S-079 splat consumes. This
// is the READ side only — no splat here. The quantizer itself is the proven E-10 machinery
// (src/color/image-grid.mjs `gridFromImage`); this module supplies the two things that make it
// "same-angle, face-aligned": (1) the RESOLUTION — `n` = the projected face's grid width, so cells line
// up with Path P's surface grid; (2) the PALETTE — `whitelist` = the artifact's design-doc manifest, so
// the target snaps WITHIN the design palette, not the full 305-block table (`voxel-palette-must-be-design-doc`).
//
// The "same angle" guarantee is the CALLER's contract: render the reference at the face's view BEFORE
// quantizing (the live proof / S-079 driver does this via renderViews). This module aligns resolution +
// palette; decode is image-grid's already-tested seam.

import { gridFromImage } from "../color/image-grid.mjs";

/** Strip `minecraft:` so the whitelist matches block-table keys (image-grid resolves bare ids). PURE. */
export function bareList(manifest) {
  return (manifest || []).map((b) => (typeof b === "string" ? b.replace(/^minecraft:/, "") : b));
}

/**
 * Build the image-grid opts that make a quantize "face-aligned + design-palette-snapped": resolution
 * `n` (the face grid width) and `whitelist` (the bare design-doc manifest → validate mode, out-of-palette
 * is structurally zero). PURE — testable against gridFromPixels with no decode. Throws on a bad `n`.
 * @param {{ n:number, manifest?:string[] } & object} opts
 * @returns {object} opts for gridFromImage / gridFromPixels
 */
export function quantizeOpts(opts = {}) {
  if (!Number.isInteger(opts.n) || opts.n < 1) {
    throw new Error(`quantizeOpts: opts.n (face grid width) must be a positive integer, got ${opts.n}`);
  }
  const { manifest, ...gridOpts } = opts;
  const out = { ...gridOpts };
  if (manifest) out.whitelist = bareList(manifest);
  return out;
}

/**
 * Grid-quantize a same-angle reference image to a cell-aligned material target.
 * @param {string} imagePath a render of the reference at the face's view
 * @param {{ n:number, manifest?:string[] } & object} opts `n` = face grid width (required); `manifest` =
 *   design-doc palette to snap within (validate mode); other image-grid opts forwarded.
 * @returns {Promise<object>} an image-grid GridResult (grid, n, m, legend, blockCounts, meanDeltaE, …)
 */
export async function referenceTarget(imagePath, opts = {}) {
  return gridFromImage(imagePath, quantizeOpts(opts));
}

/**
 * Convenience: derive `n` from a Path-P {@link import("./surface-grid.mjs").SurfaceGrid} so the target
 * lands on that face's exact cell grid, then quantize.
 * @param {string} imagePath
 * @param {{n:number}} grid a SurfaceGrid (only `.n` is read)
 * @param {{ manifest?:string[] } & object} [opts]
 */
export async function quantizeToFace(imagePath, grid, opts = {}) {
  if (!grid || !Number.isInteger(grid.n) || grid.n < 1) {
    throw new Error("quantizeToFace: grid.n (face column count) must be a positive integer");
  }
  return referenceTarget(imagePath, { ...opts, n: grid.n });
}
