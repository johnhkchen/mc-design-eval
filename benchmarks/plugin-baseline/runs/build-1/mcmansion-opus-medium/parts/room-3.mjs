// Room 3: formal dining room, inner air [22,2,12,28,4,17]. Entered from the foyer through the cased opening (21,2..4,13..14)
// and from the kitchen through the door (23,2..3,18). Design: a 4x2 table on a dark oak plinth with a quartz top, eight
// dark oak stair seats (four each side, facing the table), a cluster of hanging lanterns over the table as the chandelier,
// and a glazed china cabinet with a fern on the east wall. The walkways (x22..23 and the z12 and z17 rows) stay clear.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DARK_OAK_PLANKS, GLASS_PANE, POTTED_FERN } from "../vocab.mjs";

const put = (g, x, y, z, pair) => g.set(x, y, z, ...pair);

export function build(g) {
  // Table: dark oak plinth y2 over x24..27 z14..15, smooth quartz slab top (bottom half) at y3.
  for (let x = 24; x <= 27; x++) for (let z = 14; z <= 15; z++) {
    put(g, x, 2, z, B.block(DARK_OAK_PLANKS));
    put(g, x, 3, z, B.slab("smooth_quartz", "bottom"));
  }

  // Eight seats: four on the north side (z13, facing south) and four on the south side (z16, facing north).
  for (let x = 24; x <= 27; x++) {
    put(g, x, 2, 13, B.stairs("dark_oak", "south", "bottom"));
    put(g, x, 2, 16, B.stairs("dark_oak", "north", "bottom"));
  }

  // Chandelier: four hanging lanterns from the ceiling (y5) over the table centre, at y4 so the table top stays clear.
  for (const x of [25, 26]) for (const z of [14, 15]) put(g, x, 4, z, B.lantern(true));

  // China cabinet on the east wall (x28, z13..16): dark oak base, glass upper, a fern on the base.
  for (let z = 13; z <= 16; z++) put(g, 28, 2, z, B.block(DARK_OAK_PLANKS));
  for (const z of [13, 15, 16]) for (const y of [3, 4]) put(g, 28, y, z, B.pane(GLASS_PANE));
  put(g, 28, 3, 14, B.block(POTTED_FERN));

  // Standing lanterns in the two far corners, out of the walkways, for the room's ambient light.
  put(g, 28, 2, 12, B.lantern(false));
  put(g, 22, 2, 17, B.lantern(false));
}
