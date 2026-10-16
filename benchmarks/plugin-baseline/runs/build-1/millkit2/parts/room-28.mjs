// Part: room: Bungalow porch. Interior furnisher and lamplighter for the deep porch (inner air x 85..94, y 3..5, z 7..9).
// Focal piece: the swing bench on the front bay, hung from the porch beam; rockers face the lane; two standing lanterns
// on fence posts at the corners and a lamp on a barrel light the porch. Front posts (x 85, 88, 91, 94 at z 7), the
// steps (x 88..91 z 6) and the body door (x 89 z 10) stay as they are: x 89 z 7..9 is the clear lane from the steps to the door.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Rows run along +x from x 85, successive rows along +z from z 7. Layer 0 is y 3 (floor), then y 4, then y 5.
const LEGEND = {
  R: ["spruce_stairs", { facing: "north", half: "bottom", shape: "straight" }], // rocker: seat faces the lane
  F: "spruce_fence", // lamp post at the corners
  B: ["barrel", { facing: "up" }], // side table
  L: ["lantern", { hanging: "false" }], // standing lantern
  S: ["spruce_slab", { type: "top" }], // swing seat
  C: ["iron_chain", { axis: "y" }], // swing chains from the beam at y 6
};

const LAYERS = [
  // y 3: floor
  [
    "          ", // z 7 (front row: posts and the entry lane stay clear)
    "FR      RF", // z 8: corner lamp posts, rockers at x 86 and x 93
    "       B  ", // z 9: barrel side table at x 92
  ],
  // y 4: seat, lamps
  [
    " SS       ", // z 7: swing seat at x 86..87
    "L        L", // z 8: standing lanterns on the corner posts
    "       L  ", // z 9: lamp on the barrel
  ],
  // y 5: swing chains
  [
    "  C       ", // z 7: one chain hangs from the beam at x 87 (x 86 is the porch lantern)
    "          ",
    "          ",
  ],
];

export function build(g) {
  layers(g, [85, 3, 7], LEGEND, LAYERS);
}
