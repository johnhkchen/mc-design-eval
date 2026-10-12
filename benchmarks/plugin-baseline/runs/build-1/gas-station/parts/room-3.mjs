// Part "room: Restroom B" (parts/room-3.mjs): the interior furnisher's and lamplighter's design for Restroom B, inside its
// inner air [30,1,25]..[31,7,28]. Mirror of Restroom A: toilet on the north wall, basin beside it, hand dryer on the east
// wall, a waste barrel in the south-west corner. The door (29,1..2,27) enters at (30,27): that cell and the cells in
// front of each fitting stay clear. Two lanterns hang on chains from the ceiling (y8), over the basin and over the barrel.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEGEND = {
  // floor: toilet as a seat-stair against the north wall, basin on the wall, hand dryer on the east wall, waste barrel
  T: ["smooth_quartz_stairs", { facing: "north", half: "bottom" }],
  B: ["cauldron", {}],
  D: ["dispenser", { facing: "west" }],
  K: ["barrel", { facing: "up" }],
  // light: lanterns hang at y4 on chains (y5..7) from the ceiling
  L: ["lantern", { hanging: "true" }],
  C: ["iron_chain", { axis: "y" }],
};

// rows run along +x (x 30, 31), successive rows along +z (z 25..28); '.' is left as it is (air)
export function build(g) {
  // y1 floor: toilet (30,25), basin (31,25), hand dryer (31,27), waste barrel (30,28); (30,27) stays clear at the door
  layers(g, [30, 1, 25], LEGEND, [["TB", "..", ".D", "K."]]);
  // y4 lanterns over the basin and over the barrel
  layers(g, [30, 4, 25], LEGEND, [[".L", "..", "..", "L."]]);
  // y5..7 chains from the ceiling up to each lantern
  layers(g, [30, 5, 25], LEGEND, [
    [".C", "..", "..", "C."],
    [".C", "..", "..", "C."],
    [".C", "..", "..", "C."],
  ]);
}
