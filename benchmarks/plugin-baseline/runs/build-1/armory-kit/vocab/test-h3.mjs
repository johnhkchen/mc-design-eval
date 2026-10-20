// Calls each helper in h3.mjs once on a small grid. Each call must place blocks, every new block must lie inside the
// footprint it was given, and nothing already built (the ground included) may be replaced.
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import * as h3 from "./h3.mjs";

const g = new Grid([40, 40, 40], { dataVersion: DATA_VERSIONS["1.21.1"] });
g.fill([0, 0, 0], [39, 0, 39], "smooth_stone");

const inBox = ([x, y, z], [x0, y0, z0, x1, y1, z1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;

// [name, call, footprint as [x0, y0, z0, x1, y1, z1]]
const calls = [
  ["slotWindow", () => h3.slotWindow(g, { x: 5, z: 4, face: "north", y0: 2, y1: 25 }), [5, 2, 4, 6, 26, 4]],
  ["atriumRailing", () => h3.atriumRailing(g, { x: 20, z0: 10, z1: 14, y: 8, gaps: [12] }), [20, 8, 10, 20, 8, 14]],
  ["copingParapet", () => h3.copingParapet(g, { x0: 2, z0: 2, x1: 12, z1: 8, y: 29 }), [2, 29, 2, 12, 31, 8]],
  ["pavilionBay", () => h3.pavilionBay(g, { x: 20, z: 20, face: "east", storeys: 2, closing: true }), [20, 1, 20, 20, 14, 27]],
  ["vaultBay", () => h3.vaultBay(g, { k: 1, x0: 10, z0: 4 }), [4, 1, 8, 18, 20, 11]],
  ["chihulyFlower", () => h3.chihulyFlower(g, { bays: [1], x0: 10, z0: 4, seed: 7 }), [4, 10, 8, 18, 20, 11]],
  ["canopySlab", () => h3.canopySlab(g, { x0: 22, z0: 2, x1: 30, z1: 6, y: 7 }), [22, 6, 2, 30, 7, 6]],
  ["glassBlossom", () => h3.glassBlossom(g, { x: 34, z: 34, h: 4, colors: ["red", "yellow"] }), [34, 1, 34, 34, 6, 34]],
  ["lampPost", () => h3.lampPost(g, { x: 36, z: 36 }), [36, 1, 36, 36, 4, 36]],
];

for (const [name, call, box] of calls) {
  const before = new Map([...g].map((c) => [c.pos.join(), c]));
  const placed = call();
  const changed = [...g].filter((c) => before.get(c.pos.join()) !== c);
  assert.ok(placed > 0, `${name} placed nothing`);
  assert.equal(changed.length, placed, `${name}: placed count does not match changed cells`);
  for (const c of changed) {
    assert.ok(!before.has(c.pos.join()), `${name} replaced a built cell at ${c.pos}`);
    assert.ok(inBox(c.pos, box), `${name} wrote outside its footprint at ${c.pos}`);
  }
  console.log(`ok ${name}: ${placed} blocks`);
}
