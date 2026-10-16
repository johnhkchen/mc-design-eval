// P2 stair hall: box x32..33, y3..6, z10..12 (2 x 3 cells). The flight x33 z15->11 is built by the stair joiner, its
// stringers hang into the east column (33,6,11), (33,5,12). The door (31,3..4,11) and the opening (32,3,13) feed the
// lane x32 z11..12, which stays clear. The east column holds a barrel dresser, a coat post and the stair-foot lamp.
// Lights: a hanging lantern from the ceiling at (32,6,10), a hanging one from the stringer at (33,5,11), and a standing
// lantern on the newel post at (33,3,12) (its foot is the fence at (33,3,12)).
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// The room, layer by layer from y3 (rows run along +x: x32 then x33; successive rows along +z: z10, z11, z12).
const LEGEND = {
  b: ["barrel", { facing: "up" }],
  f: "spruce_fence",
  p: "flower_pot",
  S: ["lantern", { hanging: "false" }],
  H: ["lantern", { hanging: "true" }],
};

export function build(g) {
  layers(g, [32, 3, 10], LEGEND, [
    [" b", " f", " f"], // y3: barrel dresser, coat post, stair-foot newel
    [" p", "  ", " S"], // y4: flower pot on the barrel, standing lantern on the newel
    ["  ", " H", "  "], // y5: hanging lantern under the stringer at (33,6,11)
    ["H ", "  ", "  "], // y6: hanging lantern from the ceiling at (32,7,10)
  ]);
}
