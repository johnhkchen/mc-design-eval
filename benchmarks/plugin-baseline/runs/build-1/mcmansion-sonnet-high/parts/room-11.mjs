// room: Bedroom 2 (teen, light blue): inner air x13..18, y6..8, z9..14. Door (19,6..7,14) on the east wall; shuttered
// window (14..16,7..8,8) in the north wall. Bed headboard on the west wall; desk under the window; dresser on the north
// wall; blue rug; lanterns for light. Item frames (posters) are entities, not blocks, so they are not placed here.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  const put = (x, y, z, pair) => g.set(x, y, z, ...pair);

  // rug (carpets are walkable; they sit on the y6 floor layer)
  for (let x = 15; x <= 17; x++) for (let z = 11; z <= 13; z++) put(x, 6, z, B.block("blue_carpet"));

  // bed: headboard on the west wall. facing = direction from foot to head, so the head (x13) sits west of the foot (x14)
  put(13, 6, 11, ["light_blue_bed", { facing: "west", part: "head", occupied: "false" }]);
  put(14, 6, 11, ["light_blue_bed", { facing: "west", part: "foot", occupied: "false" }]);

  // nightstand at the bed head: barrel with a lantern on top (bedside light)
  put(13, 6, 10, ["barrel", { facing: "up", open: "false" }]);
  put(13, 7, 10, B.lantern(false));

  // desk under the shuttered window: dark oak fence legs, top-half slab top (a full top face for the lamp and plant)
  put(14, 6, 9, B.fence("dark_oak"));
  put(16, 6, 9, B.fence("dark_oak"));
  for (let x = 14; x <= 16; x++) put(x, 7, 9, B.slab("dark_oak", "top"));
  put(14, 8, 9, B.lantern(false));
  put(16, 8, 9, ["potted_azalea_bush", {}]);

  // desk chair: spruce stairs as a seat, facing the desk (north)
  put(15, 6, 10, B.stairs("spruce", "north"));

  // dresser on the north wall, east end: two barrels with an oak slab top and a potted fern
  put(17, 6, 9, ["barrel", { facing: "up", open: "false" }]);
  put(18, 6, 9, ["barrel", { facing: "up", open: "false" }]);
  put(18, 7, 9, B.slab("oak", "top"));
  put(18, 8, 9, ["potted_fern", {}]);

  // bookshelf column on the east wall, clear of the door cells (18,6..7,14)
  put(18, 6, 11, B.block("bookshelf"));
  put(18, 7, 11, B.block("bookshelf"));

  // ceiling lantern over the bed foot (the east half has no free ceiling cell: earlier parts own it)
  put(14, 8, 12, B.lantern(true));
}
