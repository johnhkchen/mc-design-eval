// Calls each h2 helper once on a small grid and checks it wrote only inside the footprint it returned, never at y 0,
// and that every changed cell was counted. Run: node vocab/test-h2.mjs
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as H from "./h2.mjs";

const g = new Grid([70, 48, 70], { dataVersion: 3955 });            // 1.21.1
g.fill([0, 0, 0], [69, 0, 69], "stone_bricks");

const snapshot = () => new Map([...g.cells.values()].map((c) => [c.pos.join(","), JSON.stringify(c)]));
const inside = ([[x0, y0, z0], [x1, y1, z1]], [x, y, z]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;

function run(name, fn) {
  const before = snapshot();
  const r = fn();
  const changed = [...g.cells.values()].filter((c) => before.get(c.pos.join(",")) !== JSON.stringify(c));
  const outside = changed.filter((c) => !inside(r.box, c.pos) || c.pos[1] < 1);
  assert.equal(outside.length, 0, `${name} wrote outside its footprint: ${outside.map((c) => c.pos).join(" ")}`);
  assert.equal(changed.length, r.placed, `${name}: placed count disagrees with the cells changed`);
  assert.ok(r.placed > 0, `${name} placed nothing`);
  console.log(`ok  ${name}: ${r.placed} cells, ${r.refused.length} refused`);
  return r;
}

// Brick wall on the east face (x 30); the window at z 14..15 is kept air.
run("brickWall", () => H.brickWall(g, { x0: 4, x1: 30, z0: 4, z1: 20, y0: 1, y1: 8, face: "east", granite: true, stringY: 4, keepAir: [[30, 2, 14, 30, 4, 15]] }));
assert.equal(g.blockAt(30, 3, 14), "minecraft:air", "keepAir window stays air");

// Round arch cut through that wall: the keystone pair sits on the crown (y 7) at z 10 and 11.
run("archOpening", () => H.archOpening(g, { center: [30, 2, 11], face: "east", span: 6, spring: 5, crown: 7 }));
assert.equal(g.blockAt(30, 7, 10), "minecraft:chiseled_sandstone", "keystone on the crown");

// Awning over open air at x 50; a solid cell in its back course must survive.
g.set(51, 6, 12, "stone_bricks");
run("stripedAwning", () => H.stripedAwning(g, { from: [50, 10], to: [50, 16], face: "east", y: 6 }));
assert.equal(g.blockAt(51, 6, 12), "minecraft:stone_bricks", "a solid cell is refused, not overwritten");

run("skylightGable", () => H.skylightGable(g, {}));
run("lanternBracket", () => H.lanternBracket(g, { at: [10, 9, 40], face: "east" }));
assert.equal(g.get(11, 8, 40).state.hanging, "true", "the lantern hangs under the arm");
run("produceCrate", () => H.produceCrate(g, { at: [6, 2, 60], kind: "produce", length: 3, axis: "x" }));
run("stairHouse", () => H.stairHouse(g, { box: [40, 33, 40, 46, 37, 45] }));
assert.equal(g.blockAt(43, 33, 40), "minecraft:air", "the door stays air");

// Shop front on the north face (z 50), 10 long from x 5: the door is at x 10, both halves.
run("shopFront", () => H.shopFront(g, { at: [5, 2, 50], face: "north", w: 10, door: true }));
assert.equal(g.blockAt(10, 3, 50), "minecraft:spruce_door");
assert.equal(g.blockAt(10, 4, 50), "minecraft:spruce_door");

g.set(60, 4, 60, "stone_bricks");                                   // a full block for the pot to stand on
run("gardenPot", () => H.gardenPot(g, { at: [60, 5, 60] }));
run("gardenPotWindowBox", () => H.gardenPot(g, { at: [62, 5, 60], box: true, face: "north" }));

console.log("all h2 helpers passed");
