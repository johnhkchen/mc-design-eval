// Massing bookend tests (T-025-01) — the locked gray shell, proven on hand-built grids/states and
// against the REAL AJV gate (src/artifact.mjs). Pure: no image decode, no GL.
//
// NOTE: node:assert's `assert.throws()` returns undefined — never read its return value; assert the
// throw with the `(fn, /regex|Type/)` form (the gotcha already hit in this module, S1048).

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  conceptGridSource,
  mass,
  proportionsOf,
  compileMassing,
  MASSING_BLOCK,
  MASSING_STYLE,
} from "./massing.mjs";
import { isLocked, getCell, defaultCell } from "./build-state.mjs";
import { defineStage, runStages, LockViolationError, StageRejectedError } from "./index.mjs";
import { parseArtifact, assertArtifact } from "../artifact.mjs";

const FG = "minecraft:white_wool"; // any non-null block id stands for "occupied" in a fixture grid

/** Draw a silhouette: each string is a row, `#` = occupied (→ FG), `.` = air (→ null). Returns a
 *  duck-typed GridResult ({grid, n, m}) — n = row length, m = row count. */
function gridOf(rows) {
  const m = rows.length;
  const n = rows[0].length;
  const grid = rows.map((r) => [...r].map((ch) => (ch === "#" ? FG : null)));
  return { grid, n, m };
}

const TRIANGLE = [
  "..#..",
  ".###.",
  "#####",
]; // 5 wide × 3 tall; apex at top-center, full base row

// --- 1. adapter: occupancy & flip -------------------------------------------

test("conceptGridSource yields exactly the non-null cells, Y flipped by default", () => {
  const src = conceptGridSource(gridOf(TRIANGLE));
  assert.equal(src.width, 5);
  assert.equal(src.height, 3);
  const cells = [...src.occupied()];
  assert.equal(cells.length, 1 + 3 + 5); // apex + middle + base
  // Top image row (gy=0, the apex at gx=2) flips to the HIGHEST y (m-1-0 = 2).
  assert.ok(cells.some((c) => c.x === 2 && c.y === 2), "apex should sit at max y");
  // Bottom image row (gy=2) flips to y=0 — the ground.
  for (let gx = 0; gx < 5; gx++) {
    assert.ok(cells.some((c) => c.x === gx && c.y === 0), `base cell x=${gx} should sit at y=0`);
  }
});

test("conceptGridSource with flipY:false passes the image row through as y", () => {
  const cells = [...conceptGridSource(gridOf(TRIANGLE), { flipY: false }).occupied()];
  // Apex (gy=0) stays at y=0; base (gy=2) stays at y=2.
  assert.ok(cells.some((c) => c.x === 2 && c.y === 0), "apex should stay at y=0");
  assert.ok(cells.some((c) => c.x === 0 && c.y === 2), "base should stay at y=2");
});

test("an all-air grid yields no occupied cells", () => {
  const cells = [...conceptGridSource(gridOf(["...", "..."])).occupied()];
  assert.equal(cells.length, 0);
});

// --- 2. adapter: no concept-grid leak ---------------------------------------

test("the MassingSource exposes only width/height/occupied and emits only {x,y}", () => {
  const src = conceptGridSource(gridOf(TRIANGLE));
  assert.deepEqual(Object.keys(src).sort(), ["height", "occupied", "width"]);
  for (const cell of src.occupied()) {
    assert.deepEqual(Object.keys(cell).sort(), ["x", "y"]); // no block id, no grid index leaks
  }
});

// --- 3. mass: sets occupied, leaves material/relief unset --------------------

test("mass sets occupied:true on yielded cells; material/relief stay unset; rest is air", () => {
  const { state } = mass(conceptGridSource(gridOf(TRIANGLE)));
  // base row cell (0,0) is occupied with no material and zero relief
  const base = getCell(state, 0, 0);
  assert.ok(base.occupied);
  assert.equal(base.material, null);
  assert.equal(base.relief, 0);
  // a known-air cell (corner above the apex, image (0,0) → build (0,2)) is untouched (air)
  assert.equal(getCell(state, 0, 2), undefined); // never written → reads as default
  assert.deepEqual(defaultCell(), { occupied: false, material: null, relief: 0 });
});

// --- 4. mass: locks ONLY occupied (the proportion lock) ----------------------

test("mass locks exactly 'occupied'; material/relief remain unlocked; lockLog records massing", () => {
  const { state } = mass(conceptGridSource(gridOf(TRIANGLE)));
  assert.ok(isLocked(state, "occupied"));
  assert.ok(!isLocked(state, "material"));
  assert.ok(!isLocked(state, "relief"));
  assert.deepEqual(state.lockLog, [{ stage: "massing", fields: ["occupied"] }]);
});

// --- 5. S-024 lock enforcement over the shell --------------------------------

test("a later stage cannot change a locked occupied cell — write-time LockViolationError", () => {
  const { state } = mass(conceptGridSource(gridOf(TRIANGLE)));
  const erase = defineStage({ name: "erase", run: (d) => d.set(0, 0, { occupied: false }) });
  assert.throws(() => runStages(state, [erase]), LockViolationError);
});

test("a draft-bypassing stage that changes occupancy is rejected — accept-time StageRejectedError", () => {
  const { state } = mass(conceptGridSource(gridOf(TRIANGLE)));
  // A hand-built stage that bypasses the draft guard by emitting a state with (0,0) un-occupied.
  const bypass = {
    name: "bypass",
    apply(s) {
      const cells = new Map(s.cells);
      cells.set("0,0", { occupied: false, material: null, relief: 0 });
      return Object.freeze({ ...s, cells });
    },
  };
  assert.throws(() => runStages(state, [bypass]), StageRejectedError);
});

test("a later stage may still set material/relief — those fields are unlocked", () => {
  const { state } = mass(conceptGridSource(gridOf(TRIANGLE)));
  const paint = defineStage({
    name: "material",
    run: (d) => d.set(0, 0, { material: "minecraft:deepslate", relief: -1 }),
  });
  const next = runStages(state, [paint]);
  const cell = getCell(next, 0, 0);
  assert.equal(cell.material, "minecraft:deepslate");
  assert.equal(cell.relief, -1);
  assert.ok(cell.occupied); // occupancy preserved
});

// --- 6. proportions ----------------------------------------------------------

test("proportionsOf derives bounds, bbox size, aspect, occupied count, and fill", () => {
  const { state, proportions } = mass(conceptGridSource(gridOf(TRIANGLE)));
  assert.deepEqual(proportions.grid, { width: 5, height: 3 });
  assert.deepEqual(proportions.bounds, { minX: 0, minY: 0, maxX: 4, maxY: 2 });
  assert.equal(proportions.width, 5);
  assert.equal(proportions.height, 3);
  assert.equal(proportions.aspect, round2(5 / 3));
  assert.equal(proportions.occupied, 9);
  assert.equal(proportions.fill, round2(9 / 15));
  // mass returns exactly what proportionsOf derives from its state
  assert.deepEqual(proportions, proportionsOf(state));
});

test("proportionsOf on an empty state → null bounds and zeros", () => {
  // an all-air grid yields no occupied cells → an unlocked, empty massing state
  const { state } = mass(conceptGridSource(gridOf([".", "."])));
  const empty = proportionsOf(state);
  assert.equal(empty.bounds, null);
  assert.equal(empty.width, 0);
  assert.equal(empty.height, 0);
  assert.equal(empty.aspect, null);
  assert.equal(empty.occupied, 0);
  assert.equal(empty.fill, 0);
});

// --- 7. gray compile + AJV round-trip ----------------------------------------

test("compileMassing produces a single-material gray artifact that passes the live AJV gate", () => {
  const { state } = mass(conceptGridSource(gridOf(TRIANGLE)));
  const artifact = compileMassing(state);

  const result = parseArtifact(artifact);
  assert.ok(result.ok, result.ok ? "" : result.errors.join("\n"));
  assert.doesNotThrow(() => assertArtifact(artifact));

  // single material: the manifest is exactly the one gray block
  assert.deepEqual(artifact.palette.manifest, [MASSING_BLOCK]);
  assert.equal(artifact.style.name, MASSING_STYLE.name);
  // one voxel placement per occupied cell, all gray, at relief z=0
  assert.equal(artifact.placements.length, 9);
  for (const p of artifact.placements) {
    assert.equal(p.op, "voxel");
    assert.equal(p.block, MASSING_BLOCK);
    assert.equal(p.pos[2], 0);
  }
});

test("compileMassing forwards metadata/style overrides", () => {
  const { state } = mass(conceptGridSource(gridOf(TRIANGLE)));
  const artifact = compileMassing(state, { metadata: { trial_id: "massing-7", seed: 7 } });
  assert.equal(artifact.metadata.trial_id, "massing-7");
  assert.equal(artifact.metadata.seed, 7);
  assert.ok(parseArtifact(artifact).ok);
});

// --- 8. end-to-end -----------------------------------------------------------

test("grid → mass → compileMassing round-trips; placement count and Y-flip line up", () => {
  const grid = gridOf(TRIANGLE);
  const { state } = mass(conceptGridSource(grid));
  const artifact = compileMassing(state);
  assert.doesNotThrow(() => assertArtifact(artifact));

  const filled = grid.grid.flat().filter((c) => c !== null).length;
  assert.equal(artifact.placements.length, filled);

  // the apex (image top row) must compile to the maximum Y in the artifact
  const maxY = Math.max(...artifact.placements.map((p) => p.pos[1]));
  assert.equal(maxY, grid.m - 1); // 2
  const apex = artifact.placements.filter((p) => p.pos[1] === maxY);
  assert.equal(apex.length, 1); // a single apex cell at the top
  assert.equal(apex[0].pos[0], 2); // centered
});

// local mirror of the module's rounding (kept here so the test states its own expectation)
function round2(n) {
  return Math.round(n * 100) / 100;
}
