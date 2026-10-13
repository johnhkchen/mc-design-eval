// room: A ground (interior designer + lamplighter). Brick end house ground floor, inner air x4..10, y3..6, z13..23.
// Front parlour: a table with four chairs under a hanging lantern. West wall: a dresser and a kitchen worktop with
// flower pots. Back-east hearth (x=10 z18..19, the chimney part's): two chairs face it. Kitchen table at z21.
// The stair well (x9..10 z20..23) is left empty for the stair joiner. The furniture is drawn as text on the grid:
// origin [4, y, 13], one row per z (13..23), one character per x (4..10). Lanterns hang from the floor at y=7.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ORIGIN = [4, 3, 13];

export function build(g) {
  // Feet level (y=3): chairs (stairs facing the back side), table legs, worktop and dresser.
  layers(g, ORIGIN, {
    "N": ["spruce_stairs", { facing: "north", half: "bottom" }],
    "S": ["spruce_stairs", { facing: "south", half: "bottom" }],
    "W": ["spruce_stairs", { facing: "west", half: "bottom" }],
    "E": ["spruce_stairs", { facing: "east", half: "bottom" }],
    "F": ["spruce_fence", {}],
    "P": ["spruce_planks", {}],
  }, [
    "       ",   // z13: the lane from the front door and the bay opening stay clear
    "   N   ",   // z14: parlour chair (back north)
    "  WFE  ",   // z15: west and east chairs, table leg
    "   S   ",   // z16: south chair
    "P      ",   // z17: dresser on the west wall
    "P    W ",   // z18: chair facing the hearth at x=10
    "P    W ",   // z19: chair facing the hearth at x=10
    "P      ",   // z20: dresser
    "  WFE  ",   // z21: kitchen table with chairs
    "P      ",   // z22: worktop
    "       ",   // z23: back door lane
  ]);

  // Table tops and the dresser pots (y=4).
  layers(g, [4, 4, 13], {
    "T": ["spruce_slab", { type: "bottom" }],
    "p": "potted_poppy",
    "c": "potted_cornflower",
    "f": "flower_pot",
  }, [
    "       ",
    "       ",
    "   T   ",   // z15: parlour table top
    "       ",
    "p      ",   // z17
    "       ",
    "       ",
    "c      ",   // z20
    "   T   ",   // z21: kitchen table top
    "f      ",   // z22
    "       ",
  ]);

  // Hanging lanterns (y=6) under the ceiling at y=7: over both tables, the hearth and the lane centre.
  layers(g, [4, 6, 13], {
    "L": ["lantern", { hanging: "true" }],
  }, [
    "    L  ",   // z13: bay side
    "       ",
    "   L   ",   // z15: over the parlour table
    "       ",
    "     L ",   // z17: over the hearth corner
    "  L    ",   // z18: lane light
    "       ",
    "       ",
    "   L   ",   // z21: over the kitchen table
    "    L  ",   // z22: over the stair-well mouth, lights the back-east corner
    "L      ",   // z23: back corner, away from the back door cell
  ]);
}
