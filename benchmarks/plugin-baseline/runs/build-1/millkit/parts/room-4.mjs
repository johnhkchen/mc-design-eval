// Room: P1 east flat (interior designer's part): the mirror of the west flat, one family's room on the chimney side.
// Focal piece: the lit smoker on the chimney wall (x19 z12), with the table and its chair in front of it. The bed sits
// at the back wall (x21 z14..15, head to the south wall); the barrels stand by the door. The x20 column stays clear as
// the lane from the door (x20 z9) to the bed. Light: a candle on the barrel, the lit smoker, a lantern on the table post.
import { layers, bed } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Floor cells x19..21, z10..15 (origin 19,3,10). Layers: y3 (floor) and y4 (candle and table lantern).
const LEGEND = {
  B: ["barrel", { facing: "up" }],
  T: ["spruce_fence"],
  l: ["lantern", { hanging: "false" }],
  C: ["spruce_stairs", { facing: "south", half: "bottom", shape: "straight" }],
  t: ["candle", { candles: "2", lit: "true" }],
};

const ROWS = [
  [
    "B..", // z10: barrel at x19 (dresser); the north bed stands at x21 z10..11, the lane x20 clear
    "...", // z11
    "...", // z12: the smoker at x19 is the Hearths part's stove, already built
    "...", // z13
    "T..", // z14: table post
    "C..", // z15: chair, back to the south wall
  ],
  [
    "t..", // z10: candle on the barrel top
    "...",
    "...",
    "...",
    "l..", // z14: lantern standing on the table post (the table's lamp)
    "...",
  ],
];

export function build(g) {
  layers(g, [19, 3, 10], LEGEND, ROWS);
  bed(g, [21, 3, 14], "south", "red");
  bed(g, [21, 3, 10], "south", "white");
}
