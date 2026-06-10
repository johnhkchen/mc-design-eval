import { test } from "node:test";
import assert from "node:assert/strict";
import { triangleStats, scaleAlignment, aabbAlignment, glbFitForPlane } from "./component-glb-fit.mjs";

/** Flatten triangle vertex triples into the parseGlbMesh positions layout. */
const soup = (...tris) => {
  const positions = new Float64Array(tris.length * 9);
  tris.forEach((t, i) => positions.set(t.flat(), i * 9));
  return { positions, triangleCount: tris.length };
};

test("triangleStats: normals, areas, centroids; degenerate zeroed", () => {
  const { positions, triangleCount } = soup(
    [[0, 0, 0], [2, 0, 0], [0, 0, 2]],   // flat in xz, area 2, normal ±y
    [[0, 0, 0], [1, 1, 1], [2, 2, 2]],   // degenerate (collinear)
  );
  const s = triangleStats(positions, triangleCount);
  assert.equal(s.areas[0], 2);
  assert.equal(Math.abs(s.normals[1]), 1, "unit ±y normal");
  assert.deepEqual([...s.centroids.slice(0, 3)], [2 / 3, 0, 2 / 3]);
  assert.equal(s.areas[1], 0);
  assert.deepEqual([...s.normals.slice(3, 6)], [0, 0, 0]);
});

test("scaleAlignment: reproduces the voxelizeGlb + keysToArtifact mapping", () => {
  const align = scaleAlignment({ min: [0, 0, 0], max: [10, 5, 10] }, 10);
  assert.equal(align.voxelSize, 1);
  assert.deepEqual(align.dims, [10, 5, 10]);
  // grid cell (0,0,0) has its center at mesh (0.5,0.5,0.5) and artifact pos (0−5, 0, 0−5)
  assert.deepEqual(align.toVoxel([0.5, 0.5, 0.5]), [-5, 0, -5]);
  // grid cell (9,4,9) center → artifact (4, 4, 4)
  assert.deepEqual(align.toVoxel([9.5, 4.5, 9.5]), [4, 4, 4]);
});

test("aabbAlignment: mesh box surfaces land on the occupancy box's outer faces", () => {
  const align = aabbAlignment(
    { min: [0, 0, 0], max: [10, 5, 10] },
    { min: [-5, 0, -5], max: [4, 4, 4] },
  );
  assert.deepEqual(align.scales, [1, 1, 1]);
  assert.deepEqual(align.toVoxel([0, 0, 0]), [-5.5, -0.5, -5.5]);
  assert.deepEqual(align.toVoxel([10, 5, 10]), [4.5, 4.5, 4.5]);
});

// identity alignment for pure fit-math tests
const IDENTITY = { mode: "test", scales: [1, 1, 1], toVoxel: (p) => p };

/** A sloped rectangular roof face y = x over x∈[x0,x1], z∈[0,8], as two triangles. */
const slopeFace = (x0, x1, slope = 1) => [
  [[x0, slope * x0, 0], [x1, slope * x1, 0], [x1, slope * x1, 8]],
  [[x0, slope * x0, 0], [x1, slope * x1, 8], [x0, slope * x0, 8]],
];

test("glbFitForPlane: recovers a synthetic gable face within a degree", () => {
  const { positions, triangleCount } = soup(...slopeFace(0, 6, 1), ...slopeFace(6, 12, -1).map(
    (t) => t.map(([x, y, z]) => [x, y + 12, z]))); // opposing face, offset to keep y = −x + 12 form
  const stats = triangleStats(positions, triangleCount);
  const extent = new Set();
  for (let x = 0; x <= 6; x++) for (let z = 0; z <= 8; z++) extent.add(`${x},${z}`);
  const len = Math.hypot(1, 1);
  const voxelFit = { normal: [-1 / len, 1 / len, 0], gradient: [1, 0], point: [3, 3, 4] };
  const fit = glbFitForPlane(stats, IDENTITY, voxelFit, extent, { minTriangles: 2 });
  assert.ok(fit, "fit found");
  assert.ok(Math.abs(fit.gradient[0] - 1) < 0.01 && Math.abs(fit.gradient[1]) < 0.01);
  assert.ok(fit.angleToVoxelDeg < 1);
  assert.ok(fit.rmse < 0.01);
  assert.equal(fit.triangles, 2, "the opposing face is outside the normal cone");
});

test("glbFitForPlane: returns null when no triangles land in the extent", () => {
  const { positions, triangleCount } = soup(...slopeFace(0, 6, 1));
  const stats = triangleStats(positions, triangleCount);
  const farExtent = new Set(["100,100", "101,100"]);
  const len = Math.hypot(1, 1);
  const voxelFit = { normal: [-1 / len, 1 / len, 0], gradient: [1, 0], point: [3, 3, 4] };
  assert.equal(glbFitForPlane(stats, IDENTITY, voxelFit, farExtent, { minTriangles: 1 }), null);
});
