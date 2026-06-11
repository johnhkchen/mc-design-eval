// Unit tests for the GLB conditioning core (T-123-01) — synthetic meshes only, fully offline.
// Soup builders construct watertight triangle soups in parseGlbMesh's flat layout; `soupToGlb`
// wraps one into a minimal in-memory .glb for the end-to-end buildSketch path (the real registered
// GLBs are exercised by the benchmarks/sculpture/form-sketch.mjs runner, not unit tests — real
// meshes are not stable fixtures). Determinism is asserted by double-run byte equality.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  FORM_SKETCH_SCHEMA, SKETCH_PARAMS, GRAMMAR_ORIENTATIONS,
  triangleGeometry, snapNormal, coarseFaces, sampleOccupancy, detectSymmetry,
  fitFootprint, roofProfile, pitchBucket, proportionsOf, buildSketch,
} from "./form-sketch.mjs";
import { voxelizeGlb, occupiedCells } from "./glb-voxelize.mjs";

// --- soup builders ----------------------------------------------------------------------------

/** Push quad a→b→c→d as two CCW triangles (outward normal by right-hand rule). */
function quad(out, a, b, c, d) {
  out.push(...a, ...b, ...c, ...a, ...c, ...d);
}

/** Axis-aligned closed box as a 12-triangle soup with outward normals. */
function boxSoup(min, size, out = []) {
  const [x0, y0, z0] = min;
  const [x1, y1, z1] = [min[0] + size[0], min[1] + size[1], min[2] + size[2]];
  quad(out, [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0]); // -z
  quad(out, [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]); // +z
  quad(out, [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]); // -x
  quad(out, [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]); // +x
  quad(out, [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]); // -y
  quad(out, [x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]); // +y
  return out;
}

/** Closed gabled prism: ridge along x at z = d/2, roof pitch in degrees. */
function gabledPrismSoup({ w = 12, d = 8, eave = 4, pitchDeg = 45 } = {}) {
  const ridgeY = eave + (d / 2) * Math.tan((pitchDeg * Math.PI) / 180);
  const out = [];
  quad(out, [0, 0, 0], [w, 0, 0], [w, 0, d], [0, 0, d]); // floor (-y)
  quad(out, [0, 0, 0], [0, eave, 0], [w, eave, 0], [w, 0, 0]); // -z wall
  quad(out, [0, 0, d], [w, 0, d], [w, eave, d], [0, eave, d]); // +z wall
  quad(out, [w, eave, 0], [0, eave, 0], [0, ridgeY, d / 2], [w, ridgeY, d / 2]); // roof, -z slope
  quad(out, [0, eave, d], [w, eave, d], [w, ridgeY, d / 2], [0, ridgeY, d / 2]); // roof, +z slope
  // -x gable pentagon: wall rectangle + gable triangle
  quad(out, [0, 0, 0], [0, 0, d], [0, eave, d], [0, eave, 0]);
  out.push(0, eave, 0, 0, eave, d, 0, ridgeY, d / 2);
  // +x gable pentagon
  quad(out, [w, 0, 0], [w, eave, 0], [w, eave, d], [w, 0, d]);
  out.push(w, eave, 0, w, ridgeY, d / 2, w, eave, d);
  return out;
}

/** Deterministic position-keyed pseudo-noise in [-0.5, 0.5] (no Math.random — repeatable). */
function hashNoise(x, y, z, salt) {
  const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + salt * 4.5811) * 43758.5453;
  return s - Math.floor(s) - 0.5;
}

/** Box with every face subdivided k×k and vertices perturbed by position-keyed noise (shared
 *  positions perturb identically, so the soup stays welded/watertight). `onlyHighX` confines the
 *  noise to the x > centre half, leaving the low-x half clean. */
function noisyBoxSoup(min, size, { k = 6, amp = 0.08, onlyHighX = false } = {}) {
  const out = [];
  boxSoup(min, size, out);
  const subdivided = [];
  const cx = min[0] + size[0] / 2;
  const perturb = (p) => {
    if (onlyHighX && p[0] <= cx) return p;
    return [
      p[0] + amp * hashNoise(p[0], p[1], p[2], 1),
      p[1] + amp * hashNoise(p[0], p[1], p[2], 2),
      p[2] + amp * hashNoise(p[0], p[1], p[2], 3),
    ];
  };
  // out holds 12 triangles = 6 quads in emission order; re-subdivide each quad bilinearly
  for (let q = 0; q < 6; q++) {
    const o = q * 18; // 2 triangles × 9 numbers; quad corners a, b, c (tri 1) and d (tri 2 last vertex)
    const a = [out[o], out[o + 1], out[o + 2]];
    const b = [out[o + 3], out[o + 4], out[o + 5]];
    const c = [out[o + 6], out[o + 7], out[o + 8]];
    const d = [out[o + 15], out[o + 16], out[o + 17]];
    const lerp = (p, qq, t) => [p[0] + (qq[0] - p[0]) * t, p[1] + (qq[1] - p[1]) * t, p[2] + (qq[2] - p[2]) * t];
    const at = (i, j) => lerp(lerp(a, b, i / k), lerp(d, c, i / k), j / k); // bilinear a→b along i, a→d along j
    for (let i = 0; i < k; i++) {
      for (let j = 0; j < k; j++) {
        quad(subdivided, perturb(at(i, j)), perturb(at(i + 1, j)), perturb(at(i + 1, j + 1)), perturb(at(i, j + 1)));
      }
    }
  }
  return subdivided;
}

/** Wrap a flat triangle soup into a minimal valid in-memory .glb (non-indexed POSITION only). */
function soupToGlb(soup) {
  const f32 = Float32Array.from(soup);
  const count = f32.length / 3;
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < f32.length; i += 3) {
    for (let a = 0; a < 3; a++) {
      min[a] = Math.min(min[a], f32[i + a]);
      max[a] = Math.max(max[a], f32[i + a]);
    }
  }
  const bin = new Uint8Array(f32.buffer.slice(0));
  const binPad = (4 - (bin.length % 4)) % 4;
  const json = JSON.stringify({
    asset: { version: "2.0" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
    accessors: [{ bufferView: 0, componentType: 5126, count, type: "VEC3", min, max }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: bin.length }],
    buffers: [{ byteLength: bin.length + binPad }],
  });
  const jsonBytes = new TextEncoder().encode(json);
  const jsonPad = (4 - (jsonBytes.length % 4)) % 4;
  const total = 12 + 8 + jsonBytes.length + jsonPad + 8 + bin.length + binPad;
  const glb = new Uint8Array(total);
  const dv = new DataView(glb.buffer);
  dv.setUint32(0, 0x46546c67, true); // magic "glTF"
  dv.setUint32(4, 2, true);
  dv.setUint32(8, total, true);
  dv.setUint32(12, jsonBytes.length + jsonPad, true);
  dv.setUint32(16, 0x4e4f534a, true); // "JSON"
  glb.set(jsonBytes, 20);
  for (let i = 0; i < jsonPad; i++) glb[20 + jsonBytes.length + i] = 0x20;
  const binStart = 20 + jsonBytes.length + jsonPad;
  dv.setUint32(binStart, bin.length + binPad, true);
  dv.setUint32(binStart + 4, 0x004e4942, true); // "BIN\0"
  glb.set(bin, binStart + 8);
  return glb;
}

const soupArrays = (soup) => ({ positions: Float64Array.from(soup), triangleCount: soup.length / 9 });

// --- grammar + snap -----------------------------------------------------------------------------

test("snapNormal: each of the 14 grammar orientations snaps to itself with zero residual", () => {
  for (const [i, g] of GRAMMAR_ORIENTATIONS.entries()) {
    const s = snapNormal(g.n[0], g.n[1], g.n[2]);
    assert.equal(s.index, i);
    assert.ok(s.residualDeg < 1e-6, `${g.key} residual ${s.residualDeg}`);
  }
});

test("snapNormal: a 10°-off-axis wall normal snaps to the axis with ~10° residual", () => {
  const a = (10 * Math.PI) / 180;
  const s = snapNormal(Math.cos(a), Math.sin(a), 0);
  assert.equal(s.key, "+x");
  assert.ok(Math.abs(s.residualDeg - 10) < 1e-6);
});

test("snapNormal: 44° and 46° roof planes both land in the 45° roof family", () => {
  for (const deg of [44, 46]) {
    const a = (deg * Math.PI) / 180;
    const s = snapNormal(Math.sin(a), Math.cos(a), 0);
    assert.equal(s.key, "roof+x+y", `at ${deg}°`);
    assert.ok(s.residualDeg < 1.001, `residual ${s.residualDeg} at ${deg}°`);
  }
});

test("triangleGeometry: areas, outward normals, degenerate counting", () => {
  const soup = [0, 0, 0, 2, 0, 0, 0, 2, 0, /* degenerate: */ 1, 1, 1, 1, 1, 1, 2, 2, 2];
  const g = triangleGeometry(Float64Array.from(soup), 2);
  assert.equal(g.areas[0], 2); // right triangle, legs 2
  assert.deepEqual([...g.normals.slice(0, 3)], [0, 0, 1]);
  assert.equal(g.degenerateCount, 1);
  assert.equal(g.areas[1], 0);
});

// --- coarse faces (decimate + snap + merge) -------------------------------------------------------

test("coarseFaces: clean box → exactly 6 faces, zero residual, correct offsets and area shares", () => {
  const { positions, triangleCount } = soupArrays(boxSoup([0, 0, 0], [12, 8, 10]));
  const { faces, stats } = coarseFaces(positions, triangleCount);
  assert.equal(faces.length, 6);
  assert.equal(stats.regionCount, 6);
  assert.equal(stats.droppedAreaFrac, 0);
  assert.equal(stats.meanResidualDeg, 0);
  const byKey = Object.fromEntries(faces.map((f) => [f.orientation, f]));
  assert.equal(byKey["+x"].offset, 12);
  assert.equal(byKey["-x"].offset, 0); // n=(-1,0,0) · (0, y, z) = 0
  assert.equal(byKey["+y"].offset, 8);
  assert.equal(byKey["+z"].offset, 10);
  const total = faces.reduce((s, f) => s + f.areaFrac, 0);
  assert.ok(Math.abs(total - 1) < 1e-4);
  assert.equal(Object.keys(stats.areaShareByOrientation).length, 6);
});

test("coarseFaces: noisy subdivided box decimates to ≤ faceTarget with 6 dominant axis faces", () => {
  const { positions, triangleCount } = soupArrays(noisyBoxSoup([0, 0, 0], [12, 8, 10]));
  assert.equal(triangleCount, 6 * 6 * 6 * 2);
  const { faces, stats } = coarseFaces(positions, triangleCount);
  assert.ok(faces.length <= SKETCH_PARAMS.faceTarget);
  const top6 = faces.slice(0, 6);
  const axisKeys = new Set(["+x", "-x", "+y", "-y", "+z", "-z"]);
  for (const f of top6) assert.ok(axisKeys.has(f.orientation), `top face ${f.orientation}`);
  assert.equal(new Set(top6.map((f) => f.orientation)).size, 6);
  assert.ok(top6.reduce((s, f) => s + f.areaFrac, 0) > 0.9);
  assert.ok(stats.meanResidualDeg > 0); // the noise is visible in the honesty stats
});

test("coarseFaces: 45° gabled prism → both roof slopes in the roof family at the right offsets", () => {
  const { positions, triangleCount } = soupArrays(gabledPrismSoup({ w: 12, d: 8, eave: 4, pitchDeg: 45 }));
  const { faces } = coarseFaces(positions, triangleCount);
  const roofs = faces.filter((f) => f.orientation.startsWith("roof"));
  assert.equal(roofs.length, 2);
  assert.deepEqual(new Set(roofs.map((f) => f.orientation)), new Set(["roof+z+y", "roof-z+y"]));
  for (const r of roofs) assert.ok(r.meanResidualDeg < 1e-6);
});

// --- substrate sampler (cross-validated against the per-cell twin) --------------------------------

function cellSet(occ) {
  const s = new Set();
  for (const [i, j, k] of occupiedCells(occ)) s.add(`${i},${j},${k}`);
  return s;
}

test("sampleOccupancy ≡ voxelizeGlb on a box (scanline twin keeps the cell vocabulary)", () => {
  const glb = soupToGlb(boxSoup([0, 0, 0], [12, 8, 10]));
  const a = voxelizeGlb(glb, { scale: 12 });
  const { positions, triangleCount } = soupArrays(boxSoup([0, 0, 0], [12, 8, 10]));
  const b = sampleOccupancy(positions, triangleCount, a.bounds, { scale: 12 });
  assert.deepEqual(b.dims, a.dims);
  assert.equal(b.voxelSize, a.voxelSize);
  assert.deepEqual(cellSet(b), cellSet(a));
  assert.equal(b.count, 12 * 8 * 10);
});

test("sampleOccupancy ≡ voxelizeGlb on a gabled prism (slanted faces, gable-end parity)", () => {
  const soup = gabledPrismSoup({ w: 12, d: 8, eave: 4, pitchDeg: 45 });
  const glb = soupToGlb(soup);
  const a = voxelizeGlb(glb, { scale: 12 });
  const { positions, triangleCount } = soupArrays(soup);
  const b = sampleOccupancy(positions, triangleCount, a.bounds, { scale: 12 });
  assert.deepEqual(cellSet(b), cellSet(a));
});

// --- symmetry ---------------------------------------------------------------------------------------

/** Fabricate a substrate sample from explicit cells (unit voxels, bounds at the origin). */
function sampleOf(cells, dims) {
  const occupied = new Int32Array(cells.length * 3);
  cells.forEach((c, i) => occupied.set(c, i * 3));
  return { scale: dims[0], voxelSize: 1, dims, bounds: { min: [0, 0, 0], max: dims }, occupied, count: cells.length };
}

const boxCells = (x0, x1, y0, y1, z0, z1) => {
  const out = [];
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) out.push([x, y, z]);
  return out;
};

const faceStub = (orientation, centroid, { areaFrac = 0.1, residual = 0 } = {}) => {
  const g = GRAMMAR_ORIENTATIONS.find((o) => o.key === orientation);
  return {
    orientation, normal: g.n, centroid,
    offset: g.n[0] * centroid[0] + g.n[1] * centroid[1] + g.n[2] * centroid[2],
    areaFrac, meanResidualDeg: residual, maxResidualDeg: residual, triangles: 1,
  };
};

test("detectSymmetry: perfect mirror → score 1, applied, occupancy preserved, straighter half kept", () => {
  const sample = sampleOf(boxCells(0, 11, 0, 3, 0, 5), [12, 4, 6]);
  // clean faces on low x, lumpy faces on high x → the low half is the better half
  const faces = [
    faceStub("-x", [0, 2, 3], { residual: 0.5 }),
    faceStub("roof-x+y", [2, 3.5, 3], { residual: 1 }),
    faceStub("+x", [12, 2, 3], { residual: 9 }),
  ];
  const r = detectSymmetry(sample, faces, { ...SKETCH_PARAMS, symmetryConfidence: 0.8 });
  assert.equal(r.axis, "x");
  assert.equal(r.score, 1);
  assert.equal(r.offsetCells, 5.5);
  assert.equal(r.applied, true);
  assert.equal(r.keptSide, "low");
  assert.equal(r.occupied.length / 3, 12 * 4 * 6); // a symmetric box symmetrizes to itself
  // the kept half's faces are mirrored: the lumpy +x wall is replaced by the clean -x mirror
  const plusX = r.faces.filter((f) => f.orientation === "+x");
  assert.equal(plusX.length, 1);
  assert.equal(plusX[0].meanResidualDeg, 0.5);
  // and the kept roof face mirrors across the grammar (roof-x+y → roof+x+y)
  assert.ok(r.faces.some((f) => f.orientation === "roof+x+y"));
});

test("detectSymmetry: asymmetric L-mass stays asymmetric — score recorded, nothing applied", () => {
  const cells = [...boxCells(0, 19, 0, 3, 0, 5), ...boxCells(0, 7, 0, 3, 6, 13)];
  const sample = sampleOf(cells, [20, 4, 14]);
  const r = detectSymmetry(sample, [faceStub("+y", [10, 4, 7])], SKETCH_PARAMS);
  assert.equal(r.applied, false);
  assert.equal(r.keptSide, null);
  assert.ok(r.score < SKETCH_PARAMS.symmetryConfidence, `score ${r.score}`);
  assert.ok(r.score > 0);
  assert.equal(r.occupied, sample.occupied); // pass-through, untouched
  assert.ok(r.scoreByAxis.x !== undefined && r.scoreByAxis.z !== undefined);
});

// --- footprint --------------------------------------------------------------------------------------

const planOccupied = (cells2d) => {
  const occupied = new Int32Array(cells2d.length * 3);
  cells2d.forEach(([x, z], i) => occupied.set([x, 0, z], i * 3));
  return occupied;
};

const rectCells = (x0, x1, z0, z1) => {
  const out = [];
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) out.push([x, z]);
  return out;
};

test("fitFootprint: clean rectangle → 4 vertices, exact area", () => {
  const r = fitFootprint(planOccupied(rectCells(0, 19, 0, 9)));
  assert.equal(r.isRectangle, true);
  assert.deepEqual(r.polygon, [[0, 0], [20, 0], [20, 10], [0, 10]]);
  assert.equal(r.polygonArea, 200);
  assert.equal(r.maskArea, 200);
});

test("fitFootprint: wobble jogs within the declared tolerance snap to a clean rectangle", () => {
  // 20×10 with a 1-deep × 3-wide bump and a 1-deep × 2-wide notch (tol = ceil(0.06·20) = 2)
  const cells = rectCells(0, 19, 0, 9)
    .filter(([x, z]) => !(z === 9 && x >= 5 && x <= 6)) // notch
    .concat([[10, 10], [11, 10], [12, 10]]); // bump
  const r = fitFootprint(planOccupied(cells));
  assert.equal(r.toleranceCells, 2);
  assert.equal(r.isRectangle, true, `polygon ${JSON.stringify(r.polygon)}`);
});

test("fitFootprint: diagonally-touching masses (pinch corner) chain into simple loops, no spikes", () => {
  const cells = [...rectCells(0, 9, 0, 9), ...rectCells(10, 14, 10, 14)];
  const r = fitFootprint(planOccupied(cells));
  // leftmost-turn chaining separates the pinch into two simple loops; the larger wins
  assert.deepEqual(r.polygon, [[0, 0], [10, 0], [10, 10], [0, 10]]);
  assert.equal(r.isRectangle, true);
});

test("fitFootprint: a genuine L-plan keeps its 6 corners (arms far beyond tolerance)", () => {
  const cells = [...rectCells(0, 19, 0, 9), ...rectCells(0, 7, 10, 19)];
  const r = fitFootprint(planOccupied(cells));
  assert.equal(r.isRectangle, false);
  assert.equal(r.polygon.length, 6);
  assert.equal(r.polygonArea, 200 + 80);
});

// --- proportions --------------------------------------------------------------------------------------

test("roofProfile/pitch: profile-read tilt classes from the top surface, not facet normals", () => {
  // pitch comes from the conditioned occupancy's profile (the registered meshes are stair-stepped
  // at the facet level — a normal vote reads every pitched roof as flat, the first-run failure)
  for (const [pitchDeg, expected] of [[45, "pitched45"], [60, "steep"], [25, "low"]]) {
    const sketch = buildSketch(soupToGlb(gabledPrismSoup({ pitchDeg })), PRISM_OPTS);
    assert.equal(sketch.pitch.class, expected, `pitch ${pitchDeg} → ${sketch.pitch.dominantTiltDeg}°`);
    assert.ok(Math.abs(sketch.pitch.dominantTiltDeg - pitchDeg) < 6, `tilt ${sketch.pitch.dominantTiltDeg} vs ${pitchDeg}`);
    assert.equal(sketch.pitch.ridgeAxis, "x");
  }
  const flat = buildSketch(soupToGlb(boxSoup([0, 0, 0], [12, 4, 8])), PRISM_OPTS);
  assert.equal(flat.pitch.class, "flat");
  assert.equal(pitchBucket(0), "flat");
  assert.equal(pitchBucket(50), "pitched45");
});

test("proportionsOf: profile eave/ridge; storey candidates flagged in the band", () => {
  // 12×6 body up to y=5 with a 3-wide ridge band above (y=6..7, z 2..4 — wide enough to survive
  // the median smoothing; a 1-wide band is the voxelization-spike class and is smoothed away)
  const cells = [...boxCells(0, 11, 0, 5, 0, 5), ...boxCells(0, 11, 6, 7, 2, 4)];
  const occupied = new Int32Array(cells.length * 3);
  cells.forEach((c, i) => occupied.set(c, i * 3));
  const profile = roofProfile(occupied);
  assert.equal(profile.eaveLayer, 5);
  assert.equal(profile.ridgeLayer, 7);
  assert.equal(profile.ridgeAxis, "x");
  const p = proportionsOf(occupied, [], SKETCH_PARAMS, { registryScale: 32, sampleScale: 16, profile });
  assert.equal(p.eaveLayer, 5);
  assert.equal(p.ridgeLayer, 7);
  assert.equal(p.heightCells, 8);
  assert.equal(p.eaveBlocks, 12); // 6 cells × 32/16
  const plausible = p.storeyCandidates.filter((c) => c.plausible).map((c) => c.n);
  assert.deepEqual(plausible, [2, 3, 4]); // 12/2=6, 12/3=4, 12/4=3 all in [3,6]; 12/1=12 is not
});

// --- end-to-end ---------------------------------------------------------------------------------------

const PRISM_OPTS = { subject: "synthetic", registryScale: 32, params: { ...SKETCH_PARAMS, sampleScale: 24 } };

test("buildSketch: gabled prism → symmetric, rectangular, pitched45, one mass, schema-shaped", () => {
  const glb = soupToGlb(gabledPrismSoup({ w: 12, d: 8, eave: 4, pitchDeg: 45 }));
  const sketch = buildSketch(glb, PRISM_OPTS);
  assert.equal(sketch.schema, FORM_SKETCH_SCHEMA);
  assert.equal(sketch.subject, "synthetic");
  assert.equal(sketch.params.registryScale, 32);
  assert.equal(sketch.symmetry.applied, true);
  assert.ok(sketch.symmetry.score >= 0.95);
  assert.equal(sketch.footprint.isRectangle, true);
  assert.equal(sketch.pitch.class, "pitched45");
  assert.equal(sketch.proportions.massCount, 1);
  assert.ok(sketch.faces.length >= 6); // floor + 2 walls + 2 roofs + 2 gables (post-mirror merge)
  assert.ok(sketch.proportions.eaveFrac > 0.4 && sketch.proportions.eaveFrac < 0.8);
});

test("buildSketch: tower beside a long hall → two body masses survive conditioning", () => {
  const soup = [...boxSoup([0, 0, 0], [12, 4, 6]), ...boxSoup([12, 0, 0], [5, 10, 6])];
  const glb = soupToGlb(soup);
  const sketch = buildSketch(glb, PRISM_OPTS);
  assert.equal(sketch.proportions.massCount, 2);
  const roles = sketch.proportions.masses.map((m) => m.role).sort();
  assert.deepEqual(roles, ["attached", "primary"]);
  assert.equal(sketch.footprint.isRectangle, true); // flush join → one clean rectangle overall
});

test("buildSketch: byte-deterministic across runs (the --repro contract's pure half)", () => {
  const soup = gabledPrismSoup({ w: 10, d: 6, eave: 3, pitchDeg: 50 });
  const a = JSON.stringify(buildSketch(soupToGlb(soup), PRISM_OPTS), null, 2);
  const b = JSON.stringify(buildSketch(soupToGlb(soup), PRISM_OPTS), null, 2);
  assert.equal(a, b);
});

test("buildSketch: one-side-noisy mesh — symmetry applied keeps the straighter half", () => {
  const soup = noisyBoxSoup([0, 0, 0], [12, 8, 10], { k: 6, amp: 0.25, onlyHighX: true });
  const sketch = buildSketch(soupToGlb(soup), PRISM_OPTS);
  if (sketch.symmetry.applied && sketch.symmetry.axis === "x") {
    assert.equal(sketch.symmetry.keptSide, "low");
  }
  assert.ok(sketch.symmetry.score > 0); // recorded either way — the AC's "recorded, not forced"
});
