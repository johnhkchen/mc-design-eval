import { test } from "node:test";
import assert from "node:assert/strict";
import { occupancyFromCells } from "./occupancy.mjs";
import { projectSurface } from "./surface-grid.mjs";
import { glbVoxelOccupancy, splatFromGlbOccupancy, splatFromCells, resampleBlockGrid } from "./glb-splat.mjs";

test("resampleBlockGrid maps a source block grid onto a target n×m (nearest cell)", () => {
  const src = [["a", "b"], ["c", "d"]]; // 2×2
  const up = resampleBlockGrid(src, 2, 2, 4, 4);
  assert.equal(up.n, 4);
  assert.equal(up.m, 4);
  assert.equal(up.grid[0][0], "a");
  assert.equal(up.grid[0][3], "b");
  assert.equal(up.grid[3][0], "c");
  assert.equal(up.grid[3][3], "d");
  assert.equal(up.sourceFilled, 16);
  // nulls pass through and are not counted
  const withNull = resampleBlockGrid([["a", null]], 2, 1, 2, 1);
  assert.equal(withNull.grid[0][1], null);
  assert.equal(withNull.sourceFilled, 1);
});

test("splatFromGlbOccupancy sizes the target to the build face grid (n,m)", () => {
  // a colour-true GLB occupancy (2×2×2) and a DIFFERENT-sized build face grid
  const cells = [];
  for (let x = 0; x < 2; x++) for (let y = 0; y < 2; y++) for (let z = 0; z < 2; z++) {
    cells.push({ pos: [x, y, z], block: "minecraft:spruce_planks" });
  }
  const glbOcc = occupancyFromCells(cells);
  const faceGrid = { n: 5, m: 4 }; // build face at a different resolution
  const out = splatFromGlbOccupancy(glbOcc, "+x", faceGrid);
  assert.equal(out.n, 5);
  assert.equal(out.m, 4);
  assert.equal(out.grid.length, 4);
  assert.equal(out.grid[0].length, 5);
  // every filled source cell carries the GLB block
  for (const row of out.grid) for (const c of row) if (c) assert.equal(c, "minecraft:spruce_planks");
  assert.ok(out.sourceFilled > 0);
});

test("splatFromGlbOccupancy aligns with the build face it mirrors (same dir, same fill mask scaled)", () => {
  // when the build face grid matches the GLB projection 1:1, the target equals the projected blocks
  const cells = [
    { pos: [0, 0, 0], block: "minecraft:white_terracotta" },
    { pos: [0, 1, 0], block: "minecraft:dark_oak_log" },
  ];
  const occ = occupancyFromCells(cells);
  const face = projectSurface(occ, "+x"); // 1×2 (col over z, row over y)
  const out = splatFromCells(cells, "+x", face);
  assert.equal(out.n, face.n);
  assert.equal(out.m, face.m);
  // each filled face cell's block appears at the same cell in the target
  for (let v = 0; v < face.m; v++) {
    for (let u = 0; u < face.n; u++) {
      const c = face.cells[v][u];
      if (c) assert.equal(out.grid[v][u], c.block);
      else assert.equal(out.grid[v][u], null);
    }
  }
});

test("glbVoxelOccupancy snaps sampled texture colour to the injected design palette", async () => {
  // one voxel, one vertex at its centre, a 1×1 WHITE texel → nearest palette block = white_terracotta
  const occupancy = { dims: [1, 1, 1], voxelSize: 1, bounds: { min: [0, 0, 0], max: [1, 1, 1] }, occupied: Int32Array.from([0, 0, 0]), count: 1 };
  const surface = { vertices: Float64Array.from([0.5, 0.5, 0.5]), uvs: Float64Array.from([0, 0]), bounds: occupancy.bounds, baseColor: { data: new Uint8Array(), mimeType: "image/png" } };
  const texture = { width: 1, height: 1, data: new Uint8Array([245, 240, 235, 255]) }; // near-white
  const palette = [
    { key: "white_terracotta", lab: [90, 1, 6] },
    { key: "dark_oak_log", lab: [22, 4, 8] },
  ];
  const occ = await glbVoxelOccupancy({ occupancy, surface, texture, palette });
  assert.equal(occ.size, 1);
  const [block] = [...occ.cells.values()];
  assert.equal(block, "minecraft:white_terracotta"); // white snaps to the light block, not the dark one
});

test("splat is empty (all null) when the GLB occupancy is empty", () => {
  const out = splatFromGlbOccupancy(occupancyFromCells([]), "+x", { n: 3, m: 3 });
  assert.equal(out.sourceFilled, 0);
  for (const row of out.grid) for (const c of row) assert.equal(c, null);
});
