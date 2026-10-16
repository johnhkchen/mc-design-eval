// P4 ground bedroom
// Box x55..57, y3..6, z14..15. Entered from the parlour through the partition door (56,3..4,13) and from the back door
// (55,3..4,16). The lane runs (56,14) -> (55,14) -> (55,15) -> back door, so those cells stay clear; the bed is the focal
// piece against the east wall (head (57,3,15) on the solid wall x58 z15); a barrel nightstand with a lantern lamp sits
// at (57,14) under the east window; a hanging lantern from the ceiling lights the room.
import { layers, } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { bed_set } from "../vocab.mjs";

export function build(g) {
  // Bed: foot (56,3,15), head (57,3,15) against the east wall, lime colour (plan: 4 lime_bed).
  bed_set(g, [56, 3, 15], "east", "lime");

  // Nightstand barrel with a standing lantern on its top, and a hanging lantern from the ceiling over the lane.
  layers(g, [57, 3, 14], {
    "b": ["barrel", { facing: "up", open: "false" }],
  }, [
    ["b"],
  ]);
  layers(g, [57, 4, 14], {
    "l": ["lantern", { hanging: "false" }],
  }, [
    ["l"],
  ]);
  layers(g, [56, 6, 14], {
    "h": ["lantern", { hanging: "true" }],
  }, [
    ["h"],
  ]);
}
