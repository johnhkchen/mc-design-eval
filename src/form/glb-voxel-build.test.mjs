// Unit tests for the GLB-voxel color/compile core (T-051-01). PURE + offline: no GL, no WebP, no GLB,
// no network. The color/compile logic is exercised on SYNTHETIC occupancy + synthetic surface colors
// (AC #2), and the produced artifact is asserted to pass the REAL AJV gate (the round-trip AC).

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  blockPaletteFromTable,
  paletteFromManifest,
  sampleSurfaceColors,
  colorVoxelsToArtifact,
} from "./glb-voxel-build.mjs";
import { srgbToLab, nearestLab } from "../color/cielab.mjs";
import { assertArtifact } from "../artifact.mjs";

// A 2×1×2 occupancy (4 cells, one floor layer). occupied is flat [i,j,k] triples (T-050-01 contract).
function occ2x1x2() {
  return {
    scale: 2,
    voxelSize: 1,
    dims: [2, 1, 2],
    bounds: { min: [0, 0, 0], max: [2, 1, 2] },
    occupied: Int32Array.from([0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 1]),
    count: 4,
  };
}

// A tiny 2-entry palette so block assignment is exact: pure-red and pure-blue anchors.
const TINY_PALETTE = [
  { key: "red_wool", lab: srgbToLab([255, 0, 0]) },
  { key: "blue_wool", lab: srgbToLab([0, 0, 255]) },
];

test("paletteFromManifest: confines candidates to the design-doc manifest (namespace-tolerant)", () => {
  const table = {
    blocks: [
      { block: "red_terracotta", lab: [40, 30, 20] },
      { block: "red_concrete", lab: [45, 50, 30] },
      { block: "lapis_block", lab: [30, 10, -40] },
      { block: "gold_block", lab: [80, 5, 70] },
    ],
  };
  // namespaced manifest of 2 blocks → exactly those 2, prefix stripped, others excluded
  const pal = paletteFromManifest(["minecraft:red_terracotta", "minecraft:lapis_block"], table);
  assert.deepEqual(pal.map((p) => p.key).sort(), ["lapis_block", "red_terracotta"]);
  // a manifest block absent from the value-true table (e.g. a non-full-cube) is dropped, not fatal
  const pal2 = paletteFromManifest(["red_concrete", "oak_stairs"], table);
  assert.deepEqual(pal2.map((p) => p.key), ["red_concrete"]);
  // empty manifest and total non-resolution both throw
  assert.throws(() => paletteFromManifest([], table), /non-empty/);
  assert.throws(() => paletteFromManifest(["nonexistent_block"], table), /no manifest block resolved/);
});

test("paletteFromManifest: result is a strict subset of the full table (no leakage to the universe)", () => {
  const table = blockPaletteFromTable();
  const manifest = ["minecraft:red_terracotta", "minecraft:gold_block", "minecraft:lapis_block"];
  const pal = paletteFromManifest(manifest, { blocks: table.map((p) => ({ block: p.key, lab: p.lab })) });
  assert.ok(pal.length <= manifest.length && pal.length > 0);
  assert.ok(pal.length < table.length); // far smaller than the 305-block universe — the whole point
});

test("colorVoxelsToArtifact: 2 red + 2 blue cells → valid artifact, sorted-unique 2-block manifest", () => {
  const colors = Uint8Array.from([255, 0, 0, 255, 0, 0, 0, 0, 255, 0, 0, 255]); // red, red, blue, blue
  const art = colorVoxelsToArtifact(occ2x1x2(), colors, { palette: TINY_PALETTE });

  assert.equal(art.placements.length, 4);
  assert.ok(art.placements.every((p) => p.op === "voxel"));
  assert.deepEqual(art.palette.manifest, ["minecraft:blue_wool", "minecraft:red_wool"]);
  // round-trip: the produced artifact passes the real schema gate (does not throw).
  assert.doesNotThrow(() => assertArtifact(art));

  // each red cell → red_wool, each blue cell → blue_wool (occupiedCells order)
  assert.deepEqual(art.placements.map((p) => p.block), [
    "minecraft:red_wool", "minecraft:red_wool", "minecraft:blue_wool", "minecraft:blue_wool",
  ]);
});

test("colorVoxelsToArtifact: positions are i/j/k with x,z centered, y up from ground", () => {
  const colors = new Uint8Array(12); // all-black; blocks irrelevant here
  const art = colorVoxelsToArtifact(occ2x1x2(), colors, { palette: TINY_PALETTE });
  // dims [2,1,2] → ox=oz=1; cells (0,0,0)(1,0,0)(0,0,1)(1,0,1) → centered positions, all distinct.
  assert.deepEqual(art.placements.map((p) => p.pos), [
    [-1, 0, -1], [0, 0, -1], [-1, 0, 0], [0, 0, 0],
  ]);
});

test("colorVoxelsToArtifact: metadata defaults are the glb-voxel identity, overridable", () => {
  const art = colorVoxelsToArtifact(occ2x1x2(), new Uint8Array(12), {
    palette: TINY_PALETTE,
    metadata: { trial_id: "koi-glb-voxel" },
  });
  assert.equal(art.metadata.prompting_method_id, "glb-voxel.v1");
  assert.equal(art.metadata.trial_id, "koi-glb-voxel"); // override merged
  assert.equal(art.style.name, "glb-voxel");
});

test("colorVoxelsToArtifact: throws on empty occupancy and on color-length mismatch", () => {
  const empty = { ...occ2x1x2(), occupied: Int32Array.from([]), count: 0 };
  assert.throws(() => colorVoxelsToArtifact(empty, new Uint8Array(0), { palette: TINY_PALETTE }), /no cells/);
  assert.throws(
    () => colorVoxelsToArtifact(occ2x1x2(), new Uint8Array(9), { palette: TINY_PALETTE }),
    /3·count/,
  );
});

test("sampleSurfaceColors: each cell samples the texel at its nearest vertex's UV", () => {
  const occupancy = {
    voxelSize: 1,
    bounds: { min: [0, 0, 0] },
    occupied: Int32Array.from([0, 0, 0, 1, 0, 1]),
    count: 2,
  };
  // vertex 0 sits at cell-(0,0,0) center, UV (0.25,0.25); vertex 1 at cell-(1,0,1) center, UV (0.75,0.75).
  const surface = {
    vertices: Float64Array.from([0.5, 0.5, 0.5, 1.5, 0.5, 1.5]),
    uvs: Float64Array.from([0.25, 0.25, 0.75, 0.75]),
  };
  // 2×2 RGBA. UV (0.25,0.25) → px0,py1 → offset (1*2+0)*4 = 8; UV (0.75,0.75) → px1,py0 → offset 4.
  const data = new Uint8Array(16);
  data.set([10, 20, 30], 4); // pixel (x=1,y=0)
  data.set([40, 50, 60], 8); // pixel (x=0,y=1)
  const texture = { width: 2, height: 2, data };

  const out = sampleSurfaceColors({ occupancy, surface, texture });
  assert.deepEqual(Array.from(out), [40, 50, 60, 10, 20, 30]);
});

test("sampleSurfaceColors: handles a 3-channel (RGB) texture too", () => {
  const occupancy = { voxelSize: 1, bounds: { min: [0, 0, 0] }, occupied: Int32Array.from([0, 0, 0]), count: 1 };
  const surface = { vertices: Float64Array.from([0.5, 0.5, 0.5]), uvs: Float64Array.from([0.25, 0.25]) };
  const data = new Uint8Array(2 * 2 * 3); // RGB, 3 channels
  data.set([7, 8, 9], (1 * 2 + 0) * 3); // pixel (x=0,y=1)
  const out = sampleSurfaceColors({ occupancy, surface, texture: { width: 2, height: 2, data } });
  assert.deepEqual(Array.from(out), [7, 8, 9]);
});

test("blockPaletteFromTable: the committed 305-block table → non-empty {key,lab} palette", () => {
  const pal = blockPaletteFromTable();
  assert.ok(pal.length >= 300, `expected ~305 blocks, got ${pal.length}`);
  assert.ok(pal.every((e) => typeof e.key === "string" && Array.isArray(e.lab) && e.lab.length === 3));
  // a mid-gray maps to SOME real block (sanity, not an exact id)
  const hit = nearestLab(srgbToLab([128, 128, 128]), pal);
  assert.ok(typeof hit.key === "string" && hit.key.length > 0);
});

test("blockPaletteFromTable: rejects an empty/garbage table", () => {
  assert.throws(() => blockPaletteFromTable({ blocks: [] }), /non-empty/);
});
