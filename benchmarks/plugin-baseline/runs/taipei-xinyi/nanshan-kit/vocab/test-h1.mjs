// Smoke test for vocab/h1.mjs: each helper places blocks, only inside the footprint it was given, only into air.
// Run: node vocab/test-h1.mjs
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h1 from "./h1.mjs";

const DATA_VERSION = 3955; // 1.21.1, the server version
const fresh = () => new Grid([40, 40, 40], { dataVersion: DATA_VERSION });
const inBox = (b, [x, y, z]) => x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1 && z >= b.z0 && z <= b.z1;

const shaft = { x0: 4, x1: 20, y0: 4, y1: 16, z0: 4, z1: 12 };
const cases = [
  ["finFace", shaft, (g) => h1.finFace(g, "north", { ...shaft })],
  ["revealSlot", shaft, (g) => h1.revealSlot(g, "north", shaft, { from: 8, to: 13, depth: 3, y0: 4, y1: 16 })],
  ["canopyPier", { x0: 9, x1: 11, y0: 4, y1: 7, z0: 9, z1: 11 }, (g) => h1.canopyPier(g, [10, 4, 10], 3)],
  ["aircraftLight", { x0: 9, x1: 11, y0: 20, y1: 21, z0: 9, z1: 11 }, (g) => h1.aircraftLight(g, [10, 20, 10])],
  ["shopFront", { x0: 4, x1: 30, y0: 4, y1: 8, z0: 4, z1: 8 }, (g) => h1.shopFront(g, "south", { x0: 4, x1: 30, y0: 4, y1: 8, z0: 4, z1: 8 })],
  ["soffit", { x0: 4, x1: 20, y0: 20, y1: 20, z0: 4, z1: 10 }, (g) => h1.soffit(g, { x0: 4, x1: 20, y0: 20, y1: 20, z0: 4, z1: 10 })],
  ["pergola", { x0: 4, x1: 15, y0: 4, y1: 7, z0: 4, z1: 11 }, (g) => h1.pergola(g, { x0: 4, x1: 15, y0: 4, y1: 7, z0: 4, z1: 11 })],
  ["coveredWalk", { x0: 4, x1: 9, y0: 3, y1: 10, z0: 4, z1: 20 }, (g) => h1.coveredWalk(g, { x0: 4, x1: 9, y0: 3, y1: 10, z0: 4, z1: 20 })],
  ["observatory", { x0: 4, x1: 30, y0: 10, y1: 32, z0: 4, z1: 30 }, (g) => h1.observatory(g, { x0: 4, x1: 30, y0: 10, y1: 27, z0: 4, z1: 30 }, { ribTop: 32 })],
];

for (const [name, box, run] of cases) {
  const g = fresh();
  const { placed, blocked } = run(g);
  const cells = [...g.cells.values()];
  const outside = cells.filter((c) => !inBox(box, c.pos));
  assert.ok(placed > 0, `${name} placed nothing`);
  assert.equal(placed, cells.length, `${name}: placed count does not match the grid`);
  assert.deepEqual(outside.map((c) => c.pos), [], `${name} wrote outside its footprint`);
  assert.deepEqual(blocked, [], `${name} hit occupied cells on an empty grid`);
  console.log(`ok ${name}: ${placed} blocks`);
}

// Rounded corner: arc cells lie on radius 9 in the requested quadrant.
const arc = h1.roundedPlan(10, 75, 9, "nw");
assert.ok(arc.length > 0);
for (const [x, z] of arc) {
  assert.ok(x <= 10 && z <= 75, `arc cell ${x},${z} outside the nw quadrant`);
  assert.equal(Math.round(Math.hypot(x - 10, z - 75)), 9);
}
console.log(`ok roundedPlan: ${arc.length} arc cells`);

// Air only: an occupied fin cell is left alone and reported.
const g = fresh();
g.set(4, 4, 4, "minecraft:stone");
const r = h1.finFace(g, "north", { ...shaft });
assert.equal(g.blockAt(4, 4, 4), "minecraft:stone");
assert.deepEqual(r.blocked, [[4, 4, 4]]);
console.log("ok air-only: occupied cell kept and reported");
