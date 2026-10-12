// room: Bedroom 3 (guest room). Inner air x31..34, y6..8, z12..16 (plan.md ROOMS). Entered from the east passage through
// the door at (33,6..7,17); window (32..33,6..8,11) on the north wall, left clear.
// Layout: the bed lies against the west partition (head at x31, foot at x32, z14) with a nightstand either side of the
// head; the dresser stands on the east wall (x34, z12..13) under the window's east side; the x33 column is the walkway
// from the door to the window. A hanging lantern over the foot of the bed is the ceiling light.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const FLOOR_Y = 6;

export function build(g) {
  // bed: foot at (32,6,14) and head at (31,6,14); white_bed is not in the palette, so white_concrete stands in for it
  g.set(32, FLOOR_Y, 14, "white_concrete");
  g.set(31, FLOOR_Y, 14, "white_concrete");

  // nightstands either side of the head, each with a lantern on top
  g.set(31, FLOOR_Y, 13, "dark_oak_planks");
  g.set(31, FLOOR_Y, 15, "dark_oak_planks");
  g.set(31, FLOOR_Y + 1, 13, ...B.lantern(false));
  g.set(31, FLOOR_Y + 1, 15, "flower_pot");

  // dresser on the east wall: two blocks with a lantern on top (the earlier roof already fills (34,7,12), so no pot there)
  g.set(34, FLOOR_Y, 12, "dark_oak_planks");
  g.set(34, FLOOR_Y, 13, "dark_oak_planks");
  g.set(34, FLOOR_Y + 1, 13, ...B.lantern(false));

  // ceiling light over the bed foot, hung from the top plate at y9
  g.set(33, 8, 14, ...B.lantern(true));
}
