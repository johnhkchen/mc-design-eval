// Structural CLEANLINESS metrics over a voxel occupancy — E-19 scoreboard (T-062-01, story S-062, epic E-19).
//
// E-19 regains text→JSON's clean build on the GLB-voxel path by hill-climbing on metrics. This module owns the
// STRUCTURAL half of the scoreboard: connected-component analysis over the occupancy's FACE-adjacency. TRELLIS
// reconstructions leave floating islands, duplicate masses (moai) and hallucinated connectors — ≥2 components
// where the design wants one solid mass. Nothing counted that before; this does.
//
// REUSE, NOT REIMPLEMENTATION: the flood fill lived (only) inside glb-thin's `connectedComponents`, which
// returns just {count, sizes} — no per-cell labels, no coords, so it can't say WHICH cells are stray nor
// whether an island floats below the build. We lift the labeling core here (`componentLabels`) and `glb-thin`
// now delegates to it — one flood fill, two consumers. `strayVoxelStats` builds on the labels.
//
// PURE: no GL, no GLB, no WebP, no network. Reads only `occupied`/`count` (+ `j` coords). Unit-tested offline.

import { occupiedCells } from "./glb-voxelize.mjs";

/** The 6 face-adjacent offsets (Manhattan-1) and the 26 box offsets. */
const FACE_DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const BOX_DIRS = (() => {
  const d = [];
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) {
    if (i || j || k) d.push([i, j, k]);
  }
  return d;
})();

/** Build an "i,j,k" → cell-index map over the occupied cells (occupiedCells order). */
function indexCells(occupancy) {
  const index = new Map();
  let n = 0;
  for (const [i, j, k] of occupiedCells(occupancy)) {
    index.set(`${i},${j},${k}`, n);
    n++;
  }
  return index;
}

/**
 * Label every occupied cell with its connected-component id. The shared flood-fill core (glb-thin's
 * `connectedComponents` delegates to this). `connectivity` 6 (face) or 26 (box). Iterative DFS over the
 * indexCells map; labels are assigned in discovery order (== occupiedCells order), so output is deterministic.
 * PURE.
 * @param {{occupied:Int32Array, count:number}} occupancy
 * @param {{connectivity?:number}} [opts]
 * @returns {{labels:Int32Array, sizes:number[], count:number}} labels per occupied cell; sizes in label order
 */
export function componentLabels(occupancy, { connectivity = 6 } = {}) {
  if (connectivity !== 6 && connectivity !== 26) {
    throw new Error(`componentLabels: connectivity must be 6 or 26 (got ${connectivity})`);
  }
  const dirs = connectivity === 6 ? FACE_DIRS : BOX_DIRS;
  const index = indexCells(occupancy);
  const cells = [...occupiedCells(occupancy)];
  const labels = new Int32Array(cells.length).fill(-1);
  const sizes = [];
  let label = 0;
  for (let start = 0; start < cells.length; start++) {
    if (labels[start] !== -1) continue;
    let size = 0;
    const stack = [start];
    labels[start] = label;
    while (stack.length) {
      const n = stack.pop();
      size++;
      const [ci, cj, ck] = cells[n];
      for (const [di, dj, dk] of dirs) {
        const m = index.get(`${ci + di},${cj + dj},${ck + dk}`);
        if (m !== undefined && labels[m] === -1) {
          labels[m] = label;
          stack.push(m);
        }
      }
    }
    sizes.push(size);
    label++;
  }
  return { labels, sizes, count: sizes.length };
}

/**
 * Stray-voxel / disconnected-component cleanliness over the occupancy's FACE-adjacency. A clean build is a
 * single solid mass (largestFraction 1.0); TRELLIS debris shows as extra components, a largest-fraction < 1,
 * and (when islands float beneath the build) a positive sub-floor count. PURE; color-blind (geometry only).
 * @param {{occupied:Int32Array, count:number}} occupancy
 * @param {{connectivity?:number}} [opts] default 6 (face-adjacency, per the AC)
 * @returns {{components:number, largestCount:number, largestFraction:number, strayCount:number,
 *            subFloorCount:number}}
 *   components      — number of connected components
 *   largestCount    — cells in the biggest component (the intended mass)
 *   largestFraction — largestCount / count ∈ (0,1]; 1.0 ⇔ one solid mass
 *   strayCount      — cells NOT in the largest component (floating islands / duplicate masses / debris)
 *   subFloorCount   — stray cells whose j is strictly below the largest component's lowest cell (islands
 *                     floating under the build's floor)
 */
export function strayVoxelStats(occupancy, { connectivity = 6 } = {}) {
  const total = occupancy.count;
  if (!total) return { components: 0, largestCount: 0, largestFraction: 0, strayCount: 0, subFloorCount: 0 };

  const { labels, sizes, count } = componentLabels(occupancy, { connectivity });
  // largest component: max size, lowest label index on ties (deterministic).
  let largest = 0;
  for (let l = 1; l < sizes.length; l++) if (sizes[l] > sizes[largest]) largest = l;
  const largestCount = sizes[largest];

  // the largest component's floor (min j), then sub-floor = stray cells strictly beneath it.
  const cells = [...occupiedCells(occupancy)];
  let largestMinJ = Infinity;
  for (let n = 0; n < cells.length; n++) {
    if (labels[n] === largest && cells[n][1] < largestMinJ) largestMinJ = cells[n][1];
  }
  let subFloorCount = 0;
  for (let n = 0; n < cells.length; n++) {
    if (labels[n] !== largest && cells[n][1] < largestMinJ) subFloorCount++;
  }

  return {
    components: count,
    largestCount,
    largestFraction: largestCount / total,
    strayCount: total - largestCount,
    subFloorCount,
  };
}
