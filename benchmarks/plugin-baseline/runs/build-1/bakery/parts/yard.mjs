// Part 5, Yard and street furniture: sidewalk and yard ground blends, the rear yard fence with its two gates, the bench,
// the woodpile (oven fuel), the wheat and herb patch, two small spruces, the props cluster, and the dirt paths to the
// back door (x=8) and the wing side door (x=22..23, z=17). Plan coordinates from plan.md (SITE, FACADES, RESERVED).
// Everything is built into air or into the pre-set ground (y=0), so it never needs to overwrite an earlier part.
import {
  GRASS_BLOCK, PODZOL, COARSE_DIRT, DIRT_PATH,
  YARD_RUNS, WOODPILE, WHEAT_PATCH, PROPS, BENCH,
  yardFence, benchRun, woodpile, wheatPatch, smallSpruce, propCluster,
} from "../vocab.mjs";

// the yard ground: grass with podzol and coarse dirt patches, by the same cell hash scatterBlend uses (deterministic)
function yardGround(g) {
  for (let x = 0; x <= 23; x++) for (let z = 8; z <= 31; z++) {
    const roll = (((x * 73856093) ^ (z * 19349663)) >>> 0) % 1000 / 1000;
    const block = roll < 0.10 ? PODZOL : roll < 0.16 ? COARSE_DIRT : GRASS_BLOCK;
    g.set(x, 0, z, block);
  }
}

// dirt paths on the ground layer: the back-door path (x=8, z=23..30) and the wing side-door path (x=22..23, z=17)
function paths(g) {
  for (let z = 23; z <= 30; z++) g.set(8, 0, z, DIRT_PATH);
  for (const x of [22, 23]) g.set(x, 0, 17, DIRT_PATH);
}

export function build(g) {
  yardGround(g);
  paths(g);

  // rear yard fence on x=1 and x=23 (z=10..30) and z=30 (x=1..23), gates at (1,1,20) and (23,1,16)
  yardFence(g, YARD_RUNS);

  // bench: spruce_stairs against the fence side; the full back faces south so the seat looks north at the street
  benchRun(g, BENCH.x0, BENCH.x1, BENCH.z, "south");

  // oven fuel stack and lid
  woodpile(g, WOODPILE.x0, WOODPILE.x1, WOODPILE.z0, WOODPILE.z1);

  // herb and wheat patch: coarse dirt border, farmland with wheat
  wheatPatch(g, WHEAT_PATCH.x0, WHEAT_PATCH.x1, WHEAT_PATCH.z0, WHEAT_PATCH.z1);

  // two small spruces (heights 8 keep the crowns below y=10 and west of x=5)
  smallSpruce(g, 2, 15, 8);
  smallSpruce(g, 3, 29, 8);

  // flour sacks and yard props
  propCluster(g, PROPS.x0, PROPS.z0);
}
