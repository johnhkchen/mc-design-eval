// Smoke test for vocab/h1.mjs: each helper on an empty grid writes only inside the footprint it was given, plus the
// rules workers rely on (air-only writes unless over, both door halves, persistent leaves). Run: node vocab/test-h1.mjs
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h from "./h1.mjs";

const SIZE = [41, 44, 37];
const inBox = (box, [x, y, z]) => x >= box[0] && y >= box[1] && z >= box[2] && x <= box[3] && y <= box[4] && z <= box[5];

// [name, footprint box, call]
const cases = [
  ["quoinColumn", [4, 4, 9, 5, 15, 9], (g) => h.quoinColumn(g, 4, 9, "east", 4, 15)],
  ["windowBay", [12, 4, 9, 13, 8, 10], (g) => h.windowBay(g, "north", 10, 12, 2, 5, 4, { sill: true })],
  ["mainDoor", [19, 4, 10, 21, 9, 10], (g) => h.mainDoor(g, 20, 10, "north", 4)],
  ["pedimentOculus", [15, 17, 6, 25, 22, 6], (g) => h.pedimentOculus(g, 20, 6, 17, 22, 19)],
  ["clockFace", [19, 28, 10, 21, 30, 10], (g) => h.clockFace(g, "north", 10, 20, 28)],
  ["copperSpire", [20, 42, 12, 20, 43, 12], (g) => h.copperSpire(g, 20, 12, 42)],
  ["fireplace", [6, 4, 17, 6, 6, 18], (g) => h.fireplace(g, 6, 17, "west", 4)],
  ["frontSteps", [16, 1, 4, 24, 2, 5], (g) => h.frontSteps(g, 16, 24, 4, 1, "south")],
  ["oakTree", [5, 1, 29, 11, 8, 35], (g) => h.oakTree(g, 8, 32, 1)],
];

for (const [name, box, call] of cases) {
  const g = new Grid(SIZE);
  const r = call(g);
  const stray = g.solids().filter((c) => !inBox(box, c.pos)).map((c) => c.pos);
  assert.deepEqual(stray, [], `${name} wrote outside its footprint`);
  assert.ok(r.cells > 0, `${name} wrote nothing`);
  assert.equal(r.refused.length, 0, `${name} refused cells on an empty grid: ${JSON.stringify(r.refused)}`);
  console.log(`ok ${name}: ${r.cells} blocks`);
}

// air-only: an existing block is refused (and kept) unless over
{
  const g = new Grid(SIZE);
  g.set(4, 5, 9, "stone");
  const kept = h.quoinColumn(g, 4, 9, "east", 4, 15);
  assert.equal(g.blockAt(4, 5, 9), "minecraft:stone");
  assert.deepEqual(kept.refused.map((c) => c.slice(0, 3)), [[4, 5, 9]]);
  h.quoinColumn(g, 4, 9, "east", 4, 15, { over: true });
  assert.equal(g.blockAt(4, 5, 9), "minecraft:quartz_block");
  console.log("ok air-only writes: refused without over, replaced with over");
}

// doors write both halves; leaves are persistent
{
  const g = new Grid(SIZE);
  h.mainDoor(g, 20, 10, "north", 4);
  assert.equal(g.get(20, 4, 10).state.half, "lower");
  assert.equal(g.get(20, 5, 10).state.half, "upper");
  h.oakTree(g, 8, 32, 1);
  assert.equal(g.get(9, 5, 32).state.persistent, "true");
  console.log("ok door halves, persistent leaves");
}

console.log("all h1 checks passed");
