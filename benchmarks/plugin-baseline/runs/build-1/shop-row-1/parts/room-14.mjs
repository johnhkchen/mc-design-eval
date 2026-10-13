// Part "room: flat 2E back room" (parts/room-14.mjs): the bedroom and kitchen at the back of flat 2E. Inner air x 13..20,
// y 19..22, z 6..10; the flat door is at (16,19..20,5) and the way through to the front room is the 1x2 opening (15,19..20,11).
// Lanes: x 15..16 stay clear from the door to the opening, and the first cell inside each doorway ((16,6) and (15,10)) is clear.
// West: a wardrobe on the party wall, a table and chair. East: a kitchen counter with the hearth (lit campfire) on the
// east wall. Two standing lanterns light the room. No bed: palette.json has no bed block (see plan.md Notes).
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // Rows run along +x (x 13..20), successive rows along +z (z 6..10); successive layers run up y (y 19..21).
  const legend = {
    W: "dark_oak_planks",                                  // wardrobe, counter base
    T: ["dark_oak_slab", { type: "bottom" }],               // table top, counter worktop
    F: "dark_oak_fence",                                   // table leg
    S: ["dark_oak_stairs", { facing: "east", half: "bottom" }], // chair, back to the east
    L: ["lantern", { hanging: "false" }],                  // standing lanterns on the floor
    H: "smooth_stone",                                     // hearth plinth
    A: ["campfire", { lit: "true", signal_fire: "false" }], // the hearth fire, the focal piece
  };
  layers(g, [13, 19, 6], legend, [
    [ // y 19: floor level
      "WL   L W",
      "W      W",
      "       W",
      "FS     H",
      "       A",
    ],
    [ // y 20: table top, counter worktop
      "W      T",
      "W      T",
      "       T",
      "T       ",
      "        ",
    ],
    [ // y 21: wardrobe top
      "W       ",
      "W       ",
      "        ",
      "        ",
      "        ",
    ],
  ]);
}
