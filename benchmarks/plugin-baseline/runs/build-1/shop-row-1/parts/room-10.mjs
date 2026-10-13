// Part "room: flat 1E back room" (parts/room-10.mjs): the bedroom and kitchen of flat 1E, inside [13,14,5,20,17,10].
// Entered from the corridor door at (16, 14..15, 5); the doorway to the front room is at (15, 14..15, 11).
// Lanes kept clear: x 15..16 from z 6 to z 10 (door to doorway), and (16,14,6) at the door's first cell.
// Kitchen: L-shaped counter on the north-east (x 18..20 z 6, x 20 z 7..9) with a lit campfire hearth at the corner
// (20,14,6), a shelf of flower pots above the east run. Table with two chairs on the west wall (x 13). No bed: palette.json
// has no bed block (see Notes in plan.md). Lanterns hang from the second-floor floor block at y 18.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  const legend = {
    K: "dark_oak_planks",                                  // counter base
    S: ["dark_oak_slab", { type: "bottom" }],              // counter top, shelf, table top
    F: "dark_oak_fence",                                   // table leg
    R: ["dark_oak_stairs", { facing: "south", half: "bottom" }],  // chair, faces the table to its south
    r: ["dark_oak_stairs", { facing: "north", half: "bottom" }],  // chair, faces the table to its north
    H: ["campfire", { lit: "true", signal_fire: "false" }],       // kitchen hearth
    L: ["lantern", { hanging: "true" }],                   // hangs from the floor block at y 18
    P: "flower_pot",                                       // on the shelf
  };
  // origin [13,14,6]: rows along +x (x 13..20), successive rows along +z (z 6..10); one layer per y (14..17)
  layers(g, [13, 14, 6], legend, [
    [ // y 14: furniture bases
      ".....KKH",
      "R......K",
      "F......K",
      "r......K",
      "........",
    ],
    [ // y 15: table top, counter tops
      ".....SS.",
      ".......S",
      "S......S",
      ".......S",
      "........",
    ],
    [ // y 16: shelf
      "........",
      ".......S",
      ".......S",
      ".......S",
      "........",
    ],
    [ // y 17: pots and hanging lanterns
      "........",
      ".......P",
      ".L...L..",
      ".......P",
      "........",
    ],
  ]);
}
