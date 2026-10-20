// Smoke test for vocab/h4.mjs: each helper runs once on a small grid (solid ground to y4, air above). Every write must
// land inside the footprint given and above the ground; refusals and key states are checked too. Run: node vocab/test-h4.mjs
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import * as h4 from "./h4.mjs";

const g = new Grid([40, 24, 40], { dataVersion: 3955 });
g.fill([0, 0, 0], [39, 4, 39], "stone");

/** Run one helper; check every changed cell is inside box [[x0,y0,z0],[x1,y1,z1]] and above the ground (y >= 5). */
function run(name, box, fn) {
  const before = new Map(g.cells);
  const r = fn();
  const [a, b] = box;
  const changed = [...g.cells].filter(([k, v]) => before.get(k) !== v).map(([, v]) => v.pos);
  for (const [x, y, z] of changed) {
    assert.ok(x >= a[0] && x <= b[0] && y >= a[1] && y <= b[1] && z >= a[2] && z <= b[2], `${name}: wrote ${x},${y},${z} outside its footprint`);
    assert.ok(y >= 5, `${name}: wrote into the ground at y${y}`);
  }
  assert.ok(r.placed > 0, `${name}: placed nothing`);
  console.log(`ok ${name}: ${r.placed} placed, ${r.refused.length} refused`);
  return r;
}

run("walkStrip", [[2, 5, 2], [12, 6, 4]], () => h4.walkStrip(g, 2, 2, 12, 4, { height: (x) => (x < 6 ? 5 : 6) }));
assert.equal(g.get(5, 6, 3)?.block, "minecraft:smooth_stone_slab", "walkStrip: half-step slab on the lower cell");
assert.equal(g.get(5, 6, 3)?.state.type, "bottom");

run("portalFace", [[9, 5, 6], [11, 10, 14]], () => h4.portalFace(g, 10, 6, 14, { mouths: [[6, 8], [11, 13]] }));
assert.equal(g.get(9, 7, 9)?.state.hanging, "false", "portalFace: lantern on the pier face");
assert.equal(g.get(10, 6, 7), undefined, "portalFace: mouth stays open at y6");

run("fenceNet", [[20, 5, 20], [25, 11, 21]], () => h4.fenceNet(g, 20, 20, 25, 21));

run("runnel", [[2, 4, 28], [20, 5, 32]], () => h4.runnel(g, 2, 20, 30, { y: 5 }));
assert.equal(g.get(20, 5, 30)?.block, "minecraft:water", "runnel: water kept at the far end");
assert.ok(h4.runnel(new Grid([40, 24, 40]), 2, 4, 30, { y: 5 }).refused.length === 0, "runnel: air-only grid writes fully");

run("overlookDeck", [[2, 5, 26], [9, 11, 32]], () => h4.overlookDeck(g, 2, 26));
assert.equal(g.get(4, 8, 27)?.block, "minecraft:spruce_stairs", "overlookDeck: bench seat");
assert.equal(g.get(4, 8, 27)?.state.facing, "south", "overlookDeck: bench faces north");

run("promenade", [[12, 5, 36], [25, 5, 39]], () => h4.promenade(g, 12, 36, 25, 39, { y: 5 }));
const refusedPaving = h4.promenade(g, 12, 36, 14, 36, { y: 4 });
assert.equal(refusedPaving.placed, 0, "promenade: refuses paving on the ground");
assert.equal(refusedPaving.refused.length, 3);

run("cypress", [[26, 5, 26], [40, 16, 38]], () => h4.cypress(g, 32, 5, 32, 7));
const leaves = [...g.cells.values()].filter((v) => v.block === "minecraft:dark_oak_leaves");
assert.ok(leaves.length > 0 && leaves.every((v) => v.state.persistent === "true"), "cypress: leaves persistent");

console.log("h4 smoke test passed");
