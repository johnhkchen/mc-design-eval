// Render-only cutaway sections (T-083-01, story S-083, epic E-23 milestone).
//
// AC #2 needs a from-below / cutaway view that SHOWS the hollow interior + the N×M floorplan. The renders
// of the intact build only glimpse one room through the front door. A SECTION reveals the grid: clip the
// build with a plane and photograph the clipped copy. The clip is FLATTEN-BY-EXCLUSION — exactly the shipped
// `carveArtifact(artifact, removeSet)` — so the only new piece here is computing the remove-set from a plane.
//
// IMPORTANT (Rule 3): a section is a RENDER-ONLY copy. The real build is never edited; only the section's PNG
// is produced. The exterior-held proof lives on the real (unclipped) artifact. These helpers are PURE
// (no GL, no IO, no Date/random) and unit-tested — they only read an Occupancy and return a Set of keys in
// the `voxelKey` "x,y,z" format, which drops straight into `carveArtifact` / `carveOccupancy`.

const AXIS_INDEX = Object.freeze({ x: 0, y: 1, z: 2 });

/**
 * The occupancy keys to REMOVE for a planar section. Removes cells on `side` of the plane `coord = at` along
 * `axis`. `side:"above"` removes cells with `coord >= at`; `side:"below"` removes cells with `coord < at`.
 * Keys are the occupancy's own `"x,y,z"` strings (= `voxelKey`), so the returned set composes directly with
 * `carveArtifact`/`carveOccupancy`. PURE.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {{axis:"x"|"y"|"z", at:number, side?:"above"|"below"}} plane
 * @returns {Set<string>}
 */
export function sectionKeys(occ, { axis, at, side = "above" }) {
  const i = AXIS_INDEX[axis];
  if (i === undefined) throw new Error(`cutaway.sectionKeys: axis must be x|y|z, got ${axis}`);
  if (!Number.isFinite(at)) throw new Error(`cutaway.sectionKeys: at must be finite, got ${at}`);
  if (side !== "above" && side !== "below") throw new Error(`cutaway.sectionKeys: side must be above|below, got ${side}`);
  const remove = new Set();
  for (const key of occ.cells.keys()) {
    const coord = Number(key.split(",")[i]);
    if (side === "above" ? coord >= at : coord < at) remove.add(key);
  }
  return remove;
}

/**
 * Plan section: remove everything at/above the TOP storey's floor line, so a `top` (plan) render looks down
 * into the storey(s) BELOW it and sees the N×M grid walls standing on their floor (the roof + upper floor are
 * gone). Uses only the structural read's `floorLines`; falls back to cutting the top ~third of the height for
 * a single-storey build (still reveals interior). PURE.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {{storeyBands:{floorLines:number[]}}} read
 * @returns {Set<string>}
 */
export function roofCut(occ, read) {
  const lines = read?.storeyBands?.floorLines ?? [];
  let at;
  if (lines.length >= 2) {
    at = lines[lines.length - 1]; // the top storey's floor → reveal everything below it
  } else if (occ.bounds) {
    const [minY, maxY] = [occ.bounds.min[1], occ.bounds.max[1]];
    at = Math.round(minY + (maxY - minY + 1) * (2 / 3)); // single storey: drop the top third
  } else {
    return new Set();
  }
  return sectionKeys(occ, { axis: "y", at, side: "above" });
}

/**
 * Cross-section: remove the FRONT half (cells with z >= the z-midpoint), so a 3/4 / front render sees the
 * stacked floors + grid walls of the back half in cross-section (the hollow made visible). PURE.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @returns {Set<string>}
 */
export function frontHalfCut(occ) {
  if (!occ.bounds) return new Set();
  const [minZ, maxZ] = [occ.bounds.min[2], occ.bounds.max[2]];
  const mid = Math.floor((minZ + maxZ) / 2) + 1; // keep the back half (incl. the mid plane) for a fuller wall
  return sectionKeys(occ, { axis: "z", at: mid, side: "above" });
}
