// Room "P4 south-east bedroom" (interior designer's part): a one-bed bedroom in the 4 x 2 x 3 inner air x73..76, z19..20,
// y6..8. The bed's head is against the back wall (z21); the door cell (73, 6..7, 19) and the lane along z19 stay clear.
// Focal piece: the bed. Supporting: a barrel dresser with a potted poppy, a fence-post table with a lantern on it.
import { layers, bed } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // the bed: foot at (76,6,19), head at (76,6,20) against the solid back wall z21
  bed(g, [76, 6, 19], "south", "red");

  // floor level (y6): barrel dresser at (73,20), table post at (74,20), chest at (75,20); the lane z19 stays clear
  const legend = {
    B: ["barrel", { facing: "up", open: "false" }],
    F: "spruce_fence",
    C: ["chest", { facing: "north", type: "single" }],
  };
  layers(g, [73, 6, 19], legend, [
    ["    ", "BFC "],
  ]);

  // y7: potted poppy on the barrel at (73,7,20), table top slab (type top) at (74,7,20)
  layers(g, [73, 7, 19], {
    P: "potted_poppy",
    T: ["spruce_slab", { type: "top" }],
  }, [
    ["    ", "PT  "],
  ]);

  // y8: standing lantern on the table top at (74,8,20): the light for the room
  layers(g, [73, 8, 19], {
    L: ["lantern", { hanging: "false" }],
  }, [
    ["    ", " L  "],
  ]);
}
