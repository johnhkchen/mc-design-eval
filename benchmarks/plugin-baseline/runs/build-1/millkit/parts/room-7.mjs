// Room: P3 front room (interior designer's part). Inner air x40..43, y3..6, z10..12; front doors x41..42 at z9, partition
// door x42 at z13. Furnished as the front room of a shotgun house: the lit smoker on the west wall is the focal hearth,
// a bench and a barrel with a potted poppy keep it company, and a dark oak table with two chairs sits on the east side.
// The lanes from both front doors to the partition door (x41..42 across z10..12) stay clear.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // y3 (floor level): barrel and bench on the west wall; table top slab and chairs on the east side. The lit smoker
  // at 40,3,12 is the Hearths part's (facing east, into the room), so it is not placed again here.
  layers(g, [40, 3, 10], {
    B: ["barrel", { facing: "up" }],
    C: ["dark_oak_stairs", { facing: "north", half: "bottom", shape: "straight" }],
    E: ["dark_oak_stairs", { facing: "west", half: "bottom", shape: "straight" }],
    K: ["dark_oak_slab", { type: "top" }],
    X: ["dark_oak_stairs", { facing: "south", half: "bottom", shape: "straight" }],
  }, [
    ["B..C",
     "E..K",
     "...X"],
  ]);

  // y4 (on the tops): a potted poppy on the barrel, a standing lantern on the table for light.
  layers(g, [40, 4, 10], {
    P: ["potted_poppy"],
    L: ["lantern", { hanging: "false" }],
  }, [
    ["P...",
     "...L",
     "...."],
  ]);
}
