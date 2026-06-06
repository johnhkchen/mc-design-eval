// Unit tests for the structural cleanliness metrics (T-062-01, E-19). PURE + offline: hand-built occupancies,
// no GL/GLB/network. Covers componentLabels, strayVoxelStats (AC stray cases), and delegation parity with
// glb-thin's connectedComponents.

import { test } from "node:test";
import assert from "node:assert/strict";

import { componentLabels, strayVoxelStats } from "./voxel-components.mjs";
import { connectedComponents } from "./glb-thin.mjs";

/** Occupancy from a dims triple + an ordered [i,j,k] cell list (occupiedCells order = list order). */
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

/** Every cell of an a×b×c box. */
function box(a, b, c) {
  const cells = [];
  for (let i = 0; i < a; i++) for (let j = 0; j < b; j++) for (let k = 0; k < c; k++) cells.push([i, j, k]);
  return cells;
}

// --- strayVoxelStats: AC cases ----------------------------------------------

test("strayVoxelStats: a solid mass → one component, fraction 1, no stray", () => {
  const occ = makeOcc([3, 3, 3], box(3, 3, 3));
  const s = strayVoxelStats(occ);
  assert.equal(s.components, 1);
  assert.equal(s.largestFraction, 1);
  assert.equal(s.strayCount, 0);
  assert.equal(s.subFloorCount, 0);
  assert.equal(s.largestCount, 27);
});

test("strayVoxelStats: a single floating island → counted as stray (fraction < 1)", () => {
  // a 3×3×3 mass (27 cells) + one detached cell far away (gap ≥1 on every axis).
  const occ = makeOcc([10, 10, 10], [...box(3, 3, 3), [9, 9, 9]]);
  const s = strayVoxelStats(occ);
  assert.equal(s.components, 2);
  assert.ok(s.largestFraction < 1, "largest fraction drops below 1 when an island exists");
  assert.equal(s.largestCount, 27);
  assert.equal(s.strayCount, 1, "the lone island cell is stray");
});

test("strayVoxelStats: a multi-cell island contributes all its cells to strayCount", () => {
  const occ = makeOcc([12, 4, 4], [...box(3, 3, 3), ...box(2, 2, 2).map(([i, j, k]) => [i + 8, j, k])]);
  const s = strayVoxelStats(occ);
  assert.equal(s.components, 2);
  assert.equal(s.largestCount, 27);
  assert.equal(s.strayCount, 8, "the 2×2×2 island = 8 stray cells");
});

test("strayVoxelStats: sub-floor counts only islands BELOW the main mass floor", () => {
  // main mass occupies j∈[2..4]; an island cell at j=0 is sub-floor, one at j=9 is not.
  const main = box(3, 3, 3).map(([i, j, k]) => [i, j + 2, k]); // j 2..4
  const below = makeOcc([12, 12, 12], [...main, [9, 0, 9]]);
  const above = makeOcc([12, 12, 12], [...main, [9, 9, 9]]);
  assert.equal(strayVoxelStats(below).subFloorCount, 1, "island under the floor counts");
  assert.equal(strayVoxelStats(above).subFloorCount, 0, "island above the mass does not");
  assert.equal(strayVoxelStats(above).strayCount, 1, "but it is still stray");
});

test("strayVoxelStats: empty occupancy → all-zero struct, no throw", () => {
  const occ = makeOcc([1, 1, 1], []);
  assert.deepEqual(strayVoxelStats(occ), {
    components: 0, largestCount: 0, largestFraction: 0, strayCount: 0, subFloorCount: 0,
  });
});

// --- componentLabels: core invariants + connectivity ------------------------

test("componentLabels: labels align to occupiedCells order; sizes sum to count", () => {
  const occ = makeOcc([10, 10, 10], [...box(2, 2, 2), [9, 9, 9]]);
  const { labels, sizes, count } = componentLabels(occ);
  assert.equal(labels.length, occ.count);
  assert.equal(count, 2);
  assert.equal(sizes.reduce((a, b) => a + b, 0), occ.count);
  assert.notEqual(labels[0], labels[labels.length - 1], "the lone cell is a different component");
});

test("componentLabels: 6- vs 26-connectivity differ on a diagonal-only contact", () => {
  // two cells touching only at a corner: 6-conn → 2 components, 26-conn → 1.
  const occ = makeOcc([2, 2, 2], [[0, 0, 0], [1, 1, 1]]);
  assert.equal(componentLabels(occ, { connectivity: 6 }).count, 2);
  assert.equal(componentLabels(occ, { connectivity: 26 }).count, 1);
});

test("componentLabels: rejects a bad connectivity", () => {
  const occ = makeOcc([1, 1, 1], [[0, 0, 0]]);
  assert.throws(() => componentLabels(occ, { connectivity: 4 }), /connectivity must be 6 or 26/);
});

// --- delegation parity: glb-thin's connectedComponents uses this core --------

test("connectedComponents delegates to componentLabels (same sizes, sorted desc)", () => {
  const occ = makeOcc([12, 4, 4], [...box(3, 3, 3), ...box(2, 2, 2).map(([i, j, k]) => [i + 8, j, k]), [11, 3, 3]]);
  for (const connectivity of [6, 26]) {
    const cc = connectedComponents(occ, { connectivity });
    const core = componentLabels(occ, { connectivity });
    assert.equal(cc.count, core.count);
    assert.deepEqual(cc.sizes, [...core.sizes].sort((a, b) => b - a));
  }
});
