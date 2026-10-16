// Part: room: I-house upper east bedroom. Inner air x 32..33, y 8..11, z 10..15; door x31 z14 from the upper hall
// (the stair flight takes x30 at z10..13, so the door is reached from the stair's landing at x30 z14).
// Two white beds along the front wall, foot z11 and head z10 against the wall (facing north). The lane runs z12..14
// from the door to the beds. A barrel dresser at the south end, and a lamp post (fence and standing lantern) at x33 z13.
import { layers, bed } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEGEND = {
  B: "barrel",
  F: "spruce_fence",
  L: ["lantern", { hanging: "false" }],
};

export function build(g) {
  // Focal piece: both beds, whole (bed() places foot and head with matching states).
  bed(g, [32, 8, 11], "north", "white");
  bed(g, [33, 8, 11], "north", "white");

  // Furniture as text, origin [32, 8, 10]; rows run along +x, then +z (z10..z15). '.' and ' ' are left alone.
  // Layer y8: the lamp post's fence at x33 z13, the dresser barrels at x32..33 z15.
  // Layer y9: the lantern standing on the post.
  layers(g, [32, 8, 10], LEGEND, [
    ["  ", "  ", "  ", ".F", "  ", "BB"],
  ]);
  layers(g, [32, 9, 10], LEGEND, [
    ["  ", "  ", "  ", ".L", "  ", "  "],
  ]);
}
