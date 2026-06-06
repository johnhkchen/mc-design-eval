import { test } from "node:test";
import assert from "node:assert/strict";
import { artifactOccupancy, occupancyFromCells, bareBlock } from "./occupancy.mjs";

test("bareBlock strips the minecraft: namespace", () => {
  assert.equal(bareBlock("minecraft:stone"), "stone");
  assert.equal(bareBlock("stone"), "stone");
});

test("occupancyFromCells: bounds/dims/has/block on a 2×2×2 cube", () => {
  const cells = [];
  for (let x = 0; x < 2; x++) for (let y = 0; y < 2; y++) for (let z = 0; z < 2; z++) {
    cells.push({ pos: [x, y, z], block: "minecraft:stone" });
  }
  const occ = occupancyFromCells(cells);
  assert.deepEqual(occ.bounds, { min: [0, 0, 0], max: [1, 1, 1] });
  assert.deepEqual(occ.dims, [2, 2, 2]);
  assert.equal(occ.size, 8);
  assert.ok(occ.has(1, 1, 1));
  assert.ok(!occ.has(2, 0, 0));
  assert.equal(occ.block(0, 0, 0), "minecraft:stone");
  assert.equal(occ.block(5, 5, 5), null);
});

test("occupancyFromCells: negative coordinates (cottage-like) keep artifact space", () => {
  const occ = occupancyFromCells([
    { pos: [-13, 1, -9], block: "minecraft:cobblestone" },
    { pos: [-10, 4, 7], block: "minecraft:white_terracotta" },
  ]);
  assert.deepEqual(occ.bounds, { min: [-13, 1, -9], max: [-10, 4, 7] });
  assert.deepEqual(occ.dims, [4, 4, 17]);
  assert.equal(occ.block(-13, 1, -9), "minecraft:cobblestone");
});

test("occupancyFromCells: last write wins (dedup by key)", () => {
  const occ = occupancyFromCells([
    { pos: [0, 0, 0], block: "minecraft:stone" },
    { pos: [0, 0, 0], block: "minecraft:oak_planks" },
  ]);
  assert.equal(occ.size, 1);
  assert.equal(occ.block(0, 0, 0), "minecraft:oak_planks");
});

test("artifactOccupancy: expands placements via the canonical expander", () => {
  const artifact = {
    placements: [
      { op: "fill", from: [0, 0, 0], to: [2, 0, 0], block: "minecraft:stone" },
      { op: "voxel", pos: [1, 1, 0], block: "minecraft:glowstone" },
    ],
  };
  const occ = artifactOccupancy(artifact);
  assert.equal(occ.size, 4); // 3 from the fill + 1 voxel
  assert.ok(occ.has(0, 0, 0) && occ.has(2, 0, 0) && occ.has(1, 1, 0));
  assert.equal(occ.block(1, 1, 0), "minecraft:glowstone");
  assert.deepEqual(occ.bounds, { min: [0, 0, 0], max: [2, 1, 0] });
});

test("artifactOccupancy: empty artifact degrades, does not throw", () => {
  const occ = artifactOccupancy({ placements: [] });
  assert.equal(occ.bounds, null);
  assert.deepEqual(occ.dims, [0, 0, 0]);
  assert.equal(occ.size, 0);
  assert.ok(!occ.has(0, 0, 0));
});
