// Room "P4 dining room" (interior designer's part): a 4 x 2 room (x 68..71, z 19..20, feet y 2). Focal piece: the oak
// table at (69,19) with two stair chairs (west and east of it on the front row, one south of it), a barrel sideboard
// with a potted poppy in the south-west corner, and one hanging lantern over the table. The doorway cell (71,2..3,19)
// and the lane beside it stay clear.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  const legend = {
    W: ["oak_stairs", { facing: "west", half: "bottom", shape: "straight" }], // chair, back to the west wall
    E: ["oak_stairs", { facing: "east", half: "bottom", shape: "straight" }], // chair, back to the east
    S: ["oak_stairs", { facing: "south", half: "bottom", shape: "straight" }], // chair, back to the south wall
    T: "oak_fence", // table leg
    P: "oak_pressure_plate", // table top
    B: ["barrel", { facing: "up", open: "false" }], // sideboard
    F: "potted_poppy", // on the sideboard top
    L: ["lantern", { hanging: "true" }], // over the table, hung from the ceiling at y5
  };
  layers(g, [68, 2, 19], legend, [
    ["WTE.", "BS.."], // y2: feet level (chairs, table leg, barrel, south chair)
    [".P..", "F..."], // y3: table top plate, the pot on the barrel
    [".L..", "...."], // y4: hanging lantern
  ]);
}
