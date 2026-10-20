// Calls every h2 helper once on a small grid. Each call must change cells only inside the footprint it was given,
// leave the ground course (y 0) alone, and refuse air-only writes into a solid wall unless over is set.
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { parapetRun, sallyPort, lighthouse, pylon, cableHousing, trussBay, spandrelPost, abutment } from "./h2.mjs";

const g = new Grid([64, 44, 192]);
for (let x = 0; x < 64; x++) for (let z = 0; z < 192; z++) g.set(x, 0, z, "smooth_stone");
g.fill([24, 1, 16], [29, 6, 26], "bricks");   // a solid fort wall for the sally port to cut through

const inside = (pos, [x0, y0, z0, x1, y1, z1]) =>
  pos[0] >= x0 && pos[0] <= x1 && pos[1] >= y0 && pos[1] <= y1 && pos[2] >= z0 && pos[2] <= z1;

// Runs one call, checks the cells it changed are inside its box and that it placed what it changed.
function call(name, box, fn) {
  const before = new Map(g.cells);
  const r = fn();
  const changed = [...g.cells.values()].filter((c) => before.get(`${c.pos}`) !== c);
  for (const c of changed) assert.ok(inside(c.pos, box), `${name} wrote outside its footprint at ${c.pos}`);
  assert.equal(r.placed, changed.length, `${name}: placed count does not match cells changed`);
  console.log(`${name}: placed ${r.placed}, refused ${r.refused.length}`);
  return r;
}

call("parapetRun", [10, 7, 10, 13, 8, 10], () => parapetRun(g, [[10, 10, "outer"], [11, 10, "outer"], [12, 10, "parade"], [13, 10, "parade"]]));

// the wall blocks an air-only sally port, so nothing lands; with over it carves the passage and sets the arch head
assert.equal(sallyPort(g, 26, 1, 18, 25).placed, 0, "sally port must not write into the solid wall without over");
call("sallyPort", [25, 1, 18, 28, 4, 25], () => sallyPort(g, 26, 1, 18, 25, { over: true }));
assert.equal(g.get(25, 3, 25).state.facing, "east", "west arch-head stair faces into the opening");

call("lighthouse", [40, 7, 2, 42, 14, 4], () => lighthouse(g, 40, 7, 2));
assert.equal(g.get(41, 14, 3).block, "minecraft:lightning_rod");

call("pylon west", [1, 1, 6, 7, 42, 14], () => pylon(g, 1, 1, 6));
call("pylon east", [23, 1, 40, 29, 42, 48], () => pylon(g, 23, 1, 40));
assert.equal(g.blockAt(29, 20, 42), "minecraft:air", "east pylon's outer column is grooved at z+2");

call("cableHousing", [6, 14, 71, 10, 37, 72], () => cableHousing(g, 8, 72, 34, { collar: true }));
assert.equal(g.get(8, 34, 72).block, "minecraft:red_concrete", "cable is buried in the housing");

call("trussBay", [8, 30, 14, 22, 33, 17], () => trussBay(g, 14, 34));
call("spandrelPost", [8, 20, 18, 22, 29, 18], () => spandrelPost(g, 18, 20, 29));
call("abutment", [8, 1, 184, 22, 24, 190], () => abutment(g, 8, 22, 184, 190));

for (let x = 0; x < 64; x++) for (let z = 0; z < 192; z++) assert.equal(g.blockAt(x, 0, z), "minecraft:smooth_stone", `y 0 changed at ${x},${z}`);
console.log("h2: all helpers passed");
