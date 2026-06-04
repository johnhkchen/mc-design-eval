// Unit suite for placement-primitive expansion (T-001-02, AC-4).
// node:test + node:assert/strict — no test-framework dependency.
// Run: node --test src/   (or `npm test`)

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { expandPlacement, expandArtifact, voxelKey } from "./expand.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

const keysOf = (voxels) => new Set(voxels.map((v) => voxelKey(v.pos)));
const has = (voxels, pos) => keysOf(voxels).has(voxelKey(pos));

// --- AC-1: per-primitive geometry ------------------------------------------

test("voxel expands to a single block and carries state through", () => {
  const v = expandPlacement({
    op: "voxel",
    pos: [3, 1, 0],
    block: "minecraft:stone_brick_stairs",
    state: { facing: "north", half: "bottom" },
  });
  assert.equal(v.length, 1);
  assert.deepEqual(v[0].pos, [3, 1, 0]);
  assert.equal(v[0].block, "minecraft:stone_brick_stairs");
  assert.deepEqual(v[0].state, { facing: "north", half: "bottom" });
});

test("stateless voxel has no state key", () => {
  const [v] = expandPlacement({ op: "voxel", pos: [0, 0, 0], block: "minecraft:stone" });
  assert.equal("state" in v, false);
});

test("fill expands to the solid cuboid volume", () => {
  const v = expandPlacement({ op: "fill", from: [0, 0, 0], to: [2, 1, 3], block: "minecraft:stone" });
  assert.equal(v.length, 3 * 2 * 4); // (dx+1)(dy+1)(dz+1)
  assert.ok(has(v, [0, 0, 0]) && has(v, [2, 1, 3]) && has(v, [1, 1, 2]));
});

test("fill is invariant to from/to corner order", () => {
  const fwd = expandPlacement({ op: "fill", from: [0, 0, 0], to: [2, 1, 3], block: "minecraft:stone" });
  const rev = expandPlacement({ op: "fill", from: [2, 1, 3], to: [0, 0, 0], block: "minecraft:stone" });
  assert.deepEqual(keysOf(fwd), keysOf(rev));
});

test("box expands to a hollow shell (corners in, interior out)", () => {
  const v = expandPlacement({ op: "box", from: [0, 0, 0], to: [6, 4, 6], block: "minecraft:stone_bricks" });
  // shell of a 7x5x7 box = total - interior = 7*5*7 - 5*3*5 = 245 - 75 = 170
  assert.equal(v.length, 7 * 5 * 7 - 5 * 3 * 5);
  assert.ok(has(v, [0, 0, 0])); // corner
  assert.ok(has(v, [3, 0, 3])); // floor face
  assert.equal(has(v, [3, 2, 3]), false); // interior absent
});

test("degenerate flat box is a solid plane", () => {
  const v = expandPlacement({ op: "box", from: [0, 5, 0], to: [3, 5, 3], block: "minecraft:stone" });
  assert.equal(v.length, 4 * 4); // every cell touches the y face
  assert.ok(has(v, [1, 5, 1])); // "interior" of the plane still present
});

test("1x1x1 box is a single voxel", () => {
  const v = expandPlacement({ op: "box", from: [2, 2, 2], to: [2, 2, 2], block: "minecraft:stone" });
  assert.equal(v.length, 1);
  assert.deepEqual(v[0].pos, [2, 2, 2]);
});

test("axis-aligned line is inclusive (n+1 collinear voxels)", () => {
  const v = expandPlacement({ op: "line", from: [0, 4, 0], to: [6, 4, 0], block: "minecraft:iron_block" });
  assert.equal(v.length, 7);
  assert.ok(v.every((x) => x.pos[1] === 4 && x.pos[2] === 0));
  assert.ok(has(v, [0, 4, 0]) && has(v, [6, 4, 0]));
});

test("2-D uniform diagonal line", () => {
  const v = expandPlacement({ op: "line", from: [0, 0, 0], to: [3, 0, 3], block: "minecraft:stone" });
  assert.equal(v.length, 4);
  assert.ok(has(v, [0, 0, 0]) && has(v, [1, 0, 1]) && has(v, [2, 0, 2]) && has(v, [3, 0, 3]));
});

test("3-D uniform diagonal line", () => {
  const v = expandPlacement({ op: "line", from: [0, 0, 0], to: [2, 2, 2], block: "minecraft:stone" });
  assert.equal(v.length, 3);
  assert.ok(has(v, [0, 0, 0]) && has(v, [1, 1, 1]) && has(v, [2, 2, 2]));
});

test("line is invariant to from/to order", () => {
  const fwd = expandPlacement({ op: "line", from: [0, 4, 0], to: [6, 4, 0], block: "minecraft:iron_block" });
  const rev = expandPlacement({ op: "line", from: [6, 4, 0], to: [0, 4, 0], block: "minecraft:iron_block" });
  assert.deepEqual(keysOf(fwd), keysOf(rev));
});

// --- D5/D10: guard paths throw located errors -------------------------------

test("non-uniform line is rejected", () => {
  assert.throws(
    () => expandPlacement({ op: "line", from: [0, 0, 0], to: [4, 0, 2], block: "minecraft:stone" }),
    /not a straight lattice line/
  );
});

test("unknown op is rejected", () => {
  assert.throws(
    () => expandPlacement({ op: "sphere", pos: [0, 0, 0], block: "minecraft:stone" }),
    /unknown placement op "sphere"/
  );
});

// --- AC-2: mixed artifact normalizes to one deduplicated set ----------------

test("mixed artifact (voxel + fill + box + line) dedups to the coordinate union", () => {
  const artifact = {
    placements: [
      { op: "fill", from: [0, 0, 0], to: [2, 0, 2], block: "minecraft:stone" }, // 9 cells, y=0
      { op: "box", from: [0, 0, 0], to: [2, 2, 2], block: "minecraft:stone_bricks" }, // shell of 3^3
      { op: "line", from: [0, 1, 0], to: [0, 1, 2], block: "minecraft:iron_block" }, // 3 cells (already on box edge)
      { op: "voxel", pos: [1, 1, 1], block: "minecraft:glowstone" }, // interior, unique
    ],
  };
  const v = expandArtifact(artifact);
  // Compute the expected union of coordinate keys independently.
  const expected = new Set();
  for (let y = 0; y <= 0; y++) for (let z = 0; z <= 2; z++) for (let x = 0; x <= 2; x++) expected.add(`${x},${y},${z}`);
  for (let y = 0; y <= 2; y++) for (let z = 0; z <= 2; z++) for (let x = 0; x <= 2; x++) {
    if (x === 0 || x === 2 || y === 0 || y === 2 || z === 0 || z === 2) expected.add(`${x},${y},${z}`);
  }
  expected.add("0,1,0"); expected.add("0,1,1"); expected.add("0,1,2"); // line
  expected.add("1,1,1"); // interior voxel
  assert.equal(v.length, expected.size);
  assert.deepEqual(keysOf(v), expected);
});

// --- AC-3: overlap rule, determinism, order-independence --------------------

test("overlap resolves by last-writer-wins: block AND state replace whole", () => {
  const artifact = {
    placements: [
      { op: "fill", from: [0, 0, 0], to: [1, 0, 0], block: "minecraft:stone", state: { a: "1" } },
      { op: "voxel", pos: [1, 0, 0], block: "minecraft:iron_block", state: { facing: "north" } },
    ],
  };
  const v = expandArtifact(artifact);
  const shared = v.find((x) => voxelKey(x.pos) === "1,0,0");
  assert.equal(shared.block, "minecraft:iron_block"); // later wins
  assert.deepEqual(shared.state, { facing: "north" }); // state fully replaced, not merged
  assert.equal("a" in shared.state, false);
});

test("a later stateless placement strips an earlier state at the shared cell", () => {
  const artifact = {
    placements: [
      { op: "voxel", pos: [0, 0, 0], block: "minecraft:stone", state: { half: "top" } },
      { op: "voxel", pos: [0, 0, 0], block: "minecraft:stone" },
    ],
  };
  const [v] = expandArtifact(artifact);
  assert.equal("state" in v, false);
});

test("expansion is deterministic (byte-identical across runs, incl. order)", () => {
  const artifact = {
    placements: [
      { op: "box", from: [0, 0, 0], to: [4, 3, 4], block: "minecraft:stone_bricks" },
      { op: "fill", from: [1, 0, 1], to: [3, 0, 3], block: "minecraft:smooth_stone" },
      { op: "line", from: [0, 3, 0], to: [4, 3, 4], block: "minecraft:iron_block" },
    ],
  };
  assert.equal(JSON.stringify(expandArtifact(artifact)), JSON.stringify(expandArtifact(artifact)));
});

test("output is canonical (sorted ascending y, then z, then x)", () => {
  const v = expandArtifact({ placements: [{ op: "fill", from: [0, 0, 0], to: [2, 1, 2], block: "minecraft:stone" }] });
  for (let i = 1; i < v.length; i++) {
    const a = v[i - 1].pos, b = v[i].pos;
    const before = a[1] < b[1] || (a[1] === b[1] && (a[2] < b[2] || (a[2] === b[2] && a[0] < b[0])));
    assert.ok(before, `voxel ${i - 1} ${a} should sort before ${b}`);
  }
});

test("non-overlapping placements are order-independent", () => {
  const a = { placements: [
    { op: "fill", from: [0, 0, 0], to: [1, 0, 1], block: "minecraft:stone" },
    { op: "voxel", pos: [5, 5, 5], block: "minecraft:glowstone" },
  ] };
  const b = { placements: [a.placements[1], a.placements[0]] }; // reversed order
  assert.deepEqual(expandArtifact(a), expandArtifact(b));
});

// --- Integration: the realistic T-001-01 fixture expands sanely -------------

test("the valid-industrial-house fixture expands to a sane voxel set", () => {
  const path = resolve(HERE, "..", "schema", "examples", "valid-industrial-house.json");
  const artifact = JSON.parse(readFileSync(path, "utf8"));
  const v = expandArtifact(artifact);
  assert.ok(v.length > 0);
  // the fill floor [0,0,0]->[6,0,6] = 49 cells, all present at y=0
  const floor = v.filter((x) => x.pos[1] === 0);
  assert.equal(floor.length, 49);
  // the stateful stair voxel kept its orientation
  const stair = v.find((x) => x.block === "minecraft:stone_brick_stairs");
  assert.deepEqual(stair.state, { facing: "north", half: "bottom" });
});
