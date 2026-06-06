// Unit tests for the thin-feature-preserving voxelizer (T-059-01, E-18). Offline — reuses the in-memory
// .glb box fixture from glb-mesh.test.mjs. The headline assertions: (a) on a thick form the thin pass is
// BIT-IDENTICAL to voxelizeGlb (shell ⊆ solid — no regression, no SAT off-by-one); (b) a sub-voxel rod
// that the global voxelizer fragments becomes a SINGLE connected chain.

import { test } from "node:test";
import assert from "node:assert/strict";

import { voxelizeGlbThin, triBoxOverlap, connectedComponents } from "./glb-thin.mjs";
import { voxelizeGlb } from "./glb-voxelize.mjs";
import { buildBoxGlb } from "./glb-mesh.test.mjs";
import { SCALE_MIN, SCALE_MAX } from "../sculpture.mjs";

const occSet = (occ) => {
  const s = new Set();
  for (let n = 0; n < occ.occupied.length; n += 3) s.add(`${occ.occupied[n]},${occ.occupied[n + 1]},${occ.occupied[n + 2]}`);
  return s;
};

// --- the no-regress / superset guarantee -----------------------------------

test("voxelizeGlbThin: solid cube [0,10]³ @ scale 10 is bit-identical to voxelizeGlb (shell ⊆ solid)", () => {
  const glb = buildBoxGlb([0, 0, 0], [10, 10, 10]);
  const base = voxelizeGlb(glb, { scale: 10 });
  const thin = voxelizeGlbThin(glb, { scale: 10 });
  assert.equal(thin.count, base.count, "thick form gains no cells");
  assert.equal(thin.count, 1000);
  assert.deepEqual(Array.from(thin.occupied), Array.from(base.occupied), "identical set AND order");
  assert.equal(thin.thin.surfaceOnlyCount, 0, "no surface-only cells on a thick cube");
  assert.equal(thin.thin.components, 1);
});

test("voxelizeGlbThin: shell:false is exactly voxelizeGlb (parity escape hatch)", () => {
  const glb = buildBoxGlb([0, 0, 0], [12, 8, 8]);
  const base = voxelizeGlb(glb, { scale: 12 });
  const off = voxelizeGlbThin(glb, { scale: 12, shell: false });
  assert.deepEqual(Array.from(off.occupied), Array.from(base.occupied));
  assert.equal(off.thin.surfaceOnlyCount, 0);
});

test("voxelizeGlbThin: flat plate already ≥1 voxel is unaffected (surface ⊆ solid)", () => {
  // A 10×10×1 plate at scale 10 → voxelSize 1 → the plate is exactly 1 voxel thick: solid fill resolves
  // it fully, so the shell adds nothing.
  const glb = buildBoxGlb([0, 0, 0], [10, 10, 1]);
  const base = voxelizeGlb(glb, { scale: 10 });
  const thin = voxelizeGlbThin(glb, { scale: 10 });
  assert.deepEqual(Array.from(thin.occupied), Array.from(base.occupied));
  assert.equal(thin.thin.surfaceOnlyCount, 0);
});

// --- the central thin-rod proof --------------------------------------------

test("voxelizeGlbThin: a sub-voxel rod the global voxelizer fragments becomes ONE connected chain", () => {
  // A rod 20 long in X, 0.25 thick in Y/Z. At scale 20 the longest edge → 20 voxels (voxelSize 1), so the
  // rod is 1/4 voxel on its thin axes: cell-center parity catches it only sporadically.
  const glb = buildBoxGlb([0, 0, 0], [20, 0.25, 0.25]);
  const base = voxelizeGlb(glb, { scale: 20 });
  const thin = voxelizeGlbThin(glb, { scale: 20 });

  // The thin pass adds cells the solid fill missed and yields a single connected chain spanning the rod.
  assert.ok(thin.count > base.count, `thin recovers dropped cells (base ${base.count} → thin ${thin.count})`);
  assert.equal(thin.thin.components, 1, "the rod is one connected chain, not fragments");
  assert.ok(thin.thin.surfaceOnlyCount > 0, "thin cells = surface ∖ solid is non-empty for a sub-voxel rod");

  // The chain spans (nearly) the full rod length along X (a severed rod would not).
  const xs = new Set();
  for (let n = 0; n < thin.occupied.length; n += 3) xs.add(thin.occupied[n]);
  assert.ok(xs.size >= thin.dims[0] - 1, `chain spans the rod length in X (${xs.size}/${thin.dims[0]})`);

  // And the base build is materially worse off — the gap this ticket closes: the global voxelizer either
  // drops the sub-voxel rod entirely (0 cells) or shatters it into multiple fragments.
  const baseComponents = connectedComponents(base, { connectivity: 26 }).count;
  assert.ok(base.count === 0 || baseComponents > 1, `base drops or fragments the rod (cells ${base.count}, components ${baseComponents})`);
});

test("voxelizeGlbThin: deterministic — two runs identical", () => {
  const glb = buildBoxGlb([0, 0, 0], [16, 0.3, 0.3]);
  const a = voxelizeGlbThin(glb, { scale: 16 });
  const b = voxelizeGlbThin(glb, { scale: 16 });
  assert.deepEqual(Array.from(a.occupied), Array.from(b.occupied));
  assert.equal(a.thin.components, b.thin.components);
});

test("voxelizeGlbThin: rejects out-of-range / non-integer scale", () => {
  const glb = buildBoxGlb();
  assert.throws(() => voxelizeGlbThin(glb, { scale: SCALE_MIN - 1 }), /scale/);
  assert.throws(() => voxelizeGlbThin(glb, { scale: SCALE_MAX + 1 }), /scale/);
  assert.throws(() => voxelizeGlbThin(glb, { scale: 16.5 }), /scale/);
});

// --- the SAT geometry kernel -----------------------------------------------

test("triBoxOverlap: unit cell centered at origin, half 0.5", () => {
  const c = [0, 0, 0];
  const h = [0.5, 0.5, 0.5];
  // a triangle straddling the cell (passes through the interior)
  assert.equal(triBoxOverlap(c, h, [-1, 0, 0], [1, 0.2, 0], [0, 1, 0.1]), true);
  // a triangle fully outside (off in +X)
  assert.equal(triBoxOverlap(c, h, [5, 0, 0], [6, 1, 0], [5, 0, 1]), false);
  // a triangle coplanar with the z=0 plane crossing the cell
  assert.equal(triBoxOverlap(c, h, [-1, -1, 0], [1, -1, 0], [0, 1, 0]), true);
  // a degenerate (zero-area, collinear) triangle inside the box → no surface → false
  assert.equal(triBoxOverlap(c, h, [-0.4, 0, 0], [0, 0, 0], [0.4, 0, 0]), false);
  // a triangle clearly separated by a box face normal (above the cell in +Y)
  assert.equal(triBoxOverlap(c, h, [0, 5, 0], [1, 6, 0], [0, 5, 1]), false);
});

// --- the connectivity diagnostic -------------------------------------------

function occFromCells(cells) {
  let nx = 0, ny = 0, nz = 0;
  for (const [i, j, k] of cells) { nx = Math.max(nx, i + 1); ny = Math.max(ny, j + 1); nz = Math.max(nz, k + 1); }
  const occupied = new Int32Array(cells.length * 3);
  cells.forEach(([i, j, k], n) => { occupied[n * 3] = i; occupied[n * 3 + 1] = j; occupied[n * 3 + 2] = k; });
  return { dims: [nx, ny, nz], occupied, count: cells.length };
}

test("connectedComponents: two disjoint blobs → count 2 with the right sizes", () => {
  const occ = occFromCells([[0, 0, 0], [1, 0, 0], [0, 1, 0], [8, 8, 8], [8, 9, 8]]);
  const cc = connectedComponents(occ, { connectivity: 26 });
  assert.equal(cc.count, 2);
  assert.deepEqual(cc.sizes, [3, 2]);
});

test("connectedComponents: a single blob → count 1", () => {
  const occ = occFromCells([[0, 0, 0], [1, 0, 0], [2, 0, 0], [2, 1, 0]]);
  assert.equal(connectedComponents(occ, { connectivity: 6 }).count, 1);
});

test("connectedComponents: a diagonal-only touch joins under 26 but splits under 6", () => {
  const occ = occFromCells([[0, 0, 0], [1, 1, 1]]); // share only a corner
  assert.equal(connectedComponents(occ, { connectivity: 26 }).count, 1);
  assert.equal(connectedComponents(occ, { connectivity: 6 }).count, 2);
});

test("connectedComponents: rejects an unsupported connectivity", () => {
  const occ = occFromCells([[0, 0, 0]]);
  assert.throws(() => connectedComponents(occ, { connectivity: 18 }), /connectivity/);
});
