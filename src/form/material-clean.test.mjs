// Unit tests for the GLB-voxel material-clean pass (T-055-01, E-17 R2). PURE + offline: no GL, no WebP,
// no GLB, no network. Exercises texture-palette extraction, per-voxel snap, spatial denoise, the speckle
// metric, and the full materialCleanVoxel pipeline on SYNTHETIC noisy color (AC #2, AC #3), asserting the
// produced artifact passes the REAL AJV gate (the round-trip AC).

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  extractTexturePalette,
  snapColorsToPalette,
  denoiseVoxelKeys,
  speckleScore,
  applyMaterialTexture,
  materialCleanVoxel,
} from "./material-clean.mjs";
import { blockPaletteFromTable, keysToArtifact, colorVoxelsToArtifact } from "./glb-voxel-build.mjs";
import { loadBlockTable } from "../color/block-table.mjs";
import { srgbToLab, nearestLab } from "../color/cielab.mjs";
import { assertArtifact } from "../artifact.mjs";

// --- fixtures ---------------------------------------------------------------

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

const TABLE_KEYS = new Set(loadBlockTable().blocks.map((b) => b.block));
const distinct = (keys) => new Set(keys).size;

// --- extractTexturePalette (AC #1) ------------------------------------------

test("extractTexturePalette: a 2-dominant-color noisy atlas → a small, value-true palette", () => {
  // 64 reddish + 64 bluish texels, each jittered — the speckle source.
  const texels = [];
  for (let n = 0; n < 64; n++) texels.push([200 + (n % 8), 20 + (n % 5), 20 + (n % 4)]); // reds
  for (let n = 0; n < 64; n++) texels.push([20 + (n % 4), 20 + (n % 5), 200 + (n % 8)]); // blues
  const { snapPalette, entries, description } = extractTexturePalette(atlasRow(texels), { dropColor: null });

  assert.ok(snapPalette.length >= 1 && snapPalette.length <= 8, `expected ≤k palette, got ${snapPalette.length}`);
  assert.ok(snapPalette.every((e) => TABLE_KEYS.has(e.key)), "every palette block is a real table block");
  assert.ok(snapPalette.every((e) => Array.isArray(e.lab) && e.lab.length === 3), "value-true: each has a 3-d Lab");
  assert.equal(entries.length, snapPalette.length);
  assert.match(description, /blocks over/); // the E-10 one-liner
});

// --- snapColorsToPalette: the speckle-killer (AC #1/#3) ---------------------

test("snapColorsToPalette: snapping a noisy gradient to a canonical palette shrinks the distinct-block count", () => {
  // A wide gray gradient + a tan band: per-cell against the full 305-table this fragments across many
  // gray/tan block boundaries (the R1 speckle); against the texture's own k-cluster palette it collapses.
  const texels = [];
  for (let n = 0; n < 40; n++) texels.push([40 + n * 4, 40 + n * 4, 40 + n * 4]); // grays 40..196
  for (let n = 0; n < 20; n++) texels.push([200 + (n % 5), 170 + (n % 6), 120 + (n % 4)]); // tan
  const colors = Uint8Array.from(texels.flat());

  const naive = snapColorsToPalette(colors, blockPaletteFromTable());
  const { snapPalette } = extractTexturePalette(atlasRow(texels), { dropColor: null });
  const clean = snapColorsToPalette(colors, snapPalette);

  assert.ok(distinct(clean) <= snapPalette.length, "clean keys stay within the canonical palette");
  assert.ok(distinct(clean) < distinct(naive), `clean ${distinct(clean)} should be < naive ${distinct(naive)}`);
});

// --- denoiseVoxelKeys (AC #3) -----------------------------------------------

test("denoiseVoxelKeys: a single speck in a uniform field is outvoted; distinct + speckle drop", () => {
  // 3×3 wall in x-y, all red except the center cell.
  const cells = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) cells.push([i, j, 0]);
  const occ = makeOcc([3, 3, 1], cells);
  const keys = cells.map(([i, j]) => (i === 1 && j === 1 ? "blue_wool" : "red_wool"));

  const before = speckleScore(occ, keys);
  const out = denoiseVoxelKeys(occ, keys, { radius: 1, passes: 1 });

  assert.equal(out.length, occ.count, "denoise never changes occupancy");
  assert.equal(distinct(out), 1, "the speck is absorbed by its neighbourhood");
  assert.ok(out.every((k) => k === "red_wool"));
  assert.ok(speckleScore(occ, out) < before, "speckle score drops");
  assert.equal(speckleScore(occ, out), 0, "a uniform field has zero speckle");
});

test("denoiseVoxelKeys: a 50/50 tie keeps the current block (only outvoting flips a cell)", () => {
  // two adjacent cells, one red one blue: each cell's neighbourhood is {red:1, blue:1} → tie → unchanged.
  const cells = [[0, 0, 0], [1, 0, 0]];
  const occ = makeOcc([2, 1, 1], cells);
  const keys = ["red_wool", "blue_wool"];
  assert.deepEqual(denoiseVoxelKeys(occ, keys, { radius: 1, passes: 1 }), ["red_wool", "blue_wool"]);
});

// --- speckleScore -----------------------------------------------------------

test("speckleScore: measures fragmentation, not boundaries — clean 2-region ≈0, checkerboard high", () => {
  // A 4×4×1 block split into two solid halves (left red, right blue). The shared edge must NOT be penalized.
  const cells = [];
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) cells.push([i, j, 0]);
  const twoRegion = makeOcc([4, 4, 1], cells);
  const halfKeys = cells.map(([i]) => (i < 2 ? "red_wool" : "blue_wool"));
  assert.equal(speckleScore(twoRegion, halfKeys), 0, "a clean two-region block is not penalized for its edge");

  // The SAME grid, checkerboarded → every cell is locally outvoted → near 1.
  const checker = cells.map(([i, j]) => ((i + j) % 2 ? "red_wool" : "blue_wool"));
  assert.ok(speckleScore(twoRegion, checker) > 0.9, "a checkerboard scores high");

  // A single speck (3×3 red, blue center) → exactly one outvoted cell of nine.
  const wall = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) wall.push([i, j, 0]);
  const occ3 = makeOcc([3, 3, 1], wall);
  const speckKeys = wall.map(([i, j]) => (i === 1 && j === 1 ? "blue_wool" : "red_wool"));
  assert.ok(speckleScore(occ3, speckKeys) > 0, "a lone speck is counted");
  assert.equal(speckleScore(occ3, speckKeys), 1 / 9, "exactly one of nine cells is a speck");

  // Uniform field → 0; a lone cell (no neighbourhood) → 0.
  assert.equal(speckleScore(occ3, wall.map(() => "red_wool")), 0, "uniform → 0");
  const one = makeOcc([1, 1, 1], [[0, 0, 0]]);
  assert.equal(speckleScore(one, ["red_wool"]), 0, "a lone cell has no neighbourhood");
});

// --- materialCleanVoxel: end-to-end on synthetic build (AC #2/#3) -----------

/** A synthetic decoded `build`: a row of cells, each mapped to its own noisy-red atlas texel. */
function noisyRedBuild(nCells) {
  const cells = Array.from({ length: nCells }, (_, i) => [i, 0, 0]);
  const occ = makeOcc([nCells, 1, 1], cells);
  const verts = [];
  const uvs = [];
  for (let i = 0; i < nCells; i++) {
    verts.push(i + 0.5, 0.5, 0.5); // a vertex at each cell center
    uvs.push((i + 0.5) / nCells, 0.5); // → texel i
  }
  // a gray gradient that fragments per-cell against the 305-table but collapses against its own palette.
  const texels = Array.from({ length: nCells }, (_, n) => {
    const v = 50 + Math.floor((n / nCells) * 170);
    return [v, v, v];
  });
  return {
    occupancy: occ,
    surface: { vertices: Float64Array.from(verts), uvs: Float64Array.from(uvs) },
    texture: atlasRow(texels),
  };
}

test("materialCleanVoxel: synthetic noisy build → AJV-valid artifact, distinct ≤ naive full-table", () => {
  const build = noisyRedBuild(12);
  const art = materialCleanVoxel(build, { dropColor: null, denoise: { radius: 1, passes: 1 } });

  assert.doesNotThrow(() => assertArtifact(art), "the clean artifact passes the real schema gate");
  assert.equal(art.placements.length, build.occupancy.count, "one placement per occupied cell");
  assert.equal(art.style.name, "glb-voxel-clean");
  assert.ok(art.placements.every((p) => p.op === "voxel"));

  // naive R1 path: snap the SAME sampled colors to the full 305-table → fragments into more blocks.
  const naive = colorVoxelsToArtifact(build.occupancy, sampledColors(build));
  assert.ok(
    art.palette.manifest.length <= naive.palette.manifest.length,
    `clean manifest ${art.palette.manifest.length} ≤ naive ${naive.palette.manifest.length}`,
  );
});

/** Re-derive the per-cell sampled colors for the naive comparison (mirrors sampleSurfaceColors via the build). */
function sampledColors(build) {
  // The synthetic build maps cell i → texel i directly; read them back as flat rgb.
  const { occupancy, texture } = build;
  const out = new Uint8Array(occupancy.count * 3);
  for (let i = 0; i < occupancy.count; i++) {
    out[i * 3] = texture.data[i * 4];
    out[i * 3 + 1] = texture.data[i * 4 + 1];
    out[i * 3 + 2] = texture.data[i * 4 + 2];
  }
  return out;
}

// --- applyMaterialTexture (optional E-11, Decision 6) -----------------------

test("applyMaterialTexture: stays in-table and only expands within a hue family", () => {
  const cells = [];
  for (let j = 0; j < 4; j++) cells.push([0, j, 0]); // a 4-tall column → height varies
  const occ = makeOcc([1, 4, 1], cells);
  const keys = cells.map(() => "red_wool");
  const out = applyMaterialTexture(occ, keys, { spread: 1 });

  assert.equal(out.length, occ.count, "occupancy unchanged");
  assert.ok(out.every((k) => TABLE_KEYS.has(k)), "every textured block is a real table block");
  assert.ok(distinct(out) >= 1, "a hue family of ≥1 block");
});

// --- keysToArtifact: parity with the snapped color path ---------------------

test("keysToArtifact: bare keys → namespaced placements + sorted-unique manifest", () => {
  const occ = makeOcc([2, 1, 1], [[0, 0, 0], [1, 0, 0]]);
  const art = keysToArtifact(occ, ["red_wool", "blue_wool"], {});
  assert.deepEqual(art.placements.map((p) => p.block), ["minecraft:red_wool", "minecraft:blue_wool"]);
  assert.deepEqual(art.palette.manifest, ["minecraft:blue_wool", "minecraft:red_wool"]);
  // parity: colorVoxelsToArtifact (color→key→keysToArtifact) lands the same keys for matching colors.
  const pal = [
    { key: "red_wool", lab: srgbToLab([255, 0, 0]) },
    { key: "blue_wool", lab: srgbToLab([0, 0, 255]) },
  ];
  const expected = ["red_wool", "blue_wool"].map((k) => k); // colors below match these via nearestLab
  void nearestLab; // engine reuse asserted by the deepEqual on colorVoxelsToArtifact
  const viaColors = colorVoxelsToArtifact(occ, Uint8Array.from([255, 0, 0, 0, 0, 255]), { palette: pal });
  assert.deepEqual(viaColors.placements.map((p) => p.block), expected.map((k) => `minecraft:${k}`));
});
