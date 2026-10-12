// Calls every h4 helper once on a small grid and checks each placed cell lies inside the footprint it was given.
// Run: node vocab/test-h4.mjs
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h from "./h4.mjs";

const g = new Grid([40, 24, 40]);
g.fill([0, 0, 0], [39, 0, 39], "grass_block");

function inside(name, cells, [x0, y0, z0, x1, y1, z1]) {
  assert.ok(cells.length > 0, `${name} wrote nothing`);
  for (const [x, y, z] of cells)
    assert.ok(x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1, `${name} wrote outside its footprint at ${x},${y},${z}`);
}

inside("porchBay", [...h.porchBay(g, 5, 9, 5), ...h.porchBay(g, 9, 17, 5, { skip: [13] })], [5, 1, 5, 17, 3, 7]);
assert.equal(g.blockAt(13, 2, 5), "minecraft:air", "the step gap keeps no post or rail");
assert.match(g.blockAt(10, 2, 5), /spruce_fence$/);

g.set(12, 5, 6, "spruce_planks");
inside("hangLantern", h.hangLantern(g, 12, 3, 6, 1), [12, 3, 6, 12, 4, 6]);
assert.equal(g.blockAt(12, 3, 6), "minecraft:lantern");
assert.equal(h.hangLantern(g, 14, 3, 6, 1).length, 0, "no support above: nothing hangs");

g.set(23, 5, 8, "stripped_spruce_log");
inside("kneeBrace", h.kneeBrace(g, 24, 8, "w"), [24, 5, 8, 24, 5, 8]);
assert.match(g.blockAt(24, 5, 8), /spruce_stairs$/);

inside("sawCarriage", h.sawCarriage(g, 29, 9, 19), [28, 1, 9, 30, 1, 19]);
assert.equal(g.blockAt(29, 1, 14), "minecraft:stonecutter");

inside("fieldstoneStack", h.fieldstoneStack(g, 19, 12, 16, 15), [18, 1, 11, 21, 17, 14]);
assert.equal(g.blockAt(20, 16, 13), "minecraft:campfire");
assert.equal(g.blockAt(19, 15, 12), "minecraft:stone_bricks");

inside("bunkBed", h.bunkBed(g, 5, 10, "s"), [5, 2, 9, 5, 4, 12]);
assert.match(g.blockAt(5, 2, 10), /red_bed$/);
assert.match(g.blockAt(5, 4, 11), /red_bed$/);

inside("spruceTree", h.spruceTree(g, 30, 30), [28, 1, 28, 32, 10, 32]);
assert.equal(g.blockAt(30, 4, 30), "minecraft:spruce_log", "the trunk is not overwritten by leaves");

g.set(29, 6, 8, "stripped_spruce_wood");
inside("wallSign", h.wallSign(g, 29, 6, 7, "n", "SAWMILL"), [29, 6, 7, 29, 6, 7]);
assert.equal(h.wallSign(g, 30, 6, 7, "n", "X").length, 0, "no block behind the sign: nothing");

// Air only: an occupied cell in the way is left as it was.
g.set(28, 1, 10, "stone");
h.sawCarriage(g, 29, 9, 19);
assert.equal(g.blockAt(28, 1, 10), "minecraft:stone");

console.log("test-h4: all helpers placed blocks inside their footprints");
