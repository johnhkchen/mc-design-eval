// P3 belvedere: open glazed lookout under the copper cap. Inner air x 44..45, y 13..15, z 8..9.
// The ladder comes up through the hatch at (44,12,9) into (44,13,9). The room is only 2x2, so the layout is
// a lookout lantern on a birch post in the NE corner (the focal piece, lit from above the post) and one stair
// seat facing the east window. The entry cell and the path (44,8) stay clear.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { chair } from "../vocab.mjs";

export function build(g) {
  // the ladder's wall: a stripped birch mullion at the west glazing's back cell (43,13..14,9), a solid block to climb against
  g.set(43, 13, 9, "stripped_birch_log", { axis: "y" });
  g.set(43, 14, 9, "stripped_birch_log", { axis: "y" });
  // focal piece: a birch post in the NE corner with a standing lantern on top, looking out over both glazed walls
  g.set(45, 13, 8, ...B.fence("birch"));
  g.set(45, 14, 8, ...B.lantern(false));
  // seat: spruce stair in the SE cell, sitter facing east toward the east window (stair back on the west)
  chair(g, 45, 13, 9, "east");
}
