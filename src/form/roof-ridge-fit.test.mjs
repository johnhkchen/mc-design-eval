// Unit tests for roof-ridge-fit.mjs (T-109-01, story S-109, epic E-28) — synthetic gables and
// hand-built aligned-triangle soups only (no GLB assets, no GL). The live evidence runs in the
// roof-program runner.
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  RIDGE_FIT_SCHEMA, RIDGE_FIT_DEFAULTS, ridgeFromPlanes, fitRidgeLine, ridgeVariant, fitRidgeProfile, closeRidge,
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

// ---------------------------------------------------------------- fitRidgeProfile (T-122-01)

/** Footprint cols over an inclusive rectangle. */
function rectCols(x0, x1, z0, z1) {
  const cols = new Set();
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) cols.add(`${x},${z}`);
  return cols;
}

/** Two triangles forming the horizontal plane y=h over an inclusive xz rectangle. */
function flatSheet(h, x0, x1, z0, z1) {
  const [a, b, c, d] = [[x0, h, z0], [x1 + 1, h, z0], [x1 + 1, h, z1 + 1], [x0, h, z1 + 1]];
  return [
    { verts: [a, b, c], centroid: [(a[0] + b[0] + c[0]) / 3, h, (a[2] + b[2] + c[2]) / 3], area: 1 },
    { verts: [a, c, d], centroid: [(a[0] + c[0] + d[0]) / 3, h, (a[2] + c[2] + d[2]) / 3], area: 1 },
  ];
}

test("fitRidgeProfile: flat sampled sheet over the footprint — height/span exact, x-axis ridge", () => {
  const g = tentGable();
  g.footprint.cols = rectCols(-5, 5, -3, 3);
  g.footprint.bbox = { minX: -5, maxX: 5, minZ: -3, maxZ: 3 };
  const r = fitRidgeProfile(g, flatSheet(20, -5, 5, -3, 3));
  assert.equal(r.height, 20);
  assert.deepEqual(r.span, [-5, 5]);
  assert.equal(r.length, 11);
  assert.equal(r.rmse, 0);
});

test("fitRidgeProfile: z-axis ridge bins along z", () => {
  const g = tentGable();
  g.ridge = { axis: "z", y: 24 };
  g.footprint.cols = rectCols(-3, 3, -5, 5);
  g.footprint.bbox = { minX: -3, maxX: 3, minZ: -5, maxZ: 5 };
  const r = fitRidgeProfile(g, flatSheet(17, -3, 3, -5, 5));
  assert.equal(r.height, 17);
  assert.deepEqual(r.span, [-5, 5]);
});

test("fitRidgeProfile: excluded protrusion columns are dropped and counted", () => {
  const g = tentGable();
  g.footprint.cols = rectCols(-5, 5, 0, 0);
  g.footprint.bbox = { minX: -5, maxX: 5, minZ: 0, maxZ: 0 };
  // a tall spike sheet over column 0,0 atop the flat 20 sheet; excluding it keeps the line at 20
  const tris = [...flatSheet(20, -5, 5, 0, 0), ...flatSheet(30, 0, 0, 0, 0)];
  const polluted = fitRidgeProfile(g, tris);
  assert.ok(polluted.spike || polluted.height > 20, "without exclusion the spike pollutes");
  const r = fitRidgeProfile(g, tris, { exclude: new Set(["0,0"]) });
  assert.equal(r.height, 20);
  assert.ok(r.excludedColumns >= 1);
});

test("fitRidgeProfile: no samples → named ridge-profile-unfitted", () => {
  const g = tentGable();
  g.footprint.cols = rectCols(-2, 2, 0, 0);
  const r = fitRidgeProfile(g, flatSheet(20, 40, 45, 40, 45)); // sheet far away
  assert.equal(r.reason, "ridge-profile-unfitted");
});

// ---------------------------------------------------------------- closeRidge (T-122-01)

/** The committed cottage cross-gable (generated/cottage/provision-fit.json, HEAD 544afca) —
 *  the −4.015-class witness: recorded fit values in, ridge cells out at the fitted height.
 *  Provenance: the committed roof-diff ridge stats mean is −4.324 (build 18 vs glb 22.445);
 *  the ticket's −4.015 headline is a rake rawDelta in T-118's before record — same defect. */
function cottageCrossGable() {
  return {
    id: "gable-roof-2-roof-3",
    ridge: { axis: "x", y: 21 },
    sides: [
      { planeId: "roof-2", eaveDir: "-z", eaveY: 14.5, eaveEdge: -9, pitch: 0.453, run: 7.833, extentCells: [] },
      { planeId: "roof-3", eaveDir: "+z", eaveY: 15, eaveEdge: 5, pitch: 0.885, run: 6.167, extentCells: [] },
    ],
    footprint: { cols: rectCols(-1, 12, -9, 5), bbox: { minX: -1, maxX: 12, minZ: -9, maxZ: 5 }, area: 14 * 15 },
    hip: { lo: false, hi: false, ridgeLo: -1, ridgeHi: 12, demanded: false },
    sane: true,
    reasons: [],
  };
}
const COTTAGE_PROFILE = { height: 22.445, span: [-1, 12], length: 14, rmse: 0, slices: 14, excludedColumns: 0 };
const COTTAGE_ANCHORS = { buildEave: 14.75, glbEave: 14.793, perSide: [], dropped: [] };

test("WITNESS: the committed cottage cross-gable builds ~4 low; closeRidge realizes the fitted height", async () => {
  const { gableSurfaceHeight } = await import("./roof-fit.mjs");
  const g = cottageCrossGable();
  const maxOver = (gg) => {
    let m = -Infinity;
    for (const k of gg.footprint.cols) {
      const [x, z] = k.split(",").map(Number);
      m = Math.max(m, gableSurfaceHeight(gg, x, z));
    }
    return m;
  };
  // the deficit, asserted: the as-committed surface never reaches 19 against a 22.445 GLB ridge
  const before = maxOver(g);
  assert.ok(before < 19, `as-committed surface tops at ${before} — the −4-class deficit`);
  // the closure
  const { gable: closed, closure } = closeRidge(g, {
    profile: COTTAGE_PROFILE, anchors: COTTAGE_ANCHORS,
    apexLine: { height: 22.792, span: [0, 9], length: 10, rmse: 0 },
  });
  assert.equal(closure.applied, true);
  assert.equal(closure.from, 21);
  assert.equal(closure.to, 22.5); // roundHalf(14.75 + 22.445 − 14.793)
  const after = maxOver(closed);
  assert.ok(Math.abs(after - COTTAGE_PROFILE.height) <= 1,
    `closed surface ${after} within ±1 of the fitted ridge ${COTTAGE_PROFILE.height}`);
  // sides re-derived through the closed ridge; fitted pitches kept as evidence
  for (const [i, s] of closed.sides.entries()) {
    assert.equal(s.pitchFitted, g.sides[i].pitch);
    assert.ok(Math.abs(s.eaveY + s.pitch * s.run - 22.5) < 0.01, `side ${s.planeId} plane passes through the ridge`);
  }
  // eaves untouched (no other region moves by construction)
  assert.deepEqual(closed.sides.map((s) => s.eaveY), [14.5, 15]);
  assert.equal(closure.apexCheck, -0.292); // vs the vertex apexLine 22.792 — within apexGap
  assert.equal(closure.apexDiverges, false);
});

test("closeRidge refusals leave the gable untouched, named (Rule 2)", () => {
  const base = cottageCrossGable();
  const cases = [
    [{ profile: { reason: "ridge-profile-unfitted", detail: "x" }, anchors: COTTAGE_ANCHORS }, /profile unfitted/],
    [{ profile: COTTAGE_PROFILE, anchors: { buildEave: null, glbEave: null, perSide: [], dropped: [] } }, /anchors unavailable/],
    [{ profile: { ...COTTAGE_PROFILE, length: 3, span: [-1, 1] }, anchors: COTTAGE_ANCHORS }, /minProfileCoverage/],
    [{ profile: { ...COTTAGE_PROFILE, height: 14.8 }, anchors: COTTAGE_ANCHORS }, /not above eave/],
  ];
  for (const [args, re] of cases) {
    const { gable, closure } = closeRidge(cottageCrossGable(), args);
    assert.equal(closure.applied, false);
    assert.deepEqual(gable, base, "refusal must not mutate the gable");
    assert.ok(closure.refusals.some((r) => re.test(r)), `${re} in ${closure.refusals.join("; ")}`);
  }
});

test("closeRidge refuses a derived pitch outside (0, maxPitch]", () => {
  const g = cottageCrossGable();
  g.sides[0].run = 1.5; // rise 8 over run 1.5 → pitch 5.333 > maxPitch 4
  const { closure } = closeRidge(g, { profile: COTTAGE_PROFILE, anchors: COTTAGE_ANCHORS });
  assert.equal(closure.applied, false);
  assert.ok(closure.refusals.some((r) => /outside \(0, 4\]/.test(r)), closure.refusals.join("; "));
});

test("closeRidge refutes a demanded hip end the profile holds to the footprint edge", () => {
  const g = cottageCrossGable();
  // the barn shape: recorded ridge stops short (blob artifact) → lo hip demanded, but the
  // sampled profile spans the full extent
  g.hip = { lo: true, hi: false, ridgeLo: 8, ridgeHi: 12, demanded: true,
    fitted: { lo: { pitch: 0.231, rmse: 0.523, triangles: 67, source: "glb" }, hi: null } };
  const { gable: closed, closure } = closeRidge(g, { profile: COTTAGE_PROFILE, anchors: COTTAGE_ANCHORS });
  assert.equal(closure.applied, true);
  assert.equal(closed.hip.lo, false);
  assert.equal(closed.hip.demanded, false);
  assert.equal(closed.hip.refuted, "ridge-profile-to-edge");
  assert.deepEqual(closure.hip.refuted, ["lo"]);
});

test("closeRidge re-anchors a surviving hip end through (ridgeEnd, closed ridge)", () => {
  const g = cottageCrossGable();
  g.hip = { lo: true, hi: false, ridgeLo: 8, ridgeHi: 12, demanded: true };
  // profile genuinely stops short of the lo edge (span starts at 6 ≫ minX+1)
  const short = { ...COTTAGE_PROFILE, span: [6, 12], length: 7 };
  const { gable: closed, closure } = closeRidge(g, { profile: short, anchors: COTTAGE_ANCHORS });
  assert.equal(closure.applied, true);
  assert.equal(closed.hip.lo, true);
  assert.equal(closed.hip.demanded, true);
  // pitch through (ridgeLo 8, 22.5) from the shared eave 14.5 at edge −1: run 9, rise 8
  assert.equal(closed.hip.fitted.lo.pitch, 0.889);
  assert.equal(closed.hip.fitted.lo.source, "ridge-closure");
  assert.deepEqual(closure.hip.reanchored, [{ end: "lo", pitch: 0.889 }]);
});

test("closeRidge names (never blocks on) a diverging vertex apexLine", () => {
  const { closure } = closeRidge(cottageCrossGable(), {
    profile: COTTAGE_PROFILE, anchors: COTTAGE_ANCHORS,
    apexLine: { height: 20.991, span: [0, 2], length: 3, rmse: 0 }, // the barn-shaped 3-bin read
  });
  assert.equal(closure.applied, true);
  assert.equal(closure.apexDiverges, true); // |22.5 − 20.991| > apexGap — recorded, not a gate
});
