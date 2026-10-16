// Part: room: Bungalow bedroom. Inner air x 91..93, y 3..6, z 15..16; door x91 z14 (first cell x91 z15 stays clear).
// Focal piece: the yellow bed, foot x92 z15, head z16 against the back wall z17 (facing south).
// Dresser: two barrels against the east wall x94 at x93 z15..16, a standing lantern on the z16 barrel.
// Light: that standing lantern plus a hanging lantern over the bed foot (under the y7 plate).
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { bed_set, hanging_lantern } from "../vocab.mjs";

export function build(g) {
  // the bed: both halves, head against the back wall
  bed_set(g, [92, 3, 15], "south", "yellow");

  // dresser: barrels facing up, one row along z at x93
  layers(g, [91, 3, 15], { B: ["barrel", { facing: "up" }] }, [
    ["..B", "..B"],
  ]);

  // standing lantern on the top of the z16 barrel (a barrel is the block under it)
  layers(g, [91, 4, 15], { L: ["lantern", { hanging: "false" }] }, [
    ["...", "..L"],
  ]);

  // hanging lantern over the bed foot, from the ceiling plate at y7
  hanging_lantern(g, 92, 6, 15);
}
