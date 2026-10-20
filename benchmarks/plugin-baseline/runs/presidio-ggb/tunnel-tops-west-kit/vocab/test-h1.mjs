// Calls every H1 helper once on a small grid; each must write only inside the footprint it was given.
// Run: node vocab/test-h1.mjs
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h1 from "./h1.mjs";

const g = new Grid([40, 14, 40], { dataVersion: 3955 });
const inside = ([x0, y0, z0, x1, y1, z1], [x, y, z]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;
const keyOf = (c) => c.pos.join(",");

// [x0, y0, z0, x1, y1, z1] footprint given to the helper; every cell it writes must fall inside it
function run(name, box, fn) {
  const before = new Set([...g].map(keyOf));
  const r = fn();
  assert.deepEqual(r.refused, [], `${name} refused writes`);
  assert.ok(r.cells.length > 0, `${name} wrote nothing`);
  for (const c of g) if (!before.has(keyOf(c))) assert.ok(inside(box, c.pos), `${name} wrote ${keyOf(c)} outside ${box}`);
}

// mapHeight: every cell decodes to a height, and the first cell is the map's 2
assert.equal(h1.mapHeight(0, 0), 2);
for (let x = 0; x < 120; x++) for (let z = 0; z < 146; z++) {
  const y = h1.mapHeight(x, z);
  assert.ok(Number.isInteger(y) && y >= 0 && y <= 35, `mapHeight ${x},${z} = ${y}`);
}

run("halfStep flat", [2, 3, 2, 2, 3, 2], () => h1.halfStep(g, 2, 3, 2, "east"));
run("halfStep bank", [4, 3, 2, 4, 3, 2], () => h1.halfStep(g, 4, 3, 2, "north", { bank: true }));
run("tunnelBore", [10, 5, 9, 17, 9, 15], () => h1.tunnelBore(g, 10, 5, 10));
run("logPile", [20, 3, 2, 27, 7, 9], () => h1.logPile(g, 20, 3, 2));
run("lowFence", [2, 3, 26, 12, 3, 26], () => h1.lowFence(g, 2, 26, 12, 26, 3, { gates: [[6, 26]] }));
run("cliffRail", [14, 8, 30, 26, 8, 30], () => h1.cliffRail(g, 14, 26, 30, 8, { gaps: [[18, 20]] }));
run("planter", [30, 4, 26, 32, 6, 28], () => h1.planter(g, 30, 3, 26));
run("pine", [28, 4, 8, 32, 9, 12], () => h1.pine(g, 30, 3, 10));

// an occupied cell is refused, not overwritten
g.set(5, 3, 5, "stone");
const r = h1.halfStep(g, 5, 3, 5, "north");
assert.equal(g.blockAt(5, 3, 5), "minecraft:stone");
assert.equal(r.refused.length, 1);

console.log("test-h1: all helpers wrote inside their footprints; occupied cells refused");
