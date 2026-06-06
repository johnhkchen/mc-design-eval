// GLB → thin-feature-preserving occupancy — E-18 thin-form fix (T-059-01, story S-059).
//
// THE FOUNDING GAP. voxelizeGlb (E-16) decides occupancy by ONE point-in-mesh parity test at each
// cell CENTER. A member thinner than `voxelSize` only registers where a center happens to land inside
// it → it drops out or stair-steps into disconnected fragments. Bow-and-arrow voxelizes worst of the 7
// subjects (form IoU 0.473): the bowstave, the string, and the arrow shaft are sub-voxel thick at the
// global scale, so the build is mostly air and the line that DEFINES a bow is severed.
//
// THE MECHANISM. Two occupancy sources, unioned:
//   1. SOLID FILL — the existing pointInMesh parity test (glb-voxelize.mjs), unchanged: the thick interior.
//   2. SURFACE TRACE — mark every voxel whose AABB overlaps any triangle (exact Akenine-Möller 13-axis
//      triangle–box SAT). This captures the mesh SURFACE regardless of thickness, so a sub-voxel rod's
//      triangles each mark the cells they pass through → a continuous ~1-voxel tube.
//   occupancy = solidFill ∪ surfaceTrace.
//
// WHY CONNECTIVITY IS GUARANTEED. A thin member's surface is a CONNECTED manifold of triangles spanning
// its length; conservative voxelization of two edge-adjacent triangles marks the shared edge's cells
// from both → their voxel sets touch (≥26-connected). A connected surface ⇒ a connected voxel set, so
// the string/stave/shaft survive as connected chains by construction, not by luck.
//
// WHY THICK FORMS ARE UNTOUCHED (the no-regress guarantee). Where the mesh is ≥1 voxel thick the surface
// trace is a SUBSET of the solid fill (every surface cell is parity-filled too), so solid ∪ surface =
// solid — bit-identical to voxelizeGlb. The thin pass only ADDS the cells the solid fill missed. "Thin"
// is therefore exactly `surface ∖ solid` — a free, exact thin-member mask, no thickness threshold or
// medial axis to tune.
//
// PURE, GL-FREE, NETWORK-FREE, RNG-FREE. Shares the E-16 mesh parser (parseGlbMesh) and solid test
// (pointInMesh) — NO duplicate. Returns the SAME record shape as voxelizeGlb (+ an additive `thin`
// field) so it is a drop-in for sampleSurfaceColors / colorVoxelsToArtifact / materialCleanVoxel.

import { parseGlbMesh } from "./glb-mesh.mjs";
import { pointInMesh, occupiedCells } from "./glb-voxelize.mjs";
import { SCALE_MIN, SCALE_MAX, DEFAULT_SCALE } from "../sculpture.mjs";

const DEGENERATE_EPS = 1e-18; // a triangle whose normal is below this (in squared length) has no surface

/**
 * Exact triangle–axis-aligned-box overlap (Akenine-Möller, "Fast 3D Triangle-Box Overlap Testing").
 * Box given as center `c` + half-extent `h`. 13 separating-axis tests: 9 edge×box-axis cross products,
 * 3 box face normals (the triangle-AABB trivial reject), and the triangle plane. Any separating axis ⇒
 * no overlap. A degenerate (zero-area) triangle has no surface → false. PURE; plain numbers/arrays.
 * @returns {boolean}
 */
export function triBoxOverlap(c, h, v0, v1, v2) {
  // Move the triangle so the box center is the origin.
  const t0 = [v0[0] - c[0], v0[1] - c[1], v0[2] - c[2]];
  const t1 = [v1[0] - c[0], v1[1] - c[1], v1[2] - c[2]];
  const t2 = [v2[0] - c[0], v2[1] - c[1], v2[2] - c[2]];
  const tris = [t0, t1, t2];

  // Separating-axis test for an arbitrary axis `a`: project the 3 verts + the box, look for a gap.
  const separates = (ax, ay, az) => {
    const p0 = ax * t0[0] + ay * t0[1] + az * t0[2];
    const p1 = ax * t1[0] + ay * t1[1] + az * t1[2];
    const p2 = ax * t2[0] + ay * t2[1] + az * t2[2];
    const min = Math.min(p0, p1, p2);
    const max = Math.max(p0, p1, p2);
    const r = h[0] * Math.abs(ax) + h[1] * Math.abs(ay) + h[2] * Math.abs(az);
    return min > r || max < -r;
  };

  // Triangle edges.
  const e0 = [t1[0] - t0[0], t1[1] - t0[1], t1[2] - t0[2]];
  const e1 = [t2[0] - t1[0], t2[1] - t1[1], t2[2] - t1[2]];
  const e2 = [t0[0] - t2[0], t0[1] - t2[1], t0[2] - t2[2]];

  // 9 edge × box-axis cross products. cross(e,X)=(0,e.z,-e.y); cross(e,Y)=(-e.z,0,e.x); cross(e,Z)=(e.y,-e.x,0).
  for (const e of [e0, e1, e2]) {
    if (separates(0, e[2], -e[1])) return false;
    if (separates(-e[2], 0, e[0])) return false;
    if (separates(e[1], -e[0], 0)) return false;
  }

  // 3 box face normals = triangle-AABB vs box-AABB trivial reject.
  if (separates(1, 0, 0) || separates(0, 1, 0) || separates(0, 0, 1)) return false;

  // Triangle plane vs box. n = e0 × e1; degenerate (collinear/coincident) ⇒ no surface.
  const nx = e0[1] * e1[2] - e0[2] * e1[1];
  const ny = e0[2] * e1[0] - e0[0] * e1[2];
  const nz = e0[0] * e1[1] - e0[1] * e1[0];
  if (nx * nx + ny * ny + nz * nz < DEGENERATE_EPS) return false;
  const d = nx * t0[0] + ny * t0[1] + nz * t0[2]; // signed plane offset from the (origin) box center
  const r = h[0] * Math.abs(nx) + h[1] * Math.abs(ny) + h[2] * Math.abs(nz);
  if (Math.abs(d) > r) return false;

  return true; // no separating axis found ⇒ they overlap
}

function assertScale(scale) {
  if (!Number.isInteger(scale) || scale < SCALE_MIN || scale > SCALE_MAX) {
    throw new Error(`voxelizeGlbThin: scale must be an integer in [${SCALE_MIN}, ${SCALE_MAX}] (got ${scale})`);
  }
}

const clampInt = (v, n) => (v < 0 ? 0 : v >= n ? n - 1 : v);

/**
 * Voxelize a GLB into a thin-feature-preserving solid-∪-shell occupancy grid. Same record shape as
 * voxelizeGlb plus an additive `thin` field. `shell:false` falls back to exactly the solid fill
 * (a parity escape hatch); `thinScale` (opt-in, off by default) overrides `scale` for a global bump.
 * @param {Uint8Array|ArrayBuffer|Buffer} glb
 * @param {{scale?:number, shell?:boolean, thinScale?:number|null, connectivity?:number}} [opts]
 * @returns {{ scale:number, voxelSize:number, dims:number[], bounds:{min:number[],max:number[]},
 *            occupied:Int32Array, count:number, thin:{surfaceOnlyCount:number, components:number} }}
 */
export function voxelizeGlbThin(glb, { scale = DEFAULT_SCALE, shell = true, thinScale = null, connectivity = 26 } = {}) {
  const effScale = thinScale == null ? scale : thinScale;
  assertScale(effScale);
  const { positions, triangleCount, bounds } = parseGlbMesh(glb);
  const { min, max } = bounds;

  const extent = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
  const longest = Math.max(extent[0], extent[1], extent[2]);
  if (!(longest > 0)) throw new Error("voxelizeGlbThin: degenerate mesh (zero-size bounding box)");
  const voxelSize = longest / effScale;
  const dims = extent.map((e) => Math.max(1, Math.round(e / voxelSize)));
  const [nx, ny, nz] = dims;
  const pack = (i, j, k) => (i * ny + j) * nz + k;

  // 1. Solid fill — the existing center-parity test.
  const solid = new Set();
  for (let i = 0; i < nx; i++) {
    const px = min[0] + (i + 0.5) * voxelSize;
    for (let j = 0; j < ny; j++) {
      const py = min[1] + (j + 0.5) * voxelSize;
      for (let k = 0; k < nz; k++) {
        const pz = min[2] + (k + 0.5) * voxelSize;
        if (pointInMesh(px, py, pz, positions, triangleCount)) solid.add(pack(i, j, k));
      }
    }
  }

  // 2. Surface trace — every cell a triangle's AABB touches, confirmed by exact SAT.
  const surfaceOnly = new Set();
  const half = [voxelSize / 2, voxelSize / 2, voxelSize / 2];
  if (shell) {
    for (let t = 0; t < triangleCount; t++) {
      const o = t * 9;
      const v0 = [positions[o], positions[o + 1], positions[o + 2]];
      const v1 = [positions[o + 3], positions[o + 4], positions[o + 5]];
      const v2 = [positions[o + 6], positions[o + 7], positions[o + 8]];
      // Cell-AABB of the triangle (clamped to the grid).
      const ci0 = clampInt(Math.floor((Math.min(v0[0], v1[0], v2[0]) - min[0]) / voxelSize), nx);
      const ci1 = clampInt(Math.floor((Math.max(v0[0], v1[0], v2[0]) - min[0]) / voxelSize), nx);
      const cj0 = clampInt(Math.floor((Math.min(v0[1], v1[1], v2[1]) - min[1]) / voxelSize), ny);
      const cj1 = clampInt(Math.floor((Math.max(v0[1], v1[1], v2[1]) - min[1]) / voxelSize), ny);
      const ck0 = clampInt(Math.floor((Math.min(v0[2], v1[2], v2[2]) - min[2]) / voxelSize), nz);
      const ck1 = clampInt(Math.floor((Math.max(v0[2], v1[2], v2[2]) - min[2]) / voxelSize), nz);
      for (let i = ci0; i <= ci1; i++) {
        const cx = min[0] + (i + 0.5) * voxelSize;
        for (let j = cj0; j <= cj1; j++) {
          const cy = min[1] + (j + 0.5) * voxelSize;
          for (let k = ck0; k <= ck1; k++) {
            const id = pack(i, j, k);
            if (solid.has(id) || surfaceOnly.has(id)) continue;
            const cz = min[2] + (k + 0.5) * voxelSize;
            if (triBoxOverlap([cx, cy, cz], half, v0, v1, v2)) surfaceOnly.add(id);
          }
        }
      }
    }
  }

  // 3. Union → sorted [i,j,k] (ascending packed id == voxelizeGlb's i/j/k loop order: drop-in parity).
  const ids = [...solid, ...surfaceOnly].sort((a, b) => a - b);
  const occupied = new Int32Array(ids.length * 3);
  for (let n = 0; n < ids.length; n++) {
    const id = ids[n];
    occupied[n * 3] = Math.floor(id / (ny * nz));
    occupied[n * 3 + 1] = Math.floor(id / nz) % ny;
    occupied[n * 3 + 2] = id % nz;
  }
  const occupancy = { scale: effScale, voxelSize, dims, bounds, occupied, count: ids.length };
  occupancy.thin = {
    surfaceOnlyCount: surfaceOnly.size,
    components: connectedComponents(occupancy, { connectivity }).count,
  };
  return occupancy;
}

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

const FACE_DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const BOX_DIRS = (() => {
  const d = [];
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) {
    if (i || j || k) d.push([i, j, k]);
  }
  return d;
})();

/**
 * Connected-component count + sizes over the occupancy (the AC no-dropped-thin-components instrument).
 * `connectivity` 6 (face) or 26 (box). Iterative flood fill over the indexCells map. PURE; deterministic
 * (sizes sorted descending). Reads only `occupied`/`count`.
 * @param {{occupied:Int32Array, count:number}} occupancy
 * @param {{connectivity?:number}} [opts]
 * @returns {{count:number, sizes:number[]}}
 */
export function connectedComponents(occupancy, { connectivity = 26 } = {}) {
  if (connectivity !== 6 && connectivity !== 26) {
    throw new Error(`connectedComponents: connectivity must be 6 or 26 (got ${connectivity})`);
  }
  const dirs = connectivity === 6 ? FACE_DIRS : BOX_DIRS;
  const index = indexCells(occupancy);
  const cells = [...occupiedCells(occupancy)];
  const seen = new Uint8Array(cells.length);
  const sizes = [];
  for (let start = 0; start < cells.length; start++) {
    if (seen[start]) continue;
    let size = 0;
    const stack = [start];
    seen[start] = 1;
    while (stack.length) {
      const n = stack.pop();
      size++;
      const [ci, cj, ck] = cells[n];
      for (const [di, dj, dk] of dirs) {
        const m = index.get(`${ci + di},${cj + dj},${ck + dk}`);
        if (m !== undefined && !seen[m]) {
          seen[m] = 1;
          stack.push(m);
        }
      }
    }
    sizes.push(size);
  }
  sizes.sort((a, b) => b - a);
  return { count: sizes.length, sizes };
}
