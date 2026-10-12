// Room 9: bedroom 2 (teen room), interior designer. Inner air x3..11, y6..8, z12..14; door (8,6..7,15) on the hall wall.
// Layout by use: the bed is the focal piece in the north-west corner under the lantern; the desk and chair sit by the
// west window; storage (bookshelves, barrels) on the east end; a window bench under the front window. The middle row
// z13 stays clear as the 2-high path from the door to every bed, desk and seat.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { hangLamp, POTTED_FERN } from "../vocab.mjs";

const LIGHT_GRAY_CARPET = "light_gray_carpet";
const put = (g, x, y, z, pair) => g.set(x, y, z, ...pair);

export function build(g) {
  // Floor layer y6: light gray carpet on every free cell (the row z13 is the path; the furniture cells stay bare).
  for (let x = 3; x <= 11; x++) put(g, x, 6, 13, B.block(LIGHT_GRAY_CARPET));
  for (const x of [6, 7]) put(g, x, 6, 12, B.block(LIGHT_GRAY_CARPET));
  for (const x of [5, 6, 7, 8, 9]) put(g, x, 6, 14, B.block(LIGHT_GRAY_CARPET));

  // Bed (the focal piece): light gray bed on the west wall, head at x3 (against the wall), foot at x4; facing = foot to head.
  put(g, 3, 6, 12, ["light_gray_bed", { facing: "west", occupied: "false", part: "head" }]);
  put(g, 4, 6, 12, ["light_gray_bed", { facing: "west", occupied: "false", part: "foot" }]);
  // Nightstand: a barrel with a potted fern beside the bed head.
  put(g, 5, 6, 12, ["barrel", { facing: "up", open: "false" }]);
  put(g, 5, 7, 12, B.block(POTTED_FERN));

  // Desk by the west window: dark oak fence legs at y6, dark oak slab top at y7; a lantern stands on it.
  put(g, 3, 6, 14, B.fence("dark_oak"));
  put(g, 3, 7, 14, B.slab("dark_oak", "top"));
  put(g, 3, 8, 14, B.lantern(false));
  // Desk chair: a dark oak stair as the seat, low step facing west toward the desk.
  put(g, 4, 6, 14, B.stairs("dark_oak", "west", "bottom"));

  // Window bench under the front window (x8..9): birch stairs as seats, back against the wall (low step faces south).
  for (const x of [8, 9]) put(g, x, 6, 12, B.stairs("birch", "south", "bottom"));

  // Storage on the east end: a bookshelf stack against the partition, and barrels by the hall side.
  for (const x of [10, 11]) for (const y of [6, 7]) put(g, x, y, 12, B.block("bookshelf"));
  for (const x of [10, 11]) put(g, x, 6, 14, ["barrel", { facing: "up", open: "false" }]);

  // Light (a room at night): a hanging lantern over the bed, a second hanging lantern over the east half.
  hangLamp(g, 3, 8, 12);
  hangLamp(g, 9, 8, 13);
}
