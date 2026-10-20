// Smoke test for vocab/h2.mjs: each helper once on one grid, every cell it wrote checked against its footprint.
// Run: node vocab/test-h2.mjs
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h2 from "./h2.mjs";

const AIR = "minecraft:air";
const inside = (b, [x, y, z]) => x >= b[0] && y >= b[1] && z >= b[2] && x <= b[3] && y <= b[4] && z <= b[5];
const g = new Grid([172, 24, 42], { dataVersion: 3955 });

// Run one helper; assert it wrote only inside `allowed`, that placed matches the cells added, and that
// nothing was refused (or only refusals `okRefused` accepts).
function run(name, allowed, fn, okRefused = () => false) {
  const before = new Set(g.cells.keys());
  const r = fn();
  const added = [...g.cells.keys()].filter((k) => !before.has(k)).map((k) => k.split(",").map(Number));
  const outside = added.filter((c) => !inside(allowed, c));
  assert.equal(outside.length, 0, `${name} wrote outside its footprint: ${JSON.stringify(outside)}`);
  assert.equal(r.placed, added.length, `${name}: placed ${r.placed}, cells added ${added.length}`);
  assert.ok(r.refused.every(okRefused), `${name} refused: ${JSON.stringify(r.refused)}`);
  console.log(`ok  ${name}: ${r.placed} blocks`);
  return r;
}

run("stringCourse", [13, 4, 7, 41, 4, 15],
  () => h2.stringCourse(g, [14, 8, 40, 14], 4, "polished_granite"));
assert.equal(g.blockAt(13, 4, 9), "minecraft:polished_granite_slab");

// the string course at y4 is this window's sill, so the window skips its own
run("archedWindow", [17, 4, 7, 17, 9, 9],
  () => h2.archedWindow(g, 17, 5, 8, "north", 4, { sill: false }));
assert.equal(g.blockAt(17, 6, 8), "minecraft:gray_stained_glass_pane");
assert.equal(g.blockAt(17, 9, 7), "minecraft:polished_granite_stairs");

const roof = h2.slateRoof({ family: "castle", style: "gable", ridgeAxis: "x" });
assert.equal(roof.style, "gable");
assert.equal(roof.material, "deepslate_tiles");
assert.equal(roof.pitch, 1);

run("flagpole", [29, 19, 6, 29, 22, 6], () => h2.flagpole(g, 29, 19, 6, 4));
assert.equal(g.blockAt(29, 22, 6), "minecraft:end_rod");

run("parterre", [16, 0, 17, 22, 1, 19], () => h2.parterre(g, 16, 17, 22, 19));

run("clerestory", [63, 8, 16, 75, 9, 16],
  () => h2.clerestory(g, { along: "x", from: 63, to: 75, at: 16 }));
assert.equal(g.blockAt(64, 8, 16), AIR);   // every second cell only
assert.equal(g.blockAt(65, 9, 16), "minecraft:glass_pane");

run("loggia", [115, 0, 0, 127, 4, 1],
  () => h2.loggia(g, 115, 127, 0));
assert.equal(g.blockAt(117, 3, 1), "minecraft:lantern");
assert.notEqual(g.blockAt(117, 4, 1), AIR);   // the lantern hangs from the frieze

// balconyBand first (glass on the court face), then the drum: the drum must leave the glass alone
run("balconyBand", [140, 8, 0, 170, 8, 30],
  () => h2.balconyBand(g, 155, 15, 7.5, 8, { slot: { box: [150, 1, 160, 3], rOut: 14.5 } }));
assert.equal(g.blockAt(163, 8, 15), "minecraft:black_stained_glass_pane");
assert.equal(g.blockAt(155, 8, 1), "minecraft:black_stained_glass_pane");

run("drumRing", [140, 3, 0, 170, 9, 30],
  () => h2.drumRing(g, 155, 15, 14.5, 7.5, 3, 9),
  ([, y]) => y === 8);   // refused: only the glass band cells at y8
assert.equal(g.blockAt(163, 8, 15), "minecraft:black_stained_glass_pane");
assert.notEqual(g.blockAt(163, 5, 15), AIR);

// parterre over ground: a stone cell it may not replace is refused, and the flower above it is not placed
const g2 = new Grid([24, 4, 24], { dataVersion: 3955 });
g2.set(17, 0, 18, "stone");
const r2 = h2.parterre(g2, 16, 17, 22, 19);
assert.deepEqual(r2.refused.map((c) => c.slice(0, 3)), [[17, 0, 18]]);
assert.equal(g2.blockAt(17, 1, 18), AIR);
console.log("ok  parterre refuses ground it may not replace");

console.log("PASS vocab/h2.mjs");
