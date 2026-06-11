// Unit tests for plane-terminate.mjs (T-109-01, story S-109, epic E-28) — synthetic towers only;
// the gatehouse/cottage evidence runs live in the runner (benchmarks/sculpture/roof-program.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";

import { occupancyFromCells } from "./occupancy.mjs";
import { voxelSilhouettes, regularizeShell } from "./shell-regularize.mjs";
import { MULTI_ANGLE_GATE } from "../config.mjs";
import { unconsumedPlanes, terminatePlane, terminationSteps } from "./plane-terminate.mjs";

/** A level synthetic plane record over x∈[0,5] z∈[0,5] at y≈12 (with a plan notch at z=5). */
function flatPlane({ maxResidual = 1.4, kind = "flat", id = "roof-flat" } = {}) {
  const runs = [];
  for (let z = 0; z <= 4; z++) runs.push({ z, x0: 0, x1: 5 });
  runs.push({ z: 5, x0: 0, x1: 1 }, { z: 5, x0: 4, x1: 5 }); // notch x2..3 — fillBetween closes it
  return {
    id, kind, massId: "mass-0",
    voxelFit: { gradient: [0, 0], point: [0, 12, 0], rmse: 0.3, maxResidual, degenerate: false },
    extent: { runs, bbox: { minX: 0, maxX: 5, minZ: 0, maxZ: 5 }, area: 34 },
  };
}

/** Tower x∈[0,5] z∈[0,5], solid y0..12, with bumps/dips per the `tops` override map. */
function tower(tops = {}) {
  const cells = [];
  for (let x = 0; x <= 5; x++) for (let z = 0; z <= 5; z++) {
    const top = tops[`${x},${z}`] ?? 12;
    for (let y = 0; y <= top; y++) cells.push({ pos: [x, y, z], block: "stone_bricks" });
  }
  return cells;
}

const refsOf = (occ) => voxelSilhouettes(occ, MULTI_ANGLE_GATE.azimuths);

test("flat termination: bumps trimmed, shallow dips filled, deep wells counted not filled", () => {
  const occ = occupancyFromCells(tower({ "1,1": 14, "2,2": 11, "3,3": 9 }));
  const r = terminatePlane(occ, flatPlane());
  assert.equal(r.removedCells, 2, "the y13/y14 bump cells go");
  assert.ok(!r.occ.cells.has("1,13,1") && !r.occ.cells.has("1,14,1"));
  assert.ok(r.occ.cells.has("2,12,2"), "deficit 1 ≤ ceil(maxResidual)=2 → filled to the plane");
  assert.equal(r.occ.cells.get("2,12,2"), "stone_bricks", "fill takes the majority neighbor block");
  assert.ok(!r.occ.cells.has("3,12,3"), "deficit 3 > 2 — not this surface");
  assert.equal(r.skipped.deepColumns, 1);
  assert.equal(r.target.fillBound, 2);
});

test("the plan notch is closed by fillBetween — the edge line is straight by construction", () => {
  const occ = occupancyFromCells(tower({ "2,5": 11, "3,5": 11 })); // the notch columns sit low
  const r = terminatePlane(occ, flatPlane());
  assert.ok(r.occ.cells.has("2,12,5") && r.occ.cells.has("3,12,5"), "notch columns clamp to the plane");
});

test("pitched fragments trim only — no mass added on a weak fit's word", () => {
  const occ = occupancyFromCells(tower({ "1,1": 14, "2,2": 10 }));
  const r = terminatePlane(occ, flatPlane({ kind: "pitched", id: "roof-frag" }));
  assert.equal(r.removedCells, 2);
  assert.equal(r.addedCells, 0);
  assert.ok(!r.occ.cells.has("2,11,2"), "the dip stays — trim-only");
  assert.equal(r.target.fillBound, null);
});

test("protected cells and fixtures pass through; excluded columns are skipped and counted", () => {
  const cells = tower({ "1,1": 14, "4,4": 14 });
  cells.push({ pos: [2, 13, 2], block: "spruce_trapdoor", form: "fixture", state: { half: "top" } });
  const occ = occupancyFromCells(cells);
  const protect = [{ name: "stack", contains: ([x, , z]) => x === 4 && z === 4 }];
  const r = terminatePlane(occ, flatPlane(), { protect, excludeCols: new Set(["1,1"]) });
  assert.ok(occ.cells.has("4,13,4") && r.occ.cells.has("4,13,4"), "protected bump survives");
  assert.ok(r.occ.cells.has("1,14,1"), "excluded column untouched");
  assert.equal(r.skipped.excluded, 1);
  assert.ok(r.occ.forms.get("2,13,2") === "fixture", "fixtures are dressing — never clamped");
  assert.equal(r.removedCells, 0);
});

test("no-op input returns the SAME occupancy (identity, not a copy)", () => {
  const occ = occupancyFromCells(tower());
  const r = terminatePlane(occ, flatPlane());
  assert.equal(r.occ, occ);
  assert.equal(r.removedCells + r.addedCells, 0);
});

test("unconsumedPlanes: consumed sides drop; flat leads, then area desc — deterministic", () => {
  const record = { roofPlanes: [
    { id: "roof-0", kind: "pitched", extent: { area: 200 } },
    { id: "roof-2", kind: "flat", extent: { area: 151 } },
    { id: "roof-3", kind: "pitched", extent: { area: 28 } },
    { id: "roof-5", kind: "pitched", extent: { area: 28 } },
  ] };
  const out = unconsumedPlanes(record, new Set(["roof-0"]));
  assert.deepEqual(out.map((p) => p.plane.id), ["roof-2", "roof-3", "roof-5"]);
});

test("cage integration: a good termination is accepted by regularizeShell's step seam", () => {
  const bumpy = occupancyFromCells(tower({ "1,1": 14, "2,2": 11, "4,3": 13 }));
  const ideal = occupancyFromCells(tower());
  const steps = terminationSteps([{ plane: flatPlane() }]);
  const r = regularizeShell(bumpy, { refSils: refsOf(ideal), steps });
  assert.equal(r.trace.length, 1);
  assert.equal(r.trace[0].step, "terminate:roof-flat");
  assert.equal(r.trace[0].accepted, true, r.trace[0].reasons.join("; "));
  assert.ok(!r.occ.cells.has("1,14,1") && !r.occ.cells.has("4,13,3"));
  assert.ok(r.occ.cells.has("2,12,2"));
});

test("cage integration: a termination that regresses the silhouette rolls back, named", () => {
  const bumpy = occupancyFromCells(tower({ "1,1": 14, "2,2": 11 }));
  // the reference IS the bumpy shell; tolerance 0 — any clamp regresses and must roll back
  const steps = terminationSteps([{ plane: flatPlane() }]);
  const r = regularizeShell(bumpy, { refSils: refsOf(bumpy), iouTolerance: 0, steps });
  assert.equal(r.trace[0].accepted, false);
  assert.ok(r.trace[0].reasons.length > 0);
  assert.deepEqual([...r.occ.cells.keys()].sort(), [...bumpy.cells.keys()].sort(), "rollback");
});
