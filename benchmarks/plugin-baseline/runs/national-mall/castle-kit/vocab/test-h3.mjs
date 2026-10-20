// Calls each h3 helper once on a fresh grid and checks every block it placed lies in the footprint it was given,
// that the returned count matches the cells written, and that existing blocks are left alone (air-only writes).
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as H from "./h3.mjs";

const CASES = [
  ["corbelTable", [9, 9, 9, 17, 9, 15], (g) => H.corbelTable(g, [10, 10, 16, 14], 9)],
  ["glowCell", [5, 5, 5, 5, 5, 5], (g) => H.glowCell(g, 5, 5, 5)],
  ["slateSpire", [19, 9, 4, 24, 12, 9], (g) => H.slateSpire(g, [20, 5, 23, 8], 10, 4)],
  ["oriel", [25, 4, 2, 28, 9, 2], (g) => H.oriel(g, 25, 28, 2, 5, 8)],
  ["polyBand", [28, 3, 5, 35, 4, 12], (g) => H.polyBand(g, [28, 5, 35, 12], 3, "yellow_terracotta", 2)],
  ["octoRing", [27, 1, 22, 33, 4, 28], (g) => H.octoRing(g, 30, 25, 3, 1, 1, 4)],
  ["smallWindow", [2, 2, 2, 2, 4, 2], (g) => H.smallWindow(g, 2, 3, 2, "north")],
  ["precastStrip", [12, 3, 20, 12, 9, 20], (g) => H.precastStrip(g, 12, 3, 9, 20, 5)],
  ["sculpture", [36, 0, 30, 37, 2, 30], (g) => H.sculpture(g, 36, 0, 30, 3, { width: 2 })],
];

for (const [name, [x0, y0, z0, x1, y1, z1], call] of CASES) {
  const g = new Grid([40, 20, 40]);
  const n = call(g);
  const cells = [...g.cells.values()];
  for (const { pos: [x, y, z] } of cells) {
    assert.ok(x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1, `${name} wrote outside footprint at ${x},${y},${z}`);
  }
  assert.equal(n, cells.length, `${name} count ${n} != cells written ${cells.length}`);
  assert.ok(n > 0, `${name} placed nothing`);
  console.log(`ok ${name} ${n} cells`);
}

// air-only: a block already in place survives, and the helper reports one fewer cell
{
  const g = new Grid([20, 20, 20]);
  g.set(10, 9, 9, "stone");
  const n = H.corbelTable(g, [10, 10, 16, 14], 9);
  assert.equal(g.blockAt(10, 9, 9), "minecraft:stone");
  assert.equal(n, 13);
  console.log("ok air-only (existing block kept)");
}

console.log("all h3 helpers passed");
