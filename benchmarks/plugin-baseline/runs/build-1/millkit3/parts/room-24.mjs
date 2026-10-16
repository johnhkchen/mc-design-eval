// P3 back bedroom: inner air x40..43, y8..11, z14..15. Entered from the landing through the z13 openings (x42..43).
// Two purple beds on the back wall (z16), heads at z15. Beds sit at x40 and x43 so the lane x41..42 stays open from the
// door to both beds (plan.md's x42 bed would stand in front of the door). A barrel dresser between the beds on the back
// wall (x41), a standing lantern on it as the bedside lamp, and a hanging lantern over the lane for the room's light.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { bed_set, hanging_lantern } from "../vocab.mjs";

export function build(g) {
  // beds: foot at z14, head at z15 against the back wall, facing south
  bed_set(g, [40, 8, 14], "south", "purple");
  bed_set(g, [43, 8, 14], "south", "purple");

  // dresser: a barrel on the back wall between the beds, with the lantern on its top face
  g.set(41, 8, 15, "barrel", { facing: "up" });
  g.set(41, 9, 15, ...B.lantern(false));

  // ceiling lantern over the lane
  hanging_lantern(g, 42, 11, 14);
}
