// GLB → occupancy voxel grid — E-16 Arm B, the geometry half (T-050-01).
//
// The founding image→3D question: voxelizing a real 3-D mesh keeps the *form/line* a text→JSON build
// loses (the koi S-curve, the heart's aortic arch). This module is pure geometry — no GL, no color
// (color is T-051-01). It shares the GLB mesh parse with the silhouette rasterizer (no duplicate
// parser) via ./glb-mesh.mjs, and sizes the grid with the same `scale` convention as vConcept
// (src/sculpture.mjs) so a voxelized build is comparable to a text→JSON build at the same scale.
//
// Occupancy test: solid fill via ray-cast parity (even–odd point-in-mesh). From each cell center we
// cast a +X ray and count triangle crossings; odd ⇒ inside. TRELLIS meshes are watertight, so this is
// well-defined and yields the dense reading we want. A fixed sub-voxel offset on the sample point's
// y/z dodges axis-aligned edge/diagonal coincidences deterministically (no randomness), which keeps a
// solid cube's count exact.

import { parseGlbMesh } from "./glb-mesh.mjs";
import { SCALE_MIN, SCALE_MAX, DEFAULT_SCALE } from "../sculpture.mjs";

const PARALLEL_EPS = 1e-12; // ray treated as parallel to a triangle below this determinant
const T_EPS = 1e-9; //         crossing must lie strictly ahead of the origin
// Deterministic, scale-relative sub-voxel offsets applied to the ray's y/z inside pointInMesh, so a
// +X ray never lands exactly on a shared triangle edge or a face diagonal (e.g. a cube center where
// y == z). Distinct irrational-ish multipliers break the coincidence; magnitude-relative so it works
// across mesh scales, and tiny enough never to flip a genuine inside/outside classification.
const JITTER_Y = 1.0;
const JITTER_Z = 0.6180339887;

/**
 * Does a +X ray from (ox,oy,oz) cross triangle (a,b,c)? Möller–Trumbore specialized to dir (1,0,0).
 * Returns 1 on a forward crossing, else 0.
 */
export function rayTriParityX(ox, oy, oz, ax, ay, az, bx, by, bz, cx, cy, cz) {
  const e1x = bx - ax, e1y = by - ay, e1z = bz - az;
  const e2x = cx - ax, e2y = cy - ay, e2z = cz - az;
  // h = dir × e2 with dir = (1,0,0) → (0, -e2z, e2y)
  const det = e1y * -e2z + e1z * e2y; // e1 · h
  if (det > -PARALLEL_EPS && det < PARALLEL_EPS) return 0;
  const inv = 1 / det;
  const sx = ox - ax, sy = oy - ay, sz = oz - az;
  const u = inv * (sy * -e2z + sz * e2y); // (s · h)
  if (u < 0 || u > 1) return 0;
  // q = s × e1
  const qx = sy * e1z - sz * e1y;
  const qy = sz * e1x - sx * e1z;
  const qz = sx * e1y - sy * e1x;
  const v = inv * qx; // dir · q = q.x
  if (v < 0 || u + v > 1) return 0;
  const t = inv * (e2x * qx + e2y * qy + e2z * qz);
  return t > T_EPS ? 1 : 0;
}

/** Solid point-in-mesh test by +X ray parity over the full triangle soup. */
export function pointInMesh(px, py, pz, positions, triangleCount) {
  // Nudge the ray off any exact edge/diagonal coincidence (deterministic, magnitude-relative).
  const eps = (Math.abs(px) + Math.abs(py) + Math.abs(pz) + 1) * 1e-9;
  const oy = py + eps * JITTER_Y;
  const oz = pz + eps * JITTER_Z;
  let crossings = 0;
  for (let t = 0; t < triangleCount; t++) {
    const o = t * 9;
    crossings += rayTriParityX(
      px, oy, oz,
      positions[o], positions[o + 1], positions[o + 2],
      positions[o + 3], positions[o + 4], positions[o + 5],
      positions[o + 6], positions[o + 7], positions[o + 8],
    );
  }
  return (crossings & 1) === 1;
}

function assertScale(scale) {
  if (!Number.isInteger(scale) || scale < SCALE_MIN || scale > SCALE_MAX) {
    throw new Error(`voxelizeGlb: scale must be an integer in [${SCALE_MIN}, ${SCALE_MAX}] (got ${scale})`);
  }
}

/**
 * Voxelize a GLB mesh into a solid occupancy grid.
 * @param {Uint8Array|ArrayBuffer|Buffer} glb
 * @param {{scale?: number}} [opts] longest mesh edge ≈ scale voxels (vConcept convention)
 * @returns {{ scale:number, voxelSize:number, dims:number[], bounds:{min:number[],max:number[]},
 *            occupied: Int32Array, count:number }}
 */
export function voxelizeGlb(glb, { scale = DEFAULT_SCALE } = {}) {
  assertScale(scale);
  const { positions, triangleCount, bounds } = parseGlbMesh(glb);
  const { min, max } = bounds;

  const extent = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
  const longest = Math.max(extent[0], extent[1], extent[2]);
  if (!(longest > 0)) throw new Error("voxelizeGlb: degenerate mesh (zero-size bounding box)");
  const voxelSize = longest / scale;
  const dims = extent.map((e) => Math.max(1, Math.round(e / voxelSize)));

  const occupied = [];
  for (let i = 0; i < dims[0]; i++) {
    const px = min[0] + (i + 0.5) * voxelSize;
    for (let j = 0; j < dims[1]; j++) {
      const py = min[1] + (j + 0.5) * voxelSize;
      for (let k = 0; k < dims[2]; k++) {
        const pz = min[2] + (k + 0.5) * voxelSize;
        if (pointInMesh(px, py, pz, positions, triangleCount)) occupied.push(i, j, k);
      }
    }
  }
  return { scale, voxelSize, dims, bounds, occupied: Int32Array.from(occupied), count: occupied.length / 3 };
}

/** Iterate occupied cells as [i,j,k] tuples. */
export function* occupiedCells(occupancy) {
  const o = occupancy.occupied;
  for (let n = 0; n < o.length; n += 3) yield [o[n], o[n + 1], o[n + 2]];
}
