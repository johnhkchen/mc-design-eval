// SPDX-License-Identifier: AGPL-3.0-or-later
// Calls each h3 helper once on a small grid. Every cell a call changes must lie in the footprint box it was given.
// Run: node vocab/test-h3.mjs
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h3 from "./h3.mjs";

const SIZE = [48, 32, 48];
const g = new Grid(SIZE, { dataVersion: 3955 }); // Minecraft 1.21.1
g.fill([0, 0, 0], [47, 0, 47], "smooth_stone");
g.fill([0, 1, 0], [24, 6, 24], "bricks"); // fort wall, for the port and gallery
g.set(33, 3, 30, "lantern", { hanging: "false" }); // a lamp above the rock column at x33
g.set(30, 11, 30, "smooth_sandstone"); // a block above the hanging lantern
g.set(39, 4, 30, "bricks"); // blocks the lane for the refused lamp

const snapshot = () => {
  const m = new Map();
  for (let x = 0; x < SIZE[0]; x++) for (let y = 0; y < SIZE[1]; y++) for (let z = 0; z < SIZE[2]; z++) m.set([x, y, z], JSON.stringify(g.get(x, y, z) ?? null));
  return m;
};
const inside = ([x, y, z], [x0, y0, z0, x1, y1, z1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;

// Runs one helper call, checks every changed cell is inside its footprint, returns the call's count.
function step(name, box, call) {
  const before = snapshot();
  const n = call();
  let changed = 0;
  for (const [pos, was] of before) {
    if (JSON.stringify(g.get(...pos) ?? null) === was) continue;
    changed++;
    assert.ok(inside(pos, box), `${name} wrote outside its footprint at ${pos}`);
  }
  console.log(`ok ${name}: ${n} writes, ${changed} cells changed`);
  return n;
}
const block = (x, y, z) => g.blockAt(x, y, z).replace("minecraft:", "");
const state = (x, y, z) => g.get(x, y, z)?.state ?? {};

// Embrasure: 2 cells across on the north front at z=5; the wall is solid, so only carve cuts it.
assert.equal(step("embrasure refuses solid wall without carve", [0, 0, 0, 0, 0, 0], () => h3.embrasure(g, 10, 5, "north", 1)), 0);
step("embrasure", [9, 1, 5, 12, 6, 6], () => h3.embrasure(g, 10, 5, "north", 2, { carve: true }));
assert.equal(block(10, 1, 5), "brick_slab");
assert.equal(block(10, 2, 5), "air");
assert.equal(block(10, 1, 6), "black_concrete");
assert.deepEqual(state(9, 2, 5), { facing: "east", half: "top", shape: "straight" });
assert.deepEqual(state(12, 2, 5), { facing: "west", half: "top", shape: "straight" });

// Gallery: run x4..7 on the north face at z=15; openings at x5 and x7; x6 is a pier between two openings.
step("gallery", [4, 1, 15, 8, 6, 16], () => h3.gallery(g, { at: 15, from: 4, to: 7 }, "north", { carve: true }));
assert.equal(block(5, 1, 15), "brick_slab");
assert.equal(block(5, 1, 16), "brick_slab");
assert.equal(block(6, 2, 15), "bricks"); // shared pier stays wall
assert.deepEqual(state(4, 2, 15), { facing: "east", half: "top", shape: "straight" });
assert.deepEqual(state(8, 2, 15), { facing: "west", half: "top", shape: "straight" });

// Rock cluster: a rock at x33 under the lantern is skipped.
step("rockCluster", [30, 1, 30, 33, 2, 31], () => h3.rockCluster(g, [[30, 30], [31, 30, 2], [30, 31], [33, 30]], 1));
assert.equal(block(33, 1, 30), "air");
assert.ok(["andesite", "cobblestone", "mossy_cobblestone"].includes(block(31, 2, 30)), "the 2-high rock is one of the rock blocks");

// Cross beam over the pylon gap.
assert.equal(step("crossBeam", [8, 26, 8, 22, 29, 12], () => h3.crossBeam(g, 8, 12, { x0: 8, x1: 22, y0: 26, y1: 29 }, { carve: false })), 15 * 4 * 5);
assert.equal(block(8, 26, 8), "smooth_sandstone");

// Anchorage panel on the west face (x=0), panel z18..20, inner recess z18..19 at y5..9.
step("anchoragePanel", [0, 3, 18, 2, 11, 20], () => h3.anchoragePanel(g, "west", 0, { spans: [[18, 20]], inner: [[18, 19]], y: [3, 11], innerY: [5, 9] }, { carve: true }));
assert.equal(block(0, 3, 18), "air");
assert.equal(block(1, 3, 18), "smooth_sandstone");
assert.equal(block(1, 5, 18), "air");
assert.equal(block(2, 5, 18), "smooth_sandstone");
assert.equal(block(2, 5, 20), "bricks"); // outside the inner recess, depth 2 is untouched

// Deck lamp: centre post, then an outer post with its clear lane, then one refused for a blocked lane.
step("deckLamp", [30, 3, 30, 30, 5, 30], () => h3.deckLamp(g, 30, 30, 2));
assert.equal(block(30, 3, 30), "orange_concrete");
assert.equal(block(30, 4, 30), "red_concrete");
assert.deepEqual(state(30, 5, 30), { hanging: "false" });
step("deckLamp outer", [34, 3, 30, 34, 5, 30], () => h3.deckLamp(g, 34, 30, 2, true, { lane: 1 }));
assert.equal(h3.deckLamp(g, 40, 30, 2, true, { lane: -1 }), 0);
assert.equal(block(40, 3, 30), "air");

// Cable dive: z40 at y24, then y22..24 at z41, then y19..22 at z42, on x30 and x31.
assert.equal(step("cableDive", [30, 19, 40, 31, 24, 42], () => h3.cableDive(g, [[40, 24], [41, 22], [42, 19]], [30, 31], { carve: true })), 16);
assert.equal(block(31, 19, 42), "red_concrete");

// Hanging lantern: hangs from the block above; refused over air.
step("hangLantern", [30, 10, 30, 30, 10, 30], () => h3.hangLantern(g, 30, 10, 30));
assert.equal(block(30, 10, 30), "lantern");
assert.deepEqual(state(30, 10, 30), { hanging: "true" });
assert.equal(h3.hangLantern(g, 33, 10, 30), 0);

console.log("test-h3: all helpers ok");
