// Smoke test for vocab/h3.mjs: each helper once on a fresh grid. Every block it placed must lie in the footprint the
// test gave it, lanes it must leave clear stay air, and nothing it placed may overwrite an existing block.
// Run: node vocab/test-h3.mjs
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h3 from "./h3.mjs";

const inBox = (p, [x0, y0, z0, x1, y1, z1]) => p[0] >= x0 && p[0] <= x1 && p[1] >= y0 && p[1] <= y1 && p[2] >= z0 && p[2] <= z1;
const AIR = ["minecraft:air", "minecraft:cave_air"];
const cases = [
  ["post", (g) => h3.post(g, 10, 14), [10, 2, 14, 10, 4, 14]],
  ["beam_line", (g) => h3.beam_line(g, 13), [13, 5, 5, 13, 5, 28]],
  ["orange_entry", (g) => h3.orange_entry(g, 19, 9), [18, 2, 9, 20, 4, 9], (g) => assert.equal(g.blockAt(19, 2, 9), "minecraft:acacia_door")],
  ["stepping_pad", (g) => h3.stepping_pad(g, 18, 1), [18, 0, 1, 20, 0, 1], (g) => assert.equal(g.blockAt(19, 0, 1), "minecraft:smooth_stone")],
  ["barrel_cactus", (g) => h3.barrel_cactus(g, 27, 3), [27, 1, 3, 27, 2, 3]],
  ["patio_table", (g) => h3.patio_table(g, 20, 27), [19, 1, 27, 21, 2, 27], null, null, [[20, 1, 26], [20, 2, 26], [20, 1, 28], [20, 2, 28]]],
  ["panel_wall", (g) => h3.panel_wall(g, 22, 2, 4, 20, "west"), [22, 2, 20, 22, 4, 20]],
  ["coffee_table", (g) => h3.coffee_table(g, 15, 22, 1), [15, 1, 22, 15, 1, 22]],
  ["galley_kitchen", (g) => h3.galley_kitchen(g, 11, 9, 2), [11, 2, 9, 15, 4, 13], null, null, [11, 12, 13, 14, 15].flatMap((x) => [[x, 2, 10], [x, 3, 10], [x, 2, 11], [x, 3, 11]])],
];

for (const [name, run, box, check, , lane] of cases) {
  const g = new Grid([34, 9, 34]);
  if (name === "stepping_pad") for (let x = 18; x <= 20; x++) g.set(x, 0, 1, "minecraft:sand");
  const before = new Map(g.cells);
  const { placed, blocked } = run(g);
  const changed = [...g.cells].filter(([k, c]) => before.get(k) !== c).map(([, c]) => c.pos);
  assert.ok(placed > 0, `${name}: placed nothing`);
  assert.equal(placed, changed.length, `${name}: placed count disagrees with the grid`);
  assert.equal(blocked, 0, `${name}: unexpected blocked cells`);
  for (const p of changed) assert.ok(inBox(p, box), `${name}: wrote ${p} outside ${box}`);
  for (const p of lane ?? []) assert.ok(AIR.includes(g.blockAt(...p)), `${name}: lane ${p} is not clear`);
  if (check) check(g);
  console.log(`ok ${name} (${placed} cells)`);
}

// air-only: a block already in the way is kept and counted as blocked
{
  const g = new Grid([34, 9, 34]);
  g.set(19, 3, 9, "minecraft:white_concrete");
  const { blocked } = h3.orange_entry(g, 19, 9);
  assert.equal(blocked, 1, "orange_entry should count the blocked transom cell");
  assert.equal(g.blockAt(19, 3, 9), "minecraft:white_concrete", "orange_entry overwrote an existing block");
  console.log("ok air-only");
}
