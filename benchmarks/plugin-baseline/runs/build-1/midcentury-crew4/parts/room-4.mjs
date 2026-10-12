// ROOM living (interior designer): the show room. Inner air box [11,2,19,21,4,24]; the sunken conversation pit
// (13..17, 20..23) sits at its centre, with the freestanding fireplace (20..21, 21..22, built by the roof part) as
// the focus on the east. Orange sofa and egg chair face the pit and the atrium glass; a sideboard, a floor lamp and
// a spruce-panelled strip on the x=22 partition finish it. Lanterns hang from the beams over the pit and the lane.
import { conversation_pit, sofa_low, egg_chair, sideboard, panel_wall, hung_lantern } from "../vocab.mjs";

// set a single block into air only (earlier parts' cells are never overwritten)
function put(g, x, y, z, block, state) {
  if (g.isAir(x, y, z)) g.set(x, y, z, block, state);
}

export function build(g) {
  // sunken conversation pit: smooth_quartz_stairs rim at y=1 with orange cushions, spruce table in the middle
  conversation_pit(g, 13, 20, 17, 23);

  // low orange sofa on the west side, seat facing east into the pit
  sofa_low(g, 12, 20, 4, "z", "east");

  // egg chair by the atrium glass (north), facing the atrium through the open lane on z=19
  egg_chair(g, 19, 20, "north");

  // second orange sofa on the east side, seat facing west into the pit (its arms at z=21 and z=24)
  sofa_low(g, 18, 22, 2, "z", "west");

  // sideboard against the north edge of the room, under the dining opening; cabinet fronts face south
  sideboard(g, 13, 19, 2, "x", "south");

  // spruce panelling on the x=22 partition (living side), z=23..24 (z=21..22 is the fireplace)
  panel_wall(g, 21, 2, 4, 23, "east");
  panel_wall(g, 21, 2, 4, 24, "east");

  // floor lamp in the south-west corner: dark oak fence post with an end rod on top
  put(g, 11, 2, 24, "dark_oak_fence");
  put(g, 11, 3, 24, "dark_oak_fence");
  put(g, 11, 4, 24, "end_rod", { facing: "up" });

  // hanging lanterns under the ceiling: over the pit (x=16), over the south lane (x=19) and over the atrium-door lane
  // (x=20, z=20: z=19 has no ceiling block above it, the vault is open)
  hung_lantern(g, 16, 21, 4);
  hung_lantern(g, 19, 23, 4);
  hung_lantern(g, 20, 20, 4);
}
