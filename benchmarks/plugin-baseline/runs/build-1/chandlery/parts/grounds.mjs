// Grounds and lean-to (street, yard, fences, hives, tree, woodpile, lean-to posts and racks), plan.md PARTS 6.
// Ground at y=0 (paths, patches, herb bed, lean-to floor), everything else at y=1. Writes go through g.set, so the
// runParts lock refuses anything an earlier part already built.
import {
  streetRows, picketFence, hiveStand, appleTree, leanToBay, candleRack,
  BARREL, CAULDRON, DIRT_PATH, COARSE_DIRT, PODZOL, SPRUCE_LOG, SPRUCE_SLAB,
  DANDELION, POPPY, CORNFLOWER, OXEYE_DAISY, ALLIUM, SWEET_BERRY_BUSH, DARK_OAK_FENCE,
} from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// lamp posts (dark oak fence, a standing lantern on top) for the street, the passage and the yard: the paths and
// courts had no block light, so they were dark (0) cells outdoors. The rooms have their own fittings.
const LAMPS = [[2, 6], [14, 6], [23, 6], [2, 25], [20, 27], [6, 31]];

export function build(g) {
  // ---- street, kerb, pavement (y=0) ----
  streetRows(g, 0, 25, 0);

  // ---- ground patches and paths (y=0) ----
  // east passage: pavement to the yard gate
  g.fill([20, 0, 8], [24, 0, 17], DIRT_PATH);
  // yard path: from the gate (x=21, z=18) south, widening at the gate, then west to the lean-to's south side
  g.fill([21, 0, 18], [21, 0, 25], DIRT_PATH);
  g.set(22, 0, 18, DIRT_PATH);
  g.set(22, 0, 19, DIRT_PATH);
  g.set(22, 0, 20, DIRT_PATH);
  g.fill([15, 0, 25], [21, 0, 25], DIRT_PATH);
  // herb strip bed x 1..4, z 8..17
  g.fill([1, 0, 8], [4, 0, 17], COARSE_DIRT);
  // coarse dirt round the apple tree, podzol patches by the fence and hives
  g.fill([2, 0, 21], [4, 0, 23], COARSE_DIRT);
  for (const x of [14, 16, 18, 20, 22]) g.set(x, 0, 31, PODZOL);
  g.set(19, 0, 19, PODZOL);
  g.set(20, 0, 20, PODZOL);
  g.set(23, 0, 19, PODZOL);
  g.set(23, 0, 20, PODZOL);

  // ---- herb strip plants (y=1): sweet berry bushes, poppies, dandelions ----
  const herb = [SWEET_BERRY_BUSH, POPPY, null, DANDELION];
  for (let z = 8; z <= 17; z++)
    for (let x = 1; x <= 4; x++) {
      const block = herb[(x + 2 * z) % 4];
      if (block) g.set(x, 1, z, block, block === SWEET_BERRY_BUSH ? { age: "3" } : undefined);
    }

  // ---- fences: front yard fence (z=18), side runs (x=1, x=24), back run (z=32) ----
  // the lean-to's post at (18,1,18) is the corner for the front run, so it starts at x=19
  picketFence(g, 19, 18, 24, 18, 1, [[21, 18]]);
  picketFence(g, 1, 18, 4, 18, 1, [[2, 18]]);
  picketFence(g, 1, 18, 1, 32, 1);
  picketFence(g, 24, 18, 24, 32, 1);
  picketFence(g, 1, 32, 24, 32, 1);

  // ---- beehives and the bee flower bed (z 29..30); the hives stand on z=31 ----
  for (const x of [15, 17, 19, 21]) hiveStand(g, x, 1, 31, "north");
  const bed = [DANDELION, POPPY, CORNFLOWER, OXEYE_DAISY, ALLIUM];
  for (let x = 14; x <= 22; x++)
    for (let z = 29; z <= 30; z++) g.set(x, 1, z, bed[(x + 2 * z) % bed.length]);

  // ---- woodpile (hearth fuel) x 10..12, z 29..30: logs along x, two high, a bottom-slab lid ----
  g.fill([10, 1, 29], [12, 2, 30], SPRUCE_LOG, { axis: "x" });
  for (let x = 10; x <= 12; x++)
    for (let z = 29; z <= 30; z++) g.set(x, 3, z, SPRUCE_SLAB, { type: "bottom" });

  // ---- tallow barrels and the cauldron by the back gate ----
  for (const [x, z] of [[2, 28], [3, 28], [2, 29], [3, 29], [2, 30]]) g.set(x, 1, z, BARREL, { facing: "up", open: "false" });
  g.set(4, 1, 30, CAULDRON);

  // ---- apple tree in the yard ----
  appleTree(g, 3, 1, 22);

  // ---- drying lean-to: floor, posts, shed roof, candle racks, tallow barrels ----
  // floor (y=0) under the lean-to: podzol and coarse dirt in patches
  for (let x = 15; x <= 18; x++)
    for (let z = 18; z <= 24; z++) g.set(x, 0, z, (x + z) % 3 === 0 ? COARSE_DIRT : PODZOL);
  // posts (y=1..3) on z=18, 21, 24. The shed's slab course is the roofs part's (it lays z=18..25), so the course
  // cells leanToBay names are already built and are left as they are.
  for (const z of [18, 21, 24]) leanToBay(g, 18, z);
  // candle racks on the east side, x=17
  candleRack(g, 17, 1, 19, { candles: 3 });
  candleRack(g, 17, 1, 22, { candles: 4 });
  // tallow barrels at the back, against the main house's back wall (the back door's landing at x=16 stays clear)
  g.set(15, 1, 18, BARREL, { facing: "up", open: "false" });
  g.set(17, 1, 18, BARREL, { facing: "up", open: "false" });
  g.set(15, 1, 19, BARREL, { facing: "up", open: "false" });

  // ---- lamp posts: a fence post with a standing lantern on it ----
  for (const [x, z] of LAMPS) {
    g.set(x, 1, z, DARK_OAK_FENCE);
    g.set(x, 2, z, ...B.lantern(false));
  }
}
