// Smoke test for vocab/h2.mjs: calls every helper once on a small grid and checks that each cell it wrote lies inside
// the footprint it was given. Run: node vocab/test-h2.mjs
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { plinth, window, slidingDoor, porch, flag, hedge, floorLantern } from "./h2.mjs";

const g = new Grid([40, 12, 24]);
g.fill([0, 0, 0], [39, 0, 23], "smooth_stone");                  // ground y0, an earlier part's
g.fill([9, 1, 4], [14, 5, 4], "white_concrete");                 // a north wall at z4 (window)
g.fill([10, 2, 4], [12, 3, 4], "air");                           // its opening, left air by the shell
g.fill([12, 1, 8], [17, 4, 8], "white_concrete");                // a north wall at z8 (sliding door)
g.fill([14, 1, 8], [15, 3, 8], "air");                           // its opening

const snap = () => new Map([...g.cells].map(([k, c]) => [k, JSON.stringify([c.block, c.state])]));
function run(name, footprint, call, refusedCount = 0) {
  const before = snap();
  const r = call();
  const [lo, hi] = footprint;
  const changed = [...g.cells].filter(([k, c]) => before.get(k) !== JSON.stringify([c.block, c.state])).map(([, c]) => c);
  const outside = changed.filter((c) => c.pos.some((v, i) => v < lo[i] || v > hi[i]));
  assert.equal(outside.length, 0, `${name} wrote outside its footprint at ${outside.map((c) => c.pos)}`);
  assert.ok(r.placed > 0, `${name} placed nothing`);
  assert.equal(r.refused.length, refusedCount, `${name} refused ${JSON.stringify(r.refused)}`);
  console.log(`ok ${name}: ${r.placed} placed, ${r.refused.length} refused`);
}

run("plinth", [[2, 1, 2], [8, 1, 6]], () => plinth(g, [2, 2, 8, 6], "polished_andesite"));
run("window", [[10, 1, 3], [12, 3, 4]], () => window(g, 10, 2, 4, "north", 3, 2));
run("slidingDoor", [[13, 1, 8], [16, 3, 8]], () => slidingDoor(g, 14, 8, "north", 2, 3));
run("porch", [[20, 0, 2], [23, 3, 3]], () => porch(g, 20, 23, 2, 3, { open: [21, 22] }));
run("flag", [[30, 1, 2], [32, 9, 2]], () => flag(g, 30, 2));
run("hedge", [[34, 1, 2], [37, 1, 3]], () => hedge(g, [34, 2, 37, 3]));
run("floorLantern", [[6, 1, 10], [6, 1, 10]], () => floorLantern(g, 6, 1, 10));

// refusals: a filled cell is left alone, and a lantern with no floor under it is refused whole
g.set(35, 1, 6, "stone");
assert.equal(hedge(g, [35, 6, 35, 6]).refused.length, 1, "hedge over a filled cell must refuse it");
assert.equal(g.blockAt(35, 1, 6), "minecraft:stone", "refused cell must keep its block");
assert.equal(floorLantern(g, 6, 4, 10).refused.length, 1, "lantern with no floor must be refused");
console.log("ok refusals");
