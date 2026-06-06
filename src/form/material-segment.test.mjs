// Unit tests for the GLB-voxel material-region segmentation pass (T-058-01, E-18 R-seg). PURE + offline:
// no GL, no WebP, no GLB, no network, no RNG. Exercises region growth, small-region absorption, flat
// fill, the GRADIENT band/dither directive (monotonic, ≤2 blocks across a transition), palette discipline
// (off-palette = 0, distinct ≈ palette size), the speckle drop, and the full segmentMaterials pipeline on
// SYNTHETIC noisy color — asserting the produced artifact passes the REAL AJV gate (the round-trip AC).

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  cellLabs,
  growRegions,
  regionStats,
  absorbSmallRegions,
  gradientAxis,
  orderedDither,
  bandRegion,
  fillRegion,
  applyPaletteTexture,
  offPaletteCount,
  segmentMaterials,
  speckleScore,
  SEG_DEFAULTS,
} from "./material-segment.mjs";
import { blockPaletteFromTable, keysToArtifact, colorVoxelsToArtifact } from "./glb-voxel-build.mjs";
import { extractTexturePalette, snapColorsToPalette } from "./material-clean.mjs";
import { loadBlockTable } from "../color/block-table.mjs";
import { srgbToLab } from "../color/cielab.mjs";
import { assertArtifact } from "../artifact.mjs";

// --- fixtures (mirror material-clean.test.mjs) ------------------------------

/** Build an occupancy from a dims triple + an ordered [i,j,k] cell list (occupiedCells order = list order). */
function makeOcc(dims, cells) {
  const flat = [];
  for (const [i, j, k] of cells) flat.push(i, j, k);
  return {
    scale: Math.max(...dims),
    voxelSize: 1,
    dims,
    bounds: { min: [0, 0, 0], max: dims },
    occupied: Int32Array.from(flat),
    count: cells.length,
  };
}

/** A width×1 RGBA atlas from a list of [r,g,b] texels. */
function atlasRow(texels) {
  const w = texels.length;
  const data = new Uint8Array(w * 4);
  texels.forEach(([r, g, b], n) => {
    data[n * 4] = r;
    data[n * 4 + 1] = g;
    data[n * 4 + 2] = b;
    data[n * 4 + 3] = 255;
  });
  return { width: w, height: 1, data };
}

/** Flat Lab from a list of [r,g,b]. */
const labsOf = (rgbs) => cellLabs(Uint8Array.from(rgbs.flat()));
const TABLE_KEYS = new Set(loadBlockTable().blocks.map((b) => b.block));
const distinct = (keys) => new Set(keys).size;
const cellCoordsOf = (occ) => {
  const out = [];
  for (let n = 0; n < occ.count; n++) out.push([occ.occupied[n * 3], occ.occupied[n * 3 + 1], occ.occupied[n * 3 + 2]]);
  return out;
};
// a small fixed palette of clearly-separated value-true blocks for the synthetic region tests
const PAL = [
  { key: "black_concrete", lab: srgbToLab([20, 20, 20]) },
  { key: "gray_concrete", lab: srgbToLab([120, 120, 120]) },
  { key: "white_concrete", lab: srgbToLab([235, 235, 235]) },
];

// --- growRegions ------------------------------------------------------------

test("growRegions: two colour halves within growDE split into two regions", () => {
  const cells = [];
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) cells.push([i, j, 0]); // 4×2 wall
  const occ = makeOcc([4, 2, 1], cells);
  // left half near-black, right half near-white (ΔE across the seam ≫ growDE)
  const labs = labsOf(cells.map(([i]) => (i < 2 ? [25, 25, 25] : [230, 230, 230])));
  const { regions } = growRegions(occ, labs, { growDE: 8 });
  assert.equal(regions.length, 2, "a sharp colour seam stops growth → 2 regions");
});

test("growRegions: a smooth gradient stays ONE region (small adjacent ΔE)", () => {
  const cells = Array.from({ length: 16 }, (_, j) => [0, j, 0]); // a 16-tall column
  const occ = makeOcc([1, 16, 1], cells);
  const labs = labsOf(cells.map(([, j]) => { const v = 20 + j * 14; return [v, v, v]; })); // smooth 20..230
  const { regions } = growRegions(occ, labs, { growDE: SEG_DEFAULTS.growDE });
  assert.equal(regions.length, 1, "adjacent steps are within growDE → the whole gradient is one region");
  assert.ok(regionStats(regions[0], labs).spread > SEG_DEFAULTS.gradDE, "and its Lab spread flags it a gradient");
});

// --- absorbSmallRegions (the off-colour singleton fix) ----------------------

test("absorbSmallRegions: a single off-colour speck is absorbed into its surrounding region", () => {
  const cells = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) cells.push([i, j, 0]); // 3×3 wall
  const occ = makeOcc([3, 3, 1], cells);
  // all gray except the center, which is a lone red speck (its own region after growth)
  const labs = labsOf(cells.map(([i, j]) => (i === 1 && j === 1 ? [220, 20, 20] : [120, 120, 120])));
  const grown = growRegions(occ, labs, { growDE: 8 });
  assert.ok(grown.regions.length >= 2, "the speck starts as its own region");
  const absorbed = absorbSmallRegions(grown, occ, labs, { minRegion: 2 });
  assert.equal(absorbed.regions.length, 1, "the singleton is absorbed → one region");
  assert.equal(absorbed.labelOf.length, occ.count, "absorption never changes occupancy");
});

// --- gradientAxis -----------------------------------------------------------

test("gradientAxis: picks the axis the colour varies along", () => {
  const cells = Array.from({ length: 8 }, (_, k) => [0, 0, k]); // varies along k (axis 2)
  const occ = makeOcc([1, 1, 8], cells);
  const labs = labsOf(cells.map(([, , k]) => { const v = 20 + k * 28; return [v, v, v]; }));
  assert.equal(gradientAxis({ cells: [...Array(8).keys()] }, cellCoordsOf(occ), labs), 2);
});

// --- orderedDither ----------------------------------------------------------

test("orderedDither: frac=0 always low, frac→1 always high, deterministic", () => {
  assert.equal(orderedDither(0, 0, 0), 0, "no high step when frac is 0");
  assert.equal(orderedDither(1, 2, 0), 0);
  assert.equal(orderedDither(3, 1, 0.999), 1, "all high when frac→1");
  assert.equal(orderedDither(2, 2, 0.5), orderedDither(2, 2, 0.5), "reproducible");
});

// --- bandRegion (the GRADIENT directive) ------------------------------------

test("bandRegion: a 1-wide gradient column → a MONOTONIC staircase, adjacent cells differ by ≤1 step", () => {
  const cells = Array.from({ length: 16 }, (_, j) => [0, j, 0]);
  const occ = makeOcc([1, 16, 1], cells);
  const labs = labsOf(cells.map(([, j]) => { const v = 20 + j * 14; return [v, v, v]; })); // dark→light
  const region = { cells: [...Array(16).keys()] };
  const filled = bandRegion(region, cellCoordsOf(occ), labs, PAL);

  // order keys by L* to score monotonicity
  const order = new Map(PAL.slice().sort((a, b) => a.lab[0] - b.lab[0]).map((e, n) => [e.key, n]));
  const seq = cells.map((_, n) => order.get(filled.get(n)));
  for (let n = 1; n < seq.length; n++) {
    assert.ok(seq[n] >= seq[n - 1], `step index monotonic non-decreasing at ${n} (${seq[n - 1]}→${seq[n]})`);
    assert.ok(seq[n] - seq[n - 1] <= 1, `≤2 adjacent blocks across the transition at ${n}`);
  }
  assert.ok(distinct([...filled.values()]) <= PAL.length, "distinct stays within the palette");
  assert.ok(distinct([...filled.values()]) >= 2, "the gradient is banded, not flattened to one block");
});

test("bandRegion: more palette steps than cells → still ≤1 step per adjacent cell (capped to extent)", () => {
  const cells = [[0, 0, 0], [0, 1, 0], [0, 2, 0]]; // extent 2 along j, but a 3-step palette over a big range
  const occ = makeOcc([1, 3, 1], cells);
  const labs = labsOf([[20, 20, 20], [120, 120, 120], [235, 235, 235]]);
  const filled = bandRegion({ cells: [0, 1, 2] }, cellCoordsOf(occ), labs, PAL);
  const order = new Map(PAL.slice().sort((a, b) => a.lab[0] - b.lab[0]).map((e, n) => [e.key, n]));
  const seq = [0, 1, 2].map((n) => order.get(filled.get(n)));
  for (let n = 1; n < seq.length; n++) assert.ok(seq[n] - seq[n - 1] <= 1 && seq[n] >= seq[n - 1]);
});

// --- fillRegion (flat → ONE block) ------------------------------------------

test("fillRegion: a flat, noisy region collapses to a single palette block", () => {
  const cells = Array.from({ length: 9 }, (_, n) => [n, 0, 0]);
  const occ = makeOcc([9, 1, 1], cells);
  const labs = labsOf(cells.map((_, n) => { const v = 118 + (n % 5); return [v, v, v]; })); // grays ~118-122
  const filled = fillRegion({ cells: [...Array(9).keys()] }, cellCoordsOf(occ), labs, PAL, { gradDE: SEG_DEFAULTS.gradDE });
  assert.equal(distinct([...filled.values()]), 1, "a flat region → exactly one block");
});

// --- palette discipline + speckle (the directives) --------------------------

/** A synthetic decoded `build`: a row of cells, each mapped to its own atlas texel (cell i → texel i). */
function buildFrom(texels) {
  const n = texels.length;
  const cells = Array.from({ length: n }, (_, i) => [i, 0, 0]);
  const occ = makeOcc([n, 1, 1], cells);
  const verts = [];
  const uvs = [];
  for (let i = 0; i < n; i++) {
    verts.push(i + 0.5, 0.5, 0.5);
    uvs.push((i + 0.5) / n, 0.5);
  }
  return {
    occupancy: occ,
    surface: { vertices: Float64Array.from(verts), uvs: Float64Array.from(uvs) },
    texture: atlasRow(texels),
  };
}

test("segmentMaterials: synthetic noisy build → AJV-valid, off-palette 0, distinct ≤ palette, speckle ≤ naive", () => {
  // two flat colour bands, each jittered (the speckle source) + a gray gradient between them.
  const texels = [];
  for (let n = 0; n < 12; n++) texels.push([30 + (n % 4), 30 + (n % 3), 30 + (n % 5)]); // dark band, noisy
  for (let n = 0; n < 12; n++) { const v = 60 + n * 14; texels.push([v, v, v]); } // gradient
  for (let n = 0; n < 12; n++) texels.push([228 + (n % 4), 228 + (n % 3), 228 + (n % 5)]); // light band, noisy
  const build = buildFrom(texels);

  const art = segmentMaterials(build, { dropColor: null });
  assert.doesNotThrow(() => assertArtifact(art), "the segmented artifact passes the real schema gate");
  assert.equal(art.placements.length, build.occupancy.count, "one placement per occupied cell");
  assert.equal(art.style.name, "glb-voxel-seg");

  const { snapPalette } = extractTexturePalette(build.texture, { k: SEG_DEFAULTS.k, dropColor: null });
  const keys = art.placements.map((p) => p.block.replace(/^minecraft:/, ""));
  assert.equal(offPaletteCount(keys, snapPalette), 0, "DIRECTIVE: zero off-palette blocks");
  assert.ok(distinct(keys) <= snapPalette.length, "DIRECTIVE: distinct-block ≤ palette size");

  // speckle: segmented vs the naive per-voxel snap to the full 305-table (the R1 speckle source)
  const colors = new Uint8Array(texels.flatMap((t) => t));
  const naiveKeys = colorVoxelsToArtifact(build.occupancy, colors).placements.map((p) => p.block.replace(/^minecraft:/, ""));
  assert.ok(
    speckleScore(build.occupancy, keys) <= speckleScore(build.occupancy, naiveKeys),
    "segmented speckle ≤ naive full-table snap",
  );
  // and vs an R2-style per-voxel snap to the SAME small palette: region fill should be no worse
  const r2ish = snapColorsToPalette(colors, snapPalette);
  assert.ok(speckleScore(build.occupancy, keys) <= speckleScore(build.occupancy, r2ish) + 1e-9, "segmented speckle ≤ per-voxel-snap");
});

test("segmentMaterials: a salt-and-pepper field collapses to a coherent region (speckle → ~0)", () => {
  // 16 cells alternating two near-identical grays → R1/R2 would speckle; region grow + fill = one block.
  const texels = Array.from({ length: 16 }, (_, n) => { const v = n % 2 ? 118 : 122; return [v, v, v]; });
  const build = buildFrom(texels);
  const art = segmentMaterials(build, { dropColor: null });
  const keys = art.placements.map((p) => p.block.replace(/^minecraft:/, ""));
  assert.ok(distinct(keys) <= 2, "the salt-and-pepper noise collapses");
  assert.ok(speckleScore(build.occupancy, keys) < 0.5, "speckle is driven down");
});

// --- applyPaletteTexture (optional E-11, stays in palette) -------------------

test("applyPaletteTexture: even with texture ON, every block stays in the fixed palette", () => {
  const cells = Array.from({ length: 6 }, (_, j) => [0, j, 0]);
  const occ = makeOcc([1, 6, 1], cells);
  const keys = cells.map(() => "gray_concrete");
  const pal = [
    { key: "gray_concrete", lab: srgbToLab([120, 120, 120]) },
    { key: "white_concrete", lab: srgbToLab([235, 235, 235]) },
  ];
  const out = applyPaletteTexture(occ, keys, pal, { spread: 1 });
  assert.equal(out.length, occ.count, "occupancy unchanged");
  assert.equal(offPaletteCount(out, pal), 0, "texture stays inside the fixed palette");
});

// --- determinism ------------------------------------------------------------

test("segmentMaterials: deterministic — identical input → deep-equal artifact", () => {
  const texels = Array.from({ length: 20 }, (_, n) => { const v = 30 + n * 10; return [v, v, v]; });
  const a = segmentMaterials(buildFrom(texels), { dropColor: null });
  const b = segmentMaterials(buildFrom(texels), { dropColor: null });
  assert.deepEqual(a, b);
});

// --- keysToArtifact parity (the shared compile) -----------------------------

test("segmentMaterials: keys → namespaced placements + sorted-unique manifest (shared compile)", () => {
  const texels = Array.from({ length: 8 }, () => [120, 120, 120]); // one flat gray region
  const art = segmentMaterials(buildFrom(texels), { dropColor: null });
  assert.ok(art.placements.every((p) => p.op === "voxel" && p.block.startsWith("minecraft:")));
  assert.deepEqual(art.palette.manifest, [...new Set(art.placements.map((p) => p.block))].sort());
  assert.ok(art.palette.manifest.every((b) => TABLE_KEYS.has(b.replace(/^minecraft:/, ""))), "all real table blocks");
});
