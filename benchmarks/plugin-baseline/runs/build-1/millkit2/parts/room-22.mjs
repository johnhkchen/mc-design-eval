// Part: room: Boarding east bunk room (interior furnisher + lamplighter). Inner air x 55..57, y 8..11, z 10..12.
// Three bunks in a row against the north wall (heads at z 10, feet at z 11, pillows on the wall), the south row z 12
// left clear as the lane from the landing door (x 56 z 13). A lamp post in the south-east corner: no ceiling block
// above the box to hang from, so the light stands on a fence.
import { bed_set } from "../vocab/h3.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // Bunks: foot at z 11, head at z 10 (one step north, against the north wall).
  for (const x of [55, 56, 57]) bed_set(g, [x, 8, 11], "north", "brown");

  // Light: a lamp post at the corner (fence, standing lantern on it), off the lane and the doorway.
  g.set(57, 8, 12, ...B.fence("spruce"));
  g.set(57, 9, 12, ...B.lantern(false));
}
