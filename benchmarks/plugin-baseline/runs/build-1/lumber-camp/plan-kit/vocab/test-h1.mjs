// Smoke test for vocab/h1.mjs: each helper, called once on a fresh grid, places blocks only inside the footprint it
// was given, and never over a block already there. Run: node vocab/test-h1.mjs
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h from "./h1.mjs";

const fresh = () => new Grid([24, 10, 24]);

// Every block a helper wrote must sit inside fp = [x0, y0, z0, x1, y1, z1].
function within(g, fp, name) {
  const [x0, y0, z0, x1, y1, z1] = fp;
  const cells = [...g].filter((c) => c.block !== "minecraft:air");
  assert.ok(cells.length > 0, `${name} placed nothing`);
  for (const { pos: [x, y, z], block } of cells) {
    assert.ok(x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1,
      `${name} wrote ${block} at ${x},${y},${z}, outside ${fp}`);
  }
}

{ const g = fresh(); h.plinthCourse(g, 2, 2, 8, 6, 1);
  within(g, [2, 1, 2, 8, 1, 6], "plinthCourse");
  assert.equal(g.blockAt(2, 1, 2), "minecraft:mossy_cobblestone"); }

{ const g = fresh(); h.paneWindow(g, 3, 5, 3, 4, 8, "x");
  within(g, [3, 2, 7, 5, 4, 8], "paneWindow");
  assert.equal(g.blockAt(4, 2, 7), "minecraft:spruce_slab"); }

{ const g = fresh(); h.lampPost(g, 12, 2, 2);
  within(g, [12, 1, 2, 12, 3, 2], "lampPost");
  assert.equal(g.blockAt(12, 3, 2), "minecraft:lantern"); }

{ const g = fresh(); h.topPlate(g, 2, 10, 8, 16);
  within(g, [2, 6, 10, 8, 6, 16], "topPlate");
  assert.equal(g.get(4, 6, 10).state.axis, "x"); }

{ const g = fresh(); h.filingBench(g, 14, 2);
  within(g, [14, 1, 2, 15, 2, 4], "filingBench"); }

{ const g = fresh(); h.brickStack(g, 10, 10, 6, 5);
  within(g, [9, 1, 9, 12, 7, 12], "brickStack");
  assert.equal(g.blockAt(11, 6, 11), "minecraft:campfire");
  assert.equal(g.blockAt(10, 7, 10), "minecraft:air"); }

{ const g = fresh(); h.messTable(g, 2, 6, 14);
  within(g, [2, 2, 13, 6, 3, 15], "messTable"); }

{ const g = fresh(); h.groundPatch(g, 0, 0, 11, 11);
  within(g, [0, 0, 0, 11, 0, 11], "groundPatch"); }

{ const g = fresh(); h.leanToPost(g, 18, 18);
  within(g, [18, 1, 18, 18, 3, 18], "leanToPost"); }

// Air only: a block already in the way survives, and a dirt_path survives groundPatch.
{ const g = fresh(); g.set(4, 1, 2, "stone"); h.plinthCourse(g, 2, 2, 8, 6, 1);
  assert.equal(g.blockAt(4, 1, 2), "minecraft:stone"); }
{ const g = fresh(); g.set(3, 0, 3, "dirt_path"); h.groundPatch(g, 0, 0, 6, 6);
  assert.equal(g.blockAt(3, 0, 3), "minecraft:dirt_path"); }

// Refuses a plain object where the grid should be.
assert.throws(() => h.leanToPost({}, 1, 1), TypeError);

console.log("test-h1: ok (9 helpers, footprint + air-only checks)");
