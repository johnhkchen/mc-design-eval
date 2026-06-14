// surface.relief unit tests (T-146-01, story S-146, epic E-35) — proud emission on a rhythm, recess
// by exclusion (no air op), in-plane silhouette containment, idempotence, depth, byte-stability,
// fail-loud gates, and the no-regress harness that IS the AC2 gate. (SR10 — the reliefProfile read —
// lands with src/view/surface-grid.mjs in Step 2.)

import { test } from "node:test";
import assert from "node:assert/strict";

import { occupancyFromCells } from "./occupancy.mjs";
import { projectSurface, reliefProfile } from "./surface-grid.mjs";
import { surfaceRelief, reliefNoRegress } from "./surface-relief.mjs";

/** A gabled front wall on the -z face: body x0..6 × y0..4 at z=0, then a raked gable (y5 x1..5,
 *  y6 x2..4, y7 apex x3). One cell thick in z — the front face is the -z exterior. */
function wallStub() {
  const cells = [];
  for (let x = 0; x <= 6; x++) for (let y = 0; y <= 4; y++) cells.push({ pos: [x, y, 0], block: "white_terracotta" });
  for (let x = 1; x <= 5; x++) cells.push({ pos: [x, 5, 0], block: "white_terracotta" });
  for (let x = 2; x <= 4; x++) cells.push({ pos: [x, 6, 0], block: "white_terracotta" });
  cells.push({ pos: [3, 7, 0], block: "white_terracotta" });
  return cells;
}

// pilaster strips every 3 along x (x ≡ 0 mod 3 → x0, x3, x6), 1 wide, on the -z face
const COL = Object.freeze({
  material: "stripped_oak_log", faces: ["-z"],
  rhythm: { axis: "column", every: 3, span: 1, phase: 0 },
});

test("SR1 proud emission lands in front of the plane on strip columns only", () => {
  const occ = occupancyFromCells(wallStub());
  const { placements, report } = surfaceRelief(occ, COL);
  assert.ok(placements.length > 0, "some relief is emitted");
  for (const p of placements) {
    assert.equal(p.pos[2], -1, "proud cell sits one in front of the -z plane");
    assert.equal(p.pos[0] % 3, 0, `x=${p.pos[0]} is a strip column`);
    assert.equal(p.block, "minecraft:stripped_oak_log");
  }
  assert.equal(report.proudCells, placements.length);
  assert.ok(report.strips >= 3, "at least the three strip columns fired");
});

test("SR2 recess by exclusion — field columns get NO placement (no air op)", () => {
  const occ = occupancyFromCells(wallStub());
  const { placements, report } = surfaceRelief(occ, COL);
  const strippedX = new Set(placements.map((p) => p.pos[0]));
  for (const x of [1, 2, 4, 5]) assert.ok(!strippedX.has(x), `field column x=${x} stays at the base plane`);
  assert.ok(report.fieldCells > 0, "the recessed field is observable in the report, not carved by an air op");
});

test("SR3 in-plane silhouette honored — every proud cell shares (x,y) with an existing wall cell", () => {
  const occ = occupancyFromCells(wallStub());
  const { placements } = surfaceRelief(occ, COL);
  const wallPlane = new Set(wallStub().map((c) => `${c.pos[0]},${c.pos[1]}`));
  for (const p of placements) {
    assert.ok(wallPlane.has(`${p.pos[0]},${p.pos[1]}`), `relief at x${p.pos[0]},y${p.pos[1]} stays inside the rake`);
  }
});

test("SR4 idempotent — a second run on the brush's own output emits nothing", () => {
  const base = wallStub();
  const occ = occupancyFromCells(base);
  const first = surfaceRelief(occ, COL);
  const after = occupancyFromCells([
    ...base,
    ...first.placements.map((p) => ({ pos: p.pos, block: p.block.replace("minecraft:", "") })),
  ]);
  const second = surfaceRelief(after, COL);
  assert.equal(second.placements.length, 0, "re-run is a no-op");
});

test("SR5 row rhythm emits horizontal belt courses by height index", () => {
  const occ = occupancyFromCells(wallStub());
  const ROW = { material: "stone_bricks", faces: ["-z"], rhythm: { axis: "row", every: 2, span: 1, phase: 0 } };
  const { placements } = surfaceRelief(occ, ROW);
  assert.ok(placements.length > 0);
  for (const p of placements) assert.equal(p.pos[1] % 2, 0, `belt course at even height y=${p.pos[1]}`);
});

test("SR6 depth ≥ 2 emits a contiguous proud run outward from the plane", () => {
  const occ = occupancyFromCells(wallStub());
  const deep = surfaceRelief(occ, { ...COL, depth: 2 });
  const shallow = surfaceRelief(occ, COL);
  assert.equal(deep.report.proudCells, shallow.report.proudCells * 2, "two cells out per strip skin cell");
  for (const z of [-1, -2]) assert.ok(deep.placements.some((p) => p.pos[2] === z), `course present at z=${z}`);
  // every emitted column is a contiguous z=-1..-depth run in front of its strip cell — never floating
  for (const p of deep.placements) assert.ok(p.pos[2] === -1 || p.pos[2] === -2, "run stays within depth, contiguous to the plane");
});

test("SR7 byte-stable placement order across repeated runs", () => {
  const occ = occupancyFromCells(wallStub());
  assert.deepEqual(surfaceRelief(occ, COL).placements, surfaceRelief(occ, COL).placements);
});

test("SR8 fail-loud opts gates", () => {
  const occ = occupancyFromCells(wallStub());
  assert.throws(() => surfaceRelief(occ, { ...COL, material: "" }), /material/);
  assert.throws(() => surfaceRelief(occ, { ...COL, rhythm: { axis: "diag", every: 3 } }), /axis/);
  assert.throws(() => surfaceRelief(occ, { ...COL, rhythm: { axis: "column", every: 0 } }), /every/);
  assert.throws(() => surfaceRelief(occ, { ...COL, depth: 0 }), /depth/);
  assert.throws(() => surfaceRelief(occ, { ...COL, faces: ["+y"] }), /unknown face/);
});

test("SR9 reliefNoRegress is the gate — in-plane mask + height ratios byte-unchanged; aspect widens", () => {
  const occ = occupancyFromCells(wallStub());
  const { placements } = surfaceRelief(occ, COL);
  const verdict = reliefNoRegress(occ, placements, { faces: ["-z"] });
  assert.equal(verdict.inPlanePreserved, true, "the -z own-face silhouette + maskProportions are byte-identical");
  assert.equal(verdict.ratiosPreserved, true, "ridgeToEave & roofShare are byte-identical (relief moves no height)");
  assert.equal(verdict.perFace[0].maskEqual, true);
  assert.equal(verdict.perFace[0].propsEqual, true);
  assert.equal(verdict.expectedWidening.widened, true, "the perpendicular plan aspect widens — honest visible relief");
});

test("SR10 the 2.5-D layer reads the constructed relief (reliefProfile sees proud strips)", () => {
  const base = wallStub();
  const occ = occupancyFromCells(base);
  const { placements } = surfaceRelief(occ, COL);
  const after = occupancyFromCells([
    ...base,
    ...placements.map((p) => ({ pos: p.pos, block: p.block.replace("minecraft:", "") })),
  ]);
  const profile = reliefProfile(projectSurface(after, "-z"));
  assert.ok(profile.proud > 0, "the proud pilaster strips are visible to the depth read");
  assert.ok(profile.flush > 0, "the field between strips reads at the wall plane (recessed by exclusion)");
  assert.equal(profile.recessed, 0, "relief only adds proud cells — nothing was dug behind the plane");
});
