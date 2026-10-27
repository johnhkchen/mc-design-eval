// Calls each h2 helper once on a small grid and checks it wrote only inside the footprint it returned and only into
// air (paveStrip alone replaces its ground surface). Run: node vocab/test-h2.mjs
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as H from "./h2.mjs";

const g = new Grid([190, 64, 80], { dataVersion: 3955 });            // 1.21.1
for (let x = 0; x < 190; x++) for (let z = 0; z < 80; z++) { g.set(x, 0, z, "stone"); g.set(x, 1, z, "dirt"); g.set(x, 2, z, "grass_block"); }

const snapshot = () => new Map([...g.cells.values()].map((c) => [c.pos.join(","), JSON.stringify(c)]));
const inside = ([[x0, y0, z0], [x1, y1, z1]], [x, y, z]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;

function run(name, fn, { ground = false } = {}) {
  const before = snapshot();
  const r = fn();
  const changed = [...g.cells.values()].filter((c) => before.get(c.pos.join(",")) !== JSON.stringify(c));
  const outside = changed.filter((c) => !inside(r.box, c.pos));
  const overwrote = changed.filter((c) => before.has(c.pos.join(",")) && !/air"/.test(before.get(c.pos.join(","))));
  assert.equal(outside.length, 0, `${name} wrote outside its footprint: ${outside.map((c) => c.pos).join(" ")}`);
  if (!ground) assert.equal(overwrote.length, 0, `${name} overwrote a solid: ${overwrote.map((c) => c.pos).join(" ")}`);
  assert.equal(changed.length, r.placed, `${name}: placed count disagrees with the cells changed`);
  assert.ok(r.placed > 0, `${name} placed nothing`);
  console.log(`ok  ${name}: ${r.placed} cells, ${r.refused.length} refused`);
  return r;
}

g.set(8, 5, 3, "stone_bricks");                                     // a cell owned by an earlier part: must be refused
const aw = run("ashlarWall", () => H.ashlarWall(g, [[2, 3, 2], [10, 14, 3]], { face: "north", openings: [[[5, 6, 2], [6, 9, 3]]] }));
assert.equal(g.blockAt(8, 5, 3), "minecraft:stone_bricks");
assert.ok(g.isAir(5, 7, 2) && aw.refused.length === 1);
run("polarWall", () => H.polarWall(g, { r0: 25, r1: 26, y0: 3, y1: 6, open: [[[170, 3, 30], [180, 6, 46]]] }));
const fb = run("flankBay", () => H.flankBay(g, { p: 40, side: "S" }));
assert.ok(g.isAir(44, 10, 65) && g.isAir(44, 10, 66), "chapel lancet left as air");
assert.equal(g.blockAt(42, 10, 66), "minecraft:cut_sandstone");
run("flankBay N", () => H.flankBay(g, { p: 40, side: "N" }));
assert.equal(g.blockAt(42, 10, 10), "minecraft:cut_sandstone");
run("ridgeCrest", () => H.ridgeCrest(g, { x0: 20, x1: 30, z: 38, y: 60 }));
run("corbelTable", () => H.corbelTable(g, { cells: Array.from({ length: 8 }, (_, i) => [60 + i, 49]), face: "south" }));
assert.equal(g.get(60, 46, 50).state.facing, "north");
run("wallButtress", () => H.wallButtress(g, { x: 72, z: 50, face: "south" }));
run("wimperg", () => H.wimperg(g, { centre: [94, 66], face: "south", w: 7, yBase: 18, yApex: 26 }));
run("octagonRing", () => H.octagonRing(g, { y: 52, w: 9, cut: 2, block: "polished_deepslate" }));
run("glazeLancet", () => H.glazeLancet(g, { cells: [44, 45, 46, 47].flatMap((x) => [38, 39, 40].map((y) => [x, y])).concat([[45, 41], [46, 41]]), plane: { z: 20 } }));
assert.equal(g.blockAt(45, 41, 20), "minecraft:purple_stained_glass_pane");
assert.equal(g.get(45, 39, 20).state.east, "true");
run("paveStrip", () => H.paveStrip(g, { cells: Array.from({ length: 10 }, (_, i) => [100 + i, 75]) }), { ground: true });
assert.equal(g.blockAt(103, 2, 75), "minecraft:smooth_stone");

g.save("/tmp/test-h2.nbt");
console.log("all h2 helpers passed");
