// Roof END-FACE fit — gable-end parameters from the GLB reference (T-108-01, story S-108, epic
// E-28). The E-27 roof program fits and generates SLOPES; the gable footprint still inherits the
// regularized blob's extent along the ridge axis, and the solid wedge fills every footprint column
// to the band floor — so the gable ends are 3–4 cells of full-height solid overrun past the wall
// (the cottage 45°/315° `massing @ upper storey gable ends` majors). This module fits, per gable
// end, WHERE the gable face stands and HOW FAR the verge overhangs it, against the GLB (E-28
// Rule 2: fit, don't invent — fit error recorded, an unfittable end is a named finding and the
// as-built end stays).
//
// PARAMETER SOURCING (the E-27 principle, extended): aabb-affine GLB offsets are unreliable in the
// absolute (offsetDelta up to 4.4 cells on committed records), so positions anchor to the AS-BUILT
// occupancy and the GLB supplies DIFFERENTIALS measured within one alignment:
//   • as-built wall anchor `V_w` — the outermost occupied column under the gable (median over the
//     cross axis, robust to residue cells), in the storey just below the roof band (window height
//     = the band's own height — derived, not tuned; the plinth's ground spread stays excluded).
//   • GLB wall plane `G_w` / gable-face plane `G_f` — area-weighted end-facing triangle clusters
//     (|normal·dir| ≥ cos faceAngleDeg) below / in the roof band; clusters split at a 1-voxel gap
//     (the quantization unit); the face is the DOMINANT-AREA band cluster, its area-weighted
//     vertex RMSE is the recorded fit error.
//   • GLB roof end `G_e` — the extreme vertex of ALL roof-band triangles in the window (the verge
//     tip; sheet top/underside faces count, whatever their orientation).
//   face = V_w + round(G_f − G_w);  verge tip = face + round(G_e − G_f).
//   Blob spread enters V_w and the as-built roof end alike, so the differentials cancel it to
//   first order; what remains is bounded by the GEOMETRIC sanity gate (no constants): the wall
//   bounds the face from inside, the as-built footprint bounds the tip from outside.
//
// Hip-demanded ends are NOT fitted (`end-hip` — a hip end is a slope, not a face); the swap ladder
// fits the `gableEndsVariant` (hips suppressed) separately and the cage arbitrates (T-104
// mechanism). PURE — no I/O, no GL, no Date/random; runs under the `src/**/*.test.mjs` glob.

/** Schema tag for end-fit results embedded in durable records. */
export const END_FIT_SCHEMA = "roof-end-fit/v1";

/** Declared fit tolerances — shared across subjects, never subject-tuned (E-25 Rule 3). */
export const END_FIT_DEFAULTS = Object.freeze({
  faceAngleDeg: 25, // end-face selection cone, |normal·dir| ≥ cos(this) — glbFitForPlane's default
  minTriangles: 1,  // a face plane is well-posed from one triangle (unlike a gradient fit)
});

const noNegZero = (v) => v + 0 === 0 ? 0 : v; // −0 → 0 (records and deep-equality stay canonical)
const round3 = (v) => noNegZero(Math.round(v * 1e3) / 1e3);

/**
 * Mesh triangles transformed into CONTINUOUS voxel space: vertices through `alignment.toVoxel`,
 * normal/area recomputed in voxel space (exact under per-axis scaling — no separate normal
 * transform). Degenerate triangles get area 0 (callers skip them).
 * @param {{positions:Float64Array, triangleCount:number}} mesh expanded 9-floats-per-triangle
 * @param {{toVoxel:(p:number[])=>number[]}} alignment
 * @returns {{verts:number[][], centroid:number[], normal:number[], area:number}[]}
 */
export function alignedTriangles(mesh, alignment) {
  const out = [];
  const p = mesh.positions;
  for (let t = 0; t < mesh.triangleCount; t++) {
    const o = t * 9;
    const a = alignment.toVoxel([p[o], p[o + 1], p[o + 2]]);
    const b = alignment.toVoxel([p[o + 3], p[o + 4], p[o + 5]]);
    const c = alignment.toVoxel([p[o + 6], p[o + 7], p[o + 8]]);
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz);
    out.push({
      verts: [a, b, c],
      centroid: [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3],
      normal: len > 1e-12 ? [nx / len, ny / len, nz / len] : [0, 0, 0],
      area: len / 2,
    });
  }
  return out;
}

/**
 * Single-link clusters of triangles along one coordinate, split where the gap between consecutive
 * SIGNED centroid coordinates exceeds 1.0 (the voxel quantization unit). Returns clusters sorted
 * by signed coordinate ascending; each `{tris, area, mean}` (mean area-weighted, signed).
 */
function clustersAlong(tris, coordOf) {
  const items = tris.map((t) => ({ t, c: coordOf(t) })).sort((x, y) => x.c - y.c);
  const clusters = [];
  let cur = null;
  for (const it of items) {
    if (!cur || it.c - cur.last > 1.0) {
      cur = { tris: [], area: 0, sum: 0, last: it.c };
      clusters.push(cur);
    }
    cur.tris.push(it.t);
    cur.area += it.t.area;
    cur.sum += it.c * it.t.area;
    cur.last = it.c;
  }
  for (const cl of clusters) cl.mean = cl.area > 0 ? cl.sum / cl.area : cl.last;
  return clusters;
}

/** Area-weighted RMSE of a cluster's vertex coordinates about `plane` (each vertex weighs area/3). */
function clusterRmse(cluster, idx, sign, plane) {
  let sse = 0;
  let w = 0;
  for (const t of cluster.tris) {
    for (const v of t.verts) {
      const r = v[idx] * sign - plane;
      sse += (t.area / 3) * r * r;
      w += t.area / 3;
    }
  }
  return w > 0 ? Math.sqrt(sse / w) : null;
}

/** Fit one end of one gable. Returns `{end}` or `{reason, detail}` (the caller names the finding). */
function fitEnd(gable, occ, tris, dir, opts) {
  const axis = gable.ridge.axis;
  const idx = axis === "x" ? 0 : 2; // vertex index along the ridge axis
  const crossIdx = axis === "x" ? 2 : 0;
  const sign = dir.startsWith("+") ? 1 : -1;
  const bbox = gable.footprint.bbox;
  const crossLo = (axis === "x" ? bbox.minZ : bbox.minX) - 0.5;
  const crossHi = (axis === "x" ? bbox.maxZ : bbox.maxX) + 0.5;
  const fpEnd = sign > 0
    ? (axis === "x" ? bbox.maxX : bbox.maxZ)
    : (axis === "x" ? bbox.minX : bbox.minZ);
  const mid = ((axis === "x" ? bbox.minX : bbox.minZ) + (axis === "x" ? bbox.maxX : bbox.maxZ)) / 2;
  const bandFloor = Math.min(...gable.sides.map((s) => Math.floor(s.eaveY)));
  const wallFloor = 2 * bandFloor - Math.ceil(gable.ridge.y); // one band-height below the eave

  // as-built wall anchor: per cross-coordinate outermost occupied column in the wall storey,
  // median over the cross axis (robust to residue cells)
  const outermost = new Map(); // cross coord → max signed ridge-axis coord
  for (const key of occ.cells.keys()) {
    const c = key.split(",").map(Number);
    const pos3 = [c[0], c[1], c[2]];
    if (pos3[1] < wallFloor || pos3[1] >= bandFloor) continue;
    const cross = pos3[crossIdx];
    if (cross < crossLo || cross > crossHi) continue;
    const v = pos3[idx] * sign;
    if (v < mid * sign) continue; // this end's half only
    const cur = outermost.get(cross);
    if (cur === undefined || v > cur) outermost.set(cross, v);
  }
  if (outermost.size === 0) return { reason: "end-unfitted", detail: "no as-built wall columns in the end window — anchorless" };
  const sortedW = [...outermost.values()].sort((a, b) => a - b);
  const wallAnchor = sortedW[Math.floor((sortedW.length - 1) / 2)]; // lower median (deterministic)

  // GLB selections, all within the cross window and this end's half along the ridge axis
  const cosFace = Math.cos((opts.faceAngleDeg * Math.PI) / 180);
  const inWindow = (t) => t.centroid[crossIdx] >= crossLo && t.centroid[crossIdx] <= crossHi &&
    t.centroid[idx] * sign >= mid * sign;
  const faceCone = [];
  const wallCone = [];
  let roofEnd = -Infinity;
  for (const t of tris) {
    if (t.area === 0 || !inWindow(t)) continue;
    if (t.centroid[1] >= bandFloor) {
      for (const v of t.verts) if (v[idx] * sign > roofEnd) roofEnd = v[idx] * sign;
      if (Math.abs(t.normal[idx]) >= cosFace) faceCone.push(t);
    } else if (Math.abs(t.normal[idx]) >= cosFace) {
      wallCone.push(t);
    }
  }
  if (faceCone.length < opts.minTriangles) {
    return { reason: "end-unfitted", detail: `no GLB end-facing triangles in the roof band (cone ${opts.faceAngleDeg}°)` };
  }
  if (wallCone.length < opts.minTriangles) {
    return { reason: "end-unfitted", detail: `no GLB end-facing wall triangles below the band — differential anchorless` };
  }

  // wall plane: the OUTERMOST below-band cluster; face plane: the DOMINANT-AREA band cluster
  // (ties broken outward — deterministic)
  const wallClusters = clustersAlong(wallCone, (t) => t.centroid[idx] * sign);
  const glbWall = wallClusters[wallClusters.length - 1].mean;
  const faceClusters = clustersAlong(faceCone, (t) => t.centroid[idx] * sign);
  let face = faceClusters[0];
  for (const cl of faceClusters) if (cl.area > face.area + 1e-9 || (Math.abs(cl.area - face.area) <= 1e-9 && cl.mean > face.mean)) face = cl;
  const glbFace = face.mean;
  const faceRmse = clusterRmse(face, idx, sign, glbFace);

  const dFace = Math.round(glbFace - glbWall);
  const dVerge = Math.round(roofEnd - glbFace);
  const faceSigned = wallAnchor + dFace;
  const coordSigned = faceSigned + dVerge;
  const reasons = [];
  if (dFace < 0) reasons.push(`gable face ${round3(glbFace * sign)} inside the wall plane ${round3(glbWall * sign)}`);
  if (dVerge < 0) reasons.push(`roof end ${round3(roofEnd * sign)} inside the gable face ${round3(glbFace * sign)}`);
  if (coordSigned > fpEnd * sign) reasons.push(`fitted verge tip ${coordSigned * sign} outside the as-built footprint end ${fpEnd}`);
  if (reasons.length) return { reason: "end-fit-insane", detail: reasons.join("; ") };

  return {
    end: {
      dir,
      coord: noNegZero(coordSigned * sign),
      faceCoord: noNegZero(faceSigned * sign),
      overhang: dVerge,
      source: "glb",
      asBuiltEnd: fpEnd,
      anchor: { wall: noNegZero(wallAnchor * sign), columns: outermost.size },
      glb: {
        wall: round3(glbWall * sign),
        face: round3(glbFace * sign),
        faceRmse: faceRmse === null ? null : round3(faceRmse),
        roofEnd: round3(roofEnd * sign),
        faceTriangles: face.tris.length,
        wallTriangles: wallCone.length,
      },
    },
  };
}

/**
 * Fit both ends of every sane, non-hip-demanded gable against the GLB end faces. Returns NEW
 * gables (inputs untouched) with `ends: {lo, hi}` attached (null per end when not fitted — every
 * null explained by a named finding), plus the findings. The generator trims the footprint at
 * `ends.*.coord` and sheets columns beyond `ends.*.faceCoord`; the swap carves the UNTRIMMED
 * footprint so the blob past the fitted end is removed, not kept.
 * @param {object[]} gables from gablesFromRecord (possibly through gableEndsVariant)
 * @param {import("../view/occupancy.mjs").Occupancy} occ the regularized shell (as-built anchor)
 * @param {{positions:Float64Array, triangleCount:number}} mesh expanded GLB triangles
 * @param {{toVoxel:(p:number[])=>number[]}} alignment mesh→voxel (the decomposition's own map)
 * @param {object} [opts] END_FIT_DEFAULTS overrides (declared by the caller's record)
 * @returns {{gables:object[], findings:object[]}}
 */
export function fitGableEnds(gables, occ, mesh, alignment, opts = {}) {
  const o = { ...END_FIT_DEFAULTS, ...opts };
  const tris = alignedTriangles(mesh, alignment);
  const findings = [];
  const out = gables.map((g) => {
    if (!g.sane) return g;
    const ends = { lo: null, hi: null };
    for (const [endName, dir] of [["lo", `-${g.ridge.axis}`], ["hi", `+${g.ridge.axis}`]]) {
      if (g.hip?.demanded) {
        findings.push({ code: "end-hip", where: `${g.id}:${dir}`, detail: "hip demanded — the end is a slope, not a face; not fitted" });
        continue;
      }
      const r = fitEnd(g, occ, tris, dir, o);
      if (r.end) {
        ends[endName] = r.end;
      } else {
        findings.push({ code: r.reason, where: `${g.id}:${dir}`, detail: `${r.detail} — as-built end stays (Rule 2)` });
      }
    }
    return { ...g, ends };
  });
  return { gables: out, findings };
}
