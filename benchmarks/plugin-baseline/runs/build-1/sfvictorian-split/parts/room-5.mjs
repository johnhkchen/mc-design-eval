// Room: Entry hall (interior designer). Inner air box [10,5,11,14,8,22]: x10..14, y5..8, z11..22.
// Entered through the entry door (11..12,5..7,10); doorways (9,5..6,12) parlour, (9,5..6,19) dining, (11,5..6,23) kitchen.
// Design: a dark-oak hall with the long stair up the east party wall (focal, newel lamp at its foot), a runner carpet
// from the front door to the kitchen, a coat post and a hall table with a seat on the west side, and three hanging lanterns.
// The stair's top step (13..14,9,16) sits in the storey-2 well the shell leaves open (plan: y9 over z11..16).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const STAIR_WOOD = "spruce";     // plan: main stair treads are spruce_stairs
const HALL_WOOD = "dark_oak";    // dark-oak hall: newel, table, seat, stringer fill

export function build(g) {
  // runner carpet: front door (z10) to the kitchen doorway (z23), clear of both doorway lines
  for (let z = 11; z <= 22; z++) for (const x of [11, 12]) g.set(x, 5, z, ...B.block("red_carpet"));

  // the long stair: treads at x13..14, z12..16, rising one block per step (y = 5 + (z - 12)), backs to the south
  for (let z = 12; z <= 16; z++) {
    const y = 5 + (z - 12);
    for (const x of [13, 14]) {
      g.set(x, y, z, ...B.stairs(STAIR_WOOD, "south", "bottom"));
      // stringer: solid under each tread down to the floor so the stair is supported
      for (let yy = 5; yy < y; yy++) g.set(x, yy, z, ...B.block(`${HALL_WOOD}_planks`));
    }
  }

  // focal newel at the stair foot (x14, z11): dark-oak post with a standing lantern on top
  g.set(14, 5, 11, ...B.fence(HALL_WOOD));
  g.set(14, 6, 11, ...B.fence(HALL_WOOD));
  g.set(14, 7, 11, ...B.lantern(false));

  // coat post beside the front door (x10, z12): fence post, two high
  g.set(10, 5, 12, ...B.fence(HALL_WOOD));
  g.set(10, 6, 12, ...B.fence(HALL_WOOD));

  // hall table and seat on the west side, clear of the dining doorway at z19 (x10, z19 stays open)
  g.set(10, 5, 21, ...B.fence(HALL_WOOD));
  g.set(10, 6, 21, ...B.slab(HALL_WOOD, "top"));
  g.set(10, 5, 20, ...B.stairs(HALL_WOOD, "west", "bottom"));

  // hanging lanterns from the storey-2 floor (y9 is solid over x10..12 and at z17..22 over the well)
  g.set(12, 8, 15, ...B.lantern(true));
  g.set(11, 8, 13, ...B.lantern(true));
  g.set(11, 8, 21, ...B.lantern(true));
  g.set(13, 8, 19, ...B.lantern(true));
}
