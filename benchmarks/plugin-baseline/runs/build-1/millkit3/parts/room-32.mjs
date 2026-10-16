// P4 attic bedroom: inner air x54..57, y8..10, z10..15 under the gable. Two beds on the back knee wall (heads at z15,
// feet at z14), a dresser barrel in the back corner, a small table with two chairs against the east wall, and two
// hanging lanterns under the ridge. The stair top (54,8,10) is the way in; the lane runs x55 from z10 to z13.
import { bed } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { chair, hanging_lantern } from "../vocab.mjs";

export function build(g) {
  // beds: both heads against the back wall z16, two clear above each
  bed(g, [55, 8, 14], "south", "lime");
  bed(g, [56, 8, 14], "south", "lime");

  // dresser: a barrel in the back corner with a flower pot on top
  g.set(57, 8, 15, "barrel", { facing: "up" });
  g.set(57, 9, 15, "flower_pot");

  // table against the east wall (x57, z11..12): fence legs, a top slab (top half, so the lantern stands on a full
  // face), two chairs on its west side facing east. No lantern on the table: the roof's stairs own the cell above it.
  for (const z of [11, 12]) {
    g.set(57, 8, z, "spruce_fence");
    g.set(57, 9, z, "spruce_slab", { type: "top" });
  }
  chair(g, 56, 8, 11, "east");
  chair(g, 56, 8, 12, "east");

  // light: one lantern over the stair foot lane, one over the bed lane
  hanging_lantern(g, 55, 10, 10);
  hanging_lantern(g, 55, 10, 13);
}
