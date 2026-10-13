// Room: P0 front room (interior designer's part). Inner air x 4..7, y 3..6, z 10..12; front door x 5..6 at z 9 and the
// open partition door x 5 at z 13 are the ways in. Furnished as a shotgun front room: a birch table with two chairs on
// the west side, a barrel dresser with a potted poppy, and a candle on the table for lamplight. The smoker at the east
// chimney (7,3,12) belongs to the hearths part and is left alone. Paths are kept clear: x 5..6 from the front door down to the partition door, and x 7 at z 11.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Y 3 (floor level): table post, chairs, barrel dresser.
//   F table post (birch_fence), C chair facing north (back to the front wall), D chair facing south,
//   B barrel facing up.
// Y 4: T table top slab (birch_slab, top half, sits on the post), P potted poppy on the barrel.
// Y 5: K candle lit on the table top.
const LEGEND = {
  F: "birch_fence",
  C: ["birch_stairs", { facing: "north" }],
  D: ["birch_stairs", { facing: "south" }],
  B: ["barrel", { facing: "up" }],
  T: ["birch_slab", { type: "top" }],
  P: "potted_poppy",
  K: ["candle", { candles: "1", lit: "true" }],
};

export function build(g) {
  layers(g, [4, 3, 10], LEGEND, [
    [
      "C  B", // z 10: chair at the front wall, barrel on the east wall
      "F  B", // z 11: table post, barrel
      "D   ", // z 12: chair at the partition
    ],
    [
      "   P", // z 10: potted poppy on the barrel
      "T   ", // z 11: table top
      "    ", // z 12
    ],
    [
      "    ",
      "K   ", // z 11: candle on the table
      "    ",
    ],
  ]);
}
