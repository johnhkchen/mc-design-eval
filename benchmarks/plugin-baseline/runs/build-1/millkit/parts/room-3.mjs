// Room: P1 west flat (interior designer's part). Inner air x14..16, y3..6, z10..15; door x15 z9.
// Layout: the x15 column stays clear from the door to the back (the spine), so every cell on the x14 and x16 columns
// touches it. West: a pot barrel, a chair, the table (focal, by the stove), a chair, the bed (foot z14, head z15).
// East: the smoker by the party-wall chimney at z12, a chest, barrels with lanterns and a candle.
import { layers, bed } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { stove } from "../vocab.mjs";

const LEGEND = {
  "B": ["barrel", { facing: "up" }],
  "c": ["spruce_stairs", { facing: "north" }],
  "d": ["spruce_stairs", { facing: "south" }],
  "T": "spruce_fence",
  "U": ["spruce_slab", { type: "top" }],
  "H": ["chest", { facing: "west" }],
  "P": "potted_poppy",
  "L": ["lantern", { hanging: "false" }],
  "N": ["candle", { candles: "2", lit: "true" }],
};

// rows run along +x (x14..16), successive rows along +z (z10..15)
const FLOOR = [
  "  B", // z10: lamp barrel east (north bed at x14 z10..11)
  "   ", // z11
  "T  ", // z12: table post; stove placed by stove() at x16
  "d H", // z13: chair facing the table; chest east
  "   ", // z14: beds (bed()) at x14 and x16
  "   ", // z15
];
const ABOVE = [
  "  L", // z10: lantern on the lamp barrel
  "   ",
  "U  ", // z12: table top slab
  "   ",
  "   ",
  "   ",
];
const TABLE_TOP = [
  "   ",
  "   ",
  "L  ", // z12: lantern standing on the table top
  "   ",
  "   ",
  "   ",
];

export function build(g) {
  layers(g, [14, 3, 10], LEGEND, [FLOOR, ABOVE, TABLE_TOP]);
  bed(g, [14, 3, 14], "south", "red");
  bed(g, [14, 3, 10], "south", "white");
  bed(g, [16, 3, 14], "south", "white");
  stove(g, 16, 3, 12, "west");
}
