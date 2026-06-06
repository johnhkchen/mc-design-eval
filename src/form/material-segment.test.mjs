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
  gradientDirection,
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

// --- absorbSmallRegions: T-064-01 noise-vs-intent rule ----------------------

test("absorbSmallRegions: a colour-DISTINCT small region is KEPT (legitimate detail, not noise)", () => {
  // a 4×4 white cap with a 2×2 RED spot at the corner — the spot is small but a different material.
  const cells = [];
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) cells.push([i, j, 0]);
  const occ = makeOcc([4, 4, 1], cells);
  const labs = labsOf(cells.map(([i, j]) => (i < 2 && j < 2 ? [220, 20, 20] : [235, 235, 235])));
  const grown = growRegions(occ, labs, { growDE: 8 });
  // size-4 spot < minRegion 12, but its ΔE to the white neighbour ≫ absorbDE → KEEP.
  const kept = absorbSmallRegions(grown, occ, labs, { minRegion: 12, absorbDE: 22, tinyFloor: 2 });
  assert.equal(kept.regions.length, 2, "the distinct spot survives as its own region");
});

test("absorbSmallRegions: a colour-CLOSE small region IS absorbed (real noise)", () => {
  // same shape, but the spot is only slightly off the surrounding grey (within absorbDE) → noise.
  const cells = [];
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) cells.push([i, j, 0]);
  const occ = makeOcc([4, 4, 1], cells);
  const labs = labsOf(cells.map(([i, j]) => (i < 2 && j < 2 ? [120, 120, 120] : [140, 140, 140])));
  const grown = growRegions(occ, labs, { growDE: 5 }); // 5 < the ~7.7 ΔE seam → starts as 2 regions
  assert.ok(grown.regions.length >= 2, "the close spot starts separate at this growDE");
  const absorbed = absorbSmallRegions(grown, occ, labs, { minRegion: 12, absorbDE: 22, tinyFloor: 2 });
  assert.equal(absorbed.regions.length, 1, "a near-in-colour small region is absorbed as noise");
});

test("absorbSmallRegions: a tiny (≤tinyFloor) fleck is always absorbed even if colour-distinct", () => {
  const cells = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) cells.push([i, j, 0]);
  const occ = makeOcc([3, 3, 1], cells);
  const labs = labsOf(cells.map(([i, j]) => (i === 1 && j === 1 ? [220, 20, 20] : [235, 235, 235])));
  const grown = growRegions(occ, labs, { growDE: 8 });
  const absorbed = absorbSmallRegions(grown, occ, labs, { minRegion: 12, absorbDE: 5, tinyFloor: 2 });
  assert.equal(absorbed.regions.length, 1, "a single-voxel snap fleck is noise regardless of colour");
});

// --- gradientAxis -----------------------------------------------------------

test("gradientAxis: picks the axis the colour varies along", () => {
  const cells = Array.from({ length: 8 }, (_, k) => [0, 0, k]); // varies along k (axis 2)
  const occ = makeOcc([1, 1, 8], cells);
  const labs = labsOf(cells.map(([, , k]) => { const v = 20 + k * 28; return [v, v, v]; }));
  assert.equal(gradientAxis({ cells: [...Array(8).keys()] }, cellCoordsOf(occ), labs), 2);
});

// --- gradientDirection (T-064-01: true/diagonal gradient direction) ---------

test("gradientDirection: a DIAGONAL gradient points along the diagonal, not a cardinal", () => {
  // an 8×8 slab in the i–k plane (j constant); L* increases along i+k.
  const cells = [];
  for (let i = 0; i < 8; i++) for (let k = 0; k < 8; k++) cells.push([i, 0, k]);
  const occ = makeOcc([8, 1, 8], cells);
  const labs = labsOf(cells.map(([i, , k]) => { const v = 20 + (i + k) * 12; return [v, v, v]; }));
  const dir = gradientDirection({ cells: [...Array(cells.length).keys()] }, cellCoordsOf(occ), labs);
  assert.ok(dir, "a planar diagonal region yields a direction (ridge keeps it well-posed)");
  // i and k components ≈ equal and positive; j ≈ 0.
  assert.ok(Math.abs(dir[1]) < 1e-3, `j component ≈ 0 (got ${dir[1]})`);
  assert.ok(dir[0] > 0.5 && dir[2] > 0.5, `i,k both strongly positive (got ${dir[0]},${dir[2]})`);
  assert.ok(Math.abs(dir[0] - dir[2]) < 0.1, "symmetric diagonal → i ≈ k component");
});

test("gradientDirection: a flat-colour region returns null (no trend)", () => {
  const cells = Array.from({ length: 9 }, (_, n) => [n, 0, 0]);
  const occ = makeOcc([9, 1, 1], cells);
  const labs = labsOf(cells.map(() => [120, 120, 120]));
  assert.equal(gradientDirection({ cells: [...Array(9).keys()] }, cellCoordsOf(occ), labs), null);
});

// --- bandRegion along a DIAGONAL (AC#2) -------------------------------------

test("bandRegion: a DIAGONAL gradient bands MONOTONICALLY along the diagonal (≤2 blocks per transition)", () => {
  // 6×6 slab, L* increases along i+k. A cardinal banding would scatter (cells at equal i, varying k get
  // different bands → non-monotonic across k). The true-direction banding must be monotonic on the diagonal.
  const W = 6;
  const cells = [];
  for (let i = 0; i < W; i++) for (let k = 0; k < W; k++) cells.push([i, 0, k]);
  const occ = makeOcc([W, 1, W], cells);
  const cc = cellCoordsOf(occ);
  const labs = labsOf(cells.map(([i, , k]) => { const v = 15 + (i + k) * 18; return [v, v, v]; }));
  const region = { cells: [...Array(cells.length).keys()] };
  const filled = bandRegion(region, cc, labs, PAL);

  const order = new Map(PAL.slice().sort((a, b) => a.lab[0] - b.lab[0]).map((e, n) => [e.key, n]));
  const idxAt = new Map(); // "i,k" → step index
  cells.forEach(([i, , k], n) => idxAt.set(`${i},${k}`, order.get(filled.get(n))));

  // (1) monotonic non-decreasing along the diagonal coordinate s = i+k.
  const byS = new Map();
  for (const [key, step] of idxAt) {
    const [i, k] = key.split(",").map(Number);
    const s = i + k;
    if (!byS.has(s)) byS.set(s, new Set());
    byS.get(s).add(step);
  }
  const ss = [...byS.keys()].sort((a, b) => a - b);
  let prevMax = -1;
  for (const s of ss) {
    const steps = [...byS.get(s)];
    const lo = Math.min(...steps);
    assert.ok(lo >= prevMax, `band non-decreasing along the diagonal at s=${s}`);
    prevMax = Math.max(...steps);
  }
  // (2) ≤1 step difference across every FACE-adjacent transition (≤2 distinct blocks across it).
  for (const [i, , k] of cells) {
    const here = idxAt.get(`${i},${k}`);
    for (const [di, dk] of [[1, 0], [0, 1]]) {
      const nb = idxAt.get(`${i + di},${k + dk}`);
      if (nb === undefined) continue;
      assert.ok(Math.abs(nb - here) <= 1, `≤1 step across (${i},${k})→(${i + di},${k + dk}): ${here}→${nb}`);
    }
  }
  assert.ok(distinct([...filled.values()]) >= 2, "the diagonal is actually banded, not flattened");
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

test("bandRegion: the default hard band is cleaner (less within-region speckle) than the ordered dither", () => {
  // a wide 8×8 slab with a smooth gradient along i → the dither scatters two blocks across the boundary
  // band (more adjacent differences); the hard band keeps solid stripes (fewer). The metric must prefer it.
  const cells = [];
  for (let i = 0; i < 8; i++) for (let k = 0; k < 8; k++) cells.push([i, 0, k]);
  const occ = makeOcc([8, 1, 8], cells);
  const labs = labsOf(cells.map(([i]) => { const v = 20 + i * 30; return [v, v, v]; }));
  const region = { cells: [...Array(cells.length).keys()] };
  const cc = cellCoordsOf(occ);
  const hard = bandRegion(region, cc, labs, PAL); // default: hard band
  const soft = bandRegion(region, cc, labs, PAL, { dither: true });
  const toKeys = (m) => cells.map((_, n) => m.get(n));
  assert.ok(
    speckleScore(occ, toKeys(hard)) <= speckleScore(occ, toKeys(soft)),
    "hard band ≤ dither on the speckle metric",
  );
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
