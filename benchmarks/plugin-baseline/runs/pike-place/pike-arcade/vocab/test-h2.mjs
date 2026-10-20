// Calls each h2 helper once on a small grid and checks it wrote only inside the footprint it returned, only into air
// (a pre-placed block survives), and never below y 1 (the ground at y 0 belongs to earlier parts). Run: node vocab/test-h2.mjs
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as H from "./h2.mjs";

const g = new Grid([300, 50, 320], { dataVersion: 3955 });            // 1.21.1
for (let x = 0; x < 300; x++) for (let z = 0; z < 320; z++) g.set(x, 0, z, "smooth_stone");

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
  return r;
}
const at = (x, y, z) => g.get(x, y, z);

// only into air: a block already there is kept and reported as skipped
g.set(41, 24, 167, "stone");
const aw = run("awning", () => H.awning(g, { x: 41, y: 24, z0: 165, z1: 170, scallop: true }));
assert.equal(at(41, 24, 167).block, "minecraft:stone");
assert.equal(aw.skipped.length, 1);

const pr = run("produce_row", () => H.produce_row(g, { x: 39, y: 22, z0: 165, z1: 176, block: ["melon", "pumpkin", "flowering_azalea_leaves", "red_wool"] }));
assert.equal(at(39, 22, 168).block, "minecraft:barrel");
assert.equal(at(39, 22, 168).state.facing, "up");
assert.equal(at(39, 22, 167).state.persistent, "true");
assert.throws(() => H.produce_row(g, { x: 35, y: 22, z0: 161, z1: 170 }), /lane/);

const wb = run("window_bay", () => H.window_bay(g, { face: "east", x: 33, start: 190, y: 30 }));
assert.equal(at(33, 30, 190).block, "minecraft:glass_pane");
assert.equal(at(33, 30, 191).block, "minecraft:dark_oak_trapdoor");
assert.equal(at(32, 31, 190).block, "minecraft:ochre_froglight");
assert.equal(wb.skipped.length, 0);

run("string_course", () => H.string_course(g, { face: "east", x: 33, from: 190, to: 200, y: 34 }));
assert.equal(at(34, 34, 190).block, "minecraft:smooth_quartz_slab");

run("du_course", () => H.du_course(g, { face: "west", x: 14, from: 189, to: 200, y: 7 }));
assert.equal(at(13, 7, 189).block, "minecraft:stone_brick_stairs");

// rise 2 from the floor at y 20: half steps at y 21..22, the upper floor (y 22) is not written
run("ramp", () => H.ramp(g, { x0: 34, x1: 39, z: 188, from: 20, rise: 2, dir: 1 }));
assert.equal(at(34, 21, 188).block, "minecraft:polished_andesite_slab");
assert.equal(at(34, 21, 188).state.type, "bottom");
assert.equal(at(34, 22, 188), undefined);

run("parapet", () => H.parapet(g, { x0: 14, z0: 280, x1: 41, z1: 311, y: 43, skip: [[[41, 42, 281], [41, 45, 299]]] }));
assert.equal(at(41, 43, 290), undefined);                              // board cell, left out
assert.equal(at(14, 44, 300).block, "minecraft:smooth_quartz_slab");

const pb = run("producer_board", () => H.producer_board(g, { x: 41, y0: 42, y1: 45, z0: 281, z1: 299 }));
assert.equal(at(41, 43, 290).block, "minecraft:dark_oak_planks");
assert.equal(pb.notes.length, 1);

console.log("test-h2: ok (8 helpers)");
