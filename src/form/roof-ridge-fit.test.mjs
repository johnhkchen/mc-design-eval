// Unit tests for roof-ridge-fit.mjs (T-109-01, story S-109, epic E-28) — synthetic gables and
// hand-built aligned-triangle soups only (no GLB assets, no GL). The live evidence runs in the
// roof-program runner.
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  RIDGE_FIT_SCHEMA, RIDGE_FIT_DEFAULTS, ridgeFromPlanes, fitRidgeLine, ridgeVariant,
} from "./roof-ridge-fit.mjs";

/** A sane synthetic gable: ridge along x, opposing sides along z, eaves y15 at z=±8. */
function tentGable({ pitchA = 1, pitchB = 1, eaveYA = 15, eaveYB = 15, edgeA = 8, edgeB = -8, ridgeY = 24 } = {}) {
  return {
    id: "gable-a-b",
    ridge: { axis: "x", y: ridgeY },
    sides: [
      { planeId: "a", eaveDir: "+z", pitch: pitchA, eaveY: eaveYA, eaveEdge: edgeA, extentCells: [] },
      { planeId: "b", eaveDir: "-z", pitch: pitchB, eaveY: eaveYB, eaveEdge: edgeB, extentCells: [] },
    ],
    footprint: { bbox: { minX: -8, maxX: 8, minZ: -8, maxZ: 8 }, cols: new Set(), area: 0 },
    hip: { demanded: false },
    sane: true,
    reasons: [],
  };
}

/** One thin roof-band triangle whose three verts share the given x (bin) with apex y. */
function apexTri(x, y, z = 0) {
  const verts = [[x, y, z], [x, y - 1, z + 1], [x, y - 1, z - 1]];
  const centroid = [x, y - 2 / 3, z];
  return { verts, centroid, area: 1 };
}

// ---------------------------------------------------------------- ridgeFromPlanes

test("symmetric tent: intersection at the centerline, y = eave + pitch·run", () => {
  const r = ridgeFromPlanes(tentGable());
  assert.equal(r.valid, true);
  assert.equal(r.v, 0);
  assert.equal(r.y, 23); // 15 + 1·8
});

test("asymmetric pitches shift the intersection off-center", () => {
  const r = ridgeFromPlanes(tentGable({ pitchB: 2 }));
  assert.equal(r.valid, true);
  // a: y = 23 − v; b: y = 31 + 2v → v = −8/3, y = 23 + 8/3
  assert.ok(Math.abs(r.v - -8 / 3) < 1e-3, `v ${r.v}`);
  assert.ok(Math.abs(r.y - (23 + 8 / 3)) < 1e-3, `y ${r.y}`);
});

test("inverted eave edges put the intersection below the eaves — named, invalid", () => {
  const r = ridgeFromPlanes(tentGable({ edgeA: -8, edgeB: 8 }));
  assert.equal(r.valid, false);
  assert.ok(r.reasons.some((x) => /not above the eaves/.test(x)), r.reasons.join("; "));
});

test("unparameterized side is named, invalid", () => {
  const g = tentGable();
  g.sides[0].pitch = null;
  const r = ridgeFromPlanes(g);
  assert.equal(r.valid, false);
  assert.ok(r.reasons.some((x) => /unparameterized/.test(x)));
});

test("equal (non-opposing) slopes are named, invalid", () => {
  const g = tentGable();
  g.sides[1].eaveDir = "+z"; // both fall the same way → identical slope sign
  g.sides[1].eaveEdge = 8;
  const r = ridgeFromPlanes(g);
  assert.equal(r.valid, false);
  assert.ok(r.reasons.some((x) => /do not oppose/.test(x)));
});

// ---------------------------------------------------------------- fitRidgeLine

test("flat apex plateau: height/length exact, slope 0, rmse 0", () => {
  const tris = [];
  for (let x = -5; x <= 5; x++) tris.push(apexTri(x, 23));
  const r = fitRidgeLine(tentGable(), tris);
  assert.equal(r.height, 23);
  assert.equal(r.slopeDeg, 0);
  assert.deepEqual(r.span, [-5, 5]);
  assert.equal(r.length, 11);
  assert.equal(r.rmse, 0);
});

test("eave-level scraps outside the apex gap do not join the cluster", () => {
  const tris = [];
  for (let x = -5; x <= 5; x++) tris.push(apexTri(x, 23));
  for (let x = -8; x <= -6; x++) tris.push(apexTri(x, 16)); // below 23 − apexGap
  const r = fitRidgeLine(tentGable(), tris);
  assert.deepEqual(r.span, [-5, 5]);
  assert.equal(r.slices, 14); // all slices counted, cluster restricted
});

test("a sloped apex line records its direction (slopeDeg ≠ 0) with zero line rmse", () => {
  const tris = [];
  for (let x = 0; x <= 8; x++) tris.push(apexTri(x, 20 + 0.2 * x));
  const r = fitRidgeLine(tentGable(), tris);
  assert.ok(r.slopeDeg > 11 && r.slopeDeg < 11.6, `slopeDeg ${r.slopeDeg}`); // atan(0.2) ≈ 11.31°
  assert.equal(r.rmse, 0); // exact line
});

test("no roof-band triangles in the window → named reason", () => {
  const r = fitRidgeLine(tentGable(), [apexTri(0, 10)]); // below bandFloor 15
  assert.equal(r.reason, "ridge-unfitted");
});

// ------------------------------------------- fitRidgeLine: T-118-01 pollution exclusion

/** A tentGable whose footprint cols cover x∈[-8,8] × z∈[-8,8] (so col gating is active). */
function coladGable() {
  const g = tentGable();
  for (let x = -8; x <= 8; x++) for (let z = -8; z <= 8; z++) g.footprint.cols.add(`${x},${z}`);
  return g;
}

test("a chimney spike inside the footprint loses to the dominant line; the spike is recorded (the cottage case)", () => {
  const tris = [];
  for (let x = -5; x <= 5; x++) tris.push(apexTri(x, 23));
  tris.push(apexTri(2, 28, 3)); // the chimney: taller, at column (2,3)
  // the dominant-line selector rejects the 1-bin spike even without exclusion — and NAMES it
  const r = fitRidgeLine(coladGable(), tris);
  assert.equal(r.height, 23);
  assert.deepEqual(r.spike, { height: 28, span: [2, 2] });
  // recorded protrusion columns are dropped from sampling entirely (dilated by one plan cell)
  const clean = fitRidgeLine(coladGable(), tris, { exclude: new Set(["2,3"]) });
  assert.equal(clean.height, 23);
  assert.deepEqual(clean.span, [-5, 5]);
  assert.ok(clean.excludedColumns >= 1);
  assert.equal(clean.spike, undefined);
});

test("columns outside the footprint cols are not sampled (the gatehouse parapet case)", () => {
  const g = coladGable();
  // remove the z=8 column line from the footprint — the 'parapet' sits inside the bbox but
  // outside the cols, exactly the gatehouse geometry
  for (let x = -8; x <= 8; x++) g.footprint.cols.delete(`${x},8`);
  const tris = [];
  for (let x = -5; x <= 5; x++) tris.push(apexTri(x, 23));
  for (let x = -5; x <= 5; x++) tris.push(apexTri(x, 31, 8)); // parapet tops along z=8
  const r = fitRidgeLine(g, tris);
  assert.equal(r.height, 23);
});

test("empty footprint cols leave the bbox window in charge (back-compat witness)", () => {
  const tris = [];
  for (let x = -5; x <= 5; x++) tris.push(apexTri(x, 23));
  const r = fitRidgeLine(tentGable(), tris); // tentGable: cols is an empty Set
  assert.equal(r.height, 23);
  assert.equal(r.excludedColumns, 0);
});

// ---------------------------------------------------------------- ridgeVariant

test("ridgeVariant replaces the ridge height with the rounded intersection and records the delta", () => {
  const g = tentGable({ ridgeY: 24 });
  const { gables, findings } = ridgeVariant([g]);
  assert.equal(findings.length, 0);
  assert.equal(gables[0].ridge.y, 23);
  assert.equal(gables[0].ridgeIntersect.deltaVsRecord, -1);
  assert.equal(gables[0].ridgeIntersect.source, "intersect");
  assert.equal(g.ridge.y, 24); // input untouched
});

test("ridgeVariant: unfittable ridge keeps the as-built height with a named finding", () => {
  const g = tentGable();
  g.sides[0].pitch = null;
  const { gables, findings } = ridgeVariant([g]);
  assert.equal(gables[0].ridge.y, 24);
  assert.equal(gables[0].ridgeIntersect, undefined);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].code, "ridge-unfitted");
  assert.match(findings[0].detail, /as-built ridge stays/);
});

test("ridgeVariant: insane gables pass through untouched", () => {
  const g = { ...tentGable(), sane: false, reasons: ["x"] };
  const { gables, findings } = ridgeVariant([g]);
  assert.equal(gables[0], g);
  assert.equal(findings.length, 0);
});

test("schema + defaults are declared and frozen", () => {
  assert.equal(RIDGE_FIT_SCHEMA, "roof-ridge-fit/v1");
  assert.equal(RIDGE_FIT_DEFAULTS.apexGap, 1.0);
  assert.ok(Object.isFrozen(RIDGE_FIT_DEFAULTS));
});

// --- T-112-01 ---
test("ridgeVariant: hip-cap / non-2-side gables pass through unchanged, no finding", () => {
  const side = (eaveDir, eaveEdge) => ({ planeId: null, eaveDir, pitch: 1, eaveY: 10, eaveEdge });
  const cap = {
    id: "hip-cap-mass-1", kind: "hip-cap", ridge: { axis: "x", y: 13 },
    sides: [side("+x", 6), side("-x", 0), side("+z", 6), side("-z", 0)],
    footprint: { cols: new Set(), bbox: { minX: 0, maxX: 6, minZ: 0, maxZ: 6 }, area: 49 },
    hip: { demanded: false }, sane: true, reasons: [],
  };
  const { gables, findings } = ridgeVariant([cap]);
  assert.equal(gables[0], cap, "same reference — no flavor, no rewrite");
  assert.equal(findings.length, 0);
});
