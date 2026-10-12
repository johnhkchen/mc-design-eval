// Site (P6, plan.md SITE): the front garden behind an iron fence, the street lamp, the back deck with its rail and stair,
// the patio, the back garden (grass, path, tree, vegetable bed) and the garden fences. Ticks 24, 25, 28, 29, 30.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import {
  BACK_GARDEN, GARDEN_FENCE, GRASS_BLOCK, POLISHED_ANDESITE, POLISHED_BLACKSTONE_WALL, SPRUCE_FENCE,
  ironFence, streetLamp, gardenBed, deck, deckStair, gardenTree, vegBed,
} from "../vocab.mjs";

export function build(g) {
  ironFence(g);
  streetLamp(g);
  gardenBed(g);

  // Back garden grass first; the deck stair then sets its own spruce_planks under the steps (x11..13 z38..40).
  g.fill([BACK_GARDEN.x[0], 0, BACK_GARDEN.z[0]], [BACK_GARDEN.x[1], 0, BACK_GARDEN.z[1]], GRASS_BLOCK);
  deck(yieldingToSills(g));
  deckStair(g);
  // The path runs from the stair foot (z41) to the back fence, x11..12.
  g.fill([11, 0, 41], [12, 0, 48], POLISHED_ANDESITE);
  gardenTree(g);
  vegBed(g);
  gardenFences(g);
  // Garden lamps on the back garden (it was dark): the street lamp's post and lantern, one per quarter.
  for (const [x, z] of [[3, 40], [10, 40], [9, 48], [14, 44]]) gardenLamp(g, x, z);
}

/** A garden lamp: a polished_blackstone_wall post (y1..3) under a standing lantern at y4, the street lamp's build. */
function gardenLamp(g, x, z) {
  for (let y = 1; y <= 3; y++) g.set(x, y, z, POLISHED_BLACKSTONE_WALL, { up: "true" });
  g.set(x, 4, z, ...B.lantern(false));
}

/**
 * A set() that skips the back-window sills' cells. openings.mjs (locked before this part) sets smooth_quartz_slab sills at
 * y4 on the deck's z33 row at x3..4 and x11..12, so the deck floor yields there. deck() only calls set(), so this is enough.
 */
function yieldingToSills(g) {
  const sillCells = new Set(["3,4,33", "4,4,33", "11,4,33", "12,4,33"]);
  const view = {
    set(x, y, z, ...rest) {
      if (!sillCells.has(`${x},${y},${z}`)) g.set(x, y, z, ...rest);
      return view;
    },
  };
  return view;
}

/** Garden fences: spruce_fence two high (y1..2) along x0 and x15 (z33..49) and across the back at z49 (x0..15). */
function gardenFences(g) {
  const cells = new Set();
  for (let z = GARDEN_FENCE.sideZ[0]; z <= GARDEN_FENCE.sideZ[1]; z++)
    for (const x of GARDEN_FENCE.sidesX) cells.add(`${x},${z}`);
  for (let x = GARDEN_FENCE.backX[0]; x <= GARDEN_FENCE.backX[1]; x++) cells.add(`${x},${GARDEN_FENCE.backZ}`);
  for (const k of cells) {
    const [x, z] = k.split(",").map(Number);
    const link = (dx, dz) => (cells.has(`${x + dx},${z + dz}`) ? "true" : "false");
    for (let y = GARDEN_FENCE.y[0]; y <= GARDEN_FENCE.y[1]; y++)
      g.set(x, y, z, SPRUCE_FENCE, { north: link(0, -1), south: link(0, 1), east: link(1, 0), west: link(-1, 0) });
  }
}
