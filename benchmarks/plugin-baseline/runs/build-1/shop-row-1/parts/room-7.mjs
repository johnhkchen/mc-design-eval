// Part "room: flat 1W front room" (parts/room-7.mjs): the sitting room of flat 1W, inside [4,14,12, 11,17,18].
// Focal piece: the oriel window seat (oak stairs facing the room) where the doorway at (7,11) looks down the lane x 7.
// Supporting: a sofa on the west wall, a small table with a standing lantern, one chair, a two-high cupboard with
// flower pots on the north wall beside the doorway, and two hanging lanterns. The lane x 7 z 12..17 stays clear.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const legend = {
  "B": ["dark_oak_planks", {}],                                   // cupboard
  "p": ["flower_pot", {}],                                       // pot on the cupboard
  "S": ["oak_stairs", { facing: "west", half: "bottom" }],       // sofa, seats face east
  "W": ["oak_stairs", { facing: "south", half: "bottom" }],      // oriel window seat, seats face north
  "c": ["dark_oak_stairs", { facing: "east", half: "bottom" }],  // chair, seat faces west to the table
  "F": ["dark_oak_fence", {}],                                   // table leg
  "T": ["dark_oak_slab", { type: "top" }],                       // table top
  "L": ["lantern", { hanging: "false" }],                        // standing lantern on the table
  "Q": ["lantern", { hanging: "false" }],                        // standing lantern on the floor by the cupboard
  "H": ["lantern", { hanging: "true" }],                         // hanging lantern under the ceiling
};

// x 4..11 across, z 12..18 down; one layer per y (14 floor, 15, 16, 17 under the ceiling at 18).
const rows = [
  // y 14: floor level
  [
    "BB.....B",
    "Q.......",
    "S.......",
    "S....Fc.",
    "S.......",
    "........",
    "...WWW..",
  ],
  // y 15: pots on the cupboards, table top
  [
    "p......p",
    "........",
    "........",
    ".....T..",
    "........",
    "........",
    "........",
  ],
  // y 16: standing lantern on the table
  [
    "........",
    "........",
    "........",
    ".....L..",
    "........",
    "........",
    "........",
  ],
  // y 17: hanging lanterns
  [
    "........",
    "..H.....",
    "........",
    "........",
    "........",
    "......H.",
    "........",
  ],
];

export function build(g) {
  layers(g, [4, 14, 12], legend, rows);
}
