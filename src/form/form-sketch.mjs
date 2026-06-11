// FORM SKETCH — GLB conditioning (T-123-01, story S-123, epic E-31; pipeline-philosophy Stage 2).
//
// Every epic since E-16 inherited the image→3D mesh's lumpiness and paid to sand it downstream
// (E-27: 276 attached spikes / 23.9% ragged columns entering at voxelization). Minecraft's prior
// makes the fix cheap and UPSTREAM: the game has ~eight legal surface orientations (the 6 axes +
// the 45° roof family), axis-aligned walls, rectilinear footprints. This module snaps the mesh to
// that grammar BEFORE anything reads it — straight by construction, not straightened by surgery.
//
// The output is a CONDITIONED FORM SKETCH (form-sketch/v1): coarse grammar-snapped planes, the
// detected/applied mirror symmetry, a rectilinear footprint, and gross proportions. It is a sketch
// for RECOGNITION (E-31 Rule 3): it informs the model's reading of massing and proportion; it is
// NEVER a target to fit against — no downstream tolerance may reference it, and the canonical
// realization always wins over mesh fidelity. Geometry only: the mesh's textures are never read
// (they are non-diegetic amalgam — the material story decides materials, not optics).
//
// Two substrates, one record:
//   - PLANES come from the raw triangle soup (decimate + snap = one region-clustering pass —
//     the grammar is known a priori, so triangles cluster INTO it; classic decimation would work
//     to preserve exactly the lumps we want gone).
//   - BODY MEASURES (symmetry, footprint, masses, proportions) come from an internal occupancy
//     sampling of the same mesh — a measurement substrate, never a build path. Sampling is a
//     scanline-parity twin of glb-voxelize.mjs (one +x ray per (y,z) row instead of one full-mesh
//     ray per cell: the registered meshes are ~140k triangles, and per-cell parity would cost
//     minutes per subject, paid again by every --repro). Cell-center/scale conventions match
//     voxelizeGlb; the unit tests cross-validate the two on synthetic meshes.
//
// PURE — no GL, no I/O, no network, no Date/random — runs under the src/**/*.test.mjs glob.
// Deterministic by construction: fixed scan orders, stable tie-breaks, exact (non-iterative)
// fits; double-run byte-equality is asserted in the tests and re-proved by the runner's --repro.

import { parseGlbMesh } from "./glb-mesh.mjs";
import { occupancyFromCells } from "../view/occupancy.mjs";
import { segmentMasses } from "./component-decompose.mjs";

export const FORM_SKETCH_SCHEMA = "form-sketch/v1";

// Every declared constant of the conditioning, in one frozen block (the AC's "declared target /
// tolerance / confidence"). UNIVERSAL — conditioning has no per-style and no per-building knobs;
// changing one of these is a universal change, re-run on every registered subject.
export const SKETCH_PARAMS = Object.freeze({
  sampleScale: 48, //          internal occupancy substrate: longest mesh edge ≈ this many cells
  faceTarget: 100, //          decimation cap — coarse faces kept by descending area
  weldEpsFrac: 1e-4, //        vertex-weld grid pitch, as a fraction of the bbox diagonal
  symmetryConfidence: 0.8, //  reflection-IoU below this → no mirror applied (recorded, not forced)
  footprintSnapTolFrac: 0.06, // jog-snap tolerance, fraction of the longer plan dimension
  eaveAreaFrac: 0.8, //        eave = highest layer with plan area ≥ frac · footprint area
  pitchBucketsDeg: Object.freeze({ flat: 15, low: 35, pitched45: 55 }), // upper bounds; ≥55 = steep
  storeyBandBlocks: Object.freeze([3, 6]), // plausible per-storey height band, block-equivalents
});

// --- the Minecraft grammar ---------------------------------------------------------------------
// 6 axis directions + the 45° roof family: 4 upward diagonals (roof planes) and their 4 downward
// mirrors (eave undersides / overhang soffits — enumerated so an underside face cannot be
// misclassified into a wall). 14 orientations; order is the deterministic tie-break.

const SQ = Math.SQRT1_2;
export const GRAMMAR_ORIENTATIONS = Object.freeze([
  { key: "+x", n: [1, 0, 0] },
  { key: "-x", n: [-1, 0, 0] },
  { key: "+y", n: [0, 1, 0] },
  { key: "-y", n: [0, -1, 0] },
  { key: "+z", n: [0, 0, 1] },
  { key: "-z", n: [0, 0, -1] },
  { key: "roof+x+y", n: [SQ, SQ, 0] },
  { key: "roof-x+y", n: [-SQ, SQ, 0] },
  { key: "roof+z+y", n: [0, SQ, SQ] },
  { key: "roof-z+y", n: [0, SQ, -SQ] },
  { key: "eave+x-y", n: [SQ, -SQ, 0] },
  { key: "eave-x-y", n: [-SQ, -SQ, 0] },
  { key: "eave+z-y", n: [0, -SQ, SQ] },
  { key: "eave-z-y", n: [0, -SQ, -SQ] },
].map(Object.freeze));

// orientation index → index of the orientation mirrored across a plane normal to `axis` (0=x, 2=z)
function mirrorOrientationIndex(index, axis) {
  const n = GRAMMAR_ORIENTATIONS[index].n;
  const m = [n[0], n[1], n[2]];
  m[axis] = -m[axis];
  for (let i = 0; i < GRAMMAR_ORIENTATIONS.length; i++) {
    const g = GRAMMAR_ORIENTATIONS[i].n;
    if (Math.abs(g[0] - m[0]) < 1e-9 && Math.abs(g[1] - m[1]) < 1e-9 && Math.abs(g[2] - m[2]) < 1e-9) return i;
  }
  /* c8 ignore next */ // the grammar is closed under axis mirrors by construction
  throw new Error(`grammar not closed under mirror: ${GRAMMAR_ORIENTATIONS[index].key} axis ${axis}`);
}

const round = (v, p) => {
  const f = 10 ** p;
  const r = Math.round(v * f) / f;
  return Object.is(r, -0) ? 0 : r; // -0 serializes as 0 either way, but keep comparisons exact
};
const acosDeg = (d) => (Math.acos(Math.min(1, Math.max(-1, d))) * 180) / Math.PI;

// --- per-triangle geometry -----------------------------------------------------------------------

/**
 * Unit normals, areas, centroids per triangle of a flat soup (parseGlbMesh layout: 9 numbers per
 * triangle). Degenerate triangles (zero area) get a zero normal; every consumer skips them.
 * @returns {{ normals: Float64Array, areas: Float64Array, centroids: Float64Array, totalArea: number,
 *             degenerateCount: number }}
 */
export function triangleGeometry(positions, triangleCount) {
  const normals = new Float64Array(triangleCount * 3);
  const areas = new Float64Array(triangleCount);
  const centroids = new Float64Array(triangleCount * 3);
  let totalArea = 0;
  let degenerateCount = 0;
  for (let t = 0; t < triangleCount; t++) {
    const o = t * 9;
    const ax = positions[o], ay = positions[o + 1], az = positions[o + 2];
    const bx = positions[o + 3], by = positions[o + 4], bz = positions[o + 5];
    const cx = positions[o + 6], cy = positions[o + 7], cz = positions[o + 8];
    const ux = bx - ax, uy = by - ay, uz = bz - az;
    const vx = cx - ax, vy = cy - ay, vz = cz - az;
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz);
    centroids[t * 3] = (ax + bx + cx) / 3;
    centroids[t * 3 + 1] = (ay + by + cy) / 3;
    centroids[t * 3 + 2] = (az + bz + cz) / 3;
    if (len === 0) { degenerateCount++; continue; }
    normals[t * 3] = nx / len;
    normals[t * 3 + 1] = ny / len;
    normals[t * 3 + 2] = nz / len;
    areas[t] = len / 2;
    totalArea += len / 2;
  }
  return { normals, areas, centroids, totalArea, degenerateCount };
}

/**
 * Snap one unit normal to the nearest grammar orientation (max dot product; ties break to the
 * lowest orientation index — fixed enumeration order, so deterministic).
 * @returns {{ key: string, index: number, residualDeg: number }}
 */
export function snapNormal(nx, ny, nz) {
  let best = -1;
  let bestDot = -Infinity;
  for (let i = 0; i < GRAMMAR_ORIENTATIONS.length; i++) {
    const g = GRAMMAR_ORIENTATIONS[i].n;
    const d = nx * g[0] + ny * g[1] + nz * g[2];
    if (d > bestDot + 1e-12) { bestDot = d; best = i; }
  }
  return { key: GRAMMAR_ORIENTATIONS[best].key, index: best, residualDeg: acosDeg(bestDot) };
}

// --- decimate + snap = coarse faces --------------------------------------------------------------

/**
 * The conditioning's plane half: weld the soup's vertices (recovering adjacency), snap every
 * triangle's normal to the grammar, region-grow across shared edges WITHIN one snapped
 * orientation, and keep the largest regions as the coarse face set. Decimation and snapping are
 * one mechanism — the output is grammatical by construction, and the cap (`faceTarget`) is the
 * declared decimation target. Dropped area is recorded honestly, never silently.
 *
 * @returns {{ faces: Array<{orientation, normal, offset, centroid, areaFrac, meanResidualDeg,
 *             maxResidualDeg, triangles}>, stats: object }}
 */
export function coarseFaces(positions, triangleCount, params = SKETCH_PARAMS) {
  const geom = triangleGeometry(positions, triangleCount);
  const { normals, areas, centroids, totalArea } = geom;

  // bbox diagonal → weld pitch
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3) {
    for (let a = 0; a < 3; a++) {
      const v = positions[i + a];
      if (v < min[a]) min[a] = v;
      if (v > max[a]) max[a] = v;
    }
  }
  const diag = Math.hypot(max[0] - min[0], max[1] - min[1], max[2] - min[2]) || 1;
  const weldEps = params.weldEpsFrac * diag;

  // vertex weld on a quantized grid → ids
  const vertexId = new Map();
  const triVerts = new Int32Array(triangleCount * 3);
  for (let t = 0; t < triangleCount; t++) {
    for (let v = 0; v < 3; v++) {
      const o = t * 9 + v * 3;
      const k = `${Math.round(positions[o] / weldEps)},${Math.round(positions[o + 1] / weldEps)},${Math.round(positions[o + 2] / weldEps)}`;
      let id = vertexId.get(k);
      if (id === undefined) { id = vertexId.size; vertexId.set(k, id); }
      triVerts[t * 3 + v] = id;
    }
  }

  // snapped orientation per triangle (-1 = degenerate, excluded)
  const snapIndex = new Int32Array(triangleCount).fill(-1);
  const snapResidual = new Float64Array(triangleCount);
  const orientationArea = new Float64Array(GRAMMAR_ORIENTATIONS.length);
  let residualAreaSum = 0;
  for (let t = 0; t < triangleCount; t++) {
    if (areas[t] === 0) continue;
    const s = snapNormal(normals[t * 3], normals[t * 3 + 1], normals[t * 3 + 2]);
    snapIndex[t] = s.index;
    snapResidual[t] = s.residualDeg;
    orientationArea[s.index] += areas[t];
    residualAreaSum += s.residualDeg * areas[t];
  }

  // edge map (welded vertex-id pairs, encoded as one number) → adjacent triangles
  const EDGE_BASE = 2 ** 21; // welded vertex counts are far below this
  const edgeTris = new Map();
  for (let t = 0; t < triangleCount; t++) {
    if (snapIndex[t] < 0) continue;
    for (let e = 0; e < 3; e++) {
      let a = triVerts[t * 3 + e];
      let b = triVerts[t * 3 + ((e + 1) % 3)];
      if (a === b) continue; // weld collapsed the edge
      if (a > b) { const tmp = a; a = b; b = tmp; }
      const k = a * EDGE_BASE + b;
      const list = edgeTris.get(k);
      if (list === undefined) edgeTris.set(k, [t]);
      else list.push(t);
    }
  }

  // region growing in triangle-index order (deterministic), BFS with an index pointer
  const region = new Int32Array(triangleCount).fill(-1);
  const regions = [];
  for (let seed = 0; seed < triangleCount; seed++) {
    if (snapIndex[seed] < 0 || region[seed] >= 0) continue;
    const id = regions.length;
    const queue = [seed];
    region[seed] = id;
    let area = 0, offsetSum = 0, residualSum = 0, maxResidual = 0, tris = 0;
    let cx = 0, cy = 0, cz = 0;
    const g = GRAMMAR_ORIENTATIONS[snapIndex[seed]].n;
    for (let q = 0; q < queue.length; q++) {
      const t = queue[q];
      const a = areas[t];
      area += a;
      tris++;
      const px = centroids[t * 3], py = centroids[t * 3 + 1], pz = centroids[t * 3 + 2];
      offsetSum += a * (g[0] * px + g[1] * py + g[2] * pz);
      cx += a * px; cy += a * py; cz += a * pz;
      residualSum += a * snapResidual[t];
      if (snapResidual[t] > maxResidual) maxResidual = snapResidual[t];
      for (let e = 0; e < 3; e++) {
        let va = triVerts[t * 3 + e];
        let vb = triVerts[t * 3 + ((e + 1) % 3)];
        if (va === vb) continue;
        if (va > vb) { const tmp = va; va = vb; vb = tmp; }
        const adj = edgeTris.get(va * EDGE_BASE + vb);
        for (const u of adj) {
          if (region[u] < 0 && snapIndex[u] === snapIndex[seed]) { region[u] = id; queue.push(u); }
        }
      }
    }
    regions.push({
      index: snapIndex[seed], area, triangles: tris,
      offset: offsetSum / area,
      centroid: [cx / area, cy / area, cz / area],
      meanResidualDeg: residualSum / area,
      maxResidualDeg: maxResidual,
    });
  }

  // keep the largest regions up to the declared target; record the dropped fraction
  const order = regions.map((_, i) => i).sort((a, b) =>
    regions[b].area - regions[a].area || regions[a].index - regions[b].index || regions[a].offset - regions[b].offset);
  const kept = order.slice(0, params.faceTarget);
  let droppedArea = 0;
  for (const i of order.slice(params.faceTarget)) droppedArea += regions[i].area;

  const faces = kept.map((i) => {
    const r = regions[i];
    const g = GRAMMAR_ORIENTATIONS[r.index];
    return {
      orientation: g.key,
      normal: g.n.map((v) => round(v, 6)),
      offset: round(r.offset, 6),
      centroid: r.centroid.map((v) => round(v, 6)),
      areaFrac: round(r.area / totalArea, 6),
      meanResidualDeg: round(r.meanResidualDeg, 2),
      maxResidualDeg: round(r.maxResidualDeg, 2),
      triangles: r.triangles,
    };
  });

  const areaShareByOrientation = {};
  for (let i = 0; i < GRAMMAR_ORIENTATIONS.length; i++) {
    if (orientationArea[i] > 0) areaShareByOrientation[GRAMMAR_ORIENTATIONS[i].key] = round(orientationArea[i] / totalArea, 4);
  }

  return {
    faces,
    stats: {
      triangleCount,
      degenerateCount: geom.degenerateCount,
      weldedVertices: vertexId.size,
      regionCount: regions.length,
      keptFaces: faces.length,
      droppedAreaFrac: round(droppedArea / totalArea, 4),
      meanResidualDeg: round(residualAreaSum / totalArea, 2),
      areaShareByOrientation,
    },
  };
}

// --- internal occupancy substrate -----------------------------------------------------------------

// Same deterministic sub-voxel nudge idea as glb-voxelize.mjs pointInMesh: keep a row's ray off
// shared edges / face diagonals. Row-constant (the whole +x scanline shares one origin), which is
// the one intended divergence from the per-cell twin — cross-validated in the unit tests.
const JITTER_Y = 1.0;
const JITTER_Z = 0.6180339887;
const PARALLEL_EPS = 1e-12;

/**
 * Solid occupancy of a triangle soup by scanline ray parity: ONE +x ray per (y,z) row collects all
 * crossing x positions; cells whose center lies past an odd number of crossings are inside. Cell
 * conventions (min-corner origin, voxelSize = longest extent / scale, centers at +0.5) match
 * `voxelizeGlb` so the two substrates speak one vocabulary.
 * @returns {{ scale, voxelSize, dims, bounds, occupied: Int32Array, count }} voxelizeGlb's shape
 */
export function sampleOccupancy(positions, triangleCount, bounds, { scale = SKETCH_PARAMS.sampleScale } = {}) {
  const { min, max } = bounds;
  const extent = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
  const longest = Math.max(extent[0], extent[1], extent[2]);
  if (!(longest > 0)) throw new Error("sampleOccupancy: degenerate mesh (zero-size bounding box)");
  const voxelSize = longest / scale;
  const dims = extent.map((e) => Math.max(1, Math.round(e / voxelSize)));

  const occupied = [];
  const crossings = [];
  for (let j = 0; j < dims[1]; j++) {
    const py = min[1] + (j + 0.5) * voxelSize;
    for (let k = 0; k < dims[2]; k++) {
      const pz = min[2] + (k + 0.5) * voxelSize;
      const eps = (Math.abs(min[0]) + Math.abs(py) + Math.abs(pz) + 1) * 1e-9;
      const oy = py + eps * JITTER_Y;
      const oz = pz + eps * JITTER_Z;
      crossings.length = 0;
      for (let t = 0; t < triangleCount; t++) {
        const o = t * 9;
        const ax = positions[o], ay = positions[o + 1], az = positions[o + 2];
        const e1y = positions[o + 4] - ay, e1z = positions[o + 5] - az;
        const e2y = positions[o + 7] - ay, e2z = positions[o + 8] - az;
        const det = e1y * -e2z + e1z * e2y;
        if (det > -PARALLEL_EPS && det < PARALLEL_EPS) continue;
        const inv = 1 / det;
        const sy = oy - ay, sz = oz - az;
        const u = inv * (sy * -e2z + sz * e2y);
        if (u < 0 || u > 1) continue;
        const qx = sy * e1z - sz * e1y; // (s × e1).x — independent of the ray's x origin
        const v = inv * qx;
        if (v < 0 || u + v > 1) continue;
        // absolute x of the crossing (the origin's x cancels out of Möller–Trumbore):
        //   x = ax + [e2x·qx + e1x·(e2y·sz − e2z·sy)] / det
        const e1x = positions[o + 3] - ax, e2x = positions[o + 6] - ax;
        crossings.push(ax + (e2x * qx + e1x * (e2y * sz - e2z * sy)) * inv);
      }
      crossings.sort((a, b) => a - b);
      let c = 0;
      for (let i = 0; i < dims[0]; i++) {
        const px = min[0] + (i + 0.5) * voxelSize;
        while (c < crossings.length && crossings[c] <= px) c++;
        if ((crossings.length - c) % 2 === 1) occupied.push(i, j, k);
      }
    }
  }
  return { scale, voxelSize, dims, bounds, occupied: Int32Array.from(occupied), count: occupied.length / 3 };
}

// --- mirror symmetry --------------------------------------------------------------------------------

const encodeCell = (x, y, z) => ((x + 512) << 20) | ((y + 512) << 10) | (z + 512); // dims ≤ 64 « 512

/**
 * Dominant mirror plane: candidates are the axis-aligned vertical planes x=c and z=c (the grammar
 * admits no other mirrors), c swept on half-cell positions over the middle half of the plan bbox.
 * Score = IoU of the occupancy with its own reflection. Below the declared confidence the subject
 * STAYS asymmetric — the score is recorded either way, never forced. When applied, the BETTER half
 * wins: the side whose coarse faces carry the lower area-weighted snap residual (the straighter
 * half) is kept and mirrored — cells and faces both.
 *
 * @param {{dims:number[], voxelSize:number, bounds:object, occupied:Int32Array}} sample
 * @param {Array} faces coarseFaces() output (mesh coordinates)
 * @returns {{ axis, offsetCells, offsetMesh, score, threshold, applied, keptSide, scoreByAxis,
 *             occupied: Int32Array, faces: Array }}
 */
export function detectSymmetry(sample, faces, params = SKETCH_PARAMS) {
  const { occupied, voxelSize, bounds } = sample;
  const n = occupied.length / 3;
  const set = new Set();
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < occupied.length; i += 3) {
    set.add(encodeCell(occupied[i], occupied[i + 1], occupied[i + 2]));
    for (let a = 0; a < 3; a++) {
      const v = occupied[i + a];
      if (v < lo[a]) lo[a] = v;
      if (v > hi[a]) hi[a] = v;
    }
  }

  const axes = [0, 2]; // vertical mirror planes only
  let best = null;
  const scoreByAxis = {};
  for (const axis of axes) {
    const span = hi[axis] - lo[axis];
    const from = Math.ceil(2 * (lo[axis] + span / 4));
    const to = Math.floor(2 * (hi[axis] - span / 4));
    let axisBest = null;
    for (let twoC = from; twoC <= to; twoC++) {
      let inter = 0;
      for (let i = 0; i < occupied.length; i += 3) {
        const x = occupied[i], y = occupied[i + 1], z = occupied[i + 2];
        const m = axis === 0 ? encodeCell(twoC - x, y, z) : encodeCell(x, y, twoC - z);
        if (set.has(m)) inter++;
      }
      const score = inter / (2 * n - inter);
      if (axisBest === null || score > axisBest.score + 1e-12) axisBest = { axis, twoC, score };
    }
    if (axisBest) {
      scoreByAxis[axis === 0 ? "x" : "z"] = round(axisBest.score, 4);
      if (best === null || axisBest.score > best.score + 1e-12) best = axisBest;
    }
  }
  /* c8 ignore next */
  if (best === null) throw new Error("detectSymmetry: empty occupancy");

  const { axis, twoC } = best;
  const offsetCells = twoC / 2;
  const offsetMesh = bounds.min[axis] + (offsetCells + 0.5) * voxelSize;
  const applied = best.score >= params.symmetryConfidence;
  const axisName = axis === 0 ? "x" : "z";

  // the straighter half — area-weighted snap residual of the coarse faces per side (mesh coords);
  // faces within a quarter-cell of the plane belong to neither side
  const band = voxelSize / 4;
  const acc = { low: { area: 0, residual: 0 }, high: { area: 0, residual: 0 } };
  for (const f of faces) {
    const d = f.centroid[axis] - offsetMesh;
    if (Math.abs(d) <= band) continue;
    const side = d < 0 ? "low" : "high";
    acc[side].area += f.areaFrac;
    acc[side].residual += f.areaFrac * f.meanResidualDeg;
  }
  const meanLow = acc.low.area > 0 ? acc.low.residual / acc.low.area : Infinity;
  const meanHigh = acc.high.area > 0 ? acc.high.residual / acc.high.area : Infinity;
  const keptSide = meanLow <= meanHigh ? "low" : "high";

  const verdict = {
    axis: axisName,
    offsetCells: round(offsetCells, 1),
    offsetMesh: round(offsetMesh, 6),
    score: round(best.score, 4),
    threshold: params.symmetryConfidence,
    applied,
    keptSide: applied ? keptSide : null,
    scoreByAxis,
  };
  if (!applied) return { ...verdict, occupied, faces };

  // symmetrize occupancy: keep the better half (plus the center column when the plane passes
  // through cell centers) and mirror it across
  const outCells = [];
  for (let i = 0; i < occupied.length; i += 3) {
    const c = [occupied[i], occupied[i + 1], occupied[i + 2]];
    const d = c[axis] * 2 - twoC; // sign = side, in half-cells
    const onKept = d === 0 || (keptSide === "low" ? d < 0 : d > 0);
    if (!onKept) continue;
    outCells.push(c);
    if (d !== 0) {
      const m = c.slice();
      m[axis] = twoC - c[axis];
      outCells.push(m);
    }
  }
  outCells.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
  const outOccupied = new Int32Array(outCells.length * 3);
  outCells.forEach((c, i) => { outOccupied[i * 3] = c[0]; outOccupied[i * 3 + 1] = c[1]; outOccupied[i * 3 + 2] = c[2]; });

  // symmetrize faces: drop the other side, mirror the kept side (reflected orientation; the
  // reflected plane offset is offset − 2·o·n_axis since reflection is orthogonal), merge mirrors
  // that land on an existing face of the same orientation within half a cell
  const indexByKey = new Map(GRAMMAR_ORIENTATIONS.map((g, i) => [g.key, i]));
  const keptFaces = faces.filter((f) => {
    const d = f.centroid[axis] - offsetMesh;
    return Math.abs(d) <= band || (keptSide === "low" ? d < 0 : d > 0);
  });
  const mirrored = [];
  for (const f of keptFaces) {
    const d = f.centroid[axis] - offsetMesh;
    if (Math.abs(d) <= band) continue; // straddles the plane — already whole
    const gi = mirrorOrientationIndex(indexByKey.get(f.orientation), axis);
    const g = GRAMMAR_ORIENTATIONS[gi];
    const centroid = f.centroid.slice();
    centroid[axis] = round(2 * offsetMesh - f.centroid[axis], 6);
    mirrored.push({
      ...f,
      orientation: g.key,
      normal: g.n.map((v) => round(v, 6)),
      offset: round(f.offset - 2 * offsetMesh * GRAMMAR_ORIENTATIONS[indexByKey.get(f.orientation)].n[axis], 6),
      centroid,
    });
  }
  const merged = [...keptFaces];
  for (const m of mirrored) {
    const twin = merged.find((f) => f.orientation === m.orientation && Math.abs(f.offset - m.offset) <= voxelSize / 2);
    if (twin) twin.areaFrac = round(twin.areaFrac + m.areaFrac, 6);
    else merged.push(m);
  }
  merged.sort((a, b) => b.areaFrac - a.areaFrac || indexByKey.get(a.orientation) - indexByKey.get(b.orientation) || a.offset - b.offset);
  return { ...verdict, occupied: outOccupied, faces: merged.slice(0, params.faceTarget) };
}

// --- rectilinear footprint ---------------------------------------------------------------------------

/**
 * Axis-aligned rectilinear footprint of the (post-symmetry) occupancy: project to the plan, trace
 * the outer boundary on the corner lattice (rectilinear at cell resolution by construction), merge
 * collinear runs, then snap away jogs shorter than the declared tolerance by moving the SHORTER of
 * the jog's two parallel neighbors onto the longer one's line. Vertices are corner coordinates in
 * cell units, CCW from the lexicographically smallest vertex.
 *
 * @param {Int32Array} occupied flat [x,y,z]* cells
 * @returns {{ polygon:number[][], isRectangle:boolean, toleranceCells:number, maskArea:number,
 *             polygonArea:number, planDims:number[] }}
 */
export function fitFootprint(occupied, params = SKETCH_PARAMS) {
  const mask = new Set();
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < occupied.length; i += 3) {
    const x = occupied[i], z = occupied[i + 2];
    mask.add(`${x},${z}`);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }
  if (mask.size === 0) throw new Error("fitFootprint: empty occupancy");
  const planDims = [maxX - minX + 1, maxZ - minZ + 1];
  const toleranceCells = Math.max(1, Math.ceil(params.footprintSnapTolFrac * Math.max(planDims[0], planDims[1])));

  // directed boundary edges on the corner lattice, interior on the left (CCW outer loop)
  const edges = new Map(); // "x,z" start corner → sorted array of end corners
  const addEdge = (x1, z1, x2, z2) => {
    const k = `${x1},${z1}`;
    const list = edges.get(k);
    if (list === undefined) edges.set(k, [[x2, z2]]);
    else { list.push([x2, z2]); list.sort((a, b) => a[0] - b[0] || a[1] - b[1]); }
  };
  for (const key of [...mask].sort()) {
    const [x, z] = key.split(",").map(Number);
    if (!mask.has(`${x},${z - 1}`)) addEdge(x, z, x + 1, z);
    if (!mask.has(`${x},${z + 1}`)) addEdge(x + 1, z + 1, x, z + 1);
    if (!mask.has(`${x - 1},${z}`)) addEdge(x, z + 1, x, z);
    if (!mask.has(`${x + 1},${z}`)) addEdge(x + 1, z, x + 1, z + 1);
  }

  // chain edges into loops; keep the loop with the largest |shoelace| as the outer boundary
  const loops = [];
  for (const start of [...edges.keys()].sort()) {
    while ((edges.get(start) ?? []).length > 0) {
      const loop = [];
      let key = start;
      do {
        const list = edges.get(key);
        /* c8 ignore next */
        if (!list || list.length === 0) throw new Error("fitFootprint: open boundary chain");
        const next = list.shift();
        const [x, z] = key.split(",").map(Number);
        loop.push([x, z]);
        key = `${next[0]},${next[1]}`;
      } while (key !== start);
      loops.push(loop);
    }
  }
  const shoelace = (poly) => {
    let s = 0;
    for (let i = 0; i < poly.length; i++) {
      const [x1, z1] = poly[i];
      const [x2, z2] = poly[(i + 1) % poly.length];
      s += x1 * z2 - x2 * z1;
    }
    return s / 2;
  };
  let polygon = loops.reduce((bestLoop, l) =>
    bestLoop === null || Math.abs(shoelace(l)) > Math.abs(shoelace(bestLoop)) ? l : bestLoop, null);
  if (shoelace(polygon) < 0) polygon = [polygon[0], ...polygon.slice(1).reverse()];

  // merge collinear runs / drop zero-length edges
  const normalize = (poly) => {
    let out = poly;
    let changed = true;
    while (changed) {
      changed = false;
      const next = [];
      const m = out.length;
      for (let i = 0; i < m; i++) {
        const prev = out[(i - 1 + m) % m];
        const cur = out[i];
        const nxt = out[(i + 1) % m];
        if (cur[0] === nxt[0] && cur[1] === nxt[1]) { changed = true; continue; } // zero-length
        const d1 = [Math.sign(cur[0] - prev[0]), Math.sign(cur[1] - prev[1])];
        const d2 = [Math.sign(nxt[0] - cur[0]), Math.sign(nxt[1] - cur[1])];
        if (d1[0] === d2[0] && d1[1] === d2[1]) { changed = true; continue; } // collinear
        next.push(cur);
      }
      out = next;
    }
    return out;
  };
  polygon = normalize(polygon);

  // jog snap: repeatedly take the shortest edge ≤ tol and merge its two parallel neighbors onto
  // the LONGER one's line (the dominant edge wins; the swept area stays ≤ tol · shorter neighbor)
  const edgeLen = (poly, i) => {
    const [x1, z1] = poly[i];
    const [x2, z2] = poly[(i + 1) % poly.length];
    return Math.abs(x2 - x1) + Math.abs(z2 - z1);
  };
  let guard = polygon.length * 2;
  while (polygon.length > 4 && guard-- > 0) {
    const m = polygon.length;
    let pick = -1;
    let pickLen = Infinity;
    for (let i = 0; i < m; i++) {
      const L = edgeLen(polygon, i);
      if (L <= toleranceCells && L < pickLen) { pick = i; pickLen = L; }
    }
    if (pick < 0) break;
    const a = (pick - 1 + m) % m; // edge before the jog
    const c = (pick + 1) % m; //     edge after the jog
    const jogAxis = polygon[pick][0] === polygon[(pick + 1) % m][0] ? 1 : 0; // axis B changes along
    // A and C are constant in jogAxis; move the SHORTER one onto the longer's line
    const lenA = edgeLen(polygon, a);
    const lenC = edgeLen(polygon, c);
    if (lenA >= lenC) {
      const target = polygon[pick][jogAxis]; // A's constant value (B starts on A's line)
      polygon[(pick + 1) % m] = polygon[(pick + 1) % m].slice();
      polygon[(c + 1) % m] = polygon[(c + 1) % m].slice();
      polygon[(pick + 1) % m][jogAxis] = target;
      polygon[(c + 1) % m][jogAxis] = target;
    } else {
      const target = polygon[(pick + 1) % m][jogAxis]; // C's constant value (B ends on C's line)
      polygon[pick] = polygon[pick].slice();
      polygon[a] = polygon[a].slice();
      polygon[pick][jogAxis] = target;
      polygon[a][jogAxis] = target;
    }
    polygon = normalize(polygon);
  }

  // canonical start: lexicographically smallest vertex
  let startIdx = 0;
  for (let i = 1; i < polygon.length; i++) {
    if (polygon[i][0] < polygon[startIdx][0] ||
      (polygon[i][0] === polygon[startIdx][0] && polygon[i][1] < polygon[startIdx][1])) startIdx = i;
  }
  polygon = [...polygon.slice(startIdx), ...polygon.slice(0, startIdx)];

  return {
    polygon,
    isRectangle: polygon.length === 4,
    toleranceCells,
    maskArea: mask.size,
    polygonArea: Math.abs(shoelace(polygon)),
    planDims,
  };
}

// --- gross proportions --------------------------------------------------------------------------------

/**
 * Roof pitch class from the RAW (pre-snap) normals — measured before the grammar snap so a steep
 * roof is not laundered into 45° by its own conditioning. Upward faces (ny > 0.05) vote with their
 * area into the declared tilt buckets; the dominant tilt is the area-weighted mean of the winning
 * bucket.
 */
export function pitchClass(normals, areas, params = SKETCH_PARAMS) {
  const b = params.pitchBucketsDeg;
  const buckets = ["flat", "low", "pitched45", "steep"];
  const bucketOf = (tilt) => (tilt < b.flat ? "flat" : tilt < b.low ? "low" : tilt < b.pitched45 ? "pitched45" : "steep");
  const area = { flat: 0, low: 0, pitched45: 0, steep: 0 };
  const tiltSum = { flat: 0, low: 0, pitched45: 0, steep: 0 };
  let upward = 0;
  let total = 0;
  const n = areas.length;
  for (let t = 0; t < n; t++) {
    const a = areas[t];
    if (a === 0) continue;
    total += a;
    const ny = normals[t * 3 + 1];
    if (ny <= 0.05) continue;
    const tilt = acosDeg(ny);
    const k = bucketOf(tilt);
    area[k] += a;
    tiltSum[k] += a * tilt;
    upward += a;
  }
  if (upward === 0) return { class: "unknown", dominantTiltDeg: null, upwardAreaFrac: 0, areaShare: {} };
  let winner = buckets[0];
  for (const k of buckets) if (area[k] > area[winner]) winner = k;
  const areaShare = {};
  for (const k of buckets) if (area[k] > 0) areaShare[k] = round(area[k] / upward, 4);
  return {
    class: winner,
    dominantTiltDeg: round(tiltSum[winner] / area[winner], 2),
    upwardAreaFrac: round(upward / total, 4),
    areaShare,
  };
}

/**
 * Gross proportions of the conditioned body: eave/ridge layers, block-equivalent heights at the
 * subject's registry working scale (registry DATA, not a constant), storey-count CANDIDATES (the
 * sketch proposes, recognition decides — E-31 Rule 3), and the mass inventory from segmentMasses.
 */
export function proportionsOf(occupied, masses, params = SKETCH_PARAMS, { registryScale, sampleScale }) {
  if (!(registryScale > 0) || !(sampleScale > 0)) throw new Error("proportionsOf: registryScale and sampleScale are required");
  const layerCount = new Map();
  const plan = new Set();
  let minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < occupied.length; i += 3) {
    const y = occupied[i + 1];
    layerCount.set(y, (layerCount.get(y) ?? 0) + 1);
    plan.add(`${occupied[i]},${occupied[i + 2]}`);
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  let eaveLayer = minY;
  for (let y = maxY; y >= minY; y--) {
    if ((layerCount.get(y) ?? 0) >= params.eaveAreaFrac * plan.size) { eaveLayer = y; break; }
  }
  const cellsToBlocks = registryScale / sampleScale;
  const heightCells = maxY - minY + 1;
  const eaveCells = eaveLayer - minY + 1;
  const [bandLo, bandHi] = params.storeyBandBlocks;
  const storeyCandidates = [];
  for (let n = 1; n <= 4; n++) {
    const perStoreyBlocks = round((eaveCells * cellsToBlocks) / n, 1);
    storeyCandidates.push({ n, perStoreyBlocks, plausible: perStoreyBlocks >= bandLo && perStoreyBlocks <= bandHi });
  }
  const massSummaries = masses.map((m) => ({
    id: m.id,
    role: m.role,
    areaCells: m.plan.area,
    bbox: m.plan.bbox,
    yRange: m.yRange,
    volume: m.volume,
  }));
  return {
    heightCells,
    eaveLayer,
    ridgeLayer: maxY,
    eaveFrac: round(eaveCells / heightCells, 4),
    eaveBlocks: round(eaveCells * cellsToBlocks, 1),
    heightBlocks: round(heightCells * cellsToBlocks, 1),
    storeyCandidates,
    massCount: massSummaries.filter((m) => m.role !== "protrusion").length,
    masses: massSummaries,
  };
}

// --- the sketch ------------------------------------------------------------------------------------------

/**
 * The full conditioning: GLB bytes → form-sketch/v1 record. Deterministic (no timestamps, no
 * randomness); the runner adds source.glbSha256 and proves byte-reproducibility via --repro.
 * `registryScale` is the subject's registry working scale (e.g. SUBJECTS[key].generated.scale) —
 * passed in so this module stays registry-blind and subject-agnostic.
 */
export function buildSketch(glbBytes, { subject, registryScale, params = SKETCH_PARAMS }) {
  const mesh = parseGlbMesh(glbBytes);
  const geom = triangleGeometry(mesh.positions, mesh.triangleCount);
  const pitch = pitchClass(geom.normals, geom.areas, params);
  const cf = coarseFaces(mesh.positions, mesh.triangleCount, params);
  const sample = sampleOccupancy(mesh.positions, mesh.triangleCount, mesh.bounds, { scale: params.sampleScale });
  const sym = detectSymmetry(sample, cf.faces, params);
  const cells = [];
  for (let i = 0; i < sym.occupied.length; i += 3) {
    cells.push({ pos: [sym.occupied[i], sym.occupied[i + 1], sym.occupied[i + 2]], block: "stone" });
  }
  const occ = occupancyFromCells(cells);
  const { masses } = segmentMasses(occ);
  const footprint = fitFootprint(sym.occupied, params);
  const proportions = proportionsOf(sym.occupied, masses, params, { registryScale, sampleScale: sample.scale });
  const { occupied: _occ, faces: symFaces, ...symmetry } = sym;
  return {
    schema: FORM_SKETCH_SCHEMA,
    subject,
    params: { ...params, registryScale },
    source: {
      triangleCount: mesh.triangleCount,
      bounds: {
        min: mesh.bounds.min.map((v) => round(v, 6)),
        max: mesh.bounds.max.map((v) => round(v, 6)),
      },
    },
    substrate: {
      sampleScale: sample.scale,
      voxelSize: round(sample.voxelSize, 6),
      dims: sample.dims,
      count: sample.count,
      conditionedCount: sym.occupied.length / 3,
    },
    grammar: cf.stats,
    pitch,
    symmetry,
    footprint,
    proportions,
    faces: symFaces,
  };
}
