// Smoke test for vocab/h2.mjs: each helper places blocks, only inside the footprint it was given, only into air.
// Run: node vocab/test-h2.mjs
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h2 from "./h2.mjs";

const DATA_VERSION = 3955; // 1.21.1, the server version
const fresh = () => new Grid([48, 48, 48], { dataVersion: DATA_VERSION });
const inBox = (b, [x, y, z]) => x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1 && z >= b.z0 && z <= b.z1;

const roof = { x0: 4, x1: 40, z0: 4, z1: 40 };
const cases = [
  ["step_ramp", { x0: 6, x1: 15, y0: 1, y1: 2, z0: 4, z1: 17 }, (g) => h2.step_ramp(g, { x0: 6, x1: 15, y0: 1, y1: 2, z0: 4, z1: 17 })],
  ["red_wall_run", { x0: 4, x1: 30, y0: 3, y1: 19, z0: 4, z1: 5 }, (g) => h2.red_wall_run(g, { x0: 4, x1: 30, y0: 3, y1: 19, z0: 4, z1: 5 }, "north", { gaps: [[12, 15]], columns: [8, 17, 26] })],
  ["roof_shell", { x0: 4, x1: 40, y0: 23, y1: 41, z0: 4, z1: 40 }, (g) => h2.roof_shell(g, { ...roof, y0: 23, y1: 41 }, { skip: { x0: 20, x1: 30, z0: 30, z1: 40 } })],
  ["fin", { x0: 16, x1: 18, y0: 24, y1: 47, z0: 23, z1: 42 }, (g) => h2.fin(g, { x0: 16, x1: 18, y0: 24, y1: 47, z0: 23, z1: 42 }, { roof, inner: "east" })],
  ["door_bay", { x0: 26, x1: 30, y0: 3, y1: 19, z0: 14, z1: 19 }, (g) => h2.door_bay(g, "east", 30, [14, 19])],
  ["flood_well", { x0: 10, x1: 10, y0: 2, y1: 2, z0: 10, z1: 10 }, (g) => h2.flood_well(g, [10, 2, 10], { over: true })],
  ["lamp_post", { x0: 8, x1: 8, y0: 3, y1: 6, z0: 8, z1: 8 }, (g) => h2.lamp_post(g, [8, 3, 8])],
  ["flagpole", { x0: 30, x1: 31, y0: 1, y1: 6, z0: 44, z1: 44 }, (g) => h2.flagpole(g, [30, 1, 44])],
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

// Air only: an occupied cell is left alone and reported; flood_well replaces the deck only with over.
const g = fresh();
g.set(10, 1, 17, "stone");
const ramp = h2.step_ramp(g, { x0: 6, x1: 15, y0: 1, y1: 2, z0: 4, z1: 17 });
assert.deepEqual(ramp.blocked, [[10, 1, 17]]);
assert.equal(g.blockAt(10, 1, 17), "minecraft:stone");
const deck = fresh();
deck.set(10, 2, 10, "polished_andesite");
assert.equal(h2.flood_well(deck, [10, 2, 10]).placed, 0);
assert.equal(deck.blockAt(10, 2, 10), "minecraft:polished_andesite");
assert.equal(h2.flood_well(deck, [10, 2, 10], { over: true }).placed, 1);
assert.equal(deck.blockAt(10, 2, 10), "minecraft:shroomlight");
console.log("ok air-only: occupied cells left alone; flood_well over replaces only the deck");
