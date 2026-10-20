// Calls each helper in h3.mjs. Every placed block must lie inside the box its call was given, the air-only rule must
// hold (a second floorDeck on the same cells places nothing), and the ground and the walls must come out as built.
import assert from "node:assert/strict";
import { Grid, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import * as h3 from "./h3.mjs";

const g = new Grid([24, 12, 24], { dataVersion: DATA_VERSIONS["1.21.1"] });
g.fill([0, 0, 0], [23, 0, 23], "smooth_stone");
// Walls the helpers sit in: a north wall at z2 with a window opening, a north wall at z14 with a door opening,
// an east wall at x20 with a window opening, and a bricks stair over (6,6,6) for the eave lantern to hang from.
g.fill([8, 1, 2], [13, 4, 2], "white_concrete");
g.fill([10, 2, 2], [11, 4, 2], "minecraft:air");
g.fill([8, 1, 14], [13, 4, 14], "white_concrete");
g.fill([12, 1, 14], [12, 2, 14], "minecraft:air");
g.fill([20, 1, 6], [20, 4, 11], "white_concrete");
g.fill([20, 2, 8], [20, 4, 9], "minecraft:air");
g.set(6, 6, 6, ...B.stairs("bricks", "north", "top"));

const inBox = ([x, y, z], [x0, y0, z0, x1, y1, z1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;
const expectInside = (name, res, box) => {
  assert.ok(res.placed.length > 0, `${name}: placed nothing`);
  for (const p of res.placed) assert.ok(inBox(p, box), `${name}: ${p} is outside its footprint ${box}`);
  console.log(`${name}: placed ${res.placed.length}, refused ${res.refused.length}, skipped ${res.skipped.length}`);
};

expectInside("tallWindow north", h3.tallWindow(g, 10, 2, "north"), [9, 1, 2, 12, 4, 3]);
assert.equal(g.blockAt(9, 3, 2), "minecraft:quartz_block", "tallWindow: jamb not quartz");
assert.equal(g.blockAt(10, 3, 2), "minecraft:glass_pane", "tallWindow: opening not glass");

expectInside("tallWindow east", h3.tallWindow(g, 20, 8, "east"), [19, 1, 7, 20, 4, 10]);
assert.equal(g.blockAt(20, 4, 9), "minecraft:glass_pane", "tallWindow east: opening not glass");

const door = h3.doorPair(g, 12, 14, "north");
expectInside("doorPair", door, [12, 1, 14, 12, 2, 14]);
assert.equal(door.placed.length, 2, "doorPair: both halves must land");
assert.equal(g.get(12, 2, 14).state.half, "upper", "doorPair: upper half missing");

expectInside("doorStep", h3.doorStep(g, 12, 14, "north", 2), [12, 1, 13, 13, 1, 13]);
const edgeStep = h3.doorStep(g, 4, 0, "north", 2);
assert.equal(edgeStep.placed.length, 0, "doorStep: placed off the grid edge");
assert.equal(edgeStep.skipped.length, 2, "doorStep: edge cells not skipped");

expectInside("floorDeck", h3.floorDeck(g, [2, 16, 8, 21], 3), [2, 3, 16, 8, 3, 21]);
const again = h3.floorDeck(g, [2, 16, 8, 21], 3);
assert.equal(again.placed.length, 0, "floorDeck: wrote over its own deck (not air-only)");

expectInside("awning", h3.awning(g, 14, 16, 22, 3), [14, 3, 22, 16, 3, 22]);
assert.equal(g.get(14, 3, 22).state.facing, "south", "awning: facing");

const tree = h3.smallTree(g, 19, 19);
expectInside("smallTree", tree, [17, 1, 17, 21, 5, 21]);
assert.equal(tree.placed.filter(([x, y, z]) => x === 19 && z === 19 && g.blockAt(x, y, z) === "minecraft:oak_log").length, 4, "smallTree: trunk not 4 high");
assert.ok(!tree.placed.some(([, y]) => y === 0), "smallTree: wrote ground");

expectInside("eaveLantern", h3.eaveLantern(g, 6, 5, 6), [6, 5, 6, 6, 5, 6]);
assert.equal(h3.eaveLantern(g, 6, 5, 20).placed.length, 0, "eaveLantern: hung with nothing above");

for (let x = 0; x < 24; x++) for (let z = 0; z < 24; z++) {
  assert.equal(g.blockAt(x, 0, z), "minecraft:smooth_stone", `ground changed at ${x},0,${z}`);
}
console.log("h3 helpers: all checks passed");
