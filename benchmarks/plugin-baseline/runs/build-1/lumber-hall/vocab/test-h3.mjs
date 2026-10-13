// Smoke test for vocab/h3.mjs: every helper runs once on a small grid, and each cell it writes must lie inside the footprint
// it reports. Also checks that a stone floor and a stone ground are left alone. Run: node vocab/test-h3.mjs
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { frameBay, loadingDoors, hoistHood, stairFlight, fasciaBoard, hangSign, plinthCourse } from "./h3.mjs";

const g = new Grid([48, 40, 40]);
const keys = () => new Set([...g.cells.values()].map((c) => c.pos.join(",")));
const inBox = ([x, y, z], [a, b, c, d, e, f]) =>
  x >= Math.min(a, d) && x <= Math.max(a, d) && y >= Math.min(b, e) && y <= Math.max(b, e) && z >= Math.min(c, f) && z <= Math.max(c, f);

// stone ground under the stair 1 stringer, and a stone floor cell in the mann bay: neither may be replaced
g.set(3, 4, 13, "stone");
g.set(11, 13, 4, "stone");

const run = (name, call) => {
  const before = keys();
  const r = call();
  assert.ok(r.placed > 0, `${name}: placed nothing`);
  for (const c of g.cells.values()) {
    const k = c.pos.join(",");
    if (!before.has(k)) assert.ok(inBox(c.pos, r.box), `${name}: wrote ${k} outside ${r.box}`);
  }
  console.log(`ok ${name}: ${r.placed} placed, ${r.skipped} skipped`);
  return r;
};

run("frameBay brace", () => frameBay(g, 2, 5, 13, 16, 4, { fill: "brace" }));
const mann = run("frameBay mann", () => frameBay(g, 9, 13, 13, 16, 4, { fill: "mann" }));
assert.equal(g.blockAt(11, 13, 4), "minecraft:stone", "frameBay mann replaced the stone floor cell");
assert.equal(mann.skipped > 0, true, "frameBay mann should have skipped the stone cell");
run("frameBay window", () => frameBay(g, 14, 17, 13, 16, 4, { fill: "window" }));
assert.equal(g.blockAt(15, 14, 4), "minecraft:air", "frameBay window closed its opening");
run("frameBay door", () => frameBay(g, 19, 22, 13, 16, 4, { fill: "door" }));

const doors = run("loadingDoors", () => loadingDoors(g, 25, 13, 4, "north"));
assert.equal(g.get(25, 13, 4).block, "minecraft:dark_oak_door");
assert.equal(g.get(25, 13, 4).state.hinge, "left");
assert.equal(g.get(26, 13, 4).state.hinge, "right");
assert.equal(g.get(26, 14, 4).state.half, "upper");
assert.equal(g.get(25, 15, 4).block, "minecraft:glass_pane");
assert.ok(doors.box);

run("hoistHood", () => hoistHood(g, 10, 1, "north"));

const flight = run("stairFlight", () => stairFlight(g, 3, 5, 13, "south", 7, { rail: "east" }));
assert.equal(g.blockAt(3, 4, 13), "minecraft:stone", "stairFlight replaced the ground under the stringer");
assert.equal(g.get(3, 5, 13).block, "minecraft:dark_oak_stairs");
assert.equal(g.get(3, 5, 13).state.facing, "south");
assert.equal(g.get(3, 5, 13).state.half, "bottom");
assert.equal(g.get(4, 11, 19).state.half, "bottom");
assert.equal(g.get(3, 12, 20).block, "minecraft:dark_oak_planks");
assert.ok(flight.box);

run("fasciaBoard", () => fasciaBoard(g, 10, 16, "north", "birch", "BIRCH", { y: 9, z: 5 }));
run("hangSign", () => hangSign(g, 9, "north", "birch", "BIRCH", { y: 11, z: 5 }));
run("plinthCourse", () => plinthCourse(g, 2, 8, 5));

console.log("test-h3: all helpers passed");
