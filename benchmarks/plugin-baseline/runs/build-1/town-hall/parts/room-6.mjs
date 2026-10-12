// Part: room: Mayor's office (parts/room-6.mjs). Interior of box [31,4,11,35,9,25].
// The shell's built doorway is x30 z16 (plan.md says z20); both inside cells x31 z16 and x31 z20 are kept clear.
// Focal piece: the mayor's desk (x33 z15..18) with its chair at x34 z16 facing the door, the fireplace behind it on the
// east wall. Bookcases on the north wall and the west end, a lectern in the north-east corner, a visitor chair in front
// of the desk, a red rug across the room's middle, barrels in the south-west corner, and hanging lanterns down the
// centre line. The firebox (x34 z17..18, y4..5) stays clear.
import { layers, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // Floor (y4) and desk top (y5): the desk is a fence post per cell with a slab on top.
  layers(
    g,
    [31, 4, 11],
    {
      B: "bookshelf",
      F: "dark_oak_fence",
      S: ["dark_oak_slab", { type: "bottom" }],
      M: ["dark_oak_stairs", { facing: "east", half: "bottom" }],
      V: ["dark_oak_stairs", { facing: "west", half: "bottom" }],
      L: ["lectern", { facing: "west" }],
      l: ["lantern", { hanging: "false" }],
      R: "red_carpet",
      K: "barrel",
      P: "flower_pot",
    },
    [
      // y4: floor furniture
      [
        "BBBBB", // z11 north bookcases
        "Bl...", // z12 standing lantern by the bookcase
        "B...L", // z13 lectern in the north-east corner
        ".....", // z14 the lane across the north of the room
        "..F..", // z15 desk
        ".VFM.", // z16 visitor chair, desk, mayor's chair (back to the fireplace)
        "..F..", // z17
        "..F..", // z18
        ".....", // z19
        ".....", // z20 the second doorway's first cell stays clear
        ".RRR.", // z21 rug
        "lRRR.", // z22 standing lantern by the west wall, lights the south-east corner
        ".RRR.", // z23
        "KK..P", // z24 barrels and a plant in the south-west, south-east
        "K....", // z25
      ],
      // y5: desk top and the upper bookcase
      [
        "BBBBB",
        "B....",
        "B....",
        ".....",
        "..S..",
        "..S..",
        "..S..",
        "..S..",
        ".....",
        ".....",
        ".....",
        ".....",
        ".....",
        ".....",
        ".....",
      ],
    ],
  );

  // Hanging lanterns from the upper floor's underside (y10), down the room's centre line.
  layers(
    g,
    [31, 9, 11],
    { l: ["lantern", { hanging: "true" }] },
    [
      [
        ".....",
        ".....",
        ".....",
        "..l..", // z14, over the lane by the desk
        ".....",
        ".....",
        ".....",
        ".....",
        ".....",
        ".....",
        "..l..", // z21, over the rug
        ".....",
        ".....",
        ".....",
        ".....",
      ],
    ],
  );

  // The town's flag: a standing blue banner on the floor beside the fireplace.
  g.set(35, 4, 15, ...B.banner("blue", [], { wall: false, rotation: 4 }));
}
