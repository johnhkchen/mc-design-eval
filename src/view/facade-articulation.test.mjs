// Facade articulation brush unit tests (T-147-01, story S-147, epic E-35). Each brush rides
// T-146-01's relief op: placement on the grammar rhythm, recess by exclusion (no air op),
// idempotence, purity, and — the AC's guarantee — in-plane silhouette no-regress via the EXPORTED
// reliefNoRegress predicate (the same one the S-148 gate will reuse).

import { test } from "node:test";
import assert from "node:assert/strict";

import { occupancyFromCells } from "./occupancy.mjs";
import { reliefNoRegress } from "./surface-relief.mjs";
import { pilaster, quoin, infillPanel, eaveOverhang } from "./facade-articulation.mjs";

/** A gabled front wall on the -z face: body x0..6 × y0..4 at z=0, then a raked gable. */
function gableWall() {
  const cells = [];
  for (let x = 0; x <= 6; x++) for (let y = 0; y <= 4; y++) cells.push({ pos: [x, y, 0], block: "white_terracotta" });
  for (let x = 1; x <= 5; x++) cells.push({ pos: [x, 5, 0], block: "white_terracotta" });
  for (let x = 2; x <= 4; x++) cells.push({ pos: [x, 6, 0], block: "white_terracotta" });
  cells.push({ pos: [3, 7, 0], block: "white_terracotta" });
  return cells;
}

/** A flat-topped wall on the -z face (no gable) — top row y=4 is the eave. */
function flatWall() {
  const cells = [];
  for (let x = 0; x <= 6; x++) for (let y = 0; y <= 4; y++) cells.push({ pos: [x, y, 0], block: "white_terracotta" });
  return cells;
}

/** A solid box W×H×D — four exterior faces with real corners. */
function boxStub(w = 6, h = 5, d = 4) {
  const cells = [];
  for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) for (let z = 0; z < d; z++) cells.push({ pos: [x, y, z], block: "white_terracotta" });
  return cells;
}

// ---- pilaster -------------------------------------------------------------------------------
test("FA1 pilaster — proud strips on the period, in front of the -z plane only", () => {
  const occ = occupancyFromCells(gableWall());
  const { placements, report } = pilaster(occ, { material: "stripped_oak_log", faces: ["-z"], rhythm: { period: 3 } });
  assert.ok(placements.length > 0);
  for (const p of placements) {
    assert.equal(p.pos[2], -1, "one cell proud of -z");
    assert.equal(p.pos[0] % 3, 0, "only strip columns");
    assert.equal(p.block, "minecraft:stripped_oak_log");
  }
  assert.equal(report.brush, "pilaster");
  assert.equal(report.period, 3);
});

test("FA2 pilaster — the rake (in-plane silhouette) is preserved by construction", () => {
  const occ = occupancyFromCells(gableWall());
  const opts = { material: "stripped_oak_log", faces: ["-z"], rhythm: { period: 3 } };
  const { placements } = pilaster(occ, opts);
  const nr = reliefNoRegress(occ, placements, { faces: ["-z"] });
  assert.ok(nr.inPlanePreserved, "front elevation mask + proportions byte-unchanged");
  assert.ok(nr.ratiosPreserved, "height ratios byte-unchanged");
});

test("FA3 pilaster — fail-loud on a bad period", () => {
  const occ = occupancyFromCells(gableWall());
  assert.throws(() => pilaster(occ, { material: "x", faces: ["-z"], rhythm: { period: 0 } }), /period/);
});

// ---- quoin ----------------------------------------------------------------------------------
test("FA4 quoin — proud runs only at the corner columns, alternating stretcher/header depth", () => {
  const occ = occupancyFromCells(boxStub());
  const { placements, report } = quoin(occ, { material: "stone_bricks", faces: ["-z"], run: 4, headerDepth: 2 });
  assert.ok(placements.length > 0);
  // -z face: along = x; corners are x=0 and x=5
  for (const p of placements) assert.ok(p.pos[0] === 0 || p.pos[0] === 5, `proud cell at corner column, got x=${p.pos[0]}`);
  // alternating depth: even courses (y=0,2) reach z=-1 only; odd courses (y=1,3) reach z=-2
  const depthAt = (x, y) => placements.filter((p) => p.pos[0] === x && p.pos[1] === y).map((p) => p.pos[2]).sort((a, b) => a - b);
  assert.deepEqual(depthAt(0, 0), [-1], "course 0 = stretcher (depth 1)");
  assert.deepEqual(depthAt(0, 1), [-2, -1], "course 1 = header (depth 2)");
  assert.equal(report.brush, "quoin");
  assert.equal(report.corners, 2);
});

test("FA5 quoin — idempotent on its own output (a second run emits nothing new)", () => {
  const occ0 = occupancyFromCells(boxStub());
  const opts = { material: "stone_bricks", faces: ["-z"], run: 4, headerDepth: 2 };
  const { placements } = quoin(occ0, opts);
  const occ1 = occupancyFromCells([...boxStub(), ...placements.map((p) => ({ pos: p.pos, block: p.block }))]);
  const { placements: again } = quoin(occ1, opts);
  assert.equal(again.length, 0, "relief is not re-emitted in front of itself");
});

// ---- infill-panel ---------------------------------------------------------------------------
test("FA6 infillPanel — proud studs on the rhythm PLUS the field recolored between them", () => {
  const occ = occupancyFromCells(gableWall());
  const { placements, report } = infillPanel(occ, {
    memberMaterial: "dark_oak_log", fieldMaterial: "oak_planks", faces: ["-z"], rhythm: { period: 3 },
  });
  const studs = placements.filter((p) => p.pos[2] === -1);
  const field = placements.filter((p) => p.pos[2] === 0);
  assert.ok(studs.length > 0 && field.length > 0, "both studs and field are emitted");
  for (const s of studs) { assert.equal(s.pos[0] % 3, 0); assert.equal(s.block, "minecraft:dark_oak_log"); }
  for (const fcell of field) { assert.notEqual(fcell.pos[0] % 3, 0, "field excludes stud columns (recess by exclusion)"); }
  assert.equal(report.brush, "infill-panel");
});

test("FA7 infillPanel — the field recolor moves no geometry (silhouette + studs no-regress)", () => {
  const occ = occupancyFromCells(gableWall());
  const { placements } = infillPanel(occ, {
    memberMaterial: "dark_oak_log", fieldMaterial: "spruce_planks", faces: ["-z"], rhythm: { period: 3 },
  });
  const nr = reliefNoRegress(occ, placements, { faces: ["-z"] });
  assert.ok(nr.inPlanePreserved && nr.ratiosPreserved, "recolor + proud studs keep the in-plane mask");
});

// ---- eave-overhang --------------------------------------------------------------------------
test("FA8 eaveOverhang — a proud soffit course at the eave row only, distinct from lower rows", () => {
  const occ = occupancyFromCells(flatWall());
  const { placements, report } = eaveOverhang(occ, { material: "dark_oak_slab", faces: ["-z"], depth: 1 });
  assert.equal(report.eaveRow, 4, "defaults to the top wall row");
  assert.ok(placements.length > 0);
  for (const p of placements) { assert.equal(p.pos[1], 4, "only the eave row"); assert.equal(p.pos[2], -1, "proud of the wall"); }
  // explicit eaveRow overrides
  const lower = eaveOverhang(occ, { material: "dark_oak_slab", faces: ["-z"], eaveRow: 2 });
  for (const p of lower.placements) assert.equal(p.pos[1], 2);
});

test("FA9 every brush is pure — two calls return byte-identical placements", () => {
  const mk = () => occupancyFromCells(boxStub());
  const runs = [
    () => pilaster(mk(), { material: "a", faces: ["-z", "+x"], rhythm: { period: 2 } }),
    () => quoin(mk(), { material: "b", faces: ["-z", "+x"], run: 3 }),
    () => infillPanel(mk(), { memberMaterial: "c", fieldMaterial: "d", faces: ["-z"], rhythm: { period: 2 } }),
    () => eaveOverhang(mk(), { material: "e", faces: ["-z", "+x"] }),
  ];
  for (const r of runs) assert.equal(JSON.stringify(r().placements), JSON.stringify(r().placements));
});
