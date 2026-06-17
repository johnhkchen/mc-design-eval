// Compositional treatment grammar unit tests (T-175-01, story S-175, epic E-43). The engine is proven on
// SYNTHETIC geometry (square / rectangle / with-opening) per the AC: edges-from-geometry derivation, the
// layered compositor, recess BY EXCLUSION (additive only), the closure guard WITH TEETH (trips on a carve),
// in-plane no-regress, idempotence, the injected opening seam, fail-loud, and purity/serializability.

import { test } from "node:test";
import assert from "node:assert/strict";

import { occupancyFromCells } from "./occupancy.mjs";
import { reliefNoRegress } from "./surface-relief.mjs";
import { deriveEdges, composeTreatment, recessClosureGuard, TREATMENT_GRAMMAR_SCHEMA,
  deriveRoofEdges, deriveOpeningEdges, composeRoofTreatment } from "./treatment-grammar.mjs";

/** A solid box W×H×D — four exterior faces with real corners, floor=0, eaveY=H-1. */
function boxStub(w = 6, h = 6, d = 4) {
  const cells = [];
  for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) for (let z = 0; z < d; z++) cells.push({ pos: [x, y, z], block: "white_terracotta" });
  return occupancyFromCells(cells);
}

/** A box with a 1×2 door void punched through the -z face (interior shell hole). */
function boxWithOpening(w = 6, h = 6, d = 4) {
  const cells = [];
  for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) for (let z = 0; z < d; z++) {
    if (z === 0 && x === 2 && (y === 0 || y === 1)) continue; // the door void on -z
    cells.push({ pos: [x, y, z], block: "white_terracotta" });
  }
  return occupancyFromCells(cells);
}

const RUSTIC = Object.freeze({
  schema: TREATMENT_GRAMMAR_SCHEMA,
  base: { material: "stone_bricks", amplitude: { depth: 1 } },
  field: { recess: true },
  edges: {
    corners: { material: "cobblestone", amplitude: { headerDepth: 2 } },
    top: { material: "stone_bricks", amplitude: { depth: 1, courses: 1 } },
  },
});

// ---- deriveEdges (edges from geometry) -------------------------------------------------------
test("TG1 deriveEdges/square — the 4 footprint corners + band rows from geometry", () => {
  const occ = boxStub(5, 5, 5);
  const e = deriveEdges(occ, { floor: 0, eaveY: 4 });
  assert.deepEqual(e.footprint, { xMin: 0, xMax: 4, zMin: 0, zMax: 4 });
  assert.equal(e.cornerKey.length, 4);
  assert.deepEqual([...e.cornerKey].sort(), ["0,0", "0,4", "4,0", "4,4"]);
  assert.equal(e.top.row, 4);
  assert.equal(e.bottom.row, 0);
});

test("TG2 deriveEdges/rectangle — corners are the true footprint corners (not assumed square)", () => {
  const occ = boxStub(7, 5, 3); // w=7 (x), d=3 (z) — distinctly rectangular
  const e = deriveEdges(occ, { floor: 0, eaveY: 4 });
  assert.deepEqual(e.footprint, { xMin: 0, xMax: 6, zMin: 0, zMax: 2 });
  assert.deepEqual([...e.cornerKey].sort(), ["0,0", "0,2", "6,0", "6,2"]);
});

test("TG3 deriveEdges/with-opening — corners from the outer shell, unaffected by an interior void", () => {
  const e = deriveEdges(boxWithOpening(6, 6, 4), { floor: 0, eaveY: 5 });
  assert.deepEqual(e.footprint, { xMin: 0, xMax: 5, zMin: 0, zMax: 3 });
  assert.deepEqual([...e.cornerKey].sort(), ["0,0", "0,3", "5,0", "5,3"]);
});

// ---- compose layers --------------------------------------------------------------------------
test("TG4 compose — base, corners, and cornice all place (per-layer report non-zero)", () => {
  const occ = boxStub(6, 6, 4);
  const { report, placements } = composeTreatment(occ, RUSTIC, { floor: 0, eaveY: 5 });
  assert.ok(report.byLayer.base.placed > 0, "base course placed");
  assert.ok(report.byLayer.corners.placed > 0, "quoins placed");
  assert.ok(report.byLayer.top.placed > 0, "cornice placed");
  assert.equal(report.byLayer.field.recess, true, "field declared a recess");
  assert.ok(placements.length > 0);
  for (const p of placements) assert.equal(p.op, "voxel");
});

test("TG5 compose — the cornice EXCLUDES the corner columns (crisp quoin/cornice junction)", () => {
  const occ = boxStub(6, 6, 4);
  const topOnly = { schema: TREATMENT_GRAMMAR_SCHEMA, edges: { top: { material: "stone_bricks", amplitude: { depth: 1, courses: 1 } } } };
  const { placements } = composeTreatment(occ, topOnly, { floor: 0, eaveY: 5 });
  // -z face cornice cells are emitted proud at z = -1; their source columns x=0 and x=5 are corners → excluded.
  const minusZ = placements.filter((p) => p.pos[2] === -1);
  assert.ok(minusZ.length > 0, "the -z cornice produced cells");
  for (const p of minusZ) assert.ok(p.pos[0] !== 0 && p.pos[0] !== 5, `corner column ${p.pos[0]} must be excluded from the cornice`);
});

// ---- recess by exclusion + closure guard -----------------------------------------------------
test("TG6 recess by exclusion — additive only; the field cells are never removed (no air op)", () => {
  const occ = boxStub(6, 6, 4);
  const { occ: after } = composeTreatment(occ, RUSTIC, { floor: 0, eaveY: 5 });
  for (const key of occ.cells.keys()) assert.ok(after.cells.has(key), `original field cell ${key} must survive`);
  assert.ok(after.cells.size > occ.cells.size, "treatment only added proud cells");
});

test("TG7 recessClosureGuard — ok on the additive treatment (no holes reopened)", () => {
  const occ = boxStub(6, 6, 4);
  const { closure } = composeTreatment(occ, RUSTIC, { floor: 0, eaveY: 5 });
  assert.equal(closure.ok, true);
  assert.equal(closure.droppedColumns.length, 0);
  assert.ok(closure.after >= closure.before);
});

test("TG8 recessClosureGuard — TRIPS on a carve (a removed field column has teeth)", () => {
  const occ = boxStub(6, 6, 4);
  // synthesize an air-op recess: drop the entire (x=3,z=0) column from the wall band
  const carved = occupancyFromCells([...occ.cells.entries()]
    .map(([k, b]) => ({ pos: k.split(",").map(Number), block: b }))
    .filter((c) => !(c.pos[0] === 3 && c.pos[2] === 0)));
  const v = recessClosureGuard(occ, carved, { floor: 0, eaveY: 5 });
  assert.equal(v.ok, false);
  assert.ok(v.droppedColumns.includes("3,0"));
});

// ---- silhouette / idempotence ----------------------------------------------------------------
test("TG9 in-plane no-regress — a single relieved face's own-normal mask + ratios are byte-unchanged", () => {
  const occ = boxStub(6, 6, 4);
  // single-face treatment: -z relief is proud in z, which the z-projection collapses → the -z elevation
  // (x,y) mask is preserved BY CONSTRUCTION (the standing reliefNoRegress contract).
  const { placements } = composeTreatment(occ, RUSTIC, { faces: ["-z"], floor: 0, eaveY: 5 });
  const nr = reliefNoRegress(occ, placements, { faces: ["-z"] });
  assert.ok(nr.inPlanePreserved, "the relieved face's in-plane silhouette preserved by construction");
  assert.ok(nr.ratiosPreserved, "height ratios unchanged");
  // a FULL-perimeter treatment is EXPECTED to widen each face's perpendicular extent — honest visible
  // relief (proud quoins on every corner), recorded as expectedWidening, never a regress.
  const full = composeTreatment(occ, RUSTIC, { floor: 0, eaveY: 5 });
  const nrFull = reliefNoRegress(occ, full.placements, { faces: ["-z"] });
  assert.equal(nrFull.expectedWidening.widened, true, "full-perimeter quoins widen the perpendicular extent (honest)");
});

test("TG10 deterministic — same input + spec → byte-identical placements (pure)", () => {
  const occ = boxStub(6, 6, 4);
  const a = composeTreatment(occ, RUSTIC, { floor: 0, eaveY: 5 });
  const b = composeTreatment(occ, RUSTIC, { floor: 0, eaveY: 5 });
  assert.equal(a.occ.cells.size, b.occ.cells.size);
  assert.deepEqual(a.placements, b.placements, "placement list is byte-stable");
});

// ---- the injected opening seam ---------------------------------------------------------------
test("TG11 opening layer — runs when the dressing seam is injected, skipped (gracefully) when absent", () => {
  const occ = boxStub(6, 6, 4);
  const spec = { schema: TREATMENT_GRAMMAR_SCHEMA, edges: { opening: { frame: "dark_oak_log", door: "spruce_door" } } };
  // injected stubs (the brush-door seam): one aperture, one frame placement outside the shell
  const extractApertures = () => [{ dir: "-z", kind: "door" }];
  const dressOpenings = () => ({ placements: [{ op: "voxel", pos: [2, 0, -1], block: "minecraft:dark_oak_log" }] });
  const withSeam = composeTreatment(occ, spec, { floor: 0, eaveY: 5, extractApertures, dressOpenings });
  assert.equal(withSeam.report.byLayer.opening.placed, 1);
  assert.ok(withSeam.placements.some((p) => p.block === "minecraft:dark_oak_log"));
  const noSeam = composeTreatment(occ, spec, { floor: 0, eaveY: 5 });
  assert.ok(noSeam.report.byLayer.opening.skipped, "no seam → opening skipped, compose still succeeds");
});

// ---- fail-loud + purity ----------------------------------------------------------------------
test("TG12 fail-loud — missing spec, bad amplitude, unknown face all throw", () => {
  const occ = boxStub(6, 6, 4);
  assert.throws(() => composeTreatment(occ, null, { floor: 0, eaveY: 5 }), /spec/);
  assert.throws(() => composeTreatment(occ, { base: { material: "x", amplitude: { depth: 0 } } }, { floor: 0, eaveY: 5 }), /amplitude/);
  assert.throws(() => deriveEdges(occ, { faces: ["+q"], floor: 0, eaveY: 5 }), /face/);
  assert.throws(() => composeTreatment(occ, RUSTIC, { floor: 5, eaveY: 0 }), /eaveY/);
});

test("TG13 purity/serializable — deriveEdges round-trips through JSON; compose does not mutate the input", () => {
  const occ = boxStub(6, 6, 4);
  const e = deriveEdges(occ, { floor: 0, eaveY: 5 });
  assert.deepEqual(JSON.parse(JSON.stringify(e)), e, "edge descriptors are pure data");
  const sizeBefore = occ.cells.size;
  composeTreatment(occ, RUSTIC, { floor: 0, eaveY: 5 });
  assert.equal(occ.cells.size, sizeBefore, "input occupancy untouched");
});

// ---- T-176-01 generalization: roof + opening edges-from-geometry -----------------------------

/** A solid wall box (floor 0..eaveY) + a gable roof prism above it (ridge along x at z-center). */
function gableBoxStub({ eaveY = 4, ridgeY = 7 } = {}) {
  const cells = [];
  // wall box: x 0..6, z 0..4, y 0..eaveY
  for (let x = 0; x <= 6; x++) for (let y = 0; y <= eaveY; y++) for (let z = 0; z <= 4; z++) cells.push({ pos: [x, y, z], block: "stone_bricks" });
  // gable roof: ridge along x at z=2; the z-extent narrows as y rises from eaveY+1 to ridgeY.
  for (let y = eaveY + 1; y <= ridgeY; y++) {
    const inset = y - (eaveY + 1); // 0 at the eave, grows toward the ridge
    const zLo = Math.max(0, 0 + inset), zHi = Math.min(4, 4 - inset);
    for (let x = 0; x <= 6; x++) for (let z = zLo; z <= zHi; z++) cells.push({ pos: [x, y, z], block: "dark_oak_planks" });
  }
  return occupancyFromCells(cells);
}

test("TG14 deriveRoofEdges/ridge-x — eaveRow, ridgeRow and gable-end verge columns from geometry", () => {
  const occ = gableBoxStub({ eaveY: 4, ridgeY: 7 });
  const e = deriveRoofEdges(occ, { ridgeAxis: "x", eaveY: 4, ridgeY: 7 });
  assert.equal(e.eaveRow, 5);
  assert.equal(e.ridgeRow, 7);
  assert.deepEqual(e.band, { yLo: 5, yHi: 7 });
  // verge = the gable-end columns at x=0 and x=6 (ridge runs x → ends are at xMin/xMax).
  assert.ok(e.vergeColumns.every((k) => k.startsWith("0,") || k.startsWith("6,")), "verge columns are the x-ends");
  assert.ok(e.vergeColumns.includes("0,2") && e.vergeColumns.includes("6,2"), "ridge-line ends are verge columns");
});

test("TG15 deriveRoofEdges/ridge-z — verge columns swap to the z-ends (geometry, not assumed-x)", () => {
  const occ = gableBoxStub({ eaveY: 4, ridgeY: 7 }); // same box; we only change the declared ridge axis
  const e = deriveRoofEdges(occ, { ridgeAxis: "z", eaveY: 4, ridgeY: 7 });
  assert.ok(e.vergeColumns.every((k) => k.endsWith(",0") || k.endsWith(",4")), "verge columns are the z-ends");
});

test("TG16 composeRoofTreatment — eave, ridge and verge layers all place; closure ok over the roof band", () => {
  const occ = gableBoxStub({ eaveY: 4, ridgeY: 7 });
  const { report, closure, placements } = composeRoofTreatment(occ, { edge: { material: "stone_bricks", amplitude: { eaveDepth: 1, ridgeCourses: 1 } } },
    { ridgeAxis: "x", eaveY: 4, ridgeY: 7 });
  const byLayer = Object.fromEntries(report.layers.map((l) => [l.layer, l]));
  assert.ok(byLayer.eave.placed > 0, "eave course placed");
  assert.ok(byLayer.ridge.placed > 0, "ridge cap placed");
  assert.ok(byLayer.verge.placed > 0, "verge course placed");
  assert.ok(byLayer.verge.leak, "the verge layer records the sloped-line leak (reported, not hidden)");
  assert.equal(closure.ok, true);
  assert.ok(placements.every((p) => p.op === "voxel"));
});

test("TG17 composeRoofTreatment closure — TRIPS on a roof-band carve (the guard has teeth)", () => {
  const occ = gableBoxStub({ eaveY: 4, ridgeY: 7 });
  // drop the (x=3,z=2) ridge column from the roof band — an air-op the closure guard must catch.
  const carved = occupancyFromCells([...occ.cells.entries()]
    .map(([k, b]) => ({ pos: k.split(",").map(Number), block: b }))
    .filter((c) => !(c.pos[0] === 3 && c.pos[2] === 2 && c.pos[1] >= 5)));
  const v = recessClosureGuard(occ, carved, { floor: 5, eaveY: 7 });
  assert.equal(v.ok, false);
  assert.ok(v.droppedColumns.includes("3,2"));
});

test("TG18 deriveOpeningEdges/flat — reveal = perim, isArch=false (air fills the bbox)", () => {
  const flat = { kind: "window", bbox: { u0: 2, v0: 0, u1: 2, v1: 1 },
    cells: [{ au: 2, av: 0 }, { au: 2, av: 1 }], perim: [{ au: 1, av: 0 }, { au: 3, av: 0 }], lintel: [{ au: 2, av: 2 }] };
  const e = deriveOpeningEdges(flat);
  assert.equal(e.isArch, false);
  assert.deepEqual(e.reveal, flat.perim);
  assert.deepEqual(e.head, flat.lintel);
});

test("TG19 deriveOpeningEdges/arch — interior solids ⇒ isArch=true (a shaped head, not a row)", () => {
  // a 3×3 head with the two top corners SOLID (arch) → 7 air cells in a 9-cell bbox.
  const cells = [];
  for (let au = 1; au <= 3; au++) for (let av = 0; av <= 2; av++) {
    if (av === 2 && (au === 1 || au === 3)) continue; // top corners are solid voussoirs
    cells.push({ au, av });
  }
  const arch = { kind: "door", bbox: { u0: 1, v0: 0, u1: 3, v1: 2 }, cells, perim: [{ au: 0, av: 0 }], lintel: [{ au: 2, av: 3 }] };
  const e = deriveOpeningEdges(arch);
  assert.equal(e.isArch, true, "interior solids mark the arch head");
});

test("TG20 purity/serializable — roof edges round-trip JSON; composeRoofTreatment does not mutate input", () => {
  const occ = gableBoxStub({ eaveY: 4, ridgeY: 7 });
  const e = deriveRoofEdges(occ, { ridgeAxis: "x", eaveY: 4, ridgeY: 7 });
  assert.deepEqual(JSON.parse(JSON.stringify(e)), e, "roof edges are pure data");
  const before = occ.cells.size;
  composeRoofTreatment(occ, { edge: { material: "stone_bricks" } }, { ridgeAxis: "x", eaveY: 4, ridgeY: 7 });
  assert.equal(occ.cells.size, before, "input occupancy untouched");
});
