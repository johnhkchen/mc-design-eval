// Calls each h2 helper once on a small grid; checks placements stay inside the footprint given, and that a helper
// refuses to write over existing blocks. Run: node vocab/test-h2.mjs
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { voussoirArch, doorPair, balustrade, belfryStage, dome, skylight, hangLamp } from "./h2.mjs";

const g = new Grid([40, 30, 40]);
const inside = (res, [x0, y0, z0, x1, y1, z1]) => {
  for (const [x, y, z] of res.placed)
    assert.ok(x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1, `placed outside footprint: ${x},${y},${z}`);
  assert.ok(res.placed.length > 0, "nothing placed");
};

inside(voussoirArch(g, { x0: 2, width: 6, y0: 2, z: 3, rise: 3 }), [2, 2, 3, 7, 5, 3]);
inside(doorPair(g, 10, 3), [10, 1, 3, 12, 4, 3]);
inside(balustrade(g, { x0: 2, x1: 14, y: 20, z: 6 }), [2, 20, 6, 14, 21, 6]);
inside(belfryStage(g, { box: [18, 10, 4, 28, 19, 14], colsAt: [23] }), [18, 10, 4, 28, 19, 14]);
inside(dome(g, { x0: 18, z0: 20, y: 24 }), [18, 24, 20, 22, 27, 24]);
inside(skylight(g, 2, 9, { z0: 4, z1: 14, y: 22 }), [2, 22, 4, 9, 24, 14]);
g.set(5, 12, 16, "smooth_stone");
inside(hangLamp(g, 5, 10, 16, { floor: 1 }), [5, 10, 16, 5, 11, 16]);

// states: both door halves, lantern hanging, chain above it
assert.equal(g.get(10, 1, 3).state.half, "lower");
assert.equal(g.get(10, 2, 3).state.half, "upper");
assert.equal(g.get(5, 10, 16).block, "minecraft:lantern");
assert.equal(g.get(5, 10, 16).state.hanging, "true");
assert.equal(g.get(5, 11, 16).block, "minecraft:chain");

// air only: a second doorPair on the same cells places nothing and refuses every cell
const again = doorPair(g, 10, 3);
assert.equal(again.placed.length, 0);
assert.ok(again.refused.length > 0);

// hangLamp refuses with nothing to hang from, and a lantern that would block the lane
assert.ok(hangLamp(g, 20, 10, 20).refused.length === 1);
assert.ok(hangLamp(g, 21, 2, 20, { floor: 1 }).refused.length === 1);

console.log("test-h2: ok (7 helpers, footprints, states, air-only refusal)");
