// Room 16: Bonus room over the garage, interior designer. Playroom / media room over the three-car garage.
// Air box x1..17, y7..9, z6..21 (floor = oak planks at y6). Entry: arch at (18, y7..9, z14..15) from the upper hall.
// Front archWindows sit on z5 (xc=3, 8, 13), so nothing is placed on z6 at x2..4, x7..9, x12..14.
// Zones: TV wall on the south face (z21), sofa facing it, a game table with four chairs in the west, a bar corner
// in the NE, lanterns as the only light (no candles or torches in the palette).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const SPRUCE = "spruce";

export function build(g) {
  // ---- TV wall (south, z21): console at y7, big screen above it, lanterns at its flanks --------------------------
  g.fill([6, 7, 21], [12, 7, 21], "spruce_planks");
  g.fill([6, 8, 21], [12, 9, 21], "gray_concrete");
  g.set(5, 7, 21, ...B.lantern(false));
  g.set(13, 7, 21, ...B.lantern(false));

  // ---- sofa (faces the TV): backrest on z18, seats on z19 (stairs, back to the north), arms at the ends ----------
  g.fill([6, 7, 18], [12, 8, 18], "spruce_planks");
  for (let x = 7; x <= 11; x++) g.set(x, 7, 19, ...B.stairs(SPRUCE, "north", "bottom"));
  g.set(6, 7, 19, "spruce_planks");
  g.set(12, 7, 19, "spruce_planks");

  // ---- game table (west): 3x3 slab top at y7 with four chairs (stairs, back to the outside) ----------------------
  for (let x = 2; x <= 4; x++) for (let z = 11; z <= 13; z++) g.set(x, 7, z, ...B.slab(SPRUCE, "bottom"));
  g.set(1, 7, 12, ...B.stairs(SPRUCE, "west", "bottom"));
  g.set(5, 7, 12, ...B.stairs(SPRUCE, "east", "bottom"));
  g.set(3, 7, 10, ...B.stairs(SPRUCE, "north", "bottom"));
  g.set(3, 7, 14, ...B.stairs(SPRUCE, "south", "bottom"));

  // ---- bar corner (NE): counter on x15, back shelves on x17, stool on x14, lantern between them ------------------
  g.fill([15, 7, 7], [15, 7, 9], "spruce_planks");
  g.fill([17, 7, 7], [17, 7, 9], "spruce_planks");
  g.fill([17, 8, 7], [17, 8, 9], ...B.slab(SPRUCE, "bottom"));
  g.set(14, 7, 8, ...B.stairs(SPRUCE, "west", "bottom"));
  g.set(16, 7, 8, ...B.lantern(false));

  // ---- lanterns on the floor: corners and the room centre, so the room is lit at night ----------------------------
  g.set(1, 7, 6, ...B.lantern(false));
  g.set(1, 7, 21, ...B.lantern(false));
  g.set(17, 7, 21, ...B.lantern(false));
  g.set(10, 7, 13, ...B.lantern(false));
  g.set(1, 7, 10, ...B.lantern(false));
  g.set(6, 7, 10, ...B.lantern(false));
  g.set(7, 7, 15, ...B.lantern(false));
}
