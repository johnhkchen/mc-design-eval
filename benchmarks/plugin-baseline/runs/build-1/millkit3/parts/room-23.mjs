// P3 upper landing: a two-by-four hall at the stair top. Its floor is the lane to three doors (master bedroom x42 z10,
// back bedroom x42 z13 and the x43 z14 opening) and to the tower ladder at (44, 8..12, 9), so every floor cell stays
// clear. The only furniture is wall-hung at y10..11: a birch top-slab shelf with a flower pot on the east wall at (44, 10, 10)
// (the focal piece, beside the stair top), and one hanging lantern under the ceiling at (43, 11, 10) that lights all six
// cells. The roof's underside already fills x43 z12..13 at y10..11, so the shelf cannot go on the west side.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  const legend = {
    "L": ["lantern", { hanging: "true" }],
    "S": ["birch_slab", { type: "top" }],
    "P": "flower_pot",
  };
  // origin [43, 8, 10]: x 43..44 within a row, z 10..13 down the rows; y 8 and 9 stay empty (the lane and headroom)
  // one layer per y (y 8..11), each layer its rows z 10..13
  const empty = ["..", "..", "..", ".."];
  layers(g, [43, 8, 10], legend, [
    empty,
    empty,
    [".S", "..", "..", ".."],
    ["LP", "..", "..", ".."],
  ]);
}
