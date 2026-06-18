// WR — wall-relief core (T-195-01, story S-195, epic E-51). Proves the recolor-then-composeTreatment
// hand builds REAL proud relief (not recolor): the recolor-first defeats surfaceRelief's idempotence
// no-op so the quoin emits, the field/dressing contrast is enforced fail-loud, and closure holds.

import { test } from "node:test";
import assert from "node:assert/strict";

import { occupancyFromCells } from "./occupancy.mjs";
import { composeTreatment } from "./treatment-grammar.mjs";
import { recolorWallField, wallReliefSpec, buildWallRelief } from "./wall-relief.mjs";

const FLOOR = 0, EAVE = 3;
const isCorner = (x, z) => (x === 0 || x === 4) && (z === 0 || z === 4);

/** A hollow 5×5 perimeter shell, y 0..3: cobblestone corner columns, dark `deepslate_bricks` field,
 *  one kept `dark_oak_log` frame cube, and one shaped (fixture) cell that must pass the recolor through. */
function cobbleCorneredBox() {
  const cells = [];
  for (let x = 0; x <= 4; x++) for (let z = 0; z <= 4; z++) {
    if (x !== 0 && x !== 4 && z !== 0 && z !== 4) continue; // perimeter only (hollow)
    for (let y = FLOOR; y <= EAVE; y++) {
      let block = isCorner(x, z) ? "cobblestone" : "deepslate_bricks";
      let form;
      if (x === 2 && z === 0 && y === 1) block = "dark_oak_log";      // the timber frame (kept)
      if (x === 2 && z === 0 && y === 2) { block = "oak_stairs"; form = "fixture"; } // shaped (untouched)
      cells.push({ pos: [x, y, z], block, form });
    }
  }
  return occupancyFromCells(cells);
}

const PACK = { palette: [{ role: "wall.field", block: "stone_bricks" }, { role: "wall.dressing", block: "cobblestone" }] };
const PROGRAM = { masses: [{ id: "m0", walls: { ground: { role: "wall.field" }, dressing: { role: "wall.dressing" } } }] };

const digest = (occ) => [...occ.cells.entries()].map(([k, b]) => `${k}|${b}`).sort().join("\n");

test("WR1 recolorWallField — field cubes → fieldBlock; keep + shaped cells untouched", () => {
  const occ = cobbleCorneredBox();
  const { occ: out, recolored } = recolorWallField(occ, { fieldBlock: "stone_bricks", floor: FLOOR, eaveY: EAVE });
  assert.ok(recolored > 0, "some field cubes recolored");
  // every in-band cube is now stone_bricks EXCEPT the kept dark-oak frame and the shaped cell.
  assert.equal(out.block(0, 0, 0), "stone_bricks", "a cobblestone corner cube is cleared to the field");
  assert.equal(out.block(2, 1, 0), "dark_oak_log", "the kept timber frame survives");
  assert.equal(out.block(2, 2, 0), "oak_stairs", "the shaped (fixture) cell is untouched");
  assert.ok(out.forms.has("2,2,0"), "the shaped cell keeps its form");
});

test("WR2 wallReliefSpec — shape: recess field, corner quoins, base on, top/opening off by default", () => {
  const spec = wallReliefSpec({ fieldBlock: "stone_bricks", dressBlock: "cobblestone", floor: FLOOR, eaveY: EAVE });
  assert.equal(spec.field.recess, true);
  assert.equal(spec.edges.corners.material, "cobblestone");
  assert.equal(spec.edges.corners.amplitude.run, EAVE - FLOOR + 1);
  assert.ok(spec.base, "base plinth present by default");
  assert.equal(spec.edges.top, undefined, "no cornice by default (restraint)");
  assert.equal(spec.edges.opening, undefined, "WALL-only — no opening dressing");
  assert.deepEqual(JSON.parse(JSON.stringify(spec)), spec, "spec is JSON-round-trippable (pure data)");
});

test("WR3 wallReliefSpec — fail-loud when dress === field (a same-material relief no-ops)", () => {
  assert.throws(
    () => wallReliefSpec({ fieldBlock: "stone_bricks", dressBlock: "stone_bricks", floor: FLOOR, eaveY: EAVE }),
    /same-material relief/,
  );
});

test("WR4 the crux — recolor-first makes the proud quoin EMIT where the raw box no-ops", () => {
  const occ = cobbleCorneredBox();
  const spec = wallReliefSpec({ fieldBlock: "stone_bricks", dressBlock: "cobblestone", floor: FLOOR, eaveY: EAVE });
  // raw box: corners are already cobblestone == the quoin material → surfaceRelief's idempotence rule
  // skips them → proudCells = 0 (the articulate_walls no-op the climb hit).
  const raw = composeTreatment(occ, spec, { floor: FLOOR, eaveY: EAVE });
  assert.equal(raw.report.byLayer.corners.placed, 0, "quoin no-ops on already-cobblestone corners");
  // buildWallRelief recolors the corners to the field first → the proud cobblestone quoin now emits.
  const built = buildWallRelief(occ, { program: PROGRAM, pack: PACK, floor: FLOOR, eaveY: EAVE });
  assert.ok(built.report.byLayer.corners.placed > 0, "proud quoins emit after the recolor-first");
  assert.equal(built.materials.fieldBlock, "stone_bricks");
  assert.equal(built.materials.dressBlock, "cobblestone");
});

test("WR5 closure not regressed — additive proud relief holds the recess-by-exclusion guard", () => {
  const built = buildWallRelief(cobbleCorneredBox(), { program: PROGRAM, pack: PACK, floor: FLOOR, eaveY: EAVE });
  assert.equal(built.closure.ok, true, "recessClosureGuard ok (no reopened holes)");
  assert.deepEqual(built.closure.droppedColumns, [], "no wall-band column dropped");
});

test("WR6 purity — input not mutated; byte-stable output", () => {
  const occ = cobbleCorneredBox();
  const before = digest(occ);
  const a = buildWallRelief(occ, { program: PROGRAM, pack: PACK, floor: FLOOR, eaveY: EAVE });
  const b = buildWallRelief(occ, { program: PROGRAM, pack: PACK, floor: FLOOR, eaveY: EAVE });
  assert.equal(digest(occ), before, "input occupancy not mutated");
  assert.equal(digest(a.occ), digest(b.occ), "same input → byte-identical output");
});
