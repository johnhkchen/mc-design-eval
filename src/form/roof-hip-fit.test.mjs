// Unit tests for roof-hip-fit.mjs (T-112-01, story S-112, epic E-29) — synthetic specs only;
// the church tower evidence runs live in the runner (benchmarks/sculpture/roof-program.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";

import { occupancyFromCells } from "../view/occupancy.mjs";
import { columnRuns } from "./component-decompose.mjs";
import { alignedTriangles } from "./roof-end-fit.mjs";
import { HIP_FIT_DEFAULTS, capFootprint, fitHipCap, fitHipEnds } from "./roof-hip-fit.mjs";

const IDENTITY = { mode: "test-identity", scales: [1, 1, 1], toVoxel: (p) => [...p] };

/** A quad as two triangles (counter-clockwise as given); returns 18 floats. */
function quad(p0, p1, p2, p3) {
  return [...p0, ...p1, ...p2, ...p0, ...p2, ...p3];
}

function trisOf(...quadFloats) {
  const positions = Float64Array.from(quadFloats.flat());
  return alignedTriangles({ positions, triangleCount: positions.length / 9 }, IDENTITY);
}

/** One sloped face quad of a cap over plan x0..x1 × z0..z1 at band y, with upward normal
 *  pointing OUT the given direction at the given pitch (n ∝ (dir·pitch, 1) on the face axis). */
function faceQuad(dir, pitch, { x0 = 0, x1 = 6, z0 = 0, z1 = 6, y = 10 } = {}) {
  const mk = (edge, inner, horiz) => {
    // p0/p1 on the eave edge, p3/p2 one cell inward and `pitch` higher — wound for +y normals
    const [h0, h1] = horiz;
    const p = (a, b, yy) => (dir[1] === "x" ? [a, yy, b] : [b, yy, a]);
    return quad(p(edge, h0, y), p(inner, h0, y + pitch), p(inner, h1, y + pitch), p(edge, h1, y));
  };
  if (dir === "+x") return mk(x1, x1 - 1, [z0, z1]);
  if (dir === "-x") return mk(x0, x0 + 1, [z1, z0]);
  if (dir === "+z") return mk(z1, z1 - 1, [x1, x0]);
  return mk(z0, z0 + 1, [x0, x1]);
}

/** A solid tower shell x0..x1 × z0..z1 up to `wallTop`, plus a blob cap rising to `capTop`. */
function towerOcc({ x0 = 0, x1 = 6, z0 = 0, z1 = 6, wallTop = 10, capTop = 13 } = {}) {
  const cells = [];
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    for (let y = 0; y <= wallTop; y++) cells.push({ pos: [x, y, z], block: "stone" });
  }
  const cx = Math.round((x0 + x1) / 2);
  const cz = Math.round((z0 + z1) / 2);
  for (let y = wallTop + 1; y <= capTop; y++) cells.push({ pos: [cx, y, cz], block: "stone" }); // blob cap
  return occupancyFromCells(cells);
}

/** A component record with one mass owning the tower plan. */
function recordOf({ x0 = 0, x1 = 6, z0 = 0, z1 = 6 } = {}) {
  const cells = [];
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) cells.push([x, z]);
  return {
    schema: "component-record/v1",
    masses: [{ id: "mass-1", role: "attached", plan: { runs: columnRuns(cells) } }],
  };
}

/** The refused ridge-pair gable of the tower group: one recorded +z side, one unparameterized. */
function towerGables(mut = (g) => g) {
  return [mut({
    id: "gable-roof-14-roof-15",
    ridge: { axis: "x", y: 13 },
    sides: [
      { planeId: "roof-14", eaveDir: "+z", pitch: 1, pitchSource: "voxel", voxelPitch: 1, glbPitch: null,
        glbAngleDeg: 16.4, eaveY: 10, eaveEdge: 6, extentCells: [[3, 5], [3, 6]], reasons: [] },
      { planeId: "roof-15", eaveDir: "-z", pitch: null, pitchSource: null, voxelPitch: 19, glbPitch: 189,
        glbAngleDeg: 10.9, eaveY: 4, eaveEdge: 0, extentCells: [], reasons: ["no sane pitch"] },
    ],
    footprint: { cols: new Set(), bbox: { minX: 0, maxX: 6, minZ: 0, maxZ: 6 }, area: 49 },
    hip: { demanded: false },
    sane: false,
    reasons: ["no sane pitch (voxel 19, glb 189)"],
  })];
}

const allFaces = (pitch, dims) =>
  trisOf(faceQuad("+x", pitch, dims), faceQuad("-x", pitch, dims),
    faceQuad("+z", pitch, dims), faceQuad("-z", pitch, dims));

test("faceQuad authors upward normals pointing out each face at the requested pitch", () => {
  for (const dir of ["+x", "-x", "+z", "-z"]) {
    const [t] = trisOf(faceQuad(dir, 1));
    const idx = dir[1] === "x" ? 0 : 2;
    const sign = dir.startsWith("+") ? 1 : -1;
    assert.ok(t.normal[1] > 0, `${dir}: upward`);
    assert.ok(Math.abs((t.normal[idx] * sign) / t.normal[1] - 1) < 1e-9, `${dir}: pitch 1`);
  }
});

test("capFootprint: band-floor cross-section within the plan, contiguous, with the as-built top", () => {
  const occ = towerOcc();
  const planCols = new Set();
  for (let x = 0; x <= 6; x++) for (let z = 0; z <= 6; z++) planCols.add(`${x},${z}`);
  const { cols, bbox, massTop } = capFootprint(occ, planCols, 10);
  assert.equal(cols.size, 49);
  assert.deepEqual(bbox, { minX: 0, maxX: 6, minZ: 0, maxZ: 6 });
  assert.equal(massTop, 13); // the blob cap is the as-built top
});

test("square pyramid: four faces fit, recorded side wins its face, apex constructed at center", () => {
  const { gable, findings } = fitHipCap({
    record: recordOf(), massId: "mass-1", gables: towerGables(), occ: towerOcc(), tris: allFaces(1),
  });
  assert.ok(gable, `cap fitted (findings: ${JSON.stringify(findings)})`);
  assert.equal(gable.kind, "hip-cap");
  assert.equal(gable.sane, true);
  assert.equal(gable.sides.length, 4);
  assert.equal(gable.ridge.y, 13); // eave 10 + pitch 1 · half-extent 3
  const byDir = Object.fromEntries(gable.sides.map((s) => [s.eaveDir, s]));
  assert.equal(byDir["+z"].pitchSource, "voxel");   // the recorded roof-14 pitch
  assert.equal(byDir["+z"].planeId, "roof-14");
  assert.equal(byDir["-z"].pitchSource, "glb-quadrant"); // roof-15 was unparameterized
  assert.equal(byDir["-z"].planeId, "roof-15");
  assert.equal(byDir["+x"].planeId, null);          // synthetic face — no recorded plane
  assert.equal(byDir["+x"].pitch, 1);
  assert.deepEqual([byDir["+x"].eaveEdge, byDir["-x"].eaveEdge], [6, 0]);
  assert.equal(gable.capFit.apex.constructedY, 13);
  assert.equal(gable.capFit.eaveY, 10);
  assert.equal(gable.footprint.area, 49);
});

test("the spurious low eave candidate is never reached when the high one fits", () => {
  const { gable, findings } = fitHipCap({
    record: recordOf(), massId: "mass-1", gables: towerGables(), occ: towerOcc(), tris: allFaces(1),
  });
  assert.equal(gable.capFit.bandFloor, 10); // tried 10 before 4 (descending)
  assert.ok(!findings.some((f) => f.code === "hip-cap-candidate-refused"));
});

test("an unfittable high candidate refuses NAMED and the fit walks down the eave ladder", () => {
  const gables = towerGables((g) => ({
    ...g,
    sides: [{ ...g.sides[0], eaveY: 12 }, { ...g.sides[1], eaveY: 10 }],
  }));
  // y=12 has only the 1-column blob → x/z half-extents 0 → refused; y=10 fits
  const { gable, findings } = fitHipCap({
    record: recordOf(), massId: "mass-1", gables, occ: towerOcc(), tris: allFaces(1),
  });
  assert.ok(gable);
  assert.equal(gable.capFit.bandFloor, 10);
  const refused = findings.find((f) => f.code === "hip-cap-candidate-refused");
  assert.ok(refused && /@ eave 12/.test(refused.where));
});

test("a face with neither recorded nor GLB pitch refuses the cap, named per face", () => {
  const noMinusX = trisOf(faceQuad("+x", 1), faceQuad("+z", 1), faceQuad("-z", 1));
  const { gable, findings } = fitHipCap({
    record: recordOf(), massId: "mass-1", gables: towerGables(), occ: towerOcc(), tris: noMinusX,
  });
  assert.equal(gable, null);
  assert.ok(findings.some((f) => f.code === "hip-cap-candidate-refused" && /face -x unfittable/.test(f.detail)));
  assert.ok(findings.some((f) => f.code === "hip-cap-unfitted" && f.where === "mass-1"));
});

test("a footprint too thin for minRun on either axis is refused", () => {
  const dims = { x0: 0, x1: 6, z0: 0, z1: 2 }; // z half-extent 1 < minRun 2
  const { gable, findings } = fitHipCap({
    record: recordOf(dims), massId: "mass-1",
    gables: towerGables((g) => ({ ...g, sides: g.sides.map((s) => ({ ...s, eaveY: 10 })) })),
    occ: towerOcc(dims), tris: allFaces(1, dims),
  });
  assert.equal(gable, null);
  assert.ok(findings.some((f) => /z half-extent 1 < minRun/.test(f.detail)));
});

test("a constructed apex far above the as-built top is refused (no invented height)", () => {
  const occ = towerOcc({ capTop: 10 }); // flat top: massTop 10, apex would be 13 > 10 + slack 1
  const gables = towerGables((g) => ({ ...g, sides: [g.sides[0]] })); // single eave candidate (10)
  const { gable, findings } = fitHipCap({
    record: recordOf(), massId: "mass-1", gables, occ, tris: allFaces(1),
  });
  assert.equal(gable, null);
  assert.ok(findings.some((f) => /exceeds the as-built mass top 10/.test(f.detail)));
  assert.ok(findings.some((f) => f.code === "hip-cap-unfitted"));
});

test("elongated mass: an emergent ridge along the long axis, still a sane 4-face fit", () => {
  const dims = { x0: 0, x1: 10, z0: 0, z1: 6 };
  const occ = towerOcc({ ...dims, capTop: 13 });
  const { gable } = fitHipCap({
    record: recordOf(dims), massId: "mass-1",
    gables: towerGables((g) => ({ ...g, sides: g.sides.map((s) => ({ ...s, eaveY: 10, eaveEdge: s.eaveDir === "+z" ? 6 : 0 })) })),
    occ, tris: allFaces(1, dims),
  });
  assert.ok(gable);
  assert.equal(gable.ridge.axis, "x"); // the long axis
  assert.equal(gable.ridge.y, 13);     // limited by the z half-extent 3, not the x half-extent 5
});

test("GLB apex is recorded as evidence, never applied", () => {
  const { gable } = fitHipCap({
    record: recordOf(), massId: "mass-1", gables: towerGables(), occ: towerOcc(), tris: allFaces(1),
  });
  assert.equal(typeof gable.capFit.apex.glbMaxY, "number");
  assert.equal(gable.ridge.y, gable.capFit.apex.constructedY); // ridge is the CONSTRUCTED apex
});

test("determinism: two cap fits of the same inputs are deep-equal", () => {
  const run = () => fitHipCap({
    record: recordOf(), massId: "mass-1", gables: towerGables(), occ: towerOcc(), tris: allFaces(1),
  });
  const norm = (r) => JSON.parse(JSON.stringify(r, (k, v) => (v instanceof Set ? [...v].sort() : v)));
  assert.deepEqual(norm(run()), norm(run()));
});

// --- fitHipEnds ----------------------------------------------------------------------------------

/** A sane hip-demanded gable, ridge along z, hip triangles between ridge ends and footprint. */
function hipGable(mut = (g) => g) {
  return mut({
    id: "gable-roof-0-roof-1",
    ridge: { axis: "z", y: 14 },
    sides: [
      { planeId: "roof-0", eaveDir: "+x", eaveY: 10, pitch: 1 },
      { planeId: "roof-1", eaveDir: "-x", eaveY: 10, pitch: 1 },
    ],
    footprint: { cols: new Set(), bbox: { minX: -4, maxX: 4, minZ: 0, maxZ: 9 }, area: 90 },
    hip: { demanded: true, lo: true, hi: true, ridgeLo: 3, ridgeHi: 6 },
    sane: true,
    reasons: [],
  });
}

/** An end slope quad at the hi (+z) end of hipGable with the given pitch. */
const hiEndSlope = (pitch) => faceQuad("+z", pitch, { x0: -4, x1: 4, z0: 0, z1: 9, y: 10 });
const loEndSlope = (pitch) => faceQuad("-z", pitch, { x0: -4, x1: 4, z0: 0, z1: 9, y: 10 });

test("hip ends fit per end from the GLB; an absent end is named and keeps the heuristic", () => {
  const { gables, findings } = fitHipEnds([hipGable()], trisOf(hiEndSlope(1.5)));
  const g = gables[0];
  assert.equal(g.hip.fitted.hi.pitch, 1.5);
  assert.equal(g.hip.fitted.hi.source, "glb");
  assert.equal(g.hip.fitted.lo, null);
  assert.ok(findings.some((f) => f.code === "hip-end-unfitted" && f.where === "gable-roof-0-roof-1:lo"));
  assert.equal(hipGable().hip.fitted, undefined, "input untouched");
});

test("both hip ends fit when both slopes exist", () => {
  const { gables, findings } = fitHipEnds([hipGable()], trisOf(hiEndSlope(1.5), loEndSlope(2)));
  assert.equal(gables[0].hip.fitted.hi.pitch, 1.5);
  assert.equal(gables[0].hip.fitted.lo.pitch, 2);
  assert.equal(findings.length, 0);
});

test("an insane GLB end slope (pitch > maxPitch) is refused named", () => {
  const { gables, findings } = fitHipEnds([hipGable()], trisOf(hiEndSlope(10)));
  assert.equal(gables[0], hipGable((g) => g).id === gables[0].id ? gables[0] : null, "sanity");
  assert.equal(gables[0].hip.fitted, undefined, "nothing fitted → gable passes through");
  assert.equal(findings.filter((f) => f.code === "hip-end-unfitted").length, 2);
});

test("side slopes in the end window do not pollute the end fit", () => {
  // a +x side slope overlapping the hi window: dominant normal is x → excluded from the z end
  const sideSlope = faceQuad("+x", 1, { x0: -4, x1: 4, z0: 5, z1: 9, y: 10 });
  const { gables } = fitHipEnds([hipGable()], trisOf(hiEndSlope(1.5), sideSlope));
  assert.equal(gables[0].hip.fitted.hi.pitch, 1.5);
});

test("non-hip and insane gables pass through by reference", () => {
  const plain = hipGable((g) => ({ ...g, hip: { demanded: false } }));
  const insane = hipGable((g) => ({ ...g, sane: false }));
  const { gables } = fitHipEnds([plain, insane], trisOf(hiEndSlope(1.5)));
  assert.equal(gables[0], plain);
  assert.equal(gables[1], insane);
});

test("declared defaults are frozen and named", () => {
  assert.equal(HIP_FIT_DEFAULTS.minTriangles, 1);
  assert.equal(HIP_FIT_DEFAULTS.apexSlack, 1.0);
  assert.ok(Object.isFrozen(HIP_FIT_DEFAULTS));
});
