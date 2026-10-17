// Smoke test for vocab/h2.mjs: each helper once on a small grid. Every block it places must sit in the footprint
// it was given, and the states the game reads must be set. Run: node vocab/test-h2.mjs
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h2 from "./h2.mjs";

const inside = (g, [x0, y0, z0, x1, y1, z1]) =>
  g.solids().every(({ pos: [x, y, z] }) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1);
const check = (name, g, box, res) => {
  assert.ok(res.placed > 0, `${name}: placed nothing`);
  assert.ok(inside(g, box), `${name}: a block landed outside its footprint`);
  console.log(`ok ${name}: ${res.placed} placed`);
};

let g = new Grid([24, 6, 20]);
let r = h2.ringFence(g, 1);
check("ringFence", g, [12, 1, 5, 23, 4, 18], r);
assert.equal(g.get(17, 1, 5).block, "minecraft:spruce_fence_gate");
assert.equal(g.get(17, 1, 5).state.facing, "north");
assert.equal(h2.ringFence(g, 1).placed, 0, "ringFence: a second run must write into nothing");

g = new Grid([12, 7, 12]);
r = h2.wagonDoor(g, 4, 1, 9, "north");
check("wagonDoor", g, [2, 1, 9, 9, 5, 9], r);
assert.equal(g.get(2, 1, 9).state.open, "true");
assert.ok(g.isAir(5, 2, 9), "wagonDoor: the clear opening must stay air");

g = new Grid([12, 14, 12]);
r = h2.louvre(g, 5, 12, 9, "north", 2);
check("louvre", g, [5, 12, 9, 6, 12, 9], r);

g = new Grid([8, 11, 8]);
r = h2.ventSlot(g, 3, 4, "west");
check("ventSlot", g, [3, 3, 4, 3, 9, 4], r);

g = new Grid([6, 7, 6]);
r = h2.belfry(g, 1, 4, 1);
check("belfry", g, [1, 4, 1, 4, 5, 4], r);
assert.equal(g.get(2, 5, 2).block, "minecraft:bell");
assert.equal(g.get(2, 5, 2).state.attachment, "ceiling");

g = new Grid([5, 9, 10]);
r = h2.slatCrib(g, 1, 1);
check("slatCrib", g, [1, 1, 1, 3, 7, 8], r);

g = new Grid([6, 4, 7]);
r = h2.cart(g, 2, 1, 2, "north");
check("cart", g, [2, 1, 1, 3, 2, 5], r);

g = new Grid([6, 11, 7]);
r = h2.tobaccoTier(g, 1, 1);
check("tobaccoTier", g, [1, 4, 1, 4, 9, 5], r);

g = new Grid([6, 4, 6]);
const room = [1, 2, 1, 4, 4, 4];
r = h2.jobSite(g, "lectern", [3, 2, 3], { facing: "north", room });
assert.equal(r.placed, 1);
assert.equal(g.get(3, 2, 3).block, "minecraft:lectern");
assert.equal(h2.jobSite(g, "composter", [5, 2, 3], { room }).placed, 0, "jobSite: outside its room must refuse");
console.log("ok jobSite: 1 placed, outside-room refused");

console.log("all h2 helpers passed");
