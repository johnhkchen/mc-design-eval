// Calls each h1 helper once on a fresh grid and checks that the blocks it placed sit inside the footprint it was
// given. Run: node vocab/test-h1.mjs
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h1 from "./h1.mjs";

const fresh = () => new Grid([24, 12, 20]);
const solid = (g, a, b) => g.fill(a, b, "stone");
const solidCells = (g) => new Set([...g].map((c) => c.pos.join(",")));

const cases = [
  { name: "lane_strip", box: [1, 0, 0, 6, 2, 4], run: (g) => h1.lane_strip(g, 1, 6, 2) },
  {
    name: "clapboard_wall", box: [2, 3, 10, 2, 8, 14],
    run: (g) => h1.clapboard_wall(g, [2, 3, 10, 2, 8, 14], "light_blue_terracotta", "stripped_birch_log", "stripped_birch_log",
      { belt: ["birch_slab", { type: "bottom" }], openings: [[2, 4, 11, 2, 5, 11]] }),
  },
  { name: "door_unit", box: [4, 3, 8, 4, 5, 9], run: (g) => h1.door_unit(g, 4, 3, 9, "north", "bamboo", true) },
  {
    name: "porch_run", box: [12, 2, 6, 16, 6, 7],
    run: (g) => h1.porch_run(g, 12, 16, 6, 7, [[12, 6], [14, 6], [16, 6]], "stripped_oak_log", "spruce_fence", "dark_oak_planks", 2,
      { gap: [14, 14], bracket: "birch" }),
  },
  {
    name: "ladder_run", box: [8, 3, 14, 8, 7, 14],
    setup: (g) => solid(g, [7, 3, 14], [7, 6, 14]),
    run: (g) => h1.ladder_run(g, 8, 3, 6, 14, "east", { hatch: "spruce" }),
  },
  {
    name: "bed_set", box: [2, 3, 14, 3, 3, 14],
    setup: (g) => { solid(g, [2, 2, 14], [3, 2, 14]); solid(g, [1, 3, 14], [1, 5, 14]); },
    run: (g) => h1.bed_set(g, [3, 3, 14], "west", "red"),
  },
  {
    name: "shelf", box: [6, 4, 9, 6, 5, 9],
    setup: (g) => solid(g, [6, 4, 10], [6, 4, 10]),
    run: (g) => h1.shelf(g, 6, 4, 9, "north", "flower_pot", "spruce"),
  },
  { name: "mule_stall", box: [2, 0, 10, 3, 2, 11], run: (g) => h1.mule_stall(g, 2, 10, "east", { floor: true }) },
  { name: "bread_oven", box: [2, 1, 8, 6, 4, 11], run: (g) => h1.bread_oven(g, 2, 8) },
  { name: "rafter_tails", box: [15, 7, 2, 15, 7, 8], run: (g) => h1.rafter_tails(g, 15, 2, 8, 7) },
];

let failed = 0;
for (const c of cases) {
  try {
    const g = fresh();
    c.setup?.(g);
    const before = solidCells(g);
    const r = c.run(g);
    const [x0, y0, z0, x1, y1, z1] = c.box;
    const added = [...g].filter((cell) => !before.has(cell.pos.join(","))).map((cell) => cell.pos);
    assert.ok(added.length > 0, "placed nothing");
    assert.equal(r.placed, added.length, "reported count differs from blocks placed");
    for (const [x, y, z] of added) {
      assert.ok(x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1, `wrote outside footprint at ${x},${y},${z}`);
    }
    console.log(`ok  ${c.name}: ${added.length} blocks in [${c.box.join(",")}]`);
  } catch (e) {
    failed++;
    console.log(`FAIL ${c.name}: ${e.message}`);
  }
}

// Negative: a bed with no wall behind its head places nothing and says why.
try {
  const g = fresh();
  const r = h1.bed_set(g, [3, 3, 14], "west", "red");
  assert.equal(r.placed, 0);
  assert.equal([...g].length, 0);
  assert.ok(r.refused.length > 0);
  console.log("ok  bed_set refuses without a wall");
} catch (e) {
  failed++;
  console.log(`FAIL bed_set refuses without a wall: ${e.message}`);
}

if (failed) { console.log(`${failed} failed`); process.exit(1); }
console.log("h1 test: all passed");
