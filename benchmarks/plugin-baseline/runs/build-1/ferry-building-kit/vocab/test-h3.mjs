// Checks vocab/h3.mjs: each helper once on a small grid, every write inside the footprint it was given, and the air rule.
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { archWindow, pilasterPair, quoinCorner, bell, flag, truss, stall } from "./h3.mjs";

const inside = (cells, [x0, y0, z0, x1, y1, z1]) =>
  cells.every(([x, y, z]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1);

const g = new Grid([40, 40, 24]);
const cases = [
  ["pilasterPair", pilasterPair(g, 4, 3, { y0: 1, y1: 8 }), [4, 1, 3, 5, 8, 3]],
  ["quoinCorner", quoinCorner(g, 10, 3, 1, 6), [10, 1, 3, 11, 6, 4]],
  ["archWindow", archWindow(g, { x0: 14, y0: 15, z: 3, w: 4, h: 6, face: "north" }), [14, 14, 2, 17, 21, 3]],
  ["bell", bell(g, 22, 5, 6), [22, 5, 6, 22, 8, 6]],
  ["flag", flag(g, 26, 20, 6), [26, 20, 6, 28, 23, 6]],
  ["stall", stall(g, 2, 4, { y: 1, room: [0, 1, 0, 39, 36, 23] }), [2, 1, 4, 4, 2, 4]],
];
for (const [name, res, box] of cases) {
  assert.ok(res.cells.length > 0, `${name} placed nothing`);
  assert.equal(res.refused.length, 0, `${name} refused ${JSON.stringify(res.refused)}`);
  assert.ok(inside(res.cells, box), `${name} wrote outside ${box}`);
  console.log(`ok ${name}: ${res.cells.length} blocks`);
}
assert.equal(g.blockAt(4, 2, 3), "minecraft:quartz_pillar");
assert.equal(g.get(4, 2, 3).state.axis, "y");
assert.equal(g.get(10, 1, 3).block, "minecraft:quartz_bricks");
assert.equal(g.get(22, 6, 6).block, "minecraft:polished_deepslate");

// the air rule: a built cell is refused and kept; an out-of-room stall writes nothing
const h = new Grid([40, 40, 24]);
h.set(20, 2, 3, "stone");
const r = pilasterPair(h, 20, 3, { y0: 1, y1: 4 });
assert.equal(h.blockAt(20, 2, 3), "minecraft:stone");
assert.equal(r.refused.length, 1);
assert.equal(stall(h, 2, 4, { room: [10, 1, 0, 39, 36, 23] }).cells.length, 0);
console.log("ok air rule");

// truss: a 45-degree roof from the eave at y 10 over walls at z 2 and z 14, the truss at x 10
const t = new Grid([24, 30, 16]);
for (let z = 2; z <= 14; z += 12) for (let y = 0; y < 10; y++) for (let x = 0; x < 24; x++) t.set(x, y, z, "smooth_quartz");
for (let z = 2; z <= 14; z++) for (let x = 0; x < 24; x++) t.set(x, 11 + Math.min(z - 2, 14 - z), z, "deepslate_tiles");
const tr = truss(t, 10, { y: 10, z0: 2, z1: 14 });
assert.ok(tr.cells.length > 0, `truss placed nothing: ${tr.report}`);
assert.ok(inside(tr.cells, [10, 10, 3, 10, 29, 13]), "truss wrote outside its footprint");
console.log(`ok truss: ${tr.cells.length} blocks, ${tr.dropped} dropped`);
