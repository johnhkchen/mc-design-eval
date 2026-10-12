// Room 6: the Atrium interior (plan.md ROOMS, box [10,2,10,25,5,21]). The impluvium, coping, columns, beams, lamps and
// corner pots belong to the atrium part (P4); this part only adds the reception furniture into the air box.
//
// Design: the pool is the focus, so two marble benches (quartz stairs as seats) stand on the west and east sides of
// the coping, facing it, each with a marble side table (pillar + slab) and a potted plant at its elbow. Every path
// stays clear: the fauces-to-tablinum axis along z19..21, the strip x10 down the west side, the strip x22..25 down the
// east side, and the cells in front of the cubicula doorways (x10 at z12 and z18).
import { QUARTZ_STAIRS, QUARTZ_PILLAR, SMOOTH_QUARTZ_SLAB, POTTED_FERN, POTTED_AZALEA_BUSH } from "../vocab.mjs";

/** A marble bench: quartz_stairs on y2, facing the pool (the stair's open side is the seat side). */
function bench(g, x, z, facing) {
  g.set(x, 2, z, QUARTZ_STAIRS, { facing, half: "bottom", shape: "straight", waterlogged: "false" });
}

/** A marble side table: quartz pillar pedestal (y2), smooth quartz slab top (y3, top half), a potted plant on it (y4). */
function sideTable(g, x, z, plant) {
  g.set(x, 2, z, QUARTZ_PILLAR, { axis: "y" });
  g.set(x, 3, z, SMOOTH_QUARTZ_SLAB, { type: "top", waterlogged: "false" });
  g.set(x, 4, z, plant);
}

export function build(g) {
  // West group: bench facing east towards the pool (the coping starts at x14, so x13 is the seat row), table at its elbow.
  bench(g, 13, 15, "east");
  bench(g, 13, 16, "east");
  sideTable(g, 12, 15, POTTED_FERN);
  // East group: mirror image, bench facing west (the coping ends at x21, so x22 is the seat row).
  bench(g, 22, 15, "west");
  bench(g, 22, 16, "west");
  sideTable(g, 23, 15, POTTED_AZALEA_BUSH);
}
