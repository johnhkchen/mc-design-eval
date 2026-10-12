// room: Family room (plan ROOMS, box [34,2,13,42,4,26]). Fireplace in the chimney on the N wall, big TV on the S wall
// with a console, a sectional facing it, a gray rug, bookshelves on the E wall, lanterns. Kitchen opening on the W.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const put = (g, x, y, z, pair) => g.set(x, y, z, ...pair);
const fill = (g, x0, y, z0, x1, z1, pair) => {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) put(g, x, y, z, pair);
};

export function build(g) {
  // rug: gray carpet on the floor, the seating and the coffee table sit on it
  fill(g, 35, 2, 22, 40, 24, B.block("gray_carpet"));

  // fireplace: lit campfire in the firebox (37..39,2..3,12); dark oak mantel over the opening
  put(g, 38, 2, 12, ["campfire", { lit: "true", facing: "north", signal_fire: "false", waterlogged: "false" }]);
  fill(g, 37, 4, 13, 39, 4, B.slab("dark_oak", "bottom"));

  // armchairs facing the fireplace (back to the south), with a barrel and a floor lamp in the NE and NW corners
  put(g, 35, 2, 14, B.stairs("spruce", "south", "bottom"));
  put(g, 41, 2, 14, B.stairs("spruce", "south", "bottom"));
  put(g, 42, 2, 13, ["barrel", { facing: "up", open: "false" }]);
  put(g, 34, 2, 13, B.wall("stone_brick"));
  put(g, 34, 3, 13, B.lantern(false));

  // sectional facing the TV (back to the north): four seats, arms at both ends
  for (let x = 36; x <= 39; x++) put(g, x, 2, 21, B.stairs("spruce", "north", "bottom"));
  put(g, 35, 2, 21, B.stairs("spruce", "west", "bottom"));
  put(g, 40, 2, 21, B.stairs("spruce", "east", "bottom"));

  // coffee table on the rug
  put(g, 37, 2, 23, B.slab("dark_oak", "bottom"));
  put(g, 38, 2, 23, B.slab("dark_oak", "bottom"));

  // big TV: black concrete panel in a polished blackstone slab frame, on a dark oak slab console
  fill(g, 37, 2, 26, 40, 2, B.slab("dark_oak", "bottom"));
  fill(g, 37, 3, 26, 40, 4, B.block("black_concrete"));
  // frame ends: slabs on the floor either side of the console (a slab frame cannot hang in the air here)
  put(g, 36, 2, 26, B.slab("polished_blackstone", "bottom"));
  put(g, 41, 2, 26, B.slab("polished_blackstone", "bottom"));

  // E wall shelves: bookshelves two high
  for (let z = 22; z <= 25; z++)
    for (let y = 2; y <= 3; y++) put(g, 42, y, z, B.block("bookshelf"));

  // SW corner plant
  put(g, 34, 2, 26, B.block("potted_fern"));

  // lighting: lanterns hang from the ceiling over the seating and the TV, so no floor cell is dark
  put(g, 36, 4, 18, B.lantern(true));
  put(g, 40, 4, 18, B.lantern(true));
  put(g, 38, 4, 24, B.lantern(true));
  put(g, 34, 4, 23, B.lantern(true));
  put(g, 42, 4, 25, B.lantern(true));
}
