// Unit tests for the GLB voxelizer. Offline — reuses the in-memory .glb box from glb-mesh.test.mjs.
// The headline assertion is the exact solid-cube count (proves grid sizing, the scale convention, the
// ray-parity inside test, and deterministic edge-coincidence handling all at once).

import { test } from "node:test";
import assert from "node:assert/strict";

import { voxelizeGlb, pointInMesh, rayTriParityX, occupiedCells } from "./glb-voxelize.mjs";
import { buildBoxGlb } from "./glb-mesh.test.mjs";
import { SCALE_MIN, SCALE_MAX } from "../sculpture.mjs";

// A solid-cube triangle soup (same layout parseGlbMesh emits) for direct pointInMesh tests.
function cubeSoup(min, size) {
  const c = (i) => [
    [min[0], min[1], min[2]], [min[0] + size, min[1], min[2]], [min[0] + size, min[1] + size, min[2]], [min[0], min[1] + size, min[2]],
    [min[0], min[1], min[2] + size], [min[0] + size, min[1], min[2] + size], [min[0] + size, min[1] + size, min[2] + size], [min[0], min[1] + size, min[2] + size],
  ][i];
  const tri = [0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 3, 7, 6, 3, 6, 2, 0, 4, 7, 0, 7, 3, 1, 2, 6, 1, 6, 5];
  const pos = [];
  for (let t = 0; t < tri.length; t += 3) for (const vi of [tri[t], tri[t + 1], tri[t + 2]]) pos.push(...c(vi));
  return { positions: Float64Array.from(pos), triangleCount: tri.length / 3 };
}

test("voxelizeGlb: solid cube [0,10]³ at scale 10 → exactly 1000 occupied cells", () => {
  const occ = voxelizeGlb(buildBoxGlb([0, 0, 0], [10, 10, 10]), { scale: 10 });
  assert.deepEqual(occ.dims, [10, 10, 10]);
  assert.equal(occ.voxelSize, 1);
  assert.equal(occ.count, 1000);
  assert.equal(occ.occupied.length, 3000);
});

test("voxelizeGlb: longest edge gets `scale` voxels; shorter axes scale proportionally", () => {
  // box 20×10×10 at scale 20 → voxelSize 1 → dims [20,10,10], solid count 2000
  const occ = voxelizeGlb(buildBoxGlb([0, 0, 0], [20, 10, 10]), { scale: 20 });
  assert.deepEqual(occ.dims, [20, 10, 10]);
  assert.equal(occ.count, 20 * 10 * 10);
});

test("voxelizeGlb: bounds are echoed from the mesh AABB", () => {
  const occ = voxelizeGlb(buildBoxGlb([-3, 1, 2], [8, 8, 8]), { scale: 16 });
  assert.deepEqual(occ.bounds.min, [-3, 1, 2]);
  assert.deepEqual(occ.bounds.max, [5, 9, 10]);
});

test("voxelizeGlb: deterministic — two runs produce identical occupancy", () => {
  const glb = buildBoxGlb([0, 0, 0], [12, 8, 8]);
  const a = voxelizeGlb(glb, { scale: 12 });
  const b = voxelizeGlb(glb, { scale: 12 });
  assert.deepEqual(Array.from(a.occupied), Array.from(b.occupied));
});

test("voxelizeGlb: occupiedCells iterates [i,j,k] tuples consistent with count", () => {
  const occ = voxelizeGlb(buildBoxGlb([0, 0, 0], [8, 8, 8]), { scale: 8 });
  const cells = [...occupiedCells(occ)];
  assert.equal(cells.length, occ.count);
  assert.ok(cells.every((c) => c.length === 3 && c.every(Number.isInteger)));
});

test("voxelizeGlb: rejects out-of-range / non-integer scale", () => {
  const glb = buildBoxGlb();
  assert.throws(() => voxelizeGlb(glb, { scale: SCALE_MIN - 1 }), /scale/);
  assert.throws(() => voxelizeGlb(glb, { scale: SCALE_MAX + 1 }), /scale/);
  assert.throws(() => voxelizeGlb(glb, { scale: 16.5 }), /scale/);
});

test("pointInMesh: inside true, outside false", () => {
  const { positions, triangleCount } = cubeSoup([0, 0, 0], 10);
  assert.equal(pointInMesh(5, 5, 5, positions, triangleCount), true); // center
  assert.equal(pointInMesh(5, 5.123, 4.77, positions, triangleCount), true); // off-axis interior
  assert.equal(pointInMesh(15, 5, 5, positions, triangleCount), false); // +X outside
  assert.equal(pointInMesh(-1, 5, 5, positions, triangleCount), false); // -X outside
  assert.equal(pointInMesh(5, 11, 5, positions, triangleCount), false); // above
});

test("rayTriParityX: forward crossing = 1, miss = 0, behind = 0", () => {
  // triangle in the plane x=2, spanning y,z around the origin ray (0,0,0)→+X
  const hit = rayTriParityX(0, 0.25, 0.25, 2, 0, 0, 2, 1, 0, 2, 0, 1);
  assert.equal(hit, 1);
  const miss = rayTriParityX(0, 5, 5, 2, 0, 0, 2, 1, 0, 2, 0, 1); // ray well outside the triangle
  assert.equal(miss, 0);
  const behind = rayTriParityX(0, 0.25, 0.25, -2, 0, 0, -2, 1, 0, -2, 0, 1); // triangle behind origin
  assert.equal(behind, 0);
});
