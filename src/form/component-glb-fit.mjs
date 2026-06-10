// GLB reference fitting for the component decomposition (T-103-01, epic E-27 Rule 1: every
// component parameter is FITTED TO THE GLB with the fit error recorded). This module is the mesh
// side of the contract: triangle statistics, the mesh→voxel alignment (exact when the registry
// records the voxelization scale; per-axis AABB affine otherwise), and the per-plane area-weighted
// fit that anchors a voxel-found roof plane to the reference. The mesh is never the segmentation
// substrate — it is the reference the voxel fit is scored against (design D3).
//
// Operates on PARSED mesh data (`parseGlbMesh` output) — it never reads or parses a GLB itself.
// PURE — no GL, no I/O, no Date/random.

const round3 = (v) => {
  const r = Math.round(v * 1000) / 1000;
  return r === 0 ? 0 : r;
};

/**
 * Per-triangle centroids, unit normals, and areas from expanded-index positions (9 floats/tri).
 * Degenerate (zero-area) triangles get a zero normal and zero area — callers skip on `areas[t] === 0`.
 * @returns {{centroids:Float64Array, normals:Float64Array, areas:Float64Array}}
 */
export function triangleStats(positions, triangleCount) {
  const centroids = new Float64Array(triangleCount * 3);
  const normals = new Float64Array(triangleCount * 3);
  const areas = new Float64Array(triangleCount);
  for (let t = 0; t < triangleCount; t++) {
    const o = t * 9;
    const ax = positions[o], ay = positions[o + 1], az = positions[o + 2];
    const bx = positions[o + 3], by = positions[o + 4], bz = positions[o + 5];
    const cx = positions[o + 6], cy = positions[o + 7], cz = positions[o + 8];
    centroids[t * 3] = (ax + bx + cx) / 3;
    centroids[t * 3 + 1] = (ay + by + cy) / 3;
    centroids[t * 3 + 2] = (az + bz + cz) / 3;
    const ux = bx - ax, uy = by - ay, uz = bz - az;
    const vx = cx - ax, vy = cy - ay, vz = cz - az;
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz);
    areas[t] = len / 2;
    if (len > 1e-12) {
      normals[t * 3] = nx / len;
      normals[t * 3 + 1] = ny / len;
      normals[t * 3 + 2] = nz / len;
    }
  }
  return { centroids, normals, areas };
}

/**
 * The EXACT mesh→artifact-voxel map for a registry-scale subject: mirrors `voxelizeGlb` (voxelSize =
 * longest extent / scale, grid origin at mesh bounds.min, CENTER sampling) composed with
 * `keysToArtifact`'s recentering (x −⌊nx/2⌋, z −⌊nz/2⌋). `toVoxel` returns continuous voxel-space
 * coordinates (integers land on cell centers).
 */
export function scaleAlignment(meshBounds, scale) {
  const { min, max } = meshBounds;
  const extent = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
  const longest = Math.max(...extent);
  if (!(longest > 0)) throw new Error("scaleAlignment: degenerate mesh bounds");
  const voxelSize = longest / scale;
  const dims = extent.map((e) => Math.max(1, Math.round(e / voxelSize)));
  const ox = Math.floor(dims[0] / 2);
  const oz = Math.floor(dims[2] / 2);
  const s = 1 / voxelSize;
  return {
    mode: "registry-scale",
    voxelSize: round3(voxelSize),
    dims,
    scales: [s, s, s],
    toVoxel: (p) => [
      (p[0] - min[0]) / voxelSize - 0.5 - ox,
      (p[1] - min[1]) / voxelSize - 0.5,
      (p[2] - min[2]) / voxelSize - 0.5 - oz,
    ],
  };
}

/**
 * Per-axis affine AABB alignment — the fallback when the shell's voxelization scale is not recorded
 * (the cottage/gatehouse lineages). Maps the mesh box onto the occupancy box: mesh min surface →
 * cell `occMin` outer face (−0.5), mesh max surface → cell `occMax` outer face (+0.5). Approximate
 * by nature (post-voxelization edits may have moved the occupancy extremes); the record names the
 * mode so consumers can weigh the glbFit accordingly.
 */
export function aabbAlignment(meshBounds, occBounds) {
  const scales = [0, 0, 0];
  for (let a = 0; a < 3; a++) {
    const ext = meshBounds.max[a] - meshBounds.min[a];
    if (!(ext > 0)) throw new Error(`aabbAlignment: degenerate mesh extent on axis ${a}`);
    scales[a] = (occBounds.max[a] - occBounds.min[a] + 1) / ext;
  }
  return {
    mode: "aabb-affine",
    scales: scales.map(round3),
    toVoxel: (p) => [
      occBounds.min[0] - 0.5 + (p[0] - meshBounds.min[0]) * scales[0],
      occBounds.min[1] - 0.5 + (p[1] - meshBounds.min[1]) * scales[1],
      occBounds.min[2] - 0.5 + (p[2] - meshBounds.min[2]) * scales[2],
    ],
  };
}

/**
 * Fit the GLB to one voxel-found roof plane (E-27 Rule 1): select triangles whose aligned centroid
 * lands in the plane's plan extent AND whose (alignment-transformed) normal lies within
 * `maxAngleDeg` of the voxel plane's; the fitted plane's normal is the area-weighted mean of the
 * selected (sign-corrected) normals, its offset the area-weighted mean over centroids. Fitting from
 * normals (not a centroid LSQ) stays well-posed on a MINIMAL face — a decimated TRELLIS roof plane
 * is often exactly two triangles, one centroid line. Returns null (the honest miss — the caller
 * records a finding and the sampled mass stays authoritative) when fewer than `minTriangles`
 * support it or the mean normal is horizontal (no heightfield form).
 *
 * @param {{centroids,normals,areas}} stats   {@link triangleStats}
 * @param {{toVoxel:Function, scales:number[]}} alignment
 * @param {{normal:number[]}} voxelFit        the plane's voxel fit (unit normal, ny>0)
 * @param {Set<string>} extentKeys            "x,z" plan cells of the plane's extent
 */
export function glbFitForPlane(stats, alignment, voxelFit, extentKeys, opts = {}) {
  const { maxAngleDeg = 25, minTriangles = 2 } = opts;
  const cosMax = Math.cos((maxAngleDeg * Math.PI) / 180);
  const [vnx, vny, vnz] = voxelFit.normal;
  const { centroids, normals, areas } = stats;
  const [sx, sy, sz] = alignment.scales;
  let n = 0, areaSupport = 0;
  let anx = 0, any = 0, anz = 0;
  const picked = [];
  for (let t = 0; t < areas.length; t++) {
    const w = areas[t];
    if (w === 0) continue;
    // normals transform by the inverse-transpose: n' ∝ n / scale per axis (diagonal map)
    let nx = normals[t * 3] / sx, ny = normals[t * 3 + 1] / sy, nz = normals[t * 3 + 2] / sz;
    const nl = Math.hypot(nx, ny, nz);
    if (nl < 1e-12) continue;
    nx /= nl; ny /= nl; nz /= nl;
    const dot = nx * vnx + ny * vny + nz * vnz;
    if (Math.abs(dot) < cosMax) continue; // winding-agnostic cone test
    const cv = alignment.toVoxel([centroids[t * 3], centroids[t * 3 + 1], centroids[t * 3 + 2]]);
    if (!extentKeys.has(`${Math.round(cv[0])},${Math.round(cv[2])}`)) continue;
    const sign = dot < 0 ? -1 : 1; // correct the winding so normals accumulate, not cancel
    n++;
    areaSupport += w;
    picked.push([cv[0], cv[1], cv[2], w]);
    anx += sign * w * nx; any += sign * w * ny; anz += sign * w * nz;
  }
  if (n < minTriangles) return null;
  const al = Math.hypot(anx, any, anz);
  if (al < 1e-12 || Math.abs(any / al) < 1e-6) return null; // horizontal mean normal: no height form
  const a = -(anx / al) / (any / al);
  const b = -(anz / al) / (any / al);
  let sw = 0, mx = 0, my = 0, mz = 0;
  for (const [x, y, z, w] of picked) { sw += w; mx += w * x; my += w * y; mz += w * z; }
  mx /= sw; my /= sw; mz /= sw;
  const c = my - a * mx - b * mz;
  let sse = 0;
  for (const [x, y, z, w] of picked) {
    const r = y - (a * x + b * z + c);
    sse += w * r * r;
  }
  const len = Math.hypot(a, 1, b);
  const normal = [-a / len, 1 / len, -b / len];
  const dot = Math.max(-1, Math.min(1, normal[0] * vnx + normal[1] * vny + normal[2] * vnz));
  return {
    normal: normal.map(round3),
    point: [round3(mx), round3(my), round3(mz)],
    gradient: [round3(a), round3(b)],
    rmse: round3(Math.sqrt(sse / sw)),
    triangles: n,
    areaSupport: round3(areaSupport),
    angleToVoxelDeg: round3((Math.acos(dot) * 180) / Math.PI),
    offsetDelta: round3(Math.abs((a * mx + b * mz + c) - (voxelFit.gradient
      ? voxelFit.gradient[0] * mx + voxelFit.gradient[1] * mz +
        (voxelFit.point[1] - voxelFit.gradient[0] * voxelFit.point[0] - voxelFit.gradient[1] * voxelFit.point[2])
      : my))),
  };
}
