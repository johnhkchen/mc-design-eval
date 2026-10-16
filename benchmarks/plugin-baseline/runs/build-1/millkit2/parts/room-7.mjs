// Part: room: Camelback bedroom. Upstairs bedroom, inner air box [16,8,14, 19,11,16] (plan: y 8..11, floor y 7).
// The stair joiner's rail (x18 z13..14 y8) and the flight's hole (x19 z13..14) are already built: furnish around them.
// Layout (plan's two beds moved so the x16 bed is reachable: the rail blocks z14 from the east, so both beds sit along
// the west wall, heads against it, and the z15 row stays open as the 1-wide lane from the landing at x19 z15):
//   z14: bed A foot x17, head x16 (facing west, head against the west wall x15)
//   z15: clear lane x16..19 (landing at x19)
//   z16: bed B foot x17, head x16 (facing west); barrel dresser at x19 with a standing lantern on it
import { bed, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // Two beds, both halves each, heads against the solid west wall.
  bed(g, [17, 8, 14], "west", "blue");
  bed(g, [17, 8, 16], "west", "blue");

  // Dresser: a barrel in the back corner (x19 z16), lantern standing on it as the bedside light.
  g.set(19, 8, 16, "barrel", { facing: "up", open: "false" });
  g.set(19, 9, 16, ...B.lantern(false));
}
