// Calls every h2 helper once on a small grid; each call may change only cells inside the footprint it was given.
// Run: node vocab/test-h2.mjs
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h2 from "./h2.mjs";

const g = new Grid([16, 9, 16]);
for (let x = 0; x < 16; x++) for (let z = 0; z < 16; z++) g.set(x, 0, z, "smooth_stone"); // the ground, owned by an earlier part
const key = (c) => `${c.block}${JSON.stringify(c.state ?? {})}`;
const snap = () => new Map([...g.cells].map(([k, c]) => [k, key(c)]));

// run fn, then check every cell it changed lies inside box [x0,y0,z0,x1,y1,z1] and that it changed something
function run(name, box, fn) {
  const before = snap();
  fn();
  let n = 0;
  for (const [k, c] of g.cells) {
    if (before.get(k) === key(c)) continue;
    n++;
    const [x, y, z] = c.pos;
    const inside = x >= box[0] && y >= box[1] && z >= box[2] && x <= box[3] && y <= box[4] && z <= box[5];
    assert.ok(inside, `${name} wrote outside its footprint at ${k} (${c.block})`);
  }
  assert.ok(n > 0, `${name} placed nothing`);
  console.log(`${name}: ${n} blocks, all inside the footprint`);
}

// air only: a block already in the clerestory's footprint is left alone
g.set(1, 4, 2, "cobblestone");
run("clerestory", [1, 4, 2, 9, 4, 2], () => h2.clerestory(g, 1, 2, 4));
assert.equal(g.blockAt(1, 4, 2), "minecraft:cobblestone");

run("header_course", [8, 5, 1, 14, 5, 1], () => h2.header_course(g, 8, 1, 14, 1, 5));
assert.equal(g.blockAt(10, 5, 1), "minecraft:air", "beam-line column skipped");

// the roof band is already laid (smooth_stone_slab, both levels, holes left open); fascia swaps only its ring
const hole = { x0: 5, z0: 6, x1: 6, z1: 7 };
for (let x = 1; x <= 12; x++) for (let z = 4; z <= 11; z++) {
  if (x >= hole.x0 && x <= hole.x1 && z >= hole.z0 && z <= hole.z1) continue;
  for (const y of [6, 7]) g.set(x, y, z, "smooth_stone_slab", { type: "bottom" });
}
run("fascia_ring", [1, 6, 4, 12, 7, 11], () => h2.fascia_ring(g, { x0: 1, x1: 12, z0: 4, z1: 11, holes: [hole] }, 6, 7));
assert.equal(g.blockAt(1, 6, 4), "minecraft:dark_oak_slab");
assert.equal(g.blockAt(4, 6, 6), "minecraft:dark_oak_slab", "hole edge");
assert.equal(g.blockAt(8, 6, 9), "minecraft:smooth_stone_slab", "interior roof untouched");

run("joint_row", [1, 0, 13, 8, 0, 13], () => h2.joint_row(g, 1, 8, 13, 0, { over: ["smooth_stone"] }));
run("saguaro", [4, 1, 15, 5, 3, 15], () => h2.saguaro(g, 5, 15, 3));
run("lounger", [1, 1, 14, 2, 1, 14], () => h2.lounger(g, 1, 14, "x"));
run("terrazzo_floor", [9, 1, 0, 15, 1, 3], () => h2.terrazzo_floor(g, [9, 2, 0, 15, 4, 3], { seed: 7 }));
run("sideboard", [1, 2, 12, 3, 3, 12], () => h2.sideboard(g, 1, 12, 3, "x", "south"));

g.set(9, 5, 7, "dark_oak_log", { axis: "z" }); // a beam over the pendant
run("dining_set", [7, 2, 6, 10, 4, 8], () => h2.dining_set(g, 8, 6));
assert.equal(g.blockAt(9, 4, 7), "minecraft:lantern");

run("bath_fit", [12, 2, 12, 13, 4, 14], () => h2.bath_fit(g, 12, 12, "north"));
assert.equal(g.blockAt(12, 2, 12), "minecraft:cauldron");

console.log("h2 helpers: all footprints ok");
