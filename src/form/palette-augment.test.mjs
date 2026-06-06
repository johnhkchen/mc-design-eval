// Unit tests for the gated secondary palette (T-058-03, E-18). PURE + offline: no GL, no WebP, no GLB,
// no network, no RNG. Synthetic atlas textures + a synthetic value-true table so the "super-great fit"
// block is controlled. Exercises the four gates (underserved / real / fit / big-win), the K cap, the
// no-speckle-from-low-coverage guard, and the segmentMaterials `augment` wiring (off-palette 0, total ≤
// design-doc size + K, AJV-valid) — the AC #2 / AC #4 coverage.

import { test } from "node:test";
import assert from "node:assert/strict";

import { augmentPalette, augmentReport, AUGMENT_DEFAULTS } from "./palette-augment.mjs";
import { segmentMaterials, offPaletteCount } from "./material-segment.mjs";
import { srgbToLab } from "../color/cielab.mjs";
import { assertArtifact } from "../artifact.mjs";

// --- fixtures (mirror material-segment.test.mjs) ----------------------------

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

/** A synthetic decoded `build`: a row of cells, each mapped to its own atlas texel (cell i → texel i). */
function buildFrom(texels) {
  const n = texels.length;
  const cells = Array.from({ length: n }, (_, i) => [i, 0, 0]);
  const occ = {
    scale: n,
    voxelSize: 1,
    dims: [n, 1, 1],
    bounds: { min: [0, 0, 0], max: [n, 1, 1] },
    occupied: Int32Array.from(cells.flat()),
    count: n,
  };
  const verts = [];
  const uvs = [];
  for (let i = 0; i < n; i++) {
    verts.push(i + 0.5, 0.5, 0.5);
    uvs.push((i + 0.5) / n, 0.5);
  }
  return { occupancy: occ, surface: { vertices: Float64Array.from(verts), uvs: Float64Array.from(uvs) }, texture: atlasRow(texels) };
}

const lab = (rgb) => srgbToLab(rgb);
// A primary (design-doc) palette of two well-separated neutrals — genuinely cannot represent a hue.
const WHITE = [235, 235, 235];
const BLACK = [20, 20, 20];
const PRIMARY = [
  { key: "white_concrete", lab: lab(WHITE) },
  { key: "black_concrete", lab: lab(BLACK) },
];
// A synthetic value-true table: the two primaries + saturated hue blocks with EXACT fits.
const RED = [200, 30, 30];
const LIME = [60, 200, 60];
const BLUE = [40, 40, 200];
const TABLE = {
  blocks: [
    { block: "white_concrete", lab: lab(WHITE) },
    { block: "black_concrete", lab: lab(BLACK) },
    { block: "red_concrete", lab: lab(RED) },
    { block: "lime_concrete", lab: lab(LIME) },
    { block: "blue_concrete", lab: lab(BLUE) },
  ],
};
// Disable background removal (the default drops near-black, which would drop BLACK foreground).
const NOBG = { dropColor: null };

// repeat a texel `n` times
const rep = (rgb, n) => Array.from({ length: n }, () => rgb.slice());

// --- the four gates: a far cluster with a tight table block is added --------

test("augmentPalette: an underserved cluster with a super-great table fit adds that block", () => {
  // all-red texture: far from white/black (underserved), exact fit to red_concrete, full coverage.
  const texture = atlasRow(rep(RED, 16));
  const rep_ = augmentReport(PRIMARY, texture, TABLE, NOBG);
  assert.equal(rep_.secondary.length, 1, "exactly one block added");
  assert.equal(rep_.secondary[0].key, "red_concrete", "the tight-fit table block");
  assert.deepEqual(rep_.added[0].lab, lab(RED), "secondary carries the BLOCK's table Lab (value-true)");
  const pal = augmentPalette(PRIMARY, texture, TABLE, NOBG);
  assert.equal(pal.length, PRIMARY.length + 1, "total = design-doc size + 1");
  assert.ok(rep_.meanSnapBefore > rep_.meanSnapAfter, "the augmentation reduces the mean snap drift");
});

// --- a well-served cluster: nothing added -----------------------------------

test("augmentPalette: a well-served cluster adds nothing (palette unchanged)", () => {
  const texture = atlasRow(rep(WHITE, 16)); // exactly a primary block → primaryΔE ≈ 0
  const pal = augmentPalette(PRIMARY, texture, TABLE, NOBG);
  assert.deepEqual(pal, PRIMARY, "served colour ⇒ no secondary");
  assert.equal(augmentReport(PRIMARY, texture, TABLE, NOBG).added.length, 0);
});

// --- the cap holds (never > K) ----------------------------------------------

test("augmentPalette: three qualifying clusters are capped at K", () => {
  // equal thirds red/lime/blue: all underserved, all exact-fit, all high coverage → 3 qualify, K=2 caps.
  const texture = atlasRow([...rep(RED, 8), ...rep(LIME, 8), ...rep(BLUE, 8)]);
  const r = augmentReport(PRIMARY, texture, TABLE, NOBG);
  assert.ok(r.candidates.filter((c) => c.qualifies).length >= 3, "≥3 clusters qualify before the cap");
  assert.equal(r.secondary.length, AUGMENT_DEFAULTS.K, "secondary is capped at K");
  assert.equal(augmentPalette(PRIMARY, texture, TABLE, NOBG).length, PRIMARY.length + AUGMENT_DEFAULTS.K);
});

// --- low-coverage off-colour speck: NOT added (no speckle reopened) ---------

test("augmentPalette: a low-coverage off-colour speck is not added", () => {
  // 60 white + 2 red: red coverage ≈ 3% < minCoverage (5%) → the speck must not reopen the palette.
  const texture = atlasRow([...rep(WHITE, 60), ...rep(RED, 2)]);
  const r = augmentReport(PRIMARY, texture, TABLE, NOBG);
  const redCluster = r.candidates.find((c) => c.key === "red_concrete");
  assert.ok(redCluster && redCluster.coverage < AUGMENT_DEFAULTS.minCoverage, "the red cluster is below minCoverage");
  assert.equal(r.secondary.length, 0, "no secondary from a stray-voxel cluster");
  assert.deepEqual(augmentPalette(PRIMARY, texture, TABLE, NOBG), PRIMARY);
});

// --- the fit gate: a far, real cluster with NO tight table block is not added

test("augmentPalette: an underserved cluster with no super-great table fit is rejected (fit gate)", () => {
  // magenta is far from white/black AND far from every table block (no block within fitThreshold).
  const MAGENTA = [200, 30, 200];
  const texture = atlasRow(rep(MAGENTA, 16));
  const r = augmentReport(PRIMARY, texture, TABLE, NOBG);
  const c = r.candidates[0];
  assert.ok(c.primaryDeltaE > AUGMENT_DEFAULTS.driftThreshold, "it IS underserved");
  assert.ok(c.tableDeltaE > AUGMENT_DEFAULTS.fitThreshold, "but no table block is a super-great fit");
  assert.equal(r.secondary.length, 0, "the fit gate rejects it");
});

// --- wiring: segmentMaterials({augment}) snaps within the augmented palette --

test("segmentMaterials: augment wires the secondary palette into the build (off-palette 0, total ≤ size+K)", () => {
  // a red surface under a neutral design-doc palette: without augment it would snap red→a neutral (drift);
  // with augment, red_concrete enters and the surface uses it — still palette-disciplined.
  const build = buildFrom(rep(RED, 12));
  const art = segmentMaterials(build, { palette: PRIMARY, augment: { table: TABLE }, dropColor: null });
  assert.doesNotThrow(() => assertArtifact(art), "the augmented artifact passes the real schema gate");

  const augmented = augmentPalette(PRIMARY, build.texture, TABLE, NOBG);
  const keys = art.placements.map((p) => p.block.replace(/^minecraft:/, ""));
  assert.equal(offPaletteCount(keys, augmented), 0, "DIRECTIVE: zero blocks outside the augmented palette");
  assert.ok(new Set(keys).size <= PRIMARY.length + AUGMENT_DEFAULTS.K, "distinct ≤ design-doc size + K");
  assert.ok(keys.includes("red_concrete"), "the secondary block is actually used for the red surface");
});

test("segmentMaterials: without augment the design-doc palette is untouched (regression-safe)", () => {
  const build = buildFrom(rep(RED, 12));
  const art = segmentMaterials(build, { palette: PRIMARY, dropColor: null });
  const keys = art.placements.map((p) => p.block.replace(/^minecraft:/, ""));
  assert.ok(keys.every((k) => k === "white_concrete" || k === "black_concrete"), "no augment ⇒ only primary blocks");
});
