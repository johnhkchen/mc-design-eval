// Calls every h4 helper once on a small grid and checks that each wrote only inside the footprint it was given,
// left the ground alone, and refused occupied cells. Run: node vocab/test-h4.mjs
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h4 from "./h4.mjs";

const SIZE = [48, 14, 22];
const snapshot = (g) => {
  const out = new Map();
  for (let x = 0; x < SIZE[0]; x++) for (let y = 0; y < SIZE[1]; y++) for (let z = 0; z < SIZE[2]; z++) out.set(`${x},${y},${z}`, g.blockAt(x, y, z));
  return out;
};
const inside = (box, [x, y, z]) => x >= box[0] && y >= box[1] && z >= box[2] && x <= box[3] && y <= box[4] && z <= box[5];

const g = new Grid(SIZE);
g.fill([0, 0, 0], [47, 0, 21], "stone");   // ground at y0: nothing may touch it
const before = snapshot(g);

const calls = [
  { name: "boardWall", box: [1, 1, 2, 8, 6, 2], run: () => h4.boardWall(g, [1, 1, 2, 8, 6, 2], { leave: [[4, 2, 2, 5, 4, 2]] }) },
  { name: "hoistBeam", box: [11, 8, 2, 11, 10, 4], run: () => h4.hoistBeam(g, 11, 10, 2) },
  { name: "shutterPair", box: [13, 3, 1, 15, 4, 1], run: () => h4.shutterPair(g, 14, 3, 2, "north", "spruce") },
  { name: "porchWrap", box: [17, 1, 4, 26, 6, 12], run: () => h4.porchWrap(g, { x0: 17, x1: 26, z0: 4, z1: 12, gap: [20, 21] }) },
  { name: "bayWindow", box: [28, 2, 2, 31, 10, 2], run: () => h4.bayWindow(g, { x0: 28, x1: 31, z: 2, y0: 2, y1: 10 }) },
  { name: "headstone", box: [34, 1, 3, 34, 2, 4], run: () => h4.headstone(g, 34, 4, "tall") },
  { name: "woodRick", box: [36, 1, 2, 37, 3, 6], run: () => h4.woodRick(g, [36, 1, 2, 37, 3, 6]) },
  { name: "flight", box: [40, 1, 2, 45, 8, 2], run: () => h4.flight(g, { from: [40, 2, 2], facing: "east", to: 6, material: "mangrove" }) },
];

for (const { name, run } of calls) {
  const out = run();
  assert.ok(out.placed > 0, `${name} placed nothing`);
  assert.deepEqual(out.refused, [], `${name} refused ${JSON.stringify(out.refused)}`);
}

const after = snapshot(g);
for (const [key, block] of after) {
  if (block === before.get(key)) continue;
  const pos = key.split(",").map(Number);
  assert.ok(calls.some((c) => inside(c.box, pos)), `${key} changed outside every footprint (${block})`);
}
assert.equal(g.blockAt(4, 2, 2), "minecraft:air", "boardWall wrote into a leave box");
assert.equal(g.blockAt(12, 1, 3), "minecraft:air", "porch/shutter stray write");

// refusals: an occupied cell in a wall is kept and reported; a flight with one blocked step writes nothing
const g2 = new Grid([8, 8, 8]);
g2.set(3, 2, 1, "cobblestone");
const wall = h4.boardWall(g2, [1, 1, 1, 6, 4, 1]);
assert.equal(g2.blockAt(3, 2, 1), "minecraft:cobblestone");
assert.equal(wall.refused.length, 1);
g2.set(1, 2, 4, "cobblestone");
const stairs = h4.flight(g2, { from: [0, 1, 4], facing: "east", to: 4 });
assert.equal(stairs.placed, 0);
assert.equal(g2.blockAt(0, 1, 4), "minecraft:air");

console.log("h4 test ok: 8 helpers, footprints held, refusals reported");
