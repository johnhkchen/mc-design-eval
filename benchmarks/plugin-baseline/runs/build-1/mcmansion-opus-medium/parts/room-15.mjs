// Room 15: interior designer, bonus room (media and game room over the garage). Inner air x30..40, y6..8, z14..24.
// Entered from the upper hall through the door cell (29,6..7,16). Front windows z13 (x31, x35, x39), east windows
// x41 (z17..18, z21..22), back window (35..36, z25): nothing placed in front of them or in the door's path.
// Stairs `facing` = the side of the full-height back (vocab/build.mjs B.stairs), so a seat facing east has facing=west.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { BLACK_CONCRETE, SMOOTH_SANDSTONE, LIGHT_GRAY_CARPET, LANTERN, POTTED_FERN, BARREL, hangLamp } from "../vocab.mjs";

const put = (g, x, y, z, pair) => g.set(x, y, z, ...pair);

export function build(g) {
  // Floor is oak_planks at y5 (P1); this designer only adds into the air y6..8.

  // Media wall: a 2x3 black panel on the east wall, between the x41 windows (z17..18 and z21..22), so no window is covered.
  for (let z = 19; z <= 20; z++)
    for (let y = 6; y <= 8; y++) put(g, 40, y, z, [BLACK_CONCRETE, {}]);

  // Sofa: three dark-oak stair seats facing the TV (facing = the back side, which is west).
  for (let z = 18; z <= 20; z++) put(g, 37, 6, z, B.stairs("dark_oak", "west", "bottom"));

  // Coffee table: a low dark-oak slab between the sofa and the TV, with a hanging lantern over it.
  put(g, 38, 6, 19, B.slab("dark_oak", "bottom"));
  hangLamp(g, 38, 8, 19);

  // Game table: a 2x2 smooth-sandstone table with four stools (stool facing = its back side, away from the table).
  for (let x = 33; x <= 34; x++) for (let z = 18; z <= 19; z++) put(g, x, 6, z, [SMOOTH_SANDSTONE, {}]);
  put(g, 32, 6, 18, B.stairs("dark_oak", "west", "bottom"));
  put(g, 35, 6, 19, B.stairs("dark_oak", "east", "bottom"));
  put(g, 33, 6, 17, B.stairs("dark_oak", "north", "bottom"));
  put(g, 34, 6, 20, B.stairs("dark_oak", "south", "bottom"));
  hangLamp(g, 33, 8, 18);

  // Bean bags: three light carpet pads on the floor in the lounge corner, under a hanging lantern.
  put(g, 31, 6, 21, [LIGHT_GRAY_CARPET, {}]);
  put(g, 33, 6, 22, [LIGHT_GRAY_CARPET, {}]);
  put(g, 32, 6, 23, [LIGHT_GRAY_CARPET, {}]);
  hangLamp(g, 32, 8, 22);
  // A second hanging lamp over the back half, so the far floor (the back wall and the east corner) is lit too.
  hangLamp(g, 36, 8, 22);

  // Storage along the back wall (z24, clear of the window at x35..36): two barrels.
  put(g, 31, 6, 24, [BARREL, { facing: "up", open: "false" }]);
  put(g, 32, 6, 24, [BARREL, { facing: "up", open: "false" }]);

  // Standing lanterns in the corners (floor light for the far cells) and a fern in the far corner.
  put(g, 30, 6, 24, [LANTERN, { hanging: "false", waterlogged: "false" }]);
  put(g, 40, 6, 14, [LANTERN, { hanging: "false", waterlogged: "false" }]);
  put(g, 40, 6, 23, [POTTED_FERN, {}]);
}
