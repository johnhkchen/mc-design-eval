// SPDX-License-Identifier: AGPL-3.0-or-later
// Grounds and garden: passage, west strip, fences, gate, lamp post, four beds, paths, fruit tree, compost, water butt, bench.
import {
  rng, COARSE_DIRT, PODZOL, GRAVEL, CARROTS, POTATOES, BEETROOTS, WHEAT,
  gardenBed, pathRun, fenceRun, gateDouble, lampPost, fruitTree, compostStore, waterButt, bench,
} from "../vocab.mjs";

const SURFACE = 5; // lot surface (ground, paths)
const TOP = 6;     // the layer people walk on and the plants and fences stand on
const GRASS_ID = "minecraft:grass_block";

/** Passage, paths, beds, fences, gate, trees, stores and bench on the garden side of the house (plan.md SITE). */
export function build(g) {
  const roll = rng(6);

  // Passage: dirt down the middle, gravel edges (plan.md SITE: side passage dirt_path/gravel mixed).
  pathRun(g, [[22, 6], [22, 21]], 2, SURFACE, { over: true });
  // The east chimney's footing (x 20..21, z 13..14) stands on this edge: the gravel stops either side of it.
  pathRun(g, [[20, 6], [20, 12]], 2, SURFACE, { block: GRAVEL, over: true });
  pathRun(g, [[20, 15], [20, 21]], 2, SURFACE, { block: GRAVEL, over: true });
  pathRun(g, [[24, 6], [24, 21]], 2, SURFACE, { block: GRAVEL, over: true });

  // Path a (along the back wall, keeper's rear door x16 to the gate), path b (spine), path c (from the back door).
  pathRun(g, [[15, 23], [25, 23]], 2, SURFACE, { over: true });
  pathRun(g, [[18, 25], [18, 36]], 2, SURFACE, { over: true });
  pathRun(g, [[12, 27], [17, 27]], 2, SURFACE, { over: true });
  pathRun(g, [[12, 26], [12, 28]], 1, SURFACE, { over: true }); // widens to 3 at the door step

  // Coarse dirt edges along path b, where the grass is.
  for (let z = 25; z <= 36; z++) {
    if (g.blockAt(20, SURFACE, z) === GRASS_ID) g.set(20, SURFACE, z, COARSE_DIRT);
    if (z !== 27 && z !== 28 && g.blockAt(17, SURFACE, z) === GRASS_ID) g.set(17, SURFACE, z, COARSE_DIRT);
  }

  // Four beds (farmland with a water source; the spruce slab ring sits round each box).
  gardenBed(g, 13, 31, 16, 35, [14, 32], CARROTS);
  gardenBed(g, 21, 31, 24, 32, [22, 31], BEETROOTS);
  gardenBed(g, 21, 26, 24, 28, [22, 26], WHEAT);
  gardenBed(g, 3, 34, 9, 35, [5, 34], POTATOES);

  // Fence: west strip and lot perimeter as one run (a post at each corner), the passage split at the gate.
  fenceRun(g, [[3, 6], [1, 6], [1, 37], [26, 37], [26, 6]], TOP);
  fenceRun(g, [[20, 22], [21, 22]], TOP);
  fenceRun(g, [[24, 22], [25, 22]], TOP);
  gateDouble(g, 22, 22, "south", { y: TOP });
  lampPost(g, 25, 21, TOP);

  // Fruit tree at the south-east corner of the garden; podzol and coarse dirt under its crown.
  fruitTree(g, 23, 35, TOP);
  for (let x = 21; x <= 25; x++) for (let z = 33; z <= 37; z++) {
    if (g.blockAt(x, SURFACE, z) !== GRASS_ID) continue;
    const p = roll();
    if (p < 0.35) g.set(x, SURFACE, z, PODZOL);
    else if (p < 0.5) g.set(x, SURFACE, z, COARSE_DIRT);
  }

  // Grass tufts in the west strip (short grass on grass).
  for (let x = 2; x <= 3; x++) for (let z = 8; z <= 20; z++) {
    if (roll() < 0.2) g.set(x, TOP, z, "short_grass");
  }

  // Compost and stores against the rear wall, water butt under the wing eave, bench by the back door.
  compostStore(g, 12, 23, { y: TOP });
  waterButt(g, 12, 29, TOP);
  bench(g, 12, TOP, 25, "east");

  // Lantern posts for the dark ground: the light map had 248 cells at 0 (street, passage, garden, back lot). These
  // posts clear them all (every floor cell 1+; the road and lot edge are dim). Kept off the house, the shop, the fruit
  // tree's crown and the lot edge.
  for (const [x, z] of [[22, 5], [20, 35], [2, 24], [4, 32], [2, 11], [20, 3], [24, 13], [11, 33], [23, 3], [14, 24], [1, 3], [20, 7], [2, 32], [6, 31]]) {
    lampPost(g, x, z, TOP);
  }
}
