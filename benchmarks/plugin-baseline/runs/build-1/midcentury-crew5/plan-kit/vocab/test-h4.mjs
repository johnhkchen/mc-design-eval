// Calls every h4 helper once on an empty grid and checks each placed block lies inside the footprint it was given.
// Run: node vocab/test-h4.mjs
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h4 from "./h4.mjs";

const cases = [
  ["glass_bay", (g) => h4.glass_bay(g, 22, 24, 8, 2, 4), [22, 2, 8, 24, 4, 8]],
  ["glass_bay (along z)", (g) => h4.glass_bay(g, 14, 19, 10, 6, 6, { axis: "z" }), [10, 6, 14, 10, 6, 19]],
  ["ledgestone_wall", (g) => h4.ledgestone_wall(g, 11, 17), [11, 1, 7, 17, 5, 7]],
  ["carport", (g) => h4.carport(g, 0, 7), [0, 0, 7, 9, 5, 21]],
  ["car_50s", (g) => h4.car_50s(g, 3, 1), [3, 1, 1, 5, 2, 7]],
  ["mailbox", (g) => h4.mailbox(g, 9, 1), [9, 1, 1, 9, 2, 1]],
  ["garden_lamp", (g) => h4.garden_lamp(g, 17, 5), [17, 1, 5, 17, 3, 5]],
  ["sofa_low", (g) => h4.sofa_low(g, 12, 11, 4, "x", "north"), [12, 2, 11, 15, 2, 12]],
  ["conversation_pit", (g) => h4.conversation_pit(g, 13, 20, 17, 23), [13, 0, 20, 17, 2, 23]],
  ["bed_double", (g) => h4.bed_double(g, 27, 10, "east", "orange"), [27, 2, 9, 29, 3, 11]],
];

let failures = 0;
for (const [name, call, [x0, y0, z0, x1, y1, z1]] of cases) {
  const g = new Grid([34, 9, 34]);
  const before = new Set(g.cells.values());
  const n = call(g);
  const placed = [...g.cells.values()].filter((c) => !before.has(c));
  const outside = placed.filter(({ pos: [x, y, z] }) => x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1);
  try {
    assert.ok(n > 0, "placed nothing");
    assert.equal(n, placed.length, "returned count differs from cells written");
    assert.deepEqual(outside.map((c) => c.pos), [], "block outside the footprint");
    console.log(`ok   ${name}: ${n} blocks`);
  } catch (e) {
    failures++;
    console.log(`FAIL ${name}: ${e.message} ${JSON.stringify(outside.map((c) => [c.pos, c.block]))}`);
  }
}

// air only: a block already in place is kept, and the helper skips that cell
{
  const g = new Grid([34, 9, 34]);
  g.set(23, 3, 8, "minecraft:stone");
  h4.glass_bay(g, 22, 24, 8, 2, 4);
  try {
    assert.equal(g.blockAt(23, 3, 8), "minecraft:stone");
    assert.equal(g.blockAt(22, 3, 8), "minecraft:glass_pane");
    console.log("ok   air only: existing block kept");
  } catch (e) {
    failures++;
    console.log(`FAIL air only: ${e.message}`);
  }
}

if (failures) {
  console.log(`${failures} failing`);
  process.exitCode = 1;
} else console.log("all h4 helpers passed");
