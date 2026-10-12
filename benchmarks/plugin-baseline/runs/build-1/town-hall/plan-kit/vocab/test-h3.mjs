// Calls each h3 helper once on a fresh grid with a grass course at y 0, and checks that everything it placed lies inside
// the footprint it was given and that the grass course is untouched. Run: node vocab/test-h3.mjs
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h3 from "./h3.mjs";

const SIZE = [41, 44, 37];
const inside = ([x0, y0, z0, x1, y1, z1], [x, y, z]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;

// [name, call, footprint as [x0, y0, z0, x1, y1, z1]]
const cases = [
  ["waterTable", (g) => h3.waterTable(g, { x0: 4, x1: 36, z0: 10, z1: 26 }), [3, 3, 9, 37, 3, 26]],
  ["windowHood", (g) => h3.windowHood(g, { face: "north", x0: 12, x1: 13, y: 15, plane: 10 }), [12, 15, 9, 13, 15, 9]],
  ["entablatureBand", (g) => h3.entablatureBand(g, { x0: 14, x1: 26, z0: 6, z1: 9, y: 15 }), [14, 15, 6, 26, 16, 9]],
  ["towerBand", (g) => h3.towerBand(g, { x0: 18, x1: 22, z0: 10, z1: 14, y: 35, proud: true }), [17, 35, 9, 23, 35, 15]],
  ["bellHang", (g) => h3.bellHang(g, { x: 20, y: 34, z: 12 }), [19, 34, 12, 21, 35, 12]],
  ["chimneyStack", (g) => h3.chimneyStack(g, { x0: 5, z0: 17 }), [4, 1, 16, 7, 24, 19]],
  ["ladderShaft", (g) => h3.ladderShaft(g, { x: 21, z: 13, y0: 4, y1: 32, holes: [10, 31] }), [21, 4, 13, 21, 32, 13]],
  ["lampPost", (g) => h3.lampPost(g, { x: 14, z: 4 }), [14, 1, 4, 14, 4, 4]],
];

for (const [name, call, box] of cases) {
  const g = new Grid(SIZE);
  g.fill([0, 0, 0], [SIZE[0] - 1, 0, SIZE[2] - 1], "grass_block");
  const r = call(g);
  assert.ok(r.placed > 0, `${name}: placed nothing`);
  for (const c of g.solids()) {
    if (c.pos[1] === 0) continue;                       // the grass course, set before the call
    assert.ok(inside(box, c.pos), `${name}: wrote ${c.block} at ${c.pos} outside its footprint ${box}`);
  }
  for (let x = 0; x < SIZE[0]; x++) for (let z = 0; z < SIZE[2]; z++) {
    assert.equal(g.blockAt(x, 0, z), "minecraft:grass_block", `${name}: touched ground at ${x},0,${z}`);
  }
  console.log(`ok ${name}: placed ${r.placed}, skipped ${r.skipped}`);
}
console.log(`ok ${cases.length} helpers`);
