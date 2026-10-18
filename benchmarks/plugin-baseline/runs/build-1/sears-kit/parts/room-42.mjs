// Room "P5 dining nook" (interior designer's part). Inner air x90..91, z15..17, feet y2. The west cased opening (x89,
// z15..16) and the passage south (x90, z18) are the ways in; the column x90 stays clear from z15 to z17 as the lane
// between them. Furniture sits in the east column x91: a spruce fence table with a pressure-plate top at (91,2..3,16),
// a stair chair at each end of it (north facing the table, south with its back to the passage wall), and a hanging
// lantern over the table as the light and the focal point.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  const legend = {
    C: ["spruce_stairs", { facing: "north", half: "bottom", shape: "straight" }],
    S: ["spruce_stairs", { facing: "south", half: "bottom", shape: "straight" }],
    F: "spruce_fence",
    P: "spruce_pressure_plate",
    L: ["lantern", { hanging: "true" }],
  };
  // rows run along +x (x90, x91: one character each), successive rows along +z (z15, z16, z17)
  layers(g, [90, 2, 15], legend, [
    [" C", " F", " S"], // y2: feet level, chairs at the table's north and south ends
    ["  ", " P", "  "], // y3: table top
    ["  ", " L", "  "], // y4: lantern hanging from the ceiling block at y5
  ]);
}
