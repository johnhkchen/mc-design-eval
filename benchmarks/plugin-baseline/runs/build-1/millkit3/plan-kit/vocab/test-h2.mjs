// Calls each h2 helper once on a small grid. Each helper must succeed, and every cell it changed must lie inside
// the footprint given for it. A helper run on a taken cell must write nothing.
// Run: node vocab/test-h2.mjs
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h from "./h2.mjs";

const g = new Grid([24, 12, 24]);
g.fill([0, 0, 0], [23, 0, 23], "grass_block");

const cells = () => new Map([...g].map((c) => [c.pos.join(","), `${c.block} ${JSON.stringify(c.state ?? {})}`]));
const within = ([x, y, z], [x0, y0, z0, x1, y1, z1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;

function run(name, box, fn) {
  const before = cells();
  const result = fn();
  const after = cells();
  const changed = [...after].filter(([k, v]) => before.get(k) !== v).map(([k]) => k.split(",").map(Number));
  assert.ok(changed.every((p) => within(p, box)), `${name}: wrote outside its footprint`);
  assert.ok(result, `${name}: refused`);
  console.log(`ok ${name}: ${changed.length} cells`);
}

run("lamp_post", [2, 1, 4, 2, 4, 4], () => h.lamp_post(g, 2));
run("gable_infill", [4, 1, 6, 10, 4, 6], () => h.gable_infill(g, 6, 4, 10, 1, 4, "birch_planks"));
run("french_pair", [12, 1, 8, 13, 3, 8], () => h.french_pair(g, 12, 1, 8, "north"));
run("turned_post", [14, 3, 10, 16, 5, 10], () => h.turned_post(g, 15, 10));
run("table_set", [4, 3, 4, 5, 4, 4], () => h.table_set(g, 4, 3, 4, 2, "x"));
run("rocker", [7, 3, 4, 8, 3, 4], () => h.rocker(g, 8, 3, 4, "east"));
run("hay_stack", [11, 3, 4, 14, 4, 7], () => h.hay_stack(g, [11, 3, 4, 14, 4, 7]));
run("rain_barrels", [16, 1, 15, 19, 1, 16], () => h.rain_barrels(g, [16, 18, 19], 16));
run("garden_bed", [2, 1, 12, 6, 1, 16], () => h.garden_bed(g, [2, 1, 12, 6, 16], "poppy"));
run("chimney_stack (at)", [7, 2, 15, 11, 8, 19], () => h.chimney_stack(g, { at: [9, 3, 17], open: "north", top: 8 }));

// Wall mode: the mouth sits in a solid wall, so it is refused unless cut: true.
for (let y = 3; y <= 9; y++) for (let z = 18; z <= 22; z++) g.set(14, y, z, "stone_bricks");
const wallBox = [12, 2, 18, 14, 10, 22];
assert.equal(h.chimney_stack(g, { wall: [14, 3, 20], into: "east", top: 9 }), false, "chimney_stack: solid mouth should be refused");
run("chimney_stack (wall, cut)", wallBox, () => h.chimney_stack(g, { wall: [14, 3, 20], into: "east", top: 9, cut: true }));

// Air only: a footprint that touches built blocks writes nothing.
const before = cells();
assert.equal(h.lamp_post(g, 2), false, "lamp_post: taken cells should be refused");
assert.deepEqual(cells(), before, "lamp_post: refused call changed the grid");

// Lane: a table with a block one cell past its end is refused (on free cells, so only the lane can refuse it).
g.set(19, 3, 20, "stone_bricks");
assert.equal(h.table_set(g, 20, 3, 20, 2, "x"), false, "table_set: a blocked lane should be refused");
console.log("test-h2: all helpers passed");
