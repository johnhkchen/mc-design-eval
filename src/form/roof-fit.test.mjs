// Unit tests for roof-fit.mjs (T-104-01, story S-104, epic E-27) — synthetic component records
// only; the cottage/gatehouse evidence runs live in the runner (benchmarks/sculpture/roof-program.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";

import { columnRuns } from "./component-decompose.mjs";
import {
  ROOF_FIT_DEFAULTS, gablesFromRecord, evalSideHeight, programFitError, planeHeightAt,
} from "./roof-fit.mjs";

/** Row runs over an inclusive plan rectangle. */
function rectRuns(x0, x1, z0, z1) {
  const cells = [];
  for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) cells.push([x, z]);
  return columnRuns(cells);
}

/** A plane-fit object for `y = a·x + b·z + c` expressed via gradient + a point on the plane. */
function fitOf(a, b, c, extras = {}) {
  return { normal: [0, 1, 0], point: [0, c, 0], gradient: [a, b], rmse: 0.1, rmseRaw: 0.1, maxResidual: 0.3, degenerate: false, ...extras };
}

/**
 * A symmetric synthetic gable record: ridge along z at x=0 (y=14), two pitched planes draining to
 * +x and −x with |pitch| 1, eaves at y=10 on x=±4, footprint x −4..4 × z 0..7. `mut` lets a test
 * perturb the record before fitting.
 */
function gableRecord(mut = (r) => r) {
  const east = { // drains toward +x: height falls as x grows → a = −1
    id: "roof-0", massId: "mass-0", kind: "pitched",
    voxelFit: fitOf(-1, 0, 14),
    extent: { runs: rectRuns(1, 4, 0, 7), bbox: { minX: 1, maxX: 4, minZ: 0, maxZ: 7 }, area: 32 },
    eave: { cells: rectRuns(4, 4, 0, 7), dir: "+x" },
    ridge: { withPlane: "roof-1", axis: "z", y: 14, cells: rectRuns(0, 0, 0, 7) },
    glbFit: { ...fitOf(-1.05, 0, 14), triangles: 40, areaSupport: 0.2, angleToVoxelDeg: 2.0, offsetDelta: 0.2 },
  };
  const west = {
    id: "roof-1", massId: "mass-0", kind: "pitched",
    voxelFit: fitOf(1, 0, 14),
    extent: { runs: rectRuns(-4, -1, 0, 7), bbox: { minX: -4, maxX: -1, minZ: 0, maxZ: 7 }, area: 32 },
    eave: { cells: rectRuns(-4, -4, 0, 7), dir: "-x" },
    ridge: { withPlane: "roof-0", axis: "z", y: 14, cells: rectRuns(0, 0, 0, 7) },
    glbFit: { ...fitOf(0.95, 0, 14), triangles: 40, areaSupport: 0.2, angleToVoxelDeg: 2.5, offsetDelta: 0.1 },
  };
  return mut({
    schema: "component-record/v1",
    subject: "synthetic",
    roofPlanes: [east, west],
    wallSlabs: [
      { id: "mass-0-wall-+x", massId: "mass-0", dir: "+x", axis: "x", value: 3, coverage: 0.9 },
      { id: "mass-0-wall--x", massId: "mass-0", dir: "-x", axis: "x", value: -3, coverage: 0.9 },
    ],
    masses: [{ id: "mass-0", role: "primary" }],
    findings: [],
  });
}

test("planeHeightAt recovers the plane from gradient + point", () => {
  const fit = fitOf(-1, 0.5, 14);
  assert.equal(planeHeightAt(fit, 0, 0), 14);
  assert.equal(planeHeightAt(fit, 4, 0), 10);
  assert.equal(planeHeightAt(fit, 0, 2), 15);
});

test("agreeing glb fit wins the pitch; positions stay voxel-anchored", () => {
  const { gables, findings } = gablesFromRecord(gableRecord());
  assert.equal(gables.length, 1);
  const g = gables[0];
  assert.equal(g.sane, true, g.reasons.join("; "));
  assert.deepEqual(g.ridge, { axis: "z", y: 14 });
  const east = g.sides.find((s) => s.eaveDir === "+x");
  assert.equal(east.pitchSource, "glb");
  assert.equal(east.pitch, 1.05);          // glb gradient, sign-resolved toward the eave
  assert.equal(east.eaveY, 10);            // voxel plane at the eave cells (x=4): 14−4
  assert.equal(east.eaveEdge, 4);
  assert.equal(east.overhang, 1);          // eave edge 4 vs wall slab at x=3
  assert.equal(findings.filter((f) => f.code === "fit-source-voxel").length, 0);
});

test("disagreeing glb fit falls back to voxel with a named finding", () => {
  const rec = gableRecord((r) => {
    r.roofPlanes[0].glbFit.angleToVoxelDeg = 22; // > pitchAgreeDeg
    return r;
  });
  const { gables, findings } = gablesFromRecord(rec);
  const east = gables[0].sides.find((s) => s.eaveDir === "+x");
  assert.equal(east.pitchSource, "voxel");
  assert.equal(east.pitch, 1);
  const f = findings.find((x) => x.code === "fit-source-voxel" && x.where === "roof-0");
  assert.ok(f, "fit-source-voxel finding named");
  assert.match(f.detail, /disagrees/);
});

test("missing glb fit falls back to voxel with a named finding", () => {
  const rec = gableRecord((r) => {
    r.roofPlanes[1].glbFit = null;
    return r;
  });
  const { gables, findings } = gablesFromRecord(rec);
  const west = gables[0].sides.find((s) => s.eaveDir === "-x");
  assert.equal(west.pitchSource, "voxel");
  assert.ok(findings.some((f) => f.code === "fit-source-voxel" && f.where === "roof-1" && /missing/.test(f.detail)));
});

test("insane glb pitch (wild gradient) is rejected even when the angle agrees", () => {
  const rec = gableRecord((r) => {
    r.roofPlanes[0].glbFit.gradient = [-7.5, 0]; // the committed cottage roof-4 pathology
    r.roofPlanes[0].glbFit.angleToVoxelDeg = 10;
    return r;
  });
  const { gables } = gablesFromRecord(rec);
  const east = gables[0].sides.find((s) => s.eaveDir === "+x");
  assert.equal(east.pitchSource, "voxel");
  assert.equal(east.pitch, 1);
});

test("missing wall slab → overhang null + overhang-unmeasured finding", () => {
  const rec = gableRecord((r) => {
    r.wallSlabs = r.wallSlabs.filter((s) => s.dir !== "+x");
    return r;
  });
  const { gables, findings } = gablesFromRecord(rec);
  const east = gables[0].sides.find((s) => s.eaveDir === "+x");
  assert.equal(east.overhang, null);
  assert.ok(findings.some((f) => f.code === "overhang-unmeasured" && f.where === "roof-0"));
  assert.equal(gables[0].sane, true, "overhang is reported, not gating");
});

test("ridge below the eaves → gable insane, named, not generated", () => {
  const rec = gableRecord((r) => {
    for (const p of r.roofPlanes) p.ridge.y = 9; // below eaveY 10
    return r;
  });
  const { gables, findings } = gablesFromRecord(rec);
  assert.equal(gables[0].sane, false);
  assert.ok(gables[0].reasons.some((x) => /not above eave/.test(x)));
  assert.ok(findings.some((f) => f.code === "gable-insane"));
});

test("flat and unpaired planes are named roof-region-unfitted", () => {
  const rec = gableRecord((r) => {
    r.roofPlanes.push({
      id: "roof-2", massId: "mass-0", kind: "flat",
      voxelFit: fitOf(0, 0, 11),
      extent: { runs: rectRuns(5, 7, 0, 3), bbox: { minX: 5, maxX: 7, minZ: 0, maxZ: 3 }, area: 12 },
      eave: { cells: [], dir: null }, ridge: null, glbFit: null,
    });
    r.roofPlanes.push({
      id: "roof-3", massId: "mass-0", kind: "pitched",
      voxelFit: fitOf(0.4, 0.7, 12),
      extent: { runs: rectRuns(5, 6, 5, 7), bbox: { minX: 5, maxX: 6, minZ: 5, maxZ: 7 }, area: 6 },
      eave: { cells: rectRuns(6, 6, 5, 7), dir: "+x" }, ridge: null, glbFit: null,
    });
    return r;
  });
  const { gables, findings } = gablesFromRecord(rec);
  assert.equal(gables.length, 1);
  const unfitted = findings.filter((f) => f.code === "roof-region-unfitted").map((f) => f.where);
  assert.deepEqual(unfitted.sort(), ["roof-2", "roof-3"]);
});

test("non-reciprocal ridge pair is a named finding, not a gable", () => {
  const rec = gableRecord((r) => {
    r.roofPlanes[1].ridge.withPlane = "roof-9";
    return r;
  });
  const { gables, findings } = gablesFromRecord(rec);
  assert.equal(gables.length, 0);
  assert.equal(findings.filter((f) => f.code === "roof-region-unfitted").length, 2);
});

test("hip demand detected when the footprint outruns the ridge ends", () => {
  const rec = gableRecord((r) => {
    for (const p of r.roofPlanes) p.ridge.cells = rectRuns(0, 0, 2, 5); // ridge z 2..5, footprint z 0..7
    return r;
  });
  const { gables } = gablesFromRecord(rec);
  assert.equal(gables[0].hip.demanded, true);
  assert.equal(gables[0].hip.lo, true);
  assert.equal(gables[0].hip.hi, true);
  // and the full-length ridge of the base record reads as a plain gable
  assert.equal(gablesFromRecord(gableRecord()).gables[0].hip.demanded, false);
});

test("evalSideHeight: eave line rising at pitch, capped at the ridge", () => {
  const g = gablesFromRecord(gableRecord()).gables[0];
  const east = g.sides.find((s) => s.eaveDir === "+x");
  assert.equal(evalSideHeight(east, g.ridge.y, 4, 0), 10);      // at the eave
  assert.equal(evalSideHeight(east, g.ridge.y, 2, 3), 12.1);    // 10 + 1.05·2
  assert.equal(evalSideHeight(east, g.ridge.y, 0, 7), 14);      // capped at ridge (10 + 4.2 > 14)
});

test("programFitError measures generated heights against the chosen planes", () => {
  const g = gablesFromRecord(gableRecord()).gables[0];
  const heights = new Map();
  for (const side of g.sides) {
    for (const [x, z] of side.extentCells) {
      heights.set(`${x},${z}`, Math.round(evalSideHeight(side, g.ridge.y, x, z) * 2) / 2);
    }
  }
  const err = programFitError(g, heights);
  assert.ok(err.rmse !== null && err.rmse <= ROOF_FIT_DEFAULTS.programRmseTol, `rmse ${err.rmse}`);
  assert.equal(err.perSide.length, 2);
  // a flagrantly wrong surface fails the declared tolerance
  const flat = new Map([...heights.keys()].map((k) => [k, 10]));
  assert.ok(programFitError(g, flat).rmse > ROOF_FIT_DEFAULTS.programRmseTol);
});

test("determinism: two fits of the same record are deep-equal", () => {
  const a = gablesFromRecord(gableRecord());
  const b = gablesFromRecord(gableRecord());
  assert.deepEqual(
    JSON.parse(JSON.stringify(a, (k, v) => (v instanceof Set ? [...v].sort() : v))),
    JSON.parse(JSON.stringify(b, (k, v) => (v instanceof Set ? [...v].sort() : v))),
  );
});
