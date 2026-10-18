// Room "P6 back hall and bunk" (interior designer's part): inner air x105..107, z20..21, feet y2 (floor layer y1).
// Entry: the partition doorway at (105, 2..3, 19); back door at (106, 2..3, 22). Layout (x across, z down):
//   z19  partition (doorway at x105)     z20  x105 clear entry lane | x106 lane | x107 bed head
//   z21  x105 barrel dresser + lantern   | x106 lane (in front of back door) | x107 bed foot
// The bed is the focal piece: its head is on the partition wall, away from the doorway. The lantern on the barrel top
// is the room's light; the lane x106 keeps a 2-high path from both doorways to the bed.
import { dresser } from "../vocab.mjs";
import { B, bed } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // the bunk: foot at (107, 2, 21), head one step north at (107, 2, 20), against the partition wall z19
  // (bedSet also wants the cell past the foot clear, which here is the back wall: the library bed() checks the halves)
  bed(g, [107, 2, 21], "north", "red");

  // dresser: one barrel against the back wall at (105, 2, 21), fronts north; its two cells in front stay clear
  dresser(g, { x: 105, y: 2, z: 21, facing: "north", length: 1 });

  // light: a standing lantern on the barrel's top (y3), lighting the whole 3x2 room
  g.set(105, 3, 21, ...B.lantern(false));
}
