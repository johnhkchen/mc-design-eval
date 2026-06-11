// Unit tests for roof-fit.mjs (T-104-01, story S-104, epic E-27) — synthetic component records
// only; the cottage/gatehouse evidence runs live in the runner (benchmarks/sculpture/roof-program.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";

import { columnRuns } from "./component-decompose.mjs";
import {
  ROOF_FIT_DEFAULTS, gablesFromRecord, evalSideHeight, programFitError, planeHeightAt, pitchVariant,
  gableEndsVariant, gableSurfaceHeight, hipEndPlanes, hipPlaneHeight, glbHeightAt, gableEaveAnchors,
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

test("footprint rows and ribs are contiguous even when the extent has notches", () => {
  const rec = gableRecord((r) => {
    // notch the +x plane's eave row (drop x=3..4 at z=3) — the gatehouse z=13 pathology
    r.roofPlanes[0].extent.runs = r.roofPlanes[0].extent.runs.filter((run) => run.z !== 3)
      .concat([{ z: 3, x0: 1, x1: 2 }]);
    return r;
  });
  const { gables } = gablesFromRecord(rec);
  const { cols } = gables[0].footprint;
  assert.ok(cols.has("3,3") && cols.has("4,3"), "row gap filled between covered extremes");
});

test("gableEndsVariant suppresses only demanded hips and records it", () => {
  const { gables } = gablesFromRecord(gableRecord());
  const plain = gableEndsVariant(gables);
  assert.equal(plain[0], gables[0], "no hip demand → gable untouched");
  const hip = [{ ...gables[0], hip: { demanded: true, lo: true, hi: false } }];
  const sup = gableEndsVariant(hip);
  assert.equal(sup[0].hip.demanded, false);
  assert.equal(sup[0].hip.suppressed, true);
  assert.equal(hip[0].hip.demanded, true, "input not mutated");
});

test("pitchVariant switches sane sides to the named source and keeps the rest", () => {
  const { gables } = gablesFromRecord(gableRecord());
  const vox = pitchVariant(gables, "voxel");
  for (const s of vox[0].sides) {
    assert.equal(s.pitchSource, "voxel");
    assert.equal(s.pitch, 1);
  }
  // original gables untouched (pure)
  assert.equal(gables[0].sides[0].pitchSource, "glb");
  // a side without a sane source value keeps its chosen pitch
  const noVox = pitchVariant([{ ...gables[0], sides: gables[0].sides.map((s) => ({ ...s, voxelPitch: null })) }], "voxel");
  assert.equal(noVox[0].sides[0].pitchSource, "glb");
});

test("determinism: two fits of the same record are deep-equal", () => {
  const a = gablesFromRecord(gableRecord());
  const b = gablesFromRecord(gableRecord());
  assert.deepEqual(
    JSON.parse(JSON.stringify(a, (k, v) => (v instanceof Set ? [...v].sort() : v))),
    JSON.parse(JSON.stringify(b, (k, v) => (v instanceof Set ? [...v].sort() : v))),
  );
});

// --- T-112-01: the single hip end-plane definition ------------------------------------------------

test("hipEndPlanes realizes the legacy hip arithmetic verbatim (golden equivalence)", () => {
  const { gables } = gablesFromRecord(gableRecord());
  const g = { ...gables[0], hip: { demanded: true, lo: true, hi: true } };
  // legacy arithmetic, restated by hand: mean side pitch, min eave, footprint-edge anchors
  const eave = Math.min(...g.sides.map((s) => s.eaveY));
  const pitch = g.sides.reduce((s, side) => s + side.pitch, 0) / g.sides.length;
  const fLo = g.footprint.bbox.minZ;
  const fHi = g.footprint.bbox.maxZ;
  for (const [x, z] of [[0, 0], [0, 1], [2, 2], [-3, 6], [0, 7], [4, 3]]) {
    const legacy = Math.min(
      g.ridge.y,
      ...g.sides.map((s) => evalSideHeight(s, g.ridge.y, x, z)),
      eave + pitch * (z - fLo),
      eave + pitch * (fHi - z),
    );
    assert.equal(gableSurfaceHeight(g, x, z), legacy, `surface @ ${x},${z}`);
  }
  const planes = hipEndPlanes(g);
  assert.deepEqual(planes.map((p) => [p.end, p.dir, p.anchor, p.pitch]),
    [["lo", "-z", fLo, pitch], ["hi", "+z", fHi, pitch]]);
});

test("hip.fitted per-end pitch overrides only its own end", () => {
  const { gables } = gablesFromRecord(gableRecord());
  const g = { ...gables[0], hip: { demanded: true, lo: true, hi: true, fitted: { lo: { pitch: 2 }, hi: null } } };
  const planes = hipEndPlanes(g);
  const mean = g.sides.reduce((s, side) => s + side.pitch, 0) / g.sides.length;
  assert.equal(planes[0].pitch, 2, "lo end takes the fitted pitch");
  assert.equal(planes[1].pitch, mean, "hi end keeps the mean-of-sides heuristic");
  // a steeper fitted lo pitch raises the surface near the lo end; the hi end is untouched
  const base = { ...g, hip: { demanded: true, lo: true, hi: true } };
  assert.ok(gableSurfaceHeight(g, 0, 1) > gableSurfaceHeight(base, 0, 1));
  assert.equal(gableSurfaceHeight(g, 0, 6), gableSurfaceHeight(base, 0, 6));
});

test("hipPlaneHeight rises from the anchor toward the interior on both ends", () => {
  const lo = { end: "lo", dir: "-z", anchor: 0, eave: 10, pitch: 1 };
  const hi = { end: "hi", dir: "+z", anchor: 7, eave: 10, pitch: 1 };
  assert.equal(hipPlaneHeight(lo, 0), 10);
  assert.equal(hipPlaneHeight(lo, 3), 13);
  assert.equal(hipPlaneHeight(hi, 7), 10);
  assert.equal(hipPlaneHeight(hi, 4), 13);
});

// --- glbHeightAt + gableEaveAnchors (T-122-01: the shared sampler/anchor seam) -------------------

test("glbHeightAt samples the barycentric surface at the column center; null off the sheet", () => {
  // plane y = x + 10 over x∈[−3,4], z∈[−4,4] (the roof-region-diff fixture, now shared here)
  const sheet = [
    { verts: [[-3, 7, -4], [4, 14, -4], [4, 14, 4]] },
    { verts: [[-3, 7, -4], [4, 14, 4], [-3, 7, 4]] },
  ];
  assert.equal(glbHeightAt(sheet, 0, 0), 10.5); // center (0.5, 0.5) → y = 0.5 + 10
  assert.equal(glbHeightAt(sheet, 2, -2), 12.5);
  assert.equal(glbHeightAt(sheet, 40, 0), null); // outside every triangle
});

test("gableEaveAnchors: per-side medians, symmetric case averages both sides", () => {
  const cols = new Set();
  for (let x = -2; x <= 2; x++) for (let z = -3; z <= 3; z++) cols.add(`${x},${z}`);
  const g = {
    ridge: { axis: "x", y: 8 },
    sides: [
      { planeId: "a", eaveDir: "+z", eaveY: 5, eaveEdge: 3, pitch: 1 },
      { planeId: "b", eaveDir: "-z", eaveY: 5, eaveEdge: -3, pitch: 1 },
    ],
    footprint: { cols, bbox: { minX: -2, maxX: 2, minZ: -3, maxZ: 3 } },
  };
  // glb height = 12 on side a's strip (z=3), 10 on side b's strip (z=−3)
  const r = gableEaveAnchors(g, (x, z) => (z === 3 ? 12 : z === -3 ? 10 : null));
  assert.equal(r.buildEave, 5);
  assert.equal(r.glbEave, 11); // mean of per-side medians (12, 10) — not a pooled median
  assert.deepEqual(r.dropped, []);
  assert.deepEqual(r.perSide.map((s) => s.samples), [5, 5]);
});

test("gableEaveAnchors: an unsampled side drops from BOTH means (symmetric coverage)", () => {
  const cols = new Set(["0,-3", "0,3", "1,-3", "1,3"]);
  const g = {
    ridge: { axis: "x", y: 8 },
    sides: [
      { planeId: "a", eaveDir: "+z", eaveY: 9, eaveEdge: 3, pitch: 1 },
      { planeId: "b", eaveDir: "-z", eaveY: 4, eaveEdge: -3, pitch: 1 },
    ],
    footprint: { cols, bbox: { minX: 0, maxX: 1, minZ: -3, maxZ: 3 } },
  };
  const r = gableEaveAnchors(g, (x, z) => (z === -3 ? 6 : null)); // only side b sampled
  assert.equal(r.buildEave, 4, "side a's declared eave must not lean on the build anchor");
  assert.equal(r.glbEave, 6);
  assert.deepEqual(r.dropped, ["a"]);
});

test("gableEaveAnchors: no samples at all → null anchors (caller refuses, named)", () => {
  const cols = new Set(["0,0"]);
  const g = {
    ridge: { axis: "x", y: 8 },
    sides: [{ planeId: "a", eaveDir: "+z", eaveY: 5, eaveEdge: 3, pitch: 1 }],
    footprint: { cols, bbox: { minX: 0, maxX: 0, minZ: 0, maxZ: 0 } },
  };
  const r = gableEaveAnchors(g, () => null);
  assert.equal(r.buildEave, null);
  assert.equal(r.glbEave, null);
  assert.deepEqual(r.dropped, ["a"]);
});
