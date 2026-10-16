// P0 east front room: the east unit's front parlour (x 7..9, y 3..6, z 10..12). Mirror of the west front room:
// bed head against the east wall, a table under the front window, one chair, a hanging lantern over the aisle.
// Lane x7 z10..12 stays clear from the front door (7,9) to the partition door (7,13).
import { bed_set, chair, hanging_lantern } from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // Bed: foot (8,3,12), head (9,3,12) against the solid east wall x10, cyan (east unit colour).
  bed_set(g, [8, 3, 12], "east", "cyan");

  // Table: spruce fence leg at (9,3,10), top slab (top half of y4) so its surface is y5 and nothing sits in a bottom slab.
  g.set(9, 3, 10, ...B.fence("spruce"));
  g.set(9, 4, 10, ...B.slab("spruce", "top"));
  // Standing lantern on the table: the focal light of the room.
  g.set(9, 5, 10, ...B.lantern(false));

  // Chair on the west side of the table, seat facing east toward it (stair back on the west).
  chair(g, 8, 3, 10, "east");

  // Hanging lantern from the ceiling (chained up to the roof or floor above) over the aisle at (8,11): lights the 3x3 room.
  hanging_lantern(g, 8, 6, 11);
}
