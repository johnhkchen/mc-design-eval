// Calls each h2 helper once on a small grid and checks that it wrote only inside the footprint it was given,
// that it placed something, and that it never wrote over a block it found in its way.
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { boulder, deckPost, bench, trailSign, shrub } from "./h2.mjs";

const g = new Grid([24, 16, 24], { dataVersion: 3955 });       // DataVersion 3955 = 1.21.1
g.fill([0, 0, 0], [23, 3, 23], "dirt");
g.fill([0, 4, 0], [23, 4, 23], "grass_block");                  // ground top at y 4

const snapshot = () => new Map([...g].map((c) => [c.pos.join(","), c.block]));

function call(name, box, fn) {
  const before = snapshot();
  const out = fn();
  const [x0, y0, z0, x1, y1, z1] = box;
  for (const c of g) {
    const [x, y, z] = c.pos;
    if (before.get(c.pos.join(",")) === c.block) continue;
    assert.ok(x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1, `${name} wrote ${c.pos} outside its footprint`);
  }
  assert.ok(out.placed > 0, `${name} placed nothing`);
  console.log(`${name}: ${out.placed} placed, ${out.refused} refused`);
  return out;
}

call("boulder", [2, 5, 2, 12, 12, 12], () => boulder(g, [2, 5, 2, 12, 12, 12], { lean: true, seam: true }));

call("deckPost", [17, 5, 17, 19, 10, 19], () => deckPost(g, 18, 18, { top: 10, brace: "west" }));
assert.equal(g.blockAt(18, 10, 18), "minecraft:dark_oak_log");
assert.equal(g.blockAt(17, 10, 18), "minecraft:dark_oak_stairs");

// air only: a boulder whose buried courses sit in the dirt has them refused, and the dirt stays
const sunk = call("boulder (sunk)", [0, 2, 20, 5, 8, 23], () => boulder(g, [0, 2, 20, 5, 8, 23]));
assert.ok(sunk.refused >= 1, "the buried courses should be refused");
assert.equal(g.blockAt(1, 3, 21), "minecraft:dirt");

call("bench", [4, 9, 20, 6, 9, 21], () => bench(g, 4, 9, 20, "north"));
assert.equal(g.get(4, 9, 20).state.facing, "south", "seat faces north, so the stairs' back is south");
assert.equal(g.blockAt(4, 10, 20), "minecraft:air", "nothing above the seat");

call("trailSign", [22, 5, 3, 22, 7, 3], () => trailSign(g, 22, 3));

call("shrub azalea", [14, 5, 14, 14, 5, 14], () => shrub(g, 14, 14, "azalea"));
call("shrub fern", [19, 5, 19, 21, 5, 21], () => shrub(g, 20, 20, "fern"));
call("shrub large_fern", [0, 5, 15, 2, 6, 17], () => shrub(g, 1, 16, "large_fern"));
assert.equal(g.get(1, 6, 16).state.half, "upper");
call("shrub moss_carpet", [10, 5, 20, 10, 5, 20], () => shrub(g, 10, 20, "moss_carpet"));

console.log("test-h2: ok");
