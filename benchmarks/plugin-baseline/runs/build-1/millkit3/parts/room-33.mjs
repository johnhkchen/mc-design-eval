// P5 barn aisle and stalls (room box x62..67, y1..5, z10..14). The stall fit-out is the barn shell's and is already built:
// the four mule stalls at y1..2 (partitions z12, posts, hay racks, troughs, aisle gates) stand either side of the centre
// aisle x64..65, which stays clear from the front doors (z9) to the back doors (z15). The gates are built closed.
// This part adds only the hanging lanterns at y5, under the loft floor. The loft ladder at (62, 1..5, 14) is built by
// the stair joiner, so that cell is left as it is.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  const legend = {
    L: ["lantern", { hanging: "true" }], // hangs from the loft floor (y6)
  };

  // y5: hanging lanterns under the loft floor, off the hay drop hole at (64..65, 6, 12)
  layers(g, [62, 5, 10], legend, [
    "..L...",
    "......",
    ".L..L.",
    "......",
    "...L..",
  ]);
}
