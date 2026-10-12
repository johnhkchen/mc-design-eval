// Room: Bay nook (interior designer), plan.md ROOMS: inner air [39,1,9,41,4,11], entered from the family room through
// the turret arch (39..41,1..3,12). Turret window seat along the front (z=9, under the window at x40), a reading chair
// under the east side window, a side seat under the west side window, a small table and a potted plant in the corner.
// The x=40 column (z9..11) is the clear 2-high path from the arch to the window seat. Lanterns hang from the y5 floor
// above the seat so the focal piece is the brightest cell. Floor (oak_planks at y0) is laid by the shell part.
import { B } from "../vocab.mjs";

export function build(g) {
  const seat = (x, z, facing) => g.set(x, 1, z, ...B.stairs("oak", facing, "bottom"));

  // window seat: three oak stairs along the turret's front wall, facing into the room (south)
  for (const x of [39, 40, 41]) seat(x, 9, "south");

  // side seat under the west turret window, facing east; reading chair under the east window, facing west
  seat(39, 10, "east");
  seat(41, 10, "west");

  // side table (bottom slab) beside the reading chair, and a potted plant in the far corner
  g.set(41, 1, 11, ...B.slab("smooth_quartz", "bottom"));
  g.set(39, 1, 11, "flower_pot");

  // hanging lanterns from the y5 floor: the focal lantern over the window seat, one over the table
  g.set(40, 4, 9, ...B.lantern(true));
  g.set(40, 4, 11, ...B.lantern(true));
}
