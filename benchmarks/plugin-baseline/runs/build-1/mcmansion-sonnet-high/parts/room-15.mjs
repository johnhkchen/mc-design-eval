// room: Corridor E: the short passage from the upper hall to the primary suite and the hall bath. Inner air x27..32,
// y6..8, z16..17. Entered from the upper hall (x26 opening), the primary double door (x33), and the bath door (29,6..7,18).
// Design: a red runner down the full length on the z17 row (walkable, never blocks a door), a bench of oak stairs
// against the north wall (the focal piece, under the brightest lantern), a potted fern at the entry end, and two
// hanging lanterns on the ceiling. Nothing sits on the x26/x33 door cells or over the bath door (x29).
// Pictures are not built: item frames and paintings are entities, not blocks, and the north and south walls are
// locked partitions with no free face for a block-built picture.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { LANTERN, RED_CARPET, POTTED_FERN } from "../vocab.mjs";

const put = (g, x, y, z, pair) => g.set(x, y, z, ...pair);
const lantern = (g, x, y, z) => put(g, x, y, z, [LANTERN, { hanging: "true", waterlogged: "false" }]);

export function build(g) {
  // runner: the full z17 row, walkable carpet
  for (let x = 27; x <= 32; x++) put(g, x, 6, 17, [RED_CARPET, {}]);

  // entry-end side table: a potted fern on the floor, beside the upper hall opening
  put(g, 27, 6, 16, [POTTED_FERN, {}]);

  // bench: two oak stairs on the north wall, backs to the wall (facing north), seats toward the runner
  put(g, 30, 6, 16, B.stairs("oak", "north", "bottom"));
  put(g, 31, 6, 16, B.stairs("oak", "north", "bottom"));

  // light: a lantern over the bench (focal piece, brightest) and one over the entry end, both hung from the ceiling
  lantern(g, 30, 8, 16);
  lantern(g, 27, 8, 17);
}
