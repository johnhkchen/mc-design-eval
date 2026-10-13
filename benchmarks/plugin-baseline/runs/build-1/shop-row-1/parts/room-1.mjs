// Part "room: keeper aisle 1" (parts/room-1.mjs): the service route behind tenant 1's sockets. Plain brick (the shell's
// walls), lit, no furniture beyond the lanterns. The aisle is 8 long (x 4..11) and 2 deep (z 3..4) in rooms.json's box
// [4,6,3,11,12,4]; keeper door at x 7, z 2. A dark_oak beam runs along the ceiling at z 3 and two lanterns hang from it,
// one each side of the door's line of sight, so every floor cell of the aisle reads at light 8 or more.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DARK_OAK_PLANKS } from "../vocab/base.mjs";

export function build(g) {
  // Beam: a ceiling line of dark_oak_planks at y 12 (the box's top course; the flats' floor at y 13 is above it).
  g.fill([4, 12, 3], [11, 12, 3], DARK_OAK_PLANKS);
  // Two hanging lanterns under the beam (y 11, clear of the 2-high walking lane at y 7..8).
  g.set(6, 11, 3, ...B.lantern(true));
  g.set(10, 11, 3, ...B.lantern(true));
}
