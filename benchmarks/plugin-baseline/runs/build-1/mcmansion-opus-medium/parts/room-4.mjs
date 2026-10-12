// Room 4: interior designer, family room (plan.md ROOMS, box [3,2,19,13,4,24]). Cosy and open: the firebox on the west
// wall (campfire + stone surround and mantle), a black TV panel on the north wall with a media slab beneath, a sectional
// facing it, a slab coffee table, lanterns for light. Open to the kitchen at x13|x14: x12..13 stay clear as the way in.
// Everything is written into air only; the firebox cells (2,2..3,21..22) are the reserved air E15 names for this room.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { STONE_BRICKS, BLACK_CONCRETE, LIGHT_GRAY_CARPET, BARREL, BOOKSHELF, POTTED_FERN, CAMPFIRE, hangLamp } from "../vocab.mjs";

const put = (g, x, y, z, pair) => g.set(x, y, z, ...pair);
const fill = (g, x0, y0, z0, x1, y1, z1, pair) => {
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) put(g, x, y, z, pair);
};

export function build(g) {
  // Firebox: lit campfires in the two air cells of the west wall, stone jambs either side, a slab mantle over the hearth.
  for (const z of [21, 22]) put(g, 2, 2, z, [CAMPFIRE, { lit: "true", facing: "east", signal_fire: "false", waterlogged: "false" }]);
  for (const y of [2, 3]) for (const z of [20, 23]) put(g, 3, y, z, B.block(STONE_BRICKS));
  for (let z = 20; z <= 23; z++) put(g, 3, 4, z, B.slab("stone_brick", "bottom"));

  // Sectional: dark-oak stair seats at z21 facing the TV (north); a stair's facing is the side it climbs to, so the
  // seats climb south (backrest behind the sitter). Arms at both ends climb outward. Rug on the floor in front.
  for (let x = 7; x <= 10; x++) put(g, x, 2, 21, B.stairs("dark_oak", "south", "bottom"));
  put(g, 6, 2, 21, B.stairs("dark_oak", "west", "bottom"));
  put(g, 11, 2, 21, B.stairs("dark_oak", "east", "bottom"));
  for (let x = 7; x <= 10; x++) put(g, x, 2, 22, B.block(LIGHT_GRAY_CARPET));

  // Coffee table between the sofa and the TV: two dark-oak slabs with a fern on top.
  put(g, 8, 2, 20, B.slab("dark_oak", "bottom"));
  put(g, 9, 2, 20, B.slab("dark_oak", "bottom"));
  put(g, 9, 3, 20, [POTTED_FERN, {}]);
  // Media run under the TV.
  for (let x = 6; x <= 11; x++) put(g, x, 2, 19, B.slab("dark_oak", "bottom"));
  fill(g, 7, 3, 19, 10, 4, 19, B.block(BLACK_CONCRETE));
  put(g, 6, 3, 19, [POTTED_FERN, {}]);

  // Storage by the west corner: barrels and a bookshelf stack.
  put(g, 4, 2, 19, [BARREL, { facing: "up", open: "false" }]);
  put(g, 5, 2, 19, [BARREL, { facing: "up", open: "false" }]);
  put(g, 3, 2, 24, B.block(BOOKSHELF));
  put(g, 3, 3, 24, B.block(BOOKSHELF));
  put(g, 4, 2, 24, B.block(BOOKSHELF));

  // Light: hanging lanterns off the y5 ceiling, one over the TV, one over the sofa, one by the bookshelves.
  hangLamp(g, 8, 4, 20);
  hangLamp(g, 5, 4, 23);
  hangLamp(g, 11, 4, 23);
}
