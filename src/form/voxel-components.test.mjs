// Unit tests for the structural cleanliness metrics (T-062-01, E-19). PURE + offline: hand-built occupancies,
// no GL/GLB/network. Covers componentLabels, strayVoxelStats (AC stray cases), and delegation parity with
// glb-thin's connectedComponents.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  componentLabels, strayVoxelStats, pruneStrays, speckVerdict, GLB_SMOKE_SPECK_FRACTION,
} from "./voxel-components.mjs";
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

// --- pruneStrays: AC cases --------------------------------------------------

/** Helper: offset a box's cells by (di,dj,dk). */
const shift = (cells, di, dj, dk) => cells.map(([i, j, k]) => [i + di, j + dj, k + dk]);

test("pruneStrays: a tiny floating island is removed, the main mass kept", () => {
  const occ = makeOcc([10, 10, 10], [...box(3, 3, 3), [9, 9, 9]]);
  const p = pruneStrays(occ);
  assert.equal(p.count, 27, "the lone island cell is dropped");
  const s = strayVoxelStats(p);
  assert.equal(s.components, 1);
  assert.equal(s.largestFraction, 1);
});

test("pruneStrays: two large legitimate parts → both kept", () => {
  // two equal 3×3×3 masses with a gap; each is ≥ 0.5× the other → neither is stray.
  const occ = makeOcc([12, 4, 4], [...box(3, 3, 3), ...shift(box(3, 3, 3), 8, 0, 0)]);
  const p = pruneStrays(occ);
  assert.equal(p.count, 54, "both legitimate parts survive");
  assert.equal(componentLabels(p).count, 2);
});

test("pruneStrays: a moai-like half-sized duplicate mass is dropped", () => {
  // main 4×4×4 = 64; detached 3×3×3 = 27 (ratio 0.42 < 0.5) → dropped, leaving one solid mass.
  const occ = makeOcc([16, 4, 4], [...box(4, 4, 4), ...shift(box(3, 3, 3), 10, 0, 0)]);
  const p = pruneStrays(occ);
  assert.equal(p.count, 64);
  assert.equal(strayVoxelStats(p).largestFraction, 1, "after pruning the build is a single mass");
});

test("pruneStrays: size-floor boundary is inclusive (≥ floor kept, below dropped)", () => {
  // main = 8 cells (2×2×2); second component sized to hit the floor exactly. floor = 0.5 × 8 = 4.
  const main = box(2, 2, 2); // 8 cells, j 0..1
  const four = [[8, 0, 0], [9, 0, 0], [8, 1, 0], [9, 1, 0]]; // 4 cells, == floor → kept
  const three = [[8, 0, 0], [9, 0, 0], [8, 1, 0]]; //            3 cells, <  floor → dropped
  assert.equal(pruneStrays(makeOcc([12, 4, 4], [...main, ...four])).count, 12, "exactly-floor part kept");
  assert.equal(pruneStrays(makeOcc([12, 4, 4], [...main, ...three])).count, 8, "below-floor part dropped");
});

test("pruneStrays: minFraction is tunable (1.01 keeps only the largest)", () => {
  const occ = makeOcc([12, 4, 4], [...box(3, 3, 3), ...shift(box(3, 3, 3), 8, 0, 0)]);
  const p = pruneStrays(occ, { minFraction: 1.01 }); // nothing but the argmax can clear the floor
  assert.equal(p.count, 27, "only the largest (first-discovered on a tie) survives");
});

test("pruneStrays: minCells adds an absolute floor", () => {
  // two equal 3×3×3 masses (27 each); minCells 28 forces both non-largest below the absolute floor.
  const occ = makeOcc([12, 4, 4], [...box(3, 3, 3), ...shift(box(3, 3, 3), 8, 0, 0)]);
  assert.equal(pruneStrays(occ, { minCells: 28 }).count, 27, "the equal-but-sub-minCells part is dropped");
});

test("pruneStrays: no-op on a single solid mass (count unchanged)", () => {
  const occ = makeOcc([3, 3, 3], box(3, 3, 3));
  const p = pruneStrays(occ);
  assert.equal(p.count, 27);
});

test("pruneStrays: empty occupancy returned unchanged, no throw", () => {
  const occ = makeOcc([1, 1, 1], []);
  assert.equal(pruneStrays(occ).count, 0);
});

test("pruneStrays: surviving cells preserve occupiedCells order (downstream join key)", () => {
  // main block first, island last; after pruning the survivors must equal the main block IN ORDER.
  const main = box(2, 2, 2);
  const occ = makeOcc([10, 10, 10], [...main, [9, 9, 9]]);
  const p = pruneStrays(occ);
  const got = [...p.occupied];
  const want = main.flat();
  assert.deepEqual(got, want, "order preserved; only the trailing island removed");
});

test("pruneStrays: drops the stale thin diagnostic from the result", () => {
  const occ = makeOcc([10, 10, 10], [...box(3, 3, 3), [9, 9, 9]]);
  occ.thin = { surfaceOnlyCount: 1, components: 2 }; // simulate a voxelizeGlbThin field
  assert.equal("thin" in pruneStrays(occ), false, "a stale component count must not survive pruning");
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

// --- speckVerdict: the T-120-01 sub-speck-tolerant registration gate ---------


test("speckVerdict: THE BARN SHAPE — one 1-cell speck beside a 3578-cell mass passes, reported", () => {
  const v = speckVerdict([3578, 1], 3579);
  assert.equal(v.pass, true);
  assert.equal(v.specks.length, 1);
  assert.equal(v.specks[0].cells, 1);
  assert.ok(v.specks[0].fraction < 0.001);
  assert.deepEqual(v.oversize, []);
  assert.equal(v.principal.cells, 3578);
  assert.equal(v.speckFraction, GLB_SMOKE_SPECK_FRACTION);
});

test("speckVerdict: THE MOAI SHAPE — a duplicate near-half mass fails as oversize", () => {
  // recorded control: 3 components, largestFraction 0.5213
  const v = speckVerdict([5213, 4700, 87], 10000);
  assert.equal(v.pass, false);
  assert.equal(v.oversize.length, 1);
  assert.equal(v.oversize[0].cells, 4700);
  assert.equal(v.specks.length, 1, "the small shard is still a reported speck");
});

test("speckVerdict: boundary — a component exactly at the budget passes, one cell over fails", () => {
  // total 1000, budget 0.02 → 20 cells is a speck, 21 is oversize
  const at = speckVerdict([980, 20], 1000);
  assert.equal(at.pass, true);
  assert.equal(at.specks[0].cells, 20);
  const over = speckVerdict([979, 21], 1000);
  assert.equal(over.pass, false);
  assert.equal(over.oversize[0].cells, 21);
});

test("speckVerdict: many tiny specks all pass (the barn scale-32 sweep shape)", () => {
  // 8 components, total stray 1.87% spread thin — every component individually sub-budget
  const sizes = [9813, 50, 40, 30, 25, 20, 15, 7];
  const v = speckVerdict(sizes, sizes.reduce((a, b) => a + b, 0));
  assert.equal(v.pass, true);
  assert.equal(v.specks.length, 7);
  assert.deepEqual(v.specks.map((s) => s.cells), [50, 40, 30, 25, 20, 15, 7], "sorted descending");
});

test("speckVerdict: a single solid mass passes with empty lists", () => {
  const v = speckVerdict([11423], 11423);
  assert.equal(v.pass, true);
  assert.deepEqual(v.specks, []);
  assert.deepEqual(v.oversize, []);
  assert.equal(v.principal.fraction, 1);
});

test("speckVerdict: an empty voxelization fails (never registrable)", () => {
  const v = speckVerdict([], 0);
  assert.equal(v.pass, false);
  assert.deepEqual(v.principal, { cells: 0, fraction: 0 });
});

test("speckVerdict: a custom declared budget overrides the default", () => {
  const v = speckVerdict([900, 100], 1000, { speckFraction: 0.1 });
  assert.equal(v.pass, true, "a 10% component is a speck under a 0.1 budget");
  assert.equal(speckVerdict([900, 100], 1000).pass, false, "and oversize under the default");
});
