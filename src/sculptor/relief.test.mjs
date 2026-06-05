// Self-shadow relief pass tests (T-028-01) — the Z-depth craft over the LOCKED material skin, proven on
// material-locked states and against the REAL AJV gate (src/artifact.mjs). Pure: no decode, no GL.
//
// NOTE: node:assert's `assert.throws()` returns undefined — never read its return value; assert the
// throw with the `(fn, ErrorType)` form (the S1048 gotcha shared with massing/material tests).

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  relief,
  reliefStage,
  reliefMetrics,
  compileRelief,
  reliefValueFor,
  assertFeatureType,
  FeatureTypeError,
  FEATURE_RELIEF,
  RELIEF_STYLE,
} from "./relief.mjs";
import { conceptGridSource, mass } from "./massing.mjs";
import { material } from "./material.mjs";
import { getCell, isLocked } from "./build-state.mjs";
import {
  defineStage,
  runStages,
  relief as reliefFromBarrel,
  reliefMetrics as metricsFromBarrel,
  compileRelief as compileFromBarrel,
  LockViolationError,
  StageRejectedError,
} from "./index.mjs";
import { parseArtifact, assertArtifact } from "../artifact.mjs";

const FG = "minecraft:white_wool"; // any non-null block id stands for "occupied" in a fixture grid

/** ASCII silhouette → duck-typed GridResult ({grid, n, m}); `#` occupied, `.` air. */
function gridOf(rows) {
  const m = rows.length;
  const n = rows[0].length;
  const grid = rows.map((r) => [...r].map((ch) => (ch === "#" ? FG : null)));
  return { grid, n, m };
}

const TALL = ["####", "####", "####", "####", "####", "####"]; // 4 wide × 6 tall, fully occupied

/** A material-LOCKED tall fixture — relief composes on the material pass, so fixtures are painted. */
function tallMaterialed() {
  return material(mass(conceptGridSource(gridOf(TALL))).state);
}

/** Occupied cells of a state as [{x,y,cell}] (local mirror; avoids importing the spine's sorter). */
function occupiedOf(state) {
  const out = [];
  for (const [key, cell] of state.cells) {
    if (cell.occupied) {
      const [x, y] = key.split(",").map((n) => Number.parseInt(n, 10));
      out.push({ x, y, cell });
    }
  }
  return out;
}

// --- 1. vocabulary guard + value resolution --------------------------------

test("assertFeatureType passes known types and throws FeatureTypeError on an unknown one", () => {
  for (const t of Object.keys(FEATURE_RELIEF)) assert.equal(assertFeatureType(t), t);
  assert.throws(() => assertFeatureType("doorknob"), FeatureTypeError);
});

test("reliefValueFor maps inset/pop kinds and honours inset/pop overrides", () => {
  assert.equal(reliefValueFor("window"), -1); // inset default
  assert.equal(reliefValueFor("recess"), -1);
  assert.equal(reliefValueFor("trim"), 1); // pop default
  assert.equal(reliefValueFor("cornice"), 1);
  assert.equal(reliefValueFor("window", { inset: -2 }), -2);
  assert.equal(reliefValueFor("trim", { pop: 2 }), 2);
  assert.throws(() => reliefValueFor("nope"), FeatureTypeError);
});

// --- 2. detection ----------------------------------------------------------

test("default detection pops the top row as a cornice lip (+1); nothing else", () => {
  const sculpted = relief(tallMaterialed()); // no intent → detection only
  for (let x = 0; x < 4; x++) {
    assert.equal(getCell(sculpted, x, 5).relief, 1, `top (${x},5) should be a cornice lip +1`);
    for (let y = 0; y < 5; y++) assert.equal(getCell(sculpted, x, y).relief, 0, `(${x},${y}) flat`);
  }
});

test("detect:false leaves the facade flat; base:true also pops the bottom row", () => {
  const flat = relief(tallMaterialed(), { relief: { detect: false } });
  for (const { cell } of occupiedOf(flat)) assert.equal(cell.relief, 0, "no relief when detect off");

  const withBase = relief(tallMaterialed(), { relief: { base: true } });
  for (let x = 0; x < 4; x++) {
    assert.equal(getCell(withBase, x, 0).relief, 1, "base course popped");
    assert.equal(getCell(withBase, x, 5).relief, 1, "cornice still popped");
    assert.equal(getCell(withBase, x, 3).relief, 0, "mid stays flat");
  }
});

// --- 3. stage writes relief, leaves occupied/material untouched ------------

test("a marked recess gets -1; occupied and material are untouched (values preserved)", () => {
  const painted = tallMaterialed();
  const before = new Map();
  for (const { x, y, cell } of occupiedOf(painted)) before.set(`${x},${y}`, cell.material);

  const recess = (x, y) => x === 1 && (y === 2 || y === 3);
  const sculpted = relief(painted, { relief: { detect: false, features: [{ type: "recess", region: recess }] } });

  for (const { x, y, cell } of occupiedOf(sculpted)) {
    assert.ok(cell.occupied, `(${x},${y}) stays occupied`);
    assert.equal(cell.material, before.get(`${x},${y}`), `(${x},${y}) material preserved`);
    assert.equal(cell.relief, recess(x, y) ? -1 : 0, `(${x},${y}) relief`);
  }
});

// --- 4. exclusion / no buried blocks ---------------------------------------

test("recesses are carved by exclusion: one placement per cell, recessed lone voxel at z=-1", () => {
  const recess = (x, y) => x === 1 && y === 2;
  const sculpted = relief(tallMaterialed(), {
    relief: { detect: false, features: [{ type: "window", region: recess }] },
  });
  const artifact = compileRelief(sculpted);
  assert.ok(parseArtifact(artifact).ok);

  // one placement per occupied cell — no front block buried behind another
  assert.equal(artifact.placements.length, occupiedOf(sculpted).length);
  const seen = new Set();
  for (const p of artifact.placements) {
    const k = `${p.pos[0]},${p.pos[1]}`;
    assert.ok(!seen.has(k), `(${k}) must have exactly one placement (no buried block)`);
    seen.add(k);
  }
  // the recessed cell's lone placement sits at z=-1
  const recessed = artifact.placements.filter((p) => p.pos[0] === 1 && p.pos[1] === 2);
  assert.equal(recessed.length, 1);
  assert.equal(recessed[0].pos[2], -1, "recess inset by exclusion (z=-1)");
});

// --- 5. trim / cornice / lip ------------------------------------------------

test("a frame region pops +1 and an explicit horizontal cornice line is a +1 lip", () => {
  const frame = (x) => x === 0 || x === 3; // left+right edge columns = a frame
  const corniceLine = [[0, 4], [1, 4], [2, 4], [3, 4]]; // an explicit horizontal line at y=4
  const sculpted = relief(tallMaterialed(), {
    relief: {
      detect: false,
      features: [
        { type: "cornice", region: corniceLine },
        { type: "frame", region: (x) => frame(x) },
      ],
    },
  });
  for (const [x, y] of corniceLine) assert.equal(getCell(sculpted, x, y).relief, 1, "cornice lip +1");
  // frame columns (outside the cornice line) popped +1
  assert.equal(getCell(sculpted, 0, 1).relief, 1, "left frame popped");
  assert.equal(getCell(sculpted, 3, 1).relief, 1, "right frame popped");
  assert.equal(getCell(sculpted, 1, 1).relief, 0, "interior non-frame stays flat");
});

// --- 6. locks & composition (the headline AC) ------------------------------

test("relief locks 'relief'; the massing 'occupied' and material 'material' locks survive", () => {
  const sculpted = relief(tallMaterialed());
  assert.ok(isLocked(sculpted, "relief"), "relief must be locked");
  assert.ok(isLocked(sculpted, "occupied"), "the massing occupancy lock must survive");
  assert.ok(isLocked(sculpted, "material"), "the material lock must survive");
});

test("a later stage cannot re-cut a locked relief — write-time LockViolationError", () => {
  const sculpted = relief(tallMaterialed());
  const recut = defineStage({ name: "recut", run: (d) => d.set(0, 5, { relief: -1 }) }); // top was +1
  assert.throws(() => runStages(sculpted, [recut]), LockViolationError);
});

test("a draft-bypassing stage that changes relief is rejected — accept-time StageRejectedError", () => {
  const sculpted = relief(tallMaterialed());
  const bypass = {
    name: "bypass",
    apply(s) {
      const cells = new Map(s.cells);
      const c = cells.get("0,5");
      cells.set("0,5", { ...c, relief: -1 });
      return Object.freeze({ ...s, cells });
    },
  };
  assert.throws(() => runStages(sculpted, [bypass]), StageRejectedError);
});

test("relief did not loosen the prior locks — a stage changing material still throws", () => {
  const sculpted = relief(tallMaterialed());
  const repaint = defineStage({ name: "repaint", run: (d) => d.set(0, 0, { material: "minecraft:bedrock" }) });
  assert.throws(() => runStages(sculpted, [repaint]), LockViolationError);
});

test("re-writing the same relief value is an idempotent no-op (does not throw)", () => {
  const sculpted = relief(tallMaterialed()); // top row is +1
  const samePop = defineStage({ name: "same", run: (d) => d.set(0, 5, { relief: 1 }) });
  assert.doesNotThrow(() => runStages(sculpted, [samePop]));
});

// --- 7. the "less flat" metric (AC #3) -------------------------------------

test("reliefMetrics is all-zero on massing-only and material-only, and >0 after relief", () => {
  const massed = mass(conceptGridSource(gridOf(TALL))).state;
  const painted = material(massed);
  const m0 = reliefMetrics(massed);
  const m1 = reliefMetrics(painted);
  assert.equal(m0.coverage, 0, "massing-only is flat");
  assert.equal(m0.variance, 0);
  assert.equal(m1.coverage, 0, "material-only is still flat");
  assert.equal(m1.variance, 0);

  const sculpted = relief(painted, { relief: { features: [{ type: "window", region: (x, y) => x === 1 && y === 2 }] } });
  const m2 = reliefMetrics(sculpted);
  assert.ok(m2.coverage > m1.coverage, "relief raises coverage (measurably less flat)");
  assert.ok(m2.variance > m1.variance, "relief raises Z-variance (measurably less flat)");
  assert.ok(m2.range >= 1, "a non-flat facade spans ≥1 in Z");
});

// --- 8. chain + AJV round-trip ---------------------------------------------

test("massing → material → relief compiles to an artifact that passes the live AJV gate", () => {
  const sculpted = relief(tallMaterialed(), {
    relief: { features: [{ type: "window", region: (x, y) => x === 1 && (y === 2 || y === 3) }] },
  });
  const artifact = compileRelief(sculpted);

  const result = parseArtifact(artifact);
  assert.ok(result.ok, result.ok ? "" : result.errors.join("\n"));
  assert.doesNotThrow(() => assertArtifact(artifact));

  assert.equal(artifact.style.name, RELIEF_STYLE.name);
  assert.equal(artifact.placements.length, occupiedOf(sculpted).length);
  // negative Z is present and schema-legal (the recess)
  assert.ok(artifact.placements.some((p) => p.pos[2] === -1), "a recess is at z=-1");
  assert.ok(artifact.placements.some((p) => p.pos[2] === 1), "a cornice lip is at z=+1");
});

// --- 9. determinism --------------------------------------------------------

test("relief is deterministic: two runs over the same state agree cell-for-cell", () => {
  const painted = tallMaterialed();
  const a = relief(painted);
  const b = relief(painted);
  for (const { x, y, cell } of occupiedOf(a)) {
    assert.equal(getCell(b, x, y).relief, cell.relief, `(${x},${y}) relief must be stable`);
  }
});

// --- 10. intent precedence & barrel ----------------------------------------

test("an explicit feature claims a cell before detection can (precedence)", () => {
  // mark the top-left cell as a window (-1); detection would otherwise pop it +1 as a cornice
  const sculpted = relief(tallMaterialed(), {
    relief: { features: [{ type: "window", region: [[0, 5]] }] }, // detect defaults on
  });
  assert.equal(getCell(sculpted, 0, 5).relief, -1, "explicit window wins over the cornice detection");
  assert.equal(getCell(sculpted, 1, 5).relief, 1, "the rest of the top row is still cornice +1");
});

test("the public surface is re-exported from index.mjs and behaves identically", () => {
  assert.equal(typeof reliefFromBarrel, "function");
  assert.equal(typeof metricsFromBarrel, "function");
  assert.equal(typeof compileFromBarrel, "function");
  const painted = tallMaterialed();
  assert.deepEqual(
    occupiedOf(reliefFromBarrel(painted)).map((c) => c.cell.relief),
    occupiedOf(relief(painted)).map((c) => c.cell.relief),
  );
});
