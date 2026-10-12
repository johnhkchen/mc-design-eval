// Family room (interior designer): inner air [36,1,13,41,4,23] of the east family wing. Cosy living room: an L-less
// sectional on the north side facing south, a coffee table of two low slabs, an armchair, floor lamps, a stone
// fireplace on the z=23 wall with the big TV above it. Entered from the kitchen through the cased opening (35,1..3,19..22)
// and from the bay arch (39..41,1..3,12). Nothing is placed in a doorway, window, or the cells in front of the windows
// at (37..38,2..4,23) and (41,2..4,15..16 / 19..20). Palette only (palette.json): no carpets, beds, barrels or flower pots.
import { B } from "../vocab.mjs";

const SEAT = "oak_stairs";
const STONE = "stone_bricks";
const BACK = "oak_planks";

export function build(g) {
  // Fireplace on the z=23 wall: stone surround, black firebox, hood, then the TV screen above it.
  g.set(39, 1, 23, STONE);
  g.set(40, 1, 23, "black_concrete");
  g.set(41, 1, 23, STONE);
  g.fill([39, 2, 23], [41, 2, 23], STONE);
  g.fill([39, 3, 23], [41, 4, 23], "black_concrete");
  // Hearth in front of the firebox.
  g.fill([39, 1, 22], [41, 1, 22], "stone_brick_slab");

  // Sectional: back row on z=18, four seats facing south on z=19, one arm on the east end.
  g.fill([37, 1, 18], [41, 2, 18], BACK);
  for (let x = 37; x <= 40; x++) g.set(x, 1, 19, ...B.stairs("oak", "south", "bottom"));
  g.set(41, 1, 19, ...B.stairs("oak", "west", "bottom"));

  // Coffee table: two low quartz slabs on the floor between the sofa and the hearth.
  g.set(38, 1, 21, ...B.slab("smooth_quartz", "bottom"));
  g.set(39, 1, 21, ...B.slab("smooth_quartz", "bottom"));

  // Armchair facing east toward the table; it stays off the cased-opening path along x=36.
  g.set(37, 1, 21, ...B.stairs("oak", "east", "bottom"));

  // Sideboard in the north-west corner with a lantern on top.
  g.set(36, 1, 13, BACK);
  g.set(37, 1, 13, BACK);
  g.set(36, 2, 13, ...B.lantern(false));

  // Floor lamps: a dark oak fence post with a standing lantern.
  g.set(36, 1, 17, ...B.fence("dark_oak"));
  g.set(36, 2, 17, ...B.lantern(false));
  g.set(41, 1, 14, ...B.fence("dark_oak"));
  g.set(41, 2, 14, ...B.lantern(false));

  g.set(41, 1, 21, ...B.fence("dark_oak"));
  g.set(41, 2, 21, ...B.lantern(false));

  // Hanging lanterns from the ceiling slab (y5) for the room's general light.
  g.set(38, 4, 16, ...B.lantern(true));
  g.set(40, 4, 20, ...B.lantern(true));
  // Over the hearth, so the TV wall is the brightest part of the room.
  g.set(40, 4, 22, ...B.lantern(true));
}
