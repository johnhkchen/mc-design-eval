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

// ---- T-097-01: the fixture third class -------------------------------------------------------------

import { solidOccupancy } from "./occupancy.mjs";

test("third class: forms/states sparse, formOf/solid distinguish fixture cells", () => {
  const occ = occupancyFromCells([
    { pos: [0, 0, 0], block: "minecraft:stone" },
    { pos: [1, 0, 0], block: "minecraft:oak_fence", form: "rail", state: { east: "true", west: "true" } },
    { pos: [2, 0, 0], block: "minecraft:spruce_trapdoor", form: "fixture", state: { facing: "north", open: "true" } },
  ]);
  assert.equal(occ.size, 3);
  assert.equal(occ.forms.size, 2);
  assert.equal(occ.formOf(0, 0, 0), "cube");
  assert.equal(occ.formOf(1, 0, 0), "rail");
  assert.equal(occ.formOf(2, 0, 0), "fixture");
  assert.equal(occ.formOf(9, 9, 9), null);
  assert.ok(occ.solid(0, 0, 0));
  assert.ok(!occ.solid(1, 0, 0), "a rail cell is occupied but NOT solid");
  assert.ok(occ.has(1, 0, 0), "…yet still occupied");
  assert.ok(!occ.solid(9, 9, 9));
  assert.deepEqual(occ.states.get("2,0,0"), { facing: "north", open: "true" });
});

test("third class: cube-only input leaves forms empty and solidOccupancy returns the SAME object", () => {
  const occ = occupancyFromCells([
    { pos: [0, 0, 0], block: "minecraft:stone" },
    { pos: [1, 0, 0], block: "minecraft:oak_planks" },
  ]);
  assert.equal(occ.forms.size, 0);
  assert.equal(occ.states.size, 0);
  assert.ok(occ.solid(0, 0, 0));
  assert.equal(solidOccupancy(occ), occ, "identity — zero cost for every existing build");
});

test("third class: last write wins WHOLE — a cube overwrite un-fixtures the cell", () => {
  const occ = occupancyFromCells([
    { pos: [0, 0, 0], block: "minecraft:oak_fence", form: "rail", state: { north: "true" } },
    { pos: [0, 0, 0], block: "minecraft:stone" },
  ]);
  assert.equal(occ.size, 1);
  assert.equal(occ.formOf(0, 0, 0), "cube");
  assert.ok(occ.solid(0, 0, 0));
  assert.equal(occ.states.size, 0, "the stale state must not survive the overwrite");
});

test("solidOccupancy drops fixture cells and recomputes bounds", () => {
  const occ = occupancyFromCells([
    { pos: [0, 0, 0], block: "minecraft:stone" },
    { pos: [5, 0, 0], block: "minecraft:oak_fence", form: "rail" },
  ]);
  const solid = solidOccupancy(occ);
  assert.notEqual(solid, occ);
  assert.equal(solid.size, 1);
  assert.ok(!solid.has(5, 0, 0));
  assert.deepEqual(solid.bounds, { min: [0, 0, 0], max: [0, 0, 0] });
  // the source occupancy is untouched
  assert.equal(occ.size, 2);
});

test("artifactOccupancy: state carried, form derived via the kit classifier by default", () => {
  const artifact = {
    placements: [
      { op: "fill", from: [0, 0, 0], to: [2, 0, 0], block: "minecraft:stone" },
      { op: "voxel", pos: [1, 1, 0], block: "minecraft:oak_fence", state: { east: "true", west: "true" } },
      { op: "voxel", pos: [2, 1, 0], block: "minecraft:spruce_trapdoor", state: { facing: "south", open: "true" } },
    ],
  };
  const occ = artifactOccupancy(artifact);
  assert.equal(occ.formOf(0, 0, 0), "cube");
  assert.equal(occ.formOf(1, 1, 0), "rail", "fence classifies rail (kit ground truth)");
  assert.equal(occ.formOf(2, 1, 0), "fixture");
  assert.deepEqual(occ.states.get("1,1,0"), { east: "true", west: "true" });
  assert.ok(!occ.solid(2, 1, 0));
});

test("artifactOccupancy: injectable classifier overrides the default", () => {
  const artifact = {
    placements: [{ op: "voxel", pos: [0, 0, 0], block: "minecraft:stone" }],
  };
  const occ = artifactOccupancy(artifact, { formOf: () => "fixture" });
  assert.equal(occ.formOf(0, 0, 0), "fixture");
});
