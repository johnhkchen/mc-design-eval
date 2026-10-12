// Primary bedroom (interior designer): inner air x36..41, y6..8, z13..19. Entries: west tunnel (35,6..7,18),
// north arch (39..41,6..8,12) to the sitting nook, south bath door (38,6..7,20). Windows on the east wall (42,6..8,15..16).
// Palette limits: no bed, carpet, barrel or chest in palette.json, so the king bed (x36..37 z14..15) is left empty
// and reserved (see plan.md Notes); the furniture below is what the palette can make.
import { B } from "../vocab.mjs";

const FLOOR = 6;   // walking surface y
const WOOD = "dark_oak_planks";
const TOP = "oak_planks";

export function build(g) {
  // Nightstands flanking the reserved bed. The south one's lantern cell (36,7,16) is already built by an earlier
  // part, so only the north one gets a standing lantern; the ceiling lantern below lights the south side.
  g.set(36, FLOOR, 13, WOOD);
  g.set(36, FLOOR + 1, 13, ...B.lantern(false));
  g.set(36, FLOOR, 16, WOOD);

  // Bench at the foot of the bed: two stairs, seats facing west toward the bed.
  g.set(38, FLOOR, 14, ...B.stairs("oak", "west", "bottom"));
  g.set(38, FLOOR, 15, ...B.stairs("oak", "west", "bottom"));

  // Dresser along the east wall (south of the windows), a flower pot and a lantern on top.
  g.set(41, FLOOR, 17, TOP);
  g.set(41, FLOOR + 1, 17, "flower_pot");
  g.set(41, FLOOR, 18, TOP);
  g.set(41, FLOOR + 1, 18, ...B.lantern(false));

  // Sitting group toward the nook: a side table with a lantern and two stair-seat chairs.
  g.set(40, FLOOR, 16, WOOD);
  g.set(40, FLOOR + 1, 16, ...B.lantern(false));
  g.set(39, FLOOR, 16, ...B.stairs("oak", "east", "bottom"));
  g.set(40, FLOOR, 17, ...B.stairs("oak", "north", "bottom"));

  // Hanging lanterns from the ceiling (y9 top plate) so no floor cell is dark.
  g.set(38, FLOOR + 2, 15, ...B.lantern(true));
  g.set(40, FLOOR + 2, 18, ...B.lantern(true));
}
