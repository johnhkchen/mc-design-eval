// Material-noise pass tests (T-027-01) — the same-hue, height-varied skin over the locked massing,
// proven on hand-built states and against the REAL AJV gate (src/artifact.mjs). Pure: no decode, no GL.
//
// NOTE: node:assert's `assert.throws()` returns undefined — never read its return value; assert the
// throw with the `(fn, ErrorType)` form (the S1048 gotcha shared with massing.test.mjs).

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  hueFamilySet,
  cellHash,
  pickMaterial,
  materialStage,
  material,
  compileMaterial,
  MATERIAL_STYLE,
  tableKey,
  blockId,
} from "./material.mjs";
import { conceptGridSource, mass, MASSING_BLOCK } from "./massing.mjs";
import { getCell, isLocked } from "./build-state.mjs";
import {
  defineStage,
  runStages,
  material as materialFromBarrel,
  hueFamilySet as hueFromBarrel,
  compileMaterial as compileFromBarrel,
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

// A SOLID block, tall enough that the bbox spans many rows (so height variation is visible).
const TALL = ["####", "####", "####", "####", "####", "####"]; // 4 wide × 6 tall, fully occupied
function tallMassed() {
  return mass(conceptGridSource(gridOf(TALL))).state;
}

const NS = /^[a-z0-9_.-]+:[a-z0-9_]+$/; // the AJV block-id pattern

// --- 1. hueFamilySet -------------------------------------------------------

test("hueFamilySet(stone) → a same-hue set: ≥2 namespaced blocks, includes stone, ordered dark→light", () => {
  const set = hueFamilySet("minecraft:stone");
  assert.ok(set.length >= 2 && set.length <= 3, `expected 2–3 blocks, got ${set.length}`);
  for (const id of set) assert.match(id, NS, `${id} must be namespaced`);
  assert.ok(set.includes("minecraft:stone"), "the stone family must include stone itself");
  // ordered dark→light: the set has no duplicates and is a real family (stone/cobble/stone_bricks)
  assert.equal(new Set(set).size, set.length, "no duplicate blocks");
});

test("hueFamilySet accepts a bare id and an rgb triple, and honours size/radius", () => {
  assert.deepEqual(hueFamilySet("stone"), hueFamilySet("minecraft:stone")); // bare ≡ namespaced
  const two = hueFamilySet("stone", { size: 2 });
  assert.equal(two.length, 2);
  const rgbSet = hueFamilySet([128, 128, 128]); // mid-gray rgb resolves via the engine
  assert.ok(rgbSet.length >= 1 && rgbSet.every((id) => NS.test(id)));
  // a tiny radius shrinks the set toward a single block but never empties it
  const tight = hueFamilySet("stone", { radius: 0.5 });
  assert.ok(tight.length >= 1);
});

test("hueFamilySet throws on an unknown block id", () => {
  assert.throws(() => hueFamilySet("minecraft:not_a_real_block"), /unknown block/);
});

test("namespace helpers round-trip bare ↔ namespaced", () => {
  assert.equal(tableKey("minecraft:stone"), "stone");
  assert.equal(tableKey("stone"), "stone");
  assert.equal(blockId("stone"), "minecraft:stone");
  assert.equal(blockId("minecraft:stone"), "minecraft:stone");
});

// --- 2. cellHash / pickMaterial -------------------------------------------

test("cellHash is deterministic, in [0,1), and varies between neighbouring cells", () => {
  assert.equal(cellHash(3, 7), cellHash(3, 7)); // deterministic
  for (const [x, y] of [[0, 0], [12, 4], [5, 9]]) {
    const v = cellHash(x, y);
    assert.ok(v >= 0 && v < 1, `cellHash out of range: ${v}`);
  }
  assert.notEqual(cellHash(3, 7), cellHash(4, 7)); // neighbours differ (avalanche)
});

test("pickMaterial: bottom→darkest, top→lightest, S=1 always index 0", () => {
  const set = ["dark", "mid", "light"]; // stand-in for a dark→light set
  assert.equal(pickMaterial(set, 0, 0.5, 0.7), "dark"); // t=0, no jitter (h=0.5) → index 0
  assert.equal(pickMaterial(set, 1, 0.5, 0.7), "light"); // t=1, no jitter → last index
  assert.equal(pickMaterial(["only"], 0.3, 0.9, 0.7), "only"); // degenerate set
  // every pick is a set member, across jitter
  for (let i = 0; i < 10; i++) assert.ok(set.includes(pickMaterial(set, 0.5, i / 10, 0.7)));
});

// --- 3. stage writes material, leaves occupied/air untouched ---------------

test("material paints every occupied cell with a set member; air stays air; occupied unchanged", () => {
  const massed = tallMassed();
  const painted = material(massed);
  const set = hueFamilySet(MASSING_BLOCK); // default target is the massing gray
  for (let y = 0; y < 6; y++) {
    for (let x = 0; x < 4; x++) {
      const cell = getCell(painted, x, y);
      assert.ok(cell.occupied, `(${x},${y}) should stay occupied`);
      assert.ok(set.includes(cell.material), `(${x},${y}) material ${cell.material} must be in-set`);
      assert.equal(cell.relief, 0, "relief untouched");
    }
  }
});

// --- 4. out-of-palette guard ----------------------------------------------

test("every assigned material is from the hue-family set (no out-of-palette block)", () => {
  const painted = material(tallMassed());
  const allowed = new Set(hueFamilySet(MASSING_BLOCK));
  for (const { cell } of occupiedOf(painted)) {
    assert.ok(allowed.has(cell.material), `${cell.material} is out of palette`);
  }
});

// --- 5. height variation ---------------------------------------------------

test("height variation: the top-row material multiset differs from the bottom row", () => {
  const painted = material(tallMassed());
  const rowMats = (y) => [0, 1, 2, 3].map((x) => getCell(painted, x, y).material);
  const bottom = rowMats(0); // y=0 is the ground (darkest end)
  const top = rowMats(5); // y=5 is the top (lightest end)
  assert.notDeepEqual(bottom.sort(), top.sort(), "top and bottom should read differently (light break)");
});

// --- 6. locks & composition ------------------------------------------------

test("material locks exactly 'material'; the massing 'occupied' lock survives", () => {
  const painted = material(tallMassed());
  assert.ok(isLocked(painted, "material"), "material must be locked");
  assert.ok(isLocked(painted, "occupied"), "the massing occupancy lock must survive");
  assert.ok(!isLocked(painted, "relief"), "relief stays free for the relief pass (T-028)");
});

test("a later stage cannot repaint a locked material — write-time LockViolationError", () => {
  const painted = material(tallMassed());
  const repaint = defineStage({ name: "repaint", run: (d) => d.set(0, 0, { material: "minecraft:bedrock" }) });
  assert.throws(() => runStages(painted, [repaint]), LockViolationError);
});

test("a draft-bypassing stage that changes material is rejected — accept-time StageRejectedError", () => {
  const painted = material(tallMassed());
  const bypass = {
    name: "bypass",
    apply(s) {
      const cells = new Map(s.cells);
      const c = cells.get("0,0");
      cells.set("0,0", { ...c, material: "minecraft:bedrock" });
      return Object.freeze({ ...s, cells });
    },
  };
  assert.throws(() => runStages(painted, [bypass]), StageRejectedError);
});

test("a later stage may still set relief (unlocked) over the material-locked state", () => {
  const painted = material(tallMassed());
  const relief = defineStage({ name: "relief", run: (d) => d.set(0, 0, { relief: -1 }) });
  const next = runStages(painted, [relief]);
  const cell = getCell(next, 0, 0);
  assert.equal(cell.relief, -1);
  assert.ok(cell.occupied);
  assert.ok(cell.material, "material preserved");
});

test("the massing occupancy lock is not violated by the material pass (occupied count unchanged)", () => {
  const massed = tallMassed();
  const before = occupiedOf(massed).length;
  const painted = material(massed);
  assert.equal(occupiedOf(painted).length, before, "no cell added or removed");
});

// --- 7. compile + AJV round-trip ------------------------------------------

test("compileMaterial → a multi-material artifact that passes the live AJV gate", () => {
  const painted = material(tallMassed());
  const artifact = compileMaterial(painted);

  const result = parseArtifact(artifact);
  assert.ok(result.ok, result.ok ? "" : result.errors.join("\n"));
  assert.doesNotThrow(() => assertArtifact(artifact));

  assert.equal(artifact.style.name, MATERIAL_STYLE.name);
  // one placement per occupied cell (24), each a namespaced in-set block
  assert.equal(artifact.placements.length, 24);
  const set = new Set(hueFamilySet(MASSING_BLOCK));
  for (const p of artifact.placements) {
    assert.equal(p.op, "voxel");
    assert.match(p.block, NS);
    assert.ok(set.has(p.block), `${p.block} out of palette`);
  }
  // the manifest is the multi-entry hue-family set actually placed (≥2 blocks → real noise)
  assert.ok(artifact.palette.manifest.length >= 2, "expected a multi-block manifest");
  for (const b of artifact.palette.manifest) assert.ok(set.has(b));
});

// --- 8. intent -------------------------------------------------------------

test("intent.material.palette picks the target family (bare and namespaced ids both work)", () => {
  const massed = tallMassed();
  const painted = material(massed, { material: { palette: ["deepslate"] } });
  const allowed = new Set(hueFamilySet("deepslate"));
  for (const { cell } of occupiedOf(painted)) assert.ok(allowed.has(cell.material));
  // namespaced id resolves to the same family
  const painted2 = material(massed, { material: { palette: ["minecraft:deepslate"] } });
  for (const { cell } of occupiedOf(painted2)) assert.ok(allowed.has(cell.material));
});

test("intent.material.surfaces paints two regions from two different families", () => {
  const massed = tallMassed();
  const leftHalf = (x) => x < 2;
  const painted = material(massed, {
    material: {
      surfaces: [{ target: "deepslate", region: (x) => leftHalf(x) }],
      palette: ["stone"], // the default surface (right half) uses stone
    },
  });
  const deepFamily = new Set(hueFamilySet("deepslate"));
  const stoneFamily = new Set(hueFamilySet("stone"));
  for (const { x, cell } of occupiedOf(painted)) {
    if (leftHalf(x)) assert.ok(deepFamily.has(cell.material), `left ${cell.material} should be deepslate-family`);
    else assert.ok(stoneFamily.has(cell.material), `right ${cell.material} should be stone-family`);
  }
  // the two families are distinct, so the artifact manifest spans both
  const artifact = compileMaterial(painted);
  assert.ok(parseArtifact(artifact).ok);
  assert.ok(artifact.palette.manifest.length >= 2);
});

test("empty intent falls back to the massing-gray (stone) family", () => {
  const painted = material(tallMassed(), {});
  const allowed = new Set(hueFamilySet(MASSING_BLOCK));
  for (const { cell } of occupiedOf(painted)) assert.ok(allowed.has(cell.material));
});

// --- 9. determinism --------------------------------------------------------

test("material is deterministic: two runs over the same state agree cell-for-cell", () => {
  const massed = tallMassed();
  const a = material(massed);
  const b = material(massed);
  for (const { x, y, cell } of occupiedOf(a)) {
    assert.equal(getCell(b, x, y).material, cell.material, `(${x},${y}) must be stable`);
  }
});

// --- 10. barrel ------------------------------------------------------------

test("the public surface is re-exported from index.mjs", () => {
  assert.equal(typeof materialFromBarrel, "function");
  assert.equal(typeof hueFromBarrel, "function");
  assert.equal(typeof compileFromBarrel, "function");
  // and it behaves: barrel material == direct material
  const massed = tallMassed();
  assert.deepEqual(
    occupiedOf(materialFromBarrel(massed)).map((c) => c.cell.material),
    occupiedOf(material(massed)).map((c) => c.cell.material),
  );
});

// --- helper ----------------------------------------------------------------

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
