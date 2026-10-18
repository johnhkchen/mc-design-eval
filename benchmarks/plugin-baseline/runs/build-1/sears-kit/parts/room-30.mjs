// Room "P4 living room" (interior designer's part): the Foursquare front-left room. Inner air x68..71, z14..17, feet y2
// (floor layer y1), headroom to y4. The stair flight (x68, z15..17) is the joiner's and locked; the room is furnished
// around it. Focal piece: the sofa along the north (front) wall under the window pair, facing into the room. The
// doorway is on the east wall (x72, z15), so the lane runs along row z15 and nothing stands on it.
// Drawn as text with layers(): one legend, one set of rows per layer (y2 floor level, y3 table top and shelf, y4 lamp).
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  const legend = {
    s: ["oak_stairs", { facing: "north", half: "bottom", shape: "straight" }], // sofa seats, backs to the front wall
    a: ["oak_stairs", { facing: "west", half: "bottom", shape: "straight" }], // armchair, west side (back to the stair)
    b: ["oak_stairs", { facing: "east", half: "bottom", shape: "straight" }], // armchair, east side (back to the wall)
    r: "red_carpet", // runner along the lane from the doorway
    f: "oak_fence", // table pedestal
    B: ["barrel", { facing: "up", open: "false" }], // sideboard and lamp stand
    T: ["oak_slab", { type: "top", waterlogged: "false" }], // table top
    p: "potted_poppy", // shelf plant on the sideboard
    l: ["lantern", { hanging: "false", waterlogged: "false" }], // standing lamp
  };

  // y2, the floor level: sofa, runner, armchairs, table pedestal, sideboards
  layers(g, [68, 2, 14], legend, [
    " sss", //  z14: sofa under the front windows (x69..71)
    " rrr", //  z15: lane from the doorway (x72) west
    " afb", //  z16: armchair, table pedestal, armchair
    " B B", //  z17: sideboard (x69) and lamp stand (x71)
  ]);

  // y3: table top, the plant and the standing lamp, all on something solid
  layers(g, [68, 3, 14], legend, [
    "    ",
    "    ",
    "  T ",
    " p l",
  ]);

  // y4: the table lamp, standing on the table top
  layers(g, [68, 4, 14], legend, [
    "    ",
    "    ",
    "  l ",
    "    ",
  ]);
}
