// P1 east cabinet: rear cabinet with one bed, head on the back wall (z17). Inner air x19..21, y3..6, z15..16.
// Doorways: (20,3..4,14) from the east chamber and (18,3..4,15) to the west cabinet; both lanes (19,15) and (20,15) stay clear.
import { bed_set, hanging_lantern } from "../vocab.mjs";
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // Bed: foot (21,3,15), head (21,3,16) against the back wall z17, facing south.
  bed_set(g, [21, 3, 15], "south", "pink");

  // Dresser: a barrel against the west wall, with a standing lantern on its top face (the cabinet's light).
  layers(g, [19, 3, 16], { "B": ["barrel", { facing: "up" }], "L": ["lantern", { hanging: "false" }] }, [
    ["B"],
    ["L"],
  ]);

  // Hanging lantern from the ceiling over the middle of the cabinet (chain up to the first solid block if any).
  hanging_lantern(g, 20, 6, 16);
}
