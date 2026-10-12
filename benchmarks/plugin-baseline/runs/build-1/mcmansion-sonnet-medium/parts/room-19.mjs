// Bonus room (plan ROOMS): media and game room over the garage. Inner air x2..16, y6..8, z8..23; walking y=6.
// Way in: the tunnel (17..18,6..7,18) from the west passage lands on (16,6..7,18); the path row z=18..19 stays clear.
// Layout, east to west: TV focal on the east wall with a sectional facing it, coffee table; pool table in the north-west;
// bar along the north-east with stools; arcade machines in the south-west corner. Hanging lanterns on the y=9 plate.
import { B } from "../vocab.mjs";

const SPRUCE = "spruce";
const LANTERN_UP = B.lantern(true);

export function build(g) {
  // TV: a black panel on the east wall (x=16, y7..8, z14..16) on a blackstone console at y=6.
  g.fill([16, 6, 14], [16, 6, 16], "blackstone");
  g.fill([16, 7, 14], [16, 8, 16], "black_concrete");

  // Sectional: backrest blackstone at x=12 (y6..7, z12..16), seats are oak stairs facing east (low side toward the TV),
  // a chaise end at z=11.
  g.fill([12, 6, 12], [12, 7, 16], "blackstone");
  for (let z = 12; z <= 16; z++) g.set(13, 6, z, ...B.stairs("oak", "east", "bottom"));
  g.set(12, 6, 11, "blackstone");
  g.set(13, 6, 11, ...B.stairs("oak", "east", "bottom"));

  // Coffee table: a low smooth quartz slab pair in front of the sofa.
  g.set(10, 6, 14, ...B.slab("smooth_quartz", "bottom"));
  g.set(10, 6, 15, ...B.slab("smooth_quartz", "bottom"));

  // Pool table, north-west: blackstone body with a smooth stone felt top and black corner pockets.
  g.fill([4, 6, 10], [7, 6, 12], "blackstone");
  g.fill([4, 7, 10], [7, 7, 12], "smooth_stone");
  for (const [x, z] of [[4, 10], [7, 10], [4, 12], [7, 12]]) g.set(x, 7, z, "black_concrete");

  // Bar, north-east: oak counter base at y6 with a spruce slab top at y7; flower pot on the back of the counter.
  g.fill([13, 6, 9], [16, 6, 9], "oak_planks");
  for (let x = 13; x <= 16; x++) g.set(x, 7, 9, ...B.slab(SPRUCE, "bottom"));
  for (let x = 13; x <= 16; x++) g.set(x, 6, 10, ...B.stairs("spruce", "north", "bottom"));
  g.set(14, 6, 8, "flower_pot");

  // Arcade corner, south-west: two cabinets (blackstone body, black screen y7..8) with stools facing west.
  g.fill([2, 6, 21], [2, 6, 22], "blackstone");
  g.fill([2, 7, 21], [2, 8, 22], "black_concrete");
  g.set(3, 6, 21, ...B.stairs("spruce", "west", "bottom"));
  g.set(3, 6, 22, ...B.stairs("spruce", "west", "bottom"));

  // Plants and a pot in the open corners, out of the walking row.
  g.set(2, 6, 9, "flower_pot");

  // Hanging lanterns on the y=9 plate. None over the tunnel head (16,8,18) or a window.
  for (const [x, z] of [[5, 11], [14, 15], [10, 20], [3, 23], [11, 11]]) g.set(x, 8, z, ...LANTERN_UP);
}
