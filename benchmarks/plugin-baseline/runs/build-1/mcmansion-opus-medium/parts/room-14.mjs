// Room 14: interior designer, bedroom 4 (kid's room, plan.md ROOMS). Box [23,6,19,28,8,24]: inner air only.
// Door (25,6..7,18) from the hall on the north wall; back window (25..26,6..7,25) on the south wall (front = north).
// Layout: red twin bed along the west wall, nightstand with a lamp at its head; toy chest (barrel) at the foot corner;
// a desk on the east wall with a birch-stair chair and a desk lamp; a light-grey rug in the middle; a hanging lantern.
// The door-to-bed path (x25 z19..21, then x24 z21) and the window cells (25..26, 6..7, 24) stay clear.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const BED = "red_bed";
const BIRCH_SLAB = "birch_slab";
const BIRCH_STAIRS = "birch_stairs";
const SPRUCE_SLAB = "spruce_slab";
const OAK_FENCE = "oak_fence";
const WHITE_CARPET = "white_carpet";
const POTTED_FERN = "potted_fern";
const IRON_CHAIN = "iron_chain";

export function build(g) {
  const put = (x, y, z, pair) => g.set(x, y, z, ...pair);
  const lantern = (x, y, z, hanging) => put(x, y, z, B.lantern(hanging));

  // Twin bed: head against the west wall (foot -> head faces west), red for the kid.
  put(23, 6, 22, [BED, { facing: "west", part: "head", occupied: "false" }]);
  put(24, 6, 22, [BED, { facing: "west", part: "foot", occupied: "false" }]);

  // Nightstand at the bed's head: fence post, birch slab top, lantern on top.
  put(23, 6, 21, [OAK_FENCE, {}]);
  put(23, 7, 21, [BIRCH_SLAB, { type: "top", waterlogged: "false" }]);
  lantern(23, 8, 21, false);

  // Toy chest: a barrel at the foot corner.
  put(23, 6, 24, ["barrel", { facing: "up", open: "false" }]);

  // Desk on the east wall: two fence legs, a spruce slab top, a desk lamp; a birch-stair chair facing it.
  put(27, 6, 20, [OAK_FENCE, {}]);
  put(28, 6, 20, [OAK_FENCE, {}]);
  put(27, 7, 20, [SPRUCE_SLAB, { type: "top", waterlogged: "false" }]);
  put(28, 7, 20, [SPRUCE_SLAB, { type: "top", waterlogged: "false" }]);
  lantern(28, 8, 20, false);
  put(26, 6, 20, B.stairs("birch", "east"));

  // Rug in the middle of the floor (walkable).
  for (const x of [25, 26]) for (const z of [22, 23]) put(x, 6, z, [WHITE_CARPET, {}]);

  // Toy shelf in the north-west corner beside the door (the door cells x25 stay clear): a 2x2 block of bookshelves.
  for (const y of [6, 7]) for (const x of [23, 24]) put(x, y, 19, ["bookshelf", {}]);

  // Playful plant in the far east corner.
  put(28, 6, 23, [POTTED_FERN, {}]);

  // Hanging lantern from the ceiling over the rug: chain at y8, lantern at y7.
  put(25, 8, 23, [IRON_CHAIN, { axis: "y", waterlogged: "false" }]);
  lantern(25, 7, 23, true);
}
