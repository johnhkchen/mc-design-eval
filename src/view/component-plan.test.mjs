// Unit tests — component consumption plan (T-106-01). The AC's per-seam pairs: each seam tested
// with a component definition AGAINST the occupancy fallback on the same synthetic geometry —
// equality on clean geometry (the definitions describe the same building), divergence under noise
// (the occupancy read follows the noise, the definition doesn't: the ticket's prediction in
// miniature). Plus the plan assembly: named findings per absent record, pin-mismatch THROWS.

import test from "node:test";
import assert from "node:assert/strict";

import { occupancyFromCells } from "./occupancy.mjs";
import { frameLines } from "./frame-lines.mjs";
import { surfaceZoneHistogram } from "./zone-fill.mjs";
import { occupancyDelta } from "./reconstruct-compose.mjs";
import {
  COMPONENT_PLAN_SCHEMA, roofPlanFromRecord, programConformance, cornerColumnsFromSlabs,
  roofFootprintFromRecord, frameLinesFromComponent, wallFacePredicate, splitZoneOf, planCensusZoneOf,
  buildComponentPlan,
} from "./component-plan.mjs";

// --- fixture: a hollow 8×6 box (x∈[0,7], z∈[0,5]), walls y∈[0,5], flat roof slab at y=6 ----------

function box({ extras = [] } = {}) {
  const cells = [];
  const roofKeys = new Set();
  for (let x = 0; x <= 7; x++) {
    for (let z = 0; z <= 5; z++) {
      const wall = x === 0 || x === 7 || z === 0 || z === 5;
      if (wall) for (let y = 0; y <= 5; y++) cells.push({ pos: [x, y, z], block: "stone" });
      cells.push({ pos: [x, 6, z], block: "spruce_planks" });
      roofKeys.add(`${x},6,${z}`);
    }
  }
  return { occ: occupancyFromCells([...cells, ...extras]), roofKeys, upperTop: 6 };
}

const SLABS = [
  { id: "ws-0", massId: "mass-0", dir: "-x", axis: "x", value: 0, boundsWorld: { min: [0, 0, 0], max: [0, 5, 5] } },
  { id: "ws-1", massId: "mass-0", dir: "+x", axis: "x", value: 7, boundsWorld: { min: [7, 0, 0], max: [7, 5, 5] } },
  { id: "ws-2", massId: "mass-0", dir: "-z", axis: "z", value: 0, boundsWorld: { min: [0, 0, 0], max: [7, 5, 0] } },
  { id: "ws-3", massId: "mass-0", dir: "+z", axis: "z", value: 5, boundsWorld: { min: [0, 0, 5], max: [7, 5, 5] } },
];
const ROOF_PLANES = [{ id: "roof-0", kind: "flat", extent: { runs: [0, 1, 2, 3, 4, 5].map((z) => ({ z, x0: 0, x1: 7 })) } }];
const RECORD = { schema: "component-record/v1", source: { sha256: "a".repeat(64) }, wallSlabs: SLABS, roofPlanes: ROOF_PLANES };
const SHA = "a".repeat(64);

const sorted = (xs) => [...xs].sort();

// --- frames: component vs occupancy (the seam-2 AC pair) -----------------------------------------

test("frameLinesFromComponent ≡ frameLines on clean geometry (the definitions describe the building)", () => {
  const { occ, roofKeys, upperTop } = box();
  const geom = { floorLines: [3], upperTop, roofKeys };
  const occPath = frameLines(occ, geom);
  const recipe = { cornerCols: cornerColumnsFromSlabs(SLABS), roofFootprintCols: roofFootprintFromRecord(RECORD) };
  const defPath = frameLinesFromComponent(occ, geom, recipe);
  for (const kind of ["cornerPost", "roofline", "floorLine"]) {
    assert.deepEqual(sorted(defPath.byKind[kind]), sorted(occPath.byKind[kind]), kind);
  }
  assert.equal(defPath.counts.wall, occPath.counts.wall);
  assert.deepEqual(defPath.source, { cornerPost: "component", roofline: "component", floorLine: "occupancy" });
});

test("frameLinesFromComponent: occupancy noise grows occupancy corners, not component corners", () => {
  // a one-cell spike off the +x wall — voxelization junk, not a building corner
  const { occ, roofKeys, upperTop } = box({ extras: [{ pos: [8, 2, 2], block: "stone" }] });
  const geom = { floorLines: [3], upperTop, roofKeys };
  const occPath = frameLines(occ, geom);
  assert.ok(occPath.byKind.cornerPost.includes("8,2,2"), "the occupancy read classifies the spike as a corner post");
  const recipe = { cornerCols: cornerColumnsFromSlabs(SLABS), roofFootprintCols: roofFootprintFromRecord(RECORD) };
  const defPath = frameLinesFromComponent(occ, geom, recipe);
  assert.ok(!defPath.cells.has("8,2,2"), "the definition does not follow the noise");
});

test("cornerColumnsFromSlabs: bounds clip — a slab pair that never meets makes no corner", () => {
  assert.deepEqual(sorted(cornerColumnsFromSlabs(SLABS)), ["0,0", "0,5", "7,0", "7,5"]);
  const far = [
    { axis: "x", value: 0, boundsWorld: { min: [0, 0, 0], max: [0, 5, 5] } },
    { axis: "z", value: 9, boundsWorld: { min: [20, 0, 9], max: [27, 5, 9] } }, // x-range excludes 0
  ];
  assert.equal(cornerColumnsFromSlabs(far).size, 0);
});

// --- wall faces + census decomposition (the seam-3 AC pair) --------------------------------------

test("wallFacePredicate: on-face true, interior/off-plane false, bounds clipped; empty slabs → null", () => {
  const wf = wallFacePredicate(RECORD);
  assert.ok(wf.contains([0, 3, 2]));      // on the -x slab plane
  assert.ok(!wf.contains([1, 3, 2]));     // one cell inboard
  assert.ok(!wf.contains([0, 6, 2]));     // above the slab's y-bounds (roof course)
  assert.ok(wf.contains([3, 0, 5]));      // on the +z slab
  assert.equal(wallFacePredicate({ wallSlabs: [] }), null);
});

test("splitZoneOf: the split census partitions the unsplit census exactly", () => {
  const { occ } = box();
  const zoneOf = ([, y]) => (y >= 6 ? "roof" : y >= 3 ? "band1" : "band0");
  const wf = wallFacePredicate(RECORD);
  const split = splitZoneOf(zoneOf, wf, ["band0", "band1"]);
  const whole = surfaceZoneHistogram(occ, zoneOf, { skin: "exposure" });
  const parts = surfaceZoneHistogram(occ, split, { skin: "exposure" });
  for (const band of ["band0", "band1"]) {
    const on = parts[band]?.total ?? 0;
    const off = parts[`${band}:offslab`]?.total ?? 0;
    assert.equal(on + off, whole[band].total, `${band} partition`);
    assert.ok(on > 0, `${band} has defined wall-face cells`);
  }
  assert.equal(parts.roof.total, whole.roof.total, "non-band zones pass through");
});

// --- roof plan + conformance (the seam-1 AC pair) ------------------------------------------------

function roofFixture() {
  const base = box().occ;
  // the "program" replaces the flat slab with a one-step ridge along x=3..4 (toy program)
  const cells = [];
  for (const [key, block] of base.cells) {
    const [x, y, z] = key.split(",").map(Number);
    if (y === 6) continue; // strip the old top
    cells.push({ pos: [x, y, z], block });
  }
  for (let x = 0; x <= 7; x++) {
    for (let z = 0; z <= 5; z++) {
      cells.push({ pos: [x, 6, z], block: "spruce_planks" });
      if (x >= 3 && x <= 4) cells.push({ pos: [x, 7, z], block: "spruce_stairs", state: { facing: "east", half: "bottom" } });
    }
  }
  cells.push({ pos: [3, 8, 2], block: "spruce_planks" }); // a FULL-block cap: form, not protected paint
  const recon = occupancyFromCells(cells);
  const record = {
    status: "accepted", swap: { accepted: true },
    fit: { gables: [{ id: "g-0", footprint: { bbox: { minX: 0, maxX: 7, minZ: 0, maxZ: 5 }, area: 48 } }] },
    family: { field: "minecraft:spruce_planks", stairs: "minecraft:spruce_stairs", slab: null },
    inputs: { shellSha256: SHA },
  };
  return { base, recon, record, delta: occupancyDelta(base, recon) };
}

test("roofPlanFromRecord: shaped cells protected, full cells form-only; colTop exact; family bare-blocked", () => {
  const { recon, record, delta } = roofFixture();
  const plan = roofPlanFromRecord({ record, delta, occ: recon });
  assert.ok(plan.cells.has("3,7,2") && plan.cells.has("4,7,5"), "shaped course cells are protected");
  assert.ok(!plan.cells.has("3,8,2"), "a full-block cap is FORM, not protected paint (the skin zones it)");
  assert.ok(plan.footprintCols.has("3,2"), "…but its column is program footprint");
  assert.equal(plan.colTop.get("3,2"), 8);
  assert.equal(plan.colTop.get("4,2"), 7);
  assert.equal(plan.colTop.get("0,0"), 6);
  assert.deepEqual(plan.family, { field: "spruce_planks", stairs: "spruce_stairs", slab: null });
  // non-accepted records are not consumed
  assert.equal(roofPlanFromRecord({ record: { ...record, status: "fallback" }, delta, occ: recon }), null);
  assert.equal(roofPlanFromRecord({ record: { ...record, swap: { accepted: false } }, delta, occ: recon }), null);
});

test("programConformance: program-true build conforms; a perturbed column is named with want/got", () => {
  const { recon, record, delta } = roofFixture();
  const plan = roofPlanFromRecord({ record, delta, occ: recon });
  const clean = programConformance(recon, plan);
  assert.equal(clean.deviations.length, 0);
  assert.equal(clean.conforming, clean.columns);
  // something added a course block on top of the program (the basin-fill bug this check replaces)
  const cells = [...recon.cells].map(([key, block]) => ({ pos: key.split(",").map(Number), block }));
  const perturbed = occupancyFromCells([...cells, { pos: [0, 7, 0], block: "spruce_planks" }]);
  const dirty = programConformance(perturbed, plan);
  assert.deepEqual(dirty.deviations, [{ col: "0,0", want: 6, got: 7 }]);
});

// --- the plan assembly ----------------------------------------------------------------------------

test("buildComponentPlan: full inputs → all members; absences → named findings; never silent", () => {
  const { recon, record, delta } = roofFixture();
  const full = buildComponentPlan({
    componentRecord: RECORD, roofRecord: record, shapedRecord: { inputs: { recordSha: SHA } },
    shellSha: SHA, roofDelta: delta, roofOcc: recon,
  });
  assert.equal(full.schema, COMPONENT_PLAN_SCHEMA);
  assert.ok(full.roof && full.frames && full.wallFaces);
  assert.equal(full.frames.rooflineSource, "program");
  assert.deepEqual(full.findings, []);

  const none = buildComponentPlan({ shellSha: SHA });
  assert.equal(none.roof, null);
  assert.equal(none.frames, null);
  assert.equal(none.wallFaces, null);
  assert.deepEqual(sorted(none.findings.map((f) => f.code)),
    ["component-record-missing", "roof-program-missing", "shaped-record-missing"]);

  const fallbackRoof = buildComponentPlan({
    componentRecord: RECORD, roofRecord: { ...record, status: "fallback" }, shellSha: SHA,
  });
  assert.equal(fallbackRoof.roof, null);
  assert.ok(fallbackRoof.findings.some((f) => f.code === "roof-program-fallback"));
  assert.equal(fallbackRoof.frames.rooflineSource, "record", "frames fall back to the record's roof extent");
});

test("buildComponentPlan: pin mismatch THROWS — drift never degrades", () => {
  assert.throws(
    () => buildComponentPlan({ componentRecord: { ...RECORD, source: { sha256: "b".repeat(64) } }, shellSha: SHA }),
    /pin mismatch.*input drift/s
  );
  assert.throws(
    () => buildComponentPlan({ roofRecord: { status: "accepted", swap: { accepted: true }, inputs: { shellSha256: "c".repeat(64) } }, shellSha: SHA }),
    /roof-program inputs\.shellSha256 pin mismatch/
  );
  assert.throws(() => buildComponentPlan({}), /shellSha required/);
});

test("planCensusZoneOf: a program cell censuses as roof regardless of its y-band", () => {
  const zoneOf = ([, y]) => (y >= 6 ? "roof" : y >= 3 ? "band1" : "band0");
  const wf = wallFacePredicate(RECORD);
  const plan = { roof: { cells: new Set(["0,4,2"]) }, wallFaces: wf };
  const census = planCensusZoneOf(zoneOf, plan, ["band0", "band1"]);
  assert.equal(census([0, 4, 2]), "roof");            // a rake stair on the wall plane: roof by definition
  assert.equal(census([0, 4, 3]), "band1");           // its neighbour on the slab face: wall
  assert.equal(census([1, 4, 3]), "band1:offslab");   // inboard cell: measured, not gated
  // roof-only plan (no wallFaces): bands pass through unsplit
  const roofOnly = planCensusZoneOf(zoneOf, { roof: { cells: new Set(["0,4,2"]) } }, ["band0", "band1"]);
  assert.equal(roofOnly([1, 4, 3]), "band1");
  assert.equal(roofOnly([0, 4, 2]), "roof");
});

test("buildComponentPlan: wallTop is the defined wall/roof boundary (max slab y + 1)", () => {
  const p = buildComponentPlan({ componentRecord: RECORD, shellSha: SHA });
  assert.equal(p.wallTop, 6); // slabs reach y5; first non-wall layer is 6 — the box's actual upperTop
  assert.equal(buildComponentPlan({ shellSha: SHA }).wallTop, null);
});
