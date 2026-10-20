// Calls each h1 helper once on an empty grid, then checks: every cell it placed is inside the footprint it was given,
// nothing was refused on empty ground, and a second call into the same footprint places nothing (air only).
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h1 from "./h1.mjs";

const g = new Grid([48, 14, 48]);

function run(name, [x0, y0, z0, x1, y1, z1], call) {
  const before = new Set(g.cells.values());
  const res = call();
  const added = [...g.cells.values()].filter((c) => !before.has(c));
  for (const { pos: [x, y, z], block } of added)
    assert.ok(x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1, `${name}: ${block} at ${x},${y},${z} is outside the footprint`);
  assert.ok(added.length > 0, `${name}: placed nothing`);
  assert.equal(res.placed, added.length, `${name}: placed count`);
  assert.deepEqual(res.refused, [], `${name}: refused on empty ground`);
  assert.equal(call().placed, 0, `${name}: second call wrote into filled cells`);
  console.log(`ok ${name}: ${added.length} blocks`);
}

run("groundColumn", [5, 1, 5, 5, 3, 5], () => h1.groundColumn(g, 5, 5, 3));

// over: a paving laid over the ground column at (1, 4, 1) replaces its grass, and nothing else
h1.groundColumn(g, 1, 1, 4);
assert.equal(h1.walkPaving(g, [1, 1, 1, 1], 4, { over: true }).placed, 1, "walkPaving over: placed");
assert.equal(g.blockAt(1, 4, 1), "minecraft:smooth_stone", "walkPaving over: surface replaced");
assert.equal(g.blockAt(1, 3, 1), "minecraft:dirt", "walkPaving over: below untouched");

run("walkPaving", [3, 1, 1, 6, 1, 3], () => h1.walkPaving(g, [3, 1, 6, 3], 1));
run("amphitheatreRing", [20, 1, 10, 40, 5, 30], () => h1.amphitheatreRing(g, 30, 20, 1));
run("stationShell", [0, 3, 36, 10, 8, 45], () => h1.stationShell(g, 0, 3, 36));
run("playLog", [14, 4, 40, 17, 4, 40], () => h1.playLog(g, 14, 40, 4, "x"));
run("cypress", [18, 1, 34, 32, 7, 46], () => h1.cypress(g, 24, 1, 40));
run("bench", [36, 1, 40, 40, 1, 40], () => h1.bench(g, 36, 1, 40, 5));
run("lampPost", [44, 1, 44, 44, 4, 44], () => h1.lampPost(g, 44, 1, 44));

console.log("all h1 helpers passed");
