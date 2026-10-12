// Room 10: interior designer, bedroom 3 (plan.md ROOMS: guest room, double bed, dresser, chair; calm and neutral).
// Inner air [22,6,12,28,8,14]; floor oak_planks (P1), ceiling smooth_quartz y9; door (24,6..7,15) from the hall.
// Layout: double bed on the east wall (head at x28, foot at x27, z12..13), dresser on the west wall (x22), a reading
// corner in the north-west (birch_stairs armchair facing north, barrel side table with a lantern), and the z14 row
// kept clear from the door to the bed. Light: lanterns on the dresser, the side table and the nightstand, plus one
// hung over the bed (the focal piece). White carpet on the open floor cells.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { BIRCH_STAIRS, BARREL, LANTERN, IRON_CHAIN, WHITE_BED, WHITE_CARPET, POTTED_FERN } from "../vocab.mjs";

const put = (g, x, y, z, pair) => g.set(x, y, z, ...pair);

export function build(g) {
  // bed: two white beds side by side, heads on the east wall (facing = the way from foot to head)
  for (const z of [12, 13]) {
    put(g, 27, 6, z, [WHITE_BED, { part: "foot", facing: "east", occupied: "false" }]);
    put(g, 28, 6, z, [WHITE_BED, { part: "head", facing: "east", occupied: "false" }]);
  }

  // dresser: two barrels against the west wall, a fern and a lantern on top
  put(g, 22, 6, 12, [BARREL, { facing: "east", open: "false" }]);
  put(g, 22, 6, 13, [BARREL, { facing: "east", open: "false" }]);
  put(g, 22, 7, 12, [POTTED_FERN, {}]);
  put(g, 22, 7, 13, [LANTERN, { hanging: "false", waterlogged: "false" }]);

  // reading corner: armchair (stair as seat: low step toward the room, high back to the north) and a barrel side table
  put(g, 25, 6, 12, [BIRCH_STAIRS, { facing: "south", half: "bottom", shape: "straight", waterlogged: "false" }]);
  put(g, 24, 6, 12, [BARREL, { facing: "east", open: "false" }]);
  put(g, 24, 7, 12, [LANTERN, { hanging: "false", waterlogged: "false" }]);

  // bedside table at the head end of the bed, with its lantern
  put(g, 28, 6, 14, [BARREL, { facing: "up", open: "false" }]);
  put(g, 28, 7, 14, [LANTERN, { hanging: "false", waterlogged: "false" }]);

  // focal light: a hanging lantern over the bed (chain on the y9 ceiling)
  put(g, 27, 8, 13, [IRON_CHAIN, { axis: "y", waterlogged: "false" }]);
  put(g, 27, 7, 13, [LANTERN, { hanging: "true", waterlogged: "false" }]);

  // white carpet on the open floor cells (the walk from the door to the bed stays on the z14 row)
  for (const [x, z] of [[23, 12], [26, 12], [23, 13], [24, 13], [25, 13], [26, 13], [22, 14], [23, 14], [24, 14], [25, 14], [26, 14], [27, 14]]) {
    put(g, x, 6, z, B.block(WHITE_CARPET));
  }
}
