// Calls every vocab/h2.mjs helper once on a 1.21.1 grid and checks each new block sits inside the footprint it was given.
// Run: node vocab/test-h2.mjs
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h2 from "./h2.mjs";

const g = new Grid([100, 82, 210], { dataVersion: 3955 });
const snap = () => new Set([...g.cells.values()].map((c) => c.pos.join(",")));
const inside = ([x0, y0, z0, x1, y1, z1]) => ({ pos: [x, y, z] }) =>
  x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;

function check(name, out, before, box) {
  const added = [...g.cells.values()].filter((c) => !before.has(c.pos.join(",")));
  assert.ok(out.placed > 0, `${name} placed nothing`);
  assert.equal(added.length, out.placed, `${name}: placed count disagrees with the grid`);
  const stray = added.filter((c) => !inside(box)(c));
  assert.equal(stray.length, 0, `${name} wrote outside its footprint: ${stray.map((c) => c.pos).join(" ")}`);
  console.log(`ok  ${name}: ${out.placed} blocks in ${box.join(",")}`);
}

const cases = [
  ["officeBay", () => h2.officeBay(g, "west", [10, 10], 7), [10, 7, 10, 12, 11, 12]],
  ["groundBay", () => h2.groundBay(g, "north", [30, 30]), [30, 2, 30, 35, 6, 33]],
  ["roofDeck", () => h2.roofDeck(g, [50, 50, 56, 56], 62), [49, 62, 49, 57, 64, 57]],
  ["mast", () => h2.mast(g, 70, 75, 70), [70, 75, 70, 70, 80, 70]],
  ["spurPavilion", () => h2.spurPavilion(g, [81, 0, 89, 26]), [81, 2, 0, 89, 10, 26]],
  ["lobbyGlass", () => h2.lobbyGlass(g, [19, 2, 176, 19, 12, 201]), [19, 2, 176, 20, 12, 201]],
  ["nameBand", () => h2.nameBand(g, [0, 14, 188]), [0, 14, 180, 0, 14, 196]],
  ["lampPost", () => h2.lampPost(g, 5, 2, 5), [5, 2, 5, 5, 5, 5]],
  ["planter", () => h2.planter(g, [30, 15, 30, 33, 16, 33]), [30, 15, 30, 33, 16, 33]],
];
for (const [name, run, box] of cases) {
  const before = snap();
  check(name, run(), before, box);
}

// a solid cell the helper does not own is refused and kept: the spandrel at (10,7,21) finds stone
g.set(10, 7, 21, "stone");
const solid = h2.officeBay(g, "west", [10, 20], 7);
assert.deepEqual(solid.refused.find(([x, y, z]) => x === 10 && y === 7 && z === 21), [10, 7, 21, "white_terracotta", "minecraft:stone"]);
assert.equal(g.blockAt(10, 7, 21), "minecraft:stone");
assert.throws(() => h2.planter(g, [1, 1, 1, 1, 3, 1]), /at most 2 high/);
console.log("ok  refusal: a solid cell is kept and reported; a planter taller than 2 throws");
console.log("all h2 helpers passed");
