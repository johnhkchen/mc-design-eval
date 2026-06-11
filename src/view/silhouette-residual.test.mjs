// Unit tests for silhouette-residual.mjs (T-109-01, story S-109, epic E-28) — synthetic shells
// and a voxel "GLB" stand-in only; the gatehouse/cottage evidence runs live in the runner.
import { test } from "node:test";
import assert from "node:assert/strict";

import { occupancyFromCells } from "./occupancy.mjs";
import { voxelSilhouettes } from "./shell-regularize.mjs";
import { MULTI_ANGLE_GATE } from "../config.mjs";
import { protrusionCandidates, massSpill, residualPass } from "./silhouette-residual.mjs";

const AZ = MULTI_ANGLE_GATE.azimuths;
const refsOf = (occ) => voxelSilhouettes(occ, AZ);

/** Solid box 12×12 footprint, y 0..9. */
function boxCells() {
  const cells = [];
  for (let x = 0; x <= 11; x++) for (let y = 0; y <= 9; y++) for (let z = 0; z <= 11; z++) {
    cells.push({ pos: [x, y, z], block: "stone" });
  }
  return cells;
}

/** Chimney column (2,2) y10..15 — present in the "GLB". */
function chimneyCells() {
  const cells = [];
  for (let y = 10; y <= 15; y++) cells.push({ pos: [2, y, 2], block: "cobblestone" });
  return cells;
}

/** Blob lump: 2 plan columns at (9, 3..4), y10..13 — NOT in the "GLB". Two columns stay below
 *  protrudingStackRegion's minPlateau (a wider flat lump reads as a roof plane and reaches this
 *  pass via the RECORD path instead — the gatehouse reality). Offset from the chimney on both
 *  diagonal projections (x−z and x+z) so no azimuth hides it behind the stack; the chimney tops
 *  both the build and the reference, so their crops correspond (the registration premise). */
function lumpCells() {
  const cells = [];
  for (let y = 10; y <= 13; y++) for (let z = 3; z <= 4; z++) {
    cells.push({ pos: [9, y, z], block: "stone" });
  }
  return cells;
}

const inputOcc = () => occupancyFromCells([...boxCells(), ...chimneyCells(), ...lumpCells()]);
const idealOcc = () => occupancyFromCells([...boxCells(), ...chimneyCells()]); // the GLB stand-in

test("candidates: stack-derived components, size-desc deterministic ids", () => {
  const cands = protrusionCandidates(inputOcc(), null);
  assert.equal(cands.length, 2);
  assert.equal(cands[0].id, "res-0");
  assert.equal(cands[0].size, 8, "the lump (2×2×2) outranks the chimney");
  assert.equal(cands[1].size, 6);
  assert.ok(cands[1].cells.has("2,15,2"), "the chimney component");
});

test("candidates: record protrusion masses join the pool even without a stack plateau", () => {
  const record = { masses: [
    { id: "mass-9", role: "protrusion", yRange: [8, 9], plan: { runs: [{ z: 5, x0: 5, x1: 5 }] } },
  ] };
  const cands = protrusionCandidates(inputOcc(), record);
  assert.equal(cands.length, 3, "stack lump + stack chimney + the record-named column");
  const recCand = cands.find((c) => c.cells.has("5,8,5"));
  assert.ok(recCand && recCand.cells.has("5,9,5"));
});

test("candidates: degenerate yRange guarded, fixtures never join", () => {
  const cells = [...boxCells(), { pos: [3, 10, 3], block: "spruce_trapdoor", form: "fixture", state: {} }];
  const record = { masses: [{ id: "m", role: "protrusion", plan: { runs: [{ z: 3, x0: 3, x1: 3 }] } }] };
  const cands = protrusionCandidates(occupancyFromCells(cells), record);
  assert.equal(cands.length, 0, "no yRange → no record cells; the fixture is dressing");
});

test("massSpill: the chimney is spill-free everywhere; the lump is refuted where the view separates it", () => {
  const occ = inputOcc();
  const refSils = refsOf(idealOcc());
  const [lump, chimney] = protrusionCandidates(occ, null);
  const c = massSpill(occ, chimney.cells, refSils);
  assert.equal(c.shownAt.length, AZ.length, `chimney shown everywhere, got ${c.shownAt.join(",")}`);
  const l = massSpill(occ, lump.cells, refSils);
  // at the camera-NEAR azimuth the lump hides inside the roof's projected top face (the measured
  // 30°-elevation effect) — refutation at the separating azimuths is the discriminating signal
  assert.ok(l.shownAt.length < AZ.length, "the lump is refuted at ≥1 azimuth");
  const spilled = AZ.filter((a) => l.perAzimuth[a].spillPx > 0);
  assert.ok(spilled.length >= 1, "spill evidence recorded");
  assert.ok(l.dilationPx >= 1);
});

test("residualPass: lump removed with azimuth evidence, chimney exempt — the cage holds", () => {
  const occ = inputOcc();
  const r = residualPass(occ, { record: null, refSils: refsOf(idealOcc()) });
  assert.equal(r.removedCells, 8);
  const removed = r.log.find((e) => e.outcome === "removed");
  const exempt = r.log.find((e) => e.outcome === "exempt-shown");
  assert.ok(removed && exempt);
  assert.ok(removed.refutedAt.length >= 1, "refutation azimuths on the log");
  assert.ok(removed.refutedAt.every((a) => removed.perAzimuth[a].spillPx > 0), "evidence on the log");
  assert.equal(exempt.refutedAt.length, 0);
  assert.equal(exempt.shownAt.length, AZ.length);
  for (const c of lumpCells()) assert.ok(!r.occ.cells.has(c.pos.join(",")), "lump gone");
  for (const c of chimneyCells()) assert.ok(r.occ.cells.has(c.pos.join(",")), "chimney stays");
});

test("residualPass: caller-protected unsupported mass is exempt, named", () => {
  const occ = inputOcc();
  const protect = [{ name: "keep", contains: ([x, , z]) => x === 9 && z >= 3 && z <= 4 }];
  const r = residualPass(occ, { record: null, refSils: refsOf(idealOcc()), protect });
  assert.equal(r.removedCells, 0);
  assert.ok(r.log.some((e) => e.outcome === "exempt-protected"));
  for (const c of lumpCells()) assert.ok(r.occ.cells.has(c.pos.join(",")));
});

test("residualPass: a removal that breaks closure rolls back, named", () => {
  // hollow shell with a roof hole CAPPED by the unsupported lump — removing it opens the
  // interior, the closure check trips, the rollback is recorded. The chimney sits in BOTH the
  // build and the reference so the normalized crops correspond (registration premise).
  const cells = [...chimneyCells()];
  for (let x = 0; x <= 11; x++) for (let y = 0; y <= 9; y++) for (let z = 0; z <= 11; z++) {
    const shell = x === 0 || x === 11 || z === 0 || z === 11 || y === 0 || y === 9;
    if (!shell) continue;
    if (x === 9 && y === 9 && z === 3) continue; // the roof hole
    cells.push({ pos: [x, y, z], block: "stone" });
  }
  for (let y = 10; y <= 12; y++) cells.push({ pos: [9, y, 3], block: "stone" }); // the cap
  const occ = occupancyFromCells(cells);
  const idealShell = occupancyFromCells(cells
    .filter((c) => !(c.pos[0] === 9 && c.pos[1] >= 10 && c.pos[2] === 3))
    .concat([{ pos: [9, 9, 3], block: "stone" }])); // closed reference: chimney yes, cap no
  const r = residualPass(occ, { record: null, refSils: refsOf(idealShell) });
  const rb = r.log.find((e) => e.outcome === "rolled-back");
  assert.ok(rb, JSON.stringify(r.log));
  assert.ok(rb.refutedAt.length >= 1, "the cap is genuinely unsupported");
  assert.ok(rb.reasons.some((x) => /closure regressed/.test(x)), rb.reasons.join("; "));
  assert.ok(r.occ.cells.has("9,10,3"), "rollback keeps the cap");
});

test("residualPass: deterministic — two runs produce byte-equal logs and occupancies", () => {
  const a = residualPass(inputOcc(), { record: null, refSils: refsOf(idealOcc()) });
  const b = residualPass(inputOcc(), { record: null, refSils: refsOf(idealOcc()) });
  assert.equal(JSON.stringify(a.log), JSON.stringify(b.log));
  assert.deepEqual([...a.occ.cells.entries()].sort(), [...b.occ.cells.entries()].sort());
});

test("residualPass: no candidates → identity result, empty log", () => {
  const occ = occupancyFromCells(boxCells());
  const r = residualPass(occ, { record: null, refSils: refsOf(occ) });
  assert.equal(r.occ, occ);
  assert.deepEqual(r.log, []);
});

test("residualPass: missing refSils throws (membership IS the GLB)", () => {
  assert.throws(() => residualPass(inputOcc(), { record: null }), /refSils/);
});
